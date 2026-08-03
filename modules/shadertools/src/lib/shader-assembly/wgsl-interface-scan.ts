// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  AttributeDeclaration,
  AttributeShaderType,
  BindingDeclaration,
  SamplerBindingLayout,
  ShaderLayout,
  StorageTextureBindingLayout,
  TextureBindingLayout,
  TextureFormat
} from '@luma.gl/core';

import {maskWGSLComments} from './wgsl-binding-scan';

export type ScanWGSLInterfaceOptions = {
  /** Selected render-pipeline vertex entry point. Required when WGSL declares multiple vertices. */
  vertexEntryPoint?: string;
  /** Whether to scan vertex attributes. Disable for compute pipelines that only need bindings. */
  scanVertexAttributes?: boolean;
};

type WGSLToken = {
  value: string;
  index: number;
};

type WGSLFunction = {
  name: string;
  vertex: boolean;
  parameters: WGSLToken[];
};

/**
 * Scans the pipeline interface needed to create a WebGPU shader layout without a full WGSL parser.
 * Returns `null` when an interface is ambiguous or uses unsupported syntax, signaling that the
 * caller must provide an explicit layout.
 */
export function scanWGSLInterface(
  source: string,
  options: ScanWGSLInterfaceOptions = {}
): ShaderLayout | null {
  const tokens = tokenizeWGSL(source);
  const braceDepths = getBraceDepths(tokens);
  if (!braceDepths) {
    return null;
  }

  const aliases = scanWGSLAliases(tokens, braceDepths);
  if (!aliases) {
    return null;
  }

  const bindings = scanWGSLBindings(tokens, braceDepths, aliases);
  if (!bindings) {
    return null;
  }
  if (options.scanVertexAttributes === false) {
    return {attributes: [], bindings};
  }

  const structures = scanWGSLStructures(tokens, braceDepths);
  if (!structures) {
    return null;
  }
  const attributes = scanWGSLVertexAttributes(
    tokens,
    braceDepths,
    aliases,
    structures,
    options.vertexEntryPoint
  );
  return attributes ? {attributes, bindings} : null;
}

function tokenizeWGSL(source: string): WGSLToken[] {
  const maskedSource = maskWGSLComments(source);
  const tokenPattern = /[A-Za-z_][A-Za-z0-9_]*|(?:0[xX][0-9A-Fa-f]+|\d+)|[@(){}<>\[\]:,;=]/g;
  const tokens: WGSLToken[] = [];
  let match = tokenPattern.exec(maskedSource);
  while (match) {
    tokens.push({value: match[0], index: match.index});
    match = tokenPattern.exec(maskedSource);
  }
  return tokens;
}

function getBraceDepths(tokens: WGSLToken[]): number[] | null {
  const depths: number[] = [];
  let depth = 0;
  for (const token of tokens) {
    if (token.value === '}' && depth === 0) {
      return null;
    }
    depths.push(depth);
    if (token.value === '{') {
      depth++;
    } else if (token.value === '}') {
      depth--;
    }
  }
  return depth === 0 ? depths : null;
}

function scanWGSLAliases(tokens: WGSLToken[], braceDepths: number[]): Map<string, string> | null {
  const aliases = new Map<string, string>();
  for (let tokenIndex = 0; tokenIndex < tokens.length; tokenIndex++) {
    if (braceDepths[tokenIndex] !== 0 || tokens[tokenIndex].value !== 'alias') {
      continue;
    }
    const name = tokens[tokenIndex + 1]?.value;
    if (!isWGSLIdentifier(name) || tokens[tokenIndex + 2]?.value !== '=' || aliases.has(name)) {
      return null;
    }
    const semicolonIndex = findTopLevelToken(tokens, braceDepths, tokenIndex + 3, ';');
    if (semicolonIndex < 0 || semicolonIndex === tokenIndex + 3) {
      return null;
    }
    aliases.set(name, formatWGSLTokens(tokens.slice(tokenIndex + 3, semicolonIndex)));
    tokenIndex = semicolonIndex;
  }
  return aliases;
}

function scanWGSLStructures(
  tokens: WGSLToken[],
  braceDepths: number[]
): Map<string, WGSLToken[]> | null {
  const structures = new Map<string, WGSLToken[]>();
  for (let tokenIndex = 0; tokenIndex < tokens.length; tokenIndex++) {
    if (braceDepths[tokenIndex] !== 0 || tokens[tokenIndex].value !== 'struct') {
      continue;
    }
    const name = tokens[tokenIndex + 1]?.value;
    const openBraceIndex = tokenIndex + 2;
    if (!isWGSLIdentifier(name) || structures.has(name) || tokens[openBraceIndex]?.value !== '{') {
      return null;
    }
    const closeBraceIndex = findMatchingToken(tokens, openBraceIndex, '{', '}');
    if (closeBraceIndex < 0) {
      return null;
    }
    structures.set(name, tokens.slice(openBraceIndex + 1, closeBraceIndex));
    tokenIndex = closeBraceIndex;
  }
  return structures;
}

