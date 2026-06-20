// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {
  makeArrowFixedSizeListVector,
  makeGPURecordBatchFromArrowRecordBatch,
  makeGPUTableFromArrowTable,
  makeGPUGeometryFromArrow,
  type ArrowMeshTable
} from '@luma.gl/arrow';
import type {Buffer, ShaderLayout} from '@luma.gl/core';
import {DynamicBuffer, Model} from '@luma.gl/engine';
import {GPUTable, GPUTableModel} from '@luma.gl/tables';
import {NullDevice} from '@luma.gl/test-utils';
import * as arrow from 'apache-arrow';

const SHADER_LAYOUT: ShaderLayout = {
  attributes: [
    {name: 'positions', location: 0, type: 'vec2<f32>', stepMode: 'instance'},
    {name: 'colors', location: 1, type: 'vec4<f32>', stepMode: 'instance'}
  ],
  bindings: []
};

const STORAGE_SHADER_LAYOUT: ShaderLayout = {
  attributes: [{name: 'positions', location: 0, type: 'vec2<f32>', stepMode: 'instance'}],
  bindings: [{name: 'colors', type: 'read-only-storage', group: 0, location: 0}]
};

const FILTER_SHADER_LAYOUT: ShaderLayout = {
  attributes: [{name: 'filterValues', location: 0, type: 'f32', stepMode: 'instance'}],
  bindings: []
};

const DUMMY_VS = `#version 300 es
in vec2 positions;
void main() {
  gl_Position = vec4(positions, 0.0, 1.0);
}
`;

const DUMMY_FS = `#version 300 es
precision highp float;
out vec4 fragColor;
void main() {
  fragColor = vec4(1.0);
}
`;

const MESH_SHADER_LAYOUT: ShaderLayout = {
  attributes: [
    {name: 'positions', location: 0, type: 'vec3<f32>'},
    {name: 'colors', location: 1, type: 'vec4<f32>'}
  ],
  bindings: []
};

const DUMMY_MESH_VS = `#version 300 es
in vec3 positions;
in vec4 colors;
void main() {
  gl_Position = vec4(positions, 1.0);
}
`;

test('makeGPUTableFromArrowTable converts Arrow tables for GPUTableModel rendering', t => {
  const device = new NullDevice({});
  const arrowTable = makeArrowModelTable();
  const table = makeGPUTableFromArrowTable(device, arrowTable, {shaderLayout: SHADER_LAYOUT});
  const model = new GPUTableModel(device, {
    id: 'gpu-table-model-arrow-test',
    vs: DUMMY_VS,
    fs: DUMMY_FS,
    shaderLayout: SHADER_LAYOUT,
    table
  });
  const positionsBuffer = table.batches[0].gpuVectors.positions.data[0].buffer;

  t.ok(table instanceof GPUTable, 'creates a GPUTable');
  t.deepEqual(
    model.bufferLayout,
    [
      {name: 'positions', format: 'float32x2', stepMode: 'instance'},
      {name: 'colors', format: 'unorm8x4', stepMode: 'instance'}
    ],
    'sets buffer layout from converted Arrow columns'
  );
  t.equal(
    model.vertexArray.attributes[0],
    getConcreteTestBuffer(table.attributes.positions),
    'sets Model vertex array attributes from GPU table buffers'
  );
  t.equal(model.instanceCount, arrowTable.numRows, 'infers instanceCount from table row count');

  model.destroy();
  t.notOk(positionsBuffer.destroyed, 'GPUTableModel leaves converted tables caller-owned');
  table.destroy();
  t.ok(positionsBuffer.destroyed, 'caller destroys converted table buffers');
  t.end();
});

test('makeGPUTableFromArrowTable converts scalar filter values to float32 attributes', t => {
  const device = new NullDevice({});
  const arrowTable = new arrow.Table({
    filterValues: arrow.makeVector(new Float32Array([0, 0.5, 1]))
  });
  const table = makeGPUTableFromArrowTable(device, arrowTable, {
    shaderLayout: FILTER_SHADER_LAYOUT
  });

  t.equal(table.gpuVectors.filterValues.format, 'float32', 'filter vector uses float32 storage');
  t.deepEqual(
    table.bufferLayout,
    [{name: 'filterValues', format: 'float32', stepMode: 'instance'}],
    'table exposes a matching scalar instance buffer layout'
  );

  table.destroy();
  t.end();
});

