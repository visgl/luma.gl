// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Independently implemented for WebGPU; inspired by relational SQL semantics.

import type {Expression} from '@math.gl/core/expressions';
import {parseSQLExpression} from '@math.gl/core/sql';
import type {GPUCommandGraph} from '@luma.gl/graph/gpu-core';
import {GPUDataFrame} from '../gpu-dataframe/gpu-data-frame';
import {GPUDataFrameQuery} from '../gpu-dataframe/gpu-data-frame-query';
import {
  GPUExpression,
  column,
  literal,
  parameter,
  type GPUExpressionNode
} from '../gpu-dataframe/gpu-expression';
import type {GPUDataFrameJoinType} from '../gpu-dataframe/gpu-join-query';
import type {
  CompiledGPUDataFrameQuery,
  GPUDataFrameQueryParameters
} from '../gpu-dataframe/gpu-query-compiler';

const MAXIMUM_SQL_LENGTH = 65_536;
const MAXIMUM_SQL_TOKENS = 4_096;

/** Explicit GPU dataframe registrations; Arrow remains exclusively an adapter boundary. */
export type GPUSQLTables = Readonly<Record<string, GPUDataFrame>>;

/** Defaults for named SQL parameters such as `:minimumFare`; values remain caller-controlled. */
export type GPUSQLQueryOptions = Readonly<{parameters?: GPUDataFrameQueryParameters}>;

