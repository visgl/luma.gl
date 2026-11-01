// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {parse, type Expression} from '@math.gl/expressions';
import type {GPUOperation} from './gpu-operation';

/** Parsed math.gl syntax tree. Only the documented numeric GPU subset is accepted. */
export type GPUExpressionAST = ReturnType<typeof parse>;
export type GPUExpressionOperationProps = {
  id?: string;
  output: string;
  expression: string | GPUExpressionAST;
};

/** A named, backend-independent numeric expression. Parsing and validation happen at compilation. */
export class GPUExpressionOperation implements GPUOperation {
  readonly type = 'expression';
  readonly id: string;
  readonly output: string;
  readonly expression: string | GPUExpressionAST;

  constructor(props: GPUExpressionOperationProps) {
    this.id = props.id ?? `${props.output}-expression`;
    this.output = props.output;
    this.expression = props.expression;
  }
}

/** Normalized numeric subset shared by the two execution implementations. @internal */
export type GPUExpression =
  | {kind: 'reference'; name: string}
  | {kind: 'literal'; value: number}
  | {kind: 'negate'; argument: GPUExpression}
  | {kind: 'binary'; operator: '+' | '-' | '*' | '/'; left: GPUExpression; right: GPUExpression};

/** @internal */
export function parseGPUExpression(expression: string | GPUExpressionAST): GPUExpression {
  const visit = (syntax: GPUExpressionAST): GPUExpression => {
    const node = syntax as Expression;
    switch (node.type) {
      case 'Identifier':
        return {kind: 'reference', name: node.name};
      case 'Literal':
        if (typeof node.value === 'number' && Number.isFinite(Math.fround(node.value)))
          return {kind: 'literal', value: node.value};
        break;
      case 'UnaryExpression':
        if (node.operator === '-') return {kind: 'negate', argument: visit(node.argument)};
        break;
      case 'BinaryExpression':
        if (['+', '-', '*', '/'].includes(node.operator))
          return {
            kind: 'binary',
            operator: node.operator as '+' | '-' | '*' | '/',
            left: visit(node.left),
            right: visit(node.right)
          };
        break;
    }
    throw new Error(`Unsupported GPU expression syntax: ${node.type}`);
  };
  return visit(typeof expression === 'string' ? parse(expression) : expression);
}

/** @internal */
export function getGPUExpressionReferences(expression: GPUExpression): readonly string[] {
  const references = new Set<string>();
  const visit = (value: GPUExpression): void => {
    switch (value.kind) {
      case 'reference':
        references.add(value.name);
        break;
      case 'negate':
        visit(value.argument);
        break;
      case 'binary':
        visit(value.left);
        visit(value.right);
        break;
    }
  };
  visit(expression);
  return [...references];
}
