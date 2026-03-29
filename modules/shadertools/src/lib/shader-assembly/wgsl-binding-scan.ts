// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export const WGSL_BINDABLE_VARIABLE_PATTERN =
  '(?:var<\\s*(uniform|storage(?:\\s*,\\s*[A-Za-z_][A-Za-z0-9_]*)?)\\s*>|var)\\s+([A-Za-z_][A-Za-z0-9_]*)';
const WGSL_BINDING_DECLARATION_SEPARATOR_PATTERN = '\\s*';

export const MODULE_WGSL_BINDING_DECLARATION_REGEXES = [
  new RegExp(
    `@binding\\(\\s*(auto|\\d+)\\s*\\)${WGSL_BINDING_DECLARATION_SEPARATOR_PATTERN}@group\\(\\s*(\\d+)\\s*\\)${WGSL_BINDING_DECLARATION_SEPARATOR_PATTERN}${WGSL_BINDABLE_VARIABLE_PATTERN}`,
    'g'
  ),
  new RegExp(
    `@group\\(\\s*(\\d+)\\s*\\)${WGSL_BINDING_DECLARATION_SEPARATOR_PATTERN}@binding\\(\\s*(auto|\\d+)\\s*\\)${WGSL_BINDING_DECLARATION_SEPARATOR_PATTERN}${WGSL_BINDABLE_VARIABLE_PATTERN}`,
    'g'
  )
] as const;

export const WGSL_BINDING_DECLARATION_REGEXES = [
  new RegExp(
    `@binding\\(\\s*(auto|\\d+)\\s*\\)${WGSL_BINDING_DECLARATION_SEPARATOR_PATTERN}@group\\(\\s*(\\d+)\\s*\\)${WGSL_BINDING_DECLARATION_SEPARATOR_PATTERN}${WGSL_BINDABLE_VARIABLE_PATTERN}`,
    'g'
  ),
  new RegExp(
    `@group\\(\\s*(\\d+)\\s*\\)${WGSL_BINDING_DECLARATION_SEPARATOR_PATTERN}@binding\\(\\s*(auto|\\d+)\\s*\\)${WGSL_BINDING_DECLARATION_SEPARATOR_PATTERN}${WGSL_BINDABLE_VARIABLE_PATTERN}`,
    'g'
  )
] as const;

export const WGSL_EXPLICIT_BINDING_DECLARATION_REGEXES = [
  new RegExp(
    `@binding\\(\\s*(\\d+)\\s*\\)${WGSL_BINDING_DECLARATION_SEPARATOR_PATTERN}@group\\(\\s*(\\d+)\\s*\\)${WGSL_BINDING_DECLARATION_SEPARATOR_PATTERN}${WGSL_BINDABLE_VARIABLE_PATTERN}`,
    'g'
  ),
  new RegExp(
    `@group\\(\\s*(\\d+)\\s*\\)${WGSL_BINDING_DECLARATION_SEPARATOR_PATTERN}@binding\\(\\s*(\\d+)\\s*\\)${WGSL_BINDING_DECLARATION_SEPARATOR_PATTERN}${WGSL_BINDABLE_VARIABLE_PATTERN}`,
    'g'
  )
] as const;

const WGSL_AUTO_BINDING_DECLARATION_REGEXES = [
  new RegExp(
    `@binding\\(\\s*(auto)\\s*\\)\\s*@group\\(\\s*(\\d+)\\s*\\)\\s*${WGSL_BINDABLE_VARIABLE_PATTERN}`,
    'g'
  ),
  new RegExp(
    `@group\\(\\s*(\\d+)\\s*\\)\\s*@binding\\(\\s*(auto)\\s*\\)\\s*${WGSL_BINDABLE_VARIABLE_PATTERN}`,
    'g'
  ),
  new RegExp(
    `@binding\\(\\s*(auto)\\s*\\)\\s*@group\\(\\s*(\\d+)\\s*\\)(?:[\\s\\n\\r]*@[A-Za-z_][^\\n\\r]*)*[\\s\\n\\r]*${WGSL_BINDABLE_VARIABLE_PATTERN}`,
    'g'
  ),
  new RegExp(
    `@group\\(\\s*(\\d+)\\s*\\)\\s*@binding\\(\\s*(auto)\\s*\\)(?:[\\s\\n\\r]*@[A-Za-z_][^\\n\\r]*)*[\\s\\n\\r]*${WGSL_BINDABLE_VARIABLE_PATTERN}`,
    'g'
  )
] as const;

