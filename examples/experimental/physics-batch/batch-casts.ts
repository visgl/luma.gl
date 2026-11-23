// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import {GPUCommandGraph} from '@luma.gl/graph/gpu-core';
import {
  GPURigidBodyWorld,
  type GPURigidBody,
  type GPURigidBodyBatchCast,
  type GPURigidBodyQueryResult
} from '@luma.gl/graph/gpu-physics';

/** Size and sweep footprint of a repeatable collision scan. */
export type CollisionScanOptions = {
  /** Number of authored spheres and boxes. */
  colliders: number;
  /** Number of evenly distributed samples. */
  casts: number;
  /** World-space sample radius. Zero produces rays. */
  radius: number;
};

/** Run one equivalent command through the existing scalar API. */
function castScalar(
  world: GPURigidBodyWorld,
  command: GPURigidBodyBatchCast
): Promise<GPURigidBodyQueryResult> {
  return command.radius === undefined
    ? world.raycast(command)
    : world.castSphere({...command, radius: command.radius});
}

/** Time one batched scan and compare an evenly spaced subset with scalar queries. */
export async function runCollisionScan(device: Device, options: CollisionScanOptions) {
  if (
    !Number.isSafeInteger(options.colliders) ||
    options.colliders < 1 ||
    options.colliders > 4096 ||
    !Number.isSafeInteger(options.casts) ||
    options.casts < 1 ||
    options.casts > 16384 ||
    !Number.isFinite(options.radius) ||
    options.radius < 0 ||
    options.radius > 2
  )
    throw new Error('Invalid collision scan dimensions');

  /** Arrange different collider footprints on the same square lattice. */
  const columns = Math.ceil(Math.sqrt(options.colliders));
  /** Use two meters between centers so rays can see through the gaps. */
  const extent = columns * 2;
  /** A mix of heights, footprint sizes, and box angles gives the scan distinct features. */
  const bodies: GPURigidBody[] = Array.from({length: options.colliders}, (_, index) => {
    /** Column coordinate in the authored grid. */
    const columnsFromLeft = index % columns;
    /** Row coordinate in the authored grid. */
    const rowsFromBottom = Math.floor(index / columns);
    /** Vary the elevation for a visible depth gradient. */
    const height = 0.45 + ((columnsFromLeft * 7 + rowsFromBottom * 5) % 11) * 0.14;
    /** Rotate selected boxes to introduce angled intersections. */
    const angle = ((columnsFromLeft + rowsFromBottom) % 6) * (Math.PI / 12);
    return {
      mass: 0,
      position: [columnsFromLeft * 2 + 1, rowsFromBottom * 2 + 1, height],
      orientation: [0, 0, Math.sin(angle / 2), Math.cos(angle / 2)],
      shape:
        index % 3 === 0
          ? {type: 'sphere', radius: 0.72}
          : {type: 'box', halfExtents: [0.65, 0.43, height]}
    };
  });
  /** Keep one square-ish canvas sample grid, including a partial last row when needed. */
  const width = Math.ceil(Math.sqrt(options.casts));
  /** All probe centers are evaluated at the center of their image pixel. */
  const height = Math.ceil(options.casts / width);
  /** A border avoids aligning every sample with a collider center when the grids match. */
  const margin = 1.5;
  /** Start above the tallest collider and allow the probe to travel below the sample volume. */
  const probeHeight = 6;
  /** Input ordering matches the output image and exported nearest distances. */
  const commands: GPURigidBodyBatchCast[] = Array.from({length: options.casts}, (_, index) => ({
    origin: [
      (((index % width) + 0.5) / width) * (extent + 2 * margin) - margin,
      ((Math.floor(index / width) + 0.5) / height) * (extent + 2 * margin) - margin,
      probeHeight
    ],
    direction: [0, 0, -1],
    maximumDistance: 8,
    ...(options.radius > 0 ? {radius: options.radius} : {})
  }));
  /** The scan reads current GPU poses and needs no simulation advancement or full-world readback. */
  const world = new GPURigidBodyWorld({
    bodies,
    enableQueries: true,
    queryBatchCapacity: options.casts,
    queryBatchIndex: true,
    broadPhase: 'hierarchical-grid',
    maximumPairs: 64
  });
  try {
    world.addToGraph(new GPUCommandGraph(device));
    /** Warm both paths before measuring fence-completed host turnaround. */
    await world.castBatch(commands.slice(0, 1), {strategy: 'indexed'});
    await world.castBatch(commands.slice(0, 1), {strategy: 'scan'});
    await castScalar(world, commands[0]);

    /** Time the same commands and GPU pose snapshot on each path. */
    async function measure(strategy: 'scan' | 'indexed') {
      /** Start before CPU packing and stop after compact GPU readback. */
      const start = performance.now();
      /** Preserve all rows for full-result parity and the depth image. */
      const results = await world.castBatch(commands, {strategy});
      return {results, milliseconds: performance.now() - start};
    }
    /** Alternate path order and report medians to reduce warm-cache and scheduling bias. */
    const indexedTimes: number[] = [];
    /** Direct scan measures the same case without any index work. */
    const scanTimes: number[] = [];
    /** Keep one result set per path for full parity. */
    let indexed: GPURigidBodyQueryResult[] = [];
    /** Direct-scan reference for all pixels. */
    let scan: GPURigidBodyQueryResult[] = [];
    for (const first of ['indexed', 'scan', 'indexed'] as const) {
      for (const strategy of [first, first === 'indexed' ? 'scan' : 'indexed'] as const) {
        /** Capture the current repetition's result and completed host timing. */
        const {results, milliseconds} = await measure(strategy);
        if (strategy === 'indexed') {
          indexed = results;
          indexedTimes.push(milliseconds);
        } else {
          scan = results;
          scanTimes.push(milliseconds);
        }
      }
    }
    indexedTimes.sort((first, second) => first - second);
    scanTimes.sort((first, second) => first - second);

    /** Sample across the full scan while keeping scalar readbacks affordable. */
    const sampleCount = Math.min(16, options.casts);
    /** Equal intervals include hits and gaps across the image. */
    const indices = Array.from({length: sampleCount}, (_, index) =>
      Math.floor(((index + 0.5) / sampleCount) * options.casts)
    );
    /** Time the same input list through both APIs on the same world. */
    const sampleCommands = indices.map(index => commands[index]);
    /** Start before a single batch for the matched subset. */
    const batchStart = performance.now();
    /** Preserve input order for a direct comparison. */
    const sampleBatch = await world.castBatch(sampleCommands, {strategy: 'indexed'});
    /** Host turnaround for the matched batched subset. */
    const sampleBatchMilliseconds = performance.now() - batchStart;
    /** Start before submitting scalar commands one at a time. */
    const scalarStart = performance.now();
    /** Every scalar command has its own submission and compact readback. */
    const scalar: GPURigidBodyQueryResult[] = [];
    for (const command of sampleCommands) scalar.push(await castScalar(world, command));
    /** Stop timing before the CPU compares the samples. */
    const sampleScalarMilliseconds = performance.now() - scalarStart;
    /** Compare content and the second batch against its matching full-scan rows. */
    const matchesScalar = scalar.every(
      (result, index) =>
        JSON.stringify(result) === JSON.stringify(sampleBatch[index]) &&
        JSON.stringify(result) === JSON.stringify(indexed[indices[index]])
    );
    return {
      options,
      width,
      height,
      hitCount: indexed.filter(result => result.hits.length).length,
      complete: indexed.every(result => result.complete),
      matchesScalar,
      matchesScan: JSON.stringify(indexed) === JSON.stringify(scan),
      indexedMilliseconds: indexedTimes[1],
      scanMilliseconds: scanTimes[1],
      sampleCount,
      sampleBatchMilliseconds,
      sampleScalarMilliseconds,
      distances: indexed.map(result => result.hits[0]?.distance ?? null)
    };
  } finally {
    world.destroy();
  }
}
