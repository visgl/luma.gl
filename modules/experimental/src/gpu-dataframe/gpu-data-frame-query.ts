// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Independently implemented for WebGPU; inspired by NVIDIA RAPIDS cuDF.

import type {GPUTypeMap} from '@luma.gl/experimental/gpu-tables';
import type {GPUCommandGraph} from '@luma.gl/gpgpu/gpu-core';
import type {GPUDataFrame} from './gpu-data-frame';
import {getGPUExpressionColumnNames, GPUExpression, type GPUExpressionNode} from './gpu-expression';
import {
  GPUDataFrameAggregationQuery,
  type GPUDataFrameGlobalAggregationDefinitions,
  type GPUDataFrameScalarColumnNames
} from './gpu-global-aggregation-query';
import {
  GPUDataFrameGroupByQuery,
  type GPUDataFrameColumnNamesOfFormat,
  type GPUDataFrameGroupByOptions
} from './gpu-group-by-query';
import {GPUDataFrameHistogramQuery, type GPUDataFrameHistogramOptions} from './gpu-histogram-query';
import {
  GPUDataFrameJoinQuery,
  GPUDataFrameLookupQuery,
  type GPUDataFrameJoinOptions,
  type GPUDataFrameLookupOptions
} from './gpu-join-query';
import {
  compileGPUDataFrameQuery,
  type CompiledGPUDataFrameQuery,
  type GPUDataFrameQueryParameters
} from './gpu-query-compiler';
import {
  GPUDataFrameGlobalSortQuery,
  GPUDataFrameSortQuery,
  type GPUDataFrameSortOptions
} from './gpu-sort-query';

/** Portable scalar storage formats supported by computed dataframe columns. */
export type GPUDataFrameDerivedColumnFormat = 'float32' | 'sint32' | 'uint32';

/** Immutable numerical expression materialized only when its dataframe query is compiled. */
export type GPUDataFrameDerivedColumn = Readonly<{
  /** Logical dataframe field name, distinct from every existing source and derived field. */
  name: string;
  /** Numeric expression referencing currently available source or derived columns. */
  expression: GPUExpression<number | null, string>;
  /** Optional explicit scalar format, which must agree with the referenced input format. */
  format?: GPUDataFrameDerivedColumnFormat;
}>;

/** Optional explicit scalar storage metadata for one computed dataframe column. */
export type GPUDataFrameDerivedColumnOptions<
  Format extends GPUDataFrameDerivedColumnFormat = GPUDataFrameDerivedColumnFormat
> = Readonly<{format?: Format}>;

/** Infers a derived scalar format from its inputs, defaulting pure scalar expressions to float32. */
export type GPUDataFrameDerivedColumnFormatForExpression<
  T extends GPUTypeMap,
  ReferencedColumns extends keyof T & string
> = [ReferencedColumns] extends [never]
  ? 'float32'
  : Extract<T[ReferencedColumns], GPUDataFrameDerivedColumnFormat>;

/**
 * Immutable dataframe query planned entirely on the CPU.
 *
 * Predicates and derived expressions retain access to their complete source schema, while
 * projection changes only the eventual output columns. Planning borrows its source and never
 * acquires a resource lease; explicit compilation retains the source only for the compiled
 * graph's actual lifetime.
 */
export class GPUDataFrameQuery<
  Logical extends GPUTypeMap = GPUTypeMap,
  SelectedColumns extends keyof Logical & string = keyof Logical & string,
  Source extends GPUTypeMap = Logical
