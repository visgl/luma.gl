import {Device, Framebuffer, assert} from '@luma.gl/api';
import {WebGLDevice, withParameters} from '@luma.gl/webgl';

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

/** 
 * Optionally clears depth, color and stencil buffers 
 * @deprecated Set clear color when creating a RenderPass
 */
export function clear(
  gl: Device | WebGLRenderingContext,
  options?: {framebuffer?: Framebuffer; color?: any; depth?: any; stencil?: any}
): void {
  const device = WebGLDevice.attach(gl);
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
  withParameters(device.gl, parameters, () => {
    device.gl.clear(clearFlags);
  });
}

/** 
 * WebGL2 - clear a specific drawing buffer 
 * @deprecated Set clear color when creating a RenderPass
 */
export function clearBuffer(
  gl: Device | WebGLRenderingContext,
  options?: {framebuffer?: Framebuffer; buffer?: any; drawBuffer?: any; value?: any}
) {
  const device = WebGLDevice.attach(gl);

  const {framebuffer = null, buffer = GL_COLOR, drawBuffer = 0, value = [0, 0, 0, 0]} = options || {};
  withParameters(device.gl2, {framebuffer}, () => {
    // Method selection per OpenGL ES 3 docs
    switch (buffer) {
      case GL_COLOR:
        switch (value.constructor) {
          case Int32Array:
            device.gl2.clearBufferiv(buffer, drawBuffer, value);
            break;
          case Uint32Array:
            device.gl2.clearBufferuiv(buffer, drawBuffer, value);
            break;
          case Float32Array:
          default:
            device.gl2.clearBufferfv(buffer, drawBuffer, value);
        }
        break;

      case GL_DEPTH:
        device.gl2.clearBufferfv(GL_DEPTH, 0, [value]);
        break;

      case GL_STENCIL:
        device.gl2.clearBufferiv(GL_STENCIL, 0, [value]);
        break;

      case GL_DEPTH_STENCIL:
        const [depth, stencil] = value;
        device.gl2.clearBufferfi(GL_DEPTH_STENCIL, 0, depth, stencil);
        break;

      default:
        assert(false, ERR_ARGUMENTS);
    }
  });
}
