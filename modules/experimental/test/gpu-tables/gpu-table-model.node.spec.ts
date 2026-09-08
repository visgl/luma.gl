// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {Buffer, type ShaderLayout} from '@luma.gl/core';
import {Geometry} from '@luma.gl/engine';
import {NullDevice} from '@luma.gl/test-utils';
import {GPUVector} from '@luma.gl/gpgpu/gpu-data';
import {
  GPURecordBatch,
  GPU_TABLE_INDEX_COLUMN_NAME,
  GPUTable,
  GPUTableModel
} from '@luma.gl/experimental/gpu-tables';

const TABLE_MODEL_SHADER_LAYOUT = {
  attributes: [{name: 'positions', location: 0, type: 'vec2<f32>', stepMode: 'instance'}],
  bindings: []
} satisfies ShaderLayout;

const INTERLEAVED_TABLE_MODEL_SHADER_LAYOUT = {
  attributes: [
    {name: 'matrixColumn0', location: 0, type: 'vec4<f32>', stepMode: 'instance'},
    {name: 'matrixColumn1', location: 1, type: 'vec4<f32>', stepMode: 'instance'}
  ],
  bindings: []
} satisfies ShaderLayout;

const TABLE_MODEL_GEOMETRY_SHADER_LAYOUT = {
  attributes: [
    {name: 'geometryPositions', location: 0, type: 'vec2<f32>'},
    {name: 'positions', location: 1, type: 'vec2<f32>', stepMode: 'instance'}
  ],
  bindings: []
} satisfies ShaderLayout;

const TABLE_MODEL_VERTEX_SHADER = /* glsl */ `\
#version 300 es
in vec2 positions;
void main() {
  gl_Position = vec4(positions, 0.0, 1.0);
}
`;

const INTERLEAVED_TABLE_MODEL_VERTEX_SHADER = /* glsl */ `\
#version 300 es
in vec4 matrixColumn0;
in vec4 matrixColumn1;
void main() {
  gl_Position = matrixColumn0 + matrixColumn1 * 0.0;
}
`;

const TABLE_MODEL_GEOMETRY_VERTEX_SHADER = /* glsl */ `\
#version 300 es
in vec2 geometryPositions;
in vec2 positions;
void main() {
  gl_Position = vec4(geometryPositions + positions * 0.0, 0.0, 1.0);
}
`;

const TABLE_MODEL_FRAGMENT_SHADER = /* glsl */ `\
#version 300 es
precision highp float;
out vec4 fragColor;
void main() {
  fragColor = vec4(1.0);
}
`;

it('GPUTableModel infers table row counts for instance, vertex, and none modes', () => {
  const device = new NullDevice({});
  const table = makePositionsTable(device, 3);
  const instanceModel = makeTableModel(device, table);
  const vertexModel = makeTableModel(device, table, {tableCount: 'vertex'});
  const noCountModel = makeTableModel(device, table, {tableCount: 'none'});

  expect(instanceModel.instanceCount, 'defaults instanceCount to table rows').toBe(3);
  expect(vertexModel.vertexCount, 'maps table rows to vertexCount when requested').toBe(3);
  expect(vertexModel.instanceCount, 'does not infer instanceCount in vertex mode').toBe(0);
  expect(noCountModel.instanceCount, 'does not infer instanceCount in none mode').toBe(0);
  expect(noCountModel.vertexCount, 'does not infer vertexCount in none mode').toBe(0);

  instanceModel.destroy();
  vertexModel.destroy();
  noCountModel.destroy();
  table.destroy();
  void 0;
});

