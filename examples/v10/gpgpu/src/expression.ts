// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  abs,
  add,
  cos,
  divide,
  dot,
  equalAll,
  exp,
  extent,
  fround,
  gather,
  GPUDataEvaluator,
  interleave,
  length,
  log,
  multiply,
  pow,
  segmentedMap,
  select,
  sequence,
  sin,
  sqrt,
  subtract,
  tan,
  swizzle
} from '@luma.gl/gpgpu';
import {
  parseExpressionAt,
  type ArrayExpression,
  type BinaryExpression,
  type CallExpression,
  type Expression,
  type Identifier,
  type Literal,
  type MemberExpression,
  type UnaryExpression
} from 'acorn';

export type SegmentedExpressionInput = {
  kind: 'segmented';
  values: GPUDataEvaluator;
  startIndices: GPUDataEvaluator;
};

export type ExpressionInput = GPUDataEvaluator | SegmentedExpressionInput;
export type ExpressionInputs = Record<string, ExpressionInput>;

type ExpressionValue = GPUDataEvaluator | SegmentedExpressionInput | number | number[];
type OperationFunction = (...args: any[]) => GPUDataEvaluator;

const OPERATIONS: Record<string, OperationFunction> = {
  abs,
  add,
  cos,
  divide,
  dot,
  equalAll,
  exp,
  extent,
  fround,
  gather,
  interleave,
  length,
  log,
  multiply,
  pow,
  segmentedMap,
  select,
  sequence,
  sin,
  sqrt,
  subtract,
  tan,
  swizzle
};

const BINARY_OPERATIONS: Record<string, OperationFunction> = {
  '+': add,
  '-': subtract,
  '*': multiply,
  '/': divide,
  '**': pow
};

export function evaluateExpression(source: string, inputs: ExpressionInputs): GPUDataEvaluator {
  const expression = parseGPGPUExpression(source);
  const value = evaluateNode(expression, inputs);
  if (value instanceof GPUDataEvaluator) {
    return value;
  }
  if (typeof value === 'number' || Array.isArray(value)) {
    return GPUDataEvaluator.fromConstant(value);
  }
  throw new Error('Expression resolves to segmented data; use .values or .startIndices');
}

function parseGPGPUExpression(source: string): Expression {
  const expression = parseExpressionAt(source, 0, {ecmaVersion: 'latest'});
  const trailingSource = source.slice(expression.end).trim();
  if (trailingSource.length > 0) {
    throw new Error(`Unexpected input after expression: ${trailingSource}`);
  }
  return expression;
}

function evaluateNode(node: Expression, inputs: ExpressionInputs): ExpressionValue {
  switch (node.type) {
    case 'Identifier':
      return evaluateIdentifier(node, inputs);
    case 'Literal':
      return evaluateLiteral(node);
    case 'ArrayExpression':
      return evaluateArrayExpression(node, inputs);
    case 'UnaryExpression':
      return evaluateUnaryExpression(node, inputs);
    case 'BinaryExpression':
      return evaluateBinaryExpression(node, inputs);
    case 'CallExpression':
      return evaluateCallExpression(node, inputs);
    case 'MemberExpression':
      return evaluateMemberExpression(node, inputs);
    default:
      throw new Error(`Unsupported expression syntax: ${node.type}`);
  }
}

function evaluateIdentifier(node: Identifier, inputs: ExpressionInputs): ExpressionValue {
  const input = inputs[node.name];
  if (input) {
    return input;
  }
  throw new Error(`Unknown identifier "${node.name}"`);
}

function evaluateLiteral(node: Literal): number {
  if (typeof node.value === 'number') {
    return node.value;
  }
  throw new Error('Only numeric literals are supported');
}

function evaluateArrayExpression(node: ArrayExpression, inputs: ExpressionInputs): number[] {
  return node.elements.map(element => {
    if (!element) {
      throw new Error('Sparse arrays are not supported');
    }
    const value = evaluateNode(element as Expression, inputs);
    if (typeof value !== 'number') {
      throw new Error('Array literals may only contain numbers');
    }
    return value;
  });
}

function evaluateUnaryExpression(node: UnaryExpression, inputs: ExpressionInputs): number {
  const value = evaluateNode(node.argument as Expression, inputs);
  if (typeof value !== 'number') {
    throw new Error(`Unary ${node.operator} only supports numeric literals`);
  }
  switch (node.operator) {
    case '+':
      return value;
    case '-':
      return -value;
    default:
      throw new Error(`Unsupported unary operator ${node.operator}`);
  }
}

function evaluateBinaryExpression(
  node: BinaryExpression,
  inputs: ExpressionInputs
): GPUDataEvaluator {
  const operation = BINARY_OPERATIONS[node.operator];
  if (!operation) {
    throw new Error(`Unsupported binary operator ${node.operator}`);
  }
  return operation(
    getEvaluatorOrLiteral(evaluateNode(node.left as Expression, inputs)),
    getEvaluatorOrLiteral(evaluateNode(node.right as Expression, inputs))
  );
}

function evaluateCallExpression(node: CallExpression, inputs: ExpressionInputs): GPUDataEvaluator {
  if (node.callee.type !== 'Identifier') {
    throw new Error('Only direct operation calls are supported');
  }

  const operationName = node.callee.name;
  const operation = OPERATIONS[operationName];
  if (!operation) {
    throw new Error(`Unsupported operation "${operationName}"`);
  }

  const args = node.arguments.map(argument => evaluateNode(argument as Expression, inputs));
  if (operationName === 'segmentedMap') {
    return segmentedMap(
      getSegmentStartEvaluator(args[0]),
      getNumberArgument(args[1], 'vertexCount')
    );
  }

  return operation(...args.map(getEvaluatorOrLiteral));
}

function evaluateMemberExpression(
  node: MemberExpression,
  inputs: ExpressionInputs
): ExpressionValue {
  if (node.computed || node.property.type !== 'Identifier') {
    throw new Error('Only dot member access is supported');
  }
  const object = evaluateNode(node.object as Expression, inputs);
  if (!isSegmentedInput(object)) {
    throw new Error('Member access is only supported for segmented inputs');
  }

  switch (node.property.name) {
    case 'values':
      return object.values;
    case 'startIndices':
      return object.startIndices;
    default:
      throw new Error(`Unknown segmented member ${node.property.name}`);
  }
}

function getEvaluatorOrLiteral(value: ExpressionValue): GPUDataEvaluator | number | number[] {
  if (isSegmentedInput(value)) {
    throw new Error('Segmented inputs must use .values or .startIndices in this operation');
  }
  return value;
}

function getSegmentStartEvaluator(value: ExpressionValue | undefined): GPUDataEvaluator {
  if (!value) {
    throw new Error('segmentedMap requires a segmented input');
  }
  if (value instanceof GPUDataEvaluator) {
    return value;
  }
  if (isSegmentedInput(value)) {
    return value.startIndices;
  }
  throw new Error('segmentedMap first argument must be segmented data or an evaluator');
}

function getNumberArgument(value: ExpressionValue | undefined, name: string): number {
  if (typeof value === 'number') {
    return value;
  }
  throw new Error(`${name} must be a number`);
}

function isSegmentedInput(value: ExpressionValue): value is SegmentedExpressionInput {
  return typeof value === 'object' && !(value instanceof GPUDataEvaluator) && !Array.isArray(value);
}
