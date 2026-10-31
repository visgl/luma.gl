// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, Texture} from '@luma.gl/core';
import {GPUGraph, GPUGraphCompiler} from '@luma.gl/graph/gpu-core';
import {GPUShaderPipeline, registerShaderPipelineOperations} from '@luma.gl/engine/shader-pipeline';
import {createBloomCompositeShaderPass} from '@luma.gl/engine/effects';
import {ShaderPassRenderer} from '@luma.gl/engine';
import {getWebGPUTestDevice} from '@luma.gl/core/test-utils';
import type {ShaderPass} from '@luma.gl/shaders';
import {expect, test, vi} from 'vitest';

const increment: ShaderPass = {
  name: 'graphIncrement',
  source: `struct Parameters { amount: f32 }; @group(0) @binding(auto) var<uniform> graphIncrement: Parameters;
    fn graphIncrement_filterColor_ext(color: vec4f, size: vec2f, uv: vec2f) -> vec4f {
      return vec4f(color.rgb + vec3f(graphIncrement.amount, 0.0, 0.0), color.a);
    }`,
  uniformTypes: {amount: 'f32'},
  uniforms: {},
  propTypes: {amount: {value: 0.25, min: 0, max: 1}},
  passes: [{filter: true}]
};

test('shader pipelines compose through one graph with ordered per-encoding uniforms', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return;
  const inputTexture = device.createTexture({
    format: 'rgba8unorm',
    width: 2,
    height: 2,
    data: new Uint8Array([0, 32, 0, 255, 0, 64, 0, 255, 0, 96, 0, 255, 0, 128, 0, 255]),
    usage: Texture.SAMPLE | Texture.COPY_DST
  });
  const outputTexture = device.createTexture({
    format: 'rgba8unorm',
    dimension: '2d-array',
    depth: 2,
    mipLevels: 2,
    width: 4,
    height: 4,
    usage: Texture.RENDER | Texture.COPY_SRC
  });
  const program = new GPUGraph();
  const input = program.texture('input', {
    format: 'rgba8unorm',
    width: 2,
    height: 2,
    usage: Texture.SAMPLE,
    external: true
  });
  const intermediate = program.texture('intermediate', {
    format: 'rgba8unorm',
    width: 2,
    height: 2,
    usage: Texture.SAMPLE | Texture.RENDER
  });
  const output = program.texture('output', {
    format: 'rgba8unorm',
    dimension: '2d-array',
    depth: 2,
    mipLevels: 2,
    width: 4,
    height: 4,
    usage: Texture.RENDER | Texture.COPY_SRC,
    external: true
  });
  const getUniforms = vi.fn((parameters: {amount: number}) => ({
    graphIncrement: parameters.amount ? {amount: parameters.amount} : {}
  }));
  program.add([
    new GPUShaderPipeline<{amount: number}>({
      id: 'first',
      input,
      output: intermediate,
      shaderPasses: [increment],
      getUniforms
    }),
    new GPUShaderPipeline<{amount: number}>({
      id: 'second',
      input: intermediate,
      output: program.textureView(output, {
        dimension: '2d',
        baseMipLevel: 1,
        mipLevelCount: 1,
        baseArrayLayer: 1,
        arrayLayerCount: 1
      }),
      shaderPasses: [increment],
      uniforms: {graphIncrement: {amount: 0.1}}
    })
  ]);
  const compiler = new GPUGraphCompiler<{amount: number}>(device);
  registerShaderPipelineOperations(compiler);
  const result = compiler.compile(program, {
    textures: {input: inputTexture, output: outputTexture}
  });
  const compiled = result.graph.compile();
  const layout = outputTexture.computeMemoryLayout({width: 2, height: 2, depthOrArrayLayers: 1});
  const firstReadback = device.createBuffer({
    byteLength: layout.byteLength,
    usage: Buffer.COPY_DST | Buffer.MAP_READ
  });
  const secondReadback = device.createBuffer({
    byteLength: layout.byteLength,
    usage: Buffer.COPY_DST | Buffer.MAP_READ
  });
  const submit = vi.spyOn(device, 'submit');
  const commandEncoder = device.createCommandEncoder();
  try {
    expect(result.lowering.nodes.filter(node => node.nodeType === 'render')).toHaveLength(6);
    compiled.encode(commandEncoder, {parameters: {amount: 0.2}});
    commandEncoder.copyTextureToBuffer({
      sourceTexture: outputTexture,
      mipLevel: 1,
      origin: [0, 0, 1],
      destinationBuffer: firstReadback,
      bytesPerRow: layout.bytesPerRow,
      width: 2,
      height: 2
    });
    compiled.encode(commandEncoder, {parameters: {amount: 0}});
    commandEncoder.copyTextureToBuffer({
      sourceTexture: outputTexture,
      mipLevel: 1,
      origin: [0, 0, 1],
      destinationBuffer: secondReadback,
      bytesPerRow: layout.bytesPerRow,
      width: 2,
      height: 2
    });
    expect(getUniforms).toHaveBeenCalledTimes(2);
    expect(submit).not.toHaveBeenCalled();
    device.submit(commandEncoder.finish());
    expect(submit).toHaveBeenCalledTimes(1);
    const first = await firstReadback.readAsync();
    const second = await secondReadback.readAsync();
    expect(first[0]).toBeGreaterThanOrEqual(75);
    expect(first[0]).toBeLessThanOrEqual(78);
    expect(second[0]).toBeGreaterThanOrEqual(88);
    expect(second[0]).toBeLessThanOrEqual(91);
    expect([
      first[1],
      first[5],
      first[layout.bytesPerRow + 1],
      first[layout.bytesPerRow + 5]
    ]).toEqual([32, 64, 96, 128]);
  } finally {
    submit.mockRestore();
    commandEncoder.destroy();
    compiled.destroy();
    expect(inputTexture.destroyed).toBe(false);
    expect(outputTexture.destroyed).toBe(false);
    inputTexture.destroy();
    outputTexture.destroy();
    firstReadback.destroy();
    secondReadback.destroy();
  }
});