it('GPUTableModel merges explicit model state and rejects duplicate table inputs', () => {
  const device = new NullDevice({});
  const table = makePositionsTable(device, 2);
  const explicitPositions = device.createBuffer({data: new Float32Array([1, 1, 2, 2])});

  expect(
    () =>
      makeTableModel(device, table, {
        attributes: {positions: explicitPositions}
      }),
    'rejects explicit attributes that collide with table attributes'
  ).toThrow(/duplicates an explicit attribute/);

  const extraBuffer = device.createBuffer({data: new Float32Array([0, 1])});
  const model = makeTableModel(device, table, {
    shaderLayout: {
      attributes: [
        {name: 'weights', location: 0, type: 'f32'},
        {name: 'positions', location: 1, type: 'vec2<f32>', stepMode: 'instance'}
      ],
      bindings: []
    },
    bufferLayout: [{name: 'weights', format: 'float32'}],
    attributes: {weights: extraBuffer}
  });

  expect(
    model.bufferLayout.map(layout => layout.name),
    'prepends explicit layouts before table layouts'
  ).toEqual(['weights', 'positions']);
  expect(model.vertexArray.attributes[0], 'retains explicitly supplied attribute bindings').toBe(
    extraBuffer
  );
  expect(
    model.vertexArray.attributes[1],
    'adds table attributes after explicit model bindings'
  ).toBe(table.batches[0].gpuData.positions.buffer);

  model.destroy();
  explicitPositions.destroy();
  extraBuffer.destroy();
  table.destroy();
  void 0;
});

it('GPUTableModel binds interleaved table buffers by layout name', () => {
  const device = new NullDevice({});
  const matrixBuffer = device.createBuffer({byteLength: 64});
  const table = new GPUTable({
    vectors: {
      matrices: new GPUVector({
        type: 'interleaved',
        name: 'matrices',
        buffer: matrixBuffer,
        length: 2,
        byteStride: 32,
        attributes: [
          {attribute: 'matrixColumn0', format: 'float32x4', byteOffset: 0},
          {attribute: 'matrixColumn1', format: 'float32x4', byteOffset: 16}
        ],
        ownsBuffer: true
      })
    }
  });
  const model = new GPUTableModel(device, {
    id: 'gpu-table-interleaved-model-test',
    vs: INTERLEAVED_TABLE_MODEL_VERTEX_SHADER,
    fs: TABLE_MODEL_FRAGMENT_SHADER,
    shaderLayout: INTERLEAVED_TABLE_MODEL_SHADER_LAYOUT,
    table
  });

  expect(
    Boolean('attributes' in table),
    'does not cache derived attribute buffers on the table'
  ).toBe(false);
  expect(
    model.vertexArray.attributes[0],
    'binds the shared buffer to the first interleaved shader attribute'
  ).toBe(matrixBuffer);
  expect(
    model.vertexArray.attributes[1],
    'binds the shared buffer to the second interleaved shader attribute'
  ).toBe(matrixBuffer);

  model.destroy();
  table.destroy();
  void 0;
});

it('GPUTableModel draws preserved batches and restores table-level bindings', () => {
  const device = new NullDevice({});
  const table = makeBatchedPositionsTable(device, [1, 2]);
  const model = makeTableModel(device, table);
  const renderPass = device.getDefaultRenderPass();
  const batchBuffers = table.batches.map(batch => batch.gpuData['positions'].buffer);
  const drawCalls: Array<{instanceCount?: number; buffer?: unknown}> = [];
  const draw = renderPass.draw.bind(renderPass);

  renderPass.draw = options => {
    drawCalls.push({
      instanceCount: options.instanceCount,
      buffer: renderPass.vertexArray?.attributes[0]
    });
    return draw(options);
  };

  expect(Boolean(model.drawBatches(renderPass)), 'draws every preserved GPU record batch').toBe(
    true
  );
  expect(
    drawCalls.map(drawCall => drawCall.instanceCount),
    'uses each batch row count while drawing'
  ).toEqual([1, 2]);
  expect(
    drawCalls.map(drawCall => drawCall.buffer),
    'rebinds batch-local attribute buffers'
  ).toEqual(batchBuffers);
  expect(
    model.vertexArray.attributes[0],
    'restores table-level attribute buffers after batched drawing'
  ).toBe(batchBuffers[0]);

  renderPass.destroy();
  model.destroy();
  table.destroy();
  void 0;
});

