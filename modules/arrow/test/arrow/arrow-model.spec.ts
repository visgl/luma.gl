// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {
  makeArrowFixedSizeListVector,
  makeGPURecordBatchFromArrowRecordBatch,
  makeGPUTableFromArrowTable,
  makeGPUGeometryFromArrow,
  type ArrowMeshTable
} from '@luma.gl/arrow';
import type {Buffer, ShaderLayout} from '@luma.gl/core';
import {DynamicBuffer, Model} from '@luma.gl/engine';
import {GPUTable, GPUTableModel} from '@luma.gl/experimental/gpu-tables';
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

it('makeGPUTableFromArrowTable converts Arrow tables for GPUTableModel rendering', () => {
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
  const positionsBuffer = table.batches[0].gpuData.positions.buffer;

  expect(Boolean(table instanceof GPUTable), 'creates a GPUTable').toBe(true);
  expect(model.bufferLayout, 'sets buffer layout from converted Arrow columns').toEqual([
    {name: 'positions', format: 'float32x2', stepMode: 'instance'},
    {name: 'colors', format: 'unorm8x4', stepMode: 'instance'}
  ]);
  expect(
    model.vertexArray.attributes[0],
    'sets Model vertex array attributes from GPU table buffers'
  ).toBe(getConcreteTestBuffer(table.batches[0].gpuData.positions.buffer));
  expect(model.instanceCount, 'infers instanceCount from table row count').toBe(arrowTable.numRows);

  model.destroy();
  expect(
    Boolean(positionsBuffer.destroyed),
    'GPUTableModel leaves converted tables caller-owned'
  ).toBe(false);
  table.destroy();
  expect(Boolean(positionsBuffer.destroyed), 'caller destroys converted table buffers').toBe(true);
  void 0;
});

it('makeGPUTableFromArrowTable converts scalar filter values to float32 attributes', () => {
  const device = new NullDevice({});
  const arrowTable = new arrow.Table({
    filterValues: arrow.makeVector(new Float32Array([0, 0.5, 1]))
  });
  const table = makeGPUTableFromArrowTable(device, arrowTable, {
    shaderLayout: FILTER_SHADER_LAYOUT
  });

  expect(table.gpuVectors.filterValues.format, 'filter vector uses float32 storage').toBe(
    'float32'
  );
  expect(table.bufferLayout, 'table exposes a matching scalar instance buffer layout').toEqual([
    {name: 'filterValues', format: 'float32', stepMode: 'instance'}
  ]);

  table.destroy();
  void 0;
});

it('makeGPUTableFromArrowTable derives model storage bindings from batch GPUData', () => {
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
  const colorsBuffer = table.batches[0].gpuData.colors.buffer;

  expect(
    table.schema.fields.map(field => field.name),
    'keeps attribute and storage columns in the selected GPU schema'
  ).toEqual(['positions', 'colors']);
  expect(Boolean('bindings' in table), 'table does not cache storage bindings').toBe(false);
  expect(model.bindings.colors, 'model receives storage bindings from the table').toBe(
    colorsBuffer
  );

  model.destroy();
  table.destroy();
  void 0;
});

it('GPUTableModel supports vertex and no count inference from converted Arrow tables', () => {
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

  expect(vertexModel.vertexCount, 'sets vertexCount from table row count').toBe(arrowTable.numRows);
  expect(vertexModel.instanceCount, 'does not infer instanceCount in vertex mode').toBe(0);
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

  expect(noCountModel.vertexCount, 'does not infer vertexCount in none mode').toBe(0);
  expect(noCountModel.instanceCount, 'does not infer instanceCount in none mode').toBe(0);
  noCountModel.destroy();
  noCountTable.destroy();
  void 0;
});

it('GPUTableModel updates converted GPU table props', () => {
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

  expect(model.instanceCount, 'updates inferred instanceCount').toBe(nextTable.numRows);
  expect(
    model.pipeline,
    'does not rebuild pipeline when GPU table buffer layout is unchanged'
  ).toBe(previousPipeline);
  expect(
    model.vertexArray.attributes[0],
    'sets vertex array attributes from the updated GPU table buffers'
  ).toBe(getConcreteTestBuffer(nextTable.batches[0].gpuData.positions.buffer));

  model.destroy();
  table.destroy();
  nextTable.destroy();
  void 0;
});

it('GPUTableModel consumes an immutable appended batch and tracks table growth', () => {
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

  expect(model.table, 'uses the GPU table').toBe(table);
  expect(model.instanceCount, 'initially infers rows from the first immutable batch').toBe(1);
  expect(Boolean(model.needsRedraw()), 'detects appended immutable table batches').toBe(true);
  expect(model.instanceCount, 'refreshes inferred rows after table growth').toBe(4);

  model.destroy();
  table.destroy();
  expect(Boolean(initialNeedsRedraw), 'model starts needing redraw').toBe(true);
  void 0;
});

