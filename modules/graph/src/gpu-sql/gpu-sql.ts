// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Independently implemented for WebGPU; inspired by relational SQL semantics.

import {parseSQLSelectStatement} from '@math.gl/sql/parser';
import type {Expression} from '@math.gl/sql/expressions';
import type {GPUCommandGraph} from '@luma.gl/graph/gpu-core';
import {GPUDataFrame} from '../gpu-dataframe/gpu-data-frame';
import {GPUDataFrameQuery} from '../gpu-dataframe/gpu-data-frame-query';
import {
  GPUExpression,
  column,
  isGPUScalarFunction,
  parameter,
  type GPUExpressionNode
} from '../gpu-dataframe/gpu-expression';
import {lowerPortableExpression} from '../gpu-dataframe/portable-expression';
import type {GPUDataFrameJoinType} from '../gpu-dataframe/gpu-join-query';
import type {
  CompiledGPUDataFrameQuery,
  GPUDataFrameQueryParameters
} from '../gpu-dataframe/gpu-query-compiler';

/** Explicit GPU dataframe registrations; Arrow remains exclusively an adapter boundary. */
export type GPUSQLTables = Readonly<Record<string, GPUDataFrame>>;

/** Defaults for named SQL parameters such as `:minimumFare`; values remain caller-controlled. */
export type GPUSQLQueryOptions = Readonly<{parameters?: GPUDataFrameQueryParameters}>;

type GPUSQLSelectItem = Readonly<{
  expression?: GPUExpressionNode;
  aggregate?: 'count' | 'sum' | 'min' | 'max' | 'mean';
  aggregateColumn?: string;
  alias?: string;
  star?: boolean;
}>;
type GPUSQLStatement = Readonly<{
  items: readonly GPUSQLSelectItem[];
  table: string;
  alias?: string;
  join?: Readonly<{
    type: GPUDataFrameJoinType;
    table: string;
    alias?: string;
    left: string;
    right: string;
  }>;
  predicate?: GPUExpressionNode;
  groupBy?: string;
  orderBy?: Readonly<{
    column: string;
    direction: 'ascending' | 'descending';
    nulls?: 'first' | 'last';
  }>;
  limit?: number;
  offset?: number;
}>;

type GPUSQLCompiledPlan = Readonly<{
  compile: (graph: GPUCommandGraph<GPUDataFrameQueryParameters>) => CompiledGPUDataFrameQuery;
}>;

type GPUSQLAggregationDefinitions = Record<
  string,
  'count' | {sum: string} | {min: string} | {max: string} | {mean: string}
>;

/** Runtime-validated SQL names cross the strongly typed dataframe boundary exactly once. */
type GPUSQLDynamicQuery = GPUSQLCompiledPlan & {
  predicates: readonly GPUExpression<boolean, string>[];
  filter: (predicate: GPUExpression<boolean, string>) => GPUSQLDynamicQuery;
  select: (names: readonly string[]) => GPUSQLDynamicQuery;
  withColumn: (
    name: string,
    expression: GPUExpression<number | null, string>
  ) => GPUSQLDynamicQuery;
  groupBy: (key: string) => {
    aggregate: (definitions: GPUSQLAggregationDefinitions) => GPUSQLCompiledPlan;
  };
  aggregate: (definitions: GPUSQLAggregationDefinitions) => GPUSQLCompiledPlan;
  sortByGlobal: (
    name: string,
    options: {direction: 'ascending' | 'descending'; nulls?: 'first' | 'last'}
  ) => GPUSQLCompiledPlan & {page: (offset: number, limit?: number) => GPUSQLCompiledPlan};
  innerJoin: (
    right: GPUDataFrame,
    options: {leftOn: string; rightOn: string}
  ) => GPUSQLCompiledPlan;
  leftJoin: (right: GPUDataFrame, options: {leftOn: string; rightOn: string}) => GPUSQLCompiledPlan;
  semiJoin: (right: GPUDataFrame, options: {leftOn: string; rightOn: string}) => GPUSQLCompiledPlan;
  antiJoin: (right: GPUDataFrame, options: {leftOn: string; rightOn: string}) => GPUSQLCompiledPlan;
};

/**
 * SQL frontend over explicitly registered, already GPU-resident dataframes.
 *
 * Parsing and planning never upload data, submit work, or read GPU buffers. Arrow upload/output
 * remain explicit `@luma.gl/graph/arrow` operations around the shared GPU table execution core.
 */
export class GPUSQLContext {
  private readonly tables: Readonly<Record<string, GPUDataFrame>>;