it('GPUTableModel binds reserved table indices for indexed draws', () => {
  const device = new NullDevice({});
  const indexValues = new Uint32Array([0, 1, 2, 2, 1, 0]);
  const table = makeIndexedPositionsTable(device, 3, indexValues);
  const model = makeTableModel(device, table, {tableCount: 'none'});
  const renderPass = device.getDefaultRenderPass();
  const indexBuffer = table.gpuVectors[GPU_TABLE_INDEX_COLUMN_NAME].data[0].buffer;
  const drawCalls: Array<{indexBuffer?: unknown; vertexCount?: number; indexCount?: number}> = [];
  const draw = renderPass.draw.bind(renderPass);

  renderPass.draw = options => {
    drawCalls.push({
      indexBuffer: renderPass.vertexArray?.indexBuffer,
      vertexCount: options.vertexCount,
      indexCount: options.indexCount
    });
    return draw(options);
  };

  expect(
    table.bufferLayout.map(layout => layout.name),
    'keeps the reserved indices column out of the attribute layout'
  ).toEqual(['positions']);
  expect(model.vertexArray.indexBuffer, 'binds the reserved indices buffer').toBe(indexBuffer);
  expect(model.vertexCount, 'uses flattened index count as vertex count').toBe(indexValues.length);
  expect(Boolean(model.draw(renderPass)), 'draws the indexed table').toBe(true);
  expect(drawCalls, 'passes indexed draw state to the render pass').toEqual([
    {indexBuffer, vertexCount: indexValues.length, indexCount: indexValues.length}
  ]);

  renderPass.destroy();
  model.destroy();
  table.destroy();
  void 0;
});

it('GPUTableModel preserves geometry draw state with instance tables', () => {
  const device = new NullDevice({});
  const table = makePositionsTable(device, 2);
  const model = new GPUTableModel(device, {
    id: 'gpu-table-model-geometry-instance-test',
    vs: TABLE_MODEL_GEOMETRY_VERTEX_SHADER,
    fs: TABLE_MODEL_FRAGMENT_SHADER,
    shaderLayout: TABLE_MODEL_GEOMETRY_SHADER_LAYOUT,
    table,
    tableCount: 'instance',
    geometry: new Geometry({
      topology: 'triangle-list',
      indices: new Uint16Array([0, 1, 2]),
      attributes: {
        geometryPositions: {size: 2, value: new Float32Array([0, 0, 1, 0, 0, 1])}
      }
    })
  });
  const geometryIndexBuffer = model.indexBuffer;
  const nextTable = makePositionsTable(device, 3);

  expect(model.vertexCount, 'preserves geometry vertex count after initial table sync').toBe(3);
  expect(model.indexBuffer, 'preserves geometry index buffer').toBe(geometryIndexBuffer);
  expect(model.instanceCount, 'still infers instance count from table rows').toBe(2);

  model.setProps({table: nextTable});

  expect(model.vertexCount, 'preserves geometry vertex count after table replacement').toBe(3);
  expect(model.indexBuffer, 'preserves geometry index buffer after table replacement').toBe(
    geometryIndexBuffer
  );
  expect(model.instanceCount, 'updates instance count for replacement table rows').toBe(3);

  model.destroy();
  table.destroy();
  nextTable.destroy();
  void 0;
});

