// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';

import {ShaderInputs, indexColorPicking} from '../../src';
import {pickingUniforms} from '../../src/modules/picking/picking-uniforms';

it('pickingUniforms#indexMode', () => {
  const shaderInputs = new ShaderInputs({picking: pickingUniforms});

  shaderInputs.setProps({picking: {indexMode: 'instance'}});
  expect(shaderInputs.moduleUniforms.picking.indexMode, 'instance mode maps to 0').toBe(0);

  shaderInputs.setProps({picking: {indexMode: 'attribute'}});
  expect(shaderInputs.moduleUniforms.picking.indexMode, 'attribute mode maps to 1').toBe(1);

  shaderInputs.setProps({picking: {indexMode: 'vertex'}});
  expect(shaderInputs.moduleUniforms.picking.indexMode, 'vertex mode maps to 2').toBe(2);

  void 0;
});

it('indexColorPicking#shader sources', () => {
  expect(indexColorPicking.name, 'module keeps the picking shader module name').toBe('picking');
  expect(
    Boolean(indexColorPicking.vs?.includes('gl_InstanceID')),
    'GLSL supports instance index mode'
  ).toBe(true);
  expect(
    Boolean(indexColorPicking.vs?.includes('gl_VertexID')),
    'GLSL supports vertex index mode'
  ).toBe(true);
  expect(
    Boolean(indexColorPicking.vs?.includes('picking_objectIndex = objectIndex')),
    'GLSL supports attribute mode'
  ).toBe(true);
  expect(
    Boolean(
      indexColorPicking.fs?.includes(
        'return vec4(float(red), float(green), float(blue), float(alpha)) / 255.0'
      )
    ),
    'GLSL encodes integer object and batch ids to RGBA'
  ).toBe(true);
  expect(
    Boolean(
      indexColorPicking.source?.includes(
        'fn picking_getInstanceObjectIndex(instanceIndex: u32) -> i32'
      )
    ),
    'WGSL exposes instance index helper'
  ).toBe(true);
  expect(
    Boolean(
      indexColorPicking.source?.includes('fn picking_getVertexObjectIndex(vertexIndex: u32) -> i32')
    ),
    'WGSL exposes vertex index helper'
  ).toBe(true);
  expect(
    Boolean(
      indexColorPicking.source?.includes(
        'fn picking_getAttributeObjectIndex(objectIndex: i32) -> i32'
      )
    ),
    'WGSL exposes attribute index helper'
  ).toBe(true);
  expect(
    Boolean(
      indexColorPicking.source?.includes(
        'fn picking_getPickingColor(objectIndex: i32) -> vec4<f32>'
      )
    ),
    'WGSL exposes RGBA picking color encoder'
  ).toBe(true);

  void 0;
});
