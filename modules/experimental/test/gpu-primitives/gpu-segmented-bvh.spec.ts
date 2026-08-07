// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {Buffer, type Device} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import {
  GPUCommandGraph,
  GPUSegmentedBVH,
  type CompiledGPUCommandGraph,
  type GPUBVHSegment,
  type GraphDataView
} from '@luma.gl/experimental';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {vi} from 'vitest';
import {addGPUSegmentedBVHToGraphWithDispatchLimit} from '../../src/gpu-primitives/gpu-segmented-bvh';

const SOURCE_GAP = -123_456;
const NODE_GAP = 654_321;
const OUTPUT_GAP = 0xdeadbeef;
const INVALID_NODE = 0xffffffff;
const MAXIMUM_FLOAT32 = new Float32Array([3.402823466e38])[0];

test('GPUSegmentedBVH refits mixed packed 2D and 3D hierarchies within CORE limits', async t => {
  const device = await getWebGPUTestDevice('core');
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  t.equal(device.limits.maxStorageBuffersPerShaderStage, 8, 'uses the standard CORE limit');
  const capacities = [1, 1, 2, 4, 8, 16, 32, 64, 128];
  const sourceCounts = [0, 1, 3, 3, 5, 9, 17, 33, 65];

  for (const dimension of [2, 3] as const) {
    const fixture = createSegmentedBVHFixture(device, dimension, capacities, sourceCounts);
    const compiled = compileFixture(fixture);

    try {
      encodeFixture(device, compiled);
      await assertFixture(t, fixture, `${dimension}D`);
      t.deepEqual(
        compiled.stats.nodeOrder,
        [1, 2, 4, 8, 16, 32, 64, 128].map(
          leafCapacity => `segmented-bvh-fused-refit-${leafCapacity}`
        ),
        `${dimension}D mixed independent trees use at most eight CORE graph nodes`
      );
      t.equal(
        compiled.stats.logicalTransientBufferCount,
        0,
        `${dimension}D hierarchy descriptors allocate no GPU scratch`
      );
    } finally {
      destroyFixture(fixture, compiled);
    }
  }

  t.end();
});

