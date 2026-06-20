// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {shaderTypeDecoder} from '@luma.gl/core';
import type {ResolvedShaderPluginVarying} from '../shader-plugin';
import {getGLSLAttributeType} from './shader-plugin-vertex-inputs';

export type ShaderPluginVaryingAssembly = {
  source: string;
  declarations: string;
  vertexInitialization: string;
  fragmentInitialization: string;
};

/** Generate one stage of the GLSL interface contributed by shader plugins. */
export function assembleShaderPluginVaryingsGLSL(
  source: string,
  stage: 'vertex' | 'fragment',
  varyings: Record<string, ResolvedShaderPluginVarying>
): {declarations: string; initialization: string} {
  const declarations: string[] = [];
  const initialization: string[] = [];
  for (const [name, varying] of Object.entries(varyings)) {
    assertGLSLVaryingIsNew(source, name);
    const qualifier = varying.interpolation === 'flat' ? 'flat ' : '';
    const direction = stage === 'vertex' ? 'out' : 'in';
    declarations.push(`${qualifier}${direction} ${getGLSLAttributeType(varying.type)} ${name};`);
    if (stage === 'vertex') {
      initialization.push(`${name} = ${getGLSLZeroValue(varying.type)};`);
    }
  }
  return {declarations: declarations.join('\n'), initialization: initialization.join('\n')};
}

/** Add plugin varyings to selected WGSL vertex and fragment entry points. */
export function assembleShaderPluginVaryingsWGSL(
  source: string,
  vertexEntryPoint: string,
  fragmentEntryPoint: string,
  varyings: Record<string, ResolvedShaderPluginVarying>
): ShaderPluginVaryingAssembly {
  const entries = Object.entries(varyings);
  if (entries.length === 0) {
    return {
      source,
      declarations: '',
      vertexInitialization: '',
      fragmentInitialization: ''
    };
  }

  let transformedSource = source;
  let vertexFunction = getWGSLFunctionRange(transformedSource, vertexEntryPoint, 'vertex');
  const vertexOutputType = getWGSLNamedReturnType(transformedSource, vertexFunction);
  let fragmentFunction = getWGSLFunctionRange(transformedSource, fragmentEntryPoint, 'fragment');
  const fragmentInput = getWGSLFragmentStructInput(transformedSource, fragmentFunction);
  const vertexOutputStruct = getWGSLStructRange(transformedSource, vertexOutputType);
  const fragmentInputStruct = getWGSLStructRange(transformedSource, fragmentInput.type);

  const interfaceNames = new Set([
    ...getWGSLDeclaredNames(vertexFunction.parameters),
    ...getWGSLDeclaredNames(vertexOutputStruct.body),
    ...getWGSLDeclaredNames(fragmentFunction.parameters),
    ...getWGSLDeclaredNames(fragmentInputStruct.body)
  ]);
  const usedLocations = new Set([
    ...getWGSLLocations(vertexOutputStruct.body),
    ...getWGSLLocations(fragmentInputStruct.body)
  ]);
  const fields: string[] = [];
  const declarations: string[] = [];
  const vertexInitialization: string[] = [];
  const fragmentInitialization: string[] = [];

  for (const [name, varying] of entries) {
    if (interfaceNames.has(name) || hasWGSLModuleVariable(transformedSource, name)) {
      throw new Error(
        `ShaderPlugin varying "${name}" conflicts with existing WGSL stage I/O or a module variable`
      );
    }
    const location = getFirstUnusedLocation(usedLocations);
    usedLocations.add(location);
    const interpolation = varying.interpolation === 'flat' ? ' @interpolate(flat)' : '';
    fields.push(`  @location(${location})${interpolation} ${name}: ${varying.type},`);
    declarations.push(`var<private> ${name}: ${varying.type};`);
    vertexInitialization.push(`${name} = ${getWGSLZeroValue(varying.type)};`);
    fragmentInitialization.push(`${name} = ${fragmentInput.name}.${name};`);
  }

  assertWGSLStructConstructorsAreLocal(
    transformedSource,
    vertexOutputType,
    vertexFunction.openBrace,
    vertexFunction.closeBrace
  );
  transformedSource = appendWGSLConstructorArgumentsInFunction(
    transformedSource,
    vertexOutputType,
    vertexFunction,
    entries.map(([name]) => name)
  );
  vertexFunction = getWGSLFunctionRange(transformedSource, vertexEntryPoint, 'vertex');
  transformedSource = rewriteWGSLVertexReturns(
    transformedSource,
    vertexFunction,
    entries.map(([name]) => name)
  );

  const structNames =
    vertexOutputType === fragmentInput.type
      ? [vertexOutputType]
      : [vertexOutputType, fragmentInput.type];
  const structInsertions = structNames
    .map(structName => getWGSLStructRange(transformedSource, structName).closeBrace)
    .sort((left, right) => right - left);
  for (const insertionIndex of structInsertions) {
    transformedSource =
      transformedSource.slice(0, insertionIndex) +
      `${fields.join('\n')}\n` +
      transformedSource.slice(insertionIndex);
  }

  fragmentFunction = getWGSLFunctionRange(transformedSource, fragmentEntryPoint, 'fragment');
  const fragmentInputPattern = new RegExp(`\\b${escapeRegExp(fragmentInput.name)}\\s*:`);
  if (!fragmentInputPattern.test(fragmentFunction.parameters)) {
    throw new Error(`Unable to preserve WGSL fragment input "${fragmentInput.name}"`);
  }

  return {
    source: transformedSource,
    declarations: declarations.join('\n'),
    vertexInitialization: vertexInitialization.join('\n'),
    fragmentInitialization: fragmentInitialization.join('\n')
  };
}

