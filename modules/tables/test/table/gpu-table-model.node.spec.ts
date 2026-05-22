// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import type {ShaderLayout} from '@luma.gl/core';
import {NullDevice} from '@luma.gl/test-utils';
import {GPURecordBatch, GPUTable, GPUTableModel, GPUVector} from '@luma.gl/tables';
import * as arrow from 'apache-arrow';

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
        dataType: new arrow.Binary(),
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
  const batchBuffers = table.batches.map(batch => batch.gpuVectors['positions'].buffer);
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

function makeBatchedPositionsTable(device: NullDevice, rowCounts: number[]): GPUTable {
  const batches = rowCounts.map(
    rowCount => new GPURecordBatch({vectors: {positions: makePositionsVector(device, rowCount)}})
  );
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
    dataType: new arrow.FixedSizeList(2, new arrow.Field('value', new arrow.Float32(), false)),
    length: rowCount,
    stride: 2,
    byteStride: Float32Array.BYTES_PER_ELEMENT * 2,
    ownsBuffer: true
  });
}
