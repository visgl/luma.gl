// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {Buffer, type ComputePassProps, type Device} from '@luma.gl/core';
import {DynamicBuffer} from '@luma.gl/engine';
import {
  DrawCommandBuffer,
  GPUCommandGraph,
  GPUGridIndex,
  type CompiledGPUCommandGraph,
  type GraphDataView
} from '@luma.gl/experimental';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {GPUPointSpatialQuery, type GPUSpatialQueryOutput} from '../../src/geospatial';

const STORAGE_BINDING_ALIGNMENT = 256;

test('GPUPointSpatialQuery rejects every overlapping output pair', async tapeTest => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    tapeTest.comment('WebGPU is not available');
    tapeTest.end();
    return;
  }

  const positionsBuffer = createInputBuffer(device, Float32Array.from([0, 0]));
  const sourceIdsBuffer = createInputBuffer(device, Uint32Array.from([7]));
  const queryBuffer = createInputBuffer(device, Float32Array.from([-1, -1, 1, 1]));
  const outputBuffer = createOutputBuffer(
    device,
    (STORAGE_BINDING_ALIGNMENT * 3) / Uint32Array.BYTES_PER_ELEMENT + 1
  );
  const graph = new GPUCommandGraph(device, {id: 'spatial-query-output-aliases'});
  const positions = importView(graph, 'positions', positionsBuffer, 'float32x2', 1);
  const sourceIds = importView(graph, 'source-ids', sourceIdsBuffer, 'uint32', 1);
  const query = importView(graph, 'query', queryBuffer, 'float32', 4);
  const outputHandle = graph.importBuffer(
    {id: 'outputs', byteLength: outputBuffer.byteLength, usage: outputBuffer.usage},
    outputBuffer
  );
  const baseOutput: Required<GPUSpatialQueryOutput> = {
    ids: graph.createDataView(outputHandle, {format: 'uint32', length: 1}),
    count: graph.createDataView(outputHandle, {
      format: 'uint32',
      length: 1,
      byteOffset: STORAGE_BINDING_ALIGNMENT
    }),
    overflow: graph.createDataView(outputHandle, {
      format: 'uint32',
      length: 1,
      byteOffset: STORAGE_BINDING_ALIGNMENT * 2
    }),
    totalCount: graph.createDataView(outputHandle, {
      format: 'uint32',
      length: 1,
      byteOffset: STORAGE_BINDING_ALIGNMENT * 3
    })
  };
  const outputNames = ['ids', 'count', 'overflow', 'totalCount'] as const;

  for (let firstIndex = 0; firstIndex < outputNames.length; firstIndex++) {
    for (let secondIndex = firstIndex + 1; secondIndex < outputNames.length; secondIndex++) {
      const firstName = outputNames[firstIndex];
      const secondName = outputNames[secondIndex];
      const output = {...baseOutput, [secondName]: baseOutput[firstName]};
      tapeTest.throws(
        () =>
          new GPUPointSpatialQuery({
            id: `${firstName}-${secondName}-alias`,
            positions,
            kind: 'bounds',
            query,
            output
          }),
        /must not overlap/,
        `${firstName} and ${secondName} cannot alias`
      );
    }
  }

  tapeTest.throws(
    () =>
      new GPUPointSpatialQuery({
        id: 'ids-source-ids-alias',
        positions,
        sourceIds,
        kind: 'bounds',
        query,
        output: {...baseOutput, ids: sourceIds}
      }),
    /output ids and sourceIds must not overlap/,
    'a writable output cannot alias a live source-ID read'
  );

  const packedOutputBuffer = createOutputBuffer(device, 4);
  const packedOutputHandle = graph.importBuffer(
    {
      id: 'packed-outputs',
      byteLength: packedOutputBuffer.byteLength,
      usage: packedOutputBuffer.usage
    },
    packedOutputBuffer
  );
  tapeTest.throws(
    () =>
      new GPUPointSpatialQuery({
        id: 'packed-output-binding-alias',
        positions,
        kind: 'bounds',
        query,
        output: {
          ids: graph.createDataView(packedOutputHandle, {format: 'uint32', length: 1}),
          count: graph.createDataView(packedOutputHandle, {
            format: 'uint32',
            length: 1,
            byteOffset: Uint32Array.BYTES_PER_ELEMENT
          }),
          overflow: graph.createDataView(packedOutputHandle, {
            format: 'uint32',
            length: 1,
            byteOffset: Uint32Array.BYTES_PER_ELEMENT * 2
          })
        }
      }),
    /must not overlap/,
    'logically disjoint rows are rejected when their aligned binding ranges overlap'
  );

  const dynamicPositionsBuffer = new DynamicBuffer(device, {
    buffer: positionsBuffer,
    ownsBuffer: false
  });
  const zeroCapacityAliasHandle = graph.importBuffer(
    {
      id: 'zero-capacity-ids-alias',
      byteLength: positionsBuffer.byteLength,
      usage: positionsBuffer.usage
    },
    dynamicPositionsBuffer
  );
  const zeroCapacityIds = graph.createDataView(zeroCapacityAliasHandle, {
    format: 'uint32',
    length: 0
  });
  tapeTest.throws(
    () =>
      new GPUPointSpatialQuery({
        id: 'zero-capacity-ids-positions-alias',
        positions,
        kind: 'bounds',
        query,
        output: {...baseOutput, ids: zeroCapacityIds}
      }),
    /output ids and positions must not overlap/,
    'a zero-capacity output still binds one row and detects a shared physical default buffer'
  );

  new GPUPointSpatialQuery({
    id: 'aligned-output-bindings',
    positions,
    kind: 'bounds',
    query,
    output: baseOutput
  }).addToGraph(graph);
  const compiled = graph.compile();
  encode(device, compiled);
  tapeTest.equal(await readUint32At(outputBuffer, 0), 0, 'aligned output IDs are writable');
  tapeTest.equal(
    await readUint32At(outputBuffer, STORAGE_BINDING_ALIGNMENT),
    1,
    'aligned output count is writable'
  );
  tapeTest.equal(
    await readUint32At(outputBuffer, STORAGE_BINDING_ALIGNMENT * 2),
    0,
    'aligned output overflow is writable'
  );
  tapeTest.equal(
    await readUint32At(outputBuffer, STORAGE_BINDING_ALIGNMENT * 3),
    1,
    'aligned output totalCount is writable'
  );

  compiled.destroy();
  dynamicPositionsBuffer.destroy();
  positionsBuffer.destroy();
  sourceIdsBuffer.destroy();
  queryBuffer.destroy();
  outputBuffer.destroy();
  packedOutputBuffer.destroy();
  tapeTest.end();
});

