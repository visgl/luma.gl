// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {Texture, TextureView} from '@luma.gl/core';
import {NullDevice} from '@luma.gl/core/test-utils';
import {GPUGraph, GPUCopyOperation, GPUExpressionOperation, gpuGraph} from '@luma.gl/graph';
import {GPUSimpleGraph} from '@luma.gl/graph/gpu-simple-graph';

function makeDevice() {
  const device = new NullDevice({});
  Object.defineProperty(device, 'type', {value: 'webgpu'});
  return device;
}
function makeTexture(
  device: NullDevice,
  width = 4,
  usage = Texture.COPY_SRC | Texture.COPY_DST | Texture.SAMPLE
) {
  return device.createTexture({format: 'rgba8unorm', width, height: width, usage});
}
function makeGraph(simple = false) {
  const graph = simple ? new GPUSimpleGraph() : new GPUGraph();
  graph.addInput('image', gpuGraph.texture({format: 'rgba8unorm'}));
  graph.add([
    new GPUCopyOperation({input: 'image', output: 'temporary'}),
    new GPUCopyOperation({input: 'temporary', output: 'result'})
  ]);
  return graph;
}

for (const simple of [false, true]) {
  test(`texture declarations and preparation are allocation/submission independent (${simple})`, () => {
    const device = makeDevice();
    const graph = makeGraph(simple);
    const allocate = vi.spyOn(device, 'createTexture');
    const submit = vi.spyOn(device, 'submit');
    const compiled = graph.compile<{result: Texture}>(device);
    expect(allocate).not.toHaveBeenCalled();
    const input = makeTexture(device);
    allocate.mockClear();
    const execution = compiled.prepare({inputs: {image: input}});
    expect(submit).not.toHaveBeenCalled();
    const created = allocate.mock.results.map(result => result.value as Texture);
    expect(created).toHaveLength(2);
    expect(execution.outputs.result.width).toBe(4);
    const encoder = device.createCommandEncoder();
    vi.spyOn(encoder, 'copyTextureToTexture').mockImplementation(() => {});
    execution.encode(encoder);
    expect(() => execution.encode(encoder)).toThrow();
    device.submit(encoder.finish());
    execution.destroy();
    execution.destroy();
    expect(created.find(texture => texture !== execution.outputs.result)!.destroyed).toBe(true);
    expect(execution.outputs.result.destroyed).toBe(false);
    expect(input.destroyed).toBe(false);
    execution.outputs.result.destroy();
    input.destroy();
    encoder.destroy();
    compiled.destroy();
    device.destroy();
  });

  test(`texture targets stay borrowed and invalid targets release allocations (${simple})`, () => {
    const device = makeDevice();
    const compiled = makeGraph(simple).compile<{result: Texture}>(device);
    const input = makeTexture(device);
    const target = makeTexture(device);
    const allocate = vi.spyOn(device, 'createTexture');
    const execution = compiled.prepare({inputs: {image: input}, outputTargets: {result: target}});
    expect(execution.outputs.result).toBe(target);
    execution.destroy();
    expect(target.destroyed).toBe(false);
    expect(allocate.mock.results.every(result => result.value.destroyed)).toBe(true);
    allocate.mockClear();
    expect(() =>
      compiled.prepare({inputs: {image: input}, outputTargets: {result: input}})
    ).toThrow();
    expect(allocate.mock.results.every(result => result.value.destroyed)).toBe(true);
    expect(() =>
      compiled.prepare({inputs: {image: input}, outputTargets: {image: target}})
    ).toThrow('Invalid graph output target');
    expect(() => compiled.prepare({inputs: {}})).toThrow('Missing input');
    input.destroy();
    target.destroy();
    compiled.destroy();
    device.destroy();
  });

  test(`texture binding checks device, usage, format and liveness (${simple})`, () => {
    const device = makeDevice();
    const other = makeDevice();
    const compiled = makeGraph(simple).compile(device);
    const inputs = [
      makeTexture(other),
      makeTexture(device, 4, Texture.SAMPLE),
      device.createTexture({format: 'rgba16float', width: 4, height: 4})
    ];
    for (const image of inputs) expect(() => compiled.prepare({inputs: {image}})).toThrow();
    const destroyed = makeTexture(device);
    destroyed.destroy();
    expect(() => compiled.prepare({inputs: {image: destroyed}})).toThrow();
    inputs.forEach(input => input.destroy());
    compiled.destroy();
    device.destroy();
    other.destroy();
  });
}

test('numeric expressions reject texture inputs during declaration resolution', () => {
  const device = makeDevice();
  const graph = new GPUGraph();
  graph.addInput('image', gpuGraph.texture({format: 'rgba8unorm'}));
  graph.add(new GPUExpressionOperation({output: 'result', expression: 'image * 2'}));
  expect(() => graph.compile(device)).toThrow('Numeric expressions cannot read textures');
  device.destroy();
});

test('texture descriptor snapshots and fixed constraints remain separate from allocation', () => {
  const device = makeDevice();
  const extent = {width: 4, height: 4};
  const descriptor = gpuGraph.texture({format: 'rgba8unorm', extent});
  extent.width = 8;
  expect(descriptor.extent).toEqual({width: 4, height: 4});
  const graph = new GPUGraph();
  graph.addInput('image', descriptor);
  graph.add(new GPUCopyOperation({input: 'image', output: 'result'}));
  const compiled = graph.compile(device);
  const wrong = makeTexture(device, 8);
  expect(() => compiled.prepare({inputs: {image: wrong}})).toThrow();
  wrong.destroy();
  compiled.destroy();
  device.destroy();
});

