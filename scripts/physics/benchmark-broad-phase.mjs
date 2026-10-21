// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {parseArgs} from 'node:util';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import {chromium} from 'playwright';
import {getPlaywrightLaunchOptions} from '../playwright/get-playwright-launch-options.mjs';

export async function benchmarkBroadPhase(options = {}) {
  const baseUrl = new URL(options.url || 'http://127.0.0.1:5197/');
  if (!['localhost', '127.0.0.1', '[::1]'].includes(baseUrl.hostname)) {
    throw new Error('Use the local glTF physics Vite server');
  }
  const count = Number(options.count ?? 10_000);
  const samples = Number(options.samples ?? 20);
  const maximumPairs = Number(
    options.maximumPairs ?? 2 ** Math.ceil(Math.log2(Math.max(64, count * 16)))
  );
  const candidateTests = Number(options.candidateTests ?? 256);
  const fixture = options.fixture ?? 'mixed';
  if (
    !Number.isInteger(count) ||
    count < 1 ||
    count > 65535 ||
    !Number.isInteger(samples) ||
    samples < 1 ||
    samples > 1000 ||
    !Number.isInteger(maximumPairs) ||
    maximumPairs < 1 ||
    maximumPairs > 2 ** 22 ||
    !Number.isInteger(candidateTests) ||
    candidateTests < 1 ||
    candidateTests > 65535 ||
    !['mixed', 'sparse', 'dense'].includes(fixture)
  ) {
    throw new Error('Invalid physics benchmark configuration');
  }
  const browser = await chromium.launch(
    getPlaywrightLaunchOptions({
      headless: true,
      backend: 'webgpu-core',
      softwareGpu: Boolean(options.softwareGpu)
    })
  );
  try {
    const context = await browser.newContext();
    // This benchmark owns a blank page; suppress the example renderer and its simulation.
    await context.route('**/main.ts*', route =>
      route.fulfill({contentType: 'text/javascript', body: ''})
    );
    const page = await context.newPage();
    await page.goto(baseUrl.href);
    const root = `/@fs${path.resolve(options.cwd || process.cwd())}`;
    const result = await page.evaluate(runBroadPhaseBenchmark, {
      root,
      count,
      samples,
      maximumPairs,
      candidateTests,
      fixture
    });
    return {
      ...result,
      browserVersion: browser.version(),
      nodeVersion: process.versions.node,
      softwareGpuRequested: Boolean(options.softwareGpu)
    };
  } finally {
    await browser.close();
  }
}