test('makeGPUTableFromArrowTable exposes Arrow table rows as storage bindings', t => {
  const device = new NullDevice({});
  const arrowTable = makeArrowModelTable();
  const table = makeGPUTableFromArrowTable(device, arrowTable, {
    shaderLayout: STORAGE_SHADER_LAYOUT
  });
  const model = new GPUTableModel(device, {
    id: 'gpu-table-model-storage-table-test',
    vs: DUMMY_VS,
    fs: DUMMY_FS,
    shaderLayout: STORAGE_SHADER_LAYOUT,
    table
  });
  const colorsBuffer = table.batches[0].gpuVectors.colors.data[0].buffer;

  t.deepEqual(
    table.schema.fields.map(field => field.name),
    ['positions', 'colors'],
    'keeps attribute and storage columns in the selected GPU schema'
  );
  t.equal(table.bindings.colors, colorsBuffer, 'table exposes storage rows as a named binding');
  t.equal(model.bindings.colors, colorsBuffer, 'model receives storage bindings from the table');

  model.destroy();
  table.destroy();
  t.end();
});

test('GPUTableModel supports vertex and no count inference from converted Arrow tables', t => {
  const device = new NullDevice({});
  const arrowTable = makeArrowModelTable();
  const vertexTable = makeGPUTableFromArrowTable(device, arrowTable, {shaderLayout: SHADER_LAYOUT});
  const vertexModel = new GPUTableModel(device, {
    id: 'gpu-table-model-vertex-count-test',
    vs: DUMMY_VS,
    fs: DUMMY_FS,
    shaderLayout: SHADER_LAYOUT,
    table: vertexTable,
    tableCount: 'vertex'
  });

  t.equal(vertexModel.vertexCount, arrowTable.numRows, 'sets vertexCount from table row count');
  t.equal(vertexModel.instanceCount, 0, 'does not infer instanceCount in vertex mode');
  vertexModel.destroy();
  vertexTable.destroy();

  const noCountTable = makeGPUTableFromArrowTable(device, arrowTable, {
    shaderLayout: SHADER_LAYOUT
  });
  const noCountModel = new GPUTableModel(device, {
    id: 'gpu-table-model-no-count-test',
    vs: DUMMY_VS,
    fs: DUMMY_FS,
    shaderLayout: SHADER_LAYOUT,
    table: noCountTable,
    tableCount: 'none'
  });

  t.equal(noCountModel.vertexCount, 0, 'does not infer vertexCount in none mode');
  t.equal(noCountModel.instanceCount, 0, 'does not infer instanceCount in none mode');
  noCountModel.destroy();
  noCountTable.destroy();
  t.end();
});

test('GPUTableModel updates converted GPU table props', t => {
  const device = new NullDevice({});
  const table = makeGPUTableFromArrowTable(device, makeArrowModelTable(), {
    shaderLayout: SHADER_LAYOUT
  });
  const nextTable = makeGPUTableFromArrowTable(device, makeArrowModelTable(3), {
    shaderLayout: SHADER_LAYOUT
  });
  const model = new GPUTableModel(device, {
    id: 'gpu-table-model-update-test',
    vs: DUMMY_VS,
    fs: DUMMY_FS,
    shaderLayout: SHADER_LAYOUT,
    table
  });
  const previousPipeline = model.pipeline;

  model.setProps({table: nextTable});

  t.equal(model.instanceCount, nextTable.numRows, 'updates inferred instanceCount');
  t.equal(
    model.pipeline,
    previousPipeline,
    'does not rebuild pipeline when GPU table buffer layout is unchanged'
  );
  t.equal(
    model.vertexArray.attributes[0],
    getConcreteTestBuffer(nextTable.attributes.positions),
    'sets vertex array attributes from the updated GPU table buffers'
  );

  model.destroy();
  table.destroy();
  nextTable.destroy();
  t.end();
});

test('GPUTableModel consumes an immutable appended batch and tracks table growth', t => {
  const device = new NullDevice({});
  const firstTable = makeArrowModelTable(1);
  const nextTable = makeArrowModelTable(3);
  const table = makeGPUTableFromArrowTable(device, firstTable, {shaderLayout: SHADER_LAYOUT});
  const model = new GPUTableModel(device, {
    id: 'gpu-table-model-immutable-stream-table-test',
    vs: DUMMY_VS,
    fs: DUMMY_FS,
    shaderLayout: SHADER_LAYOUT,
    table
  });
  const initialNeedsRedraw = model.needsRedraw();

  table.addBatch(
    makeGPURecordBatchFromArrowRecordBatch(device, nextTable.batches[0], {
      shaderLayout: SHADER_LAYOUT
    })
  );

  t.equal(model.table, table, 'uses the GPU table');
  t.equal(model.instanceCount, 1, 'initially infers rows from the first immutable batch');
  t.ok(model.needsRedraw(), 'detects appended immutable table batches');
  t.equal(model.instanceCount, 4, 'refreshes inferred rows after table growth');

  model.destroy();
  table.destroy();
  t.ok(initialNeedsRedraw, 'model starts needing redraw');
  t.end();
});