test('GPUPointSpatialQuery clamps an indirect draw count but preserves totalCount', async tapeTest => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    tapeTest.comment('WebGPU is not available');
    tapeTest.end();
    return;
  }

  const positionsBuffer = createInputBuffer(
    device,
    Float32Array.from([0, 0, 0.1, 0.1, 0.2, 0.2, 0.3, 0.3, 0.4, 0.4, 0.5, 0.5])
  );
  const queryBuffer = createInputBuffer(device, Float32Array.from([-1, -1, 1, 1]));
  const idsBuffer = createOutputBuffer(device, 2);
  const overflowBuffer = createOutputBuffer(device, 1);
  const totalCountBuffer = createOutputBuffer(device, 1);
  const drawCommands = new DrawCommandBuffer(device, {
    id: 'spatial-query-draw-count',
    type: 'draw',
    commands: [{vertexCount: 6, instanceCount: 99}]
  });
  const graph = new GPUCommandGraph(device, {id: 'spatial-query-result-capacity'});

  new GPUPointSpatialQuery({
    id: 'capacity-query',
    positions: importView(graph, 'positions', positionsBuffer, 'float32x2', 6),
    kind: 'bounds',
    query: importView(graph, 'query', queryBuffer, 'float32', 4),
    output: {
      ids: importView(graph, 'ids', idsBuffer, 'uint32', 2),
      count: graph.importGPUData('draw-count', drawCommands.getInstanceCountData(0)),
      overflow: importView(graph, 'overflow', overflowBuffer, 'uint32', 1),
      totalCount: importView(graph, 'total-count', totalCountBuffer, 'uint32', 1)
    }
  }).addToGraph(graph);

  const compiled = graph.compile();
  encode(device, compiled);
  const drawCount = await readDrawCount(drawCommands);
  const ids = await readUint32(idsBuffer, drawCount);

  tapeTest.equal(drawCount, 2, 'the DrawCommandBuffer instance count is clamped to ID capacity');
  tapeTest.equal((await readUint32(totalCountBuffer, 1))[0], 6, 'totalCount remains unclamped');
  tapeTest.equal((await readUint32(overflowBuffer, 1))[0], 1, 'result truncation sets overflow');
  tapeTest.equal(new Set(ids).size, 2, 'the retained rows are unique');
  tapeTest.ok(
    ids.every(id => id < 6),
    'every retained ID addresses a source row'
  );

  compiled.destroy();
  drawCommands.destroy();
  positionsBuffer.destroy();
  queryBuffer.destroy();
  idsBuffer.destroy();
  overflowBuffer.destroy();
  totalCountBuffer.destroy();
  tapeTest.end();
});

