// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {unlitMaterial, type ShaderModule} from '@luma.gl/shaders';
import {getTestDevice} from '@luma.gl/core/test-utils';
import {makeShaderModuleRenderer} from '../render-shader-module';

for (const backend of ['webgpu', 'webgl'] as const) {
  for (const compatibility of [false, true]) {
    it(`Unlit material preserves HDR color and alpha on ${backend} (compatibility=${compatibility})`, async context => {
      const device = await getTestDevice(backend);
      if (!device || !device.isTextureFormatRenderable('rgba32float')) return context.skip();
      const renderer = makeShaderModuleRenderer(
        device,
        [unlitMaterial],
        `@fragment fn fragmentMain() -> @location(0) vec4<f32> {
          return ${
            compatibility
              ? 'vec4<f32>(lighting_getLightColor2(vec3<f32>(2.0, 0.4, 0.2), vec3<f32>(9.0), vec3<f32>(-5.0), vec3<f32>(0.0)), 0.3)'
              : 'unlitMaterial_getColor(vec4<f32>(2.0, 0.4, 0.2, 0.3))'
          };
        }`,
        `void main() {
          fragmentColor = ${
            compatibility
              ? 'vec4(lighting_getLightColor(vec3(2.0, 0.4, 0.2), vec3(9.0), vec3(-5.0), vec3(0.0)), 0.3)'
              : 'unlitMaterial_getColor(vec4(2.0, 0.4, 0.2, 0.3))'
          };
        }`
      );
      try {
        const pixels = await renderer.read();
        for (let pixelIndex = 0; pixelIndex < pixels.length; pixelIndex++) {
          expect(pixels[pixelIndex]).toBeCloseTo([2, 0.4, 0.2, 0.3][pixelIndex % 4], 5);
        }
        expect(renderer.model.shaderInputs.getModules().map(module => module.name)).toEqual([
          'unlitMaterial'
        ]);
      } finally {
        renderer.destroy();
      }
    });
  }

  it(`Unlit material preserves sampled texture RGBA on ${backend}`, async context => {
    const device = await getTestDevice(backend);
    if (!device || !device.isTextureFormatRenderable('rgba32float')) return context.skip();
    const texture = device.createTexture({
      width: 1,
      height: 1,
      format: 'rgba8unorm',
      data: new Uint8Array([64, 128, 192, 96])
    });
    const textureModule: ShaderModule = {
      name: 'surfaceTexture',
      source: '@group(0) @binding(auto) var surfaceTexture: texture_2d<f32>;',
      fs: 'uniform sampler2D surfaceTexture;',
      bindingLayout: [{name: 'surfaceTexture', group: 0}]
    };
    const renderer = makeShaderModuleRenderer(
      device,
      [unlitMaterial, textureModule],
      `@fragment fn fragmentMain() -> @location(0) vec4<f32> {
        return unlitMaterial_getColor(textureLoad(surfaceTexture, vec2<i32>(0), 0));
      }`,
      `void main() {
        fragmentColor = unlitMaterial_getColor(texelFetch(surfaceTexture, ivec2(0), 0));
      }`
    );
    try {
      renderer.model.setBindings({surfaceTexture: texture});
      const pixels = await renderer.read();
      [64, 128, 192, 96].forEach((value, index) =>
        expect(pixels[index]).toBeCloseTo(value / 255, 5)
      );
    } finally {
      renderer.destroy();
      texture.destroy();
    }
  });
}
