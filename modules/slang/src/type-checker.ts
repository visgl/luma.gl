// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Expression, SlangType, SourceLocation, Statement} from './ast';

type Fail = (message: string, location: SourceLocation) => never;
export function getNumericShape(type: SlangType) {
  const shape = /^(float|int|uint|bool)([2-4])?(?:x([2-4]))?$/.exec(type.name);
  return shape && {scalar: shape[1], width: Number(shape[2] || 1), columns: Number(shape[3] || 1)};
}
export function getCommonNumericType(
  types: SlangType[],
  location: SourceLocation,
  fail: Fail
): SlangType {
  const shapes = types.map(getNumericShape);
  if (shapes.some(shape => !shape)) fail('Operands require numeric values', location);
  const aggregate = shapes.find(shape => shape!.width > 1);
  if (
    shapes.some(
      shape =>
        shape!.width > 1 &&
        (shape!.width !== aggregate!.width || shape!.columns !== aggregate!.columns)
    )
  )
    fail('Operands have incompatible shapes', location);
  const scalar = shapes.some(shape => shape!.scalar === 'float')
    ? 'float'
    : shapes.some(shape => shape!.scalar === 'uint')
      ? 'uint'
      : shapes.every(shape => shape!.scalar === 'bool')
        ? 'bool'
        : 'int';
  return {
    name:
      scalar +
      (aggregate ? aggregate.width + (aggregate.columns > 1 ? `x${aggregate.columns}` : '') : '')
  };
}
export function getBinaryType(
  expression: Expression & {kind: 'binary'},
  left: SlangType,
  right: SlangType,
  fail: Fail
): SlangType {
  const operator = expression.operator;
  const leftShape = getNumericShape(left);
  const rightShape = getNumericShape(right);
  if (['&&', '||'].includes(operator)) {
    if (left.name !== 'bool' || right.name !== 'bool')
      fail('Logical operators require boolean scalars', expression);
    return {name: 'bool'};
  }
  const comparison = ['==', '!=', '<', '>', '<=', '>='].includes(operator);
  const type = getCommonNumericType([left, right], expression, fail);
  const shape = getNumericShape(type)!;
  if (shape.columns > 1 && (comparison || !['+', '-', '*', '/'].includes(operator)))
    fail('This operator does not support matrices', expression);
  if (
    (leftShape!.scalar === 'bool' || rightShape!.scalar === 'bool') &&
    (!['==', '!='].includes(operator) || leftShape!.scalar !== rightShape!.scalar)
  )
    fail('Boolean values support equality and logical operators', expression);
  if (
    ['&', '|', '^', '<<', '>>'].includes(operator) &&
    (leftShape!.scalar === 'float' || rightShape!.scalar === 'float')
  )
    fail('Bitwise operators require integer values', expression);
  if (['<<', '>>'].includes(operator)) {
    if (leftShape!.width === 1 && rightShape!.width > 1)
      fail('Shift count cannot be a vector for a scalar operand', expression);
    return left;
  }
  return comparison ? {name: 'bool' + (shape.width > 1 ? shape.width : '')} : type;
}

export function getLiteralType(
  expression: SourceLocation & {value: string},
  fail: Fail
): SlangType {
  const hexadecimal = /^0x/i.test(expression.value);
  if (!hexadecimal && /[.eEfF]/.test(expression.value)) return {name: 'float'};
  const value = Number(expression.value.replace(/u$/i, ''));
  const unsigned = /u$/i.test(expression.value) || (hexadecimal && value > 2147483647);
  if (value > (unsigned ? 4294967295 : 2147483647))
    fail('Integer literals outside the 32-bit subset are unsupported', expression);
  return {name: unsigned ? 'uint' : 'int'};
}