test('GPUPointSpatialQuery propagates index overflow independently of result capacity', async tapeTest => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    tapeTest.comment('WebGPU is not available');
    tapeTest.end();
    return;
  }

  const positionsBuffer = createInputBuffer(
    device,
    Float32Array.from([0.1, 0.1, 0.2, 0.2, 0.3, 0.3, 0.4, 0.4, 0.5, 0.5])
  );
  const sourceIdsBuffer = createInputBuffer(device, Uint32Array.from([101, 202, 303, 404, 505]));
  const queryBuffer = createInputBuffer(device, Float32Array.from([0, 0, 1, 1]));
  const cellOffsetsBuffer = createOutputBuffer(device, 2);
  const rowIndicesBuffer = createOutputBuffer(device, 2);
  const indexCountBuffer = createOutputBuffer(device, 1);
  const indexOverflowBuffer = createOutputBuffer(device, 1);
  const idsBuffer = createOutputBuffer(device, 5);
  const countBuffer = createOutputBuffer(device, 1);
  const overflowBuffer = createOutputBuffer(device, 1);
  const totalCountBuffer = createOutputBuffer(device, 1);
  const graph = new GPUCommandGraph(device, {id: 'spatial-query-index-capacity'});
  const positions = importView(graph, 'positions', positionsBuffer, 'float32x2', 5);
  const cellOffsets = importView(graph, 'cell-offsets', cellOffsetsBuffer, 'uint32', 2);
  const rowIndices = importView(graph, 'row-indices', rowIndicesBuffer, 'uint32', 2);
  const indexCount = importView(graph, 'index-count', indexCountBuffer, 'uint32', 1);
  const indexOverflow = importView(graph, 'index-overflow', indexOverflowBuffer, 'uint32', 1);
  new GPUGridIndex({
    id: 'capacity-index',
    positions,
    gridSize: [1, 1],
    bounds: [0, 0, 1, 1],
    cellOffsets,
    objectIds: rowIndices,
    count: indexCount,
    overflow: indexOverflow
  }).addToGraph(graph);
  new GPUPointSpatialQuery({
    id: 'indexed-capacity-query',
    positions,
    sourceIds: importView(graph, 'source-ids', sourceIdsBuffer, 'uint32', 5),
    index: {
      gridSize: [1, 1],
      bounds: [0, 0, 1, 1],
      cellOffsets,
      rowIndices,
      count: indexCount,
      overflow: indexOverflow
    },
    kind: 'bounds',
    query: importView(graph, 'query', queryBuffer, 'float32', 4),
    output: {
      ids: importView(graph, 'ids', idsBuffer, 'uint32', 5),
      count: importView(graph, 'count', countBuffer, 'uint32', 1),
      overflow: importView(graph, 'overflow', overflowBuffer, 'uint32', 1),
      totalCount: importView(graph, 'total-count', totalCountBuffer, 'uint32', 1)
    }
  }).addToGraph(graph);

  const compiled = graph.compile();
  encode(device, compiled);
  const count = (await readUint32(countBuffer, 1))[0];
  const ids = await readUint32(idsBuffer, count);

  tapeTest.equal(
    (await readUint32(indexCountBuffer, 1))[0],
    5,
    'index count reports required rows'
  );
  tapeTest.equal((await readUint32(indexOverflowBuffer, 1))[0], 1, 'the index itself overflowed');
  tapeTest.equal(count, 2, 'only stored row indices are refined');
  tapeTest.equal(
    (await readUint32(totalCountBuffer, 1))[0],
    2,
    'totalCount covers only the candidates retained by the overflowing index'
  );
  tapeTest.equal((await readUint32(overflowBuffer, 1))[0], 1, 'query carries index overflow');
  tapeTest.equal(new Set(ids).size, 2, 'stored row indices remain unique');
  tapeTest.ok(
    ids.every(id => [101, 202, 303, 404, 505].includes(id)),
    'stored row indices are dereferenced through application source IDs'
  );

  compiled.destroy();
  for (const buffer of [
    positionsBuffer,
    sourceIdsBuffer,
    queryBuffer,
    cellOffsetsBuffer,
    rowIndicesBuffer,
    indexCountBuffer,
    indexOverflowBuffer,
    idsBuffer,
    countBuffer,
    overflowBuffer,
    totalCountBuffer
  ]) {
    buffer.destroy();
  }
  tapeTest.end();
});

