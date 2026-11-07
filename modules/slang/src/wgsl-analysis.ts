// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {
  Expression,
  Program,
  ShaderFunction,
  Variable,
  SlangType,
  SourceLocation,
  Statement
} from './ast';
import type {InterfaceLowerer} from './expression-analysis';
import {SlangTranspileError} from './diagnostics';
import {visitSyntaxChildren} from './syntax';
import {getIntegerConstant} from './type-checker';
import {checkWGSLUniformLayout} from './wgsl-layout';
import {resolveWGSLBuiltin} from './wgsl-builtins';
import {lowerSlangType} from './slang-types';

/** Validate the bounded WGSL value subset before shared code generation. */
export function analyzeWGSL(
  program: Program,
  sourceName: string,
  options: {glslVersion?: '300 es' | '450'} = {}
): void {
  const fail: (message: string, location: SourceLocation) => never = (message, location) => {
    throw new SlangTranspileError(message, location, sourceName);
  };
  const structures = new Map(
    program.declarations
      .filter(declaration => declaration.kind === 'struct')
      .map(declaration => [declaration.name, declaration])
  );
  const functions = new Map<string, ShaderFunction>();
  const names = new Set<string>();
  for (const declaration of program.declarations) {
    if (
      /^(?:f32|i32|u32|bool|vec[2-4][fiub]?|(?:float|int|uint|bool)(?:[2-4](?:x[2-4])?)?)$/.test(
        declaration.name
      )
    )
      fail('Shadowing predeclared value types is outside the initial subset', declaration.location);
    if (names.has(declaration.name)) fail('Duplicate declaration', declaration.location);
    names.add(declaration.name);
    if (declaration.kind === 'function') functions.set(declaration.name, declaration);
    if (
      declaration.kind === 'struct' &&
      new Set(declaration.fields.map(field => field.name)).size !== declaration.fields.length
    )
      fail('Duplicate struct member', declaration.location);
  }
  const completed = new Set<string>();
  function checkStructure(name: string, ancestors = new Set<string>()): void {
    if (ancestors.has(name))
      fail('Recursive structures are unsupported', structures.get(name)!.location);
    if (completed.has(name)) return;
    const structure = structures.get(name);
    if (!structure) return;
    const visited = new Set(ancestors).add(name);
    structure.fields.forEach(field => {
      let type = field.type;
      while (type.element) type = type.element;
      checkStructure(type.name, visited);
    });
    completed.add(name);
  }
  structures.forEach(structure => checkStructure(structure.name));
  type Binding = {
    type: SlangType;
    mutable: boolean;
    abstractValue?: Expression;
    integerConstant?: number;
    constant?: boolean;
  };
  let scopes: Map<string, Binding>[] = [];
  function lookup(name: string, location: SourceLocation): Binding {
    for (const scope of [...scopes].reverse()) {
      const binding = scope.get(name);
      if (binding) return binding;
    }
    const declaration = constantDeclarations.get(name);
    if (declaration) {
      prepareConstant(declaration);
      return globals.get(name)!;
    }
    return fail(`Unknown identifier ${name}`, location);
  }
  const same = (left: SlangType, right: SlangType): boolean =>
    left.name === right.name &&
    left.length === right.length &&
    (!left.element || Boolean(right.element && same(left.element, right.element)));
  const globals = new Map<string, Binding>();
  const constants = new Map<string, Expression>();
  const constantDeclarations = new Map(
    program.declarations
      .filter(
        (value): value is Variable => value.kind === 'variable' && value.modifiers.includes('const')
      )
      .map(value => [value.name, value])
  );
  const preparingConstants = new Set<string>();
  const orderedConstants: Variable[] = [];
  const constantStack = new Set<string>();
  for (const declaration of program.declarations)
    if (
      declaration.kind === 'variable' &&
      declaration.modifiers.includes('const') &&
      declaration.type.name === '$inferred' &&
      declaration.initializer
    )
      constants.set(declaration.name, declaration.initializer);
  function evaluateAbstract(
    expression: Expression
  ): {value: number; floating: boolean} | undefined {
    if (expression.kind === 'identifier') {
      const binding = [...scopes]
        .reverse()
        .map(scope => scope.get(expression.value))
        .find(Boolean);
      const value = binding ? binding.abstractValue : constants.get(expression.value);
      if (!value) return undefined;
      if (constantStack.has(expression.value)) fail('Recursive constant', expression);
      constantStack.add(expression.value);
      const result = evaluateAbstract(value);
      constantStack.delete(expression.value);
      return result;
    }
    if (expression.kind === 'number' && !/[iuf]$/.test(expression.value)) {
      const value = Number(expression.value);
      const floating = /[.eE]/.test(expression.value);
      if (!Number.isFinite(value) || (!floating && !Number.isSafeInteger(value)))
        fail('Abstract literal is outside the supported precision', expression);
      return {value, floating};
    }
    if (expression.kind === 'unary' && expression.operator === '-') {
      const operand = evaluateAbstract(expression.operand);
      return operand && {...operand, value: -operand.value};
    }
    if (expression.kind !== 'binary' || !['+', '-', '*', '/', '%'].includes(expression.operator))
      return undefined;
    const left = evaluateAbstract(expression.left);
    const right = evaluateAbstract(expression.right);
    if (!left || !right) return undefined;
    const floating = left.floating || right.floating;
    if (['/', '%'].includes(expression.operator) && right.value === 0)
      fail('Constant division by zero', expression);
    let value =
      expression.operator === '+'
        ? left.value + right.value
        : expression.operator === '-'
          ? left.value - right.value
          : expression.operator === '*'
            ? left.value * right.value
            : expression.operator === '%'
              ? left.value % right.value
              : left.value / right.value;
    if (expression.operator === '/' && !floating) value = Math.trunc(value);
    if (!Number.isFinite(value) || (!floating && !Number.isSafeInteger(value)))
      fail('Abstract constant is outside the supported precision', expression);
    return {value, floating};
  }
  function resolve(expression: Expression, expected?: SlangType): SlangType {
    if (expression.valueType) {
      if (expected && !same(expression.valueType, expected))
        fail('WGSL types must match', expression);
      return expression.valueType;
    }
    if (
      expression.kind === 'binary' ||
      (expression.kind === 'identifier' && evaluateAbstract(expression))
    ) {
      if (
        expression.kind === 'binary' &&
        ['==', '!=', '<', '<=', '>', '>='].includes(expression.operator)
      ) {
        const left = evaluateAbstract(expression.left);
        const right = evaluateAbstract(expression.right);
        if (left && right) {
          const result =
            expression.operator === '=='
              ? left.value === right.value
              : expression.operator === '!='
                ? left.value !== right.value
                : expression.operator === '<'
                  ? left.value < right.value
                  : expression.operator === '<='
                    ? left.value <= right.value
                    : expression.operator === '>'
                      ? left.value > right.value
                      : left.value >= right.value;
          const type = {name: 'bool'};
          if (expected && expected.name !== 'bool')
            fail('Comparison requires a boolean context', expression);
          expression.valueType = type;
          expression.resolvedType = {kind: 'scalar', scalar: 'bool'};
          expression.constantValue = String(result);
          return type;
        }
      }
      const constant = evaluateAbstract(expression);
      if (constant) {
        const representation = String(constant.value);
        const literal: Expression = {
          ...expression,
          kind: 'number',
          value: representation + (constant.floating && !/[.eE]/.test(representation) ? '.0' : '')
        };
        const type = resolve(literal, expected);
        expression.valueType = type;
        expression.resolvedType = literal.resolvedType;
        expression.constantValue =
          type.name === 'int' && literal.value === '-2147483648'
            ? '(-2147483647 - 1)'
            : literal.value;
        return type;
      }
    }
    let type: SlangType;
    switch (expression.kind) {
      case 'construct': {
        checkType(expression.type, expression);
        if (expression.type.name !== 'array') fail('Expected array constructor', expression);
        if (!expression.elements.length)
          expression.elements = Array.from({length: expression.type.length!}, () =>
            zero(expression.type.element!, expression)
          );
        if (expression.elements.length !== expression.type.length)
          fail('Array constructor element count mismatch', expression);
        expression.elements.forEach(element => resolve(element, expression.type.element));
        type = expression.type;
        break;
      }
      case 'bitcast': {
        const actual = resolve(expression.operand);
        type = expression.type;
        const source = /^(float|int|uint)([2-4])?$/.exec(actual.name);
        const target = /^(float|int|uint)([2-4])?$/.exec(type.name);
        if (!source || !target || source[2] !== target[2])
          fail('bitcast requires equal-width numeric values', expression);
        break;
      }
      case 'index': {
        const object = resolve(expression.object);
        const index = resolve(expression.index);
        if (!['int', 'uint'].includes(index.name))
          fail('Index must be an integer scalar', expression);
        const matrix = /^float([2-4])x([2-4])$/.exec(object.name);
        const vector = /^(float|int|uint|bool)([2-4])$/.exec(object.name);
        type =
          object.name === 'array'
            ? object.element!
            : matrix
              ? {name: 'float' + matrix[2]}
              : vector
                ? {name: vector[1]}
                : fail('Value is not indexable', expression);
        const count = object.length ?? Number(matrix?.[1] ?? vector?.[2]);
        const constant =
          expression.index.kind === 'number'
            ? {value: Number(expression.index.value.replace(/[iu]$/, ''))}
            : evaluateAbstract(expression.index);
        if (constant && (constant.value < 0 || constant.value >= count))
          fail('Index outside declared length', expression);
        break;
      }
      case 'number': {
        const suffix = /[iuf]$/.exec(expression.value)?.[0];
        const floating = /[.eE]/.test(expression.value);
        type = {
          name:
            suffix === 'u'
              ? 'uint'
              : suffix === 'i'
                ? 'int'
                : suffix === 'f'
                  ? 'float'
                  : expected && ['float', 'int', 'uint'].includes(expected.name)
                    ? expected.name
                    : floating
                      ? 'float'
                      : 'int'
        };
        if (floating && type.name !== 'float') fail('Floating literals require f32', expression);
        const value = Number(expression.value.replace(/[iuf]$/, ''));
        if (
          !Number.isFinite(value) ||
          (type.name === 'float'
            ? !Number.isFinite(Math.fround(value))
            : !Number.isInteger(value) ||
              value < (type.name === 'uint' ? 0 : -2147483648) ||
              value > (type.name === 'uint' ? 4294967295 : 2147483647))
        )
          fail('Literal is outside the supported 32-bit range', expression);
        expression.value =
          expression.value.replace(/[iuf]$/, '') +
          (type.name === 'uint' ? 'u' : type.name === 'float' && !floating ? '.0' : '');
        break;
      }
      case 'boolean':
        type = {name: 'bool'};
        break;
      case 'identifier':
        type = lookup(expression.value, expression).type;
        break;
      case 'member': {
        const object = resolve(expression.object);
        const structure = structures.get(object.name);
        if (structure) {
          const field = structure.fields.find(field => field.name === expression.member);
          if (!field) fail('Unknown struct member', expression);
          type = field.type;
        } else {
          const vector = /^(float|int|uint|bool)([2-4])$/.exec(object.name);
          const components = /^[xyzw]+$/.test(expression.member)
            ? 'xyzw'
            : /^[rgba]+$/.test(expression.member)
              ? 'rgba'
              : '';
          if (
            !vector ||
            !components ||
            expression.member.length > 4 ||
            [...expression.member].some(
              component => components.indexOf(component) >= Number(vector[2])
            )
          )
            fail('Invalid swizzle', expression);
          type = {
            name: vector[1] + (expression.member.length === 1 ? '' : expression.member.length)
          };
        }
        break;
      }
      case 'unary': {
        // WGSL permits the minimum signed integer through an abstract positive operand.
        if (
          expression.operator === '-' &&
          expression.operand.kind === 'number' &&
          expression.operand.value === '2147483648' &&
          (!expected || expected.name === 'int')
        ) {
          expression.operand.valueType = {name: 'int'};
          type = {name: 'int'};
          break;
        }
        type = resolve(expression.operand, expected);
        if (['++', '--'].includes(expression.operator)) {
          checkMutable(expression.operand);
          if (!['int', 'uint'].includes(type.name))
            fail('Increment requires an integer scalar', expression);
          break;
        }
        if (
          expression.operator === '!'
            ? !/^bool[2-4]?$/.test(type.name)
            : expression.operator === '~'
              ? !/^(int|uint)[2-4]?$/.test(type.name)
              : !/^(float|int)[2-4]?$/.test(type.name)
        )
          fail('Invalid unary operand', expression);
        break;
      }
      case 'binary': {
        const assignment = /^(?:=|[+*\/%&|^\-]=|<<=|>>=)$/.test(expression.operator);
        if (assignment) {
          checkMutable(expression.left);
          if (
            expression.left.kind === 'member' &&
            new Set(expression.left.member).size !== expression.left.member.length &&
            !structures.has(resolve(expression.left.object).name)
          )
            fail('Assignment swizzle repeats a component', expression.left);
        }
        const comparison = ['==', '!=', '<', '<=', '>', '>='].includes(expression.operator);
        const operandExpected = comparison ? undefined : expected;
        // Resolve the concrete operand first so abstract literals can materialize to its type.
        let left: SlangType;
        let right: SlangType;
        const scalarContext = (type: SlangType | undefined): SlangType | undefined =>
          type && /^(float|int|uint)(?:[2-4](?:x[2-4])?)?$/.test(type.name)
            ? {name: type.name.replace(/[2-4](?:x[2-4])?$/, '')}
            : undefined;
        const leftAbstract = evaluateAbstract(expression.left);
        const rightAbstract = evaluateAbstract(expression.right);
        if (leftAbstract && !rightAbstract) {
          right = resolve(expression.right);
          left = resolve(expression.left, scalarContext(right));
        } else {
          left = resolve(
            expression.left,
            leftAbstract ? scalarContext(operandExpected) : undefined
          );
          right = resolve(
            expression.right,
            rightAbstract
              ? ['<<', '>>', '<<=', '>>='].includes(expression.operator)
                ? {name: 'uint'}
                : scalarContext(left)
              : undefined
          );
        }
        const leftMatrix = /^float([2-4])x([2-4])$/.exec(left.name);
        const rightMatrix = /^float([2-4])x([2-4])$/.exec(right.name);
        if (leftMatrix || rightMatrix) {
          const operator = expression.operator.replace(/=$/, '');
          if (operator === '*') {
            if (leftMatrix && rightMatrix && leftMatrix[1] === rightMatrix[2])
              type = {name: `float${rightMatrix[1]}x${leftMatrix[2]}`};
            else if (leftMatrix && right.name === `float${leftMatrix[1]}`)
              type = {name: `float${leftMatrix[2]}`};
            else if (rightMatrix && left.name === `float${rightMatrix[2]}`)
              type = {name: `float${rightMatrix[1]}`};
            else if (leftMatrix && right.name === 'float') type = left;
            else if (rightMatrix && left.name === 'float') type = right;
            else fail('Matrix multiplication dimensions do not match', expression);
            expression.operation = 'matrix-multiply';
          } else if (['+', '-'].includes(operator) && same(left, right)) type = left;
          else if (expression.operator === '=' && same(left, right)) type = left;
          else fail('Unsupported matrix operation', expression);
          if (assignment && !same(left, type)) fail('Assignment type mismatch', expression);
          break;
        }
        if (expression.operator === '=' && same(left, right)) {
          type = left;
          break;
        }
        if (['<<', '>>', '<<=', '>>='].includes(expression.operator)) {
          if (
            !/^(int|uint)[2-4]?$/.test(left.name) ||
            right.name !== 'uint' + (/[2-4]$/.exec(left.name)?.[0] || '')
          )
            fail('Shifts require integer values and matching u32 counts', expression);
          if (
            expression.right.kind === 'number' &&
            Number(expression.right.value.replace(/u$/, '')) >= 32
          )
            fail('Constant shift count must be below 32', expression.right);
          expression.operation = expression.operator.startsWith('<<')
            ? 'shift-left'
            : 'shift-right';
          type = left;
          break;
        }
        const leftVector = /^(float|int|uint)[2-4]$/.test(left.name);
        const rightVector = /^(float|int|uint)[2-4]$/.test(right.name);
        const scaling =
          (expression.operator === '*' ||
            expression.operator === '*=' ||
            expression.operator === '/' ||
            expression.operator === '/=') &&
          leftVector !== rightVector &&
          left.name.replace(/[2-4]$/, '') === right.name.replace(/[2-4]$/, '');
        if (!same(left, right) && !scaling)
          fail('WGSL operands require matching types', expression);
        if (assignment && !leftVector && rightVector)
          fail('Assignment result must match its destination', expression);
        if (['/', '/=', '%', '%='].includes(expression.operator) && /^(int|uint)/.test(left.name))
          fail('Integer division and remainder are outside the initial subset', expression);
        if (['&&', '||'].includes(expression.operator)) {
          if (left.name !== 'bool') fail('Logical operands must be bool', expression);
        } else if (
          !assignment &&
          !/^(float|int|uint)([2-4])?$/.test(left.name) &&
          !(
            comparison &&
            /^bool[2-4]?$/.test(left.name) &&
            ['==', '!='].includes(expression.operator)
          )
        )
          fail('Unsupported binary operands', expression);
        if (
          ['&', '|', '^', '%', '&=', '|=', '^=', '%='].includes(expression.operator) &&
          !/^(int|uint)[2-4]?$/.test(left.name)
        )
          fail('Integer operands required', expression);
        type = comparison
          ? {name: 'bool' + (/[2-4]$/.exec(left.name)?.[0] || '')}
          : scaling && rightVector
            ? right
            : left;
        break;
      }
      case 'call': {
        if (expression.callee.kind !== 'identifier')
          fail('Calls require a function or constructor', expression);
        const name = expression.callee.value;
        if (name.startsWith('texture')) {
          type = textureCall(expression, name);
          break;
        }
        const builtin = resolveWGSLBuiltin(expression, resolve, fail, evaluateAbstract);
        if (builtin) {
          type = builtin;
          break;
        }
        const matrix = /^float([2-4])x([2-4])$/.exec(name);
        if (matrix) {
          if (!expression.arguments.length)
            expression.arguments = Array.from({length: Number(matrix[1]) * Number(matrix[2])}, () =>
              zero({name: 'float'}, expression)
            );
          const types = expression.arguments.map(argument =>
            resolve(argument, evaluateAbstract(argument) ? {name: 'float'} : undefined)
          );
          if (
            !(
              (types.length === 1 && types[0].name === name) ||
              (types.length === Number(matrix[1]) &&
                types.every(type => type.name === 'float' + matrix[2])) ||
              (types.length === Number(matrix[1]) * Number(matrix[2]) &&
                types.every(type => type.name === 'float'))
            )
          )
            fail('Matrix constructor requires matching columns or all scalar elements', expression);
          type = {name};
          expression.resolvedCall = {kind: 'constructor', type};
          break;
        }
        const declaration = functions.get(name);
        const structure = structures.get(name);
        if (declaration) {
          if (declaration.attributes.length) fail('Entry points cannot be called', expression);
          if (expression.arguments.length !== declaration.parameters.length)
            fail('Function argument count mismatch', expression);
          expression.arguments.forEach((argument, index) =>
            resolve(argument, declaration.parameters[index].type)
          );
          expression.resolvedCall = {kind: 'function', declaration};
          type = declaration.type;
        } else if (structure) {
          if (expression.arguments.length !== structure.fields.length)
            fail('Struct constructor argument count mismatch', expression);
          expression.arguments.forEach((argument, index) =>
            resolve(argument, structure.fields[index].type)
          );
          type = {name};
          expression.resolvedCall = {kind: 'constructor', type};
        } else {
          const numeric = /^(float|int|uint|bool)([2-4])?$/.exec(name);
          if (!numeric) fail(`Unsupported WGSL function ${name}`, expression);
          if (!expression.arguments.length)
            expression.arguments = [zero({name: numeric[1]}, expression)];
          const scalar = {name: numeric[1]};
          let width = 0;
          expression.arguments.forEach(argument => {
            const actual = resolve(argument, evaluateAbstract(argument) ? scalar : undefined);
            const shape = /^(float|int|uint|bool)([2-4])?$/.exec(actual.name);
            if (!shape) fail('Constructor requires numeric arguments', argument);
            if (['int', 'uint'].includes(numeric[1]) && shape[1] === 'float')
              fail('Float-to-integer conversion is outside the initial subset', argument);
            if ((numeric[1] === 'bool' || shape[1] === 'bool') && numeric[1] !== shape[1])
              fail('Boolean conversions are outside the initial subset', argument);
            if (
              numeric[2] &&
              shape[1] !== numeric[1] &&
              !(expression.arguments.length === 1 && shape[2] === numeric[2])
            )
              fail('Vector components require matching scalar types', argument);
            width += Number(shape[2] || 1);
          });
          if (
            numeric[2]
              ? !(
                  width === Number(numeric[2]) ||
                  (expression.arguments.length === 1 && width === 1)
                )
              : expression.arguments.length !== 1 || width !== 1
          )
            fail('Constructor component count mismatch', expression);
          type = {name};
          expression.resolvedCall = {kind: 'constructor', type};
        }
        break;
      }
      default:
        return fail('Unsupported WGSL expression', expression);
    }
    if (expected && !same(type, expected))
      fail(`Expected ${expected.name}, received ${type.name}`, expression);
    if (expression.resolvedCall?.kind === 'constructor') expression.operation = 'convert';
    expression.valueType = type;
    expression.resolvedType = lowerSlangType(type);
    return type;
  }
  function zero(type: SlangType, location: SourceLocation): Expression {
    const structure = structures.get(type.name);
    if (structure)
      return {
        ...location,
        kind: 'call',
        callee: {...location, kind: 'identifier', value: type.name},
        arguments: structure.fields.map(field => zero(field.type, location))
      };
    if (type.name === 'array')
      return {
        ...location,
        kind: 'construct',
        type,
        elements: Array.from({length: type.length!}, () => zero(type.element!, location))
      };
    const matrix = /^float([2-4])x([2-4])$/.exec(type.name);
    if (matrix)
      return {
        ...location,
        kind: 'call',
        callee: {...location, kind: 'identifier', value: type.name},
        arguments: Array.from({length: Number(matrix[1]) * Number(matrix[2])}, () =>
          zero({name: 'float'}, location)
        )
      };
    if (type.name === 'bool') return {...location, kind: 'boolean', value: 'false'};
    if (/^(float|int|uint|bool)[2-4]$/.test(type.name))
      return {
        ...location,
        kind: 'call',
        callee: {...location, kind: 'identifier', value: type.name},
        arguments: [zero({name: type.name.slice(0, -1)}, location)]
      };
    return {
      ...location,
      kind: 'number',
      value: type.name === 'uint' ? '0u' : type.name === 'float' ? '0.0' : '0'
    };
  }
  function checkMutable(expression: Expression): void {
    let root = expression;
    while (root.kind === 'member' || root.kind === 'index') root = root.object;
    if (root.kind !== 'identifier' || !lookup(root.value, root).mutable)
      fail('Assignment requires a mutable variable', expression);
  }
  function checkType(type: SlangType, location: SourceLocation): number {
    if (type.lengthName) {
      const expression = constants.get(type.lengthName);
      const value = expression && evaluateAbstract(expression);
      const count =
        value && !value.floating ? value.value : lookup(type.lengthName, location).integerConstant;
      if (count === undefined) fail('Array count requires an integer constant', location);
      type.length = count;
      delete type.lengthName;
    }
    if (
      type.name === 'array' &&
      (!Number.isInteger(type.length) || type.length! < 1 || type.length! > 65536)
    )
      fail('Array length must be between 1 and 65536', location);
    if (type.name === 'array' && type.element?.name === 'array' && options.glslVersion !== '450')
      fail('Nested arrays require GLSL 450', location);
    const structure = structures.get(type.name);
    const shape = /^(?:float|int|uint|bool)([2-4])?(?:x([2-4]))?$/.exec(type.name);
    const count =
      type.name === 'array'
        ? type.length! * checkType(type.element!, location)
        : structure
          ? structure.fields.reduce((sum, field) => sum + checkType(field.type, field.location), 0)
          : type.element
            ? checkType(type.element, location)
            : Number(shape?.[1] || 1) * Number(shape?.[2] || 1);
    if (count > 65536) fail('Aggregate exceeds the supported expanded value size', location);
    return count;
  }
  function integerConstant(expression: Expression): number | undefined {
    return getIntegerConstant(
      expression,
      name => lookup(name, expression).integerConstant,
      value => resolve(value)
    );
  }
  function textureCall(expression: Expression & {kind: 'call'}, name: string): SlangType {
    const argumentsList = expression.arguments;
    const texture = argumentsList[0];
    if (!texture || resolve(texture).name !== 'Texture2D')
      fail('Texture operation requires texture_2d<f32>', expression);
    if (name === 'textureDimensions') {
      if (argumentsList.length < 1 || argumentsList.length > 2)
        fail('textureDimensions argument count mismatch', expression);
      const level = argumentsList[1] || zero({name: 'int'}, expression);
      if (!['int', 'uint'].includes(resolve(level).name)) fail('Mip level must be integer', level);
      Object.assign(expression, {kind: 'texture-dimensions', texture, level});
      return {name: 'uint2'};
    }
    if (name === 'textureLoad') {
      if (argumentsList.length !== 3) fail('textureLoad argument count mismatch', expression);
      resolve(argumentsList[1], {name: 'int2'});
      const level = argumentsList[2];
      if (!['int', 'uint'].includes(resolve(level).name)) fail('Mip level must be integer', level);
      const converted: Expression = {
        ...level,
        kind: 'cast',
        type: {name: 'int'},
        operand: level,
        valueType: {name: 'int'}
      };
      const coordinate: Expression = {
        ...expression,
        kind: 'call',
        callee: {...expression, kind: 'identifier', value: 'int3'},
        arguments: [argumentsList[1], converted],
        resolvedCall: {kind: 'constructor', type: {name: 'int3'}},
        valueType: {name: 'int3'}
      };
      expression.callee = {...expression, kind: 'member', object: texture, member: 'Load'};
      expression.arguments = [coordinate];
      expression.operation = 'texture-load';
      return {name: 'float4'};
    }
    const method = {
      textureSample: 'Sample',
      textureSampleLevel: 'SampleLevel',
      textureSampleGrad: 'SampleGrad'
    }[name];
    const count = name === 'textureSample' ? 3 : name === 'textureSampleLevel' ? 4 : 5;
    if (!method || argumentsList.length !== count)
      fail('Unsupported texture operation or argument count', expression);
    resolve(argumentsList[1], {name: 'SamplerState'});
    resolve(argumentsList[2], {name: 'float2'});
    for (const argument of argumentsList.slice(3))
      resolve(argument, {name: name === 'textureSampleGrad' ? 'float2' : 'float'});
    expression.callee = {...expression, kind: 'member', object: texture, member: method};
    expression.arguments = argumentsList.slice(1);
    expression.operation =
      name === 'textureSample'
        ? 'texture-sample'
        : name === 'textureSampleLevel'
          ? 'texture-sample-level'
          : 'texture-sample-gradient';
    return {name: 'float4'};
  }
  function checkConstant(expression: Expression): void {
    if (expression.kind === 'identifier' && !lookup(expression.value, expression).constant)
      fail('Initializer requires a constant expression', expression);
    if (
      expression.kind === 'call' &&
      (expression.callee.kind !== 'identifier' ||
        functions.has(expression.callee.value) ||
        expression.callee.value.startsWith('texture') ||
        ['dpdx', 'dpdy', 'fwidth'].includes(expression.callee.value))
    )
      fail('Initializer requires a constant expression', expression);
    if (expression.kind === 'call') expression.arguments.forEach(checkConstant);
    else if (expression.kind === 'binary') {
      checkConstant(expression.left);
      checkConstant(expression.right);
    } else if (
      expression.kind === 'unary' ||
      expression.kind === 'cast' ||
      expression.kind === 'bitcast'
    )
      checkConstant(expression.operand);
    else if (expression.kind === 'construct') expression.elements.forEach(checkConstant);
    else if (expression.kind === 'member' || expression.kind === 'index') {
      checkConstant(expression.object);
      if (expression.kind === 'index') checkConstant(expression.index);
    }
  }
  let loopDepth = 0;
  let switchDepth = 0;
  function statement(node: Statement, returnType: SlangType): void {
    if (node.kind === 'block') {
      scopes.push(new Map());
      node.statements.forEach(child => statement(child, returnType));
      scopes.pop();
    } else if (node.kind === 'variable') {
      const variable = node.variable;
      if (scopes.at(-1)!.has(variable.name)) fail('Duplicate local', variable.location);
      checkType(variable.type, variable.location);
      variable.initializer ||= zero(variable.type, variable.location);
      const evaluatedConstant =
        variable.modifiers.includes('const') && variable.type.name === '$inferred'
          ? evaluateAbstract(variable.initializer)
          : undefined;
      const abstractValue: Expression | undefined = evaluatedConstant
        ? {
            ...variable.initializer,
            kind: 'number',
            value:
              String(evaluatedConstant.value) +
              (evaluatedConstant.floating && Number.isInteger(evaluatedConstant.value) ? '.0' : '')
          }
        : undefined;
      if (variable.modifiers.includes('const')) checkConstant(variable.initializer);
      variable.type = resolve(
        variable.initializer,
        variable.type.name === '$inferred' ? undefined : variable.type
      );
      scopes.at(-1)!.set(variable.name, {
        type: variable.type,
        constant: variable.modifiers.includes('const'),
        integerConstant:
          variable.modifiers.includes('const') && ['int', 'uint'].includes(variable.type.name)
            ? integerConstant(variable.initializer)
            : undefined,
        abstractValue,
        mutable: !variable.modifiers.some(modifier => ['let', 'const'].includes(modifier))
      });
    } else if (node.kind === 'return') {
      if (node.expression) resolve(node.expression, returnType);
      else if (returnType.name !== 'void') fail('Return value required', node);
    } else if (node.kind === 'expression') {
      if (
        node.expression.kind !== 'call' &&
        !(node.expression.kind === 'binary' && /=$/.test(node.expression.operator)) &&
        !(node.expression.kind === 'unary' && ['++', '--'].includes(node.expression.operator))
      )
        fail('Invalid expression statement', node);
      resolve(node.expression);
    } else if (node.kind === 'if') {
      resolve(node.condition, {name: 'bool'});
      statement(node.consequent, returnType);
      if (node.alternate) statement(node.alternate, returnType);
    } else if (node.kind === 'for' || node.kind === 'while') {
      scopes.push(new Map());
      loopDepth++;
      if (node.kind === 'for' && node.initializer) statement(node.initializer, returnType);
      if (node.condition) resolve(node.condition, {name: 'bool'});
      statement(node.body, returnType);
      if (node.kind === 'for' && node.update) resolve(node.update);
      loopDepth--;
      scopes.pop();
    } else if (node.kind === 'switch') {
      const type = resolve(node.selector);
      if (!['int', 'uint'].includes(type.name)) fail('Switch selector must be integer', node);
      switchDepth++;
      let defaults = 0;
      const labels = new Set<string>();
      for (const clause of node.clauses) {
        for (const label of clause.labels) {
          if (label === null) {
            defaults++;
            continue;
          }
          resolve(label, type);
          const value = integerConstant(label);
          if (value === undefined) fail('Switch labels require integer constants', label);
          const key = String(value);
          if (labels.has(key)) fail('Duplicate switch label', label);
          labels.add(key);
        }
        scopes.push(new Map());
        clause.statements.forEach(child => statement(child, returnType));
        scopes.pop();
        clause.statements.push({
          offset: clause.offset,
          line: clause.line,
          column: clause.column,
          kind: 'break'
        });
      }
      if (defaults !== 1) fail('Switch requires exactly one default', node);
      switchDepth--;
    } else if (node.kind === 'break') {
      if (!loopDepth && !switchDepth) fail('break requires a loop or switch', node);
    } else if (node.kind === 'continue') {
      if (!loopDepth) fail('continue requires a loop', node);
    } else if (!['discard', 'empty'].includes(node.kind)) fail('Unsupported WGSL statement', node);
  }
  const bindings = new Set<string>();
  function analyzeGlobal(declaration: Variable): void {
    checkType(declaration.type, declaration.location);
    if (declaration.binding) {
      const key = `${declaration.binding.group}:${declaration.binding.binding}`;
      if (bindings.has(key)) fail('Duplicate resource binding', declaration.location);
      bindings.add(key);
      if (declaration.initializer) fail('Resources cannot have initializers', declaration.location);
      if (declaration.type.name === 'ConstantBuffer') {
        if (!structures.has(declaration.type.element!.name))
          fail('Uniform buffers require a structure', declaration.location);
        checkWGSLUniformLayout(
          declaration.type.element!,
          structures,
          declaration.location,
          sourceName
        );
      }
      globals.set(declaration.name, {
        type:
          declaration.type.name === 'ConstantBuffer' ? declaration.type.element! : declaration.type,
        mutable: false
      });
    } else {
      if (!declaration.modifiers.includes('const')) declaration.modifiers.push('static');
      scopes = [globals];
      declaration.initializer ||= zero(declaration.type, declaration.location);
      checkConstant(declaration.initializer);
      const originalConstant = constants.get(declaration.name);
      declaration.type = resolve(
        structuredClone(declaration.initializer),
        declaration.type.name === '$inferred' ? undefined : declaration.type
      );
      if (originalConstant && evaluateAbstract(originalConstant)) {
        declaration.initializer = structuredClone(originalConstant);
        resolve(declaration.initializer, declaration.type);
      } else resolve(declaration.initializer, declaration.type);
      const abstractConstant = originalConstant && evaluateAbstract(originalConstant);
      globals.set(declaration.name, {
        abstractValue: abstractConstant
          ? {
              ...originalConstant!,
              kind: 'number',
              value:
                String(abstractConstant.value) +
                (abstractConstant.floating && Number.isInteger(abstractConstant.value) ? '.0' : '')
            }
          : undefined,
        constant: declaration.modifiers.includes('const'),
        integerConstant:
          declaration.modifiers.includes('const') && ['int', 'uint'].includes(declaration.type.name)
            ? integerConstant(declaration.initializer)
            : undefined,
        type: declaration.type,
        mutable: !declaration.modifiers.includes('const')
      });
    }
  }
  function prepareConstant(declaration: Variable): void {
    if (globals.has(declaration.name)) return;
    if (preparingConstants.has(declaration.name)) fail('Recursive constant', declaration.location);
    preparingConstants.add(declaration.name);
    analyzeGlobal(declaration);
    preparingConstants.delete(declaration.name);
    orderedConstants.push(declaration);
  }
  scopes = [globals];
  for (const declaration of program.declarations)
    if (declaration.kind === 'struct')
      declaration.fields.forEach(field => checkType(field.type, field.location));
  for (const declaration of program.declarations)
    if (declaration.kind === 'variable') {
      if (declaration.modifiers.includes('const')) prepareConstant(declaration);
      else analyzeGlobal(declaration);
    }
  // GLSL global constant initializers require their dependencies to be declared first.
  program.declarations = [
    ...orderedConstants,
    ...program.declarations.filter(
      declaration => declaration.kind !== 'variable' || !declaration.modifiers.includes('const')
    )
  ];
  // Resolve every signature before calls in any body are checked.
  for (const declaration of functions.values()) {
    checkType(declaration.type, declaration.location);
    declaration.parameters.forEach(parameter => {
      checkType(parameter.type, parameter.location);
      if (['Texture2D', 'SamplerState', 'ConstantBuffer'].includes(parameter.type.name))
        fail(
          'Resource parameters are outside this subset; use module bindings',
          parameter.location
        );
    });
  }
  for (const declaration of functions.values()) {
    const stage = declaration.attributes[0]?.arguments[0];
    if (
      !stage &&
      (declaration.interface || declaration.parameters.some(parameter => parameter.interface))
    )
      fail('Interface attributes require a shader entry point', declaration.location);
    if (stage) {
      for (const value of [
        ...declaration.parameters,
        {type: declaration.type, interface: declaration.interface}
      ]) {
        const structure = structures.get(value.type.name);
        if (
          structure &&
          (value.interface || structure.fields.some(field => structures.has(field.type.name)))
        )
          fail(
            'Entry interfaces require flat structs of scalar or vector fields',
            declaration.location
          );
      }
    }
    if (
      new Set(declaration.parameters.map(parameter => parameter.name)).size !==
      declaration.parameters.length
    )
      fail('Duplicate parameter', declaration.location);
    scopes = [
      globals,
      new Map(
        declaration.parameters.map(parameter => [
          parameter.name,
          {type: parameter.type, mutable: false}
        ])
      )
    ];
    statement(declaration.body, declaration.type);
  }
  const visitedFunctions = new Set<ShaderFunction>();
  function checkFunction(declaration: ShaderFunction, ancestors = new Set<ShaderFunction>()): void {
    if (ancestors.has(declaration))
      fail('Recursive functions are unsupported', declaration.location);
    if (visitedFunctions.has(declaration)) return;
    const visited = new Set(ancestors).add(declaration);
    function visit(value: unknown): void {
      if (!value || typeof value !== 'object') return;
      const node = value as Expression;
      if (node.resolvedCall?.kind === 'function')
        checkFunction(node.resolvedCall.declaration, visited);
      visitSyntaxChildren(value, visit);
    }
    visit(declaration.body);
    visitedFunctions.add(declaration);
  }
  functions.forEach(declaration => checkFunction(declaration));
}

