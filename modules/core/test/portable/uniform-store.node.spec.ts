// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it, vi} from 'vitest';
import {type Buffer, type Device, UniformStore} from '../../src';

it.each([
  'getUniformBufferData',
  'createUniformBuffer'
] as const)('UniformStore initializes a managed buffer after %s and unchanged uniforms', readMethod => {
  const managedBuffer = {write: vi.fn()} as unknown as Buffer;
  const unmanagedBuffer = {write: vi.fn()} as unknown as Buffer;
  const createBuffer = vi.fn().mockReturnValue(managedBuffer);
  const device = {type: 'webgl', createBuffer} as unknown as Device;
  const uniformStore = new UniformStore(device, {
    uniforms: {uniformTypes: {value: 'f32'}, defaultUniforms: {value: 42}}
  });

  if (readMethod === 'createUniformBuffer') {
    createBuffer.mockReturnValueOnce(unmanagedBuffer);
  }
  uniformStore[readMethod]('uniforms');
  expect(uniformStore.uniformBlocks.get('uniforms')?.needsRedraw).toBe(false);

  expect(uniformStore.getManagedUniformBuffer('uniforms')).toBe(managedBuffer);
  uniformStore.setUniforms({uniforms: {value: 42}});

  expect(managedBuffer.write).toHaveBeenCalledTimes(1);
  const uniformBufferData = vi.mocked(managedBuffer.write).mock.calls[0][0];
  expect(uniformBufferData).toBeInstanceOf(Uint8Array);
  const data = uniformBufferData as Uint8Array;
  expect(new DataView(data.buffer, data.byteOffset, data.byteLength).getFloat32(0, true)).toBe(42);

  expect(uniformStore.getManagedUniformBuffer('uniforms')).toBe(managedBuffer);
  uniformStore.setUniforms({uniforms: {value: 42}});
  expect(managedBuffer.write).toHaveBeenCalledTimes(1);
  expect(uniformStore.updateUniformBuffers()).toBe(false);
});
