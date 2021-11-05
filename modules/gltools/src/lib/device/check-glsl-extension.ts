// luma.gl, MIT license
import {assert} from '../utils/assert';
import {FEATURES} from './get-webgl-features';

// Enables feature detection in IE11 due to a bug where gl.getExtension may return true
// but fail to compile when the extension is enabled in the shader. Specifically,
// the OES_standard_derivatives extension fails to compile in IE11 even though its included
// in the list of supported extensions.
const compiledGlslExtensions = {};

// options allows user agent to be overridden for testing
export default function canCompileGLGSExtension(gl, cap, options = {}) {
  const feature = FEATURES[cap];
  assert(feature, cap);

  if (!isOldIE(options)) {
    return true;
  }

  if (cap in compiledGlslExtensions) {
    return compiledGlslExtensions[cap];
  }

  const extensionName = feature[0];
  const source = `#extension GL_${extensionName} : enable\nvoid main(void) {}`;

  const shader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  const canCompile = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  gl.deleteShader(shader);
  compiledGlslExtensions[cap] = canCompile;
  return canCompile;
}

/**
 * Check for IE11
 * @param opts not used (allows user agent to be overridden for testing)
 * @deprecated IE11 no longer supported
 */
 export function isOldIE(opts = {}) {
  const navigator = (typeof window !== 'undefined' && window.navigator) || {};
  // @ts-ignore
  const userAgent = opts.userAgent || navigator.userAgent || '';
  // We only care about older versions of IE (IE 11 and below). Newer versions of IE (Edge)
  // have much better web standards support.
  const isMSIE = userAgent.indexOf('MSIE ') !== -1;
  const isTrident = userAgent.indexOf('Trident/') !== -1;
  return isMSIE || isTrident;
}
