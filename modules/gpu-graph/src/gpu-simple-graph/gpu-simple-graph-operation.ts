// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GPUDataEvaluator, GPUVectorEvaluator} from '@luma.gl/gpgpu';
import type {GPUOperation, GPUOperationMetadata} from '@luma.gl/gpu-graph/gpu-core';

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
          format: this.evaluator.format,
          shape: [this.evaluator.length]
        }
      ]
    };
  }
}
