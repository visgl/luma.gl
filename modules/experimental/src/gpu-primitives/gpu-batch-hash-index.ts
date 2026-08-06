// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {GraphVectorView, type GPUCommandGraph, type GraphDataView} from './gpu-command-graph';
import {
  doGraphDataViewsOverlap,
  validateMatchingVectorTopology,
  validatePackedUint32View
} from './graph-data-view-utils';
import {
  addGPUHashIndexBuildBatchesToGraph,
  GPU_HASH_INDEX_STATISTICS_LENGTH,
  type GPUHashIndexBuildBatch,
  type GPUHashIndexStats,
  type GPUHashIndexView
} from './gpu-hash-index';

const MAXIMUM_UINT32 = 0xffffffff;

/** Properties for rebuilding one hash index from ordered, preserved source batches. */
export type GPUBatchHashIndexProps = {
  /** Prefix for the shared initialization and ordered per-batch graph passes. */
  id?: string;
  /** Ordered packed unsigned key chunks. */
  keys: GraphVectorView<'uint32'>;
  /** Optional packed values with exactly the same ordered chunk topology as `keys`. */
  values?: GraphVectorView<'uint32'>;
  /** Optional packed nonzero/zero validity with exactly the same source topology. */
  validity?: GraphVectorView<'uint32'>;
  /** First generated value for each source chunk. Mutually exclusive with `values`. */
  firstValues?: readonly number[];
  /** Caller-owned power-of-two key table shared by all source chunks. */
  tableKeys: GraphDataView<'uint32'>;
  /** Caller-owned values aligned with `tableKeys`. */
  tableValues: GraphDataView<'uint32'>;
  /** Caller-owned six-row cumulative build-statistics block. */
  statistics: GraphDataView<'uint32'>;
  /** Maximum slots examined per valid input row. Defaults to table capacity. */
  maxProbeCount?: number;
};

/** CPU-visible storage, bounded-work, and preserved source-topology facts. */
export type GPUBatchHashIndexStats = GPUHashIndexStats & {
  batchCount: number;
  inputLength: number;
};

/**
 * Rebuilds one packed unsigned-key hash index from ordered source chunks.
 *
 * Chunks retain their original GPU buffers and are processed in source order. Duplicate keys
 * retain the globally earliest source row, including duplicates encountered in later chunks.
 * Zero-validity rows are silently excluded; valid reserved keys increment the invalid statistic.
 */
export class GPUBatchHashIndex implements GPUHashIndexView {
  readonly id: string;
  readonly keys: GraphVectorView<'uint32'>;
  readonly values?: GraphVectorView<'uint32'>;
  readonly validity?: GraphVectorView<'uint32'>;
  readonly firstValues: readonly number[];
  readonly tableKeys: GraphDataView<'uint32'>;
  readonly tableValues: GraphDataView<'uint32'>;
  readonly statistics: GraphDataView<'uint32'>;
  readonly maxProbeCount: number;
  readonly stats: GPUBatchHashIndexStats;
  readonly updatePolicy = 'rebuild' as const;

