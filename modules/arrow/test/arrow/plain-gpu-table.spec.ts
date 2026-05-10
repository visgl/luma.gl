// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {ArrowGPUVector, ArrowGPUTable, makeArrowFixedSizeListVector} from '@luma.gl/arrow';
import type {ShaderLayout} from '@luma.gl/core';
import {NullDevice} from '@luma.gl/test-utils';
import * as arrow from 'apache-arrow';

test('ArrowGPUTable creates GPU vectors from shader-compatible Arrow table columns', t => {
  const device = new NullDevice({});
  const table = new arrow.Table({
    positions: makeArrowFixedSizeListVector(new arrow.Float32(), 2, new Float32Array([0, 0, 1, 1])),
    colors: makeArrowFixedSizeListVector(
      new arrow.Uint8(),
      4,
      new Uint8Array([255, 0, 0, 255, 0, 255, 0, 255])
    )
  });
  const shaderLayout: ShaderLayout = {
    attributes: [
      {name: 'positions', location: 0, type: 'vec2<f32>'},
      {name: 'colors', location: 1, type: 'vec4<f32>'},
      {name: 'missing', location: 2, type: 'vec4<f32>'}
    ],
    bindings: []
  };

  const gpuTable = new ArrowGPUTable(device, table, {shaderLayout});

  t.deepEqual(
    gpuTable.bufferLayout,
    [
      {name: 'positions', format: 'float32x2'},
      {name: 'colors', format: 'unorm8x4'}
    ],
    'derives buffer layouts for matching shader attributes'
  );
  t.ok(gpuTable.gpuVectors.positions instanceof ArrowGPUVector, 'creates a positions GPU vector');
  t.ok(gpuTable.gpuVectors.colors instanceof ArrowGPUVector, 'creates a colors GPU vector');
  t.equal(
    gpuTable.attributes.positions,
    gpuTable.gpuVectors.positions.buffer,
    'exposes positions as a Model attribute buffer'
  );
  t.equal(
    gpuTable.attributes.colors,
    gpuTable.gpuVectors.colors.buffer,
    'exposes colors as a Model attribute buffer'
  );
  t.notOk(gpuTable.attributes.missing, 'skips missing table columns');

  gpuTable.destroy();
  t.end();
});

test('ArrowGPUTable maps shader attributes through Arrow paths', t => {
  const device = new NullDevice({});
  const table = new arrow.Table({
    color: makeArrowFixedSizeListVector(new arrow.Uint8(), 4, new Uint8Array([255, 0, 0, 255]))
  });
  const shaderLayout: ShaderLayout = {
    attributes: [{name: 'instanceColors', location: 0, type: 'vec4<f32>'}],
    bindings: []
  };

  const gpuTable = new ArrowGPUTable(device, table, {
    shaderLayout,
    arrowPaths: {instanceColors: 'color'}
  });

  t.deepEqual(
    gpuTable.bufferLayout,
    [{name: 'instanceColors', format: 'unorm8x4'}],
    'derives buffer layouts from explicit Arrow paths'
  );
  t.ok(gpuTable.attributes.instanceColors, 'exposes renamed shader attribute buffer');

  gpuTable.destroy();
  t.end();
});
