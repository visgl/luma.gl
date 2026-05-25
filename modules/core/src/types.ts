// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** TypeScript type covering all typed arrays */
import type {TypedArray, NumberArray} from '@math.gl/types';

export type {TypedArray, NumberArray};

export type BigTypedArray = TypedArray | BigIntTypedArray;

/** Keep big int arrays separate as they are still problematic, can't be indexed and don't work well on Safari */
export type BigIntTypedArray = BigInt64Array | BigUint64Array;

export type BigIntOrNumberArray = NumberArray | BigIntTypedArray;

/** TypeScript type covering constructors of any of the typed arrays, except BigInt */
export type TypedArrayConstructor =
  | Int8ArrayConstructor
  | Uint8ArrayConstructor
  | Int16ArrayConstructor
  | Uint16ArrayConstructor
  | Int32ArrayConstructor
  | Uint32ArrayConstructor
  | Uint8ClampedArrayConstructor
  | Float32ArrayConstructor
  | Float64ArrayConstructor;

export type BigTypedArrayConstructor =
  | TypedArrayConstructor
  | BigInt64ArrayConstructor
  | BigUint64ArrayConstructor;

export const NativeFloat16ArrayConstructor: TypedArrayConstructor | undefined = (
  globalThis as typeof globalThis & {Float16Array?: TypedArrayConstructor}
).Float16Array;

export function getFloat16ArrayConstructor(): TypedArrayConstructor {
  return NativeFloat16ArrayConstructor ?? Uint16Array;
}

export function isFloat16ArrayConstructor(value: unknown): boolean {
  return Boolean(NativeFloat16ArrayConstructor && value === NativeFloat16ArrayConstructor);
}
