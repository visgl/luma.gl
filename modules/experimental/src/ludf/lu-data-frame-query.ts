// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GPUTypeMap} from '@luma.gl/tables';
import type {GPUCommandGraph} from '../gpu-primitives/gpu-command-graph';
import type {LuDataFrame} from './lu-data-frame';
import {getLuExpressionColumnNames, LuExpression, type LuExpressionNode} from './lu-expression';
import {
  compileLuDataFrameQuery,
  type CompiledLuDataFrameQuery,
  type LuDataFrameQueryParameters
} from './lu-query-compiler';

/**
 * Immutable dataframe query planned entirely on the CPU.
 *
 * Predicates always retain access to their complete source schema, while projection changes only
 * the eventual output columns. Planning borrows its source and never acquires a resource lease;
 * explicit compilation retains the source only for the compiled graph's actual lifetime.
 */
export class LuDataFrameQuery<
  T extends GPUTypeMap = GPUTypeMap,
  SelectedColumns extends keyof T & string = keyof T & string
> {
  /** Original dataframe whose GPU buffers remain borrowed until explicit compilation. */
  readonly source: LuDataFrame<T>;
  /** Immutable boolean predicates combined in source order. */
  readonly predicates: readonly LuExpression<boolean, string>[];
  /** Source columns retained in the eventually compiled output dataframe. */
  readonly selectedColumns: readonly SelectedColumns[];

  constructor(
    source: LuDataFrame<T>,
    predicates: readonly LuExpression<boolean, string>[],
    selectedColumns: readonly SelectedColumns[]
  ) {
    assertSelectedQueryColumns(source, selectedColumns);
    for (const predicate of predicates) {
      assertDataFrameQueryPredicate(source, predicate, source.columnNames);
    }

    this.source = source;
    this.predicates = Object.freeze([...predicates]);
    this.selectedColumns = Object.freeze([...selectedColumns]);
    Object.freeze(this);
  }

  /** Selected source-column names in immutable output-projection order. */
  get columnNames(): readonly SelectedColumns[] {
    return this.selectedColumns;
  }

  /** Adds one boolean predicate without mutating sibling query plans or touching GPU resources. */
  filter<ReferencedColumns extends SelectedColumns>(
    predicate: LuExpression<boolean, ReferencedColumns>
  ): LuDataFrameQuery<T, SelectedColumns> {
    assertDataFrameQueryPredicate(this.source, predicate, this.selectedColumns);
    return new LuDataFrameQuery(this.source, [...this.predicates, predicate], this.selectedColumns);
  }

  /** Narrows only the eventual output columns while retaining all source predicate inputs. */
  select<ColumnName extends SelectedColumns>(
    columnNames: readonly ColumnName[]
  ): LuDataFrameQuery<T, ColumnName> {
    assertSelectedQueryColumns(this.source, columnNames, this.selectedColumns);
    return new LuDataFrameQuery(this.source, this.predicates, columnNames);
  }

  /** Materializes reusable GPU graph passes and compiler-owned selection/index/count outputs. */
  compile(
    graph: GPUCommandGraph<LuDataFrameQueryParameters>
  ): CompiledLuDataFrameQuery<Pick<T, SelectedColumns>> {
    return compileLuDataFrameQuery(this.source, this.predicates, this.selectedColumns, graph);
  }
}

/** Rejects nonboolean predicates and unknown or currently unselected source references. */
export function assertDataFrameQueryPredicate<T extends GPUTypeMap>(
  source: LuDataFrame<T>,
  predicate: LuExpression<boolean, string>,
  selectedColumns: readonly (keyof T & string)[]
): void {
  if (!(predicate instanceof LuExpression) || !isBooleanExpressionNode(predicate.node)) {
    throw new Error('LuDataFrame filters require a boolean expression');
  }

  const availableNames = new Set<string>(selectedColumns);
  for (const columnName of getLuExpressionColumnNames(predicate)) {
    if (!source.schema.fields.some(field => field.name === columnName)) {
      throw new Error(`LuDataFrame expression column "${columnName}" does not exist`);
    }
    if (!availableNames.has(columnName)) {
      throw new Error(`LuDataFrame expression column "${columnName}" is not selected`);
    }
  }
}

function assertSelectedQueryColumns<T extends GPUTypeMap>(
  source: LuDataFrame<T>,
  columnNames: readonly string[],
  availableColumns: readonly string[] = source.columnNames
): void {
  const availableNames = new Set(availableColumns);
  const selectedNames = new Set<string>();

  for (const columnName of columnNames) {
    if (!availableNames.has(columnName)) {
      throw new Error(`LuDataFrame query column "${columnName}" does not exist`);
    }
    if (selectedNames.has(columnName)) {
      throw new Error(`LuDataFrame query column "${columnName}" cannot be selected more than once`);
    }
    selectedNames.add(columnName);
  }
}

function isBooleanExpressionNode(node: LuExpressionNode): boolean {
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
