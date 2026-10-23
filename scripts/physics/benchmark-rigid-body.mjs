// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {parseArgs} from 'node:util';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import {chromium} from 'playwright';
import {getPlaywrightLaunchOptions} from '../playwright/get-playwright-launch-options.mjs';

/** Isolated full-step measurement; the example renderer never starts on this page. */
export async function benchmarkRigidBody(options = {}) {
  const baseUrl = new URL(options.url || 'http://127.0.0.1:5198/');
  const settings = {
    fixture: options.fixture ?? 'deep', broadPhase: options.broadPhase ?? 'hierarchical-grid', failurePolicy: options.failurePolicy ?? 'report', solver: options.solver ?? 'parallel',
    iterations: Number(options.iterations ?? 32), samples: Number(options.samples ?? 30),
    warmup: Number(options.warmup ?? 120), timeStep: Number(options.timeStep ?? 1 / 120),
    warmStartFactor: Number(options.warmStartFactor ?? 1),
    maximumPairs: options.maximumPairs === undefined ? undefined : Number(options.maximumPairs)
  };
  if (!['localhost', '127.0.0.1', '[::1]'].includes(baseUrl.hostname) ||
      !['stack', 'deep', 'massRatio', 'support', 'friction', 'mesh', 'mixed', 'impact', 'torque', 'cradle', 'pendulum', 'hinge', 'slider'].includes(settings.fixture) ||
      (['cradle', 'pendulum', 'hinge', 'slider'].includes(settings.fixture) && settings.solver !== 'ordered') ||
      !['ordered', 'parallel'].includes(settings.solver) ||
      !['all-pairs', 'hierarchical-grid'].includes(settings.broadPhase) ||
      !['report', 'rollback'].includes(settings.failurePolicy) ||
      !Number.isInteger(settings.iterations) || settings.iterations < 1 || settings.iterations > 64 ||
      !Number.isInteger(settings.samples) || settings.samples < 1 || settings.samples > 1000 ||
      !Number.isInteger(settings.warmup) || settings.warmup < 0 || settings.warmup > 10000 ||
      !Number.isFinite(settings.timeStep) || settings.timeStep <= 0 || settings.timeStep > 1 ||
      !Number.isFinite(settings.warmStartFactor) || settings.warmStartFactor < 0 || settings.warmStartFactor > 1 ||
      (settings.maximumPairs !== undefined && (!Number.isInteger(settings.maximumPairs) || settings.maximumPairs < 1 || settings.maximumPairs > 2 ** 20 || (settings.maximumPairs & (settings.maximumPairs - 1)) !== 0))) {
    throw new Error('Invalid rigid-body benchmark configuration');
  }
  const browser = await chromium.launch(getPlaywrightLaunchOptions({headless: true, backend: 'webgpu-core', softwareGpu: Boolean(options.softwareGpu)}));
  try {
    const context = await browser.newContext();
    await context.route('**/main.ts*', route => route.fulfill({contentType: 'text/javascript', body: ''}));
    const page = await context.newPage();
    await page.goto(baseUrl.href);
    const report = await page.evaluate(runBenchmark, {root: `/@fs${path.resolve(options.cwd || process.cwd())}`, ...settings});
    return {...report, browserVersion: browser.version(), nodeVersion: process.versions.node, softwareGpuRequested: Boolean(options.softwareGpu)};
  } finally {await browser.close();}
}

