// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GPUOperation, GPUOperationMetadata} from './gpu-operation';
import type {GPUProgramVector} from './gpu-program-value';

export type GPUGroupAggregationOperation = 'count' | 'sum' | 'min' | 'max' | 'mean';

type GPUGroupAggregationBaseProps = {
  id?: string;
  keys: GPUProgramVector<'uint32'>;
  mask?: GPUProgramVector<'uint32'>;
};

export type GPUGroupAggregationProps = GPUGroupAggregationBaseProps &
  (
    | {
        operation?: 'count';
        output: GPUProgramVector<'uint32'>;
        values?: never;
      }
    | {
        operation: Exclude<GPUGroupAggregationOperation, 'count'>;
        values: GPUProgramVector<'float32'>;
        output: GPUProgramVector<'float32'>;
      }
  );

/** Semantic dense grouped aggregation over logical GPU vectors. */
export class GPUGroupAggregation implements GPUOperation {
  readonly type = 'group-aggregation';
  readonly id: string;
  readonly metadata: GPUOperationMetadata;
  readonly operation: GPUGroupAggregationOperation;

  constructor(readonly props: GPUGroupAggregationProps) {
    this.id = props.id ?? 'gpu-group-aggregation';
    this.operation = props.operation ?? 'count';
    if (props.mask && props.keys.length !== props.mask.length) {
      throw new Error(`${this.id} keys and mask lengths must match`);
    }
    if (props.output.length <= 0) {
      throw new Error(`${this.id} requires at least one dense output group`);
    }
    if (this.operation !== 'count') {
      if (!props.values || props.values.length !== props.keys.length) {
        throw new Error(`${this.id} ${this.operation} requires one float32 value per key`);
      }
      if (props.output.format !== 'float32') {
        throw new Error(`${this.id} ${this.operation} output must be float32`);
      }
    } else if (props.output.format !== 'uint32') {
      throw new Error(`${this.id} count output must be uint32`);
    }

    this.metadata = Object.freeze({
      inputs: Object.freeze([
        {name: props.keys.id, kind: 'vector', format: 'uint32', shape: [props.keys.length]},
        ...(props.values
          ? [{name: props.values.id, kind: 'vector', format: 'float32', shape: [props.values.length]}]
          : []),
        ...(props.mask
          ? [{name: props.mask.id, kind: 'mask', format: 'uint32', shape: [props.mask.length]}]
          : [])
      ]),
      outputs: Object.freeze([
        {name: props.output.id, kind: 'vector', format: props.output.format, shape: [props.output.length]}
      ]),
      workload: Object.freeze({
        elements: props.keys.length,
        groups: props.output.length,
        operation: this.operation
      })
    });
  }
}

/** @deprecated Prefer GPUGroupAggregation with operation: 'count'. */
export class GPUGroupCount extends GPUGroupAggregation {
  constructor(props: {
    id?: string;
    keys: GPUProgramVector<'uint32'>;
    mask?: GPUProgramVector<'uint32'>;
    output: GPUProgramVector<'uint32'>;
  }) {
    super({...props, operation: 'count'});
  }
}

/** @deprecated Prefer GPUGroupAggregation. */
export {GPUGroupCount as GPUProgramGroupCount};
