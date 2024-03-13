// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {log} from '../utils/log';
import type {ShaderLayout, AttributeDeclaration} from '../adapter/types/shader-layout';
import type {BufferLayout} from '../adapter/types/buffer-layout';
import type {ShaderDataType, ShaderAttributeType} from '../gpu-type-utils/shader-types';
import {decodeShaderAttributeType} from '../gpu-type-utils/decode-attribute-type';
import type {VertexFormat, VertexType} from '../gpu-type-utils/vertex-formats';
import {decodeVertexFormat} from '../gpu-type-utils/decode-vertex-format';

/** Resolved info for a buffer / attribute combination to help backend configure it correctly */
export type AttributeInfo = {
  /** Attribute name */
  attributeName: string;
  /** Location in shader */
  location: number;
  /** Type / precision used in shader (buffer values may be converted) */
  shaderType: ShaderAttributeType;
  /** Calculations are done in this type in the shader's attribute declaration */
  shaderDataType: ShaderDataType;
  /** Components refer to the number of components in the shader's attribute declaration */
  shaderComponents: 1 | 2 | 3 | 4;
  /** It is the shader attribute declaration that determines whether GPU will process as integer or float */
  integer: boolean;

  /** BufferName */
  bufferName: string;
  /** Format of buffer data */
  vertexFormat: VertexFormat;
  /** Memory data type refers to the data type in the buffer */
  bufferDataType: VertexType;
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

type BufferAttributeInfo = {
  attributeName: string;
  bufferName: string;
  stepMode?: 'vertex' | 'instance';
  vertexFormat: VertexFormat;
  byteOffset: number;
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
  for (const attribute of shaderLayout.attributes) {
    const attributeInfo = getAttributeInfoFromLayouts(shaderLayout, bufferLayout, attribute.name);
    if (attributeInfo) {
      attributeInfos[attribute.name] = attributeInfo;
    }
  }
  return attributeInfos;
}

/**
 * Array indexed by "location" holding "resolved attribute infos"
 */
export function getAttributeInfosByLocation(
  shaderLayout: ShaderLayout,
  bufferLayout: BufferLayout[],
  maxVertexAttributes: number = 16
): AttributeInfo[] {
  const attributeInfos = getAttributeInfosFromLayouts(shaderLayout, bufferLayout);
  const locationInfos: AttributeInfo[] = new Array(maxVertexAttributes).fill(null);
  for (const attributeInfo of Object.values(attributeInfos)) {
    locationInfos[attributeInfo.location] = attributeInfo;
  }
  return locationInfos;
}

/**
 * Get the combined information from a shader layout and a buffer layout for a specific attribute
 */
function getAttributeInfoFromLayouts(
  shaderLayout: ShaderLayout,
  bufferLayout: BufferLayout[],
  name: string
): AttributeInfo | null {
  const shaderDeclaration = getAttributeFromShaderLayout(shaderLayout, name);
  const bufferMapping: BufferAttributeInfo | null = getAttributeFromBufferLayout(
    bufferLayout,
    name
  );

  // TODO should no longer happen
  if (!shaderDeclaration) {
    //  || !bufferMapping
    return null;
  }

  const attributeTypeInfo = decodeShaderAttributeType(shaderDeclaration.type);
  const vertexFormat = bufferMapping?.vertexFormat || attributeTypeInfo.defaultVertexFormat;
  const vertexFormatInfo = decodeVertexFormat(vertexFormat);

  return {
    attributeName: bufferMapping?.attributeName || shaderDeclaration.name,
    bufferName: bufferMapping?.bufferName || shaderDeclaration.name,
    location: shaderDeclaration.location,
    shaderType: shaderDeclaration.type,
    shaderDataType: attributeTypeInfo.dataType,
    shaderComponents: attributeTypeInfo.components,
    vertexFormat,
    bufferDataType: vertexFormatInfo.type,
    bufferComponents: vertexFormatInfo.components,
    // normalized is a property of the buffer's vertex format
    normalized: vertexFormatInfo.normalized,
    // integer is a property of the shader declaration
    integer: attributeTypeInfo.integer,
    stepMode: bufferMapping?.stepMode || shaderDeclaration.stepMode || 'vertex',
    byteOffset: bufferMapping?.byteOffset || 0,
    byteStride: bufferMapping?.byteStride || 0
  };
}

function getAttributeFromShaderLayout(
  shaderLayout: ShaderLayout,
  name: string
): AttributeDeclaration | null {
  const attribute = shaderLayout.attributes.find(attr => attr.name === name);
  if (!attribute) {
    log.warn(`shader layout attribute "${name}" not present in shader`);
  }
  return attribute || null;
}

function getAttributeFromBufferLayout(
  bufferLayouts: BufferLayout[],
  name: string
): BufferAttributeInfo | null {
  // Check that bufferLayouts are valid (each either has format or attribute)
  checkBufferLayouts(bufferLayouts);

  let bufferLayoutInfo = getAttributeFromShortHand(bufferLayouts, name);
  if (bufferLayoutInfo) {
    return bufferLayoutInfo;
  }

  bufferLayoutInfo = getAttributeFromAttributesList(bufferLayouts, name);
  if (bufferLayoutInfo) {
    return bufferLayoutInfo;
  }

  // Didn't find...
  log.warn(`layout for attribute "${name}" not present in buffer layout`);
  return null;
}

/** Check that bufferLayouts are valid (each either has format or attribute) */
function checkBufferLayouts(bufferLayouts: BufferLayout[]) {
  for (const bufferLayout of bufferLayouts) {
    if (
      (bufferLayout.attributes && bufferLayout.format) ||
      (!bufferLayout.attributes && !bufferLayout.format)
    ) {
      log.warn(`BufferLayout ${name} must have either 'attributes' or 'format' field`);
    }
  }
}

/** Get attribute from format shorthand if specified */
function getAttributeFromShortHand(
  bufferLayouts: BufferLayout[],
  name: string
): BufferAttributeInfo | null {
  for (const bufferLayout of bufferLayouts) {
    if (bufferLayout.format && bufferLayout.name === name) {
      return {
        attributeName: bufferLayout.name,
        bufferName: name,
        stepMode: bufferLayout.stepMode,
        vertexFormat: bufferLayout.format,
        // If offset is needed, use `attributes` field.
        byteOffset: 0,
        byteStride: bufferLayout.byteStride || 0
      };
    }
  }
  return null;
}

/**
 * Search attribute mappings (e.g. interleaved attributes) for buffer mapping.
 * Not the name of the buffer might be the same as one of the interleaved attributes.
 */
function getAttributeFromAttributesList(
  bufferLayouts: BufferLayout[],
  name: string
): BufferAttributeInfo | null {
  for (const bufferLayout of bufferLayouts) {
    let byteStride: number | undefined = bufferLayout.byteStride;

    // Calculate a default byte stride if not provided
    if (typeof bufferLayout.byteStride !== 'number') {
      for (const attributeMapping of bufferLayout.attributes || []) {
        const info = decodeVertexFormat(attributeMapping.format);
        // @ts-ignore
        byteStride += info.byteLength;
      }
    }

    const attributeMapping = bufferLayout.attributes?.find(mapping => mapping.attribute === name);
    if (attributeMapping) {
      return {
        attributeName: attributeMapping.attribute,
        bufferName: bufferLayout.name,
        stepMode: bufferLayout.stepMode,
        vertexFormat: attributeMapping.format,
        byteOffset: attributeMapping.byteOffset,
        // @ts-ignore
        byteStride
      };
    }
  }

  return null;
}
