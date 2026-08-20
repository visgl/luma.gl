// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Independently implemented for WebGPU; inspired by relational SQL semantics.

import type {GPUCommandGraph} from '../gpu-core/gpu-command-graph';
import {GPUDataFrame as LuDataFrame} from '../gpu-dataframe/gpu-data-frame';
import {GPUDataFrameQuery as LuDataFrameQuery} from '../gpu-dataframe/gpu-data-frame-query';
import {
  GPUExpression as LuExpression,
  column,
  literal,
  parameter,
  type GPUExpressionNode as LuExpressionNode
} from '../gpu-dataframe/gpu-expression';
import type {GPUDataFrameJoinType as LuDataFrameJoinType} from '../gpu-dataframe/gpu-join-query';
import type {
  CompiledGPUDataFrameQuery as CompiledLuDataFrameQuery,
  GPUDataFrameQueryParameters as LuDataFrameQueryParameters
} from '../gpu-dataframe/gpu-query-compiler';

const MAXIMUM_SQL_LENGTH = 65_536;
const MAXIMUM_SQL_TOKENS = 4_096;
const MAXIMUM_EXPRESSION_DEPTH = 64;

/** Explicit GPU dataframe registrations; Arrow remains exclusively an adapter boundary. */
export type LuSQLTables = Readonly<Record<string, LuDataFrame>>;

/** Defaults for named SQL parameters such as `:minimumFare`; values remain caller-controlled. */
export type LuSQLQueryOptions = Readonly<{parameters?: LuDataFrameQueryParameters}>;

type LuSQLToken = Readonly<{kind: 'identifier' | 'number' | 'parameter' | 'symbol'; value: string}>;
type LuSQLSelectItem = Readonly<{
  expression?: LuExpressionNode;
  aggregate?: 'count' | 'sum' | 'min' | 'max' | 'mean';
  aggregateColumn?: string;
  alias?: string;
  star?: boolean;
}>;
type LuSQLStatement = Readonly<{
  items: readonly LuSQLSelectItem[];
  table: string;
  alias?: string;
  join?: Readonly<{
    type: LuDataFrameJoinType;
    table: string;
    alias?: string;
    left: string;
    right: string;
  }>;
  predicate?: LuExpressionNode;
  groupBy?: string;
  orderBy?: Readonly<{
    column: string;
    direction: 'ascending' | 'descending';
    nulls?: 'first' | 'last';
  }>;
  limit?: number;
}>;

type LuSQLCompiledPlan = Readonly<{
  compile: (graph: GPUCommandGraph<LuDataFrameQueryParameters>) => CompiledLuDataFrameQuery;
}>;

type LuSQLAggregationDefinitions = Record<
  string,
  'count' | {sum: string} | {min: string} | {max: string} | {mean: string}
>;

/** Runtime-validated SQL names cross the strongly typed dataframe boundary exactly once. */
type LuSQLDynamicQuery = LuSQLCompiledPlan & {
  predicates: readonly LuExpression<boolean, string>[];
  filter: (predicate: LuExpression<boolean, string>) => LuSQLDynamicQuery;
  select: (names: readonly string[]) => LuSQLDynamicQuery;
  withColumn: (name: string, expression: LuExpression<number | null, string>) => LuSQLDynamicQuery;
  groupBy: (key: string) => {
    aggregate: (definitions: LuSQLAggregationDefinitions) => LuSQLCompiledPlan;
  };
  aggregate: (definitions: LuSQLAggregationDefinitions) => LuSQLCompiledPlan;
  sortByGlobal: (
    name: string,
    options: {direction: 'ascending' | 'descending'; nulls?: 'first' | 'last'}
  ) => LuSQLCompiledPlan & {topK: (limit: number) => LuSQLCompiledPlan};
  innerJoin: (right: LuDataFrame, options: {leftOn: string; rightOn: string}) => LuSQLCompiledPlan;
  leftJoin: (right: LuDataFrame, options: {leftOn: string; rightOn: string}) => LuSQLCompiledPlan;
  semiJoin: (right: LuDataFrame, options: {leftOn: string; rightOn: string}) => LuSQLCompiledPlan;
  antiJoin: (right: LuDataFrame, options: {leftOn: string; rightOn: string}) => LuSQLCompiledPlan;
};