async function runBenchmark(options) {
  const {root, fixture, solver, broadPhase, failurePolicy, samples, warmup, iterations, timeStep, warmStartFactor, maximumPairs} = options;
  const [{luma}, {webgpuAdapter}, {GPUCommandGraph}, {GPUCommandGraphInspector}, {GPURigidBodyWorld}, {makeRigidBodyScene, getRigidBodySceneGravity}, {makeMechanism}] = await Promise.all([
    import(`${root}/modules/core/src/index.ts`), import(`${root}/modules/core/src/webgpu/index.ts`),
    import(`${root}/modules/gpu-graph/src/gpu-core/gpu-command-graph.ts`),
    import(`${root}/modules/gpu-graph/src/gpu-core/gpu-command-graph-inspector.ts`),
    import(`${root}/modules/gpu-graph/src/gpu-physics/gpu-rigid-body-world.ts`),
    import(`${root}/examples/experimental/gpu-rigid-body-world/scenes.ts`),
    import(`${root}/examples/experimental/gpu-rigid-body-world/mechanisms.ts`)
  ]);
  const device = await luma.createDevice({type: 'webgpu', featureLevel: 'core', optionalFeatures: ['timestamp-query'], adapters: [webgpuAdapter]});
  const mechanism = makeMechanism(fixture);
  const bodies = mechanism?.bodies ?? makeRigidBodyScene(fixture);
  const world = new GPURigidBodyWorld({bodies, joints: mechanism?.joints, solver, iterations, timeStep, warmStartFactor, maximumPairs, broadPhase, failurePolicy, ...(fixture === 'cradle' ? {restitutionThreshold: 0} : {}), gravity: getRigidBodySceneGravity(fixture)});
  let graph;
  try {
    const definition = new GPUCommandGraph(device);
    world.addToGraph(definition);
    const compileStart = performance.now();
    graph = await definition.compileAsync();
    const compileMilliseconds = performance.now() - compileStart;
    const inspector = new GPUCommandGraphInspector();inspector.registerGraph(graph);
    const timings = [];
    let diagnostics;
    for (let step = -warmup; step < samples; step++) {
      const query = step >= 0 && device.features.has('timestamp-query') ? device.createQuerySet({type: 'timestamp', count: graph.stats.nodeOrder.length * 2}) : null;
      try {
        const start = performance.now();const encoder = device.createCommandEncoder();
        const encoding = query ? encoder.withTimeProfilingQuerySet(query, () => graph.encode(encoder, {parameters: undefined})) : graph.encode(encoder, {parameters: undefined});
        const encodingEnd = performance.now();device.submit(encoder.finish());
        diagnostics = await world.readSimulationDiagnostics();
        const completed = performance.now();
        const timing = query ? await inspector.recordGPUTimings(graph.id, encoding) : null;
        if (step >= 0) timings.push({cpuEncode: encodingEnd - start, completionWithDiagnostics: completed - start,
          gpuWork: timing?.gpuTimeMilliseconds ?? null,
          gpuSpan: timing?.gpuEndTimeMilliseconds !== undefined && timing?.gpuStartTimeMilliseconds !== undefined ? timing.gpuEndTimeMilliseconds - timing.gpuStartTimeMilliseconds : null});
      } finally {query?.destroy();}
    }
    const states = await world.readState();
    const finite = states.every(state => [...state.position, ...state.orientation, ...state.velocity, ...state.angularVelocity].every(Number.isFinite));
    const summarize = key => {
      const values = timings.map(sample => sample[key]).filter(value => value !== null).sort((first, second) => first - second);
      return values.length ? {median: values[Math.floor(values.length * 0.5)], p95: values[Math.min(values.length - 1, Math.floor(values.length * 0.95))], maximum: values.at(-1)} : null;
    };
    return {formatVersion: 1, stage: 'full-rigid-body-step', fixture, objectCount: bodies.length,
      settings: {solver, jointCount: mechanism?.joints.length ?? 0, failurePolicy, broadPhase, iterations, timeStep, warmStartFactor, maximumPairs: world.maximumPairs},
      sampleCount: samples, warmupCount: warmup, adapter: device.info,
      timestampQueries: device.features.has('timestamp-query'), compileMilliseconds,
      graphNodes: graph.stats.nodeOrder.length, capacity: world.getCapacityInfo(),
      graphBufferBytes: graph.stats.importedBufferBytes + graph.stats.physicalTransientBytes,
      maximumPendingSteps: 1,
      perStepMilliseconds: Object.fromEntries(['cpuEncode', 'completionWithDiagnostics', 'gpuWork', 'gpuSpan'].map(key => [key, summarize(key)])),
      diagnostics, finiteState: finite, executionComplete: finite && diagnostics.complete && diagnostics.steps === warmup + samples,
      finalState: states,
      notes: ['One complete physics step per sample, including discovery, contacts, solving, integration and diagnostics; no rendering.',
        'Warm-up advances the scene. State at measurement time, sleeping and contact density affect cost.',
        'Completion includes a 64-byte diagnostic readback. Timestamp GPU work/span excludes host readback latency.',
        'Finite state and complete execution are not an accuracy, conformance or performance-budget qualification.',
        'Memory is logical buffer capacity, not measured VRAM residency. No exclusive GPU ownership is assumed.']};
  } finally {graph?.destroy();world.destroy();device.destroy();}
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const {values} = parseArgs({options: {url: {type: 'string'}, fixture: {type: 'string'}, solver: {type: 'string'}, 'broad-phase': {type: 'string'}, 'failure-policy': {type: 'string'}, iterations: {type: 'string'}, samples: {type: 'string'}, warmup: {type: 'string'}, 'time-step': {type: 'string'}, 'warm-start-factor': {type: 'string'}, 'maximum-pairs': {type: 'string'}, software: {type: 'boolean'}}});
  benchmarkRigidBody({...values, broadPhase: values['broad-phase'], failurePolicy: values['failure-policy'], timeStep: values['time-step'], warmStartFactor: values['warm-start-factor'], maximumPairs: values['maximum-pairs'], softwareGpu: values.software}).then(report => {
    console.log(JSON.stringify(report, null, 2));if (!report.executionComplete) process.exitCode = 2;
  }).catch(error => {console.error(error);process.exitCode = 1;});
}
