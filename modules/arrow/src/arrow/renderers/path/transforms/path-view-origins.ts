// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {GPUVector} from '@luma.gl/tables';
import {Data, FixedSizeList, Float32, Vector} from 'apache-arrow';
import {makeArrowFixedSizeListVector} from '../../../vectors/arrow-fixed-size-list';

/** Arrow Float32 vec4 view-origin column aligned with source path rows. */
export type ArrowPathViewOriginType = FixedSizeList<Float32>;

/** View transform used to refresh Float64 path view-origin buffers. */
export type ArrowPathViewOriginUpdateProps = {
  /** Column-major model-view matrix applied to retained Float64 source origins. */
  modelViewMatrix: readonly number[];
};

/** Wraps one Float32 vec4 view origin per path row as an Arrow fixed-size list vector. */
export function makeArrowPathViewOriginVector(
  values: Float32Array,
  rowCounts?: readonly number[]
): Vector<ArrowPathViewOriginType> {
  if (!rowCounts) {
    return makeArrowFixedSizeListVector(new Float32(), 4, values);
  }

  const dataChunks: Data<ArrowPathViewOriginType>[] = [];
  let rowStart = 0;
  for (const rowCount of rowCounts) {
    const rowEnd = rowStart + rowCount;
    dataChunks.push(
      makeArrowFixedSizeListVector(new Float32(), 4, values.slice(rowStart * 4, rowEnd * 4))
        .data[0] as Data<ArrowPathViewOriginType>
    );
    rowStart = rowEnd;
  }
  if (rowStart * 4 !== values.length) {
    throw new Error('Arrow path view-origin chunk rows must cover every source row');
  }
  return new Vector(dataChunks);
}

/** Writes full view-origin values into a chunk-preserving GPU vector. */
export function writeArrowPathViewOriginGPUVector(
  viewOrigins: GPUVector,
  values: Float32Array
): void {
  let rowStart = 0;
  for (const data of viewOrigins.data) {
    const rowEnd = rowStart + data.length;
    data.buffer.write(values.subarray(rowStart * 4, rowEnd * 4), data.byteOffset);
    rowStart = rowEnd;
  }
  if (rowStart * 4 !== values.length) {
    throw new Error('Arrow path view-origin GPU chunks must cover every source row');
  }
}

/** Reprojects retained Float64 path source origins into Float32 model-view coordinates. */
export function updateViewOriginValues(
  target: Float32Array,
  sourceOrigins: Float64Array,
  modelViewMatrix: readonly number[]
): void {
  if (modelViewMatrix.length < 16) {
    throw new Error('convertArrowPathToGPUVectors updateViewOrigins requires a 4x4 modelViewMatrix');
  }
  for (let rowIndex = 0; rowIndex < sourceOrigins.length / 4; rowIndex++) {
    const originOffset = rowIndex * 4;
    const x = sourceOrigins[originOffset] ?? 0;
    const y = sourceOrigins[originOffset + 1] ?? 0;
    const z = sourceOrigins[originOffset + 2] ?? 0;
    target[originOffset] =
      (modelViewMatrix[0] ?? 0) * x +
      (modelViewMatrix[4] ?? 0) * y +
      (modelViewMatrix[8] ?? 0) * z +
      (modelViewMatrix[12] ?? 0);
    target[originOffset + 1] =
      (modelViewMatrix[1] ?? 0) * x +
      (modelViewMatrix[5] ?? 0) * y +
      (modelViewMatrix[9] ?? 0) * z +
      (modelViewMatrix[13] ?? 0);
    target[originOffset + 2] =
      (modelViewMatrix[2] ?? 0) * x +
      (modelViewMatrix[6] ?? 0) * y +
      (modelViewMatrix[10] ?? 0) * z +
      (modelViewMatrix[14] ?? 0);
    target[originOffset + 3] = sourceOrigins[originOffset + 3] ?? 0;
  }
}