> {
  /** Original dataframe whose GPU buffers remain borrowed until explicit compilation. */
  readonly source: GPUDataFrame<Source>;
  /** Immutable boolean predicates combined in source order. */
  readonly predicates: readonly GPUExpression<boolean, string>[];
  /** Source and derived columns retained in the eventually compiled output dataframe. */
  readonly selectedColumns: readonly SelectedColumns[];
  /** Derived expressions in immutable dependency order, including hidden intermediate values. */
  readonly derivedColumns: readonly GPUDataFrameDerivedColumn[];

  constructor(
    source: GPUDataFrame<Source>,
    predicates: readonly GPUExpression<boolean, string>[],
    selectedColumns: readonly SelectedColumns[],
    derivedColumns: readonly GPUDataFrameDerivedColumn[] = []
  ) {
    const logicalColumns = assertDataFrameDerivedColumns(source, derivedColumns);
    assertSelectedQueryColumns(selectedColumns, logicalColumns);
    for (const predicate of predicates) {
      assertDataFrameQueryPredicate(source, predicate, logicalColumns, logicalColumns);
    }

    this.source = source;
    this.predicates = Object.freeze([...predicates]);
    this.selectedColumns = Object.freeze([...selectedColumns]);
    this.derivedColumns = Object.freeze([...derivedColumns]);
    Object.freeze(this);
  }

  /** Selected logical-column names in immutable output-projection order. */
  get columnNames(): readonly SelectedColumns[] {
    return this.selectedColumns;
  }

  /** Adds one boolean predicate without mutating sibling query plans or touching GPU resources. */
  filter<ReferencedColumns extends SelectedColumns>(
    predicate: GPUExpression<boolean, ReferencedColumns>
  ): GPUDataFrameQuery<Logical, SelectedColumns, Source> {
    const logicalColumns = [
      ...this.source.columnNames,
      ...this.derivedColumns.map(({name}) => name)
    ];
    assertDataFrameQueryPredicate(this.source, predicate, this.selectedColumns, logicalColumns);
    return new GPUDataFrameQuery<Logical, SelectedColumns, Source>(
      this.source,
      [...this.predicates, predicate],
      this.selectedColumns,
      this.derivedColumns
    );
  }

  /** Narrows only eventual output columns while retaining all predicate and derived dependencies. */
  select<ColumnName extends SelectedColumns>(
    columnNames: readonly ColumnName[]
  ): GPUDataFrameQuery<Logical, ColumnName, Source> {
    assertSelectedQueryColumns(columnNames, this.selectedColumns);
    return new GPUDataFrameQuery<Logical, ColumnName, Source>(
      this.source,
      this.predicates,
      columnNames,
      this.derivedColumns
    );
  }

  /** Adds one selected derived column without allocating GPU storage or retaining source leases. */
  withColumn<
    Name extends string,
    ReferencedColumns extends SelectedColumns,
    Format extends GPUDataFrameDerivedColumnFormat = GPUDataFrameDerivedColumnFormatForExpression<
      Logical,
      ReferencedColumns
    >
  >(
    name: Name,
    expression: GPUExpression<number | null, ReferencedColumns>,
    options: GPUDataFrameDerivedColumnOptions<Format> = {}
  ): GPUDataFrameQuery<Logical & Record<Name, Format>, SelectedColumns | Name, Source> {
    assertDataFrameDerivedColumnName(name);
    assertDataFrameDerivedExpression(expression, this.selectedColumns);

    const definition: GPUDataFrameDerivedColumn = Object.freeze({
      name,
      expression,
      ...(options.format ? {format: options.format} : {})
    });

    return new GPUDataFrameQuery<Logical & Record<Name, Format>, SelectedColumns | Name, Source>(
      this.source,
      this.predicates,
      [...this.selectedColumns, name],
      [...this.derivedColumns, definition]
    );
  }

  /** Plans dense categorical grouping without allocating GPU resources or reading source values. */
  groupBy<Key extends GPUDataFrameColumnNamesOfFormat<Logical, SelectedColumns, 'uint32'>>(
    key: Key,
    options: GPUDataFrameGroupByOptions = {}
  ): GPUDataFrameGroupByQuery<Logical, SelectedColumns, Key, Source> {
    return new GPUDataFrameGroupByQuery(this, key, options);
  }

  /** Plans globally reduced scalar statistics without allocating or submitting GPU work. */
  aggregate<Definitions extends GPUDataFrameGlobalAggregationDefinitions<Logical, SelectedColumns>>(
    definitions: Definitions
  ): GPUDataFrameAggregationQuery<Logical, SelectedColumns, Definitions, Source> {
    return new GPUDataFrameAggregationQuery(this, definitions);
  }

  /** Plans explicit-domain histogram binning without reading or materializing source data. */
  histogram<Column extends GPUDataFrameScalarColumnNames<Logical, SelectedColumns>>(
    column: Column,
    options: GPUDataFrameHistogramOptions
  ): GPUDataFrameHistogramQuery<Logical, SelectedColumns, Column, Source> {
    return new GPUDataFrameHistogramQuery(this, column, options);
  }

  /** Plans stable source-batch scalar sorting without allocating GPU resources or reading rows. */
  sortBy<Column extends GPUDataFrameScalarColumnNames<Logical, SelectedColumns>>(
    column: Column,
    options: GPUDataFrameSortOptions = {}
  ): GPUDataFrameSortQuery<Logical, SelectedColumns, Column, Source> {
    return new GPUDataFrameSortQuery(this, column, options);
  }

  /** Plans descending stable top-K selection independently within every source record batch. */
  topK<Column extends GPUDataFrameScalarColumnNames<Logical, SelectedColumns>>(
    column: Column,
    limit: number,
    options: GPUDataFrameSortOptions = {}
  ): GPUDataFrameSortQuery<Logical, SelectedColumns, Column, Source> {
    return new GPUDataFrameSortQuery(this, column, options, limit, 'descending');
  }

  /** Plans explicit stable ordering across every preserved source record batch. */
  sortByGlobal<Column extends GPUDataFrameScalarColumnNames<Logical, SelectedColumns>>(
    column: Column,
    options: GPUDataFrameSortOptions = {}
  ): GPUDataFrameGlobalSortQuery<Logical, SelectedColumns, Column, Source> {
    return new GPUDataFrameGlobalSortQuery(this, column, options);
  }

  /** Plans one descending global top-K selection without copying source dataframe columns. */
  topKGlobal<Column extends GPUDataFrameScalarColumnNames<Logical, SelectedColumns>>(
    column: Column,
    limit: number,
    options: GPUDataFrameSortOptions = {}
  ): GPUDataFrameGlobalSortQuery<Logical, SelectedColumns, Column, Source> {
    return new GPUDataFrameGlobalSortQuery(this, column, options, limit, 'descending');
  }

  /** Plans a stable, unique-right inner join without allocating, repacking, or retaining rows. */
  innerJoin<
    Right extends GPUTypeMap,
    LeftKey extends GPUDataFrameColumnNamesOfFormat<Logical, SelectedColumns, 'uint32'>,
    RightKey extends GPUDataFrameColumnNamesOfFormat<Right, keyof Right & string, 'uint32'>
  >(
    right: GPUDataFrame<Right>,
    options: GPUDataFrameJoinOptions<LeftKey, RightKey>
  ): GPUDataFrameJoinQuery<Logical, SelectedColumns, Right, LeftKey, RightKey, Source> {
    return new GPUDataFrameJoinQuery(this, right, options);
  }

  /** Preserves every selected left row and explicitly marks missing right-side partners. */
  leftJoin<
    Right extends GPUTypeMap,
    LeftKey extends GPUDataFrameColumnNamesOfFormat<Logical, SelectedColumns, 'uint32'>,
    RightKey extends GPUDataFrameColumnNamesOfFormat<Right, keyof Right & string, 'uint32'>
  >(
    right: GPUDataFrame<Right>,
    options: GPUDataFrameJoinOptions<LeftKey, RightKey>
  ): GPUDataFrameJoinQuery<Logical, SelectedColumns, Right, LeftKey, RightKey, Source> {
    return new GPUDataFrameJoinQuery(this, right, options, 'left');
  }

  /** Preserves only selected left rows whose key exists in the unique-right index. */
  semiJoin<
    Right extends GPUTypeMap,
    LeftKey extends GPUDataFrameColumnNamesOfFormat<Logical, SelectedColumns, 'uint32'>,
    RightKey extends GPUDataFrameColumnNamesOfFormat<Right, keyof Right & string, 'uint32'>
  >(
    right: GPUDataFrame<Right>,
    options: GPUDataFrameJoinOptions<LeftKey, RightKey>
  ): GPUDataFrameJoinQuery<Logical, SelectedColumns, Right, LeftKey, RightKey, Source> {
    return new GPUDataFrameJoinQuery(this, right, options, 'semi');
  }

  /** Preserves selected unmatched left rows, including rows with nullable left keys. */
  antiJoin<
    Right extends GPUTypeMap,
    LeftKey extends GPUDataFrameColumnNamesOfFormat<Logical, SelectedColumns, 'uint32'>,
    RightKey extends GPUDataFrameColumnNamesOfFormat<Right, keyof Right & string, 'uint32'>
  >(
    right: GPUDataFrame<Right>,
    options: GPUDataFrameJoinOptions<LeftKey, RightKey>
  ): GPUDataFrameJoinQuery<Logical, SelectedColumns, Right, LeftKey, RightKey, Source> {
    return new GPUDataFrameJoinQuery(this, right, options, 'anti');
  }

  /** Plans a bounded, source-aligned unique-right lookup while preserving both batch topologies. */
  lookup<
    Right extends GPUTypeMap,
    LeftKey extends GPUDataFrameColumnNamesOfFormat<Logical, SelectedColumns, 'uint32'>,
    RightKey extends GPUDataFrameColumnNamesOfFormat<Right, keyof Right & string, 'uint32'>
  >(
    right: GPUDataFrame<Right>,
    options: GPUDataFrameLookupOptions<LeftKey, RightKey>
  ): GPUDataFrameLookupQuery<Logical, SelectedColumns, Right, LeftKey, RightKey, Source> {
    return new GPUDataFrameLookupQuery(this, right, options);
  }

  /** Materializes reusable GPU graph passes and compiler-owned selection/index/count outputs. */
  compile(
    graph: GPUCommandGraph<GPUDataFrameQueryParameters>
  ): CompiledGPUDataFrameQuery<Pick<Logical, SelectedColumns>> {
    return compileGPUDataFrameQuery<Source, Pick<Logical, SelectedColumns>>(
      this.source,
      this.predicates,
      this.selectedColumns,
      graph,
      this.derivedColumns
    );
  }
}

