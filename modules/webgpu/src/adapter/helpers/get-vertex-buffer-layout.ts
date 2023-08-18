import type {ShaderLayout, BufferMapping, AttributeLayout} from '@luma.gl/core';
import {decodeVertexFormat} from '@luma.gl/core';

/**
 * Build a WebGPU vertex buffer layout intended for use in a GPURenderPassDescriptor.
 * Converts luma.gl attribute definitions to a WebGPU GPUVertexBufferLayout[] array
 * @param layout
 * @param bufferMap The buffer map is optional
 * @returns WebGPU layout intended for a GPURenderPassDescriptor.
 */
export function getVertexBufferLayout(layout: ShaderLayout, bufferMap: BufferMapping[]): GPUVertexBufferLayout[] {
  const vertexBufferLayouts: GPUVertexBufferLayout[] = [];
  const usedAttributes = new Set<string>();

  // First handle any buffers mentioned in `bufferMapping`
  for (const mapping of bufferMap) {
    // Build vertex attributes for one buffer
    const vertexAttributes: GPUVertexAttribute[] = [];

    // TODO verify that all stepModes for one buffer are the same
    let stepMode: 'vertex' | 'instance' = 'vertex';
    let byteStride = 0;
    const byteOffset = mapping.byteOffset || 0;

    // interleaved mapping {..., attributes: [{...}, ...]}
    if ('attributes' in mapping) {
      // const arrayStride = mapping.byteStride; TODO 
      for (const interleaved of mapping.attributes) {
        const attributeLayout = findAttributeLayout(layout, interleaved.name, usedAttributes);

        stepMode = attributeLayout.stepMode || 'vertex';
        vertexAttributes.push({
          format: attributeLayout.format,
          offset: byteOffset + byteStride,
          shaderLocation: attributeLayout.location
        });

        byteStride += decodeVertexFormat(attributeLayout.format).byteLength;
      }
      // non-interleaved mapping (just set offset and stride)
    } else {
      const attributeLayout = findAttributeLayout(layout, mapping.name, usedAttributes);
      byteStride = decodeVertexFormat(attributeLayout.format).byteLength;

      stepMode = attributeLayout.stepMode || 'vertex';
      vertexAttributes.push({
        format: attributeLayout.format,
        offset: byteOffset,
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

  // Add any non-mapped attributes
  for (const attribute of layout.attributes) {
    if (!usedAttributes.has(attribute.name)) {
      vertexBufferLayouts.push({
        arrayStride: decodeVertexFormat(attribute.format).byteLength,
        stepMode: attribute.stepMode || 'vertex',
        attributes: [{
          format: attribute.format,
          offset: 0,
          shaderLocation: attribute.location
        }]
      });
    }
  }

  return vertexBufferLayouts;
}

export function getBufferSlots(layout: ShaderLayout, bufferMap: BufferMapping[]): Record<string, number> {
  const usedAttributes = new Set<string>();
  let bufferSlot = 0;
  const bufferSlots: Record<string, number> = {};

  // First handle any buffers mentioned in `bufferMapping`
  for (const mapping of bufferMap) {
    // interleaved mapping {..., attributes: [{...}, ...]}
    if ('attributes' in mapping) {
      for (const interleaved of mapping.attributes) {
        usedAttributes.add(interleaved.name);
      }
      // non-interleaved mapping (just set offset and stride)
    } else {
      usedAttributes.add(mapping.name);
    }
    bufferSlots[mapping.name] = bufferSlot++;
  }

  // Add any non-mapped attributes
  for (const attribute of layout.attributes) {
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
function findAttributeLayout(layout: ShaderLayout, name: string, attributeNames: Set<string>): AttributeLayout {
  const attribute = layout.attributes.find(attribute => attribute.name === name);
  if (!attribute) {
    throw new Error(`Unknown attribute ${name}`);
  }
  if (attributeNames.has(name)) {
    throw new Error(`Duplicate attribute ${name}`);
  }
  attributeNames.add(name);
  return attribute;
}
