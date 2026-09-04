// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Buffer, SignedDataType} from '@luma.gl/core';
import {fromHalfFloat, toHalfFloat} from '@luma.gl/shadertools';
import {getGPUVectorFormatInfo} from '../../gpu-data/gpu-vector-format';
import type {GPUDataEvaluator} from '../../operation/gpu-data-evaluator';
import type {OperationHandler} from '../../operation/operation';
import type {CastDataInputs} from '../cast-data';

/** CPU fallback for fixed-width numeric format conversion. */
export const castData: OperationHandler<CastDataInputs> = ({inputs, output, target}) => {
  return executeCastData(inputs, output, target);
};

async function executeCastData(inputs: CastDataInputs, output: GPUDataEvaluator, target: Buffer) {
  const sourceValues = await inputs.source.ensureCPUValue();
  const inputInfo = getGPUVectorFormatInfo(inputs.inputFormat);
  const outputInfo = getGPUVectorFormatInfo(inputs.outputFormat);
  const result = new output.ValueType(output.length * output.size);
  const sourceOffset = inputs.source.offset / inputs.source.ValueType.BYTES_PER_ELEMENT;
  const sourceStride = inputs.source.stride / inputs.source.ValueType.BYTES_PER_ELEMENT;

  for (let rowIndex = 0; rowIndex < output.length; rowIndex++) {
    for (let componentIndex = 0; componentIndex < output.size; componentIndex++) {
      const sourceValue = sourceValues[sourceOffset + rowIndex * sourceStride + componentIndex];
      const decodedValue = decodeValue(sourceValue, inputs.source.type, inputInfo.normalized);
      result[rowIndex * output.size + componentIndex] = encodeValue(
        decodedValue,
        output,
        outputInfo.normalized
      );
    }
  }
  target.write(result);
  return {success: true as const, value: result};
}

function decodeValue(value: number, type: SignedDataType, normalized: boolean): number {
  if (type === 'float16') return fromHalfFloat(value);
  if (!normalized) return value;
  const {minimum, maximum} = getIntegerRange(type);
  return Math.max(value / maximum, minimum < 0 ? -1 : 0);
}

function encodeValue(value: number, output: GPUDataEvaluator, normalized: boolean): number {
  if (output.type === 'float16') return toHalfFloat(value);
  if (!normalized && output.type === 'float32') return value;
  const {minimum, maximum} = getIntegerRange(output.type);
  const converted = normalized ? value * maximum : value;
  return Math.round(Math.min(maximum, Math.max(minimum, converted)));
}

function getIntegerRange(type: SignedDataType): {minimum: number; maximum: number} {
  switch (type) {
    case 'sint8':
      return {minimum: -127, maximum: 127};
    case 'sint16':
      return {minimum: -32767, maximum: 32767};
    case 'sint32':
      return {minimum: -2147483648, maximum: 2147483647};
    case 'uint8':
      return {minimum: 0, maximum: 255};
    case 'uint16':
      return {minimum: 0, maximum: 65535};
    case 'uint32':
      return {minimum: 0, maximum: 4294967295};
    default:
      throw new Error(`castData CPU output does not support ${type}`);
  }
}
