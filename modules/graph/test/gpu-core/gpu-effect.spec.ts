// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {Buffer, Texture} from '@luma.gl/core';
import {getWebGPUTestDevice} from '@luma.gl/core/test-utils';
import {
  GPUGraph,
  RenderKernel,
  GPUEffect,
  GPUShaderPassOperation,
  appendEffects,
  gpuGraph
} from '@luma.gl/graph';
import {compileEffects} from '../../../../examples/v10/gpu-simple-graph/src/composable-effects';
import {GPUSimpleGraph} from '@luma.gl/graph/gpu-simple-graph';

function createEffect() {
  return new GPUEffect({
    input: 'color',
    output: 'result',
    parameters: ['gain'],
    operations: ['scratch', 'result'].map(
      (output, index) =>
        new GPUShaderPassOperation({
          id: 'pass',
          inputs: {image: index ? 'scratch' : 'color'},
          samplers: {imageSampler: {}},
          parameters: index ? {} : {gain: 'gain'},
          output,
          outputDescriptor: gpuGraph.texture({
            format: 'rgba8unorm',
            extent: {like: index ? 'scratch' : 'color'}
          }),
          fragmentSource: `fn shade(textureCoordinates: vec2<f32>) -> vec4<f32> {let color = textureSample(image, imageSampler, textureCoordinates); return vec4<f32>(color.rgb ${index ? '' : '* parameters.gain'}, color.a);}`
        })
    )
  });
}

for (const simple of [false, true]) {
  test(`linked effects reuse only disjoint private textures and isolate invocations (${simple})`, async ({
    skip
  }) => {
    const device = await getWebGPUTestDevice();
    if (!device) return skip();
    const graph = simple ? new GPUSimpleGraph() : new GPUGraph();
    graph.addInput('image', gpuGraph.texture({format: 'rgba8unorm'}));
    graph.addInput('gain', gpuGraph.scalar('float32'));
    const output = appendEffects(graph, {
      input: 'image',
      output: 'result',
      effects: [
        {effect: createEffect(), parameters: {gain: 'gain'}},
        {effect: createEffect(), parameters: {gain: 'gain'}}
      ]
    });
    const compiled = graph.compile<{result: Texture}>(device, {outputs: [output]});
    const image = device.createTexture({
      width: 2,
      height: 2,
      format: 'rgba8unorm',
      data: new Uint8Array(Array(4).fill([80, 120, 160, 255]).flat()),
      usage: Texture.SAMPLE | Texture.COPY_DST
    });
    const allocate = vi.spyOn(device, 'createTexture');
    try {
      const first = compiled.prepare({inputs: {image, gain: 0.5}});
      // Four logical results need two alternating scratch textures and one retained output.
      expect(allocate).toHaveBeenCalledTimes(3);
      const second = compiled.prepare({inputs: {image, gain: 1}});
      expect(allocate).toHaveBeenCalledTimes(6);
      second.destroy();
      second.outputs.result.destroy();
      const encoder = device.createCommandEncoder();
      first.encode(encoder);
      device.submit(encoder.finish());
      first.destroy();
      const {result} = first.outputs;
      encoder.destroy();
      const staging = device.createBuffer({
        byteLength: 256,
        usage: Buffer.MAP_READ | Buffer.COPY_DST
      });
      try {
        result.readBuffer({width: 1, height: 1}, staging);
        expect(Array.from((await staging.readAsync()).subarray(0, 4))).toEqual([20, 30, 40, 255]);
        const textures = allocate.mock.results.map(entry => entry.value as Texture);
        expect(textures.filter(texture => !texture.destroyed)).toEqual([result]);
        expect(image.destroyed).toBe(false);
      } finally {
        staging.destroy();
        result.destroy();
      }
      const resized = device.createTexture({
        width: 4,
        height: 4,
        format: 'rgba8unorm',
        usage: Texture.SAMPLE
      });
      const target = device.createTexture({
        width: 4,
        height: 4,
        format: 'rgba8unorm',
        usage: Texture.RENDER | Texture.COPY_SRC
      });
      try {
        allocate.mockClear();
        const prepared = compiled.prepare({
          inputs: {image: resized, gain: 1},
          outputTargets: {result: target}
        });
        expect(allocate).toHaveBeenCalledTimes(2);
        expect(allocate.mock.results.every(entry => entry.value.width === 4)).toBe(true);
        prepared.destroy();
        expect(target.destroyed).toBe(false);
        expect(resized.destroyed).toBe(false);
        expect(allocate.mock.results.every(entry => entry.value.destroyed)).toBe(true);
      } finally {
        target.destroy();
        resized.destroy();
      }
    } finally {
      allocate.mockRestore();
      compiled.destroy();
      image.destroy();
    }
  });
}

