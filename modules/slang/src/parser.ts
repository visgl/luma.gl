// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {isSlangResource} from './resources';

import type {
  Attribute,
  Expression,
  Program,
  ShaderFunction,
  SlangType,
  Statement,
  Structure,
  SwitchClause,
  Token,
  Variable
} from './ast';
import {SlangTranspileError} from './diagnostics';
import {tokenizeSlang} from './lexer';

const MODIFIERS = new Set([
  'static',
  'const',
  'uniform',
  'groupshared',
  'in',
  'out',
  'inout',
  'nointerpolation',
  'linear',
  'centroid',
  'sample',
  'noperspective'
]);
const PRECEDENCE: Record<string, number> = {
  '=': 1,
  '+=': 1,
  '-=': 1,
  '*=': 1,
  '/=': 1,
  '%=': 1,
  '&=': 1,
  '|=': 1,
  '^=': 1,
  '<<=': 1,
  '>>=': 1,
  '||': 3,
  '&&': 4,
  '|': 5,
  '^': 6,
  '&': 7,
  '==': 8,
  '!=': 8,
  '<': 9,
  '>': 9,
  '<=': 9,
  '>=': 9,
  '<<': 10,
  '>>': 10,
  '+': 11,
  '-': 11,
  '*': 12,
  '/': 12,
  '%': 12
};

export class SlangParser {
  private tokens: Token[];
  private position = 0;
  private typeNames = new Set(['void', 'bool', 'int', 'uint', 'float']);

  constructor(
    source: string,
    private sourceName: string
  ) {
    this.tokens = tokenizeSlang(source, sourceName);
    // Slang permits using structures before their declarations.
    for (let index = 0; index < this.tokens.length - 1; index++) {
      if (this.tokens[index].text === 'struct') {
        this.typeNames.add(this.tokens[index + 1].text);
      }
    }
  }
  private peek(distance = 0): Token {
    return this.tokens[this.position + distance] || this.tokens[this.tokens.length - 1];
  }
  private take(): Token {
    return this.tokens[this.position++];
  }
  private match(text: string): boolean {
    if (this.peek().text === text) {
      this.position++;
      return true;
    }
    return false;
  }
  private expect(text: string): Token {
    if (this.peek().text !== text) {
      this.fail(`Expected ${JSON.stringify(text)}, found ${JSON.stringify(this.peek().text)}`);
    }
    return this.take();
  }
  private fail(message: string, token = this.peek()): never {
    throw new SlangTranspileError(message, token, this.sourceName);
  }
  private identifier(): Token {
    if (this.peek().kind !== 'identifier') {
      this.fail('Expected an identifier');
    }
    return this.take();
  }
  private isType(text: string): boolean {
    return this.typeNames.has(text) || /^(float|int|uint|bool)[2-4](x[2-4])?$/.test(text);
  }

