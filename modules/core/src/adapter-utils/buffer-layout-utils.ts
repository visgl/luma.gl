// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {log} from '../utils/log';
import type {BufferLayout} from '../adapter/types/buffer-layout';
import type {ShaderLayout} from '../adapter/types/shader-layout';
import type {VertexFormat} from '../shadertypes/vertex-types/vertex-formats';
import {shaderTypeDecoder} from '../shadertypes/shader-types/shader-type-decoder';
import {vertexFormatDecoder} from '../shadertypes/vertex-types/vertex-format-decoder';

/** Backend-agnostic attribute mapping derived from a shader layout and buffer layout. */
export type LogicalAttributeMapping = {
  /** Attribute name from the shader layout. */
  attributeName: string;
  /** Logical buffer name supplying this attribute. */
  bufferName: string;
  /** Attribute location in the shader. */
  location: number;
  /** Vertex format used to read the attribute data. */
  vertexFormat: VertexFormat;
  /** Byte offset of the attribute inside the logical buffer. */
  byteOffset: number;
  /** Byte stride of the logical buffer. */
  byteStride: number;
  /** Step mode used when advancing the attribute. */
  stepMode: 'vertex' | 'instance';
};

type ResolveLogicalAttributeMappingsOptions = {
  /** Emit warnings when a shader attribute has no explicit buffer layout entry. */
  warnOnMissingBufferLayout?: boolean;
};

/**
 * Returns the attribute names referenced by a logical buffer layout.
 * @param bufferLayout One logical buffer layout.
 * @returns The shader attribute names supplied by the layout.
 */
export function getBufferLayoutAttributeNames(bufferLayout: BufferLayout): string[] {
  return bufferLayout.attributes
    ? bufferLayout.attributes.map(layout => layout.attribute)
    : [bufferLayout.name];
}

/**
 * Builds a lookup table from shader attribute name to source location.
 * @param shaderLayout Shader-side attribute declarations.
 * @returns Attribute locations keyed by attribute name.
 */
export function getShaderAttributeLocationMap(
  shaderLayout: ShaderLayout
): Record<string, number | undefined> {
  return Object.fromEntries(
    shaderLayout.attributes.map(attribute => [attribute.name, attribute.location])
  );
}

/**
 * Returns the lowest defined attribute location from a set of candidate locations.
 * @param locations Candidate attribute locations.
 * @returns The minimum defined location, or `Infinity` when none are defined.
 */
export function getMinimumAttributeLocation(locations: Iterable<number | undefined>): number {
  let minLocation = Infinity;

  for (const location of locations) {
    if (location !== undefined) {
      minLocation = Math.min(minLocation, location);
    }
  }

  return minLocation;
}

/**
 * Maps logical buffer names to the vertex-array slots implied by a buffer layout.
 * @param shaderLayout Shader-side attribute declarations.
 * @param bufferLayout Buffer-to-attribute mapping declarations.
 * @returns Vertex-array slot indexes keyed by logical buffer name.
 */
export function getLogicalBufferSlots(
  shaderLayout: ShaderLayout,
  bufferLayout: BufferLayout[]
): Record<string, number> {
  const usedAttributes = new Set<string>();
  const bufferSlots: Record<string, number> = {};
  let bufferSlot = 0;

  for (const mapping of bufferLayout) {
    for (const attributeName of getBufferLayoutAttributeNames(mapping)) {
      usedAttributes.add(attributeName);
    }
    bufferSlots[mapping.name] = bufferSlot++;
  }

  for (const attribute of shaderLayout.attributes) {
    if (!usedAttributes.has(attribute.name)) {
      bufferSlots[attribute.name] = bufferSlot++;
    }
  }

  return bufferSlots;
}

/**
 * Resolves backend-agnostic logical attribute mappings from a shader layout and buffer layout.
 * @param shaderLayout Shader-side attribute declarations.
 * @param bufferLayout Buffer-to-attribute mapping declarations.
 * @param options Optional warning controls.
 * @returns One logical mapping per shader attribute, ordered by shader location.
 */
