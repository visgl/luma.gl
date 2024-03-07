// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Geometry} from '../geometry/geometry';
import {uid} from '../utils/uid';
// import type {GeometryType} from '../geometry/geometry-type';

export type CubeGeometryProps = {
  id?: string;
  indices?: boolean;
  attributes?: any;
};

export class CubeGeometry extends Geometry {
  constructor(props: CubeGeometryProps = {}) {
    const {id = uid('cube-geometry'), indices = true} = props;
    super(
      indices
        ? {
            ...props,
            id,
            topology: 'triangle-list',
            indices: {size: 1, value: CUBE_INDICES},
            attributes: {...ATTRIBUTES, ...props.attributes}
          }
        : {
            ...props,
            id,
            topology: 'triangle-list',
            indices: undefined,
            attributes: {...NON_INDEXED_ATTRIBUTES, ...props.attributes}
          }
    );
  }
}

// prettier-ignore
const CUBE_INDICES = new Uint16Array([
  0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7, 8, 9, 10, 8, 10, 11, 12, 13,
  14, 12, 14, 15, 16, 17, 18, 16, 18, 19, 20, 21, 22, 20, 22, 23
]);

// prettier-ignore
const CUBE_POSITIONS = new Float32Array([
  -1,  -1,  1, 1,  -1,  1,  1,  1,  1,  -1,  1,  1,
  -1,  -1,  -1,  -1,  1,  -1,  1,  1,  -1,  1,  -1,  -1,
  -1,  1,  -1,  -1,  1,  1,  1,  1,  1,  1,  1,  -1,
  -1,  -1,  -1,  1,  -1,  -1,  1,  -1,  1,  -1,  -1,  1,
  1,  -1,  -1,  1,  1,  -1,  1,  1,  1,  1,  -1,  1,
  -1,  -1,  -1,  -1,  -1,  1,  -1,  1,  1,  -1,  1,  -1
]);

// TODO - could be Uint8
// prettier-ignore
const CUBE_NORMALS = new Float32Array([
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
]);

// prettier-ignore
const CUBE_TEX_COORDS = new Float32Array([
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
]);

// float4 position
// prettier-ignore
export const CUBE_NON_INDEXED_POSITIONS = new Float32Array([
  1, -1, 1,
  -1, -1, 1,
  -1, -1, -1,
  1, -1, -1,
  1, -1, 1,
  -1, -1, -1,

  1, 1, 1,
  1, -1, 1,
  1, -1, -1,
  1, 1, -1,
  1, 1, 1,
  1, -1, -1,

  -1, 1, 1,
  1, 1, 1,
  1, 1, -1,
  -1, 1, -1,
  -1, 1, 1,
  1, 1, -1,

  -1, -1, 1,
  -1, 1, 1,
  -1, 1, -1,
  -1, -1, -1,
  -1, -1, 1,
  -1, 1, -1,

  1, 1, 1,
  -1, 1, 1,
  -1, -1, 1,
  -1, -1, 1,
  1, -1, 1,
  1, 1, 1,

  1, -1, -1,
  -1, -1, -1,
  -1, 1, -1,
  1, 1, -1,
  1, -1, -1,
  -1, 1, -1,
]);

// float2 uv,
// prettier-ignore
export const CUBE_NON_INDEXED_TEX_COORDS = new Float32Array([
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
]);

// float4 color
// prettier-ignore
export const CUBE_NON_INDEXED_COLORS = new Float32Array([
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
]);

const ATTRIBUTES = {
  POSITION: {size: 3, value: CUBE_POSITIONS},
  NORMAL: {size: 3, value: CUBE_NORMALS},
  TEXCOORD_0: {size: 2, value: CUBE_TEX_COORDS}
};

const NON_INDEXED_ATTRIBUTES = {
  POSITION: {size: 3, value: CUBE_NON_INDEXED_POSITIONS},
  // NORMAL: {size: 3, value: CUBE_NON_INDEXED_NORMALS},
  TEXCOORD_0: {size: 2, value: CUBE_NON_INDEXED_TEX_COORDS},
  COLOR_0: {size: 3, value: CUBE_NON_INDEXED_COLORS}
};
