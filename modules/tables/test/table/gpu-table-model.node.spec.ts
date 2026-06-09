// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {Buffer, type ShaderLayout} from '@luma.gl/core';
import {NullDevice} from '@luma.gl/test-utils';
import {
  GPURecordBatch,
  GPU_TABLE_INDEX_COLUMN_NAME,
  GPUTable,
  GPUTableModel,
  GPUVector
} from '@luma.gl/tables';

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

const TABLE_MODEL_FRAGMENT_SHADER = /* glsl */ `\
#version 300 es
precision highp float;
out vec4 fragColor;
void main() {
  fragColor = vec4(1.0);
}
`;

test('GPUTableModel infers table row counts for instance, vertex, and none modes', t => {
  const device = new NullDevice({});
  const table = makePositionsTable(device, 3);
  const instanceModel = makeTableModel(device, table);
  const vertexModel = makeTableModel(device, table, {tableCount: 'vertex'});
  const noCountModel = makeTableModel(device, table, {tableCount: 'none'});

  t.equal(instanceModel.instanceCount, 3, 'defaults instanceCount to table rows');
  t.equal(vertexModel.vertexCount, 3, 'maps table rows to vertexCount when requested');
  t.equal(vertexModel.instanceCount, 0, 'does not infer instanceCount in vertex mode');
  t.equal(noCountModel.instanceCount, 0, 'does not infer instanceCount in none mode');
  t.equal(noCountModel.vertexCount, 0, 'does not infer vertexCount in none mode');

  instanceModel.destroy();
  vertexModel.destroy();
  noCountModel.destroy();
  table.destroy();
  t.end();
});

test('GPUTableModel merges explicit model state and rejects duplicate table inputs', t => {
  const device = new NullDevice({});
  const table = makePositionsTable(device, 2);
  const explicitPositions = device.createBuffer({data: new Float32Array([1, 1, 2, 2])});

  t.throws(
    () =>
      makeTableModel(device, table, {
        attributes: {positions: explicitPositions}
      }),
    /duplicates an explicit attribute/,
    'rejects explicit attributes that collide with table attributes'
  );

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

  t.deepEqual(
    model.bufferLayout.map(layout => layout.name),
    ['weights', 'positions'],
    'prepends explicit layouts before table layouts'
  );
  t.equal(
    model.vertexArray.attributes[0],
    extraBuffer,
    'retains explicitly supplied attribute bindings'
  );
  t.equal(
    model.vertexArray.attributes[1],
    table.attributes['positions'],
    'adds table attributes after explicit model bindings'
  );

  model.destroy();
  explicitPositions.destroy();
  extraBuffer.destroy();
  table.destroy();
  t.end();
});

test('GPUTableModel binds interleaved table buffers by layout name', t => {
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

  t.deepEqual(Object.keys(table.attributes), ['matrices'], 'keeps the layout-named buffer');
  t.equal(
    model.vertexArray.attributes[0],
    matrixBuffer,
    'binds the shared buffer to the first interleaved shader attribute'
  );
  t.equal(
    model.vertexArray.attributes[1],
    matrixBuffer,
    'binds the shared buffer to the second interleaved shader attribute'
  );

  model.destroy();
  table.destroy();
  t.end();
});

test('GPUTableModel draws preserved batches and restores table-level bindings', t => {
  const device = new NullDevice({});
  const table = makeBatchedPositionsTable(device, [1, 2]);
  const model = makeTableModel(device, table);
  const renderPass = device.getDefaultRenderPass();
  const batchBuffers = table.batches.map(batch => batch.gpuVectors['positions'].data[0].buffer);
  const drawCalls: Array<{instanceCount?: number; buffer?: unknown}> = [];
  const draw = model.pipeline.draw.bind(model.pipeline);

  model.pipeline.draw = options => {
    drawCalls.push({
      instanceCount: options.instanceCount,
      buffer: options.vertexArray.attributes[0]
    });
    return draw(options);
  };

  t.ok(model.drawBatches(renderPass), 'draws every preserved GPU record batch');
  t.deepEqual(
    drawCalls.map(drawCall => drawCall.instanceCount),
    [1, 2],
    'uses each batch row count while drawing'
  );
  t.deepEqual(
    drawCalls.map(drawCall => drawCall.buffer),
    batchBuffers,
    'rebinds batch-local attribute buffers'
  );
  t.equal(
    model.vertexArray.attributes[0],
    table.attributes['positions'],
    'restores table-level attribute buffers after batched drawing'
  );

  renderPass.destroy();
  model.destroy();
  table.destroy();
  t.end();
});

