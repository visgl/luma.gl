// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Portable scalar values accepted by GPU-resident dataframe expressions. */
export type LuExpressionValue = number | boolean | null;

/** Closed unary operations that can be lowered safely into generated WGSL. */
export type LuExpressionUnaryOperator = 'not' | 'is-valid' | 'is-null' | 'negate';

/** Closed binary operations that can be lowered safely into generated WGSL. */
export type LuExpressionBinaryOperator =
  | 'add'
  | 'subtract'
  | 'multiply'
  | 'divide'
  | 'equal'
  | 'not-equal'
  | 'greater-than'
  | 'greater-than-or-equal'
  | 'less-than'
  | 'less-than-or-equal'
  | 'and'
  | 'or';

/** Immutable, renderer-independent dataframe expression syntax. */
export type LuExpressionNode =
  | Readonly<{kind: 'column'; name: string}>
  | Readonly<{kind: 'literal'; value: LuExpressionValue}>
  | Readonly<{kind: 'parameter'; name: string; value: LuExpressionValue}>
  | Readonly<{
      kind: 'unary';
      operator: LuExpressionUnaryOperator;
      operand: LuExpressionNode;
    }>
  | Readonly<{
      kind: 'binary';
      operator: LuExpressionBinaryOperator;
      left: LuExpressionNode;
      right: LuExpressionNode;
    }>;

/**
 * Immutable typed analytical expression that never allocates or submits GPU work.
 *
 * The second generic retains every referenced source-column name so dataframe predicates can be
 * checked against a known schema without interpolating application-provided names into WGSL.
 */
export class LuExpression<Value = unknown, Columns extends string = string> {
  /** Closed, immutable expression tree consumed by the GPU command-graph compiler. */
  readonly node: LuExpressionNode;

  /** Phantom metadata preserves exact expression values and referenced columns for TypeScript. */
  declare readonly expressionValue: Value;
  declare readonly expressionColumns: Columns;

  constructor(node: LuExpressionNode) {
    this.node = Object.freeze({...node}) as LuExpressionNode;
    Object.freeze(this);
  }

  /** Adds two numeric expressions while propagating null values. */
  add<OtherColumns extends string>(
    this: LuExpression<number | null, Columns>,
    expression: LuExpression<number | null, OtherColumns>
  ): LuExpression<number | null, Columns | OtherColumns> {
    return makeBinaryExpression('add', this, expression);
  }

  /** Subtracts two numeric expressions while propagating null values. */
  subtract<OtherColumns extends string>(
    this: LuExpression<number | null, Columns>,
    expression: LuExpression<number | null, OtherColumns>
  ): LuExpression<number | null, Columns | OtherColumns> {
    return makeBinaryExpression('subtract', this, expression);
  }

  /** Multiplies two numeric expressions while propagating null values. */
  multiply<OtherColumns extends string>(
    this: LuExpression<number | null, Columns>,
    expression: LuExpression<number | null, OtherColumns>
  ): LuExpression<number | null, Columns | OtherColumns> {
    return makeBinaryExpression('multiply', this, expression);
  }

  /** Divides two numeric expressions while propagating null values. */
  divide<OtherColumns extends string>(
    this: LuExpression<number | null, Columns>,
    expression: LuExpression<number | null, OtherColumns>
  ): LuExpression<number | null, Columns | OtherColumns> {
    return makeBinaryExpression('divide', this, expression);
  }

  /** Negates one numeric expression while propagating null values. */
  negate(this: LuExpression<number | null, Columns>): LuExpression<number | null, Columns> {
    return makeUnaryExpression('negate', this);
  }

  /** Compares two expressions for equality using explicit nullable semantics. */
  equal<OtherValue, OtherColumns extends string>(
    expression: LuExpression<OtherValue, OtherColumns>
  ): LuExpression<boolean, Columns | OtherColumns> {
    return makeBinaryExpression('equal', this, expression);
  }

  /** Compares two expressions for inequality using explicit nullable semantics. */
  notEqual<OtherValue, OtherColumns extends string>(
    expression: LuExpression<OtherValue, OtherColumns>
  ): LuExpression<boolean, Columns | OtherColumns> {
    return makeBinaryExpression('not-equal', this, expression);
  }

  /** Tests whether the left numeric expression exceeds the right expression. */
  greaterThan<OtherColumns extends string>(
    this: LuExpression<number | null, Columns>,
    expression: LuExpression<number | null, OtherColumns>
  ): LuExpression<boolean, Columns | OtherColumns> {
    return makeBinaryExpression('greater-than', this, expression);
  }

  /** Tests whether the left numeric expression is at least the right expression. */
  greaterThanOrEqual<OtherColumns extends string>(
    this: LuExpression<number | null, Columns>,
    expression: LuExpression<number | null, OtherColumns>
  ): LuExpression<boolean, Columns | OtherColumns> {
    return makeBinaryExpression('greater-than-or-equal', this, expression);
  }

  /** Tests whether the left numeric expression is less than the right expression. */
  lessThan<OtherColumns extends string>(
    this: LuExpression<number | null, Columns>,
    expression: LuExpression<number | null, OtherColumns>
  ): LuExpression<boolean, Columns | OtherColumns> {
    return makeBinaryExpression('less-than', this, expression);
  }