  constructor(tables: GPUSQLTables) {
    const registered: Record<string, GPUDataFrame> = {};
    for (const [name, table] of Object.entries(tables)) {
      if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name) || !(table instanceof GPUDataFrame)) {
        throw new Error('GPUSQL requires valid names mapped to existing GPU dataframes');
      }
      const canonical = name.toLowerCase();
      if (registered[canonical]) throw new Error(`GPUSQL table "${name}" is already registered`);
      registered[canonical] = table;
    }
    this.tables = Object.freeze(registered);
    Object.freeze(this);
  }

  /** Parses and validates one immutable SELECT plan without touching registered GPU sources. */
  query(source: string, options: GPUSQLQueryOptions = {}): GPUSQLQuery {
    const statement = parseGPUSQLStatement(source, options.parameters ?? {});
    return new GPUSQLQuery(source, buildGPUSQLPlan(this.tables, statement));
  }
}

/** Immutable SQL plan lowered directly into existing reusable GPU dataframe command graphs. */
export class GPUSQLQuery {
  /** Original application-owned SQL text, retained solely for diagnostics and inspection. */
  readonly sql: string;
  private readonly plan: GPUSQLCompiledPlan;

  /** @internal */
  constructor(sql: string, plan: GPUSQLCompiledPlan) {
    this.sql = sql;
    this.plan = plan;
    Object.freeze(this);
  }

  /** Compiles existing dataframe operations into the caller-owned GPU command graph. */
  compile(graph: GPUCommandGraph<GPUDataFrameQueryParameters>): CompiledGPUDataFrameQuery {
    return this.plan.compile(graph);
  }
}

function buildGPUSQLPlan(
  tables: Readonly<Record<string, GPUDataFrame>>,
  statement: GPUSQLStatement
): GPUSQLCompiledPlan {
  const frame = tables[statement.table.toLowerCase()];
  if (!frame) throw new Error(`GPUSQL table "${statement.table}" is not registered`);
  let query = new GPUDataFrameQuery(frame, [], frame.columnNames) as unknown as GPUSQLDynamicQuery;
  const qualifier = statement.alias ?? statement.table;
  const resolve = (name: string): string => resolveGPUSQLColumn(name, qualifier, frame.columnNames);
  if (statement.predicate) {
    query = query.filter(
      new GPUExpression<boolean, string>(resolveGPUSQLExpression(statement.predicate, resolve))
    );
  }

  const aggregates = statement.items.filter(item => item.aggregate);
  if (aggregates.length > 0) {
    if (
      statement.join ||
      statement.orderBy ||
      statement.limit !== undefined ||
      statement.offset !== undefined
    ) {
      throw new Error('GPUSQL aggregate queries do not yet support joins, ordering, or pagination');
    }
    const definitions: GPUSQLAggregationDefinitions = {};
    for (const item of aggregates) {
      const name = item.alias ?? `${item.aggregate}_${item.aggregateColumn ?? 'all'}`;
      if (definitions[name]) throw new Error(`GPUSQL aggregate alias "${name}" is duplicated`);
      definitions[name] =
        item.aggregate === 'count'
          ? 'count'
          : ({[item.aggregate!]: resolve(item.aggregateColumn!)} as
              | {sum: string}
              | {min: string}
              | {max: string}
              | {mean: string});
    }
    if (statement.groupBy) {
      const key = resolve(statement.groupBy);
      const nonAggregates = statement.items.filter(item => !item.aggregate);
      if (
        nonAggregates.length !== 1 ||
        resolveGPUSQLProjectionName(nonAggregates[0], resolve) !== key
      ) {
        throw new Error('GPUSQL grouped queries must select their single GROUP BY key');
      }
      return query.groupBy(key).aggregate(definitions);
    }
    if (aggregates.length !== statement.items.length) {
      throw new Error('GPUSQL global aggregates cannot mix ordinary source columns');
    }
    return query.aggregate(definitions);
  }
  if (statement.groupBy) throw new Error('GPUSQL GROUP BY requires at least one aggregation');

  const selected: string[] = [];
  for (const item of statement.items) {
    if (item.star) {
      if (statement.items.length !== 1)
        throw new Error('GPUSQL SELECT * cannot include other columns');
      selected.push(...frame.columnNames);
      continue;
    }
    const node = resolveGPUSQLExpression(item.expression!, resolve);
    const name = item.alias ?? (node.kind === 'column' ? node.name : undefined);
    if (!name) throw new Error('GPUSQL computed SELECT expressions require an explicit AS alias');
    if (selected.includes(name)) throw new Error(`GPUSQL output column "${name}" is duplicated`);
    if (node.kind !== 'column' || node.name !== name) {
      if (frame.columnNames.includes(name)) {
        throw new Error(`GPUSQL derived alias "${name}" conflicts with an existing source column`);
      }
      query = query.withColumn(name, new GPUExpression<number | null, string>(node));
    }
    selected.push(name);
  }

  if (statement.join) {
    if (statement.orderBy || statement.limit !== undefined || statement.offset !== undefined) {
      throw new Error('GPUSQL joined results do not yet support ORDER BY or pagination');
    }
    const right = tables[statement.join.table.toLowerCase()];
    if (!right) throw new Error(`GPUSQL table "${statement.join.table}" is not registered`);
    const leftKey = resolve(statement.join.left);
    const rightQualifier = statement.join.alias ?? statement.join.table;
    const rightKey = resolveGPUSQLColumn(statement.join.right, rightQualifier, right.columnNames);
    if (!selected.includes(leftKey)) {
      throw new Error('GPUSQL joins require the left join key to remain selected');
    }
    query = query.select(selected);
    const options = {leftOn: leftKey, rightOn: rightKey};
    switch (statement.join.type) {
      case 'left':
        return query.leftJoin(right, options);
      case 'semi':
        return query.semiJoin(right, options);
      case 'anti':
        return query.antiJoin(right, options);
      default:
        return query.innerJoin(right, options);
    }
  }

  if (statement.orderBy) {
    const {column: requested, direction, nulls} = statement.orderBy;
    const orderColumn = selected.includes(requested) ? requested : resolve(requested);
    if (!selected.includes(orderColumn)) {
      throw new Error('GPUSQL ORDER BY requires the sort column in the SELECT projection');
    }
    const sort = query.select(selected).sortByGlobal(orderColumn, {
      direction,
      ...(nulls ? {nulls} : {})
    });
    return statement.limit === undefined && statement.offset === undefined
      ? sort
      : sort.page(statement.offset ?? 0, statement.limit);
  }
  if (statement.limit !== undefined || statement.offset !== undefined)
    throw new Error('GPUSQL LIMIT or OFFSET currently requires ORDER BY');
  if (query.predicates.length === 0) {
    const firstColumn = frame.columnNames[0];
    if (!firstColumn) throw new Error('GPUSQL SELECT requires at least one GPU source column');
    query = query.filter(column(firstColumn).isValid().or(column(firstColumn).isNull()));
  }
  return query.select(selected);
}

