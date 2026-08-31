// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {makeShaderBlockLayout, ShaderBlockWriter} from '@luma.gl/core';
import {lighting, type LightingUniforms} from '../../../src/index';
import {expect, it} from 'vitest';

const lightingUniformTypecheck: LightingUniforms = lighting.defaultUniforms;
const FLOAT32_EPSILON = 1e-6;

export function registerLightingTests(test: typeof it): void {
  test('shadertools#lighting uses a trailing struct array uniform block', () => {
    expect(Boolean(lightingUniformTypecheck), 'lighting uniforms are typed').toBe(true);
    const uniforms = lighting.getUniforms({
      lights: [
        {type: 'ambient', color: [0, 0, 255]},
        {
          type: 'point',
          color: [255, 0, 0],
          position: [1, 2, 3],
          attenuation: [1, 0.25, 0.125]
        },
        {
          type: 'spot',
          color: [255, 255, 0],
          position: [0, 3, 2],
          direction: [0, -1, 0],
          innerConeAngle: 0.25,
          outerConeAngle: 0.75
        },
        {
          type: 'directional',
          color: [0, 255, 0],
          direction: [0, 1, 0]
        }
      ]
    });

    expect(uniforms.pointLightCount, 'point lights counted').toBe(1);
    expect(uniforms.spotLightCount, 'spot lights counted').toBe(1);
    expect(uniforms.directionalLightCount, 'directional lights counted').toBe(1);
    expect(uniforms.lights.length, 'light array padded to uniform block length').toBe(5);
    expect(uniforms.ambientColor, 'ambient light converted').toEqual([0, 0, 1]);
    expect(uniforms.lights[0].position, 'point light stored in first slot').toEqual([1, 2, 3]);
    expect(uniforms.lights[0].attenuation, 'point light attenuation stored in first slot').toEqual([
      1, 0.25, 0.125
    ]);
    expect(uniforms.lights[1].direction, 'spot light stored in second slot').toEqual([0, -1, 0]);
    expect(uniforms.lights[2].direction, 'directional light stored after spots').toEqual([0, 1, 0]);

    const layout = makeShaderBlockLayout(lighting.uniformTypes);
    const writer = new ShaderBlockWriter(layout);
    const layoutKeys = Object.keys(layout.fields);
    expect(layoutKeys.slice(-4), 'lights array occupies the tail of the uniform block').toEqual([
      'lights[4].position',
      'lights[4].direction',
      'lights[4].attenuation',
      'lights[4].coneCos'
    ]);

    const data = writer.getData(uniforms);
    const floatView = new Float32Array(data.buffer);
    const intView = new Int32Array(data.buffer);

    expect(intView[layout.fields.pointLightCount.offset], 'point light count packed').toBe(1);
    expect(intView[layout.fields.spotLightCount.offset], 'spot light count packed').toBe(1);
    expect(
      intView[layout.fields.directionalLightCount.offset],
      'directional light count packed'
    ).toBe(1);
    expect(floatView[layout.fields.ambientColor.offset + 2], 'ambient color packed').toBe(1);
    expect(floatView[layout.fields['lights[0].color'].offset], 'first light color packed').toBe(1);
    expect(
      floatView[layout.fields['lights[0].position'].offset + 1],
      'first light position packed'
    ).toBe(2);
    expect(
      floatView[layout.fields['lights[1].direction'].offset + 1],
      'spot light direction packed'
    ).toBe(-1);
    expect(
      Boolean(
        Math.abs(floatView[layout.fields['lights[1].coneCos'].offset] - Math.cos(0.25)) <
          FLOAT32_EPSILON
      ),
      'spot light cone packed'
    ).toBe(true);
    expect(
      floatView[layout.fields['lights[2].direction'].offset + 1],
      'directional light direction packed'
    ).toBe(1);

    void 0;
  });

  test('shadertools#lighting default and legacy prop handling', () => {
    expect(lighting.getUniforms(), 'missing props return defaults').toEqual(
      lighting.defaultUniforms
    );

    const disabledUniforms = lighting.getUniforms({});
    expect(disabledUniforms.enabled, 'missing lights disable lighting').toBe(0);

    const legacyUniforms = lighting.getUniforms({
      enabled: false,
      ambientLight: {type: 'ambient', color: [255, 128, 0], intensity: 0.5},
      pointLights: [{type: 'point', position: [4, 5, 6]}]
    });
    expect(legacyUniforms.enabled, 'explicit enabled=false is respected').toBe(0);
    expect(legacyUniforms.pointLightCount, 'legacy point lights are supported').toBe(1);
    expect(legacyUniforms.ambientColor, 'legacy ambient lights are normalized').toEqual([
      0.5,
      128 / 510,
      0
    ]);
    expect(legacyUniforms.lights[0].position, 'legacy light data is preserved').toEqual([4, 5, 6]);

    const floatUniforms = lighting.getUniforms({
      useByteColors: false,
      lights: [{type: 'ambient', color: [1, 0.5, 0.25], intensity: 2}]
    });
    expect(floatUniforms.ambientColor, 'float light colors pass through').toEqual([2, 1, 0.5]);

    void 0;
  });
}
