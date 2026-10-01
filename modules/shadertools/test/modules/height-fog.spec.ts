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

for (const backend of ['webgpu', 'webgl'] as const) {
  it(`heightFog wisps vary in space, advect continuously and freeze deterministically on ${backend}`, async context => {
    const device = await getTestDevice(backend);
    if (!device || !device.isTextureFormatRenderable('rgba32float')) return context.skip();
    const renderer = makeShaderModuleRenderer(
      device,
      [heightFog],
      `@fragment fn fragmentMain(@builtin(position) fragment: vec4f) -> @location(0) vec4f {
        let camera = vec3f(floor(fragment.x) * 160.0, 0.0, 5.0);
        let position = camera + vec3f(100.0, 100.0, 0.0);
        let offset = heightFog.velocity * heightFog.time;
        return vec4f(heightFog_getTransmittance(position, camera),
          heightFog_getTransmittance(position + offset, camera + offset), 0.0, 0.37);
      }`,
      `void main() {
        vec3 camera = vec3(floor(gl_FragCoord.x) * 160.0, 0.0, 5.0);
        vec3 position = camera + vec3(100.0, 100.0, 0.0);
        vec3 offset = heightFog.velocity * heightFog.time;
        fragmentColor = vec4(heightFog_getTransmittance(position, camera),
          heightFog_getTransmittance(position + offset, camera + offset), 0.0, 0.37);
      }`
    );
    try {
      renderer.model.shaderInputs.setProps({
        heightFog: {
          density: 0.01,
          heightFalloff: 0,
          variation: 1,
          wispScale: 160,
          velocity: [3, 2, 0],
          time: 0
        }
      });
      const initial = await renderer.read();
      const samples = initial.filter((_, index) => index % 4 === 0);
      expect(Math.max(...samples) - Math.min(...samples)).toBeGreaterThan(0.05);
      renderer.model.shaderInputs.setProps({heightFog: {time: 30}});
      const moved = await renderer.read();
      expect(
        moved.some((value, index) => index % 4 === 0 && Math.abs(value - initial[index]) > 0.02)
      ).toBe(true);
      for (let index = 0; index < 6; index++) {
        expect(moved[index * 4]).toBeGreaterThanOrEqual(0);
        expect(moved[index * 4]).toBeLessThanOrEqual(1);
        // Following the moving fog preserves the same density field in world space.
        expect(moved[index * 4 + 1]).toBeCloseTo(initial[index * 4], 4);
      }
      expect(await renderer.read()).toEqual(moved);
      renderer.model.shaderInputs.setProps({
        heightFog: {velocity: [0, 0, 0], time: 0, evolutionSpeed: 0.1}
      });
      const evolvingStart = await renderer.read();
      renderer.model.shaderInputs.setProps({heightFog: {time: 10}});
      const evolvingEnd = await renderer.read();
      expect(
        evolvingEnd.some(
          (value, index) => index % 4 === 0 && Math.abs(value - evolvingStart[index]) > 0.02
        )
      ).toBe(true);
      expect(await renderer.read()).toEqual(evolvingEnd);
      renderer.model.shaderInputs.setProps({
        heightFog: {velocity: [3, 2, 0], time: 30, evolutionSpeed: 0}
      });
      renderer.model.shaderInputs.setProps({heightFog: {time: 30.01}});
      const nearby = await renderer.read();
      nearby.forEach((value, index) => expect(Math.abs(value - moved[index])).toBeLessThan(0.002));
      renderer.model.shaderInputs.setProps({heightFog: {variation: 0}});
      const uniform = await renderer.read();
      uniform
        .filter((_, index) => index % 4 < 2)
        .forEach(value => expect(value).toBeCloseTo(Math.exp(-Math.sqrt(20000) * 0.01), 4));
      renderer.model.shaderInputs.setProps({heightFog: {variation: 1, density: 0}});
      const disabled = await renderer.read();
      disabled.filter((_, index) => index % 4 < 2).forEach(value => expect(value).toBe(1));
    } finally {
      renderer.destroy();
    }
  });
}
