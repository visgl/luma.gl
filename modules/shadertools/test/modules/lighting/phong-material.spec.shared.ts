// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {phongMaterial} from '@luma.gl/shadertools';
import {expect, it} from 'vitest';

export function registerPhongMaterialTests(): void {
  it('shadertools#phongMaterial', () => {
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
    expect(uniforms.specularColor, 'specularColor').toEqual([255, 0, 0]);

    uniforms = phongMaterial.getUniforms({});
    expect(uniforms.unlit, 'unlit').toBe(false);
    expect(uniforms.ambient, 'ambient').toBe(0.35);
    expect(uniforms.diffuse, 'diffuse').toBe(0.6);
    expect(uniforms.shininess, 'shininess').toBe(32);
    expect(uniforms.specularColor, 'specularColor').toEqual([38.25, 38.25, 38.25]);
    expect(
      phongMaterial.defines?.LIGHTING_FRAGMENT,
      'phongMaterial enables fragment lighting'
    ).toBeTruthy();

    uniforms = phongMaterial.getUniforms({
      specularColor: [2, 1, 0.5]
    });
    expect(uniforms.specularColor, 'float specular colors pass through').toEqual([2, 1, 0.5]);
    expect(
      'useByteColors' in phongMaterial.uniformTypes,
      'phongMaterial no longer owns useByteColors'
    ).toBe(false);
    expect(
      phongMaterial.dependencies?.some(module => module.name === 'floatColors'),
      'phongMaterial depends on floatColors'
    ).toBe(true);
    expect(
      phongMaterial.fs.includes('floatColors_normalize(material.specularColor)'),
      'fragment shader normalizes specularColor through floatColors'
    ).toBe(true);
    expect(
      phongMaterial.source.includes('floatColors_normalize(phongMaterial.specularColor)'),
      'WGSL shader normalizes specularColor through floatColors'
    ).toBe(true);
  });
}
