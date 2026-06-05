// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

const DEFINE_NAME_PATTERN = '([a-zA-Z_][a-zA-Z0-9_]*)';
const IF_REGEXP = /^\s*\#\s*if\s+(.+?)\s*(?:\/\/.*)?$/;
const IFDEF_REGEXP = new RegExp(`^\\s*\\#\\s*ifdef\\s*${DEFINE_NAME_PATTERN}\\s*$`);
const IFNDEF_REGEXP = new RegExp(`^\\s*\\#\\s*ifndef\\s*${DEFINE_NAME_PATTERN}\\s*(?:\\/\\/.*)?$`);
const ELSE_REGEXP = /^\s*\#\s*else\s*(?:\/\/.*)?$/;
const ENDIF_REGEXP = /^\s*\#\s*endif\s*$/;
const IFDEF_WITH_COMMENT_REGEXP = new RegExp(
  `^\\s*\\#\\s*ifdef\\s*${DEFINE_NAME_PATTERN}\\s*(?:\\/\\/.*)?$`
);
const ENDIF_WITH_COMMENT_REGEXP = /^\s*\#\s*endif\s*(?:\/\/.*)?$/;

/** Options for the luma.gl shader source preprocessor. */
export type PreprocessorOptions = {
  /** Boolean or numeric values used by `#if`, `#ifdef`, and `#ifndef` conditionals. */
  defines?: Record<string, boolean | number>;
};

/**
 * Removes inactive conditional branches from shader source.
 * Supports `#ifdef`, `#ifndef`, and simple `#if` expressions using a define name,
 * `!NAME`, `defined(NAME)`, `!defined(NAME)`, or a boolean or numeric literal.
 * @param source Shader source containing luma.gl-supported conditional directives.
 * @param options Defines used while evaluating conditional directives.
 * @returns Shader source with inactive branches removed.
 */
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
    const matchIfExpression = line.match(IF_REGEXP);
    const matchIf = line.match(IFDEF_WITH_COMMENT_REGEXP) || line.match(IFDEF_REGEXP);
    const matchIfNot = line.match(IFNDEF_REGEXP);
    const matchElse = line.match(ELSE_REGEXP);
    const matchEnd = line.match(ENDIF_WITH_COMMENT_REGEXP) || line.match(ENDIF_REGEXP);

    if (matchIfExpression) {
      const branchTaken: boolean = evaluateIfExpression(
        matchIfExpression[1],
        options?.defines || {}
      );
      const active: boolean = conditional && branchTaken;
      conditionalStack.push({parentActive: conditional, branchTaken, active});
      conditional = active;
    } else if (matchIf || matchIfNot) {
      const defineName = (matchIf || matchIfNot)?.[1];
      const defineValue: boolean = Boolean(options?.defines?.[defineName!]);
      const branchTaken: boolean = matchIf ? defineValue : !defineValue;
      const active: boolean = conditional && branchTaken;
      conditionalStack.push({parentActive: conditional, branchTaken, active});
      conditional = active;
    } else if (matchElse) {
      const currentConditional = conditionalStack[conditionalStack.length - 1];
      if (!currentConditional) {
        throw new Error('Encountered #else without matching #if, #ifdef or #ifndef');
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

function evaluateIfExpression(
  expression: string,
  defines: Record<string, boolean | number>
): boolean {
  const trimmedExpression = expression.trim();

  if (/^[+-]?\d+(?:\.\d+)?$/.test(trimmedExpression)) {
    return Number(trimmedExpression) !== 0;
  }

  if (trimmedExpression === 'true') {
    return true;
  }

  if (trimmedExpression === 'false') {
    return false;
  }

  const negatedDefineMatch = trimmedExpression.match(new RegExp(`^!\\s*${DEFINE_NAME_PATTERN}$`));
  if (negatedDefineMatch) {
    return !Boolean(defines[negatedDefineMatch[1]]);
  }

  const defineMatch = trimmedExpression.match(new RegExp(`^${DEFINE_NAME_PATTERN}$`));
  if (defineMatch) {
    return Boolean(defines[defineMatch[1]]);
  }

  const definedMatch = trimmedExpression.match(
    new RegExp(`^defined\\s*\\(\\s*${DEFINE_NAME_PATTERN}\\s*\\)$`)
  );
  if (definedMatch) {
    return defines[definedMatch[1]] !== undefined;
  }

  const negatedDefinedMatch = trimmedExpression.match(
    new RegExp(`^!\\s*defined\\s*\\(\\s*${DEFINE_NAME_PATTERN}\\s*\\)$`)
  );
  if (negatedDefinedMatch) {
    return defines[negatedDefinedMatch[1]] === undefined;
  }

  throw new Error(`Unsupported #if expression "${expression}"`);
}
