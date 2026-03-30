// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {waterMaterial} from '@luma.gl/shadertools';
import type {TapeTestFunction} from '@luma.gl/devtools-extensions/tape-test-utils';

export function registerWaterMaterialTests(test: TapeTestFunction): void {
  test('shadertools#waterMaterial', t => {
    let uniforms = waterMaterial.getUniforms({});
    t.deepEqual(uniforms, waterMaterial.defaultUniforms, 'default water uniforms resolve');

    uniforms = waterMaterial.getUniforms({
      baseColor: [0, 128, 255],
      fresnelColor: [255, 255, 255],
      mapping: 'world',
      waveADirection: [0, 2],
      waveBDirection: [-4, 0],
      normalStrength: 0.5
    });

    t.deepEqual(uniforms.baseColor, [0, 128 / 255, 1], 'baseColor is normalized from 0-255');
    t.deepEqual(uniforms.fresnelColor, [1, 1, 1], 'fresnelColor is normalized from 0-255');
    t.equal(uniforms.mappingMode, 1, 'mapping prop converts to world-space mode');
    t.deepEqual(uniforms.waveADirection, [0, 1], 'wave A direction is normalized');
    t.deepEqual(uniforms.waveBDirection, [-1, 0], 'wave B direction is normalized');
    t.equal(uniforms.normalStrength, 0.5, 'scalar uniforms are forwarded');
    t.ok(
      waterMaterial.defines?.LIGHTING_FRAGMENT,
      'waterMaterial opts into fragment lighting helpers'
    );

    t.end();
  });
}
