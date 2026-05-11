// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {PrimitiveTopology, BufferLayout} from '@luma.gl/core';
import {Device, Buffer} from '@luma.gl/core';
import type {Geometry} from '../geometry/geometry';
import {makeInterleavedGeometry} from './geometry-utils';
import {uid} from '../utils/uid';

/** Properties used to create a {@link GPUGeometry}. */
export type GPUGeometryProps = {
  /** Application-provided identifier. */
  id?: string;

  /** Determines how vertices are assembled into primitives. */
  topology: 'point-list' | 'line-list' | 'line-strip' | 'triangle-list' | 'triangle-strip';

  /** Draw vertex count. */
  vertexCount: number;

  /** Buffer layout matching the supplied GPU vertex buffers. */
  bufferLayout: BufferLayout[];

  /** Optional GPU index buffer. */
  indices?: Buffer | null;

  /** GPU vertex buffers, keyed by buffer layout name. */
  attributes: Record<string, Buffer>;
};

/**
 * GPU-backed geometry container.
 *
 * `GPUGeometry` owns already-created vertex and index buffers plus the `bufferLayout` metadata
 * needed to bind those buffers to shader attributes.
 */
export class GPUGeometry {
  /** Application-provided or generated identifier. */
  readonly id: string;

  /** Application-owned metadata. */
  userData: Record<string, unknown> = {};

  /** Determines how vertices are assembled into primitives. */
  readonly topology?: PrimitiveTopology;

  /** Buffer layout matching {@link GPUGeometry.attributes}. */
  readonly bufferLayout: BufferLayout[] = [];

  /** Resolved draw vertex count. */
  readonly vertexCount: number;

  /** Optional GPU index buffer. */
  readonly indices?: Buffer | null;

  /** GPU vertex buffers, keyed by buffer layout name. */
  readonly attributes: Record<string, Buffer>;

  /** Creates GPU-backed geometry from existing buffers. */
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

  /** Destroys the owned index and vertex buffers. */
  destroy(): void {
    this.indices?.destroy();
    for (const attribute of Object.values(this.attributes)) {
      attribute.destroy();
    }
  }

  /** Returns the draw vertex count. */
  getVertexCount(): number {
    return this.vertexCount;
  }

  /** Returns the GPU vertex buffers. */
  getAttributes(): Record<string, Buffer> {
    return this.attributes;
  }

  /** Returns the GPU index buffer, or `null` for non-indexed geometry. */
  getIndexes(): Buffer | null {
    return this.indices || null;
  }

  _calculateVertexCount(positions: Buffer): number {
    // Assume that positions is a fully packed float32x3 buffer
    const vertexCount = positions.byteLength / 12;
    return vertexCount;
  }
}

/**
 * Converts CPU geometry into GPU geometry.
 *
 * CPU `Geometry` input is interleaved before upload so the resulting `GPUGeometry` has one vertex
 * buffer plus an optional index buffer. Passing a `GPUGeometry` returns the original instance.
 */
export function makeGPUGeometry(device: Device, geometry: Geometry | GPUGeometry): GPUGeometry {
  if (geometry instanceof GPUGeometry) {
    return geometry;
  }

  const sourceGeometry = makeInterleavedGeometry(geometry);
  const indices = getIndexBufferFromGeometry(device, sourceGeometry);
  const {attributes, bufferLayout} = getAttributeBuffersFromGeometry(device, sourceGeometry);
  return new GPUGeometry({
    topology: sourceGeometry.topology || 'triangle-list',
    bufferLayout,
    vertexCount: sourceGeometry.vertexCount,
    indices,
    attributes
  });
}

/** Creates a GPU index buffer from CPU geometry index data, when present. */
export function getIndexBufferFromGeometry(device: Device, geometry: Geometry): Buffer | undefined {
  if (!geometry.indices) {
    return undefined;
  }
  const data = geometry.indices.value;
  return device.createBuffer({usage: Buffer.INDEX, data});
}

/**
 * Uploads one GPU vertex buffer for each CPU geometry attribute key and preserves its buffer
 * layout metadata.
 */
export function getAttributeBuffersFromGeometry(
  device: Device,
  geometry: Geometry
): {attributes: Record<string, Buffer>; bufferLayout: BufferLayout[]; vertexCount: number} {
  const attributes: Record<string, Buffer> = {};
  for (const [attributeName, attribute] of Object.entries(geometry.attributes)) {
    if (attribute) {
      attributes[attributeName] = device.createBuffer({
        data: attribute.value,
        id: `${attributeName}-buffer`
      });
    }
  }

  return {
    attributes,
    bufferLayout: geometry.bufferLayout,
    vertexCount: geometry.vertexCount
  };
}
