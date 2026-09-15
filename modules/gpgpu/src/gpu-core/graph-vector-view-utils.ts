// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GPUVectorFormat} from '../gpu-data/gpu-vector-format';
import {GPUCommandGraph, GraphDataView, GraphVectorView} from './gpu-command-graph';

export function getGraphVectorData<T extends GPUVectorFormat>(
  vector: GraphDataView<T> | GraphVectorView<T>
): readonly GraphDataView<T>[] {
  return vector instanceof GraphVectorView ? vector.data : [vector];
}

/** Intersects logical chunk boundaries using borrowed views, never packed buffers. */
export function alignGraphVectorViews<Parameters, T extends GPUVectorFormat>(
  graph: GPUCommandGraph<Parameters>,
  vectors: readonly (GraphDataView<T> | GraphVectorView<T>)[]
): readonly (readonly GraphDataView<T>[])[] {
  const length = vectors[0]?.length ?? 0;
  if (vectors.some(vector => vector.length !== length)) {
    throw new Error('Aligned vectors must have equal logical lengths');
  }
  const chunks = vectors.map(getGraphVectorData);
  const indices = vectors.map(() => 0);
  const offsets = vectors.map(() => 0);
  const result: GraphDataView<T>[][] = [];
  let position = 0;
  while (position < length) {
    for (let index = 0; index < chunks.length; index++) {
      while (chunks[index][indices[index]]?.length === offsets[index]) {
        indices[index]++;
        offsets[index] = 0;
      }
    }
    const current = chunks.map((data, index) => data[indices[index]]);
    const span = Math.min(...current.map((data, index) => data.length - offsets[index]));
    const aligned: GraphDataView<T>[] = [];
    for (let index = 0; index < current.length; index++) {
      const data = current[index];
      // Preserve identity for in-place operands, but never merge distinct source views.
      const matchingIndex = current.findIndex(
        (candidate, candidateIndex) =>
          candidateIndex < index && candidate === data && offsets[candidateIndex] === offsets[index]
      );
      aligned.push(
        matchingIndex >= 0
          ? aligned[matchingIndex]
          : offsets[index] === 0 && span === data.length
            ? data
            : graph.createDataView(data.buffer, {
                format: data.format,
                length: span,
                byteOffset: data.byteOffset + offsets[index] * data.byteStride,
                byteStride: data.byteStride,
                rowByteLength: data.rowByteLength
              })
      );
    }
    result.push(aligned);
    for (let index = 0; index < offsets.length; index++) offsets[index] += span;
    position += span;
  }
  return result;
}

/** Explicit backend limitation for operations whose global indexing needs one physical chunk. */
export function getSingleGraphVectorChunk<T extends GPUVectorFormat>(
  vector: GraphVectorView<T>
): GraphDataView<T> {
  if (vector.data.length !== 1) {
    throw new Error(
      `${vector.id}: this lowering requires one physical chunk; packing is never implicit`
    );
  }
  return vector.data[0];
}
