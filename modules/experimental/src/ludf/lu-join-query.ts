// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Independently implemented for WebGPU; inspired by NVIDIA RAPIDS cuDF.

import type {GPUTypeMap} from '@luma.gl/tables';
import type {GPUCommandGraph} from '../gpu-primitives/gpu-command-graph';
import type {LuDataFrame, LuDataFrameDictionary} from './lu-data-frame';
import type {LuDataFrameQuery} from './lu-data-frame-query';
import {getLuDataFrameAnalyticColumnFormat} from './lu-global-aggregation-query';
import type {LuDataFrameColumnNamesOfFormat} from './lu-group-by-query';
import {
  compileLuDataFrameJoin,
  compileLuDataFrameLookup,
  type CompiledLuDataFrameJoin,
  type CompiledLuDataFrameLookup
} from './lu-join-compiler';
import type {LuDataFrameQueryParameters} from './lu-query-compiler';

const MAXIMUM_UINT32 = 0xffffffff;
const MAXIMUM_HASH_CAPACITY = 0x80000000;

/** Unique-right inner-join columns, per-batch output capacity, and bounded hash-index controls. */
export type LuDataFrameJoinOptions<
  LeftKey extends string = string,
  RightKey extends string = string
> = Readonly<{
  /** Selected unsigned key column on the left dataframe. */
  leftOn: LeftKey;
  /** Unsigned unique-key column on the right dataframe. */
  rightOn: RightKey;
  /** Optional maximum number of published pairs in each original left source batch. */
  capacity?: number;
  /** Optional power-of-two slot count for the reusable GPU hash index. */
  indexCapacity?: number;
  /** Optional bounded linear-probe count for index construction and left lookups. */
  maxProbeCount?: number;
}>;

/** Source-aligned unique-right lookup columns and bounded GPU hash-index controls. */
export type LuDataFrameLookupOptions<
  LeftKey extends string = string,
  RightKey extends string = string
> = Readonly<{
  /** Selected unsigned key column on the left dataframe. */
  leftOn: LeftKey;
  /** Unsigned unique-key column on the right dataframe. */
  rightOn: RightKey;
  /** Optional power-of-two slot count for the reusable GPU hash index. */
  indexCapacity?: number;
  /** Optional bounded linear-probe count for index construction and left lookups. */
  maxProbeCount?: number;
}>;

/** Validated, immutable unique-right index and per-batch join controls. @internal */
export type LuDataFrameNormalizedJoinOptions<
  LeftKey extends string = string,
  RightKey extends string = string
> = Readonly<{
  leftOn: LeftKey;
  rightOn: RightKey;
  indexCapacity: number;
  maxProbeCount: number;
  capacity?: number;
}>;

/** Immutable bounded, stable, unique-right unsigned inner join without source materialization. */
export class LuDataFrameJoinQuery<
  Logical extends GPUTypeMap,
  SelectedColumns extends keyof Logical & string,
  Right extends GPUTypeMap,
  LeftKey extends LuDataFrameColumnNamesOfFormat<Logical, SelectedColumns, 'uint32'>,
  RightKey extends LuDataFrameColumnNamesOfFormat<Right, keyof Right & string, 'uint32'>,
  Source extends GPUTypeMap = Logical
> {
  /** Filtered, projected, or derived left dataframe plan. */
  readonly query: LuDataFrameQuery<Logical, SelectedColumns, Source>;
  /** Borrowed right dataframe, retained only during explicit graph compilation. */
  readonly right: LuDataFrame<Right>;
  /** Immutable, fully validated key names and fixed GPU index/publication bounds. */
  readonly options: LuDataFrameNormalizedJoinOptions<LeftKey, RightKey>;

  /** Validates both key schemas and bounded capacities without touching GPU resources. @internal */
  constructor(
    query: LuDataFrameQuery<Logical, SelectedColumns, Source>,
    right: LuDataFrame<Right>,
    options: LuDataFrameJoinOptions<LeftKey, RightKey>
  ) {
    this.query = query;
    this.right = right;
    this.options = normalizeLuDataFrameJoinOptions(query, right, options, true);
    Object.freeze(this);
  }

  /** Adds one chunk-preserving unique-right index and bounded joins to the caller-owned graph. */
  compile(
    graph: GPUCommandGraph<LuDataFrameQueryParameters>
  ): CompiledLuDataFrameJoin<Pick<Logical, SelectedColumns>, Right> {
    return compileLuDataFrameJoin<Source, Pick<Logical, SelectedColumns>, Right>(
      this.query.source,
      this.query.predicates,
      this.query.selectedColumns,
      this.query.derivedColumns,
      this.right,
      this.options,
      graph
    );
  }
}

