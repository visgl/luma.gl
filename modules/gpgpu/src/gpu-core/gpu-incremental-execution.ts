// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {GPUData} from '../gpu-data/gpu-data';
import {GPUCommandGraph, type CompiledGPUCommandGraph} from './gpu-command-graph';

/** One borrowed batch. Increment revision after changing any input bytes or batch-local parameters. */
export type GPUIncrementalBatch<Data> = {
  readonly id: string;
  readonly revision: number;
  readonly data: Data;
};

/** Resources owned by a cached partial, independent of the graph's reusable transient storage. */
export type GPUIncrementalContext = {
  readonly graph: GPUCommandGraph;
  createData<Format extends 'float32' | 'uint32' | 'sint32'>(
    format: Format,
    length: number
  ): GPUData<Format>;
};

/** A batch-local computation and an ordered merge of its cached GPU results. */
export type GPUIncrementalExecutionProps<Data, Partial> = {
  id?: string;
  /** Record work for one batch; allocate persistent results through context.createData(). */
  createPartial: (data: Data, context: GPUIncrementalContext) => Partial;
  /** Record the final result, including the empty-input identity, into caller-owned outputs. */
  merge: (partials: readonly Partial[], graph: GPUCommandGraph) => void;
};

/** Actual work recorded and submitted by one update, without GPU readback. */
export type GPUIncrementalExecutionStats = {
  readonly computedBatchIds: readonly string[];
  readonly reusedBatchIds: readonly string[];
  readonly removedBatchIds: readonly string[];
  readonly invalidation: 'initial' | 'revision' | 'batches' | 'none';
  readonly batchNodeCount: number;
  readonly mergeNodeCount: number;
  readonly cachedByteLength: number;
  readonly submitted: boolean;
};

type CachedPartial<Data, Partial> = {
  batch: GPUIncrementalBatch<Data>;
  value: Partial;
  buffers: Buffer[];
};

/**
 * Incremental map/merge execution over explicitly versioned, caller-owned batches.
 *
 * update() submits changed batch graphs followed by a merge over all live partials. It never reads
 * back results or copies source batches. A repeated snapshot records no commands. Replacements
 * recompute just that batch; removals and reordering only rerun the merge. A changed query revision
 * invalidates all partials (for example after changing histogram edges or a selection predicate).
 *
 * Partial callbacks must depend only on their batch and query revision. Global operations such as
 * auto-domain histograms, ranks, joins, and scans require a different decomposition or explicit
 * broader invalidation. Mutations of borrowed GPU bytes are not detected automatically.
 */
export class GPUIncrementalExecution<Data, Partial> {
  readonly device: Device;
  readonly id: string;
  private readonly props: GPUIncrementalExecutionProps<Data, Partial>;
  private cache = new Map<string, CachedPartial<Data, Partial>>();
  private revision: number | undefined;
  private destroyed = false;
  private updating = false;

  constructor(device: Device, props: GPUIncrementalExecutionProps<Data, Partial>) {
    this.device = device;
    this.id = props.id ?? 'gpu-incremental-execution';
    this.props = props;
  }

