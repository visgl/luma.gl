// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GPUVectorFormat} from '@luma.gl/graph/gpu-data';
import {GPUDataEvaluator} from './operation/gpu-data-evaluator';
import {GPUVectorEvaluator} from './operation/gpu-vector-evaluator';
import {getGPUDataEvaluatorFormat} from './operation/gpu-evaluator-inspection';
import type {GPUOperation, GPUOperationMetadata} from '@luma.gl/graph/gpu-core';

export type GPUSimpleGraphEvaluator = GPUDataEvaluator | GPUVectorEvaluator;

/** Semantic operation that borrows an existing lazy evaluator and its result. */
export class GPUSimpleGraphOperation<
  Evaluator extends GPUSimpleGraphEvaluator = GPUSimpleGraphEvaluator
> implements GPUOperation
{
  readonly id: string;
  readonly type = 'simple-graph-evaluator';
  readonly evaluator: Evaluator;

  constructor(props: {id: string; evaluator: Evaluator}) {
    this.id = props.id;
    this.evaluator = props.evaluator;
  }

  get metadata(): GPUOperationMetadata {
    return {
      outputs: [
        {
          name: this.id,
          kind: 'vector',
          format: getSimpleGraphEvaluatorFormat(this.evaluator),
          shape: [this.evaluator.length]
        }
      ]
    };
  }
}

/** Resolve pre-execution storage metadata without allocating or evaluating GPU data. */
export function getSimpleGraphEvaluatorFormat(
  evaluator: GPUSimpleGraphEvaluator
): GPUVectorFormat | undefined {
  if (evaluator.format) return evaluator.format;
  if (evaluator instanceof GPUDataEvaluator) return getGPUDataEvaluatorFormat(evaluator);
  const formats = evaluator.gpuDataEvaluators.map(getGPUDataEvaluatorFormat);
  return formats.every(format => format === formats[0]) ? formats[0] : undefined;
}
