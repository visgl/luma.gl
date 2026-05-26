// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {getArrowDataType} from '@luma.gl/tables';
import {
  getGPUTableEvaluator,
  GPUTableEvaluator,
  type GPUTableEvaluatorInput
} from '../operation/gpu-table-evaluator';
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
  source: GPUTableEvaluator;
  inputFormat: ColorInputFormat;
};

class ConvertColorsOperation extends Operation<ConvertColorsInputs> {
  name = 'convert-colors';

  output: GPUTableEvaluator;

  constructor(source: GPUTableEvaluator, inputFormat: ColorInputFormat) {
    super({source, inputFormat});

    this.output = new GPUTableEvaluator({
      id: `convertColors(${source})`,
      type: 'uint8',
      size: 4,
      normalized: true,
      length: source.length,
      dataType: getArrowDataType('uint8', 4),
      source: this
    });
  }

  toString(): string {
    return `convertColors(${this.inputs.source})`;
  }
}

export function convertColorTable(
  source: GPUTableEvaluatorInput,
  props: ConvertColorsProps = {}
): GPUTableEvaluator {
  const sourceEvaluator = getGPUTableEvaluator(source);
  const inputFormat = props.inputFormat ?? getColorInputFormat(sourceEvaluator);
  return new ConvertColorsOperation(sourceEvaluator, inputFormat).output;
}

function getColorInputFormat(source: GPUTableEvaluator): ColorInputFormat {
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
