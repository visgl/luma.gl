import {expect, test} from 'vitest';
// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import { lambertMaterial } from '@luma.gl/shadertools';
export function registerLambertMaterialTests(): void {
  test('shadertools#lambertMaterial', () => {
    let uniforms = lambertMaterial.getUniforms({});
    expect(uniforms, 'Default lambert lighting uniforms ok').toEqual(lambertMaterial.defaultUniforms);
    uniforms = lambertMaterial.getUniforms({
      unlit: true,
      ambient: 0.0,
      diffuse: 0.0
    });
    expect(uniforms.unlit, 'unlit').toBe(true);
    expect(uniforms.ambient, 'ambient').toBe(0);
    expect(uniforms.diffuse, 'diffuse').toBe(0);
    uniforms = lambertMaterial.getUniforms({});
    expect(uniforms.unlit, 'unlit').toBe(false);
    expect(uniforms.ambient, 'ambient').toBe(0.35);
    expect(uniforms.diffuse, 'diffuse').toBe(0.6);
    expect(lambertMaterial.defines?.LIGHTING_FRAGMENT, 'lambertMaterial enables fragment lighting').toBeTruthy();
  });
}
