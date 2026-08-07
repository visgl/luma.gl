// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Independently implemented for WebGPU; inspired by NVIDIA RAPIDS cuDF.

import type {GPUTypeMap} from '@luma.gl/tables';
import type {GPUCommandGraph} from '../gpu-primitives/gpu-command-graph';
import type {LuDataFrameQuery} from './lu-data-frame-query';
import {
  getLuDataFrameAnalyticColumnFormat,
  type LuDataFrameScalarColumnNames
} from './lu-global-aggregation-query';
import {
  compileLuDataFrameHistogram,
  type CompiledLuDataFrameHistogram
} from './lu-histogram-compiler';
import type {LuDataFrameQueryParameters} from './lu-query-compiler';

const MAXIMUM_UINT32 = 0xffffffff;
const MAXIMUM_LITERAL_HISTOGRAM_EDGES = 257;

/** Explicit equal-width domain or strictly increasing irregular numeric histogram boundaries. */
export type LuDataFrameHistogramOptions =
  | Readonly<{bins: number; domain: readonly [number, number]}>
  | Readonly<{edges: readonly number[]}>;

/**
 * Immutable source-aligned numeric histogram query.
 *
 * Domains are always explicit because automatic whole-vector extents would include rows excluded
 * by filters or explicit null masks. Histogram planning never allocates GPU storage or reads data.
 */
export class LuDataFrameHistogramQuery<
  Logical extends GPUTypeMap,
  SelectedColumns extends keyof Logical & string,
  Column extends LuDataFrameScalarColumnNames<Logical, SelectedColumns>,
  Source extends GPUTypeMap = Logical
> {
  /** Original immutable filtered/derived source plan. */
  readonly query: LuDataFrameQuery<Logical, SelectedColumns, Source>;
  /** Selected float32, sint32, or uint32 source column. */
  readonly column: Column;
  /** Deep-frozen explicit histogram domain or irregular edges. */
  readonly options: LuDataFrameHistogramOptions;
  /** Number of dense GPU-resident output bins. */
  readonly binCount: number;

  /** Validates representable source-domain metadata without touching GPU resources. @internal */
  constructor(
    query: LuDataFrameQuery<Logical, SelectedColumns, Source>,
    column: Column,
    options: LuDataFrameHistogramOptions
  ) {
    if (!query.selectedColumns.includes(column)) {
      throw new Error(`LuDataFrame histogram column "${column}" is not selected`);
    }
    const format = getLuDataFrameAnalyticColumnFormat(query, column);
    if (!format) {
      throw new Error(`LuDataFrame histogram column "${column}" requires scalar GPU data`);
    }

    const normalized = normalizeLuDataFrameHistogramOptions(options, format);
    this.query = query;
    this.column = column;
    this.options = normalized;
    this.binCount = 'edges' in normalized ? normalized.edges.length - 1 : normalized.bins;
    Object.freeze(this);
  }

  /** Adds histogram work to the same reusable graph as source filtering and derived expressions. */
  compile(graph: GPUCommandGraph<LuDataFrameQueryParameters>): CompiledLuDataFrameHistogram {
    return compileLuDataFrameHistogram<Source, Pick<Logical, SelectedColumns>>(
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

/** Validates and deeply freezes explicit histogram metadata before GPU compilation. */
function normalizeLuDataFrameHistogramOptions(
  options: LuDataFrameHistogramOptions,
  format: 'float32' | 'sint32' | 'uint32'
): LuDataFrameHistogramOptions {
  if (!options || typeof options !== 'object') {
    throw new Error('LuDataFrame histograms require an explicit domain or literal edges');
  }
  if ('edges' in options) {
    if ('bins' in options || 'domain' in options) {
      throw new Error('LuDataFrame histogram edges cannot be combined with an equal-width domain');
    }
    if (
      !Array.isArray(options.edges) ||
      options.edges.length < 2 ||
      options.edges.length > MAXIMUM_LITERAL_HISTOGRAM_EDGES
    ) {
      throw new Error('LuDataFrame histogram edges require between 2 and 257 values');
    }
    const edges = options.edges.map(value => normalizeLuDataFrameHistogramBoundary(value, format));
    if (edges.some((value, index) => index > 0 && value <= edges[index - 1])) {
      throw new Error('LuDataFrame histogram edges must be strictly increasing');
    }
    return Object.freeze({edges: Object.freeze(edges)});
  }

  if (!('bins' in options) || !('domain' in options)) {
    throw new Error('LuDataFrame histograms require an explicit bin count and domain');
  }
  if (!Number.isSafeInteger(options.bins) || options.bins < 1 || options.bins > MAXIMUM_UINT32) {
    throw new Error('LuDataFrame histograms require a positive uint32 bin count');
  }
  if (!Array.isArray(options.domain) || options.domain.length !== 2) {
    throw new Error('LuDataFrame histograms require a finite [min, max] domain');
  }
  const minimum = normalizeLuDataFrameHistogramBoundary(options.domain[0], format);
  const maximum = normalizeLuDataFrameHistogramBoundary(options.domain[1], format);
  if (minimum > maximum) {
    throw new Error('LuDataFrame histogram domain minimum cannot exceed its maximum');
  }
  return Object.freeze({
    bins: options.bins,
    domain: Object.freeze([minimum, maximum] as [number, number])
  });
}

/** Ensures literal histogram boundaries fit their exact GPU scalar storage representation. */
function normalizeLuDataFrameHistogramBoundary(
  value: number,
  format: 'float32' | 'sint32' | 'uint32'
): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error('LuDataFrame histogram boundaries must contain finite numbers');
  }
  if (format === 'float32') {
    const rounded = Math.fround(value);
    if (!Number.isFinite(rounded)) {
      throw new Error('LuDataFrame histogram boundaries must fit their float32 column');
    }
    return rounded;
  }
  const minimum = format === 'uint32' ? 0 : -0x80000000;
  const maximum = format === 'uint32' ? MAXIMUM_UINT32 : 0x7fffffff;
  if (!Number.isInteger(value) || value < minimum || value > maximum) {
    throw new Error(`LuDataFrame histogram boundaries must fit their ${format} column`);
  }
  return value;
}
