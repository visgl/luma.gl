// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import type {GPUGraphDiagnostics} from '../../gpu-graph-diagnostics';
import {profileEnsemble} from './batch-profile';
import type {Device} from '@luma.gl/core';
import {
  GPUPhysicsBatch,
  GPUPhysicsEnsemble,
  type GPURigidBodyWorldProps
} from '@luma.gl/graph/gpu-physics';

export type BatchBenchmarkScene = 'sparse' | 'pile' | 'sleeping' | 'wake-storm' | 'vehicle-fleet';

export type BatchBenchmarkOptions = {
  worlds: number;
  activeFraction?: number;
  bodies: number;
  frames: number;
  warmup: number;
  steps: number;
  pairsPerBody?: number;
  scene: BatchBenchmarkScene;
  submission: 'batched' | 'separate' | 'ensemble';
};

export function makeBatchFixture(
  count: number,
  scene: BatchBenchmarkScene,
  pairsPerBody = 16
): GPURigidBodyWorldProps {
  if (scene === 'vehicle-fleet') return makeVehicleFixture(count, pairsPerBody);
  const width = Math.ceil(Math.sqrt(count));
  const spacing = scene === 'pile' ? 0.98 : 2;
  return {
    solver: 'parallel',
    broadPhase: 'hierarchical-grid',
    maximumPairs: 2 ** Math.ceil(Math.log2(Math.max(64, count * pairsPerBody))),
    iterations: 8,
    timeStep: 1 / 120,
    gravity: scene === 'pile' ? [0, -9.81, 0] : [0, 0, 0],
    failurePolicy: 'rollback',
    sleepAfter: scene === 'sleeping' || scene === 'wake-storm' ? 0.025 : 0,
    bodies: [
      ...Array.from({length: count}, (_, index) => ({
        position: [(index % width) * spacing, 1 + Math.floor(index / width) * spacing, 0] as [
          number,
          number,
          number
        ],
        velocity: [scene === 'sleeping' || scene === 'wake-storm' ? 0 : 0.1, 0, 0] as [
          number,
          number,
          number
        ],
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

/** Identical four-wheel chassis straddle a seam in each independent world. */
function makeVehicleFixture(count: number, pairsPerBody: number): GPURigidBodyWorldProps {
  if (count < 3) throw new Error('Vehicle fleet requires at least three bodies per world');
  const vehicles = count - 2;
  const laneExtent = vehicles * 2;
  return {
    solver: 'parallel',
    broadPhase: 'hierarchical-grid',
    failurePolicy: 'rollback',
    maximumPairs: 2 ** Math.ceil(Math.log2(Math.max(64, count * pairsPerBody))),
    iterations: 8,
    timeStep: 1 / 120,
    gravity: [0, 0, -9.81],
    bodies: [
      ...[-100, 100].map(longitudinal => ({
        mass: 0,
        position: [longitudinal, 0, -0.5] as const,
        shape: {type: 'box' as const, halfExtents: [100, laneExtent, 0.5] as const}
      })),
      ...Array.from({length: vehicles}, (_, vehicle) => ({
        mass: 400,
        position: [0, 4 * vehicle + 2 - laneExtent, 0.75] as const,
        shape: {type: 'box' as const, halfExtents: [1.3, 0.65, 0.16] as const}
      }))
    ],
    vehicles: Array.from({length: vehicles}, (_, vehicle) => ({
      chassis: vehicle + 2,
      terrainCollider: 0,
      additionalTerrainColliders: [1],
      radius: 0.4,
      travel: 0.5,
      springRate: 10000,
      damping: 1500,
      grip: 1,
      motorTorque: 250,
      brakeTorque: 600,
      wheelInertia: 1.2,
      wheels: [1, -1].flatMap(longitudinal =>
        [0.8, -0.8].map(lateral => ({
          mount: [longitudinal, lateral, 0] as const,
          drive: true,
          steer: longitudinal > 0
        }))
      )
    }))
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
    !['sparse', 'pile', 'sleeping', 'wake-storm', 'vehicle-fleet'].includes(options.scene) ||
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
    const activeHandles = handles.slice(0, activeWorlds);
    const vehiclesPerWorld = fixture.vehicles?.length ?? 0;
    for (let instance = 0; instance < activeWorlds; instance++) {
      for (let vehicle = 0; vehicle < vehiclesPerWorld; vehicle++) {
        if (ensemble) ensemble.setVehicleControls(instance, vehicle, 0.7, 0, 0);
        else batch.getWorld(activeHandles[instance]).setVehicleControls(0.7, 0, 0, vehicle);
      }
    }
    const setupMilliseconds = performance.now() - setupStart;
    const timings: number[] = [];
    const encoding: number[] = [];
    let complete = true;
    let measuredWorldSteps = 0;
    let measuredBodySteps = 0;
    const workSamples: Awaited<ReturnType<GPUPhysicsEnsemble['readWorkStatistics']>>[] = [];
    for (let frame = 0; frame < options.frames; frame++) {
      if (options.scene === 'wake-storm' && frame % 8 === 0) {
        if (ensemble)
          for (let instance = 0; instance < activeWorlds; instance++) ensemble.wake(instance);
        else for (const handle of activeHandles) batch.getWorld(handle).wake();
      }
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
        for (const handle of activeHandles) {
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
      const work = ensemble ? await ensemble.readWorkStatistics() : undefined;
      if (frame >= options.warmup) {
        if (work) workSamples.push(work);
        measuredWorldSteps += (work?.activeInstances ?? activeWorlds) * options.steps;
        measuredBodySteps +=
          (work?.activeBodies ?? activeWorlds * fixture.bodies.length) * options.steps;
      }
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
    let minimumVehicleProgress = vehiclesPerWorld ? Infinity : null;
    let finite = true;
    const duration = options.frames * options.steps * fixture.timeStep!;
    for (let instance = 0; instance < options.worlds; instance++) {
      const sample = ensembleStates
        ? ensembleStates.slice(
            instance * fixture.bodies.length,
            (instance + 1) * fixture.bodies.length
          )
        : await batch.getWorld(handles[instance]).readState();
      if (instance < activeWorlds && minimumVehicleProgress !== null)
        for (const vehicle of fixture.vehicles!)
          minimumVehicleProgress = Math.min(
            minimumVehicleProgress,
            sample[vehicle.chassis].position[0]
          );
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
      minimumVehicleProgress,
      finite,
      maximumWorldDifference,
      maximumBallisticError,
      passed:
        finite &&
        maximumWorldDifference < 0.01 &&
        (options.scene !== 'sparse' || maximumBallisticError < 0.01) &&
        (minimumVehicleProgress === null || minimumVehicleProgress > 0),
      scope:
        options.scene === 'sparse'
          ? 'Finite states, world equivalence and analytic ballistic position within 0.01 units.'
          : options.scene === 'vehicle-fleet'
            ? 'Finite states, identical active world motion within 0.01 units, and forward travel for every active chassis.'
            : 'Finite states and world equivalence only; no dense-contact accuracy claim.'
    };
    const profile = ensemble ? await profileEnsemble(device, ensemble, diagnostics) : undefined;
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
      profile,
      vehiclesPerWorld,
      vehicleStepsPerSecond:
        complete && quality.passed && vehiclesPerWorld
          ? (measuredWorldSteps * vehiclesPerWorld * 1000) / elapsed
          : null,
      workSamples,
      scheduler: ensemble ? await ensemble.readStatus() : undefined,
      device: device.info,
      complete,
      quality,
      setupMilliseconds,
      reuseMilliseconds: ensemble ? null : reuseMilliseconds,
      latencyMilliseconds: {p50: percentile(timings, 0.5), p95: percentile(timings, 0.95)},
      encodingMilliseconds: {p50: percentile(encoding, 0.5), p95: percentile(encoding, 0.95)},
      worldStepsPerSecond:
        complete && quality.passed ? (measuredWorldSteps * 1000) / elapsed : null,
      bodyStepsPerSecond: complete && quality.passed ? (measuredBodySteps * 1000) / elapsed : null,
      beforeReuse,
      afterReuse: ensemble ? {...ensemble.getStats(), reusedSlots: 0} : batch.getStats(),
      graphEncodingsPerStep: ensemble ? 1 : activeWorlds,
      states,
      workScope:
        'Last substep counters sampled outside each timed frame. Multi-substep runs report an estimate of active steps; use steps=1 for activity qualification. Instance scheduling/status still scan resident instance records. Optional events, pose publication and noncompact fallback can scan capacity.',
      qualification:
        'Exploratory single-device throughput. Completion diagnostics are not a collision-accuracy qualification. Timing excludes diagnostics, rendering, compilation and streaming. Encoding includes submission. GPU pipelines and driver allocation overhead are excluded from resident byte accounting.'
    };
  } finally {
    ensemble?.destroy();
    batch.destroy();
  }
}
