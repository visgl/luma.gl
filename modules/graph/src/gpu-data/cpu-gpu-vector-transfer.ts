// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device, type BufferProps} from '@luma.gl/core';
import {CPUData} from './cpu-data';
import {CPUVector} from './cpu-vector';
import {GPUData} from './gpu-data';
import {GPUVector} from './gpu-vector';
import {getGPUVectorFormatInfo, type GPUVectorFormat} from './gpu-vector-format';

/** Explicit upload preserving chunk-local list offsets and validity metadata. */
export function makeGPUVectorFromCPUVector<T extends GPUVectorFormat>(
  device: Device,
  vector: CPUVector<T>,
  options: Pick<BufferProps, 'usage' | 'indexType'> = {}
): GPUVector<T> {
  const data: GPUData<T>[] = [];
  try {
    for (const chunk of vector.data) {
      const info = getGPUVectorFormatInfo(vector.format);
      const count = info.vertexList || info.valueList ? chunk.valueLength : chunk.length;
      const bytes = new Uint8Array(count * info.byteLength);
      for (let index = 0; index < count; index++)
        bytes.set(
          new Uint8Array(
            chunk.buffer,
            chunk.byteOffset + index * chunk.byteStride,
            info.byteLength
          ),
          index * info.byteLength
        );
      data.push(
        new GPUData({
          buffer: device.createBuffer({
            data: bytes.length ? bytes : new Uint8Array(4),
            usage:
              Buffer.COPY_SRC |
              Buffer.COPY_DST |
              Buffer.STORAGE |
              Buffer.VERTEX |
              (options.usage ?? 0),
            indexType: options.indexType
          }),
          format: vector.format,
          length: chunk.length,
          valueLength: chunk.valueLength,
          valueOffsets: chunk.valueOffsets?.slice(),
          nullBitmap: chunk.nullBitmap?.slice(),
          ownsBuffer: true
        })
      );
    }
    return new GPUVector({
      type: 'data',
      name: vector.name,
      format: vector.format,
      data,
      ownsData: true
    });
  } catch (error) {
    for (const chunk of data) chunk.destroy();
    throw error;
  }
}

/** Explicit asynchronous readback preserving physical formats, chunks, lists and parent validity. */
export async function makeCPUVectorFromGPUVector<T extends GPUVectorFormat>(
  vector: GPUVector<T>
): Promise<CPUVector<T>> {
  const data: CPUData<T>[] = [];
  for (const chunk of vector.data) {
    const info = getGPUVectorFormatInfo(vector.format!);
    const count = info.vertexList || info.valueList ? chunk.valueLength : chunk.length;
    const bytes = count
      ? await chunk.buffer.readAsync(
          chunk.byteOffset,
          (count - 1) * chunk.byteStride + info.byteLength
        )
      : new Uint8Array(0);
    data.push(
      new CPUData({
        buffer: bytes,
        format: vector.format!,
        length: chunk.length,
        valueLength: chunk.valueLength,
        byteStride: chunk.byteStride,
        valueOffsets: chunk.valueOffsets?.slice(),
        nullBitmap: chunk.nullBitmap?.slice()
      })
    );
  }
  return new CPUVector({name: vector.name, format: vector.format!, data});
}
