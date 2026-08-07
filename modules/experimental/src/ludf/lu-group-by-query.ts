// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Independently implemented for WebGPU; inspired by NVIDIA RAPIDS cuDF.

import type {GPUTypeMap} from '@luma.gl/tables';
import type {GPUCommandGraph} from '../gpu-primitives/gpu-command-graph';
import type {LuDataFrameDictionary} from './lu-data-frame';
import type {LuDataFrameQuery} from './lu-data-frame-query';
import {getLuExpressionColumnNames} from './lu-expression';
import {
  compileLuDataFrameGroupedAggregation,
  type CompiledLuDataFrameGroupedAggregation
} from './lu-group-aggregation-compiler';
import type {LuDataFrameQueryParameters} from './lu-query-compiler';

/** Scalar statistics supported by dense GPU-resident categorical grouping. */
export type LuDataFrameAggregationOperation = 'count' | 'sum' | 'min' | 'max' | 'mean';

/** One normalized, immutable GPU group operation consumed by the graph compiler. */
export type LuDataFrameAggregationDefinition = Readonly<{
  /** Output dataframe field name. */
  name: string;
  /** Dense unsigned count or floating-point summary statistic. */
  operation: LuDataFrameAggregationOperation;
  /** Floating-point input field for sum, minimum, maximum, or mean. */
  column?: string;
}>;

/** Selects logical dataframe columns having one supported scalar storage format. */
export type LuDataFrameColumnNamesOfFormat<
  T extends GPUTypeMap,
  SelectedColumns extends keyof T & string,
  Format extends 'uint32' | 'float32'
> = {
  [Name in SelectedColumns]: T[Name] extends Format ? Name : never;
}[SelectedColumns];

/** Optional dense key-domain size when source categorical labels cannot establish it. */
export type LuDataFrameGroupByOptions = Readonly<{groupCount?: number}>;

/** One named count or a float32 statistic referencing a selected numerical column. */
export type LuDataFrameAggregationValue<
  T extends GPUTypeMap,
  SelectedColumns extends keyof T & string
> =
  | 'count'
  | Readonly<{sum: LuDataFrameColumnNamesOfFormat<T, SelectedColumns, 'float32'>}>
  | Readonly<{min: LuDataFrameColumnNamesOfFormat<T, SelectedColumns, 'float32'>}>
  | Readonly<{max: LuDataFrameColumnNamesOfFormat<T, SelectedColumns, 'float32'>}>
  | Readonly<{mean: LuDataFrameColumnNamesOfFormat<T, SelectedColumns, 'float32'>}>;

/** Caller-defined dense grouped output names and their corresponding statistics. */
export type LuDataFrameAggregationDefinitions<
  T extends GPUTypeMap,
  SelectedColumns extends keyof T & string = keyof T & string
> = Readonly<Record<string, LuDataFrameAggregationValue<T, SelectedColumns>>>;

/** Exact GPU result formats for the group-key column and every requested statistic. */
export type LuDataFrameGroupedAggregationResult<
  Key extends string,
  Definitions extends Readonly<Record<string, unknown>>
> = Record<Key, 'uint32'> & {
  [Name in keyof Definitions & string]: Definitions[Name] extends 'count' ? 'uint32' : 'float32';
};

/**
 * Immutable dense-key grouping plan that never allocates GPU resources.
 *
 * Dictionary-backed category labels establish the complete dense key domain. Other unsigned key
 * columns require an explicit positive `groupCount` so query planning never needs CPU readback.
 */
export class LuDataFrameGroupByQuery<
  Logical extends GPUTypeMap,
  SelectedColumns extends keyof Logical & string,
  Key extends LuDataFrameColumnNamesOfFormat<Logical, SelectedColumns, 'uint32'>,
  Source extends GPUTypeMap = Logical
> {
  /** Complete immutable source/filter/derived query retained without acquiring a resource lease. */
  readonly query: LuDataFrameQuery<Logical, SelectedColumns, Source>;
  /** Existing unsigned logical column providing dense categorical row keys. */
  readonly key: Key;
  /** Number of output groups inferred from labels or supplied explicitly by the caller. */
  readonly groupCount: number;

  /** Validates grouping metadata entirely on the CPU. @internal */
  constructor(
    query: LuDataFrameQuery<Logical, SelectedColumns, Source>,
    key: Key,
    options: LuDataFrameGroupByOptions = {}
  ) {
    if (!query.selectedColumns.includes(key)) {
      throw new Error(`LuDataFrame group key "${key}" is not selected`);
    }
    if (getLuDataFrameQueryColumnFormats(query).get(key) !== 'uint32') {
      throw new Error(`LuDataFrame group key "${key}" requires a uint32 column`);
    }

    const dictionary = (query.source.dictionaries as Record<string, LuDataFrameDictionary>)[key];
    const dictionaryCount = getLuDataFrameDictionaryLength(dictionary);
    if (options.groupCount !== undefined && dictionaryCount !== undefined) {
      if (options.groupCount !== dictionaryCount) {
        throw new Error('LuDataFrame group count must match the category dictionary');
      }
    }
    const groupCount = options.groupCount ?? dictionaryCount;
    if (
      !Number.isSafeInteger(groupCount) ||
      !groupCount ||
      groupCount < 1 ||
      groupCount > 0xffffffff
    ) {
      throw new Error('LuDataFrame grouping requires a positive uint32 group count');
    }

    this.query = query;
    this.key = key;
    this.groupCount = groupCount;
    Object.freeze(this);
  }

  /** Plans named dense count/sum/min/max/mean outputs without touching GPU resources. */
  aggregate<Definitions extends LuDataFrameAggregationDefinitions<Logical, SelectedColumns>>(
    definitions: Definitions
  ): LuDataFrameGroupedAggregationQuery<Logical, SelectedColumns, Key, Definitions, Source> {
    return new LuDataFrameGroupedAggregationQuery<
      Logical,
      SelectedColumns,
      Key,
      Definitions,
      Source
    >(this.query, this.key, this.groupCount, definitions);
  }
}

