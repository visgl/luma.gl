// Helper definitions for validation of webgl parameters
/* eslint-disable no-inline-comments, max-len */
import {WebGLRenderingContext, WebGL2RenderingContext} from './webgl-types';
import GL, {glKey} from './webgl-constants';
import {glTypeFromArray} from './webgl-arrays';
import assert from 'assert';

const ERR_CONTEXT = 'Invalid WebGLRenderingContext';
const ERR_WEBGL2 = 'Requires WebGL2';

export function isWebGLContext(gl) {
  return gl instanceof WebGLRenderingContext ||
    (gl && gl.ARRAY_BUFFER === 0x8892);
}

export function isWebGL2Context(gl) {
  return gl instanceof WebGL2RenderingContext ||
    (gl && gl.TEXTURE_BINDING_3D === 0x806A);
}

export function assertWebGLContext(gl) {
  // Need to handle debug context
  assert(isWebGLContext(gl), ERR_CONTEXT);
}

export function assertWebGL2Context(gl) {
  // Need to handle debug context
  assert(isWebGL2Context(gl), ERR_WEBGL2);
}

// INDEX TYPES

// For drawElements, size of indices
export const GL_INDEX_TYPES = [
  GL.UNSIGNED_BYTE, GL.UNSIGNED_SHORT, GL.UNSIGNED_INT
];

export function isIndexType(type) {
  return GL_INDEX_TYPES.indexOf(type) !== -1;
}

export function assertIndexType(glType, source) {
  assert(isIndexType(glType), `Bad index type ${glKey(glType)} ${source}`);
}

// DRAW MODES

export const GL_DRAW_MODES = [
  GL.POINTS, GL.LINE_STRIP, GL.LINE_LOOP, GL.LINES,
  GL.TRIANGLE_STRIP, GL.TRIANGLE_FAN, GL.TRIANGLES
];

export function isDrawMode(glMode) {
  return GL_DRAW_MODES.indexOf(glMode) !== -1;
}

export function assertDrawMode(glType, source) {
  assert(isDrawMode(glType), `Bad draw mode ${glKey(glType)} ${source}`);
}

// TARGET TYPES

export const GL_TARGETS = [
  GL.ARRAY_BUFFER, // vertex attributes (e.g. vertex/texture coords or color)
  GL.ELEMENT_ARRAY_BUFFER, // Buffer used for element indices.
  // For WebGL 2 contexts
  GL.COPY_READ_BUFFER, // Buffer for copying from one buffer object to another
  GL.COPY_WRITE_BUFFER, // Buffer for copying from one buffer object to another
  GL.TRANSFORM_FEEDBACK_BUFFER, // Buffer for transform feedback operations
  GL.UNIFORM_BUFFER, // Buffer used for storing uniform blocks
  GL.PIXEL_PACK_BUFFER, // Buffer used for pixel transfer operations
  GL.PIXEL_UNPACK_BUFFER // Buffer used for pixel transfer operations
];

// USAGE TYPES

export const GL_BUFFER_USAGE = [
  GL.STATIC_DRAW, // Buffer used often and not change often. Contents are written to the buffer, but not read.
  GL.DYNAMIC_DRAW, // Buffer used often and change often. Contents are written to the buffer, but not read.
  GL.STREAM_DRAW, // Buffer not used often. Contents are written to the buffer, but not read.
  // For WebGL 2 contexts
  GL.STATIC_READ, // Buffer used often and not change often. Contents are read from the buffer, but not written.
  GL.DYNAMIC_READ, // Buffer used often and change often. Contents are read from the buffer, but not written.
  GL.STREAM_READ, // Contents of the buffer are likely to not be used often. Contents are read from the buffer, but not written.
  GL.STATIC_COPY, // Buffer used often and not change often. Contents are neither written or read by the user.
  GL.DYNAMIC_COPY, // Buffer used often and change often. Contents are neither written or read by the user.
  GL.STREAM_COPY // Buffer used often and not change often. Contents are neither written or read by the user.
];

export function assertArrayTypeMatch(array, type, source) {
  assert(type === glTypeFromArray(array),
    `${array.constructor.name || 'Array'} ` +
    `does not match element type ${glKey(type)} ${source}`);
}

// GL errors

// Returns an Error representing the Latest webGl error or null
export function glGetError(gl) {
  // Loop to ensure all errors are cleared
  const errorStack = [];
  let glError = gl.getError();
  while (glError !== gl.NO_ERROR) {
    errorStack.push(glGetErrorMessage(gl, glError));
    glError = gl.getError();
  }
  return errorStack.length ? new Error(errorStack.join('\n')) : null;
}

export function glCheckError(gl) {
  if (gl.debug) {
    const error = glGetError(gl);
    if (error) {
      throw error;
    }
  }
}

function glGetErrorMessage(gl, glError) {
  switch (glError) {
  case GL.CONTEXT_LOST_WEBGL:
    //  If the WebGL context is lost, this error is returned on the
    // first call to getError. Afterwards and until the context has been
    // restored, it returns gl.NO_ERROR.
    return 'WebGL context lost';
  case GL.INVALID_ENUM:
    // An unacceptable value has been specified for an enumerated argument.
    return 'WebGL invalid enumerated argument';
  case GL.INVALID_VALUE:
    // A numeric argument is out of range.
    return 'WebGL invalid value';
  case GL.INVALID_OPERATION:
    // The specified command is not allowed for the current state.
    return 'WebGL invalid operation';
  case GL.INVALID_FRAMEBUFFER_OPERATION:
    // The currently bound framebuffer is not framebuffer complete
    // when trying to render to or to read from it.
    return 'WebGL invalid framebuffer operation';
  case GL.OUT_OF_MEMORY:
    // Not enough memory is left to execute the command.
    return 'WebGL out of memory';
  default:
    return `WebGL unknown error ${glError}`;
  }
}

