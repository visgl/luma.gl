// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {BufferLayout, ShaderLayout} from '@luma.gl/core';
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
const bufferLayout: BufferLayout[] = [
  {
    name: 'particles',
    attributes: [
      {attribute: 'instancePositions', byteOffset: 0, format: 'float32x2'},
      {attribute: 'instanceVelocities', byteOffset: 8, format: 'float32x2'}
    ]
  },
  {
    name: 'positions',
    attributes: [{attribute: 'vertexPositions', byteOffset: 0, format: 'float32x2'}]
  }
];

// Order of this layout is intentionally descending of the shader attribute locations
const badlyOrderedBufferLayout: BufferLayout[] = [
  {
    name: 'positions',
    attributes: [{attribute: 'vertexPositions', byteOffset: 0, format: 'float32x2'}]
  },
  {
    name: 'particles-second',
    attributes: [{attribute: 'instanceVelocities', byteOffset: 0, format: 'float32x2'}]
  },
  {
    name: 'particles-first',
    attributes: [{attribute: 'instancePositions', byteOffset: 0, format: 'float32x2'}]
  }
];

const TEST_CASES: {
  shaderLayout: ShaderLayout;
  bufferLayout: BufferLayout[];
  vertexBufferLayout: GPUVertexBufferLayout[];
}[] = [
  // TODO: Renable test without bufferLayout when not using hardcoded types
  // {
  //   shaderLayout,
  //   bufferLayout: [],
  //   vertexBufferLayout: [
  //     {
  //       stepMode: 'instance',
  //       arrayStride: 8,
  //       attributes: [
  //         {
  //           format: 'float32x2',
  //           offset: 0,
  //           shaderLocation: 0
  //         }
  //       ]
  //     },
  //     {
  //       stepMode: 'instance',
  //       arrayStride: 8,
  //       attributes: [
  //         {
  //           format: 'float32x2',
  //           offset: 0,
  //           shaderLocation: 1
  //         }
  //       ]
  //     },
  //     {
  //       stepMode: 'vertex',
  //       arrayStride: 8,
  //       attributes: [
  //         {
  //           format: 'float32x2',
  //           offset: 0,
  //           shaderLocation: 2
  //         }
  //       ]
  //     }
  //   ]
  // }
  {
    shaderLayout,
    bufferLayout,
    vertexBufferLayout: [
      {
        arrayStride: 16,
        stepMode: 'instance',
        attributes: [
          {
            format: 'float32x2',
            offset: 0,
            shaderLocation: 0
          },
          {
            format: 'float32x2',
            offset: 8,
            shaderLocation: 1
          }
        ]
      },
      {
        arrayStride: 8,
        stepMode: 'vertex',
        attributes: [
          {
            format: 'float32x2',
            offset: 0,
            shaderLocation: 2
          }
        ]
      }
    ]
  },
  {
    shaderLayout,
    // ensure we sort it to match the WGSL source @locations
    bufferLayout: badlyOrderedBufferLayout,
    vertexBufferLayout: [
      {
        arrayStride: 8,
        stepMode: 'instance',
        attributes: [
          {
            format: 'float32x2',
            offset: 0,
            shaderLocation: 0
          }
        ]
      },
      {
        arrayStride: 8,
        stepMode: 'instance',
        attributes: [
          {
            format: 'float32x2',
            offset: 0,
            shaderLocation: 1
          }
        ]
      },
      {
        arrayStride: 8,
        stepMode: 'vertex',
        attributes: [
          {
            format: 'float32x2',
            offset: 0,
            shaderLocation: 2
          }
        ]
      }
    ]
  }
];

test('WebGPU#getVertexBufferLayout', t => {
  for (const tc of TEST_CASES) {
    const vertexBufferLayout = getVertexBufferLayout(tc.shaderLayout, tc.bufferLayout);
    t.deepEqual(vertexBufferLayout, tc.vertexBufferLayout);
    // t.comment(JSON.stringify(vertexBufferLayout));
  }
  t.end();
});
