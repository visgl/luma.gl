// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GPUOperation, GPUOperationMetadata} from './gpu-operation';
import type {GPUProgramVector, GPUProgramVectorFormat} from './gpu-program-value';
import type {GPUReductionOperation} from './gpu-reduction';

export type GPUProgramHistogramDomain = readonly [number, number];

/** Semantic equal-width histogram over a logical vector with an optional selection mask. */
export class GPUProgramHistogram<T extends GPUProgramVectorFormat = GPUProgramVectorFormat>
  implements GPUOperation
{
  readonly type = 'histogram';
  readonly id: string;
  readonly metadata: GPUOperationMetadata;

  constructor(
    readonly props: {
      id?: string;
      input: GPUProgramVector<T>;
      output: GPUProgramVector<'uint32'>;
      domain: GPUProgramHistogramDomain;
      mask?: GPUProgramVector<'uint32'>;
    }
  ) {
    this.id = props.id ?? 'gpu-histogram';
    if (props.output.length <= 0) throw new Error(`${this.id} requires at least one histogram bin`);
    if (props.mask && props.mask.length !== props.input.length) {
      throw new Error(`${this.id} input and mask lengths must match`);
    }
    const [minimum, maximum] = props.domain;
    if (!Number.isFinite(minimum) || !Number.isFinite(maximum) || maximum < minimum) {
      throw new Error(`${this.id} requires a finite ascending histogram domain`);
    }
    this.metadata = Object.freeze({
      inputs: Object.freeze([
        {name: props.input.id, kind: 'vector', format: props.input.format, shape: [props.input.length]},
        ...(props.mask
          ? [{name: props.mask.id, kind: 'mask', format: 'uint32', shape: [props.mask.length]}]
          : [])
      ]),
      outputs: Object.freeze([
        {name: props.output.id, kind: 'histogram', format: 'uint32', shape: [props.output.length]}
      ]),
      workload: Object.freeze({elements: props.input.length, bins: props.output.length})
    });
  }
}

/** Semantic scalar reduction over a logical vector with an optional selection mask. */
export class GPUProgramReduction<T extends GPUProgramVectorFormat = GPUProgramVectorFormat>
  implements GPUOperation
{
  readonly type = 'reduction';
  readonly id: string;
  readonly metadata: GPUOperationMetadata;

  constructor(
    readonly props: {
      id?: string;
      input: GPUProgramVector<T>;
      output: GPUProgramVector<T>;
      operation: GPUReductionOperation;
      mask?: GPUProgramVector<'uint32'>;
    }
  ) {
    this.id = props.id ?? 'gpu-reduction';
    if (props.mask && props.mask.length !== props.input.length) {
      throw new Error(`${this.id} input and mask lengths must match`);
    }
    const expectedLength = props.operation === 'extent' ? 2 : 1;
    if (props.output.length !== expectedLength) {
      throw new Error(`${this.id} ${props.operation} output must contain ${expectedLength} row(s)`);
    }
    if (props.output.format !== props.input.format) {
      throw new Error(`${this.id} input and output formats must match`);
    }
    this.metadata = Object.freeze({
      inputs: Object.freeze([
        {name: props.input.id, kind: 'vector', format: props.input.format, shape: [props.input.length]},
        ...(props.mask
          ? [{name: props.mask.id, kind: 'mask', format: 'uint32', shape: [props.mask.length]}]
          : [])
      ]),
      outputs: Object.freeze([
        {name: props.output.id, kind: 'reduction', format: props.output.format, shape: [props.output.length]}
      ]),
      workload: Object.freeze({elements: props.input.length, operation: props.operation})
    });
  }
}
