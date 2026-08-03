// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {Buffer, type Device} from '@luma.gl/core';
import {
  GPUCommandGraph,
  GPUGridIndex,
  GPUGridIndexQuery,
  GPUPointSpatialFilter,
  GPUVisibilityWorkflow,
  type CompiledGPUCommandGraph,
  type GPUPointSpatialFilterKind,
  type GraphDataView
} from '@luma.gl/experimental';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';

test('GPUPointSpatialFilter gives indexed and unindexed 2D visibility the same exact result', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const fixture = createFixture(device, {
    positions: Float32Array.from([
      0.1, 0.1, 0.7, 0.7, 1.1, 0.4, 1.6, 0.6, 0.4, 1.4, 1.4, 1.4, 1.9, 1.9
    ]),
    dimension: 2,
    gridSize: [2, 2],
    bounds: [0, 0, 2, 2],
    kind: 'radius',
    query: Float32Array.from([0.5, 0.5, 0.48])
  });
  encode(device, fixture.compiled);

  t.deepEqual(await readVisible(fixture.indexed), [1], 'grid candidates are refined exactly');
  t.deepEqual(
    await readVisible(fixture.unindexed),
    [1],
    'the full scan provides the same exact visibility oracle'
  );
  t.deepEqual(
    await readUint32(fixture.candidateCount, 1),
    [2],
    'the broad phase visits only points in intersecting cells'
  );
  t.deepEqual(await readUint32(fixture.indexed.overflow, 1), [0]);

  fixture.query.write(Float32Array.from([1.5, 1.5, 0.6]));
  encode(device, fixture.compiled);
  t.deepEqual((await readVisible(fixture.indexed)).sort(sortNumbers), [5, 6]);
  t.deepEqual(
    (await readVisible(fixture.unindexed)).sort(sortNumbers),
    [5, 6],
    'query updates preserve indexed/unindexed equivalence without recompiling'
  );

  destroyFixture(fixture);
  t.end();
});

test('GPUPointSpatialFilter composes 3D bounds candidates with selection visibility', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const fixture = createFixture(device, {
    positions: Float32Array.from([
      0.2, 0.2, 0.2, 0.8, 0.8, 0.8, 1.1, 0.4, 0.4, 1.7, 0.7, 0.7, 0.4, 0.4, 1.4, 1.4, 1.4, 1.4
    ]),
    dimension: 3,
    gridSize: [2, 2, 2],
    bounds: [0, 0, 0, 2, 2, 2],
    kind: 'bounds',
    query: Float32Array.from([0, 0, 0, 1.2, 0.6, 0.6]),
    selection: Uint32Array.from([1, 1, 0, 1, 1, 1])
  });
  encode(device, fixture.compiled);

  t.deepEqual(await readVisible(fixture.indexed), [0], 'selection intersects exact spatial mask');
  t.deepEqual(await readVisible(fixture.unindexed), [0], '3D indexed and scan paths agree');
  t.deepEqual(
    await readUint32(fixture.indexed.mask, 6),
    [1, 0, 0, 0, 0, 0],
    'visibility publishes the composed canonical mask'
  );

  destroyFixture(fixture);
  t.end();
});

test('GPUPointSpatialFilter compares large radii without squared-distance overflow', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const fixture = createFixture(device, {
    positions: Float32Array.from([3e20, 0]),
    dimension: 2,
    gridSize: [1, 1],
    bounds: [0, -1, 4e20, 1],
    kind: 'radius',
    query: Float32Array.from([0, 0, 2e20])
  });
  encode(device, fixture.compiled);

  t.deepEqual(
    await readVisible(fixture.indexed),
    [],
    'indexed refinement rejects the distant point'
  );
  t.deepEqual(
    await readVisible(fixture.unindexed),
    [],
    'the exact full scan rejects inf-squared false positives'
  );

  destroyFixture(fixture);
  t.end();
});

type ResultBuffers = {
  ids: Buffer;
  count: Buffer;
  mask: Buffer;
  overflow: Buffer;
};

type Fixture = {
  compiled: CompiledGPUCommandGraph<void>;
  query: Buffer;
  candidateCount: Buffer;
  indexed: ResultBuffers;
  unindexed: ResultBuffers;
  buffers: Buffer[];
};