/**
 * Dependency-free SQL frontend over explicitly registered, already GPU-resident dataframes.
 *
 * Parsing and planning never upload data, submit work, or read GPU buffers. Arrow upload/output
 * remain explicit `@luma.gl/arrow` operations around the shared GPU table execution core.
 */
export class LuSQLContext {
  private readonly tables: Readonly<Record<string, LuDataFrame>>;

  constructor(tables: LuSQLTables) {
    const registered: Record<string, LuDataFrame> = {};
    for (const [name, table] of Object.entries(tables)) {
      if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name) || !(table instanceof LuDataFrame)) {
        throw new Error('LuSQL requires valid names mapped to existing GPU dataframes');
      }
      const canonical = name.toLowerCase();
      if (registered[canonical]) throw new Error(`LuSQL table "${name}" is already registered`);
      registered[canonical] = table;
    }
    this.tables = Object.freeze(registered);
    Object.freeze(this);
  }

  /** Parses and validates one immutable SELECT plan without touching registered GPU sources. */
  query(source: string, options: LuSQLQueryOptions = {}): LuSQLQuery {
    const parser = new LuSQLParser(source, options.parameters ?? {});
    const statement = parser.parse();
    return new LuSQLQuery(source, buildLuSQLPlan(this.tables, statement));
  }
}

/** Immutable SQL plan lowered directly into existing reusable GPU dataframe command graphs. */
export class LuSQLQuery {
  /** Original application-owned SQL text, retained solely for diagnostics and inspection. */
  readonly sql: string;
  private readonly plan: LuSQLCompiledPlan;

  /** @internal */
  constructor(sql: string, plan: LuSQLCompiledPlan) {
    this.sql = sql;
    this.plan = plan;
    Object.freeze(this);
  }

  /** Compiles existing dataframe operations into the caller-owned GPU command graph. */
  compile(graph: GPUCommandGraph<LuDataFrameQueryParameters>): CompiledLuDataFrameQuery {
    return this.plan.compile(graph);
  }
}

