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
import {getSlangTypeLayout} from './layout';
import {
  isSlangTexture,
  getSlangTextureLayout,
  getWGSLTextureType,
  getGLSLTextureType
} from './textures';
import {UniformEmitter} from './uniform-emitter';
import {markSlangSource, mapSlangSource} from './source-map';
import type {
  SlangTextureLayout,
  SlangInterfaceVariable,
  SlangReflection,
  SlangShaderStage,
  SlangTranspileOptions,
  SlangTranspileResult
} from './types';

type Symbol = {
  type: SlangType;
  code: string;
  writable: boolean;
  uniformType?: SlangType;
  resourceName?: string;
};
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
  private overloads = new Map<string, ShaderFunction[]>();
  private functionKeys = new Map<ShaderFunction, string>();
  private uniformEmitter: UniformEmitter;
  private expressionPrelude: string[] = [];
  private temporaryIndex = 0;
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
  private textureLayouts = new Map<string, SlangTextureLayout>();
  private comparisonTextures = new Set<string>();
  private reservedNames = new Set<string>();
  private hasComparisonCalls = false;
  private ordinaryTextures = new Set<string>();
  private usedTextures = new Set<string>();
  private usedResources = new Set<string>();
  private comparisonTexturesResolved = false;

  constructor(
    private program: Program,
    private options: SlangTranspileOptions,
    private discoveringTextureUsage = false
  ) {
    const inspectNames = (value: unknown): void => {
      if (!value || typeof value !== 'object') return;
      const node = value as {name?: string} & Expression;
      if (typeof node.name === 'string') this.reservedNames.add(this.getName(node.name));
      if (
        node.kind === 'call' &&
        node.callee.kind === 'member' &&
        ['SampleCmp', 'SampleCmpLevelZero'].includes(node.callee.member)
      )
        this.hasComparisonCalls = true;
      Object.values(value).forEach(inspectNames);
    };
    inspectNames(program);
    const names = new Set<string>();
    for (const declaration of program.declarations) {
      if (
        names.has(declaration.name) &&
        !(declaration.kind === 'function' && this.overloads.has(declaration.name))
      ) {
        this.fail(`Duplicate declaration ${declaration.name}`, declaration.location);
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
        const overloads = this.overloads.get(declaration.name) || [];
        if (
          overloads.some(
            candidate =>
              candidate.parameters.length === declaration.parameters.length &&
              candidate.parameters.every((parameter, index) =>
                this.matchType(parameter.type, declaration.parameters[index].type)
              )
          )
        ) {
          this.fail(`Duplicate function signature ${declaration.name}`, declaration.location);
        }
        overloads.push(declaration);
        this.overloads.set(declaration.name, overloads);
      }
    }
    const functionNames = new Set(this.overloads.keys());
    for (const [name, overloads] of this.overloads) {
      if (
        overloads.length > 1 &&
        overloads.some(declaration =>
          declaration.attributes.some(attribute => attribute.name === 'shader')
        )
      ) {
        this.fail('Shader entry points cannot be overloaded', overloads[0].location);
      }
      overloads.forEach((declaration, index) => {
        let key = overloads.length === 1 ? name : `${name}__overload_${index}`;
        if (overloads.length > 1) {
          while (functionNames.has(key)) key += '_';
          functionNames.add(key);
        }
        this.functions.set(key, declaration);
        this.functionKeys.set(declaration, key);
      });
    }
    this.uniformEmitter = new UniformEmitter(
      this.structures,
      type => this.getTypeName(type),
      type => this.getLayout(type, 'uniform', this.entry.location)
    );
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
        if (this.currentFunction && symbol.resourceName)
          this.usedResources.add(symbol.resourceName);
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
      case 'initializer':
        this.fail('Initializer lists require a declared value type', expression);
      case 'identifier': {
        const type = this.findSymbol(expression.value, expression).type;
        return type.name === 'ConstantBuffer' ? type.element! : type;
      }
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
      case 'unary': {
        const type = this.getExpressionType(expression.operand);
        if (expression.operator === '!' && !/^bool([2-4])?$/.test(type.name))
          this.fail('Logical negation requires a boolean value', expression);
        if (expression.operator === '~' && !/^(int|uint)([2-4])?$/.test(type.name))
          this.fail('Bitwise negation requires an integer value', expression);
        if (
          ['+', '-'].includes(expression.operator) &&
          !/^(float|int|uint)([2-4](x[2-4])?)?$/.test(type.name)
        )
          this.fail('Numeric negation requires a numeric value', expression);
        return type;
      }
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
        if (
          this.isScalar(left) &&
          this.isScalar(right) &&
          left.name === 'int' &&
          right.name === 'uint'
        )
          return {name: 'uint'};
        return this.isScalar(left) && !this.isScalar(right) ? right : left;
      }
      case 'conditional': {
        const consequent = this.getExpressionType(expression.consequent);
        const alternate = this.getExpressionType(expression.alternate);
        if (this.matchType(consequent, alternate)) return consequent;
        if (
          /^(float|int|uint)([2-4])?$/.test(consequent.name) &&
          /^(float|int|uint)([2-4])?$/.test(alternate.name)
        ) {
          const consequentWidth = /[2-4]$/.exec(consequent.name)?.[0];
          const alternateWidth = /[2-4]$/.exec(alternate.name)?.[0];
          if (consequentWidth && alternateWidth && consequentWidth !== alternateWidth)
            this.fail('Conditional branches have incompatible vector widths', expression);
          return this.getCommonType([expression.consequent, expression.alternate]);
        }
        this.fail('Conditional branches have incompatible types', expression);
      }
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
          if (isSlangTexture(resource)) {
            return ['SampleCmp', 'SampleCmpLevelZero'].includes(expression.callee.member)
              ? {name: 'float'}
              : resource.element!;
          }
          this.fail('Unsupported resource method', expression);
        }
        if (expression.callee.kind !== 'identifier') {
          this.fail('Unsupported function expression', expression);
        }
        const name = expression.callee.value;
        if (this.overloads.has(name)) {
          return this.resolveFunction(name, expression.arguments, expression).type;
        }
        if (INTRINSICS[name] && !INTRINSICS[name].includes(expression.arguments.length)) {
          this.fail(`Wrong number of arguments for ${name}`, expression);
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
          this.checkMultiplyArguments(expression);
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
          return this.isFloatIntrinsic(name)
            ? this.getFloatIntrinsicType(expression)
            : this.getCommonType(expression.arguments);
        }
        if (this.isFloatIntrinsic(name)) return this.getFloatIntrinsicType(expression);
        return this.getExpressionType(expression.arguments[0]);
      }
    }
  }
  private isFloatIntrinsic(name: string): boolean {
    return ![
      'abs',
      'sign',
      'min',
      'max',
      'clamp',
      'all',
      'any',
      'transpose',
      'mul',
      'GroupMemoryBarrierWithGroupSync'
    ].includes(name);
  }
  private getFloatIntrinsicType(expression: Expression & {kind: 'call'}): SlangType {
    const types = expression.arguments.map(argument => this.getExpressionType(argument));
    if (types.some(type => !/^(float|int|uint)([2-4])?$/.test(type.name)))
      this.fail('Mathematical intrinsics require numeric scalars or vectors', expression);
    const vectors = types.filter(type => /[2-4]$/.test(type.name));
    if (new Set(vectors.map(type => type.name.slice(-1))).size > 1)
      this.fail('Intrinsic vector widths do not match', expression);
    const name = (expression.callee as Expression & {kind: 'identifier'}).value;
    if (name === 'cross' && types.some(type => !type.name.endsWith('3')))
      this.fail('cross requires three-component vectors', expression);
    return {name: 'float' + (vectors[0]?.name.slice(-1) ?? '')};
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
  private getLayout(
    type: SlangType,
    addressSpace: 'uniform' | 'storage',
    location: SourceLocation
  ) {
    return getSlangTypeLayout(
      type,
      this.structures,
      addressSpace,
      location,
      this.options.sourceName || 'shader.slang'
    );
  }
  private createTemporary(): string {
    let name: string;
    do {
      name = `_slang_temporary_${this.temporaryIndex++}`;
    } while (this.reservedNames.has(name));
    return name;
  }
  private captureExpression(emit: () => string): {code: string; statements: string[]} {
    const previous = this.expressionPrelude;
    this.expressionPrelude = [];
    const code = emit();
    const statements = this.expressionPrelude;
    this.expressionPrelude = previous;
    return {code, statements};
  }
  private resolveFunction(
    name: string,
    argumentsList: Expression[],
    location: SourceLocation
  ): ShaderFunction {
    const candidates = this.overloads.get(name)!;
    const scores = candidates.map(declaration => {
      if (declaration.parameters.length !== argumentsList.length) return Infinity;
      let score = 0;
      for (let index = 0; index < argumentsList.length; index++) {
        const actual = this.getExpressionType(argumentsList[index]);
        const parameter = declaration.parameters[index];
        if (this.matchType(actual, parameter.type)) continue;
        if (parameter.modifiers.some(modifier => ['out', 'inout'].includes(modifier)))
          return Infinity;
        const expectedNumeric = /^(float|int|uint)([2-4])?$/.exec(parameter.type.name);
        const actualNumeric = /^(float|int|uint)([2-4])?$/.exec(actual.name);
        if (
          !expectedNumeric ||
          !actualNumeric ||
          (actualNumeric[2] && actualNumeric[2] !== expectedNumeric[2])
        )
          return Infinity;
        score +=
          expectedNumeric[2] && !actualNumeric[2] ? 4 : expectedNumeric[1] === 'float' ? 1 : 2;
      }
      return score;
    });
    const minimum = Math.min(...scores);
    if (!Number.isFinite(minimum)) this.fail(`No matching overload for ${name}`, location);
    if (scores.filter(score => score === minimum).length > 1)
      this.fail(`Ambiguous overload for ${name}`, location);
    return candidates[scores.indexOf(minimum)];
  }
  private captureValue(code: string): string {
    if (!this.isWGSL || !this.currentFunction) return code;
    const temporary = this.createTemporary();
    this.expressionPrelude.push(`let ${temporary} = ${code};`);
    return temporary;
  }
  private coerceExpression(expression: Expression, expected: SlangType): string {
    if (expression.kind === 'initializer') return this.emitInitializer(expression, expected);
    const actual = this.getExpressionType(expression);
    const code = this.emitExpression(expression);
    return this.coerceCode(code, actual, expected, expression);
  }
  private coerceCode(
    code: string,
    actual: SlangType,
    expected: SlangType,
    location: SourceLocation
  ): string {
    if (this.matchType(expected, actual)) return code;
    const expectedNumeric = /^(float|int|uint)([2-4])?$/.exec(expected.name);
    const actualNumeric = /^(float|int|uint)([2-4])?$/.exec(actual.name);
    if (
      expectedNumeric &&
      actualNumeric &&
      (!actualNumeric[2] || expectedNumeric[2] === actualNumeric[2])
    ) {
      if (expectedNumeric[2] && !actualNumeric[2]) {
        const scalar =
          expectedNumeric[1] === actualNumeric[1]
            ? code
            : `${this.getTypeName({name: expectedNumeric[1]})}(${code})`;
        return `${this.getTypeName(expected)}(${scalar})`;
      }
      return `${this.getTypeName(expected)}(${code})`;
    }
    if (/^bool[2-4]$/.test(expected.name) && actual.name === 'bool')
      return `${this.getTypeName(expected)}(${code})`;
    this.fail(`Cannot convert ${actual.name} to ${expected.name}`, location);
  }
  private emitCast(expression: Expression, expected: SlangType): string {
    const actual = this.getExpressionType(expression);
    const code = this.captureValue(this.emitExpression(expression));
    const source = /^(float|int|uint|bool)([2-4])?$/.exec(actual.name);
    const target = /^(float|int|uint|bool)([2-4])?$/.exec(expected.name);
    if (source && target && (!source[2] || source[2] === target[2])) {
      if (source[1] === 'bool' && target[1] !== 'bool') {
        const intermediate = {name: target[1] + (source[2] || '')};
        const converted = this.isWGSL
          ? `select(${this.getTypeName(intermediate)}(0), ${this.getTypeName(intermediate)}(1), ${code})`
          : `${this.getTypeName(intermediate)}(${code})`;
        return this.coerceCode(converted, intermediate, expected, expression);
      }
      if (target[1] === 'bool' && source[1] !== 'bool') {
        const zero = `${this.getTypeName(actual)}(0)`;
        const converted =
          !this.isWGSL && source[2] ? `notEqual(${code}, ${zero})` : `(${code} != ${zero})`;
        return this.coerceCode(converted, {name: 'bool' + (source[2] || '')}, expected, expression);
      }
    }
    return this.coerceCode(code, actual, expected, expression);
  }
  private emitInitializer(
    expression: Expression & {kind: 'initializer'},
    expected: SlangType
  ): string {
    const structure = this.structures.get(expected.name);
    const vector = /^(float|int|uint|bool)([2-4])$/.exec(expected.name);
    const matrix = /^float([2-4])x([2-4])$/.exec(expected.name);
    if (
      vector &&
      expression.elements.length === 1 &&
      this.isScalar(this.getExpressionType(expression.elements[0]))
    ) {
      return this.coerceExpression(expression.elements[0], expected);
    }
    const types = structure
      ? structure.fields.map(field => field.type)
      : expected.name === 'array'
        ? Array.from({length: expected.length!}, () => expected.element!)
        : vector
          ? Array.from({length: Number(vector[2])}, () => ({name: vector[1]}))
          : matrix
            ? Array.from({length: Number(matrix[1])}, () => ({name: `float${matrix[2]}`}))
            : [expected];
    let elements = expression.elements;
    if (matrix && elements.length === Number(matrix[1]) * Number(matrix[2])) {
      elements = Array.from({length: Number(matrix[1])}, (_, row) => ({
        ...expression,
        kind: 'initializer' as const,
        elements: expression.elements.slice(row * Number(matrix[2]), (row + 1) * Number(matrix[2]))
      }));
    }
    if (elements.length > types.length)
      this.fail('Initializer list has the wrong element count', expression);
    const values = types.map((type, index) =>
      elements[index] ? this.coerceExpression(elements[index], type) : this.getZeroValue(type)
    );
    const constructorName =
      !this.isWGSL && expected.name === 'array'
        ? `${this.getTypeName(expected.element!)}[${expected.length}]`
        : this.getTypeName(expected);
    return `${constructorName}(${values.join(', ')})`;
  }
  private getZeroValue(type: SlangType): string {
    if (this.isWGSL) return `${this.getTypeName(type)}()`;
    const structure = this.structures.get(type.name);
    if (structure)
      return `${this.getTypeName(type)}(${structure.fields.map(field => this.getZeroValue(field.type)).join(', ')})`;
    if (type.name === 'array')
      return `${this.getTypeName(type.element!)}[${type.length}](${Array.from({length: type.length!}, () => this.getZeroValue(type.element!)).join(', ')})`;
    return `${this.getTypeName(type)}(${type.name.startsWith('bool') ? 'false' : type.name.startsWith('uint') ? '0u' : type.name.startsWith('float') ? '0.0' : '0'})`;
  }
  private getUniformAccess(expression: Expression): {type: SlangType; code: string} | undefined {
    if (!this.isWGSL) return undefined;
    if (expression.kind === 'identifier') {
      const symbol = this.findSymbol(expression.value, expression);
      return symbol.uniformType ? {type: symbol.uniformType, code: symbol.code} : undefined;
    }
    if (expression.kind !== 'member' && expression.kind !== 'index') return undefined;
    const object = this.getUniformAccess(expression.object);
    if (!object) return undefined;
    this.getExpressionType(expression);
    if (expression.kind === 'member') {
      if (this.structures.has(object.type.name))
        return {
          type: this.getExpressionType(expression),
          code: `${object.code}.${this.getName(expression.member)}`
        };
      return {
        type: this.getExpressionType(expression),
        code: `${this.uniformEmitter.readValue(object.type, object.code)}.${expression.member}`
      };
    }
    const indexType = this.getExpressionType(expression.index);
    if (!['int', 'uint'].includes(indexType.name))
      this.fail('Index expressions require an integer scalar', expression.index);
    const index = this.emitExpression(expression.index);
    const aggregate = object.type.name === 'array' || /^float[2-4]x[2-4]$/.test(object.type.name);
    return {
      type: this.getExpressionType(expression),
      code: `${object.code}[${index}]${aggregate ? '._slang_value' : ''}`
    };
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
        expression.member.length > 1 &&
        new Set(expression.member).size !== expression.member.length
      ) {
        this.fail('Writable swizzles cannot repeat components', expression);
      }
      this.checkWritable(expression.object);
      return;
    }
    this.fail('Assignment requires a writable variable', expression);
  }
  private emitExpression(expression: Expression): string {
    const uniform = this.getUniformAccess(expression);
    if (uniform) return this.uniformEmitter.readValue(uniform.type, uniform.code);
    switch (expression.kind) {
      case 'initializer':
        this.fail('Initializer lists require a declared value type', expression);
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
        return this.emitCast(expression.operand, expression.type);
      case 'unary':
        this.getExpressionType(expression);
        if (['++', '--'].includes(expression.operator)) {
          this.fail(
            'Increment and decrement are supported only as statements and for-loop updates',
            expression
          );
        }
        if (expression.operator === '+') return this.emitExpression(expression.operand);
        if (
          !this.isWGSL &&
          expression.operator === '!' &&
          /^bool[2-4]$/.test(this.getExpressionType(expression.operand).name)
        )
          return `not(${this.emitExpression(expression.operand)})`;
        if (
          expression.operator === '-' &&
          this.getExpressionType(expression.operand).name.startsWith('uint')
        )
          return `(${this.getTypeName(this.getExpressionType(expression.operand))}(0u) - ${this.emitExpression(expression.operand)})`;
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
        if (isSlangTexture(objectType))
          return this.emitTextureLoad(expression.object, expression.index);
        const indexType = this.getExpressionType(expression.index);
        if (!['int', 'uint'].includes(indexType.name)) {
          this.fail('Index expressions require an integer scalar', expression.index);
        }
        const object = this.emitExpression(expression.object);
        return `${object}${!this.isWGSL && /StructuredBuffer$/.test(objectType.name) ? '._slang_data' : ''}[${this.emitExpression(expression.index)}]`;
      }
      case 'conditional': {
        const type = this.getExpressionType(expression);
        const condition = this.coerceExpression(expression.condition, {name: 'bool'});
        const consequent = this.captureExpression(() =>
          this.coerceExpression(expression.consequent, type)
        );
        const alternate = this.captureExpression(() =>
          this.coerceExpression(expression.alternate, type)
        );
        if (!this.isWGSL) return `(${condition} ? ${consequent.code} : ${alternate.code})`;
        if (
          !this.currentFunction &&
          !consequent.statements.length &&
          !alternate.statements.length
        ) {
          if (condition === 'true' || condition === 'false')
            return condition === 'true' ? consequent.code : alternate.code;
          if (/^(float|int|uint|bool)([2-4])?$/.test(type.name))
            return `select(${alternate.code},${consequent.code},${condition})`;
        }
        const temporary = this.createTemporary();
        this.expressionPrelude.push(
          `var ${temporary}: ${this.getTypeName(type)};`,
          `if (${condition}) {\n${[...consequent.statements, `${temporary} = ${consequent.code};`].join('\n')}\n} else {\n${[...alternate.statements, `${temporary} = ${alternate.code};`].join('\n')}\n}`
        );
        return temporary;
      }
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
        this.checkBinaryTypes(expression, leftType, rightType);
        if (this.isWGSL && ['&&', '||'].includes(expression.operator)) {
          const left = this.coerceExpression(expression.left, {name: 'bool'});
          const right = this.captureExpression(() =>
            this.coerceExpression(expression.right, {name: 'bool'})
          );
          const temporary = this.createTemporary();
          this.expressionPrelude.push(
            `var ${temporary}: bool = ${left};`,
            `if (${expression.operator === '&&' ? temporary : `!${temporary}`}) {\n${[...right.statements, `${temporary} = ${right.code};`].join('\n')}\n}`
          );
          return temporary;
        }
        let left = this.captureValue(this.emitExpression(expression.left));
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
            leftType.name === 'float' || rightType.name === 'float'
              ? {name: 'float'}
              : leftType.name === 'uint' || rightType.name === 'uint'
                ? {name: 'uint'}
                : leftType;
          left = this.coerceCode(left, leftType, common, expression.left);
          right = this.coerceCode(right, rightType, common, expression.right);
        } else if (this.isScalar(leftType) !== this.isScalar(rightType)) {
          const vectorType = this.isScalar(leftType) ? rightType : leftType;
          if (!/^(float|int|uint|bool)[2-4]$/.test(vectorType.name)) {
            this.fail('Scalar/matrix arithmetic is not supported', expression);
          }
          if (this.isScalar(leftType)) {
            left = this.coerceCode(left, leftType, vectorType, expression.left);
          } else {
            right = this.coerceCode(right, rightType, vectorType, expression.right);
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
    if (callee.kind === 'member') return this.emitTextureCall(expression);
    if (callee.kind !== 'identifier') {
      this.fail('Unsupported function expression', expression);
    }
    const name = callee.value;
    const declaration = this.overloads.has(name)
      ? this.resolveFunction(name, expression.arguments, expression)
      : undefined;
    if (declaration) {
      if (expression.arguments.length !== declaration.parameters.length) {
        this.fail(`Wrong number of arguments for ${name}`, expression);
      }
      if (this.currentFunction) {
        const current = this.functionKeys.get(this.currentFunction)!;
        const calls = this.callGraph.get(current) || new Set<string>();
        calls.add(this.functionKeys.get(declaration)!);
        this.callGraph.set(current, calls);
      }
      return this.emitFunctionCall(expression, declaration);
    }
    if (this.isValueType(name)) {
      const structure = this.structures.get(name);
      if (structure) {
        if (expression.arguments.length !== structure.fields.length) {
          this.fail('A structure constructor requires one argument per field', expression);
        }
        return `${this.getTypeName({name})}(${expression.arguments.map((argument, index) => this.captureValue(this.coerceExpression(argument, structure.fields[index].type))).join(', ')})`;
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
              .map(argument => this.captureValue(this.coerceExpression(argument, {name: 'float'})))
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
          return this.emitCast(argument, {
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
      return this.emitCast(expression.arguments[0], {name});
    }
    if (!INTRINSICS[name] || !INTRINSICS[name].includes(expression.arguments.length)) {
      this.fail(`Unsupported function or argument count: ${name}`, expression);
    }
    if (['ddx', 'ddy', 'fwidth'].includes(name) && this.stage !== 'fragment') {
      this.fail('Derivatives require a fragment shader', expression);
    }
    const argumentTypes = expression.arguments.map(argument => this.getExpressionType(argument));
    if (
      ['all', 'any'].includes(name) &&
      argumentTypes.some(type => !/^bool([2-4])?$/.test(type.name))
    )
      this.fail('all/any require boolean values', expression);
    if (['all', 'any'].includes(name) && argumentTypes[0].name === 'bool')
      return this.emitExpression(expression.arguments[0]);
    const floatType = this.isFloatIntrinsic(name)
      ? this.getFloatIntrinsicType(expression)
      : undefined;
    const argumentsList = expression.arguments.map((argument, index) => {
      const value = this.captureValue(this.emitExpression(argument));
      return floatType
        ? this.coerceCode(
            value,
            argumentTypes[index],
            {name: 'float' + (/[2-4]$/.exec(argumentTypes[index].name)?.[0] ?? '')},
            argument
          )
        : value;
    });
    if (name === 'mul') {
      this.checkMultiplyArguments(expression);
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
      const targetType = this.getTypeName(floatType!);
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
    const expected = floatType ?? this.getCommonType(expression.arguments);
    if (['clamp', 'min', 'max', 'lerp', 'step', 'smoothstep', 'pow', 'atan2'].includes(name)) {
      for (let index = 0; index < argumentsList.length; index++) {
        argumentsList[index] = this.coerceCode(
          argumentsList[index],
          floatType
            ? {name: 'float' + (/[2-4]$/.exec(argumentTypes[index].name)?.[0] ?? '')}
            : argumentTypes[index],
          expected,
          expression.arguments[index]
        );
      }
    }
    return `${mappings[name] || name}(${argumentsList.join(', ')})`;
  }
  private getTexture(expression: Expression): {
    code: string;
    layout: SlangTextureLayout;
    type: SlangType;
  } {
    const type = this.getExpressionType(expression);
    const code = this.emitExpression(expression);
    const layout = this.textureLayouts.get(code);
    if (!isSlangTexture(type) || !layout)
      this.fail('Texture methods require a declared global texture', expression);
    this.usedTextures.add(code);
    return {code, layout, type};
  }
  private cropTextureValue(code: string, layout: SlangTextureLayout): string {
    return layout.sampleType === 'depth' || layout.components === 4
      ? code
      : `(${code}).${'xyzw'.slice(0, layout.components)}`;
  }
  private emitTextureLoad(texture: Expression, coordinates: Expression, method = false): string {
    const {code, layout} = this.getTexture(texture);
    if (layout.access === 'write') this.fail('Write-only textures cannot be read', texture);
    if (!this.isWGSL && layout.sampleType === 'depth')
      this.fail(
        'GLSL depth comparison textures cannot also use Load; use a separate non-comparison view',
        texture
      );
    if (layout.dimension === 'cube')
      this.fail('Cube textures do not support integer Load/index access', texture);
    const width = layout.dimension === '2d' ? 2 : 3;
    const coordinate = this.coerceExpression(coordinates, {
      name: `int${width + (method && !layout.format ? 1 : 0)}`
    });
    const temporary = this.isWGSL ? this.createTemporary() : coordinate;
    if (this.isWGSL) this.expressionPrelude.push(`let ${temporary} = ${coordinate};`);
    const position =
      width === 2
        ? `(${temporary}).xy`
        : layout.dimension === '2d-array'
          ? `(${temporary}).xy, (${temporary}).z`
          : `(${temporary}).xyz`;
    const mip = layout.format ? '' : method ? `, (${temporary}).${width === 2 ? 'z' : 'w'}` : ', 0';
    const glslPosition = width === 2 ? `(${temporary}).xy` : `(${temporary}).xyz`;
    const value = this.isWGSL
      ? `textureLoad(${code}, ${position}${mip})`
      : `${layout.format ? 'imageLoad' : 'texelFetch'}(${code}, ${glslPosition}${mip})`;
    return this.cropTextureValue(value, layout);
  }
  private emitTextureStore(texture: Expression, coordinates: string, value: string): string {
    const {code, layout, type} = this.getTexture(texture);
    if (!layout.format) this.fail('Only storage textures can be written', texture);
    const scalar = type.element!.name.replace(/[2-4]$/, '');
    const zero = scalar === 'float' ? '0.0' : scalar === 'uint' ? '0u' : '0';
    const stored =
      layout.components === 4
        ? value
        : `${this.getTypeName({name: `${scalar}4`})}(${value}, ${Array.from({length: 4 - layout.components}, () => zero).join(', ')})`;
    return `${this.isWGSL ? 'textureStore' : 'imageStore'}(${code}, ${coordinates}, ${stored})`;
  }
  private emitTextureCall(expression: Expression & {kind: 'call'}): string {
    const callee = expression.callee as Expression & {kind: 'member'};
    const {code, layout} = this.getTexture(callee.object);
    if (this.discoveringTextureUsage) {
      if (callee.object.kind === 'identifier') {
        if (['SampleCmp', 'SampleCmpLevelZero'].includes(callee.member))
          this.comparisonTextures.add(callee.object.value);
        else if (['Sample', 'SampleLevel'].includes(callee.member))
          this.ordinaryTextures.add(callee.object.value);
      }
      expression.arguments.forEach(argument => this.emitExpression(argument));
      return this.getZeroValue(this.getExpressionType(expression));
    }
    if (callee.member === 'Load' && expression.arguments.length === 1)
      return this.emitTextureLoad(callee.object, expression.arguments[0], true);
    const comparison = ['SampleCmp', 'SampleCmpLevelZero'].includes(callee.member);
    if (
      !['Sample', 'SampleLevel', 'SampleCmp', 'SampleCmpLevelZero'].includes(callee.member) ||
      expression.arguments.length !== (callee.member === 'Sample' ? 2 : 3)
    )
      this.fail('Texture method or argument count is unsupported', expression);
    if (layout.format || layout.sampleType === 'sint' || layout.sampleType === 'uint')
      this.fail('Integer/storage textures support Load rather than filtered sampling', expression);
    if (['Sample', 'SampleCmp'].includes(callee.member) && this.stage !== 'fragment')
      this.fail('Implicit derivative sampling requires a fragment shader', expression);
    if (comparison !== (layout.sampleType === 'depth'))
      this.fail('Depth textures require comparison sampling or Load', expression);
    const samplerType = this.getExpressionType(expression.arguments[0]);
    if (samplerType.name !== (comparison ? 'SamplerComparisonState' : 'SamplerState'))
      this.fail('Texture sampling has the wrong sampler type', expression);
    const sampler = this.emitExpression(expression.arguments[0]);
    const width = layout.dimension === '2d' ? 2 : 3;
    const coordinates = this.coerceExpression(expression.arguments[1], {name: `float${width}`});
    const extra = expression.arguments[2]
      ? this.coerceExpression(expression.arguments[2], {name: 'float'})
      : '';
    if (this.isWGSL) {
      const temporary = this.createTemporary();
      this.expressionPrelude.push(`let ${temporary} = ${coordinates};`);
      const position =
        layout.dimension === '2d-array' ? `${temporary}.xy, i32(${temporary}.z)` : temporary;
      const functionName = comparison
        ? callee.member === 'SampleCmpLevelZero'
          ? 'textureSampleCompareLevel'
          : 'textureSampleCompare'
        : callee.member === 'SampleLevel'
          ? 'textureSampleLevel'
          : 'textureSample';
      return this.cropTextureValue(
        `${functionName}(${code}, ${sampler}, ${position}${extra ? `, ${extra}` : ''})`,
        layout
      );
    }
    const previous = this.sampledTextures.get(code);
    if (previous && previous !== sampler)
      this.fail('GLSL combined textures require one sampler per texture', expression);
    this.sampledTextures.set(code, sampler);
    const position = comparison
      ? `${layout.dimension === '2d' ? 'vec3' : 'vec4'}(${coordinates}, ${extra})`
      : coordinates;
    const level =
      callee.member === 'SampleLevel'
        ? `, ${extra}`
        : callee.member === 'SampleCmpLevelZero'
          ? ', 0.0'
          : '';
    if (comparison && layout.dimension !== '2d' && callee.member === 'SampleCmpLevelZero')
      this.fail('GLSL supports explicit-level comparison only on 2D textures', expression);
    return this.cropTextureValue(
      `${level ? 'textureLod' : 'texture'}(${code}, ${position}${level})`,
      layout
    );
  }
  private checkMultiplyArguments(expression: Expression & {kind: 'call'}): void {
    if (expression.arguments.length !== 2) this.fail('mul requires two arguments', expression);
    const left = this.getExpressionType(expression.arguments[0]);
    const right = this.getExpressionType(expression.arguments[1]);
    if (
      !/^(float|int|uint)([2-4](x[2-4])?)?$/.test(left.name) ||
      !/^(float|int|uint)([2-4](x[2-4])?)?$/.test(right.name)
    )
      this.fail('mul requires numeric arguments', expression);
    const leftMatrix = /^float([2-4])x([2-4])$/.exec(left.name);
    const rightMatrix = /^float([2-4])x([2-4])$/.exec(right.name);
    if (leftMatrix && rightMatrix && leftMatrix[2] !== rightMatrix[1])
      this.fail('mul matrix inner dimensions do not match', expression);
    if (leftMatrix && !rightMatrix && right.name !== `float${leftMatrix[2]}`)
      this.fail('mul matrix/vector dimensions do not match', expression);
    if (rightMatrix && !leftMatrix && left.name !== `float${rightMatrix[1]}`)
      this.fail('mul vector/matrix dimensions do not match', expression);
    if (
      !leftMatrix &&
      !rightMatrix &&
      !this.isScalar(left) &&
      !this.isScalar(right) &&
      left.name !== right.name
    )
      this.fail('mul vector widths do not match', expression);
  }
  private checkBinaryTypes(
    expression: Expression & {kind: 'binary'},
    left: SlangType,
    right: SlangType
  ): void {
    const operator = expression.operator;
    if (['&&', '||'].includes(operator)) {
      if (left.name !== 'bool' || right.name !== 'bool')
        this.fail('Logical operators require boolean scalars', expression);
      return;
    }
    const comparisons = ['==', '!=', '<', '>', '<=', '>='].includes(operator);
    const numeric = /^(float|int|uint)([2-4](x[2-4])?)?$/;
    if (!numeric.test(left.name) || !numeric.test(right.name)) {
      if (
        comparisons &&
        ['==', '!='].includes(operator) &&
        left.name === 'bool' &&
        right.name === 'bool'
      )
        return;
      this.fail('Arithmetic and ordering require numeric values', expression);
    }
    if (
      ['&', '|', '^', '%'].includes(operator) &&
      (left.name.startsWith('float') || right.name.startsWith('float'))
    )
      this.fail('Bitwise operators and remainder require integer values', expression);
    if (!this.isScalar(left) && !this.isScalar(right) && left.name !== right.name)
      this.fail('Operands have incompatible shapes or scalar types', expression);
  }
  private freezeLvalue(expression: Expression): string {
    if (expression.kind === 'identifier') return this.findSymbol(expression.value, expression).code;
    if (expression.kind === 'member')
      return `${this.freezeLvalue(expression.object)}.${this.structures.has(this.getExpressionType(expression.object).name) ? this.getName(expression.member) : expression.member}`;
    if (expression.kind === 'index') {
      const object = this.freezeLvalue(expression.object);
      const index = this.emitExpression(expression.index);
      const temporary = this.createTemporary();
      this.expressionPrelude.push(`let ${temporary} = ${index};`);
      return `${object}[${temporary}]`;
    }
    this.fail('Output arguments require writable variables', expression);
  }
  private emitFunctionCall(
    expression: Expression & {kind: 'call'},
    declaration: ShaderFunction
  ): string {
    const argumentsList: string[] = [];
    const copies: string[] = [];
    for (let index = 0; index < declaration.parameters.length; index++) {
      const parameter = declaration.parameters[index];
      const argument = expression.arguments[index];
      const output = parameter.modifiers.includes('out') || parameter.modifiers.includes('inout');
      if (!output) {
        const value = this.coerceExpression(argument, parameter.type);
        if (this.isWGSL) {
          const temporary = this.createTemporary();
          this.expressionPrelude.push(`let ${temporary} = ${value};`);
          argumentsList.push(temporary);
        } else argumentsList.push(value);
        continue;
      }
      this.checkWritable(argument);
      if (argument.kind === 'index' && isSlangTexture(this.getExpressionType(argument.object)))
        this.fail(
          'Texture elements cannot be out/inout arguments; use an explicit assignment',
          argument
        );
      if (!this.matchType(this.getExpressionType(argument), parameter.type))
        this.fail('Output arguments must have the exact parameter type', argument);
      if (!this.isWGSL) {
        argumentsList.push(this.emitExpression(argument));
        continue;
      }
      const destination = this.freezeLvalue(argument);
      const temporary = this.createTemporary();
      this.expressionPrelude.push(
        `var ${temporary}: ${this.getTypeName(parameter.type)}${parameter.modifiers.includes('inout') ? ` = ${destination}` : ''};`
      );
      argumentsList.push(`&${temporary}`);
      copies.push(this.emitLvalueWrite(argument, destination, temporary));
    }
    const call = `_slang_function_${this.functionKeys.get(declaration)}(${argumentsList.join(', ')})`;
    if (!this.isWGSL) return call;
    const result = declaration.type.name === 'void' ? '' : this.createTemporary();
    this.expressionPrelude.push(result ? `let ${result} = ${call};` : `${call};`, ...copies);
    return result;
  }
  private emitLvalueWrite(expression: Expression, destination: string, value: string): string {
    if (
      this.isWGSL &&
      expression.kind === 'member' &&
      !this.structures.has(this.getExpressionType(expression.object).name) &&
      expression.member.length > 1
    ) {
      const object = destination.slice(0, destination.lastIndexOf('.'));
      return [...expression.member]
        .map((component, index) => `${object}.${component} = ${value}.${'xyzw'[index]};`)
        .join('\n');
    }
    return `${destination} = ${value};`;
  }
  private emitUpdate(expression: Expression): string {
    if (expression.kind === 'unary' && ['++', '--'].includes(expression.operator)) {
      this.checkWritable(expression.operand);
      const type = this.getExpressionType(expression.operand);
      if (!['float', 'int', 'uint'].includes(type.name))
        this.fail('Increment and decrement require numeric scalars', expression);
      return `${this.emitExpression(expression.operand)} ${expression.operator === '++' ? '+=' : '-='} ${type.name === 'uint' ? '1u' : type.name === 'float' ? '1.0' : '1'}`;
    }
    if (
      expression.kind === 'binary' &&
      ['=', '+=', '-=', '*=', '/=', '%='].includes(expression.operator)
    ) {
      this.checkWritable(expression.left);
      const leftType = this.getExpressionType(expression.left);
      if (
        expression.left.kind === 'index' &&
        isSlangTexture(this.getExpressionType(expression.left.object))
      ) {
        if (expression.operator !== '=')
          this.fail(
            'Storage texture compound assignments require an explicit load and store',
            expression
          );
        return this.emitTextureStore(
          expression.left.object,
          this.coerceExpression(expression.left.index, {name: 'int2'}),
          this.coerceExpression(expression.right, leftType)
        );
      }
      if (expression.operator !== '=')
        this.checkBinaryTypes(expression, leftType, this.getExpressionType(expression.right));
      const destination = this.isWGSL
        ? this.freezeLvalue(expression.left)
        : this.emitExpression(expression.left);
      const value = this.coerceExpression(expression.right, leftType);
      if (
        this.isWGSL &&
        expression.left.kind === 'member' &&
        !this.structures.has(this.getExpressionType(expression.left.object).name) &&
        expression.left.member.length > 1
      ) {
        const temporary = this.createTemporary();
        this.expressionPrelude.push(
          `let ${temporary} = ${expression.operator === '=' ? value : `(${destination} ${expression.operator[0]} ${value})`};`
        );
        return this.emitLvalueWrite(expression.left, destination, temporary).replace(/;$/, '');
      }
      return `${destination} ${expression.operator} ${value}`;
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
    const captured = this.captureExpression(() => this.emitStatementBody(statement));
    return markSlangSource(
      [...captured.statements, captured.code].filter(Boolean).join('\n'),
      statement
    );
  }
  private emitStatementBody(statement: Statement): string {
    switch (statement.kind) {
      case 'block':
        return this.emitBlock(statement);
      case 'empty':
        return '';
      case 'variable':
        return `${this.emitLocal(statement.variable)};`;
      case 'expression': {
        const code = this.emitUpdate(statement.expression);
        return code ? `${code};` : '';
      }
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
        const condition = this.captureExpression(() =>
          this.coerceExpression(statement.condition, {name: 'bool'})
        );
        this.loopDepth++;
        const body = this.emitBlock(statement.body);
        this.loopDepth--;
        if (condition.statements.length)
          return `loop {\n${condition.statements.join('\n')}\nif (!${condition.code}) { break; }\n${body}\n}`;
        return `while (${condition.code}) ${body}`;
      }
      case 'for': {
        this.scopes.push(new Map());
        const initial = this.captureExpression(() =>
          statement.initializer
            ? this.emitStatementBody(statement.initializer).replace(/;$/, '')
            : ''
        );
        const initializer = [...initial.statements, initial.code].filter(Boolean).join('\n');
        const condition = this.captureExpression(() =>
          statement.condition ? this.coerceExpression(statement.condition, {name: 'bool'}) : ''
        );
        const update = this.captureExpression(() =>
          statement.update ? this.emitUpdate(statement.update) : ''
        );
        this.loopDepth++;
        const body = this.emitBlock(statement.body);
        this.loopDepth--;
        this.scopes.pop();
        if (
          this.isWGSL &&
          (condition.statements.length || update.statements.length || initializer.includes('\n'))
        ) {
          return `{\n${initializer}${initializer ? ';' : ''}\nloop {\n${condition.statements.join('\n')}\n${condition.code ? `if (!${condition.code}) { break; }` : ''}\n${body}\ncontinuing {\n${update.statements.join('\n')}\n${update.code ? `${update.code};` : ''}\n}\n}\n}`;
        }
        return `for (${initializer}; ${condition.code}; ${update.code}) ${body}`;
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
      'Texture2DArray',
      'TextureCube',
      'Texture3D',
      'WTexture2D',
      'RWTexture2D',
      'SamplerComparisonState',
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
      const initial = this.captureExpression(() =>
        variable.initializer ? this.coerceExpression(variable.initializer, variable.type) : ''
      );
      if (initial.statements.length)
        this.fail('Global initializers must be constant expressions', variable.location);
      const initializer = initial.code ? ` = ${initial.code}` : '';
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
      variable.attributes.some(attribute => !['vk::binding', 'format'].includes(attribute.name)) ||
      variable.attributes.filter(attribute => attribute.name === 'vk::binding').length > 1 ||
      variable.attributes.filter(attribute => attribute.name === 'format').length > 1
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
    const texture = isSlangTexture(variable.type);
    const sampler = ['SamplerState', 'SamplerComparisonState'].includes(variable.type.name);
    const textureLayout = texture
      ? getSlangTextureLayout(
          variable,
          this.comparisonTextures.has(variable.name),
          this.options.sourceName || 'shader.slang'
        )
      : undefined;
    if (textureLayout) this.textureLayouts.set(name, textureLayout);
    const access =
      textureLayout?.access ??
      (variable.type.name === 'RWStructuredBuffer' ? 'read_write' : 'read');
    if (!texture && variable.attributes.some(attribute => attribute.name === 'format'))
      this.fail('format requires a storage texture', variable.location);
    if (textureLayout?.format && !this.isWGSL && this.glslVersion !== '450')
      this.fail(
        'Storage textures require GLSL 450; WebGL 2 does not support image load/store',
        variable.location
      );
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
      variable.type.name === 'ConstantBuffer' || storage ? variable.type.element : variable.type;
    if (
      variable.type.name === 'ConstantBuffer' &&
      (!valueType || !this.structures.has(valueType.name))
    ) {
      this.fail('ConstantBuffer requires a structure type', variable.location);
    }
    const valueLayout =
      !texture && !sampler
        ? this.getLayout(valueType!, storage ? 'storage' : 'uniform', variable.location)
        : undefined;
    this.addSymbol(variable, name, access === 'read_write' || access === 'write');
    this.scopes[0].get(variable.name)!.resourceName = variable.name;
    if (this.isWGSL && !storage && !texture && !sampler)
      this.scopes[0].get(variable.name)!.uniformType = valueType;
    if (variable.modifiers.includes('cbuffer')) {
      for (const field of this.structures.get(valueType!.name)!.fields) {
        this.addSymbol(field, `${name}.${this.getName(field.name)}`, false);
        this.scopes[0].get(field.name)!.resourceName = variable.name;
        if (this.isWGSL) this.scopes[0].get(field.name)!.uniformType = field.type;
      }
    }
    this.reflection.bindings.push({
      name: variable.name,
      shaderName: name,
      ...binding,
      kind: storage ? 'storage' : texture ? 'texture' : sampler ? 'sampler' : 'uniform',
      access,
      visibility: 0,
      ...(sampler
        ? {
            samplerType:
              variable.type.name === 'SamplerComparisonState'
                ? ('comparison' as const)
                : ('filtering' as const)
          }
        : {}),
      ...(valueLayout && (this.isWGSL || storage || variable.type.name === 'ConstantBuffer')
        ? {layout: valueLayout}
        : {}),
      ...(storage && valueLayout
        ? {
            elementStride:
              Math.ceil(valueLayout.size / valueLayout.alignment) * valueLayout.alignment
          }
        : {}),
      ...(textureLayout ? {texture: textureLayout} : {}),
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
        return `${prefix} var ${name}: ${texture ? getWGSLTextureType(textureLayout!) : variable.type.name === 'SamplerComparisonState' ? 'sampler_comparison' : 'sampler'};`;
      }
      return `${prefix} var<uniform> ${name}: ${this.uniformEmitter.getTypeName(valueType!)};`;
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
      const layout = this.glslVersion === '450' ? `layout(binding = ${binding.binding}) ` : '';
      if (textureLayout!.format)
        return `layout(${textureLayout!.glslFormat}, binding = ${binding.binding}) ${access === 'write' ? 'writeonly ' : ''}uniform ${getGLSLTextureType(textureLayout!)} ${name};`;
      const textureType = getGLSLTextureType(textureLayout!);
      return `${layout}uniform ${this.glslVersion === '300 es' && textureType !== 'sampler2D' ? 'highp ' : ''}${textureType} ${name};`;
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
      shaderName: `_slang_${direction}_${(direction === 'in' ? this.inputs : this.outputs).length}`,
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
            ![
              'in',
              'out',
              'inout',
              'nointerpolation',
              'linear',
              'noperspective',
              'centroid',
              'sample'
            ].includes(modifier)
        )
      ) {
        this.fail('Unsupported entry point parameter metadata', parameter.location);
      }
      if (!parameter.modifiers.includes('out'))
        this.collectInterface(parameter, 'in', [parameter.name]);
      if (parameter.modifiers.some(modifier => ['out', 'inout'].includes(modifier)))
        this.collectInterface(parameter, 'out', [parameter.name]);
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
      parameters.push(
        this.isWGSL && parameter.modifiers.some(modifier => ['out', 'inout'].includes(modifier))
          ? `&${name}`
          : name
      );
    }
    const call = `_slang_function_${this.functionKeys.get(this.entry)}(${parameters.join(', ')})`;
    if (this.isWGSL && this.outputs.length) body.push('var _slang_output: _slang_output;');
    if (this.entry.type.name === 'void') body.push(`${call};`);
    else
      body.push(
        `${this.isWGSL ? 'let ' : ''}${this.getDeclaration(this.entry.type, '_slang_result', this.entry.location)} = ${call};`
      );
    for (const leaf of this.outputs) {
      const base = leaf.path[0] === 'result' ? '_slang_result' : `_slang_argument_${leaf.path[0]}`;
      const source =
        base +
        leaf.path
          .slice(1)
          .map(part => `.${this.getName(part)}`)
          .join('');
      body.push(
        `${this.isWGSL ? `_slang_output.${leaf.field}` : this.getGLSLInterfaceName(leaf, 'out')} = ${source};`
      );
    }
    if (this.isWGSL && this.outputs.length) body.push('return _slang_output;');
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
  private returnsValue(statement: Statement): boolean {
    if (statement.kind === 'return' || statement.kind === 'discard') return true;
    if (statement.kind === 'block')
      return statement.statements.some(child => this.returnsValue(child));
    if (statement.kind === 'if')
      return Boolean(
        statement.alternate &&
          this.returnsValue(statement.consequent) &&
          this.returnsValue(statement.alternate)
      );
    return false;
  }
  private emitFunction(declaration: ShaderFunction): string {
    if (declaration.type.name === 'array') {
      this.fail('Array return types are not supported', declaration.location);
    }
    if (declaration.type.name !== 'void' && !this.returnsValue(declaration.body))
      this.fail('Non-void functions must return a value on every path', declaration.location);
    this.temporaryIndex = 0;
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
            ![
              'in',
              'out',
              'inout',
              'nointerpolation',
              'linear',
              'noperspective',
              'centroid',
              'sample'
            ].includes(modifier)
        )
      ) {
        this.fail('Unsupported function parameter metadata', parameter.location);
      }
      if (parameter.type.name === 'void') {
        this.fail('void parameters are not supported', parameter.location);
      }
      const output = parameter.modifiers.some(modifier => ['out', 'inout'].includes(modifier));
      this.addSymbol(
        parameter,
        this.isWGSL && output
          ? `(*_slang_parameter_${parameter.name})`
          : this.getName(parameter.name)
      );
      if (output && this.isWGSL)
        return `_slang_parameter_${parameter.name}: ptr<function, ${this.getTypeName(parameter.type)}>`;
      const direction = output ? `${parameter.modifiers.includes('inout') ? 'inout' : 'out'} ` : '';
      return (
        direction +
        this.getDeclaration(
          parameter.type,
          this.isWGSL ? `_slang_parameter_${parameter.name}` : this.getName(parameter.name),
          parameter.location
        )
      );
    });
    const parameterCopies = this.isWGSL
      ? declaration.parameters
          .filter(
            parameter => !parameter.modifiers.some(modifier => ['out', 'inout'].includes(modifier))
          )
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
    const name = `_slang_function_${this.functionKeys.get(declaration)}`;
    return this.isWGSL
      ? `fn ${name}(${parameters.join(', ')})${declaration.type.name === 'void' ? '' : ` -> ${this.getTypeName(declaration.type, declaration.location)}`} ${body}`
      : `${this.getTypeName(declaration.type, declaration.location)} ${name}(${parameters.join(', ')}) ${body}`;
  }
  discoverTextureUsage(): {comparison: Set<string>; ordinary: Set<string>} {
    if (!this.hasComparisonCalls) return {comparison: new Set(), ordinary: new Set()};
    const discovery = new SlangEmitter(this.program, this.options, true);
    discovery.emitProgramParts();
    return {comparison: discovery.comparisonTextures, ordinary: discovery.ordinaryTextures};
  }
  setComparisonTextures(textures: ReadonlySet<string>): void {
    this.comparisonTextures = new Set(textures);
    this.comparisonTexturesResolved = true;
  }
  emitProgramParts(): {result: SlangTranspileResult; declarations: string[]; entry: string} {
    if (
      this.hasComparisonCalls &&
      !this.discoveringTextureUsage &&
      !this.comparisonTexturesResolved
    ) {
      // Resolve real overloads before choosing texture declarations. Discovery only substitutes
      // texture expressions; the final pass validates every method against its inferred type.
      this.comparisonTextures = this.discoverTextureUsage().comparison;
    }
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
      structures.push(markSlangSource(this.emitStructure(structure), structure.location));
      visiting.delete(structure.name);
      visited.add(structure.name);
    };
    for (const structure of this.structures.values()) {
      visitStructure(structure);
    }
    const globals = this.program.declarations
      .filter(declaration => declaration.kind === 'variable')
      .map(declaration => ({
        code: markSlangSource(this.emitGlobal(declaration), declaration.location),
        texture: isSlangTexture(declaration.type) ? this.getName(declaration.name) : undefined
      }));
    const functions = new Map<string, string>();
    const reachable = new Set<string>();
    const collectFunction = (name: string): void => {
      if (reachable.has(name)) return;
      reachable.add(name);
      const declaration = this.functions.get(name)!;
      functions.set(name, markSlangSource(this.emitFunction(declaration), declaration.location));
      // Emission resolves actual overloads, so unused alternatives stay outside the call graph.
      for (const dependency of this.callGraph.get(name) || []) collectFunction(dependency);
    };
    collectFunction(this.functionKeys.get(this.entry)!);
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
    const entry = markSlangSource(this.emitEntry(), this.entry.location);
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
        binding =>
          binding.kind !== 'sampler' &&
          (binding.kind !== 'texture' || this.usedTextures.has(binding.shaderName))
      );
    }
    for (const binding of this.reflection.bindings) {
      binding.visibility = this.usedResources.has(binding.name)
        ? {vertex: 1, fragment: 2, compute: 4}[this.stage]
        : 0;
    }
    const declarations = [
      header,
      ...structures,
      ...this.uniformEmitter.getDeclarations(),
      ...globals
        .filter(global => this.isWGSL || !global.texture || this.usedTextures.has(global.texture))
        .map(global => global.code),
      ...orderedFunctions
    ].filter(Boolean);
    const result: SlangTranspileResult = {
      ...mapSlangSource(
        [...declarations, entry].filter(Boolean).join('\n\n') + '\n',
        this.options.sourceName || 'shader.slang'
      ),
      target: this.options.target,
      ...(!this.isWGSL ? {glslVersion: this.glslVersion} : {}),
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