test('GPUTableModel.drawBatches draws preserved converted Arrow table batches', t => {
  const device = new NullDevice({});
  const firstBatch = makeArrowModelTable(1).batches[0];
  const secondBatch = makeArrowModelTable(2).batches[0];
  const arrowTable = new arrow.Table([firstBatch, secondBatch]);
  const table = makeGPUTableFromArrowTable(device, arrowTable, {shaderLayout: SHADER_LAYOUT});
  const model = new GPUTableModel(device, {
    id: 'gpu-table-model-batched-draw-test',
    vs: DUMMY_VS,
    fs: DUMMY_FS,
    shaderLayout: SHADER_LAYOUT,
    table
  });
  const renderPass = device.getDefaultRenderPass();
  const previousPipeline = model.pipeline;
  const previousBufferLayout = model.bufferLayout;
  const positionsBuffers = table.batches.map(batch =>
    getConcreteTestBuffer(batch.gpuVectors.positions.data[0].buffer)
  );
  const drawCalls: {
    instanceCount?: number;
    buffer?: unknown;
  }[] = [];
  const draw = model.pipeline.draw.bind(model.pipeline);

  model.pipeline.draw = options => {
    const positionsBinding = options.vertexArray.attributes[0];
    drawCalls.push({
      instanceCount: options.instanceCount,
      buffer: positionsBinding
    });
    return draw(options);
  };

  t.ok(model.drawBatches(renderPass), 'draws every retained Arrow record batch');
  t.deepEqual(
    drawCalls.map(drawCall => drawCall.instanceCount),
    [1, 2],
    'uses each batch row count as the draw instance count'
  );
  t.deepEqual(
    drawCalls.map(drawCall => drawCall.buffer),
    positionsBuffers,
    'binds each preserved batch GPU buffer directly'
  );
  t.equal(model.pipeline, previousPipeline, 'does not rebuild the render pipeline');
  t.deepEqual(model.bufferLayout, previousBufferLayout, 'keeps the existing buffer layout');
  t.equal(model.instanceCount, arrowTable.numRows, 'restores the table-level inferred row count');
  t.equal(
    model.vertexArray.attributes[0],
    getConcreteTestBuffer(table.attributes.positions),
    'restores table-level model attributes after batched drawing'
  );

  drawCalls.length = 0;
  table.packBatches();
  t.ok(model.drawBatches(renderPass), 'draws the explicitly packed table');
  t.deepEqual(
    drawCalls.map(drawCall => drawCall.instanceCount),
    [3],
    'packing reduces the preserved table to one draw'
  );

  renderPass.destroy();
  model.destroy();
  table.destroy();
  t.end();
});

test('makeGPUGeometryFromArrow converts Mesh Arrow tables for Model rendering', t => {
  const device = new NullDevice({});
  const geometry = makeGPUGeometryFromArrow(device, {arrowMesh: makeArrowModelMeshTable()});
  const model = new Model(device, {
    id: 'gpu-model-mesh-arrow-test',
    vs: DUMMY_MESH_VS,
    fs: DUMMY_FS,
    shaderLayout: MESH_SHADER_LAYOUT,
    geometry
  });

  t.equal(model.vertexCount, 3, 'uses Mesh Arrow index count as vertex count');
  t.ok(model.vertexArray.indexBuffer, 'binds Mesh Arrow index buffer');
  t.deepEqual(
    model.bufferLayout,
    [
      {
        name: 'geometry',
        stepMode: 'vertex',
        byteStride: 16,
        attributes: [
          {attribute: 'positions', format: 'float32x3', byteOffset: 0},
          {attribute: 'colors', format: 'unorm8x4', byteOffset: 12}
        ]
      }
    ],
    'sets Model buffer layout from Mesh Arrow geometry'
  );

  model.destroy();
  geometry.destroy();
  t.end();
});

