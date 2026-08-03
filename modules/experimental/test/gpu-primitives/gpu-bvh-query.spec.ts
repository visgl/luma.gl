// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {Buffer, type Device} from '@luma.gl/core';
import {
  GPUBVH,
  GPUBVHQuery,
  GPUCommandGraph,
  type CompiledGPUCommandGraph,
  type GraphDataView
} from '@luma.gl/experimental';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';

test('GPUBVHQuery traverses 2D bounds and clears reusable result masks', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const fixture = createFixture(device, {
    dimension: 2,
    minima: Float32Array.from([0, 0, 2, 0, 10, 10, 12, 10]),
    maxima: Float32Array.from([1, 1, 3, 1, 11, 11, 13, 11]),
    query: Float32Array.from([-0.5, -0.5, 3.5, 1.5]),
    kind: 'bounds',
    leafCapacity: 4,
    outputCapacity: 4,
    maskLength: 4
  });
  encode(device, fixture.compiled);

  t.deepEqual(await readSortedOutput(fixture), [0, 1], 'bounds query matches the CPU oracle');
  t.deepEqual(await readUint32(fixture.outputMask, 4), [1, 1, 0, 0]);
  t.deepEqual(await readUint32(fixture.overflow, 1), [0]);
  t.deepEqual(await readUint32(fixture.visitedCount, 1), [5], 'the disjoint subtree is pruned');

  fixture.query.write(Float32Array.from([11.5, 9.5, 13.5, 11.5]));
  encode(device, fixture.compiled);
  t.deepEqual(await readSortedOutput(fixture), [3], 'the same graph accepts a new query');
  t.deepEqual(await readUint32(fixture.outputMask, 4), [0, 0, 0, 1], 'old mask bits clear');

  destroyFixture(fixture);
  t.end();
});

test('GPUBVHQuery traverses 3D points and reports bounded-output overflow', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const fixture = createFixture(device, {
    dimension: 3,
    minima: Float32Array.from([0, 0, 0, 1, 1, 1, -2, -2, -2, 10, 10, 10, 100, 100, 100]),
    maxima: Float32Array.from([2, 2, 2, 3, 3, 3, -1, -1, -1, 11, 11, 11, 101, 101, 101]),
    query: Float32Array.from([1.5, 1.5, 1.5]),
    kind: 'point',
    leafCapacity: 4,
    outputCapacity: 1,
    maskLength: 4
  });
  encode(device, fixture.compiled);

  t.deepEqual(await readUint32(fixture.count, 1), [2], 'count is the complete CPU-oracle result');
  t.deepEqual(
    await readUint32(fixture.overflow, 1),
    [1],
    'source or output truncation is explicit'
  );
  const storedOutput = await readUint32(fixture.output, 1);
  t.ok(storedOutput[0] === 0 || storedOutput[0] === 1, 'one matching stable ID is stored');
  const outputMask = await readUint32(fixture.outputMask, 4);
  t.equal(
    outputMask.reduce((sum, value) => sum + value, 0),
    1,
    'mask describes stored output'
  );
  t.equal(outputMask[storedOutput[0]], 1);

  fixture.query.write(Float32Array.from([Number.NaN, 0, 0]));
  encode(device, fixture.compiled);
  t.deepEqual(await readUint32(fixture.count, 1), [0], 'non-finite queries match nothing');
  t.deepEqual(await readUint32(fixture.overflow, 1), [1], 'source BVH overflow is propagated');
  t.deepEqual(await readUint32(fixture.outputMask, 4), [0, 0, 0, 0]);

  destroyFixture(fixture);
  t.end();
});

test('GPUBVHQuery preserves maximum stable IDs and rejects overlapping views', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const fixture = createFixture(device, {
    dimension: 2,
    minima: Float32Array.from([0, 0]),
    maxima: Float32Array.from([1, 1]),
    sourceIds: Uint32Array.of(0xffffffff),
    query: Float32Array.from([0.5, 0.5]),
    kind: 'point',
    leafCapacity: 2,
    outputCapacity: 2,
    maskLength: 2
  });
  encode(device, fixture.compiled);
  t.deepEqual(await readSortedOutput(fixture), [0xffffffff], 'the full uint32 ID range survives');
  t.deepEqual(await readUint32(fixture.count, 1), [1], 'invalid empty leaves remain excluded');

  const query = fixture.workflow;
  t.throws(
    () =>
      new GPUBVHQuery({
        bvh: query.bvh,
        kind: query.kind,
        query: query.query,
        output: query.bvh.leafIds,
        count: query.count,
        overflow: query.overflow
      }),
    /must not overlap query or BVH inputs/,
    'stable leaf IDs cannot alias writable output'
  );
  t.throws(
    () =>
      new GPUBVHQuery({
        bvh: query.bvh,
        kind: query.kind,
        query: query.query,
        output: query.output,
        count: query.count,
        overflow: query.count
      }),
    /must not overlap one another/,
    'count and overflow require independent writable storage'
  );

  destroyFixture(fixture);
  t.end();
});

type Fixture = {
  compiled: CompiledGPUCommandGraph<void>;
  workflow: GPUBVHQuery;
  query: Buffer;
  output: Buffer;
  count: Buffer;
  overflow: Buffer;
  outputMask: Buffer;
  visitedCount: Buffer;
  buffers: Buffer[];
};

