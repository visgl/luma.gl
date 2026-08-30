// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Independently implemented for WebGPU; inspired by NVIDIA RAPIDS cuDF.

import type {GPUTypeMap} from '@luma.gl/experimental/gpu-tables';
import type {GPUCommandGraph} from '@luma.gl/gpgpu/gpu-core';
import type {GPUDataFrameQuery} from './gpu-data-frame-query';
import {
  getGPUDataFrameAnalyticColumnFormat,
  type GPUDataFrameScalarColumnNames
} from './gpu-global-aggregation-query';
import {
  compileGPUDataFrameHistogram,
  type CompiledGPUDataFrameHistogram
} from './gpu-histogram-compiler';
import type {GPUDataFrameQueryParameters} from './gpu-query-compiler';

const MAXIMUM_UINT32 = 0xffffffff;
const MAXIMUM_LITERAL_HISTOGRAM_EDGES = 257;

/** Explicit equal-width domain or strictly increasing irregular numeric histogram boundaries. */
export type GPUDataFrameHistogramOptions =
  | Readonly<{bins: number; domain: readonly [number, number]}>
  | Readonly<{edges: readonly number[]}>;

/**
 * Immutable source-aligned numeric histogram query.
 *
 * Domains are always explicit because automatic whole-vector extents would include rows excluded
 * by filters or explicit null masks. Histogram planning never allocates GPU storage or reads data.
 */
export class GPUDataFrameHistogramQuery<
  Logical extends GPUTypeMap,
  SelectedColumns extends keyof Logical & string,
  Column extends GPUDataFrameScalarColumnNames<Logical, SelectedColumns>,
  Source extends GPUTypeMap = Logical
> {
  /** Original immutable filtered/derived source plan. */
  readonly query: GPUDataFrameQuery<Logical, SelectedColumns, Source>;
  /** Selected float32, sint32, or uint32 source column. */
  readonly column: Column;
  /** Deep-frozen explicit histogram domain or irregular edges. */
  readonly options: GPUDataFrameHistogramOptions;
  /** Number of dense GPU-resident output bins. */
  readonly binCount: number;

  /** Validates representable source-domain metadata without touching GPU resources. @internal */
  constructor(
    query: GPUDataFrameQuery<Logical, SelectedColumns, Source>,
    column: Column,
    options: GPUDataFrameHistogramOptions
  ) {
    if (!query.selectedColumns.includes(column)) {
      throw new Error(`GPUDataFrame histogram column "${column}" is not selected`);
    }
    const format = getGPUDataFrameAnalyticColumnFormat(query, column);
    if (!format) {
      throw new Error(`GPUDataFrame histogram column "${column}" requires scalar GPU data`);
    }

    const normalized = normalizeGPUDataFrameHistogramOptions(options, format);
    this.query = query;
    this.column = column;
    this.options = normalized;
    this.binCount = 'edges' in normalized ? normalized.edges.length - 1 : normalized.bins;
    Object.freeze(this);
  }

  /** Adds histogram work to the same reusable graph as source filtering and derived expressions. */
  compile(graph: GPUCommandGraph<GPUDataFrameQueryParameters>): CompiledGPUDataFrameHistogram {
    return compileGPUDataFrameHistogram<Source, Pick<Logical, SelectedColumns>>(
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
function normalizeGPUDataFrameHistogramOptions(
  options: GPUDataFrameHistogramOptions,
  format: 'float32' | 'sint32' | 'uint32'
): GPUDataFrameHistogramOptions {
  if (!options || typeof options !== 'object') {
    throw new Error('GPUDataFrame histograms require an explicit domain or literal edges');
  }
  if ('edges' in options) {
    if ('bins' in options || 'domain' in options) {
      throw new Error('GPUDataFrame histogram edges cannot be combined with an equal-width domain');
    }
    if (
      !Array.isArray(options.edges) ||
      options.edges.length < 2 ||
      options.edges.length > MAXIMUM_LITERAL_HISTOGRAM_EDGES
    ) {
      throw new Error('GPUDataFrame histogram edges require between 2 and 257 values');
    }
    const edges = options.edges.map(value => normalizeGPUDataFrameHistogramBoundary(value, format));
    if (edges.some((value, index) => index > 0 && value <= edges[index - 1])) {
      throw new Error('GPUDataFrame histogram edges must be strictly increasing');
    }
    return Object.freeze({edges: Object.freeze(edges)});
  }

  if (!('bins' in options) || !('domain' in options)) {
    throw new Error('GPUDataFrame histograms require an explicit bin count and domain');
  }
  if (!Number.isSafeInteger(options.bins) || options.bins < 1 || options.bins > MAXIMUM_UINT32) {
    throw new Error('GPUDataFrame histograms require a positive uint32 bin count');
  }
  if (!Array.isArray(options.domain) || options.domain.length !== 2) {
    throw new Error('GPUDataFrame histograms require a finite [min, max] domain');
  }
  const minimum = normalizeGPUDataFrameHistogramBoundary(options.domain[0], format);
  const maximum = normalizeGPUDataFrameHistogramBoundary(options.domain[1], format);
  if (minimum > maximum) {
    throw new Error('GPUDataFrame histogram domain minimum cannot exceed its maximum');
  }
  return Object.freeze({
    bins: options.bins,
    domain: Object.freeze([minimum, maximum] as [number, number])
  });
}

/** Ensures literal histogram boundaries fit their exact GPU scalar storage representation. */
function normalizeGPUDataFrameHistogramBoundary(
  value: number,
  format: 'float32' | 'sint32' | 'uint32'
): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error('GPUDataFrame histogram boundaries must contain finite numbers');
  }
  if (format === 'float32') {
    const rounded = Math.fround(value);
    if (!Number.isFinite(rounded)) {
      throw new Error('GPUDataFrame histogram boundaries must fit their float32 column');
    }
    return rounded;
  }
  const minimum = format === 'uint32' ? 0 : -0x80000000;
  const maximum = format === 'uint32' ? MAXIMUM_UINT32 : 0x7fffffff;
  if (!Number.isInteger(value) || value < minimum || value > maximum) {
    throw new Error(`GPUDataFrame histogram boundaries must fit their ${format} column`);
  }
  return value;
}
