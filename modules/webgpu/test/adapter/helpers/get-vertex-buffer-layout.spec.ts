import test from 'tape-promise/tape';
import {ShaderLayout} from '@luma.gl/core';
import {getVertexBufferLayout} from '@luma.gl/webgpu/adapter/helpers/get-vertex-buffer-layout';

const shaderLayout: ShaderLayout = {
  attributes: [
    {name: 'instancePositions', location: 0, type: 'vec2<f32>', stepMode: 'instance'},
    {name: 'instanceVelocities', location: 1, type: 'vec2<f32>', stepMode: 'instance'},
    {name: 'vertexPositions', location: 2, type: 'vec2<f32>', stepMode: 'vertex'}
  ],
  bindings: []
};

// We want to use "non-standard" buffers: two attributes interleaved in same buffer
const bufferLayout = [
  {name: 'particles', attributes: [
    {name: 'instancePositions'},
    {name: 'instanceVelocities'}
  ]}
];

const TEST_CASES: {shaderLayout: ShaderLayout, bufferLayout, vertexBufferLayout: GPUVertexBufferLayout[]}[] = [
  {
    shaderLayout,
    bufferLayout: [],

    vertexBufferLayout: [
      {
        'stepMode': 'instance',
        'arrayStride': 8,
        'attributes': [
          {
            'format': 'float32x2',
            'offset': 0,
            'shaderLocation': 0
          }
        ]
      },
      {
        'stepMode': 'instance',
        'arrayStride': 8,
        'attributes': [
          {
            'format': 'float32x2',
            'offset': 0,
            'shaderLocation': 1
          }
        ]
      },
      {
        'stepMode': 'vertex',
        'arrayStride': 8,
        'attributes': [
          {
            'format': 'float32x2',
            'offset': 0,
            'shaderLocation': 2
          }
        ]
      }
    ]
  },
  {
    shaderLayout,
    bufferLayout,

    vertexBufferLayout: [
      {
        'stepMode': 'instance',
        'arrayStride': 16,
        'attributes': [
          {
            'format': 'float32x2',
            'offset': 0,
            'shaderLocation': 0
          },
          {
            'format': 'float32x2',
            'offset': 8,
            'shaderLocation': 1
          }
        ]
      },
      {
        'stepMode': 'vertex',
        'arrayStride': 8,
        'attributes': [
          {
            'format': 'float32x2',
            'offset': 0,
            'shaderLocation': 2
          }
        ]
      }
    ]
  }
];

test.only('WebGPU#getVertexBufferLayout', t => {
  for (const tc of TEST_CASES) {
    const vertexBufferLayout = getVertexBufferLayout(tc.shaderLayout, tc.bufferLayout);
    t.deepEqual(vertexBufferLayout, tc.vertexBufferLayout);
    // t.comment(JSON.stringify(vertexBufferLayout));
  }
  t.end();
});
