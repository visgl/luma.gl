// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Independently implemented for WebGPU; inspired by NVIDIA RAPIDS cuVS.

export {
  importGPUEmbeddingTable,
  importGPUEmbeddingVector,
  type ImportGPUEmbeddingTableOptions,
  type ImportGPUEmbeddingVectorOptions
} from './embedding-matrix';
export {GPUSimilaritySearch} from './gpu-similarity-search';
export type {
  GPUEmbeddingFilterMask,
  GPUEmbeddingMetric,
  GPUSimilaritySearchProps,
  GraphEmbeddingMatrix,
  GraphEmbeddingMatrixChunk
} from './types';