  /**
   * Submit a complete ordered snapshot. Omitted IDs are removed; a new data identity also invalidates
   * a batch. Revisions are nonnegative safe integers, compared for equality, not chronological order.
   *
   * Submission belongs to this executor so abandoned encoders cannot mark uncomputed results valid.
   * After a synchronous build/encode/submit failure, the previous cache remains valid for retry.
   * GPU validation errors and device loss require destroying and recreating the executor.
   */
  update(
    batches: readonly GPUIncrementalBatch<Data>[],
    revision = 0
  ): GPUIncrementalExecutionStats {
    if (this.destroyed || this.updating) throw new Error('Invalid incremental execution state');
    validateRevision(revision);
    const ids = new Set<string>();
    for (const batch of batches) {
      validateRevision(batch.revision);
      if (ids.has(batch.id)) throw new Error('Duplicate incremental batch ID');
      ids.add(batch.id);
    }
    this.updating = true;
    const initial = this.revision === undefined;
    const invalidated = this.revision !== revision;
    const next = new Map<string, CachedPartial<Data, Partial>>();
    const allocated: Buffer[] = [];
    const compiled: CompiledGPUCommandGraph[] = [];
    const computedBatchIds: string[] = [];
    const reusedBatchIds: string[] = [];
    const removedBatchIds = [...this.cache.keys()].filter(id => !ids.has(id));
    let committed = false;
    try {
      for (const batch of batches) {
        const previous = this.cache.get(batch.id);
        if (
          !invalidated &&
          previous?.batch.revision === batch.revision &&
          previous.batch.data === batch.data
        ) {
          next.set(batch.id, previous);
          reusedBatchIds.push(batch.id);
          continue;
        }
        const graph = new GPUCommandGraph(this.device, {id: `${this.id}-batch-${batch.id}`});
        const buffers: Buffer[] = [];
        const value = this.props.createPartial(batch.data, {
          graph,
          createData: (format, length) => {
            // Each persistent partial must fit one storage binding; partition larger results explicitly.
            const byteLength = Math.max(4, length * 4);
            if (
              !Number.isSafeInteger(length) ||
              length < 0 ||
              byteLength > this.device.limits.maxStorageBufferBindingSize
            ) {
              throw new Error('Invalid incremental partial length');
            }
            const buffer = this.device.createBuffer({
              id: `${graph.id}-partial-${buffers.length}`,
              byteLength,
              usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST
            });
            buffers.push(buffer);
            allocated.push(buffer);
            return new GPUData({buffer, format, length});
          }
        });
        compiled.push(graph.compile());
        next.set(batch.id, {batch: {...batch}, value, buffers});
        computedBatchIds.push(batch.id);
      }
      const previousIds = [...this.cache.keys()];
      const changed =
        invalidated ||
        computedBatchIds.length > 0 ||
        removedBatchIds.length > 0 ||
        batches.some((batch, index) => batch.id !== previousIds[index]);
      let batchNodeCount = 0;
      let mergeNodeCount = 0;
      if (changed) {
        const graph = new GPUCommandGraph(this.device, {id: `${this.id}-merge`});
        this.props.merge(
          [...next.values()].map(partial => partial.value),
          graph
        );
        const merge = graph.compile();
        compiled.push(merge);
        const encoder = this.device.createCommandEncoder({id: this.id});
        try {
          for (const partial of compiled.slice(0, -1)) {
            batchNodeCount += partial.encode(encoder, {parameters: undefined}).stats.nodeCount;
          }
          mergeNodeCount = merge.encode(encoder, {parameters: undefined}).stats.nodeCount;
          this.device.submit(encoder.finish());
        } finally {
          encoder.destroy();
        }
      }
      const previousCache = this.cache;
      this.cache = next;
      this.revision = revision;
      committed = true;
      for (const [id, previous] of previousCache) {
        if (next.get(id) !== previous) for (const buffer of previous.buffers) buffer.destroy();
      }
      return Object.freeze({
        computedBatchIds: Object.freeze(computedBatchIds),
        reusedBatchIds: Object.freeze(reusedBatchIds),
        removedBatchIds: Object.freeze(removedBatchIds),
        invalidation: initial ? 'initial' : invalidated ? 'revision' : changed ? 'batches' : 'none',
        batchNodeCount,
        mergeNodeCount,
        cachedByteLength: [...next.values()].reduce(
          (total, partial) =>
            total + partial.buffers.reduce((bytes, buffer) => bytes + buffer.byteLength, 0),
          0
        ),
        submitted: changed
      });
    } finally {
      for (const graph of compiled) graph.destroy();
      if (!committed) for (const buffer of allocated) buffer.destroy();
      this.updating = false;
    }
  }

  /** Release cached partials. Borrowed source data and caller-owned final outputs remain alive. */
  destroy(): void {
    if (this.updating) throw new Error('Invalid incremental execution state');
    if (this.destroyed) return;
    this.destroyed = true;
    for (const partial of this.cache.values())
      for (const buffer of partial.buffers) buffer.destroy();
    this.cache.clear();
  }
}

function validateRevision(revision: number): void {
  if (!Number.isSafeInteger(revision) || revision < 0)
    throw new Error('Invalid incremental revision');
}
