// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Independently implemented for WebGPU; inspired by NVIDIA RAPIDS cuDF.

import type {GPUTypeMap} from '@luma.gl/experimental/gpu-tables';
import type {GPUCommandGraph} from '@luma.gl/gpgpu/gpu-core';
import type {GPUDataFrameQuery} from './gpu-data-frame-query';
import {getGPUExpressionColumnNames} from './gpu-expression';
import {
  compileGPUDataFrameAggregation,
  type CompiledGPUDataFrameAggregation
} from './gpu-global-aggregation-compiler';
import type {GPUDataFrameAggregationDefinition} from './gpu-group-by-query';
import type {GPUDataFrameQueryParameters} from './gpu-query-compiler';

/** Fixed-width numeric formats supported by GPU reductions and histogram binning. */
export type GPUDataFrameAnalyticScalarFormat = 'float32' | 'sint32' | 'uint32';

/** Selected logical column names carrying one portable GPU-native numeric scalar value. */
export type GPUDataFrameScalarColumnNames<
  T extends GPUTypeMap,
  SelectedColumns extends keyof T & string
> = {
  [Name in SelectedColumns]: T[Name] extends GPUDataFrameAnalyticScalarFormat ? Name : never;
}[SelectedColumns];

/** One source-row count or a global numeric statistic referencing a selected scalar column. */
export type GPUDataFrameGlobalAggregationValue<
  T extends GPUTypeMap,
  SelectedColumns extends keyof T & string
> =
  | 'count'
  | Readonly<{sum: GPUDataFrameScalarColumnNames<T, SelectedColumns>}>
  | Readonly<{min: GPUDataFrameScalarColumnNames<T, SelectedColumns>}>
  | Readonly<{max: GPUDataFrameScalarColumnNames<T, SelectedColumns>}>
  | Readonly<{mean: GPUDataFrameScalarColumnNames<T, SelectedColumns>}>;

/** Caller-defined global reduction output names and closed statistic descriptions. */
export type GPUDataFrameGlobalAggregationDefinitions<
  T extends GPUTypeMap,
  SelectedColumns extends keyof T & string = keyof T & string
> = Readonly<Record<string, GPUDataFrameGlobalAggregationValue<T, SelectedColumns>>>;

/** Exact result scalar format retained for one requested global statistic. */
type GPUDataFrameGlobalAggregationValueFormat<T extends GPUTypeMap, Value> = Value extends 'count'
  ? 'uint32'
  : Value extends {mean: string}
    ? 'float32'
    : Value extends {sum: infer Column extends keyof T & string}
      ? Extract<T[Column], GPUDataFrameAnalyticScalarFormat>
      : Value extends {min: infer Column extends keyof T & string}
        ? Extract<T[Column], GPUDataFrameAnalyticScalarFormat>
        : Value extends {max: infer Column extends keyof T & string}
          ? Extract<T[Column], GPUDataFrameAnalyticScalarFormat>
          : never;

/** Exact one-row GPU table formats produced by caller-defined global numeric reductions. */
export type GPUDataFrameGlobalAggregationResult<
  T extends GPUTypeMap,
  Definitions extends Readonly<Record<string, unknown>>
> = {
  [Name in keyof Definitions & string]: GPUDataFrameGlobalAggregationValueFormat<
    T,
    Definitions[Name]
  >;
};

/**
 * Immutable one-row global count, sum, minimum, maximum, and mean reduction query.
 *
 * Sum/min/max retain the source column format; mean always produces float32, and count produces
 * uint32. Explicit GPU validity sidecars distinguish empty or fully rejected statistic inputs.
 */
export class GPUDataFrameAggregationQuery<
  Logical extends GPUTypeMap,
  SelectedColumns extends keyof Logical & string,
  Definitions extends GPUDataFrameGlobalAggregationDefinitions<Logical, SelectedColumns>,
  Source extends GPUTypeMap = Logical