function buildLuSQLPlan(
  tables: Readonly<Record<string, LuDataFrame>>,
  statement: LuSQLStatement
): LuSQLCompiledPlan {
  const frame = tables[statement.table.toLowerCase()];
  if (!frame) throw new Error(`LuSQL table "${statement.table}" is not registered`);
  let query = new LuDataFrameQuery(frame, [], frame.columnNames) as unknown as LuSQLDynamicQuery;
  const qualifier = statement.alias ?? statement.table;
  const resolve = (name: string): string => resolveLuSQLColumn(name, qualifier, frame.columnNames);
  if (statement.predicate) {
    query = query.filter(
      new LuExpression<boolean, string>(resolveLuSQLExpression(statement.predicate, resolve))
    );
  }

  const aggregates = statement.items.filter(item => item.aggregate);
  if (aggregates.length > 0) {
    if (statement.join || statement.orderBy || statement.limit !== undefined) {
      throw new Error('LuSQL aggregate queries do not yet support joins, ordering, or limits');
    }
    const definitions: LuSQLAggregationDefinitions = {};
    for (const item of aggregates) {
      const name = item.alias ?? `${item.aggregate}_${item.aggregateColumn ?? 'all'}`;
      if (definitions[name]) throw new Error(`LuSQL aggregate alias "${name}" is duplicated`);
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
        resolveLuSQLProjectionName(nonAggregates[0], resolve) !== key
      ) {
        throw new Error('LuSQL grouped queries must select their single GROUP BY key');
      }
      return query.groupBy(key).aggregate(definitions);
    }
    if (aggregates.length !== statement.items.length) {
      throw new Error('LuSQL global aggregates cannot mix ordinary source columns');
    }
    return query.aggregate(definitions);
  }
  if (statement.groupBy) throw new Error('LuSQL GROUP BY requires at least one aggregation');

  const selected: string[] = [];
  for (const item of statement.items) {
    if (item.star) {
      if (statement.items.length !== 1)
        throw new Error('LuSQL SELECT * cannot include other columns');
      selected.push(...frame.columnNames);
      continue;
    }
    const node = resolveLuSQLExpression(item.expression!, resolve);
    const name = item.alias ?? (node.kind === 'column' ? node.name : undefined);
    if (!name) throw new Error('LuSQL computed SELECT expressions require an explicit AS alias');
    if (selected.includes(name)) throw new Error(`LuSQL output column "${name}" is duplicated`);
    if (node.kind !== 'column' || node.name !== name) {
      if (frame.columnNames.includes(name)) {
        throw new Error(`LuSQL derived alias "${name}" conflicts with an existing source column`);
      }
      query = query.withColumn(name, new LuExpression<number | null, string>(node));
    }
    selected.push(name);
  }

  if (statement.join) {
    if (statement.orderBy || statement.limit !== undefined) {
      throw new Error('LuSQL joined results do not yet support ORDER BY or LIMIT');
    }
    const right = tables[statement.join.table.toLowerCase()];
    if (!right) throw new Error(`LuSQL table "${statement.join.table}" is not registered`);
    const leftKey = resolve(statement.join.left);
    const rightQualifier = statement.join.alias ?? statement.join.table;
    const rightKey = resolveLuSQLColumn(statement.join.right, rightQualifier, right.columnNames);
    if (!selected.includes(leftKey)) {
      throw new Error('LuSQL joins require the left join key to remain selected');
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
      throw new Error('LuSQL ORDER BY requires the sort column in the SELECT projection');
    }
    const sort = query.select(selected).sortByGlobal(orderColumn, {
      direction: statement.orderBy.direction,
      ...(statement.orderBy.nulls ? {nulls: statement.orderBy.nulls} : {})
    });
    return statement.limit === undefined ? sort : sort.topK(statement.limit);
  }
  if (statement.limit !== undefined) throw new Error('LuSQL LIMIT currently requires ORDER BY');
  if (query.predicates.length === 0) {
    const firstColumn = frame.columnNames[0];
    if (!firstColumn) throw new Error('LuSQL SELECT requires at least one GPU source column');
    query = query.filter(column(firstColumn).isValid().or(column(firstColumn).isNull()));
  }
  return query.select(selected);
}

function resolveLuSQLProjectionName(
  item: LuSQLSelectItem,
  resolve: (name: string) => string
): string {
  if (item.expression?.kind !== 'column') {
    throw new Error('LuSQL grouped source expressions must reference the group key directly');
  }
  return resolve(item.expression.name);
}

function resolveLuSQLColumn(name: string, qualifier: string, columns: readonly string[]): string {
  const parts = name.split('.');
  if (
    parts.length > 2 ||
    (parts.length === 2 && parts[0].toLowerCase() !== qualifier.toLowerCase())
  ) {
    throw new Error(`LuSQL column "${name}" has an unknown table qualifier`);
  }
  const requested = parts[parts.length - 1];
  const matches = columns.filter(candidate => candidate.toLowerCase() === requested.toLowerCase());
  if (matches.length !== 1) throw new Error(`LuSQL column "${name}" does not exist`);
  return matches[0];
}

function resolveLuSQLExpression(
  expression: LuExpressionNode,
  resolve: (name: string) => string
): LuExpressionNode {
  switch (expression.kind) {
    case 'column':
      return {kind: 'column', name: resolve(expression.name)};
    case 'unary':
      return {...expression, operand: resolveLuSQLExpression(expression.operand, resolve)};
    case 'binary':
      return {
        ...expression,
        left: resolveLuSQLExpression(expression.left, resolve),
        right: resolveLuSQLExpression(expression.right, resolve)
      };
    default:
      return expression;
  }
}

class LuSQLParser {
  private readonly tokens: readonly LuSQLToken[];
  private readonly parameters: LuDataFrameQueryParameters;
  private position = 0;

  constructor(source: string, parameters: LuDataFrameQueryParameters) {
    this.tokens = tokenizeLuSQL(source);
    this.parameters = parameters;
  }

