// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {TypedArray} from '@luma.gl/core';
import {getGPUVectorFormatInfo} from '@luma.gl/tables';
import type {GPUTableEvaluator} from '../../operation/gpu-table-evaluator';
import type {InterleavedGPUTableEvaluator} from '../../operation/interleaved-gpu-table-evaluator';
import type {OperationHandler} from '../../operation/operation';

export const scatterInterleaved: OperationHandler<
  Record<string, GPUTableEvaluator>,
  InterleavedGPUTableEvaluator
> = async ({inputs, output, target}) => {
  for (const [fieldName, input] of Object.entries(inputs)) {
    if (!input.value) {
      throw new Error(`scatterInterleaved input "${fieldName}" does not have CPU value`);
    }
  }

  const targetBytes = new Uint8Array(output.byteLength);
  const scratchBuffers = Object.fromEntries(
    output.layout.attributes.map(attribute => {
      const input = inputs[attribute.attribute];
      return [attribute.attribute, new input.ValueType(input.size) as TypedArray];
    })
  ) as Record<string, TypedArray>;

  for (let rowIndex = 0; rowIndex < output.length; rowIndex++) {
    const rowByteOffset = rowIndex * output.layout.byteStride;
    for (const attribute of output.layout.attributes) {
      const input = inputs[attribute.attribute];
      const sourceValue = input.value!;
      const sourceRowIndex = input.isConstant ? 0 : rowIndex;
      const sourceElementOffset =
        input.offset / input.ValueType.BYTES_PER_ELEMENT +
        sourceRowIndex * (input.stride / input.ValueType.BYTES_PER_ELEMENT);
      const scratch = scratchBuffers[attribute.attribute];
      for (let componentIndex = 0; componentIndex < input.size; componentIndex++) {
        scratch[componentIndex] = sourceValue[sourceElementOffset + componentIndex];
      }

      const fieldByteLength = getGPUVectorFormatInfo(attribute.format).byteLength;
      targetBytes.set(
        new Uint8Array(scratch.buffer, scratch.byteOffset, fieldByteLength),
        rowByteOffset + attribute.byteOffset
      );
    }
  }

  target.write(targetBytes);
  return {success: true, value: targetBytes};
};
