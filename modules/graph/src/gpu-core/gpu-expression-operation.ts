// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {parse, type Expression} from '@math.gl/expressions';
import {getGPUVectorFormatInfo} from '@luma.gl/graph/gpu-data';
import type {GPUGraphVectorFormat} from './gpu-graph-value';
import type {GPUOperation} from './gpu-operation';

/** Parsed math.gl syntax tree. Only the documented numeric GPU subset is accepted. */
export type GPUExpressionAST = ReturnType<typeof parse>;
export type GPUExpressionOperationProps = {
  id?: string;
  output: string;
  expression: string | GPUExpressionAST;
  /** Float-to-integer casts; nearest ties round away from zero. Defaults to truncate. */
  integerRounding?: 'truncate' | 'nearest';
};

/** A named, backend-independent numeric expression. Parsing and validation happen at compilation. */
export class GPUExpressionOperation implements GPUOperation {
  readonly type = 'expression';
  readonly id: string;
  readonly output: string;
  readonly expression: string | GPUExpressionAST;
  readonly integerRounding: NonNullable<GPUExpressionOperationProps['integerRounding']>;

  constructor(props: GPUExpressionOperationProps) {
    this.id = props.id ?? `${props.output}-expression`;
    this.output = props.output;
    this.expression = props.expression;
    this.integerRounding = props.integerRounding ?? 'truncate';
  }
}

export type GPUExpressionFormat = 'float32' | 'sint32' | 'uint32';
export type GPUExpressionRowFormat = GPUGraphVectorFormat;

/** @internal */
export function isGPUExpressionRowFormat(format: string): format is GPUExpressionRowFormat {
  return /^(float32|sint32|uint32)(x[234])?$/.test(format);
}

/** @internal */
export function getGPUExpressionRowInfo(format: GPUExpressionRowFormat) {
  const info = getGPUVectorFormatInfo(format);
  return {components: info.components, componentType: info.signedDataType as GPUExpressionFormat};
}

/** @internal */
export function makeGPUExpressionRowFormat(
  componentType: GPUExpressionFormat,
  components: number
): GPUExpressionRowFormat {
  return components === 1
    ? componentType
    : (`${componentType}x${components}` as GPUExpressionRowFormat);
}

type GPUExpressionFunction = 'abs' | 'sqrt' | 'pow' | 'sin' | 'cos' | 'tan' | 'exp' | 'log';

/** Normalized numeric subset shared by the two execution implementations. @internal */
export type GPUExpression =
  | {kind: 'reference'; name: string}
  | {kind: 'literal'; value: number}
  | {kind: 'negate'; argument: GPUExpression}
  | {kind: 'swizzle'; argument: GPUExpression; components: number[]}
  | {kind: 'construct'; width: number; arguments: GPUExpression[]}
  | {kind: 'cast'; format: GPUExpressionFormat; argument: GPUExpression}
  | {kind: 'call'; name: GPUExpressionFunction; arguments: GPUExpression[]}
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
      case 'MemberExpression': {
        const property = node.property as Expression;
        if (node.computed || property.type !== 'Identifier')
          throw new Error('Computed component access is unsupported');
        if (!/^[xyzw]{1,4}$/.test(property.name))
          throw new Error(`Invalid swizzle .${property.name}: expected 1–4 xyzw components`);
        return {
          kind: 'swizzle',
          argument: visit(node.object),
          components: [...property.name].map(component => 'xyzw'.indexOf(component))
        };
      }
      case 'CallExpression': {
        const callee = node.callee as Expression;
        if (callee.type !== 'Identifier') break;
        const name = callee.name;
        if (/^vec[234]$/.test(name)) {
          if (node.arguments.length < 1 || node.arguments.length > 4)
            throw new Error(`${name}: expected 1–4 arguments, received ${node.arguments.length}`);
          return {kind: 'construct', width: Number(name[3]), arguments: node.arguments.map(visit)};
        }
        if (isGPUExpressionFormat(name)) {
          if (node.arguments.length !== 1) throw new Error(`Invalid argument count for ${name}`);
          return {kind: 'cast', format: name, argument: visit(node.arguments[0])};
        }
        if (!['abs', 'sqrt', 'pow', 'sin', 'cos', 'tan', 'exp', 'log'].includes(name)) break;
        if (node.arguments.length !== (name === 'pow' ? 2 : 1))
          throw new Error(`Invalid argument count for GPU expression function ${name}`);
        return {
          kind: 'call',
          name: name as GPUExpressionFunction,
          arguments: node.arguments.map(visit)
        };
      }
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
      case 'swizzle':
      case 'cast':
      case 'negate':
        visit(value.argument);
        break;
      case 'construct':
      case 'call':
        value.arguments.forEach(visit);
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

