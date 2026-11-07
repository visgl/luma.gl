// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {transpileWGSL} from '../src/wgsl';
import {WGSL_RENDER_SHADER, WGSL_CONSTANT_SHADER, WGSL_DIVISION_SHADER} from './wgsl-fixtures';

it.each([
  WGSL_RENDER_SHADER,
  WGSL_CONSTANT_SHADER,
  WGSL_DIVISION_SHADER
])('wgsl#rendered GLSL matches WebGPU source execution: %s', async source => {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1;
  const context = canvas.getContext('webgl2', {antialias: false})!;
  expect(context).not.toBeNull();
  const program = context.createProgram()!;
  const shaders: WebGLShader[] = [];
  const buffer = context.createBuffer()!;
  const vertices = new Float32Array([-1, -1, 1, 0, 0, 1, -1, 0, 1, 0, 0, 1, 0, 0, 1]);
  try {
    for (const [entryPoint, stage] of [
      ['vertexMain', context.VERTEX_SHADER],
      ['fragmentMain', context.FRAGMENT_SHADER]
    ] as const) {
      const result = transpileWGSL(source, {entryPoint});
      const shader = context.createShader(stage)!;
      shaders.push(shader);
      context.shaderSource(shader, result.code);
      context.compileShader(shader);
      expect(
        context.getShaderParameter(shader, context.COMPILE_STATUS),
        context.getShaderInfoLog(shader) || result.code
      ).toBe(true);
      context.attachShader(program, shader);
    }
    context.linkProgram(program);
    expect(
      context.getProgramParameter(program, context.LINK_STATUS),
      context.getProgramInfoLog(program) || ''
    ).toBe(true);
    context.useProgram(program);
    context.bindBuffer(context.ARRAY_BUFFER, buffer);
    context.bufferData(context.ARRAY_BUFFER, vertices, context.STATIC_DRAW);
    context.enableVertexAttribArray(0);
    context.vertexAttribPointer(0, 2, context.FLOAT, false, 20, 0);
    context.enableVertexAttribArray(1);
    context.vertexAttribPointer(1, 3, context.FLOAT, false, 20, 8);
    context.viewport(0, 0, 1, 1);
    context.drawArrays(context.TRIANGLES, 0, 3);
    const actual = new Uint8Array(4);
    context.readPixels(0, 0, 1, 1, context.RGBA, context.UNSIGNED_BYTE, actual);
    if (source === WGSL_RENDER_SHADER) expect(Array.from(actual)).toEqual([64, 64, 128, 255]);

    const adapter = await navigator.gpu.requestAdapter();
    expect(adapter).not.toBeNull();
    const device = await adapter!.requestDevice();
    try {
      const module = device.createShaderModule({code: source});
      const information = await module.getCompilationInfo();
      expect(information.messages.filter(message => message.type === 'error')).toEqual([]);
      const pipeline = device.createRenderPipeline({
        layout: 'auto',
        vertex: {
          module,
          entryPoint: 'vertexMain',
          buffers: [
            {
              arrayStride: 20,
              attributes: [
                {shaderLocation: 0, offset: 0, format: 'float32x2'},
                {shaderLocation: 1, offset: 8, format: 'float32x3'}
              ]
            }
          ]
        },
        fragment: {module, entryPoint: 'fragmentMain', targets: [{format: 'rgba8unorm'}]}
      });
      const vertexBuffer = device.createBuffer({
        size: vertices.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
      });
      device.queue.writeBuffer(vertexBuffer, 0, vertices);
      const texture = device.createTexture({
        size: [1, 1],
        format: 'rgba8unorm',
        usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC
      });
      const readback = device.createBuffer({
        size: 256,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
      });
      const encoder = device.createCommandEncoder();
      const pass = encoder.beginRenderPass({
        colorAttachments: [
          {view: texture.createView(), clearValue: [0, 0, 0, 0], loadOp: 'clear', storeOp: 'store'}
        ]
      });
      pass.setPipeline(pipeline);
      pass.setVertexBuffer(0, vertexBuffer);
      pass.draw(3);
      pass.end();
      encoder.copyTextureToBuffer({texture}, {buffer: readback, bytesPerRow: 256}, [1, 1]);
      device.queue.submit([encoder.finish()]);
      await readback.mapAsync(GPUMapMode.READ);
      const expected = new Uint8Array(readback.getMappedRange()).slice(0, 4);
      readback.unmap();
      expect(Array.from(actual)).toEqual(Array.from(expected));
      vertexBuffer.destroy();
      texture.destroy();
      readback.destroy();
    } finally {
      device.destroy();
    }
  } finally {
    context.deleteBuffer(buffer);
    shaders.forEach(shader => context.deleteShader(shader));
    context.deleteProgram(program);
  }
});
