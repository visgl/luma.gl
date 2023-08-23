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
  vertexCount?: number;
  bufferLayout?: BufferLayout[];
  indices?: Buffer | null;
  attributes: GPUGeometryAttributes;
};

export type GPUGeometryAttributes = {
  positions: Buffer;
  normals: Buffer;
  texCoords: Buffer;
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
    normals: Buffer;
    texCoords: Buffer;
    colors?: Buffer;
  };

  constructor(props: GPUGeometryProps) {
    this.id = props.id || uid('geometry');
    this.topology = props.topology;
    this.indices = props.indices || null;
    this.attributes = props.attributes;
    // 
    this.vertexCount = props.vertexCount || this._calculateVertexCount(this.attributes.positions);

    if (this.indices) {
      assert(this.indices.usage === Buffer.INDEX);
    }

    // Populate default bufferLayout
    this.bufferLayout = props.bufferLayout || [];
    if (!this.bufferLayout.find(layout => layout.name === 'positions')) {
      this.bufferLayout.push({name: 'positions', format: 'float32x3'});
    }
    if (!this.bufferLayout.find(layout => layout.name === 'normals')) {
      this.bufferLayout.push({name: 'normals', format: 'float32x3'});
    }
    if (!this.bufferLayout.find(layout => layout.name === 'texCoords')) {
      this.bufferLayout.push({name: 'texCoords', format: 'float32x2'});
    }
    if (!this.bufferLayout.find(layout => layout.name === 'colors')) {
      this.bufferLayout.push({name: 'colors', format: 'float32x3'});
    }
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
  const attributes = getAttributeBuffersFromGeometry(device, geometry);
  return new GPUGeometry({
    topology: geometry.topology, 
    vertexCount: geometry.vertexCount, 
    indices, 
    attributes
  });
}

export function getIndexBufferFromGeometry(device: Device, geometry: Geometry): Buffer | undefined {
  if (!geometry.indices) {
    return undefined;
  }

  // @ts-expect-error
  const data = geometry.indices.value || geometry.indices;
  assert(
    data instanceof Uint16Array || data instanceof Uint32Array,
    'attribute array for "indices" must be of integer type'
  );
  return device.createBuffer({usage: Buffer.INDEX, data});
}

export function getAttributeBuffersFromGeometry(device: Device, geometry: Geometry): GPUGeometryAttributes {
  const positions = geometry.attributes.positions || geometry.attributes.POSITION;
  const normals = geometry.attributes.normals || geometry.attributes.NORMAL;
  const texCoords = geometry.attributes.texCoords || geometry.attributes.TEXCOORD_0;

  const buffers: GPUGeometryAttributes = {
    positions: device.createBuffer({data: positions.value, id: 'positions-buffer'}),
    normals: device.createBuffer({data: normals.value, id: 'normals-buffer'}),
    texCoords: device.createBuffer({data: texCoords.value, id: 'texCoords-buffer'})
  };

  return buffers;
}

// Support for mapping new geometries with glTF attribute names to "classic" luma.gl shader names
const GLTF_TO_LUMA_ATTRIBUTE_MAP = {
  POSITION: 'positions',
  NORMAL: 'normals',
  COLOR_0: 'colors',
  TEXCOORD_0: 'texCoords',
  TEXCOORD_1: 'texCoords1',
  TEXCOORD_2: 'texCoords2'
};

export function mapAttributeName(name: string): string {
  // @ts-ignore-error
  return GLTF_TO_LUMA_ATTRIBUTE_MAP[name] || name;
}
