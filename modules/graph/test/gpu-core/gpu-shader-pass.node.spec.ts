// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {NullDevice} from '@luma.gl/core/test-utils';
import {GPUGraph, GPUCPUOperation, GPUShaderPassOperation, gpuGraph} from '@luma.gl/graph';
import {GPUSimpleGraph} from '@luma.gl/graph/gpu-simple-graph';

const fragmentSource =
  'fn shade(textureCoordinates: vec2<f32>) -> vec4<f32> {return vec4<f32>(1.0);}';
const outputDescriptor = gpuGraph.texture({format: 'rgba8unorm', extent: {width: 2, height: 2}});

test('shader-pass operation snapshots descriptions without allocating resources', () => {
  const inputs = {imageTexture: 'image'};
  const parameters = {gain: 'gain'};
  const sampler = {minFilter: 'nearest' as const};
  const extent = {like: 'image', scale: [0.5, 0.5] as [number, number]};
  const operation = new GPUShaderPassOperation({
    inputs,
    parameters,
    samplers: {imageSampler: sampler},
    fragmentSource,
    output: 'result',
    outputDescriptor: {...outputDescriptor, extent}
  });
  inputs.imageTexture = 'other';
  parameters.gain = 'other';
  extent.scale[0] = 1;
  expect(operation.inputs).toEqual({imageTexture: 'image'});
  expect(operation.parameters).toEqual({gain: 'gain'});
  expect(operation.outputDescriptor.extent).toEqual({like: 'image', scale: [0.5, 0.5]});
  expect(Object.isFrozen(operation.samplers.imageSampler)).toBe(true);
  expect(operation.contract.values).toContainEqual({
    value: 'image',
    access: 'read',
    textureUsage: 'sampled'
  });
});

test('shader-pass contracts reject unsupported output topology and ambiguous binding names', () => {
  const props = {fragmentSource, inputs: {}, output: 'result', outputDescriptor};
  for (const descriptor of [
    {...outputDescriptor, samples: 4},
    {...outputDescriptor, mipLevels: 2},
    {...outputDescriptor, dimension: 'cube' as const},
    {...outputDescriptor, extent: undefined}
  ])
    expect(() => new GPUShaderPassOperation({...props, outputDescriptor: descriptor})).toThrow();
  expect(
    () => new GPUShaderPassOperation({...props, inputs: {image: 'input'}, samplers: {image: {}}})
  ).toThrow();
  expect(() => new GPUShaderPassOperation({...props, inputs: {parameters: 'input'}})).toThrow();
  expect(
    () =>
      new GPUShaderPassOperation({...props, samplers: {comparison: {type: 'comparison-sampler'}}})
  ).toThrow();
});

for (const simple of [false, true]) {
  test(`shader-pass declaration errors are detected before backend compilation (${simple})`, () => {
    const device = new NullDevice({});
    Object.defineProperty(device, 'type', {value: 'webgpu'});
    try {
      const graph = simple ? new GPUSimpleGraph() : new GPUGraph();
      graph.addInput('image', gpuGraph.vector('float32'));
      graph.add(
        new GPUShaderPassOperation({
          fragmentSource,
          inputs: {imageTexture: 'image'},
          output: 'result',
          outputDescriptor
        })
      );
      expect(() => graph.compile(device)).toThrow();
      const parameters = simple ? new GPUSimpleGraph() : new GPUGraph();
      parameters.addInput('gain', gpuGraph.vector('float32'));
      parameters.add(
        new GPUShaderPassOperation({
          fragmentSource,
          inputs: {},
          parameters: {gain: 'gain'},
          output: 'result',
          outputDescriptor
        })
      );
      expect(() => parameters.compile(device)).toThrow();
    } finally {
      device.destroy();
    }
  });
}

test('SimpleGraph shader passes reject WebGL without changing evaluator execution', () => {
  const device = new NullDevice({});
  Object.defineProperty(device, 'type', {value: 'webgl'});
  const graph = new GPUSimpleGraph();
  graph.add(
    new GPUShaderPassOperation({fragmentSource, inputs: {}, output: 'result', outputDescriptor})
  );
  expect(() => graph.compile(device)).toThrow('texture execution requires WebGPU');
  device.destroy();
});

for (const simple of [false, true]) {
  test(`CPU callback/texture mixtures retain their numeric-only boundary (${simple})`, () => {
    const device = new NullDevice({});
    Object.defineProperty(device, 'type', {value: 'webgpu'});
    const allocate = vi.spyOn(device, 'createBuffer');
    const render = vi.spyOn(device, 'createRenderPipeline');
    try {
      const graph = simple ? new GPUSimpleGraph() : new GPUGraph();
      graph.add(
        new GPUCPUOperation({
          id: 'cpu',
          inputs: {},
          outputs: {values: gpuGraph.vector('float32')},
          execute: () => ({values: new Float32Array([1])})
        })
      );
      graph.add(
        new GPUShaderPassOperation({fragmentSource, inputs: {}, output: 'result', outputDescriptor})
      );
      expect(() => graph.compile(device)).toThrow();
      expect(allocate).not.toHaveBeenCalled();
      expect(render).not.toHaveBeenCalled();
    } finally {
      allocate.mockRestore();
      render.mockRestore();
      device.destroy();
    }
  });
}