function createFixture(
  device: Device,
  props: {
    positions: Float32Array;
    dimension: 2 | 3;
    gridSize: readonly [number, number] | readonly [number, number, number];
    bounds:
      | readonly [number, number, number, number]
      | readonly [number, number, number, number, number, number];
    kind: GPUPointSpatialFilterKind;
    query: Float32Array;
    selection?: Uint32Array;
  }
): Fixture {
  const length = props.positions.length / props.dimension;
  const cellCount = props.gridSize.reduce((product, size) => product * size, 1);
  const positions = createInputBuffer(device, props.positions);
  const query = createInputBuffer(device, props.query);
  const selection = props.selection ? createInputBuffer(device, props.selection) : undefined;
  const cellOffsets = createOutputBuffer(device, cellCount + 1);
  const objectIds = createOutputBuffer(device, length);
  const indexCount = createOutputBuffer(device, 1);
  const indexOverflow = createOutputBuffer(device, 1);
  const candidateIds = createOutputBuffer(device, length);
  const candidateCount = createOutputBuffer(device, 1);
  const candidateOverflow = createOutputBuffer(device, 1);
  const indexed = createResultBuffers(device, length);
  const unindexed = createResultBuffers(device, length);
  const graph = new GPUCommandGraph(device, {id: 'point-spatial-filter-consumer'});

  const positionsView = importView(
    graph,
    'positions',
    positions,
    props.dimension === 2 ? 'float32x2' : 'float32x3',
    length
  );
  const queryView = importView(graph, 'query', query, 'float32', props.query.length);
  const index = new GPUGridIndex({
    positions: positionsView,
    gridSize: props.gridSize,
    bounds: props.bounds,
    cellOffsets: importView(graph, 'cell-offsets', cellOffsets, 'uint32', cellCount + 1),
    objectIds: importView(graph, 'object-ids', objectIds, 'uint32', length),
    count: importView(graph, 'index-count', indexCount, 'uint32', 1),
    overflow: importView(graph, 'index-overflow', indexOverflow, 'uint32', 1)
  });
  index.addToGraph(graph);

  const candidateIdsView = importView(graph, 'candidate-ids', candidateIds, 'uint32', length);
  const candidateCountView = importView(graph, 'candidate-count', candidateCount, 'uint32', 1);
  const candidateOverflowView = importView(
    graph,
    'candidate-overflow',
    candidateOverflow,
    'uint32',
    1
  );
  new GPUGridIndexQuery({
    index,
    kind: props.kind,
    query: queryView,
    output: candidateIdsView,
    count: candidateCountView,
    overflow: candidateOverflowView
  }).addToGraph(graph);

  addFilterAndVisibility(graph, {
    id: 'indexed',
    positions: positionsView,
    kind: props.kind,
    query: queryView,
    result: indexed,
    length,
    selection,
    candidates: {
      ids: candidateIdsView,
      count: candidateCountView,
      overflow: candidateOverflowView
    }
  });
  addFilterAndVisibility(graph, {
    id: 'unindexed',
    positions: positionsView,
    kind: props.kind,
    query: queryView,
    result: unindexed,
    length,
    selection
  });

  const buffers = [
    positions,
    query,
    ...(selection ? [selection] : []),
    cellOffsets,
    objectIds,
    indexCount,
    indexOverflow,
    candidateIds,
    candidateCount,
    candidateOverflow,
    ...Object.values(indexed),
    ...Object.values(unindexed)
  ];
  return {compiled: graph.compile(), query, candidateCount, indexed, unindexed, buffers};
}

function addFilterAndVisibility(
  graph: GPUCommandGraph,
  props: {
    id: string;
    positions: GraphDataView<'float32x2'> | GraphDataView<'float32x3'>;
    kind: GPUPointSpatialFilterKind;
    query: GraphDataView<'float32'>;
    result: ResultBuffers;
    length: number;
    selection?: Buffer;
    candidates?: {
      ids: GraphDataView<'uint32'>;
      count: GraphDataView<'uint32'>;
      overflow: GraphDataView<'uint32'>;
    };
  }
): void {
  const exactMaskBuffer = graph.createTransientBuffer({
    id: `${props.id}-exact-mask`,
    byteLength: Math.max(props.length, 1) * Uint32Array.BYTES_PER_ELEMENT,
    usage: Buffer.STORAGE
  });
  const exactMask = graph.createDataView(exactMaskBuffer, {format: 'uint32', length: props.length});
  const outputMask = importView(
    graph,
    `${props.id}-output-mask`,
    props.result.mask,
    'uint32',
    props.length
  );
  const overflow = importView(graph, `${props.id}-overflow`, props.result.overflow, 'uint32', 1);
  new GPUPointSpatialFilter({
    id: `${props.id}-point-filter`,
    positions: props.positions,
    kind: props.kind,
    query: props.query,
    outputMask: exactMask,
    overflow,
    candidates: props.candidates
  }).addToGraph(graph);

  const predicates = [{kind: 'bounds' as const, mask: exactMask}];
  if (props.selection) {
    predicates.push({
      kind: 'selection',
      mask: importView(graph, `${props.id}-selection`, props.selection, 'uint32', props.length)
    });
  }
  new GPUVisibilityWorkflow({
    id: `${props.id}-visibility`,
    predicates,
    output: importView(graph, `${props.id}-visible-ids`, props.result.ids, 'uint32', props.length),
    count: importView(graph, `${props.id}-visible-count`, props.result.count, 'uint32', 1),
    outputMask
  }).addToGraph(graph);
}

function createResultBuffers(device: Device, length: number): ResultBuffers {
  return {
    ids: createOutputBuffer(device, length),
    count: createOutputBuffer(device, 1),
    mask: createOutputBuffer(device, length),
    overflow: createOutputBuffer(device, 1)
  };
}

function createInputBuffer(device: Device, values: Float32Array | Uint32Array): Buffer {
  return device.createBuffer({data: values, usage: Buffer.STORAGE | Buffer.COPY_DST});
}

function createOutputBuffer(device: Device, length: number): Buffer {
  return device.createBuffer({
    byteLength: Math.max(length, 1) * Uint32Array.BYTES_PER_ELEMENT,
    usage: Buffer.STORAGE | Buffer.COPY_SRC
  });
}

function importView<T extends 'float32x2' | 'float32x3' | 'float32' | 'uint32'>(
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

async function readVisible(result: ResultBuffers): Promise<number[]> {
  const count = (await readUint32(result.count, 1))[0];
  return readUint32(result.ids, count);
}

async function readUint32(buffer: Buffer, length: number): Promise<number[]> {
  const bytes = await buffer.readAsync();
  return Array.from(new Uint32Array(bytes.buffer, bytes.byteOffset, length));
}

function encode(device: Device, compiled: CompiledGPUCommandGraph<void>): void {
  const commandEncoder = device.createCommandEncoder({id: 'point-spatial-filter-test'});
  compiled.encode(commandEncoder, {parameters: undefined});
  device.submit(commandEncoder.finish());
}

function destroyFixture(fixture: Fixture): void {
  fixture.compiled.destroy();
  for (const buffer of fixture.buffers) buffer.destroy();
}

function sortNumbers(left: number, right: number): number {
  return left - right;
}
