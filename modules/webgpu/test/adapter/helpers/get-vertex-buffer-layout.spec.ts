import test from 'tape-promise/tape';
import {ShaderLayout} from '@luma.gl/core';
import {getVertexBufferLayout} from '@luma.gl/webgpu/adapter/helpers/get-vertex-buffer-layout';

const shaderLayout: ShaderLayout = {
  attributes: [
    {name: 'instancePositions', location: 0, format: 'float32x2', stepMode: 'instance'},
    {name: 'instanceVelocities', location: 1, format: 'float32x2', stepMode: 'instance'},
    {name: 'vertexPositions', location: 2, format: 'float32x2', stepMode: 'vertex'}
  ],
  bindings: []
};

// We want to use "non-standard" buffers: two attributes interleaved in same buffer
const bufferMap = [
  {name: 'particles', attributes: [
    {name: 'instancePositions'},
    {name: 'instanceVelocities'}
  ]}
];

const TEST_CASES: {shaderLayout: ShaderLayout, bufferMap, vertexBufferLayout: GPUVertexBufferLayout[]}[] = [
  {
    shaderLayout,
    bufferMap: [],

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
    bufferMap,

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

test('WebGPU#getVertexBufferLayout', t => {
  for (const tc of TEST_CASES) {
    const vertexBufferLayout = getVertexBufferLayout(tc.shaderLayout, tc.bufferMap);
    t.deepEqual(vertexBufferLayout, tc.vertexBufferLayout);
    // t.comment(JSON.stringify(vertexBufferLayout));
  }
  t.end();
});