function resolveGPUSQLProjectionName(
  item: GPUSQLSelectItem,
  resolve: (name: string) => string
): string {
  if (item.expression?.kind !== 'column') {
    throw new Error('GPUSQL grouped source expressions must reference the group key directly');
  }
  return resolve(item.expression.name);
}

function resolveGPUSQLColumn(name: string, qualifier: string, columns: readonly string[]): string {
  const parts = name.split('.');
  if (
    parts.length > 2 ||
    (parts.length === 2 && parts[0].toLowerCase() !== qualifier.toLowerCase())
  ) {
    throw new Error(`GPUSQL column "${name}" has an unknown table qualifier`);
  }
  const requested = parts[parts.length - 1];
  if (!columns.includes(requested)) throw new Error(`GPUSQL column "${name}" does not exist`);
  return requested;
}

function resolveGPUSQLExpression(
  expression: GPUExpressionNode,
  resolve: (name: string) => string
): GPUExpressionNode {
  switch (expression.kind) {
    case 'column':
      return {kind: 'column', name: resolve(expression.name)};
    case 'conditional':
      return {
        ...expression,
        condition: resolveGPUSQLExpression(expression.condition, resolve),
        whenTrue: resolveGPUSQLExpression(expression.whenTrue, resolve),
        otherwise: resolveGPUSQLExpression(expression.otherwise, resolve)
      };
    case 'unary':
      return {...expression, operand: resolveGPUSQLExpression(expression.operand, resolve)};
    case 'binary':
      return {
        ...expression,
        left: resolveGPUSQLExpression(expression.left, resolve),
        right: resolveGPUSQLExpression(expression.right, resolve)
      };
    default:
      return expression;
  }
}

