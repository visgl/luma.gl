// luma.gl, MIT license

import {log} from '../../lib/utils/log';
import type {ShaderLayout, AttributeDeclaration} from '../types/shader-layout';
import type {BufferLayout} from '../types/buffer-layout';
import type {ShaderDataType, ShaderAttributeType} from '../types/shader-formats';
import {decodeShaderAttributeType} from '../type-utils/decode-attribute-type';
import type {VertexFormat, VertexType} from '../types/vertex-formats';
import {decodeVertexFormat} from '../type-utils/decode-vertex-format';

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

export function getAttributeInfosFromLayouts(
  shaderLayout: ShaderLayout,
  bufferLayout: BufferLayout[]
): Record<string, AttributeInfo> {
  const attributeInfos: Record<string, ReturnType<typeof getAttributeInfoFromLayouts>> = {};
  for (const attribute of shaderLayout.attributes) {
    attributeInfos[attribute.name] = getAttributeInfoFromLayouts(
      shaderLayout,
      bufferLayout,
      attribute.name
    );
  }
  return attributeInfos;
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
  const bufferMapping: Partial<AttributeInfo> = getAttributeFromBufferLayout(bufferLayout, name);

  // TODO should no longer happen
  if (!shaderDeclaration) {
    //  || !bufferMapping
    return null;
  }

  const attributeTypeInfo = decodeShaderAttributeType(shaderDeclaration.type);
  const vertexFormat = bufferMapping?.vertexFormat || attributeTypeInfo.defaultVertexFormat;
  const vertexFormatInfo = decodeVertexFormat(vertexFormat);

  return {
    attributeName: bufferMapping.attributeName,
    bufferName: bufferMapping.bufferName,
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
        byteStride += info.byteLength;
      }
    }

    const attributeMapping = bufferLayout.attributes.find(mapping => mapping.attribute === name);
    if (attributeMapping?.attribute === name) {
      return {
        attributeName: attributeMapping.attribute,
        bufferName: bufferLayout.name,
        stepMode: bufferLayout.stepMode,
        vertexFormat: attributeMapping.format,
        byteOffset: attributeMapping.byteOffset,
        byteStride
      };
    }
  }

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