test('composite compute replacements and fragment fallbacks produce the same output', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return;
  const sourceTexture = device.createTexture({
    format: 'rgba8unorm',
    width: 1,
    height: 2,
    data: new Uint8Array([0, 64, 0, 255, 0, 128, 0, 255]),
    usage: Texture.SAMPLE | Texture.COPY_DST
  });
  const copy: ShaderPass = {
    name: 'graphCopy',
    source:
      'fn graphCopy_filterColor_ext(color: vec4f, size: vec2f, uv: vec2f) -> vec4f { return color; }',
    passes: [{filter: true}]
  };
  const optimization = {
    name: 'computeIncrement',
    source: `struct Parameters { amount: vec4f }; @group(0) @binding(0) var<uniform> parameters: Parameters;
      @group(0) @binding(1) var sourceTexture: texture_2d<f32>;
      @group(0) @binding(2) var smallResultTexture: texture_storage_2d<rgba8unorm, write>;
      @group(0) @binding(3) var resultTexture: texture_storage_2d<rgba8unorm, write>;
      @compute @workgroup_size(1, 1) fn main(@builtin(global_invocation_id) index: vec3u) {
        let color = textureLoad(sourceTexture, vec2i(index.xy), 0);
        if (index.y < textureDimensions(smallResultTexture).y) {textureStore(smallResultTexture, vec2i(index.xy), color);}
        textureStore(resultTexture, vec2i(index.xy), color + vec4f(parameters.amount.x, 0.0, 0.0, 0.0));
      }`,
    uniformModule: 'graphIncrement',
    uniformBinding: 'parameters',
    uniformNames: ['amount'],
    input: 'previous',
    outputs: {smallResultTexture: 'small', resultTexture: 'scratch'},
    replacedPasses: ['graphIncrement'],
    workgroupSize: [1, 1] as const
  };
  const pixels: number[][] = [];
  try {
    for (const {useCompute, flipY} of [
      {useCompute: false, flipY: true},
      {useCompute: true, flipY: true},
      {useCompute: false, flipY: false},
      {useCompute: true, flipY: false}
    ]) {
      const outputTexture = device.createTexture({
        format: 'rgba8unorm',
        width: 1,
        height: 2,
        usage: Texture.RENDER | Texture.COPY_SRC
      });
      const program = new GPUGraph();
      const input = program.texture('input', {
        format: 'rgba8unorm',
        width: 1,
        height: 2,
        usage: Texture.SAMPLE,
        external: true
      });
      const output = program.texture('output', {
        format: 'rgba8unorm',
        width: 1,
        height: 2,
        usage: Texture.RENDER | Texture.COPY_SRC,
        external: true
      });
      program.add(
        new GPUShaderPipeline({
          id: 'composite',
          flipY,
          input,
          output,
          shaderPasses: [
            {
              name: 'compositeIncrement',
              renderTargets: {
                small: {format: 'rgba8unorm', storage: true, scale: [1, 0.5]},
                scratch: {format: 'rgba8unorm', storage: true}
              },
              steps: [
                {shaderPass: increment, output: 'scratch'},
                {shaderPass: copy, inputs: {sourceTexture: 'scratch'}}
              ],
              ...(useCompute ? {compute: optimization} : {})
            }
          ]
        })
      );
      const compiler = new GPUGraphCompiler(device);
      registerShaderPipelineOperations(compiler);
      const result = compiler.compile(program, {
        textures: {input: sourceTexture, output: outputTexture}
      });
      expect(result.lowering.nodes.filter(node => node.nodeType === 'compute')).toHaveLength(
        useCompute && flipY ? 1 : 0
      );
      const compiled = result.graph.compile();
      const encoder = device.createCommandEncoder();
      try {
        compiled.encode(encoder, {parameters: undefined});
        device.submit(encoder.finish());
        const buffer = device.createBuffer({
          byteLength: outputTexture.computeMemoryLayout().byteLength,
          usage: Buffer.COPY_DST | Buffer.MAP_READ
        });
        outputTexture.readBuffer({}, buffer);
        try {
          const bytes = await buffer.readAsync();
          const secondRow = outputTexture.computeMemoryLayout().bytesPerRow;
          pixels.push([...bytes.slice(0, 4), ...bytes.slice(secondRow, secondRow + 4)]);
        } finally {
          buffer.destroy();
        }
      } finally {
        encoder.destroy();
        compiled.destroy();
        outputTexture.destroy();
      }
    }
    expect(pixels[0]).toEqual([64, 64, 0, 255, 64, 128, 0, 255]);
    expect(pixels[1]).toEqual(pixels[0]);
    expect(pixels[3]).toEqual(pixels[2]);
  } finally {
    sourceTexture.destroy();
  }
});

