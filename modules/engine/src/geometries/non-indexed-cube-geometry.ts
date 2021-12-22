import Geometry from '../geometry/geometry';
import {uid} from '@luma.gl/webgl';

export type _NonIndexedCubeGeometryProps = {
  id?: string;
  attributes?
};

/**
 * @todo - needs normals, colors are only used by examples
 */
export class _NonIndexedCubeGeometry extends Geometry {
  constructor(props: _NonIndexedCubeGeometryProps = {}) {
    const {id = uid('non-indexed-cube-geometry')} = props;
    super({...props, id, attributes: {...ATTRIBUTES, ...props.attributes}});
  }
}

// float4 position
// prettier-ignore
export const CUBE_POSITIONS = new Float32Array([
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
]);

// float2 uv,
// prettier-ignore
export const CUBE_TEX_COORDS = new Float32Array([
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
export const CUBE_COLORS = new Float32Array([
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
  POSITION: {size: 4, value: CUBE_POSITIONS},
  // NORMAL: {size: 3, value: CUBE_NORMALS},
  TEXCOORD_0: {size: 2, value: CUBE_TEX_COORDS},
  COLOR_0: {size: 3, value: CUBE_COLORS}
};