function scanWGSLBindings(
  tokens: WGSLToken[],
  braceDepths: number[],
  aliases: Map<string, string>
): BindingDeclaration[] | null {
  const bindings: BindingDeclaration[] = [];
  const bindingLocations = new Set<string>();
  const bindingNames = new Set<string>();

  for (let tokenIndex = 0; tokenIndex < tokens.length; tokenIndex++) {
    if (braceDepths[tokenIndex] !== 0 || tokens[tokenIndex].value !== 'var') {
      continue;
    }

    const statementStart = findTopLevelStatementStart(tokens, braceDepths, tokenIndex);
    const attributes = tokens.slice(statementStart, tokenIndex);
    const group = getNumericWGSLAttribute(attributes, 'group');
    const location = getNumericWGSLAttribute(attributes, 'binding');
    if (group === null || location === null || (group === undefined) !== (location === undefined)) {
      return null;
    }
    if (group === undefined || location === undefined) {
      continue;
    }

    let cursor = tokenIndex + 1;
    let addressSpace: string[] = [];
    if (tokens[cursor]?.value === '<') {
      const closeAngleIndex = findMatchingToken(tokens, cursor, '<', '>');
      if (closeAngleIndex < 0) {
        return null;
      }
      const addressParts = splitTopLevelTokens(tokens.slice(cursor + 1, closeAngleIndex), ',');
      if (!addressParts) {
        return null;
      }
      addressSpace = addressParts.map(formatWGSLTokens);
      cursor = closeAngleIndex + 1;
    }

    const name = tokens[cursor]?.value;
    if (!isWGSLIdentifier(name) || tokens[cursor + 1]?.value !== ':') {
      return null;
    }
    const semicolonIndex = findTopLevelToken(tokens, braceDepths, cursor + 2, ';');
    if (semicolonIndex < 0 || semicolonIndex === cursor + 2) {
      return null;
    }
    const resourceType = resolveWGSLTypeAliases(
      formatWGSLTokens(tokens.slice(cursor + 2, semicolonIndex)),
      aliases
    );
    if (!resourceType) {
      return null;
    }

    const binding = getWGSLBindingDeclaration({
      name,
      group,
      location,
      addressSpace,
      resourceType
    });
    const bindingKey = `${group}:${location}`;
    if (!binding || bindingLocations.has(bindingKey) || bindingNames.has(name)) {
      return null;
    }
    bindings.push(binding);
    bindingLocations.add(bindingKey);
    bindingNames.add(name);
    tokenIndex = semicolonIndex;
  }

  normalizeWGSLSamplerBindings(bindings);
  return bindings.sort(
    (left, right) =>
      left.group - right.group ||
      left.location - right.location ||
      left.name.localeCompare(right.name)
  );
}

function getWGSLBindingDeclaration(options: {
  name: string;
  group: number;
  location: number;
  addressSpace: string[];
  resourceType: string;
}): BindingDeclaration | null {
  const {name, group, location, addressSpace, resourceType} = options;
  const base = {name, group, location};

  if (addressSpace[0] === 'uniform' && addressSpace.length === 1) {
    return {...base, type: 'uniform'};
  }
  if (addressSpace[0] === 'storage' && addressSpace.length <= 2) {
    const access = addressSpace[1] || 'read';
    if (access === 'read') {
      return {...base, type: 'read-only-storage'};
    }
    return access === 'read_write' ? {...base, type: 'storage'} : null;
  }
  if (addressSpace.length > 0) {
    return null;
  }

  if (resourceType === 'sampler' || resourceType === 'sampler_comparison') {
    return {
      ...base,
      type: 'sampler',
      ...(resourceType === 'sampler_comparison' ? {samplerType: 'comparison' as const} : {})
    };
  }
  if (resourceType === 'texture_external') {
    return {...base, type: 'external-texture'};
  }

  return (
    getWGSLStorageTextureBinding(base, resourceType) || getWGSLTextureBinding(base, resourceType)
  );
}

