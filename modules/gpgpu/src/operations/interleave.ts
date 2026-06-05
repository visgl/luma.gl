// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  getGPUDataEvaluator,
  GPUDataEvaluator,
  type GPUDataEvaluatorInput
} from '../operation/gpu-data-evaluator';
import {Operation} from '../operation/operation';
import {deduceOutputProps} from '../utils/output-props';
import type {SignedDataType} from '@luma.gl/core';
import type {GPUVectorFormat} from '@luma.gl/tables';
import type {
  AddComponentCounts,
  GPUVectorFormatComponentCount,
  GPUVectorFormatFromTypeAndSize,
  GPUVectorFormatIsNormalized,
  GPUVectorFormatSignedDataType,
  JoinSignedDataTypes
} from '../operation/gpu-table-format-types';

type InterleaveInputs = readonly [GPUDataEvaluatorInput, ...GPUDataEvaluatorInput[]];

type InterleaveInputFormat<InputT> =
  InputT extends GPUDataEvaluatorInput<infer FormatT> ? FormatT : never;

type JoinInterleaveInputDataTypes<
  InputsT extends readonly unknown[],
  CurrentTypeT extends SignedDataType | null = null
> = InputsT extends readonly [infer FirstT, ...infer RestT]
  ? InterleaveInputFormat<FirstT> extends infer FormatT extends GPUVectorFormat
    ? [FormatT] extends [never]
      ? JoinInterleaveInputDataTypes<RestT, CurrentTypeT>
      : JoinInterleaveInputDataTypes<
          RestT,
          CurrentTypeT extends SignedDataType
            ? JoinSignedDataTypes<CurrentTypeT, GPUVectorFormatSignedDataType<FormatT>>
            : GPUVectorFormatSignedDataType<FormatT>
        >
    : JoinInterleaveInputDataTypes<RestT, CurrentTypeT>
  : CurrentTypeT extends SignedDataType
    ? CurrentTypeT
    : 'float32';

type HasNormalizedInterleaveInput<InputsT extends readonly unknown[]> = InputsT extends readonly [
  infer FirstT,
  ...infer RestT
]
  ? InterleaveInputFormat<FirstT> extends infer FormatT extends GPUVectorFormat
    ? [FormatT] extends [never]
      ? HasNormalizedInterleaveInput<RestT>
      : GPUVectorFormatIsNormalized<FormatT> extends true
        ? true
        : HasNormalizedInterleaveInput<RestT>
    : HasNormalizedInterleaveInput<RestT>
  : false;

type SumInterleaveInputComponentCounts<
  InputsT extends readonly unknown[],
  CurrentSizeT extends number = 0
> = InputsT extends readonly [infer FirstT, ...infer RestT]
  ? InterleaveInputFormat<FirstT> extends infer FormatT extends GPUVectorFormat
    ? [FormatT] extends [never]
      ? SumInterleaveInputComponentCounts<RestT, CurrentSizeT>
      : SumInterleaveInputComponentCounts<
          RestT,
          AddComponentCounts<CurrentSizeT, GPUVectorFormatComponentCount<FormatT>>
        >
    : SumInterleaveInputComponentCounts<RestT, CurrentSizeT>
  : CurrentSizeT;

type PromoteNormalizedInterleaveDataType<
  TypeT extends SignedDataType,
  HasNormalizedT extends boolean
> = TypeT extends `float${string}` ? TypeT : HasNormalizedT extends true ? 'float32' : TypeT;

type InterleaveOutputFormat<InputsT extends readonly unknown[]> = GPUVectorFormatFromTypeAndSize<
  PromoteNormalizedInterleaveDataType<
    JoinInterleaveInputDataTypes<InputsT>,
    HasNormalizedInterleaveInput<InputsT>
  >,
  SumInterleaveInputComponentCounts<InputsT>
>;

/** Deferred row interleave operation. */
class InterleaveOperation extends Operation<{x: GPUDataEvaluator; y: GPUDataEvaluator}> {
  /** Operation name used for backend lookup. */
  name = 'interleave';

  /** Lazy output table for the interleaved result. */
  output: GPUDataEvaluator;

  constructor(x: GPUDataEvaluator, y: GPUDataEvaluator) {
    super({x, y});

    const {isConstant, type, length} = deduceOutputProps(x, y);
    this.output = new GPUDataEvaluator({
      isConstant,
      type,
      size: x.size + y.size,
      length,
      source: this
    });
  }

  /** Returns a compact expression for debug output. */
  toString(): string {
    const {x, y} = this.inputs;
    return `_${x}_${y}_`;
  }
}

/**
 * Concatenates each input row in argument order.
 *
 * The returned table is lazy; no CPU or GPU work is performed until
 * {@link GPUDataEvaluator.evaluate} is called on the result.
 */
export function interleave<const InputsT extends InterleaveInputs>(
  ...args: InputsT
): GPUDataEvaluator<InterleaveOutputFormat<InputsT>>;
export function interleave(...args: GPUDataEvaluatorInput[]): GPUDataEvaluator {
  let result = getGPUDataEvaluator(args[0]);
  for (let i = 1; i < args.length; i++) {
    result = new InterleaveOperation(result, getGPUDataEvaluator(args[i])).output;
  }
  return result;
}
