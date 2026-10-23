// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it, vi} from 'vitest';
import {Buffer, Texture, type Device} from '@luma.gl/core';
import {Model} from '@luma.gl/engine';
import {GPUEvaluationScope} from '@luma.gl/gpgpu';
import {getWebGLTestDevice, getWebGPUTestDevice} from '@luma.gl/test-utils';
import {
  GPUGraph,
  GPURenderOperation,
  GPUProgram,
  GPUProgramCompiler
} from '@luma.gl/graph/gpu-core';
import {GPUSimpleGraph} from '@luma.gl/graph/gpu-simple-graph';

function makeOperation(output: Texture, destroy: () => void): GPURenderOperation {
  return new GPURenderOperation({
    id: 'two-passes',
    createNodes: graph => {
      const temporary = graph.createTransientTexture({
        id: 'temporary',
        format: 'rgba8unorm',
        width: 4,
        height: 4,
        usage: Texture.RENDER | Texture.SAMPLE
      });
      const target = graph.importTexture(
        {
          id: 'output',
          format: 'rgba8unorm',
          width: 4,
          height: 4,
          usage: Texture.RENDER | Texture.COPY_SRC
        },
        output
      );
      const temporaryView = graph.createTextureView(temporary);
      return [
        {
          type: 'render',
          id: 'clear',
          attachments: {colorAttachments: [temporaryView]},
          compile: () => ({
            getRenderPassProps: () => ({clearColor: [1, 0, 0, 1]}),
            encode: () => {}
          })
        },
        {
          type: 'render',
          id: 'sample',
          resources: [{texture: temporaryView, usage: 'sampled'}],
          attachments: {colorAttachments: [graph.createTextureView(target)]},
          compile: ({device}) => {
            const model = new Model(device, {
              source: `@group(0) @binding(0) var image: texture_2d<f32>;
@vertex fn vertexMain(@builtin(vertex_index) index: u32) -> @builtin(position) vec4<f32> {
  let positions = array<vec2<f32>, 3>(vec2(-1.0, -1.0), vec2(3.0, -1.0), vec2(-1.0, 3.0));
  return vec4(positions[index], 0.0, 1.0);
}
@fragment fn fragmentMain(@builtin(position) position: vec4<f32>) -> @location(0) vec4<f32> {
  return textureLoad(image, vec2<i32>(position.xy), 0);
}`,
              vs: `#version 300 es
void main() {
  vec2 positions[3] = vec2[3](vec2(-1., -1.), vec2(3., -1.), vec2(-1., 3.));
  gl_Position = vec4(positions[gl_VertexID], 0., 1.);
}`,
              fs: `#version 300 es
precision highp float;
uniform sampler2D image;
out vec4 color;
void main() { color = texelFetch(image, ivec2(gl_FragCoord.xy), 0); }`,
              vertexCount: 3,
              colorAttachmentFormats: ['rgba8unorm'],
              shaderLayout: {
                attributes: [],
                bindings: [
                  {name: 'image', type: 'texture', group: 0, location: 0, sampleType: 'float'}
                ]
              }
            });
            return {
              encode: ({renderPass, getTextureView}) => {
                model.setBindings({image: getTextureView(temporaryView)});
                model.draw(renderPass);
              },
              destroy: () => {
                model.destroy();
                destroy();
              }
            };
          }
        }
      ];
    }
  });
}

function makeTarget(device: Device): Texture {
  return device.createTexture({
    format: 'rgba8unorm',
    width: 4,
    height: 4,
    usage: Texture.RENDER | Texture.COPY_SRC
  });
}

async function readFirstPixel(texture: Texture): Promise<number[]> {
  const layout = texture.computeMemoryLayout({width: 4, height: 4});
  const buffer = texture.device.createBuffer({
    byteLength: layout.byteLength,
    usage: Buffer.COPY_DST | Buffer.MAP_READ
  });
  try {
    texture.readBuffer({width: 4, height: 4}, buffer);
    return Array.from(new Uint8Array(await buffer.readAsync()).slice(0, 4));
  } finally {
    buffer.destroy();
  }
}

for (const [backend, getDevice] of [
  ['webgl', getWebGLTestDevice],
  ['webgpu', getWebGPUTestDevice]
] as const) {
  it(`shares render textures and executes ordered passes on ${backend}`, async ({skip}) => {
    const device = await getDevice();
    if (!device) return skip();
    const output = makeTarget(device);
    const destroy = vi.fn();
    const graph = new GPUSimpleGraph(device);
    graph.add(makeOperation(output, destroy));
    const compiled = graph.compile();
    try {
      expect(compiled.renderGraph?.preflight.nodes.map(node => node.id)).toEqual([
        'clear',
        'sample'
      ]);
      expect(compiled.renderGraph?.stats.logicalTextureCount).toBe(2);
      if (backend === 'webgl') {
        expect(() => new GPUGraph(device)).toThrow(/WebGPU/);
        compiled.runSync();
      } else {
        const scope = new GPUEvaluationScope(device);
        const submit = vi.spyOn(device, 'submit');
        await compiled.run({scope});
        expect(submit).not.toHaveBeenCalled();
        expect(() => compiled.destroy()).toThrow();
        scope.submit();
        expect(submit).toHaveBeenCalledTimes(1);
        submit.mockRestore();
      }
      expect(await readFirstPixel(output)).toEqual([255, 0, 0, 255]);
      await compiled.run();
      expect(await readFirstPixel(output)).toEqual([255, 0, 0, 255]);
    } finally {
      compiled.destroy();
      compiled.destroy();
      expect(destroy).toHaveBeenCalledTimes(1);
      expect(output.destroyed).toBe(false);
      output.destroy();
    }
  });
}

it('lowers the same render primitive into separate full graph nodes through GPUProgram', async ({
  skip
}) => {
  const device = await getWebGPUTestDevice();
  if (!device) return skip();
  const output = makeTarget(device);
  const destroy = vi.fn();
  const operation = makeOperation(output, destroy);
  const program = new GPUProgram();
  program.add(operation);
  const compilation = new GPUProgramCompiler(device).compile(program);
  const compiled = compilation.graph.compile();
  try {
    expect(compilation.lowering.nodes.map(node => node.nodeId)).toEqual(['clear', 'sample']);
    const encoder = device.createCommandEncoder();
    compiled.encode(encoder, {parameters: undefined});
    device.submit(encoder.finish());
    expect(await readFirstPixel(output)).toEqual([255, 0, 0, 255]);
  } finally {
    compiled.destroy();
    output.destroy();
  }
});
