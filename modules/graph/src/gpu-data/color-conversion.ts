// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {assert} from '@luma.gl/core';
import {fromHalfFloat} from '@luma.gl/shaders';
import {CPUData} from './cpu-data';
import {CPUVector} from './cpu-vector';
import {getGPUVectorFormatInfo, type GPUVectorFormat} from './gpu-vector-format';

export type ColorOutputFormat = 'unorm8x4' | 'float16x4' | 'float32x4';
export type ColorConversionOptions = {
  /** Default RGBA8; preserve keeps source precision while expanding RGB to RGBA. */
  format?: ColorOutputFormat | 'preserve';
  /** Consumer capabilities; never silently select a lossy fallback. */
  acceptedFormats?: readonly ColorOutputFormat[];
  fallbackFormat?: ColorOutputFormat;
};

/** Resolve color storage independently from the device and conversion backend. */
export function resolveColorOutputFormat(
  sourceFormat: GPUVectorFormat,
  options: ColorConversionOptions = {}
): ColorOutputFormat {
  const info = getGPUVectorFormatInfo(sourceFormat);
  // Only fixed-width byte/IEEE RGB or RGBA rows have color semantics here.
  assert(
    !info.vertexList &&
      !info.valueList &&
      !info.fixedSizeList &&
      (info.components === 3 || info.components === 4) &&
      ['uint8', 'float16', 'float32'].includes(info.signedDataType)
  );
  const preserved =
    info.signedDataType === 'float32'
      ? 'float32x4'
      : info.signedDataType === 'float16'
        ? 'float16x4'
        : 'unorm8x4';
  let format = options.format === 'preserve' ? preserved : (options.format ?? 'unorm8x4');
  if (options.acceptedFormats && !options.acceptedFormats.includes(format)) {
    if (
      options.format === 'preserve' &&
      options.fallbackFormat &&
      options.acceptedFormats.includes(options.fallbackFormat)
    )
      format = options.fallbackFormat;
    else throw new Error('Requested color format is not accepted by the consumer');
  }
  return format;
}

/** Convert CPU color chunks without uploading or combining chunks. Input storage is borrowed. */
export function convertCPUColors(
  source: CPUVector,
  options?: ColorConversionOptions & {format?: 'unorm8x4'}
): CPUVector<'unorm8x4'>;
export function convertCPUColors<T extends ColorOutputFormat>(
  source: CPUVector,
  options: ColorConversionOptions & {format: T}
): CPUVector<T>;
export function convertCPUColors(
  source: CPUVector,
  options: ColorConversionOptions
): CPUVector<ColorOutputFormat>;
export function convertCPUColors(
  source: CPUVector,
  options: ColorConversionOptions = {}
): CPUVector<ColorOutputFormat> {
  const format = resolveColorOutputFormat(source.format, options);
  if (options.format === 'preserve' && source.format === format)
    return new CPUVector({
      name: source.name,
      format,
      data: source.data as readonly CPUData<ColorOutputFormat>[]
    });
  return new CPUVector({
    name: source.name,
    format,
    data: source.data.map(chunk => convertCPUColorData(chunk, format))
  });
}

/** @internal Shared CPU backend implementation, including offsets, strides and validity. */
export function convertCPUColorData(
  source: CPUData,
  format: ColorOutputFormat,
  inputFormat?: string
): CPUData<ColorOutputFormat> {
  const info = getGPUVectorFormatInfo(source.format);
  const type = inputFormat?.startsWith('float16') ? 'float16' : info.signedDataType;
  const components = inputFormat?.endsWith('x3') ? 3 : info.components;
  // Color rows contain only byte channels or IEEE floats and three or four components.
  assert((components === 3 || components === 4) && ['uint8', 'float16', 'float32'].includes(type));
  const bytes = type === 'uint8' ? 1 : type === 'float16' ? 2 : 4;
  const input = new DataView(source.buffer, source.byteOffset);
  const output =
    format === 'unorm8x4'
      ? new Uint8Array(source.length * 4)
      : format === 'float16x4'
        ? new Uint16Array(source.length * 4)
        : new Float32Array(source.length * 4);
  const scratch = new DataView(new ArrayBuffer(4));
  for (let rowIndex = 0; rowIndex < source.length; rowIndex++) {
    for (let componentIndex = 0; componentIndex < 4; componentIndex++) {
      const offset = rowIndex * source.byteStride + componentIndex * bytes;
      const value =
        componentIndex >= components
          ? 1
          : type === 'uint8'
            ? input.getUint8(offset) / 255
            : type === 'float16'
              ? fromHalfFloat(input.getUint16(offset, true))
              : input.getFloat32(offset, true);
      output[rowIndex * 4 + componentIndex] =
        format === 'unorm8x4'
          ? Math.round(Math.min(Math.max(value, 0), 1) * 255)
          : format === 'float16x4'
            ? encodeHalfFloat(value, scratch)
            : value;
    }
  }
  return new CPUData({
    buffer: output,
    format,
    length: source.length,
    nullBitmap: source.nullBitmap && new Uint8Array(source.nullBitmap)
  });
}

/** IEEE binary16 round-to-nearest-even, matching pack2x16float (no display-range clamp). */
function encodeHalfFloat(value: number, scratch: DataView): number {
  scratch.setFloat32(0, value, true);
  const bits = scratch.getUint32(0, true);
  const sign = (bits >>> 16) & 0x8000;
  const exponent = (bits >>> 23) & 255;
  const mantissa = bits & 0x7fffff;
  if (exponent === 255) return sign | 0x7c00 | (mantissa ? 0x200 : 0);
  if (exponent > 142) return sign | 0x7c00;
  if (exponent < 102) return sign;
  const shift = exponent < 113 ? 126 - exponent : 13;
  const significand = exponent < 113 ? mantissa | 0x800000 : mantissa;
  const divisor = 2 ** shift;
  const quotient = Math.floor(significand / divisor);
  const remainder = significand % divisor;
  const rounded =
    quotient + (remainder > divisor / 2 || (remainder === divisor / 2 && quotient % 2) ? 1 : 0);
  return sign | ((exponent < 113 ? 0 : (exponent - 112) * 1024) + rounded);
}