type WGSLFunctionRange = {
  openParenthesis: number;
  closeParenthesis: number;
  openBrace: number;
  closeBrace: number;
  parameters: string;
};

type WGSLStructRange = {
  openBrace: number;
  closeBrace: number;
  body: string;
};

function getWGSLFunctionRange(
  source: string,
  entryPoint: string,
  stage: 'vertex' | 'fragment'
): WGSLFunctionRange {
  const functionPattern = new RegExp(`\\bfn\\s+${escapeRegExp(entryPoint)}\\s*\\(`, 'g');
  const match = functionPattern.exec(source);
  if (!match) {
    throw new Error(`ShaderPlugin varyings require WGSL ${stage} entry point "${entryPoint}"`);
  }
  const openParenthesis = source.indexOf('(', match.index);
  const closeParenthesis = findMatchingDelimiter(source, openParenthesis, '(', ')');
  const openBrace = source.indexOf('{', closeParenthesis);
  const closeBrace = findMatchingDelimiter(source, openBrace, '{', '}');
  if (closeParenthesis < 0 || openBrace < 0 || closeBrace < 0) {
    throw new Error(`Unable to parse WGSL ${stage} entry point "${entryPoint}"`);
  }
  return {
    openParenthesis,
    closeParenthesis,
    openBrace,
    closeBrace,
    parameters: source.slice(openParenthesis + 1, closeParenthesis)
  };
}

function getWGSLNamedReturnType(source: string, functionRange: WGSLFunctionRange): string {
  const resultSource = source.slice(functionRange.closeParenthesis + 1, functionRange.openBrace);
  const match = /->\s*([A-Za-z_][\w]*)\s*$/.exec(resultSource.trim());
  if (!match || getWGSLStructRangeOrNull(source, match[1]) === null) {
    throw new Error(
      'ShaderPlugin varyings require the WGSL vertex entry point to return a named struct'
    );
  }
  return match[1];
}