it('GPUTableModel draws reserved index vector slices by valueLength', () => {
  const device = new NullDevice({});
  const table = makeIndexedPositionsTableFromVector(
    device,
    3,
    makeIndexSliceVector(device, 3, new Uint32Array([9, 9, 0, 1, 2, 9]), 2, 3)
  );
  const model = makeTableModel(device, table, {tableCount: 'none'});
  const renderPass = device.getDefaultRenderPass();
  const drawCalls: Array<{
    vertexCount?: number;
    indexCount?: number;
    firstVertex?: number;
    firstIndex?: number;
  }> = [];
  const draw = renderPass.draw.bind(renderPass);

  renderPass.draw = options => {
    drawCalls.push({
      vertexCount: options.vertexCount,
      indexCount: options.indexCount,
      firstVertex: options.firstVertex,
      firstIndex: options.firstIndex
    });
    return draw(options);
  };

  expect(model.vertexCount, 'uses sliced index valueLength as vertex count').toBe(3);
  expect(model.indexCount, 'retains sliced index valueLength as indexed draw count').toBe(3);
  expect(model.firstVertex, 'retains WebGL byte offset').toBe(Uint32Array.BYTES_PER_ELEMENT * 2);
  expect(model.firstIndex, 'retains WebGPU first index element').toBe(2);
  expect(Boolean(model.draw(renderPass)), 'draws the sliced indexed table').toBe(true);
  expect(drawCalls, 'passes reserved index vector slice metadata to the render pass').toEqual([
    {
      vertexCount: 3,
      indexCount: 3,
      firstVertex: Uint32Array.BYTES_PER_ELEMENT * 2,
      firstIndex: 2
    }
  ]);

  renderPass.destroy();
  model.destroy();
  table.destroy();
  void 0;
});

it('GPUTableModel draws preserved indexed batches and restores aggregate state', () => {
  const device = new NullDevice({});
  const table = makeBatchedIndexedPositionsTable(device, [
    {rowCount: 3, indices: new Uint32Array([0, 1, 2])},
    {rowCount: 4, indices: new Uint32Array([0, 1, 2, 2, 1, 3])}
  ]);
  const model = makeTableModel(device, table, {tableCount: 'none'});
  const renderPass = device.getDefaultRenderPass();
  const batchIndexBuffers = table.batches.map(
    batch => batch.gpuData[GPU_TABLE_INDEX_COLUMN_NAME].buffer
  );
  const drawCalls: Array<{indexBuffer?: unknown; vertexCount?: number; indexCount?: number}> = [];
  const draw = renderPass.draw.bind(renderPass);

  renderPass.draw = options => {
    drawCalls.push({
      indexBuffer: renderPass.vertexArray?.indexBuffer,
      vertexCount: options.vertexCount,
      indexCount: options.indexCount
    });
    return draw(options);
  };

  expect(
    Boolean(model.drawBatches(renderPass)),
    'draws every preserved indexed GPU record batch'
  ).toBe(true);
  expect(
    drawCalls.map(drawCall => drawCall.indexBuffer),
    'rebinds batch-local index buffers'
  ).toEqual(batchIndexBuffers);
  expect(
    drawCalls.map(drawCall => drawCall.vertexCount),
    'uses each batch flattened index count as vertex count'
  ).toEqual([3, 6]);
  expect(
    drawCalls.map(drawCall => drawCall.indexCount),
    'passes each batch flattened index count to indexed draws'
  ).toEqual([3, 6]);
  expect(model.vertexArray.indexBuffer, 'restores the unbound aggregate index state').toBe(null);

  renderPass.destroy();
  model.destroy();
  table.destroy();
  void 0;
});

it('GPUTableModel requires reserved table indices to use INDEX buffers', () => {
  const device = new NullDevice({});
  const table = makeIndexedPositionsTable(device, 3, new Uint32Array([0, 1, 2]), Buffer.VERTEX);

  expect(
    () => makeTableModel(device, table, {tableCount: 'none'}),
    'rejects reserved indices buffers without INDEX usage'
  ).toThrow(/requires Buffer\.INDEX usage/);

  table.destroy();
  void 0;
});

