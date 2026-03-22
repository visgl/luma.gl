import {expect, test} from 'vitest';
import type { ShaderLayout } from '@luma.gl/core';
import { getDebugTableForShaderLayout } from '../../src/debug/debug-shader-layout';
const SHADER_LAYOUT: ShaderLayout = {
  attributes: [{
    name: 'positions',
    location: 0,
    type: 'vec3<f32>',
    stepMode: 'vertex'
  }, {
    name: 'normals',
    location: 1,
    type: 'vec3<f32>',
    stepMode: 'vertex'
  }, {
    name: 'instanceOffsets',
    location: 2,
    type: 'vec2<f32>',
    stepMode: 'instance'
  }, {
    name: 'instanceColors',
    location: 3,
    type: 'vec3<f32>',
    stepMode: 'instance'
  }, {
    name: 'instancePickingColors',
    location: 4,
    type: 'vec2<f32>',
    stepMode: 'instance'
  }],
  bindings: []
};
test('getDebugTableForShaderLayout#tests', () => {
  const table = getDebugTableForShaderLayout(SHADER_LAYOUT, 'test');
  expect(table).toBeTruthy();
});
