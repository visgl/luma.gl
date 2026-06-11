// deck.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Buffer, TypedArray} from '@luma.gl/core';
import {GPUDataEvaluator} from '../../operation/gpu-data-evaluator';
import type {OperationHandlerResult} from '../../operation/operation';

type CPUTransformProps =
  | {
      elementWise: true;
      func: (...args: number[]) => number;
      inputs: {[name: string]: GPUDataEvaluator};
      output: GPUDataEvaluator;
      outputBuffer: Buffer;
    }
  | {
      elementWise?: false;
      func: (...args: TypedArray[]) => void;
      inputs: {[name: string]: GPUDataEvaluator};
      output: GPUDataEvaluator;
      outputBuffer: Buffer;
    };

export function runCPUTransform({
  elementWise,
  func,
  inputs,
  output,
  outputBuffer
}: CPUTransformProps): OperationHandlerResult {
  // validate
  for (const id in inputs) {
    const value = inputs[id].value;
    if (!value) throw new Error(`${inputs[id]} does not have CPU value`);
  }

  const vertexCount = output.length;
  const outputSize = output.size;
  const target = new output.ValueType(vertexCount * outputSize);
  for (let i = 0; i < vertexCount; i++) {
    const inputVertices = Object.values(inputs).map(table => getValueAtRow(table, i));
    if (elementWise) {
      for (let j = 0; j < outputSize; j++) {
        target[i * outputSize + j] = func.apply(
          null,
          inputVertices.map(v => v[j])
        );
      }
    } else {
      func.call(
        null,
        target.subarray(i * outputSize, i * outputSize + outputSize),
        ...inputVertices
      );
    }
  }
  outputBuffer.write(target);
  return {
    success: true,
    value: target
  };
}

export function getValueAtRow(source: GPUDataEvaluator, index: number): TypedArray {
  const value = source.value!;
  const valueSize = source.size;
  const valueOffset = source.offset / source.ValueType.BYTES_PER_ELEMENT;
  const valueStride = source.stride / source.ValueType.BYTES_PER_ELEMENT;
  const rowIndex = source.isConstant ? 0 : index;
  const startIndex = valueOffset + rowIndex * valueStride;
  const row = value.slice(startIndex, startIndex + valueSize);

  if (!source.normalized) {
    return row;
  }

  const normalizedRow = new Float32Array(valueSize);
  for (let valueIndex = 0; valueIndex < valueSize; valueIndex++) {
    normalizedRow[valueIndex] = normalizeValue(row[valueIndex], source.type);
  }
  return normalizedRow;
}

function normalizeValue(value: number, type: GPUDataEvaluator['type']): number {
  switch (type) {
    case 'uint8':
      return value / 255;
    case 'uint16':
      return value / 65535;
    case 'uint32':
      return value / 4294967295;

    case 'sint8':
      return Math.max(value / 127, -1);
    case 'sint16':
      return Math.max(value / 32767, -1);
    case 'sint32':
      return Math.max(value / 2147483647, -1);

    case 'float32':
      return value;

    default:
      throw new Error(`Unsupported normalized source type ${type}`);
  }
}
