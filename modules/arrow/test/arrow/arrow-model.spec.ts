// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {
  GPUTable,
  ArrowModel,
  makeArrowFixedSizeListVector,
  StreamingArrowGPUTable,
  type ArrowMeshTable
} from '@luma.gl/arrow';
import type {ShaderLayout} from '@luma.gl/core';
import {NullDevice} from '@luma.gl/test-utils';
import * as arrow from 'apache-arrow';

const SHADER_LAYOUT: ShaderLayout = {
  attributes: [
    {name: 'positions', location: 0, type: 'vec2<f32>', stepMode: 'instance'},
    {name: 'colors', location: 1, type: 'vec4<f32>', stepMode: 'instance'}
  ],
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

test('ArrowModel creates a Model from an Arrow table', t => {
  const device = new NullDevice({});
  const arrowTable = makeArrowModelTable();
  const model = new ArrowModel(device, {
    id: 'arrow-model-test',
    vs: DUMMY_VS,
    fs: DUMMY_FS,
    shaderLayout: SHADER_LAYOUT,
    arrowTable
  });
  const positionsBuffer = model.arrowGPUTable!.batches[0].gpuVectors['positions'].buffer;

  t.ok(model.arrowGPUTable instanceof GPUTable, 'creates an GPUTable');
  t.deepEqual(
    model.bufferLayout,
    [
      {name: 'positions', format: 'float32x2', stepMode: 'instance'},
      {name: 'colors', format: 'unorm8x4', stepMode: 'instance'}
    ],
    'sets buffer layout from Arrow table columns'
  );
  t.equal(
    model.vertexArray.attributes[0],
    model.arrowGPUTable!.attributes['positions'],
    'sets Model vertex array attributes from Arrow buffers'
  );
  t.equal(model.instanceCount, arrowTable.numRows, 'defaults instanceCount to Arrow row count');

  model.destroy();
  t.ok(positionsBuffer.destroyed, 'destroys owned Arrow GPU vector buffers');
  t.end();
});

test('ArrowModel supports vertex and no count inference', t => {
  const device = new NullDevice({});
  const arrowTable = makeArrowModelTable();

  const vertexModel = new ArrowModel(device, {
    id: 'arrow-model-vertex-count-test',
    vs: DUMMY_VS,
    fs: DUMMY_FS,
    shaderLayout: SHADER_LAYOUT,
    arrowTable,
    arrowCount: 'vertex'
  });

  t.equal(vertexModel.vertexCount, arrowTable.numRows, 'sets vertexCount from Arrow row count');
  t.equal(vertexModel.instanceCount, 0, 'does not infer instanceCount in vertex mode');
  vertexModel.destroy();

  const noCountModel = new ArrowModel(device, {
    id: 'arrow-model-no-count-test',
    vs: DUMMY_VS,
    fs: DUMMY_FS,
    shaderLayout: SHADER_LAYOUT,
    arrowTable,
    arrowCount: 'none'
  });

  t.equal(noCountModel.vertexCount, 0, 'does not infer vertexCount in none mode');
  t.equal(noCountModel.instanceCount, 0, 'does not infer instanceCount in none mode');
  noCountModel.destroy();
  t.end();
});

test('ArrowModel updates Arrow table props', t => {
  const device = new NullDevice({});
  const arrowTable = makeArrowModelTable();
  const nextArrowTable = makeArrowModelTable(3);
  const model = new ArrowModel(device, {
    id: 'arrow-model-update-test',
    vs: DUMMY_VS,
    fs: DUMMY_FS,
    shaderLayout: SHADER_LAYOUT,
    arrowTable
  });
  const previousPositionsBuffer = model.arrowGPUTable!.batches[0].gpuVectors['positions'].buffer;
  const previousPipeline = model.pipeline;

  model.setProps({arrowTable: nextArrowTable});

  t.equal(model.instanceCount, nextArrowTable.numRows, 'updates inferred instanceCount');
  t.equal(
    model.pipeline,
    previousPipeline,
    'does not rebuild pipeline when Arrow buffer layout is unchanged'
  );
  t.equal(
    model.vertexArray.attributes[0],
    model.arrowGPUTable!.attributes['positions'],
    'sets vertex array attributes from the updated Arrow buffers'
  );
  t.ok(previousPositionsBuffer.destroyed, 'destroys previous Arrow GPU vector buffers');

  model.destroy();
  t.end();
});

test('ArrowModel consumes a StreamingArrowGPUTable', t => {
  const device = new NullDevice({});
  const firstTable = makeArrowModelTable(1);
  const nextTable = makeArrowModelTable(3);
  const streamingArrowGPUTable = new StreamingArrowGPUTable({
    device,
    schema: firstTable.schema,
    shaderLayout: SHADER_LAYOUT
  });

  streamingArrowGPUTable.appendRecordBatch(firstTable.batches[0]);
  const model = new ArrowModel(device, {
    id: 'arrow-model-streaming-test',
    vs: DUMMY_VS,
    fs: DUMMY_FS,
    shaderLayout: SHADER_LAYOUT,
    streamingArrowGPUTable
  });
  const positionsBuffer = streamingArrowGPUTable.gpuVectors['positions'].buffer;
  const initialNeedsRedraw = model.needsRedraw();

  streamingArrowGPUTable.appendRecordBatch(nextTable.batches[0]);

  t.equal(model.arrowGPUTable, streamingArrowGPUTable, 'uses the provided streaming table');
  t.equal(model.instanceCount, 1, 'initially infers row count from streaming table');
  t.ok(model.needsRedraw(), 'detects writes to streaming DynamicBuffer attributes');
  t.equal(model.instanceCount, 4, 'refreshes inferred row count after streaming append');

  model.destroy();
  t.notOk(positionsBuffer.destroyed, 'does not destroy externally provided streaming table');
  streamingArrowGPUTable.destroy();
  t.ok(positionsBuffer.destroyed, 'external owner can destroy the streaming table');
  t.ok(initialNeedsRedraw, 'model starts needing redraw');
  t.end();
});

test('ArrowModel consumes an appendable GPUTable and tracks trailing batch growth', t => {
  const device = new NullDevice({});
  const firstTable = makeArrowModelTable(1);
  const nextTable = makeArrowModelTable(3);
  const arrowGPUTable = new GPUTable({
    type: 'appendable',
    device,
    schema: firstTable.schema,
    shaderLayout: SHADER_LAYOUT
  });
  arrowGPUTable.addToLastBatch(firstTable.batches[0]);
  const model = new ArrowModel(device, {
    id: 'arrow-model-appendable-table-test',
    vs: DUMMY_VS,
    fs: DUMMY_FS,
    shaderLayout: SHADER_LAYOUT,
    arrowGPUTable
  });
  const initialNeedsRedraw = model.needsRedraw();

  arrowGPUTable.addToLastBatch(nextTable.batches[0]);

  t.equal(model.arrowGPUTable, arrowGPUTable, 'uses the appendable regular GPU table');
  t.equal(model.instanceCount, 1, 'initially infers rows from the trailing appendable batch');
  t.ok(model.needsRedraw(), 'detects writes to appendable DynamicBuffer attributes');
  t.equal(model.instanceCount, 4, 'refreshes inferred rows after appendable batch growth');

  model.destroy();
  arrowGPUTable.destroy();
  t.ok(initialNeedsRedraw, 'model starts needing redraw');
  t.end();
});

test('ArrowModel consumes an existing GPUTable without taking ownership', t => {
  const device = new NullDevice({});
  const arrowTable = makeArrowModelTable();
  const arrowGPUTable = new GPUTable(device, arrowTable, {shaderLayout: SHADER_LAYOUT});
  const positionsBuffer = arrowGPUTable.batches[0].gpuVectors['positions'].buffer;
  const model = new ArrowModel(device, {
    id: 'arrow-model-existing-gpu-table-test',
    vs: DUMMY_VS,
    fs: DUMMY_FS,
    shaderLayout: SHADER_LAYOUT,
    arrowGPUTable
  });

  t.equal(model.arrowGPUTable, arrowGPUTable, 'uses the provided GPU table');
  t.equal(model.instanceCount, arrowGPUTable.numRows, 'infers rows from the provided GPU table');

  model.destroy();
  t.notOk(positionsBuffer.destroyed, 'does not destroy externally provided GPU tables');
  arrowGPUTable.destroy();
  t.ok(positionsBuffer.destroyed, 'external owner can destroy the GPU table');
  t.end();
});

test('ArrowModel draws preserved Arrow table batches by rebinding batch-owned buffers', t => {
  const device = new NullDevice({});
  const firstBatch = makeArrowModelTable(1).batches[0];
  const secondBatch = makeArrowModelTable(2).batches[0];
  const arrowTable = new arrow.Table([firstBatch, secondBatch]);
  const model = new ArrowModel(device, {
    id: 'arrow-model-batched-draw-test',
    vs: DUMMY_VS,
    fs: DUMMY_FS,
    shaderLayout: SHADER_LAYOUT,
    arrowTable
  });
  const renderPass = device.getDefaultRenderPass();
  const previousPipeline = model.pipeline;
  const previousBufferLayout = model.bufferLayout;
  const positionsBuffers = model.arrowGPUTable!.batches.map(
    batch => batch.gpuVectors['positions'].buffer
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
    model.arrowGPUTable!.attributes['positions'],
    'restores table-level model attributes after batched drawing'
  );

  drawCalls.length = 0;
  model.arrowGPUTable!.packBatches();
  t.ok(model.drawBatches(renderPass), 'draws the explicitly packed table');
  t.deepEqual(
    drawCalls.map(drawCall => drawCall.instanceCount),
    [3],
    'packing reduces the preserved table to one draw'
  );

  renderPass.destroy();
  model.destroy();
  t.end();
});

test('ArrowModel draws streaming table façades through regular GPU batches', t => {
  const device = new NullDevice({});
  const arrowTable = makeArrowModelTable(1);
  const streamingArrowGPUTable = new StreamingArrowGPUTable({
    device,
    schema: arrowTable.schema,
    shaderLayout: SHADER_LAYOUT
  });
  streamingArrowGPUTable.appendRecordBatch(arrowTable.batches[0]);
  const model = new ArrowModel(device, {
    id: 'arrow-model-streaming-batched-draw-test',
    vs: DUMMY_VS,
    fs: DUMMY_FS,
    shaderLayout: SHADER_LAYOUT,
    streamingArrowGPUTable
  });
  const renderPass = device.getDefaultRenderPass();

  t.ok(
    model.drawBatches(renderPass),
    'streaming compatibility tables draw through the appendable GPU batch path'
  );

  renderPass.destroy();
  model.destroy();
  streamingArrowGPUTable.destroy();
  t.end();
});

test('ArrowModel creates a Model from a Mesh Arrow table', t => {
  const device = new NullDevice({});
  const arrowMesh = makeArrowModelMeshTable();
  const model = new ArrowModel(device, {
    id: 'arrow-model-mesh-test',
    vs: DUMMY_MESH_VS,
    fs: DUMMY_FS,
    shaderLayout: MESH_SHADER_LAYOUT,
    arrowMesh
  });

  t.ok(model.arrowGeometry, 'creates ArrowGeometry');
  t.equal(model.arrowGPUTable, undefined, 'does not create GPUTable for mesh input');
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
  t.end();
});

test('ArrowModel validates required shader layout and duplicate attributes', t => {
  const device = new NullDevice({});
  const arrowTable = makeArrowModelTable();
  const duplicateBuffer = device.createBuffer({data: new Float32Array([0, 0, 1, 1])});

  t.throws(
    () =>
      new ArrowModel(device, {
        id: 'arrow-model-missing-layout-test',
        vs: DUMMY_VS,
        fs: DUMMY_FS,
        arrowTable
      }),
    /requires shaderLayout/,
    'requires shaderLayout'
  );
  t.throws(
    () =>
      new ArrowModel(device, {
        id: 'arrow-model-duplicate-attribute-test',
        vs: DUMMY_VS,
        fs: DUMMY_FS,
        shaderLayout: SHADER_LAYOUT,
        arrowTable,
        attributes: {positions: duplicateBuffer}
      }),
    /duplicates an explicit attribute/,
    'rejects duplicate explicit attributes'
  );
  t.throws(
    () =>
      new ArrowModel(device, {
        id: 'arrow-model-duplicate-source-test',
        vs: DUMMY_MESH_VS,
        fs: DUMMY_FS,
        shaderLayout: MESH_SHADER_LAYOUT,
        arrowMesh: makeArrowModelMeshTable(),
        arrowTable
      }),
    /only one of arrowMesh, arrowTable, arrowGPUTable, or streamingArrowGPUTable/,
    'rejects duplicate Arrow sources'
  );

  duplicateBuffer.destroy();
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
    {[arrow.BufferType.DATA]: indices}
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