/** Rejects nonboolean predicates and unknown or currently unselected logical references. */
export function assertDataFrameQueryPredicate<T extends GPUTypeMap>(
  source: GPUDataFrame<T>,
  predicate: GPUExpression<boolean, string>,
  selectedColumns: readonly string[],
  logicalColumns: readonly string[] = source.columnNames
): void {
  if (!(predicate instanceof GPUExpression) || !isBooleanExpressionNode(predicate.node)) {
    throw new Error('GPUDataFrame filters require a boolean expression');
  }

  assertDataFrameExpressionColumns(predicate, selectedColumns, logicalColumns);
}

/** Validates computed definitions in dependency order and returns all available logical fields. */
function assertDataFrameDerivedColumns<T extends GPUTypeMap>(
  source: GPUDataFrame<T>,
  derivedColumns: readonly GPUDataFrameDerivedColumn[]
): string[] {
  const logicalColumns = [...source.columnNames];
  const logicalFormats = new Map<string, string | undefined>(
    source.schema.fields.map(
      field => [field.name, source.table.gpuColumns[field.name]?.format ?? field.format] as const
    )
  );

  for (const derivedColumn of derivedColumns) {
    assertDataFrameDerivedColumnName(derivedColumn.name);
    if (logicalFormats.has(derivedColumn.name)) {
      throw new Error(`GPUDataFrame derived column "${derivedColumn.name}" already exists`);
    }
    assertDataFrameDerivedExpression(derivedColumn.expression, logicalColumns);

    const referencedFormats = new Set(
      getGPUExpressionColumnNames(derivedColumn.expression).map(columnName =>
        logicalFormats.get(columnName)
      )
    );
    if (referencedFormats.size > 1) {
      throw new Error(`GPUDataFrame derived column "${derivedColumn.name}" mixes scalar formats`);
    }
    const inferredFormat = referencedFormats.values().next().value ?? 'float32';
    if (
      inferredFormat !== 'float32' &&
      inferredFormat !== 'sint32' &&
      inferredFormat !== 'uint32'
    ) {
      throw new Error(`GPUDataFrame derived column "${derivedColumn.name}" requires scalar inputs`);
    }
    if (derivedColumn.format !== undefined && derivedColumn.format !== inferredFormat) {
      throw new Error(`GPUDataFrame derived column "${derivedColumn.name}" format does not match`);
    }

    logicalFormats.set(derivedColumn.name, inferredFormat);
    logicalColumns.push(derivedColumn.name);
  }

  return logicalColumns;
}

