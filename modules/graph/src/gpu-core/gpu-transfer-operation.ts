// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {assert} from '@luma.gl/core';
import {getGPUVectorFormatInfo} from '@luma.gl/graph/gpu-data';
import {gpuGraph, type GPUGraphVectorFormat} from './gpu-graph-value';
import type {GPUOperation} from './gpu-operation';
import type {GPUOperationContract} from './gpu-operation-contract';

export type GPUUploadOperationProps = {
  id?: string;
  output: string;
  format: GPUGraphVectorFormat;
  /** Packed rows, snapshotted at construction. An array preserves explicit chunk boundaries. */
  data:
    | Float32Array
    | Uint32Array
    | Int32Array
    | readonly (Float32Array | Uint32Array | Int32Array)[];
};

/** Upload immutable host data into an operation-owned result on each execution. */
export class GPUUploadOperation implements GPUOperation {
  readonly type = 'vector-upload';
  readonly id: string;
  readonly output: string;
  readonly format: GPUGraphVectorFormat;
  private readonly chunks: readonly Uint8Array[];
  readonly chunkLengths: readonly number[];

  constructor(props: GPUUploadOperationProps) {
    this.id = props.id ?? `${props.output}-upload`;
    this.output = props.output;
    this.format = props.format;
    const info = getGPUVectorFormatInfo(props.format);
    const chunks = Array.isArray(props.data) ? props.data : [props.data];
    const ValueType =
      info.signedDataType === 'float32'
        ? Float32Array
        : info.signedDataType === 'uint32'
          ? Uint32Array
          : Int32Array;
    // Host component types and complete rows must agree with the declared memory format.
    assert(
      chunks.every(chunk => chunk instanceof ValueType && chunk.byteLength % info.byteLength === 0)
    );
    this.chunks = chunks.map(chunk =>
      new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength).slice()
    );
    this.chunkLengths = Object.freeze(this.chunks.map(chunk => chunk.byteLength / info.byteLength));
  }

  /** Backend snapshot; callers cannot mutate the operation's stored data. @internal */
  getData(): readonly Uint8Array[] {
    return this.chunks.map(chunk => chunk.slice());
  }

  get contract(): GPUOperationContract {
    const shape = {
      length: this.chunkLengths.reduce((sum, length) => sum + length, 0),
      chunkLengths: this.chunkLengths
    };
    return {
      outputs: {[this.output]: gpuGraph.vector(this.format, shape)},
      values: [{value: this.output, access: 'write', shape}]
    };
  }
}

export type GPUCopyOperationProps = {id?: string; input: string; output: string};

/** Copy every row into independent storage, preserving format and chunk boundaries. */
export class GPUCopyOperation implements GPUOperation {
  readonly type = 'vector-copy';
  readonly id: string;
  readonly input: string;
  readonly output: string;
  constructor(props: GPUCopyOperationProps) {
    this.id = props.id ?? `${props.output}-copy`;
    this.input = props.input;
    this.output = props.output;
  }
  get contract(): GPUOperationContract {
    return {
      outputs: ({getValue}) => {
        const input = getValue(this.input);
        // Copy is a vector transfer, not a scalar assignment or conversion.
        if (input.type === 'texture')
          return {[this.output]: gpuGraph.texture({...input, extent: {like: this.input}})};
        assert(input.type === 'vector');
        return {
          [this.output]: gpuGraph.vector(input.format, {
            length: input.length,
            chunkLengths: input.chunkLengths
          })
        };
      },
      values: [
        {value: this.input, access: 'read', textureUsage: 'copy-source'},
        {
          value: this.output,
          access: 'write',
          shape: {like: this.input},
          textureUsage: 'copy-destination'
        }
      ]
    };
  }
}
