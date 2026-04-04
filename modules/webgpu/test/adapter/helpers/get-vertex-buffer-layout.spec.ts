// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {BufferLayout, ShaderLayout} from '@luma.gl/core';
import {
  getVertexBufferLayout,
  resolveVertexBufferLayouts
} from '@luma.gl/webgpu/adapter/helpers/get-vertex-buffer-layout';

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
  // TODO: Re-enable test without bufferLayout when not using hardcoded types
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

const fp64ShaderLayout: ShaderLayout = {
  attributes: [
    {name: 'instancePositions', location: 0, type: 'vec2<f32>', stepMode: 'instance'},
    {name: 'instancePositions64Low', location: 1, type: 'vec2<f32>', stepMode: 'instance'},
    {name: 'instanceNormals', location: 2, type: 'vec2<f32>', stepMode: 'instance'},
    {name: 'instanceNormals64Low', location: 3, type: 'vec2<f32>', stepMode: 'instance'}
  ],
  bindings: []
};

const splitBufferLayout: BufferLayout[] = [
  {
    name: 'instanceAttributes',
    byteStride: 24,
    attributes: [
      {attribute: 'instancePositions', byteOffset: 0, format: 'float32x3'},
      {attribute: 'instancePositions64Low', byteOffset: 24, format: 'float32x3'},
      {attribute: 'instanceNormals', byteOffset: 48, format: 'float32x3'},
      {attribute: 'instanceNormals64Low', byteOffset: 72, format: 'float32x3'}
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

test('WebGPU#resolveVertexBufferLayouts splits oversized interleaved offsets into repeated bindings', t => {
  const {vertexBufferLayouts, resolvedSlots} = resolveVertexBufferLayouts(
    fp64ShaderLayout,
    splitBufferLayout
  );

  t.equal(vertexBufferLayouts.length, 4, 'one logical layout expands into four WebGPU slots');
  t.deepEqual(
    vertexBufferLayouts.map(layout => layout.arrayStride),
    [24, 24, 24, 24],
    'expanded slots preserve the original stride'
  );
  t.deepEqual(
    vertexBufferLayouts.map(layout => layout.attributes[0]?.offset),
    [0, 0, 0, 0],
    'expanded attributes are lowered to local offsets within a single stride'
  );
  t.deepEqual(
    vertexBufferLayouts.map(layout => layout.attributes[0]?.shaderLocation),
    [0, 1, 2, 3],
    'expanded slots remain ordered by shader location'
  );
  t.deepEqual(
    resolvedSlots,
    [
      {bufferName: 'instanceAttributes', shaderSlot: 0, bindingOffset: 0},
      {bufferName: 'instanceAttributes', shaderSlot: 1, bindingOffset: 24},
      {bufferName: 'instanceAttributes', shaderSlot: 2, bindingOffset: 48},
      {bufferName: 'instanceAttributes', shaderSlot: 3, bindingOffset: 72}
    ],
    'resolved slots record repeated bindings for the same logical buffer'
  );
  t.end();
});

test('WebGPU#resolveVertexBufferLayouts preserves fp64-style high/low pairing across split bindings', t => {
  const {vertexBufferLayouts} = resolveVertexBufferLayouts(fp64ShaderLayout, splitBufferLayout);

  t.deepEqual(
    vertexBufferLayouts.map(layout => layout.attributes[0]?.format),
    ['float32x3', 'float32x3', 'float32x3', 'float32x3'],
    'each split slot keeps the original attribute format'
  );
  t.deepEqual(
    vertexBufferLayouts.map(layout => layout.attributes[0]?.shaderLocation),
    [0, 1, 2, 3],
    'high and 64Low shader locations are preserved after splitting'
  );
  t.end();
});
