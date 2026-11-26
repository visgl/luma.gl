// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {Buffer, Texture} from '@luma.gl/core';
import {getWebGPUTestDevice} from '@luma.gl/core/test-utils';
import {Model} from '@luma.gl/engine';
import {GPUGraph, GPUExpressionOperation, gpuGraph} from '@luma.gl/graph';
import {GPUData, GPUVector} from '@luma.gl/graph/gpu-data';

test('two prepared graphs feed rendering in one caller-owned submission', async ({skip}) => {
  const device = await getWebGPUTestDevice();
  if (!device) return skip();
  const input = new GPUVector({
    type: 'data',
    format: 'float32',
    ownsData: true,
    data: [
      new GPUData({
        format: 'float32',
        length: 1,
        ownsBuffer: true,
        buffer: device.createBuffer({
          data: new Float32Array([0.25]),
          usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST
        })
      })
    ]
  });
  const graph = new GPUGraph();
  graph.addInput('input', gpuGraph.vector('float32'));
  graph.addInput('scale', gpuGraph.scalar('float32'));
  graph.add([
    new GPUExpressionOperation({output: 'factor', expression: 'scale * 2'}),
    new GPUExpressionOperation({output: 'result', expression: 'input * factor'})
  ]);
  const compiled = graph.compile(device);
  const submit = vi.spyOn(device, 'submit');
  const first = compiled.prepare({inputs: {input, scale: 1}});
  const second = compiled.prepare({inputs: {input: first.outputs.result, scale: 0.5}});
  const texture = device.createTexture({
    width: 1,
    height: 1,
    format: 'rgba8unorm',
    usage: Texture.RENDER | Texture.COPY_SRC
  });
  const framebuffer = device.createFramebuffer({colorAttachments: [texture]});
  const model = new Model(device, {
    source: `@group(0) @binding(0) var<storage, read> values: array<f32>;
@vertex fn vertexMain(@builtin(vertex_index) index: u32) -> @builtin(position) vec4f {
  let positions = array<vec2f, 3>(vec2f(-1, -1), vec2f(3, -1), vec2f(-1, 3));
  return vec4f(positions[index], 0, 1);
}
@fragment fn fragmentMain() -> @location(0) vec4f { return vec4f(values[0], 0, 0, 1); }`,
    vertexCount: 3,
    colorAttachmentFormats: ['rgba8unorm'],
    shaderLayout: {
      attributes: [],
      bindings: [{name: 'values', type: 'read-only-storage', group: 0, location: 0}]
    },
    bindings: {values: second.outputs.result.data[0].buffer}
  });
  const encoder = device.createCommandEncoder();
  const readback = device.createBuffer({byteLength: 256, usage: Buffer.COPY_DST | Buffer.MAP_READ});
  try {
    expect(submit).not.toHaveBeenCalled();
    first.encode(encoder);
    second.encode(encoder);
    const renderPass = encoder.beginRenderPass({framebuffer, clearColor: [0, 0, 0, 1]});
    model.draw(renderPass);
    renderPass.end();
    encoder.copyTextureToBuffer({
      sourceTexture: texture,
      destinationBuffer: readback,
      width: 1,
      height: 1,
      bytesPerRow: 256
    });
    expect(submit).not.toHaveBeenCalled();
    device.submit(encoder.finish());
    expect(submit).toHaveBeenCalledOnce();
    first.destroy();
    second.destroy();
    const pixels = await readback.readAsync(0, 4);
    expect(Array.from(pixels)).toEqual([128, 0, 0, 255]);
    expect(first.outputs.result.data[0].buffer.destroyed).toBe(false);
    expect(second.outputs.result.data[0].buffer.destroyed).toBe(false);
  } finally {
    submit.mockRestore();
    first.destroy();
    second.destroy();
    first.outputs.result.destroy();
    second.outputs.result.destroy();
    encoder.destroy();
    readback.destroy();
    model.destroy();
    framebuffer.destroy();
    texture.destroy();
    compiled.destroy();
    input.destroy();
  }
});
