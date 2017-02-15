// ClipSpaceQuad
import {Model} from '../core';
import {Geometry} from '../geometry';
import {GL} from '../webgl';

const CLIPSPACE_QUAD_VERTEX_SHADER = `\
attribute vec2 aClipSpacePosition;
attribute vec2 aTexCoord;
attribute vec2 aCoordinate;

varying vec2 position;
varying vec2 coordinate;
varying vec2 uv;

void main(void) {
  gl_Position = vec4(aClipSpacePosition, 0., 1.);
  position = aClipSpacePosition;
  coordinate = aCoordinate;
  uv = aTexCoord;
}
`;

/* eslint-disable indent, no-multi-spaces */
const POSITIONS = [
  -1, -1,
   1, -1,
  -1,  1,
   1,  1
  // -1, -1,
  //  1, -1,
  //  1,  1,
  // -1, -1,
  //  1,  1,
  // -1,  1
];

const TEX_COORDS = POSITIONS.map(coord => coord === -1 ? 0 : coord);
/* eslint-enable indent, no-multi-spaces */

export default class ClipSpaceQuad extends Model {
  constructor(opts) {

    super(Object.assign({}, opts, {
      vs: CLIPSPACE_QUAD_VERTEX_SHADER,
      geometry: new Geometry({
        drawMode: GL.TRIANGLE_STRIP,
        attributes: {
          aClipSpacePosition: {
            value: new Float32Array(POSITIONS),
            size: 2
          },
          aTexCoord: {
            value: new Float32Array(TEX_COORDS),
            size: 2
          },
          aCoordinate: {
            value: new Float32Array(TEX_COORDS),
            size: 2
          }
        }
      })
    }));
    this.setVertexCount(4);
  }
}
