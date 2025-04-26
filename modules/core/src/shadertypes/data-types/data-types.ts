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
export type SignedDataType =
  | 'uint8'
  | 'sint8'
  | 'uint16'
  | 'sint16'
  | 'uint32'
  | 'sint32'
  | 'float16'
  | 'float32';

/**
 * Normalized data types describe signed and unsigned integers as well as floats of varying sizes together with normalization behavior
 * @note These formats describe physical memory layouts in vertex and pixel formats, they are not used inside shaders
 * @note Normalization means that these formats are converted into floats on read (shader must use f32 to process them)
 * @note WebGPU does not support normalized 32 bit integer attributes: 'unorm32' | 'snorm32'
 */
export type NormalizedDataType = SignedDataType | 'unorm8' | 'snorm8' | 'unorm16' | 'snorm16';

/** Returns information about a signed or normalized DataType */
export type DataTypeInfo = {
  signedType: SignedDataType;
  primitiveType: PrimitiveDataType;
  byteLength: 1 | 2 | 4;
  normalized: boolean;
  integer: boolean;
  signed: boolean;
};

/** Returns a typed array appropriate to hold the actual values of a data type (integers for normalized integers) */
export type DataTypeArray<T extends NormalizedDataType> = T extends 'uint8'
  ? Uint8Array
  : T extends 'sint8'
    ? Int8Array
    : T extends 'unorm8'
      ? Uint8Array
      : T extends 'snorm8'
        ? Int8Array
        : T extends 'uint16'
          ? Uint16Array
          : T extends 'sint16'
            ? Int16Array
            : T extends 'unorm16'
              ? Uint16Array
              : T extends 'snorm16'
                ? Int16Array
                : T extends 'uint32'
                  ? Uint32Array
                  : T extends 'sint32'
                    ? Int32Array
                    : T extends 'float16'
                      ? Uint16Array
                      : T extends 'float32'
                        ? Float32Array
                        : never;

/** Returns a type array appropriate to hold the logical values of a data type (floats for normalized integers) */
export type NormalizedDataTypeArray<T extends NormalizedDataType> = T extends 'uint8'
  ? Uint8Array
  : T extends 'sint8'
    ? Int8Array
    : T extends 'unorm8'
      ? Float32Array
      : T extends 'snorm8'
        ? Float32Array
        : T extends 'uint16'
          ? Uint16Array
          : T extends 'sint16'
            ? Int16Array
            : T extends 'unorm16'
              ? Uint16Array
              : T extends 'snorm16'
                ? Int16Array
                : T extends 'uint32'
                  ? Uint32Array
                  : T extends 'sint32'
                    ? Int32Array
                    : T extends 'float16'
                      ? Float32Array
                      : T extends 'float32'
                        ? Float32Array
                        : never;
