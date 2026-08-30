// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Independently implemented for WebGPU; inspired by NVIDIA RAPIDS cuDF.

/** Portable scalar values accepted by GPU-resident dataframe expressions. */
export type GPUExpressionValue = number | boolean | null;

/** Closed unary operations that can be lowered safely into generated WGSL. */
export type GPUExpressionUnaryOperator = 'not' | 'is-valid' | 'is-null' | 'negate';

/** Closed binary operations that can be lowered safely into generated WGSL. */
export type GPUExpressionBinaryOperator =
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
export type GPUExpressionNode =
  | Readonly<{kind: 'column'; name: string}>
  | Readonly<{kind: 'literal'; value: GPUExpressionValue}>
  | Readonly<{kind: 'parameter'; name: string; value: GPUExpressionValue}>
  | Readonly<{
      kind: 'unary';
      operator: GPUExpressionUnaryOperator;
      operand: GPUExpressionNode;
    }>
  | Readonly<{
      kind: 'binary';
      operator: GPUExpressionBinaryOperator;
      left: GPUExpressionNode;
      right: GPUExpressionNode;
    }>;

/**
 * Immutable typed analytical expression that never allocates or submits GPU work.
 *
 * The second generic retains every referenced source-column name so dataframe predicates can be
 * checked against a known schema without interpolating application-provided names into WGSL.
 */
export class GPUExpression<Value = unknown, Columns extends string = string> {
  /** Closed, immutable expression tree consumed by the GPU command-graph compiler. */
  readonly node: GPUExpressionNode;

  /** Phantom metadata preserves exact expression values and referenced columns for TypeScript. */
  declare readonly expressionValue: Value;
  declare readonly expressionColumns: Columns;

  constructor(node: GPUExpressionNode) {
    this.node = cloneFrozenGPUExpressionNode(node);
    Object.freeze(this);
  }

  /** Adds two numeric expressions while propagating null values. */
  add<OtherColumns extends string>(
    this: GPUExpression<number | null, Columns>,
    expression: GPUExpression<number | null, OtherColumns>
  ): GPUExpression<number | null, Columns | OtherColumns> {
    return makeBinaryExpression('add', this, expression);
  }

  /** Subtracts two numeric expressions while propagating null values. */
  subtract<OtherColumns extends string>(
    this: GPUExpression<number | null, Columns>,
    expression: GPUExpression<number | null, OtherColumns>
  ): GPUExpression<number | null, Columns | OtherColumns> {
    return makeBinaryExpression('subtract', this, expression);
  }

  /** Multiplies two numeric expressions while propagating null values. */
  multiply<OtherColumns extends string>(
    this: GPUExpression<number | null, Columns>,
    expression: GPUExpression<number | null, OtherColumns>
  ): GPUExpression<number | null, Columns | OtherColumns> {
    return makeBinaryExpression('multiply', this, expression);
  }

  /** Divides two numeric expressions while propagating null values. */
  divide<OtherColumns extends string>(
    this: GPUExpression<number | null, Columns>,
    expression: GPUExpression<number | null, OtherColumns>
  ): GPUExpression<number | null, Columns | OtherColumns> {
    return makeBinaryExpression('divide', this, expression);
  }

  /** Negates one numeric expression while propagating null values. */
  negate(this: GPUExpression<number | null, Columns>): GPUExpression<number | null, Columns> {
    return makeUnaryExpression('negate', this);
  }

  /** Compares two expressions for equality using explicit nullable semantics. */
  equal<OtherValue, OtherColumns extends string>(
    expression: GPUExpression<OtherValue, OtherColumns>
  ): GPUExpression<boolean, Columns | OtherColumns> {
    return makeBinaryExpression('equal', this, expression);
  }

  /** Compares two expressions for inequality using explicit nullable semantics. */
  notEqual<OtherValue, OtherColumns extends string>(
    expression: GPUExpression<OtherValue, OtherColumns>
  ): GPUExpression<boolean, Columns | OtherColumns> {
    return makeBinaryExpression('not-equal', this, expression);
  }

