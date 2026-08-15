// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  Buffer,
  Texture,
  type CommandEncoder,
  type ComputePass,
  type TextureView
} from '@luma.gl/core';
import {GPUCommandGraph} from '@luma.gl/experimental';
import {NullDevice} from '@luma.gl/test-utils';
import {describe, expect, expectTypeOf, test, vi} from 'vitest';

describe('GPUCommandGraph named resources', () => {
  test('infers names and resolves declared buffers for compute nodes', () => {
    const device = createGraphDevice('named-compute');
    const sourceBuffer = device.createBuffer({
      id: 'source-buffer',
      byteLength: 16,
      usage: Buffer.STORAGE
    });
    const targetBuffer = device.createBuffer({
      id: 'target-buffer',
      byteLength: 16,
      usage: Buffer.STORAGE
    });
    const graph = new GPUCommandGraph<{step: number}>(device, {id: 'named-compute'});
    const source = graph.importBuffer(
      {id: 'source', byteLength: 16, usage: Buffer.STORAGE},
      sourceBuffer
    );
    const target = graph.importBuffer(
      {id: 'target', byteLength: 16, usage: Buffer.STORAGE},
      targetBuffer
    );
    const encode = vi.fn();

    graph.addComputePass({
      id: 'update',
      resources: {
        source: {buffer: source, usage: 'storage-read'},
        target: {buffer: target, usage: 'storage-write'}
      },
      compile: () => ({
        encode: context => {
          expectTypeOf(context.resources.source.buffer).toEqualTypeOf<Buffer>();
          expectTypeOf(context.resources.target.buffer).toEqualTypeOf<Buffer>();
          expectTypeOf(context.parameters).toEqualTypeOf<{step: number}>();
          // @ts-expect-error Named callbacks cannot resolve undeclared resources.
          context.getBuffer;

          expect(context.resources.source.buffer).toBe(sourceBuffer);
          expect(context.resources.source.logical).toBe(source);
          expect(context.resources.target.buffer).toBe(targetBuffer);
          expect(context.resources.target.logical).toBe(target);
          expect(context.parameters.step).toBe(3);
          expect('getBuffer' in context).toBe(false);
          encode();
        }
      })
    });

    const compiled = graph.compile();
    const commandEncoder = device.createCommandEncoder({id: 'named-compute-encoder'});
    mockComputePass(commandEncoder);
    try {
      compiled.encode(commandEncoder, {parameters: {step: 3}});
      expect(encode).toHaveBeenCalledTimes(1);
    } finally {
      commandEncoder.destroy();
      compiled.destroy();
      sourceBuffer.destroy();
      targetBuffer.destroy();
      device.destroy();
    }
  });

  test('exposes only a physical view for view-scoped texture declarations', () => {
    const device = createGraphDevice('named-texture-view');
    const texture = device.createTexture({
      id: 'texture',
      format: 'rgba8unorm',
      width: 4,
      height: 4,
      usage: Texture.SAMPLE
    });
    const graph = new GPUCommandGraph(device, {id: 'named-texture-view'});
    const textureHandle = graph.importTexture(
      {
        id: 'texture',
        format: 'rgba8unorm',
        width: 4,
        height: 4,
        usage: Texture.SAMPLE
      },
      texture
    );
    const textureView = graph.createTextureView(textureHandle);
    const encode = vi.fn();

    graph.addComputePass({
      id: 'sample',
      resources: {
        sampled: {texture: textureView, usage: 'sampled'},
        wholeTexture: {texture: textureHandle, usage: 'sampled'}
      },
      compile: () => ({
        encode: ({resources}) => {
          expectTypeOf(resources.sampled.textureView).toEqualTypeOf<TextureView>();
          expectTypeOf(resources.wholeTexture.texture).toEqualTypeOf<Texture>();
          // @ts-expect-error A view-scoped declaration must not expose the whole physical texture.
          resources.sampled.texture;

          expect(resources.sampled.logical).toBe(textureView);
          expect(resources.sampled.textureView.texture).toBe(texture);
          expect(resources.wholeTexture.logical).toBe(textureHandle);
          expect(resources.wholeTexture.texture).toBe(texture);
          expect(resources.wholeTexture.textureView.texture).toBe(texture);
          encode();
        }
      })
    });

    const compiled = graph.compile();
    const commandEncoder = device.createCommandEncoder({id: 'named-texture-view-encoder'});
    mockComputePass(commandEncoder);
    try {
      compiled.encode(commandEncoder, {parameters: undefined});
      expect(encode).toHaveBeenCalledTimes(1);
    } finally {
      commandEncoder.destroy();
      compiled.destroy();
      texture.destroy();
      device.destroy();
    }
  });

  test('preserves named resources in render prepass props and render encoding', () => {
    const device = createGraphDevice('named-render');
    const buffer = device.createBuffer({
      id: 'uniform-buffer',
      byteLength: 16,
      usage: Buffer.UNIFORM
    });
    const graph = new GPUCommandGraph(device, {id: 'named-render'});
    const uniform = graph.importBuffer(
      {id: 'uniform', byteLength: 16, usage: Buffer.UNIFORM},
      buffer
    );
    const getRenderPassProps = vi.fn(() => ({id: 'named-render-pass'}));
    const encode = vi.fn();

    graph.addRenderPass({
      id: 'render',
      resources: {
        uniform: {buffer: uniform, usage: 'uniform'}
      },
      compile: () => ({
        getRenderPassProps: context => {
          expect(context.resources.uniform.buffer).toBe(buffer);
          expect('getBuffer' in context).toBe(false);
          return getRenderPassProps();
        },
        encode: context => {
          expect(context.resources.uniform.buffer).toBe(buffer);
          expect('getBuffer' in context).toBe(false);
          encode();
        }
      })
    });

    const compiled = graph.compile();
    const commandEncoder = device.createCommandEncoder({id: 'named-render-encoder'});
    try {
      compiled.encode(commandEncoder, {parameters: undefined});
      expect(getRenderPassProps).toHaveBeenCalledTimes(1);
      expect(encode).toHaveBeenCalledTimes(1);
    } finally {
      commandEncoder.destroy();
      compiled.destroy();
      buffer.destroy();
      device.destroy();
    }
  });

  test('resolves named resources and preserves cleanup for copy nodes', () => {
    const device = createGraphDevice('named-copy');
    const buffer = device.createBuffer({
      id: 'copy-buffer',
      byteLength: 16,
      usage: Buffer.COPY_SRC
    });
    const graph = new GPUCommandGraph(device, {id: 'named-copy'});
    const source = graph.importBuffer(
      {id: 'source', byteLength: 16, usage: Buffer.COPY_SRC},
      buffer
    );
    const encode = vi.fn();
    const destroy = vi.fn();

    graph.addCopyPass({
      id: 'copy',
      resources: {
        source: {buffer: source, usage: 'copy-source'}
      },
      compile: () => ({
        encode: context => {
          expect(context.resources.source.buffer).toBe(buffer);
          expect('getBuffer' in context).toBe(false);
          encode();
        },
        destroy
      })
    });

    const compiled = graph.compile();
    const commandEncoder = device.createCommandEncoder({id: 'named-copy-encoder'});
    try {
      compiled.encode(commandEncoder, {parameters: undefined});
      expect(encode).toHaveBeenCalledTimes(1);
    } finally {
      commandEncoder.destroy();
      compiled.destroy();
      expect(destroy).toHaveBeenCalledTimes(1);
      buffer.destroy();
      device.destroy();
    }
  });
});

function createGraphDevice(identifier: string): NullDevice {
  const device = new NullDevice({id: `${identifier}-device`});
  Object.defineProperty(device, 'type', {value: 'webgpu'});
  return device;
}

function mockComputePass(commandEncoder: CommandEncoder): void {
  vi.spyOn(commandEncoder, 'beginComputePass').mockImplementation(props => {
    return {
      props,
      pushDebugGroup: () => {},
      popDebugGroup: () => {},
      end: () => {}
    } as ComputePass;
  });
}
