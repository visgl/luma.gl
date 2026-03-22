import {expect, test} from 'vitest';
// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type { UniformValue } from '@luma.gl/core';
import { gouraudMaterial } from '@luma.gl/shadertools';
export function registerGouraudMaterialTests(): void {
  test('shadertools#gouraudMaterial', () => {
    let uniforms: Record<string, UniformValue | any> = gouraudMaterial.getUniforms?.({})!;
    expect(uniforms, 'Default phong lighting uniforms ok').toEqual(gouraudMaterial.defaultUniforms);
    uniforms = gouraudMaterial.getUniforms?.({
      unlit: true,
      ambient: 0.0,
      diffuse: 0.0,
      shininess: 0.0,
      specularColor: [255, 0, 0]
    })!;
    expect(uniforms.unlit, 'unlit').toBe(true);
    expect(uniforms.ambient, 'ambient').toBe(0);
    expect(uniforms.diffuse, 'diffuse').toBe(0);
    expect(uniforms.shininess, 'shininess').toBe(0);
    expect(uniforms.specularColor, 'specularColor').toEqual([1, 0, 0]);
    uniforms = gouraudMaterial.getUniforms?.({})!;
    expect(uniforms.unlit, 'unlit').toBe(false);
    expect(uniforms.ambient, 'ambient').toBe(0.35);
    expect(uniforms.diffuse, 'diffuse').toBe(0.6);
    expect(uniforms.shininess, 'shininess').toBe(32);
    expect(uniforms.specularColor, 'specularColor').toEqual([0.15, 0.15, 0.15]);
    expect(gouraudMaterial.defines?.LIGHTING_VERTEX, 'gouraudMaterial enables vertex lighting').toBeTruthy();
  });
}
