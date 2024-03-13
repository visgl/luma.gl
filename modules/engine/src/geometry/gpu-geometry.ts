// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {PrimitiveTopology, BufferLayout} from '@luma.gl/core';
import {Device, Buffer, getVertexFormatFromAttribute} from '@luma.gl/core';
import type {Geometry} from '../geometry/geometry';
import {uid} from '../utils/uid';

export type GPUGeometryProps = {
  id?: string;
  /** Determines how vertices are read from the 'vertex' attributes */
  topology: 'point-list' | 'line-list' | 'line-strip' | 'triangle-list' | 'triangle-strip';
  /** Auto calculated from attributes if not provided */
  vertexCount: number;
  bufferLayout: BufferLayout[];
  indices?: Buffer | null;
  attributes: Record<string, Buffer>;
};

export class GPUGeometry {
  readonly id: string;
  userData: Record<string, unknown> = {};

  /** Determines how vertices are read from the 'vertex' attributes */
  readonly topology?: PrimitiveTopology;
  readonly bufferLayout: BufferLayout[] = [];

  readonly vertexCount: number;
  readonly indices?: Buffer | null;
  readonly attributes: Record<string, Buffer>;

  constructor(props: GPUGeometryProps) {
    this.id = props.id || uid('geometry');
    this.topology = props.topology;
    this.indices = props.indices || null;
    this.attributes = props.attributes;

    this.vertexCount = props.vertexCount;

    this.bufferLayout = props.bufferLayout || [];

    if (this.indices) {
      if (!(this.indices.usage & Buffer.INDEX)) {
        throw new Error('Index buffer must have INDEX usage');
      }
    }
  }

  destroy(): void {
    this.indices?.destroy();
    for (const attribute of Object.values(this.attributes)) {
      attribute.destroy();
    }
  }

  getVertexCount(): number {
    return this.vertexCount;
  }

  getAttributes(): Record<string, Buffer> {
    return this.attributes;
  }

  getIndexes(): Buffer | null {
    return this.indices || null;
  }

  _calculateVertexCount(positions: Buffer): number {
    // Assume that positions is a fully packed float32x3 buffer
    const vertexCount = positions.byteLength / 12;
    return vertexCount;
  }
}

export function makeGPUGeometry(device: Device, geometry: Geometry | GPUGeometry): GPUGeometry {
  if (geometry instanceof GPUGeometry) {
    return geometry;
  }

  const indices = getIndexBufferFromGeometry(device, geometry);
  const {attributes, bufferLayout} = getAttributeBuffersFromGeometry(device, geometry);
  return new GPUGeometry({
    topology: geometry.topology || 'triangle-list',
    bufferLayout,
    vertexCount: geometry.vertexCount,
    indices,
    attributes
  });
}

export function getIndexBufferFromGeometry(device: Device, geometry: Geometry): Buffer | undefined {
  if (!geometry.indices) {
    return undefined;
  }
  const data = geometry.indices.value;
  return device.createBuffer({usage: Buffer.INDEX, data});
}

export function getAttributeBuffersFromGeometry(
  device: Device,
  geometry: Geometry
): {attributes: Record<string, Buffer>; bufferLayout: BufferLayout[]; vertexCount: number} {
  const bufferLayout: BufferLayout[] = [];

  const attributes: Record<string, Buffer> = {};
  for (const [attributeName, attribute] of Object.entries(geometry.attributes)) {
    let name: string = attributeName;
    // TODO Map some GLTF attribute names (is this still needed?)
    switch (attributeName) {
      case 'POSITION':
        name = 'positions';
        break;
      case 'NORMAL':
        name = 'normals';
        break;
      case 'TEXCOORD_0':
        name = 'texCoords';
        break;
      case 'COLOR_0':
        name = 'colors';
        break;
    }
    if (attribute) {
      attributes[name] = device.createBuffer({
        data: attribute.value,
        id: `${attributeName}-buffer`
      });
      const {value, size, normalized} = attribute;
      // @ts-expect-error
      bufferLayout.push({name, format: getVertexFormatFromAttribute(value, size, normalized)});
    }
  }

  const vertexCount = geometry._calculateVertexCount(geometry.attributes, geometry.indices);

  return {attributes, bufferLayout, vertexCount};
}
