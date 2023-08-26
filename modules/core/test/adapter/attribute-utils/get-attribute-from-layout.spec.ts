import test from 'tape-promise/tape';
import {ShaderLayout, getAttributeInfosFromLayouts} from '@luma.gl/core';
import {BufferLayout} from '@luma.gl/core/index';

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
      name: 'instancePositions',
      location: 0,
      type: 'vec3<f32>',
      stepMode: 'instance'
    },
    {
      name: 'instancePositions64Low',
      location: 2,
      type: 'vec3<f32>',
      stepMode: 'instance'
    },
    {
      name: 'instanceNextPositions',
      location: 1,
      type: 'vec3<f32>',
      stepMode: 'instance'
    },
    {
      name: 'instanceNextPositions64Low',
      location: 3,
      type: 'vec3<f32>',
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
      },
      {
        attribute: 'instancePositions',
        format: 'float32x3',
        byteOffset: 24
      },
      {
        attribute: 'instancePositions64Low',
        format: 'float32x3',
        byteOffset: 12
      },
      {
        attribute: 'instanceNextPositions',
        format: 'float32x3',
        byteOffset: 24
      },
      {
        attribute: 'instanceNextPositions64Low',
        format: 'float32x3',
        byteOffset: 36
      }
    ]
  }
];

const resolvedLayout = {
  vertexPositions: {
    attributeName: 'vertexPositions',
    bufferName: 'vertexPositions',
    location: 0,
    shaderType: 'vec3<f32>',
    shaderDataType: 'f32',
    shaderComponents: 3,
    vertexFormat: 'float32x3',
    bufferDataType: 'float32',
    bufferComponents: 3,
    normalized: false,
    integer: false,
    stepMode: 'vertex',
    byteOffset: 0,
    byteStride: 24
  },
  vertexPositions64Low: {
    attributeName: 'vertexPositions64Low',
    bufferName: 'vertexPositions',
    location: 1,
    shaderType: 'vec3<f32>',
    shaderDataType: 'f32',
    shaderComponents: 3,
    vertexFormat: 'float32x3',
    bufferDataType: 'float32',
    bufferComponents: 3,
    normalized: false,
    integer: false,
    stepMode: 'vertex',
    byteOffset: 12,
    byteStride: 24
  },
  instancePositions: {
    attributeName: 'instancePositions',
    bufferName: 'vertexPositions',
    location: 0,
    shaderType: 'vec3<f32>',
    shaderDataType: 'f32',
    shaderComponents: 3,
    vertexFormat: 'float32x3',
    bufferDataType: 'float32',
    bufferComponents: 3,
    normalized: false,
    integer: false,
    stepMode: 'instance',
    byteOffset: 24,
    byteStride: 24
  },
  instancePositions64Low: {
    attributeName: 'instancePositions64Low',
    bufferName: 'vertexPositions',
    location: 2,
    shaderType: 'vec3<f32>',
    shaderDataType: 'f32',
    shaderComponents: 3,
    vertexFormat: 'float32x3',
    bufferDataType: 'float32',
    bufferComponents: 3,
    normalized: false,
    integer: false,
    stepMode: 'instance',
    byteOffset: 12,
    byteStride: 24
  },
  instanceNextPositions: {
    attributeName: 'instanceNextPositions',
    bufferName: 'vertexPositions',
    location: 1,
    shaderType: 'vec3<f32>',
    shaderDataType: 'f32',
    shaderComponents: 3,
    vertexFormat: 'float32x3',
    bufferDataType: 'float32',
    bufferComponents: 3,
    normalized: false,
    integer: false,
    stepMode: 'instance',
    byteOffset: 24,
    byteStride: 24
  },
  instanceNextPositions64Low: {
    attributeName: 'instanceNextPositions64Low',
    bufferName: 'vertexPositions',
    location: 3,
    shaderType: 'vec3<f32>',
    shaderDataType: 'f32',
    shaderComponents: 3,
    vertexFormat: 'float32x3',
    bufferDataType: 'float32',
    bufferComponents: 3,
    normalized: false,
    integer: false,
    stepMode: 'instance',
    byteOffset: 36,
    byteStride: 24
  }
};

test('getAttributeInfosFromLayouts', t => {
  const result = getAttributeInfosFromLayouts(shaderLayout, bufferLayout);
  for (const key of Object.keys(resolvedLayout)) {
    t.deepEqual(result[key], resolvedLayout[key], `Interleaved attribute info for ${key} are correct`);
    // t.comment(JSON.stringify(result[key], null, 2));
  }
  t.end();
});