/** @internal */
export function isGPUExpressionFormat(format: string): format is GPUExpressionFormat {
  return format === 'float32' || format === 'sint32' || format === 'uint32';
}

/** Explicit casts delimit the float32 arithmetic subset. @internal */
export function getGPUExpressionFormat(
  expression: GPUExpression,
  formats: ReadonlyMap<string, GPUExpressionRowFormat>
): GPUExpressionRowFormat {
  switch (expression.kind) {
    case 'literal':
      return 'float32';
    case 'reference': {
      const format = formats.get(expression.name);
      if (!format) throw new Error(`Undeclared numeric input ${expression.name}`);
      return format;
    }
    case 'swizzle': {
      const input = getGPUExpressionRowInfo(getGPUExpressionFormat(expression.argument, formats));
      const required = Math.max(...expression.components) + 1;
      if (required > input.components) {
        const selector = expression.components.map(component => 'xyzw'[component]).join('');
        const inputName =
          expression.argument.kind === 'reference' ? expression.argument.name : 'input';
        throw new Error(
          `.${selector} needs ${required} components; ${inputName} has ${input.components}`
        );
      }
      return makeGPUExpressionRowFormat(input.componentType, expression.components.length);
    }
    case 'construct': {
      const argumentsInfo = expression.arguments.map(argument =>
        getGPUExpressionRowInfo(getGPUExpressionFormat(argument, formats))
      );
      const componentType = argumentsInfo[0].componentType;
      if (argumentsInfo.some(argument => argument.componentType !== componentType))
        throw new Error(
          `vec${expression.width}: mixed component types (${argumentsInfo.map(argument => argument.componentType).join(', ')})`
        );
      const components = argumentsInfo.reduce((count, argument) => count + argument.components, 0);
      if (!(argumentsInfo.length === 1 && components === 1) && components !== expression.width)
        throw new Error(
          `vec${expression.width}(...) needs ${expression.width} components; received ${components}`
        );
      return makeGPUExpressionRowFormat(componentType, expression.width);
    }
    case 'cast':
      return makeGPUExpressionRowFormat(
        expression.format,
        getGPUExpressionRowInfo(getGPUExpressionFormat(expression.argument, formats)).components
      );
    default: {
      const argumentsList =
        expression.kind === 'call'
          ? expression.arguments
          : expression.kind === 'negate'
            ? [expression.argument]
            : [expression.left, expression.right];
      const argumentTypes = argumentsList.map(argument =>
        getGPUExpressionRowInfo(getGPUExpressionFormat(argument, formats))
      );
      if (argumentTypes.some(argument => argument.componentType !== 'float32'))
        throw new Error('Arithmetic requires float32 operands; use an explicit float32 cast');
      const components = Math.max(...argumentTypes.map(argument => argument.components));
      if (
        argumentTypes.some(
          argument => argument.components !== 1 && argument.components !== components
        )
      )
        throw new Error('Expression row widths must match or broadcast from one component');
      return makeGPUExpressionRowFormat('float32', components);
    }
  }
}