test('GPUSegmentedBVH refits 96 independent four-leaf trees in one eight-binding dispatch', async t => {
  const device = await getWebGPUTestDevice('core');
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const fixture = createSegmentedBVHFixture(
    device,
    3,
    Array.from({length: 96}, () => 4),
    Array.from({length: 96}, () => 3)
  );
  const dispatch = vi.spyOn(Computation.prototype, 'dispatch');
  const compiled = compileFixture(fixture);

  try {
    encodeFixture(device, compiled);
    await assertFixture(t, fixture, '96-tree');
    const source = dispatch.mock.instances.at(-1)?.source ?? '';

    t.deepEqual(compiled.stats.nodeOrder, ['segmented-bvh-fused-refit-4']);
    t.equal(dispatch.mock.calls.length, 1, 'all 96 independent hierarchies require one dispatch');
    t.deepEqual(dispatch.mock.calls[0].slice(1), [96, 1, 1], 'one workgroup handles each tree');
    t.ok(source.includes('@workgroup_size(4)'), 'only four lanes wake for each four-leaf tree');
    t.equal(
      (source.match(/@group\(0\) @binding\(/g) ?? []).length,
      8,
      'the batched hierarchy consumes exactly the CORE storage-buffer limit'
    );
  } finally {
    dispatch.mockRestore();
    destroyFixture(fixture, compiled);
  }

  t.end();
});

test('GPUSegmentedBVH bounds singleton hierarchy workgroups across all three dispatch dimensions', async t => {
  const device = await getWebGPUTestDevice('core');
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const fixture = createSegmentedBVHFixture(device, 2, [1, 1, 1, 1, 1], [0, 1, 1, 0, 1]);
  const dispatch = vi.spyOn(Computation.prototype, 'dispatch');
  addGPUSegmentedBVHToGraphWithDispatchLimit(fixture.hierarchy, fixture.graph, 2);
  const compiled = fixture.graph.compile();

  try {
    encodeFixture(device, compiled);
    await assertFixture(t, fixture, 'bounded singleton');
    t.deepEqual(dispatch.mock.calls[0].slice(1), [2, 2, 2], 'workgroups span three dimensions');
    t.ok(
      (dispatch.mock.instances.at(-1)?.source ?? '').includes('@workgroup_size(1)'),
      'singleton roots use exactly one invocation per workgroup'
    );
    t.ok(
      (dispatch.mock.instances.at(-1)?.source ?? '').includes('if (segmentIndex >= SEGMENT_COUNT)'),
      'surplus padded workgroups do not touch caller-owned output gaps'
    );
  } finally {
    dispatch.mockRestore();
    destroyFixture(fixture, compiled);
  }

  t.end();
});

test('GPUSegmentedBVH refits caller-owned source changes without rebuilding the graph', async t => {
  const device = await getWebGPUTestDevice('core');
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const fixture = createSegmentedBVHFixture(device, 3, [4, 4], [3, 3]);
  const compiled = compileFixture(fixture);

  try {
    encodeFixture(device, compiled);
    await assertFixture(t, fixture, 'initial refit');

    const segment = fixture.segments[1];
    const minimumIndex = (fixture.minimaPrefix + segment.sourceOffset) * fixture.dimension;
    const maximumIndex = (fixture.maximaPrefix + segment.sourceOffset) * fixture.dimension;
    fixture.minimaData.set([-800, -700, -600], minimumIndex);
    fixture.maximaData.set([800, 700, 600], maximumIndex);
    fixture.minimaBuffer.write(fixture.minimaData);
    fixture.maximaBuffer.write(fixture.maximaData);
    updateExpectedOutputs(fixture);

    encodeFixture(device, compiled);
    await assertFixture(t, fixture, 'updated refit');
    t.deepEqual(
      Array.from(
        fixture.expectedNodeMinima.subarray(
          (fixture.nodeMinimaPrefix + segment.nodeOffset) * fixture.dimension,
          (fixture.nodeMinimaPrefix + segment.nodeOffset + 1) * fixture.dimension
        )
      ),
      [-800, -700, -600],
      'the unchanged graph updates the corresponding independent hierarchy root'
    );
  } finally {
    destroyFixture(fixture, compiled);
  }

  t.end();
});

type SegmentedBVHFixture = {
  device: Device;
  graph: GPUCommandGraph;
  hierarchy: GPUSegmentedBVH;
  segments: GPUBVHSegment[];
  dimension: 2 | 3;
  minimaPrefix: number;
  maximaPrefix: number;
  nodeMinimaPrefix: number;
  nodeMaximaPrefix: number;
  nodeChildrenPrefix: number;
  leafIdsPrefix: number;
  countsPrefix: number;
  overflowsPrefix: number;
  minimaData: Float32Array;
  maximaData: Float32Array;
  expectedNodeMinima: Float32Array;
  expectedNodeMaxima: Float32Array;
  expectedNodeChildren: Uint32Array;
  expectedLeafIds: Uint32Array;
  expectedCounts: Uint32Array;
  expectedOverflows: Uint32Array;
  minimaBuffer: Buffer;
  maximaBuffer: Buffer;
  nodeMinimaBuffer: Buffer;
  nodeMaximaBuffer: Buffer;
  nodeChildrenBuffer: Buffer;
  leafIdsBuffer: Buffer;
  countsBuffer: Buffer;
  overflowsBuffer: Buffer;
};

function createSegmentedBVHFixture(
  device: Device,
  dimension: 2 | 3,
  capacities: readonly number[],
  sourceCounts: readonly number[]
): SegmentedBVHFixture {
  let sourceLength = 2;
  let nodeLength = 3;
  let leafLength = 4;
  let metadataLength = 2;
  const segments = capacities.map((leafCapacity, segmentIndex) => {
    const sourceCount = sourceCounts[segmentIndex];
    const segment = {
      sourceOffset: sourceLength,
      sourceCount,
      nodeOffset: nodeLength,
      leafOffset: leafLength,
      metadataOffset: metadataLength,
      leafCapacity
    };
    sourceLength += sourceCount + 1 + (segmentIndex % 2);
    nodeLength += leafCapacity * 2 - 1 + 2 + (segmentIndex % 2);
    leafLength += leafCapacity + 3 + (segmentIndex % 2);
    metadataLength += 2 + (segmentIndex % 2);
    return segment;
  });

  const minimaPrefix = 65;
  const maximaPrefix = 3;
  const nodeMinimaPrefix = 23;
  const nodeMaximaPrefix = 5;
  const nodeChildrenPrefix = 39;
  const leafIdsPrefix = 7;
  const countsPrefix = 9;
  const overflowsPrefix = 70;
  const minimaData = new Float32Array((minimaPrefix + sourceLength + 3) * dimension).fill(
    SOURCE_GAP
  );
  const maximaData = new Float32Array((maximaPrefix + sourceLength + 5) * dimension).fill(
    SOURCE_GAP
  );
  const expectedNodeMinima = new Float32Array((nodeMinimaPrefix + nodeLength + 3) * dimension).fill(
    NODE_GAP
  );
  const expectedNodeMaxima = new Float32Array((nodeMaximaPrefix + nodeLength + 5) * dimension).fill(
    NODE_GAP
  );
  const expectedNodeChildren = new Uint32Array((nodeChildrenPrefix + nodeLength + 7) * 2).fill(
    OUTPUT_GAP
  );
  const expectedLeafIds = new Uint32Array(leafIdsPrefix + leafLength + 9).fill(OUTPUT_GAP);
  const expectedCounts = new Uint32Array(countsPrefix + metadataLength + 5).fill(OUTPUT_GAP);
  const expectedOverflows = new Uint32Array(overflowsPrefix + metadataLength + 7).fill(OUTPUT_GAP);

  for (const [segmentIndex, segment] of segments.entries()) {
    for (let rowIndex = 0; rowIndex < segment.sourceCount; rowIndex++) {
      for (let axis = 0; axis < dimension; axis++) {
        const value = segmentIndex * 100 + rowIndex * 3 + axis - 10;
        minimaData[(minimaPrefix + segment.sourceOffset + rowIndex) * dimension + axis] = value;
        maximaData[(maximaPrefix + segment.sourceOffset + rowIndex) * dimension + axis] =
          value + 1.25;
      }
    }
    if (segment.sourceCount > 1 && segmentIndex % 3 === 0) {
      minimaData[(minimaPrefix + segment.sourceOffset + 1) * dimension] = Number.NaN;
    }
    if (segment.sourceCount > 2 && segmentIndex % 4 === 1) {
      const component = (maximaPrefix + segment.sourceOffset + 2) * dimension;
      maximaData[component] = -1_000;
    }
  }

  const graph = new GPUCommandGraph(device, {id: 'segmented-bvh-gpu-graph'});
  const minimaBuffer = createReadableBuffer(device, 'segmented-bvh-minima', minimaData);
  const maximaBuffer = createReadableBuffer(device, 'segmented-bvh-maxima', maximaData);
  const nodeMinimaBuffer = createReadableBuffer(
    device,
    'segmented-bvh-node-minima',
    expectedNodeMinima
  );
  const nodeMaximaBuffer = createReadableBuffer(
    device,
    'segmented-bvh-node-maxima',
    expectedNodeMaxima
  );
  const nodeChildrenBuffer = createReadableBuffer(
    device,
    'segmented-bvh-node-children',
    expectedNodeChildren
  );
  const leafIdsBuffer = createReadableBuffer(device, 'segmented-bvh-leaf-ids', expectedLeafIds);
  const countsBuffer = createReadableBuffer(device, 'segmented-bvh-counts', expectedCounts);
  const overflowsBuffer = createReadableBuffer(
    device,
    'segmented-bvh-overflows',
    expectedOverflows
  );
  const boundsFormat = dimension === 2 ? 'float32x2' : 'float32x3';
  const hierarchy = new GPUSegmentedBVH({
    id: 'segmented-bvh',
    minima: importView(graph, 'minima', minimaBuffer, boundsFormat, minimaPrefix, sourceLength),
    maxima: importView(graph, 'maxima', maximaBuffer, boundsFormat, maximaPrefix, sourceLength),
    nodeMinima: importView(
      graph,
      'node-minima',
      nodeMinimaBuffer,
      boundsFormat,
      nodeMinimaPrefix,
      nodeLength
    ),
    nodeMaxima: importView(
      graph,
      'node-maxima',
      nodeMaximaBuffer,
      boundsFormat,
      nodeMaximaPrefix,
      nodeLength
    ),
    nodeChildren: importView(
      graph,
      'node-children',
      nodeChildrenBuffer,
      'uint32x2',
      nodeChildrenPrefix,
      nodeLength
    ),
    leafIds: importView(graph, 'leaf-ids', leafIdsBuffer, 'uint32', leafIdsPrefix, leafLength),
    counts: importView(graph, 'counts', countsBuffer, 'uint32', countsPrefix, metadataLength),
    overflows: importView(
      graph,
      'overflows',
      overflowsBuffer,
      'uint32',
      overflowsPrefix,
      metadataLength
    ),
    segments
  });
  const fixture: SegmentedBVHFixture = {
    device,
    graph,
    hierarchy,
    segments,
    dimension,
    minimaPrefix,
    maximaPrefix,
    nodeMinimaPrefix,
    nodeMaximaPrefix,
    nodeChildrenPrefix,
    leafIdsPrefix,
    countsPrefix,
    overflowsPrefix,
    minimaData,
    maximaData,
    expectedNodeMinima,
    expectedNodeMaxima,
    expectedNodeChildren,
    expectedLeafIds,
    expectedCounts,
    expectedOverflows,
    minimaBuffer,
    maximaBuffer,
    nodeMinimaBuffer,
    nodeMaximaBuffer,
    nodeChildrenBuffer,
    leafIdsBuffer,
    countsBuffer,
    overflowsBuffer
  };
  updateExpectedOutputs(fixture);
  return fixture;
}

/** CPU reference for the byte-exact complete-binary layout and invalid-bound behavior. */
function updateExpectedOutputs(fixture: SegmentedBVHFixture): void {
  fixture.expectedNodeMinima.fill(NODE_GAP);
  fixture.expectedNodeMaxima.fill(NODE_GAP);
  fixture.expectedNodeChildren.fill(OUTPUT_GAP);
  fixture.expectedLeafIds.fill(OUTPUT_GAP);
  fixture.expectedCounts.fill(OUTPUT_GAP);
  fixture.expectedOverflows.fill(OUTPUT_GAP);

  for (const segment of fixture.segments) {
    const internalNodeCount = segment.leafCapacity - 1;
    const storedCount = Math.min(segment.sourceCount, segment.leafCapacity);
    for (let nodeIndex = 0; nodeIndex < segment.leafCapacity * 2 - 1; nodeIndex++) {
      const globalNode = segment.nodeOffset + nodeIndex;
      const childrenIndex = (fixture.nodeChildrenPrefix + globalNode) * 2;
      fixture.expectedNodeChildren[childrenIndex] =
        nodeIndex < internalNodeCount ? nodeIndex * 2 + 1 : INVALID_NODE;
      fixture.expectedNodeChildren[childrenIndex + 1] =
        nodeIndex < internalNodeCount ? nodeIndex * 2 + 2 : INVALID_NODE;
    }

    for (let leafIndex = 0; leafIndex < segment.leafCapacity; leafIndex++) {
      const globalNode = segment.nodeOffset + internalNodeCount + leafIndex;
      fixture.expectedLeafIds[fixture.leafIdsPrefix + segment.leafOffset + leafIndex] =
        leafIndex < storedCount ? leafIndex : INVALID_NODE;
      let valid = leafIndex < storedCount;
      for (let axis = 0; axis < fixture.dimension; axis++) {
        const minimum =
          fixture.minimaData[
            (fixture.minimaPrefix + segment.sourceOffset + leafIndex) * fixture.dimension + axis
          ];
        const maximum =
          fixture.maximaData[
            (fixture.maximaPrefix + segment.sourceOffset + leafIndex) * fixture.dimension + axis
          ];
        valid = valid && Number.isFinite(minimum) && Number.isFinite(maximum) && minimum <= maximum;
      }
      for (let axis = 0; axis < fixture.dimension; axis++) {
        const minimumIndex = (fixture.nodeMinimaPrefix + globalNode) * fixture.dimension + axis;
        const maximumIndex = (fixture.nodeMaximaPrefix + globalNode) * fixture.dimension + axis;
        fixture.expectedNodeMinima[minimumIndex] = valid
          ? fixture.minimaData[
              (fixture.minimaPrefix + segment.sourceOffset + leafIndex) * fixture.dimension + axis
            ]
          : MAXIMUM_FLOAT32;
        fixture.expectedNodeMaxima[maximumIndex] = valid
          ? fixture.maximaData[
              (fixture.maximaPrefix + segment.sourceOffset + leafIndex) * fixture.dimension + axis
            ]
          : -MAXIMUM_FLOAT32;
      }
    }

    for (let nodeIndex = internalNodeCount - 1; nodeIndex >= 0; nodeIndex--) {
      const parent = segment.nodeOffset + nodeIndex;
      const leftChild = segment.nodeOffset + nodeIndex * 2 + 1;
      const rightChild = leftChild + 1;
      for (let axis = 0; axis < fixture.dimension; axis++) {
        fixture.expectedNodeMinima[(fixture.nodeMinimaPrefix + parent) * fixture.dimension + axis] =
          Math.min(
            fixture.expectedNodeMinima[
              (fixture.nodeMinimaPrefix + leftChild) * fixture.dimension + axis
            ],
            fixture.expectedNodeMinima[
              (fixture.nodeMinimaPrefix + rightChild) * fixture.dimension + axis
            ]
          );
        fixture.expectedNodeMaxima[(fixture.nodeMaximaPrefix + parent) * fixture.dimension + axis] =
          Math.max(
            fixture.expectedNodeMaxima[
              (fixture.nodeMaximaPrefix + leftChild) * fixture.dimension + axis
            ],
            fixture.expectedNodeMaxima[
              (fixture.nodeMaximaPrefix + rightChild) * fixture.dimension + axis
            ]
          );
      }
    }

    fixture.expectedCounts[fixture.countsPrefix + segment.metadataOffset] = segment.sourceCount;
    fixture.expectedOverflows[fixture.overflowsPrefix + segment.metadataOffset] =
      segment.sourceCount > segment.leafCapacity ? 1 : 0;
  }
}

function createReadableBuffer(
  device: Device,
  identifier: string,
  data: Float32Array | Uint32Array
): Buffer {
  return device.createBuffer({
    id: identifier,
    data,
    usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST
  });
}

function importView<T extends 'float32x2' | 'float32x3' | 'uint32x2' | 'uint32'>(
  graph: GPUCommandGraph,
  identifier: string,
  buffer: Buffer,
  format: T,
  prefix: number,
  length: number
): GraphDataView<T> {
  const byteStride = format.endsWith('x3') ? 12 : format.endsWith('x2') ? 8 : 4;
  const handle = graph.importBuffer(
    {id: identifier, byteLength: buffer.byteLength, usage: buffer.usage},
    buffer
  );
  return graph.createDataView(handle, {format, length, byteOffset: prefix * byteStride});
}

function compileFixture(fixture: SegmentedBVHFixture): CompiledGPUCommandGraph {
  fixture.hierarchy.addToGraph(fixture.graph);
  return fixture.graph.compile();
}

function encodeFixture(device: Device, compiled: CompiledGPUCommandGraph): void {
  const commandEncoder = device.createCommandEncoder({id: 'segmented-bvh-command-encoder'});
  compiled.encode(commandEncoder, {parameters: undefined});
  device.submit(commandEncoder.finish());
}

async function assertFixture(
  testCase: Parameters<Parameters<typeof test>[1]>[0],
  fixture: SegmentedBVHFixture,
  label: string
): Promise<void> {
  const [minima, maxima, children, leafIds, counts, overflows] = await Promise.all([
    readFloat32(fixture.nodeMinimaBuffer),
    readFloat32(fixture.nodeMaximaBuffer),
    readUint32(fixture.nodeChildrenBuffer),
    readUint32(fixture.leafIdsBuffer),
    readUint32(fixture.countsBuffer),
    readUint32(fixture.overflowsBuffer)
  ]);
  testCase.deepEqual(
    minima,
    Array.from(fixture.expectedNodeMinima),
    `${label} packed minima preserve gaps, invalid leaves, and independent roots`
  );
  testCase.deepEqual(
    maxima,
    Array.from(fixture.expectedNodeMaxima),
    `${label} packed maxima preserve gaps, invalid leaves, and independent roots`
  );
  testCase.deepEqual(
    children,
    Array.from(fixture.expectedNodeChildren),
    `${label} complete-binary children stay local to each packed hierarchy`
  );
  testCase.deepEqual(
    leafIds,
    Array.from(fixture.expectedLeafIds),
    `${label} padded leaves are invalid and populated identities are local`
  );
  testCase.deepEqual(
    counts,
    Array.from(fixture.expectedCounts),
    `${label} metadata publishes the full count and preserves every gap`
  );
  testCase.deepEqual(
    overflows,
    Array.from(fixture.expectedOverflows),
    `${label} independent overflow flags preserve every gap`
  );
}

async function readFloat32(buffer: Buffer): Promise<number[]> {
  const bytes = await buffer.readAsync();
  return Array.from(
    new Float32Array(
      bytes.buffer,
      bytes.byteOffset,
      bytes.byteLength / Float32Array.BYTES_PER_ELEMENT
    )
  );
}

async function readUint32(buffer: Buffer): Promise<number[]> {
  const bytes = await buffer.readAsync();
  return Array.from(
    new Uint32Array(
      bytes.buffer,
      bytes.byteOffset,
      bytes.byteLength / Uint32Array.BYTES_PER_ELEMENT
    )
  );
}

function destroyFixture(fixture: SegmentedBVHFixture, compiled: CompiledGPUCommandGraph): void {
  compiled.destroy();
  for (const buffer of [
    fixture.minimaBuffer,
    fixture.maximaBuffer,
    fixture.nodeMinimaBuffer,
    fixture.nodeMaximaBuffer,
    fixture.nodeChildrenBuffer,
    fixture.leafIdsBuffer,
    fixture.countsBuffer,
    fixture.overflowsBuffer
  ]) {
    buffer.destroy();
  }
}
