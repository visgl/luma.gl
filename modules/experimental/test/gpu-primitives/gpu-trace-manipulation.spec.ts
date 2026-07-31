// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {Buffer, type Device} from '@luma.gl/core';
import {
  GPUAncestorProjection,
  GPUCommandGraph,
  GPUGraphTraversal,
  GPUHierarchyLayout,
  GPUMask,
  type GPUGraphTraversalDirection,
  type GPUMaskOperation
} from '@luma.gl/experimental';
import {GPUData, GPUVector} from '@luma.gl/tables';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';

test('GPUMask composes canonical GPU selection masks', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const first = Uint32Array.from([0, 1, 2, 0, 9, 1]);
  const second = Uint32Array.from([0, 1, 0, 8, 3, 0]);
  const third = Uint32Array.from([0, 0, 1, 1, 7, 1]);
  t.deepEqual(
    await runMask(device, [first, second], 'and'),
    [0, 1, 0, 0, 1, 0],
    'intersection treats every nonzero input as true'
  );
  t.deepEqual(
    await runMask(device, [first, second], 'or'),
    [0, 1, 1, 1, 1, 1],
    'union writes canonical zero and one values'
  );
  t.deepEqual(
    await runMask(device, [first, second, third], 'xor'),
    [0, 0, 0, 0, 1, 0],
    'exclusive union supports more than two masks'
  );
  t.deepEqual(
    await runMask(device, [first, second, third], 'difference'),
    [0, 0, 0, 0, 0, 0],
    'difference excludes every later matching input'
  );
  t.deepEqual(
    await runMask(device, [first], 'not'),
    [1, 0, 0, 1, 0, 0],
    'inversion canonicalizes nonzero values'
  );
  t.deepEqual(await runMask(device, [new Uint32Array(0)], 'and'), [], 'empty masks add no work');
  t.end();
});

test('GPUMask preserves imported GPUVector chunk boundaries', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const firstChunks = [Uint32Array.from([1, 0, 9]), new Uint32Array(0), Uint32Array.from([0, 2])];
  const secondChunks = [Uint32Array.from([1, 1, 0]), new Uint32Array(0), Uint32Array.from([8, 1])];
  const first = createVectorFixture(device, 'first', firstChunks, false);
  const second = createVectorFixture(device, 'second', secondChunks, false);
  const output = createVectorFixture(device, 'output', firstChunks, true);
  const graph = new GPUCommandGraph(device, {id: 'chunked-mask'});
  const firstView = graph.importGPUVector('first', first.vector);
  const secondView = graph.importGPUVector('second', second.vector);
  const outputView = graph.importGPUVector('output', output.vector);
  new GPUMask({inputs: [firstView, secondView], output: outputView}).addToGraph(graph);
  const compiled = graph.compile();
  submitGraph(device, compiled, 'chunked-mask');
  t.deepEqual(
    await Promise.all(
      output.buffers.map((buffer, index) => readUint32(buffer, firstChunks[index].length))
    ),
    [[1, 0, 0], [], [0, 1]],
    'each existing chunk receives only its source-aligned selected rows'
  );
  t.deepEqual(
    compiled.stats.nodeOrder,
    ['gpu-mask-chunk-0', 'gpu-mask-chunk-2'],
    'empty chunks preserve their identity without generating a dispatch'
  );
  compiled.destroy();
  destroyVectorFixture(first);
  destroyVectorFixture(second);
  destroyVectorFixture(output);
  t.end();
});

test('GPUHierarchyLayout scans live parent and child expansion states', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  t.deepEqual(
    await runHierarchyLayout(device, Uint32Array.from([1, 0]), Uint32Array.from([1, 0, 1, 1]), 2),
    {heights: [4, 1, 1, 0], offsets: [0, 4, 5, 6]},
    'expanded children and collapsed parent summaries receive stable scanned row offsets'
  );
  t.deepEqual(
    await runHierarchyLayout(device, Uint32Array.from([1, 1]), Uint32Array.from([1, 0, 0, 1]), 2),
    {heights: [4, 1, 1, 4], offsets: [0, 4, 5, 6]},
    'individually collapsed children retain one row while expanded children retain four'
  );
  t.deepEqual(
    await runHierarchyLayout(device, new Uint32Array(0), new Uint32Array(0), 2),
    {heights: [], offsets: []},
    'an empty hierarchy adds no scan or dispatch'
  );
  t.end();
});

