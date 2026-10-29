// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, Texture} from '@luma.gl/core';
import {NullDevice} from '@luma.gl/test-utils/device';
import {readGPUResourcePreview} from '../../src/gpu-core/gpu-resource-preview';
import {expect, test, vi} from 'vitest';

test('resource previews bound buffer reads and reject unsupported resources before issuing copies', async () => {
  const device = new NullDevice({});
  const buffer = device.createBuffer({byteLength: 4096, usage: Buffer.COPY_SRC});
  const unreadable = device.createBuffer({byteLength: 4, usage: Buffer.STORAGE});
  const read = vi.spyOn(buffer, 'readAsync').mockResolvedValue(new Uint8Array(256));
  const summary = {
    id: 'buffer',
    kind: 'buffer' as const,
    usage: 'copy-source' as const,
    byteOffset: 8,
    byteLength: 4088
  };
  try {
    await readGPUResourcePreview(buffer, summary);
    expect(read).toHaveBeenCalledExactlyOnceWith(8, 256);
    await expect(
      readGPUResourcePreview(buffer, {...summary, byteOffset: 4095, byteLength: 4})
    ).rejects.toThrow('outside');
    await expect(
      readGPUResourcePreview(unreadable, {...summary, byteOffset: 0, byteLength: 4})
    ).rejects.toThrow('COPY_SRC');
    const texture = device.createTexture({
      format: 'rgba8unorm',
      width: 1,
      height: 1,
      usage: Texture.COPY_SRC
    });
    try {
      await expect(
        readGPUResourcePreview(texture, {id: 'texture', kind: 'texture', usage: 'copy-source'})
      ).rejects.toThrow('WebGPU');
    } finally {
      texture.destroy();
    }
  } finally {
    buffer.destroy();
    unreadable.destroy();
    device.destroy();
  }
});

test.each([
  'rgb10a2unorm',
  'rgb10a2uint',
  'rg11b10ufloat',
  'rgb9e5ufloat'
] as const)('packed texture %s rejects before staging allocation', async format => {
  const device = new NullDevice({});
  const texture = device.createTexture({format, width: 2, height: 2, usage: Texture.COPY_SRC});
  const allocate = vi.spyOn(device, 'createBuffer');
  try {
    await expect(
      readGPUResourcePreview(texture, {id: 'packed', kind: 'texture', usage: 'copy-source'})
    ).rejects.toThrow('Packed');
    expect(allocate).not.toHaveBeenCalled();
  } finally {
    texture.destroy();
    device.destroy();
  }
});
