// luma.gl, MIT license

import {log} from '../../lib/utils/log';
import type {
  ShaderLayout,
  AttributeDeclaration,
  BufferLayout,
  SingleBufferLayout
} from '../types/shader-layout';
import type {ShaderDataType, ShaderAttributeType} from '../types/shader-formats';
import {decodeShaderAttributeType} from '../type-utils/decode-attribute-type';
import type {VertexFormat, VertexType} from '../types/vertex-formats';
import {decodeVertexFormat} from '../type-utils/decode-vertex-format';

/** Resolved info for a buffer / attribute combination to help backend configure it correctly */
export type AttributeInfo = {
  name: string;
  location: number;

  shaderType: ShaderAttributeType;
  /** Calculations are done in this type in the shader's attribute declaration */
  shaderDataType: ShaderDataType;
  /** Components refer to the number of components in the shader's attribute declaration */
  shaderComponents: 1 | 2 | 3 | 4;

  vertexFormat: VertexFormat;
  /** Memory data type refers to the data type in the buffer */
  bufferDataType: VertexType;
  /** Components refer to the number of components in the buffer's vertex format */
  bufferComponents: 1 | 2 | 3 | 4;

  stepMode: 'vertex' | 'instance';

  /** The byteOffset is encoded in the buffer layout */
  byteOffset: number;
  /** The byteStride is encoded in the buffer layout */
  byteStride: number;
  /** Normalization is encoded in the buffer layout's vertex format... */
  normalized: boolean;
  /** It is the shader attribute declaration that determines whether GPU will process as integer or float */
  integer: boolean;
};

/**
 * Get the combined information from a shader layout and a buffer layout for a specific attribute
 */
export function getAttributeInfoFromLayouts(
  shaderLayout: ShaderLayout,
  bufferLayout: BufferLayout[],
  name: string
): AttributeInfo | null {
  const shaderDeclaration = getAttributeFromShaderLayout(shaderLayout, name);
  const bufferMapping: BufferLayout = getAttributeFromBufferLayout(bufferLayout, name);

  if (!shaderDeclaration) {
    //  || !bufferMapping
    return null;
  }

  const attributeTypeInfo = decodeShaderAttributeType(shaderDeclaration.type);
  const vertexFormat = bufferMapping?.format || attributeTypeInfo.defaultVertexFormat;
  const vertexFormatInfo = decodeVertexFormat(vertexFormat);
    
  return {
    name,
    location: shaderDeclaration.location,
    shaderType: shaderDeclaration.type,
    shaderDataType: attributeTypeInfo.dataType,
    shaderComponents: attributeTypeInfo.components,
    vertexFormat,
    bufferDataType: vertexFormatInfo.type,
    bufferComponents: vertexFormatInfo.components,
    normalized: vertexFormatInfo.normalized,
    integer: attributeTypeInfo.integer,
    stepMode: bufferMapping?.stepMode || shaderDeclaration.stepMode,
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
  bufferLayout: BufferLayout[],
  name: string
): SingleBufferLayout | null {
  for (const bufferMapping of bufferLayout) {
    // If this is the mapping return
    if (bufferMapping.name === name) {
      return bufferMapping;
    }

    // Search interleaved attributes for buffer mapping
    if (bufferMapping.attributes) {
      const interleavedMapping = bufferMapping.attributes?.find(attr => attr.name === name);
      if (interleavedMapping) {
        return {
          ...bufferMapping,
          name,
          format: interleavedMapping.format
          // TODO - how to handle undefined case.
          // byteOffset: (bufferMapping.byteOffset || 0) + (interleavedMapping?.byteStrideOffset || 0),
        };
      }
    }
  }
  log.warn(`layout for attribute "${name}" not present in buffer layout`);
  return null;
}

/**
 * Merges an provided shader layout into a base shader layout
 * In WebGL, this allows the auto generated shader layout to be overridden by the application
 * Typically to change the format of the vertex attributes (from float32x4 to uint8x4 etc).
 * @todo Drop this? Aren't all use cases covered by mergeBufferLayout()?
 */
export function mergeShaderLayout(
  baseLayout: ShaderLayout,
  overrideLayout: ShaderLayout
): ShaderLayout {
  // Deep clone the base layout
  const mergedLayout: ShaderLayout = {
    ...baseLayout,
    attributes: baseLayout.attributes.map(attribute => ({...attribute}))
  };
  // Merge the attributes
  for (const attribute of overrideLayout?.attributes || []) {
    const baseAttribute = mergedLayout.attributes.find(attr => attr.name === attribute.name);
    if (!baseAttribute) {
      log.warn(`shader layout attribute ${attribute.name} not present in shader`);
    } else {
      baseAttribute.type = attribute.type || baseAttribute.type;
      baseAttribute.stepMode = attribute.stepMode || baseAttribute.stepMode;
    }
  }
  return mergedLayout;
}