function getWGSLFragmentStructInput(
  source: string,
  functionRange: WGSLFunctionRange
): {name: string; type: string} {
  const candidates: {name: string; type: string}[] = [];
  for (const parameter of splitTopLevel(functionRange.parameters, ',')) {
    const match =
      /(?:@[A-Za-z_][\w]*(?:\([^)]*\))?\s*)*([A-Za-z_][\w]*)\s*:\s*([A-Za-z_][\w]*)\s*$/.exec(
        parameter.trim()
      );
    if (match && getWGSLStructRangeOrNull(source, match[2])) {
      candidates.push({name: match[1], type: match[2]});
    }
  }
  if (candidates.length !== 1) {
    throw new Error(
      `ShaderPlugin varyings require exactly one named WGSL fragment input struct; found ${candidates.length}`
    );
  }
  return candidates[0];
}

function getWGSLStructRange(source: string, structName: string): WGSLStructRange {
  const range = getWGSLStructRangeOrNull(source, structName);
  if (!range) {
    throw new Error(`Unable to find WGSL stage I/O struct "${structName}"`);
  }
  return range;
}

function getWGSLStructRangeOrNull(source: string, structName: string): WGSLStructRange | null {
  const structPattern = new RegExp(`\\bstruct\\s+${escapeRegExp(structName)}\\s*\\{`, 'g');
  const match = structPattern.exec(source);
  if (!match) {
    return null;
  }
  const openBrace = source.indexOf('{', match.index);
  const closeBrace = findMatchingDelimiter(source, openBrace, '{', '}');
  return closeBrace < 0
    ? null
    : {openBrace, closeBrace, body: source.slice(openBrace + 1, closeBrace)};
}

function assertWGSLStructConstructorsAreLocal(
  source: string,
  structName: string,
  functionStart: number,
  functionEnd: number
): void {
  const constructorPattern = new RegExp(`\\b${escapeRegExp(structName)}\\s*\\(`, 'g');
  let match = constructorPattern.exec(source);
  while (match) {
    if (match.index < functionStart || match.index > functionEnd) {
      throw new Error(
        `ShaderPlugin varying output struct "${structName}" is constructed outside the selected vertex entry point`
      );
    }
    match = constructorPattern.exec(source);
  }
}

function appendWGSLConstructorArgumentsInFunction(
  source: string,
  structName: string,
  functionRange: WGSLFunctionRange,
  varyingNames: string[]
): string {
  const constructorPattern = new RegExp(`\\b${escapeRegExp(structName)}\\s*\\(`, 'g');
  const insertions: Array<{openParenthesis: number; closeParenthesis: number}> = [];
  let match = constructorPattern.exec(source);
  while (match) {
    if (match.index > functionRange.openBrace && match.index < functionRange.closeBrace) {
      const openParenthesis = source.indexOf('(', match.index);
      const closeParenthesis = findMatchingDelimiter(source, openParenthesis, '(', ')');
      if (closeParenthesis < 0 || closeParenthesis > functionRange.closeBrace) {
        throw new Error(`Unable to parse WGSL output constructor "${structName}"`);
      }
      insertions.push({openParenthesis, closeParenthesis});
    }
    match = constructorPattern.exec(source);
  }
  for (const insertion of insertions.sort(
    (left, right) => right.closeParenthesis - left.closeParenthesis
  )) {
    const existingArguments = source
      .slice(insertion.openParenthesis + 1, insertion.closeParenthesis)
      .trim();
    const separator = existingArguments ? ', ' : '';
    source =
      source.slice(0, insertion.closeParenthesis) +
      separator +
      varyingNames.join(', ') +
      source.slice(insertion.closeParenthesis);
  }
  return source;
}