  constructor(props: GPUBatchHashIndexProps) {
    this.id = props.id ?? 'gpu-batch-hash-index';
    this.keys = props.keys;
    this.values = props.values;
    this.validity = props.validity;
    this.tableKeys = props.tableKeys;
    this.tableValues = props.tableValues;
    this.statistics = props.statistics;
    this.maxProbeCount = props.maxProbeCount ?? this.tableKeys.length;

    validateSourceVector(this.keys, `${this.id} keys`);
    if (this.values) {
      validateSourceVector(this.values, `${this.id} values`);
      validateMatchingVectorTopology(this.keys, this.values, `${this.id} values`);
    }
    if (this.validity) {
      validateSourceVector(this.validity, `${this.id} validity`);
      validateMatchingVectorTopology(this.keys, this.validity, `${this.id} validity`);
    }
    if (this.values && props.firstValues !== undefined) {
      throw new Error(`${this.id} values and firstValues are mutually exclusive`);
    }

    let firstSourceRow = 0;
    const defaultFirstValues = this.keys.data.map(chunk => {
      const firstValue = firstSourceRow;
      firstSourceRow += chunk.length;
      return firstValue;
    });
    this.firstValues = Object.freeze(
      props.firstValues === undefined ? defaultFirstValues : [...props.firstValues]
    );
    if (this.firstValues.length !== this.keys.data.length) {
      throw new Error(`${this.id} firstValues must contain one value per source chunk`);
    }
    for (const [chunkIndex, chunk] of this.keys.data.entries()) {
      const firstValue = this.firstValues[chunkIndex];
      if (
        !Number.isSafeInteger(firstValue) ||
        firstValue < 0 ||
        firstValue > MAXIMUM_UINT32 ||
        (chunk.length > 0 && firstValue + chunk.length - 1 > MAXIMUM_UINT32)
      ) {
        throw new Error(`${this.id} generated values must fit in uint32`);
      }
    }

    for (const [view, name] of [
      [this.tableKeys, 'tableKeys'],
      [this.tableValues, 'tableValues'],
      [this.statistics, 'statistics']
    ] as const) {
      validatePackedUint32View(view, `${this.id} ${name}`);
    }
    if (
      !Number.isSafeInteger(this.tableKeys.length) ||
      this.tableKeys.length < 1 ||
      !Number.isInteger(Math.log2(this.tableKeys.length))
    ) {
      throw new Error(`${this.id} table capacity must be a positive power of two`);
    }
    if (this.tableKeys.length > MAXIMUM_UINT32) {
      throw new Error(`${this.id} table capacity must fit in uint32`);
    }
    if (this.tableValues.length !== this.tableKeys.length) {
      throw new Error(`${this.id} table key and value capacities must match`);
    }
    if (this.statistics.length < GPU_HASH_INDEX_STATISTICS_LENGTH) {
      throw new Error(`${this.id} statistics must contain six uint32 rows`);
    }
    if (
      !Number.isSafeInteger(this.maxProbeCount) ||
      this.maxProbeCount < 1 ||
      this.maxProbeCount > this.tableKeys.length
    ) {
      throw new Error(`${this.id} maxProbeCount must be an integer from one through capacity`);
    }
    if (this.keys.length * this.maxProbeCount > MAXIMUM_UINT32) {
      throw new Error(`${this.id} aggregate probe count must fit in uint32 statistics`);
    }
    validateDisjointViews(this);

    this.stats = Object.freeze({
      capacity: this.tableKeys.length,
      maxProbeCount: this.maxProbeCount,
      tableByteLength: this.tableKeys.length * 8,
      statisticsByteLength: GPU_HASH_INDEX_STATISTICS_LENGTH * 4,
      outputByteLength: this.tableKeys.length * 8 + GPU_HASH_INDEX_STATISTICS_LENGTH * 4,
      batchCount: this.keys.data.length,
      inputLength: this.keys.length
    });
  }

  /** Adds one shared clear and sequential chunk-local build/finalize passes to a graph. */
  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    const views = [
      ...this.keys.data,
      ...(this.values?.data ?? []),
      ...(this.validity?.data ?? []),
      this.tableKeys,
      this.tableValues,
      this.statistics
    ];
    if (views.some(view => view.buffer.graph !== graph)) {
      throw new Error(`${this.id} views must belong to the target graph`);
    }

    const batches: GPUHashIndexBuildBatch[] = this.keys.data.map((keys, chunkIndex) => ({
      keys,
      ...(this.values ? {values: this.values.data[chunkIndex]} : {}),
      ...(this.validity ? {validity: this.validity.data[chunkIndex]} : {}),
      firstValue: this.firstValues[chunkIndex]
    }));
    addGPUHashIndexBuildBatchesToGraph(graph, this, batches);
  }
}

function validateSourceVector(vector: GraphVectorView<'uint32'>, name: string): void {
  if (!(vector instanceof GraphVectorView) || vector.format !== 'uint32') {
    throw new Error(`${name} must be a uint32 GraphVectorView`);
  }
  if (
    !Number.isSafeInteger(vector.length) ||
    vector.length < 0 ||
    vector.data.reduce((length, chunk) => length + chunk.length, 0) !== vector.length
  ) {
    throw new Error(`${name} length must equal its ordered source chunks`);
  }
  for (const [chunkIndex, chunk] of vector.data.entries()) {
    validatePackedUint32View(chunk, `${name} chunk ${chunkIndex}`);
  }
}

function validateDisjointViews(index: GPUBatchHashIndex): void {
  const inputs = [
    ...index.keys.data,
    ...(index.values?.data ?? []),
    ...(index.validity?.data ?? [])
  ];
  const outputs = [index.tableKeys, index.tableValues, index.statistics];
  for (const input of inputs) {
    for (const output of outputs) {
      if (doGraphDataViewsOverlap(input, output)) {
        throw new Error(`${index.id} input and output views must not overlap`);
      }
    }
  }
  for (let first = 0; first < outputs.length; first++) {
    for (let second = first + 1; second < outputs.length; second++) {
      if (doGraphDataViewsOverlap(outputs[first], outputs[second])) {
        throw new Error(`${index.id} output views must not overlap`);
      }
    }
  }
}
