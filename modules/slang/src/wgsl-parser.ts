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

/** A deliberately bounded WGSL frontend; token positions always refer to the input. */
export function parseWGSL(source: string, sourceName: string): Program {
  const tokens: Token[] = [];
  let offset = 0;
  let line = 1;
  let column = 1;
  const fail: (message: string, token?: Token) => never = (
    message,
    token = tokens[position] || {offset, line, column, text: '', kind: 'end'}
  ) => {
    throw new SlangTranspileError(message, token, sourceName);
  };
  function advance(text: string): void {
    for (const character of text) {
      if (character === '\n') {
        line++;
        column = 1;
      } else column++;
    }
    offset += text.length;
  }
  let position = 0;
  while (offset < source.length) {
    const remaining = source.slice(offset);
    const whitespace = /^\s+|^\/\/[^\n]*/.exec(remaining);
    if (whitespace) {
      advance(whitespace[0]);
      continue;
    }
    if (remaining.startsWith('/*')) {
      let depth = 1;
      let end = offset + 2;
      while (end < source.length && depth) {
        if (source.startsWith('/*', end)) {
          depth++;
          end += 2;
        } else if (source.startsWith('*/', end)) {
          depth--;
          end += 2;
        } else end++;
      }
      if (depth) fail('Unterminated block comment', {offset, line, column, text: '', kind: 'end'});
      advance(source.slice(offset, end));
      continue;
    }
    const identifier = /^[A-Za-z_][A-Za-z_0-9]*/.exec(remaining);
    const number = /^(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?[iuf]?/.exec(remaining);
    const symbol = /^(?:->|==|!=|<=|>=|&&|\|\||\+=|-=|\*=|\/=|[{}()[\];:,.@+\-*/%!=<>~&|^])/.exec(
      remaining
    );
    const match = identifier || number || symbol;
    if (!match) fail('Unsupported WGSL token', {offset, line, column, text: '', kind: 'end'});
    tokens.push({
      offset,
      line,
      column,
      sourceName,
      text: match[0],
      kind: identifier ? 'identifier' : number ? 'number' : 'symbol'
    });
    advance(match[0]);
  }
  tokens.push({offset, line, column, sourceName, text: '', kind: 'end'});
  const peek = () => tokens[position] || tokens[tokens.length - 1];
  const take = () => {
    const token = peek();
    position++;
    return token;
  };
  const match = (text: string) => (peek().text === text ? (position++, true) : false);
  function expect(text: string): Token {
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
  function parseType(): SlangType {
    const token = identifier();
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
    if (names.has(token.text)) return {name: token.text};
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
      if (!['vertex', 'fragment', 'location', 'builtin', 'interpolate'].includes(token.text))
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
  const precedence: Record<string, number> = {
    '||': 1,
    '&&': 2,
    '|': 3,
    '^': 4,
    '&': 5,
    '==': 6,
    '!=': 6,
    '<': 7,
    '>': 7,
    '<=': 7,
    '>=': 7,
    '+': 8,
    '-': 8,
    '*': 9,
    '/': 9,
    '%': 9
  };
  function expression(minimum = 0): Expression {
    const token = take();
    let result: Expression;
    if (token.text === '(') {
      result = expression();
      expect(')');
    } else if (['-', '!', '~'].includes(token.text))
      result = {
        ...token,
        kind: 'unary',
        operator: token.text,
        operand: expression(10),
        postfix: false
      };
    else if (token.kind === 'number') result = {...token, kind: 'number', value: token.text};
    else if (token.text === 'true' || token.text === 'false')
      result = {...token, kind: 'boolean', value: token.text};
    else if (token.kind === 'identifier') {
      let name = token.text;
      if (Object.hasOwn(scalars, name) || /^vec[2-4](?:[fiub])?$/.test(name)) {
        position--;
        name = parseType().name;
      }
      result = {...token, kind: 'identifier', value: name};
    } else return fail('Expected an expression', token);
    for (;;) {
      if (match('(')) {
        const argumentsList: Expression[] = [];
        if (!match(')')) {
          do {
            argumentsList.push(expression());
          } while (match(',') && peek().text !== ')');
          expect(')');
        }
        result = {...token, kind: 'call', callee: result, arguments: argumentsList};
      } else if (match('.'))
        result = {...token, kind: 'member', object: result, member: identifier().text};
      else {
        const operator = peek().text;
        const priority = precedence[operator];
        if (priority === undefined || priority < minimum) break;
        take();
        result = {
          ...token,
          kind: 'binary',
          operator,
          left: result,
          right: expression(priority + 1)
        };
      }
    }
    return result;
  }
  function block(): Statement {
    const token = expect('{');
    const statements: Statement[] = [];
    while (!match('}')) {
      if (peek().kind === 'end') fail('Unterminated block');
      const first = take();
      if (first.text === 'return') {
        const value = peek().text === ';' ? undefined : expression();
        expect(';');
        statements.push({...first, kind: 'return', expression: value});
      } else if (first.text === 'let' || first.text === 'var') {
        const name = identifier();
        const type = match(':') ? parseType() : {name: '$inferred'};
        const initializer = match('=') ? expression() : undefined;
        if (!initializer && (first.text === 'let' || type.name === '$inferred'))
          fail('Declaration requires an initializer', first);
        expect(';');
        const declaration = variable(name, type);
        declaration.modifiers = first.text === 'let' ? ['let'] : [];
        declaration.initializer = initializer;
        statements.push({...first, kind: 'variable', variable: declaration});
      } else if (first.text === '{') {
        position--;
        statements.push(block());
      } else {
        position--;
        let value = expression();
        if (['=', '+=', '-=', '*=', '/='].includes(peek().text)) {
          const operator = take().text;
          value = {...first, kind: 'binary', operator, left: value, right: expression()};
        }
        expect(';');
        statements.push({...first, kind: 'expression', expression: value});
      }
    }
    return {...token, kind: 'block', statements};
  }
  // Discover struct names before parsing signatures, without interpreting their contents.
  tokens.forEach((token, index) => {
    if (token.text === 'struct') names.add(tokens[index + 1]?.text);
  });
  const program: Program = {declarations: [], clipSpace: 'webgpu'};
  while (peek().kind !== 'end') {
    const metadata = attributes();
    const token = take();
    if (token.text === 'struct') {
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
        body: block(),
        location: name
      };
      program.declarations.push(declaration);
    } else fail(`Unsupported WGSL declaration ${token.text}`, token);
  }
  return program;
}
