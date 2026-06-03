// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  SignedDataType,
  SignedDataTypeT,
  VertexFormat,
  VertexFormatDataTypeT
} from '@luma.gl/core';
import type {GPUVectorFormat, VertexList} from '@luma.gl/tables';

type ComponentCount = 1 | 2 | 3 | 4;
type IntegerComponentCount = ComponentCount | 5 | 6 | 7 | 8;
type MaybeComponentCount = 0 | IntegerComponentCount | number;
type WebGLThreeComponentBase =
  | 'uint8'
  | 'sint8'
  | 'unorm8'
  | 'snorm8'
  | 'uint16'
  | 'sint16'
  | 'unorm16'
  | 'snorm16';

type FixedGPUVectorFormat<FormatT extends GPUVectorFormat> = FormatT extends VertexList
  ? never
  : FormatT;

type GPUVectorElementFormat<FormatT extends GPUVectorFormat> =
  FormatT extends VertexList<infer ElementFormatT> ? ElementFormatT : FixedGPUVectorFormat<FormatT>;

type VertexFormatSignedDataType<FormatT extends VertexFormat> = SignedDataTypeT<
  VertexFormatDataTypeT<FormatT>
>;

type VertexFormatComponentCount<FormatT extends VertexFormat> = FormatT extends `${string}x2`
  ? 2
  : FormatT extends `${string}x3` | `${string}x3-webgl`
    ? 3
    : FormatT extends `${string}x4` | `${string}x4-bgra` | 'unorm10-10-10-2'
      ? 4
      : 1;

type VertexFormatNormalized<FormatT extends VertexFormat> =
  VertexFormatDataTypeT<FormatT> extends SignedDataType ? false : true;

type NormalizedVertexFormatBase<
  TypeT extends SignedDataType,
  NormalizedT extends boolean
> = NormalizedT extends true
  ? TypeT extends 'uint8'
    ? 'unorm8'
    : TypeT extends 'sint8'
      ? 'snorm8'
      : TypeT extends 'uint16'
        ? 'unorm16'
        : TypeT extends 'sint16'
          ? 'snorm16'
          : TypeT extends 'float32'
            ? 'float32'
            : never
  : TypeT;

type VertexFormatFromBaseAndComponents<
  BaseT extends string,
  ComponentsT extends ComponentCount
> = ComponentsT extends 1
  ? BaseT
  : ComponentsT extends 3
    ? BaseT extends WebGLThreeComponentBase
      ? `${BaseT}x3-webgl`
      : `${BaseT}x3`
    : `${BaseT}x${ComponentsT}`;

type AsGPUVectorFormat<FormatT> = [FormatT] extends [never]
  ? GPUVectorFormat
  : FormatT extends GPUVectorFormat
    ? FormatT
    : GPUVectorFormat;

export type GPUVectorFormatSignedDataType<FormatT extends GPUVectorFormat> =
  GPUVectorElementFormat<FormatT> extends VertexFormat
    ? VertexFormatSignedDataType<GPUVectorElementFormat<FormatT>>
    : SignedDataType;

export type GPUVectorFormatComponentCount<FormatT extends GPUVectorFormat> =
  GPUVectorElementFormat<FormatT> extends VertexFormat
    ? VertexFormatComponentCount<GPUVectorElementFormat<FormatT>>
    : ComponentCount;

export type GPUVectorFormatIsNormalized<FormatT extends GPUVectorFormat> =
  GPUVectorElementFormat<FormatT> extends VertexFormat
    ? VertexFormatNormalized<GPUVectorElementFormat<FormatT>>
    : boolean;

export type GPUVectorFormatFromTypeAndSize<
  TypeT extends SignedDataType,
  SizeT extends number,
  NormalizedT extends boolean = false
> = number extends SizeT
  ? GPUVectorFormat
  : SizeT extends ComponentCount
    ? AsGPUVectorFormat<
        VertexFormatFromBaseAndComponents<NormalizedVertexFormatBase<TypeT, NormalizedT>, SizeT>
      >
    : GPUVectorFormat;

type BitCount<TypeT extends SignedDataType> = TypeT extends 'uint8' | 'sint8'
  ? 8
  : TypeT extends 'uint16' | 'sint16'
    ? 16
    : TypeT extends 'uint32' | 'sint32'
      ? 32
      : never;

