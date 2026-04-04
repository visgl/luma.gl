// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  BufferLayout,
  LogicalAttributeMapping,
  ShaderLayout,
  VertexFormat
} from '@luma.gl/core';
import {
  getLogicalBufferSlots,
  getMinimumAttributeLocation,
  resolveLogicalAttributeMappings,
  vertexFormatDecoder
} from '@luma.gl/core';

/** Describes one physical WebGPU vertex-buffer slot derived from a logical buffer layout. */
export type ResolvedVertexBufferSlot = {
  /** Name of the logical buffer in the original `BufferLayout[]`. */
  bufferName: string;
  /** Final WebGPU vertex-buffer slot after expansion and location sorting. */
  shaderSlot: number;
  /** Byte offset passed to `setVertexBuffer()` when binding the source GPU buffer. */
  bindingOffset: number;
};

/** Throw error on any WebGL-only vertex formats. */
function getWebGPUVertexFormat(format: VertexFormat): GPUVertexFormat {
  if (format.endsWith('-webgl')) {
    throw new Error(`WebGPU does not support vertex format ${format}`);
  }
  return format as GPUVertexFormat;
}

/**
 * Builds WebGPU vertex-buffer layouts for pipeline creation.
 * @param shaderLayout Shader-side attribute declarations.
 * @param bufferLayout Buffer-to-attribute mapping declarations.
 * @returns The `GPUVertexBufferLayout[]` used when creating the render pipeline.
 */
export function getVertexBufferLayout(
  shaderLayout: ShaderLayout,
  bufferLayout: BufferLayout[]
): GPUVertexBufferLayout[] {
  return resolveVertexBufferLayouts(shaderLayout, bufferLayout).vertexBufferLayouts;
}

/**
 * Resolves logical luma.gl buffer layouts into physical WebGPU vertex-buffer slots.
 * @param shaderLayout Shader-side attribute declarations.
 * @param bufferLayout Buffer-to-attribute mapping declarations.
 * @returns Both the WebGPU pipeline layouts and the per-slot binding metadata.
 */
export function resolveVertexBufferLayouts(
  shaderLayout: ShaderLayout,
  bufferLayout: BufferLayout[]
): {
  vertexBufferLayouts: GPUVertexBufferLayout[];
  resolvedSlots: ResolvedVertexBufferSlot[];
} {
  const logicalMappings = resolveLogicalAttributeMappings(shaderLayout, bufferLayout);
  const resolvedLayouts: Array<{
    bufferName: string;
    bindingOffset: number;
    minShaderLocation: number;
    vertexBufferLayout: GPUVertexBufferLayout;
  }> = [];

  for (const [bufferName, mappings] of Object.entries(groupMappingsByBuffer(logicalMappings))) {
    const stepMode = mappings[0]?.stepMode || 'vertex';
    const attributesByBindingOffset = new Map<number, GPUVertexAttribute[]>();

    for (const mapping of mappings) {
      const resolvedByteStride = getResolvedByteStride(mapping);
      const bindingOffset =
        resolvedByteStride > 0
          ? Math.floor(mapping.byteOffset / resolvedByteStride) * resolvedByteStride
          : 0;
      const localOffset = mapping.byteOffset - bindingOffset;
      const vertexAttributes = attributesByBindingOffset.get(bindingOffset) || [];
      vertexAttributes.push({
        format: getWebGPUVertexFormat(mapping.vertexFormat),
        offset: localOffset,
        shaderLocation: mapping.location
      });
      attributesByBindingOffset.set(bindingOffset, vertexAttributes);
    }

    for (const [bindingOffset, vertexAttributes] of Array.from(
      attributesByBindingOffset.entries()
    ).sort(([bindingOffsetA], [bindingOffsetB]) => bindingOffsetA - bindingOffsetB)) {
      resolvedLayouts.push({
        bufferName,
        bindingOffset,
        minShaderLocation: getMinimumAttributeLocation(
          vertexAttributes.map(attribute => attribute.shaderLocation)
        ),
        vertexBufferLayout: {
          arrayStride: getResolvedByteStride(mappings[0]!),
          stepMode,
          attributes: vertexAttributes
        }
      });
    }
  }

  resolvedLayouts.sort((a, b) => a.minShaderLocation - b.minShaderLocation);

  return {
    vertexBufferLayouts: resolvedLayouts.map(layout => layout.vertexBufferLayout),
    resolvedSlots: resolvedLayouts.map((layout, shaderSlot) => ({
      bufferName: layout.bufferName,
      shaderSlot,
      bindingOffset: layout.bindingOffset
    }))
  };
}

/**
 * Maps logical buffer names to the buffer slots used by `VertexArray`.
 * @param shaderLayout Shader-side attribute declarations.
 * @param bufferLayout Buffer-to-attribute mapping declarations.
 * @returns A mapping from logical buffer name to vertex-array slot index.
 */
export function getBufferSlots(
  shaderLayout: ShaderLayout,
  bufferLayout: BufferLayout[]
): Record<string, number> {
  return getLogicalBufferSlots(shaderLayout, bufferLayout);
}

/**
 * Groups logical mappings by their source logical buffer name.
 * @param logicalMappings Backend-agnostic logical attribute mappings.
 * @returns Mappings grouped by logical buffer name.
 */
function groupMappingsByBuffer(
  logicalMappings: LogicalAttributeMapping[]
): Record<string, LogicalAttributeMapping[]> {
  const mappingsByBuffer: Record<string, LogicalAttributeMapping[]> = {};

  for (const mapping of logicalMappings) {
    if (!mappingsByBuffer[mapping.bufferName]) {
      mappingsByBuffer[mapping.bufferName] = [];
    }
    mappingsByBuffer[mapping.bufferName].push(mapping);
  }

  return mappingsByBuffer;
}

/**
 * Returns the effective byte stride for a logical attribute mapping.
 * @param mapping One backend-agnostic logical attribute mapping.
 * @returns The mapping stride, or the packed vertex-format size when unmapped.
 */
function getResolvedByteStride(mapping: LogicalAttributeMapping): number {
  return (
    mapping.byteStride || vertexFormatDecoder.getVertexFormatInfo(mapping.vertexFormat).byteLength
  );
}