/** Immutable dense aggregation query lowered to existing graph-native GPU group primitives. */
export class LuDataFrameGroupedAggregationQuery<
  Logical extends GPUTypeMap,
  SelectedColumns extends keyof Logical & string,
  Key extends LuDataFrameColumnNamesOfFormat<Logical, SelectedColumns, 'uint32'>,
  Definitions extends LuDataFrameAggregationDefinitions<Logical, SelectedColumns>,
  Source extends GPUTypeMap = Logical
> {
  /** Complete source query preserving immutable filters, projections, and derived expressions. */
  readonly query: LuDataFrameQuery<Logical, SelectedColumns, Source>;
  /** Dense unsigned group key exposed as the first output dataframe column. */
  readonly key: Key;
  /** Complete category domain and grouped output row count. */
  readonly groupCount: number;
  /** Named operations normalized in the caller's original object insertion order. */
  readonly definitions: readonly LuDataFrameAggregationDefinition[];

  /** Validates all supported operations, names, and selected float32 metric inputs. @internal */
  constructor(
    query: LuDataFrameQuery<Logical, SelectedColumns, Source>,
    key: Key,
    groupCount: number,
    definitions: Definitions
  ) {
    this.query = query;
    this.key = key;
    this.groupCount = groupCount;
    this.definitions = Object.freeze(normalizeLuDataFrameAggregations(query, key, definitions));
    Object.freeze(this);
  }

  /** Encodes reusable grouping, filtering, and derived work into one caller-owned command graph. */
  compile(
    graph: GPUCommandGraph<LuDataFrameQueryParameters>
  ): CompiledLuDataFrameGroupedAggregation<LuDataFrameGroupedAggregationResult<Key, Definitions>> {
    return compileLuDataFrameGroupedAggregation<
      Source,
      Pick<Logical, SelectedColumns>,
      LuDataFrameGroupedAggregationResult<Key, Definitions>
    >(
      this.query.source,
      this.query.predicates,
      this.query.selectedColumns,
      this.query.derivedColumns,
      this.key,
      this.groupCount,
      this.definitions,
      graph
    );
  }
}

/** Normalizes a closed set of operation shapes without accepting arbitrary shader expressions. */
function normalizeLuDataFrameAggregations<
  Logical extends GPUTypeMap,
  SelectedColumns extends keyof Logical & string,
  Source extends GPUTypeMap
>(
  query: LuDataFrameQuery<Logical, SelectedColumns, Source>,
  key: string,
  definitions: LuDataFrameAggregationDefinitions<Logical, SelectedColumns>
): LuDataFrameAggregationDefinition[] {
  const entries = Object.entries(definitions);
  if (entries.length === 0) {
    throw new Error('LuDataFrame grouping requires at least one aggregation');
  }

  const formats = getLuDataFrameQueryColumnFormats(query);
  const normalized: LuDataFrameAggregationDefinition[] = [];
  for (const [name, value] of entries) {
    if (name.length === 0 || name === key) {
      throw new Error('LuDataFrame aggregation names must be distinct from the group key');
    }
    if (value === 'count') {
      normalized.push(Object.freeze({name, operation: 'count'}));
      continue;
    }
    if (!value || typeof value !== 'object') {
      throw new Error(`LuDataFrame aggregation "${name}" has an unsupported operation`);
    }

    const operations = Object.entries(value);
    if (operations.length !== 1) {
      throw new Error(`LuDataFrame aggregation "${name}" requires exactly one operation`);
    }
    const [operation, column] = operations[0];
    if (operation !== 'sum' && operation !== 'min' && operation !== 'max' && operation !== 'mean') {
      throw new Error(`LuDataFrame aggregation "${name}" has an unsupported operation`);
    }
    if (typeof column !== 'string' || !query.selectedColumns.includes(column as SelectedColumns)) {
      throw new Error(`LuDataFrame aggregation "${name}" requires a selected input column`);
    }
    if (formats.get(column) !== 'float32') {
      throw new Error(`LuDataFrame aggregation "${name}" requires a float32 input column`);
    }
    normalized.push(Object.freeze({name, operation, column}));
  }

  return normalized;
}

/** Resolves original and derived logical scalar formats using canonical GPU column metadata. */
function getLuDataFrameQueryColumnFormats<
  Logical extends GPUTypeMap,
  SelectedColumns extends keyof Logical & string
>(query: LuDataFrameQuery<Logical, SelectedColumns, any>): Map<string, string | undefined> {
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

  return formats;
}

/** Reads explicit adapter-owned categorical metadata without introducing an Apache Arrow import. */
function getLuDataFrameDictionaryLength(dictionary?: LuDataFrameDictionary): number | undefined {
  if (!dictionary) {
    return undefined;
  }
  return Array.isArray(dictionary)
    ? dictionary.length
    : (dictionary as {values: readonly unknown[]}).values.length;
}
