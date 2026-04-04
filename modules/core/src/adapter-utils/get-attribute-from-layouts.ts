// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {log} from '../utils/log';
import type {PrimitiveDataType, NormalizedDataType} from '../shadertypes/data-types/data-types';
import type {AttributeShaderType} from '../shadertypes/shader-types/shader-types';
import type {VertexFormat} from '../shadertypes/vertex-types/vertex-formats';
import {shaderTypeDecoder} from '../shadertypes/shader-types/shader-type-decoder';
import {vertexFormatDecoder} from '../shadertypes/vertex-types/vertex-format-decoder';
import type {ShaderLayout, AttributeDeclaration} from '../adapter/types/shader-layout';
import type {BufferLayout} from '../adapter/types/buffer-layout';
import {resolveLogicalAttributeMappings} from './buffer-layout-utils';

/** Resolved info for a buffer / attribute combination to help backend configure it correctly */
export type AttributeInfo = {
  /** Attribute name */
  attributeName: string;
  /** Location in shader */
  location: number;
  /** Type / precision used in shader (buffer values may be converted) */
  shaderType: AttributeShaderType;
  /** Calculations are done in this type in the shader's attribute declaration */
  primitiveType: PrimitiveDataType;
  /** Components refer to the number of components in the shader's attribute declaration */
  shaderComponents: 1 | 2 | 3 | 4;
  /** It is the shader attribute declaration that determines whether GPU will process as integer or float */
  integer: boolean;

  /** BufferName */
  bufferName: string;
  /** Format of buffer data */
  vertexFormat: VertexFormat;
  /** Memory data type refers to the data type in the buffer */
  bufferDataType: NormalizedDataType;
  /** Components refer to the number of components in the buffer's vertex format */
  bufferComponents: 1 | 2 | 3 | 4;
  /** Normalization is encoded in the buffer layout's vertex format... */
  normalized: boolean;

  /** If not specified, the step mode is inferred from the attribute name in the shader (contains string instance) */
  stepMode: 'vertex' | 'instance';

  /** The byteOffset is encoded in or calculated from the buffer layout */
  byteOffset: number;
  /** The byteStride is encoded in or calculated from the buffer layout */
  byteStride: number;
};

/**
 * Map from "attribute names" to "resolved attribute infos"
 * containing information about both buffer layouts and shader attribute declarations
 */
export function getAttributeInfosFromLayouts(
  shaderLayout: ShaderLayout,
  bufferLayout: BufferLayout[]
): Record<string, AttributeInfo> {
  const attributeInfos: Record<string, AttributeInfo> = {};
  const logicalMappings = resolveLogicalAttributeMappings(shaderLayout, bufferLayout, {
    warnOnMissingBufferLayout: true
  });

  for (const logicalMapping of logicalMappings) {
    const attributeInfo = getAttributeInfoFromLogicalMapping(shaderLayout, logicalMapping);
    attributeInfos[logicalMapping.attributeName] = attributeInfo;
  }

  return attributeInfos;
}

/**
 * Get the combined information from a shader layout and a buffer layout for a specific attribute
 */
function getAttributeInfoFromLogicalMapping(
  shaderLayout: ShaderLayout,
  logicalMapping: {
    attributeName: string;
    bufferName: string;
    vertexFormat: VertexFormat;
    byteOffset: number;
    byteStride: number;
    stepMode: 'vertex' | 'instance';
  }
): AttributeInfo {
  const shaderDeclaration = getAttributeFromShaderLayout(
    shaderLayout,
    logicalMapping.attributeName
  )!;

  const attributeTypeInfo = shaderTypeDecoder.getAttributeShaderTypeInfo(shaderDeclaration.type);
  const vertexFormat = logicalMapping.vertexFormat;
  const vertexFormatInfo = vertexFormatDecoder.getVertexFormatInfo(vertexFormat);

  return {
    attributeName: logicalMapping.attributeName,
    bufferName: logicalMapping.bufferName,
    location: shaderDeclaration.location,
    shaderType: shaderDeclaration.type,
    primitiveType: attributeTypeInfo.primitiveType,
    shaderComponents: attributeTypeInfo.components,
    vertexFormat,
    bufferDataType: vertexFormatInfo.type,
    bufferComponents: vertexFormatInfo.components,
    // normalized is a property of the buffer's vertex format
    normalized: vertexFormatInfo.normalized,
    // integer is a property of the shader declaration
    integer: attributeTypeInfo.integer,
    stepMode: logicalMapping.stepMode,
    byteOffset: logicalMapping.byteOffset,
    byteStride: logicalMapping.byteStride
  };
}

function getAttributeFromShaderLayout(
  shaderLayout: ShaderLayout,
  name: string
): AttributeDeclaration | null {
  const attribute = shaderLayout.attributes.find(attr => attr.name === name);
  if (!attribute) {
    log.warn(`shader layout attribute "${name}" not present in shader`)();
  }
  return attribute || null;
}
