// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Independently implemented for WebGPU; inspired by NVIDIA RAPIDS cuDF.

import type {GPUTypeMap} from '@luma.gl/tables';
import type {GPUCommandGraph} from '../gpu-core/gpu-command-graph';
import type {GPUDataFrameQuery} from './gpu-data-frame-query';
import {
  compileGPUDataFrameGlobalSort,
  type CompiledGPUDataFrameGlobalSort
} from './gpu-global-sort-compiler';
import {
  getGPUDataFrameAnalyticColumnFormat,
  type GPUDataFrameScalarColumnNames
} from './gpu-global-aggregation-query';
import type {GPUDataFrameQueryParameters} from './gpu-query-compiler';
import {compileGPUDataFrameSort, type CompiledGPUDataFrameSort} from './gpu-sort-compiler';

const MAXIMUM_UINT32 = 0xffffffff;

/** Stable per-batch scalar ordering, explicit null/NaN placement, and GPU sort implementation. */
export type GPUDataFrameSortOptions = Readonly<{
  /** Ascending or descending finite/infinite numeric ordering. */
  direction?: 'ascending' | 'descending';
  /** Absolute placement of explicitly invalid rows among accepted source rows. */
  nulls?: 'first' | 'last';
  /** Placement of NaN among valid rows, independently of source null ordering. */
  nans?: 'first' | 'last';
  /** Optional existing stable GPU sorting implementation. */
  algorithm?: 'auto' | 'bitonic' | 'radix';
}>;

/** Closed, immutable sort controls consumed directly by the graph-native sort compiler. @internal */
export type GPUDataFrameNormalizedSortOptions = Readonly<{
  direction: 'ascending' | 'descending';
  nulls: 'first' | 'last';
  nans: 'first' | 'last';
  algorithm: 'auto' | 'bitonic' | 'radix';
  limit?: number;
}>;

/**
 * Immutable stable scalar sorting or top-K plan.
 *
 * Each existing source batch is sorted independently: no source columns are copied, concatenated,
 * or repacked. Filtered rows always remain after accepted values, null placement is absolute, and
 * NaN placement applies only within the non-null portion of each batch.
 */
export class GPUDataFrameSortQuery<
  Logical extends GPUTypeMap,
  SelectedColumns extends keyof Logical & string,
  Column extends GPUDataFrameScalarColumnNames<Logical, SelectedColumns>,
  Source extends GPUTypeMap = Logical
> {
  /** Original filtered, projected, or derived dataframe query. */
  readonly query: GPUDataFrameQuery<Logical, SelectedColumns, Source>;
  /** Selected scalar column supplying stable numeric order. */
  readonly column: Column;
  /** Immutable, closed ordering controls and optional per-batch result limit. */
  readonly options: GPUDataFrameNormalizedSortOptions;

  /** Validates stable sorting metadata without allocating or retaining GPU resources. @internal */
  constructor(
    query: GPUDataFrameQuery<Logical, SelectedColumns, Source>,
    column: Column,
    options: GPUDataFrameSortOptions = {},
    limit?: number,
    defaultDirection: 'ascending' | 'descending' = 'ascending'
  ) {
    if (!query.selectedColumns.includes(column)) {
      throw new Error(`GPUDataFrame sort column "${column}" is not selected`);
    }
    if (!getGPUDataFrameAnalyticColumnFormat(query, column)) {
      throw new Error(`GPUDataFrame sort column "${column}" requires scalar GPU data`);
    }
    if (query.source.table.gpuConstants[column]) {
      throw new Error(`GPUDataFrame sort column "${column}" cannot be a constant`);
    }

    this.query = query;
    this.column = column;
    this.options = normalizeGPUDataFrameSortOptions(options, limit, defaultDirection);
    Object.freeze(this);
  }

  /** Restricts each source batch independently while preserving this plan's ordering controls. */
  topK(limit: number): GPUDataFrameSortQuery<Logical, SelectedColumns, Column, Source> {
    return new GPUDataFrameSortQuery(this.query, this.column, this.options, limit);
  }

  /** Adds stable source-row sorting and optional per-batch limiting to one reusable GPU graph. */
  compile(
    graph: GPUCommandGraph<GPUDataFrameQueryParameters>
  ): CompiledGPUDataFrameSort<Pick<Logical, SelectedColumns>> {
    return compileGPUDataFrameSort<Source, Pick<Logical, SelectedColumns>>(
      this.query.source,
      this.query.predicates,
      this.query.selectedColumns,
      this.query.derivedColumns,
      this.column,
      this.options,
      graph
    );
  }
}

/**
 * Explicit global scalar ordering across all preserved source batches.
 *
 * Source columns and record batches remain untouched; compilation creates only the GPU-resident
 * permutation, selected count, and explicitly required sort scratch.
 */
export class GPUDataFrameGlobalSortQuery<
  Logical extends GPUTypeMap,
  SelectedColumns extends keyof Logical & string,
  Column extends GPUDataFrameScalarColumnNames<Logical, SelectedColumns>,
  Source extends GPUTypeMap = Logical
> extends GPUDataFrameSortQuery<Logical, SelectedColumns, Column, Source> {
  /** Applies one global top-K bound across all source batches while preserving sort controls. */
  override topK(
    limit: number
  ): GPUDataFrameGlobalSortQuery<Logical, SelectedColumns, Column, Source> {
    return new GPUDataFrameGlobalSortQuery(this.query, this.column, this.options, limit);
  }

  /** Adds one cross-batch GPU permutation and global selected count to a reusable command graph. */
  override compile(
    graph: GPUCommandGraph<GPUDataFrameQueryParameters>
  ): CompiledGPUDataFrameGlobalSort<Pick<Logical, SelectedColumns>> {
    return compileGPUDataFrameGlobalSort<Source, Pick<Logical, SelectedColumns>>(
      this.query.source,
      this.query.predicates,
      this.query.selectedColumns,
      this.query.derivedColumns,
      this.column,
      this.options,
      graph
    );
  }
}

/** Clones closed ordering controls and rejects limits that cannot be represented by GPU counts. */
function normalizeGPUDataFrameSortOptions(
  options: GPUDataFrameSortOptions,
  limit: number | undefined,
  defaultDirection: 'ascending' | 'descending'
): GPUDataFrameNormalizedSortOptions {
  if (!options || typeof options !== 'object') {
    throw new Error('GPUDataFrame sorting options must be an object');
  }

  const direction = options.direction ?? defaultDirection;
  const nulls = options.nulls ?? 'last';
  const nans = options.nans ?? 'last';
  const algorithm = options.algorithm ?? 'auto';
  if (direction !== 'ascending' && direction !== 'descending') {
    throw new Error('GPUDataFrame sort direction must be ascending or descending');
  }
  if (nulls !== 'first' && nulls !== 'last') {
    throw new Error('GPUDataFrame sort nulls must be first or last');
  }
  if (nans !== 'first' && nans !== 'last') {
    throw new Error('GPUDataFrame sort NaNs must be first or last');
  }
  if (algorithm !== 'auto' && algorithm !== 'bitonic' && algorithm !== 'radix') {
    throw new Error('GPUDataFrame sort algorithm must be auto, bitonic, or radix');
  }
  if (
    limit !== undefined &&
    (!Number.isSafeInteger(limit) || limit < 0 || limit > MAXIMUM_UINT32)
  ) {
    throw new Error('GPUDataFrame top-K limits require a nonnegative uint32 count');
  }

  return Object.freeze({
    direction,
    nulls,
    nans,
    algorithm,
    ...(limit === undefined ? {} : {limit})
  });
}
