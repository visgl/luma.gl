// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {Buffer} from '@luma.gl/core';
import {RenderKernel} from '@luma.gl/gpgpu';
import {getTestDevice} from '@luma.gl/core/test-utils';

it('RenderKernel executes instanced WebGL transform feedback with per-draw topology and uniforms', async context => {
  const device = await getTestDevice('webgl');
  if (!device) return context.skip();
  const kernel = new RenderKernel(device, {
    vertexSource: `#version 300 es
uniform float offset;
out float result;
void main() {
  result = offset + float(gl_InstanceID);
  gl_Position = vec4(0.0);
}`,
    fragmentSource: `#version 300 es
precision highp float;
out vec4 color;
void main() {color = vec4(0.0);}`,
    topology: 'triangle-list',
    varyings: ['result']
  });
  const vertexArray = device.createVertexArray({
    shaderLayout: kernel.pipeline.shaderLayout,
    bufferLayout: []
  });
  const output = device.createBuffer({
    byteLength: 12,
    usage: Buffer.VERTEX | Buffer.COPY_SRC | Buffer.COPY_DST
  });
  const feedback = device.createTransformFeedback({
    layout: kernel.pipeline.shaderLayout,
    buffers: {result: output}
  });
  try {
    for (const offset of [5, 10]) {
      const pass = device.beginRenderPass({discard: true});
      try {
        expect(
          kernel.draw(pass, {
            vertexArray,
            topology: 'point-list',
            vertexCount: 1,
            instanceCount: 3,
            transformFeedback: feedback,
            uniforms: {offset}
          })
        ).toBe(true);
      } finally {
        pass.end();
      }
      const bytes = await output.readAsync();
      expect(Array.from(new Float32Array(bytes.buffer, bytes.byteOffset, 3))).toEqual([
        offset,
        offset + 1,
        offset + 2
      ]);
    }
  } finally {
    feedback.destroy();
    output.destroy();
    vertexArray.destroy();
    kernel.destroy();
  }
});
