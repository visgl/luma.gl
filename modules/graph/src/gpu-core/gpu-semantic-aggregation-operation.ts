// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {assert} from '@luma.gl/core';
import {gpuGraph, type GPUGraphVector} from './gpu-graph-value';
import type {GPUOperation} from './gpu-operation';
import {getGPUOperationValueName, type GPUOperationContract} from './gpu-operation-contract';
import type {GPUGroupAggregationOperation} from './gpu-group-aggregation';
import type {GPUReductionOperation} from './gpu-reduction';

type ScalarFormat = 'uint32' | 'sint32' | 'float32';

/** Logical inputs and destination for dense grouped statistics. */
export type GPUGraphGroupAggregationProps = {
  /** Stable operation identifier. Defaults to the output name plus a suffix. */
  id?: string;
  /** Dense unsigned group keys; out-of-range keys are ignored. */
  keys: string | GPUGraphVector<'uint32'>;
  /** Optional row selection: zero rejects, nonzero accepts. */
  mask?: string | GPUGraphVector<'uint32'>;
  /** Output cardinality. May be omitted when output storage/shape is declared separately. */
  groupCount?: number;
} & (
  | {
      /** Count accepted rows per group. */
      operation: 'count';
      /** Logical unsigned count destination. */
      output: string | GPUGraphVector<'uint32'>;
      values?: never;
    }
  | {
      /** Statistic computed over finite float32 contributions. */
      operation: Exclude<GPUGroupAggregationOperation, 'count'>;
      /** One float32 contribution per key. */
      values: string | GPUGraphVector<'float32'>;
      /** Logical float32 statistic destination. */
      output: string | GPUGraphVector<'float32'>;
    }
);

/** Dense grouped statistics lowered to GPUGroupAggregation by GPUGraphCompiler. */
export class GPUGraphGroupAggregation implements GPUOperation {
  /** Semantic operation discriminator. */
  readonly type = 'group-aggregation';
  /** Stable operation identifier. */
  readonly id: string;
  /** Immutable logical operation arguments. */
  readonly props: Readonly<GPUGraphGroupAggregationProps>;

  /** Describe grouped reduction without allocating or reading GPU storage. */
  constructor(props: GPUGraphGroupAggregationProps) {
    // Dense group destinations must have positive integer cardinality.
    assert(
      props.groupCount === undefined ||
        (Number.isSafeInteger(props.groupCount) && props.groupCount > 0)
    );
    this.id = props.id ?? `${getGPUOperationValueName(props.output)}-group-aggregation`;
    this.props = Object.freeze({...props});
  }

  /** Logical dependencies and optional inferred output shape. */
  get contract(): GPUOperationContract {
    const {keys, mask, output, groupCount} = this.props;
    const values = this.props.operation === 'count' ? undefined : this.props.values;
    return {
      outputs: ({getValue}) => {
        for (const input of [keys, mask]) {
          if (input) {
            const descriptor = getValue(getGPUOperationValueName(input));
            assert(descriptor.type === 'vector' && descriptor.format === 'uint32');
          }
        }
        if (values) {
          const descriptor = getValue(getGPUOperationValueName(values));
          assert(descriptor.type === 'vector' && descriptor.format === 'float32');
        }
        return {
          [getGPUOperationValueName(output)]: gpuGraph.vector(
            this.props.operation === 'count' ? 'uint32' : 'float32',
            {length: groupCount}
          )
        };
      },
      values: [
        {value: keys, access: 'read'},
        ...(values ? [{value: values, access: 'read' as const}] : []),
        ...(mask ? [{value: mask, access: 'read' as const}] : []),
        {value: output, access: 'write'}
      ]
    };
  }
}

/** Logical scalar reduction inputs and destination. */
export type GPUGraphReductionProps = {
  /** Stable operation identifier. Defaults to the output name plus a suffix. */
  id?: string;
  /** Scalar uint32, sint32, or float32 input. */
  input: string | GPUGraphVector<ScalarFormat>;
  /** Optional nonzero/zero row selection. */
  mask?: string | GPUGraphVector<'uint32'>;
  /** Statistic to compute; extent produces minimum followed by maximum. */
  operation: GPUReductionOperation;
  /** Logical result destination, with the same format as input. */
  output: string | GPUGraphVector<ScalarFormat>;
};

/** Scalar statistics lowered to GPUReduction by GPUGraphCompiler. */
export class GPUGraphReduction implements GPUOperation {
  /** Semantic operation discriminator. */
  readonly type = 'reduction';
  /** Stable operation identifier. */
  readonly id: string;
  /** Immutable logical operation arguments. */
  readonly props: Readonly<GPUGraphReductionProps>;

  /** Describe a scalar reduction without allocating or reading GPU storage. */
  constructor(props: GPUGraphReductionProps) {
    this.id = props.id ?? `${getGPUOperationValueName(props.output)}-reduction`;
    this.props = Object.freeze({...props});
  }

  /** Infer a packed one-row result, or two rows for extent. */
  get contract(): GPUOperationContract {
    const {input, mask, output, operation} = this.props;
    return {
      outputs: ({getValue}) => {
        const descriptor = getValue(getGPUOperationValueName(input));
        assert(descriptor.type === 'vector');
        const {format} = descriptor;
        assert(format === 'uint32' || format === 'sint32' || format === 'float32');
        if (mask) {
          const selection = getValue(getGPUOperationValueName(mask));
          assert(selection.type === 'vector' && selection.format === 'uint32');
        }
        return {
          [getGPUOperationValueName(output)]: gpuGraph.vector(format, {
            length: operation === 'extent' ? 2 : 1
          })
        };
      },
      values: [
        {value: input, access: 'read'},
        ...(mask ? [{value: mask, access: 'read' as const}] : []),
        {value: output, access: 'write'}
      ]
    };
  }
}
