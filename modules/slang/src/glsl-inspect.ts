// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {tokenizeSlang} from './lexer';
import {SlangTranspileError} from './diagnostics';
import type {Token} from './ast';
import type {
  InspectionType,
  InspectionVariable,
  InspectionFunction,
  ShaderInspection,
  InspectShaderOptions
} from './inspection-types';

export type InspectGLSLOptions = InspectShaderOptions & {stage?: 'vertex' | 'fragment' | 'compute'};
const QUALIFIERS = new Set([
  'const',
  'in',
  'out',
  'inout',
  'uniform',
  'buffer',
  'attribute',
  'varying',
  'highp',
  'mediump',
  'lowp',
  'flat',
  'smooth',
  'noperspective',
  'centroid',
  'sample',
  'invariant',
  'precise',
  'readonly',
  'writeonly',
  'coherent',
  'volatile',
  'restrict'
]);

/** Parse declaration IR, skipping function bodies; no preprocessing, linking or expression analysis. */
export function inspectGLSL(source: string, options: InspectGLSLOptions = {}): ShaderInspection {
  const sourceName = options.sourceName || 'shader.glsl';
  let version: string | undefined;
  const sourceLocation = (offset: number) => {
    const lines = source.slice(0, offset).split('\n');
    return {offset, line: lines.length, column: lines.at(-1)!.length + 1, sourceName};
  };
  // Matching whole comments first prevents directives inside comments from being interpreted.
  const masked = source.replace(/\/\/[^\n]*|\/\*[\s\S]*?\*\//g, text =>
    text.replace(/[^\n]/g, ' ')
  );
  const prepared = masked.replace(/^[ \t]*#[^\n]*/gm, (text, offset: number) => {
    if (/^\s*#\s*$/.test(text)) return text.replace(/[^\n]/g, ' ');
    const directive = /^\s*#\s*([A-Za-z_][A-Za-z0-9_]*)\s*(.*)$/.exec(text);
    if (!directive)
      throw new SlangTranspileError('Invalid GLSL directive', sourceLocation(offset), sourceName);
    if (directive[1] === 'version') {
      if (version || !/^\d+(?:\s+(?:es|core|compatibility))?\s*$/.test(directive[2]))
        throw new SlangTranspileError(
          'Invalid or duplicate GLSL version directive',
          sourceLocation(offset),
          sourceName
        );
      version = directive[2].trim();
    } else if (directive[1] !== 'extension')
      throw new SlangTranspileError(
        'GLSL inspection requires preprocessed source; only version and extension directives are accepted',
        sourceLocation(offset),
        sourceName
      );
    return text.replace(/[^\n]/g, ' ');
  });
  const tokens = tokenizeSlang(prepared, sourceName);
  let position = 0;
  const peek = () => tokens[position];
  const take = () => tokens[position++];
  const match = (text: string) => (peek().text === text ? (position++, true) : false);
  const fail = (message: string, token = peek()): never => {
    throw new SlangTranspileError(message, token, sourceName);
  };
  const expect = (text: string) => {
    if (peek().text !== text) fail(`Expected ${text}`);
    return take();
  };
  const identifier = () => {
    if (peek().kind !== 'identifier') fail('Expected an identifier');
    return take();
  };
  const location = (token: Token) => sourceLocation(token.offset);
  const structures: ShaderInspection['structures'] = [];
  const globals: ShaderInspection['globals'] = [];
  const functions: InspectionFunction[] = [];
  const structureNames = new Set<string>();
  for (let index = 0; index < tokens.length - 1; index++)
    if (tokens[index].text === 'struct') structureNames.add(tokens[index + 1].text);
  function parseType(): InspectionType {
    const token = identifier();
    const name = token.text;
    if (name === 'void') return {kind: 'void'};
    const scalar = ({float: 'f32', int: 'i32', uint: 'u32', bool: 'bool'} as const)[
      name as 'float'
    ];
    if (Object.hasOwn({float: 1, int: 1, uint: 1, bool: 1}, name)) return {kind: 'scalar', scalar};
    const vector = /^([iub]?)vec([2-4])$/.exec(name);
    if (vector)
      return {
        kind: 'vector',
        scalar: ({i: 'i32', u: 'u32', b: 'bool', '': 'f32'} as const)[vector[1] as 'i'],
        width: Number(vector[2])
      };
    const matrix = /^mat([2-4])(?:x([2-4]))?$/.exec(name);
    if (matrix)
      return {
        kind: 'matrix',
        scalar: 'f32',
        columns: Number(matrix[1]),
        rows: Number(matrix[2] || matrix[1])
      };
    if (structureNames.has(name)) return {kind: 'struct', name};
    if (
      /^(?:[iu]?sampler|[iu]?image)(?:1D(?:Array)?|2D(?:Array|MS(?:Array)?|Rect)?|3D|Cube(?:Array)?|Buffer)(?:Shadow)?$/.test(
        name
      )
    )
      return {kind: 'opaque', name};
    return fail(`Unsupported GLSL type ${name}`, token);
  }
  type Metadata = {qualifiers: string[]; layout: Record<string, string | true>};
  function metadata(): Metadata {
    const qualifiers: string[] = [];
    const layout: Record<string, string | true> = Object.create(null);
    for (;;) {
      if (match('layout')) {
        expect('(');
        do {
          const key = identifier();
          if (Object.hasOwn(layout, key.text)) fail('Duplicate layout qualifier', key);
          if (match('=')) {
            const value = take();
            if (value.kind !== 'number' || !/^\d+$/.test(value.text))
              fail('Layout values require decimal integer literals', value);
            layout[key.text] = value.text;
          } else layout[key.text] = true;
        } while (match(','));
        expect(')');
      } else if (QUALIFIERS.has(peek().text)) qualifiers.push(take().text);
      else break;
    }
    return {qualifiers, layout};
  }
  function arrayType(element: InspectionType): InspectionType {
    const dimensions: (number | undefined)[] = [];
    while (match('[')) {
      let length: number | undefined;
      if (peek().text !== ']') {
        const count = take();
        if (count.kind !== 'number' || !/^\d+u?$/.test(count.text))
          fail('Array lengths require decimal integer literals', count);
        length = Number(count.text.replace(/u$/, ''));
        if (!Number.isSafeInteger(length) || length < 1) fail('Invalid array length', count);
      }
      expect(']');
      dimensions.push(length);
    }
    for (const length of dimensions.reverse())
      element = {kind: 'array', element, ...(length === undefined ? {} : {length})};
    return element;
  }
  function variable(name: Token, type: InspectionType, details: Metadata): InspectionVariable {
    const {qualifiers, layout} = details;
    const result: InspectionVariable = {
      name: name.text,
      type: arrayType(type),
      location: location(name),
      qualifiers: [...qualifiers]
    };
    if (qualifiers.includes('buffer')) result.addressSpace = 'storage';
    else if (qualifiers.includes('uniform'))
      result.addressSpace = type.kind === 'opaque' ? 'handle' : 'uniform';
    if (Object.keys(layout).length) result.layout = {...layout};
    if (typeof layout['binding'] === 'string')
      result.binding = {
        binding: Number(layout['binding']),
        ...(typeof layout['set'] === 'string' ? {group: Number(layout['set'])} : {})
      };
    if (typeof layout['location'] === 'string')
      result.interface = {
        location: Number(layout['location']),
        interpolation: qualifiers.includes('flat')
          ? 'flat'
          : qualifiers.includes('noperspective')
            ? 'linear'
            : 'perspective',
        sampling: qualifiers.includes('centroid')
          ? 'centroid'
          : qualifiers.includes('sample')
            ? 'sample'
            : 'center',
        interpolationSpecified: qualifiers.some(value =>
          ['flat', 'smooth', 'noperspective'].includes(value)
        )
      };
    return result;
  }
  function skipInitializer(): void {
    if (!match('=')) return;
    const stack: string[] = [];
    let values = 0;
    while (peek().kind !== 'end') {
      const token = peek();
      if (!stack.length && [',', ';'].includes(token.text)) break;
      if (['(', '[', '{'].includes(token.text))
        stack.push({'(': ')', '[': ']', '{': '}'}[token.text]!);
      else if ([')', ']', '}'].includes(token.text) && stack.pop() !== token.text)
        fail('Unbalanced initializer', token);
      take();
      values++;
    }
    if (stack.length || !values) fail('Incomplete initializer');
  }
  function fields(): InspectionVariable[] {
    expect('{');
    const members: InspectionVariable[] = [];
    while (!match('}')) {
      if (peek().kind === 'end') fail('Unterminated declaration block');
      const details = metadata();
      const type = parseType();
      do {
        const name = identifier();
        members.push(variable(name, type, details));
      } while (match(','));
      expect(';');
    }
    if (new Set(members.map(member => member.name)).size !== members.length)
      fail('Duplicate block member');
    return members;
  }
  function skipBody(): void {
    expect('{');
    let depth = 1;
    while (depth) {
      const token = take();
      if (!token || token.kind === 'end')
        fail('Unterminated function body', tokens[tokens.length - 1]);
      if (token.text === '{') depth++;
      if (token.text === '}') depth--;
    }
  }
  while (peek().kind !== 'end') {
    if (match(';')) continue;
    if (match('precision')) {
      if (!['highp', 'mediump', 'lowp'].includes(take().text)) fail('Expected precision qualifier');
      parseType();
      expect(';');
      continue;
    }
    const details = metadata();
    if (match('struct')) {
      const name = identifier();
      const members = fields();
      structures.push({name: name.text, members, location: location(name)});
      if (!match(';')) {
        do {
          const instance = identifier();
          globals.push(variable(instance, {kind: 'struct', name: name.text}, details));
          skipInitializer();
        } while (match(','));
        expect(';');
      }
      continue;
    }
    // Interface/resource blocks have a block name followed directly by a member body.
    if (peek().kind === 'identifier' && tokens[position + 1]?.text === '{') {
      if (!details.qualifiers.some(value => ['uniform', 'buffer', 'in', 'out'].includes(value)))
        fail('Interface blocks require a storage qualifier');
      const name = identifier();
      const members = fields();
      const instance = peek().kind === 'identifier' ? take() : undefined;
      const declaration = variable(instance || name, {kind: 'struct', name: name.text}, details);
      declaration.block = {
        name: name.text,
        members,
        ...(instance ? {instanceName: instance.text} : {})
      };
      globals.push(declaration);
      expect(';');
      continue;
    }
    const type = parseType();
    const name = identifier();
    if (match('(')) {
      const parameters: InspectionVariable[] = [];
      if (peek().text === 'void' && tokens[position + 1]?.text === ')') take();
      if (!match(')')) {
        do {
          const parameterMetadata = metadata();
          const parameterType = parseType();
          // Unnamed prototype parameters retain an empty name, never a guessed identifier.
          const parameterName = peek().kind === 'identifier' ? take() : {...peek(), text: ''};
          parameters.push(variable(parameterName, parameterType, parameterMetadata));
        } while (match(','));
        expect(')');
      }
      const hasBody = peek().text === '{';
      if (hasBody) skipBody();
      else expect(';');
      functions.push({
        name: name.text,
        returnType: type,
        parameters,
        location: location(name),
        hasBody,
        ...(name.text === 'main' && options.stage ? {stage: options.stage} : {})
      });
    } else {
      globals.push(variable(name, type, details));
      skipInitializer();
      while (match(',')) {
        globals.push(variable(identifier(), type, details));
        skipInitializer();
      }
      expect(';');
    }
  }
  return {
    language: 'glsl',
    sourceName,
    ...(version ? {version} : {}),
    structures,
    globals,
    functions,
    entryPoints: functions.filter(value => value.name === 'main' && value.hasBody)
  };
}
