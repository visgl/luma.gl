// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/**
 * Primitive data types that shaders can perform calculations in and declare variables with.
 * @note attribute inputs and texture samples can be populated from a different in-memory types, see below.
 * @note `f16` requires the `f16` extension
 */
export type PrimitiveDataType = 'u32' | 'i32' | 'f32' | 'f16';

/**
 * Signed data types describe signed and unsigned integers as well as floats of varying sizes
 * @note These formats describe physical memory layouts in vertex and pixel formats, they are not used inside shaders
 */
export type DataType =
  | 'uint8'
  | 'sint8'
  | 'uint16'
  | 'sint16'
  | 'uint32'
  | 'sint32'
  | 'float16'
  | 'float32';

export type SignedDataType = DataType;

/**
 * Normalized data types describe signed and unsigned integers as well as floats of varying sizes together with normalization behavior
 * @note These formats describe physical memory layouts in vertex and pixel formats, they are not used inside shaders
 * @note Normalization means that these formats are converted into floats on read (shader must use f32 to process them)
 * @note WebGPU does not support normalized 32 bit integer attributes: 'unorm32' | 'snorm32'
 */
export type NormalizedDataType = SignedDataType | 'unorm8' | 'snorm8' | 'unorm16' | 'snorm16';

/** Returns information about a signed or normalized DataType */
export type DataTypeInfo<T extends NormalizedDataType = NormalizedDataType> = {
  /** The corresponding data type without normalization */
  signedType: SignedDataTypeT<T>;
  /** The primitive data type (what the shader sees) */
  primitiveType: PrimitiveDataTypeT<T>;
  /** @type number - Length in bytes of the data type */
  byteLength: DataTypeByteLengthT<T>;
  /** @type boolean - indicating whether the data type is normalized */
  normalized: DataTypeIsNormalizedT<T>;
  /** @type boolean - indicating whether the data type is integer */
  integer: DataTypeIsIntegerT<T>;
  /** @type boolean - indicating whether the data type is signed */
  signed: DataTypeIsSignedT<T>;
};

export type PrimitiveDataTypeT<T extends NormalizedDataType> = T extends 'float32'
  ? 'f32'
  : T extends 'float16'
    ? 'f16'
    : T extends 'unorm8' | 'snorm8' | 'unorm16' | 'snorm16'
      ? 'f32'
      : T extends 'uint8' | 'uint16' | 'uint32'
        ? 'u32'
        : T extends 'sint8' | 'sint16' | 'sint32'
          ? 'i32'
          : never;

export type SignedDataTypeT<T extends NormalizedDataType> = T extends 'unorm8'
  ? 'uint8'
  : T extends 'snorm8'
    ? 'sint8'
    : T extends 'unorm16'
      ? 'uint16'
      : T extends 'snorm16'
        ? 'sint16'
        : T extends NormalizedDataType
          ? T
          : never;

/** @type a number type that is is the length in bytes of the data type */
export type DataTypeByteLengthT<T extends NormalizedDataType = NormalizedDataType> = T extends
  | 'uint8'
  | 'sint8'
  | 'unorm8'
  | 'snorm8'
  ? 1
  : T extends 'uint16' | 'sint16' | 'unorm16' | 'snorm16' | 'float16'
    ? 2
    : T extends 'uint32' | 'sint32' | 'float32'
      ? 4
      : never;

/** @type a boolean type that is true if the data format is signed */
export type DataTypeIsSignedT<T extends NormalizedDataType = NormalizedDataType> = T extends
  | 'sint8'
  | 'sint16'
  | 'sint32'
  ? true
  : false;

/** @type a boolean type that is true if the data format is a normalized format */
export type DataTypeIsNormalizedT<T extends NormalizedDataType = NormalizedDataType> =
  T extends SignedDataType ? false : true;

/** @type a boolean type that is true if the data format is an integer format */
export type DataTypeIsIntegerT<T extends NormalizedDataType = NormalizedDataType> = T extends
  | 'uint8'
  | 'sint8'
  | 'uint16'
  | 'sint16'
  | 'uint32'
  | 'sint32'
  ? true
  : false;

/** @type A typed array constructor type appropriate to hold the actual values of a data type (i.e. integers for normalized data types) */
export type TypedArrayConstructorT<T extends NormalizedDataType> = T extends 'uint8'
  ? Uint8ArrayConstructor
  : T extends 'sint8'
    ? Int8ArrayConstructor
    : T extends 'unorm8'
      ? Uint8ArrayConstructor
      : T extends 'snorm8'
        ? Int8ArrayConstructor
        : T extends 'uint16'
          ? Uint16ArrayConstructor
          : T extends 'sint16'
            ? Int16ArrayConstructor
            : T extends 'unorm16'
              ? Uint16ArrayConstructor
              : T extends 'snorm16'
                ? Int16ArrayConstructor
                : T extends 'uint32'
                  ? Uint32ArrayConstructor
                  : T extends 'sint32'
                    ? Int32ArrayConstructor
                    : T extends 'float16'
                      ? Uint16ArrayConstructor
                      : T extends 'float32'
                        ? Float32ArrayConstructor
                        : never;

/** @type A typed array constructor appropriate to hold the logical values of a data type (i.e. floats for normalized data types) */
export type NormalizedTypedArrayConstructorT<T extends NormalizedDataType> = T extends
  | 'unorm8'
  | 'snorm8'
  | 'unorm16'
  | 'snorm16'
  ? Float32ArrayConstructor
  : TypedArrayConstructorT<T>;
