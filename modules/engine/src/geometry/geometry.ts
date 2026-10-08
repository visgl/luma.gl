// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Geometry as MathGeometry, type GeometryProps as MathGeometryProps} from '@math.gl/geometry';
import type {BufferLayout} from '@luma.gl/core';
import {vertexFormatDecoder} from '@luma.gl/core';
import type {GeometryAttribute} from '@math.gl/geometry';

export type {
  GeometryAttribute,
  GeometryAttributeInput,
  GeometryAttributes
} from '@math.gl/geometry';

/** Legacy engine geometry properties, including caller-owned shader layout metadata. */
export type GeometryProps = MathGeometryProps & {bufferLayout?: BufferLayout[]};

/** Compatibility adapter for math.gl CPU geometry with engine shader layout metadata. */
export class Geometry extends MathGeometry {
  readonly bufferLayout: BufferLayout[];

  constructor(props: GeometryProps) {
    const attributes: MathGeometryProps['attributes'] = {};
    const sourceNames = new Map<string, string>();
    for (const [name, attribute] of Object.entries(props.attributes)) {
      const shaderName = getGeometryShaderAttributeName(name);
      const previousName = sourceNames.get(shaderName);
      if (previousName) delete attributes[previousName];
      sourceNames.set(shaderName, name);
      attributes[name] = attribute;
    }
    const sourceIndices = props.indices;
    const indices =
      sourceIndices instanceof Uint8Array
        ? new Uint16Array(sourceIndices)
        : sourceIndices &&
            !ArrayBuffer.isView(sourceIndices) &&
            sourceIndices.value instanceof Uint8Array
          ? {...sourceIndices, value: new Uint16Array(sourceIndices.value)}
          : sourceIndices;
    super({...props, attributes, indices});
    // Preserve legacy descriptor identity while math.gl owns normalization and validation.
    for (const [name, input] of Object.entries(attributes)) {
      if (!ArrayBuffer.isView(input) && Object.isExtensible(input) && name !== 'indices') {
        Object.assign(input, this.attributes[name]);
        this.attributes[name] = input;
      }
    }
    this.bufferLayout =
      props.bufferLayout || getBufferLayoutFromGeometryAttributes(this.attributes);
  }
}

/**
 * Converts supported geometry semantic names to default shader attribute names.
 *
 * Use this only at render-layout boundaries. CPU `Geometry.attributes` preserves source names.
 * Names that do not have a built-in mapping are returned unchanged.
 */
export function getGeometryShaderAttributeName(attributeName: string): string {
  switch (attributeName) {
    case 'POSITION':
      return 'positions';
    case 'NORMAL':
      return 'normals';
    case 'TEXCOORD_0':
      return 'texCoords';
    case 'TEXCOORD_1':
      return 'texCoords1';
    case 'COLOR_0':
      return 'colors';
    default:
      return attributeName;
  }
}

export function getBufferLayoutFromGeometryAttributes(
  attributes: Record<string, GeometryAttribute | undefined>
): BufferLayout[] {
  const bufferLayout: BufferLayout[] = [];
  for (const [attributeName, attribute] of Object.entries(attributes)) {
    if (!attribute) {
      continue; // eslint-disable-line no-continue
    }
    const {value, size, normalized} = attribute;
    if (size === undefined) {
      throw new Error(`Attribute ${attributeName} is missing a size`);
    }
    bufferLayout.push({
      name: getGeometryShaderAttributeName(attributeName),
      format: vertexFormatDecoder.getVertexFormatFromAttribute(value, size, normalized)
    });
  }
  return bufferLayout;
}