/** Evaluate the bounded integer expressions allowed as switch labels. */
export function getIntegerConstant(
  expression: Expression,
  lookup: (name: string) => number | undefined,
  getType: (expression: Expression) => SlangType
): number | undefined {
  const value = evaluateIntegerConstant(expression, lookup, getType);
  return value === undefined
    ? undefined
    : getType(expression).name === 'uint'
      ? value >>> 0
      : value | 0;
}
function evaluateIntegerConstant(
  expression: Expression,
  lookup: (name: string) => number | undefined,
  getType: (expression: Expression) => SlangType
): number | undefined {
  if (
    expression.kind === 'number' &&
    !/[.eEfF]/.test(expression.value.replace(/^0x[0-9a-f]+/i, ''))
  )
    return Number(expression.value.replace(/u$/i, ''));
  if (expression.kind === 'identifier') return lookup(expression.value);
  if (
    expression.kind === 'cast' ||
    (expression.kind === 'call' &&
      expression.callee.kind === 'identifier' &&
      ['int', 'uint'].includes(expression.callee.value) &&
      expression.arguments.length === 1)
  ) {
    const type =
      expression.kind === 'cast'
        ? expression.type.name
        : (expression.callee as Expression & {kind: 'identifier'}).value;
    const value = getIntegerConstant(
      expression.kind === 'cast' ? expression.operand : expression.arguments[0],
      lookup,
      getType
    );
    return value === undefined || !['int', 'uint'].includes(type)
      ? undefined
      : type === 'uint'
        ? value >>> 0
        : value | 0;
  }
  if (expression.kind === 'unary') {
    if (
      expression.operator === '-' &&
      expression.operand.kind === 'number' &&
      expression.operand.value === '2147483648'
    )
      return -2147483648;
    const value = getIntegerConstant(expression.operand, lookup, getType);
    if (value === undefined) return undefined;
    return expression.operator === '-'
      ? -value
      : expression.operator === '+'
        ? value
        : expression.operator === '~'
          ? ~value
          : undefined;
  }
  if (expression.kind !== 'binary') return undefined;
  let left = getIntegerConstant(expression.left, lookup, getType);
  let right = getIntegerConstant(expression.right, lookup, getType);
  if (left === undefined || right === undefined) return undefined;
  if (getType(expression).name === 'uint' && !['<<', '>>'].includes(expression.operator)) {
    left >>>= 0;
    right >>>= 0;
  }
  switch (expression.operator) {
    case '+':
      return left + right;
    case '-':
      return left - right;
    case '*':
      return Math.imul(left, right);
    case '/':
      return right ? Math.trunc(left / right) : undefined;
    case '%':
      return right ? left % right : undefined;
    case '&':
      return left & right;
    case '|':
      return left | right;
    case '^':
      return left ^ right;
    case '<<':
      return left << right;
    case '>>':
      return getType(expression.left).name === 'uint' ? left >>> right : left >> right;
    default:
      return undefined;
  }
}

const FALLTHROUGH = 1;
const RETURN = 2;
const BREAK = 4;
const CONTINUE = 8;
function getSequenceFlow(statements: Statement[]): number {
  let flow = FALLTHROUGH;
  for (const statement of statements) {
    if (!(flow & FALLTHROUGH)) break;
    flow = (flow & ~FALLTHROUGH) | getStatementFlow(statement);
  }
  return flow;
}
function getStatementFlow(statement: Statement): number {
  switch (statement.kind) {
    case 'return':
    case 'discard':
      return RETURN;
    case 'break':
      return BREAK;
    case 'continue':
      return CONTINUE;
    case 'block':
      return getSequenceFlow(statement.statements);
    case 'if':
      return (
        getStatementFlow(statement.consequent) |
        (statement.alternate ? getStatementFlow(statement.alternate) : FALLTHROUGH)
      );
    case 'switch': {
      let next = FALLTHROUGH;
      let flow = statement.clauses.some(clause => clause.labels.includes(null)) ? 0 : FALLTHROUGH;
      for (const clause of [...statement.clauses].reverse()) {
        const current = getSequenceFlow(clause.statements);
        next = (current & ~FALLTHROUGH) | (current & FALLTHROUGH ? next : 0);
        flow |= next;
      }
      return (flow & ~BREAK) | (flow & BREAK ? FALLTHROUGH : 0);
    }
    case 'do': {
      const flow = getStatementFlow(statement.body);
      return (flow & RETURN) | (flow & ~RETURN ? FALLTHROUGH : 0);
    }
    default:
      return FALLTHROUGH;
  }
}
export function returnsValue(statement: Statement): boolean {
  return getStatementFlow(statement) === RETURN;
}
