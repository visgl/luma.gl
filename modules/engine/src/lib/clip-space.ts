
// ClipSpace
import GL from '@luma.gl/constants';
import {Device, glsl} from '@luma.gl/api';
import {Model, ModelProps} from './model';
import Geometry from '../geometry/geometry';
import {WebGLDevice} from '@luma.gl/webgl/index';

const CLIPSPACE_VERTEX_SHADER = glsl`\
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
const POSITIONS = [-1, -1, 1, -1, -1, 1, 1, 1];

/**
 * A flat geometry that covers the "visible area" that the GPU renders.
 */
export class ClipSpace extends Model {
  constructor(device: Device | WebGLRenderingContext, opts?: ModelProps) {
    const TEX_COORDS = POSITIONS.map((coord) => (coord === -1 ? 0 : coord));

    super(
      WebGLDevice.attach(device),
      {
        ...opts,
        vs: CLIPSPACE_VERTEX_SHADER,
        vertexCount: 4,
        geometry: new Geometry({
          drawMode: GL.TRIANGLE_STRIP,
          vertexCount: 4,
          attributes: {
            aClipSpacePosition: {size: 2, value: new Float32Array(POSITIONS)},
            aTexCoord: {size: 2, value: new Float32Array(TEX_COORDS)},
            aCoordinate: {size: 2, value: new Float32Array(TEX_COORDS)}
          }
        })
      }
    );
  }
}
