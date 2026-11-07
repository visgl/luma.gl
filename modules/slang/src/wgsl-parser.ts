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
    const symbol =
      /^(?:->|<<=|>>=|<<|>>|\+\+|--|%=|&=|\|=|\^=|==|!=|<=|>=|&&|\|\||\+=|-=|\*=|\/=|[{}()[\];:,.@+\-*/%!=<>~&|^])/.exec(
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
    '<<': 8,
    '>>': 8,
    '+': 9,
    '-': 9,
    '*': 10,
    '/': 10,
    '%': 10
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
        operand: expression(11),
        postfix: false
      };
    else if (token.kind === 'number') result = {...token, kind: 'number', value: token.text};
    else if (token.text === 'true' || token.text === 'false')
      result = {...token, kind: 'boolean', value: token.text};
    else if (token.kind === 'identifier') {
      let name = token.text;
      if (name === 'bitcast') {
        expect('<');
        const type = parseType();
        expect('>');
        expect('(');
        const operand = expression();
        expect(')');
        result = {...token, kind: 'bitcast', type, operand};
      } else if (name === 'array') {
        position--;
        const type = parseType();
        expect('(');
        const elements: Expression[] = [];
        if (!match(')')) {
          do {
            elements.push(expression());
          } while (match(',') && peek().text !== ')');
          expect(')');
        }
        result = {...token, kind: 'construct', type, elements};
      } else {
        if (
          Object.hasOwn(scalars, name) ||
          /^vec[2-4](?:[fiub])?$/.test(name) ||
          /^mat[2-4]x[2-4]f?$/.test(name) ||
          aliases.has(name)
        ) {
          position--;
          const type = parseType();
          if (type.name === 'array') {
            expect('(');
            const elements: Expression[] = [];
            if (!match(')')) {
              do {
                elements.push(expression());
              } while (match(',') && peek().text !== ')');
              expect(')');
            }
            result = {...token, kind: 'construct', type, elements};
            // Continue through postfix parsing with the full array type.
            return parsePostfix(result, token, minimum);
          }
          name = type.name;
        }
        result = {...token, kind: 'identifier', value: name};
      }
    } else return fail('Expected an expression', token);
    return parsePostfix(result, token, minimum);
  }
  function parsePostfix(result: Expression, token: Token, minimum: number): Expression {
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
      } else if (match('[')) {
        const index = expression();
        expect(']');
        result = {...token, kind: 'index', object: result, index};
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
  const assignments = ['=', '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '<<=', '>>='];
  function localDeclaration(first: Token): Variable {
    const name = identifier();
    const type = match(':') ? parseType() : {name: '$inferred'};
    const initializer = match('=') ? expression() : undefined;
    if (!initializer && (first.text !== 'var' || type.name === '$inferred'))
      fail('Declaration requires an initializer', first);
    return {
      ...variable(name, type),
      modifiers: first.text === 'var' ? [] : [first.text],
      initializer
    };
  }
  function update(): Expression {
    const first = peek();
    let value = expression();
    if (assignments.includes(peek().text)) {
      const operator = take().text;
      value = {...first, kind: 'binary', operator, left: value, right: expression()};
    } else if (['++', '--'].includes(peek().text))
      value = {...first, kind: 'unary', operator: take().text, operand: value, postfix: true};
    return value;
  }
  function statement(): Statement {
    const first = take();
    switch (first.text) {
      case '{':
        position--;
        return block();
      case ';':
        return {...first, kind: 'empty'};
      case 'return': {
        const value = peek().text === ';' ? undefined : expression();
        expect(';');
        return {...first, kind: 'return', expression: value};
      }
      case 'var':
      case 'let':
      case 'const': {
        const declaration = localDeclaration(first);
        expect(';');
        return {...first, kind: 'variable', variable: declaration};
      }
      case 'if': {
        const condition = expression();
        const consequent = block();
        let alternate: Statement | undefined;
        if (match('else')) alternate = peek().text === 'if' ? statement() : block();
        return {...first, kind: 'if', condition, consequent, alternate};
      }
      case 'while': {
        const condition = expression();
        return {...first, kind: 'while', condition, body: block()};
      }
      case 'for': {
        expect('(');
        let initializer: Statement | undefined;
        if (peek().text !== ';') {
          const token = peek();
          initializer = ['var', 'let', 'const'].includes(token.text)
            ? (take(), {...token, kind: 'variable', variable: localDeclaration(token)})
            : {...token, kind: 'expression', expression: update()};
        }
        expect(';');
        const condition = peek().text === ';' ? undefined : expression();
        expect(';');
        const advance = peek().text === ')' ? undefined : update();
        expect(')');
        return {...first, kind: 'for', initializer, condition, update: advance, body: block()};
      }
      case 'switch': {
        const selector = expression();
        expect('{');
        const clauses: import('./ast').SwitchClause[] = [];
        while (!match('}')) {
          const label = take();
          const labels: (Expression | null)[] = [];
          if (label.text === 'default') labels.push(null);
          else if (label.text === 'case') {
            do {
              labels.push(match('default') ? null : expression());
            } while (match(','));
          } else fail('Expected case or default', label);
          match(':');
          const body = block();
          clauses.push({
            ...label,
            labels,
            statements: body.kind === 'block' ? body.statements : []
          });
        }
        return {...first, kind: 'switch', selector, clauses};
      }
      case 'break':
      case 'continue':
      case 'discard':
        expect(';');
        return {...first, kind: first.text};
      case 'loop':
        return fail('loop/continuing requires the next language tranche', first);
      default:
        position--;
        const value = update();
        expect(';');
        return {...first, kind: 'expression', expression: value};
    }
  }
  function block(): Statement {
    const token = expect('{');
    const statements: Statement[] = [];
    while (!match('}')) {
      if (peek().kind === 'end') fail('Unterminated block');
      statements.push(statement());
    }
    return {...token, kind: 'block', statements};
  }
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
      const handle = ['Texture2D', 'SamplerState'].includes(declaration.type.name);
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
        body: block(),
        location: name
      };
      program.declarations.push(declaration);
    } else fail(`Unsupported WGSL declaration ${token.text}`, token);
  }
  return program;
}
