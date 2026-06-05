// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {assert} from '@luma.gl/core';
import {
  getGPUDataEvaluator,
  GPUDataEvaluator,
  type GPUDataEvaluatorInput
} from '../operation/gpu-data-evaluator';
import {Operation} from '../operation/operation';
import type {GPUVectorFormat} from '@luma.gl/tables';
import type {
  GPUVectorFormatComponentCount,
  GPUVectorFormatFromTypeAndSize
} from '../operation/gpu-table-format-types';

type Uint32GPUVectorFormat = 'uint32' | 'uint32x2' | 'uint32x3' | 'uint32x4';
type FroundOutputFormat<SourceFormatT extends GPUVectorFormat> = GPUVectorFormatFromTypeAndSize<
  'float32',
  GPUVectorFormatComponentCount<SourceFormatT>
>;

/** Deferred float64 split operation. */
class FroundOperation<SourceFormatT extends GPUVectorFormat> extends Operation<
  {x: GPUDataEvaluator<SourceFormatT>},
  GPUDataEvaluator<FroundOutputFormat<SourceFormatT>>
> {
  /** Operation name used for backend lookup. */
  name = 'fround';

  /** Lazy output table for high and low float32 components. */
  output: GPUDataEvaluator<FroundOutputFormat<SourceFormatT>>;

  constructor(x: GPUDataEvaluator<SourceFormatT>) {
    assert(x.type === 'uint32');
    super({x});

    const {isConstant, size, length} = x;
    this.output = new GPUDataEvaluator<FroundOutputFormat<SourceFormatT>>({
      isConstant,
      type: 'float32',
      size,
      length,
      source: this
    });
  }

  /** Returns a compact expression for debug output. */
  toString(): string {
    const {x} = this.inputs;
    return `fround(${x})_fp64Low(${x})`;
  }
}

/**
 * Splits float64 values into high and low float32 components for fp64-style arithmetic.
 *
 * `GPUDataEvaluator.fromArray()` represents `Float64Array` input as `uint32` pairs; `fround()` consumes
 * that representation and returns a lazy `float32` table containing high values followed by
 * residual low values.
 */
export function fround<SourceFormatT extends Uint32GPUVectorFormat>(
  x: GPUDataEvaluatorInput<SourceFormatT>
): GPUDataEvaluator<FroundOutputFormat<SourceFormatT>>;
export function fround(x: GPUDataEvaluatorInput): GPUDataEvaluator {
  return new FroundOperation(getGPUDataEvaluator(x)).output;
}