  /** Tests whether the left numeric expression exceeds the right expression. */
  greaterThan<OtherColumns extends string>(
    this: GPUExpression<number | null, Columns>,
    expression: GPUExpression<number | null, OtherColumns>
  ): GPUExpression<boolean, Columns | OtherColumns> {
    return makeBinaryExpression('greater-than', this, expression);
  }

  /** Tests whether the left numeric expression is at least the right expression. */
  greaterThanOrEqual<OtherColumns extends string>(
    this: GPUExpression<number | null, Columns>,
    expression: GPUExpression<number | null, OtherColumns>
  ): GPUExpression<boolean, Columns | OtherColumns> {
    return makeBinaryExpression('greater-than-or-equal', this, expression);
  }

  /** Tests whether the left numeric expression is less than the right expression. */
  lessThan<OtherColumns extends string>(
    this: GPUExpression<number | null, Columns>,
    expression: GPUExpression<number | null, OtherColumns>
  ): GPUExpression<boolean, Columns | OtherColumns> {
    return makeBinaryExpression('less-than', this, expression);
  }

  /** Tests whether the left numeric expression is at most the right expression. */
  lessThanOrEqual<OtherColumns extends string>(
    this: GPUExpression<number | null, Columns>,
    expression: GPUExpression<number | null, OtherColumns>
  ): GPUExpression<boolean, Columns | OtherColumns> {
    return makeBinaryExpression('less-than-or-equal', this, expression);
  }

  /** Combines boolean expressions using SQL-compatible three-valued conjunction. */
  and<OtherColumns extends string>(
    this: GPUExpression<boolean, Columns>,
    expression: GPUExpression<boolean, OtherColumns>
  ): GPUExpression<boolean, Columns | OtherColumns> {
    return makeBinaryExpression('and', this, expression);
  }

  /** Combines boolean expressions using SQL-compatible three-valued disjunction. */
  or<OtherColumns extends string>(
    this: GPUExpression<boolean, Columns>,
    expression: GPUExpression<boolean, OtherColumns>
  ): GPUExpression<boolean, Columns | OtherColumns> {
    return makeBinaryExpression('or', this, expression);
  }

  /** Negates a boolean expression without converting null to a valid value. */
  not(this: GPUExpression<boolean, Columns>): GPUExpression<boolean, Columns> {
    return makeUnaryExpression('not', this);
  }

  /** Returns a non-null boolean indicating whether this expression has a valid value. */
  isValid(): GPUExpression<boolean, Columns> {
    return makeUnaryExpression('is-valid', this);
  }

  /** Returns a non-null boolean indicating whether this expression is null. */
  isNull(): GPUExpression<boolean, Columns> {
    return makeUnaryExpression('is-null', this);
  }
}

/** References a named source column without accessing GPU storage. */
export function column<Name extends string>(name: Name): GPUExpression<number | null, Name> {
  if (typeof name !== 'string' || name.length === 0) {
    throw new Error('GPUDataFrame expression columns require a nonempty name');
  }
  return new GPUExpression({kind: 'column', name});
}

/** Creates one immutable portable scalar literal without embedding it in generated WGSL. */
export function literal<Value extends GPUExpressionValue>(
  value: Value
): GPUExpression<Value, never> {
  assertValidExpressionValue(value, 'literal');
  return new GPUExpression({kind: 'literal', value});
}

/** Creates one reusable, caller-controlled scalar parameter with an explicit default value. */
export function parameter<Value extends GPUExpressionValue>(
  name: string,
  value: Value
): GPUExpression<Value, never> {
  if (typeof name !== 'string' || name.length === 0) {
    throw new Error('GPUDataFrame expression parameters require a nonempty name');
  }
  assertValidExpressionValue(value, 'parameter');
  return new GPUExpression({kind: 'parameter', name, value});
}