test('GPUTableModel binds reserved table indices for indexed draws', t => {
  const device = new NullDevice({});
  const indexValues = new Uint32Array([0, 1, 2, 2, 1, 0]);
  const table = makeIndexedPositionsTable(device, 3, indexValues);
  const model = makeTableModel(device, table, {tableCount: 'none'});
  const renderPass = device.getDefaultRenderPass();
  const indexBuffer = table.gpuVectors[GPU_TABLE_INDEX_COLUMN_NAME].data[0].buffer;
  const drawCalls: Array<{indexBuffer?: unknown; vertexCount?: number; indexCount?: number}> = [];
  const draw = model.pipeline.draw.bind(model.pipeline);

  model.pipeline.draw = options => {
    drawCalls.push({
      indexBuffer: options.vertexArray.indexBuffer,
      vertexCount: options.vertexCount,
      indexCount: options.indexCount
    });
    return draw(options);
  };

  t.deepEqual(
    table.bufferLayout.map(layout => layout.name),
    ['positions'],
    'keeps the reserved indices column out of the attribute layout'
  );
  t.equal(model.vertexArray.indexBuffer, indexBuffer, 'binds the reserved indices buffer');
  t.equal(model.vertexCount, indexValues.length, 'uses flattened index count as vertex count');
  t.ok(model.draw(renderPass), 'draws the indexed table');
  t.deepEqual(
    drawCalls,
    [{indexBuffer, vertexCount: indexValues.length, indexCount: indexValues.length}],
    'passes indexed draw state to the render pipeline'
  );

  renderPass.destroy();
  model.destroy();
  table.destroy();
  t.end();
});

test('GPUTableModel draws reserved index vector slices by valueLength', t => {
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
  const draw = model.pipeline.draw.bind(model.pipeline);

  model.pipeline.draw = options => {
    drawCalls.push({
      vertexCount: options.vertexCount,
      indexCount: options.indexCount,
      firstVertex: options.firstVertex,
      firstIndex: options.firstIndex
    });
    return draw(options);
  };

  t.equal(model.vertexCount, 3, 'uses sliced index valueLength as vertex count');
  t.equal(model.indexCount, 3, 'retains sliced index valueLength as indexed draw count');
  t.equal(model.firstVertex, Uint32Array.BYTES_PER_ELEMENT * 2, 'retains WebGL byte offset');
  t.equal(model.firstIndex, 2, 'retains WebGPU first index element');
  t.ok(model.draw(renderPass), 'draws the sliced indexed table');
  t.deepEqual(
    drawCalls,
    [
      {
        vertexCount: 3,
        indexCount: 3,
        firstVertex: Uint32Array.BYTES_PER_ELEMENT * 2,
        firstIndex: 2
      }
    ],
    'passes reserved index vector slice metadata to the render pipeline'
  );

  renderPass.destroy();
  model.destroy();
  table.destroy();
  t.end();
});

test('GPUTableModel draws preserved indexed batches and restores aggregate state', t => {
  const device = new NullDevice({});
  const table = makeBatchedIndexedPositionsTable(device, [
    {rowCount: 3, indices: new Uint32Array([0, 1, 2])},
    {rowCount: 4, indices: new Uint32Array([0, 1, 2, 2, 1, 3])}
  ]);
  const model = makeTableModel(device, table, {tableCount: 'none'});
  const renderPass = device.getDefaultRenderPass();
  const batchIndexBuffers = table.batches.map(
    batch => batch.gpuVectors[GPU_TABLE_INDEX_COLUMN_NAME].data[0].buffer
  );
  const drawCalls: Array<{indexBuffer?: unknown; vertexCount?: number; indexCount?: number}> = [];
  const draw = model.pipeline.draw.bind(model.pipeline);

  model.pipeline.draw = options => {
    drawCalls.push({
      indexBuffer: options.vertexArray.indexBuffer,
      vertexCount: options.vertexCount,
      indexCount: options.indexCount
    });
    return draw(options);
  };

  t.ok(model.drawBatches(renderPass), 'draws every preserved indexed GPU record batch');
  t.deepEqual(
    drawCalls.map(drawCall => drawCall.indexBuffer),
    batchIndexBuffers,
    'rebinds batch-local index buffers'
  );
  t.deepEqual(
    drawCalls.map(drawCall => drawCall.vertexCount),
    [3, 6],
    'uses each batch flattened index count as vertex count'
  );
  t.deepEqual(
    drawCalls.map(drawCall => drawCall.indexCount),
    [3, 6],
    'passes each batch flattened index count to indexed draws'
  );
  t.equal(model.vertexArray.indexBuffer, null, 'restores the unbound aggregate index state');

  renderPass.destroy();
  model.destroy();
  table.destroy();
  t.end();
});

test('GPUTableModel requires reserved table indices to use INDEX buffers', t => {
  const device = new NullDevice({});
  const table = makeIndexedPositionsTable(device, 3, new Uint32Array([0, 1, 2]), Buffer.VERTEX);

  t.throws(
    () => makeTableModel(device, table, {tableCount: 'none'}),
    /requires Buffer\.INDEX usage/,
    'rejects reserved indices buffers without INDEX usage'
  );

  table.destroy();
  t.end();
});

test('GPUTableModel refreshes inferred counts when a table row count changes', t => {
  const device = new NullDevice({});
  const table = makePositionsTable(device, 1);
  const model = makeTableModel(device, table);

  table.batches[0].appendRows(3);
  table.refreshFromBatches();
  model.needsRedraw();

  t.equal(model.instanceCount, 4, 'syncs inferred row counts before redraw checks');

  model.destroy();
  table.destroy();
  t.end();
});

