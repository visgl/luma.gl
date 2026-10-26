// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {Buffer, Texture} from '@luma.gl/core';
import {Model} from '@luma.gl/engine';
import {fromHalfFloat, pointGlow, type PointGlowProps} from '@luma.gl/shadertools';
import {getTestDevice} from '@luma.gl/test-utils';

const SOURCE = /* wgsl */ `
@vertex fn vertexMain(@builtin(vertex_index) index: u32) -> @builtin(position) vec4<f32> {
  let positions = array<vec2<f32>, 3>(vec2<f32>(-1.0, -1.0), vec2<f32>(3.0, -1.0), vec2<f32>(-1.0, 3.0));
  return vec4<f32>(positions[index], 0.0, 1.0);
}
@fragment fn fragmentMain(@builtin(position) position: vec4<f32>) -> @location(0) vec4<f32> {
  return vec4<f32>(pointGlow_getColor((position.xy - vec2<f32>(32.0)) / 24.0, vec3<f32>(0.2, 0.6, 1.0)), 1.0);
}
`;
const VERTEX_SHADER = /* glsl */ `#version 300 es
void main() {
  vec2 positions[3] = vec2[3](vec2(-1.0, -1.0), vec2(3.0, -1.0), vec2(-1.0, 3.0));
  gl_Position = vec4(positions[gl_VertexID], 0.0, 1.0);
}
`;
const FRAGMENT_SHADER = /* glsl */ `#version 300 es
precision highp float;
out vec4 fragColor;
void main() {
  fragColor = vec4(pointGlow_getColor((gl_FragCoord.xy - vec2(32.0)) / 24.0, vec3(0.2, 0.6, 1.0)), 1.0);
}
`;

for (const backend of ['webgpu', 'webgl'] as const) {
  test(`${backend}: point glow preserves HDR radiance and bounded colored halos`, async context => {
    const device = await getTestDevice(backend);
    if (!device) {
      context.skip(`${backend} is unavailable`);
      return;
    }
    const texture = device.createTexture({
      width: 64,
      height: 64,
      format: 'rgba16float',
      usage: Texture.RENDER | Texture.COPY_SRC
    });
    const framebuffer = device.createFramebuffer({
      width: 64,
      height: 64,
      colorAttachments: [texture]
    });
    const pixels = device.createBuffer({
      byteLength: 64 * 64 * 8,
      usage: Buffer.COPY_DST | Buffer.MAP_READ
    });
    const model = new Model(device, {
      source: SOURCE,
      vs: VERTEX_SHADER,
      fs: FRAGMENT_SHADER,
      modules: [pointGlow],
      vertexCount: 3
    });
    async function renderGlow(props: PointGlowProps) {
      model.shaderInputs.setProps({pointGlow: props});
      const renderPass = device.beginRenderPass({framebuffer, clearColor: [0, 0, 0, 0]});
      try {
        expect(model.draw(renderPass)).toBe(true);
      } finally {
        renderPass.end();
        renderPass.destroy();
      }
      device.submit();
      texture.readBuffer({width: 64, height: 64}, pixels);
      const data = await pixels.readAsync();
      const halfFloats = new Uint16Array(data.buffer, data.byteOffset, data.byteLength / 2);
      return (horizontal: number, vertical: number, channel: number) =>
        fromHalfFloat(halfFloats[(vertical * 64 + horizontal) * 4 + channel]);
    }
    try {
      const bright = await renderGlow({
        coreRadius: 0.2,
        coreIntensity: 2,
        haloIntensity: 1,
        falloff: 5
      });
      expect(bright(32, 32, 2)).toBeGreaterThan(2.9);
      expect(bright(32, 32, 0)).toBeGreaterThan(2.1);
      for (const channel of [0, 1, 2]) {
        expect(bright(0, 32, channel)).toBe(0);
        expect(bright(63, 32, channel)).toBe(0);
      }
      expect(bright(44, 32, 2)).toBeGreaterThan(bright(44, 32, 0) * 4.8);
      const stronger = await renderGlow({coreIntensity: 4, haloIntensity: 2});
      expect(stronger(32, 32, 2)).toBeCloseTo(bright(32, 32, 2) * 2, 2);
      expect(stronger(44, 32, 2)).toBeCloseTo(bright(44, 32, 2) * 2, 2);
      const tighter = await renderGlow({coreIntensity: 2, haloIntensity: 1, falloff: 10});
      expect(tighter(44, 32, 2)).toBeLessThan(bright(44, 32, 2));
      const noCore = await renderGlow({coreRadius: 0, haloIntensity: 0});
      expect(noCore(32, 32, 2)).toBe(0);
    } finally {
      model.destroy();
      framebuffer.destroy();
      texture.destroy();
      pixels.destroy();
    }
  });
}
