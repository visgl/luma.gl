// luma.gl, MIT license
import {isOldIE} from '../webgl-utils/is-old-ie';

// Enables feature detection in IE11 due to a bug where gl.getExtension may return true
// but fail to compile when the extension is enabled in the shader. Specifically,
// the OES_standard_derivatives extension fails to compile in IE11 even though its included
// in the list of supported extensions.
// const compiledGLSLExtensions = {};

const compiledGLSLExtensions = {};

// Enables feature detection in IE11 due to a bug where gl.getExtension may return true
// but fail to compile when the extension is enabled in the shader. Specifically,
// the OES_standard_derivatives and WEBGL_draw_buffers extensions fails to compile in IE11 even though its included
// in the list of supported extensions.
// opts allows user agent to be overridden for testing
/*
 * Inputs :
 *  gl : WebGL context
 *  cap : Key of WEBGL_FEATURES object identifying the extension
 *  opts :
 *   behavior : behavior of extension to be tested, by defualt `enable` is used
 * Returns : true, if shader is compiled successfully, false otherwise
 */
export function canCompileGLSLExtension(gl: WebGLRenderingContext, extensionName, opts: {behavior?} = {}) {
  if (!isOldIE(opts)) {
    return true;
  }

  if (extensionName in compiledGLSLExtensions) {
    return compiledGLSLExtensions[extensionName];
  }

  const behavior = opts.behavior || 'enable';
  const source = `#extension GL_${extensionName} : ${behavior}\nvoid main(void) {}`;

  const shader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  const canCompile = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  gl.deleteShader(shader);
  compiledGLSLExtensions[extensionName] = canCompile;
  return canCompile;
}
