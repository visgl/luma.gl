// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {
  Expression,
  SlangType,
  SourceLocation,
  Structure,
  ShaderFunction,
  Variable
} from './ast';
import type {ShaderInterface} from './ir';
import {getLiteralType, getBinaryType} from './type-checker';
import {isByteAddressBuffer, ATOMICS, BARRIERS} from './resources';
import {isSlangTexture} from './textures';

export type InterfaceLowerer = (
  variable: Variable,
  stage: string,
  direction: 'in' | 'out',
  locations: ReadonlyMap<string, number>,
  fail: (message: string) => never
) => ShaderInterface;
export type ExpressionContext = {
  fail(message: string, location: SourceLocation): never;
  findSymbol(name: string, location: SourceLocation): {type: SlangType};
  getExpressionType(expression: Expression): SlangType;
  matchType(left: SlangType, right: SlangType): boolean;
  getCommonType(expressions: Expression[]): SlangType;
  structures: Map<string, Structure>;
  overloads: Map<string, ShaderFunction[]>;
  resolveFunction(
    name: string,
    argumentsList: Expression[],
    location: SourceLocation
  ): ShaderFunction;
  isValueType(name: string): boolean;
  checkMultiplyArguments(expression: Expression & {kind: 'call'}): void;
  isScalar(type: SlangType): boolean;
  isFloatIntrinsic(name: string): boolean;
  getFloatIntrinsicType(expression: Expression & {kind: 'call'}): SlangType;
};
export const INTRINSICS: Record<string, number[]> = {
  abs: [1],
  acos: [1],
  asin: [1],
  atan: [1],
  atan2: [2],
  ceil: [1],
  clamp: [3],
  cos: [1],
  cosh: [1],
  cross: [2],
  degrees: [1],
  distance: [2],
  dot: [2],
  exp: [1],
  exp2: [1],
  floor: [1],
  fract: [1],
  frac: [1],
  fwidth: [1],
  length: [1],
  lerp: [3],
  log: [1],
  log2: [1],
  max: [2],
  min: [2],
  normalize: [1],
  pow: [2],
  radians: [1],
  reflect: [2],
  refract: [3],
  round: [1],
  rsqrt: [1],
  saturate: [1],
  sign: [1],
  sin: [1],
  sinh: [1],
  smoothstep: [3],
  sqrt: [1],
  step: [2],
  tan: [1],
  tanh: [1],
  transpose: [1],
  trunc: [1],
  all: [1],
  any: [1],
  ddx: [1],
  ddy: [1],
  mul: [2],
  GroupMemoryBarrierWithGroupSync: [0]
};

