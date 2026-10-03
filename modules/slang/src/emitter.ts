// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {
  Expression,
  Program,
  ShaderFunction,
  SlangType,
  SourceLocation,
  Statement,
  Structure,
  Variable
} from './ast';
import {SlangTranspileError} from './diagnostics';
import type {
  SlangInterfaceVariable,
  SlangReflection,
  SlangShaderStage,
  SlangTranspileOptions,
  SlangTranspileResult
} from './types';

type Symbol = {type: SlangType; code: string; writable: boolean};
type InterfaceLeaf = {
  variable: Variable;
  path: string[];
  field: string;
  reflection: SlangInterfaceVariable;
};
const SCALARS: Record<string, string> = {float: 'f32', int: 'i32', uint: 'u32', bool: 'bool'};
const INTRINSICS: Record<string, number[]> = {
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
const BUILTINS: Record<string, {wgsl: string; glsl: string; stages: string[]; type: string}> = {
  SV_POSITION: {
    wgsl: 'position',
    glsl: 'gl_Position',
    stages: ['vertex:out', 'fragment:in'],
    type: 'float4'
  },
  SV_VERTEXID: {wgsl: 'vertex_index', glsl: 'gl_VertexID', stages: ['vertex:in'], type: 'uint'},
  SV_INSTANCEID: {
    wgsl: 'instance_index',
    glsl: 'gl_InstanceID',
    stages: ['vertex:in'],
    type: 'uint'
  },
  SV_ISFRONTFACE: {
    wgsl: 'front_facing',
    glsl: 'gl_FrontFacing',
    stages: ['fragment:in'],
    type: 'bool'
  },
  SV_DEPTH: {wgsl: 'frag_depth', glsl: 'gl_FragDepth', stages: ['fragment:out'], type: 'float'},
  SV_DISPATCHTHREADID: {
    wgsl: 'global_invocation_id',
    glsl: 'gl_GlobalInvocationID',
    stages: ['compute:in'],
    type: 'uint3'
  },
  SV_GROUPID: {wgsl: 'workgroup_id', glsl: 'gl_WorkGroupID', stages: ['compute:in'], type: 'uint3'},
  SV_GROUPTHREADID: {
    wgsl: 'local_invocation_id',
    glsl: 'gl_LocalInvocationID',
    stages: ['compute:in'],
    type: 'uint3'
  },
  SV_GROUPINDEX: {
    wgsl: 'local_invocation_index',
    glsl: 'gl_LocalInvocationIndex',
    stages: ['compute:in'],
    type: 'uint'
  }
};

export class SlangEmitter {
  private structures = new Map<string, Structure>();
  private functions = new Map<string, ShaderFunction>();
  private scopes: Map<string, Symbol>[] = [new Map()];
  private reflection: SlangReflection = {inputs: [], outputs: [], bindings: []};
  private locations = new Map<string, number>();
  private entry: ShaderFunction;
  private stage: SlangShaderStage;
  private glslVersion: '300 es' | '450';
  private inputs: InterfaceLeaf[] = [];
  private outputs: InterfaceLeaf[] = [];
  private currentFunction?: ShaderFunction;
  private loopDepth = 0;
  private callGraph = new Map<string, Set<string>>();
  private reservedBindings = new Set<string>();
  private sampledTextures = new Map<string, string>();

  constructor(
    private program: Program,
    private options: SlangTranspileOptions
  ) {
    const names = new Set<string>();
    for (const declaration of program.declarations) {
      if (names.has(declaration.name)) {
        this.fail(
          `Duplicate declaration ${declaration.name}; function overloads are not supported`,
          declaration.location
        );
      }
      names.add(declaration.name);
      if (declaration.kind === 'variable') {
        const attribute = declaration.attributes.find(
          attribute => attribute.name === 'vk::binding'
        );
        const binding =
          attribute?.arguments.length === 2
            ? {binding: Number(attribute.arguments[0]), group: Number(attribute.arguments[1])}
            : declaration.binding;
        if (binding) {
          this.reservedBindings.add(`${binding.group}:${binding.binding}`);
        }
      }
      if (declaration.kind === 'struct') {
        this.structures.set(declaration.name, declaration);
      }
      if (declaration.kind === 'function') {
        this.functions.set(declaration.name, declaration);
      }
    }
    const candidates = [...this.functions.values()].filter(declaration =>
      declaration.attributes.some(attribute => attribute.name === 'shader')
    );
    if (!options.entryPoint && candidates.length > 1) {
      this.fail(
        'Multiple shader entry points require an explicit entryPoint option',
        candidates[0].location
      );
    }
    const selected = options.entryPoint
      ? this.functions.get(options.entryPoint)
      : candidates.length === 1
        ? candidates[0]
        : this.functions.get('main');
    if (!selected) {
      this.fail('Select an existing shader entry point', {offset: 0, line: 1, column: 1});
    }
    this.entry = selected;
    const shaderAttribute = selected.attributes.find(attribute => attribute.name === 'shader');
    const declaredStage = shaderAttribute?.arguments[0];
    const stage = options.stage || declaredStage;
    if (stage !== 'vertex' && stage !== 'fragment' && stage !== 'compute') {
      this.fail('Specify a vertex, fragment, or compute shader stage', selected.location);
    }
    if (declaredStage && options.stage && declaredStage !== options.stage) {
      this.fail('Shader stage conflicts with the [shader] attribute', selected.location);
    }
    this.stage = stage;
    this.glslVersion = options.glslVersion || (stage === 'compute' ? '450' : '300 es');
    if (options.target !== 'glsl' && options.target !== 'wgsl') {
      this.fail('Unsupported shader target', selected.location);
    }
    if (this.glslVersion !== '450' && this.glslVersion !== '300 es') {
      this.fail('Unsupported GLSL version', selected.location);
    }
    if (options.target === 'glsl' && this.stage === 'compute' && this.glslVersion !== '450') {
      this.fail('Compute shaders require GLSL 450', selected.location);
    }
    const semantics = new Set<string>();
    for (const declaration of program.declarations) {
      const variables =
        declaration.kind === 'struct'
          ? declaration.fields
          : declaration.kind === 'function'
            ? declaration.parameters
            : [declaration];
      for (const variable of variables) {
        if (variable.semantic && !variable.semantic.toUpperCase().startsWith('SV_')) {
          semantics.add(variable.semantic.toUpperCase());
        }
      }
      if (
        declaration.kind === 'function' &&
        declaration.semantic &&
        !declaration.semantic.toUpperCase().startsWith('SV_')
      ) {
        semantics.add(declaration.semantic.toUpperCase());
      }
    }
    const usedLocations = new Set<number>();
    for (const [semantic, location] of Object.entries(options.locations || {})) {
      if (!Number.isInteger(location) || location < 0) {
        this.fail('Semantic locations must be nonnegative integers', selected.location);
      }
      this.locations.set(semantic.toUpperCase(), location);
      usedLocations.add(location);
    }
    let nextLocation = 0;
    for (const semantic of [...semantics].sort()) {
      if (this.locations.has(semantic)) {
        continue;
      }
      while (usedLocations.has(nextLocation)) {
        nextLocation++;
      }
      this.locations.set(semantic, nextLocation);
      usedLocations.add(nextLocation++);
    }
  }
  private get isWGSL(): boolean {
    return this.options.target === 'wgsl';
  }
  private fail(message: string, location: SourceLocation): never {
    throw new SlangTranspileError(message, location, this.options.sourceName);
  }
  private getName(name: string): string {
    return `_slang_${name}`;
  }
  private getTypeName(type: SlangType, location: SourceLocation = this.entry.location): string {
    if (type.name === 'void') {
      return 'void';
    }
    if (type.name === 'array' && type.element) {
      return this.isWGSL
        ? `array<${this.getTypeName(type.element, location)}, ${type.length}>`
        : this.getTypeName(type.element, location);
    }
    if (type.element) {
      this.fail(`Unsupported value type ${type.name}`, location);
    }
    if (SCALARS[type.name]) {
      return this.isWGSL ? SCALARS[type.name] : type.name;
    }
    const vector = /^(float|int|uint|bool)([2-4])$/.exec(type.name);
    if (vector) {
      return this.isWGSL
        ? `vec${vector[2]}<${SCALARS[vector[1]]}>`
        : `${{float: '', int: 'i', uint: 'u', bool: 'b'}[vector[1]]}vec${vector[2]}`;
    }
    const matrix = /^float([2-4])x([2-4])$/.exec(type.name);
    // Slang matrix indexing is by row. Represent rows as target columns and reverse mul.
    if (matrix) {
      return this.isWGSL ? `mat${matrix[1]}x${matrix[2]}<f32>` : `mat${matrix[1]}x${matrix[2]}`;
    }
    if (this.structures.has(type.name)) {
      return `_slang_type_${type.name}`;
    }
    this.fail(`Unsupported type ${type.name}`, location);
  }
  private getDeclaration(type: SlangType, name: string, location: SourceLocation): string {
    if (this.isWGSL) {
      return `${name}: ${this.getTypeName(type, location)}`;
    }
    const lengths: number[] = [];
    while (type.name === 'array' && type.element) {
      lengths.push(type.length!);
      type = type.element;
    }
    return `${this.getTypeName(type, location)} ${name}${lengths.map(length => `[${length}]`).join('')}`;
  }
  private findSymbol(name: string, location: SourceLocation): Symbol {
    for (const scope of [...this.scopes].reverse()) {
      const symbol = scope.get(name);
      if (symbol) {
        return symbol;
      }
    }
    this.fail(`Unknown identifier ${name}`, location);
  }
  private addSymbol(
    variable: Variable,
    code = this.getName(variable.name),
    writable = !variable.modifiers.includes('const')
  ): void {
    const scope = this.scopes[this.scopes.length - 1];
    if (scope.has(variable.name)) {
      this.fail(`Duplicate variable ${variable.name}`, variable.location);
    }
    scope.set(variable.name, {type: variable.type, code, writable});
  }
  private getExpressionType(expression: Expression): SlangType {
    switch (expression.kind) {
      case 'identifier':
        return this.findSymbol(expression.value, expression).type;
      case 'number':
        return {
          name: /u$/i.test(expression.value)
            ? 'uint'
            : /[.eEfF]/.test(expression.value) && !/^0x/i.test(expression.value)
              ? 'float'
              : 'int'
        };
      case 'boolean':
        return {name: 'bool'};
      case 'cast':
        return expression.type;
      case 'unary':
        return expression.operator === '!'
          ? {name: 'bool'}
          : this.getExpressionType(expression.operand);
      case 'binary': {
        const left = this.getExpressionType(expression.left);
        const right = this.getExpressionType(expression.right);
        if (['==', '!=', '<', '>', '<=', '>=', '&&', '||'].includes(expression.operator)) {
          return {name: 'bool'};
        }
        if (
          this.isScalar(left) &&
          this.isScalar(right) &&
          (left.name === 'float' || right.name === 'float')
        ) {
          return {name: 'float'};
        }
        return this.isScalar(left) && !this.isScalar(right) ? right : left;
      }
      case 'conditional':
        return this.getExpressionType(expression.consequent);
      case 'member': {
        const object = this.getExpressionType(expression.object);
        const structure = this.structures.get(
          object.name === 'ConstantBuffer' ? object.element!.name : object.name
        );
        if (structure) {
          const field = structure.fields.find(variable => variable.name === expression.member);
          if (!field) {
            this.fail(`Unknown field ${expression.member}`, expression);
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
            this.fail('Swizzle is outside the vector width', expression);
          }
          if (/[xyzw]/.test(expression.member) && /[rgba]/.test(expression.member)) {
            this.fail('Swizzle cannot mix component sets', expression);
          }
          return {name: vector[1] + (expression.member.length > 1 ? expression.member.length : '')};
        }
        this.fail(`Unsupported member ${expression.member} on ${object.name}`, expression);
      }
      case 'index': {
        const object = this.getExpressionType(expression.object);
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
        this.fail(`Cannot index ${object.name}`, expression);
      }
      case 'call': {
        if (expression.callee.kind === 'member') {
          const resource = this.getExpressionType(expression.callee.object);
          if (resource.name === 'Texture2D') {
            return {name: 'float4'};
          }
          this.fail('Unsupported resource method', expression);
        }
        if (expression.callee.kind !== 'identifier') {
          this.fail('Unsupported function expression', expression);
        }
        const name = expression.callee.value;
        if (this.functions.has(name)) {
          return this.functions.get(name)!.type;
        }
        if (this.isValueType(name)) {
          return {name};
        }
        if (['dot', 'length', 'distance'].includes(name)) {
          return {name: 'float'};
        }
        if (['all', 'any'].includes(name)) {
          return {name: 'bool'};
        }
        if (name === 'GroupMemoryBarrierWithGroupSync') {
          return {name: 'void'};
        }
        if (name === 'transpose') {
          const matrix = /^float([2-4])x([2-4])$/.exec(
            this.getExpressionType(expression.arguments[0]).name
          );
          if (!matrix) {
            this.fail('transpose requires a matrix', expression);
          }
          return {name: `float${matrix[2]}x${matrix[1]}`};
        }
        if (name === 'mul') {
          const left = this.getExpressionType(expression.arguments[0]);
          const right = this.getExpressionType(expression.arguments[1]);
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
          if (!this.isScalar(left) && !this.isScalar(right)) {
            return {name: 'float'};
          }
          return this.isScalar(left) ? right : left;
        }
        if (!INTRINSICS[name]) {
          this.fail(`Unsupported function ${name}`, expression);
        }
        if (['clamp', 'min', 'max', 'lerp', 'step', 'smoothstep', 'pow', 'atan2'].includes(name)) {
          return this.getCommonType(expression.arguments);
        }
        return this.getExpressionType(expression.arguments[0]);
      }
    }
  }
  private getCommonType(expressions: Expression[]): SlangType {
    const types = expressions.map(expression => this.getExpressionType(expression));
    const vector = types.find(type => /^(float|int|uint)[2-4]$/.test(type.name));
    const scalar = types.some(type => type.name.startsWith('float'))
      ? 'float'
      : types.some(type => type.name.startsWith('uint'))
        ? 'uint'
        : 'int';
    return {name: scalar + (vector ? vector.name.slice(-1) : '')};
  }
  private isScalar(type: SlangType): boolean {
    return Boolean(SCALARS[type.name]);
  }
  private isValueType(name: string): boolean {
    return (
      Boolean(SCALARS[name]) ||
      /^(float|int|uint|bool)[2-4]$/.test(name) ||
      /^float[2-4]x[2-4]$/.test(name) ||
      this.structures.has(name)
    );
  }
  private matchType(left: SlangType, right: SlangType): boolean {
    return (
      left.name === right.name &&
      left.length === right.length &&
      (left.element && right.element
        ? this.matchType(left.element, right.element)
        : !left.element && !right.element)
    );
  }
  private coerceExpression(expression: Expression, expected: SlangType): string {
    const code = this.emitExpression(expression);
    const actual = this.getExpressionType(expression);
    if (this.matchType(expected, actual)) {
      return code;
    }
    if (
      this.isScalar(expected) &&
      this.isScalar(actual) &&
      expected.name !== 'bool' &&
      actual.name !== 'bool'
    ) {
      return `${this.getTypeName(expected)}(${code})`;
    }
    if (/^(float|int|uint|bool)[2-4]$/.test(expected.name) && this.isScalar(actual)) {
      const scalar = {name: expected.name.replace(/[2-4]$/, '')};
      return `${this.getTypeName(expected)}(${this.coerceExpression(expression, scalar)})`;
    }
    const expectedVector = /^(float|int|uint)([2-4])$/.exec(expected.name);
    const actualVector = /^(float|int|uint)([2-4])$/.exec(actual.name);
    if (expectedVector && actualVector && expectedVector[2] === actualVector[2]) {
      return `${this.getTypeName(expected)}(${code})`;
    }
    this.fail(`Cannot convert ${actual.name} to ${expected.name}`, expression);
  }
  private checkWritable(expression: Expression): void {
    if (expression.kind === 'identifier') {
      if (!this.findSymbol(expression.value, expression).writable) {
        this.fail('Cannot write an immutable value', expression);
      }
      return;
    }
    if (expression.kind === 'index' || expression.kind === 'member') {
      if (
        expression.kind === 'member' &&
        !this.structures.has(this.getExpressionType(expression.object).name) &&
        this.isWGSL &&
        expression.member.length > 1
      ) {
        this.fail('WGSL does not support assigning to a vector swizzle', expression);
      }
      this.checkWritable(expression.object);
      return;
    }
    this.fail('Assignment requires a writable variable', expression);
  }
  private emitExpression(expression: Expression): string {
    switch (expression.kind) {
      case 'identifier':
        return this.findSymbol(expression.value, expression).code;
      case 'boolean':
        return expression.value;
      case 'number': {
        const value = (
          /^0x/i.test(expression.value) ? expression.value : expression.value.replace(/[fF]$/, '')
        ).replace(/U$/, 'u');
        if (this.getExpressionType(expression).name === 'float' && !/[.eE]/.test(value)) {
          return `${value}.0`;
        }
        return value.startsWith('.') ? `0${value}` : value.endsWith('.') ? `${value}0` : value;
      }
      case 'cast':
        return `${this.getTypeName(expression.type, expression)}(${this.emitExpression(expression.operand)})`;
      case 'unary':
        if (['++', '--'].includes(expression.operator)) {
          this.fail(
            'Increment and decrement are supported only as statements and for-loop updates',
            expression
          );
        }
        return `(${expression.operator}${this.emitExpression(expression.operand)})`;
      case 'member': {
        this.getExpressionType(expression);
        const objectType = this.getExpressionType(expression.object);
        const structure =
          this.structures.has(objectType.name) || objectType.name === 'ConstantBuffer';
        return `${this.emitExpression(expression.object)}.${structure ? this.getName(expression.member) : expression.member}`;
      }
      case 'index': {
        const objectType = this.getExpressionType(expression.object);
        this.getExpressionType(expression);
        const indexType = this.getExpressionType(expression.index);
        if (!['int', 'uint'].includes(indexType.name)) {
          this.fail('Index expressions require an integer scalar', expression.index);
        }
        const object = this.emitExpression(expression.object);
        return `${object}${!this.isWGSL && /StructuredBuffer$/.test(objectType.name) ? '._slang_data' : ''}[${this.emitExpression(expression.index)}]`;
      }
      case 'conditional':
        if (this.isWGSL) {
          this.fail(
            'Conditional expressions require control-flow lowering for WGSL; use if/else',
            expression
          );
        }
        return `(${this.emitExpression(expression.condition)} ? ${this.emitExpression(expression.consequent)} : ${this.emitExpression(expression.alternate)})`;
      case 'binary': {
        const leftType = this.getExpressionType(expression.left);
        const rightType = this.getExpressionType(expression.right);
        const assignment = ['=', '+=', '-=', '*=', '/=', '%='].includes(expression.operator);
        if (assignment) {
          this.fail(
            'Assignments are supported only as statements and for-loop updates',
            expression
          );
        }
        let left = this.emitExpression(expression.left);
        let right = this.emitExpression(expression.right);
        const comparisons = ['==', '!=', '<', '>', '<=', '>='].includes(expression.operator);
        if (comparisons && (!this.isScalar(leftType) || !this.isScalar(rightType))) {
          this.fail('Vector comparisons require explicit all/any lowering', expression);
        }
        if (
          this.isScalar(leftType) &&
          this.isScalar(rightType) &&
          leftType.name !== rightType.name
        ) {
          const common =
            leftType.name === 'float' || rightType.name === 'float' ? {name: 'float'} : leftType;
          left = this.coerceExpression(expression.left, common);
          right = this.coerceExpression(expression.right, common);
        } else if (this.isScalar(leftType) !== this.isScalar(rightType)) {
          const vectorType = this.isScalar(leftType) ? rightType : leftType;
          if (!/^(float|int|uint|bool)[2-4]$/.test(vectorType.name)) {
            this.fail('Scalar/matrix arithmetic is not supported', expression);
          }
          if (this.isScalar(leftType)) {
            left = this.coerceExpression(expression.left, vectorType);
          } else {
            right = this.coerceExpression(expression.right, vectorType);
          }
        }
        if (/^float[2-4]x[2-4]$/.test(leftType.name) && expression.operator === '*') {
          if (this.isWGSL) {
            this.fail(
              'Component-wise matrix multiplication requires lowering in WGSL; use mul for linear algebra',
              expression
            );
          }
          return `matrixCompMult(${left}, ${right})`;
        }
        if (expression.operator === '%' && leftType.name.startsWith('float')) {
          this.fail('Floating-point remainder requires target-specific lowering', expression);
        }
        return `(${left} ${expression.operator} ${right})`;
      }
      case 'call':
        return this.emitCall(expression);
    }
  }
  private emitCall(expression: Expression & {kind: 'call'}): string {
    const callee = expression.callee;
    if (callee.kind === 'member') {
      const resourceType = this.getExpressionType(callee.object);
      if (resourceType.name !== 'Texture2D' || resourceType.element?.name !== 'float4') {
        this.fail('Only Texture2D<float4> methods are supported', expression);
      }
      const texture = this.emitExpression(callee.object);
      if (callee.member === 'Load' && expression.arguments.length === 1) {
        const coordinate = this.coerceExpression(expression.arguments[0], {name: 'int3'});
        return this.isWGSL
          ? `textureLoad(${texture}, (${coordinate}).xy, (${coordinate}).z)`
          : `texelFetch(${texture}, (${coordinate}).xy, (${coordinate}).z)`;
      }
      if (
        !['Sample', 'SampleLevel'].includes(callee.member) ||
        expression.arguments.length !== (callee.member === 'Sample' ? 2 : 3)
      ) {
        this.fail('Supported texture methods are Sample, SampleLevel, and Load', expression);
      }
      if (callee.member === 'Sample' && this.stage !== 'fragment') {
        this.fail('Implicit derivative sampling requires a fragment shader', expression);
      }
      const samplerType = this.getExpressionType(expression.arguments[0]);
      if (samplerType.name !== 'SamplerState') {
        this.fail('Texture sampling requires a SamplerState', expression);
      }
      const sampler = this.emitExpression(expression.arguments[0]);
      const coordinates = this.coerceExpression(expression.arguments[1], {name: 'float2'});
      const level =
        callee.member === 'SampleLevel'
          ? `, ${this.coerceExpression(expression.arguments[2], {name: 'float'})}`
          : '';
      if (this.isWGSL) {
        return `${level ? 'textureSampleLevel' : 'textureSample'}(${texture}, ${sampler}, ${coordinates}${level})`;
      }
      const previousSampler = this.sampledTextures.get(texture);
      if (previousSampler && previousSampler !== sampler) {
        this.fail('GLSL combined textures require one sampler per texture', expression);
      }
      this.sampledTextures.set(texture, sampler);
      return `${level ? 'textureLod' : 'texture'}(${texture}, ${coordinates}${level})`;
    }
    if (callee.kind !== 'identifier') {
      this.fail('Unsupported function expression', expression);
    }
    const name = callee.value;
    const declaration = this.functions.get(name);
    if (declaration) {
      if (expression.arguments.length !== declaration.parameters.length) {
        this.fail(`Wrong number of arguments for ${name}`, expression);
      }
      if (this.currentFunction) {
        const calls = this.callGraph.get(this.currentFunction.name) || new Set<string>();
        calls.add(name);
        this.callGraph.set(this.currentFunction.name, calls);
      }
      return `_slang_function_${name}(${expression.arguments.map((argument, index) => this.coerceExpression(argument, declaration.parameters[index].type)).join(', ')})`;
    }
    if (this.isValueType(name)) {
      const structure = this.structures.get(name);
      if (structure) {
        if (expression.arguments.length !== structure.fields.length) {
          this.fail('A structure constructor requires one argument per field', expression);
        }
        return `${this.getTypeName({name})}(${expression.arguments.map((argument, index) => this.coerceExpression(argument, structure.fields[index].type)).join(', ')})`;
      }
      const matrix = /^float([2-4])x([2-4])$/.exec(name);
      const vector = /^(float|int|uint|bool)([2-4])$/.exec(name);
      if (matrix) {
        if (expression.arguments.length !== Number(matrix[1]) * Number(matrix[2])) {
          this.fail('Matrix constructors require all scalar elements in row order', expression);
        }
        const rows: string[] = [];
        for (let row = 0; row < Number(matrix[1]); row++) {
          rows.push(
            `${this.getTypeName({name: `float${matrix[2]}`})}(${expression.arguments
              .slice(row * Number(matrix[2]), (row + 1) * Number(matrix[2]))
              .map(argument => this.coerceExpression(argument, {name: 'float'}))
              .join(', ')})`
          );
        }
        return `${this.getTypeName({name})}(${rows.join(', ')})`;
      }
      if (vector) {
        let width = 0;
        const argumentsList = expression.arguments.map(argument => {
          const type = this.getExpressionType(argument);
          const argumentVector = /^(float|int|uint|bool)([2-4])$/.exec(type.name);
          width += argumentVector ? Number(argumentVector[2]) : 1;
          return this.coerceExpression(argument, {
            name: vector[1] + (argumentVector ? argumentVector[2] : '')
          });
        });
        if (width !== Number(vector[2]) && !(expression.arguments.length === 1 && width === 1)) {
          this.fail('Vector constructor has the wrong component count', expression);
        }
        return `${this.getTypeName({name})}(${argumentsList.join(', ')})`;
      }
      if (expression.arguments.length !== 1) {
        this.fail('Scalar constructors require one argument', expression);
      }
      return `${this.getTypeName({name})}(${this.emitExpression(expression.arguments[0])})`;
    }
    if (!INTRINSICS[name] || !INTRINSICS[name].includes(expression.arguments.length)) {
      this.fail(`Unsupported function or argument count: ${name}`, expression);
    }
    if (['ddx', 'ddy', 'fwidth'].includes(name) && this.stage !== 'fragment') {
      this.fail('Derivatives require a fragment shader', expression);
    }
    const argumentsList = expression.arguments.map(argument => this.emitExpression(argument));
    if (name === 'mul') {
      const left = this.getExpressionType(expression.arguments[0]);
      const right = this.getExpressionType(expression.arguments[1]);
      if (/x[2-4]$/.test(left.name) || /x[2-4]$/.test(right.name)) {
        return `(${argumentsList[1]} * ${argumentsList[0]})`;
      }
      if (!this.isScalar(left) && !this.isScalar(right)) {
        return `dot(${argumentsList.join(', ')})`;
      }
      return `(${argumentsList[0]} * ${argumentsList[1]})`;
    }
    if (name === 'saturate') {
      const type = this.getExpressionType(expression.arguments[0]);
      const targetType = this.getTypeName(type);
      return `clamp(${argumentsList[0]}, ${targetType}(0.0), ${targetType}(1.0))`;
    }
    if (name === 'GroupMemoryBarrierWithGroupSync') {
      if (this.stage !== 'compute') {
        this.fail('Workgroup barriers require a compute shader', expression);
      }
      return this.isWGSL ? 'workgroupBarrier()' : 'barrier()';
    }
    const mappings: Record<string, string> = this.isWGSL
      ? {lerp: 'mix', frac: 'fract', rsqrt: 'inverseSqrt', ddx: 'dpdx', ddy: 'dpdy'}
      : {lerp: 'mix', frac: 'fract', rsqrt: 'inversesqrt', ddx: 'dFdx', ddy: 'dFdy', atan2: 'atan'};
    const expected = this.getCommonType(expression.arguments);
    if (['clamp', 'min', 'max', 'lerp', 'step', 'smoothstep', 'pow', 'atan2'].includes(name)) {
      for (let index = 0; index < argumentsList.length; index++) {
        argumentsList[index] = this.coerceExpression(expression.arguments[index], expected);
      }
    }
    return `${mappings[name] || name}(${argumentsList.join(', ')})`;
  }
  private emitUpdate(expression: Expression): string {
    if (expression.kind === 'unary' && ['++', '--'].includes(expression.operator)) {
      this.checkWritable(expression.operand);
      const type = this.getExpressionType(expression.operand);
      return `${this.emitExpression(expression.operand)} ${expression.operator === '++' ? '+=' : '-='} ${type.name === 'uint' ? '1u' : type.name === 'float' ? '1.0' : '1'}`;
    }
    if (
      expression.kind === 'binary' &&
      ['=', '+=', '-=', '*=', '/=', '%='].includes(expression.operator)
    ) {
      this.checkWritable(expression.left);
      return `${this.emitExpression(expression.left)} ${expression.operator} ${this.coerceExpression(expression.right, this.getExpressionType(expression.left))}`;
    }
    if (expression.kind !== 'call') {
      this.fail(
        'Expression statements must be assignments, increments, or function calls',
        expression
      );
    }
    return this.emitExpression(expression);
  }
  private emitLocal(variable: Variable): string {
    if (
      variable.attributes.length ||
      variable.semantic ||
      variable.binding ||
      variable.modifiers.some(modifier => modifier !== 'const')
    ) {
      this.fail('Unsupported local variable metadata', variable.location);
    }
    if (variable.type.name === 'void') {
      this.fail('A variable cannot have void type', variable.location);
    }
    const name = this.getName(variable.name);
    const constant = variable.modifiers.includes('const');
    if (constant && !variable.initializer) {
      this.fail('Constants require an initializer', variable.location);
    }
    const initializer = variable.initializer
      ? ` = ${this.coerceExpression(variable.initializer, variable.type)}`
      : '';
    this.addSymbol(variable);
    return `${this.isWGSL ? (constant ? 'let ' : 'var ') : constant ? 'const ' : ''}${this.getDeclaration(variable.type, name, variable.location)}${initializer}`;
  }
  private emitBlock(statement: Statement): string {
    this.scopes.push(new Map());
    const code =
      statement.kind === 'block'
        ? statement.statements.map(child => this.emitStatement(child)).join('\n')
        : this.emitStatement(statement);
    this.scopes.pop();
    return `{\n${code
      .split('\n')
      .filter(Boolean)
      .map(line => `  ${line}`)
      .join('\n')}\n}`;
  }
  private emitStatement(statement: Statement): string {
    switch (statement.kind) {
      case 'block':
        return this.emitBlock(statement);
      case 'empty':
        return '';
      case 'variable':
        return `${this.emitLocal(statement.variable)};`;
      case 'expression':
        return `${this.emitUpdate(statement.expression)};`;
      case 'return': {
        const type = this.currentFunction!.type;
        if (
          (statement.expression && type.name === 'void') ||
          (!statement.expression && type.name !== 'void')
        ) {
          this.fail('Return value does not match the function return type', statement);
        }
        return statement.expression
          ? `return ${this.coerceExpression(statement.expression, type)};`
          : 'return;';
      }
      case 'if':
        return `if (${this.coerceExpression(statement.condition, {name: 'bool'})}) ${this.emitBlock(statement.consequent)}${statement.alternate ? ` else ${this.emitBlock(statement.alternate)}` : ''}`;
      case 'while': {
        const condition = this.coerceExpression(statement.condition, {name: 'bool'});
        this.loopDepth++;
        const body = this.emitBlock(statement.body);
        this.loopDepth--;
        return `while (${condition}) ${body}`;
      }
      case 'for': {
        this.scopes.push(new Map());
        const initializer = statement.initializer
          ? this.emitStatement(statement.initializer).replace(/;$/, '')
          : '';
        const condition = statement.condition
          ? this.coerceExpression(statement.condition, {name: 'bool'})
          : '';
        const update = statement.update ? this.emitUpdate(statement.update) : '';
        this.loopDepth++;
        const body = this.emitBlock(statement.body);
        this.loopDepth--;
        this.scopes.pop();
        return `for (${initializer}; ${condition}; ${update}) ${body}`;
      }
      case 'break':
      case 'continue':
        if (!this.loopDepth) {
          this.fail(`${statement.kind} requires a loop`, statement);
        }
        return `${statement.kind};`;
      case 'discard':
        if (this.stage !== 'fragment') {
          this.fail('discard requires a fragment shader', statement);
        }
        return 'discard;';
    }
  }
  private emitStructure(structure: Structure): string {
    const names = new Set<string>();
    return `struct _slang_type_${structure.name} {\n${structure.fields
      .map(field => {
        if (names.has(field.name)) {
          this.fail('Duplicate structure field', field.location);
        }
        names.add(field.name);
        if (
          field.attributes.length ||
          field.initializer ||
          field.binding ||
          field.modifiers.some(
            modifier =>
              !['nointerpolation', 'linear', 'centroid', 'sample', 'noperspective'].includes(
                modifier
              )
          )
        ) {
          this.fail('Unsupported structure field metadata', field.location);
        }
        if (field.type.name === 'void') {
          this.fail('Structure fields cannot have void type', field.location);
        }
        return `  ${this.getDeclaration(field.type, this.getName(field.name), field.location)}${this.isWGSL ? ',' : ';'}`;
      })
      .join('\n')}\n}${this.isWGSL ? '' : ';'}`;
  }
  private emitGlobal(variable: Variable): string {
    if (variable.type.name === 'void') {
      this.fail('Variables cannot have void type', variable.location);
    }
    if (variable.semantic) {
      this.fail('Global variable semantics are not supported', variable.location);
    }
    const resourceNames = [
      'ConstantBuffer',
      'StructuredBuffer',
      'RWStructuredBuffer',
      'Texture2D',
      'SamplerState'
    ];
    const name = this.getName(variable.name);
    if (
      !resourceNames.includes(variable.type.name) &&
      (variable.modifiers.includes('static') ||
        variable.modifiers.includes('const') ||
        variable.modifiers.includes('groupshared'))
    ) {
      if (
        variable.attributes.length ||
        variable.binding ||
        variable.modifiers.includes('uniform')
      ) {
        this.fail('Unsupported global metadata', variable.location);
      }
      const shared = variable.modifiers.includes('groupshared');
      const constant = variable.modifiers.includes('const');
      if (shared && this.stage !== 'compute') {
        this.fail('groupshared requires a compute shader', variable.location);
      }
      if (constant && !variable.initializer) {
        this.fail('Constants require an initializer', variable.location);
      }
      if (shared && variable.initializer) {
        this.fail('groupshared initializers are not supported', variable.location);
      }
      const initializer = variable.initializer
        ? ` = ${this.coerceExpression(variable.initializer, variable.type)}`
        : '';
      this.addSymbol(variable, name, !constant);
      return `${this.isWGSL ? (shared ? 'var<workgroup> ' : constant ? 'const ' : 'var<private> ') : shared ? 'shared ' : constant ? 'const ' : ''}${this.getDeclaration(variable.type, name, variable.location)}${initializer};`;
    }
    if (variable.initializer) {
      this.fail('Shader resources cannot have initializers', variable.location);
    }
    if (variable.modifiers.some(modifier => !['uniform', 'cbuffer'].includes(modifier))) {
      this.fail('Unsupported resource modifier', variable.location);
    }
    const bindingAttribute = variable.attributes.find(
      attribute => attribute.name === 'vk::binding'
    );
    if (
      variable.attributes.some(attribute => attribute.name !== 'vk::binding') ||
      variable.attributes.length > 1
    ) {
      this.fail('Unsupported resource attribute', variable.location);
    }
    let binding = variable.binding || {group: 0, binding: 0};
    if (bindingAttribute) {
      if (
        bindingAttribute.arguments.length !== 2 ||
        !bindingAttribute.arguments.every(argument => /^\d+$/.test(argument))
      ) {
        this.fail(
          'vk::binding requires binding and group integer literals',
          bindingAttribute.location
        );
      }
      binding = {
        binding: Number(bindingAttribute.arguments[0]),
        group: Number(bindingAttribute.arguments[1])
      };
    } else if (!variable.binding) {
      while (
        this.reflection.bindings.some(
          resource => resource.group === 0 && resource.binding === binding.binding
        ) ||
        this.reservedBindings.has(`0:${binding.binding}`)
      ) {
        binding.binding++;
      }
    }
    if (
      this.reflection.bindings.some(
        resource => resource.group === binding.group && resource.binding === binding.binding
      )
    ) {
      this.fail(
        'Duplicate resource binding; use vk::binding or distinct register numbers',
        variable.location
      );
    }
    const storage = variable.type.name.endsWith('StructuredBuffer');
    const texture = variable.type.name === 'Texture2D';
    const sampler = variable.type.name === 'SamplerState';
    const access = variable.type.name === 'RWStructuredBuffer' ? 'read_write' : 'read';
    if (texture && variable.type.element?.name !== 'float4') {
      this.fail('Only Texture2D<float4> is supported', variable.location);
    }
    if (storage && !variable.type.element) {
      this.fail('Structured buffers require an element type', variable.location);
    }
    if (storage) {
      this.checkStorageType(variable.type.element!, variable.location);
    }
    if (!this.isWGSL && this.glslVersion === '450' && binding.group !== 0) {
      this.fail('GLSL 450 supports binding group zero only', variable.location);
    }
    const valueType =
      variable.type.name === 'ConstantBuffer' ? variable.type.element : variable.type;
    if (
      variable.type.name === 'ConstantBuffer' &&
      (!valueType || !this.structures.has(valueType.name))
    ) {
      this.fail('ConstantBuffer requires a structure type', variable.location);
    }
    this.addSymbol(variable, name, access === 'read_write');
    if (variable.modifiers.includes('cbuffer')) {
      for (const field of this.structures.get(valueType!.name)!.fields) {
        this.addSymbol(field, `${name}.${this.getName(field.name)}`, false);
      }
    }
    this.reflection.bindings.push({
      name: variable.name,
      shaderName: name,
      ...binding,
      kind: storage ? 'storage' : texture ? 'texture' : sampler ? 'sampler' : 'uniform',
      access,
      ...(!this.isWGSL && (storage || variable.type.name === 'ConstantBuffer')
        ? {blockName: `_slang_buffer_${variable.name}`}
        : {})
    });
    if (this.isWGSL) {
      const prefix = `@group(${binding.group}) @binding(${binding.binding})`;
      if (storage) {
        return `${prefix} var<storage, ${access}> ${name}: array<${this.getTypeName(variable.type.element!, variable.location)}>;`;
      }
      if (texture || sampler) {
        return `${prefix} var ${name}: ${texture ? 'texture_2d<f32>' : 'sampler'};`;
      }
      this.checkUniformType(valueType!, variable.location);
      return `${prefix} var<uniform> ${this.getDeclaration(valueType!, name, variable.location)};`;
    }
    if (storage) {
      if (this.glslVersion !== '450') {
        this.fail('Structured buffers require GLSL 450', variable.location);
      }
      return `layout(std430, binding = ${binding.binding}) ${access === 'read' ? 'readonly ' : ''}buffer _slang_buffer_${variable.name} { ${this.getDeclaration(variable.type.element!, '_slang_data', variable.location)}[]; } ${name};`;
    }
    if (sampler) {
      return '';
    }
    if (texture) {
      return `uniform sampler2D ${name};`;
    }
    if (variable.type.name === 'ConstantBuffer') {
      return `layout(std140${this.glslVersion === '450' ? `, binding = ${binding.binding}` : ''}) uniform _slang_buffer_${variable.name} { ${this.getTypeName(valueType!, variable.location)} ${name}; };`;
    }
    return `uniform ${this.getDeclaration(valueType!, name, variable.location)};`;
  }
  private checkStorageType(
    type: SlangType,
    location: SourceLocation,
    visited = new Set<string>()
  ): void {
    if (type.name.startsWith('bool') || type.name === 'void') {
      this.fail('Storage buffers require host-shareable element types', location);
    }
    const structure = this.structures.get(type.name);
    if (structure && !visited.has(type.name)) {
      visited.add(type.name);
      for (const field of structure.fields) {
        this.checkStorageType(field.type, field.location, visited);
      }
    }
    if (type.element) {
      this.checkStorageType(type.element, location, visited);
    }
  }
  private checkUniformType(
    type: SlangType,
    location: SourceLocation,
    visited = new Set<string>()
  ): void {
    if (type.name.startsWith('bool') || type.name === 'array' || /^float[2-4]x2$/.test(type.name)) {
      this.fail(
        'This uniform type requires WGSL layout legalization and is not yet supported',
        location
      );
    }
    const structure = this.structures.get(type.name);
    if (structure && !visited.has(type.name)) {
      visited.add(type.name);
      for (const field of structure.fields) {
        this.checkUniformType(field.type, field.location, visited);
      }
    }
  }
  private collectInterface(
    variable: Variable,
    direction: 'in' | 'out',
    path: string[],
    ancestors = new Set<string>()
  ): InterfaceLeaf[] {
    const structure = this.structures.get(variable.type.name);
    if (structure) {
      if (ancestors.has(structure.name)) {
        this.fail('Recursive structures are not supported', variable.location);
      }
      const visited = new Set(ancestors);
      visited.add(structure.name);
      return structure.fields.flatMap(field =>
        this.collectInterface(
          {...field, modifiers: [...variable.modifiers, ...field.modifiers]},
          direction,
          [...path, field.name],
          visited
        )
      );
    }
    if (!variable.semantic) {
      this.fail('Entry point values require a semantic', variable.location);
    }
    if (
      variable.type.element ||
      /^float[2-4]x[2-4]$/.test(variable.type.name) ||
      variable.type.name.startsWith('bool')
    ) {
      if (variable.semantic.toUpperCase() !== 'SV_ISFRONTFACE') {
        this.fail('Entry point leaves must be numeric scalars or vectors', variable.location);
      }
    }
    const semantic = variable.semantic.toUpperCase();
    const builtin = BUILTINS[semantic];
    const reflection: SlangInterfaceVariable = {
      name: path.join('.'),
      semantic: variable.semantic,
      type: variable.type.name
    };
    if (builtin) {
      if (!builtin.stages.includes(`${this.stage}:${direction}`)) {
        this.fail(`Invalid ${variable.semantic} for ${this.stage} ${direction}`, variable.location);
      }
      if (variable.type.name !== builtin.type) {
        this.fail(`${variable.semantic} requires ${builtin.type}`, variable.location);
      }
      reflection.builtin = builtin.wgsl;
    } else if (/^SV_TARGET\d*$/.test(semantic)) {
      if (this.stage !== 'fragment' || direction !== 'out') {
        this.fail('SV_Target requires fragment output', variable.location);
      }
      reflection.location = Number(semantic.slice(9) || 0);
    } else {
      if (semantic.startsWith('SV_') || this.stage === 'compute') {
        this.fail(`Unsupported semantic ${variable.semantic}`, variable.location);
      }
      reflection.location = this.locations.get(semantic)!;
    }
    this.getTypeName(variable.type, variable.location);
    const leaves = direction === 'in' ? this.inputs : this.outputs;
    if (
      leaves.some(leaf =>
        builtin
          ? leaf.reflection.builtin === reflection.builtin
          : leaf.reflection.location === reflection.location
      )
    ) {
      this.fail('Duplicate entry point semantic location or builtin', variable.location);
    }
    const leaf: InterfaceLeaf = {
      variable,
      path,
      field: `_slang_${direction}_${leaves.length}`,
      reflection
    };
    leaves.push(leaf);
    return [leaf];
  }
  private prepareEntry(): void {
    for (const parameter of this.entry.parameters) {
      if (
        parameter.modifiers.some(
          modifier =>
            !['in', 'nointerpolation', 'linear', 'noperspective', 'centroid', 'sample'].includes(
              modifier
            )
        )
      ) {
        this.fail(
          'Entry point out/inout/uniform parameters are not yet supported; return a structure instead',
          parameter.location
        );
      }
      this.collectInterface(parameter, 'in', [parameter.name]);
    }
    if (this.entry.type.name !== 'void') {
      if (this.stage === 'compute') {
        this.fail('Compute entry points must return void', this.entry.location);
      }
      this.collectInterface(
        {
          kind: 'variable',
          name: 'result',
          type: this.entry.type,
          semantic: this.entry.semantic,
          attributes: [],
          modifiers: [],
          location: this.entry.location
        },
        'out',
        ['result']
      );
    }
    if (
      this.stage === 'vertex' &&
      !this.outputs.some(leaf => leaf.reflection.builtin === 'position')
    ) {
      this.fail('Vertex entry points must return SV_Position', this.entry.location);
    }
    this.reflection.inputs = this.inputs.map(leaf => leaf.reflection);
    this.reflection.outputs = this.outputs.map(leaf => leaf.reflection);
    const threads = this.entry.attributes.find(attribute => attribute.name === 'numthreads');
    if (this.stage === 'compute') {
      if (
        !threads ||
        threads.arguments.length !== 3 ||
        !threads.arguments.every(argument => /^\d+$/.test(argument) && Number(argument) > 0)
      ) {
        this.fail(
          'Compute shaders require [numthreads(x, y, z)] with positive integer literals',
          this.entry.location
        );
      }
      this.reflection.workgroupSize = [
        Number(threads.arguments[0]),
        Number(threads.arguments[1]),
        Number(threads.arguments[2])
      ];
    } else if (threads) {
      this.fail('numthreads requires a compute shader', threads.location);
    }
  }
  private getInterfaceAttribute(leaf: InterfaceLeaf, direction: 'in' | 'out'): string {
    if (leaf.reflection.builtin) {
      return `@builtin(${leaf.reflection.builtin})`;
    }
    let attribute = `@location(${leaf.reflection.location})`;
    const interpolated =
      (this.stage === 'fragment' && direction === 'in') ||
      (this.stage === 'vertex' && direction === 'out');
    if (interpolated) {
      const modifiers = leaf.variable.modifiers;
      const mode =
        modifiers.includes('nointerpolation') || /^(int|uint)/.test(leaf.variable.type.name)
          ? 'flat'
          : modifiers.includes('noperspective')
            ? 'linear'
            : 'perspective';
      const sampling = modifiers.includes('centroid')
        ? 'centroid'
        : modifiers.includes('sample')
          ? 'sample'
          : 'center';
      attribute += mode === 'flat' ? ' @interpolate(flat)' : ` @interpolate(${mode}, ${sampling})`;
    }
    return attribute;
  }
  private emitEntry(): string {
    const pieces: string[] = [];
    if (this.isWGSL) {
      for (const [direction, leaves] of [
        ['in', this.inputs],
        ['out', this.outputs]
      ] as const) {
        if (leaves.length) {
          pieces.push(
            `struct _slang_${direction}put {\n${leaves.map(leaf => `  ${this.getInterfaceAttribute(leaf, direction)} ${this.getDeclaration(leaf.variable.type, leaf.field, leaf.variable.location)},`).join('\n')}\n}`
          );
        }
      }
    } else {
      for (const [direction, leaves] of [
        ['in', this.inputs],
        ['out', this.outputs]
      ] as const) {
        for (const leaf of leaves) {
          if (!leaf.reflection.builtin) {
            const interpolated =
              (this.stage === 'fragment' && direction === 'in') ||
              (this.stage === 'vertex' && direction === 'out');
            const flat =
              leaf.variable.modifiers.includes('nointerpolation') ||
              /^(int|uint)/.test(leaf.variable.type.name);
            // GLSL ES 3.00 cannot assign explicit locations to varying interfaces.
            const location =
              this.glslVersion === '450' ||
              (this.stage === 'vertex' && direction === 'in') ||
              (this.stage === 'fragment' && direction === 'out')
                ? `layout(location = ${leaf.reflection.location}) `
                : '';
            const modifiers = leaf.variable.modifiers;
            if (
              interpolated &&
              !flat &&
              this.glslVersion === '300 es' &&
              modifiers.includes('noperspective')
            ) {
              this.fail('noperspective interpolation requires GLSL 450', leaf.variable.location);
            }
            if (interpolated && this.glslVersion === '300 es' && modifiers.includes('sample')) {
              this.fail('sample interpolation requires GLSL 450', leaf.variable.location);
            }
            const interpolation = !interpolated
              ? ''
              : flat
                ? 'flat '
                : modifiers.includes('noperspective')
                  ? 'noperspective '
                  : '';
            const sampling =
              !interpolated || flat
                ? ''
                : modifiers.includes('centroid')
                  ? 'centroid '
                  : modifiers.includes('sample')
                    ? 'sample '
                    : '';
            pieces.push(
              `${location}${interpolation}${sampling}${direction} ${this.getDeclaration(leaf.variable.type, this.getGLSLInterfaceName(leaf, direction), leaf.variable.location)};`
            );
          }
        }
      }
    }
    const body: string[] = [];
    const parameters: string[] = [];
    for (const parameter of this.entry.parameters) {
      const name = `_slang_argument_${parameter.name}`;
      const leaves = this.inputs.filter(leaf => leaf.path[0] === parameter.name);
      body.push(
        `${this.isWGSL ? 'var ' : ''}${this.getDeclaration(parameter.type, name, parameter.location)};`
      );
      for (const leaf of leaves) {
        let value = this.isWGSL
          ? `_slang_input.${leaf.field}`
          : this.getGLSLInterfaceName(leaf, 'in');
        if (
          !this.isWGSL &&
          ['SV_VERTEXID', 'SV_INSTANCEID'].includes(leaf.variable.semantic!.toUpperCase())
        ) {
          value = `uint(${value})`;
        }
        body.push(
          `${name}${leaf.path
            .slice(1)
            .map(part => `.${this.getName(part)}`)
            .join('')} = ${value};`
        );
      }
      parameters.push(name);
    }
    const call = `_slang_function_${this.entry.name}(${parameters.join(', ')})`;
    if (this.entry.type.name === 'void') {
      body.push(`${call};`);
    } else {
      body.push(
        `${this.isWGSL ? 'let ' : ''}${this.getDeclaration(this.entry.type, '_slang_result', this.entry.location)} = ${call};`
      );
      if (this.isWGSL) {
        body.push('var _slang_output: _slang_output;');
      }
      for (const leaf of this.outputs) {
        const source = `_slang_result${leaf.path
          .slice(1)
          .map(part => `.${this.getName(part)}`)
          .join('')}`;
        body.push(
          `${this.isWGSL ? `_slang_output.${leaf.field}` : this.getGLSLInterfaceName(leaf, 'out')} = ${source};`
        );
      }
      if (this.isWGSL) {
        body.push('return _slang_output;');
      }
    }
    const workgroup = this.reflection.workgroupSize;
    if (workgroup && !this.isWGSL) {
      pieces.push(
        `layout(local_size_x = ${workgroup[0]}, local_size_y = ${workgroup[1]}, local_size_z = ${workgroup[2]}) in;`
      );
    }
    const signature = this.isWGSL
      ? `@${this.stage}${workgroup ? ` @workgroup_size(${workgroup.join(', ')})` : ''}\nfn _slang_entry_${this.entry.name}(${this.inputs.length ? '_slang_input: _slang_input' : ''})${this.outputs.length ? ' -> _slang_output' : ''}`
      : 'void main()';
    pieces.push(`${signature} {\n${body.map(line => `  ${line}`).join('\n')}\n}`);
    return pieces.join('\n\n');
  }
  private getGLSLInterfaceName(leaf: InterfaceLeaf, direction: 'in' | 'out'): string {
    if (leaf.reflection.builtin) {
      if (leaf.variable.semantic!.toUpperCase() === 'SV_POSITION' && direction === 'in') {
        return 'gl_FragCoord';
      }
      return BUILTINS[leaf.variable.semantic!.toUpperCase()].glsl;
    }
    const varying =
      (this.stage === 'vertex' && direction === 'out') ||
      (this.stage === 'fragment' && direction === 'in');
    return varying ? `_slang_varying_${leaf.reflection.location}` : leaf.field;
  }
  private emitFunction(declaration: ShaderFunction): string {
    if (declaration.type.name === 'array') {
      this.fail('Array return types are not supported', declaration.location);
    }
    this.currentFunction = declaration;
    this.scopes.push(new Map());
    for (const attribute of declaration.attributes) {
      if (!['shader', 'numthreads'].includes(attribute.name)) {
        this.fail(`Unsupported function attribute ${attribute.name}`, attribute.location);
      }
      if (
        attribute.name === 'shader' &&
        (attribute.arguments.length !== 1 ||
          !['vertex', 'fragment', 'compute'].includes(attribute.arguments[0]))
      ) {
        this.fail('Unsupported shader attribute', attribute.location);
      }
    }
    const parameters = declaration.parameters.map(parameter => {
      if (
        parameter.attributes.length ||
        parameter.binding ||
        parameter.initializer ||
        parameter.modifiers.some(
          modifier =>
            !['in', 'nointerpolation', 'linear', 'noperspective', 'centroid', 'sample'].includes(
              modifier
            )
        )
      ) {
        this.fail('Unsupported function parameter metadata', parameter.location);
      }
      if (parameter.type.name === 'void') {
        this.fail('void parameters are not supported', parameter.location);
      }
      this.addSymbol(parameter);
      return this.getDeclaration(
        parameter.type,
        this.isWGSL ? `_slang_parameter_${parameter.name}` : this.getName(parameter.name),
        parameter.location
      );
    });
    const parameterCopies = this.isWGSL
      ? declaration.parameters
          .map(
            parameter =>
              `  var ${this.getDeclaration(parameter.type, this.getName(parameter.name), parameter.location)} = _slang_parameter_${parameter.name};`
          )
          .join('\n')
      : '';
    const body = this.emitBlock(declaration.body).replace(
      '{\n',
      `{\n${parameterCopies}${parameterCopies ? '\n' : ''}`
    );
    this.scopes.pop();
    this.currentFunction = undefined;
    const name = `_slang_function_${declaration.name}`;
    return this.isWGSL
      ? `fn ${name}(${parameters.join(', ')})${declaration.type.name === 'void' ? '' : ` -> ${this.getTypeName(declaration.type, declaration.location)}`} ${body}`
      : `${this.getTypeName(declaration.type, declaration.location)} ${name}(${parameters.join(', ')}) ${body}`;
  }
  emitProgramParts(): {result: SlangTranspileResult; declarations: string[]; entry: string} {
    this.prepareEntry();
    // Topologically order structures for GLSL, which requires prior type declarations.
    const structures: string[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const visitStructure = (structure: Structure): void => {
      if (visited.has(structure.name)) {
        return;
      }
      if (visiting.has(structure.name)) {
        this.fail('Recursive structures are not supported', structure.location);
      }
      visiting.add(structure.name);
      for (const field of structure.fields) {
        let type = field.type;
        while (type.element) {
          type = type.element;
        }
        const dependency = this.structures.get(type.name);
        if (dependency) {
          visitStructure(dependency);
        }
      }
      structures.push(this.emitStructure(structure));
      visiting.delete(structure.name);
      visited.add(structure.name);
    };
    for (const structure of this.structures.values()) {
      visitStructure(structure);
    }
    const globals = this.program.declarations
      .filter(declaration => declaration.kind === 'variable')
      .map(declaration => this.emitGlobal(declaration));
    const functions = new Map<string, string>();
    const reachable = new Set<string>();
    const collectCalls = (value: unknown): void => {
      if (!value || typeof value !== 'object') {
        return;
      }
      if (Array.isArray(value)) {
        value.forEach(collectCalls);
        return;
      }
      const node = value as {kind?: string; callee?: Expression};
      if (
        node.kind === 'call' &&
        node.callee?.kind === 'identifier' &&
        this.functions.has(node.callee.value)
      ) {
        collectFunction(node.callee.value);
      }
      Object.values(value).forEach(collectCalls);
    };
    const collectFunction = (name: string): void => {
      if (reachable.has(name)) {
        return;
      }
      reachable.add(name);
      collectCalls(this.functions.get(name)!.body);
    };
    collectFunction(this.entry.name);
    for (const name of reachable) {
      functions.set(name, this.emitFunction(this.functions.get(name)!));
    }
    const orderedFunctions: string[] = [];
    visited.clear();
    visiting.clear();
    const visitFunction = (name: string): void => {
      if (visited.has(name)) {
        return;
      }
      if (visiting.has(name)) {
        this.fail('Recursive functions are not supported', this.functions.get(name)!.location);
      }
      visiting.add(name);
      for (const dependency of this.callGraph.get(name) || []) {
        visitFunction(dependency);
      }
      orderedFunctions.push(functions.get(name)!);
      visiting.delete(name);
      visited.add(name);
    };
    for (const name of reachable) {
      visitFunction(name);
    }
    const header = this.isWGSL
      ? ''
      : `#version ${this.glslVersion}\n${this.glslVersion === '300 es' ? 'precision highp float;\nprecision highp int;' : ''}`;
    const entry = this.emitEntry();
    if (!this.isWGSL) {
      for (const [texture, sampler] of this.sampledTextures) {
        const binding = this.reflection.bindings.find(binding => binding.shaderName === texture);
        if (binding) {
          binding.sampler = this.reflection.bindings.find(
            binding => binding.shaderName === sampler
          )?.name;
        }
      }
      this.reflection.bindings = this.reflection.bindings.filter(
        binding => binding.kind !== 'sampler'
      );
    }
    const declarations = [header, ...structures, ...globals, ...orderedFunctions].filter(Boolean);
    const result: SlangTranspileResult = {
      code: [...declarations, entry].filter(Boolean).join('\n\n') + '\n',
      target: this.options.target,
      entryPoint: this.isWGSL ? `_slang_entry_${this.entry.name}` : 'main',
      stage: this.stage,
      reflection: this.reflection
    };
    return {result, declarations, entry};
  }

  emitProgram(): SlangTranspileResult {
    return this.emitProgramParts().result;
  }
}