/** Validates one numerical derived expression against its currently selected logical inputs. */
function assertDataFrameDerivedExpression(
  expression: GPUExpression<number | null, string>,
  selectedColumns: readonly string[]
): void {
  if (!(expression instanceof GPUExpression) || !isNumericExpressionNode(expression.node)) {
    throw new Error('GPUDataFrame derived columns require a numeric expression');
  }

  assertDataFrameExpressionColumns(expression, selectedColumns, selectedColumns);
}

/** Rejects unknown and currently hidden expression inputs before touching GPU resources. */
function assertDataFrameExpressionColumns(
  expression: GPUExpression<any, string>,
  selectedColumns: readonly string[],
  logicalColumns: readonly string[]
): void {
  const selectedNames = new Set(selectedColumns);
  const logicalNames = new Set(logicalColumns);
  for (const columnName of getGPUExpressionColumnNames(expression)) {
    if (!logicalNames.has(columnName)) {
      throw new Error(`GPUDataFrame expression column "${columnName}" does not exist`);
    }
    if (!selectedNames.has(columnName)) {
      throw new Error(`GPUDataFrame expression column "${columnName}" is not selected`);
    }
  }
}

function assertDataFrameDerivedColumnName(name: string): void {
  if (typeof name !== 'string' || name.length === 0) {
    throw new Error('GPUDataFrame derived columns require a nonempty name');
  }
}

