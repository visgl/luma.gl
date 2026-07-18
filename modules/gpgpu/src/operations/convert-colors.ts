// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  getGPUDataEvaluator,
  GPUDataEvaluator,
  type GPUDataEvaluatorInput
} from '../operation/gpu-data-evaluator';
import {Operation} from '../operation/operation';

export type ColorInputFormat =
  | 'uint8x3'
  | 'uint8x4'
  | 'float16x3'
  | 'float16x4'
  | 'float32x3'
  | 'float32x4';

export type ConvertColorsProps = {
  inputFormat?: ColorInputFormat;
};

export type ConvertColorsInputs = {
  source: GPUDataEvaluator;
  inputFormat: ColorInputFormat;
};

class ConvertColorsOperation extends Operation<ConvertColorsInputs> {
  name = 'convertColors';

  output: GPUDataEvaluator;

  constructor(source: GPUDataEvaluator, inputFormat: ColorInputFormat) {
    super({source, inputFormat});

    this.output = new GPUDataEvaluator({
      id: `convertColors(${source})`,
      type: 'uint8',
      size: 4,
      normalized: true,
      format: 'unorm8x4',
      length: source.length,
      source: this
    });
  }

  toString(): string {
    return `convertColors(${this.inputs.source})`;
  }
}

/** Converts one fixed-width GPU data range to normalized Uint8 RGBA values. */
export function convertColorData(
  source: GPUDataEvaluatorInput,
  props: ConvertColorsProps = {}
): GPUDataEvaluator {
  const sourceEvaluator = getGPUDataEvaluator(source);
  const inputFormat = props.inputFormat ?? getColorInputFormat(sourceEvaluator);
  return new ConvertColorsOperation(sourceEvaluator, inputFormat).output;
}

function getColorInputFormat(source: GPUDataEvaluator): ColorInputFormat {
  const format = `${source.type}x${source.size}`;
  switch (format) {
    case 'uint8x3':
    case 'uint8x4':
    case 'float16x3':
    case 'float16x4':
    case 'float32x3':
    case 'float32x4':
      return format;
    default:
      throw new Error(`convertColors unsupported input format ${format}`);
  }
}
