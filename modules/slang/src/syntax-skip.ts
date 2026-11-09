// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Token} from './ast';

export type SyntaxCursor = {
  peek: () => Token;
  take: () => Token;
  expect: (text: string) => Token;
  fail: (message: string, token?: Token) => never;
};
const CLOSING: Record<string, string> = {'(': ')', '[': ']', '{': '}'};

/** Shared delimiter validation for small WGSL/GLSL declaration readers. */
function skipSyntax(cursor: SyntaxCursor, closing: string[], separators: readonly string[]): void {
  let consumed = false;
  while (cursor.peek().kind !== 'end') {
    const token = cursor.peek();
    if (!closing.length && separators.includes(token.text)) break;
    if (Object.hasOwn(CLOSING, token.text)) closing.push(CLOSING[token.text]);
    else if ([')', ']', '}'].includes(token.text) && closing.pop() !== token.text)
      cursor.fail('Unbalanced syntax', token);
    cursor.take();
    consumed = true;
    if (!closing.length && !separators.length) return;
  }
  if (closing.length || !consumed) cursor.fail('Incomplete syntax');
}
export function skipSyntaxBlock(cursor: SyntaxCursor): void {
  cursor.expect('{');
  skipSyntax(cursor, ['}'], []);
}
export function skipSyntaxExpression(cursor: SyntaxCursor, separators: readonly string[]): void {
  skipSyntax(cursor, [], separators);
}
