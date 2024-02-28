// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** TypeScript type covering all typed arrays */
import {TypedArray, NumberArray} from '@math.gl/types';

export {TypedArray, NumberArray};

/** TypeScript type covering constructors of any of the typed arrays */
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

/** Keep big int arrays separate as they are still problematic, can't be indexed and don't work well on Safari */
export type BigIntTypedArray = BigInt64Array | BigUint64Array;

export type BigIntOrNumberArray = NumberArray | BigIntTypedArray;

/** Get the constructor type of a type */
export interface ConstructorOf<T> {
  new (...args: unknown[]): T;
}

/**
 * Make specific fields in a type optional. Granular version of `Partial<T>`
 * @example
 *  type PartialProps = PartialBy<Required<DeviceProps>, 'device' | 'canvas'>
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
