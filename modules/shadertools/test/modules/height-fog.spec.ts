// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {heightFog} from '@luma.gl/shadertools';
import {getTestDevice} from '@luma.gl/test-utils';
import {makeShaderModuleRenderer} from './render-shader-module';

for (const backend of ['webgpu', 'webgl'] as const) {
  it(`heightFog integrates metre-space rays above, below, and across its base on ${backend}`, async context => {
    const device = await getTestDevice(backend);
    if (!device || !device.isTextureFormatRenderable('rgba32float')) return context.skip();
    const renderer = makeShaderModuleRenderer(device, [heightFog], FOG_WGSL, FOG_GLSL);
    try {
      renderer.model.shaderInputs.setProps({
        heightFog: {density: 0.01, heightFalloff: 0.02, baseHeight: 0}
      });
      const values = await renderer.read();
      const expected = [
        Math.exp(-1),
        Math.exp(-Math.exp(-2)),
        Math.exp(-(0.5 + (1 - Math.exp(-1)) / 2)),
        Math.exp(-(0.5 + (1 - Math.exp(-1)) / 2)),
        1,
        Math.exp(-1)
      ];
      expected.forEach((value, index) => expect(values[index * 4]).toBeCloseTo(value, 4));
      renderer.model.shaderInputs.setProps({heightFog: {density: 0}});
      const clear = await renderer.read();
      expected.forEach((value, index) => expect(clear[index * 4]).toBe(1));
    } finally {
      renderer.destroy();
    }
  });
}

const FOG_WGSL = `@fragment fn fragmentMain(@builtin(position) fragment: vec4<f32>) -> @location(0) vec4<f32> {
  let index = u32(fragment.x);
  var camera = vec3<f32>(0.0);
  var position = vec3<f32>(100.0,0.0,0.0);
  if (index == 1u) {camera.z = 100.0; position.z = 100.0;}
  if (index == 2u) {camera.z = -50.0; position = vec3<f32>(0.0,0.0,50.0);}
  if (index == 3u) {camera.z = 50.0; position = vec3<f32>(0.0,0.0,-50.0);}
  if (index == 4u) {position = camera;}
  if (index == 5u) {camera.z = -200.0; position = vec3<f32>(0.0,0.0,-100.0);}
  return vec4<f32>(heightFog_getTransmittance(position, camera),0.0,0.0,1.0);
}`;
const FOG_GLSL = `void main() {
  int index = int(gl_FragCoord.x);
  vec3 camera = vec3(0.0);
  vec3 position = vec3(100.0,0.0,0.0);
  if (index == 1) {camera.z = 100.0; position.z = 100.0;}
  if (index == 2) {camera.z = -50.0; position = vec3(0.0,0.0,50.0);}
  if (index == 3) {camera.z = 50.0; position = vec3(0.0,0.0,-50.0);}
  if (index == 4) {position = camera;}
  if (index == 5) {camera.z = -200.0; position = vec3(0.0,0.0,-100.0);}
  fragmentColor = vec4(heightFog_getTransmittance(position, camera),0.0,0.0,1.0);
}`;