  /** Tests whether the left numeric expression is at most the right expression. */
  lessThanOrEqual<OtherColumns extends string>(
    this: LuExpression<number | null, Columns>,
    expression: LuExpression<number | null, OtherColumns>
  ): LuExpression<boolean, Columns | OtherColumns> {
    return makeBinaryExpression('less-than-or-equal', this, expression);
  }

  /** Combines boolean expressions using SQL-compatible three-valued conjunction. */
  and<OtherColumns extends string>(
    this: LuExpression<boolean, Columns>,
    expression: LuExpression<boolean, OtherColumns>
  ): LuExpression<boolean, Columns | OtherColumns> {
    return makeBinaryExpression('and', this, expression);
  }

  /** Combines boolean expressions using SQL-compatible three-valued disjunction. */
  or<OtherColumns extends string>(
    this: LuExpression<boolean, Columns>,
    expression: LuExpression<boolean, OtherColumns>
  ): LuExpression<boolean, Columns | OtherColumns> {
    return makeBinaryExpression('or', this, expression);
  }

  /** Negates a boolean expression without converting null to a valid value. */
  not(this: LuExpression<boolean, Columns>): LuExpression<boolean, Columns> {
    return makeUnaryExpression('not', this);
  }

  /** Returns a non-null boolean indicating whether this expression has a valid value. */
  isValid(): LuExpression<boolean, Columns> {
    return makeUnaryExpression('is-valid', this);
  }

  /** Returns a non-null boolean indicating whether this expression is null. */
  isNull(): LuExpression<boolean, Columns> {
    return makeUnaryExpression('is-null', this);
  }
}

/** References a named source column without accessing GPU storage. */
export function column<Name extends string>(name: Name): LuExpression<number | null, Name> {
  if (typeof name !== 'string' || name.length === 0) {
    throw new Error('LuDataFrame expression columns require a nonempty name');
  }
  return new LuExpression({kind: 'column', name});
}

/** Creates one immutable portable scalar literal without embedding it in generated WGSL. */
export function literal<Value extends LuExpressionValue>(value: Value): LuExpression<Value, never> {
  assertValidExpressionValue(value, 'literal');
  return new LuExpression({kind: 'literal', value});
}

/** Creates one reusable, caller-controlled scalar parameter with an explicit default value. */
export function parameter<Value extends LuExpressionValue>(
  name: string,
  value: Value
): LuExpression<Value, never> {
  if (typeof name !== 'string' || name.length === 0) {
    throw new Error('LuDataFrame expression parameters require a nonempty name');
  }
  assertValidExpressionValue(value, 'parameter');
  return new LuExpression({kind: 'parameter', name, value});
}

/** Combines boolean expressions using SQL-compatible three-valued conjunction. */
export function and<LeftColumns extends string, RightColumns extends string>(
  left: LuExpression<boolean, LeftColumns>,
  right: LuExpression<boolean, RightColumns>
): LuExpression<boolean, LeftColumns | RightColumns> {
  return makeBinaryExpression('and', left, right);
}

/** Combines boolean expressions using SQL-compatible three-valued disjunction. */
export function or<LeftColumns extends string, RightColumns extends string>(
  left: LuExpression<boolean, LeftColumns>,
  right: LuExpression<boolean, RightColumns>
): LuExpression<boolean, LeftColumns | RightColumns> {
  return makeBinaryExpression('or', left, right);
}

/** Negates one boolean expression without converting null to a valid value. */
export function not<Columns extends string>(
  expression: LuExpression<boolean, Columns>
): LuExpression<boolean, Columns> {
  return makeUnaryExpression('not', expression);
}

/** Collects exact source-column references for CPU-only query validation. @internal */
export function getLuExpressionColumnNames(expression: LuExpression<any, string>): string[] {
  const columnNames = new Set<string>();
  collectLuExpressionColumnNames(expression.node, columnNames);
  return Array.from(columnNames);
}

function collectLuExpressionColumnNames(node: LuExpressionNode, columnNames: Set<string>): void {
  switch (node.kind) {
    case 'column':
      columnNames.add(node.name);
      break;
    case 'literal':
    case 'parameter':
      break;
    case 'unary':
      collectLuExpressionColumnNames(node.operand, columnNames);
      break;
    case 'binary':
      collectLuExpressionColumnNames(node.left, columnNames);
      collectLuExpressionColumnNames(node.right, columnNames);
      break;
    default:
      throw new Error('LuDataFrame expression contains an unsupported operation');
  }
}

function makeUnaryExpression<Value, Columns extends string>(
  operator: LuExpressionUnaryOperator,
  expression: LuExpression<any, Columns>
): LuExpression<Value, Columns> {
  return new LuExpression({kind: 'unary', operator, operand: expression.node});
}

function makeBinaryExpression<Value, LeftColumns extends string, RightColumns extends string>(
  operator: LuExpressionBinaryOperator,
  left: LuExpression<any, LeftColumns>,
  right: LuExpression<any, RightColumns>
): LuExpression<Value, LeftColumns | RightColumns> {
  return new LuExpression({kind: 'binary', operator, left: left.node, right: right.node});
}

function assertValidExpressionValue(value: LuExpressionValue, kind: 'literal' | 'parameter'): void {
  if (
    value !== null &&
    typeof value !== 'boolean' &&
    (typeof value !== 'number' || !Number.isFinite(value))
  ) {
    throw new Error(`LuDataFrame ${kind} values must be finite numbers, booleans, or null`);
  }
}