test('GPUGraphTraversal expands outgoing, incoming, and bidirectional frontiers', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  t.deepEqual(
    await runTraversal(device, {seeds: [0], maxDepth: 0}),
    [1, 0, 0, 0, 0, 0],
    'zero-hop traversal preserves the selected seed'
  );
  t.deepEqual(
    await runTraversal(device, {seeds: [0], maxDepth: 1}),
    [1, 1, 1, 0, 0, 0],
    'one-hop traversal returns direct outgoing neighbors'
  );
  t.deepEqual(
    await runTraversal(device, {seeds: [0], maxDepth: 3}),
    [1, 1, 1, 1, 1, 0],
    'multi-hop traversal handles cycles and shared descendants'
  );
  t.deepEqual(
    await runTraversal(device, {seeds: [3], maxDepth: 1, direction: 'incoming'}),
    [0, 1, 1, 1, 0, 0],
    'reverse CSR returns direct incoming dependencies'
  );
  t.deepEqual(
    await runTraversal(device, {seeds: [1], maxDepth: 1, direction: 'both'}),
    [1, 1, 1, 1, 0, 0],
    'bidirectional traversal combines parents and children in the same frontier'
  );
  t.deepEqual(
    await runTraversal(device, {seeds: [0, 99, 5], maxDepth: 1}),
    [1, 1, 1, 0, 0, 1],
    'multiple seeds are retained while out-of-range references are ignored'
  );
  t.end();
});

test('GPUGraphTraversal reads dynamic seed counts and traversal depth', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  t.deepEqual(
    await runTraversal(device, {
      seeds: [0, 5],
      activeSeedCount: 1,
      maxDepth: 3,
      activeDepth: 1
    }),
    [1, 1, 1, 0, 0, 0],
    'GPU-resident counts restrict both seed selection and traversal depth'
  );
  t.deepEqual(
    await runTraversal(device, {
      seeds: [0, 5],
      activeSeedCount: 0,
      maxDepth: 3,
      activeDepth: 2
    }),
    [0, 0, 0, 0, 0, 0],
    'zero active seeds clear every previously selected node'
  );
  t.end();
});

test('GPUAncestorProjection reconnects visible nodes across hidden parent chains', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const invalid = 0xffffffff;
  t.deepEqual(
    await runAncestorProjection(
      device,
      Uint32Array.from([invalid, 0, 1, 2, 3, 4]),
      Uint32Array.from([1, 0, 1, 0, 0, 1]),
      8
    ),
    [0, 0, 2, 2, 2, 5],
    'visible records project to themselves and filtered records select the nearest visible parent'
  );
  t.deepEqual(
    await runAncestorProjection(
      device,
      Uint32Array.from([invalid, 0, 1, 2, 3, 4]),
      Uint32Array.from([1, 0, 1, 0, 0, 1]),
      1
    ),
    [0, 0, 2, 2, invalid, 5],
    'depth-bounded projection rejects unresolved hidden-parent chains'
  );
  t.deepEqual(
    await runAncestorProjection(
      device,
      Uint32Array.from([1, 0, 99]),
      Uint32Array.from([0, 0, 0]),
      6
    ),
    [invalid, invalid, invalid],
    'cycles and out-of-range parents resolve to the sentinel'
  );
  t.deepEqual(
    await runAncestorProjection(device, new Uint32Array(0), new Uint32Array(0), 4),
    [],
    'empty parent mappings do not dispatch'
  );
  t.end();
});

