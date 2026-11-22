// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Independently implemented for WebGPU; inspired by relational SQL semantics.

import {parseSQLSelectStatement} from '@math.gl/sql/parser';
import type {Expression} from '@math.gl/sql/expressions';
import type {GPUCommandGraph} from '@luma.gl/graph/gpu-core';
import type {GPUTypeMap} from '@luma.gl/graph/gpu-tables';

import {GPUDataFrame} from '../gpu-dataframe/gpu-data-frame';
import {
  GPUDataFrameQuery,
  type GPUDataFrameDerivedColumn
} from '../gpu-dataframe/gpu-data-frame-query';
import {
  compileGPUDataFrameGroupedAggregation,
  compileGPUDataFrameObservedAggregation
} from '../gpu-dataframe/gpu-group-aggregation-compiler';
import {normalizeGPUDataFrameAggregations} from '../gpu-dataframe/gpu-group-by-query';
import {
  compileGPUDataFrameGlobalSort,
  type GPUGlobalSortKey
} from '../gpu-dataframe/gpu-global-sort-compiler';
import type {GPUDataFrameNormalizedSortOptions} from '../gpu-dataframe/gpu-sort-query';
import {
  GPUExpression,
  column,
  isGPUScalarFunction,
  parameter,
  type GPUExpressionNode
} from '../gpu-dataframe/gpu-expression';
import {lowerPortableExpression} from '../gpu-dataframe/portable-expression';
import {compileGPUDataFrameJoin} from '../gpu-dataframe/gpu-join-compiler';
import type {
  GPUDataFrameJoinType,
  GPUDataFrameNormalizedJoinOptions
} from '../gpu-dataframe/gpu-join-query';
import type {
  CompiledGPUDataFrameQuery,
  GPUDataFrameQueryParameters
} from '../gpu-dataframe/gpu-query-compiler';

/** Explicit GPU dataframe registrations; Arrow remains exclusively an adapter boundary. */
export type GPUSQLTables = Readonly<Record<string, GPUDataFrame>>;

/** Defaults for named SQL parameters such as `:minimumFare`; values remain caller-controlled. */
export type GPUSQLQueryOptions = Readonly<{parameters?: GPUDataFrameQueryParameters}>;

/** A source column name with its optional, separately parsed table qualifier. */
type GPUSQLColumnReference = Readonly<{name: string; qualifier?: string}>;

/** A bound-column spelling or a one-based SELECT position. */

type GPUSQLSelectItem = Readonly<{
  expression?: Expression;
  aggregate?: 'count' | 'sum' | 'min' | 'max' | 'mean';
  aggregateInput?: Expression;
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
    left: GPUSQLColumnReference;
    right: GPUSQLColumnReference;
  }>;
  predicate?: Expression;
  groupBy?: readonly Expression[];
  orderBy?: readonly Readonly<{
    expression: Expression;
    direction: 'ascending' | 'descending';
    nulls?: 'first' | 'last';
  }>[];
  limit?: number;
  offset?: number;
}>;

type GPUSQLCompiledPlan = Readonly<{
  compile: (graph: GPUCommandGraph<GPUDataFrameQueryParameters>) => CompiledGPUDataFrameQuery;
}>;

type GPUSQLAggregationDefinitions = Record<
  string,
  'count' | {count: string} | {sum: string} | {min: string} | {max: string} | {mean: string}
>;

/** Existing global-sort plan and its already-validated controls. */
type GPUSQLSortPlan = GPUSQLCompiledPlan & {readonly options: GPUDataFrameNormalizedSortOptions};

/** Validated join plan with normalized key and hash-index controls. */

type GPUSQLJoinPlan = GPUSQLCompiledPlan & {readonly options: GPUDataFrameNormalizedJoinOptions};

