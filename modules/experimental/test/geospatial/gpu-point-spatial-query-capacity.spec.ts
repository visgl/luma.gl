// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type ComputePassProps, type Device} from '@luma.gl/core';
import {DynamicBuffer} from '@luma.gl/engine';
import {
  type CompiledGPUCommandGraph,
  DrawCommandBuffer,
  GPUCommandGraph,
  GPUGridIndex,
  type GraphDataView
} from '@luma.gl/gpgpu/gpu-core';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import test from 'test/utils/vitest-tape';
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
    (STORAGE_BINDING_ALIGNMENT * 5) / Uint32Array.BYTES_PER_ELEMENT + 1
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
  const intersectedCellCount = graph.createDataView(outputHandle, {
    format: 'uint32',
    length: 1,
    byteOffset: STORAGE_BINDING_ALIGNMENT * 4
  });
  const candidateCount = graph.createDataView(outputHandle, {
    format: 'uint32',
    length: 1,
    byteOffset: STORAGE_BINDING_ALIGNMENT * 5
  });

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

  tapeTest.throws(
    () =>
      new GPUPointSpatialQuery({
        id: 'diagnostic-output-alias',
        positions,
        kind: 'bounds',
        query,
        output: baseOutput,
        candidateCount: baseOutput.count
      }),
    /output candidateCount and output count must not overlap/,
    'candidate diagnostics cannot alias compact outputs'
  );
  tapeTest.throws(
    () =>
      new GPUPointSpatialQuery({
        id: 'diagnostic-input-alias',
        positions,
        sourceIds,
        kind: 'bounds',
        query,
        output: baseOutput,
        intersectedCellCount: sourceIds
      }),
    /intersectedCellCount.*sourceIds must not overlap/,
    'cell diagnostics cannot alias query inputs'
  );
  tapeTest.throws(
    () =>
      new GPUPointSpatialQuery({
        id: 'diagnostic-pair-alias',
        positions,
        kind: 'bounds',
        query,
        output: baseOutput,
        intersectedCellCount,
        candidateCount: intersectedCellCount
      }),
    /output candidateCount and output intersectedCellCount must not overlap/,
    'the two diagnostics cannot alias one another'
  );
  tapeTest.throws(
    () =>
      new GPUPointSpatialQuery({
        id: 'diagnostic-not-scalar',
        positions,
        kind: 'bounds',
        query,
        output: baseOutput,
        candidateCount: graph.createDataView(outputHandle, {
          format: 'uint32',
          length: 2,
          byteOffset: STORAGE_BINDING_ALIGNMENT * 4
        })
      }),
    /candidateCount must be one packed uint32 scalar/,
    'diagnostics must be scalar views'
  );

  const foreignDiagnosticBuffer = createOutputBuffer(device, 1);
  const foreignGraph = new GPUCommandGraph(device, {id: 'foreign-diagnostic-graph'});
  const foreignQuery = new GPUPointSpatialQuery({
    id: 'foreign-diagnostic',
    positions,
    kind: 'bounds',
    query,
    output: baseOutput,
    candidateCount: importView(
      foreignGraph,
      'foreign-candidate-count',
      foreignDiagnosticBuffer,
      'uint32',
      1
    )
  });
  tapeTest.throws(
    () => foreignQuery.addToGraph(graph),
    /views must belong to the target graph/,
    'diagnostics must belong to the target graph'
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
    output: baseOutput,
    intersectedCellCount,
    candidateCount
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
  tapeTest.equal(
    await readUint32At(outputBuffer, STORAGE_BINDING_ALIGNMENT * 4),
    0,
    'aligned intersectedCellCount is writable'
  );
  tapeTest.equal(
    await readUint32At(outputBuffer, STORAGE_BINDING_ALIGNMENT * 5),
    1,
    'aligned candidateCount is writable'
  );

  compiled.destroy();
  dynamicPositionsBuffer.destroy();
  positionsBuffer.destroy();
  sourceIdsBuffer.destroy();
  queryBuffer.destroy();
  outputBuffer.destroy();
  packedOutputBuffer.destroy();
  foreignDiagnosticBuffer.destroy();
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
  const intersectedCellCountBuffer = createOutputBuffer(device, 1);
  const candidateCountBuffer = createOutputBuffer(device, 1);
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
    },
    intersectedCellCount: importView(
      graph,
      'intersected-cell-count',
      intersectedCellCountBuffer,
      'uint32',
      1
    ),
    candidateCount: importView(graph, 'candidate-count', candidateCountBuffer, 'uint32', 1)
  }).addToGraph(graph);

  const compiled = graph.compile();
  encode(device, compiled);
  const drawCount = await readDrawCount(drawCommands);

  tapeTest.equal(drawCount, 2, 'the DrawCommandBuffer instance count is clamped to ID capacity');
  const ids = await readUint32(idsBuffer, Math.min(drawCount, 2));
  tapeTest.equal((await readUint32(totalCountBuffer, 1))[0], 6, 'totalCount remains unclamped');
  tapeTest.equal(
    (await readUint32(intersectedCellCountBuffer, 1))[0],
    0,
    'a scan reports zero intersected cells'
  );
  tapeTest.equal(
    (await readUint32(candidateCountBuffer, 1))[0],
    6,
    'a valid scan presents every position row to the narrow phase'
  );
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
  intersectedCellCountBuffer.destroy();
  candidateCountBuffer.destroy();
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
  const intersectedCellCountBuffer = createOutputBuffer(device, 1);
  const candidateCountBuffer = createOutputBuffer(device, 1);
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
    },
    intersectedCellCount: importView(
      graph,
      'intersected-cell-count',
      intersectedCellCountBuffer,
      'uint32',
      1
    ),
    candidateCount: importView(graph, 'candidate-count', candidateCountBuffer, 'uint32', 1)
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
  tapeTest.equal(
    (await readUint32(intersectedCellCountBuffer, 1))[0],
    1,
    'the one-cell index reports one intersected cell'
  );
  tapeTest.equal(
    (await readUint32(candidateCountBuffer, 1))[0],
    2,
    'candidateCount covers exactly the row IDs retained by the overflowing index'
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
    totalCountBuffer,
    intersectedCellCountBuffer,
    candidateCountBuffer
  ]) {
    buffer.destroy();
  }
  tapeTest.end();
});

