// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ShaderLayout, BufferLayout, AttributeDeclaration, VertexFormat} from '@luma.gl/core';
import {log, decodeVertexFormat} from '@luma.gl/core';
// import {getAttributeInfosFromLayouts} from '@luma.gl/core';

/** Throw error on any WebGL-only vertex formats */
function getWebGPUVertexFormat(format: VertexFormat): GPUVertexFormat {
  if (format.endsWith('-webgl')) {
    throw new Error(`WebGPU does not support vertex format ${format}`);
  }
  return format as GPUVertexFormat;
}

/**
 * Build a WebGPU vertex buffer layout intended for use in a GPURenderPassDescriptor.
 * Converts luma.gl attribute definitions to a WebGPU GPUVertexBufferLayout[] array
 * @param layout
 * @param bufferLayout The buffer map is optional
 * @returns WebGPU layout intended for a GPURenderPassDescriptor.
 */
export function getVertexBufferLayout(
  shaderLayout: ShaderLayout,
  bufferLayout: BufferLayout[]
): GPUVertexBufferLayout[] {
  const vertexBufferLayouts: GPUVertexBufferLayout[] = [];
  const usedAttributes = new Set<string>();

  // First handle any buffers mentioned in `bufferLayout`
  for (const mapping of bufferLayout) {
    // Build vertex attributes for one buffer
    const vertexAttributes: GPUVertexAttribute[] = [];

    // TODO verify that all stepModes for one buffer are the same
    let stepMode: 'vertex' | 'instance' = 'vertex';
    let byteStride = 0;
    // @ts-ignore
    const format: VertexFormat = mapping.format;

    // interleaved mapping {..., attributes: [{...}, ...]}
    if (mapping.attributes) {
      // const arrayStride = mapping.byteStride; TODO
      for (const attributeMapping of mapping.attributes) {
        const attributeName = attributeMapping.attribute;
        const attributeLayout = findAttributeLayout(shaderLayout, attributeName, usedAttributes);

        // @ts-ignore
        const location: number = attributeLayout?.location;

        stepMode =
          attributeLayout?.stepMode ||
          (attributeLayout?.name.startsWith('instance') ? 'instance' : 'vertex');
        vertexAttributes.push({
          format: getWebGPUVertexFormat(attributeMapping.format || mapping.format),
          offset: attributeMapping.byteOffset,
          shaderLocation: location
        });

        byteStride += decodeVertexFormat(format).byteLength;
      }
      // non-interleaved mapping (just set offset and stride)
    } else {
      const attributeLayout = findAttributeLayout(shaderLayout, mapping.name, usedAttributes);
      if (!attributeLayout) {
        continue; // eslint-disable-line no-continue
      }
      byteStride = decodeVertexFormat(format).byteLength;

      stepMode =
        attributeLayout.stepMode ||
        (attributeLayout.name.startsWith('instance') ? 'instance' : 'vertex');
      vertexAttributes.push({
        format: getWebGPUVertexFormat(format),
        // We only support 0 offset for non-interleaved buffer layouts
        offset: 0,
        shaderLocation: attributeLayout.location
      });
    }

    // Store all the attribute bindings for one buffer
    vertexBufferLayouts.push({
      arrayStride: mapping.byteStride || byteStride,
      stepMode,
      attributes: vertexAttributes
    });
  }

  // Add any non-mapped attributes - TODO - avoid hardcoded types
  for (const attribute of shaderLayout.attributes) {
    if (!usedAttributes.has(attribute.name)) {
      vertexBufferLayouts.push({
        arrayStride: decodeVertexFormat('float32x3').byteLength,
        stepMode:
          attribute.stepMode || (attribute.name.startsWith('instance') ? 'instance' : 'vertex'),
        attributes: [
          {
            format: getWebGPUVertexFormat('float32x3'),
            offset: 0,
            shaderLocation: attribute.location
          }
        ]
      });
    }
  }

  return vertexBufferLayouts;
}

export function getBufferSlots(
  shaderLayout: ShaderLayout,
  bufferLayout: BufferLayout[]
): Record<string, number> {
  const usedAttributes = new Set<string>();
  let bufferSlot = 0;
  const bufferSlots: Record<string, number> = {};

  // First handle any buffers mentioned in `bufferLayout`
  for (const mapping of bufferLayout) {
    // interleaved mapping {..., attributes: [{...}, ...]}
    if ('attributes' in mapping) {
      for (const interleaved of mapping.attributes || []) {
        usedAttributes.add(interleaved.attribute);
      }
      // non-interleaved mapping (just set offset and stride)
    } else {
      usedAttributes.add(mapping.name);
    }
    bufferSlots[mapping.name] = bufferSlot++;
  }

  // Add any non-mapped attributes
  for (const attribute of shaderLayout.attributes) {
    if (!usedAttributes.has(attribute.name)) {
      bufferSlots[attribute.name] = bufferSlot++;
    }
  }

  return bufferSlots;
}

/**
 * Looks up an attribute in the ShaderLayout.
 * @throws if name is not in ShaderLayout
 * @throws if name has already been referenced
 */
function findAttributeLayout(
  shaderLayout: ShaderLayout,
  name: string,
  attributeNames: Set<string>
): AttributeDeclaration | null {
  const attribute = shaderLayout.attributes.find(attribute_ => attribute_.name === name);
  if (!attribute) {
    log.warn(`Unknown attribute ${name}`)();
    return null;
  }
  if (attributeNames.has(name)) {
    throw new Error(`Duplicate attribute ${name}`);
  }
  attributeNames.add(name);
  return attribute;
}
