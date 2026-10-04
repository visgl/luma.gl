// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {Buffer, Texture} from '@luma.gl/core';
import {Model} from '@luma.gl/engine';
import {patternFill, type PatternFillProps} from '@luma.gl/shadertools';
import {getTestDevice} from '@luma.gl/test-utils';

const SOURCE = /* wgsl */ `
@vertex fn vertexMain(@builtin(vertex_index) index: u32) -> @builtin(position) vec4<f32> {
  var positions = array<vec2<f32>, 3>(vec2<f32>(-1.0, -1.0), vec2<f32>(3.0, -1.0), vec2<f32>(-1.0, 3.0));
  return vec4<f32>(positions[index], 0.0, 1.0);
}
@fragment fn fragmentMain(@builtin(position) position: vec4<f32>) -> @location(0) vec4<f32> {
  let coverage = patternFill_getCoverage(position.xy - vec2<f32>(32.0));
  return vec4<f32>(vec3<f32>(coverage), 1.0);
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
  float coverage = patternFill_getCoverage(gl_FragCoord.xy - vec2(32.0));
  fragColor = vec4(vec3(coverage), 1.0);
}
`;

for (const backend of ['webgl', 'webgpu'] as const) {
  test(`${backend}: pattern fills preserve ink area and suppress subpixel aliasing`, async context => {
    const device = await getTestDevice(backend);
    if (!device) {
      context.skip(`${backend} is unavailable`);
      return;
    }
    const texture = device.createTexture({
      width: 64,
      height: 64,
      format: 'rgba8unorm',
      usage: Texture.RENDER | Texture.COPY_SRC
    });
    const framebuffer = device.createFramebuffer({
      width: 64,
      height: 64,
      colorAttachments: [texture]
    });
    const pixels = device.createBuffer({
      byteLength: 64 * 64 * 4,
      usage: Buffer.COPY_DST | Buffer.MAP_READ
    });
    const model = new Model(device, {
      source: SOURCE,
      vs: VERTEX_SHADER,
      fs: FRAGMENT_SHADER,
      modules: [patternFill],
      vertexCount: 3
    });
    async function renderPattern(props: PatternFillProps) {
      model.shaderInputs.setProps({patternFill: props});
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
      const values = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
      const coverage = Array.from({length: 64 * 64}, (_, index) => values[index * 4] / 255);
      return {
        mean: coverage.reduce((sum, value) => sum + value, 0) / coverage.length,
        minimum: Math.min(...coverage),
        maximum: Math.max(...coverage)
      };
    }
    try {
      for (const [pattern, expected] of [
        ['hatch', 0.25],
        ['crosshatch', 0.4375],
        ['dots', Math.PI * 0.25 ** 2]
      ] as const) {
        const width = pattern === 'dots' ? 0.5 : 0.25;
        const resolved = await renderPattern({
          pattern,
          width,
          angle: 0,
          spacing: 16,
          offset: [0, 0]
        });
        expect(
          Math.abs(resolved.mean - expected),
          `${device.type}: resolved ${pattern} ink area`
        ).toBeLessThan(0.025);
        expect(
          resolved.maximum - resolved.minimum,
          `${device.type}: resolved ${pattern} structure`
        ).toBeGreaterThan(0.8);
        const distant = await renderPattern({spacing: 0.125, offset: [-12.25, 7.75]});
        expect(
          Math.abs(distant.mean - expected),
          `${device.type}: minified ${pattern} ink area`
        ).toBeLessThan(0.006);
        expect(
          distant.maximum - distant.minimum,
          `${device.type}: minified ${pattern} aliasing`
        ).toBeLessThan(0.006);
        const empty = await renderPattern({width: 0});
        expect(empty.maximum, `${device.type}: zero ink`).toBe(0);
      }
    } finally {
      model.destroy();
      framebuffer.destroy();
      texture.destroy();
      pixels.destroy();
    }
  });
}
