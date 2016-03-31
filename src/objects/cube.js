import Geometry from '../geometry';
import Model from '../model';
import {makeTypedArray} from '../webgl/types';

/* eslint-disable no-multi-spaces, indent */
const CUBE_INDICES = [
  0, 1, 2, 0, 2, 3,
  4, 5, 6, 4, 6, 7,
  8, 9, 10, 8, 10, 11,
  12, 13, 14, 12, 14, 15,
  16, 17, 18, 16, 18, 19,
  20, 21, 22, 20, 22, 23
];

const CUBE_VERTICES = [
  -1, -1,  1,
   1, -1,  1,
   1,  1,  1,
  -1,  1,  1,

  -1, -1, -1,
  -1,  1, -1,
   1,  1, -1,
   1, -1, -1,

  -1,  1, -1,
  -1,  1,  1,
   1,  1,  1,
   1,  1, -1,

  -1, -1, -1,
   1, -1, -1,
   1, -1,  1,
  -1, -1,  1,

   1, -1, -1,
   1,  1, -1,
   1,  1,  1,
   1, -1,  1,

  -1, -1, -1,
  -1, -1,  1,
  -1,  1,  1,
  -1,  1, -1
];

const CUBE_NORMALS = [
  // Front face
  0.0,  0.0,  1.0,
  0.0,  0.0,  1.0,
  0.0,  0.0,  1.0,
  0.0,  0.0,  1.0,

  // Back face
  0.0,  0.0, -1.0,
  0.0,  0.0, -1.0,
  0.0,  0.0, -1.0,
  0.0,  0.0, -1.0,

  // Top face
  0.0,  1.0,  0.0,
  0.0,  1.0,  0.0,
  0.0,  1.0,  0.0,
  0.0,  1.0,  0.0,

  // Bottom face
  0.0, -1.0,  0.0,
  0.0, -1.0,  0.0,
  0.0, -1.0,  0.0,
  0.0, -1.0,  0.0,

  // Right face
  1.0,  0.0,  0.0,
  1.0,  0.0,  0.0,
  1.0,  0.0,  0.0,
  1.0,  0.0,  0.0,

  // Left face
  -1.0,  0.0,  0.0,
  -1.0,  0.0,  0.0,
  -1.0,  0.0,  0.0,
  -1.0,  0.0,  0.0
];

const CUBE_TEX_COORDS = [
  // Front face
  0.0, 0.0,
  1.0, 0.0,
  1.0, 1.0,
  0.0, 1.0,

  // Back face
  1.0, 0.0,
  1.0, 1.0,
  0.0, 1.0,
  0.0, 0.0,

  // Top face
  0.0, 1.0,
  0.0, 0.0,
  1.0, 0.0,
  1.0, 1.0,

  // Bottom face
  1.0, 1.0,
  0.0, 1.0,
  0.0, 0.0,
  1.0, 0.0,

  // Right face
  1.0, 0.0,
  1.0, 1.0,
  0.0, 1.0,
  0.0, 0.0,

  // Left face
  0.0, 0.0,
  1.0, 0.0,
  1.0, 1.0,
  0.0, 1.0
];
/* eslint-enable no-multi-spaces, indent */

export class CubeGeometry extends Geometry {
  constructor(opts = {}) {
    super({
      attributes: {
        indices: makeTypedArray(Uint16Array, CUBE_INDICES),
        vertices: makeTypedArray(Float32Array, CUBE_VERTICES),
        normals: makeTypedArray(Float32Array, CUBE_NORMALS),
        texCoords: makeTypedArray(Float32Array, CUBE_TEX_COORDS)
      },
      ...opts
    });
  }
}

export default class Cube extends Model {
  constructor(opts = {}) {
    super({geometry: new CubeGeometry(opts), ...opts});
  }
}