test('GPU trace-manipulation primitives reject incompatible views', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const graph = new GPUCommandGraph(device, {id: 'trace-manipulation-validation'});
  const firstHandle = graph.createTransientBuffer({
    id: 'first',
    byteLength: 32,
    usage: Buffer.STORAGE
  });
  const secondHandle = graph.createTransientBuffer({
    id: 'second',
    byteLength: 32,
    usage: Buffer.STORAGE
  });
  const first = graph.createDataView(firstHandle, {format: 'uint32', length: 4});
  const second = graph.createDataView(secondHandle, {format: 'uint32', length: 4});
  const short = graph.createDataView(secondHandle, {format: 'uint32', length: 2});
  t.throws(
    () => new GPUMask({inputs: [], output: second}),
    /at least one input/,
    'mask composition requires an input'
  );
  t.throws(
    () => new GPUMask({inputs: [first, first], output: second, operation: 'not'}),
    /exactly one input/,
    'inversion rejects ambiguous source masks'
  );
  t.throws(
    () => new GPUMask({inputs: [first], output: first}),
    /separate buffers/,
    'read-write mask aliases are rejected'
  );
  t.throws(
    () => new GPUMask({inputs: [first], output: short}),
    /length/,
    'mask composition requires matching row counts'
  );
  t.throws(
    () =>
      new GPUHierarchyLayout({
        parentStates: short,
        childStates: first,
        heights: second,
        offsets: first,
        childrenPerParent: 0
      }),
    /positive/,
    'hierarchy layout requires a positive child grouping'
  );
  t.throws(
    () =>
      new GPUHierarchyLayout({
        parentStates: short,
        childStates: first,
        heights: second,
        offsets: first,
        childrenPerParent: 3
      }),
    /parent count/,
    'hierarchy layout requires complete source-aligned child groups'
  );
  t.throws(
    () => new GPUGraphTraversal({offsets: short, neighbors: first, seeds: first, output: second}),
    /one more row/,
    'CSR offsets must describe every output node'
  );
  const offsets = graph.createDataView(firstHandle, {format: 'uint32', length: 5});
  t.throws(
    () =>
      new GPUGraphTraversal({
        offsets,
        neighbors: first,
        seeds: first,
        output: second,
        direction: 'both'
      }),
    /reverse adjacency/,
    'bidirectional traversal requires reverse CSR'
  );
  t.throws(
    () =>
      new GPUGraphTraversal({
        offsets,
        neighbors: first,
        seeds: first,
        output: second,
        maxDepth: -1
      }),
    /nonnegative/,
    'negative traversal depth is rejected'
  );
  t.throws(
    () =>
      new GPUGraphTraversal({
        offsets,
        neighbors: first,
        seeds: first,
        output: second,
        maxDepth: 1025
      }),
    /at most 1024/,
    'traversal depth is bounded before graph-node expansion'
  );
  t.throws(
    () =>
      new GPUGraphTraversal({
        offsets,
        neighbors: first,
        seeds: first,
        output: second,
        maxDepth: 0x100000000
      }),
    /at most 1024/,
    'traversal depth cannot reach an unrepresentable WGSL literal'
  );
  t.throws(
    () => new GPUAncestorProjection({parents: first, visibility: short, output: second}),
    /matching lengths/,
    'ancestor projection requires source-aligned masks'
  );
  t.throws(
    () => new GPUAncestorProjection({parents: first, visibility: second, output: second}),
    /separate buffer/,
    'ancestor projection rejects writable input aliases'
  );
  t.throws(
    () =>
      new GPUAncestorProjection({parents: first, visibility: first, output: second, maxDepth: -1}),
    /nonnegative/,
    'ancestor projection rejects negative depth'
  );
  t.throws(
    () =>
      new GPUAncestorProjection({
        parents: first,
        visibility: first,
        output: second,
        maxDepth: 0x100000000
      }),
    /uint32/,
    'ancestor projection rejects depth constants that WGSL cannot represent'
  );
  t.end();
});

