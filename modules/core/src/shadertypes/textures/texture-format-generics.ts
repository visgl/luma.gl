// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  type TextureFormat,
  type TextureFormatDepthStencil,
  type TextureFormatCompressed
} from './texture-formats';

import {type DataTypeArray, NormalizedDataTypeArray} from '../data-types/data-types';

export type TextureFormatTypedArray<T extends TextureFormat> = DataTypeArray<
  TextureFormatDataType<T>
>;

export type TextureFormatNormalizedTypedArray<T extends TextureFormat> = NormalizedDataTypeArray<
  TextureFormatDataType<T>
>;

/** A numeric array of length matching the number of components in the texture format */
export type TextureFormatPixel<T extends TextureFormat> =
  TextureFormatPackedComponents<T> extends 1
    ? [number]
    : TextureFormatPackedComponents<T> extends 2
      ? [number, number]
      : TextureFormatPackedComponents<T> extends 3
        ? [number, number, number]
        : TextureFormatPackedComponents<T> extends 4
          ? [number, number, number, number]
          : never;

/** @note packed formats have only one component. Use TextureFormatPackedComponents */
export type TextureFormatComponents<T extends TextureFormat> = T extends
  | TextureFormatR
  | TextureFormatPackedRGB
  | TextureFormatPackedRGBA
  ? 1
  : T extends TextureFormatRG
    ? 2
    : T extends TextureFormatRGB
      ? 3
      : T extends TextureFormatRGBA
        ? 4
        : never;

export type TextureFormatPackedComponents<T extends TextureFormat> = T extends TextureFormatR
  ? 1
  : T extends TextureFormatRG
    ? 2
    : T extends TextureFormatRGB | TextureFormatPackedRGB
      ? 3
      : T extends TextureFormatRGBA | TextureFormatPackedRGBA
        ? 4
        : never;

/** Get the data type for a texture format */
export type TextureFormatDataType<T extends TextureFormat> = T extends TextureFormatUint8
  ? 'uint8'
  : T extends TextureFormatSint8
    ? 'sint8'
    : T extends TextureFormatUnorm8
      ? 'unorm8'
      : T extends TextureFormatSnorm8
        ? 'snorm8'
        : T extends TextureFormatUint16
          ? 'uint16'
          : T extends TextureFormatSint16
            ? 'sint16'
            : T extends TextureFormatUnorm16
              ? 'unorm16'
              : T extends TextureFormatSnorm16
                ? 'snorm16'
                : T extends TextureFormatUint32
                  ? 'uint32'
                  : T extends TextureFormatSint32
                    ? 'sint32'
                    : T extends TextureFormatFloat16
                      ? 'float16'
                      : T extends TextureFormatFloat32
                        ? 'float32'
                        : T extends TextureFormatDepthStencil
                          ? 'uint32'
                          : T extends TextureFormatCompressed
                            ? 'uint8'
                            : T extends TextureFormatPacked16
                              ? 'uint16'
                              : T extends TextureFormatPacked32
                                ? 'uint32'
                                : never;

// Component groups

type TextureFormatR =
  | 'r8uint'
  | 'r8sint'
  | 'r8unorm'
  | 'r8snorm'
  | 'r16unorm'
  | 'r16snorm'
  | 'r16uint'
  | 'r16sint'
  | 'r16float'
  | 'r32uint'
  | 'r32sint'
  | 'r32float';

type TextureFormatRG =
  | 'rg8unorm'
  | 'rg8snorm'
  | 'rg8uint'
  | 'rg8sint'
  | 'rg16unorm'
  | 'rg16snorm'
  | 'rg16uint'
  | 'rg16sint'
  | 'rg16float'
  | 'rg32uint'
  | 'rg32sint'
  | 'rg32float';

type TextureFormatRGB =
  | 'rgb8unorm-webgl'
  | 'rgb8snorm-webgl'
  | 'rgb16unorm-webgl'
  | 'rgb16snorm-webgl'
  | 'rgb32float-webgl';

type TextureFormatRGBA =
  | 'rgba8uint'
  | 'rgba8unorm'
  | 'rgba8unorm-srgb'
  | 'rgba8snorm'
  | 'bgra8unorm'
  | 'bgra8unorm-srgb'
  | 'rgba8sint'
  | 'rgba16unorm'
  | 'rgba16snorm'
  | 'rgba16uint'
  | 'rgba16sint'
  | 'rgba16float'
  | 'rgba32uint'
  | 'rgba32sint'
  | 'rgba32float';

type TextureFormatPackedRGB = 'rgb565unorm-webgl' | 'rgb9e5ufloat' | 'rg11b10ufloat';

type TextureFormatPackedRGBA =
  | 'rgba4unorm-webgl'
  | 'rgb5a1unorm-webgl'
  | 'rgb10a2unorm'
  | 'rgb10a2uint';

// Data type groups

type TextureFormatUnorm8 =
  | 'r8unorm'
  | 'rg8unorm'
  | 'rgb8unorm-webgl'
  | 'rgba8unorm'
  | 'rgba8unorm-srgb'
  | 'bgra8unorm'
  | 'bgra8unorm-srgb';

type TextureFormatSnorm8 = 'r8snorm' | 'rg8snorm' | 'rgb8snorm-webgl' | 'rgba8snorm';

type TextureFormatUint8 = 'r8uint' | 'rg8uint' | 'rgba8uint';

type TextureFormatSint8 = 'r8sint' | 'rg8sint' | 'rgba8sint';

type TextureFormatUnorm16 = 'r16unorm' | 'rg16unorm' | 'rgb16unorm-webgl' | 'rgba16unorm';

type TextureFormatSnorm16 = 'r16snorm' | 'rg16snorm' | 'rgb16snorm-webgl' | 'rgba16snorm';

type TextureFormatUint16 = 'r16uint' | 'rg16uint' | 'rgba16uint';

type TextureFormatSint16 = 'r16sint' | 'rg16sint' | 'rgba16sint';

type TextureFormatFloat16 = 'r16float' | 'rg16float' | 'rgba16float';

// 96-bit formats (deprecated!)
type TextureFormatUint32 = 'r32uint' | 'rg32uint' | 'rgba32uint';

type TextureFormatSint32 = 'r32sint' | 'rg32sint' | 'rgba32sint';

type TextureFormatFloat32 = 'r32float' | 'rg32float' | 'rgb32float-webgl' | 'rgba32float';

type TextureFormatPacked16 = 'rgba4unorm-webgl' | 'rgb565unorm-webgl' | 'rgb5a1unorm-webgl';

type TextureFormatPacked32 = 'rgb9e5ufloat' | 'rg11b10ufloat' | 'rgb10a2unorm' | 'rgb10a2uint';