/** Immutable bounded, source-aligned unique-right unsigned lookup without row compaction. */
export class LuDataFrameLookupQuery<
  Logical extends GPUTypeMap,
  SelectedColumns extends keyof Logical & string,
  Right extends GPUTypeMap,
  LeftKey extends LuDataFrameColumnNamesOfFormat<Logical, SelectedColumns, 'uint32'>,
  RightKey extends LuDataFrameColumnNamesOfFormat<Right, keyof Right & string, 'uint32'>,
  Source extends GPUTypeMap = Logical
> {
  /** Filtered, projected, or derived left dataframe plan. */
  readonly query: LuDataFrameQuery<Logical, SelectedColumns, Source>;
  /** Borrowed right dataframe, retained only during explicit graph compilation. */
  readonly right: LuDataFrame<Right>;
  /** Immutable, fully validated key names and fixed GPU hash-index bounds. */
  readonly options: LuDataFrameNormalizedJoinOptions<LeftKey, RightKey>;

  /** Validates both unsigned key schemas without retaining either dataframe. @internal */
  constructor(
    query: LuDataFrameQuery<Logical, SelectedColumns, Source>,
    right: LuDataFrame<Right>,
    options: LuDataFrameLookupOptions<LeftKey, RightKey>
  ) {
    this.query = query;
    this.right = right;
    this.options = normalizeLuDataFrameJoinOptions(query, right, options, false);
    Object.freeze(this);
  }

  /** Adds one chunk-preserving right index and bounded source-aligned left lookup graph passes. */
  compile(
    graph: GPUCommandGraph<LuDataFrameQueryParameters>
  ): CompiledLuDataFrameLookup<Pick<Logical, SelectedColumns>, Right> {
    return compileLuDataFrameLookup<Source, Pick<Logical, SelectedColumns>, Right>(
      this.query.source,
      this.query.predicates,
      this.query.selectedColumns,
      this.query.derivedColumns,
      this.right,
      this.options,
      graph
    );
  }
}

/** Validates two existing unsigned keys and normalizes safely bounded right-index controls. */
function normalizeLuDataFrameJoinOptions<
  Logical extends GPUTypeMap,
  SelectedColumns extends keyof Logical & string,
  Right extends GPUTypeMap,
  LeftKey extends LuDataFrameColumnNamesOfFormat<Logical, SelectedColumns, 'uint32'>,
  RightKey extends LuDataFrameColumnNamesOfFormat<Right, keyof Right & string, 'uint32'>,
  Source extends GPUTypeMap