async function runHierarchyLayout(
  device: Device,
  parentStates: Uint32Array,
  childStates: Uint32Array,
  childrenPerParent: number
): Promise<{heights: number[]; offsets: number[]}> {
  const parentBuffer = createUint32Buffer(device, parentStates, false);
  const childBuffer = createUint32Buffer(device, childStates, false);
  const heightsBuffer = createUint32Buffer(device, new Uint32Array(childStates.length), true);
  const offsetsBuffer = createUint32Buffer(device, new Uint32Array(childStates.length), true);
  const graph = new GPUCommandGraph(device, {id: 'hierarchy-layout-test'});
  new GPUHierarchyLayout({
    parentStates: importUint32View(graph, 'parents', parentBuffer, parentStates.length),
    childStates: importUint32View(graph, 'children', childBuffer, childStates.length),
    heights: importUint32View(graph, 'heights', heightsBuffer, childStates.length),
    offsets: importUint32View(graph, 'offsets', offsetsBuffer, childStates.length),
    childrenPerParent,
    expandedChildHeight: 4
  }).addToGraph(graph);
  const compiled = graph.compile();
  submitGraph(device, compiled, 'hierarchy-layout-test');
  const [heights, offsets] = await Promise.all([
    readUint32(heightsBuffer, childStates.length),
    readUint32(offsetsBuffer, childStates.length)
  ]);
  compiled.destroy();
  parentBuffer.destroy();
  childBuffer.destroy();
  heightsBuffer.destroy();
  offsetsBuffer.destroy();
  return {heights, offsets};
}

async function runAncestorProjection(
  device: Device,
  parents: Uint32Array,
  visibility: Uint32Array,
  maxDepth: number
): Promise<number[]> {
  const parentBuffer = createUint32Buffer(device, parents, false);
  const visibilityBuffer = createUint32Buffer(device, visibility, false);
  const outputBuffer = createUint32Buffer(device, new Uint32Array(parents.length), true);
  const graph = new GPUCommandGraph(device, {id: 'ancestor-projection-test'});
  new GPUAncestorProjection({
    parents: importUint32View(graph, 'parents', parentBuffer, parents.length),
    visibility: importUint32View(graph, 'visibility', visibilityBuffer, visibility.length),
    output: importUint32View(graph, 'output', outputBuffer, parents.length),
    maxDepth
  }).addToGraph(graph);
  const compiled = graph.compile();
  submitGraph(device, compiled, 'ancestor-projection-test');
  const result = await readUint32(outputBuffer, parents.length);
  compiled.destroy();
  parentBuffer.destroy();
  visibilityBuffer.destroy();
  outputBuffer.destroy();
  return result;
}

async function runMask(
  device: Device,
  inputs: readonly Uint32Array[],
  operation: GPUMaskOperation
): Promise<number[]> {
  const length = inputs[0].length;
  const inputBuffers = inputs.map(values => createUint32Buffer(device, values, false));
  const outputBuffer = createUint32Buffer(device, new Uint32Array(length), true);
  const graph = new GPUCommandGraph(device, {id: 'mask-' + operation});
  const inputViews = inputBuffers.map((buffer, index) =>
    importUint32View(graph, 'input-' + index, buffer, length)
  );
  const output = importUint32View(graph, 'output', outputBuffer, length);
  new GPUMask({inputs: inputViews, output, operation}).addToGraph(graph);
  const compiled = graph.compile();
  submitGraph(device, compiled, 'mask-' + operation);
  const result = await readUint32(outputBuffer, length);
  compiled.destroy();
  for (const buffer of inputBuffers) {
    buffer.destroy();
  }
  outputBuffer.destroy();
  return result;
}