type MaxBitCount<LeftT extends number, RightT extends number> = 32 extends LeftT | RightT
  ? 32
  : 16 extends LeftT | RightT
    ? 16
    : 8;

type DoubleBitCount<BitsT extends number> = BitsT extends 8 ? 16 : 32;

type UnsignedJoinType<
  LeftT extends SignedDataType,
  RightT extends SignedDataType
> = LeftT extends `uint${string}`
  ? RightT extends `uint${string}`
    ? `uint${MaxBitCount<BitCount<LeftT>, BitCount<RightT>>}` & SignedDataType
    : never
  : never;

type SignedJoinType<
  LeftT extends SignedDataType,
  RightT extends SignedDataType
> = LeftT extends `sint${string}`
  ? RightT extends `sint${string}`
    ? `sint${MaxBitCount<BitCount<LeftT>, BitCount<RightT>>}` & SignedDataType
    : never
  : never;

type MixedIntegerJoinType<
  LeftT extends SignedDataType,
  RightT extends SignedDataType
> = LeftT extends `uint${string}`
  ? RightT extends `sint${string}`
    ? BitCount<LeftT> extends 32
      ? 'float32'
      : `sint${MaxBitCount<DoubleBitCount<BitCount<LeftT>>, BitCount<RightT>>}` & SignedDataType
    : never
  : LeftT extends `sint${string}`
    ? RightT extends `uint${string}`
      ? BitCount<RightT> extends 32
        ? 'float32'
        : `sint${MaxBitCount<BitCount<LeftT>, DoubleBitCount<BitCount<RightT>>>}` & SignedDataType
      : never
    : never;

export type JoinSignedDataTypes<
  LeftT extends SignedDataType,
  RightT extends SignedDataType
> = LeftT extends `float${string}`
  ? 'float32'
  : RightT extends `float${string}`
    ? 'float32'
    : UnsignedJoinType<LeftT, RightT> extends never
      ? SignedJoinType<LeftT, RightT> extends never
        ? MixedIntegerJoinType<LeftT, RightT>
        : SignedJoinType<LeftT, RightT>
      : UnsignedJoinType<LeftT, RightT>;

export type MaxComponentCount<
  LeftT extends MaybeComponentCount,
  RightT extends MaybeComponentCount
> = number extends LeftT | RightT
  ? number
  : 8 extends LeftT | RightT
    ? 8
    : 7 extends LeftT | RightT
      ? 7
      : 6 extends LeftT | RightT
        ? 6
        : 5 extends LeftT | RightT
          ? 5
          : 4 extends LeftT | RightT
            ? 4
            : 3 extends LeftT | RightT
              ? 3
              : 2 extends LeftT | RightT
                ? 2
                : 1;

export type AddComponentCounts<
  LeftT extends MaybeComponentCount,
  RightT extends MaybeComponentCount
> = number extends LeftT | RightT
  ? number
  : LeftT extends 0
    ? RightT
    : RightT extends 0
      ? LeftT
      : LeftT extends 1
        ? RightT extends 1
          ? 2
          : RightT extends 2
            ? 3
            : RightT extends 3
              ? 4
              : RightT extends 4
                ? 5
                : number
        : LeftT extends 2
          ? RightT extends 1
            ? 3
            : RightT extends 2
              ? 4
              : RightT extends 3
                ? 5
                : RightT extends 4
                  ? 6
                  : number
          : LeftT extends 3
            ? RightT extends 1
              ? 4
              : RightT extends 2
                ? 5
                : RightT extends 3
                  ? 6
                  : RightT extends 4
                    ? 7
                    : number
            : LeftT extends 4
              ? RightT extends 1
                ? 5
                : RightT extends 2
                  ? 6
                  : RightT extends 3
                    ? 7
                    : RightT extends 4
                      ? 8
                      : number
              : number;

export type DoubleComponentCount<CountT extends MaybeComponentCount> = number extends CountT
  ? number
  : CountT extends 1
    ? 2
    : CountT extends 2
      ? 4
      : CountT extends 3
        ? 6
        : CountT extends 4
          ? 8
          : number;
