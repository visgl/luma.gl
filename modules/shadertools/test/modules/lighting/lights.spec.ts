// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {UniformBufferLayout} from '@luma.gl/core';
import {lighting, type LightingProps, type LightingUniforms} from '../../../src/index';

const lightingUniformTypecheck: LightingUniforms = lighting.defaultUniforms;

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
  t.equal(
    floatView[layout.get('lights[1].coneCos')!.offset],
    Math.cos(0.25),
    'spot light cone packed'
  );
  t.equal(
    floatView[layout.get('lights[2].direction')!.offset + 1],
    1,
    'directional light direction packed'
  );

  t.end();
});