function assertSelectedQueryColumns(
  columnNames: readonly string[],
  availableColumns: readonly string[]
): void {
  const availableNames = new Set(availableColumns);
  const selectedNames = new Set<string>();

  for (const columnName of columnNames) {
    if (!availableNames.has(columnName)) {
      throw new Error(`GPUDataFrame query column "${columnName}" does not exist`);
    }
    if (selectedNames.has(columnName)) {
      throw new Error(
        `GPUDataFrame query column "${columnName}" cannot be selected more than once`
      );
    }
    selectedNames.add(columnName);
  }
}

function isNumericExpressionNode(node: GPUExpressionNode): boolean {
  switch (node.kind) {
    case 'column':
      return true;
    case 'literal':
    case 'parameter':
      return node.value === null || typeof node.value === 'number';
    case 'unary':
      return node.operator === 'negate';
    case 'binary':
      return (
        node.operator === 'add' ||
        node.operator === 'subtract' ||
        node.operator === 'multiply' ||
        node.operator === 'divide'
      );
    default:
      return false;
  }
}

function isBooleanExpressionNode(node: GPUExpressionNode): boolean {
  switch (node.kind) {
    case 'column':
      return false;
    case 'literal':
    case 'parameter':
      return typeof node.value === 'boolean';
    case 'unary':
      return node.operator === 'not' || node.operator === 'is-valid' || node.operator === 'is-null';
    case 'binary':
      return (
        node.operator === 'equal' ||
        node.operator === 'not-equal' ||
        node.operator === 'greater-than' ||
        node.operator === 'greater-than-or-equal' ||
        node.operator === 'less-than' ||
        node.operator === 'less-than-or-equal' ||
        node.operator === 'and' ||
        node.operator === 'or'
      );
    default:
      return false;
  }
}
