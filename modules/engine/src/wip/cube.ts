import type {GeometryTable} from '../geometry/geometry-table';
// import {unpackIndexedGeometry} from '../geometry/geometry-utils';

export type CubeGeometryProps = {
  id?: string;
  indices?: boolean;
  attributes?;
};

export function makeCubeGeometry(props?: CubeGeometryProps): GeometryTable {
  const primitive: GeometryTable = {
    topology: 'triangle-list',
    length: 36,
    indices: CUBE_INDICES,
    attributes: {
      POSITION: CUBE_POSITIONS,
      NORMAL: CUBE_NORMALS,
      TEXCOORD_0: CUBE_TEX_COORDS
    }
  };
  // return props?.indices ? primitive : unpackIndexedGeometry(primitive);
   
  if (props?.indices) {
    return primitive;
  }
   return {
    topology: 'triangle-list',
    length: 1,
    // @ts-expect-error
    attributes: {
      POSITION: CUBE_NON_INDEXED_POSITIONS,
      // NORMAL: CUBE_NON_INDEXED_NORMALS,
      TEXCOORD_0: CUBE_NON_INDEXED_TEX_COORDS,
      COLOR_0: CUBE_NON_INDEXED_COLORS
    }
  };
}

// prettier-ignore
const CUBE_INDICES = Object.freeze(new Uint16Array([
  0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7, 8, 9, 10, 8, 10, 11, 12, 13,
  14, 12, 14, 15, 16, 17, 18, 16, 18, 19, 20, 21, 22, 20, 22, 23
]));

// prettier-ignore
const CUBE_POSITIONS = Object.freeze(new Float32Array([
  -1,  -1,  1, 1,  -1,  1,  1,  1,  1,  -1,  1,  1,
  -1,  -1,  -1,  -1,  1,  -1,  1,  1,  -1,  1,  -1,  -1,
  -1,  1,  -1,  -1,  1,  1,  1,  1,  1,  1,  1,  -1,
  -1,  -1,  -1,  1,  -1,  -1,  1,  -1,  1,  -1,  -1,  1,
  1,  -1,  -1,  1,  1,  -1,  1,  1,  1,  1,  -1,  1,
  -1,  -1,  -1,  -1,  -1,  1,  -1,  1,  1,  -1,  1,  -1
]));

// TODO - could be Uint8
// prettier-ignore
const CUBE_NORMALS = Object.freeze(new Float32Array([
  // Front face
  0,  0,  1,  0,  0,  1,  0,  0,  1,  0,  0,  1,
  // Back face
  0,  0,  -1,  0,  0,  -1,  0,  0,  -1,  0,  0,  -1,
  // Top face
  0,  1,  0,  0,  1,  0,  0,  1,  0,  0,  1,  0,
  // Bottom face
  0,  -1,  0,  0,  -1,  0,  0,  -1,  0,  0,  -1,  0,
  // Right face
  1,  0,  0,  1,  0,  0,  1,  0,  0,  1,  0,  0,
  // Left face
  -1,  0,  0,  -1,  0,  0,  -1,  0,  0,  -1,  0,  0
]));

// prettier-ignore
const CUBE_TEX_COORDS = Object.freeze(new Float32Array([
  // Front face
  0,  0,  1,  0,  1,  1,  0,  1,
  // Back face
  1,  0,  1,  1,  0,  1,  0,  0,
  // Top face
  0,  1,  0,  0,  1,  0,  1,  1,
  // Bottom face
  1,  1,  0,  1,  0,  0,  1,  0,
  // Right face
  1,  0,  1,  1,  0,  1,  0,  0,
  // Left face
  0,  0,  1,  0,  1,  1,  0,  1
]));

// float4 position
// prettier-ignore
export const CUBE_NON_INDEXED_POSITIONS = Object.freeze(new Float32Array([
  1, -1, 1, 1,
  -1, -1, 1, 1,
  -1, -1, -1, 1,
  1, -1, -1, 1,
  1, -1, 1, 1,
  -1, -1, -1, 1,

  1, 1, 1, 1,
  1, -1, 1, 1,
  1, -1, -1, 1,
  1, 1, -1, 1,
  1, 1, 1, 1,
  1, -1, -1, 1,

  -1, 1, 1, 1,
  1, 1, 1, 1,
  1, 1, -1, 1,
  -1, 1, -1, 1,
  -1, 1, 1, 1,
  1, 1, -1, 1,

  -1, -1, 1, 1,
  -1, 1, 1, 1,
  -1, 1, -1, 1,
  -1, -1, -1, 1,
  -1, -1, 1, 1,
  -1, 1, -1, 1,

  1, 1, 1, 1,
  -1, 1, 1, 1,
  -1, -1, 1, 1,
  -1, -1, 1, 1,
  1, -1, 1, 1,
  1, 1, 1, 1,

  1, -1, -1, 1,
  -1, -1, -1, 1,
  -1, 1, -1, 1,
  1, 1, -1, 1,
  1, -1, -1, 1,
  -1, 1, -1, 1,
]));

// float2 uv,
// prettier-ignore
export const CUBE_NON_INDEXED_TEX_COORDS = Object.freeze(new Float32Array([
  1, 1,
  0, 1,
  0, 0,
  1, 0,
  1, 1,
  0, 0,

  1, 1,
  0, 1,
  0, 0,
  1, 0,
  1, 1,
  0, 0,

  1, 1,
  0, 1,
  0, 0,
  1, 0,
  1, 1,
  0, 0,

  1, 1,
  0, 1,
  0, 0,
  1, 0,
  1, 1,
  0, 0,

  1, 1,
  0, 1,
  0, 0,
  0, 0,
  1, 0,
  1, 1,

  1, 1,
  0, 1,
  0, 0,
  1, 0,
  1, 1,
  0, 0,
]));

// float4 color
// prettier-ignore
export const CUBE_NON_INDEXED_COLORS = Object.freeze(new Float32Array([
  1, 0, 1, 1,
  0, 0, 1, 1,
  0, 0, 0, 1,
  1, 0, 0, 1,
  1, 0, 1, 1,
  0, 0, 0, 1,

  1, 1, 1, 1,
  1, 0, 1, 1,
  1, 0, 0, 1,
  1, 1, 0, 1,
  1, 1, 1, 1,
  1, 0, 0, 1,

  0, 1, 1, 1,
  1, 1, 1, 1,
  1, 1, 0, 1,
  0, 1, 0, 1,
  0, 1, 1, 1,
  1, 1, 0, 1,

  0, 0, 1, 1,
  0, 1, 1, 1,
  0, 1, 0, 1,
  0, 0, 0, 1,
  0, 0, 1, 1,
  0, 1, 0, 1,

  1, 1, 1, 1,
  0, 1, 1, 1,
  0, 0, 1, 1,
  0, 0, 1, 1,
  1, 0, 1, 1,
  1, 1, 1, 1,

  1, 0, 0, 1,
  0, 0, 0, 1,
  0, 1, 0, 1,
  1, 1, 0, 1,
  1, 0, 0, 1,
  0, 1, 0, 1,
]));
