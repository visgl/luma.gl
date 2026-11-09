// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Program} from './ast';
import {parseWGSLDeclarations} from './wgsl-declarations';
import {skipSyntaxBlock, skipSyntaxExpression} from './syntax-skip';

/** Parse module declarations while balancing/skipping bodies and initializers. */
export function parseWGSLDeclarationModule(source: string, sourceName: string): Program {
  return parseWGSLDeclarations(source, sourceName, context => ({
    parseExpression: () => {
      skipSyntaxExpression(context, [';']);
      return undefined;
    },
    parseBody: () => {
      const token = context.peek();
      skipSyntaxBlock(context);
      return {...token, kind: 'block', statements: []};
    }
  }));
}
