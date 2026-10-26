// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {execFileSync} from 'node:child_process';
import {writeFileSync, readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {parseArgs} from 'node:util';
import {chromium} from 'playwright';
import {getPlaywrightLaunchOptions} from '../../playwright/get-playwright-launch-options.mjs';
import {
  makeMatchedFixture,
  makeMatchedWorld,
  MATCHED_SCENES
} from '../../../examples/experimental/physics-stress/matched-fixtures.ts';
import {buildReference} from './build-reference.mjs';
import {
  initialStates,
  measureQuality,
  summarize,
  assessQuality,
  QUALITY_BUDGETS,
  axesForQuaternion
} from './metrics.mjs';

export function validateOptions(options = {}) {
  const defaults = {
    count: 32,
    seed: 42,
    frames: 360,
    warmup: 60,
    substeps: 4,
    repeats: 3,
    stride: 6,
    workers: 1,
    iterations: 16,
    timeStep: 1 / 60,
    solver: 'ordered'
  };
  const settings = Object.fromEntries(
    Object.entries(defaults).map(([key, value]) => [key, options[key] ?? value])
  );
  for (const [key, minimum, maximum] of [
    ['count', 1, 4096],
    ['seed', 0, 0xffffffff],
    ['frames', 2, 10000],
    ['warmup', 0, 9999],
    ['substeps', 1, 16],
    ['repeats', 1, 10],
    ['stride', 1, 1000],
    ['workers', 1, 64],
    ['iterations', 1, 64]
  ]) {
    settings[key] = Number(settings[key]);
    if (!Number.isInteger(settings[key]) || settings[key] < minimum || settings[key] > maximum)
      throw new Error(`Invalid ${key}`);
  }
  settings.timeStep = Number(settings.timeStep);
  if (
    !Number.isFinite(settings.timeStep) ||
    settings.timeStep <= 0 ||
    settings.timeStep > 0.1 ||
    settings.warmup >= settings.frames ||
    !['ordered', 'parallel'].includes(settings.solver)
  )
    throw new Error('Invalid integration settings');
  return settings;
}
export function referenceInput(fixture, settings, quality) {
  return [
    fixture.bodies.length,
    fixture.joints.length,
    settings.frames,
    settings.warmup,
    settings.substeps,
    settings.workers,
    Number(quality),
    settings.stride,
    settings.timeStep,
    ...fixture.gravity,
    Number(fixture.continuous),
    ...fixture.bodies.flatMap(body => [
      ...body.position,
      ...body.orientation,
      ...body.velocity,
      ...body.angularVelocity,
      ...body.halfExtents,
      body.mass,
      body.friction,
      body.restitution
    ]),
    ...fixture.joints.flatMap(joint => [joint.first, joint.second, joint.distance])
  ].join(' ');
}
function runReference(executable, fixture, settings, quality) {
  const lines = execFileSync(executable, {
    input: referenceInput(fixture, settings, quality),
    encoding: 'utf8',
    maxBuffer: 256 * 1024 * 1024,
    timeout: 600000
  })
    .trim()
    .split('\n')
    .map(line => JSON.parse(line));
  const final = lines.at(-1);
  return {
    workers: lines[0].workers,
    doublePrecision: lines[0].doublePrecision,
    setupMilliseconds: lines[0].setupMilliseconds,
    bytesBefore: lines[0].bytesBefore,
    bytesAfter: final.bytesAfter,
    timings: final.timings,
    parameters: lines[1].parameters,
    frames: quality ? lines.slice(2, -1) : undefined
  };
}
export function checkInitialState(fixture, frames) {
  if (frames[0]?.step !== 0 || frames[0].states.length !== fixture.bodies.length) return false;
  return initialStates(fixture).every((state, index) =>
    Object.entries(state).every(([field, values]) =>
      values.every(
        (value, axis) =>
          Math.abs(frames[0].states[index][field][axis] - value) <=
          1e-5 * Math.max(1, Math.abs(value))
      )
    )
  );
}
export function checkMassProperties(fixture, parameters) {
  if (parameters?.length !== fixture.bodies.length) return false;
  const close = (first, second) =>
    Number.isFinite(first) && Math.abs(first - second) <= 1e-5 * Math.max(1e-5, Math.abs(second));
  return fixture.bodies.every((body, index) => {
    const actual = parameters[index];
    if (!close(actual.mass, body.mass)) return false;
    if (!body.mass) return true;
    if (actual.inertia?.length !== 3) return false;
    const axes = axesForQuaternion(actual.inertiaOrientation ?? [0, 0, 0, 1]);
    return [0, 1, 2].every(row =>
      [0, 1, 2].every(column => {
        const value = axes.reduce(
          (sum, axis, index) => sum + axis[row] * axis[column] * actual.inertia[index],
          0
        );
        const expected =
          row === column
            ? (body.mass / 3) *
              body.halfExtents.reduce(
                (sum, extent, axis) => sum + (axis === row ? 0 : extent ** 2),
                0
              )
            : 0;
        return close(value, expected);
      })
    );
  });
}
/** Unknown devices are not hardware evidence, even when fallback is false. */
export function isHardwareAdapter(adapter) {
  return (
    adapter?.fallback === false &&
    adapter.gpu !== 'software' &&
    ['integrated', 'discrete'].includes(adapter.gpuType)
  );
}
export async function runSuite(options = {}) {
  const settings = validateOptions(options);
  const scenes = options.scenes ?? Object.keys(MATCHED_SCENES);
  if (!scenes.length || scenes.some(scene => !Object.hasOwn(MATCHED_SCENES, scene)))
    throw new Error('Unknown scene');
  if (scenes.includes('matchedChain') && (settings.count > 64 || settings.solver !== 'ordered'))
    throw new Error('Joint comparison requires ordered solver and at most 64 links');
  const baseUrl = new URL(options.url ?? 'http://127.0.0.1:5242/');
  if (!['localhost', '127.0.0.1', '[::1]'].includes(baseUrl.hostname))
    throw new Error('Use a local Vite server');
  const reference = buildReference(options);
  let browser;
  const results = [];
  try {
    browser = await chromium.launch(
      getPlaywrightLaunchOptions({
        headless: true,
        backend: 'webgpu-core',
        softwareGpu: Boolean(options.software)
      })
    );
    const page = await browser.newPage();
    await page.route('**/main.ts*', route =>
      route.fulfill({contentType: 'text/javascript', body: ''})
    );
    await page.goto(baseUrl.href);
    const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
    for (const scene of scenes) {
      try {
        const fixture = makeMatchedFixture(scene, settings.count, settings.seed);
        const fixtureHash = createHash('sha256').update(JSON.stringify(fixture)).digest('hex');
        const native = [],
          gpu = [];
        // Alternate order across repeats. Separate worlds begin from identical inputs.
        for (let repeat = 0; repeat < settings.repeats; repeat++) {
          const runCPU = () =>
            native.push(runReference(reference.executable, fixture, settings, false));
          const runGPU = async () =>
            gpu.push(
              await page.evaluate(runGPUReplay, {
                root: `/@fs${root}`,
                props: makeMatchedWorld(
                  fixture,
                  settings.timeStep / settings.substeps,
                  settings.solver,
                  settings.iterations
                ),
                settings,
                quality: false
              })
            );
          if (repeat % 2) {
            await runGPU();
            runCPU();
          } else {
            runCPU();
            await runGPU();
          }
        }
        const profile = options.profile
          ? await page.evaluate(runGPUReplay, {
              root: `/@fs${root}`,
              props: makeMatchedWorld(
                fixture,
                settings.timeStep / settings.substeps,
                settings.solver,
                settings.iterations
              ),
              settings,
              quality: false,
              profile: true
            })
          : null;
        const nativeQuality = runReference(reference.executable, fixture, settings, true);
        const gpuQuality = await page.evaluate(runGPUReplay, {
          root: `/@fs${root}`,
          props: makeMatchedWorld(
            fixture,
            settings.timeStep / settings.substeps,
            settings.solver,
            settings.iterations
          ),
          settings,
          quality: true
        });
        const quality = {
          box3d: measureQuality(fixture, nativeQuality.frames, settings.timeStep),
          gpu: measureQuality(fixture, gpuQuality.frames, settings.timeStep)
        };
        const initializedEqually =
          checkInitialState(fixture, nativeQuality.frames) &&
          checkInitialState(fixture, gpuQuality.frames) &&
          native.every(
            run =>
              run.workers === settings.workers &&
              !run.doublePrecision &&
              checkMassProperties(fixture, run.parameters)
          ) &&
          [...gpu, gpuQuality].every(run => checkMassProperties(fixture, run.parameters));
        const executionComplete =
          initializedEqually &&
          quality.box3d.valid &&
          quality.gpu.valid &&
          [...gpu, gpuQuality, ...(profile ? [profile] : [])].every(
            run =>
              run.diagnostics.complete &&
              run.diagnostics.steps === settings.frames * settings.substeps
          );
        const qualityAssessment = {
          box3d: assessQuality(quality.box3d),
          gpu: assessQuality(quality.gpu)
        };
        const qualityMatched = qualityAssessment.box3d.passed && qualityAssessment.gpu.passed;
        const nativeTiming = summarize(native.flatMap(run => run.timings));
        const gpuTiming = summarize(
          gpu.flatMap(run => run.timings.map(sample => sample.completion))
        );
        const hardware = [...gpu, gpuQuality, ...(profile ? [profile] : [])].every(run =>
          isHardwareAdapter(run.adapter)
        );
        const row = {
          scene,
          fixtureHash,
          fixture,
          settings,
          initializedEqually,
          executionComplete,
          qualityMatched,
          qualityAssessment,
          qualityBudgets: QUALITY_BUDGETS,
          hardwareComparison: hardware && !options.software,
          performance: {
            box3dNativeMilliseconds: nativeTiming,
            gpuCompletionMilliseconds: gpuTiming,
            gpuEncodeMilliseconds: summarize(
              gpu.flatMap(run => run.timings.map(sample => sample.encode))
            ),
            gpuTimestampMilliseconds: summarize(
              (profile?.timings ?? []).map(sample => sample.gpu).filter(value => value !== null)
            ),
            gpuToNativeCompletionRatio:
              executionComplete && qualityMatched && hardware && !options.software
                ? gpuTiming.p95 / nativeTiming.p95
                : null
          },
          quality,
          nativeRuns: native,
          gpuRuns: gpu,
          gpuTimestampRun: profile,
          qualityDiagnostics: gpuQuality.diagnostics,
          // Sampled trajectories support replay/debugging; not interpreted as an exact oracle.
          trajectories: {box3d: nativeQuality.frames, gpu: gpuQuality.frames}
        };
        results.push(row);
        console.error(
          `${scene}: complete=${executionComplete}, CPU p95=${nativeTiming?.p95.toFixed(3)} ms, GPU completion p95=${gpuTiming?.p95.toFixed(3)} ms, penetration CPU/GPU=${quality.box3d.maximumPenetration}/${quality.gpu.maximumPenetration}`
        );
      } catch (error) {
        results.push({scene, settings, executionComplete: false, error: String(error)});
        console.error(`${scene}: ${error}`);
      }
    }
    return {
      formatVersion: 1,
      sourceHashes: Object.fromEntries(
        [
          'scripts/physics/matched/run.mjs',
          'scripts/physics/matched/reference.c',
          'scripts/physics/matched/build-reference.mjs',
          'scripts/physics/matched/CMakeLists.txt',
          'scripts/physics/matched/metrics.mjs',
          'examples/experimental/physics-stress/matched-fixtures.ts'
        ].map(file => [
          file,
          createHash('sha256')
            .update(readFileSync(path.join(root, file)))
            .digest('hex')
        ])
      ),
      createdAt: new Date().toISOString(),
      gitRevision: execFileSync('git', ['rev-parse', 'HEAD'], {cwd: root, encoding: 'utf8'}).trim(),
      gitDirty: Boolean(
        execFileSync('git', ['status', '--porcelain'], {cwd: root, encoding: 'utf8'}).trim()
      ),
      host: {
        platform: os.platform(),
        architecture: os.arch(),
        cpu: os.cpus()[0]?.model,
        logicalCPUs: os.cpus().length,
        totalMemory: os.totalmem()
      },
      browser: browser.version(),
      reference: reference.metadata,
      results,
      notes: [
        'Native optimized Box3D versus browser WebGPU on the same host; this is not a WebAssembly comparison or a claim about multithreaded Box3D unless workers > 1.',
        'Same SI inputs, outer timestep, substep count, masses, sharp boxes, zero damping and disabled sleeping. Solver algorithms/iteration controls differ; inspect quality alongside timing.',
        'Timed replay excludes creation, rendering, diagnostics and state readbacks. GPU completion includes encoding, submission and a completion fence; GPU timestamps, when requested, come from a separate instrumented replay; primary timings have no timestamp queries.',
        'Warmup advances the same scene; quality uses a fresh replay with periodic snapshots. Sampling cannot detect every transient contact error.',
        'CPU bytes are Box3D allocated bytes; GPU bytes are logical graph buffers, not measured process RAM or VRAM residency. They are not directly equivalent.',
        'Incomplete work, failed declared quality budgets, or software fallback never produces a hardware speed ratio. Budgets are a bounded comparison profile, not a general physics certification.'
      ]
    };
  } finally {
    try {
      await browser?.close();
    } finally {
      reference.destroy();
    }
  }
}
async function runGPUReplay({root, props, settings, quality, profile = false}) {
  const [{luma}, {webgpuAdapter}, {GPUCommandGraph}, {GPURigidBodyWorld}] = await Promise.all([
    import(`${root}/modules/core/src/index.ts`),
    import(`${root}/modules/core/src/webgpu/index.ts`),
    import(`${root}/modules/graph/src/gpu-core/gpu-command-graph.ts`),
    import(`${root}/modules/graph/src/gpu-physics/gpu-rigid-body-world.ts`)
  ]);
  const device = await luma.createDevice({
    type: 'webgpu',
    adapters: [webgpuAdapter],
    optionalFeatures: ['timestamp-query']
  });
  let world, graph;
  const setupStart = performance.now();
  try {
    world = new GPURigidBodyWorld(props);
    const definition = new GPUCommandGraph(device);
    world.addToGraph(definition);
    graph = await definition.compileAsync();
    const setupMilliseconds = performance.now() - setupStart;
    const timings = [],
      frames = [];
    if (quality) frames.push({step: 0, states: await world.readState()});
    for (let frame = 0; frame < settings.frames; frame++) {
      const query =
        profile && frame >= settings.warmup && device.features.has('timestamp-query')
          ? device.createQuerySet({
              type: 'timestamp',
              count: graph.stats.nodeOrder.length * 2 * settings.substeps
            })
          : null;
      const start = performance.now(),
        encoder = device.createCommandEncoder(),
        encodings = [];
      const encode = () => {
        for (let substep = 0; substep < settings.substeps; substep++)
          encodings.push(graph.encode(encoder, {parameters: undefined}));
      };
      if (query) encoder.withTimeProfilingQuerySet(query, encode);
      else encode();
      const encoded = performance.now();
      device.submit(encoder.finish());
      const fence = device.createFence();
      try {
        await fence.signaled;
      } finally {
        fence.destroy();
      }
      const completed = performance.now();
      try {
        let gpuTime = null;
        if (query) {
          const reports = await Promise.all(encodings.map(encoding => encoding.readTimings()));
          gpuTime = reports.reduce((sum, report) => sum + report.gpuTimeMilliseconds, 0);
        }
        if (!quality && frame >= settings.warmup)
          timings.push({encode: encoded - start, completion: completed - start, gpu: gpuTime});
        if (quality && ((frame + 1) % settings.stride === 0 || frame + 1 === settings.frames))
          frames.push({step: frame + 1, states: await world.readState()});
      } finally {
        query?.destroy();
      }
    }
    return {
      adapter: device.info,
      setupMilliseconds,
      parameters: props.bodies.map((body, index) => {
        const parameters = world.getBodyParameters(index);
        return {
          mass: parameters.mass,
          inertia: parameters.inertiaDiagonal,
          inertiaOrientation: parameters.inertiaOrientation
        };
      }),
      graphNodes: graph.stats.nodeOrder.length,
      logicalBufferBytes: graph.stats.importedBufferBytes + graph.stats.physicalTransientBytes,
      capacity: world.getCapacityInfo(),
      diagnostics: await world.readSimulationDiagnostics(),
      timings,
      ...(quality ? {frames} : {})
    };
  } finally {
    graph?.destroy();
    world?.destroy();
    device.destroy();
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const options = Object.fromEntries(
    [
      'url',
      'source',
      'build',
      'output',
      'scenes',
      'count',
      'seed',
      'frames',
      'warmup',
      'substeps',
      'repeats',
      'stride',
      'workers',
      'iterations',
      'timeStep',
      'solver'
    ].map(name => [name, {type: 'string'}])
  );
  const {values} = parseArgs({
    options: {...options, software: {type: 'boolean'}, profile: {type: 'boolean'}}
  });
  runSuite({...values, ...(values.scenes ? {scenes: values.scenes.split(',')} : {})})
    .then(report => {
      const json = JSON.stringify(report, null, 2);
      if (values.output) writeFileSync(values.output, `${json}\n`);
      else console.log(json);
      if (report.results.some(result => !result.executionComplete)) process.exitCode = 2;
    })
    .catch(error => {
      console.error(error);
      process.exitCode = 1;
    });
}