test('GPUPointSpatialQuery reports exact indexed broad-phase work without source-sized scratch', async tapeTest => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    tapeTest.comment('WebGPU is not available');
    tapeTest.end();
    return;
  }

  const gridWidth = 4;
  const outputCapacity = 1_000_000;
  const positionsBuffer = createInputBuffer(
    device,
    Float32Array.from([1.5, 1.5, 0.5, 0.5, 2.5, 2.5, 1.5, 1.5])
  );
  const sourceIdsBuffer = createInputBuffer(device, Uint32Array.from([700, 701, 702, 703]));
  const queryBuffer = createInputBuffer(device, Float32Array.from([1.49, 1.49, 1.51, 1.51]));
  const cellOffsetsBuffer = createInputBuffer(
    device,
    Uint32Array.from([0, 2, 3, 3, 3, 3, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 6])
  );
  // Row 1 is retained twice and row 999 is invalid. Row 3 is a matching poison row assigned to the
  // far corner cell; indexed refinement must not visit it.
  const rowIndicesBuffer = createInputBuffer(device, Uint32Array.from([1, 1, 999, 0, 2, 3]));
  const indexCountBuffer = createInputBuffer(device, Uint32Array.from([6]));
  const indexOverflowBuffer = createInputBuffer(device, Uint32Array.from([0]));
  const idsBuffer = createOutputBuffer(device, outputCapacity);
  const countBuffer = createOutputBuffer(device, 1);
  const overflowBuffer = createOutputBuffer(device, 1);
  const totalCountBuffer = createOutputBuffer(device, 1);
  const intersectedCellCountBuffer = createOutputBuffer(device, 1);
  const candidateCountBuffer = createOutputBuffer(device, 1);
  const graph = new GPUCommandGraph(device, {id: 'spatial-query-indirect-candidates'});
  const positions = importView(graph, 'positions', positionsBuffer, 'float32x2', 4);
  const cellOffsets = importView(graph, 'cell-offsets', cellOffsetsBuffer, 'uint32', 17);
  const rowIndices = importView(graph, 'row-indices', rowIndicesBuffer, 'uint32', 6);
  const indexCount = importView(graph, 'index-count', indexCountBuffer, 'uint32', 1);
  const indexOverflow = importView(graph, 'index-overflow', indexOverflowBuffer, 'uint32', 1);
  new GPUPointSpatialQuery({
    id: 'dispatch-query',
    positions,
    sourceIds: importView(graph, 'source-ids', sourceIdsBuffer, 'uint32', 4),
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
      ids: importView(graph, 'ids', idsBuffer, 'uint32', outputCapacity),
      count: importView(graph, 'count', countBuffer, 'uint32', 1),
      overflow: importView(graph, 'overflow', overflowBuffer, 'uint32', 1),
      totalCount: importView(graph, 'total-count', totalCountBuffer, 'uint32', 1)
    },
    intersectedCellCount: importView(
      graph,
      'intersected-cell-count',
      intersectedCellCountBuffer,
      'uint32',
      1
    ),
    candidateCount: importView(graph, 'candidate-count', candidateCountBuffer, 'uint32', 1)
  }).addToGraph(graph);

  const compiled = graph.compile();
  const dispatchProbe = encodeWithDispatchProbe(device, compiled, 'dispatch-query-refine');
  const count = (await readUint32(countBuffer, 1))[0];

  tapeTest.deepEqual(
    compiled.stats.nodeOrder,
    ['dispatch-query-prepare', 'dispatch-query-refine', 'dispatch-query-finalize'],
    'source IDs are written during refinement without a capacity-sized remap pass'
  );
  tapeTest.equal(
    compiled.stats.logicalTransientBytes,
    15 * Uint32Array.BYTES_PER_ELEMENT,
    'the query owns only its fixed 12-word dispatch state and optional three-word result state'
  );
  const baselineGraph = new GPUCommandGraph(device, {id: 'spatial-query-two-word-result-state'});
  const baselinePositions = importView(
    baselineGraph,
    'baseline-positions',
    positionsBuffer,
    'float32x2',
    4
  );
  new GPUPointSpatialQuery({
    id: 'baseline-query',
    positions: baselinePositions,
    index: {
      gridSize: [gridWidth, gridWidth],
      bounds: [0, 0, gridWidth, gridWidth],
      cellOffsets: importView(
        baselineGraph,
        'baseline-cell-offsets',
        cellOffsetsBuffer,
        'uint32',
        17
      ),
      rowIndices: importView(baselineGraph, 'baseline-row-indices', rowIndicesBuffer, 'uint32', 6),
      count: importView(baselineGraph, 'baseline-index-count', indexCountBuffer, 'uint32', 1),
      overflow: importView(
        baselineGraph,
        'baseline-index-overflow',
        indexOverflowBuffer,
        'uint32',
        1
      )
    },
    kind: 'bounds',
    query: importView(baselineGraph, 'baseline-query-values', queryBuffer, 'float32', 4),
    output: {
      ids: importView(baselineGraph, 'baseline-ids', idsBuffer, 'uint32', 4),
      count: importView(baselineGraph, 'baseline-count', countBuffer, 'uint32', 1),
      overflow: importView(baselineGraph, 'baseline-overflow', overflowBuffer, 'uint32', 1)
    }
  }).addToGraph(baselineGraph);
  const baselineCompiled = baselineGraph.compile();
  tapeTest.equal(
    baselineCompiled.stats.logicalTransientBytes,
    14 * Uint32Array.BYTES_PER_ELEMENT,
    'omitting candidateCount preserves the two-word result state'
  );
  baselineCompiled.destroy();
  tapeTest.equal(dispatchProbe.indirect, 1, 'indexed refinement records one indirect dispatch');
  tapeTest.equal(
    dispatchProbe.direct,
    0,
    'indexed refinement does not record a fixed full-N dispatch'
  );
  tapeTest.equal(count, 1, 'indexed refinement returns one exact match');
  tapeTest.deepEqual(
    await readUint32(idsBuffer, count),
    [700],
    'the exact match is dereferenced to its source ID during refinement'
  );
  tapeTest.equal(
    (await readUint32(intersectedCellCountBuffer, 1))[0],
    9,
    'the conservative three-by-three cell range is reported exactly'
  );
  tapeTest.equal(
    (await readUint32(candidateCountBuffer, 1))[0],
    5,
    'retained rows in active cells include duplicate and invalid row IDs exactly'
  );

  queryBuffer.write(Float32Array.from([Number.NaN, 0, 1, 1]));
  encode(device, compiled);
  tapeTest.deepEqual(
    [
      (await readUint32(intersectedCellCountBuffer, 1))[0],
      (await readUint32(candidateCountBuffer, 1))[0]
    ],
    [0, 0],
    'a mutable invalid query resets both diagnostics'
  );

  queryBuffer.write(Float32Array.from([10, 10, 11, 11]));
  encode(device, compiled);
  tapeTest.deepEqual(
    [
      (await readUint32(intersectedCellCountBuffer, 1))[0],
      (await readUint32(candidateCountBuffer, 1))[0]
    ],
    [0, 0],
    'a mutable query outside the index domain resets both diagnostics'
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
    totalCountBuffer,
    intersectedCellCountBuffer,
    candidateCountBuffer
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
  compiled.encode(commandEncoder, {parameters: undefined, coalesceComputePasses: false});
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
