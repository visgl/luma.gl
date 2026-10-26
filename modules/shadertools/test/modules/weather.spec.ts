// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {precipitation} from '@luma.gl/shadertools';
import {getTestDevice} from '@luma.gl/test-utils';
import {makeShaderModuleRenderer} from './render-shader-module';

for (const backend of ['webgpu', 'webgl'] as const) {
  it(`precipitation is seeded, pauses exactly, and remains world anchored when its volume moves on ${backend}`, async context => {
    const device = await getTestDevice(backend);
    if (!device || !device.isTextureFormatRenderable('rgba32float')) return context.skip();
    // Exercise the same position helper in a fragment test harness for direct GPU readback.
    const renderer = makeShaderModuleRenderer(
      device,
      [{...precipitation, fs: precipitation.vs}],
      PARTICLES_WGSL,
      PARTICLES_GLSL
    );
    try {
      renderer.model.shaderInputs.setProps({
        precipitation: {
          time: 0,
          seed: 29,
          volumeCenter: [50, 50, 50],
          volumeSize: [100, 100, 100],
          wind: [2, 3],
          fallSpeed: 5,
          turbulence: 0
        }
      });
      const initial = await renderer.read();
      expect(await renderer.read()).toEqual(initial);
      renderer.model.shaderInputs.setProps({precipitation: {time: 1}});
      const moved = await renderer.read();
      for (let particle = 0; particle < 6; particle++) {
        [2, 3, -5].forEach((velocity, axis) =>
          expect(moved[particle * 4 + axis]).toBeCloseTo(
            (initial[particle * 4 + axis] + velocity + 100) % 100,
            3
          )
        );
      }
      renderer.model.shaderInputs.setProps({precipitation: {time: 0}});
      expect(await renderer.read()).toEqual(initial);
      renderer.model.shaderInputs.setProps({precipitation: {volumeCenter: [60, 50, 50]}});
      const shifted = await renderer.read();
      let unchanged = 0;
      for (let particle = 0; particle < 6; particle++) {
        const horizontal = initial[particle * 4];
        expect(shifted[particle * 4]).toBeCloseTo(
          horizontal < 10 ? horizontal + 100 : horizontal,
          3
        );
        if (horizontal >= 10) unchanged++;
        expect(shifted[particle * 4 + 1]).toBeCloseTo(initial[particle * 4 + 1], 3);
        expect(shifted[particle * 4 + 2]).toBeCloseTo(initial[particle * 4 + 2], 3);
      }
      expect(unchanged).toBeGreaterThan(0);
    } finally {
      renderer.destroy();
    }
  });
}

const PARTICLES_WGSL = `@fragment fn fragmentMain(@builtin(position) fragment: vec4<f32>) -> @location(0) vec4<f32> {
  return vec4<f32>(precipitation_getPosition(u32(fragment.x)),1.0);
}`;
const PARTICLES_GLSL = `void main() {fragmentColor = vec4(precipitation_getPosition(uint(gl_FragCoord.x)),1.0);}`;
