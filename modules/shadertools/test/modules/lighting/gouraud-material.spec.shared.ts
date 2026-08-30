// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {UniformValue} from '@luma.gl/core';
import {gouraudMaterial} from '@luma.gl/shadertools';
import {expect, it} from 'vitest';

export function registerGouraudMaterialTests(): void {
  it('shadertools#gouraudMaterial', () => {
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
    expect(uniforms.specularColor, 'specularColor').toEqual([255, 0, 0]);

    uniforms = gouraudMaterial.getUniforms?.({})!;
    expect(uniforms.unlit, 'unlit').toBe(false);
    expect(uniforms.ambient, 'ambient').toBe(0.35);
    expect(uniforms.diffuse, 'diffuse').toBe(0.6);
    expect(uniforms.shininess, 'shininess').toBe(32);
    expect(uniforms.specularColor, 'specularColor').toEqual([38.25, 38.25, 38.25]);
    expect(
      gouraudMaterial.defines?.LIGHTING_VERTEX,
      'gouraudMaterial enables vertex lighting'
    ).toBeTruthy();

    uniforms = gouraudMaterial.getUniforms?.({
      specularColor: [2, 1, 0.5]
    })!;
    expect(uniforms.specularColor, 'float specular colors pass through').toEqual([2, 1, 0.5]);
    expect(
      'useByteColors' in gouraudMaterial.uniformTypes,
      'gouraudMaterial no longer owns useByteColors'
    ).toBe(false);
    expect(
      gouraudMaterial.dependencies?.some(module => module.name === 'floatColors'),
      'gouraudMaterial depends on floatColors'
    ).toBe(true);
    expect(
      gouraudMaterial.vs?.includes('floatColors_normalize(material.specularColor)'),
      'vertex shader normalizes specularColor through floatColors'
    ).toBe(true);
    expect(
      gouraudMaterial.source?.includes('floatColors_normalize(gouraudMaterial.specularColor)'),
      'WGSL shader normalizes specularColor through floatColors'
    ).toBe(true);
  });
}