it('GPUTableModel.drawBatches draws preserved converted Arrow table batches', () => {
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
    getConcreteTestBuffer(batch.gpuData.positions.buffer)
  );
  const drawCalls: {
    instanceCount?: number;
    buffer?: unknown;
  }[] = [];
  const draw = renderPass.draw.bind(renderPass);

  renderPass.draw = options => {
    const positionsBinding = renderPass.vertexArray?.attributes[0];
    drawCalls.push({
      instanceCount: options.instanceCount,
      buffer: positionsBinding
    });
    return draw(options);
  };

  expect(Boolean(model.drawBatches(renderPass)), 'draws every retained Arrow record batch').toBe(
    true
  );
  expect(
    drawCalls.map(drawCall => drawCall.instanceCount),
    'uses each batch row count as the draw instance count'
  ).toEqual([1, 2]);
  expect(
    drawCalls.map(drawCall => drawCall.buffer),
    'binds each preserved batch GPU buffer directly'
  ).toEqual(positionsBuffers);
  expect(model.pipeline, 'does not rebuild the render pipeline').toBe(previousPipeline);
  expect(model.bufferLayout, 'keeps the existing buffer layout').toEqual(previousBufferLayout);
  expect(model.instanceCount, 'restores the table-level inferred row count').toBe(
    arrowTable.numRows
  );
  expect(
    model.vertexArray.attributes[0],
    'restores table-level model attributes after batched drawing'
  ).toBe(getConcreteTestBuffer(table.batches[0].gpuData.positions.buffer));

  drawCalls.length = 0;
  table.packBatches();
  expect(Boolean(model.drawBatches(renderPass)), 'draws the explicitly packed table').toBe(true);
  expect(
    drawCalls.map(drawCall => drawCall.instanceCount),
    'packing reduces the preserved table to one draw'
  ).toEqual([3]);

  renderPass.destroy();
  model.destroy();
  table.destroy();
  void 0;
});

it('makeGPUGeometryFromArrow converts Mesh Arrow tables for Model rendering', () => {
  const device = new NullDevice({});
  const geometry = makeGPUGeometryFromArrow(device, {arrowMesh: makeArrowModelMeshTable()});
  const model = new Model(device, {
    id: 'gpu-model-mesh-arrow-test',
    vs: DUMMY_MESH_VS,
    fs: DUMMY_FS,
    shaderLayout: MESH_SHADER_LAYOUT,
    geometry
  });

  expect(model.vertexCount, 'uses Mesh Arrow index count as vertex count').toBe(3);
  expect(Boolean(model.vertexArray.indexBuffer), 'binds Mesh Arrow index buffer').toBe(true);
  expect(model.bufferLayout, 'sets Model buffer layout from Mesh Arrow geometry').toEqual([
    {
      name: 'geometry',
      stepMode: 'vertex',
      byteStride: 16,
      attributes: [
        {attribute: 'positions', format: 'float32x3', byteOffset: 0},
        {attribute: 'colors', format: 'unorm8x4', byteOffset: 12}
      ]
    }
  ]);

  model.destroy();
  geometry.destroy();
  void 0;
});

it('GPUTableModel validates duplicate explicit GPU table attributes and bindings', () => {
  const device = new NullDevice({});
  const table = makeGPUTableFromArrowTable(device, makeArrowModelTable(), {
    shaderLayout: STORAGE_SHADER_LAYOUT
  });
  const duplicateBuffer = device.createBuffer({data: new Float32Array([0, 0, 1, 1])});

  expect(
    () =>
      new GPUTableModel(device, {
        id: 'gpu-table-model-duplicate-attribute-test',
        vs: DUMMY_VS,
        fs: DUMMY_FS,
        shaderLayout: STORAGE_SHADER_LAYOUT,
        table,
        attributes: {positions: duplicateBuffer}
      }),
    'rejects duplicate explicit attributes'
  ).toThrow(/duplicates an explicit attribute/);
  expect(
    () =>
      new GPUTableModel(device, {
        id: 'gpu-table-model-duplicate-binding-test',
        vs: DUMMY_VS,
        fs: DUMMY_FS,
        shaderLayout: STORAGE_SHADER_LAYOUT,
        table,
        bindings: {colors: duplicateBuffer}
      }),
    'rejects duplicate explicit storage bindings'
  ).toThrow(/duplicates an explicit binding/);

  duplicateBuffer.destroy();
  table.destroy();
  void 0;
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