>(
  query: LuDataFrameQuery<Logical, SelectedColumns, Source>,
  right: LuDataFrame<Right>,
  options: LuDataFrameJoinOptions<LeftKey, RightKey> | LuDataFrameLookupOptions<LeftKey, RightKey>,
  allowCapacity: boolean
): LuDataFrameNormalizedJoinOptions<LeftKey, RightKey> {
  if (!options || typeof options !== 'object') {
    throw new Error('LuDataFrame joins require explicit leftOn and rightOn key columns');
  }
  if (!right || typeof right !== 'object') {
    throw new Error('LuDataFrame joins require an existing right dataframe');
  }
  if (!query.selectedColumns.includes(options.leftOn)) {
    throw new Error(`LuDataFrame left join key "${options.leftOn}" is not selected`);
  }
  if (getLuDataFrameAnalyticColumnFormat(query, options.leftOn) !== 'uint32') {
    throw new Error(`LuDataFrame left join key "${options.leftOn}" must be uint32`);
  }
  if (query.source.table.gpuConstants[options.leftOn]) {
    throw new Error(`LuDataFrame left join key "${options.leftOn}" cannot be constant`);
  }
  if (!right.columnNames.includes(options.rightOn)) {
    throw new Error(`LuDataFrame right join key "${options.rightOn}" does not exist`);
  }
  const rightField = right.schema.fields.find(field => field.name === options.rightOn);
  const rightFormat = right.table.gpuColumns[options.rightOn]?.format ?? rightField?.format;
  if (rightFormat !== 'uint32') {
    throw new Error(`LuDataFrame right join key "${options.rightOn}" must be uint32`);
  }
  if (right.table.gpuConstants[options.rightOn]) {
    throw new Error(`LuDataFrame right join key "${options.rightOn}" cannot be constant`);
  }
  assertCompatibleLuDataFrameJoinDictionaries(query, right, options.leftOn, options.rightOn);
  if (!Number.isSafeInteger(right.numRows) || right.numRows < 0 || right.numRows > MAXIMUM_UINT32) {
    throw new Error('LuDataFrame right join row counts must fit uint32');
  }

  const indexCapacity = options.indexCapacity ?? getDefaultLuDataFrameJoinCapacity(right.numRows);
  if (
    !Number.isSafeInteger(indexCapacity) ||
    indexCapacity < 1 ||
    indexCapacity > MAXIMUM_HASH_CAPACITY ||
    !Number.isInteger(Math.log2(indexCapacity))
  ) {
    throw new Error('LuDataFrame joins require a positive power-of-two uint32 index capacity');
  }
  const maximumSafeProbeCount = Math.max(
    1,
    Math.floor(MAXIMUM_UINT32 / Math.max(right.numRows, 1))
  );
  const maxProbeCount = options.maxProbeCount ?? Math.min(indexCapacity, maximumSafeProbeCount);
  if (
    !Number.isSafeInteger(maxProbeCount) ||
    maxProbeCount < 1 ||
    maxProbeCount > indexCapacity ||
    right.numRows * maxProbeCount > MAXIMUM_UINT32
  ) {
    throw new Error('LuDataFrame joins require a safely bounded uint32 probe count');
  }

  if ('capacity' in options) {
    const capacity = options.capacity;
    if (!allowCapacity) {
      throw new Error('LuDataFrame lookups do not accept a compacted output capacity');
    }
    if (
      capacity !== undefined &&
      (!Number.isSafeInteger(capacity) || capacity < 0 || capacity > MAXIMUM_UINT32)
    ) {
      throw new Error('LuDataFrame joins require a nonnegative uint32 output capacity');
    }
  }

  return Object.freeze({
    leftOn: options.leftOn,
    rightOn: options.rightOn,
    indexCapacity,
    maxProbeCount,
    ...(allowCapacity && 'capacity' in options && options.capacity !== undefined
      ? {capacity: options.capacity}
      : {})
  });
}

/** Prevents incompatible dictionary codebooks from silently joining different logical labels. */
function assertCompatibleLuDataFrameJoinDictionaries<
  Logical extends GPUTypeMap,
  SelectedColumns extends keyof Logical & string,
  Right extends GPUTypeMap,
  Source extends GPUTypeMap
>(
  query: LuDataFrameQuery<Logical, SelectedColumns, Source>,
  right: LuDataFrame<Right>,
  leftOn: string,
  rightOn: keyof Right & string
): void {
  const leftDictionary = (
    query.source.dictionaries as Readonly<Record<string, LuDataFrameDictionary | undefined>>
  )[leftOn];
  const rightDictionary = right.dictionaries[rightOn];
  if (!leftDictionary && !rightDictionary) {
    return;
  }
  if (!leftDictionary || !rightDictionary) {
    throw new Error('LuDataFrame join dictionaries must exist on both key columns');
  }

  const leftMetadata = leftDictionary as Readonly<{
    values: readonly unknown[];
    ordered?: boolean;
  }>;
  const rightMetadata = rightDictionary as Readonly<{
    values: readonly unknown[];
    ordered?: boolean;
  }>;
  const leftValues = Array.isArray(leftDictionary) ? leftDictionary : leftMetadata.values;
  const rightValues = Array.isArray(rightDictionary) ? rightDictionary : rightMetadata.values;
  const leftOrdered = Array.isArray(leftDictionary) ? false : Boolean(leftMetadata.ordered);
  const rightOrdered = Array.isArray(rightDictionary) ? false : Boolean(rightMetadata.ordered);
  if (
    leftOrdered !== rightOrdered ||
    leftValues.length !== rightValues.length ||
    leftValues.some((value, index) => !Object.is(value, rightValues[index]))
  ) {
    throw new Error('LuDataFrame join dictionaries must use identical labels and ordering');
  }
}

/** Chooses a bounded power-of-two index with a maximum default half-full load factor. */
function getDefaultLuDataFrameJoinCapacity(rightRowCount: number): number {
  const requiredCapacity = Math.max(1, rightRowCount * 2);
  let capacity = 1;
  while (capacity < requiredCapacity) {
    capacity *= 2;
    if (capacity > MAXIMUM_HASH_CAPACITY) {
      throw new Error('LuDataFrame default join index exceeds uint32 hash capacity');
    }
  }
  return capacity;
}
