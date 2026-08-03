// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {type PrimitiveDataType} from '../data-types/data-types';
import {
  type VariableShaderType,
  type AttributeShaderType,
  type VariableShaderTypeAlias,
  type AttributeShaderTypeAlias
} from './shader-types';

/** Information extracted from a VariableShaderType constant */
export type VariableShaderTypeInfo = {
  type: PrimitiveDataType;
  components: number;
};

/** Information extracted from a AttributeShaderType constant */
export type AttributeShaderTypeInfo = {
  /** WGSL-style primitive data type, f32, i32, u32 */
  primitiveType: PrimitiveDataType;
  /** Whether this is a normalized integer (that must be used as float) */
  components: 1 | 2 | 3 | 4;
  /** Length in bytes of the data for one vertex */
  byteLength?: number;
  /** Whether this is for integer or float vert */
  integer: boolean;
  /** Whether this data type is signed */
  signed: boolean;
};

/** Split a uniform type string into type and components */
export function getVariableShaderTypeInfo(
  format: VariableShaderType | VariableShaderTypeAlias
): VariableShaderTypeInfo {
  const resolvedFormat = resolveVariableShaderTypeAlias(format);
  const decoded = parseVariableShaderType(resolvedFormat);
  if (!decoded) {
    throw new Error(`Unsupported variable shader type: ${format}`);
  }
  return decoded;
}

/** Decodes a vertex type, returning byte length and flags (integer, signed, normalized) */
export function getAttributeShaderTypeInfo(
  attributeType: AttributeShaderType | AttributeShaderTypeAlias
): AttributeShaderTypeInfo {
  const resolvedAttributeType = resolveAttributeShaderTypeAlias(attributeType);
  const decoded = parseVariableShaderType(resolvedAttributeType);
  if (!decoded || resolvedAttributeType.startsWith('mat') || decoded.components > 4) {
    throw new Error(`Unsupported attribute shader type: ${attributeType}`);
  }
  const {type: primitiveType} = decoded;
  const components = decoded.components as 1 | 2 | 3 | 4;
  const integer: boolean = primitiveType === 'i32' || primitiveType === 'u32';
  const signed: boolean = primitiveType !== 'u32';
  const byteLength = (primitiveType === 'f16' ? 2 : 4) * components;
  return {
    primitiveType,
    components,
    byteLength,
    integer,
    signed
  };
}

export class ShaderTypeDecoder {
  getVariableShaderTypeInfo(
    format: VariableShaderType | VariableShaderTypeAlias
  ): VariableShaderTypeInfo {
    return getVariableShaderTypeInfo(format);
  }

  getAttributeShaderTypeInfo(
    attributeType: AttributeShaderType | AttributeShaderTypeAlias
  ): AttributeShaderTypeInfo {
    return getAttributeShaderTypeInfo(attributeType);
  }

  makeShaderAttributeType(
    primitiveType: PrimitiveDataType,
    components: 1 | 2 | 3 | 4
  ): AttributeShaderType {
    return makeShaderAttributeType(primitiveType, components);
  }

  resolveAttributeShaderTypeAlias(
    alias: AttributeShaderTypeAlias | AttributeShaderType
  ): AttributeShaderType {
    return resolveAttributeShaderTypeAlias(alias);
  }

  resolveVariableShaderTypeAlias(
    alias: VariableShaderTypeAlias | VariableShaderType
  ): VariableShaderType {
    return resolveVariableShaderTypeAlias(alias);
  }
}

export function makeShaderAttributeType(
  primitiveType: PrimitiveDataType,
  components: 1 | 2 | 3 | 4
): AttributeShaderType {
  return components === 1 ? primitiveType : `vec${components}<${primitiveType}>`;
}

export function resolveAttributeShaderTypeAlias(
  alias: AttributeShaderTypeAlias | AttributeShaderType
): AttributeShaderType {
  return resolveShaderTypeAlias(alias, /^vec[2-4]([fiuh])$/) as AttributeShaderType;
}

export function resolveVariableShaderTypeAlias(
  alias: VariableShaderTypeAlias | VariableShaderType
): VariableShaderType {
  return resolveShaderTypeAlias(alias, /^(?:vec[2-4]|mat[2-4]x[2-4])([fiuh])$/);
}

/** Decoder for luma.gl shader types */
export const shaderTypeDecoder = new ShaderTypeDecoder();

const VARIABLE_TYPE_INFO_CACHE = new Map<string, VariableShaderTypeInfo>();
const ALIAS_PRIMITIVE_TYPES = {f: 'f32', h: 'f16', i: 'i32', u: 'u32'} as const;

function parseVariableShaderType(format: string): VariableShaderTypeInfo | null {
  const cached = VARIABLE_TYPE_INFO_CACHE.get(format);
  if (cached) {
    return cached;
  }

  let type: PrimitiveDataType;
  let components: number;
  const primitiveMatch = /^(f16|f32|i32|u32)$/.exec(format);
  if (primitiveMatch) {
    type = primitiveMatch[1] as PrimitiveDataType;
    components = 1;
  } else {
    const compositeMatch = /^(?:vec([2-4])|mat([2-4])x([2-4]))<(f16|f32|i32|u32)>$/.exec(format);
    if (!compositeMatch) {
      return null;
    }
    type = compositeMatch[4] as PrimitiveDataType;
    components = compositeMatch[1]
      ? Number(compositeMatch[1])
      : Number(compositeMatch[2]) * Number(compositeMatch[3]);
  }

  const typeInfo = {type, components};
  VARIABLE_TYPE_INFO_CACHE.set(format, typeInfo);
  return typeInfo;
}

function resolveShaderTypeAlias(alias: string, aliasPattern: RegExp): VariableShaderType {
  const match = aliasPattern.exec(alias);
  if (!match) {
    return alias as VariableShaderType;
  }
  const primitiveType = getAliasPrimitiveType(match[1]);
  return `${alias.slice(0, -1)}<${primitiveType}>` as VariableShaderType;
}

function getAliasPrimitiveType(suffix: string): PrimitiveDataType {
  // Alias patterns only accept these four suffixes.
  return ALIAS_PRIMITIVE_TYPES[suffix as keyof typeof ALIAS_PRIMITIVE_TYPES];
}