it('GPUTable preserves source-row metadata across batch operations', () => {
  const device = new NullDevice({});
  const firstBatch = new GPURecordBatch({
    gpuData: {positions: makePositionsVector(device, 1).data[0]},
    sourceInfo: {sourceBatchIndex: 0, sourceRowIndexOffset: 10, sourceRowCount: 1}
  });
  const secondBatch = new GPURecordBatch({
    gpuData: {positions: makePositionsVector(device, 2).data[0]},
    sourceInfo: {sourceBatchIndex: 1, sourceRowIndexOffset: 11, sourceRowCount: 2}
  });
  const table = new GPUTable({
    batches: [firstBatch]
  });

  table.addBatch(secondBatch);
  expect(table.batches[0].sourceInfo, 'retains first batch source info').toEqual(
    firstBatch.sourceInfo
  );
  expect(table.batches[1].sourceInfo, 'retains appended batch source info').toEqual(
    secondBatch.sourceInfo
  );

  const detachedBatches = table.detachBatches({first: 1});
  expect(detachedBatches[0].sourceInfo, 'detach preserves batch source info').toEqual(
    secondBatch.sourceInfo
  );

  table.destroy();
  for (const batch of detachedBatches) {
    batch.destroy();
  }
  void 0;
});

it('GPUTable forwards one-batch source info and drops unrepresentable packed metadata', () => {
  const device = new NullDevice({});
  const table = new GPUTable({
    vectors: {positions: makePositionsVector(device, 1)},
    sourceInfo: {sourceBatchIndex: 3, sourceRowIndexOffset: 20, sourceRowCount: 1}
  });
  const batchedTable = makeBatchedPositionsTable(device, [1, 2]);

  expect(table.batches[0].sourceInfo, 'forwards one-batch table source info').toEqual({
    sourceBatchIndex: 3,
    sourceRowIndexOffset: 20,
    sourceRowCount: 1
  });

  batchedTable.packBatches();
  expect(batchedTable.batches.length, 'packs adjacent batches').toBe(1);
  expect(
    batchedTable.batches[0].sourceInfo,
    'omits packed source info when multiple source batches were merged'
  ).toBe(undefined);

  table.destroy();
  batchedTable.destroy();
  void 0;
});

it('GPUTable preserves packed source info for one contiguous source batch', () => {
  const device = new NullDevice({});
  const table = makeContiguousSourceBatchedPositionsTable(device);

  table.packBatches();

  expect(table.batches.length, 'packs contiguous source rows').toBe(1);
  expect(
    table.batches[0].sourceInfo,
    'merges source info when the packed batch still represents one source batch'
  ).toEqual({sourceBatchIndex: 0, sourceRowIndexOffset: 0, sourceRowCount: 3});

  table.destroy();
  void 0;
});

it('GPUTable rejects packing indexed batches', () => {
  const device = new NullDevice({});
  const table = makeBatchedIndexedPositionsTable(device, [
    {rowCount: 3, indices: new Uint32Array([0, 1, 2])},
    {rowCount: 3, indices: new Uint32Array([0, 1, 2])}
  ]);

  expect(() => table.packBatches(), 'does not pack local batch indices without rebasing').toThrow(
    /does not support indexed tables/
  );

  table.destroy();
  void 0;
});

function makeTableModel(
  device: NullDevice,
  table: GPUTable,
  props: Partial<ConstructorParameters<typeof GPUTableModel>[1]> = {}
): GPUTableModel {
  return new GPUTableModel(device, {
    id: 'gpu-table-model-test',
    vs: TABLE_MODEL_VERTEX_SHADER,
    fs: TABLE_MODEL_FRAGMENT_SHADER,
    shaderLayout: TABLE_MODEL_SHADER_LAYOUT,
    table,
    ...props
  });
}

function makePositionsTable(device: NullDevice, rowCount: number): GPUTable {
  return new GPUTable({vectors: {positions: makePositionsVector(device, rowCount)}});
}

function makeIndexedPositionsTable(
  device: NullDevice,
  rowCount: number,
  indices: Uint32Array,
  indexBufferUsage = Buffer.INDEX
): GPUTable {
  return new GPUTable({
    vectors: {
      positions: makePositionsVector(device, rowCount),
      [GPU_TABLE_INDEX_COLUMN_NAME]: makeIndicesVector(device, rowCount, indices, indexBufferUsage)
    }
  });
}