  parse(): LuSQLStatement {
    this.expectKeyword('SELECT');
    const items: LuSQLSelectItem[] = [];
    do {
      items.push(this.parseSelectItem());
    } while (this.takeSymbol(','));
    this.expectKeyword('FROM');
    const table = this.parseIdentifier();
    const alias = this.parseOptionalTableAlias();
    const join = this.parseOptionalJoin();
    const predicate = this.takeKeyword('WHERE') ? this.parseExpression(0) : undefined;
    let groupBy: string | undefined;
    if (this.takeKeyword('GROUP')) {
      this.expectKeyword('BY');
      groupBy = this.parseIdentifier();
      if (this.takeSymbol(',')) throw new Error('LuSQL currently supports one GROUP BY column');
    }
    let orderBy: LuSQLStatement['orderBy'];
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
      if (this.takeSymbol(',')) throw new Error('LuSQL currently supports one ORDER BY column');
    }
    let limit: number | undefined;
    if (this.takeKeyword('LIMIT')) {
      const token = this.take();
      if (token?.kind !== 'number' || !/^\d+$/.test(token.value)) {
        throw new Error('LuSQL LIMIT requires a nonnegative integer');
      }
      limit = Number(token.value);
      if (!Number.isSafeInteger(limit) || limit > 0xffffffff) {
        throw new Error('LuSQL LIMIT must fit an unsigned 32-bit row count');
      }
    }
    this.takeSymbol(';');
    if (this.peek())
      throw new Error(`LuSQL does not support unexpected token "${this.peek()!.value}"`);
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

  private parseSelectItem(): LuSQLSelectItem {
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
        throw new Error('LuSQL only permits COUNT(*) as a wildcard aggregation');
      }
      if (aggregateColumn && aggregate === 'count') {
        throw new Error('LuSQL currently supports COUNT(*) but not nullable COUNT(column)');
      }
      return {
        aggregate: aggregate === 'avg' ? 'mean' : (aggregate as LuSQLSelectItem['aggregate']),
        ...(aggregateColumn ? {aggregateColumn} : {}),
        ...(this.takeKeyword('AS') ? {alias: this.parseIdentifier()} : {})
      };
    }
    const expression = this.parseExpression(0);
    return {
      ...(expression ? {expression} : {}),
      ...(this.takeKeyword('AS') ? {alias: this.parseIdentifier()} : {})
    };
  }

  private parseOptionalJoin(): LuSQLStatement['join'] {
    let type: LuDataFrameJoinType = 'inner';
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
      if (type !== 'inner') throw new Error('LuSQL join modifier must be followed by JOIN');
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

  private parseExpression(depth: number, minimumPrecedence = 0): LuExpressionNode {
    if (depth > MAXIMUM_EXPRESSION_DEPTH)
      throw new Error('LuSQL expression nesting exceeds its safe limit');
    let expression = this.parseUnary(depth + 1);
    while (true) {
      if (minimumPrecedence <= 3 && this.takeKeyword('IS')) {
        const negated = this.takeKeyword('NOT');
        this.expectKeyword('NULL');
        expression = {
          kind: 'unary',
          operator: negated ? 'is-valid' : 'is-null',
          operand: expression
        };
        continue;
      }
      const token = this.peek();
      const operation = token ? getLuSQLBinaryOperator(token.value) : undefined;
      if (!operation || operation.precedence < minimumPrecedence) break;
      this.take();
      expression = {
        kind: 'binary',
        operator: operation.operator,
        left: expression,
        right: this.parseExpression(depth + 1, operation.precedence + 1)
      };
    }
    return expression;
  }

  private parseUnary(depth: number): LuExpressionNode {
    if (this.takeKeyword('NOT')) {
      return {kind: 'unary', operator: 'not', operand: this.parseExpression(depth, 3)};
    }
    if (this.takeSymbol('-')) {
      return {kind: 'unary', operator: 'negate', operand: this.parseUnary(depth + 1)};
    }
    if (this.takeSymbol('(')) {
      const expression = this.parseExpression(depth + 1);
      this.expectSymbol(')');
      return expression;
    }
    const token = this.take();
    if (!token) throw new Error('LuSQL expected an expression');
    if (token.kind === 'number') {
      const value = Number(token.value);
      if (!Number.isFinite(value)) throw new Error('LuSQL numeric literals must be finite');
      return literal(value).node;
    }
    if (token.kind === 'parameter') {
      if (!Object.hasOwn(this.parameters, token.value)) {
        throw new Error(`LuSQL parameter ":${token.value}" requires an explicit default`);
      }
      return parameter(token.value, this.parameters[token.value]).node;
    }
    if (token.kind === 'identifier') {
      if (/^NULL$/i.test(token.value)) return literal(null).node;
      if (/^TRUE$/i.test(token.value)) return literal(true).node;
      if (/^FALSE$/i.test(token.value)) return literal(false).node;
      return column(token.value).node;
    }
    throw new Error(`LuSQL does not support expression token "${token.value}"`);
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
      throw new Error('LuSQL expected a table or column identifier');
    return token.value;
  }

  private expectKeyword(keyword: string): true {
    if (!this.takeKeyword(keyword)) throw new Error(`LuSQL expected ${keyword}`);
    return true;
  }

  private takeKeyword(keyword: string): boolean {
    const token = this.peek();
    if (token?.kind !== 'identifier' || token.value.toUpperCase() !== keyword) return false;
    this.position++;
    return true;
  }

  private expectSymbol(symbol: string): void {
    if (!this.takeSymbol(symbol)) throw new Error(`LuSQL expected "${symbol}"`);
  }

  private takeSymbol(symbol: string): boolean {
    const token = this.peek();
    if (token?.kind !== 'symbol' || token.value !== symbol) return false;
    this.position++;
    return true;
  }

  private take(): LuSQLToken | undefined {
    const token = this.tokens[this.position];
    if (token) this.position++;
    return token;
  }

  private peek(): LuSQLToken | undefined {
    return this.tokens[this.position];
  }
}

