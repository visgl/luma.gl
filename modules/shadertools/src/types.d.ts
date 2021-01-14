// TODO - these types should be imported from math.gl

/**
 * TypeScript type covering all typed arrays
 */
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

/**
 * TypeScript type covering all typed arrays and classic arrays consisting of numbers
 */
export type NumberArray = number[] | TypedArray;

export type BigIntOrNumberArray = NumberArray | BigIntTypedArray;

/*
{
  name: any;
  vs: any;
  fs: any;
  dependencies?: any[];
  uniforms: any;
  getUniforms: any;
  deprecations?: any[];
  defines?: {};
  inject?: {};
  vertexShader: any;
  fragmentShader: any;
}
*/

export type ShaderModule = {
  name: string;
  fs?: string;
  vs?: string;
  uniforms?: object;
  getUniforms?: any;
  defines?: object;
  dependencies?: ShaderModule[];
  deprecations?: any[];
};

export type ShaderPass = ShaderModule & {
  passes?: object[];
};