/** Runtime-validated SQL names cross the strongly typed dataframe boundary exactly once. */
type GPUSQLDynamicQuery = GPUSQLCompiledPlan & {
  readonly selectedColumns: readonly string[];
  readonly predicates: readonly GPUExpression<boolean, string>[];
  readonly derivedColumns: readonly GPUDataFrameDerivedColumn[];
  filter: (predicate: GPUExpression<boolean, string>) => GPUSQLDynamicQuery;
  select: (names: readonly string[]) => GPUSQLDynamicQuery;
  withColumn: (
    name: string,
    expression: GPUExpression<number | null, string>
  ) => GPUSQLDynamicQuery;
  groupBy: (key: string) => {
    readonly groupCount: number;
  };
  aggregate: (definitions: GPUSQLAggregationDefinitions) => GPUSQLCompiledPlan;
  sortByGlobal: (
    name: string,
    options: {direction: 'ascending' | 'descending'; nulls?: 'first' | 'last'}
  ) => GPUSQLSortPlan & {page: (offset: number, limit?: number) => GPUSQLSortPlan};
  innerJoin: (right: GPUDataFrame, options: {leftOn: string; rightOn: string}) => GPUSQLJoinPlan;
  leftJoin: (right: GPUDataFrame, options: {leftOn: string; rightOn: string}) => GPUSQLJoinPlan;
  semiJoin: (right: GPUDataFrame, options: {leftOn: string; rightOn: string}) => GPUSQLJoinPlan;
  antiJoin: (right: GPUDataFrame, options: {leftOn: string; rightOn: string}) => GPUSQLJoinPlan;
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
    const statement = parseGPUSQLStatement(source);
    return new GPUSQLQuery(
      source,
      buildGPUSQLPlan(this.tables, statement, options.parameters ?? {})
    );
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
  statement: GPUSQLStatement,
  parameters: GPUDataFrameQueryParameters
): GPUSQLCompiledPlan {
  const frame = tables[statement.table.toLowerCase()];
  if (!frame) throw new Error(`GPUSQL table "${statement.table}" is not registered`);
  let query = new GPUDataFrameQuery(frame, [], frame.columnNames) as unknown as GPUSQLDynamicQuery;
  const qualifier = statement.alias ?? statement.table;
  const resolve = (reference: GPUSQLColumnReference): string =>
    resolveGPUSQLColumn(reference, qualifier, frame.columnNames);
  if (statement.predicate) {
    query = query.filter(
      new GPUExpression<boolean, string>(
        lowerSQLExpression(statement.predicate, parameters, resolve)
      )
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
    const reservedNames = new Set(frame.columnNames);
    const outputNames = new Map<GPUSQLSelectItem, string>();
    let inputIndex = 0;
    for (const item of aggregates) {
      const input =
        item.aggregateInput && lowerSQLExpression(item.aggregateInput, parameters, resolve);
      let inputColumn = input?.kind === 'column' ? input.name : undefined;
      if (input && input.kind !== 'column') {
        if (!item.alias) {
          throw new Error('GPUSQL computed aggregate inputs require an explicit AS alias');
        }
        do {
          inputColumn = '__sqlAggregateInput' + inputIndex++;
        } while (reservedNames.has(inputColumn));
        reservedNames.add(inputColumn);
        query = query.withColumn(inputColumn, new GPUExpression<number | null, string>(input));
      }
      const name = item.alias ?? `${item.aggregate}_${inputColumn ?? 'all'}`;
      outputNames.set(item, name);
      if (definitions[name]) throw new Error(`GPUSQL aggregate alias "${name}" is duplicated`);
      definitions[name] =
        item.aggregate === 'count'
          ? inputColumn === undefined
            ? 'count'
            : {count: inputColumn}
          : ({[item.aggregate!]: inputColumn!} as
              | {sum: string}
              | {min: string}
              | {max: string}
              | {mean: string});
    }
    if (statement.groupBy !== undefined) {
      const keyItems = statement.items.filter(item => !item.aggregate);
      const occupied = new Set(Object.keys(definitions));
      const selectedKeys = new Map<string, {source: string; output: string}>();
      const keyByItem = new Map<GPUSQLSelectItem, {source: string; output: string}>();
      /** Reuses a source field or creates an internal column for a computed group key. */

      const materializeKey = (expression: GPUExpressionNode): string => {
        if (expression.kind === 'column') return expression.name;
        let source: string;
        do {
          source = '__sqlGroupKey' + inputIndex++;
        } while (reservedNames.has(source));
        reservedNames.add(source);
        query = query.withColumn(source, new GPUExpression<number | null, string>(expression));
        return source;
      };
      for (const item of keyItems) {
        if (!item.expression) {
          throw new Error('GPUSQL grouped SELECT requires explicit key expressions');
        }
        const expression = lowerSQLExpression(item.expression, parameters, resolve);
        const output = item.alias ?? (expression.kind === 'column' ? expression.name : undefined);
        if (!output) throw new Error('GPUSQL computed group keys require an explicit AS alias');
        if (occupied.has(output)) {
          throw new Error('GPUSQL output column "' + output + '" is duplicated');
        }
        const signature = JSON.stringify(expression);
        if (selectedKeys.has(signature)) {
          throw new Error('GPUSQL grouped queries must select each GROUP BY key exactly once');
        }
        const key = {source: materializeKey(expression), output};
        selectedKeys.set(signature, key);
        keyByItem.set(item, key);
        occupied.add(output);
        outputNames.set(item, output);
      }

      const hiddenKeys = new Map<string, {source: string}>();
      const keys = statement.groupBy.map<{source: string; output?: string}>(reference => {
        if (reference.type === 'Literal' && typeof reference.value === 'number') {
          const item = getGPUSQLProjectionItem(statement.items, reference.value, 'GROUP BY');
          const key = keyByItem.get(item);
          if (!key) throw new Error('GPUSQL GROUP BY position must reference a group key directly');
          return key;
        }
        if (
          reference.type === 'Identifier' &&
          !('gpuSQLParameter' in reference) &&
          !frame.columnNames.includes(reference.name)
        ) {
          const alias = keyItems.find(item => item.alias === reference.name);
          if (alias) return keyByItem.get(alias)!;
        }
        const expression = lowerSQLExpression(reference, parameters, resolve);
        const signature = JSON.stringify(expression);
        const existing = selectedKeys.get(signature) ?? hiddenKeys.get(signature);
        if (existing) return existing;
        const key = {source: materializeKey(expression)};
        hiddenKeys.set(signature, key);
        return key;
      });
      const uniqueKeys = new Set(keys);
      if (uniqueKeys.size !== keys.length) {
        throw new Error('GPUSQL GROUP BY keys must be distinct');
      }
      if ([...selectedKeys.values()].some(key => !uniqueKeys.has(key))) {
        throw new Error(
          'GPUSQL grouped queries must group by every non-aggregate SELECT expression'
        );
      }

      const {predicates, selectedColumns, derivedColumns} = query;
      const columns = statement.items.map(item => outputNames.get(item)!);
      const normalized = normalizeGPUDataFrameAggregations<GPUTypeMap, string, GPUTypeMap>(
        {...query, source: frame},
        keys[0].output,
        definitions
      );

      if (keys.length > 1 || keys[0].output === undefined || !frame.dictionaries[keys[0].source]) {
        for (const {source} of keys) {
          const format = frame.schema.fields.find(field => field.name === source)?.format;
          if (
            !derivedColumns.some(column => column.name === source) &&
            format !== 'uint32' &&
            format !== 'sint32' &&
            format !== 'float32'
          ) {
            throw new Error('GPUSQL GROUP BY requires 32-bit numeric or dictionary keys');
          }
        }
        return {
          compile: graph =>
            compileGPUDataFrameObservedAggregation(
              frame,
              predicates,
              selectedColumns,
              derivedColumns,
              keys,
              normalized,
              graph,
              columns
            )
        };
      }

      const [key] = keys;
      const {groupCount} = query.groupBy(key.source);
      return {
        compile: graph =>
          compileGPUDataFrameGroupedAggregation(
            frame,
            predicates,
            selectedColumns,
            derivedColumns,
            key.source,
            groupCount,
            normalized,
            graph,
            {key: key.output!, columns}
          )
      };
    }
    if (aggregates.length !== statement.items.length) {
      throw new Error('GPUSQL global aggregates cannot mix ordinary source columns');
    }
    return query.aggregate(definitions);
  }
  if (statement.groupBy !== undefined)
    throw new Error('GPUSQL GROUP BY requires at least one aggregation');

  const selected: string[] = [];
  for (const item of statement.items) {
    if (item.star) {
      if (statement.items.length !== 1)
        throw new Error('GPUSQL SELECT * cannot include other columns');
      selected.push(...frame.columnNames);
      continue;
    }
    const node = lowerSQLExpression(item.expression!, parameters, resolve);
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
    const rightQualifier = statement.join.alias ?? statement.join.table;
    const {left: firstOperand, right: secondOperand} = statement.join;
    const matchesLeft = (reference: GPUSQLColumnReference) =>
      matchesGPUSQLColumn(reference, qualifier, frame.columnNames);
    const matchesRight = (reference: GPUSQLColumnReference) =>
      matchesGPUSQLColumn(reference, rightQualifier, right.columnNames);
    const forward = matchesLeft(firstOperand) && matchesRight(secondOperand);
    const reversed = matchesLeft(secondOperand) && matchesRight(firstOperand);
    if (forward && reversed) {
      throw new Error('GPUSQL JOIN key references are ambiguous; qualify the columns');
    }
    const leftKey = resolve(reversed ? secondOperand : firstOperand);
    const rightKey = resolveGPUSQLColumn(
      reversed ? firstOperand : secondOperand,
      rightQualifier,
      right.columnNames
    );
    const keyIsSelected = selected.includes(leftKey);
    const workingColumns = keyIsSelected ? selected : [...selected, leftKey];
    const workingQuery = query.select(workingColumns);
    const joinType = statement.join.type;
    const method = {
      left: 'leftJoin',
      semi: 'semiJoin',
      anti: 'antiJoin',
      inner: 'innerJoin'
    } as const;
    const join = workingQuery[method[joinType]](right, {leftOn: leftKey, rightOn: rightKey});
    if (keyIsSelected) return join;

    const {predicates, derivedColumns} = workingQuery;
    return {
      compile: graph =>
        compileGPUDataFrameJoin(
          frame,
          predicates,
          workingColumns,
          derivedColumns,
          right,
          join.options,
          joinType,
          graph,
          selected
        )
    };
  }

  if (statement.orderBy) {
    const workingColumns = new Set(selected);
    const resolvedKeys = statement.orderBy.map(({expression, direction, nulls}) => {
      let orderColumn: string;
      if (expression.type === 'Literal' && typeof expression.value === 'number') {
        orderColumn = getGPUSQLProjectionItem(selected, expression.value, 'ORDER BY');
      } else if (
        expression.type === 'Identifier' &&
        !('gpuSQLParameter' in expression) &&
        selected.includes(expression.name)
      ) {
        orderColumn = expression.name;
      } else {
        const sortExpression = lowerSQLExpression(expression, parameters, resolve);
        if (sortExpression.kind === 'column') {
          orderColumn = sortExpression.name;
        } else {
          orderColumn = '__sqlOrderKey';
          while (frame.columnNames.includes(orderColumn) || workingColumns.has(orderColumn)) {
            orderColumn += '_';
          }
          query = query.withColumn(
            orderColumn,
            new GPUExpression<number | null, string>(sortExpression)
          );
        }
      }
      workingColumns.add(orderColumn);
      return {column: orderColumn, direction, nulls};
    });

    const columns = [...workingColumns];
    const workingQuery = query.select(columns);
    const plans = resolvedKeys.map(({column, direction, nulls}) => ({
      column,
      plan: workingQuery.sortByGlobal(column, {direction, nulls})
    }));
    const [{column, plan: sort}, ...secondary] = plans;
    const page =
      statement.limit === undefined && statement.offset === undefined
        ? sort
        : sort.page(statement.offset ?? 0, statement.limit);
    const projection = columns.length > selected.length ? selected : undefined;
    if (!projection && secondary.length === 0) return page;

    const {predicates, derivedColumns} = workingQuery;
    const additionalKeys: GPUGlobalSortKey[] = secondary.map(key => ({
      column: key.column,
      options: key.plan.options
    }));
    return {
      compile: graph =>
        compileGPUDataFrameGlobalSort(
          frame,
          predicates,
          columns,
          derivedColumns,
          column,
          page.options,
          graph,
          projection,
          additionalKeys
        )
    };
  }
  if (statement.limit !== undefined || statement.offset !== undefined)
    throw new Error('GPUSQL LIMIT or OFFSET currently requires ORDER BY');
  return query.select(selected);
}

/** Formats the source spelling for diagnostics. */
function formatGPUSQLColumn({name, qualifier}: GPUSQLColumnReference): string {
  return qualifier === undefined ? name : qualifier + '.' + name;
}

/** Checks whether a join operand can bind to one side of the join. */
function matchesGPUSQLColumn(
  reference: GPUSQLColumnReference,
  qualifier: string,
  columns: readonly string[]
): boolean {
  return (
    (reference.qualifier === undefined ||
      reference.qualifier.toLowerCase() === qualifier.toLowerCase()) &&
    columns.includes(reference.name)
  );
}

/** Binds a parsed reference to an exact dataframe field. */
function resolveGPUSQLColumn(
  reference: GPUSQLColumnReference,
  qualifier: string,
  columns: readonly string[]
): string {
  if (
    reference.qualifier !== undefined &&
    reference.qualifier.toLowerCase() !== qualifier.toLowerCase()
  ) {
    throw new Error(
      'GPUSQL column "' + formatGPUSQLColumn(reference) + '" has an unknown table qualifier'
    );
  }
  if (!columns.includes(reference.name)) {
    throw new Error('GPUSQL column "' + formatGPUSQLColumn(reference) + '" does not exist');
  }
  return reference.name;
}

/** Parses the SQL subset supported by the GPU relational planner. */
function parseGPUSQLStatement(source: string): GPUSQLStatement {
  const statement = parseSQLSelectStatement(source, {
    parseParameter: name => ({type: 'Identifier', name, gpuSQLParameter: true})
  });
  if (statement.offset !== undefined && statement.offset > 0xffffffff) {
    throw new Error('GPUSQL OFFSET must fit an unsigned 32-bit row count');
  }
  if (statement.joins.length > 1) throw new Error('GPUSQL currently supports one JOIN');
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
          if (wildcard && aggregate !== 'count') {
            throw new Error('GPUSQL only permits COUNT(*) as a wildcard aggregation');
          }
          return {
            aggregate,
            ...(wildcard ? {} : {aggregateInput: argument}),
            alias
          };
        }
      }
    }
    return {expression, alias};
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
  return {
    items,
    table: statement.from.name,
    alias: statement.from.alias,
    join: loweredJoin,
    predicate: statement.where as Expression | undefined,
    groupBy: statement.groupBy?.length
      ? statement.groupBy.map(expression => expression as Expression)
      : undefined,
    orderBy: statement.orderBy?.length
      ? statement.orderBy.map(sort => ({
          expression: sort.expression as Expression,
          direction: sort.direction === 'desc' ? 'descending' : 'ascending',
          nulls: sort.nulls
        }))
      : undefined,
    offset: statement.offset,
    limit: statement.limit
  };
}