export type WGSLBindingDeclarationMatch = {
  match: string;
  index: number;
  length: number;
  bindingToken: string;
  groupToken: string;
  accessDeclaration?: string;
  name: string;
};

export function maskWGSLComments(source: string): string {
  const maskedCharacters = source.split('');
  let index = 0;
  let blockCommentDepth = 0;
  let inLineComment = false;
  let inString = false;
  let isEscaped = false;

  while (index < source.length) {
    const character = source[index];
    const nextCharacter = source[index + 1];

    if (inString) {
      if (isEscaped) {
        isEscaped = false;
      } else if (character === '\\') {
        isEscaped = true;
      } else if (character === '"') {
        inString = false;
      }
      index++;
      continue;
    }

    if (inLineComment) {
      if (character === '\n' || character === '\r') {
        inLineComment = false;
      } else {
        maskedCharacters[index] = ' ';
      }
      index++;
      continue;
    }

    if (blockCommentDepth > 0) {
      if (character === '/' && nextCharacter === '*') {
        maskedCharacters[index] = ' ';
        maskedCharacters[index + 1] = ' ';
        blockCommentDepth++;
        index += 2;
        continue;
      }

      if (character === '*' && nextCharacter === '/') {
        maskedCharacters[index] = ' ';
        maskedCharacters[index + 1] = ' ';
        blockCommentDepth--;
        index += 2;
        continue;
      }

      if (character !== '\n' && character !== '\r') {
        maskedCharacters[index] = ' ';
      }
      index++;
      continue;
    }

    if (character === '"') {
      inString = true;
      index++;
      continue;
    }

    if (character === '/' && nextCharacter === '/') {
      maskedCharacters[index] = ' ';
      maskedCharacters[index + 1] = ' ';
      inLineComment = true;
      index += 2;
      continue;
    }

    if (character === '/' && nextCharacter === '*') {
      maskedCharacters[index] = ' ';
      maskedCharacters[index + 1] = ' ';
      blockCommentDepth = 1;
      index += 2;
      continue;
    }

    index++;
  }

  return maskedCharacters.join('');
}

export function getWGSLBindingDeclarationMatches(
  source: string,
  regexes: readonly RegExp[]
): WGSLBindingDeclarationMatch[] {
  const maskedSource = maskWGSLComments(source);
  const matches: WGSLBindingDeclarationMatch[] = [];

  for (const regex of regexes) {
    regex.lastIndex = 0;
    let match: RegExpExecArray | null;
    match = regex.exec(maskedSource);
    while (match) {
      const isBindingFirst = regex === regexes[0];
      const index = match.index;
      const length = match[0].length;
      matches.push({
        match: source.slice(index, index + length),
        index,
        length,
        bindingToken: match[isBindingFirst ? 1 : 2],
        groupToken: match[isBindingFirst ? 2 : 1],
        accessDeclaration: match[3]?.trim(),
        name: match[4]
      });
      match = regex.exec(maskedSource);
    }
  }

  return matches.sort((left, right) => left.index - right.index);
}

export function replaceWGSLBindingDeclarationMatches(
  source: string,
  regexes: readonly RegExp[],
  replacer: (match: WGSLBindingDeclarationMatch) => string
): string {
  const matches = getWGSLBindingDeclarationMatches(source, regexes);
  if (!matches.length) {
    return source;
  }

  let relocatedSource = '';
  let lastIndex = 0;

  for (const match of matches) {
    relocatedSource += source.slice(lastIndex, match.index);
    relocatedSource += replacer(match);
    lastIndex = match.index + match.length;
  }

  relocatedSource += source.slice(lastIndex);
  return relocatedSource;
}

export function hasWGSLAutoBinding(source: string): boolean {
  return /@binding\(\s*auto\s*\)/.test(maskWGSLComments(source));
}

export function getFirstWGSLAutoBindingDeclarationMatch(
  source: string,
  regexes: readonly RegExp[]
): WGSLBindingDeclarationMatch | undefined {
  const autoBindingRegexes =
    regexes === MODULE_WGSL_BINDING_DECLARATION_REGEXES ||
    regexes === WGSL_BINDING_DECLARATION_REGEXES
      ? WGSL_AUTO_BINDING_DECLARATION_REGEXES
      : regexes;

  return getWGSLBindingDeclarationMatches(source, autoBindingRegexes).find(
    declarationMatch => declarationMatch.bindingToken === 'auto'
  );
}
