// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {fromHalfFloat} from '@luma.gl/shadertools';
import type {TypedArray} from '@math.gl/types';
import type {OperationHandler} from '../../operation/operation';
import type {ConvertColorsInputs} from '../convert-colors';

export const convertColors: OperationHandler<ConvertColorsInputs> = async ({
  inputs,
  output,
  target
}) => {
  const {source, inputFormat} = inputs;
  const sourceValue = source.value ?? (await source.readValue());
  const result = new output.ValueType(output.length * output.size);
  const inputSize = inputFormat.endsWith('x3') ? 3 : 4;

  for (let rowIndex = 0; rowIndex < output.length; rowIndex++) {
    const inputOffset =
      source.offset / source.ValueType.BYTES_PER_ELEMENT +
      rowIndex * (source.stride / source.ValueType.BYTES_PER_ELEMENT);
    const outputOffset = rowIndex * 4;

    result[outputOffset] = convertColorChannel(sourceValue, inputOffset, inputFormat);
    result[outputOffset + 1] = convertColorChannel(sourceValue, inputOffset + 1, inputFormat);
    result[outputOffset + 2] = convertColorChannel(sourceValue, inputOffset + 2, inputFormat);
    result[outputOffset + 3] =
      inputSize === 4 ? convertColorChannel(sourceValue, inputOffset + 3, inputFormat) : 255;
  }

  target.write(result);
  return {success: true, value: result};
};

function convertColorChannel(values: TypedArray, index: number, inputFormat: string): number {
  if (inputFormat.startsWith('uint8')) {
    return values[index];
  }

  const value = inputFormat.startsWith('float16') ? getFloat16Value(values, index) : values[index];
  return Math.round(Math.min(Math.max(value, 0), 1) * 255);
}

function getFloat16Value(values: TypedArray, index: number): number {
  const Float16ArrayConstructor = getNativeFloat16ArrayConstructor();
  if (Float16ArrayConstructor && values.constructor === Float16ArrayConstructor) {
    return values[index];
  }
  return fromHalfFloat(values[index]);
}

function getNativeFloat16ArrayConstructor(): unknown {
  return (globalThis as typeof globalThis & {Float16Array?: unknown}).Float16Array;
}
