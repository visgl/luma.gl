// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GPUOperation} from './gpu-operation';
import type {GPUProgramScalar, GPUProgramScalarFormat, GPUProgramVector} from './gpu-program-value';

/** Writes a host-known literal into backend-independent program scalar state. */
export class GPUProgramScalarLiteral<T extends GPUProgramScalarFormat = GPUProgramScalarFormat>
  implements GPUOperation {
  readonly type = 'scalar-literal';
  readonly id: string;
  constructor(
    readonly props: {id?: string; output: GPUProgramScalar<T>; value: number}
  ) {
    this.id = props.id ?? `${props.output.id}-literal`;
    if (!Number.isFinite(props.value)) throw new Error(`${this.id} value must be finite`);
    if (props.output.format !== 'float32' && !Number.isInteger(props.value)) {
      throw new Error(`${this.id} integer scalar literal must be an integer`);
    }
  }
}

/** Copies one dense vector into another without exposing backend storage. */
export class GPUProgramVectorCopy implements GPUOperation {
  readonly type = 'vector-copy';
  readonly id: string;
  constructor(
    readonly props: {id?: string; input: GPUProgramVector; output: GPUProgramVector}
  ) {
    this.id = props.id ?? 'gpu-vector-copy';
    if (props.input.format !== props.output.format || props.input.length !== props.output.length) {
      throw new Error(`${this.id} input and output vector shapes must match`);
    }
  }
}
