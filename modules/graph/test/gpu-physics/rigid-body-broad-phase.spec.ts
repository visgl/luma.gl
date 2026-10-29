// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {Buffer, type Device} from '@luma.gl/core';
import {getWebGPUTestDevice} from '@luma.gl/core/test-utils';
import {GPUCommandGraph} from '../../src/gpu-core/gpu-command-graph';
import {addGPUCommandNodes} from '../../src/gpu-core/gpu-command-node';
import {
  GPURigidBodyBroadPhase,
  decodeRigidBodyBroadPhaseDiagnostics
} from '../../src/gpu-physics/rigid-body-broad-phase';

type Bounds = {minimum: number[]; maximum: number[]};

it('matches all-pairs discovery for mixed-size sparse bounds without a global coarse cell', async context => {
  const device = await getWebGPUTestDevice('core');
  if (!device) return context.skip('WebGPU is unavailable');
  const bounds: Bounds[] = [{minimum: [-100, -0.5, -100], maximum: [100, 0.5, 100]}];
  for (let index = 0; index < 1000; index++) {
    const center = [(index % 40) * 3 - 60, 0.4, Math.floor(index / 40) * 3 - 36];
    const radius = 0.2 + (index % 3) * 0.1;
    bounds.push({
      minimum: center.map(value => Math.fround(value - radius)),
      maximum: center.map(value => Math.fround(value + radius))
    });
  }
  const fixture = await makeFixture(device, bounds, 2000);
  try {
    const result = await fixture.run();
    expect(result.pairs.sort()).toEqual(referencePairs(bounds).sort());
    expect(result.diagnostics).toMatchObject({
      pairCount: 1000,
      droppedPairs: 0,
      invalidBounds: 0,
      incompleteQueries: 0
    });
    expect(result.diagnostics.candidateTests).toBeLessThan(12000);
    // Refit between encodings: move a box away from the large floor.
    fixture.minima.write(new Float32Array([1000, 1000, 1000]), 12);
    fixture.maxima.write(new Float32Array([1001, 1001, 1001]), 12);
    const moved = await fixture.run();
    expect(moved.diagnostics.pairCount).toBe(999);
    expect(moved.pairs).not.toContain('0:1');
  } finally {
    fixture.destroy();
  }
}, 120000);

it('reports dense output/traversal overflow and invalid bounds explicitly', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU is unavailable');
  const bounds = Array.from({length: 32}, () => ({minimum: [0, 0, 0], maximum: [1, 1, 1]}));
  const fixture = await makeFixture(
    device,
    [...bounds, {minimum: [NaN, 0, 0], maximum: [1, 1, 1]}],
    8
  );
  try {
    const result = await fixture.run();
    expect(result.diagnostics).toMatchObject({
      pairCount: 496,
      droppedPairs: 488,
      invalidBounds: 1,
      incompleteQueries: 0
    });
    expect(new Set(result.pairs).size).toBe(8);
  } finally {
    fixture.destroy();
  }
  const limited = await makeFixture(device, bounds, 512, 4);
  try {
    const result = await limited.run();
    expect(result.diagnostics.incompleteQueries).toBeGreaterThan(0);
    expect(result.diagnostics.candidateTests).toBeLessThanOrEqual(32 * 4);
  } finally {
    limited.destroy();
  }
}, 120000);

it('includes oversized and remote bounds without relying on integer cell coordinates', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU is unavailable');
  const bounds = [
    {minimum: [-1e8, -1e8, -1e8], maximum: [1e8, 1e8, 1e8]},
    {minimum: [0, 0, 0], maximum: [1, 1, 1]},
    {minimum: [1e8, 1e8, 1e8], maximum: [1e8 + 32, 1e8 + 32, 1e8 + 32]},
    {minimum: [1e8 + 16, 1e8 + 16, 1e8 + 16], maximum: [1e8 + 48, 1e8 + 48, 1e8 + 48]}
  ];
  const fixture = await makeFixture(device, bounds, 8);
  try {
    const result = await fixture.run();
    expect(result.pairs.sort()).toEqual(referencePairs(bounds).sort());
    expect(result.diagnostics.oversizedBounds).toBeGreaterThan(0);
    expect(result.diagnostics.droppedPairs + result.diagnostics.incompleteQueries).toBe(0);
  } finally {
    fixture.destroy();
  }
}, 120000);

function referencePairs(bounds: readonly Bounds[]): string[] {
  const pairs: string[] = [];
  for (let first = 0; first < bounds.length; first++)
    for (let second = first + 1; second < bounds.length; second++)
      if (
        bounds[first].minimum.every(
          (value, axis) =>
            value <= bounds[second].maximum[axis] &&
            bounds[first].maximum[axis] >= bounds[second].minimum[axis]
        )
      )
        pairs.push(`${first}:${second}`);
  return pairs;
}

