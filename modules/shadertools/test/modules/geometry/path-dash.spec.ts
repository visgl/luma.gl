// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {Buffer, Texture} from '@luma.gl/core';
import {Model} from '@luma.gl/engine';
import {pathDash, type PathDashProps} from '@luma.gl/shadertools';
import {getTestDevice} from '@luma.gl/test-utils';

const SOURCE = /* wgsl */ `
@vertex fn vertexMain(@builtin(vertex_index) index: u32) -> @builtin(position) vec4<f32> {
  var positions = array<vec2<f32>, 3>(vec2<f32>(-1.0, -1.0), vec2<f32>(3.0, -1.0), vec2<f32>(-1.0, 3.0));
  return vec4<f32>(positions[index], 0.0, 1.0);
}
@fragment fn fragmentMain(@builtin(position) position: vec4<f32>) -> @location(0) vec4<f32> {
  let coverage = pathDash_getCoverage(position.x - 32.0);
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
  float coverage = pathDash_getCoverage(gl_FragCoord.x - 32.0);
  fragColor = vec4(vec3(coverage), 1.0);
}
`;

for (const backend of ['webgl', 'webgpu'] as const) {
  test(`${backend}: path dashes preserve ink area, phase and minified coverage`, async context => {
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
      modules: [pathDash],
      vertexCount: 3
    });
    async function renderDash(props: PathDashProps) {
      model.shaderInputs.setProps({pathDash: props});
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
        row: coverage.slice(0, 64),
        mean: coverage.reduce((sum, value) => sum + value, 0) / coverage.length,
        minimum: Math.min(...coverage),
        maximum: Math.max(...coverage)
      };
    }
    try {
      const resolved = await renderDash({dashLength: 4, gapLength: 12, offset: 0});
      expect(resolved.mean).toBeCloseTo(0.25, 2);
      expect(resolved.minimum).toBe(0);
      expect(resolved.maximum).toBe(1);
      const shifted = await renderDash({offset: -8});
      expect(shifted.mean).toBeCloseTo(0.25, 2);
      expect(shifted.row.slice(8)).toEqual(resolved.row.slice(0, 56));
      expect(shifted.row).not.toEqual(resolved.row);
      const distant = await renderDash({dashLength: 0.125, gapLength: 0.375, offset: 12.75});
      expect(distant.mean).toBeCloseTo(0.25, 2);
      expect(distant.maximum - distant.minimum).toBeLessThan(0.006);
      const empty = await renderDash({dashLength: 0});
      expect(empty.maximum).toBe(0);
      const solid = await renderDash({gapLength: 0});
      expect(solid.minimum).toBe(1);
    } finally {
      model.destroy();
      framebuffer.destroy();
      texture.destroy();
      pixels.destroy();
    }
  });
}
