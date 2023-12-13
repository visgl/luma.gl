// luma.gl, MIT license
import type {ShaderLayout, BufferLayout, AttributeDeclaration, VertexFormat} from '@luma.gl/core';
import {getAttributeInfosFromLayouts, decodeVertexFormat} from '@luma.gl/core';

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
    // interleaved mapping {..., attributes: [{...}, ...]}
    if (mapping.attributes) {
      // const arrayStride = mapping.byteStride; TODO
      for (const attributeMapping of mapping.attributes) {
        const attributeName = attributeMapping.attribute;
        const attributeLayout = findAttributeLayout(shaderLayout, attributeName, usedAttributes);

        stepMode = attributeLayout.stepMode || 'vertex';
        vertexAttributes.push({
          format: getWebGPUVertexFormat(attributeMapping.format || mapping.format),
          offset: attributeMapping.byteOffset,
          shaderLocation: attributeLayout.location
        });

        byteStride += decodeVertexFormat(mapping.format).byteLength;
      }
      // non-interleaved mapping (just set offset and stride)
    } else {
      const attributeLayout = findAttributeLayout(shaderLayout, mapping.name, usedAttributes);
      byteStride = decodeVertexFormat(mapping.format).byteLength;

      stepMode = attributeLayout.stepMode || 'vertex';
      vertexAttributes.push({
        format: getWebGPUVertexFormat(mapping.format),
        // We only support 0 offset for non-interleaved buffer layouts
        offset: 0,
        shaderLocation: attributeLayout.location
      });
    }

    // Store all the attribute bindings for one buffer
    vertexBufferLayouts.push({
      arrayStride: mapping.byteStride || byteStride,
      stepMode: stepMode || 'vertex',
      attributes: vertexAttributes
    });
  }

  // Add any non-mapped attributes - TODO - avoid hardcoded types
  for (const attribute of shaderLayout.attributes) {
    if (!usedAttributes.has(attribute.name)) {
      vertexBufferLayouts.push({
        arrayStride: decodeVertexFormat('float32x3').byteLength,
        stepMode: attribute.stepMode || 'vertex',
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
      for (const interleaved of mapping.attributes) {
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
): AttributeDeclaration {
  const attribute = shaderLayout.attributes.find(attribute => attribute.name === name);
  if (!attribute) {
    throw new Error(`Unknown attribute ${name}`);
  }
  if (attributeNames.has(name)) {
    throw new Error(`Duplicate attribute ${name}`);
  }
  attributeNames.add(name);
  return attribute;
}
