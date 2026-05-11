// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';

import {ShaderInputs, indexColorPicking} from '../../src';
import {pickingUniforms} from '../../src/modules/picking/picking-uniforms';

test('pickingUniforms#indexMode', t => {
  const shaderInputs = new ShaderInputs({picking: pickingUniforms});

  shaderInputs.setProps({picking: {indexMode: 'instance'}});
  t.equal(shaderInputs.moduleUniforms.picking.indexMode, 0, 'instance mode maps to 0');

  shaderInputs.setProps({picking: {indexMode: 'attribute'}});
  t.equal(shaderInputs.moduleUniforms.picking.indexMode, 1, 'attribute mode maps to 1');

  shaderInputs.setProps({picking: {indexMode: 'vertex'}});
  t.equal(shaderInputs.moduleUniforms.picking.indexMode, 2, 'vertex mode maps to 2');

  t.end();
});

test('indexColorPicking#shader sources', t => {
  t.equal(indexColorPicking.name, 'picking', 'module keeps the picking shader module name');
  t.ok(indexColorPicking.vs?.includes('gl_InstanceID'), 'GLSL supports instance index mode');
  t.ok(indexColorPicking.vs?.includes('gl_VertexID'), 'GLSL supports vertex index mode');
  t.ok(
    indexColorPicking.vs?.includes('picking_objectIndex = objectIndex'),
    'GLSL supports attribute mode'
  );
  t.ok(
    indexColorPicking.fs?.includes(
      'return vec4(float(red), float(green), float(blue), float(alpha)) / 255.0'
    ),
    'GLSL encodes integer object and batch ids to RGBA'
  );
  t.ok(
    indexColorPicking.source?.includes(
      'fn picking_getInstanceObjectIndex(instanceIndex: u32) -> i32'
    ),
    'WGSL exposes instance index helper'
  );
  t.ok(
    indexColorPicking.source?.includes('fn picking_getVertexObjectIndex(vertexIndex: u32) -> i32'),
    'WGSL exposes vertex index helper'
  );
  t.ok(
    indexColorPicking.source?.includes(
      'fn picking_getAttributeObjectIndex(objectIndex: i32) -> i32'
    ),
    'WGSL exposes attribute index helper'
  );
  t.ok(
    indexColorPicking.source?.includes('fn picking_getPickingColor(objectIndex: i32) -> vec4<f32>'),
    'WGSL exposes RGBA picking color encoder'
  );

  t.end();
});
