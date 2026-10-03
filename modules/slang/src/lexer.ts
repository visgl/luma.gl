// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Token} from './ast';
import {SlangTranspileError} from './diagnostics';

/** Tokenize without modifying identifiers, strings, or comment contents. */
export function tokenizeSlang(source: string, sourceName: string): Token[] {
  const tokens: Token[] = [];
  let offset = 0;
  let line = 1;
  let column = 1;
  function advance(text: string): void {
    for (const character of text) {
      if (character === '\n') {
        line++;
        column = 1;
      } else {
        column++;
      }
    }
    offset += text.length;
  }
  while (offset < source.length) {
    const remaining = source.slice(offset);
    const location = {offset, line, column};
    const whitespace = /^\s+/.exec(remaining);
    if (whitespace) {
      advance(whitespace[0]);
      continue;
    }
    if (remaining.startsWith('//')) {
      advance(remaining.split('\n')[0]);
      continue;
    }
    if (remaining.startsWith('/*')) {
      const end = remaining.indexOf('*/', 2);
      if (end === -1) {
        throw new SlangTranspileError('Unterminated block comment', location, sourceName);
      }
      advance(remaining.slice(0, end + 2));
      continue;
    }
    const identifier = /^[a-zA-Z_][a-zA-Z_0-9]*/.exec(remaining);
    const number = /^(?:0[xX][0-9a-fA-F]+|(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)[uUfF]?/.exec(
      remaining
    );
    const string = /^"(?:[^"\\\n]|\\.)*"/.exec(remaining);
    const symbol =
      /^(?:::|\+\+|--|\+=|-=|\*=|\/=|%=|==|!=|<=|>=|&&|\|\||[{}()[\];:,.?+\-*/%!=<>~&|^])/.exec(
        remaining
      );
    const match = identifier || number || string || symbol;
    if (!match) {
      throw new SlangTranspileError(
        `Unsupported token ${JSON.stringify(remaining[0])}`,
        location,
        sourceName
      );
    }
    const kind = identifier ? 'identifier' : number ? 'number' : string ? 'string' : 'symbol';
    tokens.push({...location, kind, text: match[0]});
    advance(match[0]);
  }
  tokens.push({offset, line, column, text: '', kind: 'end'});
  return tokens;
}