test('existing bloom definitions preserve renderer orientation, scaled targets, and aliases', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return;
  const reportError = vi.spyOn(device, 'reportError');
  const width = 9;
  const height = 7;
  const canvas = device.getCanvasContext();
  const previousSize = canvas.getDrawingBufferSize();
  canvas.setDrawingBufferSize(width, height);
  const data = new Uint8Array(width * height * 4);
  for (let index = 0; index < width * height; index++) {
    data[index * 4] = index % 7 === 0 ? 255 : 0;
    data[index * 4 + 1] = Math.floor(index / width) * 25;
    data[index * 4 + 3] = 255;
  }
  const source = device.createTexture({
    format: 'rgba8unorm',
    width,
    height,
    data,
    usage: Texture.SAMPLE | Texture.COPY_DST
  });
  const destination = device.createTexture({
    format: 'rgba8unorm',
    width,
    height,
    usage: Texture.RENDER | Texture.COPY_SRC
  });
  const shaderPass = createBloomCompositeShaderPass({
    colorFormat: 'rgba8unorm',
    quality: 'low',
    radius: 1,
    downsample: 'auto',
    reuseRenderTargets: true
  });
  const renderer = new ShaderPassRenderer(device, {
    shaderPasses: [shaderPass],
    colorFormat: 'rgba8unorm'
  });
  renderer.resize([width, height]);
  const program = new GPUGraph();
  const input = program.texture('input', {
    format: 'rgba8unorm',
    width,
    height,
    usage: Texture.SAMPLE,
    external: true
  });
  const output = program.texture('output', {
    format: 'rgba8unorm',
    width,
    height,
    usage: Texture.RENDER | Texture.COPY_SRC,
    external: true
  });
  program.add(new GPUShaderPipeline({id: 'bloom', input, output, shaderPasses: [shaderPass]}));
  const compiler = new GPUGraphCompiler(device);
  registerShaderPipelineOperations(compiler);
  const compiled = compiler
    .compile(program, {textures: {input: source, output: destination}})
    .graph.compile();
  const encoder = device.createCommandEncoder();
  const layout = destination.computeMemoryLayout();
  const expected = device.createBuffer({
    byteLength: layout.byteLength,
    usage: Buffer.COPY_DST | Buffer.MAP_READ
  });
  const actual = device.createBuffer({
    byteLength: layout.byteLength,
    usage: Buffer.COPY_DST | Buffer.MAP_READ
  });
  try {
    const legacyOutput = renderer.encodeToTexture(encoder, {sourceTexture: source})!;
    encoder.copyTextureToBuffer({
      sourceTexture: legacyOutput,
      destinationBuffer: expected,
      bytesPerRow: layout.bytesPerRow,
      width,
      height
    });
    compiled.encode(encoder, {parameters: undefined});
    encoder.copyTextureToBuffer({
      sourceTexture: destination,
      destinationBuffer: actual,
      bytesPerRow: layout.bytesPerRow,
      width,
      height
    });
    device.submit(encoder.finish());
    const expectedBytes = await expected.readAsync();
    const actualBytes = await actual.readAsync();
    expect(reportError).not.toHaveBeenCalled();
    expect(expectedBytes.some(value => value > 0)).toBe(true);
    for (let row = 0; row < height; row++) {
      for (let columnByte = 0; columnByte < width * 4; columnByte++) {
        const offset = row * layout.bytesPerRow + columnByte;
        expect(
          Math.abs(actualBytes[offset] - expectedBytes[offset]),
          `row ${row}, byte ${columnByte}: actual ${actualBytes[offset]}, expected ${expectedBytes[offset]}`
        ).toBeLessThanOrEqual(1);
      }
    }
  } finally {
    reportError.mockRestore();
    canvas.setDrawingBufferSize(...previousSize);
    encoder.destroy();
    compiled.destroy();
    renderer.destroy();
    source.destroy();
    destination.destroy();
    expected.destroy();
    actual.destroy();
  }
});
