import {Device} from '@luma.gl/api';
import {assertWebGL2Context, withParameters} from '@luma.gl/gltools';
import {assert} from '../utils/assert';
import Framebuffer from './framebuffer';

// Should collapse during minification
const GL_DEPTH_BUFFER_BIT = 0x00000100;
const GL_STENCIL_BUFFER_BIT = 0x00000400;
const GL_COLOR_BUFFER_BIT = 0x00004000;

const GL_COLOR = 0x1800;
const GL_DEPTH = 0x1801;
const GL_STENCIL = 0x1802;
const GL_DEPTH_STENCIL = 0x84f9;

// Should disappear if asserts are removed
const ERR_ARGUMENTS = 'clear: bad arguments';

/** Optionally clears depth, color and stencil buffers */
export function clear(
  device: Device | WebGLRenderingContext,
  options?: {framebuffer?: Framebuffer; color?: any; depth?: any; stencil?: any}
): void {
  // @ts-expect-error Extract context
  const gl = device.gl || device;
  const {framebuffer = null, color = null, depth = null, stencil = null} = options || {};
  const parameters: any = {};

  if (framebuffer) {
    parameters.framebuffer = framebuffer;
  }

  let clearFlags = 0;

  if (color) {
    clearFlags |= GL_COLOR_BUFFER_BIT;
    if (color !== true) {
      parameters.clearColor = color;
    }
  }

  if (depth) {
    clearFlags |= GL_DEPTH_BUFFER_BIT;
    if (depth !== true) {
      parameters.clearDepth = depth;
    }
  }

  if (stencil) {
    clearFlags |= GL_STENCIL_BUFFER_BIT;
    if (depth !== true) {
      parameters.clearStencil = depth;
    }
  }

  assert(clearFlags !== 0, ERR_ARGUMENTS);

  // Temporarily set any clear "colors" and call clear
  withParameters(gl, parameters, () => {
    gl.clear(clearFlags);
  });
}

/** WebGL2 - clear a specific drawing buffer */
export function clearBuffer(
  device: Device | WebGLRenderingContext,
  options?: {framebuffer?: Framebuffer; buffer?: any; drawBuffer?: any; value?: any}
) {
  // @ts-expect-error Extract context
  const gl = device.gl || device;
  assertWebGL2Context(gl);

  const {framebuffer = null, buffer = GL_COLOR, drawBuffer = 0, value = [0, 0, 0, 0]} = options || {};
  withParameters(gl, {framebuffer}, () => {
    // Method selection per OpenGL ES 3 docs
    switch (buffer) {
      case GL_COLOR:
        switch (value.constructor) {
          case Int32Array:
            gl.clearBufferiv(buffer, drawBuffer, value);
            break;
          case Uint32Array:
            gl.clearBufferuiv(buffer, drawBuffer, value);
            break;
          case Float32Array:
          default:
            gl.clearBufferfv(buffer, drawBuffer, value);
        }
        break;

      case GL_DEPTH:
        gl.clearBufferfv(GL_DEPTH, 0, [value]);
        break;

      case GL_STENCIL:
        gl.clearBufferiv(GL_STENCIL, 0, [value]);
        break;

      case GL_DEPTH_STENCIL:
        const [depth, stencil] = value;
        gl.clearBufferfi(GL_DEPTH_STENCIL, 0, depth, stencil);
        break;

      default:
        assert(false, ERR_ARGUMENTS);
    }
  });
}