test('GPUPointSpatialQuery uses GPU-prepared indirect dispatch for indexed refinement', async tapeTest => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    tapeTest.comment('WebGPU is not available');
    tapeTest.end();
    return;
  }

  const gridWidth = 16;
  const positionsValues = new Float32Array(gridWidth * gridWidth * 2);
  for (let row = 0; row < gridWidth; row++) {
    for (let column = 0; column < gridWidth; column++) {
      const index = row * gridWidth + column;
      positionsValues[index * 2] = column + 0.5;
      positionsValues[index * 2 + 1] = row + 0.5;
    }
  }
  const pointCount = gridWidth * gridWidth;
  const positionsBuffer = createInputBuffer(device, positionsValues);
  const queryBuffer = createInputBuffer(device, Float32Array.from([8.49, 8.49, 8.51, 8.51]));
  const cellOffsetsBuffer = createOutputBuffer(device, pointCount + 1);
  const rowIndicesBuffer = createOutputBuffer(device, pointCount);
  const indexCountBuffer = createOutputBuffer(device, 1);
  const indexOverflowBuffer = createOutputBuffer(device, 1);
  const idsBuffer = createOutputBuffer(device, 4);
  const countBuffer = createOutputBuffer(device, 1);
  const overflowBuffer = createOutputBuffer(device, 1);
  const totalCountBuffer = createOutputBuffer(device, 1);
  const graph = new GPUCommandGraph(device, {id: 'spatial-query-indirect-candidates'});
  const positions = importView(graph, 'positions', positionsBuffer, 'float32x2', pointCount);
  const cellOffsets = importView(
    graph,
    'cell-offsets',
    cellOffsetsBuffer,
    'uint32',
    pointCount + 1
  );
  const rowIndices = importView(graph, 'row-indices', rowIndicesBuffer, 'uint32', pointCount);
  const indexCount = importView(graph, 'index-count', indexCountBuffer, 'uint32', 1);
  const indexOverflow = importView(graph, 'index-overflow', indexOverflowBuffer, 'uint32', 1);
  new GPUGridIndex({
    id: 'dispatch-index',
    positions,
    gridSize: [gridWidth, gridWidth],
    bounds: [0, 0, gridWidth, gridWidth],
    cellOffsets,
    objectIds: rowIndices,
    count: indexCount,
    overflow: indexOverflow
  }).addToGraph(graph);
  new GPUPointSpatialQuery({
    id: 'dispatch-query',
    positions,
    index: {
      gridSize: [gridWidth, gridWidth],
      bounds: [0, 0, gridWidth, gridWidth],
      cellOffsets,
      rowIndices,
      count: indexCount,
      overflow: indexOverflow
    },
    kind: 'bounds',
    query: importView(graph, 'query', queryBuffer, 'float32', 4),
    output: {
      ids: importView(graph, 'ids', idsBuffer, 'uint32', 4),
      count: importView(graph, 'count', countBuffer, 'uint32', 1),
      overflow: importView(graph, 'overflow', overflowBuffer, 'uint32', 1),
      totalCount: importView(graph, 'total-count', totalCountBuffer, 'uint32', 1)
    }
  }).addToGraph(graph);

  const compiled = graph.compile();
  const dispatchProbe = encodeWithDispatchProbe(device, compiled, 'dispatch-query-refine');
  const count = (await readUint32(countBuffer, 1))[0];

  tapeTest.deepEqual(
    compiled.stats.nodeOrder.slice(-3),
    ['dispatch-query-prepare', 'dispatch-query-refine', 'dispatch-query-finalize'],
    'GPU preparation precedes candidate refinement'
  );
  tapeTest.equal(dispatchProbe.indirect, 1, 'indexed refinement records one indirect dispatch');
  tapeTest.equal(
    dispatchProbe.direct,
    0,
    'indexed refinement does not record a fixed full-N dispatch'
  );
  tapeTest.equal(count, 1, 'indexed refinement returns one exact match');
  tapeTest.deepEqual(await readUint32(idsBuffer, count), [8 * gridWidth + 8]);

  compiled.destroy();
  for (const buffer of [
    positionsBuffer,
    queryBuffer,
    cellOffsetsBuffer,
    rowIndicesBuffer,
    indexCountBuffer,
    indexOverflowBuffer,
    idsBuffer,
    countBuffer,
    overflowBuffer,
    totalCountBuffer
  ]) {
    buffer.destroy();
  }
  tapeTest.end();
});

