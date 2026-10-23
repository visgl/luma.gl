// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {vertexFormatDecoder} from '@luma.gl/core';
import type {GPUVectorFormat} from '@luma.gl/gpgpu/gpu-data';
import {GPUDataEvaluator, GPUVectorEvaluator} from '@luma.gl/gpgpu';
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
  if (evaluator instanceof GPUVectorEvaluator) {
    const formats = evaluator.gpuDataEvaluators.map(getSimpleGraphEvaluatorFormat);
    return formats.every(format => format === formats[0]) ? formats[0] : undefined;
  }
  const components = evaluator.size;
  if (components !== 1 && components !== 2 && components !== 3 && components !== 4)
    return undefined;
  // The constructor helper excludes these WebGL-only formats; the decoder still validates them.
  if (
    components === 3 &&
    !evaluator.normalized &&
    (evaluator.type === 'uint8' || evaluator.type === 'sint8')
  ) {
    const format = evaluator.type === 'uint8' ? 'uint8x3-webgl' : 'sint8x3-webgl';
    vertexFormatDecoder.getVertexFormatInfo(format);
    return format;
  }
  try {
    return vertexFormatDecoder.makeVertexFormat(evaluator.type, components, evaluator.normalized);
  } catch {
    // Some evaluator layouts have no canonical vertex format (for example interleaved rows).
    return undefined;
  }
}
