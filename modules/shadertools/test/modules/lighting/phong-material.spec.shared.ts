import {expect, test} from 'vitest';
// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import { phongMaterial } from '@luma.gl/shadertools';
export function registerPhongMaterialTests(): void {
  test('shadertools#phongMaterial', () => {
    let uniforms = phongMaterial.getUniforms({});
    expect(uniforms, 'Default phong lighting uniforms ok').toEqual(phongMaterial.defaultUniforms);
    uniforms = phongMaterial.getUniforms({
      unlit: true,
      ambient: 0.0,
      diffuse: 0.0,
      shininess: 0.0,
      specularColor: [255, 0, 0]
    });
    expect(uniforms.unlit, 'unlit').toBe(true);
    expect(uniforms.ambient, 'ambient').toBe(0);
    expect(uniforms.diffuse, 'diffuse').toBe(0);
    expect(uniforms.shininess, 'shininess').toBe(0);
    expect(uniforms.specularColor, 'specularColor').toEqual([1, 0, 0]);
    uniforms = phongMaterial.getUniforms({});
    expect(uniforms.unlit, 'unlit').toBe(false);
    expect(uniforms.ambient, 'ambient').toBe(0.35);
    expect(uniforms.diffuse, 'diffuse').toBe(0.6);
    expect(uniforms.shininess, 'shininess').toBe(32);
    expect(uniforms.specularColor, 'specularColor').toEqual([0.15, 0.15, 0.15]);
    expect(phongMaterial.defines?.LIGHTING_FRAGMENT, 'phongMaterial enables fragment lighting').toBeTruthy();
  });
}
