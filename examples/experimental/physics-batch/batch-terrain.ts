// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import {GPUPhysicsEnsemble, type GPURigidBody} from '@luma.gl/graph/gpu-physics';
import type {GPUGraphDiagnostics} from '../../gpu-graph-diagnostics';

type TerrainBenchmarkOptions = {
  worlds: number;
  bodies: number;
  frames: number;
  activeFraction: number;
  pairsPerBody: number;
};

/** Measure bounded streaming and solver scheduling separately on one fused allocation. */
export async function runTerrainStreamingBenchmark(
  device: Device,
  options: TerrainBenchmarkOptions,
  progress: (frame: number) => void,
  diagnostics: GPUGraphDiagnostics
) {
  const {worlds, bodies, frames, activeFraction, pairsPerBody} = options;
  if (
    ![worlds, bodies, frames, pairsPerBody].every(Number.isSafeInteger) ||
    worlds < 1 ||
    worlds > 4096 ||
    bodies < 3 ||
    worlds * bodies > 65535 ||
    frames < 20 ||
    frames > 2000 ||
    pairsPerBody < 1 ||
    pairsPerBody > 64 ||
    !(activeFraction > 0 && activeFraction <= 1)
  )
    throw new Error('Invalid terrain benchmark dimensions');

  const width = Math.ceil(Math.sqrt(bodies - 2));
  const extent = width * 2;
  const resolution = 17;
  const spacing = extent / (resolution - 1);
  const reservations: GPURigidBody[] = Array.from({length: 2}, () => ({
    position: [0, 0, 0],
    mass: 0,
    shape: {type: 'height-field', field: {width: resolution, height: resolution}}
  }));
  const spheres: GPURigidBody[] = Array.from({length: bodies - 2}, (_, index) => ({
    position: [1 + (index % width) * 2, 1 + Math.floor(index / width) * 2, 0.5],
    restitution: 0,
    shape: {type: 'sphere', radius: 0.5}
  }));
  const ensemble = await GPUPhysicsEnsemble.create(device, {
    instances: worlds,
    terrainSlots: [0, 1],
    maximumPairs: 2 ** Math.ceil(Math.log2(Math.max(64, bodies * worlds * pairsPerBody))),
    maximumResidentBytes: 512 * 1024 * 1024,
    template: {
      gravity: [0, 0, -9.81],
      sleepAfter: 0.08,
      iterations: 8,
      enableQueries: true,
      bodies: [...reservations, ...spheres]
    }
  });

  let loads = 0;
  const activeWorlds = Math.ceil(worlds * activeFraction);
  const streamer = ensemble.createTerrainStreamer({
    maximumConcurrentLoads: 4,
    provider: {
      async loadTile(key, signal) {
        signal.throwIfAborted();
        loads++;
        const raised = key === 'west-raised';
        return {
          position: [key === 'east' ? extent : 0, 0, 0],
          field: {
            width: resolution,
            height: resolution,
            columnStep: [spacing, 0],
            rowStep: [0, spacing],
            heights: Float32Array.from({length: resolution * resolution}, (_, sample) =>
              raised ? 0.06 * (1 - (sample % resolution) / (resolution - 1)) : 0
            )
          }
        };
      }
    }
  });
  const window = (raised: boolean) => ({
    tiles: [
      {collider: 0, key: raised ? 'west-raised' : 'west'},
      {collider: 1, key: 'east'}
    ],
    seams: [{first: 0, firstEdge: 'last-column', second: 1, secondEdge: 'first-column'}] as const
  });
  try {
    const initial = ensemble.getStats();
    await Promise.all(
      Array.from({length: worlds}, (_, instance) => streamer.prepare(instance, window(false)))
    );
    for (let instance = 0; instance < worlds; instance++) {
      streamer.apply(instance);
      if (instance >= activeWorlds) ensemble.setActive(instance, false);
    }
    const heights = new Array<boolean>(activeWorlds).fill(false);
    const streamTimings: number[] = [];
    const stepTimings: number[] = [];
    const activity: number[] = [];
    let firstIncompleteFrame: number | null = null;
    for (let frame = 0; frame < frames; frame++) {
      if (frame >= 12 && frame % 8 === 4) {
        const instance = Math.floor((frame - 12) / 8) % activeWorlds;
        heights[instance] = !heights[instance];
        const measure = performance.now();
        await streamer.prepare(instance, window(heights[instance]));
        streamer.apply(instance);
        streamTimings.push(performance.now() - measure);
      }
      const measure = performance.now();
      const encoder = device.createCommandEncoder();
      ensemble.encode(encoder);
      device.submit(encoder.finish());
      const fence = device.createFence();
      try {
        await fence.signaled;
      } finally {
        fence.destroy();
      }
      stepTimings.push(performance.now() - measure);
      if (!(await ensemble.world.readSimulationDiagnostics()).complete)
        firstIncompleteFrame ??= frame + 1;
      activity.push((await ensemble.readWorkStatistics()).activeInstances);
      progress(frame + 1);
    }
    const sampleFraction = 0.2713;
    const check = await ensemble.world.raycast({
      origin: [extent * sampleFraction, extent * 0.4687, 4],
      direction: [0, 0, -1],
      maximumDistance: 6,
      colliderIndices: [ensemble.getColliderIndex(0, 0)]
    });
    const heightError = check.hits.length
      ? Math.abs(check.hits[0].point[2] - (heights[0] ? 0.06 * (1 - sampleFraction) : 0))
      : null;
    const complete =
      firstIncompleteFrame === null &&
      check.complete &&
      heightError !== null &&
      heightError < 0.001;
    const {graph, encoding} = ensemble.inspect();
    if (encoding) diagnostics.record(graph, encoding);
    const states = (await ensemble.world.readState()).slice(2, bodies);
    const final = ensemble.getStats();
    const percentile95 = (values: number[]) =>
      [...values].sort((first, second) => first - second)[Math.ceil(values.length * 0.95) - 1];
    return {
      options,
      complete,
      states,
      extent,
      activeWorlds,
      activity,
      providerLoads: loads,
      firstIncompleteFrame,
      sampledHeightError: heightError,
      streamedWindows: streamTimings.length,
      streamP95: percentile95(streamTimings),
      stepP95: percentile95(stepTimings),
      residentBytes: final.residentBytes,
      fixedAllocation: final.residentBytes === initial.residentBytes
    };
  } finally {
    ensemble.destroy();
  }
}
