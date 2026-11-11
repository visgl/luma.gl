// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Independently implemented for WebGPU; inspired by NVIDIA RAPIDS cuDF.

import {validateExpressionAST, type Expression} from '@math.gl/core/expressions';
import {
  GPUExpression,
  type GPUExpressionNode,
  type GPUExpressionBinaryOperator,
  type GPUExpressionNumericValue
} from './gpu-expression';

/**
 * Converts the supported subset of math.gl's portable AST into a DataFrame expression.
 *
 * @example
 * ```ts
 * import {parseSQLExpression} from '@math.gl/core/sql';
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
  validateExpressionAST(expression);
  return new GPUExpression(convert(expression));
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
function convert(expression: Expression): GPUExpressionNode {
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
    case 'CallExpression': {
      const name = node.callee.name;
      if (name === 'array_float32' && [2, 3, 4].includes(node.arguments.length)) {
        return {
          kind: 'vector',
          format: `float32x${node.arguments.length}` as 'float32x2' | 'float32x3' | 'float32x4',
          components: node.arguments.map(convert)
        };
      }
      if (name === 'cast' && node.arguments.length === 2 && node.arguments[1].type === 'Literal') {
        const target = node.arguments[1].value;
        if (target === 'float32' || target === 'int32')
          return {
            kind: 'cast',
            format: target === 'int32' ? 'sint32' : 'float32',
            operand: convert(node.arguments[0])
          };
      }
      break;
    }
  }
  throw new Error('Unsupported portable GPU dataframe expression');
}