function encodeWithDispatchProbe(
  device: Device,
  compiled: CompiledGPUCommandGraph<void>,
  nodeId: string
): {direct: number; indirect: number} {
  const dispatches = {direct: 0, indirect: 0};
  const commandEncoder = device.createCommandEncoder({id: 'spatial-query-dispatch-probe'});
  const beginComputePass = commandEncoder.beginComputePass.bind(commandEncoder);
  commandEncoder.beginComputePass = (props: ComputePassProps = {}) => {
    const computePass = beginComputePass(props);
    if (props.id === nodeId) {
      const dispatch = computePass.dispatch.bind(computePass);
      const dispatchIndirect = computePass.dispatchIndirect.bind(computePass);
      computePass.dispatch = (x, y, z) => {
        dispatches.direct++;
        dispatch(x, y, z);
      };
      computePass.dispatchIndirect = (buffer, byteOffset) => {
        dispatches.indirect++;
        dispatchIndirect(buffer, byteOffset);
      };
    }
    return computePass;
  };
  compiled.encode(commandEncoder, {parameters: undefined});
  device.submit(commandEncoder.finish());
  return dispatches;
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

function importView<T extends 'float32x2' | 'float32' | 'uint32'>(
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

async function readDrawCount(drawCommands: DrawCommandBuffer): Promise<number> {
  const bytes = await drawCommands.buffer.readAsync(
    drawCommands.getInstanceCountByteOffset(0),
    Uint32Array.BYTES_PER_ELEMENT
  );
  return new Uint32Array(bytes.buffer, bytes.byteOffset, 1)[0];
}

async function readUint32(buffer: Buffer, length: number): Promise<number[]> {
  const bytes = await buffer.readAsync();
  return Array.from(new Uint32Array(bytes.buffer, bytes.byteOffset, length));
}

async function readUint32At(buffer: Buffer, byteOffset: number): Promise<number> {
  const bytes = await buffer.readAsync(byteOffset, Uint32Array.BYTES_PER_ELEMENT);
  return new Uint32Array(bytes.buffer, bytes.byteOffset, 1)[0];
}

function encode(device: Device, compiled: CompiledGPUCommandGraph<void>): void {
  const commandEncoder = device.createCommandEncoder({id: 'spatial-query-capacity-test'});
  compiled.encode(commandEncoder, {parameters: undefined});
  device.submit(commandEncoder.finish());
}
