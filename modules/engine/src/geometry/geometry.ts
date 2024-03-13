// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {TypedArray} from '@math.gl/core';
import type {PrimitiveTopology} from '@luma.gl/core';
import {uid} from '../utils/uid';

export type GeometryProps = {
  id?: string;
  /** Determines how vertices are read from the 'vertex' attributes */
  topology: 'point-list' | 'line-list' | 'line-strip' | 'triangle-list' | 'triangle-strip';
  /** Auto calculated from attributes if not provided */
  vertexCount?: number;
  attributes: Record<string, GeometryAttribute | TypedArray>;
  indices?: GeometryAttribute | TypedArray;
};

export type GeometryAttributes = {
  POSITION: GeometryAttribute;
  NORMAL: GeometryAttribute;
  TEXCOORD_0: GeometryAttribute;
  COLOR_0?: GeometryAttribute;
  indices?: GeometryAttribute & {size: 1; value: Uint32Array | Uint16Array};
};

export type GeometryAttribute = {
  size?: number;
  value: TypedArray;
  [key: string]: any;
};

export class Geometry {
  readonly id: string;
  /** Determines how vertices are read from the 'vertex' attributes */
  readonly topology?: PrimitiveTopology;
  readonly vertexCount: number;
  readonly indices?: GeometryAttribute;
  readonly attributes: {
    POSITION: GeometryAttribute;
    NORMAL: GeometryAttribute;
    TEXCOORD_0: GeometryAttribute;
    COLOR_0?: GeometryAttribute;
    [key: string]: GeometryAttribute | undefined;
  };

  userData: Record<string, unknown> = {};

  constructor(props: GeometryProps) {
    const {attributes = {}, indices = null, vertexCount = null} = props;

    this.id = props.id || uid('geometry');
    this.topology = props.topology;

    if (indices) {
      this.indices = ArrayBuffer.isView(indices) ? {value: indices, size: 1} : indices;
    }

    // @ts-expect-error
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
        this.attributes[attributeName] = attribute;
      }
    }

    if (this.indices && this.indices.isIndexed !== undefined) {
      this.indices = Object.assign({}, this.indices);
      delete this.indices.isIndexed;
    }

    this.vertexCount = vertexCount || this._calculateVertexCount(this.attributes, this.indices);
  }

  getVertexCount(): number {
    return this.vertexCount;
  }

  /**
   * Return an object with all attributes plus indices added as a field.
   * TODO Geometry types are a mess
   */
  getAttributes(): GeometryAttributes {
    return this.indices ? {indices: this.indices, ...this.attributes} : this.attributes;
  }

  // PRIVATE

  _print(attributeName: string): string {
    return `Geometry ${this.id} attribute ${attributeName}`;
  }

  /**
   * GeometryAttribute
   * value: typed array
   * type: indices, vertices, uvs
   * size: elements per vertex
   * target: WebGL buffer type (string or constant)
   *
   * @param attributes
   * @param indices
   * @returns
   */
  _setAttributes(attributes: Record<string, GeometryAttribute>, indices: any): this {
    return this;
  }

  _calculateVertexCount(attributes: GeometryAttributes, indices?: GeometryAttribute): number {
    if (indices) {
      return indices.value.length;
    }
    let vertexCount = Infinity;
    for (const attribute of Object.values(attributes)) {
      const {value, size, constant} = attribute;
      if (!constant && value && size !== undefined && size >= 1) {
        vertexCount = Math.min(vertexCount, value.length / size);
      }
    }

    // assert(Number.isFinite(vertexCount));
    return vertexCount;
  }
}
