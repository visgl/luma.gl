// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {assert, Buffer, Texture, type Device} from '@luma.gl/core';
import {fromHalfFloat, toHalfFloat} from '@luma.gl/shaders';
import {LightmapBakeResult} from './lightmap-baker';

/** Portable linear irradiance E, with chart coverage in alpha. Rows follow texture upload order. */
export type LightmapData = {
  version: 1;
  width: number;
  height: number;
  encoding: 'linear-irradiance';
  uvSet: 0 | 1;
  data: Float32Array;
};

/** Explicit asynchronous readback. Submits pending work, including result copies. */
export async function readLightmapData(texture: Texture, uvSet: 0 | 1 = 1): Promise<LightmapData> {
  assert(
    !texture.destroyed &&
      texture.dimension === '2d' &&
      texture.samples === 1 &&
      (uvSet === 0 || uvSet === 1) &&
      (texture.format === 'rgba16float' || texture.format === 'rgba32float')
  );
  const bytesPerPixel = texture.format === 'rgba16float' ? 8 : 16;
  const rowBytes = texture.computeMemoryLayout().bytesPerRow;
  const buffer = texture.device.createBuffer({
    byteLength: rowBytes * texture.height,
    usage: Buffer.COPY_DST | Buffer.MAP_READ
  });
  try {
    texture.device.submit();
    texture.readBuffer({x: 0, y: 0, width: texture.width, height: texture.height}, buffer);
    texture.device.submit();
    const bytes = await buffer.readAsync();
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const data = new Float32Array(texture.width * texture.height * 4);
    for (let row = 0; row < texture.height; row++) {
      for (let component = 0; component < texture.width * 4; component++) {
        const offset = row * rowBytes + (component * bytesPerPixel) / 4;
        if (bytesPerPixel === 16)
          data[row * texture.width * 4 + component] = view.getFloat32(offset, true);
        else {
          data[row * texture.width * 4 + component] = fromHalfFloat(view.getUint16(offset, true));
        }
      }
    }
    return {
      version: 1,
      width: texture.width,
      height: texture.height,
      encoding: 'linear-irradiance',
      uvSet,
      data
    };
  } finally {
    buffer.destroy();
  }
}

/** Uploads an independent owned texture. Input CPU data remains caller-owned. */
export function createLightmapFromData(
  device: Device,
  lightmap: LightmapData,
  format: 'rgba16float' | 'rgba32float' = 'rgba16float'
): LightmapBakeResult {
  assert(lightmap.version === 1 && lightmap.encoding === 'linear-irradiance');
  assert(
    Number.isInteger(lightmap.width) &&
      lightmap.width > 0 &&
      lightmap.width <= 0xffffffff &&
      Number.isInteger(lightmap.height) &&
      lightmap.height > 0 &&
      lightmap.height <= 0xffffffff
  );
  assert(lightmap.data.length === lightmap.width * lightmap.height * 4);
  assert(lightmap.uvSet === 0 || lightmap.uvSet === 1);
  assert(device.getTextureFormatCapabilities(format).filter);
  // Half-float uploads round explicitly but must not silently saturate HDR values.
  for (const value of lightmap.data)
    assert(Number.isFinite(value) && (format !== 'rgba16float' || Math.abs(value) <= 65504));
  const data =
    format === 'rgba16float' ? Uint16Array.from(lightmap.data, toHalfFloat) : lightmap.data;
  return new LightmapBakeResult(
    device.createTexture({
      width: lightmap.width,
      height: lightmap.height,
      format,
      data,
      sampler:
        format === 'rgba16float'
          ? {minFilter: 'linear', magFilter: 'linear'}
          : {minFilter: 'nearest', magFilter: 'nearest'},
      usage: Texture.SAMPLE | Texture.COPY_DST | Texture.COPY_SRC
    })
  );
}

/** Encodes LML1: four little-endian uint32 header words followed by linear float32 RGBA. */
export function encodeLightmapData(lightmap: LightmapData): ArrayBuffer {
  assert(lightmap.version === 1 && lightmap.encoding === 'linear-irradiance');
  assert(
    Number.isInteger(lightmap.width) &&
      lightmap.width > 0 &&
      lightmap.width <= 0xffffffff &&
      Number.isInteger(lightmap.height) &&
      lightmap.height > 0 &&
      lightmap.height <= 0xffffffff
  );
  assert(lightmap.uvSet === 0 || lightmap.uvSet === 1);
  assert(lightmap.data.length === lightmap.width * lightmap.height * 4);
  const buffer = new ArrayBuffer(16 + lightmap.data.length * 4);
  const view = new DataView(buffer);
  view.setUint32(0, 0x314c4d4c, true);
  view.setUint32(4, lightmap.width, true);
  view.setUint32(8, lightmap.height, true);
  view.setUint32(12, lightmap.uvSet, true);
  lightmap.data.forEach((value, index) => view.setFloat32(16 + index * 4, value, true));
  return buffer;
}

/** Decodes an independently owned CPU copy; no image decoding, fetching or GPU allocation. */
export function decodeLightmapData(buffer: ArrayBuffer): LightmapData {
  assert(buffer.byteLength >= 16);
  const view = new DataView(buffer);
  assert(view.getUint32(0, true) === 0x314c4d4c);
  const width = view.getUint32(4, true),
    height = view.getUint32(8, true),
    uvSet = view.getUint32(12, true);
  assert(width > 0 && height > 0 && (uvSet === 0 || uvSet === 1));
  const length = width * height * 4;
  assert(Number.isSafeInteger(length) && buffer.byteLength === 16 + length * 4);
  const data = new Float32Array(length);
  for (let index = 0; index < length; index++) data[index] = view.getFloat32(16 + index * 4, true);
  return {version: 1, width, height, encoding: 'linear-irradiance', uvSet, data};
}
