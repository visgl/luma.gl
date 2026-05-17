// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {GPUVector, TableTransform} from '@luma.gl/arrow';
import type {ShaderLayout} from '@luma.gl/core';
import {getWebGLTestDevice} from '@luma.gl/test-utils';
import * as arrow from 'apache-arrow';

const TRANSFORM_VERTEX_SHADER = /* glsl */ `\
#version 300 es
precision highp float;

in float values;
out float nextValues;

void main() {
  nextValues = values * 2.0;
}
`;

const TRANSFORM_SHADER_LAYOUT = {
  attributes: [{name: 'values', location: 0, type: 'f32'}],
  bindings: []
} satisfies ShaderLayout;

test('TableTransform copies dense outputs back into inputVectors', async t => {
  const device = await getWebGLTestDevice();
  const values = new GPUVector({
    name: 'values',
    device,
    vector: arrow.makeVector(new Float32Array([1, 2, 3]))
  });
  const transform = new TableTransform(device, {
    vs: TRANSFORM_VERTEX_SHADER,
    shaderLayout: TRANSFORM_SHADER_LAYOUT,
    inputVectors: {values},
    copyOutputToInputVectors: {nextValues: 'values'}
  });

  t.ok(transform.outputVectors.nextValues, 'allocates an output vector for writeback');
  transform.run();

  const transformedValues = await values.readAsync();
  t.deepEqual(
    Array.from(transformedValues.toArray() as Float32Array),
    [2, 4, 6],
    'copies transform outputs back into the input vector buffer'
  );

  transform.destroy();
  values.destroy();
  t.end();
});

test('TableTransform rejects padded automatic writeback vectors', async t => {
  const device = await getWebGLTestDevice();
  const buffer = device.createBuffer({byteLength: 16});
  const values = new GPUVector({
    type: 'buffer',
    name: 'values',
    buffer,
    arrowType: new arrow.Float32(),
    length: 2,
    byteStride: 8,
    ownsBuffer: true
  });

  t.throws(
    () =>
      new TableTransform(device, {
        vs: TRANSFORM_VERTEX_SHADER,
        shaderLayout: TRANSFORM_SHADER_LAYOUT,
        inputVectors: {values},
        copyOutputToInputVectors: {nextValues: 'values'}
      }),
    /requires tightly packed input vector/,
    'automatic writeback documents its dense-copy limitation in behavior'
  );

  values.destroy();
  t.end();
});
