// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, Texture, type Device} from '@luma.gl/core';
import {Model} from '@luma.gl/engine';
import type {ShaderModule} from '@luma.gl/shadertools';

export function makeShaderModuleRenderer(
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