function rewriteWGSLVertexReturns(
  source: string,
  functionRange: WGSLFunctionRange,
  varyingNames: string[]
): string {
  const returns = findWGSLReturnStatements(
    source,
    functionRange.openBrace + 1,
    functionRange.closeBrace
  );
  for (let returnIndex = returns.length - 1; returnIndex >= 0; returnIndex--) {
    const statement = returns[returnIndex];
    const expression = source.slice(statement.expressionStart, statement.semicolon).trim();
    if (!expression) {
      throw new Error('ShaderPlugin varying vertex entry point cannot use an empty return');
    }
    const outputName = `_luma_vertexOutput${returnIndex}`;
    const assignments = varyingNames.map(name => `${outputName}.${name} = ${name};`).join('\n');
    const replacement = `{\nvar ${outputName} = ${expression};\n${assignments}\nreturn ${outputName};\n}`;
    source = source.slice(0, statement.start) + replacement + source.slice(statement.semicolon + 1);
  }
  return source;
}

function findWGSLReturnStatements(
  source: string,
  startIndex: number,
  endIndex: number
): Array<{start: number; expressionStart: number; semicolon: number}> {
  const statements: Array<{start: number; expressionStart: number; semicolon: number}> = [];
  let index = startIndex;
  while (index < endIndex) {
    index = skipWGSLTrivia(source, index, endIndex);
    if (
      source.slice(index, index + 6) === 'return' &&
      !/[A-Za-z0-9_]/.test(source[index + 6] || '')
    ) {
      const expressionStart = index + 6;
      const semicolon = findStatementSemicolon(source, expressionStart, endIndex);
      if (semicolon < 0) {
        throw new Error('Unable to parse WGSL return statement in selected vertex entry point');
      }
      statements.push({start: index, expressionStart, semicolon});
      index = semicolon + 1;
    } else {
      index++;
    }
  }
  return statements;
}

function findStatementSemicolon(source: string, startIndex: number, endIndex: number): number {
  let parenthesisDepth = 0;
  let bracketDepth = 0;
  for (let index = startIndex; index < endIndex; index++) {
    const skippedIndex = skipWGSLTrivia(source, index, endIndex);
    if (skippedIndex !== index) {
      index = skippedIndex - 1;
      continue;
    }
    const character = source[index];
    if (character === '(') parenthesisDepth++;
    if (character === ')') parenthesisDepth--;
    if (character === '[') bracketDepth++;
    if (character === ']') bracketDepth--;
    if (character === ';' && parenthesisDepth === 0 && bracketDepth === 0) return index;
  }
  return -1;
}

function skipWGSLTrivia(source: string, startIndex: number, endIndex: number): number {
  let index = startIndex;
  if (source[index] === '/' && source[index + 1] === '/') {
    const newline = source.indexOf('\n', index + 2);
    return newline < 0 || newline > endIndex ? endIndex : newline + 1;
  }
  if (source[index] === '/' && source[index + 1] === '*') {
    let depth = 1;
    index += 2;
    while (index < endIndex && depth > 0) {
      if (source[index] === '/' && source[index + 1] === '*') {
        depth++;
        index += 2;
      } else if (source[index] === '*' && source[index + 1] === '/') {
        depth--;
        index += 2;
      } else {
        index++;
      }
    }
  }
  return index;
}

function splitTopLevel(source: string, delimiter: string): string[] {
  const parts: string[] = [];
  let startIndex = 0;
  let parenthesisDepth = 0;
  let angleDepth = 0;
  for (let index = 0; index < source.length; index++) {
    const character = source[index];
    if (character === '(') parenthesisDepth++;
    if (character === ')') parenthesisDepth--;
    if (character === '<') angleDepth++;
    if (character === '>') angleDepth--;
    if (character === delimiter && parenthesisDepth === 0 && angleDepth === 0) {
      parts.push(source.slice(startIndex, index));
      startIndex = index + 1;
    }
  }
  parts.push(source.slice(startIndex));
  return parts;
}

function getWGSLLocations(source: string): number[] {
  const locations: number[] = [];
  const locationPattern = /@location\s*\(\s*(\d+)\s*\)/g;
  let match = locationPattern.exec(source);
  while (match) {
    locations.push(Number(match[1]));
    match = locationPattern.exec(source);
  }
  return locations;
}