async function runBroadPhaseBenchmark(options) {
  const {root, count, samples, maximumPairs, candidateTests, fixture} = options;
  const [
    {luma, Buffer},
    {webgpuAdapter},
    {GPUCommandGraph},
    {addGPUCommandNodes},
    {GPUCommandGraphInspector},
    {GPURigidBodyBroadPhase, decodeRigidBodyBroadPhaseDiagnostics}
  ] = await Promise.all([
    import(`${root}/modules/core/src/index.ts`),
    import(`${root}/modules/core/src/webgpu/index.ts`),
    import(`${root}/modules/gpgpu/src/gpu-core/gpu-command-graph.ts`),
    import(`${root}/modules/gpgpu/src/gpu-core/gpu-command-node.ts`),
    import(`${root}/modules/gpgpu/src/gpu-core/gpu-command-graph-inspector.ts`),
    import(`${root}/modules/gpgpu/src/gpu-physics/rigid-body-broad-phase.ts`)
  ]);
  const device = await luma.createDevice({
    type: 'webgpu',
    featureLevel: 'core',
    optionalFeatures: ['timestamp-query'],
    adapters: [webgpuAdapter]
  });
  const owned = [];
  let compiled;
  try {
    const minima = new Float32Array(count * 3),
      maxima = new Float32Array(count * 3),
      attributes = new Uint32Array(count);
    const width = Math.ceil(Math.sqrt(count));
    for (let index = 0; index < count; index++) {
      attributes[index] = index | 0x10000;
      if (fixture === 'mixed' && index === count - 1) {
        minima.set([-width * 3, -0.5, -width * 3], index * 3);
        maxima.set([width * 3, 0.5, width * 3], index * 3);
        attributes[index] = index;
      } else {
        const centerX = fixture === 'dense' ? 0 : (index % width) * 3 - width * 1.5;
        const centerZ = fixture === 'dense' ? 0 : Math.floor(index / width) * 3 - width * 1.5;
        minima.set([centerX - 0.25, 0.15, centerZ - 0.25], index * 3);
        maxima.set([centerX + 0.25, 0.65, centerZ + 0.25], index * 3);
      }
    }
    const graph = new GPUCommandGraph(device);
    const view = (id, format, length, data) => {
      const buffer = device.createBuffer({
        id,
        ...(typeof data === 'number' ? {byteLength: data} : {data}),
        usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST
      });
      owned.push(buffer);
      return {
        buffer,
        view: graph.createDataView(
          graph.importBuffer({id, byteLength: buffer.byteLength, usage: Buffer.STORAGE}, buffer),
          {format, length}
        )
      };
    };
    const minimumView = view('minima', 'float32x3', count, minima);
    const maximumView = view('maxima', 'float32x3', count, maxima);
    const attributeView = view('attributes', 'uint32', count, attributes);
    const pairs = view('pairs', 'uint32x2', maximumPairs, maximumPairs * 8);
    const diagnostics = view('diagnostics', 'uint32', 8, 32);
    const operation = new GPURigidBodyBroadPhase({
      minima: minimumView.view,
      maxima: maximumView.view,
      objectMetadata: attributeView.view,
      pairs: pairs.view,
      diagnostics: diagnostics.view,
      maximumCandidateTestsPerQuery: candidateTests
    });
    addGPUCommandNodes(graph, operation.getCommandNodes(graph));
    const compileStart = performance.now();
    compiled = await graph.compileAsync();
    const compileMilliseconds = performance.now() - compileStart;
    const inspector = new GPUCommandGraphInspector();
    inspector.registerGraph(compiled);
    const timings = [];
    let counters;
    for (let sample = -3; sample < samples; sample++) {
      const query =
        sample >= 0 && device.features.has('timestamp-query')
          ? device.createQuerySet({type: 'timestamp', count: compiled.stats.nodeOrder.length * 2})
          : null;
      try {
        const start = performance.now(),
          encoder = device.createCommandEncoder();
        const encoding = query
          ? encoder.withTimeProfilingQuerySet(query, () =>
              compiled.encode(encoder, {parameters: undefined})
            )
          : compiled.encode(encoder, {parameters: undefined});
        const cpuEnd = performance.now();
        device.submit(encoder.finish());
        counters = decodeRigidBodyBroadPhaseDiagnostics(
          new Uint32Array((await diagnostics.buffer.readAsync()).buffer)
        );
        const completed = performance.now();
        const report = query ? await inspector.recordGPUTimings(compiled.id, encoding) : null;
        if (sample >= 0)
          timings.push({
            cpuEncode: cpuEnd - start,
            completion: completed - start,
            gpuWork: report?.gpuTimeMilliseconds ?? null,
            gpuSpan:
              report?.gpuEndTimeMilliseconds !== undefined &&
              report?.gpuStartTimeMilliseconds !== undefined
                ? report.gpuEndTimeMilliseconds - report.gpuStartTimeMilliseconds
                : null
          });
      } finally {
        query?.destroy();
      }
    }
    const expectedPairCount =
      fixture === 'dense' ? (count * (count - 1)) / 2 : fixture === 'mixed' ? count - 1 : 0;
    let pairSetMatches = false;
    if (
      !counters.droppedPairs &&
      !counters.incompleteQueries &&
      counters.pairCount === expectedPairCount
    ) {
      const words = new Uint32Array(
        (await pairs.buffer.readAsync(0, Math.max(8, counters.pairCount * 8))).buffer
      );
      const seen = new Set();
      pairSetMatches = true;
      for (let pair = 0; pair < counters.pairCount; pair++) {
        const first = words[pair * 2],
          second = words[pair * 2 + 1],
          key = `${first}:${second}`;
        if (
          first >= second ||
          second >= count ||
          seen.has(key) ||
          (fixture === 'mixed' && second !== count - 1)
        )
          pairSetMatches = false;
        seen.add(key);
      }
    }
    const summarize = key => {
      const values = timings
        .map(sample => sample[key])
        .filter(value => value !== null)
        .sort((first, second) => first - second);
      return values.length
        ? {
            median: values[Math.floor(values.length * 0.5)],
            p95: values[Math.min(values.length - 1, Math.floor(values.length * 0.95))],
            maximum: values.at(-1)
          }
        : null;
    };
    return {
      formatVersion: 1,
      stage: 'broad-phase-only',
      fixture,
      objectCount: count,
      sampleCount: samples,
      warmupCount: 3,
      featureLevel: 'core',
      adapter: device.info,
      timestampQueries: device.features.has('timestamp-query'),
      limits: {
        maxStorageBuffersPerShaderStage: device.limits.maxStorageBuffersPerShaderStage,
        maxStorageBufferBindingSize: device.limits.maxStorageBufferBindingSize
      },
      budgets: {maximumPairs, maximumCandidateTestsPerQuery: candidateTests},
      graphNodes: compiled.stats.nodeOrder.length,
      allocatedBufferBytes:
        compiled.stats.importedBufferBytes + compiled.stats.physicalTransientBytes,
      compileMilliseconds,
      perStepMilliseconds: {
        cpuEncode: summarize('cpuEncode'),
        completionWithCounterReadback: summarize('completion'),
        gpuWork: summarize('gpuWork'),
        gpuSpan: summarize('gpuSpan')
      },
      diagnostics: counters,
      correctness: {expectedPairCount, pairSetMatches},
      qualified:
        pairSetMatches &&
        !counters.invalidBounds &&
        !counters.droppedPairs &&
        !counters.incompleteQueries,
      notes: [
        'Timings are per broad-phase encoding, not a multi-step batch or full physics frame.',
        'Completion includes compact counter readback; GPU work and timestamp span are separate.',
        'Memory is declared buffer capacity, not measured VRAM residency.',
        'No exclusive GPU ownership is assumed.'
      ]
    };
  } finally {
    compiled?.destroy();
    for (const buffer of owned) buffer.destroy();
    device.destroy();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const {values} = parseArgs({
    options: {
      url: {type: 'string'},
      count: {type: 'string'},
      samples: {type: 'string'},
      fixture: {type: 'string'},
      'maximum-pairs': {type: 'string'},
      'candidate-tests': {type: 'string'},
      software: {type: 'boolean'}
    }
  });
  benchmarkBroadPhase({
    url: values.url,
    count: values.count,
    samples: values.samples,
    fixture: values.fixture,
    maximumPairs: values['maximum-pairs'],
    candidateTests: values['candidate-tests'],
    softwareGpu: values.software
  })
    .then(report => {
      console.log(JSON.stringify(report, null, 2));
      if (!report.qualified) process.exitCode = 2;
    })
    .catch(error => {
      console.error(error);
      process.exitCode = 1;
    });
}