test('GPUTableModel validates duplicate explicit GPU table attributes and bindings', t => {
  const device = new NullDevice({});
  const table = makeGPUTableFromArrowTable(device, makeArrowModelTable(), {
    shaderLayout: STORAGE_SHADER_LAYOUT
  });
  const duplicateBuffer = device.createBuffer({data: new Float32Array([0, 0, 1, 1])});

  t.throws(
    () =>
      new GPUTableModel(device, {
        id: 'gpu-table-model-duplicate-attribute-test',
        vs: DUMMY_VS,
        fs: DUMMY_FS,
        shaderLayout: STORAGE_SHADER_LAYOUT,
        table,
        attributes: {positions: duplicateBuffer}
      }),
    /duplicates an explicit attribute/,
    'rejects duplicate explicit attributes'
  );
  t.throws(
    () =>
      new GPUTableModel(device, {
        id: 'gpu-table-model-duplicate-binding-test',
        vs: DUMMY_VS,
        fs: DUMMY_FS,
        shaderLayout: STORAGE_SHADER_LAYOUT,
        table,
        bindings: {colors: duplicateBuffer}
      }),
    /duplicates an explicit binding/,
    'rejects duplicate explicit storage bindings'
  );

  duplicateBuffer.destroy();
  table.destroy();
  t.end();
});

function makeArrowModelTable(rowCount = 2): arrow.Table {
  const positions = new Float32Array(rowCount * 2);
  const colors = new Uint8Array(rowCount * 4);

  for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
    positions[rowIndex * 2] = rowIndex;
    positions[rowIndex * 2 + 1] = rowIndex;
    colors[rowIndex * 4] = 255;
    colors[rowIndex * 4 + 1] = rowIndex % 2 === 0 ? 0 : 255;
    colors[rowIndex * 4 + 2] = 0;
    colors[rowIndex * 4 + 3] = 255;
  }

  return new arrow.Table({
    positions: makeArrowFixedSizeListVector(new arrow.Float32(), 2, positions),
    colors: makeArrowFixedSizeListVector(new arrow.Uint8(), 4, colors)
  });
}

function makeArrowModelMeshTable(): ArrowMeshTable {
  const positions = makeArrowFixedSizeListVector(
    new arrow.Float32(),
    3,
    new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0])
  );
  const colors = makeArrowFixedSizeListVector(
    new arrow.Uint8(),
    4,
    new Uint8Array([255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255])
  );
  const fields = [
    new arrow.Field(
      'POSITION',
      new arrow.FixedSizeList(3, new arrow.Field('value', new arrow.Float32(), false)),
      false
    ),
    new arrow.Field(
      'indices',
      new arrow.List(new arrow.Field('item', new arrow.Int32(), false)),
      true
    ),
    new arrow.Field(
      'COLOR_0',
      new arrow.FixedSizeList(4, new arrow.Field('value', new arrow.Uint8(), false)),
      false,
      new Map([['normalized', 'true']])
    )
  ];

  return {
    shape: 'arrow-table',
    topology: 'triangle-list',
    data: new arrow.Table(new arrow.Schema(fields), {
      POSITION: positions,
      indices: makeArrowModelIndicesVector(new Int32Array([0, 1, 2]), positions.length),
      COLOR_0: colors
    })
  };
}

function makeArrowModelIndicesVector(indices: Int32Array, vertexCount: number): arrow.Vector {
  const indicesType = new arrow.List(new arrow.Field('item', new arrow.Int32(), false));
  const valueOffsets = new Int32Array(vertexCount + 1);
  if (vertexCount > 0) {
    valueOffsets.fill(indices.length, 1);
  }
  const nullBitmap = new Uint8Array(Math.ceil(vertexCount / 8));
  if (vertexCount > 0) {
    nullBitmap[0] = 1;
  }
  const valuesData = new arrow.Data<arrow.Int32>(
    indicesType.children[0].type,
    0,
    indices.length,
    0,
    {
      [arrow.BufferType.DATA]: indices
    }
  );
  const indicesData = new arrow.Data<arrow.List<arrow.Int32>>(
    indicesType,
    0,
    vertexCount,
    Math.max(0, vertexCount - 1),
    {
      [arrow.BufferType.OFFSET]: valueOffsets,
      [arrow.BufferType.VALIDITY]: nullBitmap
    },
    [valuesData]
  );

  return new arrow.Vector([indicesData]);
}

function getConcreteTestBuffer(buffer: Buffer | DynamicBuffer): Buffer {
  return buffer instanceof DynamicBuffer ? buffer.buffer : buffer;
}