function getWGSLStorageTextureBinding(
  base: {name: string; group: number; location: number},
  resourceType: string
): StorageTextureBindingLayout | null {
  const match =
    /^texture_storage_(1d|2d|2d_array|3d)<([A-Za-z0-9_]+),(read|write|read_write)>$/.exec(
      resourceType
    );
  if (!match) {
    return null;
  }
  const access = {
    read: 'read-only',
    write: 'write-only',
    read_write: 'read-write'
  }[match[3]] as StorageTextureBindingLayout['access'];
  return {
    ...base,
    type: 'storage',
    format: match[2] as TextureFormat,
    access,
    viewDimension: getWGSLTextureViewDimension(match[1])
  };
}

function getWGSLTextureBinding(
  base: {name: string; group: number; location: number},
  resourceType: string
): TextureBindingLayout | null {
  const sampledTexture =
    /^texture_(multisampled_)?(1d|2d|2d_array|cube|cube_array|3d)<(f32|i32|u32)>$/.exec(
      resourceType
    );
  if (sampledTexture) {
    if (sampledTexture[1] && sampledTexture[2] !== '2d') {
      return null;
    }
    const sampleType = {f32: 'float', i32: 'sint', u32: 'uint'}[sampledTexture[3]] as
      | 'float'
      | 'sint'
      | 'uint';
    return {
      ...base,
      type: 'texture',
      viewDimension: getWGSLTextureViewDimension(sampledTexture[2]),
      sampleType,
      multisampled: Boolean(sampledTexture[1])
    };
  }

  const depthTexture = /^texture_depth_(multisampled_)?(2d|2d_array|cube|cube_array)$/.exec(
    resourceType
  );
  if (!depthTexture || (depthTexture[1] && depthTexture[2] !== '2d')) {
    return null;
  }
  return {
    ...base,
    type: 'texture',
    viewDimension: getWGSLTextureViewDimension(depthTexture[2]),
    sampleType: 'depth',
    multisampled: Boolean(depthTexture[1])
  };
}

function normalizeWGSLSamplerBindings(bindings: BindingDeclaration[]): void {
  for (const binding of bindings) {
    if (binding.type !== 'sampler' || binding.samplerType || !binding.name.endsWith('Sampler')) {
      continue;
    }
    const textureName = binding.name.slice(0, -'Sampler'.length);
    const pairedTexture = bindings.find(
      candidate =>
        candidate.type === 'texture' &&
        candidate.name === textureName &&
        candidate.group === binding.group
    ) as TextureBindingLayout | undefined;
    if (pairedTexture?.sampleType === 'depth') {
      (binding as SamplerBindingLayout).samplerType = 'non-filtering';
    }
  }
}

function scanWGSLVertexAttributes(
  tokens: WGSLToken[],
  braceDepths: number[],
  aliases: Map<string, string>,
  structures: Map<string, WGSLToken[]>,
  vertexEntryPoint: string | undefined
): AttributeDeclaration[] | null {
  const functions = scanWGSLFunctions(tokens, braceDepths);
  if (!functions) {
    return null;
  }
  const vertexFunctions = functions.filter(shaderFunction => shaderFunction.vertex);
  const selectedFunction = vertexEntryPoint
    ? vertexFunctions.find(shaderFunction => shaderFunction.name === vertexEntryPoint)
    : vertexFunctions.length === 1
      ? vertexFunctions[0]
      : undefined;

  if (!selectedFunction) {
    return vertexFunctions.length === 0 && !vertexEntryPoint ? [] : null;
  }

  const parameterDeclarations = splitTopLevelTokens(selectedFunction.parameters, ',');
  if (!parameterDeclarations) {
    return null;
  }
  const attributes: AttributeDeclaration[] = [];
  const attributeLocations = new Set<number>();
  const attributeNames = new Set<string>();
  const visitedStructures = new Set<string>();
  for (const declaration of parameterDeclarations) {
    if (
      declaration.length > 0 &&
      !scanWGSLVertexInputDeclaration({
        declaration,
        aliases,
        structures,
        attributes,
        attributeLocations,
        attributeNames,
        visitedStructures
      })
    ) {
      return null;
    }
  }
  return attributes.sort(
    (left, right) => left.location - right.location || left.name.localeCompare(right.name)
  );
}

