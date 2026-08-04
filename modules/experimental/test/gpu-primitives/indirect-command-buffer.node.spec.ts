// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer, type BufferProps, type Device} from '@luma.gl/core';
import {describe, expect, test, vi} from 'vitest';
import {DispatchCommandBuffer} from '../../src/gpu-primitives/dispatch-command-buffer';
import {DrawCommandBuffer} from '../../src/gpu-primitives/draw-command-buffer';

const INDIRECT_BUFFER_USAGE =
  Buffer.STORAGE | Buffer.INDIRECT | Buffer.COPY_DST | Buffer.COPY_SRC;

describe('indirect command buffer initialization', () => {
  test('initializes owned draw records without mapping the buffer at creation', () => {
    const fixture = makeDeviceFixture();
    const commands = new DrawCommandBuffer(fixture.device, {
      id: 'test-draw-commands',
      type: 'draw',
      commands: [{vertexCount: 6, instanceCount: 7, firstVertex: 8, firstInstance: 9}]
    });

    expect(fixture.createBuffer).toHaveBeenCalledWith({
      id: 'test-draw-commands',
      byteLength: 16,
      usage: INDIRECT_BUFFER_USAGE
    });
    expect(fixture.createBuffer.mock.calls[0][0]).not.toHaveProperty('data');
    expect(fixture.write).toHaveBeenCalledTimes(1);
    expect(Array.from(fixture.write.mock.calls[0][0] as Uint32Array)).toEqual([6, 7, 8, 9]);

    commands.destroy();
    expect(fixture.destroy).toHaveBeenCalledTimes(1);
  });

  test('initializes owned dispatch records without mapping the buffer at creation', () => {
    const fixture = makeDeviceFixture();
    const commands = new DispatchCommandBuffer(fixture.device, {
      id: 'test-dispatch-commands',
      commands: [{x: 2, y: 3, z: 4}]
    });

    expect(fixture.createBuffer).toHaveBeenCalledWith({
      id: 'test-dispatch-commands',
      byteLength: 12,
      usage: INDIRECT_BUFFER_USAGE
    });
    expect(fixture.createBuffer.mock.calls[0][0]).not.toHaveProperty('data');
    expect(fixture.write).toHaveBeenCalledTimes(1);
    expect(Array.from(fixture.write.mock.calls[0][0] as Uint32Array)).toEqual([2, 3, 4]);

    commands.destroy();
    expect(fixture.destroy).toHaveBeenCalledTimes(1);
  });
});

function makeDeviceFixture(): {
  device: Device;
  createBuffer: ReturnType<typeof vi.fn<(props: BufferProps) => Buffer>>;
  write: ReturnType<typeof vi.fn>;
  destroy: ReturnType<typeof vi.fn>;
} {
  const write = vi.fn();
  const destroy = vi.fn();
  const buffer = {write, destroy} as unknown as Buffer;
  const createBuffer = vi.fn<(props: BufferProps) => Buffer>(() => buffer);
  const device = {type: 'webgpu', createBuffer} as unknown as Device;
  return {device, createBuffer, write, destroy};
}