function createFixture(
  device: Device,
  props: {
    dimension: 2 | 3;
    minima: Float32Array;
    maxima: Float32Array;
    sourceIds?: Uint32Array;
    query: Float32Array;
    kind: 'point' | 'bounds';
    leafCapacity: number;
    outputCapacity: number;
    maskLength: number;
  }
): Fixture {
  const format = props.dimension === 2 ? 'float32x2' : 'float32x3';
  const sourceLength = props.minima.length / props.dimension;
  const nodeCount = props.leafCapacity * 2 - 1;
  const minima = createInputBuffer(device, props.minima);
  const maxima = createInputBuffer(device, props.maxima);
  const sourceIds = props.sourceIds ? createInputBuffer(device, props.sourceIds) : undefined;
  const query = createInputBuffer(device, props.query);
  const nodeMinima = createFloatOutputBuffer(device, nodeCount * props.dimension);
  const nodeMaxima = createFloatOutputBuffer(device, nodeCount * props.dimension);
  const children = createUintOutputBuffer(device, nodeCount * 2);
  const leafIds = createUintOutputBuffer(device, props.leafCapacity);
  const bvhCount = createUintOutputBuffer(device, 1);
  const bvhOverflow = createUintOutputBuffer(device, 1);
  const output = createUintOutputBuffer(device, props.outputCapacity);
  const count = createUintOutputBuffer(device, 1);
  const overflow = createUintOutputBuffer(device, 1);
  const outputMask = createUintOutputBuffer(device, props.maskLength);
  const visitedCount = createUintOutputBuffer(device, 1);
  const graph = new GPUCommandGraph(device, {id: 'bvh-query-test'});
  const bvh = new GPUBVH({
    id: 'test-bvh',
    minima: importView(graph, 'source-minima', minima, format, sourceLength),
    maxima: importView(graph, 'source-maxima', maxima, format, sourceLength),
    ...(sourceIds
      ? {sourceIds: importView(graph, 'source-ids', sourceIds, 'uint32', sourceLength)}
      : {}),
    leafCapacity: props.leafCapacity,
    nodeMinima: importView(graph, 'node-minima', nodeMinima, format, nodeCount),
    nodeMaxima: importView(graph, 'node-maxima', nodeMaxima, format, nodeCount),
    nodeChildren: importView(graph, 'node-children', children, 'uint32x2', nodeCount),
    leafIds: importView(graph, 'leaf-ids', leafIds, 'uint32', props.leafCapacity),
    count: importView(graph, 'bvh-count', bvhCount, 'uint32', 1),
    overflow: importView(graph, 'bvh-overflow', bvhOverflow, 'uint32', 1)
  });
  bvh.addToGraph(graph);
  const bvhQuery = new GPUBVHQuery({
    id: 'test-bvh-query',
    bvh,
    kind: props.kind,
    query: importView(graph, 'query', query, 'float32', props.query.length),
    output: importView(graph, 'output', output, 'uint32', props.outputCapacity),
    count: importView(graph, 'query-count', count, 'uint32', 1),
    overflow: importView(graph, 'query-overflow', overflow, 'uint32', 1),
    outputMask: importView(graph, 'output-mask', outputMask, 'uint32', props.maskLength),
    visitedCount: importView(graph, 'visited-count', visitedCount, 'uint32', 1)
  });
  bvhQuery.addToGraph(graph);
  return {
    compiled: graph.compile(),
    workflow: bvhQuery,
    query,
    output,
    count,
    overflow,
    outputMask,
    visitedCount,
    buffers: [
      minima,
      maxima,
      ...(sourceIds ? [sourceIds] : []),
      query,
      nodeMinima,
      nodeMaxima,
      children,
      leafIds,
      bvhCount,
      bvhOverflow,
      output,
      count,
      overflow,
      outputMask,
      visitedCount
    ]
  };
}

function createInputBuffer(device: Device, data: Float32Array | Uint32Array): Buffer {
  return device.createBuffer({data, usage: Buffer.STORAGE | Buffer.COPY_DST});
}

function createFloatOutputBuffer(device: Device, length: number): Buffer {
  return device.createBuffer({
    byteLength: Math.max(length, 1) * Float32Array.BYTES_PER_ELEMENT,
    usage: Buffer.STORAGE | Buffer.COPY_SRC
  });
}

function createUintOutputBuffer(device: Device, length: number): Buffer {
  return device.createBuffer({
    byteLength: Math.max(length, 1) * Uint32Array.BYTES_PER_ELEMENT,
    usage: Buffer.STORAGE | Buffer.COPY_SRC
  });
}

function importView<T extends 'float32' | 'float32x2' | 'float32x3' | 'uint32x2' | 'uint32'>(
  graph: GPUCommandGraph,
  id: string,
  buffer: Buffer,
  format: T,
  length: number
): GraphDataView<T> {
  const handle = graph.importBuffer(
    {id, byteLength: buffer.byteLength, usage: buffer.usage},
    buffer
  );
  return graph.createDataView(handle, {format, length});
}

async function readSortedOutput(fixture: Fixture): Promise<number[]> {
  const [count] = await readUint32(fixture.count, 1);
  return (await readUint32(fixture.output, count)).sort((left, right) => left - right);
}

async function readUint32(buffer: Buffer, length: number): Promise<number[]> {
  const bytes = await buffer.readAsync();
  return Array.from(new Uint32Array(bytes.buffer, bytes.byteOffset, length));
}

function encode(device: Device, compiled: CompiledGPUCommandGraph<void>): void {
  const commandEncoder = device.createCommandEncoder({id: 'bvh-query-test'});
  compiled.encode(commandEncoder, {parameters: undefined});
  device.submit(commandEncoder.finish());
}

function destroyFixture(fixture: Fixture): void {
  fixture.compiled.destroy();
  for (const buffer of fixture.buffers) buffer.destroy();
}