export function resolveExpressionType(
  expression: Expression,
  context: ExpressionContext
): SlangType {
  switch (expression.kind) {
    case 'select':
      return context.getExpressionType(expression.arguments[0]);
    case 'texture-dimensions':
      return {name: 'uint2'};
    case 'initializer':
      context.fail('Initializer lists require a declared value type', expression);
    case 'identifier': {
      const type = context.findSymbol(expression.value, expression).type;
      return type.name === 'ConstantBuffer' ? type.element! : type;
    }
    case 'number':
      return getLiteralType(expression, (message, location) => context.fail(message, location));
    case 'boolean':
      return {name: 'bool'};
    case 'construct':
    case 'bitcast':
    case 'cast':
      return expression.type;
    case 'unary': {
      if (
        expression.operator === '-' &&
        expression.operand.kind === 'number' &&
        expression.operand.value === '2147483648'
      )
        return {name: 'int'};
      const type = context.getExpressionType(expression.operand);
      if (expression.operator === '!' && !/^bool([2-4])?$/.test(type.name))
        context.fail('Logical negation requires a boolean value', expression);
      if (expression.operator === '~' && !/^(int|uint)([2-4])?$/.test(type.name))
        context.fail('Bitwise negation requires an integer value', expression);
      if (
        ['+', '-'].includes(expression.operator) &&
        !/^(float|int|uint)([2-4](x[2-4])?)?$/.test(type.name)
      )
        context.fail('Numeric negation requires a numeric value', expression);
      return type;
    }
    case 'binary': {
      const left = context.getExpressionType(expression.left);
      const right = context.getExpressionType(expression.right);
      return expression.operator.endsWith('=') &&
        !['==', '!=', '<=', '>='].includes(expression.operator)
        ? left
        : getBinaryType(expression, left, right, (message, location) =>
            context.fail(message, location)
          );
    }
    case 'conditional': {
      const consequent = context.getExpressionType(expression.consequent);
      const alternate = context.getExpressionType(expression.alternate);
      if (context.matchType(consequent, alternate)) return consequent;
      if (
        /^(float|int|uint)([2-4])?$/.test(consequent.name) &&
        /^(float|int|uint)([2-4])?$/.test(alternate.name)
      ) {
        const consequentWidth = /[2-4]$/.exec(consequent.name)?.[0];
        const alternateWidth = /[2-4]$/.exec(alternate.name)?.[0];
        if (consequentWidth && alternateWidth && consequentWidth !== alternateWidth)
          context.fail('Conditional branches have incompatible vector widths', expression);
        return context.getCommonType([expression.consequent, expression.alternate]);
      }
      context.fail('Conditional branches have incompatible types', expression);
    }
    case 'member': {
      const object = context.getExpressionType(expression.object);
      const structure = context.structures.get(
        object.name === 'ConstantBuffer' ? object.element!.name : object.name
      );
      if (structure) {
        const field = structure.fields.find(variable => variable.name === expression.member);
        if (!field) {
          context.fail(`Unknown field ${expression.member}`, expression);
        }
        return field.type;
      }
      const vector = /^(float|int|uint|bool)([2-4])$/.exec(object.name);
      if (vector && /^[xyzwrgba]{1,4}$/.test(expression.member)) {
        const indices = 'xyzw';
        const colors = 'rgba';
        if (
          [...expression.member].some(
            character =>
              Math.max(indices.indexOf(character), colors.indexOf(character)) >= Number(vector[2])
          )
        ) {
          context.fail('Swizzle is outside the vector width', expression);
        }
        if (/[xyzw]/.test(expression.member) && /[rgba]/.test(expression.member)) {
          context.fail('Swizzle cannot mix component sets', expression);
        }
        return {name: vector[1] + (expression.member.length > 1 ? expression.member.length : '')};
      }
      context.fail(`Unsupported member ${expression.member} on ${object.name}`, expression);
    }
    case 'index': {
      const object = context.getExpressionType(expression.object);
      if (object.element) {
        return object.element;
      }
      const vector = /^(float|int|uint|bool)[2-4]$/.exec(object.name);
      if (vector) {
        return {name: vector[1]};
      }
      const matrix = /^float[2-4]x([2-4])$/.exec(object.name);
      if (matrix) {
        return {name: `float${matrix[1]}`};
      }
      context.fail(`Cannot index ${object.name}`, expression);
    }
    case 'call': {
      if (expression.callee.kind === 'member') {
        const resource = context.getExpressionType(expression.callee.object);
        if (isByteAddressBuffer(resource)) {
          if (
            ['GetDimensions', 'Store', 'Store2', 'Store3', 'Store4'].includes(
              expression.callee.member
            ) ||
            ATOMICS[expression.callee.member]
          )
            return {name: 'void'};
          if (/^Load[2-4]?$/.test(expression.callee.member))
            return {name: 'uint' + expression.callee.member.slice(4)};
        }
        if (isSlangTexture(resource)) {
          if (expression.callee.member === 'GetDimensions') return {name: 'void'};
          if (expression.callee.member.startsWith('Gather'))
            return {
              name:
                (expression.callee.member === 'GatherCmp'
                  ? 'float'
                  : resource.element!.name.replace(/[2-4]$/, '')) + '4'
            };
          return ['SampleCmp', 'SampleCmpLevelZero'].includes(expression.callee.member)
            ? {name: 'float'}
            : resource.element!;
        }
        context.fail('Unsupported resource method', expression);
      }
      if (expression.callee.kind !== 'identifier') {
        context.fail('Unsupported function expression', expression);
      }
      const name = expression.callee.value;
      if (context.overloads.has(name)) {
        const declaration = context.resolveFunction(name, expression.arguments, expression);
        expression.resolvedCall = {kind: 'function', declaration};
        return declaration.type;
      }
      if (INTRINSICS[name] && !INTRINSICS[name].includes(expression.arguments.length)) {
        context.fail(`Wrong number of arguments for ${name}`, expression);
      }
      if (context.isValueType(name)) {
        expression.resolvedCall = {kind: 'constructor', type: {name}};
        return {name};
      }
      if (['dot', 'length', 'distance'].includes(name)) {
        return {name: 'float'};
      }
      if (['all', 'any'].includes(name)) {
        return {name: 'bool'};
      }
      if (BARRIERS[name] || ATOMICS[name]) {
        return {name: 'void'};
      }
      if (['asfloat', 'asint', 'asuint'].includes(name)) {
        const argumentType = context.getExpressionType(expression.arguments[0]);
        return {name: name.slice(2) + (/[2-4]$/.exec(argumentType.name)?.[0] || '')};
      }
      if (name === 'transpose') {
        const matrix = /^float([2-4])x([2-4])$/.exec(
          context.getExpressionType(expression.arguments[0]).name
        );
        if (!matrix) {
          context.fail('transpose requires a matrix', expression);
        }
        return {name: `float${matrix[2]}x${matrix[1]}`};
      }
      if (name === 'mul') {
        context.checkMultiplyArguments(expression);
        const left = context.getExpressionType(expression.arguments[0]);
        const right = context.getExpressionType(expression.arguments[1]);
        const leftMatrix = /^float([2-4])x([2-4])$/.exec(left.name);
        const rightMatrix = /^float([2-4])x([2-4])$/.exec(right.name);
        if (leftMatrix && rightMatrix) {
          return {name: `float${leftMatrix[1]}x${rightMatrix[2]}`};
        }
        if (leftMatrix) {
          return {name: `float${leftMatrix[1]}`};
        }
        if (rightMatrix) {
          return {name: `float${rightMatrix[2]}`};
        }
        if (!context.isScalar(left) && !context.isScalar(right)) {
          return {name: 'float'};
        }
        return context.isScalar(left) ? right : left;
      }
      if (!INTRINSICS[name]) {
        context.fail(`Unsupported function ${name}`, expression);
      }
      if (['clamp', 'min', 'max', 'lerp', 'step', 'smoothstep', 'pow', 'atan2'].includes(name)) {
        return context.isFloatIntrinsic(name)
          ? context.getFloatIntrinsicType(expression)
          : context.getCommonType(expression.arguments);
      }
      if (context.isFloatIntrinsic(name)) return context.getFloatIntrinsicType(expression);
      return context.getExpressionType(expression.arguments[0]);
    }
  }
}
