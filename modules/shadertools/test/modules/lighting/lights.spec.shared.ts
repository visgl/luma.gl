// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {UniformBufferLayout} from '@luma.gl/core';
import {lighting, type LightingUniforms} from '../../../src/index';
import type {TapeTestFunction} from 'test/utils/vitest-tape';

const lightingUniformTypecheck: LightingUniforms = lighting.defaultUniforms;
const FLOAT32_EPSILON = 1e-6;

export function registerLightingTests(test: TapeTestFunction): void {
  test('shadertools#lighting uses a trailing struct array uniform block', t => {
    t.ok(lightingUniformTypecheck, 'lighting uniforms are typed');
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

    t.equal(uniforms.pointLightCount, 1, 'point lights counted');
    t.equal(uniforms.spotLightCount, 1, 'spot lights counted');
    t.equal(uniforms.directionalLightCount, 1, 'directional lights counted');
    t.equal(uniforms.lights.length, 5, 'light array padded to uniform block length');
    t.deepEqual(uniforms.ambientColor, [0, 0, 1], 'ambient light converted');
    t.deepEqual(uniforms.lights[0].position, [1, 2, 3], 'point light stored in first slot');
    t.deepEqual(
      uniforms.lights[0].attenuation,
      [1, 0.25, 0.125],
      'point light attenuation stored in first slot'
    );
    t.deepEqual(uniforms.lights[1].direction, [0, -1, 0], 'spot light stored in second slot');
    t.deepEqual(uniforms.lights[2].direction, [0, 1, 0], 'directional light stored after spots');

    const layout = new UniformBufferLayout(lighting.uniformTypes);
    const layoutKeys = Object.keys(layout.layout);
    t.deepEqual(
      layoutKeys.slice(-4),
      ['lights[4].position', 'lights[4].direction', 'lights[4].attenuation', 'lights[4].coneCos'],
      'lights array occupies the tail of the uniform block'
    );

    const data = layout.getData(uniforms);
    const floatView = new Float32Array(data.buffer);
    const intView = new Int32Array(data.buffer);

    t.equal(intView[layout.get('pointLightCount')!.offset], 1, 'point light count packed');
    t.equal(intView[layout.get('spotLightCount')!.offset], 1, 'spot light count packed');
    t.equal(
      intView[layout.get('directionalLightCount')!.offset],
      1,
      'directional light count packed'
    );
    t.equal(floatView[layout.get('ambientColor')!.offset + 2], 1, 'ambient color packed');
    t.equal(floatView[layout.get('lights[0].color')!.offset], 1, 'first light color packed');
    t.equal(
      floatView[layout.get('lights[0].position')!.offset + 1],
      2,
      'first light position packed'
    );
    t.equal(
      floatView[layout.get('lights[1].direction')!.offset + 1],
      -1,
      'spot light direction packed'
    );
    t.ok(
      Math.abs(floatView[layout.get('lights[1].coneCos')!.offset] - Math.cos(0.25)) <
        FLOAT32_EPSILON,
      'spot light cone packed'
    );
    t.equal(
      floatView[layout.get('lights[2].direction')!.offset + 1],
      1,
      'directional light direction packed'
    );

    t.end();
  });

  test('shadertools#lighting default and legacy prop handling', t => {
    t.deepEqual(lighting.getUniforms(), lighting.defaultUniforms, 'missing props return defaults');

    const disabledUniforms = lighting.getUniforms({});
    t.equal(disabledUniforms.enabled, 0, 'missing lights disable lighting');

    const legacyUniforms = lighting.getUniforms({
      enabled: false,
      ambientLight: {type: 'ambient', color: [255, 128, 0], intensity: 0.5},
      pointLights: [{type: 'point', position: [4, 5, 6]}]
    });
    t.equal(legacyUniforms.enabled, 0, 'explicit enabled=false is respected');
    t.equal(legacyUniforms.pointLightCount, 1, 'legacy point lights are supported');
    t.deepEqual(
      legacyUniforms.ambientColor,
      [0.5, 128 / 510, 0],
      'legacy ambient lights are normalized'
    );
    t.deepEqual(legacyUniforms.lights[0].position, [4, 5, 6], 'legacy light data is preserved');

    t.end();
  });
}
