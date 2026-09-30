// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {Buffer, Texture, type Device} from '@luma.gl/core';
import {Model} from '@luma.gl/engine';
import {heightFog, precipitation, type ShaderModule} from '@luma.gl/shadertools';
import {getTestDevice} from '@luma.gl/test-utils';

for (const backend of ['webgpu', 'webgl'] as const) {
  it(`heightFog integrates metre-space rays above, below, and across its base on ${backend}`, async context => {
    const device = await getTestDevice(backend);
    if (!device || !device.isTextureFormatRenderable('rgba32float')) return context.skip();
    const renderer = makeRenderer(device, [heightFog], FOG_WGSL, FOG_GLSL);
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
  it(`precipitation is seeded, pauses exactly, and remains world anchored when its volume moves on ${backend}`, async context => {
    const device = await getTestDevice(backend);
    if (!device || !device.isTextureFormatRenderable('rgba32float')) return context.skip();
    // Exercise the same position helper in a fragment test harness for direct GPU readback.
    const renderer = makeRenderer(
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

function makeRenderer(
  device: Device,
  modules: ShaderModule[],
  fragmentSource: string,
  fragmentShader: string
) {
  const texture = device.createTexture({
    width: 6,
    height: 1,
    format: 'rgba32float',
    usage: Texture.COPY_SRC | Texture.COPY_DST | Texture.TEXTURE | Texture.RENDER_ATTACHMENT
  });
  const framebuffer = device.createFramebuffer({width: 6, height: 1, colorAttachments: [texture]});
  const model = new Model(device, {
    source:
      `@vertex fn vertexMain(@builtin(vertex_index) index: u32) -> @builtin(position) vec4<f32> {
      let positions = array<vec2<f32>, 3>(vec2<f32>(-1.0,-1.0), vec2<f32>(3.0,-1.0), vec2<f32>(-1.0,3.0));
      return vec4<f32>(positions[index],0.0,1.0);
    }` + fragmentSource,
    vs: `#version 300 es
    void main() {
      vec2 positions[3] = vec2[3](vec2(-1.0,-1.0), vec2(3.0,-1.0), vec2(-1.0,3.0));
      gl_Position = vec4(positions[gl_VertexID],0.0,1.0);
    }`,
    fs: '#version 300 es\nprecision highp float;\nout vec4 fragmentColor;\n' + fragmentShader,
    modules,
    vertexCount: 3,
    parameters: {blend: false}
  });
  return {
    model,
    async read(): Promise<number[]> {
      const encoder = device.createCommandEncoder();
      model.predraw(encoder);
      const renderPass = encoder.beginRenderPass({
        framebuffer,
        clearColor: [0, 0, 0, 0],
        clearDepth: false
      });
      model.draw(renderPass);
      renderPass.end();
      device.submit(encoder.finish());
      const layout = texture.computeMemoryLayout();
      const buffer = device.createBuffer({
        byteLength: layout.byteLength,
        usage: Buffer.COPY_DST | Buffer.MAP_READ
      });
      try {
        texture.readBuffer({}, buffer);
        const data = await buffer.readAsync();
        return Array.from(new Float32Array(data.buffer, data.byteOffset, 24));
      } finally {
        buffer.destroy();
      }
    },
    destroy() {
      model.destroy();
      framebuffer.destroy();
      texture.destroy();
    }
  };
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
const PARTICLES_WGSL = `@fragment fn fragmentMain(@builtin(position) fragment: vec4<f32>) -> @location(0) vec4<f32> {
  return vec4<f32>(precipitation_getPosition(u32(fragment.x)),1.0);
}`;
const PARTICLES_GLSL = `void main() {fragmentColor = vec4(precipitation_getPosition(uint(gl_FragCoord.x)),1.0);}`;
