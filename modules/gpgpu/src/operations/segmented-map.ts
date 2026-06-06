// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  getGPUTableEvaluator,
  GPUTableEvaluator,
  type GPUTableEvaluatorInput
} from '../operation/gpu-table-evaluator';
import {Operation} from '../operation/operation';

type SegmentedMapInputs = {
  segments: GPUTableEvaluator;
  vertexCount: number;
};

/** Deferred segmented vertex-to-segment mapping operation. */
class SegmentedMapOperation extends Operation<SegmentedMapInputs> {
  /** Operation name used for backend lookup. */
  name = 'segmentedMap';

  /** Lazy output table for the segmented mapping result. */
  output: GPUTableEvaluator;

  constructor(segments: GPUTableEvaluator, vertexCount: number) {
    super({segments, vertexCount});

    this.output = new GPUTableEvaluator({
      type: 'uint32',
      size: 2,
      length: vertexCount,
      source: this
    });
  }

  /** Returns a compact expression for debug output. */
  toString(): string {
    const {segments, vertexCount} = this.inputs;
    return `segmentedMap(segments=${segments}, vertexCount=${vertexCount})`;
  }
}

/**
 * Maps each vertex index to `[segmentIndex, vertexIndexInSegment]`.
 *
 * `segments` must be a scalar `uint32` table containing non-decreasing segment start indices.
 * Duplicate start indices represent empty segments. `vertexCount` defines the output length and
 * the exclusive end of the final segment.
 */
export function segmentedMap(
  segments: GPUTableEvaluatorInput,
  vertexCount: number
): GPUTableEvaluator {
  if (!Number.isInteger(vertexCount)) {
    throw new Error(`segmentedMap vertexCount must be an integer, got ${vertexCount}`);
  }
  if (vertexCount < 0) {
    throw new Error(`segmentedMap vertexCount must be non-negative, got ${vertexCount}`);
  }

  const segmentsTable = getGPUTableEvaluator(segments);
  if (segmentsTable.length < 1) {
    throw new Error('segmentedMap segments must contain at least one segment start');
  }
  if (!segmentsTable.type.includes('int')) {
    throw new Error(`segmentedMap segments must be integers, got ${segmentsTable.type}`);
  }
  if (segmentsTable.size !== 1) {
    throw new Error(`segmentedMap segments must have size 1, got ${segmentsTable.size}`);
  }
  validateSegmentsIfAvailable(segmentsTable, vertexCount);

  return new SegmentedMapOperation(segmentsTable, vertexCount).output;
}

function validateSegmentsIfAvailable(segments: GPUTableEvaluator, vertexCount: number): void {
  const segmentStarts = segments.value;
  if (!segmentStarts) {
    return;
  }

  let previous = 0;
  for (let rowIndex = 0; rowIndex < segments.length; rowIndex++) {
    const value = segmentStarts[getRowOffset(segments, rowIndex)];
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
