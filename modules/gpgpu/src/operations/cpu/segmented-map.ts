// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {OperationHandler} from '../../operation/operation';
import {GPUTableEvaluator} from '../../operation/gpu-table-evaluator';

export const segmentedMap: OperationHandler<{
  segments: GPUTableEvaluator;
  vertexCount: number;
}> = async ({inputs, output, target}) => {
  const {segments, vertexCount} = inputs;
  const segmentStarts = segments.value;
  if (!segmentStarts) {
    throw new Error(`${segments} does not have CPU value`);
  }

  validateSegments(segmentStarts, segments, vertexCount);

  const result = new output.ValueType(output.length * output.size);
  let segmentIndex = 0;

  for (let vertexIndex = 0; vertexIndex < vertexCount; vertexIndex++) {
    while (
      segmentIndex + 1 < segments.length &&
      segmentStarts[getRowOffset(segments, segmentIndex + 1)] <= vertexIndex
    ) {
      segmentIndex++;
    }

    const segmentStart = segmentStarts[getRowOffset(segments, segmentIndex)];
    const outputOffset = vertexIndex * output.size;
    result[outputOffset] = segmentIndex;
    result[outputOffset + 1] = vertexIndex - segmentStart;
  }

  target.write(result);
  return {
    success: true,
    value: result
  };
};

function validateSegments(
  segmentStarts: GPUTableEvaluator['value'],
  segments: GPUTableEvaluator,
  vertexCount: number
) {
  if (segments.length < 1) {
    throw new Error('segmentedMap segments must contain at least one segment start');
  }

  let previous = 0;
  for (let rowIndex = 0; rowIndex < segments.length; rowIndex++) {
    const value = segmentStarts![getRowOffset(segments, rowIndex)];
    if (rowIndex === 0 && value !== 0) {
      throw new Error(`segmentedMap segments must start at 0, got ${value}`);
    }
    if (rowIndex > 0 && value < previous) {
      throw new Error(
        `segmentedMap segments must be non-decreasing, got ${value} after ${previous}`
      );
    }
    previous = value;
  }

  if (previous > vertexCount) {
    throw new Error(
      `segmentedMap last segment start must be <= vertexCount, got ${previous} > ${vertexCount}`
    );
  }
}

function getRowOffset(table: GPUTableEvaluator, rowIndex: number): number {
  return (
    table.offset / table.ValueType.BYTES_PER_ELEMENT +
    rowIndex * (table.stride / table.ValueType.BYTES_PER_ELEMENT)
  );
}