for (const simple of [false, true]) {
  test(`bloom and color example links independent fragments and resolves scaled scratch (${simple})`, async ({
    skip
  }) => {
    const device = await getWebGPUTestDevice();
    if (!device) return skip();
    const image = device.createTexture({
      width: 4,
      height: 4,
      format: 'rgba8unorm',
      data: new Uint8Array(Array(16).fill([80, 120, 160, 255]).flat()),
      usage: Texture.SAMPLE | Texture.COPY_DST
    });
    for (const scale of [1, 0.5]) {
      const compiled = compileEffects(device, simple, scale);
      const allocate = vi.spyOn(device, 'createTexture');
      try {
        const {result} = await compiled.run({
          inputs: {color: image, strength: 0, exposure: 1, contrast: 1}
        });
        try {
          expect(allocate).toHaveBeenCalledTimes(scale === 1 ? 3 : 5);
          expect(allocate.mock.results.filter(entry => entry.value.width === 2)).toHaveLength(
            scale === 1 ? 0 : 2
          );
          const staging = device.createBuffer({
            byteLength: 256,
            usage: Buffer.MAP_READ | Buffer.COPY_DST
          });
          try {
            result.readBuffer({width: 1, height: 1}, staging);
            expect(Array.from((await staging.readAsync()).subarray(0, 4))).toEqual([
              80, 120, 160, 255
            ]);
          } finally {
            staging.destroy();
          }
        } finally {
          result.destroy();
        }
        expect(allocate.mock.results.every(entry => entry.value.destroyed)).toBe(true);
      } finally {
        allocate.mockRestore();
        compiled.destroy();
      }
    }
    image.destroy();
  });
}

for (const simple of [false, true]) {
  test(`selected intermediate outputs stay distinct and failures release shared scratch (${simple})`, async ({
    skip
  }) => {
    const device = await getWebGPUTestDevice();
    if (!device) return skip();
    const graph = simple ? new GPUSimpleGraph() : new GPUGraph();
    graph.addInput('image', gpuGraph.texture({format: 'rgba8unorm'}));
    graph.addInput('gain', gpuGraph.scalar('float32'));
    appendEffects(graph, {
      input: 'image',
      output: 'result',
      effects: [
        {effect: createEffect(), parameters: {gain: 'gain'}},
        {effect: createEffect(), parameters: {gain: 'gain'}}
      ]
    });
    // Explicitly retained intermediates must not participate in scratch allocation reuse.
    const retained = 'result/effect-0/scratch';
    const compiled = graph.compile<Record<string, Texture>>(device, {
      outputs: ['result', retained]
    });
    const image = device.createTexture({
      format: 'rgba8unorm',
      width: 1,
      height: 1,
      usage: Texture.SAMPLE
    });
    const allocate = vi.spyOn(device, 'createTexture');
    try {
      const prepared = compiled.prepare({inputs: {image, gain: 1}});
      expect(allocate).toHaveBeenCalledTimes(4);
      prepared.destroy();
      expect(prepared.outputs[retained]).not.toBe(prepared.outputs.result);
      expect(allocate.mock.results.filter(entry => !entry.value.destroyed)).toHaveLength(2);
      for (const texture of Object.values(prepared.outputs)) texture.destroy();
      allocate.mockClear();
      const failing = compileEffects(device, simple);
      const draw = vi.spyOn(RenderKernel.prototype, 'draw').mockImplementation(() => {
        throw new Error('injected draw failure');
      });
      try {
        await expect(
          failing.run({inputs: {color: image, strength: 0, exposure: 1, contrast: 1}})
        ).rejects.toThrow('injected draw failure');
        expect(allocate).toHaveBeenCalledTimes(3);
        expect(allocate.mock.results.every(entry => entry.value.destroyed)).toBe(true);
        expect(image.destroyed).toBe(false);
      } finally {
        draw.mockRestore();
        failing.destroy();
      }
    } finally {
      allocate.mockRestore();
      compiled.destroy();
      image.destroy();
    }
  });
}

for (const simple of [false, true]) {
  test(`bloom branches blur and downsample a bright quadrant (${simple})`, async ({skip}) => {
    const device = await getWebGPUTestDevice();
    if (!device) return skip();
    const pixels = new Uint8Array(4 * 4 * 4);
    for (let row = 0; row < 4; row++) {
      for (let column = 0; column < 4; column++) {
        const value = row >= 2 && column >= 2 ? 255 : 0;
        pixels.set([value, value, value, 255], (row * 4 + column) * 4);
      }
    }
    const image = device.createTexture({
      width: 4,
      height: 4,
      format: 'rgba8unorm',
      data: pixels,
      usage: Texture.SAMPLE | Texture.COPY_DST
    });
    // Hand-computed four-neighbor blur, including clamp-to-edge and bilinear upsampling.
    const expected = [
      [0, 0, 0, 0, 0, 0, 32, 32, 0, 32, 255, 255, 0, 32, 255, 255],
      [0, 8, 24, 32, 8, 16, 32, 40, 24, 32, 255, 255, 32, 40, 255, 255]
    ];
    try {
      for (const [index, scale] of [1, 0.5].entries()) {
        const compiled = compileEffects(device, simple, scale);
        try {
          const {result} = await compiled.run({
            inputs: {color: image, strength: 1, exposure: 1, contrast: 1}
          });
          const layout = result.computeMemoryLayout({width: 4, height: 4, depthOrArrayLayers: 1});
          const staging = device.createBuffer({
            byteLength: layout.byteLength,
            usage: Buffer.MAP_READ | Buffer.COPY_DST
          });
          try {
            result.readBuffer({width: 4, height: 4}, staging);
            const actual = await staging.readAsync();
            for (let row = 0; row < 4; row++) {
              for (let column = 0; column < 4; column++) {
                const offset = row * layout.bytesPerRow + column * 4;
                for (let channel = 0; channel < 3; channel++)
                  expect(
                    Math.abs(actual[offset + channel] - expected[index][row * 4 + column])
                  ).toBeLessThanOrEqual(1);
                expect(actual[offset + 3]).toBe(255);
              }
            }
          } finally {
            staging.destroy();
            result.destroy();
          }
        } finally {
          compiled.destroy();
        }
      }
    } finally {
      image.destroy();
    }
  });
}
