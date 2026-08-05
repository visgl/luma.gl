// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {GPUTypeMap} from '@luma.gl/tables';
import type {GPUCommandGraph} from '../gpu-primitives/gpu-command-graph';
import type {LuDataFrameQuery} from './lu-data-frame-query';
import {getLuExpressionColumnNames} from './lu-expression';
import {
  compileLuDataFrameAggregation,
  type CompiledLuDataFrameAggregation
} from './lu-global-aggregation-compiler';
import type {LuDataFrameAggregationDefinition} from './lu-group-by-query';
import type {LuDataFrameQueryParameters} from './lu-query-compiler';

/** Fixed-width numeric formats supported by GPU reductions and histogram binning. */
export type LuDataFrameAnalyticScalarFormat = 'float32' | 'sint32' | 'uint32';

/** Selected logical column names carrying one portable GPU-native numeric scalar value. */
export type LuDataFrameScalarColumnNames<
  T extends GPUTypeMap,
  SelectedColumns extends keyof T & string
> = {
  [Name in SelectedColumns]: T[Name] extends LuDataFrameAnalyticScalarFormat ? Name : never;
}[SelectedColumns];

/** One source-row count or a global numeric statistic referencing a selected scalar column. */
export type LuDataFrameGlobalAggregationValue<
  T extends GPUTypeMap,
  SelectedColumns extends keyof T & string
> =
  | 'count'
  | Readonly<{sum: LuDataFrameScalarColumnNames<T, SelectedColumns>}>
  | Readonly<{min: LuDataFrameScalarColumnNames<T, SelectedColumns>}>
  | Readonly<{max: LuDataFrameScalarColumnNames<T, SelectedColumns>}>
  | Readonly<{mean: LuDataFrameScalarColumnNames<T, SelectedColumns>}>;

/** Caller-defined global reduction output names and closed statistic descriptions. */
export type LuDataFrameGlobalAggregationDefinitions<
  T extends GPUTypeMap,
  SelectedColumns extends keyof T & string = keyof T & string
> = Readonly<Record<string, LuDataFrameGlobalAggregationValue<T, SelectedColumns>>>;

/** Exact result scalar format retained for one requested global statistic. */
type LuDataFrameGlobalAggregationValueFormat<T extends GPUTypeMap, Value> = Value extends 'count'
  ? 'uint32'
  : Value extends {mean: string}
    ? 'float32'
    : Value extends {sum: infer Column extends keyof T & string}
      ? Extract<T[Column], LuDataFrameAnalyticScalarFormat>
      : Value extends {min: infer Column extends keyof T & string}
        ? Extract<T[Column], LuDataFrameAnalyticScalarFormat>
        : Value extends {max: infer Column extends keyof T & string}
          ? Extract<T[Column], LuDataFrameAnalyticScalarFormat>
          : never;

/** Exact one-row GPU table formats produced by caller-defined global numeric reductions. */
export type LuDataFrameGlobalAggregationResult<
  T extends GPUTypeMap,
  Definitions extends Readonly<Record<string, unknown>>
> = {
  [Name in keyof Definitions & string]: LuDataFrameGlobalAggregationValueFormat<
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
export class LuDataFrameAggregationQuery<
  Logical extends GPUTypeMap,
  SelectedColumns extends keyof Logical & string,
  Definitions extends LuDataFrameGlobalAggregationDefinitions<Logical, SelectedColumns>,
  Source extends GPUTypeMap = Logical
> {
  /** Original immutable filtered, projected, or derived source-row query. */
  readonly query: LuDataFrameQuery<Logical, SelectedColumns, Source>;
  /** Closed GPU reduction operations in stable caller-provided output-column order. */
  readonly definitions: readonly LuDataFrameAggregationDefinition[];

  /** Validates selected 32-bit scalar inputs without acquiring a GPU source lease. @internal */
  constructor(query: LuDataFrameQuery<Logical, SelectedColumns, Source>, definitions: Definitions) {
    this.query = query;
    this.definitions = Object.freeze(normalizeLuDataFrameGlobalAggregations(query, definitions));
    Object.freeze(this);
  }

  /** Adds filtered, null-aware reductions to one reusable application-owned command graph. */
  compile(
    graph: GPUCommandGraph<LuDataFrameQueryParameters>
  ): CompiledLuDataFrameAggregation<LuDataFrameGlobalAggregationResult<Logical, Definitions>> {
    return compileLuDataFrameAggregation<
      Source,
      Pick<Logical, SelectedColumns>,
      LuDataFrameGlobalAggregationResult<Logical, Definitions>
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
export function getLuDataFrameAnalyticColumnFormat<
  Logical extends GPUTypeMap,
  SelectedColumns extends keyof Logical & string,
  Source extends GPUTypeMap
>(
  query: LuDataFrameQuery<Logical, SelectedColumns, Source>,
  name: string
): LuDataFrameAnalyticScalarFormat | undefined {
  const formats = new Map<string, string | undefined>(
    query.source.schema.fields.map(
      field =>
        [field.name, query.source.table.gpuColumns[field.name]?.format ?? field.format] as const
    )
  );
  for (const definition of query.derivedColumns) {
    const firstReference = getLuExpressionColumnNames(definition.expression)[0];
    formats.set(definition.name, definition.format ?? formats.get(firstReference) ?? 'float32');
  }
  const format = formats.get(name);
  return format === 'float32' || format === 'sint32' || format === 'uint32' ? format : undefined;
}

/** Rejects unselected columns and non-closed aggregation operators before touching GPU state. */
function normalizeLuDataFrameGlobalAggregations<
  Logical extends GPUTypeMap,
  SelectedColumns extends keyof Logical & string,
  Source extends GPUTypeMap
>(
  query: LuDataFrameQuery<Logical, SelectedColumns, Source>,
  definitions: LuDataFrameGlobalAggregationDefinitions<Logical, SelectedColumns>
): LuDataFrameAggregationDefinition[] {
  const entries = Object.entries(definitions);
  if (entries.length === 0) {
    throw new Error('LuDataFrame global reductions require at least one aggregation');
  }

  const normalized: LuDataFrameAggregationDefinition[] = [];
  for (const [name, value] of entries) {
    if (name.length === 0) {
      throw new Error('LuDataFrame global aggregations require nonempty output names');
    }
    if (value === 'count') {
      normalized.push(Object.freeze({name, operation: 'count'}));
      continue;
    }
    if (!value || typeof value !== 'object') {
      throw new Error(`LuDataFrame global aggregation "${name}" has an unsupported operation`);
    }
    const entries = Object.entries(value);
    if (entries.length !== 1) {
      throw new Error(`LuDataFrame global aggregation "${name}" requires exactly one operation`);
    }
    const [operation, column] = entries[0];
    if (operation !== 'sum' && operation !== 'min' && operation !== 'max' && operation !== 'mean') {
      throw new Error(`LuDataFrame global aggregation "${name}" has an unsupported operation`);
    }
    if (typeof column !== 'string' || !query.selectedColumns.includes(column as SelectedColumns)) {
      throw new Error(`LuDataFrame global aggregation "${name}" requires a selected input column`);
    }
    if (!getLuDataFrameAnalyticColumnFormat(query, column)) {
      throw new Error(`LuDataFrame global aggregation "${name}" requires a scalar GPU column`);
    }
    normalized.push(Object.freeze({name, operation, column}));
  }

  return normalized;
}
