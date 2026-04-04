// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

const DEFINE_NAME_PATTERN = '([a-zA-Z_][a-zA-Z0-9_]*)';
const IFDEF_REGEXP = new RegExp(`^\\s*\\#\\s*ifdef\\s*${DEFINE_NAME_PATTERN}\\s*$`);
const IFNDEF_REGEXP = new RegExp(`^\\s*\\#\\s*ifndef\\s*${DEFINE_NAME_PATTERN}\\s*(?:\\/\\/.*)?$`);
const ELSE_REGEXP = /^\s*\#\s*else\s*(?:\/\/.*)?$/;
const ENDIF_REGEXP = /^\s*\#\s*endif\s*$/;
const IFDEF_WITH_COMMENT_REGEXP = new RegExp(
  `^\\s*\\#\\s*ifdef\\s*${DEFINE_NAME_PATTERN}\\s*(?:\\/\\/.*)?$`
);
const ENDIF_WITH_COMMENT_REGEXP = /^\s*\#\s*endif\s*(?:\/\/.*)?$/;

export type PreprocessorOptions = {
  defines?: Record<string, boolean>;
};

export function preprocess(source: string, options?: PreprocessorOptions): string {
  const lines = source.split('\n');
  const output: string[] = [];

  const conditionalStack: Array<{
    parentActive: boolean;
    branchTaken: boolean;
    active: boolean;
  }> = [];
  let conditional = true;

  for (const line of lines) {
    const matchIf = line.match(IFDEF_WITH_COMMENT_REGEXP) || line.match(IFDEF_REGEXP);
    const matchIfNot = line.match(IFNDEF_REGEXP);
    const matchElse = line.match(ELSE_REGEXP);
    const matchEnd = line.match(ENDIF_WITH_COMMENT_REGEXP) || line.match(ENDIF_REGEXP);

    if (matchIf || matchIfNot) {
      const defineName = (matchIf || matchIfNot)?.[1];
      const defineValue: boolean = Boolean(options?.defines?.[defineName!]);
      const branchTaken: boolean = matchIf ? defineValue : !defineValue;
      const active: boolean = conditional && branchTaken;
      conditionalStack.push({parentActive: conditional, branchTaken, active});
      conditional = active;
    } else if (matchElse) {
      const currentConditional = conditionalStack[conditionalStack.length - 1];
      if (!currentConditional) {
        throw new Error('Encountered #else without matching #ifdef or #ifndef');
      }
      currentConditional.active =
        currentConditional.parentActive && !currentConditional.branchTaken;
      currentConditional.branchTaken = true;
      conditional = currentConditional.active;
    } else if (matchEnd) {
      conditionalStack.pop();
      conditional = conditionalStack.length
        ? conditionalStack[conditionalStack.length - 1].active
        : true;
    } else if (conditional) {
      output.push(line);
    }
  }

  if (conditionalStack.length > 0) {
    throw new Error('Unterminated conditional block in shader source');
  }

  return output.join('\n');
}
