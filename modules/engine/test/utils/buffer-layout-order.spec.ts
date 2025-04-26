// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {type ShaderLayout, type BufferLayout} from '@luma.gl/core';
import {sortedBufferLayoutByShaderSourceLocations} from '@luma.gl/engine/utils/buffer-layout-order';

const shaderLayout: ShaderLayout = {
  bindings: [],
  attributes: [
    {
      name: 'vertexPositions',
      location: 0,
      type: 'vec3<f32>',
      stepMode: 'vertex'
    },
    {
      name: 'vertexPositions64Low',
      location: 1,
      type: 'vec3<f32>',
      stepMode: 'vertex'
    },
    {
      name: 'vertexVelocity',
      location: 2,
      type: 'vec3<f32>',
      stepMode: 'vertex'
    },
    {
      name: 'instancePositions',
      location: 3,
      type: 'vec3<f32>',
      stepMode: 'instance'
    },
    {
      name: 'instancePositions64Low',
      location: 4,
      type: 'vec3<f32>',
      stepMode: 'instance'
    },
    {
      name: 'instanceColors',
      location: 5,
      type: 'vec4<f32>',
      stepMode: 'instance'
    }
  ]
};

const bufferLayout: BufferLayout[] = [
  {
    name: 'vertexPositions',
    byteStride: 24,
    attributes: [
      {
        attribute: 'vertexPositions',
        format: 'float32x3',
        byteOffset: 0
      },
      {
        attribute: 'vertexPositions64Low',
        format: 'float32x3',
        byteOffset: 12
      }
    ]
  },
  {
    name: 'instancePositions',
    byteStride: 24,
    attributes: [
      {
        attribute: 'instancePositions',
        format: 'float32x3',
        byteOffset: 0
      },
      {
        attribute: 'instancePositions64Low',
        format: 'float32x3',
        byteOffset: 12
      }
    ]
  },
  {
    name: 'instanceColors',
    format: 'float32x4'
  },
  {
    name: 'vertexVelocity',
    format: 'float32x3'
  }
];

const sortedBufferLayout = [
  {
    name: 'vertexPositions',
    byteStride: 24,
    attributes: [
      {
        attribute: 'vertexPositions',
        format: 'float32x3',
        byteOffset: 0
      },
      {
        attribute: 'vertexPositions64Low',
        format: 'float32x3',
        byteOffset: 12
      }
    ]
  },
  {
    name: 'vertexVelocity',
    format: 'float32x3'
  },
  {
    name: 'instancePositions',
    byteStride: 24,
    attributes: [
      {
        attribute: 'instancePositions',
        format: 'float32x3',
        byteOffset: 0
      },
      {
        attribute: 'instancePositions64Low',
        format: 'float32x3',
        byteOffset: 12
      }
    ]
  },
  {
    name: 'instanceColors',
    format: 'float32x4'
  }
];

test('sortedBufferLayoutByShaderSourceLocations', t => {
  const result = sortedBufferLayoutByShaderSourceLocations(shaderLayout, bufferLayout);
  for (let i = 0; i < sortedBufferLayout.length; i++) {
    t.deepEqual(result[i], sortedBufferLayout[i], `Buffer layout order is correct`);
    // t.comment(JSON.stringify(result[i], null, 2));
  }
  t.end();
});
