// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {GPUData, GPUVector, getGPUVectorFormatInfo} from '@luma.gl/graph/gpu-data';
import type {GPUGraphVectorFormat} from './gpu-graph-value';

/** @internal */
export function getDataBuffer(chunk: GPUData): Buffer {
  return chunk.buffer instanceof Buffer ? chunk.buffer : chunk.buffer.buffer;
}

/** @internal */
export function allocateVector(
  device: Device,
  name: string,
  lengths: readonly number[],
  format: GPUGraphVectorFormat = 'float32'
): GPUVector<GPUGraphVectorFormat> {
  const data: GPUData<GPUGraphVectorFormat>[] = [];
  try {
    for (const length of lengths)
      data.push(
        new GPUData({
          buffer: device.createBuffer({
            byteLength: Math.max(1, length) * getGPUVectorFormatInfo(format).byteLength,
            usage: Buffer.STORAGE | Buffer.VERTEX | Buffer.COPY_SRC | Buffer.COPY_DST
          }),
          format,
          length,
          ownsBuffer: true
        })
      );
    return new GPUVector({type: 'data', name, format, data, ownsData: true});
  } catch (error) {
    for (const chunk of data) chunk.destroy();
    throw error;
  }
}

/** @internal */
export function validateVector(
  device: Device,
  vector: GPUVector,
  format: string,
  length?: number,
  chunks?: readonly number[]
): void {
  if (vector.format !== format || (length !== undefined && vector.length !== length))
    throw new Error(`Incompatible vector ${vector.name}`);
  if (
    chunks &&
    (chunks.length !== vector.data.length ||
      chunks.some((count, index) => count !== vector.data[index].length))
  )
    throw new Error(`Incompatible chunks for ${vector.name}`);
  const rowByteLength = getGPUVectorFormatInfo(vector.format).byteLength;
  for (const chunk of vector.data) {
    if (
      getDataBuffer(chunk).destroyed ||
      chunk.buffer.device !== device ||
      chunk.byteStride !== rowByteLength ||
      chunk.byteOffset % 4 !== 0 ||
      chunk.rowByteLength !== rowByteLength
    )
      throw new Error(
        `Expression vector ${vector.name} must contain packed 32-bit numeric chunks on the execution device`
      );
  }
}

/** @internal */
export function validateWritableTarget(
  name: string,
  target: GPUVector,
  values: ReadonlyMap<string, GPUVector | number>
): void {
  const ranges = new Map<Buffer, {start: number; end: number}[]>();
  for (const chunk of target.data) {
    if (chunk.length === 0) continue;
    const buffer = getDataBuffer(chunk);
    const intervals = ranges.get(buffer) ?? [];
    intervals.push({
      start: chunk.byteOffset,
      end: chunk.byteOffset + chunk.length * chunk.byteStride
    });
    ranges.set(buffer, intervals);
  }
  for (const intervals of ranges.values()) {
    intervals.sort((left, right) => left.start - right.start);
    if (intervals.some((interval, index) => index > 0 && interval.start < intervals[index - 1].end))
      throw new Error(`Output ${name} has overlapping writable chunks`);
  }
  for (const [inputName, value] of values) {
    if (
      inputName !== name &&
      value instanceof GPUVector &&
      value.data.some(chunk => ranges.has(getDataBuffer(chunk)))
    )
      throw new Error('Expression output targets must not alias inputs or earlier outputs');
  }
}
