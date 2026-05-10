// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {TypedArray} from '@math.gl/core';
import type {BufferLayout, PrimitiveTopology} from '@luma.gl/core';
import {vertexFormatDecoder} from '@luma.gl/core';
import {uid} from '../utils/uid';

/** CPU-side attribute data accepted by {@link Geometry}. */
export type GeometryAttributeInput = GeometryAttribute | TypedArray;

/** Properties used to create a {@link Geometry}. */
export type GeometryProps = {
  /** Application-provided identifier. */
  id?: string;
  /** Determines how vertices are assembled into primitives. */
  topology: 'point-list' | 'line-list' | 'line-strip' | 'triangle-list' | 'triangle-strip';
  /** Draw vertex count. Auto-calculated from attributes or indices when omitted. */
  vertexCount?: number;
  /** CPU attributes, keyed by shader attribute name or supported glTF-style semantic name. */
  attributes: Record<string, GeometryAttributeInput>;
  /**
   * Maps geometry buffers to shader attributes.
   *
   * If omitted, the constructor creates one buffer layout entry for each normalized attribute.
   */
  bufferLayout?: BufferLayout[];
  /** Optional index data. Indices are always stored separately from vertex attributes. */
  indices?: GeometryAttribute | TypedArray;
};

/** Attributes returned by {@link Geometry.getAttributes}. */
export type GeometryAttributes = Record<string, GeometryAttribute | undefined> & {
  /** Optional index attribute, included when the geometry is indexed. */
  indices?: GeometryAttribute & {size: 1; value: Uint32Array | Uint16Array};
};

/** Typed-array backed CPU geometry attribute. */
export type GeometryAttribute = {
  /** Number of typed-array elements per vertex. */
  size?: number;
  /** Attribute data. */
  value: TypedArray;
  /** Additional attribute metadata consumed by geometry utilities. */
  [key: string]: any;
};

/**
 * CPU-side geometry container.
 *
 * `Geometry` stores typed-array vertex data, optional index data, and an always-populated
 * `bufferLayout` that describes how its attributes map to shader inputs. Attribute names are
 * normalized once in the constructor so glTF-style names such as `POSITION` and `TEXCOORD_0`
 * become shader names such as `positions` and `texCoords`.
 */
export class Geometry {
  /** Application-provided or generated identifier. */
  readonly id: string;

  /** Determines how vertices are assembled into primitives. */
  readonly topology?: PrimitiveTopology;

  /** Resolved draw vertex count. */
  readonly vertexCount: number;

  /** Optional index attribute. */
  readonly indices?: GeometryAttribute;

  /** CPU attributes, keyed by normalized buffer or shader attribute name. */
  readonly attributes: Record<string, GeometryAttribute | undefined>;

  /** Buffer layout matching the geometry attributes. Always populated. */
  readonly bufferLayout: BufferLayout[];

  /** Application-owned metadata. */
  userData: Record<string, unknown> = {};

  /** Creates a CPU geometry and normalizes attributes plus buffer layout metadata. */
  constructor(props: GeometryProps) {
    const {attributes = {}, indices = null, vertexCount = null} = props;

    this.id = props.id || uid('geometry');
    this.topology = props.topology;

    if (indices) {
      this.indices = ArrayBuffer.isView(indices) ? {value: indices, size: 1} : indices;
    }

    this.attributes = {};

    for (const [attributeName, attributeValue] of Object.entries(attributes)) {
      // Wrap "unwrapped" arrays and try to autodetect their type
      const attribute: GeometryAttribute = ArrayBuffer.isView(attributeValue)
        ? {value: attributeValue}
        : attributeValue;

      if (!ArrayBuffer.isView(attribute.value)) {
        throw new Error(
          `${this._print(attributeName)}: must be typed array or object with value as typed array`
        );
      }

      if ((attributeName === 'POSITION' || attributeName === 'positions') && !attribute.size) {
        attribute.size = 3;
      }

      // Move indices to separate field
      if (attributeName === 'indices') {
        if (this.indices) {
          throw new Error('Multiple indices detected');
        }
        this.indices = attribute;
      } else {
        const normalizedAttributeName = getGeometryShaderAttributeName(attributeName);
        this.attributes[normalizedAttributeName] = attribute;
      }
    }

    if (this.indices && this.indices['isIndexed'] !== undefined) {
      this.indices = Object.assign({}, this.indices);
      delete this.indices['isIndexed'];
    }

    this.vertexCount = vertexCount || this._calculateVertexCount(this.attributes, this.indices);
    this.bufferLayout = props.bufferLayout
      ? normalizeGeometryBufferLayout(props.bufferLayout)
      : getBufferLayoutFromGeometryAttributes(this.attributes);
  }

  /** Returns the resolved draw vertex count. */
  getVertexCount(): number {
    return this.vertexCount;
  }

  /** Returns all attributes, including `indices` when index data is present. */
  getAttributes(): GeometryAttributes {
    return (
      this.indices ? {indices: this.indices, ...this.attributes} : this.attributes
    ) as GeometryAttributes;
  }

  // PRIVATE

  _print(attributeName: string): string {
    return `Geometry ${this.id} attribute ${attributeName}`;
  }

  _setAttributes(attributes: Record<string, GeometryAttribute>, indices: any): this {
    return this;
  }

  _calculateVertexCount(
    attributes: Record<string, GeometryAttribute | undefined>,
    indices?: GeometryAttribute
  ): number {
    if (indices) {
      return indices.value.length;
    }
    let vertexCount = Infinity;
    for (const attribute of Object.values(attributes)) {
      if (!attribute) {
        continue; // eslint-disable-line no-continue
      }
      const {value, size, constant} = attribute;
      if (!constant && value && size !== undefined && size >= 1) {
        vertexCount = Math.min(vertexCount, value.length / size);
      }
    }

    // assert(Number.isFinite(vertexCount));
    return vertexCount;
  }
}

/**
 * Converts supported geometry semantic names to shader attribute names.
 *
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

function getBufferLayoutFromGeometryAttributes(
  attributes: Record<string, GeometryAttribute | undefined>
): BufferLayout[] {
  const bufferLayout: BufferLayout[] = [];
  for (const [name, attribute] of Object.entries(attributes)) {
    if (!attribute) {
      continue; // eslint-disable-line no-continue
    }
    const {value, size, normalized} = attribute;
    if (size === undefined) {
      throw new Error(`Attribute ${name} is missing a size`);
    }
    bufferLayout.push({
      name,
      format: vertexFormatDecoder.getVertexFormatFromAttribute(value, size, normalized)
    });
  }
  return bufferLayout;
}

function normalizeGeometryBufferLayout(bufferLayout: BufferLayout[]): BufferLayout[] {
  return bufferLayout.map(layout =>
    layout.attributes
      ? {
          ...layout,
          attributes: layout.attributes.map(attribute => ({
            ...attribute,
            attribute: getGeometryShaderAttributeName(attribute.attribute)
          }))
        }
      : {
          ...layout,
          name: getGeometryShaderAttributeName(layout.name)
        }
  );
}