async function runTraversal(
  device: Device,
  props: {
    seeds: readonly number[];
    maxDepth: number;
    direction?: GPUGraphTraversalDirection;
    activeSeedCount?: number;
    activeDepth?: number;
  }
): Promise<number[]> {
  const offsets = Uint32Array.from([0, 2, 4, 6, 7, 7, 7]);
  const neighbors = Uint32Array.from([1, 2, 2, 3, 0, 3, 4]);
  const reverseOffsets = Uint32Array.from([0, 1, 2, 4, 6, 7, 7]);
  const reverseNeighbors = Uint32Array.from([2, 0, 0, 1, 1, 2, 3]);
  const nodeCount = offsets.length - 1;
  const graph = new GPUCommandGraph(device, {id: 'graph-traversal-test'});
  const buffers = {
    offsets: createUint32Buffer(device, offsets, false),
    neighbors: createUint32Buffer(device, neighbors, false),
    reverseOffsets: createUint32Buffer(device, reverseOffsets, false),
    reverseNeighbors: createUint32Buffer(device, reverseNeighbors, false),
    seeds: createUint32Buffer(device, Uint32Array.from(props.seeds), false),
    output: createUint32Buffer(device, new Uint32Array(nodeCount), true),
    ...(props.activeSeedCount === undefined
      ? {}
      : {
          seedCount: createUint32Buffer(device, Uint32Array.from([props.activeSeedCount]), false)
        }),
    ...(props.activeDepth === undefined
      ? {}
      : {activeDepth: createUint32Buffer(device, Uint32Array.from([props.activeDepth]), false)})
  };
  new GPUGraphTraversal({
    offsets: importUint32View(graph, 'offsets', buffers.offsets, offsets.length),
    neighbors: importUint32View(graph, 'neighbors', buffers.neighbors, neighbors.length),
    reverseOffsets: importUint32View(
      graph,
      'reverse-offsets',
      buffers.reverseOffsets,
      reverseOffsets.length
    ),
    reverseNeighbors: importUint32View(
      graph,
      'reverse-neighbors',
      buffers.reverseNeighbors,
      reverseNeighbors.length
    ),
    seeds: importUint32View(graph, 'seeds', buffers.seeds, props.seeds.length),
    ...(buffers.seedCount
      ? {seedCount: importUint32View(graph, 'seed-count', buffers.seedCount, 1)}
      : {}),
    ...(buffers.activeDepth
      ? {activeDepth: importUint32View(graph, 'active-depth', buffers.activeDepth, 1)}
      : {}),
    output: importUint32View(graph, 'output', buffers.output, nodeCount),
    direction: props.direction,
    maxDepth: props.maxDepth
  }).addToGraph(graph);
  const compiled = graph.compile();
  submitGraph(device, compiled, 'graph-traversal-test');
  const result = await readUint32(buffers.output, nodeCount);
  compiled.destroy();
  for (const buffer of Object.values(buffers)) {
    buffer.destroy();
  }
  return result;
}

type Uint32VectorFixture = {
  vector: GPUVector<'uint32'>;
  buffers: Buffer[];
};

function createVectorFixture(
  device: Device,
  name: string,
  chunks: readonly Uint32Array[],
  readable: boolean
): Uint32VectorFixture {
  const buffers = chunks.map(chunk =>
    createUint32Buffer(device, readable ? new Uint32Array(chunk.length) : chunk, readable)
  );
  return {
    buffers,
    vector: new GPUVector({
      type: 'data',
      name,
      format: 'uint32',
      data: buffers.map(
        (buffer, index) =>
          new GPUData({
            buffer,
            format: 'uint32',
            length: chunks[index].length,
            ownsBuffer: false
          })
      ),
      ownsData: false
    })
  };
}

function destroyVectorFixture(fixture: Uint32VectorFixture): void {
  fixture.vector.destroy();
  for (const buffer of fixture.buffers) {
    buffer.destroy();
  }
}

function createUint32Buffer(device: Device, values: Uint32Array, readable: boolean): Buffer {
  return device.createBuffer({
    data: values.length > 0 ? values : new Uint32Array(1),
    usage: Buffer.STORAGE | Buffer.COPY_DST | (readable ? Buffer.COPY_SRC : 0)
  });
}

function importUint32View(graph: GPUCommandGraph, id: string, buffer: Buffer, length: number) {
  const handle = graph.importBuffer(
    {id, byteLength: buffer.byteLength, usage: buffer.usage},
    buffer
  );
  return graph.createDataView(handle, {format: 'uint32', length});
}

function submitGraph(
  device: Device,
  compiled: ReturnType<GPUCommandGraph['compile']>,
  id: string
): void {
  const encoder = device.createCommandEncoder({id});
  compiled.encode(encoder, {parameters: undefined});
  device.submit(encoder.finish());
}

async function readUint32(buffer: Buffer, length: number): Promise<number[]> {
  if (length === 0) {
    return [];
  }
  const bytes = await buffer.readAsync();
  return Array.from(new Uint32Array(bytes.buffer, bytes.byteOffset, length));
}