test('GPUTable preserves source-row metadata across batch operations', t => {
  const device = new NullDevice({});
  const firstBatch = new GPURecordBatch({
    vectors: {positions: makePositionsVector(device, 1)},
    sourceInfo: {sourceBatchIndex: 0, sourceRowIndexOffset: 10, sourceRowCount: 1}
  });
  const secondBatch = new GPURecordBatch({
    vectors: {positions: makePositionsVector(device, 2)},
    sourceInfo: {sourceBatchIndex: 1, sourceRowIndexOffset: 11, sourceRowCount: 2}
  });
  const table = new GPUTable({
    batches: [firstBatch],
    schema: firstBatch.schema,
    bufferLayout: firstBatch.bufferLayout
  });

  table.addBatch(secondBatch);
  t.deepEqual(
    table.batches[0].sourceInfo,
    firstBatch.sourceInfo,
    'retains first batch source info'
  );
  t.deepEqual(
    table.batches[1].sourceInfo,
    secondBatch.sourceInfo,
    'retains appended batch source info'
  );

  const detachedBatches = table.detachBatches({first: 1});
  t.deepEqual(
    detachedBatches[0].sourceInfo,
    secondBatch.sourceInfo,
    'detach preserves batch source info'
  );

  table.destroy();
  for (const batch of detachedBatches) {
    batch.destroy();
  }
  t.end();
});

test('GPUTable forwards one-batch source info and drops unrepresentable packed metadata', t => {
  const device = new NullDevice({});
  const table = new GPUTable({
    vectors: {positions: makePositionsVector(device, 1)},
    sourceInfo: {sourceBatchIndex: 3, sourceRowIndexOffset: 20, sourceRowCount: 1}
  });
  const batchedTable = makeBatchedPositionsTable(device, [1, 2]);

  t.deepEqual(
    table.batches[0].sourceInfo,
    {sourceBatchIndex: 3, sourceRowIndexOffset: 20, sourceRowCount: 1},
    'forwards one-batch table source info'
  );

  batchedTable.packBatches();
  t.equal(batchedTable.batches.length, 1, 'packs adjacent batches');
  t.equal(
    batchedTable.batches[0].sourceInfo,
    undefined,
    'omits packed source info when multiple source batches were merged'
  );

  table.destroy();
  batchedTable.destroy();
  t.end();
});

test('GPUTable preserves packed source info for one contiguous source batch', t => {
  const device = new NullDevice({});
  const table = makeContiguousSourceBatchedPositionsTable(device);

  table.packBatches();

  t.equal(table.batches.length, 1, 'packs contiguous source rows');
  t.deepEqual(
    table.batches[0].sourceInfo,
    {sourceBatchIndex: 0, sourceRowIndexOffset: 0, sourceRowCount: 3},
    'merges source info when the packed batch still represents one source batch'
  );

  table.destroy();
  t.end();
});

test('GPUTable rejects packing indexed batches', t => {
  const device = new NullDevice({});
  const table = makeBatchedIndexedPositionsTable(device, [
    {rowCount: 3, indices: new Uint32Array([0, 1, 2])},
    {rowCount: 3, indices: new Uint32Array([0, 1, 2])}
  ]);

  t.throws(
    () => table.packBatches(),
    /does not support indexed tables/,
    'does not pack local batch indices without rebasing'
  );

  table.destroy();
  t.end();
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
      vectors: {positions: makePositionsVector(device, rowCount)},
      sourceInfo: {sourceBatchIndex, sourceRowIndexOffset, sourceRowCount: rowCount}
    });
    sourceRowIndexOffset += rowCount;
    return batch;
  });
  return new GPUTable({
    batches,
    schema: batches[0].schema,
    bufferLayout: batches[0].bufferLayout
  });
}

function makeBatchedIndexedPositionsTable(
  device: NullDevice,
  batchProps: Array<{rowCount: number; indices: Uint32Array}>
): GPUTable {
  const batches = batchProps.map(
    ({rowCount, indices}) =>
      new GPURecordBatch({
        vectors: {
          positions: makePositionsVector(device, rowCount),
          [GPU_TABLE_INDEX_COLUMN_NAME]: makeIndicesVector(device, rowCount, indices)
        }
      })
  );
  return new GPUTable({
    batches,
    schema: batches[0].schema,
    bufferLayout: batches[0].bufferLayout
  });
}

function makeContiguousSourceBatchedPositionsTable(device: NullDevice): GPUTable {
  let sourceRowIndexOffset = 0;
  const batches = [1, 2].map(rowCount => {
    const batch = new GPURecordBatch({
      vectors: {positions: makePositionsVector(device, rowCount)},
      sourceInfo: {sourceBatchIndex: 0, sourceRowIndexOffset, sourceRowCount: rowCount}
    });
    sourceRowIndexOffset += rowCount;
    return batch;
  });
  return new GPUTable({
    batches,
    schema: batches[0].schema,
    bufferLayout: batches[0].bufferLayout
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
