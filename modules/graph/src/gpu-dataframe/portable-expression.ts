// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Independently implemented for WebGPU; inspired by NVIDIA RAPIDS cuDF.

import {validateExpressionAST, type Expression} from '@math.gl/sql/expressions';
import {
  GPUExpression,
  isBooleanExpressionNode,
  isGPUScalarFunction,
  makeGPUCastNode,
  type GPUExpressionNode,
  type GPUExpressionBinaryOperator,
  type GPUExpressionNumericValue
} from './gpu-expression';

/**
 * Converts the supported subset of math.gl's portable AST into a DataFrame expression.
 *
 * @example
 * ```ts
 * import {parseSQLExpression} from '@math.gl/sql/parser';
 *
 * const position = makeGPUExpressionFromPortableAST(
 *   parseSQLExpression('ARRAY[x,y,z]::REAL[3]')
 * );
 * const query = frame.withColumn('position', position, {format: 'float32x3'});
 * ```
 */
export function makeGPUExpressionFromPortableAST(
  expression: Expression
): GPUExpression<GPUExpressionNumericValue | boolean> {
  return new GPUExpression(convertPortableExpression(expression));
}

/** Converts a portable AST and requires a boolean result for use as a DataFrame predicate. */
export function makeGPUPredicateFromPortableAST(expression: Expression): GPUExpression<boolean> {
  const node = convertPortableExpression(expression);
  if (!isBooleanExpressionNode(node)) {
    throw new Error('Expected a boolean portable GPU dataframe expression');
  }
  return new GPUExpression(node);
}

function convertPortableExpression(expression: Expression): GPUExpressionNode {
  validateExpressionAST(expression);
  return lowerPortableExpression(expression);
}

const binaryOperators: Readonly<Record<string, GPUExpressionBinaryOperator>> = {
  '+': 'add',
  '-': 'subtract',
  '*': 'multiply',
  '/': 'divide',
  '==': 'equal',
  '===': 'equal',
  '!=': 'not-equal',
  '!==': 'not-equal',
  '>': 'greater-than',
  '>=': 'greater-than-or-equal',
  '<': 'less-than',
  '<=': 'less-than-or-equal',
  '&&': 'and',
  '||': 'or'
};

/** Lowers one validated portable node and rejects unsupported operations. */
export function lowerPortableExpression(
  expression: Expression,
  resolveLeaf?: (expression: Expression) => GPUExpressionNode | undefined
): GPUExpressionNode {
  const resolved = resolveLeaf?.(expression);
  if (resolved) return resolved;
  const convert = (child: Expression) => lowerPortableExpression(child, resolveLeaf);
  // math.gl's public parser type includes nonportable nodes; validation above narrows at runtime.
  const node = expression as any;
  switch (node.type) {
    case 'Identifier':
      return {kind: 'column', name: node.name};
    case 'Literal':
      if (
        node.value === null ||
        typeof node.value === 'boolean' ||
        (typeof node.value === 'number' && Number.isFinite(node.value))
      )
        return {kind: 'literal', value: node.value};
      break;
    case 'UnaryExpression':
      if (node.operator === '-' || node.operator === '!')
        return {
          kind: 'unary',
          operator: node.operator === '-' ? 'negate' : 'not',
          operand: convert(node.argument)
        };
      break;
    case 'BinaryExpression':
    case 'LogicalExpression': {
      const operator = binaryOperators[node.operator];
      if (operator)
        return {kind: 'binary', operator, left: convert(node.left), right: convert(node.right)};
      break;
    }
    case 'ConditionalExpression':
      return {
        kind: 'conditional',
        condition: convert(node.test),
        whenTrue: convert(node.consequent),
        otherwise: convert(node.alternate)
      };
    case 'CallExpression': {
      const name = node.callee.name;
      const functionName = node.sqlFunction === true ? name.toLowerCase() : name;
      if (functionName === 'coalesce' || functionName === 'nullif') {
        const count = node.arguments.length;
        if (functionName === 'nullif' ? count !== 2 : count < 2 || count > 64) {
          throw new Error(
            'GPU DataFrame NULLIF requires two arguments and COALESCE requires 2–64 arguments'
          );
        }
        const arguments_: GPUExpressionNode[] = node.arguments.map(convert);
        return arguments_.reduceRight((right, left) => ({
          kind: 'binary',
          operator: functionName,
          left,
          right
        }));
      }
      if (isGPUScalarFunction(functionName)) {
        if (node.arguments.length !== 1) {
          throw new Error(`GPU DataFrame ${name} requires one argument`);
        }
        return {kind: 'unary', operator: functionName, operand: convert(node.arguments[0])};
      }
      if ((name === 'isNull' || name === 'isNotNull') && node.arguments.length === 1) {
        return {
          kind: 'unary',
          operator: name === 'isNull' ? 'is-null' : 'is-valid',
          operand: convert(node.arguments[0])
        };
      }
      if (name === 'in') {
        const [subject, ...arguments_] = node.arguments as Expression[];
        if (arguments_.length === 0 || arguments_.length > 64) {
          throw new Error('GPU dataframe IN requires between 1 and 64 candidates');
        }
        const value = convert(subject);
        const candidates = arguments_.map(convert);
        if (
          value.kind !== 'column' ||
          candidates.some(
            candidate => candidate.kind !== 'literal' && candidate.kind !== 'parameter'
          )
        ) {
          throw new Error('GPU dataframe IN requires a column and literal or parameter candidates');
        }
        return makeMembershipPredicate(value, candidates);
      }
      if (name === 'array_float32' && [2, 3, 4].includes(node.arguments.length)) {
        return {
          kind: 'vector',
          format: `float32x${node.arguments.length}` as 'float32x2' | 'float32x3' | 'float32x4',
          components: node.arguments.map(convert)
        };
      }
      if (name === 'cast' && node.arguments.length === 2 && node.arguments[1].type === 'Literal') {
        const target = node.arguments[1].value;
        if (target === 'float32' || target === 'int32' || target === 'uint32')
          return makeGPUCastNode(
            convert(node.arguments[0]),
            target === 'int32' ? 'sint32' : target
          );
      }
      break;
    }
  }
  throw new Error('Unsupported portable GPU dataframe expression');
}

/** Balanced OR preserves three-valued comparisons and bounds tree depth. */
function makeMembershipPredicate(
  value: GPUExpressionNode,
  candidates: readonly GPUExpressionNode[]
): GPUExpressionNode {
  if (candidates.length === 1) {
    return {kind: 'binary', operator: 'equal', left: value, right: candidates[0]};
  }
  const middle = Math.floor(candidates.length / 2);
  return {
    kind: 'binary',
    operator: 'or',
    left: makeMembershipPredicate(value, candidates.slice(0, middle)),
    right: makeMembershipPredicate(value, candidates.slice(middle))
  };
}
