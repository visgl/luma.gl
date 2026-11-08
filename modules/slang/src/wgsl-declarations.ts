// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {
  Attribute,
  Expression,
  Program,
  ShaderFunction,
  SlangType,
  Statement,
  Structure,
  Token,
  Variable
} from './ast';
import {SlangTranspileError} from './diagnostics';
import type {ShaderInterface} from './ir';

import {tokenizeWGSL} from './wgsl-lexer';

export type WGSLParserContext = {
  position: number;
  peek: () => Token;
  take: () => Token;
  match: (text: string) => boolean;
  expect: (text: string) => Token;
  identifier: () => Token;
  parseType: () => SlangType;
  parseVariableDeclaration: (token: Token) => Variable;
  isTypeName: (name: string) => boolean;
  fail: (message: string, token?: Token) => never;
};
export type WGSLDeclarationReaders = {
  parseExpression: () => Expression | undefined;
  parseBody: () => Statement;
};

/** One declaration/type grammar; callers supply full syntax readers or small balanced skippers. */
export function parseWGSLDeclarations(
  source: string,
  sourceName: string,
  createReaders: (context: WGSLParserContext) => WGSLDeclarationReaders
): Program {
  const tokens = tokenizeWGSL(source, sourceName);
  let position = 0;
  const fail: WGSLParserContext['fail'] = (
    message,
    token = tokens[position] || tokens[tokens.length - 1]
  ) => {
    throw new SlangTranspileError(message, token, sourceName);
  };
  const peek = () => tokens[position] || tokens[tokens.length - 1];
  const take = () => {
    const token = peek();
    position++;
    return token;
  };
  const match = (text: string) => (peek().text === text ? (position++, true) : false);
  function expect(text: string): Token {
    if (text === '>' && ['>=', '>>', '>>='].includes(peek().text)) {
      const token = peek();
      const consumed = {...token, text: '>'};
      tokens.splice(position, 1, consumed, {
        ...token,
        text: token.text.slice(1),
        offset: token.offset + 1,
        column: token.column + 1
      });
      position++;
      return consumed;
    }
    if (peek().text !== text) fail(`Expected ${text}`);
    return take();
  }
  function identifier(): Token {
    if (
      peek().kind !== 'identifier' ||
      peek().text.startsWith('__') ||
      [
        'fn',
        'struct',
        'return',
        'let',
        'var',
        'const',
        'alias',
        'override',
        'if',
        'else',
        'loop',
        'while',
        'for',
        'break',
        'continue',
        'discard',
        'true',
        'false',
        'enable',
        'requires',
        'diagnostic'
      ].includes(peek().text)
    )
      fail('Expected an identifier outside reserved prefixes');
    return take();
  }
  const scalars: Record<string, string> = {f32: 'float', i32: 'int', u32: 'uint', bool: 'bool'};
  const names = new Set<string>();
  const aliases = new Map<string, Token>();
  const resolvingAliases = new Set<string>();
  function parseType(): SlangType {
    const token = identifier();
    if (aliases.has(token.text)) {
      if (resolvingAliases.has(token.text)) fail('Recursive type alias', token);
      const savedToken = peek();
      resolvingAliases.add(token.text);
      position = tokens.indexOf(aliases.get(token.text)!);
      const type = parseType();
      resolvingAliases.delete(token.text);
      position = tokens.indexOf(savedToken);
      return type;
    }
    if (Object.hasOwn(scalars, token.text)) return {name: scalars[token.text]};
    const vector = /^vec([2-4])([fiub])?$/.exec(token.text);
    if (vector) {
      let scalar = vector[2]
        ? ({f: 'float', i: 'int', u: 'uint', b: 'bool'} as Record<string, string>)[vector[2]]
        : '';
      if (!scalar) {
        expect('<');
        scalar = parseType().name;
        expect('>');
      }
      if (!['float', 'int', 'uint', 'bool'].includes(scalar))
        fail('Vectors require a supported scalar type', token);
      return {name: scalar + vector[1]};
    }
    const matrix = /^mat([2-4])x([2-4])(f)?$/.exec(token.text);
    if (matrix) {
      if (!matrix[3]) {
        expect('<');
        if (parseType().name !== 'float') fail('Matrices require f32', token);
        expect('>');
      }
      return {name: `float${matrix[1]}x${matrix[2]}`};
    }
    if (token.text === 'array') {
      expect('<');
      const element = parseType();
      expect(',');
      const count = take();
      const type: SlangType = {name: 'array', element};
      if (count.kind === 'number' && /^\d+u?$/.test(count.text))
        type.length = Number(count.text.replace(/u$/, ''));
      else if (count.kind === 'identifier') type.lengthName = count.text;
      else fail('Fixed arrays require an integer count or named constant', count);
      expect('>');
      return type;
    }
    if (token.text === 'texture_2d') {
      expect('<');
      if (parseType().name !== 'float') fail('Only texture_2d<f32> is supported', token);
      expect('>');
      return {name: 'Texture2D', element: {name: 'float4'}};
    }
    if (token.text === 'sampler') return {name: 'SamplerState'};
    if (names.has(token.text)) return {name: token.text, structure: true};
    return fail(`Unsupported WGSL type ${token.text}`, token);
  }
  function attributes(): Attribute[] {
    const result: Attribute[] = [];
    while (match('@')) {
      const token = identifier();
      const argumentsList: string[] = [];
      if (match('(')) {
        do {
          argumentsList.push(take().text);
        } while (match(','));
        expect(')');
      }
      if (
        !['vertex', 'fragment', 'location', 'builtin', 'interpolate', 'group', 'binding'].includes(
          token.text
        )
      )
        fail(`Unsupported WGSL attribute ${token.text}`, token);
      result.push({name: token.text, arguments: argumentsList, location: token});
    }
    return result;
  }
  function interfaceMetadata(metadata: Attribute[]): ShaderInterface | undefined {
    if (!metadata.length) return undefined;
    const location = metadata.find(attribute => attribute.name === 'location');
    const builtin = metadata.find(attribute => attribute.name === 'builtin');
    const interpolation = metadata.find(attribute => attribute.name === 'interpolate');
    if (
      metadata.some(
        attribute => !['location', 'builtin', 'interpolate'].includes(attribute.name)
      ) ||
      new Set(metadata.map(attribute => attribute.name)).size !== metadata.length ||
      (location && builtin)
    )
      fail('Invalid interface attributes', metadata[0].location as Token);
    if (location && (location.arguments.length !== 1 || !/^\d+$/.test(location.arguments[0])))
      fail('location requires an integer', location.location as Token);
    if (
      builtin &&
      (builtin.arguments.length !== 1 ||
        !['position', 'vertex_index', 'instance_index', 'front_facing', 'frag_depth'].includes(
          builtin.arguments[0]
        ))
    )
      fail('Unsupported builtin', builtin.location as Token);
    const mode = interpolation?.arguments[0] || 'perspective';
    const sampling = interpolation?.arguments[1] || 'center';
    if (
      !['flat', 'linear', 'perspective'].includes(mode) ||
      !['center', 'centroid', 'sample'].includes(sampling) ||
      (interpolation && (interpolation.arguments.length < 1 || interpolation.arguments.length > 2))
    )
      fail('Unsupported interpolation', interpolation!.location as Token);
    if (interpolation && (builtin || (mode === 'flat' && interpolation.arguments.length > 1)))
      fail('Invalid interpolation attributes', interpolation.location as Token);
    return {
      interpolationSpecified: Boolean(interpolation),
      location: location ? Number(location.arguments[0]) : undefined,
      builtin: builtin?.arguments[0],
      interpolation: mode as ShaderInterface['interpolation'],
      sampling: sampling as ShaderInterface['sampling']
    };
  }
  function variable(token: Token, type: SlangType, metadata: Attribute[] = []): Variable {
    return {
      kind: 'variable',
      name: token.text,
      type,
      attributes: [],
      modifiers: [],
      location: token,
      interface: interfaceMetadata(metadata),
      semantic: metadata.length ? token.text : undefined
    };
  }
  function localDeclaration(first: Token): Variable {
    const name = identifier();
    const type = match(':') ? parseType() : {name: '$inferred'};
    const hasInitializer = match('=');
    const initializer = hasInitializer ? readers.parseExpression() : undefined;
    if (!hasInitializer && (first.text !== 'var' || type.name === '$inferred'))
      fail('Declaration requires an initializer', first);
    return {
      ...variable(name, type),
      modifiers: first.text === 'var' ? [] : [first.text],
      initializer
    };
  }
  const context: WGSLParserContext = {
    peek,
    take,
    match,
    expect,
    identifier,
    parseType,
    parseVariableDeclaration: localDeclaration,
    fail,
    get position() {
      return position;
    },
    set position(value) {
      position = value;
    },
    isTypeName: name =>
      Object.hasOwn(scalars, name) ||
      /^vec[2-4](?:[fiub])?$/.test(name) ||
      /^mat[2-4]x[2-4]f?$/.test(name) ||
      aliases.has(name)
  };
  const readers = createReaders(context);
  // Discover struct names before parsing signatures, without interpreting their contents.
  tokens.forEach((token, index) => {
    if (token.text === 'struct') names.add(tokens[index + 1]?.text);
    if (token.text === 'alias') {
      const name = tokens[index + 1]?.text;
      if (aliases.has(name) || names.has(name)) fail('Duplicate type declaration', token);
      aliases.set(name, tokens[index + 3]);
    }
  });
  const program: Program = {
    declarations: [],
    clipSpace: 'webgpu',
    evaluationOrder: 'left-to-right'
  };
  while (peek().kind !== 'end') {
    const metadata = attributes();
    const token = take();
    if (token.text === 'alias') {
      const name = identifier();
      expect('=');
      parseType();
      expect(';');
      if (metadata.length) fail('Alias attributes are unsupported', name);
    } else if (['var', 'const'].includes(token.text)) {
      let addressSpace = 'private';
      if (token.text === 'var' && match('<')) {
        addressSpace = identifier().text;
        expect('>');
      }
      if (!['private', 'uniform'].includes(addressSpace))
        fail('Unsupported WGSL address space', token);
      const declaration = localDeclaration(token);
      if (aliases.has(declaration.name)) fail('Duplicate declaration', token);
      if (addressSpace === 'uniform') {
        declaration.type = {name: 'ConstantBuffer', element: declaration.type};
      }
      const handle =
        !declaration.type.structure &&
        ['Texture2D', 'SamplerState'].includes(declaration.type.name);
      if (addressSpace === 'uniform' || handle) {
        const group = metadata.find(attribute => attribute.name === 'group');
        const binding = metadata.find(attribute => attribute.name === 'binding');
        if (
          metadata.length !== 2 ||
          !group ||
          !binding ||
          ![...group.arguments, ...binding.arguments].every(value => /^\d+$/.test(value)) ||
          group.arguments.length !== 1 ||
          binding.arguments.length !== 1
        )
          fail('Resources require one group and binding', token);
        declaration.binding = {
          group: Number(group.arguments[0]),
          binding: Number(binding.arguments[0])
        };
      } else if (metadata.length)
        fail('Private variables and constants cannot have binding attributes', token);
      expect(';');
      program.declarations.push(declaration);
    } else if (token.text === 'struct') {
      if (metadata.length) fail('Struct attributes are unsupported', token);
      const name = identifier();
      expect('{');
      const fields: Variable[] = [];
      while (!match('}')) {
        const fieldMetadata = attributes();
        const field = identifier();
        expect(':');
        fields.push(variable(field, parseType(), fieldMetadata));
        if (!match(',')) {
          expect('}');
          break;
        }
      }
      match(';');
      const structure: Structure = {kind: 'struct', name: name.text, fields, location: name};
      program.declarations.push(structure);
    } else if (token.text === 'fn') {
      const name = identifier();
      if (aliases.has(name.text)) fail('Duplicate declaration', name);
      expect('(');
      const parameters: Variable[] = [];
      if (!match(')')) {
        do {
          const parameterMetadata = attributes();
          const parameter = identifier();
          expect(':');
          parameters.push(variable(parameter, parseType(), parameterMetadata));
        } while (match(',') && peek().text !== ')');
        expect(')');
      }
      let returnMetadata: Attribute[] = [];
      let type: SlangType = {name: 'void'};
      if (match('->')) {
        returnMetadata = attributes();
        type = parseType();
      }
      if (
        metadata.length > 1 ||
        metadata.some(
          attribute =>
            !['vertex', 'fragment'].includes(attribute.name) || attribute.arguments.length
        )
      )
        fail('Functions support one vertex or fragment stage attribute', token);
      const declaration: ShaderFunction = {
        kind: 'function',
        name: name.text,
        type,
        parameters,
        attributes: metadata.map(attribute => ({
          ...attribute,
          name: 'shader',
          arguments: [attribute.name]
        })),
        semantic: returnMetadata.length ? name.text : undefined,
        interface: interfaceMetadata(returnMetadata),
        body: readers.parseBody(),
        location: name
      };
      program.declarations.push(declaration);
    } else fail(`Unsupported WGSL declaration ${token.text}`, token);
  }
  return program;
}