function makeIndexedPositionsTableFromVector(
  device: NullDevice,
  rowCount: number,
  indices: GPUVector
): GPUTable {
  return new GPUTable({
    vectors: {
      positions: makePositionsVector(device, rowCount),
      [GPU_TABLE_INDEX_COLUMN_NAME]: indices
    }
  });
}

function makeBatchedPositionsTable(device: NullDevice, rowCounts: number[]): GPUTable {
  let sourceRowIndexOffset = 0;
  const batches = rowCounts.map((rowCount, sourceBatchIndex) => {
    const batch = new GPURecordBatch({
      gpuData: {positions: makePositionsVector(device, rowCount).data[0]},
      sourceInfo: {sourceBatchIndex, sourceRowIndexOffset, sourceRowCount: rowCount}
    });
    sourceRowIndexOffset += rowCount;
    return batch;
  });
  return new GPUTable({
    batches
  });
}

function makeBatchedIndexedPositionsTable(
  device: NullDevice,
  batchProps: Array<{rowCount: number; indices: Uint32Array}>
): GPUTable {
  const batches = batchProps.map(
    ({rowCount, indices}) =>
      new GPURecordBatch({
        gpuData: {
          positions: makePositionsVector(device, rowCount).data[0],
          [GPU_TABLE_INDEX_COLUMN_NAME]: makeIndicesVector(device, rowCount, indices).data[0]
        }
      })
  );
  return new GPUTable({
    batches
  });
}

function makeContiguousSourceBatchedPositionsTable(device: NullDevice): GPUTable {
  let sourceRowIndexOffset = 0;
  const batches = [1, 2].map(rowCount => {
    const batch = new GPURecordBatch({
      gpuData: {positions: makePositionsVector(device, rowCount).data[0]},
      sourceInfo: {sourceBatchIndex: 0, sourceRowIndexOffset, sourceRowCount: rowCount}
    });
    sourceRowIndexOffset += rowCount;
    return batch;
  });
  return new GPUTable({
    batches
  });
}

function makePositionsVector(device: NullDevice, rowCount: number): GPUVector {
  return new GPUVector({
    type: 'buffer',
    name: 'positions',
    buffer: device.createBuffer({data: new Float32Array(rowCount * 2)}),
    format: 'float32x2',
    length: rowCount,
    stride: 2,
    byteStride: Float32Array.BYTES_PER_ELEMENT * 2,
    ownsBuffer: true
  });
}

function makeIndicesVector(
  device: NullDevice,
  rowCount: number,
  indices: Uint32Array,
  indexBufferUsage = Buffer.INDEX
): GPUVector {
  return new GPUVector({
    type: 'buffer',
    name: GPU_TABLE_INDEX_COLUMN_NAME,
    buffer: device.createBuffer({usage: indexBufferUsage, data: indices}),
    format: 'vertex-list<uint32>',
    length: rowCount,
    valueLength: indices.length,
    stride: 1,
    byteStride: Uint32Array.BYTES_PER_ELEMENT,
    ownsBuffer: true
  });
}

function makeIndexSliceVector(
  device: NullDevice,
  rowCount: number,
  indices: Uint32Array,
  firstIndex: number,
  indexCount: number
): GPUVector {
  return new GPUVector({
    type: 'buffer',
    name: GPU_TABLE_INDEX_COLUMN_NAME,
    buffer: device.createBuffer({usage: Buffer.INDEX, data: indices}),
    format: 'vertex-list<uint32>',
    length: rowCount,
    valueLength: indexCount,
    byteOffset: firstIndex * Uint32Array.BYTES_PER_ELEMENT,
    stride: 1,
    byteStride: Uint32Array.BYTES_PER_ELEMENT,
    ownsBuffer: true
  });
}