type GPUSQLToken = Readonly<{
  kind: 'identifier' | 'number' | 'parameter' | 'symbol';
  value: string;
}>;
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
  ) => GPUSQLCompiledPlan & {topK: (limit: number) => GPUSQLCompiledPlan};
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
    const parser = new GPUSQLParser(source, options.parameters ?? {});
    const statement = parser.parse();
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
    if (statement.join || statement.orderBy || statement.limit !== undefined) {
      throw new Error('GPUSQL aggregate queries do not yet support joins, ordering, or limits');
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
    if (statement.orderBy || statement.limit !== undefined) {
      throw new Error('GPUSQL joined results do not yet support ORDER BY or LIMIT');
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
    const orderColumn =
      selected.find(name => name.toLowerCase() === statement.orderBy!.column.toLowerCase()) ??
      resolve(statement.orderBy.column);
    if (!selected.includes(orderColumn)) {
      throw new Error('GPUSQL ORDER BY requires the sort column in the SELECT projection');
    }
    const sort = query.select(selected).sortByGlobal(orderColumn, {
      direction: statement.orderBy.direction,
      ...(statement.orderBy.nulls ? {nulls: statement.orderBy.nulls} : {})
    });
    return statement.limit === undefined ? sort : sort.topK(statement.limit);
  }
  if (statement.limit !== undefined) throw new Error('GPUSQL LIMIT currently requires ORDER BY');
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

class GPUSQLParser {
  private readonly tokens: readonly GPUSQLToken[];
  private readonly parameters: GPUDataFrameQueryParameters;
  private position = 0;

  constructor(source: string, parameters: GPUDataFrameQueryParameters) {
    this.tokens = tokenizeGPUSQL(source);
    this.parameters = parameters;
  }

  parse(): GPUSQLStatement {
    this.expectKeyword('SELECT');
    const items: GPUSQLSelectItem[] = [];
    do {
      items.push(this.parseSelectItem());
    } while (this.takeSymbol(','));
    this.expectKeyword('FROM');
    const table = this.parseIdentifier();
    const alias = this.parseOptionalTableAlias();
    const join = this.parseOptionalJoin();
    const predicate = this.takeKeyword('WHERE') ? this.parseExpression() : undefined;
    let groupBy: string | undefined;
    if (this.takeKeyword('GROUP')) {
      this.expectKeyword('BY');
      groupBy = this.parseIdentifier();
      if (this.takeSymbol(',')) throw new Error('GPUSQL currently supports one GROUP BY column');
    }
    let orderBy: GPUSQLStatement['orderBy'];
    if (this.takeKeyword('ORDER')) {
      this.expectKeyword('BY');
      const sortColumn = this.parseIdentifier();
      const direction = this.takeKeyword('DESC')
        ? 'descending'
        : (this.takeKeyword('ASC'), 'ascending');
      let nulls: 'first' | 'last' | undefined;
      if (this.takeKeyword('NULLS')) {
        nulls = this.takeKeyword('FIRST') ? 'first' : this.expectKeyword('LAST') && 'last';
      }
      orderBy = {column: sortColumn, direction, ...(nulls ? {nulls} : {})};
      if (this.takeSymbol(',')) throw new Error('GPUSQL currently supports one ORDER BY column');
    }
    let limit: number | undefined;
    if (this.takeKeyword('LIMIT')) {
      const token = this.take();
      if (token?.kind !== 'number' || !/^\d+$/.test(token.value)) {
        throw new Error('GPUSQL LIMIT requires a nonnegative integer');
      }
      limit = Number(token.value);
      if (!Number.isSafeInteger(limit) || limit > 0xffffffff) {
        throw new Error('GPUSQL LIMIT must fit an unsigned 32-bit row count');
      }
    }
    this.takeSymbol(';');
    if (this.peek())
      throw new Error(`GPUSQL does not support unexpected token "${this.peek()!.value}"`);
    return {
      items,
      table,
      ...(alias ? {alias} : {}),
      ...(join ? {join} : {}),
      ...(predicate ? {predicate} : {}),
      ...(groupBy ? {groupBy} : {}),
      ...(orderBy ? {orderBy} : {}),
      ...(limit !== undefined ? {limit} : {})
    };
  }

  private parseSelectItem(): GPUSQLSelectItem {
    if (this.takeSymbol('*')) return {star: true};
    const token = this.peek();
    if (
      token?.kind === 'identifier' &&
      /^(COUNT|SUM|MIN|MAX|AVG|MEAN)$/i.test(token.value) &&
      this.tokens[this.position + 1]?.value === '('
    ) {
      this.take();
      this.expectSymbol('(');
      const aggregate = token.value.toLowerCase();
      const aggregateColumn = this.takeSymbol('*') ? undefined : this.parseIdentifier();
      this.expectSymbol(')');
      if (!aggregateColumn && aggregate !== 'count') {
        throw new Error('GPUSQL only permits COUNT(*) as a wildcard aggregation');
      }
      if (aggregateColumn && aggregate === 'count') {
        throw new Error('GPUSQL currently supports COUNT(*) but not nullable COUNT(column)');
      }
      return {
        aggregate: aggregate === 'avg' ? 'mean' : (aggregate as GPUSQLSelectItem['aggregate']),
        ...(aggregateColumn ? {aggregateColumn} : {}),
        ...(this.takeKeyword('AS') ? {alias: this.parseIdentifier()} : {})
      };
    }
    const expression = this.parseExpression();
    return {
      ...(expression ? {expression} : {}),
      ...(this.takeKeyword('AS') ? {alias: this.parseIdentifier()} : {})
    };
  }

  private parseOptionalJoin(): GPUSQLStatement['join'] {
    let type: GPUDataFrameJoinType = 'inner';
    if (this.takeKeyword('LEFT')) {
      this.takeKeyword('OUTER');
      type = 'left';
    } else if (this.takeKeyword('SEMI')) {
      type = 'semi';
    } else if (this.takeKeyword('ANTI')) {
      type = 'anti';
    } else {
      this.takeKeyword('INNER');
    }
    if (!this.takeKeyword('JOIN')) {
      if (type !== 'inner') throw new Error('GPUSQL join modifier must be followed by JOIN');
      return undefined;
    }
    const table = this.parseIdentifier();
    const alias = this.parseOptionalTableAlias();
    this.expectKeyword('ON');
    const left = this.parseIdentifier();
    this.expectSymbol('=');
    const right = this.parseIdentifier();
    return {type, table, ...(alias ? {alias} : {}), left, right};
  }

  private parseExpression(): GPUExpressionNode {
    const tokens: string[] = [];
    let depth = 0;
    let expectsOperand: boolean = true;
    for (let token = this.peek(); token; token = this.peek()) {
      const value = token.value;
      if (depth === 0) {
        if (token.kind === 'symbol' && (value === ',' || value === ';')) break;
        if (
          token.kind === 'identifier' &&
          !expectsOperand &&
          /^(AS|FROM|GROUP|ORDER|LIMIT)$/i.test(value)
        ) {
          break;
        }
      }
      switch (token.kind) {
        case 'parameter':
          // The shared AST leaves parameter binding to the GPU planner.
          tokens.push(`":${value}"`);
          expectsOperand = false;
          break;
        case 'identifier': {
          const operator: boolean =
            /^NOT$/i.test(value) || (!expectsOperand && /^(AND|OR|IS)$/i.test(value));
          const keyword = operator || /^(NULL|TRUE|FALSE)$/i.test(value);
          tokens.push(keyword ? value : `"${value}"`);
          expectsOperand = operator;
          break;
        }
        case 'symbol':
          if (value === '(') depth++;
          if (value === ')') depth--;
          tokens.push(value);
          expectsOperand = value !== ')';
          break;
        case 'number':
          tokens.push(value);
          expectsOperand = false;
          break;
      }
      this.take();
    }
    return lowerSQLExpression(parseSQLExpression(tokens.join(' ')), this.parameters);
  }

  private parseOptionalTableAlias(): string | undefined {
    if (this.takeKeyword('AS')) return this.parseIdentifier();
    const token = this.peek();
    return token?.kind === 'identifier' &&
      !/^(WHERE|GROUP|ORDER|LIMIT|JOIN|INNER|LEFT|OUTER|SEMI|ANTI|ON)$/i.test(token.value)
      ? this.parseIdentifier()
      : undefined;
  }

  private parseIdentifier(): string {
    const token = this.take();
    if (token?.kind !== 'identifier')
      throw new Error('GPUSQL expected a table or column identifier');
    return token.value;
  }

  private expectKeyword(keyword: string): true {
    if (!this.takeKeyword(keyword)) throw new Error(`GPUSQL expected ${keyword}`);
    return true;
  }

  private takeKeyword(keyword: string): boolean {
    const token = this.peek();
    if (token?.kind !== 'identifier' || token.value.toUpperCase() !== keyword) return false;
    this.position++;
    return true;
  }

  private expectSymbol(symbol: string): void {
    if (!this.takeSymbol(symbol)) throw new Error(`GPUSQL expected "${symbol}"`);
  }

  private takeSymbol(symbol: string): boolean {
    const token = this.peek();
    if (token?.kind !== 'symbol' || token.value !== symbol) return false;
    this.position++;
    return true;
  }

  private take(): GPUSQLToken | undefined {
    const token = this.tokens[this.position];
    if (token) this.position++;
    return token;
  }

  private peek(): GPUSQLToken | undefined {
    return this.tokens[this.position];
  }
}

function tokenizeGPUSQL(source: string): GPUSQLToken[] {
  if (typeof source !== 'string' || source.length === 0 || source.length > MAXIMUM_SQL_LENGTH) {
    throw new Error('GPUSQL requires a nonempty, safely bounded SELECT statement');
  }
  const expression =
    /\s+|(?:--[^\n\r]*)|(?::([A-Za-z_][A-Za-z0-9_]*))|([A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)?)|(\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|(<=|>=|<>|!=|[(),;*+\-/=<>])/gy;
  const tokens: GPUSQLToken[] = [];
  let cursor = 0;
  while (cursor < source.length) {
    expression.lastIndex = cursor;
    const match = expression.exec(source);
    if (!match) throw new Error(`GPUSQL contains an unsupported token at character ${cursor}`);
    cursor = expression.lastIndex;
    if (match[1]) tokens.push({kind: 'parameter', value: match[1]});
    else if (match[2]) tokens.push({kind: 'identifier', value: match[2]});
    else if (match[3]) tokens.push({kind: 'number', value: match[3]});
    else if (match[4]) tokens.push({kind: 'symbol', value: match[4]});
    if (tokens.length > MAXIMUM_SQL_TOKENS)
      throw new Error('GPUSQL statement exceeds its safe token limit');
  }
  return tokens;
}

const SQL_BINARY_OPERATORS: Readonly<
  Partial<Record<string, Extract<GPUExpressionNode, {kind: 'binary'}>['operator']>>
> = {
  '||': 'or',
  '&&': 'and',
  '==': 'equal',
  '!=': 'not-equal',
  '>': 'greater-than',
  '>=': 'greater-than-or-equal',
  '<': 'less-than',
  '<=': 'less-than-or-equal',
  '+': 'add',
  '-': 'subtract',
  '*': 'multiply',
  '/': 'divide'
};

function lowerSQLExpression(
  node: Extract<Expression, {type: 'BinaryExpression'}>['left'],
  parameters: GPUDataFrameQueryParameters
): GPUExpressionNode {
  // math.gl types child nodes as generic expressions, though the SQL parser emits the AST union.
  const expression = node as Expression;
  switch (expression.type) {
    case 'Identifier': {
      if (!expression.name.startsWith(':')) return column(expression.name).node;
      const name = expression.name.slice(1);
      if (!Object.hasOwn(parameters, name)) {
        throw new Error(`GPUSQL parameter ":${name}" requires an explicit default`);
      }
      return parameter(name, parameters[name]).node;
    }
    case 'Literal': {
      const value = expression.value;
      if (
        value === null ||
        typeof value === 'boolean' ||
        (typeof value === 'number' && Number.isFinite(value))
      ) {
        return literal(value).node;
      }
      break;
    }
    case 'UnaryExpression':
      if (expression.operator === '!' || expression.operator === '-') {
        return {
          kind: 'unary',
          operator: expression.operator === '!' ? 'not' : 'negate',
          operand: lowerSQLExpression(expression.argument, parameters)
        };
      }
      break;
    case 'BinaryExpression': {
      const operator = SQL_BINARY_OPERATORS[expression.operator];
      if (operator) {
        return {
          kind: 'binary',
          operator,
          left: lowerSQLExpression(expression.left, parameters),
          right: lowerSQLExpression(expression.right, parameters)
        };
      }
      break;
    }
    case 'CallExpression':
      if (
        expression.arguments.length === 1 &&
        (expression.callee['name'] === 'isNull' || expression.callee['name'] === 'isNotNull')
      ) {
        return {
          kind: 'unary',
          operator: expression.callee['name'] === 'isNull' ? 'is-null' : 'is-valid',
          operand: lowerSQLExpression(expression.arguments[0], parameters)
        };
      }
      break;
    default:
      break;
  }
  throw new Error(`GPUSQL does not support SQL expression "${expression.type}"`);
}