  parseProgram(): Program {
    const declarations: Program['declarations'] = [];
    while (this.peek().kind !== 'end') {
      const attributes = this.parseAttributes();
      if (this.match('struct')) {
        if (attributes.length) {
          this.fail('Attributes on structures are not supported');
        }
        const name = this.identifier();
        const fields: Variable[] = [];
        this.expect('{');
        while (!this.match('}')) {
          fields.push(this.parseVariable());
          this.expect(';');
        }
        this.expect(';');
        declarations.push({kind: 'struct', name: name.text, fields, location: name});
        continue;
      }
      if (this.peek().text === 'cbuffer') {
        this.take();
        const name = this.identifier();
        const binding = this.parseSemantic().binding;
        this.expect('{');
        const fields: Variable[] = [];
        while (!this.match('}')) {
          fields.push(this.parseVariable());
          this.expect(';');
        }
        this.match(';');
        // Cbuffer fields have global visibility. Normalize into a ConstantBuffer plus aliases
        // during emission rather than changing the parser's identifier tokens.
        const structure: Structure = {
          kind: 'struct',
          name: `${name.text}_Type`,
          fields,
          location: name
        };
        this.typeNames.add(structure.name);
        declarations.push(structure, {
          kind: 'variable',
          name: name.text,
          type: {name: 'ConstantBuffer', element: {name: structure.name}},
          modifiers: ['cbuffer'],
          attributes,
          binding,
          location: name
        });
        continue;
      }
      const modifiers = this.parseModifiers();
      const type = this.parseType();
      const name = this.identifier();
      if (this.match('(')) {
        if (modifiers.length) {
          this.fail('Function modifiers are not supported', name);
        }
        const parameters: Variable[] = [];
        if (!this.match(')')) {
          do {
            parameters.push(this.parseVariable());
          } while (this.match(','));
          this.expect(')');
        }
        const {semantic, binding} = this.parseSemantic();
        if (binding) {
          this.fail('A function cannot have a resource binding', name);
        }
        const declaration: ShaderFunction = {
          kind: 'function',
          name: name.text,
          type,
          parameters,
          semantic,
          attributes,
          body: this.parseBlock(),
          location: name
        };
        declarations.push(declaration);
      } else {
        declarations.push(this.finishVariable(type, name, modifiers, attributes));
        this.expect(';');
      }
    }
    return {declarations};
  }
  private parseModifiers(): string[] {
    const modifiers: string[] = [];
    while (MODIFIERS.has(this.peek().text)) {
      modifiers.push(this.take().text);
    }
    return modifiers;
  }
  private parseAttributes(): Attribute[] {
    const attributes: Attribute[] = [];
    while (this.match('[')) {
      const location = this.peek();
      let name = this.identifier().text;
      while (this.match('::')) {
        name += `::${this.identifier().text}`;
      }
      const argumentsList: string[] = [];
      if (this.match('(')) {
        if (!this.match(')')) {
          do {
            const argument = this.take();
            if (!['number', 'string', 'identifier'].includes(argument.kind)) {
              this.fail('Expected a literal attribute argument', argument);
            }
            argumentsList.push(
              argument.kind === 'string' ? JSON.parse(argument.text) : argument.text
            );
          } while (this.match(','));
          this.expect(')');
        }
      }
      this.expect(']');
      attributes.push({name, arguments: argumentsList, location});
    }
    return attributes;
  }
  private parseType(): SlangType {
    const name = this.identifier();
    if (!this.isType(name.text) && !isSlangResource({name: name.text})) {
      this.fail(`Unsupported type or declaration ${name.text}`, name);
    }
    const type: SlangType = {name: name.text};
    if (this.match('<')) {
      type.element = this.parseType();
      this.expect('>');
    }
    return type;
  }
  private parseVariable(): Variable {
    if (['let', 'var'].includes(this.peek().text)) {
      const immutable = this.take().text === 'let';
      const name = this.identifier();
      const type = this.match(':') ? this.parseType() : {name: '$inferred'};
      const variable = this.finishVariable(type, name, immutable ? ['let'] : [], []);
      if (!variable.initializer && (immutable || type.name === '$inferred'))
        this.fail('Inferred variables and let declarations require an initializer', name);
      return variable;
    }
    const attributes = this.parseAttributes();
    const modifiers = this.parseModifiers();
    const type = this.parseType();
    const name = this.identifier();
    return this.finishVariable(type, name, modifiers, attributes);
  }
  private finishVariable(
    type: SlangType,
    name: Token,
    modifiers: string[],
    attributes: Attribute[]
  ): Variable {
    const lengths: number[] = [];
    while (this.match('[')) {
      const length = this.take();
      if (!/^\d+$/.test(length.text) || Number(length.text) < 1) {
        this.fail('Array length must be a positive integer literal', length);
      }
      lengths.push(Number(length.text));
      this.expect(']');
    }
    for (const length of lengths.reverse()) {
      type = {name: 'array', element: type, length};
    }
    const {semantic, binding} = this.parseSemantic();
    const initializer = this.match('=') ? this.parseExpression() : undefined;
    return {
      kind: 'variable',
      name: name.text,
      type,
      modifiers,
      attributes,
      semantic,
      binding,
      initializer,
      location: name
    };
  }
  private parseSemantic(): {semantic?: string; binding?: Variable['binding']} {
    if (!this.match(':')) {
      return {};
    }
    const semantic = this.identifier();
    if (semantic.text !== 'register') {
      return {semantic: semantic.text};
    }
    this.expect('(');
    const register = this.identifier();
    if (!/^[bstu]\d+$/.test(register.text)) {
      this.fail('Expected a resource register such as b0 or t1', register);
    }
    let group = 0;
    if (this.match(',')) {
      const space = this.identifier();
      if (!/^space\d+$/.test(space.text)) {
        this.fail('Expected a register space such as space0', space);
      }
      group = Number(space.text.slice(5));
    }
    this.expect(')');
    return {binding: {group, binding: Number(register.text.slice(1))}};
  }
  private parseBlock(): Statement {
    const location = this.expect('{');
    const statements: Statement[] = [];
    while (!this.match('}')) {
      if (this.peek().kind === 'end') {
        this.fail('Unterminated block');
      }
      statements.push(this.parseStatement());
    }
    return {...location, kind: 'block', statements};
  }
  private parseStatement(): Statement {
    const location = this.peek();
    if (location.text === '{') {
      return this.parseBlock();
    }
    if (this.match(';')) {
      return {...location, kind: 'empty'};
    }
    if (this.match('return')) {
      const expression = this.peek().text === ';' ? undefined : this.parseExpression();
      this.expect(';');
      return {...location, kind: 'return', expression};
    }
    for (const kind of ['break', 'continue', 'discard'] as const) {
      if (this.match(kind)) {
        this.expect(';');
        return {...location, kind};
      }
    }
    if (this.match('if')) {
      this.expect('(');
      const condition = this.parseExpression();
      this.expect(')');
      const consequent = this.parseStatement();
      const alternate = this.match('else') ? this.parseStatement() : undefined;
      return {...location, kind: 'if', condition, consequent, alternate};
    }
    if (this.match('switch')) {
      this.expect('(');
      const selector = this.parseExpression();
      this.expect(')');
      this.expect('{');
      const clauses: SwitchClause[] = [];
      while (!this.match('}')) {
        const clauseLocation = this.peek();
        const labels: (Expression | null)[] = [];
        do {
          if (this.match('case')) labels.push(this.parseExpression());
          else if (this.match('default')) labels.push(null);
          else this.fail('Switch bodies require case or default labels');
          this.expect(':');
        } while (['case', 'default'].includes(this.peek().text));
        const statements: Statement[] = [];
        while (!['case', 'default', '}'].includes(this.peek().text)) {
          if (this.peek().kind === 'end') this.fail('Unterminated switch');
          statements.push(this.parseStatement());
        }
        clauses.push({...clauseLocation, labels, statements});
      }
      return {...location, kind: 'switch', selector, clauses};
    }
    if (this.match('do')) {
      const body = this.parseStatement();
      this.expect('while');
      this.expect('(');
      const condition = this.parseExpression();
      this.expect(')');
      this.expect(';');
      return {...location, kind: 'do', condition, body};
    }
    if (this.match('while')) {
      this.expect('(');
      const condition = this.parseExpression();
      this.expect(')');
      return {...location, kind: 'while', condition, body: this.parseStatement()};
    }
    if (this.match('for')) {
      this.expect('(');
      const initializer = this.peek().text === ';' ? undefined : this.parseSimpleStatement();
      this.expect(';');
      const condition = this.peek().text === ';' ? undefined : this.parseExpression();
      this.expect(';');
      const update = this.peek().text === ')' ? undefined : this.parseExpression();
      this.expect(')');
      return {
        ...location,
        kind: 'for',
        initializer,
        condition,
        update,
        body: this.parseStatement()
      };
    }
    const statement = this.parseSimpleStatement();
    this.expect(';');
    return statement;
  }
  private parseSimpleStatement(): Statement {
    const location = this.peek();
    if (
      ['let', 'var'].includes(location.text) ||
      MODIFIERS.has(location.text) ||
      (this.isType(location.text) && this.peek(1).kind === 'identifier')
    ) {
      return {...location, kind: 'variable', variable: this.parseVariable()};
    }
    return {...location, kind: 'expression', expression: this.parseExpression()};
  }
  private parseExpression(minimumPrecedence = 1): Expression {
    let expression = this.parsePrefix();
    while (true) {
      const operator = this.peek();
      if (operator.text === '?' && minimumPrecedence <= 2) {
        this.take();
        const consequent = this.parseExpression();
        this.expect(':');
        expression = {
          ...operator,
          kind: 'conditional',
          condition: expression,
          consequent,
          alternate: this.parseExpression(2)
        };
        continue;
      }
      const precedence = PRECEDENCE[operator.text];
      if (!precedence || precedence < minimumPrecedence) {
        break;
      }
      this.take();
      const right = this.parseExpression(precedence + (precedence === 1 ? 0 : 1));
      expression = {...operator, kind: 'binary', operator: operator.text, left: expression, right};
    }
    return expression;
  }
  private parsePrefix(): Expression {
    const token = this.take();
    let expression: Expression;
    if (['!', '~', '-', '+', '++', '--'].includes(token.text)) {
      return {
        ...token,
        kind: 'unary',
        operator: token.text,
        operand: this.parsePrefix(),
        postfix: false
      };
    }
    if (token.text === '{') {
      const elements: Expression[] = [];
      if (!this.match('}')) {
        do {
          if (this.peek().text === '}') break;
          elements.push(this.parseExpression());
        } while (this.match(','));
        this.expect('}');
      }
      return {...token, kind: 'initializer', elements};
    }
    if (token.text === '(') {
      if (this.isType(this.peek().text) && this.peek(1).text === ')') {
        const type = this.parseType();
        this.expect(')');
        return {...token, kind: 'cast', type, operand: this.parsePrefix()};
      }
      expression = this.parseExpression();
      this.expect(')');
    } else if (token.kind === 'number') {
      expression = {...token, kind: 'number', value: token.text};
    } else if (token.text === 'true' || token.text === 'false') {
      expression = {...token, kind: 'boolean', value: token.text};
    } else if (token.kind === 'identifier') {
      expression = {...token, kind: 'identifier', value: token.text};
    } else {
      this.fail('Expected an expression', token);
    }
    while (true) {
      if (this.match('(')) {
        const argumentsList: Expression[] = [];
        if (!this.match(')')) {
          do {
            argumentsList.push(this.parseExpression());
          } while (this.match(','));
          this.expect(')');
        }
        expression = {...token, kind: 'call', callee: expression, arguments: argumentsList};
      } else if (this.match('.')) {
        expression = {...token, kind: 'member', object: expression, member: this.identifier().text};
      } else if (this.match('[')) {
        const index = this.parseExpression();
        this.expect(']');
        expression = {...token, kind: 'index', object: expression, index};
      } else if (this.peek().text === '++' || this.peek().text === '--') {
        expression = {
          ...token,
          kind: 'unary',
          operator: this.take().text,
          operand: expression,
          postfix: true
        };
      } else {
        break;
      }
    }
    return expression;
  }
}
