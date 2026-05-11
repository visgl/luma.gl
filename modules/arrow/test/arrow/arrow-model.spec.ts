// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {ArrowGPUTable, ArrowModel, makeArrowFixedSizeListVector} from '@luma.gl/arrow';
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
  const positionsBuffer = model.arrowGPUTable.gpuVectors.positions.buffer;

  t.ok(model.arrowGPUTable instanceof ArrowGPUTable, 'creates an ArrowGPUTable');
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
    model.arrowGPUTable.attributes.positions,
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
  const previousPositionsBuffer = model.arrowGPUTable.gpuVectors.positions.buffer;
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
    model.arrowGPUTable.attributes.positions,
    'sets vertex array attributes from the updated Arrow buffers'
  );
  t.ok(previousPositionsBuffer.destroyed, 'destroys previous Arrow GPU vector buffers');

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
