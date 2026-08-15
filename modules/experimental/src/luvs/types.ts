// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Independently implemented for WebGPU; inspired by NVIDIA RAPIDS cuVS.

import type {GraphDataView, GraphVectorView} from '../gpu-primitives/gpu-command-graph';

/** Exact distance or similarity used to order embedding search results. */
export type GPUEmbeddingMetric = 'squared-euclidean' | 'inner-product' | 'cosine';

/** Non-owning graph metadata and borrowed views for one fixed-size-list embedding chunk. */
export type GraphEmbeddingMatrixChunk = {
  /** Flat scalar view beginning at the first logical embedding row. */
  readonly values: GraphDataView<'float32'>;
  /** Number of logical embedding rows represented by this graph view. */
  readonly rowCount: number;
  /** Number of float32 elements between consecutive embedding rows. */
  readonly rowStride: number;
  /** Physical byte offset of the first logical row in the values buffer. */
  readonly byteOffset: number;
  /** Stable source position of the first logical row in this chunk. */
  readonly sourceRowOffset: number;
  /** Optional chunk-row-aligned stable source identifiers. */
  readonly sourceRowIds?: GraphDataView<'uint32'>;
  /** Optional chunk-row-aligned nonzero-valid row flags. */
  readonly validity?: GraphDataView<'uint32'>;
};

/** Non-owning embedding-column view imported into one caller-owned GPU command graph. */
export type GraphEmbeddingMatrix = {
  /** Logical embedding dimensionality, independent from GPU vertex formats. */
  readonly dimensions: number;
  /** Total number of rows across original source chunks. */
  readonly rowCount: number;
  /** Ordered, source-preserving views over GPUData chunks owned by the source table or vector. */
  readonly chunks: readonly GraphEmbeddingMatrixChunk[];
};

/** Source-aligned selection flags, including chunk-preserving LuxFilter output. */
export type GPUEmbeddingFilterMask = GraphDataView<'uint32'> | GraphVectorView<'uint32'>;

/** Properties accepted by an exact, graph-native embedding similarity search. */
export type GPUSimilaritySearchProps = {
  /** Prefix shared by generated graph nodes and bounded scratch resources. */
  id?: string;
  /** Chunk-preserving candidate embedding rows. */
  dataset: GraphEmbeddingMatrix;
  /** Chunk-preserving query embedding rows with matching dimensions. */
  queries: GraphEmbeddingMatrix;
  /** Caller-owned packed result identifiers, with `queryCount * k` slots. */
  outputIds: GraphDataView<'uint32'>;
  /** Caller-owned packed float32 distances or similarity scores. */
  outputScores: GraphDataView<'float32'>;
  /** Caller-owned number of actual results for each query row. */
  resultCounts: GraphDataView<'uint32'>;
  /** Optional caller-owned number of eligible candidates for each query. */
  candidateCounts?: GraphDataView<'uint32'>;
  /** Requested maximum result count for each query. */
  k: number;
  /** Distance or similarity metric. Defaults to squared Euclidean distance. */
  metric?: GPUEmbeddingMetric;
  /** Optional source-row-aligned selection flags, including LuxFilter masks. */
  filterMask?: GPUEmbeddingFilterMask;
  /** Optional stable source identifiers restricting eligible candidates. */
  candidateIds?: GraphDataView<'uint32'>;
  /** Optional packed query-major, source-row-aligned selection flags. */
  queryFilterMask?: GraphDataView<'uint32'>;
  /** Reject candidates whose stable source ID matches their query row ID. */
  excludeSelf?: boolean;
  /** Optional upper bound on dataset rows visited by one graph pass. */
  tileSize?: number;
};
