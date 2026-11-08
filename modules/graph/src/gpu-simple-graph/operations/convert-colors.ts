// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

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

import type {ColorOutputFormat} from '../../gpu-data/color-conversion';
export type {ColorOutputFormat} from '../../gpu-data/color-conversion';

export type ConvertColorsProps = {
  format?: ColorOutputFormat;
  inputFormat?: ColorInputFormat;
};

export type ConvertColorsInputs = {
  source: GPUDataEvaluator;
  inputFormat: ColorInputFormat;
  outputFormat: ColorOutputFormat;
};

class ConvertColorsOperation extends Operation<ConvertColorsInputs> {
  name = 'convertColors';

  output: GPUDataEvaluator;

  constructor(
    source: GPUDataEvaluator,
    inputFormat: ColorInputFormat,
    outputFormat: ColorOutputFormat
  ) {
    super({source, inputFormat, outputFormat});

    this.output = new GPUDataEvaluator({
      id: `convertColors(${source})`,
      type:
        outputFormat === 'unorm8x4'
          ? 'uint8'
          : outputFormat === 'float16x4'
            ? 'float16'
            : 'float32',
      size: 4,
      normalized: outputFormat === 'unorm8x4',
      format: outputFormat,
      length: source.length,
      source: this
    });
  }

  toString(): string {
    return `convertColors(${this.inputs.source})`;
  }
}

/** Converts one fixed-width color range to RGBA8, binary16 or binary32 RGBA storage. */
export function convertColorData(
  source: GPUDataEvaluatorInput,
  props: ConvertColorsProps = {}
): GPUDataEvaluator {
  const sourceEvaluator = getGPUDataEvaluator(source);
  const inputFormat = props.inputFormat ?? getColorInputFormat(sourceEvaluator);
  return new ConvertColorsOperation(sourceEvaluator, inputFormat, props.format ?? 'unorm8x4')
    .output;
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
