// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {
  type BufferLayout,
  type ShaderLayout,
  getBufferLayoutMinAttributeLocation,
  getLogicalBufferSlots,
  resolveLogicalAttributeMappings
} from '@luma.gl/core';

const shaderLayout: ShaderLayout = {
  bindings: [],
  attributes: [
    {name: 'instancePositions', location: 0, type: 'vec2<f32>', stepMode: 'instance'},
    {name: 'instanceVelocities', location: 1, type: 'vec2<f32>', stepMode: 'instance'},
    {name: 'vertexPositions', location: 2, type: 'vec3<f32>', stepMode: 'vertex'},
    {name: 'colors', location: 3, type: 'vec4<f32>', stepMode: 'vertex'}
  ]
};

test('resolveLogicalAttributeMappings resolves interleaved, shorthand, and default mappings', t => {
  const bufferLayout: BufferLayout[] = [
    {
      name: 'particles',
      attributes: [
        {attribute: 'instancePositions', byteOffset: 0, format: 'float32x2'},
        {attribute: 'instanceVelocities', byteOffset: 8, format: 'float32x2'}
      ]
    },
    {name: 'vertexPositions', format: 'float32x3'}
  ];

  t.deepEqual(resolveLogicalAttributeMappings(shaderLayout, bufferLayout), [
    {
      attributeName: 'instancePositions',
      bufferName: 'particles',
      location: 0,
      vertexFormat: 'float32x2',
      byteOffset: 0,
      byteStride: 16,
      stepMode: 'instance'
    },
    {
      attributeName: 'instanceVelocities',
      bufferName: 'particles',
      location: 1,
      vertexFormat: 'float32x2',
      byteOffset: 8,
      byteStride: 16,
      stepMode: 'instance'
    },
    {
      attributeName: 'vertexPositions',
      bufferName: 'vertexPositions',
      location: 2,
      vertexFormat: 'float32x3',
      byteOffset: 0,
      byteStride: 0,
      stepMode: 'vertex'
    },
    {
      attributeName: 'colors',
      bufferName: 'colors',
      location: 3,
      vertexFormat: 'float32x4',
      byteOffset: 0,
      byteStride: 0,
      stepMode: 'vertex'
    }
  ]);
  t.end();
});

test('getLogicalBufferSlots keeps logical layout order and appends unmapped shader attributes', t => {
  const bufferLayout: BufferLayout[] = [
    {name: 'vertexPositions', format: 'float32x3'},
    {
      name: 'particles',
      attributes: [{attribute: 'instancePositions', byteOffset: 0, format: 'float32x2'}]
    }
  ];

  t.deepEqual(getLogicalBufferSlots(shaderLayout, bufferLayout), {
    vertexPositions: 0,
    particles: 1,
    instanceVelocities: 2,
    colors: 3
  });
  t.end();
});

test('getBufferLayoutMinAttributeLocation returns the first referenced shader location', t => {
  const bufferLayout: BufferLayout = {
    name: 'particles',
    attributes: [
      {attribute: 'instanceVelocities', byteOffset: 8, format: 'float32x2'},
      {attribute: 'instancePositions', byteOffset: 0, format: 'float32x2'}
    ]
  };

  t.equal(
    getBufferLayoutMinAttributeLocation(bufferLayout, shaderLayout),
    0,
    'minimum shader location is derived from the referenced attributes'
  );
  t.end();
});
