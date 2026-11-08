// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Token} from './ast';
import {SlangTranspileError} from './diagnostics';

/** Shared token stream for declaration inspection and full WGSL syntax parsing. */
export function tokenizeWGSL(source: string, sourceName: string): Token[] {
  const tokens: Token[] = [];
  let offset = 0;
  let line = 1;
  let column = 1;
  const fail: (message: string, token: Token) => never = (message, token) => {
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
  return tokens;
}