/** Resolves a one-based projection position with a clause-specific diagnostic. */
function getGPUSQLProjectionItem<Item>(
  projection: readonly Item[],
  position: number,
  clause: 'ORDER BY' | 'GROUP BY'
): Item {
  if (!Number.isSafeInteger(position) || position < 1 || position > projection.length) {
    throw new Error('GPUSQL ' + clause + ' position must be a one-based SELECT column number');
  }
  return projection[position - 1];
}

/** Reads a source column name or a two-part qualified column reference. */
function readGPUSQLColumn(
  node: Extract<Expression, {type: 'BinaryExpression'}>['left']
): GPUSQLColumnReference {
  const expression = node as Expression;
  if (expression.type === 'Identifier' && !('gpuSQLParameter' in expression)) {
    return {name: expression.name};
  }
  if (expression.type === 'MemberExpression' && !expression.computed) {
    const object = expression.object as Expression;
    const property = expression.property as Expression;
    if (
      object.type === 'Identifier' &&
      property.type === 'Identifier' &&
      !('gpuSQLParameter' in object) &&
      !('gpuSQLParameter' in property)
    ) {
      return {qualifier: object.name, name: property.name};
    }
  }
  throw new Error('GPUSQL expected a table or column identifier');
}

function lowerSQLExpression(
  node: Extract<Expression, {type: 'BinaryExpression'}>['left'],
  parameters: GPUDataFrameQueryParameters,
  resolve: (reference: GPUSQLColumnReference) => string
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
        return column(resolve(readGPUSQLColumn(leaf))).node;
      }
      if (leaf.type === 'CallExpression' && leaf.callee.type === 'Identifier') {
        const name = leaf.callee['name'];
        const functionName =
          typeof name === 'string' && leaf['sqlFunction'] === true ? name.toLowerCase() : name;
        if (
          name !== 'isNull' &&
          name !== 'isNotNull' &&
          name !== 'in' &&
          name !== 'cast' &&
          functionName !== 'coalesce' &&
          functionName !== 'nullif' &&
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