> {
  /** Original immutable filtered, projected, or derived source-row query. */
  readonly query: GPUDataFrameQuery<Logical, SelectedColumns, Source>;
  /** Closed GPU reduction operations in stable caller-provided output-column order. */
  readonly definitions: readonly GPUDataFrameAggregationDefinition[];

  /** Validates selected 32-bit scalar inputs without acquiring a GPU source lease. @internal */
  constructor(
    query: GPUDataFrameQuery<Logical, SelectedColumns, Source>,
    definitions: Definitions
  ) {
    this.query = query;
    this.definitions = Object.freeze(normalizeGPUDataFrameGlobalAggregations(query, definitions));
    Object.freeze(this);
  }

  /** Adds filtered, null-aware reductions to one reusable application-owned command graph. */
  compile(
    graph: GPUCommandGraph<GPUDataFrameQueryParameters>
  ): CompiledGPUDataFrameAggregation<GPUDataFrameGlobalAggregationResult<Logical, Definitions>> {
    return compileGPUDataFrameAggregation<
      Source,
      Pick<Logical, SelectedColumns>,
      GPUDataFrameGlobalAggregationResult<Logical, Definitions>
    >(
      this.query.source,
      this.query.predicates,
      this.query.selectedColumns,
      this.query.derivedColumns,
      this.definitions,
      graph
    );
  }
}

/** Resolves one logical source/derived scalar format from canonical GPU column metadata. @internal */
export function getGPUDataFrameAnalyticColumnFormat<
  Logical extends GPUTypeMap,
  SelectedColumns extends keyof Logical & string,
  Source extends GPUTypeMap
>(
  query: GPUDataFrameQuery<Logical, SelectedColumns, Source>,
  name: string
): GPUDataFrameAnalyticScalarFormat | undefined {
  const formats = new Map<string, string | undefined>(
    query.source.schema.fields.map(
      field =>
        [field.name, query.source.table.gpuColumns[field.name]?.format ?? field.format] as const
    )
  );
  for (const definition of query.derivedColumns) {
    const firstReference = getGPUExpressionColumnNames(definition.expression)[0];
    formats.set(definition.name, definition.format ?? formats.get(firstReference) ?? 'float32');
  }
  const format = formats.get(name);
  return format === 'float32' || format === 'sint32' || format === 'uint32' ? format : undefined;
}

/** Rejects unselected columns and non-closed aggregation operators before touching GPU state. */
function normalizeGPUDataFrameGlobalAggregations<
  Logical extends GPUTypeMap,
  SelectedColumns extends keyof Logical & string,
  Source extends GPUTypeMap
>(
  query: GPUDataFrameQuery<Logical, SelectedColumns, Source>,
  definitions: GPUDataFrameGlobalAggregationDefinitions<Logical, SelectedColumns>
): GPUDataFrameAggregationDefinition[] {
  const entries = Object.entries(definitions);
  if (entries.length === 0) {
    throw new Error('GPUDataFrame global reductions require at least one aggregation');
  }

  const normalized: GPUDataFrameAggregationDefinition[] = [];
  for (const [name, value] of entries) {
    if (name.length === 0) {
      throw new Error('GPUDataFrame global aggregations require nonempty output names');
    }
    if (value === 'count') {
      normalized.push(Object.freeze({name, operation: 'count'}));
      continue;
    }
    if (!value || typeof value !== 'object') {
      throw new Error(`GPUDataFrame global aggregation "${name}" has an unsupported operation`);
    }
    const entries = Object.entries(value);
    if (entries.length !== 1) {
      throw new Error(`GPUDataFrame global aggregation "${name}" requires exactly one operation`);
    }
    const [operation, column] = entries[0];
    if (operation !== 'sum' && operation !== 'min' && operation !== 'max' && operation !== 'mean') {
      throw new Error(`GPUDataFrame global aggregation "${name}" has an unsupported operation`);
    }
    if (typeof column !== 'string' || !query.selectedColumns.includes(column as SelectedColumns)) {
      throw new Error(`GPUDataFrame global aggregation "${name}" requires a selected input column`);
    }
    if (!getGPUDataFrameAnalyticColumnFormat(query, column)) {
      throw new Error(`GPUDataFrame global aggregation "${name}" requires a scalar GPU column`);
    }
    normalized.push(Object.freeze({name, operation, column}));
  }

  return normalized;
}