function scanWGSLFunctions(tokens: WGSLToken[], braceDepths: number[]): WGSLFunction[] | null {
  const functions: WGSLFunction[] = [];
  const functionNames = new Set<string>();
  for (let tokenIndex = 0; tokenIndex < tokens.length; tokenIndex++) {
    if (braceDepths[tokenIndex] !== 0 || tokens[tokenIndex].value !== 'fn') {
      continue;
    }
    const name = tokens[tokenIndex + 1]?.value;
    const openParenthesisIndex = tokenIndex + 2;
    if (
      !isWGSLIdentifier(name) ||
      functionNames.has(name) ||
      tokens[openParenthesisIndex]?.value !== '('
    ) {
      return null;
    }
    const closeParenthesisIndex = findMatchingToken(tokens, openParenthesisIndex, '(', ')');
    if (closeParenthesisIndex < 0) {
      return null;
    }
    const statementStart = findTopLevelStatementStart(tokens, braceDepths, tokenIndex);
    functions.push({
      name,
      vertex: hasWGSLAttribute(tokens.slice(statementStart, tokenIndex), 'vertex'),
      parameters: tokens.slice(openParenthesisIndex + 1, closeParenthesisIndex)
    });
    functionNames.add(name);
    tokenIndex = closeParenthesisIndex;
  }
  return functions;
}

function scanWGSLVertexInputDeclaration(options: {
  declaration: WGSLToken[];
  aliases: Map<string, string>;
  structures: Map<string, WGSLToken[]>;
  attributes: AttributeDeclaration[];
  attributeLocations: Set<number>;
  attributeNames: Set<string>;
  visitedStructures: Set<string>;
}): boolean {
  const {
    declaration,
    aliases,
    structures,
    attributes,
    attributeLocations,
    attributeNames,
    visitedStructures
  } = options;
  const colonIndex = findTopLevelTokenInSlice(declaration, ':');
  if (colonIndex < 1 || colonIndex === declaration.length - 1) {
    return false;
  }
  const name = findLastWGSLIdentifier(declaration.slice(0, colonIndex));
  const location = getNumericWGSLAttribute(declaration.slice(0, colonIndex), 'location');
  const builtin = hasWGSLAttribute(declaration.slice(0, colonIndex), 'builtin');
  const resolvedType = resolveWGSLTypeAliases(
    formatWGSLTokens(declaration.slice(colonIndex + 1)),
    aliases
  );
  if (!name || location === null || !resolvedType || (location !== undefined && builtin)) {
    return false;
  }

  if (location !== undefined) {
    const attributeType = getWGSLAttributeShaderType(resolvedType);
    if (!attributeType || attributeLocations.has(location) || attributeNames.has(name)) {
      return false;
    }
    attributes.push({name, location, type: attributeType});
    attributeLocations.add(location);
    attributeNames.add(name);
    return true;
  }
  if (builtin) {
    return true;
  }

  const structureMembers = structures.get(resolvedType);
  if (!structureMembers || visitedStructures.has(resolvedType)) {
    return false;
  }
  const memberDeclarations = splitTopLevelTokens(structureMembers, ',');
  if (!memberDeclarations) {
    return false;
  }
  visitedStructures.add(resolvedType);
  for (const memberDeclaration of memberDeclarations) {
    if (
      memberDeclaration.length > 0 &&
      !scanWGSLVertexInputDeclaration({...options, declaration: memberDeclaration})
    ) {
      return false;
    }
  }
  visitedStructures.delete(resolvedType);
  return true;
}

function resolveWGSLTypeAliases(
  type: string,
  aliases: Map<string, string>,
  resolvingAliases: Set<string> = new Set()
): string | null {
  const tokens = tokenizeWGSL(type);
  let resolvedType = '';
  for (const token of tokens) {
    const alias = aliases.get(token.value);
    if (!alias) {
      resolvedType += normalizeWGSLBuiltinTypeAlias(token.value);
      continue;
    }
    if (resolvingAliases.has(token.value)) {
      return null;
    }
    const nextResolvingAliases = new Set(resolvingAliases);
    nextResolvingAliases.add(token.value);
    const resolvedAlias = resolveWGSLTypeAliases(alias, aliases, nextResolvingAliases);
    if (!resolvedAlias) {
      return null;
    }
    resolvedType += resolvedAlias;
  }
  return resolvedType;
}

function normalizeWGSLBuiltinTypeAlias(type: string): string {
  const aliasMatch = /^(vec[234]|mat[234]x[234])([fiuh])$/.exec(type);
  if (!aliasMatch) {
    return type;
  }
  const primitiveType = {f: 'f32', i: 'i32', u: 'u32', h: 'f16'}[aliasMatch[2]];
  return `${aliasMatch[1]}<${primitiveType}>`;
}

function getWGSLAttributeShaderType(type: string): AttributeShaderType | null {
  return /^(?:i32|u32|f32|f16|vec[234]<(?:i32|u32|f32|f16)>)$/.test(type)
    ? (type as AttributeShaderType)
    : null;
}

