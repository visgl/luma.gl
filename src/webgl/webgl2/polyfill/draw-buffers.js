// WebGL2 polyfill of drawBuffers using the 'WEBGL_draw_buffers' extension.
// Note: The tricky part is copying the extension constants onto the gl context

/* global WebGLRenderingContext, WebGL2RenderingContext */
import assert from 'assert';

export const DRAWING_BUFFERS = [
  // The fragment shader is not written to any color buffer.
  'NONE',
  // Fragment shader is written to the back color buffer.
  'BACK',
  // Fragment shader is written to the nth color attachment of the framebuffer.
  'COLOR_ATTACHMENT0',
  'COLOR_ATTACHMENT1',
  'COLOR_ATTACHMENT2',
  'COLOR_ATTACHMENT3',
  'COLOR_ATTACHMENT4',
  'COLOR_ATTACHMENT5',
  'COLOR_ATTACHMENT6',
  'COLOR_ATTACHMENT7',
  'COLOR_ATTACHMENT8',
  'COLOR_ATTACHMENT9',
  'COLOR_ATTACHMENT10',
  'COLOR_ATTACHMENT11',
  'COLOR_ATTACHMENT12',
  'COLOR_ATTACHMENT13',
  'COLOR_ATTACHMENT14',
  'COLOR_ATTACHMENT15'
];

// Map bufferName string or enum to correct enum (extension version)
function getExtConstant(ext, constant) {
  if (constant.indexOf('COLOR_ATTACHMENT') === 0) {
    constant = `${constant}_WEBGL`;
  }
  return ext[constant];
}

/**
 * @param {WebGLRenderingContext} gl - gl context
 * @param {GLenum/String[]} buffers - array of enums
 */
function drawBuffers(gl, buffers) {
  const ext = gl.getExtension('WEBGL_draw_buffers');
  assert(ext, 'WEBGL_draw_buffers');
  ext.drawBuffersWEBGL(buffers);
}

// Only add if WebGL2RenderingContext is not available
if (!WebGL2RenderingContext) {

  const prototype = WebGLRenderingContext.prototype;

  prototype.drawBuffers = prototype.drawBuffers || drawBuffers;

}

export default function initializeDrawBuffers(gl) {
  const ext = gl.getExtension('WEBGL_draw_buffers');
  assert(ext, 'WEBGL_draw_buffers');
  for (const constant in DRAWING_BUFFERS) {
    gl[constant] = gl[constant] || getExtConstant(ext, constant);
  }
}

