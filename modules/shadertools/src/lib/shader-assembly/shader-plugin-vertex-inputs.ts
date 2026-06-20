// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {shaderTypeDecoder, type AttributeShaderType} from '@luma.gl/core';

export type ShaderPluginVertexInputAssembly = {
  source: string;
  declarations: string;
  initialization: string;
};

/** Generate GLSL vertex input declarations contributed by shader plugins. */
export function getShaderPluginVertexInputDeclarationsGLSL(
  source: string,
  vertexInputs: Record<string, AttributeShaderType>
): string {
  const declarations: string[] = [];
  for (const [name, type] of Object.entries(vertexInputs)) {
    assertGLSLVertexInputIsNew(source, name);
    declarations.push(`in ${getGLSLAttributeType(type)} ${name};`);
  }
  return declarations.join('\n');
}

/** Add WGSL plugin inputs to the selected vertex entry point. */
export function assembleShaderPluginVertexInputsWGSL(
  source: string,
  vertexEntryPoint: string,
  vertexInputs: Record<string, AttributeShaderType>
): ShaderPluginVertexInputAssembly {
  const entries = Object.entries(vertexInputs);
  if (entries.length === 0) {
    return {source, declarations: '', initialization: ''};
  }

  const functionRange = getWGSLFunctionParameterRange(source, vertexEntryPoint);
  const parameterSource = source.slice(
    functionRange.openParenthesis + 1,
    functionRange.closeParenthesis
  );
  const interfaceInfo = getWGSLVertexInterfaceInfo(source, parameterSource);
  const usedLocations = new Set(interfaceInfo.locations);
  const generatedParameters: string[] = [];
  const declarations: string[] = [];
  const initialization: string[] = [];

  for (const [name, type] of entries) {
    if (interfaceInfo.names.has(name) || hasWGSLModuleVariable(source, name)) {
      throw new Error(
        `ShaderPlugin vertex input "${name}" conflicts with an existing WGSL shader input or variable`
      );
    }
    const location = getFirstUnusedLocation(usedLocations);
    usedLocations.add(location);
    const parameterName = `_luma_${name}`;
    generatedParameters.push(`@location(${location}) ${parameterName}: ${type}`);
    declarations.push(`var<private> ${name}: ${type};`);
    initialization.push(`${name} = ${parameterName};`);
  }

  const separator = parameterSource.trim() ? ',\n  ' : '\n  ';
  const suffix = parameterSource.trim() ? '' : '\n';
  const injectedParameters = `${parameterSource}${separator}${generatedParameters.join(',\n  ')}${suffix}`;
  const transformedSource =
    source.slice(0, functionRange.openParenthesis + 1) +
    injectedParameters +
    source.slice(functionRange.closeParenthesis);

  return {
    source: transformedSource,
    declarations: declarations.join('\n'),
    initialization: initialization.join('\n')
  };
}

export function getGLSLAttributeType(type: AttributeShaderType): string {
  const {primitiveType, components} = shaderTypeDecoder.getAttributeShaderTypeInfo(type);
  const scalarType = primitiveType === 'i32' ? 'int' : primitiveType === 'u32' ? 'uint' : 'float';
  if (components === 1) {
    return scalarType;
  }
  const prefix = scalarType === 'int' ? 'i' : scalarType === 'uint' ? 'u' : '';
  return `${prefix}vec${components}`;
}

function assertGLSLVertexInputIsNew(source: string, name: string): void {
  const escapedName = escapeRegExp(name);
  const declaration = new RegExp(
    `\\b(?:in|attribute)\\s+(?:(?:lowp|mediump|highp)\\s+)?[A-Za-z_][A-Za-z0-9_]*\\s+${escapedName}\\s*(?:\\[|;)`
  );
  if (declaration.test(source)) {
    throw new Error(`ShaderPlugin vertex input "${name}" conflicts with an existing GLSL input`);
  }
}

function getWGSLFunctionParameterRange(
  source: string,
  entryPoint: string
): {openParenthesis: number; closeParenthesis: number} {
  const functionPattern = new RegExp(`\\bfn\\s+${escapeRegExp(entryPoint)}\\s*\\(`, 'g');
  const match = functionPattern.exec(source);
  if (!match) {
    throw new Error(`ShaderPlugin vertex inputs require WGSL vertex entry point "${entryPoint}"`);
  }
  const openParenthesis = source.indexOf('(', match.index);
  const closeParenthesis = findMatchingDelimiter(source, openParenthesis, '(', ')');
  if (closeParenthesis < 0) {
    throw new Error(`Unable to parse WGSL vertex entry point "${entryPoint}" parameters`);
  }
  return {openParenthesis, closeParenthesis};
}

function getWGSLVertexInterfaceInfo(
  source: string,
  parameterSource: string
): {locations: number[]; names: Set<string>} {
  const locations = getWGSLLocations(parameterSource);
  const names = new Set(getWGSLDeclaredNames(parameterSource));
  const parameterTypes = getWGSLParameterTypes(parameterSource);
  for (const parameterType of parameterTypes) {
    const structBody = getWGSLStructBody(source, parameterType);
    if (structBody === null) {
      continue;
    }
    locations.push(...getWGSLLocations(structBody));
    for (const name of getWGSLDeclaredNames(structBody)) {
      names.add(name);
    }
  }
  return {locations, names};
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

function getWGSLParameterTypes(source: string): string[] {
  const types: string[] = [];
  const typePattern = /:\s*([A-Za-z_][\w]*)\b/g;
  let match = typePattern.exec(source);
  while (match) {
    types.push(match[1]);
    match = typePattern.exec(source);
  }
  return types;
}

function getWGSLStructBody(source: string, structName: string): string | null {
  const structPattern = new RegExp(`\\bstruct\\s+${escapeRegExp(structName)}\\s*\\{`, 'g');
  const match = structPattern.exec(source);
  if (!match) {
    return null;
  }
  const openBrace = source.indexOf('{', match.index);
  const closeBrace = findMatchingDelimiter(source, openBrace, '{', '}');
  return closeBrace < 0 ? null : source.slice(openBrace + 1, closeBrace);
}

function hasWGSLModuleVariable(source: string, name: string): boolean {
  const escapedName = escapeRegExp(name);
  const variablePattern = new RegExp(`\\b(?:var(?:<[^>]+>)?|let|const)\\s+${escapedName}\\b`, 'g');
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
  while (usedLocations.has(location)) {
    location++;
  }
  return location;
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
  let blockCommentDepth = 0;
  let lineComment = false;
  for (let index = 0; index < endIndex; index++) {
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
    } else if (character === '/' && nextCharacter === '*') {
      blockCommentDepth = 1;
      index++;
    } else if (character === '{') {
      depth++;
    } else if (character === '}') {
      depth--;
    }
  }
  return depth;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