async function makeFixture(
  device: Device,
  bounds: readonly Bounds[],
  capacity: number,
  maximumCandidateTestsPerQuery?: number,
  objectMetadata?: Uint32Array,
  bucketByteOffset?: number
) {
  const owned: Buffer[] = [];
  const allocate = (data: Float32Array | Uint32Array | number) => {
    const buffer = device.createBuffer({
      ...(typeof data === 'number' ? {byteLength: Math.max(8, data)} : {data}),
      usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST | Buffer.INDIRECT
    });
    owned.push(buffer);
    return buffer;
  };
  const minima = allocate(Float32Array.from(bounds.flatMap(bound => bound.minimum)));
  const maxima = allocate(Float32Array.from(bounds.flatMap(bound => bound.maximum)));
  const output = allocate(capacity * 8),
    diagnostics = allocate(32);
  const graph = new GPUCommandGraph(device);
  const minimumView = graph.createDataView(
    graph.importBuffer(
      {id: 'broad-phase-minima', byteLength: minima.byteLength, usage: Buffer.STORAGE},
      minima
    ),
    {format: 'float32x3', length: bounds.length}
  );
  const maximumView = graph.createDataView(
    graph.importBuffer(
      {id: 'broad-phase-maxima', byteLength: maxima.byteLength, usage: Buffer.STORAGE},
      maxima
    ),
    {format: 'float32x3', length: bounds.length}
  );
  const pairView = graph.createDataView(
    graph.importBuffer(
      {id: 'broad-phase-output', byteLength: output.byteLength, usage: Buffer.STORAGE},
      output
    ),
    {format: 'uint32x2', length: capacity}
  );
  const diagnosticView = graph.createDataView(
    graph.importBuffer(
      {id: 'broad-phase-diagnostics', byteLength: diagnostics.byteLength, usage: Buffer.STORAGE},
      diagnostics
    ),
    {format: 'uint32', length: 8}
  );
  const attributes = objectMetadata ? allocate(objectMetadata) : null;
  const attributeView = attributes
    ? graph.createDataView(
        graph.importBuffer(
          {id: 'broad-phase-attributes', byteLength: attributes.byteLength, usage: Buffer.STORAGE},
          attributes
        ),
        {format: 'uint32', length: bounds.length}
      )
    : undefined;
  const bucketLength =
    2 ** Math.ceil(Math.log2(Math.max(1, bounds.length * 2))) + bounds.length + 2;
  const bucketWords = new Uint32Array((bucketByteOffset ?? 0) / 4 + bucketLength);
  bucketWords.fill(0x12345678, 0, (bucketByteOffset ?? 0) / 4);
  const buckets = bucketByteOffset === undefined ? undefined : allocate(bucketWords);
  const schedulerWords = new Uint32Array(25);
  schedulerWords[0] = 1;
  schedulerWords.set([Math.ceil(bounds.length / 64), 1, 1], 8);
  const scheduler = buckets ? allocate(schedulerWords) : undefined;
  const broadPhase = new GPURigidBodyBroadPhase({
    ...(buckets && scheduler
      ? {
          partitionSize: bounds.length,
          activeInstances: graph.createDataView(
            graph.importBuffer(
              {
                id: 'scheduler',
                byteLength: scheduler.byteLength,
                usage: Buffer.STORAGE | Buffer.INDIRECT
              },
              scheduler
            ),
            {format: 'uint32', length: 25}
          ),
          bucketState: graph.createDataView(
            graph.importBuffer(
              {id: 'buckets', byteLength: buckets.byteLength, usage: Buffer.STORAGE},
              buckets
            ),
            {format: 'uint32', byteOffset: bucketByteOffset, length: bucketLength}
          )
        }
      : {}),
    objectMetadata: attributeView,
    minima: minimumView,
    maxima: maximumView,
    pairs: pairView,
    diagnostics: diagnosticView,
    maximumCandidateTestsPerQuery
  });
  addGPUCommandNodes(graph, broadPhase.getCommandNodes(graph));
  const compiled = await graph.compileAsync();
  return {
    minima,
    maxima,
    buckets,
    async run() {
      const encoder = device.createCommandEncoder();
      compiled.encode(encoder, {parameters: undefined});
      device.submit(encoder.finish());
      const counters = new Uint32Array((await diagnostics.readAsync()).buffer);
      const words = new Uint32Array((await output.readAsync()).buffer);
      return {
        diagnostics: decodeRigidBodyBroadPhaseDiagnostics(counters),
        pairs: Array.from(
          {length: Math.min(counters[0], capacity)},
          (_, index) => `${words[index * 2]}:${words[index * 2 + 1]}`
        )
      };
    },
    destroy() {
      compiled.destroy();
      for (const buffer of owned) buffer.destroy();
    }
  };
}

it('suppresses same-body and static/static pairs before consuming output capacity', async context => {
  const device = await getWebGPUTestDevice('core');
  if (!device) return context.skip('WebGPU is unavailable');
  const bounds = Array.from({length: 4}, () => ({minimum: [0, 0, 0], maximum: [1, 1, 1]}));
  const fixture = await makeFixture(
    device,
    bounds,
    4,
    undefined,
    new Uint32Array([0x10000, 0x10000, 1, 2])
  );
  try {
    const result = await fixture.run();
    expect(result.pairs.sort()).toEqual(['0:2', '0:3', '1:2', '1:3']);
    expect(result.diagnostics).toMatchObject({pairCount: 4, droppedPairs: 0, incompleteQueries: 0});
  } finally {
    fixture.destroy();
  }
}, 120000);

it('preserves bucket-view prefixes across initialization and sparse clearing', async context => {
  const device = await getWebGPUTestDevice('core');
  if (!device) return context.skip('WebGPU unavailable');
  const bounds = [
    {minimum: [0, 0, 0], maximum: [1, 1, 1]},
    {minimum: [0.5, 0, 0], maximum: [1.5, 1, 1]}
  ];
  const fixture = await makeFixture(device, bounds, 4, undefined, undefined, 12);
  try {
    for (let iteration = 0; iteration < 3; iteration++) {
      expect((await fixture.run()).pairs).toEqual(['0:1']);
      const words = new Uint32Array((await fixture.buckets!.readAsync()).buffer);
      expect(Array.from(words.slice(0, 3))).toEqual([0x12345678, 0x12345678, 0x12345678]);
    }
    fixture.minima.write(new Float32Array([10, 10, 10]), 12);
    fixture.maxima.write(new Float32Array([11, 11, 11]), 12);
    expect((await fixture.run()).pairs).toEqual([]);
  } finally {
    fixture.destroy();
  }
});