export function resolveLogicalAttributeMappings(
  shaderLayout: ShaderLayout,
  bufferLayout: BufferLayout[],
  options?: ResolveLogicalAttributeMappingsOptions
): LogicalAttributeMapping[] {
  validateBufferLayouts(bufferLayout);

  const bufferMappingsByAttribute = new Map<
    string,
    {
      bufferName: string;
      stepMode?: 'vertex' | 'instance';
      vertexFormat: VertexFormat;
      byteOffset: number;
      byteStride: number;
    }
  >();

  for (const layout of bufferLayout) {
    const byteStride = getBufferLayoutByteStride(layout);

    if (layout.attributes) {
      for (const attributeMapping of layout.attributes) {
        if (!bufferMappingsByAttribute.has(attributeMapping.attribute)) {
          bufferMappingsByAttribute.set(attributeMapping.attribute, {
            bufferName: layout.name,
            stepMode: layout.stepMode,
            vertexFormat: attributeMapping.format,
            byteOffset: attributeMapping.byteOffset,
            byteStride
          });
        }
      }
    } else if (layout.format && !bufferMappingsByAttribute.has(layout.name)) {
      bufferMappingsByAttribute.set(layout.name, {
        bufferName: layout.name,
        stepMode: layout.stepMode,
        vertexFormat: layout.format,
        byteOffset: 0,
        byteStride: layout.byteStride || 0
      });
    }
  }

  return shaderLayout.attributes
    .map(attribute => {
      const bufferMapping = bufferMappingsByAttribute.get(attribute.name);
      if (!bufferMapping && options?.warnOnMissingBufferLayout) {
        log.warn(`layout for attribute "${attribute.name}" not present in buffer layout`)();
      }

      const attributeTypeInfo = shaderTypeDecoder.getAttributeShaderTypeInfo(attribute.type);
      const vertexFormat =
        bufferMapping?.vertexFormat ||
        vertexFormatDecoder.getCompatibleVertexFormat(attributeTypeInfo);

      return {
        attributeName: attribute.name,
        bufferName: bufferMapping?.bufferName || attribute.name,
        location: attribute.location,
        vertexFormat,
        byteOffset: bufferMapping?.byteOffset || 0,
        byteStride: bufferMapping?.byteStride || 0,
        stepMode:
          bufferMapping?.stepMode ||
          attribute.stepMode ||
          (attribute.name.startsWith('instance') ? 'instance' : 'vertex')
      };
    })
    .sort((mappingA, mappingB) => mappingA.location - mappingB.location);
}

/**
 * Returns the minimum attribute location referenced by a logical buffer layout.
 * @param bufferLayout One logical buffer layout.
 * @param shaderLayout Shader-side attribute declarations.
 * @returns The lowest shader location referenced by the layout.
 */
export function getBufferLayoutMinAttributeLocation(
  bufferLayout: BufferLayout,
  shaderLayout: ShaderLayout
): number {
  const shaderLocationMap = getShaderAttributeLocationMap(shaderLayout);
  return getMinimumAttributeLocation(
    getBufferLayoutAttributeNames(bufferLayout).map(
      attributeName => shaderLocationMap[attributeName]
    )
  );
}

/**
 * Validates that each logical buffer layout declares either shorthand or interleaved attributes.
 * @param bufferLayouts Buffer-to-attribute mapping declarations.
 */
function validateBufferLayouts(bufferLayouts: BufferLayout[]): void {
  for (const bufferLayout of bufferLayouts) {
    if (
      (bufferLayout.attributes && bufferLayout.format) ||
      (!bufferLayout.attributes && !bufferLayout.format)
    ) {
      log.warn(
        `BufferLayout ${bufferLayout.name} must have either 'attributes' or 'format' field`
      )();
    }
  }
}

/**
 * Returns the effective byte stride for a logical buffer layout.
 * @param bufferLayout One logical buffer layout.
 * @returns The explicit stride, or the packed stride implied by the mapped formats.
 */
function getBufferLayoutByteStride(bufferLayout: BufferLayout): number {
  if (typeof bufferLayout.byteStride === 'number') {
    return bufferLayout.byteStride;
  }

  if (bufferLayout.attributes) {
    let packedByteStride = 0;
    for (const attributeMapping of bufferLayout.attributes) {
      packedByteStride += vertexFormatDecoder.getVertexFormatInfo(
        attributeMapping.format
      ).byteLength;
    }
    return packedByteStride;
  }

  return vertexFormatDecoder.getVertexFormatInfo(bufferLayout.format!).byteLength;
}
