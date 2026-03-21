// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {NumericArray} from '@math.gl/types';

// UNIFORMS

/** Valid values for uniforms. @note boolean values get converted to 0 or 1 before setting */
export type UniformValue = number | boolean | Readonly<NumericArray>; // Float32Array> | Readonly<Int32Array> | Readonly<Uint32Array> | Readonly<number[]>;

/** Recursive uniform value tree used by uniform-buffer packing utilities. */
export type CompositeUniformValue =
  | UniformValue
  | CompositeUniformValueStruct
  | CompositeUniformValueArray;

export type CompositeUniformValueStruct = {
  [name: string]: CompositeUniformValue | undefined;
};

export type CompositeUniformValueArray = ReadonlyArray<CompositeUniformValue | undefined>;