function getNumericWGSLAttribute(tokens: WGSLToken[], name: string): number | null | undefined {
  let value: number | undefined;
  for (let tokenIndex = 0; tokenIndex < tokens.length; tokenIndex++) {
    if (tokens[tokenIndex].value !== '@' || tokens[tokenIndex + 1]?.value !== name) {
      continue;
    }
    if (
      value !== undefined ||
      tokens[tokenIndex + 2]?.value !== '(' ||
      !/^\d+$/.test(tokens[tokenIndex + 3]?.value || '') ||
      tokens[tokenIndex + 4]?.value !== ')'
    ) {
      return null;
    }
    value = Number(tokens[tokenIndex + 3].value);
  }
  return value;
}

function hasWGSLAttribute(tokens: WGSLToken[], name: string): boolean {
  return tokens.some(
    (token, tokenIndex) => token.value === '@' && tokens[tokenIndex + 1]?.value === name
  );
}

function getWGSLTextureViewDimension(dimension: string): TextureBindingLayout['viewDimension'] {
  return dimension.replace('_', '-') as TextureBindingLayout['viewDimension'];
}

function findMatchingToken(
  tokens: WGSLToken[],
  openTokenIndex: number,
  openValue: string,
  closeValue: string
): number {
  let depth = 0;
  for (let tokenIndex = openTokenIndex; tokenIndex < tokens.length; tokenIndex++) {
    if (tokens[tokenIndex].value === openValue) {
      depth++;
    } else if (tokens[tokenIndex].value === closeValue && --depth === 0) {
      return tokenIndex;
    }
  }
  return -1;
}

function splitTopLevelTokens(tokens: WGSLToken[], delimiter: string): WGSLToken[][] | null {
  const parts: WGSLToken[][] = [];
  let partStart = 0;
  const delimiterDepths: Record<string, number> = {'(': 0, '<': 0, '[': 0, '{': 0};
  const openingValues = Object.keys(delimiterDepths);
  const closingToOpening: Record<string, string> = {')': '(', '>': '<', ']': '[', '}': '{'};

  for (let tokenIndex = 0; tokenIndex < tokens.length; tokenIndex++) {
    const value = tokens[tokenIndex].value;
    if (value === delimiter && openingValues.every(opening => delimiterDepths[opening] === 0)) {
      parts.push(tokens.slice(partStart, tokenIndex));
      partStart = tokenIndex + 1;
      continue;
    }
    if (value in delimiterDepths) {
      delimiterDepths[value]++;
    } else if (value in closingToOpening) {
      const opening = closingToOpening[value];
      delimiterDepths[opening]--;
      if (delimiterDepths[opening] < 0) {
        return null;
      }
    }
  }
  if (!openingValues.every(opening => delimiterDepths[opening] === 0)) {
    return null;
  }
  parts.push(tokens.slice(partStart));
  return parts;
}

function findTopLevelTokenInSlice(tokens: WGSLToken[], value: string): number {
  const parts = splitTopLevelTokens(tokens, value);
  return parts && parts.length === 2 ? parts[0].length : -1;
}

function findTopLevelToken(
  tokens: WGSLToken[],
  braceDepths: number[],
  startIndex: number,
  value: string
): number {
  for (let tokenIndex = startIndex; tokenIndex < tokens.length; tokenIndex++) {
    if (braceDepths[tokenIndex] === 0 && tokens[tokenIndex].value === value) {
      return tokenIndex;
    }
  }
  return -1;
}

function findTopLevelStatementStart(
  tokens: WGSLToken[],
  braceDepths: number[],
  beforeIndex: number
): number {
  for (let tokenIndex = beforeIndex - 1; tokenIndex >= 0; tokenIndex--) {
    if (
      (tokens[tokenIndex].value === ';' && braceDepths[tokenIndex] === 0) ||
      (tokens[tokenIndex].value === '}' && braceDepths[tokenIndex] === 1)
    ) {
      return tokenIndex + 1;
    }
  }
  return 0;
}

function findLastWGSLIdentifier(tokens: WGSLToken[]): string | null {
  for (let tokenIndex = tokens.length - 1; tokenIndex >= 0; tokenIndex--) {
    if (isWGSLIdentifier(tokens[tokenIndex].value)) {
      return tokens[tokenIndex].value;
    }
  }
  return null;
}

function formatWGSLTokens(tokens: WGSLToken[]): string {
  return tokens.map(token => token.value).join('');
}

function isWGSLIdentifier(value: string | undefined): value is string {
  return Boolean(value && /^[A-Za-z_][A-Za-z0-9_]*$/.test(value));
}
