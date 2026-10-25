// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import type {GPUGraphDiagnostics} from '../../gpu-graph-diagnostics';
import type {Device} from '@luma.gl/core';
import {
  GPUPhysicsBatch,
  GPUPhysicsEnsemble,
  type GPURigidBodyWorldProps
} from '@luma.gl/graph/gpu-physics';

export type BatchBenchmarkOptions = {
  worlds: number;
  activeFraction?: number;
  bodies: number;
  frames: number;
  warmup: number;
  steps: number;
  pairsPerBody?: number;
  scene: 'sparse' | 'pile';
  submission: 'batched' | 'separate' | 'ensemble';
};

export function makeBatchFixture(
  count: number,
  scene: 'sparse' | 'pile',
  pairsPerBody = 16
): GPURigidBodyWorldProps {
  const width = Math.ceil(Math.sqrt(count));
  const spacing = scene === 'sparse' ? 2 : 0.98;
  return {
    solver: 'parallel',
    broadPhase: 'hierarchical-grid',
    maximumPairs: 2 ** Math.ceil(Math.log2(Math.max(64, count * pairsPerBody))),
    iterations: 8,
    timeStep: 1 / 120,
    gravity: scene === 'pile' ? [0, -9.81, 0] : [0, 0, 0],
    failurePolicy: 'rollback',
    sleepAfter: 0,
    bodies: [
      ...Array.from({length: count}, (_, index) => ({
        position: [(index % width) * spacing, 1 + Math.floor(index / width) * spacing, 0] as [
          number,
          number,
          number
        ],
        velocity: [0.1, 0, 0] as [number, number, number],
        shape: {type: 'sphere' as const, radius: 0.5},
        friction: 0.4
      })),
      ...(scene === 'pile'
        ? [
            {
              position: [width / 2, -0.5, 0] as [number, number, number],
              mass: 0,
              shape: {
                type: 'box' as const,
                halfExtents: [width, 0.5, 2] as [number, number, number]
              }
            }
          ]
        : [])
    ]
  };
}

function percentile(values: number[], fraction: number): number {
  const sorted = [...values].sort((first, second) => first - second);
  return sorted[Math.max(0, Math.ceil(sorted.length * fraction) - 1)];
}

