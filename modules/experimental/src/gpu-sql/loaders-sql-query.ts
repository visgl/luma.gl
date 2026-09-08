// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  isSQLPredicateParameter,
  planTableQuery,
  type SQLPredicate,
  type SQLPredicateValue,
  type TableQueryOptions
} from '@loaders.gl/sql';
import type {GPUTypeMap} from '@luma.gl/experimental/gpu-tables';
import {GPUDataFrame} from '../gpu-dataframe/gpu-data-frame';
import {GPUDataFrameQuery} from '../gpu-dataframe/gpu-data-frame-query';
import {
  GPUExpression,
  type GPUExpressionBinaryOperator,
  type GPUExpressionNode,
  type GPUExpressionValue
} from '../gpu-dataframe/gpu-expression';
import type {GPUDataFrameQueryParameters} from '../gpu-dataframe/gpu-query-compiler';

/** loaders.gl table-query operators currently lowered into GPU dataframe command graphs. */
export const GPU_DATAFRAME_TABLE_QUERY_CAPABILITIES = Object.freeze({
  projection: 'pushdown',
  predicate: 'pushdown',
  limit: 'unsupported',
  streaming: false,
  cancellation: false
} as const);

/** loaders.gl query syntax plus reusable default values for preserved SQL parameters. */
export type GPUDataFrameTableQueryOptions<ColumnName extends string = string> = Omit<
  TableQueryOptions,
  'columns'
> &
  Readonly<{
    /** Output GPU dataframe columns in caller-specified order. */
    columns?: readonly ColumnName[];
    /** Defaults for named predicate parameters retained in a reusable compiled GPU graph. */
    parameters?: GPUDataFrameQueryParameters;
  }>;

/**
 * Lowers a validated loaders.gl table query into an immutable GPU dataframe query plan.
 *
 * Planning remains CPU-only. It neither allocates GPU buffers nor submits commands, and predicate
 * parameters remain graph inputs that callers can override each time the compiled query is encoded.
 */
export function planGPUDataFrameQuery<
  T extends GPUTypeMap,
  SelectedColumns extends keyof T & string = keyof T & string
>(
  frame: GPUDataFrame<T>,
  options: GPUDataFrameTableQueryOptions<SelectedColumns> = {}
): GPUDataFrameQuery<T, SelectedColumns, T> {
  if (options.signal?.aborted) {
    throw new Error('GPU dataframe query planning was cancelled');
  }
  if (options.limit !== undefined) {
    throw new Error('GPU dataframe loaders.gl queries do not yet support source-ordered limits');
  }

  const {parameters = {}, ...tableQueryOptions} = options;
  const plan = planTableQuery(frame.columnNames, tableQueryOptions);
  const filterStep = plan.find(step => step.kind === 'filter');
  const projectStep = plan.find(step => step.kind === 'project');
  if (!projectStep || projectStep.kind !== 'project') {
    throw new Error('GPU dataframe loaders.gl query plan is missing its projection');
  }

  const predicates = filterStep
    ? [makeGPUExpressionFromSQLPredicate(filterStep.predicate, parameters)]
    : [];

  // loaders.gl validated every runtime column name against the source schema above.
  return new GPUDataFrameQuery<T, SelectedColumns, T>(
    frame,
    predicates,
    projectStep.columns as readonly SelectedColumns[]
  );
}

/** Converts one portable loaders.gl SQL predicate into luma.gl's closed GPU expression tree. */
export function makeGPUExpressionFromSQLPredicate(
  predicate: SQLPredicate,
  parameters: GPUDataFrameQueryParameters = {}
): GPUExpression<boolean, string> {
  return new GPUExpression<boolean, string>(makeGPUExpressionNode(predicate, parameters));
}

function makeGPUExpressionNode(
  predicate: SQLPredicate,
  parameters: GPUDataFrameQueryParameters
): GPUExpressionNode {
  switch (predicate.op) {
    case '=':
    case '<>':
    case '<':
    case '<=':
    case '>':
    case '>=':
      return {
        kind: 'binary',
        operator: getGPUComparisonOperator(predicate.op),
        left: makeGPUColumnNode(predicate.args[0].property),
        right: makeGPUValueNode(predicate.args[1], parameters)
      };
    case 'in': {
      const property = predicate.args[0].property;
      const comparisons = predicate.args[1].map(
        value =>
          ({
            kind: 'binary',
            operator: 'equal',
            left: makeGPUColumnNode(property),
            right: makeGPUValueNode(value, parameters)
          }) as const
      );
      return combineGPUExpressionNodes('or', comparisons);
    }
    case 'isNull':
      return {
        kind: 'unary',
        operator: 'is-null',
        operand: makeGPUColumnNode(predicate.args[0].property)
      };
    case 'and':
    case 'or':
      return combineGPUExpressionNodes(
        predicate.op,
        predicate.args.map(child => makeGPUExpressionNode(child, parameters))
      );
    case 'not':
      return {
        kind: 'unary',
        operator: 'not',
        operand: makeGPUExpressionNode(predicate.args[0], parameters)
      };
  }
}

function getGPUComparisonOperator(
  operator: '=' | '<>' | '<' | '<=' | '>' | '>='
): GPUExpressionBinaryOperator {
  switch (operator) {
    case '=':
      return 'equal';
    case '<>':
      return 'not-equal';
    case '<':
      return 'less-than';
    case '<=':
      return 'less-than-or-equal';
    case '>':
      return 'greater-than';
    case '>=':
      return 'greater-than-or-equal';
  }
}

function makeGPUColumnNode(name: string): GPUExpressionNode {
  return {kind: 'column', name};
}

function makeGPUValueNode(
  value: SQLPredicateValue,
  parameters: GPUDataFrameQueryParameters
): GPUExpressionNode {
  if (isSQLPredicateParameter(value)) {
    if (!Object.hasOwn(parameters, value.parameter)) {
      throw new Error(`GPU dataframe SQL parameter ":${value.parameter}" requires a default value`);
    }
    return {
      kind: 'parameter',
      name: value.parameter,
      value: getGPUExpressionValue(parameters[value.parameter], `parameter ":${value.parameter}"`)
    };
  }
  return {kind: 'literal', value: getGPUExpressionValue(value, 'predicate literal')};
}

function getGPUExpressionValue(value: unknown, label: string): GPUExpressionValue {
  if (value === null || typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  throw new Error(`GPU dataframe ${label} must be a finite number, boolean, or null`);
}

function combineGPUExpressionNodes(
  operator: 'and' | 'or',
  nodes: readonly GPUExpressionNode[]
): GPUExpressionNode {
  const first = nodes[0];
  if (!first) {
    throw new Error(`GPU dataframe SQL ${operator.toUpperCase()} requires an expression`);
  }
  return nodes
    .slice(1)
    .reduce<GPUExpressionNode>((left, right) => ({kind: 'binary', operator, left, right}), first);
}
