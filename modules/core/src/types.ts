/** TypeScript type covering all typed arrays */
export type TypedArray =
  | Int8Array
  | Uint8Array
  | Int16Array
  | Uint16Array
  | Int32Array
  | Uint32Array
  | Uint8ClampedArray
  | Float32Array
  | Float64Array;

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

/** type covering all typed arrays and classic arrays consisting of numbers */
export type NumberArray = number[] | TypedArray;
export type NumericArray = number[] | TypedArray;

export type BigIntOrNumberArray = NumberArray | BigIntTypedArray;
export type BigIntOrNumericArray = NumberArray | BigIntTypedArray;

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
