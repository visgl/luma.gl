// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {waterMaterial} from '@luma.gl/shadertools';
import {expect, it} from 'vitest';

export function registerWaterMaterialTests(test: typeof it): void {
  test('shadertools#waterMaterial', () => {
    let uniforms = waterMaterial.getUniforms({});
    expect(uniforms, 'default water uniforms resolve').toEqual(waterMaterial.defaultUniforms);

    uniforms = waterMaterial.getUniforms({
      baseColor: [0, 128, 255],
      fresnelColor: [255, 255, 255],
      mapping: 'world',
      waveADirection: [0, 2],
      waveBDirection: [-4, 0],
      normalStrength: 0.5
    });

    expect(uniforms.baseColor, 'baseColor is normalized from 0-255').toEqual([0, 128 / 255, 1]);
    expect(uniforms.fresnelColor, 'fresnelColor is normalized from 0-255').toEqual([1, 1, 1]);
    expect(uniforms.mappingMode, 'mapping prop converts to world-space mode').toBe(1);
    expect(uniforms.waveADirection, 'wave A direction is normalized').toEqual([0, 1]);
    expect(uniforms.waveBDirection, 'wave B direction is normalized').toEqual([-1, 0]);
    expect(uniforms.normalStrength, 'scalar uniforms are forwarded').toBe(0.5);
    uniforms = waterMaterial.getUniforms({mapping: 'object'});
    expect(uniforms.mappingMode, 'object mapping converts to object-space mode').toBe(2);
    expect(
      Boolean(waterMaterial.defines?.LIGHTING_FRAGMENT),
      'waterMaterial opts into fragment lighting helpers'
    ).toBe(true);

    void 0;
  });
}
