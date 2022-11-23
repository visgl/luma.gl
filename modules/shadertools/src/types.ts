// TODO - these types could be imported from math.gl

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

export type BigIntTypedArray = BigInt64Array | BigUint64Array;

/** type covering all typed arrays and classic arrays consisting of numbers */
export type NumberArray = number[] | TypedArray;

export type BigIntOrNumberArray = NumberArray | BigIntTypedArray;