test('selected views preserve offsets and targets without transferring view ownership', () => {
  const device = makeDevice();
  const graph = makeGraph();
  const compiled = graph.compile<{result: TextureView}>(device);
  const input = device.createTexture({
    format: 'rgba8unorm',
    width: 8,
    height: 8,
    dimension: '2d-array',
    depth: 3,
    mipLevels: 3,
    usage: Texture.COPY_SRC | Texture.COPY_DST
  });
  const target = device.createTexture({
    format: 'rgba8unorm',
    width: 16,
    height: 16,
    dimension: '2d-array',
    depth: 2,
    mipLevels: 4,
    usage: Texture.COPY_SRC | Texture.COPY_DST
  });
  const selected = input.createView({
    dimension: '2d',
    baseMipLevel: 1,
    mipLevelCount: 1,
    baseArrayLayer: 2,
    arrayLayerCount: 1
  });
  const destination = target.createView({
    dimension: '2d',
    baseMipLevel: 2,
    mipLevelCount: 1,
    baseArrayLayer: 1,
    arrayLayerCount: 1
  });
  const execution = compiled.prepare({
    inputs: {image: selected},
    outputTargets: {result: destination}
  });
  const encoder = device.createCommandEncoder();
  const copy = vi.spyOn(encoder, 'copyTextureToTexture').mockImplementation(() => {});
  execution.encode(encoder);
  expect(copy.mock.calls[0][0]).toMatchObject({
    sourceTexture: input,
    mipLevel: 1,
    origin: [0, 0, 2],
    width: 4,
    height: 4
  });
  expect(copy.mock.calls[1][0]).toMatchObject({
    destinationTexture: target,
    destinationMipLevel: 2,
    destinationOrigin: [0, 0, 1]
  });
  execution.destroy();
  expect(execution.outputs.result).toBe(destination);
  expect(destination.destroyed).toBe(false);
  encoder.destroy();
  selected.destroy();
  destination.destroy();
  input.destroy();
  target.destroy();
  compiled.destroy();
  device.destroy();
});

test('texture extents require declared read dependencies', () => {
  const device = makeDevice();
  const graph = new GPUGraph();
  graph.addInput('image', gpuGraph.texture({format: 'rgba8unorm'}));
  graph.add({
    id: 'bad-extent',
    type: 'custom',
    contract: {
      values: [{value: 'result', access: 'write', textureUsage: 'render-attachment'}],
      outputs: {result: gpuGraph.texture({format: 'rgba8unorm', extent: {like: 'image'}})}
    }
  });
  expect(() => graph.compile(device)).toThrow('must be a declared texture read');
  device.destroy();
});

for (const simple of [false, true]) {
  test(`run failure releases texture outputs and preserves borrowed inputs (${simple})`, async () => {
    const device = makeDevice();
    const compiled = makeGraph(simple).compile<{result: Texture}>(device);
    const input = makeTexture(device);
    const allocate = vi.spyOn(device, 'createTexture');
    const encoder = device.createCommandEncoder();
    vi.spyOn(device, 'createCommandEncoder').mockReturnValue(encoder);
    vi.spyOn(encoder, 'copyTextureToTexture').mockImplementation(() => {
      throw new Error('injected copy failure');
    });
    await expect(compiled.run({inputs: {image: input}})).rejects.toThrow('injected copy failure');
    expect(allocate.mock.results.every(result => result.value.destroyed)).toBe(true);
    expect(input.destroyed).toBe(false);
    compiled.destroy();
    input.destroy();
    device.destroy();
  });
}

test('SimpleGraph rejects texture execution on WebGL without altering evaluator interfaces', () => {
  const device = new NullDevice({});
  Object.defineProperty(device, 'type', {value: 'webgl'});
  expect(() => makeGraph(true).compile(device)).toThrow('texture execution requires WebGPU');
  device.destroy();
});

for (const inheritExtent of [false, true]) {
  test(`cube results allocate six faces with fixed or inherited extents (${inheritExtent})`, () => {
    const device = makeDevice();
    const graph = new GPUGraph();
    graph.addInput('image', gpuGraph.texture({format: 'rgba8unorm'}));
    graph.add({
      id: 'cube-result',
      type: 'test-cube-result',
      contract: {
        values: [
          {value: 'image', access: 'read', textureUsage: 'sampled'},
          {value: 'result', access: 'write', textureUsage: 'render-attachment'}
        ],
        outputs: {
          result: gpuGraph.texture({
            format: 'rgba8unorm',
            dimension: 'cube',
            extent: inheritExtent ? {like: 'image'} : {width: 4, height: 4}
          })
        }
      }
    });
    const compiled = graph.compile<{result: Texture}>(device, {
      lowerings: [{type: 'test-cube-result', lower: () => {}}]
    });
    const image = makeTexture(device);
    const allocate = vi.spyOn(device, 'createTexture');
    const execution = compiled.prepare({inputs: {image}});
    expect(allocate).toHaveBeenCalledWith(expect.objectContaining({dimension: 'cube', depth: 6}));
    expect(execution.outputs.result.depth).toBe(6);
    execution.destroy();
    execution.outputs.result.destroy();
    image.destroy();
    compiled.destroy();
    device.destroy();
  });
}
