// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
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

it('resolveLogicalAttributeMappings resolves interleaved, shorthand, and default mappings', () => {
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

  expect(resolveLogicalAttributeMappings(shaderLayout, bufferLayout)).toEqual([
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
      byteStride: 12,
      stepMode: 'vertex'
    },
    {
      attributeName: 'colors',
      bufferName: 'colors',
      location: 3,
      vertexFormat: 'float32x4',
      byteOffset: 0,
      byteStride: 16,
      stepMode: 'vertex'
    }
  ]);
});

it('resolveLogicalAttributeMappings distinguishes zero from omitted stride', () => {
  const mappings = resolveLogicalAttributeMappings(shaderLayout, [
    {name: 'vertexPositions', format: 'float32x3', byteStride: 0},
    {name: 'colors', format: 'float32x4'}
  ]);

  expect(
    mappings.find(mapping => mapping.attributeName === 'vertexPositions')?.byteStride,
    'preserves an explicit zero stride'
  ).toBe(0);
  expect(
    mappings.find(mapping => mapping.attributeName === 'colors')?.byteStride,
    'resolves an omitted stride to the packed format size'
  ).toBe(16);
});

it('getLogicalBufferSlots keeps logical layout order and appends unmapped shader attributes', () => {
  const bufferLayout: BufferLayout[] = [
    {name: 'vertexPositions', format: 'float32x3'},
    {
      name: 'particles',
      attributes: [{attribute: 'instancePositions', byteOffset: 0, format: 'float32x2'}]
    }
  ];

  expect(getLogicalBufferSlots(shaderLayout, bufferLayout)).toEqual({
    vertexPositions: 0,
    particles: 1,
    instanceVelocities: 2,
    colors: 3
  });
});

it('getBufferLayoutMinAttributeLocation returns the first referenced shader location', () => {
  const bufferLayout: BufferLayout = {
    name: 'particles',
    attributes: [
      {attribute: 'instanceVelocities', byteOffset: 8, format: 'float32x2'},
      {attribute: 'instancePositions', byteOffset: 0, format: 'float32x2'}
    ]
  };

  expect(
    getBufferLayoutMinAttributeLocation(bufferLayout, shaderLayout),
    'minimum shader location is derived from the referenced attributes'
  ).toBe(0);
});
