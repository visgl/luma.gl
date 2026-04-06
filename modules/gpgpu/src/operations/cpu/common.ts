// deck.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Buffer, TypedArray} from '@luma.gl/core';
import {GPUTable} from '../../operation/gpu-table';

type CPUTransformProps =
  | {
      elementWise: true;
      func: (...args: number[]) => number;
      inputs: {[name: string]: GPUTable};
      output: GPUTable;
      outputBuffer: Buffer;
    }
  | {
      elementWise?: false;
      func: (...args: TypedArray[]) => void;
      inputs: {[name: string]: GPUTable};
      output: GPUTable;
      outputBuffer: Buffer;
    };

export function runCPUTransform({
  elementWise,
  func,
  inputs,
  output,
  outputBuffer
}: CPUTransformProps): void {
  // validate
  for (const id in inputs) {
    const value = inputs[id].value;
    if (!value) throw new Error(`${inputs[id]} does not have CPU value`);
  }

  const vertexCount = output.length;
  const outputSize = output.size;
  const target = new output.ValueType(vertexCount * outputSize);
  for (let i = 0; i < vertexCount; i++) {
    const inputVertices = Object.values(inputs).map(table => getValueAtVertex(table, i));
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
}

function getValueAtVertex(source: GPUTable, index: number): TypedArray {
  const value = source.value!;
  const valueSize = source.size;
  const valueOffset = source.offset / source.ValueType.BYTES_PER_ELEMENT;
  const valueStride = source.stride / source.ValueType.BYTES_PER_ELEMENT;
  const rowIndex = source.isConstant ? 0 : index;
  const startIndex = valueOffset + rowIndex * valueStride;

  return value.slice(startIndex, startIndex + valueSize);
}
