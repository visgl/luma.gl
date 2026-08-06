// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {GraphVectorView, type GPUCommandGraph} from './gpu-command-graph';
import {validateMatchingVectorTopology} from './graph-data-view-utils';
import {GPUSort, type GPUSortAlgorithm, type GPUSortDirection} from './gpu-sort';

/** Properties for independent stable sorting of aligned GPU vector chunks. */
export type GPUBatchSortProps = {
  /** Prefix for generated per-batch graph node and transient resource IDs. */
  id?: string;
  /** Ordered unsigned key chunks. */
  keys: GraphVectorView<'uint32'>;
  /** Ordered payload chunks paired row-for-row with `keys`. */
  values: GraphVectorView<'uint32'>;
  /** Caller-owned sorted key chunks with the same topology as `keys`. */
  outputKeys: GraphVectorView<'uint32'>;
  /** Caller-owned sorted payload chunks with the same topology as `keys`. */
  outputValues: GraphVectorView<'uint32'>;
  /** Requested implementation for every batch. Defaults to `'auto'`. */
  algorithm?: GPUSortAlgorithm;
  /** Requested order within every batch. Defaults to `'ascending'`. */
  direction?: GPUSortDirection;
};

/**
 * Stable paired sorting that preserves GPU vector chunk boundaries.
 *
 * @remarks
 * Each aligned chunk is an independent sort domain. No chunk is concatenated, packed, or compared
 * with another chunk. This makes the operation suitable for streaming record batches, tiles, and
 * other workloads where the source partition is part of the data contract. Use {@link GPUSort}
 * instead when all rows must participate in one global ordering.
 */
export class GPUBatchSort {
  /** Prefix for generated graph node and transient resource IDs. */
  readonly id: string;
  /** Ordered unsigned key chunks. */
  readonly keys: GraphVectorView<'uint32'>;
  /** Ordered payload chunks paired with the keys. */
  readonly values: GraphVectorView<'uint32'>;
  /** Caller-owned sorted key chunks. */
  readonly outputKeys: GraphVectorView<'uint32'>;
  /** Caller-owned sorted payload chunks. */
  readonly outputValues: GraphVectorView<'uint32'>;
  /** Algorithm requested for every chunk. */
  readonly algorithm: GPUSortAlgorithm;
  /** Final order within every chunk. */
  readonly direction: GPUSortDirection;
  /** Concrete algorithm selected independently for each ordered chunk. */
  readonly resolvedAlgorithms: readonly Exclude<GPUSortAlgorithm, 'auto'>[];

  private readonly chunkSorts: readonly GPUSort[];

  /** Creates and validates one independent sort per aligned vector chunk. */
  constructor(props: GPUBatchSortProps) {
    this.id = props.id ?? 'gpu-batch-sort';
    this.keys = props.keys;
    this.values = props.values;
    this.outputKeys = props.outputKeys;
    this.outputValues = props.outputValues;
    this.algorithm = props.algorithm ?? 'auto';
    this.direction = props.direction ?? 'ascending';

    if (!['auto', 'bitonic', 'radix'].includes(this.algorithm)) {
      throw new Error(`${this.id} algorithm must be auto, bitonic, or radix`);
    }
    if (!['ascending', 'descending'].includes(this.direction)) {
      throw new Error(`${this.id} direction must be ascending or descending`);
    }
    for (const [name, vector] of [
      ['keys', this.keys],
      ['values', this.values],
      ['outputKeys', this.outputKeys],
      ['outputValues', this.outputValues]
    ] as const) {
      if (!(vector instanceof GraphVectorView) || vector.format !== 'uint32') {
        throw new Error(`${this.id} ${name} must be a uint32 GraphVectorView`);
      }
    }
    validateMatchingVectorTopology(this.keys, this.values, `${this.id} keys and values`);
    validateMatchingVectorTopology(this.keys, this.outputKeys, `${this.id} keys and output keys`);
    validateMatchingVectorTopology(
      this.keys,
      this.outputValues,
      `${this.id} keys and output values`
    );
    validateDisjointOutputChunks(this.outputKeys, `${this.id} output keys`);
    validateDisjointOutputChunks(this.outputValues, `${this.id} output values`);
    validateSeparateVectorBuffers(this);

    this.chunkSorts = this.keys.data.map(
      (keys, chunkIndex) =>
        new GPUSort({
          id: `${this.id}-chunk-${chunkIndex}`,
          keys,
          values: this.values.data[chunkIndex],
          outputKeys: this.outputKeys.data[chunkIndex],
          outputValues: this.outputValues.data[chunkIndex],
          algorithm: this.algorithm,
          direction: this.direction
        })
    );
    this.resolvedAlgorithms = this.chunkSorts.map(sort => sort.resolvedAlgorithm);
  }

  /**
   * Adds every non-empty chunk sort to a command graph in source order.
   *
   * Empty chunks add no nodes. Scratch remains batch-local and graph-owned. This method does not
   * compile, encode, submit, or read back commands.
   */
  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    for (const sort of this.chunkSorts) {
      sort.addToGraph(graph);
    }
  }
}

/** Rejects overlapping writable chunks while allowing disjoint slices of one logical buffer. */
function validateDisjointOutputChunks(vector: GraphVectorView<'uint32'>, name: string): void {
  for (let firstIndex = 0; firstIndex < vector.data.length; firstIndex++) {
    const first = vector.data[firstIndex];
    if (first.length === 0) continue;
    const firstEnd = first.byteOffset + (first.length - 1) * first.byteStride + first.rowByteLength;
    for (let secondIndex = firstIndex + 1; secondIndex < vector.data.length; secondIndex++) {
      const second = vector.data[secondIndex];
      if (first.buffer !== second.buffer || second.length === 0) continue;
      const secondEnd =
        second.byteOffset + (second.length - 1) * second.byteStride + second.rowByteLength;
      if (first.byteOffset < secondEnd && second.byteOffset < firstEnd) {
        throw new Error(`${name} chunks must not overlap`);
      }
    }
  }
}

/** Rejects input/output aliasing anywhere in the ordered vector topology. */
function validateSeparateVectorBuffers(sort: GPUBatchSort): void {
  const inputBuffers = new Set([
    ...sort.keys.data.map(chunk => chunk.buffer),
    ...sort.values.data.map(chunk => chunk.buffer)
  ]);
  const outputKeyBuffers = new Set(sort.outputKeys.data.map(chunk => chunk.buffer));
  const outputValueBuffers = new Set(sort.outputValues.data.map(chunk => chunk.buffer));
  if (
    [...outputKeyBuffers].some(
      buffer => inputBuffers.has(buffer) || outputValueBuffers.has(buffer)
    ) ||
    [...outputValueBuffers].some(buffer => inputBuffers.has(buffer))
  ) {
    throw new Error(`${sort.id} outputs must use separate buffers from inputs and each other`);
  }
}
