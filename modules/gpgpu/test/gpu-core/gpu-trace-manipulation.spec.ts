// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {Buffer, type Device} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import {
  GPUAncestorProjection,
  GPUCommandGraph,
  GPUGraphTraversal,
  GPUHierarchyLayout,
  GPUMask,
  type GPUGraphTraversalDirection,
  type GPUMaskOperation
} from '@luma.gl/gpgpu/gpu-core';
import {GPUData, GPUVector} from '@luma.gl/gpgpu/gpu-data';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {vi} from 'vitest';
import {addGPUGraphTraversalToGraphWithDispatchLimit} from '../../src/gpu-core/gpu-graph-traversal';

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

test('GPUHierarchyLayout preserves uneven parent and child partitions', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const result = await runPartitionedHierarchyLayout(device);
  t.deepEqual(
    result.heights,
    [[4, 1, 1], [], [0, 1, 4]],
    'global parent IDs remain correct when one child chunk crosses parent chunk boundaries'
  );
  t.deepEqual(
    result.offsets,
    [[0, 4, 5], [], [6, 6, 7]],
    'the vector-wide scan preserves empty and uneven output chunks'
  );
  t.ok(
    result.nodeOrder.includes('partitioned-hierarchy-heights-child-0-parent-2'),
    'the crossing child chunk is split against the relevant parent partition'
  );
  t.deepEqual(
    result.updatedOffsets,
    [[0, 4, 5], [], [6, 6, 10]],
    'replacing one child batch updates the vector-wide layout without recompiling the graph'
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

test('GPUGraphTraversal executes packed initialization, seeds, and expansion in three dimensions', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const seedCount = 4 * 256 + 1;
  const nodeCount = seedCount + 1;
  const sourceNodes = [0, 256, 512, 768, 1024];
  const seeds = new Uint32Array(seedCount).fill(0xffffffff);
  for (const sourceNode of sourceNodes) {
    seeds[sourceNode] = sourceNode;
  }
  const offsets = createTraversalOffsets(nodeCount, sourceNodes);
  const neighbors = Uint32Array.from(sourceNodes, sourceNode => sourceNode + 1);
  const graph = new GPUCommandGraph(device, {id: 'packed-bounded-traversal-test'});
  const buffers = {
    offsets: createUint32Buffer(device, offsets, false),
    neighbors: createUint32Buffer(device, neighbors, false),
    seeds: createUint32Buffer(device, seeds, false),
    output: createUint32Buffer(device, new Uint32Array(nodeCount).fill(7), true)
  };
  const traversal = new GPUGraphTraversal({
    id: 'packed-bounded-traversal',
    offsets: importUint32View(graph, 'offsets', buffers.offsets, offsets.length),
    neighbors: importUint32View(graph, 'neighbors', buffers.neighbors, neighbors.length),
    seeds: importUint32View(graph, 'seeds', buffers.seeds, seeds.length),
    output: importUint32View(graph, 'output', buffers.output, nodeCount),
    maxDepth: 1
  });
  addGPUGraphTraversalToGraphWithDispatchLimit(traversal, graph, 2);
  const compiled = graph.compile();
  const dispatchSpy = vi.spyOn(Computation.prototype, 'dispatch');

  try {
    submitGraph(device, compiled, 'packed-bounded-traversal-test');
    const expectedOutput = new Uint32Array(nodeCount);
    for (const sourceNode of sourceNodes) {
      expectedOutput[sourceNode] = 1;
      expectedOutput[sourceNode + 1] = 1;
    }
    t.deepEqual(
      await readUint32(buffers.output, nodeCount),
      Array.from(expectedOutput),
      'initialization, seed publication, and outgoing expansion cover x, y, and z workgroups'
    );

    for (const passName of ['initialize', 'seed', 'depth-0-clear', 'depth-0-outgoing']) {
      const dispatchIndex = dispatchSpy.mock.instances.findIndex(
        computation => (computation as Computation).id === `packed-bounded-traversal-${passName}`
      );
      t.deepEqual(
        dispatchSpy.mock.calls[dispatchIndex]?.slice(1),
        [2, 2, 2],
        `${passName} respects the synthetic two-workgroup limit in every dimension`
      );
    }
  } finally {
    dispatchSpy.mockRestore();
    compiled.destroy();
    for (const buffer of Object.values(buffers)) {
      buffer.destroy();
    }
  }
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

test('GPUGraphTraversal follows global IDs across local CSR partitions', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const result = await runPartitionedTraversal(device);
  t.deepEqual(
    result.output,
    [[1, 1], [], [1, 1], [1, 0]],
    'cross-partition edges match the packed traversal while preserving output topology'
  );
  t.ok(
    result.nodeOrder.includes('partitioned-traversal-depth-0-outgoing-source-0-target-2') &&
      result.nodeOrder.includes('partitioned-traversal-depth-1-outgoing-source-2-target-3'),
    'source-to-target partition pairs make cross-partition routing explicit'
  );
  t.end();
});

test('GPUGraphTraversal routes large seed and output partitions through three-dimensional dispatches', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const partitionLength = 4 * 256 + 1;
  const sourceNodes = [0, 256, 512, 768, 1024];
  const seedChunk = new Uint32Array(partitionLength).fill(0xffffffff);
  for (const sourceNode of sourceNodes) {
    seedChunk[sourceNode] = sourceNode;
  }
  const outputChunks = [
    new Uint32Array(partitionLength),
    new Uint32Array(0),
    new Uint32Array(partitionLength)
  ];
  const offsetChunks = [
    createTraversalOffsets(partitionLength, sourceNodes),
    Uint32Array.from([0]),
    createTraversalOffsets(partitionLength, sourceNodes)
  ];
  const neighborChunks = [
    Uint32Array.from(sourceNodes, sourceNode => partitionLength + sourceNode),
    new Uint32Array(0),
    Uint32Array.from(sourceNodes, sourceNode =>
      sourceNode === partitionLength - 1 ? sourceNode - 1 : sourceNode + 1
    )
  ];
  const offsets = createVectorFixture(device, 'bounded-offsets', offsetChunks, false);
  const neighbors = createVectorFixture(device, 'bounded-neighbors', neighborChunks, false);
  const seeds = createVectorFixture(
    device,
    'bounded-seeds',
    [seedChunk, new Uint32Array(0)],
    false
  );
  const output = createVectorFixture(device, 'bounded-output', outputChunks, true);
  output.buffers[0].write(new Uint32Array(partitionLength).fill(7));
  output.buffers[2].write(new Uint32Array(partitionLength).fill(7));
  const graph = new GPUCommandGraph(device, {id: 'partitioned-bounded-traversal-test'});
  const traversal = new GPUGraphTraversal({
    id: 'partitioned-bounded-traversal',
    offsets: graph.importGPUVector('offsets', offsets.vector),
    neighbors: graph.importGPUVector('neighbors', neighbors.vector),
    seeds: graph.importGPUVector('seeds', seeds.vector),
    output: graph.importGPUVector('output', output.vector),
    maxDepth: 2
  });
  addGPUGraphTraversalToGraphWithDispatchLimit(traversal, graph, 2);
  const compiled = graph.compile();
  const dispatchSpy = vi.spyOn(Computation.prototype, 'dispatch');

  try {
    submitGraph(device, compiled, 'partitioned-bounded-traversal-test');
    const expectedFirstPartition = new Uint32Array(partitionLength);
    const expectedLastPartition = new Uint32Array(partitionLength);
    for (const sourceNode of sourceNodes) {
      expectedFirstPartition[sourceNode] = 1;
      expectedFirstPartition[sourceNode === partitionLength - 1 ? sourceNode - 1 : sourceNode + 1] =
        1;
      expectedLastPartition[sourceNode] = 1;
    }
    t.deepEqual(
      await readVectorFixture(output),
      [Array.from(expectedFirstPartition), [], Array.from(expectedLastPartition)],
      'large chunks preserve their empty partition while following global IDs in both directions'
    );

    for (const passName of [
      'partition-0-initialize',
      'partition-2-initialize',
      'seed-0-target-0',
      'seed-0-target-2',
      'depth-0-clear-0',
      'depth-0-clear-2',
      'depth-0-outgoing-source-0-target-2',
      'depth-1-outgoing-source-2-target-0'
    ]) {
      const dispatchIndex = dispatchSpy.mock.instances.findIndex(
        computation =>
          (computation as Computation).id === `partitioned-bounded-traversal-${passName}`
      );
      t.deepEqual(
        dispatchSpy.mock.calls[dispatchIndex]?.slice(1),
        [2, 2, 2],
        `${passName} preserves the bounded three-dimensional dispatch`
      );
    }
  } finally {
    dispatchSpy.mockRestore();
    compiled.destroy();
    for (const fixture of [offsets, neighbors, seeds, output]) {
      destroyVectorFixture(fixture);
    }
  }
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

async function runPartitionedHierarchyLayout(device: Device): Promise<{
  heights: number[][];
  offsets: number[][];
  updatedOffsets: number[][];
  nodeOrder: string[];
}> {
  const parentChunks = [Uint32Array.from([1]), new Uint32Array(0), Uint32Array.from([0, 1])];
  const childChunks = [
    Uint32Array.from([1, 0, 1]),
    new Uint32Array(0),
    Uint32Array.from([1, 0, 1])
  ];
  const parents = createVectorFixture(device, 'parents', parentChunks, false);
  const children = createVectorFixture(device, 'children', childChunks, false);
  const heights = createVectorFixture(device, 'heights', childChunks, true);
  const offsets = createVectorFixture(device, 'offsets', childChunks, true);
  const graph = new GPUCommandGraph(device, {id: 'partitioned-hierarchy-test'});
  new GPUHierarchyLayout({
    id: 'partitioned-hierarchy',
    parentStates: graph.importGPUVector('parents', parents.vector),
    childStates: graph.importGPUVector('children', children.vector),
    heights: graph.importGPUVector('heights', heights.vector),
    offsets: graph.importGPUVector('offsets', offsets.vector),
    childrenPerParent: 2,
    expandedChildHeight: 4
  }).addToGraph(graph);
  const compiled = graph.compile();
  submitGraph(device, compiled, 'partitioned-hierarchy-test');
  const firstHeights = await readVectorFixture(heights);
  const firstOffsets = await readVectorFixture(offsets);
  children.buffers[2].write(Uint32Array.from([1, 1, 1]));
  submitGraph(device, compiled, 'partitioned-hierarchy-update-test');
  const result = {
    heights: firstHeights,
    offsets: firstOffsets,
    updatedOffsets: await readVectorFixture(offsets),
    nodeOrder: compiled.stats.nodeOrder
  };
  compiled.destroy();
  for (const fixture of [parents, children, heights, offsets]) {
    destroyVectorFixture(fixture);
  }
  return result;
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

function createTraversalOffsets(nodeCount: number, sourceNodes: readonly number[]): Uint32Array {
  const offsets = new Uint32Array(nodeCount + 1);
  for (const sourceNode of sourceNodes) {
    offsets[sourceNode + 1]++;
  }
  for (let nodeIndex = 1; nodeIndex < offsets.length; nodeIndex++) {
    offsets[nodeIndex] += offsets[nodeIndex - 1];
  }
  return offsets;
}

async function runPartitionedTraversal(device: Device): Promise<{
  output: number[][];
  nodeOrder: string[];
}> {
  const outputChunks = [
    new Uint32Array(2),
    new Uint32Array(0),
    new Uint32Array(2),
    new Uint32Array(2)
  ];
  const offsetChunks = [
    Uint32Array.from([0, 2, 4]),
    Uint32Array.from([0]),
    Uint32Array.from([0, 2, 3]),
    Uint32Array.from([0, 0, 0])
  ];
  const neighborChunks = [
    Uint32Array.from([1, 2, 2, 3]),
    new Uint32Array(0),
    Uint32Array.from([0, 3, 4]),
    new Uint32Array(0)
  ];
  const seedChunks = [Uint32Array.from([0]), new Uint32Array(0), new Uint32Array(0)];
  const offsets = createVectorFixture(device, 'offsets', offsetChunks, false);
  const neighbors = createVectorFixture(device, 'neighbors', neighborChunks, false);
  const seeds = createVectorFixture(device, 'seeds', seedChunks, false);
  const output = createVectorFixture(device, 'output', outputChunks, true);
  const graph = new GPUCommandGraph(device, {id: 'partitioned-traversal-test'});
  new GPUGraphTraversal({
    id: 'partitioned-traversal',
    offsets: graph.importGPUVector('offsets', offsets.vector),
    neighbors: graph.importGPUVector('neighbors', neighbors.vector),
    seeds: graph.importGPUVector('seeds', seeds.vector),
    output: graph.importGPUVector('output', output.vector),
    maxDepth: 3
  }).addToGraph(graph);
  const compiled = graph.compile();
  submitGraph(device, compiled, 'partitioned-traversal-test');
  const result = {output: await readVectorFixture(output), nodeOrder: compiled.stats.nodeOrder};
  compiled.destroy();
  for (const fixture of [offsets, neighbors, seeds, output]) {
    destroyVectorFixture(fixture);
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

async function readVectorFixture(fixture: Uint32VectorFixture): Promise<number[][]> {
  return Promise.all(
    fixture.buffers.map((buffer, index) => readUint32(buffer, fixture.vector.data[index].length))
  );
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
