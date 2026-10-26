// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {riverWaterMaterial} from '@luma.gl/shadertools';
import {getTestDevice} from '@luma.gl/test-utils';
import {makeShaderModuleRenderer} from './render-shader-module';

for (const backend of ['webgpu', 'webgl'] as const) {
  it(`river sky fallback follows environment direction and stays independent of time on ${backend}`, async context => {
    const device = await getTestDevice(backend);
    if (!device || !device.isTextureFormatRenderable('rgba32float')) return context.skip();
    const renderer = makeShaderModuleRenderer(device, [riverWaterMaterial], SKY_WGSL, SKY_GLSL);
    const horizon = [0.8, 0.7, 0.6];
    const zenith = [0.1, 0.2, 0.4];
    try {
      renderer.model.shaderInputs.setProps({
        waterMaterial: {fresnelColor: horizon, time: 0},
        riverWaterMaterial: {skyZenithColor: zenith, skyUpDirection: [0, 0, 1]}
      });
      const first = await renderer.read();
      for (const [index, elevation] of [0, 0, 1, 0, Math.SQRT1_2, 0].entries()) {
        const blend = elevation * elevation * (3 - 2 * elevation);
        for (let channel = 0; channel < 3; channel++) {
          const horizonColor = horizon[channel] * 0.68 + zenith[channel] * 0.32;
          expect(first[index * 4 + channel]).toBeCloseTo(
            horizonColor * (1 - blend) + zenith[channel] * blend,
            5
          );
        }
      }
      renderer.model.shaderInputs.setProps({waterMaterial: {time: 500}});
      expect(await renderer.read()).toEqual(first);
      renderer.model.shaderInputs.setProps({riverWaterMaterial: {skyUpDirection: [0, 1, 0]}});
      const rotated = await renderer.read();
      expect(rotated.slice(4, 7)).toEqual(first.slice(8, 11));
      expect(rotated.slice(8, 11)).toEqual(first.slice(0, 3));
    } finally {
      renderer.destroy();
    }
  });
}
const SKY_WGSL = `@fragment fn fragmentMain(@builtin(position) fragment: vec4<f32>) -> @location(0) vec4<f32> {
  let directions = array<vec3<f32>, 6>(vec3<f32>(1.0,0.0,0.0),vec3<f32>(0.0,1.0,0.0),vec3<f32>(0.0,0.0,1.0),vec3<f32>(0.0,0.0,-1.0),vec3<f32>(1.0,0.0,1.0),vec3<f32>(-1.0,0.0,0.0));
  return vec4<f32>(riverWater_getSkyColor(directions[u32(fragment.x)]), 1.0);
}`;
const SKY_GLSL = `void main() {
  vec3 directions[6] = vec3[6](vec3(1.0,0.0,0.0),vec3(0.0,1.0,0.0),vec3(0.0,0.0,1.0),vec3(0.0,0.0,-1.0),vec3(1.0,0.0,1.0),vec3(-1.0,0.0,0.0));
  fragmentColor = vec4(riverWater_getSkyColor(directions[int(gl_FragCoord.x)]),1.0);
}`;
