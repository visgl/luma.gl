import type {PrimitiveTopology, BufferLayout} from '@luma.gl/core';
import {Device, Buffer, uid, assert} from '@luma.gl/core';
import type {Geometry} from '../geometry/geometry';

export type GPUGeometryProps = {
  id?: string;
  /** Determines how vertices are read from the 'vertex' attributes */
  topology:
    | 'point-list'
    | 'line-list'
    | 'line-strip'
    | 'line-loop-webgl'
    | 'triangle-list'
    | 'triangle-strip'
    | 'triangle-fan-webgl';
  /** Auto calculated from attributes if not provided */
  vertexCount: number;
  bufferLayout: BufferLayout[];
  indices?: Buffer | null;
  attributes: GPUGeometryAttributes;
};

export type GPUGeometryAttributes = {
  positions: Buffer;
  normals?: Buffer;
  texCoords?: Buffer;
  colors?: Buffer;
};

export class GPUGeometry {
  readonly id: string;
  userData: Record<string, unknown> = {};

  /** Determines how vertices are read from the 'vertex' attributes */
  readonly topology?: PrimitiveTopology;
  readonly bufferLayout: BufferLayout[] = [];

  readonly vertexCount: number;
  readonly indices?: Buffer | null;
  readonly attributes: {
    positions: Buffer;
    normals?: Buffer;
    texCoords?: Buffer;
    colors?: Buffer;
  };

  constructor(props: GPUGeometryProps) {
    this.id = props.id || uid('geometry');
    this.topology = props.topology;
    this.indices = props.indices || null;
    this.attributes = props.attributes;

    //
    this.vertexCount = props.vertexCount;

    // Populate default bufferLayout
    this.bufferLayout = props.bufferLayout || [];
    if (!this.bufferLayout.find(layout => layout.name === 'positions')) {
      this.bufferLayout.push({name: 'positions', format: 'float32x3'});
    }
    if (this.attributes.normals && !this.bufferLayout.find(layout => layout.name === 'normals')) {
      this.bufferLayout.push({name: 'normals', format: 'float32x3'});
    }
    if (this.attributes.texCoords && !this.bufferLayout.find(layout => layout.name === 'texCoords')) {
      this.bufferLayout.push({name: 'texCoords', format: 'float32x2'});
    }
    if (this.attributes.colors && !this.bufferLayout.find(layout => layout.name === 'colors')) {
      this.bufferLayout.push({name: 'colors', format: 'float32x3'});
    }

    if (this.indices) {
      assert(this.indices.usage === Buffer.INDEX);
    }
  }

  destroy(): void {
    this.indices.destroy();
    this.attributes.positions.destroy();
    this.attributes.normals.destroy();
    this.attributes.texCoords.destroy();
    this.attributes.colors?.destroy();
  }

  getVertexCount(): number {
    return this.vertexCount;
  }

  getAttributes(): GPUGeometryAttributes {
    return this.attributes;
  }

  getIndexes(): Buffer | null {
    return this.indices;
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
  assert(
    data instanceof Uint16Array || data instanceof Uint32Array,
    'attribute array for "indices" must be of integer type'
  );
  return device.createBuffer({usage: Buffer.INDEX, data});
}

export function getAttributeBuffersFromGeometry(
  device: Device,
  geometry: Geometry
): {attributes: GPUGeometryAttributes, bufferLayout: BufferLayout[], vertexCount: number} {
  const positions = geometry.attributes.positions || geometry.attributes.POSITION;
  const normals = geometry.attributes.normals || geometry.attributes.NORMAL;
  const texCoords = geometry.attributes.texCoords || geometry.attributes.TEXCOORD_0;

  const attributes: GPUGeometryAttributes = {
    positions: device.createBuffer({data: positions.value, id: 'positions-buffer'})
  };
  const bufferLayout: BufferLayout[] = [
    {name: 'positions', format: `float32x${positions.size as 2 | 3 | 4}`}
  ];
  if (normals) {
    attributes.normals = device.createBuffer({data: normals.value, id: 'normals-buffer'});
    bufferLayout.push({name: 'normals', format: `float32x${normals.size as 2 | 3 | 4}`});
  }
  if (texCoords) {
    attributes.texCoords = device.createBuffer({data: texCoords.value, id: 'texCoords-buffer'});
    bufferLayout.push({name: 'texCoords', format: `float32x${texCoords.size as 2 | 3 | 4}`});
  }

  const vertexCount = geometry._calculateVertexCount(geometry.attributes, geometry.indices)

  return {attributes, bufferLayout, vertexCount};
}
