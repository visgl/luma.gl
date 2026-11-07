// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {
  Expression,
  Program,
  ShaderFunction,
  SlangType,
  SourceLocation,
  Statement
} from './ast';
import type {InterfaceLowerer} from './expression-analysis';
import {SlangTranspileError} from './diagnostics';
import {visitSyntaxChildren} from './syntax';
import {lowerSlangType} from './slang-types';

/** Validate the bounded WGSL value subset before shared code generation. */
export function analyzeWGSL(program: Program, sourceName: string): void {
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
    structure.fields.forEach(field => checkStructure(field.type.name, visited));
    completed.add(name);
  }
  structures.forEach(structure => checkStructure(structure.name));
  type Binding = {type: SlangType; mutable: boolean};
  let scopes: Map<string, Binding>[] = [];
  function lookup(name: string, location: SourceLocation): Binding {
    for (const scope of [...scopes].reverse()) {
      const binding = scope.get(name);
      if (binding) return binding;
    }
    return fail(`Unknown identifier ${name}`, location);
  }
  const same = (left: SlangType, right: SlangType) => left.name === right.name;
  function evaluateAbstract(
    expression: Expression
  ): {value: number; floating: boolean} | undefined {
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
    if (expression.kind === 'binary') {
      if (['==', '!=', '<', '<=', '>', '>='].includes(expression.operator)) {
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
        const assignment = ['=', '+=', '-=', '*=', '/='].includes(expression.operator);
        if (assignment) {
          let root = expression.left;
          while (root.kind === 'member') root = root.object;
          if (root.kind !== 'identifier' || !lookup(root.value, root).mutable)
            fail('Assignment requires a mutable local', expression);
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
          type && /^(float|int|uint)[2-4]?$/.test(type.name)
            ? {name: type.name.replace(/[2-4]$/, '')}
            : undefined;
        const leftAbstract = evaluateAbstract(expression.left);
        const rightAbstract = evaluateAbstract(expression.right);
        if (leftAbstract && !rightAbstract) {
          right = resolve(expression.right);
          left = resolve(expression.left, scalarContext(right));
        } else {
          left = resolve(
            expression.left,
            leftAbstract
              ? rightAbstract
                ? {name: leftAbstract.floating || rightAbstract.floating ? 'float' : 'int'}
                : scalarContext(operandExpected)
              : undefined
          );
          right = resolve(expression.right, rightAbstract ? scalarContext(left) : undefined);
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
        if (['/', '/=', '%'].includes(expression.operator) && /^(int|uint)/.test(left.name))
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
          ['&', '|', '^', '%'].includes(expression.operator) &&
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
            fail('Zero-argument constructors are outside the initial subset', expression);
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
            if (numeric[2] && shape[1] !== numeric[1])
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
  function statement(node: Statement, returnType: SlangType): void {
    if (node.kind === 'block') {
      scopes.push(new Map());
      node.statements.forEach(child => statement(child, returnType));
      scopes.pop();
    } else if (node.kind === 'variable') {
      const variable = node.variable;
      if (scopes.at(-1)!.has(variable.name)) fail('Duplicate local', variable.location);
      variable.initializer ||= zero(variable.type, variable.location);
      variable.type = resolve(
        variable.initializer,
        variable.type.name === '$inferred' ? undefined : variable.type
      );
      scopes
        .at(-1)!
        .set(variable.name, {type: variable.type, mutable: !variable.modifiers.includes('let')});
    } else if (node.kind === 'return') {
      if (node.expression) resolve(node.expression, returnType);
      else if (returnType.name !== 'void') fail('Return value required', node);
    } else if (node.kind === 'expression') {
      if (
        node.expression.kind !== 'call' &&
        !(
          node.expression.kind === 'binary' &&
          ['=', '+=', '-=', '*=', '/='].includes(node.expression.operator)
        )
      )
        fail('Invalid expression statement', node);
      resolve(node.expression);
    } else fail('Unsupported WGSL statement', node);
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