function parseGPUSQLStatement(
  source: string,
  parameters: GPUDataFrameQueryParameters
): GPUSQLStatement {
  const statement = parseSQLSelectStatement(source, {
    parseParameter: name => ({type: 'Identifier', name, gpuSQLParameter: true})
  });
  if (statement.offset !== undefined && statement.offset > 0xffffffff) {
    throw new Error('GPUSQL OFFSET must fit an unsigned 32-bit row count');
  }
  if (statement.joins.length > 1) throw new Error('GPUSQL currently supports one JOIN');
  if ((statement.groupBy?.length ?? 0) > 1) {
    throw new Error('GPUSQL currently supports one GROUP BY column');
  }
  if ((statement.orderBy?.length ?? 0) > 1) {
    throw new Error('GPUSQL currently supports one ORDER BY column');
  }
  if (statement.limit !== undefined && statement.limit > 0xffffffff) {
    throw new Error('GPUSQL LIMIT must fit an unsigned 32-bit row count');
  }
  const items: GPUSQLSelectItem[] = statement.select?.map(({expression, alias}) => {
    if (expression.type === 'CallExpression' && expression.callee.type === 'Identifier') {
      const name = String(expression.callee['name']).toLowerCase();
      const aggregate = name === 'avg' ? 'mean' : name;
      switch (aggregate) {
        case 'count':
        case 'sum':
        case 'min':
        case 'max':
        case 'mean': {
          if (expression.arguments.length !== 1) {
            throw new Error('GPUSQL aggregates require one argument');
          }
          const argument = expression.arguments[0] as Expression;
          const wildcard = argument.type === 'Identifier' && argument['sqlWildcard'] === true;
          if ((aggregate === 'count') !== wildcard) {
            throw new Error('GPUSQL only permits COUNT(*) as a wildcard aggregation');
          }
          return {
            aggregate,
            ...(wildcard ? {} : {aggregateColumn: readGPUSQLColumn(argument)}),
            alias
          };
        }
      }
    }
    return {expression: lowerSQLExpression(expression, parameters), alias};
  }) ?? [{star: true}];
  const join = statement.joins[0];
  if (statement.from.inputTable !== undefined || join?.table.inputTable !== undefined) {
    throw new Error('GPUSQL does not support table functions');
  }
  let loweredJoin: GPUSQLStatement['join'];
  if (join) {
    if (join.unnest) throw new Error('GPUSQL does not support JOIN UNNEST');
    if (join.type === 'cross') throw new Error('GPUSQL does not support CROSS JOIN');
    if (join.on.type !== 'BinaryExpression' || join.on.operator !== '==') {
      throw new Error('GPUSQL JOIN requires equality between two columns');
    }
    loweredJoin = {
      type: join.type,
      table: join.table.name,
      alias: join.table.alias,
      left: readGPUSQLColumn(join.on.left),
      right: readGPUSQLColumn(join.on.right)
    };
  }
  const sort = statement.orderBy?.[0];
  return {
    items,
    table: statement.from.name,
    alias: statement.from.alias,
    join: loweredJoin,
    predicate: statement.where && lowerSQLExpression(statement.where, parameters),
    groupBy: statement.groupBy?.[0] && readGPUSQLColumn(statement.groupBy[0]),
    orderBy: sort && {
      column: readGPUSQLColumn(sort.expression),
      direction: sort.direction === 'desc' ? 'descending' : 'ascending',
      nulls: sort.nulls
    },
    offset: statement.offset,
    limit: statement.limit
  };
}

/** Reads a source column name or a two-part qualified column reference. */
function readGPUSQLColumn(node: Extract<Expression, {type: 'BinaryExpression'}>['left']): string {
  const expression = node as Expression;
  if (
    expression.type === 'Identifier' &&
    !('gpuSQLParameter' in expression) &&
    !expression.name.includes('.')
  ) {
    return expression.name;
  }
  if (expression.type === 'MemberExpression' && !expression.computed) {
    const object = expression.object as Expression;
    const property = expression.property as Expression;
    if (
      object.type === 'Identifier' &&
      property.type === 'Identifier' &&
      !('gpuSQLParameter' in object) &&
      !object.name.includes('.') &&
      !property.name.includes('.')
    ) {
      return `${object.name}.${property.name}`;
    }
  }
  throw new Error('GPUSQL expected a table or column identifier');
}

function lowerSQLExpression(
  node: Extract<Expression, {type: 'BinaryExpression'}>['left'],
  parameters: GPUDataFrameQueryParameters
): GPUExpressionNode {
  const expression = node as Expression;
  try {
    return lowerPortableExpression(expression, leaf => {
      if (leaf.type === 'Identifier' && 'gpuSQLParameter' in leaf) {
        const name = leaf.name;
        if (!Object.hasOwn(parameters, name)) {
          throw new Error(`GPUSQL parameter ":${name}" requires an explicit default`);
        }
        return parameter(name, parameters[name]).node;
      }
      if (leaf.type === 'Identifier' || leaf.type === 'MemberExpression') {
        return column(readGPUSQLColumn(leaf)).node;
      }
      if (leaf.type === 'CallExpression' && leaf.callee.type === 'Identifier') {
        const name = leaf.callee['name'];
        const functionName =
          typeof name === 'string' && leaf['sqlFunction'] === true ? name.toLowerCase() : name;
        if (
          name !== 'isNull' &&
          name !== 'isNotNull' &&
          name !== 'in' &&
          !isGPUScalarFunction(functionName)
        ) {
          throw new Error(`GPUSQL does not support SQL expression "${name}"`);
        }
      }
      return undefined;
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === 'Unsupported portable GPU dataframe expression'
    ) {
      throw new Error(`GPUSQL does not support SQL expression "${expression.type}"`, {
        cause: error
      });
    }
    throw error;
  }
}
