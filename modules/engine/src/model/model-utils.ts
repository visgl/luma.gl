import {Device, Buffer, assert} from '@luma.gl/core';
import type {Geometry} from '../geometry/geometry';

// Support for mapping new geometries with glTF attribute names to "classic" luma.gl shader names
const GLTF_TO_LUMA_ATTRIBUTE_MAP = {
  POSITION: 'positions',
  NORMAL: 'normals',
  COLOR_0: 'colors',
  TEXCOORD_0: 'texCoords',
  TEXCOORD_1: 'texCoords1',
  TEXCOORD_2: 'texCoords2'
};

/*
export function getAttributeLayoutsFromGeometry(geometry: Geometry) {
  const layouts: Record<string, {}> = {};
  let indices = geometry.indices;

  for (const [name, attribute] of Object.entries(geometry.attributes)) {
    const remappedName = mapAttributeName(name);

    if (attribute.constant) {
      throw new Error('constant attributes not supported');
    } else {
      const typedArray = attribute.value;
      // Create accessor by copying the attribute and removing `value``
      const accessor = {...attribute};
      delete accessor.value;
      buffers[remappedName] = [device.createBuffer(typedArray), accessor];

      inferAttributeAccessor(name, accessor);
    }
  }
}

export class Table {
  length: number;
  // columns: Record<string, TypedArray> = {};
}

export class GPUTable {
  length: number;
  columns: Record<string, Buffer> = {};
}

export function convertTableToGPUTable(table: Table) {
  // for (const ) {}
}

export function renameTableColumns(table: Table, map: (name: string) => string) {
  const newColumns = table.columns.reduce()
  table.clone();
}
*/

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

export function getAttributeBuffersFromGeometry(device: Device, geometry: Geometry): Record<string, Buffer> {
  const buffers: Record<string, Buffer> = {};

  for (const [name, attribute] of Object.entries(geometry.attributes)) {
    const remappedName = mapAttributeName(name);
    if (attribute?.constant) {
      throw new Error('constant attributes not supported');
    } else {
      const typedArray = attribute?.value;
      buffers[remappedName] = device.createBuffer({data: typedArray, id: `${remappedName}-buffer`});
    }
  }

  return buffers;
}

function mapAttributeName(name: string): string {
  // @ts-ignore-error
  return GLTF_TO_LUMA_ATTRIBUTE_MAP[name] || name;
}

/*
// Check for well known attribute names
// eslint-disable-next-line complexity
export function inferAttributeAccessor(attributeName, attribute) {
  let category;
  switch (attributeName) {
    case 'texCoords':
    case 'texCoord1':
    case 'texCoord2':
    case 'texCoord3':
      category = 'uvs';
      break;
    case 'vertices':
    case 'positions':
    case 'normals':
    case 'pickingColors':
      category = 'vectors';
      break;
    default:
  }

  // Check for categorys
  switch (category) {
    case 'vectors':
      attribute.size = attribute.size || 3;
      break;
    case 'uvs':
      attribute.size = attribute.size || 2;
      break;
    default:
  }

  assert(Number.isFinite(attribute.size), `attribute ${attributeName} needs size`);
}
*/
