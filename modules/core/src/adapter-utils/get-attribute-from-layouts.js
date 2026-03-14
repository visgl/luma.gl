// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import { log } from '../utils/log';
import { getAttributeShaderTypeInfo } from '../shadertypes/data-types/decode-shader-types';
import { getVertexFormatInfo, getCompatibleVertexFormat } from '../shadertypes/vertex-arrays/decode-vertex-format';
/**
 * Map from "attribute names" to "resolved attribute infos"
 * containing information about both buffer layouts and shader attribute declarations
 */
export function getAttributeInfosFromLayouts(shaderLayout, bufferLayout) {
    const attributeInfos = {};
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
export function getAttributeInfosByLocation(shaderLayout, bufferLayout, maxVertexAttributes = 16) {
    const attributeInfos = getAttributeInfosFromLayouts(shaderLayout, bufferLayout);
    const locationInfos = new Array(maxVertexAttributes).fill(null);
    for (const attributeInfo of Object.values(attributeInfos)) {
        locationInfos[attributeInfo.location] = attributeInfo;
    }
    return locationInfos;
}
/**
 * Get the combined information from a shader layout and a buffer layout for a specific attribute
 */
function getAttributeInfoFromLayouts(shaderLayout, bufferLayout, name) {
    const shaderDeclaration = getAttributeFromShaderLayout(shaderLayout, name);
    const bufferMapping = getAttributeFromBufferLayout(bufferLayout, name);
    // TODO should no longer happen
    if (!shaderDeclaration) {
        //  || !bufferMapping
        return null;
    }
    const attributeTypeInfo = getAttributeShaderTypeInfo(shaderDeclaration.type);
    const defaultVertexFormat = getCompatibleVertexFormat(attributeTypeInfo);
    const vertexFormat = bufferMapping?.vertexFormat || defaultVertexFormat;
    const vertexFormatInfo = getVertexFormatInfo(vertexFormat);
    return {
        attributeName: bufferMapping?.attributeName || shaderDeclaration.name,
        bufferName: bufferMapping?.bufferName || shaderDeclaration.name,
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
        stepMode: bufferMapping?.stepMode || shaderDeclaration.stepMode || 'vertex',
        byteOffset: bufferMapping?.byteOffset || 0,
        byteStride: bufferMapping?.byteStride || 0
    };
}
function getAttributeFromShaderLayout(shaderLayout, name) {
    const attribute = shaderLayout.attributes.find(attr => attr.name === name);
    if (!attribute) {
        log.warn(`shader layout attribute "${name}" not present in shader`);
    }
    return attribute || null;
}
function getAttributeFromBufferLayout(bufferLayouts, name) {
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
function checkBufferLayouts(bufferLayouts) {
    for (const bufferLayout of bufferLayouts) {
        if ((bufferLayout.attributes && bufferLayout.format) ||
            (!bufferLayout.attributes && !bufferLayout.format)) {
            log.warn(`BufferLayout ${name} must have either 'attributes' or 'format' field`);
        }
    }
}
/** Get attribute from format shorthand if specified */
function getAttributeFromShortHand(bufferLayouts, name) {
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
function getAttributeFromAttributesList(bufferLayouts, name) {
    for (const bufferLayout of bufferLayouts) {
        let byteStride = bufferLayout.byteStride;
        // Calculate a default byte stride if not provided
        if (typeof bufferLayout.byteStride !== 'number') {
            for (const attributeMapping of bufferLayout.attributes || []) {
                const info = getVertexFormatInfo(attributeMapping.format);
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
