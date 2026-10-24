// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GPUOperation} from './gpu-operation';
import type {GPUGraphScalar, GPUGraphScalarFormat} from './gpu-graph-value';

/** Writes a host-known literal into backend-independent program scalar state. */
export class GPUGraphScalarLiteral<T extends GPUGraphScalarFormat = GPUGraphScalarFormat>
  implements GPUOperation
{
  readonly type = 'scalar-literal';
  readonly id: string;
  constructor(readonly props: {id?: string; output: GPUGraphScalar<T>; value: number}) {
    this.id = props.id ?? `${props.output.id}-literal`;
    if (!Number.isFinite(props.value)) throw new Error(`${this.id} value must be finite`);
    if (props.output.format !== 'float32' && !Number.isInteger(props.value))
      throw new Error(`${this.id} integer scalar literal must be an integer`);
  }
}
