// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GPUOperation, GPUOperationMetadata} from './gpu-operation';
import type {GPUGraphScalar, GPUGraphVector} from './gpu-graph-value';

/** Semantic broadcast multiply-add: output = scale * input + addend. */
export class GPUGraphVectorMADD implements GPUOperation {
  readonly type = 'vector-madd';
  readonly id: string;
  readonly metadata: GPUOperationMetadata;
  constructor(
    readonly props: {
      id?: string;
      input: GPUGraphVector<'float32'>;
      scale: GPUGraphScalar<'float32'>;
      addend: GPUGraphVector<'float32'>;
      output: GPUGraphVector<'float32'>;
    }
  ) {
    this.id = props.id ?? 'gpu-vector-madd';
    if (
      [props.input.length, props.addend.length, props.output.length]
        .filter(length => length !== undefined)
        .some((length, _, lengths) => length !== lengths[0])
    ) {
      throw new Error(`${this.id} vector lengths must match`);
    }
    this.metadata = Object.freeze(
      props.output.length === undefined ? {} : {workload: {elements: props.output.length}}
    );
  }
}

/** Semantic float32 dot product writing one scalar. */
export class GPUGraphDotProduct implements GPUOperation {
  readonly type = 'dot-product';
  readonly id: string;
  readonly metadata: GPUOperationMetadata;
  constructor(
    readonly props: {
      id?: string;
      left: GPUGraphVector<'float32'>;
      right: GPUGraphVector<'float32'>;
      output: GPUGraphScalar<'float32'>;
    }
  ) {
    this.id = props.id ?? 'gpu-dot-product';
    if (
      props.left.length !== undefined &&
      props.right.length !== undefined &&
      props.left.length !== props.right.length
    )
      throw new Error(`${this.id} vector lengths must match`);
    this.metadata = Object.freeze(
      props.left.length === undefined ? {} : {workload: {elements: props.left.length}}
    );
  }
}