/** Fence-completed timing; diagnostics and visualization readbacks are outside timed regions. */
export async function runBatchBenchmark(
  device: Device,
  options: BatchBenchmarkOptions,
  progress?: (frame: number) => void,
  diagnostics?: GPUGraphDiagnostics
) {
  if (
    !Number.isFinite(options.activeFraction ?? 1) ||
    (options.activeFraction ?? 1) <= 0 ||
    (options.activeFraction ?? 1) > 1 ||
    !Number.isInteger(options.pairsPerBody ?? 16) ||
    (options.pairsPerBody ?? 16) < 1 ||
    (options.pairsPerBody ?? 16) > 64 ||
    !['ensemble', 'separate', 'batched'].includes(options.submission) ||
    !['sparse', 'pile'].includes(options.scene) ||
    (options.submission !== 'ensemble' && options.worlds > 128) ||
    !Number.isInteger(options.worlds) ||
    options.worlds < 1 ||
    options.worlds > 4096 ||
    !Number.isInteger(options.bodies) ||
    options.bodies < 1 ||
    options.bodies > 65535 ||
    !Number.isInteger(options.frames) ||
    options.frames < 1 ||
    options.frames > 2000 ||
    !Number.isInteger(options.warmup) ||
    options.warmup < 0 ||
    options.warmup >= options.frames ||
    !Number.isInteger(options.steps) ||
    options.steps < 1 ||
    options.steps > 16
  )
    throw new Error('Invalid benchmark dimensions');
  const batch = new GPUPhysicsBatch({
    device,
    maximumResidentBytes: 512 * 1024 * 1024,
    maximumResidentWorlds: options.worlds
  });
  const fixture = makeBatchFixture(options.bodies, options.scene, options.pairsPerBody);
  let ensemble: GPUPhysicsEnsemble | undefined;
  if (options.submission !== 'ensemble') batch.registerTemplate('fixture', fixture);
  const setupStart = performance.now();
  try {
    const handles = [];
    if (options.submission === 'ensemble') {
      ensemble = await GPUPhysicsEnsemble.create(device, {
        template: fixture,
        instances: options.worlds,
        maximumPairs: 2 ** Math.ceil(Math.log2(fixture.maximumPairs! * options.worlds)),
        maximumResidentBytes: 512 * 1024 * 1024
      });
    } else
      for (let index = 0; index < options.worlds; index++)
        handles.push(await batch.acquire('fixture', `world-${index}`, [index * 1e9, 0, 0]));
    const activeWorlds = Math.max(1, Math.ceil(options.worlds * (options.activeFraction ?? 1)));
    for (let instance = activeWorlds; instance < options.worlds; instance++) {
      if (ensemble) ensemble.setActive(instance, false);
      else batch.setActive(handles[instance], false);
    }
    const setupMilliseconds = performance.now() - setupStart;
    const timings: number[] = [];
    const encoding: number[] = [];
    let complete = true;
    for (let frame = 0; frame < options.frames; frame++) {
      const start = performance.now();
      if (ensemble) {
        const encoder = device.createCommandEncoder();
        ensemble.encode(encoder, options.steps);
        device.submit(encoder.finish());
      } else if (options.submission === 'batched') {
        const encoder = device.createCommandEncoder();
        batch.encode(encoder, options.steps);
        device.submit(encoder.finish());
      } else {
        for (const handle of handles) {
          const encoder = device.createCommandEncoder();
          batch.encode(encoder, options.steps, [handle]);
          device.submit(encoder.finish());
        }
      }
      const encoded = performance.now();
      const fence = device.createFence();
      try {
        await fence.signaled;
      } finally {
        fence.destroy();
      }
      const completed = performance.now();
      if (frame >= options.warmup) {
        timings.push(completed - start);
        encoding.push(encoded - start);
      }
      // Observe every frame so a rejected step cannot disappear in a later sample.
      if (ensemble) complete &&= (await ensemble.world.readSimulationDiagnostics()).complete;
      for (const handle of handles)
        complete &&= (await batch.getWorld(handle).readSimulationDiagnostics()).complete;
      progress?.(frame + 1);
    }
    const observation = ensemble ? ensemble.inspect() : batch.inspect(handles[0]);
    if (observation.encoding) diagnostics?.record(observation.graph, observation.encoding);
    const ensembleStates = ensemble ? await ensemble.world.readState() : undefined;
    const states = ensembleStates
      ? ensembleStates.slice(0, fixture.bodies.length)
      : await batch.getWorld(handles[0]).readState();
    let maximumBallisticError = 0;
    let maximumWorldDifference = 0;
    let finite = true;
    const duration = options.frames * options.steps * fixture.timeStep!;
    for (let instance = 0; instance < options.worlds; instance++) {
      const sample = ensembleStates
        ? ensembleStates.slice(
            instance * fixture.bodies.length,
            (instance + 1) * fixture.bodies.length
          )
        : await batch.getWorld(handles[instance]).readState();
      for (const [index, state] of sample.entries()) {
        finite &&= [...state.position, ...state.velocity, ...state.orientation].every(
          Number.isFinite
        );
        for (let axis = 0; axis < 3; axis++) {
          if (instance < activeWorlds)
            maximumWorldDifference = Math.max(
              maximumWorldDifference,
              Math.abs(state.position[axis] - states[index].position[axis])
            );
          if (options.scene === 'sparse')
            maximumBallisticError = Math.max(
              maximumBallisticError,
              Math.abs(
                state.position[axis] -
                  fixture.bodies[index].position[axis] -
                  (fixture.bodies[index].velocity?.[axis] ?? 0) *
                    (instance < activeWorlds ? duration : 0)
              )
            );
        }
      }
    }
    const quality = {
      finite,
      maximumWorldDifference,
      maximumBallisticError,
      passed:
        finite &&
        maximumWorldDifference < 0.01 &&
        (options.scene !== 'sparse' || maximumBallisticError < 0.01),
      scope:
        options.scene === 'sparse'
          ? 'Finite states, world equivalence and analytic ballistic position within 0.01 units.'
          : 'Finite states and world equivalence only; no dense-contact accuracy claim.'
    };
    const elapsed = timings.reduce((sum, value) => sum + value, 0);
    const beforeReuse = ensemble ? {...ensemble.getStats(), reusedSlots: 0} : batch.getStats();
    const recycleStart = performance.now();
    for (const handle of handles) batch.release(handle);
    if (!ensemble)
      for (let index = 0; index < options.worlds; index++)
        await batch.acquire('fixture', `recycled-${index}`);
    const recycleFence = device.createFence();
    try {
      await recycleFence.signaled;
    } finally {
      recycleFence.destroy();
    }
    const reuseMilliseconds = performance.now() - recycleStart;
    return {
      options,
      activeWorlds,
      scheduler: ensemble ? await ensemble.readStatus() : undefined,
      device: device.info,
      complete,
      quality,
      setupMilliseconds,
      reuseMilliseconds: ensemble ? null : reuseMilliseconds,
      latencyMilliseconds: {p50: percentile(timings, 0.5), p95: percentile(timings, 0.95)},
      encodingMilliseconds: {p50: percentile(encoding, 0.5), p95: percentile(encoding, 0.95)},
      worldStepsPerSecond:
        complete && quality.passed
          ? (timings.length * activeWorlds * options.steps * 1000) / elapsed
          : null,
      bodyStepsPerSecond:
        complete && quality.passed
          ? (timings.length * activeWorlds * options.steps * fixture.bodies.length * 1000) / elapsed
          : null,
      beforeReuse,
      afterReuse: ensemble ? {...ensemble.getStats(), reusedSlots: 0} : batch.getStats(),
      graphEncodingsPerStep: ensemble ? 1 : activeWorlds,
      states,
      qualification:
        'Exploratory single-device throughput. Completion diagnostics are not a collision-accuracy qualification. Timing excludes diagnostics, rendering, compilation and streaming. Encoding includes submission. GPU pipelines and driver allocation overhead are excluded from resident byte accounting.'
    };
  } finally {
    ensemble?.destroy();
    batch.destroy();
  }
}
