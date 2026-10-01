// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {lambertMaterial} from '@luma.gl/shadertools';
import {getTestDevice} from '@luma.gl/test-utils';
import {makeShaderModuleRenderer} from '../render-shader-module';

for (const backend of ['webgpu', 'webgl'] as const) {
  it(`Lambert material renders diffuse and unlit colors on ${backend}`, async context => {
    const device = await getTestDevice(backend);
    if (!device || !device.isTextureFormatRenderable('rgba32float')) return context.skip();
    const renderer = makeShaderModuleRenderer(
      device,
      [lambertMaterial],
      `
@fragment fn fragmentMain() -> @location(0) vec4<f32> {
  return vec4<f32>(lighting_getLightColor2(vec3<f32>(0.8, 0.4, 0.2), vec3<f32>(0.0, 0.0, 1.0), vec3<f32>(0.0), vec3<f32>(0.0, 0.0, 1.0)), 1.0);
}`,
      `void main() {
  fragmentColor = vec4(lighting_getLightColor(vec3(0.8, 0.4, 0.2), vec3(0.0, 0.0, 1.0), vec3(0.0), vec3(0.0, 0.0, 1.0)), 1.0);
}`
    );
    try {
      renderer.model.shaderInputs.setProps({
        lambertMaterial: {ambient: 0.25, diffuse: 0.5},
        lighting: {
          enabled: true,
          lights: [
            {type: 'ambient', color: [255, 255, 255]},
            {type: 'directional', color: [255, 255, 255], direction: [0, 0, -1]}
          ]
        }
      });
      const lit = await renderer.read();
      [0.6, 0.3, 0.15, 1].forEach((value, index) => expect(lit[index]).toBeCloseTo(value, 5));
      renderer.model.shaderInputs.setProps({lambertMaterial: {unlit: true}});
      const unlit = await renderer.read();
      [0.8, 0.4, 0.2, 1].forEach((value, index) => expect(unlit[index]).toBeCloseTo(value, 5));
    } finally {
      renderer.destroy();
    }
  });
}
