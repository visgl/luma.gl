// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Independently implemented for WebGPU; inspired by NVIDIA RAPIDS cuVS.

export {
  importGPUEmbeddingTable,
  importGPUEmbeddingVector,
  type GPUEmbeddingRecordBatch,
  type GPUEmbeddingTable,
  type GPUEmbeddingTableField,
  type GPUEmbeddingTableSource,
  type ImportGPUEmbeddingTableOptions,
  type ImportGPUEmbeddingVectorOptions
} from './embedding-matrix';
export {GPUSimilaritySearch} from './gpu-similarity-search';
export {GPUKMeans} from './gpu-k-means';
export type {GPUKMeansLabels, GPUKMeansProps} from './gpu-k-means';
export {GPUIVFFlatIndex} from './gpu-ivf-flat-index';
export type {GPUIVFFlatIndexProps, GPUIVFFlatSearchProps} from './gpu-ivf-flat-index';
export type {
  GPUEmbeddingFilterMask,
  GPUEmbeddingMetric,
  GPUSimilaritySearchProps,
  GraphEmbeddingMatrix,
  GraphEmbeddingMatrixChunk
} from './types';