function getWGSLDeclaredNames(source: string): string[] {
  const names: string[] = [];
  const namePattern = /(?:^|,)\s*(?:@[A-Za-z_][\w]*(?:\([^)]*\))?\s*)*([A-Za-z_][\w]*)\s*:/gm;
  let match = namePattern.exec(source);
  while (match) {
    names.push(match[1]);
    match = namePattern.exec(source);
  }
  return names;
}

function hasWGSLModuleVariable(source: string, name: string): boolean {
  const variablePattern = new RegExp(
    `\\b(?:var(?:<[^>]+>)?|let|const)\\s+${escapeRegExp(name)}\\b`,
    'g'
  );
  let match = variablePattern.exec(source);
  while (match) {
    if (getBraceDepthAt(source, match.index) === 0) {
      return true;
    }
    match = variablePattern.exec(source);
  }
  return false;
}

function getFirstUnusedLocation(usedLocations: Set<number>): number {
  let location = 0;
  while (usedLocations.has(location)) location++;
  return location;
}

function getGLSLZeroValue(type: ResolvedShaderPluginVarying['type']): string {
  const {primitiveType, components} = shaderTypeDecoder.getAttributeShaderTypeInfo(type);
  const scalar = primitiveType === 'u32' ? '0u' : primitiveType === 'i32' ? '0' : '0.0';
  return components === 1 ? scalar : `${getGLSLAttributeType(type)}(${scalar})`;
}

function getWGSLZeroValue(type: ResolvedShaderPluginVarying['type']): string {
  const {primitiveType, components} = shaderTypeDecoder.getAttributeShaderTypeInfo(type);
  const scalar = `${primitiveType}(0)`;
  return components === 1 ? scalar : `${type}(${scalar})`;
}

function assertGLSLVaryingIsNew(source: string, name: string): void {
  const declaration = new RegExp(
    `\\b(?:flat\\s+|smooth\\s+)?(?:in|out|varying)\\s+` +
      `(?:(?:lowp|mediump|highp)\\s+)?[A-Za-z_][A-Za-z0-9_]*\\s+` +
      `${escapeRegExp(name)}\\s*(?:\\[|;)`
  );
  if (declaration.test(source)) {
    throw new Error(`ShaderPlugin varying "${name}" conflicts with existing GLSL stage I/O`);
  }
}

function findMatchingDelimiter(
  source: string,
  openIndex: number,
  openCharacter: string,
  closeCharacter: string
): number {
  let depth = 0;
  let blockCommentDepth = 0;
  let lineComment = false;
  for (let index = openIndex; index < source.length; index++) {
    const character = source[index];
    const nextCharacter = source[index + 1];
    if (lineComment) {
      if (character === '\n') lineComment = false;
      continue;
    }
    if (blockCommentDepth > 0) {
      if (character === '/' && nextCharacter === '*') {
        blockCommentDepth++;
        index++;
      } else if (character === '*' && nextCharacter === '/') {
        blockCommentDepth--;
        index++;
      }
      continue;
    }
    if (character === '/' && nextCharacter === '/') {
      lineComment = true;
      index++;
      continue;
    }
    if (character === '/' && nextCharacter === '*') {
      blockCommentDepth = 1;
      index++;
      continue;
    }
    if (character === openCharacter) depth++;
    if (character === closeCharacter && --depth === 0) return index;
  }
  return -1;
}

function getBraceDepthAt(source: string, endIndex: number): number {
  let depth = 0;
  for (let index = 0; index < endIndex; index++) {
    const skippedIndex = skipWGSLTrivia(source, index, endIndex);
    if (skippedIndex !== index) {
      index = skippedIndex - 1;
      continue;
    }
    if (source[index] === '{') depth++;
    if (source[index] === '}') depth--;
  }
  return depth;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