function tokenizeLuSQL(source: string): LuSQLToken[] {
  if (typeof source !== 'string' || source.length === 0 || source.length > MAXIMUM_SQL_LENGTH) {
    throw new Error('LuSQL requires a nonempty, safely bounded SELECT statement');
  }
  const expression =
    /\s+|(?:--[^\n\r]*)|(?::([A-Za-z_][A-Za-z0-9_]*))|([A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)?)|(\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|(<=|>=|<>|!=|[(),;*+\-/=<>])/gy;
  const tokens: LuSQLToken[] = [];
  let cursor = 0;
  while (cursor < source.length) {
    expression.lastIndex = cursor;
    const match = expression.exec(source);
    if (!match) throw new Error(`LuSQL contains an unsupported token at character ${cursor}`);
    cursor = expression.lastIndex;
    if (match[1]) tokens.push({kind: 'parameter', value: match[1]});
    else if (match[2]) tokens.push({kind: 'identifier', value: match[2]});
    else if (match[3]) tokens.push({kind: 'number', value: match[3]});
    else if (match[4]) tokens.push({kind: 'symbol', value: match[4]});
    if (tokens.length > MAXIMUM_SQL_TOKENS)
      throw new Error('LuSQL statement exceeds its safe token limit');
  }
  return tokens;
}

function getLuSQLBinaryOperator(value: string):
  | Readonly<{
      operator: Extract<LuExpressionNode, {kind: 'binary'}>['operator'];
      precedence: number;
    }>
  | undefined {
  switch (value.toUpperCase()) {
    case 'OR':
      return {operator: 'or', precedence: 1};
    case 'AND':
      return {operator: 'and', precedence: 2};
    case '=':
      return {operator: 'equal', precedence: 3};
    case '!=':
    case '<>':
      return {operator: 'not-equal', precedence: 3};
    case '>':
      return {operator: 'greater-than', precedence: 3};
    case '>=':
      return {operator: 'greater-than-or-equal', precedence: 3};
    case '<':
      return {operator: 'less-than', precedence: 3};
    case '<=':
      return {operator: 'less-than-or-equal', precedence: 3};
    case '+':
      return {operator: 'add', precedence: 4};
    case '-':
      return {operator: 'subtract', precedence: 4};
    case '*':
      return {operator: 'multiply', precedence: 5};
    case '/':
      return {operator: 'divide', precedence: 5};
    default:
      return undefined;
  }
}
