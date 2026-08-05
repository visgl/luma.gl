// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {GPUTypeMap} from '@luma.gl/tables';
import type {GPUCommandGraph} from '../gpu-primitives/gpu-command-graph';
import type {LuDataFrameQuery} from './lu-data-frame-query';
import {
  getLuDataFrameAnalyticColumnFormat,
  type LuDataFrameScalarColumnNames
} from './lu-global-aggregation-query';
import type {LuDataFrameQueryParameters} from './lu-query-compiler';
import {compileLuDataFrameSort, type CompiledLuDataFrameSort} from './lu-sort-compiler';

const MAXIMUM_UINT32 = 0xffffffff;

/** Stable per-batch scalar ordering, explicit null/NaN placement, and GPU sort implementation. */
export type LuDataFrameSortOptions = Readonly<{
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
export type LuDataFrameNormalizedSortOptions = Readonly<{
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
export class LuDataFrameSortQuery<
  Logical extends GPUTypeMap,
  SelectedColumns extends keyof Logical & string,
  Column extends LuDataFrameScalarColumnNames<Logical, SelectedColumns>,
  Source extends GPUTypeMap = Logical
> {
  /** Original filtered, projected, or derived dataframe query. */
  readonly query: LuDataFrameQuery<Logical, SelectedColumns, Source>;
  /** Selected scalar column supplying stable numeric order. */
  readonly column: Column;
  /** Immutable, closed ordering controls and optional per-batch result limit. */
  readonly options: LuDataFrameNormalizedSortOptions;

  /** Validates stable sorting metadata without allocating or retaining GPU resources. @internal */
  constructor(
    query: LuDataFrameQuery<Logical, SelectedColumns, Source>,
    column: Column,
    options: LuDataFrameSortOptions = {},
    limit?: number,
    defaultDirection: 'ascending' | 'descending' = 'ascending'
  ) {
    if (!query.selectedColumns.includes(column)) {
      throw new Error(`LuDataFrame sort column "${column}" is not selected`);
    }
    if (!getLuDataFrameAnalyticColumnFormat(query, column)) {
      throw new Error(`LuDataFrame sort column "${column}" requires scalar GPU data`);
    }
    if (query.source.table.gpuConstants[column]) {
      throw new Error(`LuDataFrame sort column "${column}" cannot be a constant`);
    }

    this.query = query;
    this.column = column;
    this.options = normalizeLuDataFrameSortOptions(options, limit, defaultDirection);
    Object.freeze(this);
  }

  /** Restricts each source batch independently while preserving this plan's ordering controls. */
  topK(limit: number): LuDataFrameSortQuery<Logical, SelectedColumns, Column, Source> {
    return new LuDataFrameSortQuery(this.query, this.column, this.options, limit);
  }

  /** Adds stable source-row sorting and optional per-batch limiting to one reusable GPU graph. */
  compile(
    graph: GPUCommandGraph<LuDataFrameQueryParameters>
  ): CompiledLuDataFrameSort<Pick<Logical, SelectedColumns>> {
    return compileLuDataFrameSort<Source, Pick<Logical, SelectedColumns>>(
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
function normalizeLuDataFrameSortOptions(
  options: LuDataFrameSortOptions,
  limit: number | undefined,
  defaultDirection: 'ascending' | 'descending'
): LuDataFrameNormalizedSortOptions {
  if (!options || typeof options !== 'object') {
    throw new Error('LuDataFrame sorting options must be an object');
  }

  const direction = options.direction ?? defaultDirection;
  const nulls = options.nulls ?? 'last';
  const nans = options.nans ?? 'last';
  const algorithm = options.algorithm ?? 'auto';
  if (direction !== 'ascending' && direction !== 'descending') {
    throw new Error('LuDataFrame sort direction must be ascending or descending');
  }
  if (nulls !== 'first' && nulls !== 'last') {
    throw new Error('LuDataFrame sort nulls must be first or last');
  }
  if (nans !== 'first' && nans !== 'last') {
    throw new Error('LuDataFrame sort NaNs must be first or last');
  }
  if (algorithm !== 'auto' && algorithm !== 'bitonic' && algorithm !== 'radix') {
    throw new Error('LuDataFrame sort algorithm must be auto, bitonic, or radix');
  }
  if (
    limit !== undefined &&
    (!Number.isSafeInteger(limit) || limit < 0 || limit > MAXIMUM_UINT32)
  ) {
    throw new Error('LuDataFrame top-K limits require a nonnegative uint32 count');
  }

  return Object.freeze({
    direction,
    nulls,
    nans,
    algorithm,
    ...(limit === undefined ? {} : {limit})
  });
}
