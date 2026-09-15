// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Scalar/vector formats portable across current Jarnevon execution backends. */
export type GPUProgramScalarFormat = 'float32' | 'uint32' | 'sint32';
export type GPUProgramVectorFormat = GPUProgramScalarFormat;

/** Backend-independent scalar state owned by a GPUProgram. */
export class GPUProgramScalar<T extends GPUProgramScalarFormat = GPUProgramScalarFormat> {
  readonly id: string;
  readonly format: T;
  constructor(id: string, format: T) {
    if (!id) throw new Error('GPUProgramScalar id is required');
    this.id = id;
    this.format = format;
  }
}

/**
 * Backend-independent dense one-dimensional value array.
 *
 * A vector describes logical shape/type only. It is not a WebGPU Buffer or GraphDataView. Backend
 * compilers decide allocation, packing and binding. `external` vectors represent program I/O whose
 * concrete storage is supplied to compilation; transient vectors are compiler-owned scratch/state.
 */
export class GPUProgramVector<T extends GPUProgramVectorFormat = GPUProgramVectorFormat> {
  readonly id: string;
  readonly format: T;
  readonly length: number;
  readonly external: boolean;
  /** Optional physical partition lengths; omitted external topology is supplied by its binding. */
  readonly chunkLengths?: readonly number[];
  constructor(props: {
    id: string;
    format: T;
    length: number;
    external?: boolean;
    chunkLengths?: readonly number[];
  }) {
    if (!props.id) throw new Error('GPUProgramVector id is required');
    if (!Number.isSafeInteger(props.length) || props.length < 0) {
      throw new Error(`${props.id} vector length must be a non-negative safe integer`);
    }
    this.id = props.id;
    this.format = props.format;
    this.length = props.length;
    this.external = props.external ?? false;
    if (props.chunkLengths) {
      if (
        props.chunkLengths.some(length => !Number.isSafeInteger(length) || length < 0) ||
        props.chunkLengths.reduce((sum, length) => sum + length, 0) !== props.length
      ) {
        throw new Error(`${props.id} chunk lengths must partition its logical length`);
      }
      this.chunkLengths = Object.freeze([...props.chunkLengths]);
    }
  }
}
