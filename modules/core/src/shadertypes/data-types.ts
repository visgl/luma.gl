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
