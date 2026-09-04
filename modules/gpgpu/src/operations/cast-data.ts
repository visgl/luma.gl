// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {VertexFormat} from '@luma.gl/core';
import {getGPUVectorFormatInfo} from '../gpu-data/gpu-vector-format';
import {
  getGPUDataEvaluator,
  GPUDataEvaluator,
  type GPUDataEvaluatorInput
} from '../operation/gpu-data-evaluator';
import {Operation} from '../operation/operation';

/** Options for converting one fixed-width numeric GPU data range. */
export type CastDataProps = {
  /** Source format when it is not retained by the input evaluator. */
  inputFormat?: VertexFormat;
  /** Required fixed-width output memory format. */
  outputFormat: VertexFormat;
};

/** Inputs retained by the backend-neutral numeric cast operation. */
export type CastDataInputs = {
  source: GPUDataEvaluator;
  inputFormat: VertexFormat;
  outputFormat: VertexFormat;
};

class CastDataOperation extends Operation<CastDataInputs> {
  name = 'castData';

  output: GPUDataEvaluator;

  constructor(source: GPUDataEvaluator, inputFormat: VertexFormat, outputFormat: VertexFormat) {
    super({source, inputFormat, outputFormat});
    const inputInfo = getGPUVectorFormatInfo(inputFormat);
    const outputInfo = getGPUVectorFormatInfo(outputFormat);
    if (inputInfo.components !== outputInfo.components) {
      throw new Error('castData requires matching fixed-width component counts');
    }

    this.output = new GPUDataEvaluator({
      id: `castData(${source}, ${outputFormat})`,
      type: outputInfo.signedDataType,
      size: outputInfo.components,
      normalized: outputInfo.normalized,
      format: outputFormat,
      length: source.length,
      source: this
    });
  }

  toString(): string {
    return `castData(${this.inputs.source}, ${this.inputs.outputFormat})`;
  }
}

/** Lazily converts fixed-width numeric GPU rows into another physical format. */
export function castData(source: GPUDataEvaluatorInput, props: CastDataProps): GPUDataEvaluator {
  const sourceEvaluator = getGPUDataEvaluator(source);
  const inputFormat = props.inputFormat ?? sourceEvaluator.format;
  if (!inputFormat) {
    throw new Error('castData requires an input format');
  }
  return new CastDataOperation(sourceEvaluator, inputFormat as VertexFormat, props.outputFormat)
    .output;
}