export const lowerWGSLInterface: InterfaceLowerer = (
  variable,
  stage,
  direction,
  _locations,
  fail
) => {
  const metadata = variable.interface;
  if (!metadata || (!metadata.builtin && metadata.location === undefined))
    return fail('Entry point values require a builtin or location');
  const builtins: Record<string, {type: string; use: string}> = {
    position: {type: 'float4', use: 'vertex:out fragment:in'},
    vertex_index: {type: 'uint', use: 'vertex:in'},
    instance_index: {type: 'uint', use: 'vertex:in'},
    front_facing: {type: 'bool', use: 'fragment:in'},
    frag_depth: {type: 'float', use: 'fragment:out'}
  };
  if (
    metadata.interpolationSpecified &&
    !((stage === 'vertex' && direction === 'out') || (stage === 'fragment' && direction === 'in'))
  )
    return fail('Interpolation requires a varying interface');
  if (metadata.builtin === 'position' && stage === 'fragment')
    return fail('Fragment position requires viewport adaptation and is outside the initial subset');
  if (metadata.builtin) {
    const builtin = builtins[metadata.builtin];
    if (
      !builtin ||
      !builtin.use.split(' ').includes(`${stage}:${direction}`) ||
      builtin.type !== variable.type.name
    )
      return fail('Invalid builtin type or stage');
  }
  if (
    /^(int|uint)/.test(variable.type.name) &&
    ((stage === 'vertex' && direction === 'out') || (stage === 'fragment' && direction === 'in')) &&
    metadata.interpolation !== 'flat'
  )
    return fail('Integer varyings require flat interpolation');
  return metadata;
};
