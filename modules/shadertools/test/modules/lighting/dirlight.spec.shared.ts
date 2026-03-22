import {expect, test} from 'vitest';
// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import { checkType } from '@luma.gl/test-utils';
import { dirlight, ShaderModule } from '@luma.gl/shadertools';
checkType<ShaderModule>(dirlight);
export function registerDirlightTests(): void {
  test('shadertools#dirlight', () => {
    expect(dirlight.getUniforms(), 'default dirlight uniforms use the exported default direction').toEqual({
      lightDirection: [1, 1, 2]
    });
    expect(dirlight.getUniforms({}), 'explicit empty dirlight props stay empty').toEqual({});
    expect(dirlight.getUniforms({
      lightDirection: [2, 3, 4]
    }), 'custom lightDirection is preserved').toEqual({
      lightDirection: [2, 3, 4]
    });
    expect(dirlight.defaultUniforms.lightDirection, 'default uniforms remain exported').toEqual([1, 1, 2]);
    expect(dirlight.fs.includes('dirlight_filterColor'), 'fragment shader source is exported').toBeTruthy();
    expect(dirlight.vs.includes('dirlight_setNormal'), 'vertex shader source is exported').toBeTruthy();
  });
}