/** Combines boolean expressions using SQL-compatible three-valued conjunction. */
export function and<LeftColumns extends string, RightColumns extends string>(
  left: GPUExpression<boolean, LeftColumns>,
  right: GPUExpression<boolean, RightColumns>
): GPUExpression<boolean, LeftColumns | RightColumns> {
  return makeBinaryExpression('and', left, right);
}

/** Combines boolean expressions using SQL-compatible three-valued disjunction. */
export function or<LeftColumns extends string, RightColumns extends string>(
  left: GPUExpression<boolean, LeftColumns>,
  right: GPUExpression<boolean, RightColumns>
): GPUExpression<boolean, LeftColumns | RightColumns> {
  return makeBinaryExpression('or', left, right);
}

/** Negates one boolean expression without converting null to a valid value. */
export function not<Columns extends string>(
  expression: GPUExpression<boolean, Columns>
): GPUExpression<boolean, Columns> {
  return makeUnaryExpression('not', expression);
}

/** Collects exact source-column references for CPU-only query validation. @internal */
export function getGPUExpressionColumnNames(expression: GPUExpression<any, string>): string[] {
  const columnNames = new Set<string>();
  collectGPUExpressionColumnNames(expression.node, columnNames);
  return Array.from(columnNames);
}

/** Clones every closed node so caller-owned child objects cannot alter an immutable query plan. */
function cloneFrozenGPUExpressionNode(node: GPUExpressionNode): GPUExpressionNode {
  switch (node.kind) {
    case 'column':
      return Object.freeze({kind: 'column', name: node.name});
    case 'literal':
      return Object.freeze({kind: 'literal', value: node.value});
    case 'parameter':
      return Object.freeze({kind: 'parameter', name: node.name, value: node.value});
    case 'unary':
      return Object.freeze({
        kind: 'unary',
        operator: node.operator,
        operand: cloneFrozenGPUExpressionNode(node.operand)
      });
    case 'binary':
      return Object.freeze({
        kind: 'binary',
        operator: node.operator,
        left: cloneFrozenGPUExpressionNode(node.left),
        right: cloneFrozenGPUExpressionNode(node.right)
      });
    default:
      throw new Error('GPUDataFrame expression contains an unsupported operation');
  }
}

function collectGPUExpressionColumnNames(node: GPUExpressionNode, columnNames: Set<string>): void {
  switch (node.kind) {
    case 'column':
      columnNames.add(node.name);
      break;
    case 'literal':
    case 'parameter':
      break;
    case 'unary':
      collectGPUExpressionColumnNames(node.operand, columnNames);
      break;
    case 'binary':
      collectGPUExpressionColumnNames(node.left, columnNames);
      collectGPUExpressionColumnNames(node.right, columnNames);
      break;
    default:
      throw new Error('GPUDataFrame expression contains an unsupported operation');
  }
}

function makeUnaryExpression<Value, Columns extends string>(
  operator: GPUExpressionUnaryOperator,
  expression: GPUExpression<any, Columns>
): GPUExpression<Value, Columns> {
  return new GPUExpression({kind: 'unary', operator, operand: expression.node});
}

function makeBinaryExpression<Value, LeftColumns extends string, RightColumns extends string>(
  operator: GPUExpressionBinaryOperator,
  left: GPUExpression<any, LeftColumns>,
  right: GPUExpression<any, RightColumns>
): GPUExpression<Value, LeftColumns | RightColumns> {
  return new GPUExpression({kind: 'binary', operator, left: left.node, right: right.node});
}

function assertValidExpressionValue(
  value: GPUExpressionValue,
  kind: 'literal' | 'parameter'
): void {
  if (
    value !== null &&
    typeof value !== 'boolean' &&
    (typeof value !== 'number' || !Number.isFinite(value))
  ) {
    throw new Error(`GPUDataFrame ${kind} values must be finite numbers, booleans, or null`);
  }
}
