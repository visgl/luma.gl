// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Expression, Statement, Token} from './ast';
import type {WGSLParserContext} from './wgsl-declarations';

/** Full expression/statement syntax is loaded only by the compiler frontend. */
export function createWGSLBodyParser(context: WGSLParserContext): {
  parseExpression: () => Expression;
  parseBody: () => Statement;
} {
  const {
    peek,
    take,
    match,
    expect,
    identifier,
    parseType,
    fail,
    parseVariableDeclaration: localDeclaration
  } = context;
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
        context.position--;
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
        if (context.isTypeName(name)) {
          context.position--;
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
        context.position--;
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
        context.position--;
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
  return {parseExpression: () => expression(), parseBody: block};
}
