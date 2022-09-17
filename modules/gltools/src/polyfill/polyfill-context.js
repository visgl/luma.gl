// WebGL1/WebGL2 extension polyfill support
//
// Provides a function that creates polyfills for WebGL2 functions based
// on available extensions and installs them on a supplied target (could be
// the WebGLContext or its prototype, or a separate object).
//
// This is intended to be a stand-alone file with minimal dependencies,
// easy to reuse or repurpose in other projects.

/** @typedef {import('./polyfill-context')} types */

import {polyfillVertexArrayObject} from './polyfill-vertex-array-object';
import {assert} from '../utils/assert';

import {WEBGL2_CONTEXT_POLYFILLS, WEBGL2_CONTEXT_OVERRIDES} from './polyfill-table';

/** @type {types['polyfillContext']} */
export function polyfillContext(gl) {
  // @ts-ignore
  gl.luma = gl.luma || {};
  // @ts-ignore
  const {luma} = gl;

  if (!luma.polyfilled) {
    polyfillVertexArrayObject(gl);
    initializeExtensions(gl);
    installPolyfills(gl, WEBGL2_CONTEXT_POLYFILLS);
    installOverrides(gl, {target: luma, target2: gl});
    luma.polyfilled = true;
  }

  // TODO - only supporting a few members
  /** @type {WebGL2RenderingContext} */
  // @ts-ignore
  return gl;
}

// TODO - is this still required?
// @ts-ignore
globalThis.polyfillContext = polyfillContext;

function initializeExtensions(gl) {
  gl.luma.extensions = {};
  // `getSupportedExtensions` can return null when context is lost.
  const EXTENSIONS = gl.getSupportedExtensions() || [];
  for (const extension of EXTENSIONS) {
    gl.luma[extension] = gl.getExtension(extension);
  }
}

// Install simple overrides (mostly get* functions)
function installOverrides(gl, {target, target2}) {
  Object.keys(WEBGL2_CONTEXT_OVERRIDES).forEach(key => {
    if (typeof WEBGL2_CONTEXT_OVERRIDES[key] === 'function') {
      // install an override, if no implementation was detected
      const originalFunc = gl[key] ? gl[key].bind(gl) : () => {};
      const polyfill = WEBGL2_CONTEXT_OVERRIDES[key].bind(null, gl, originalFunc);
      target[key] = polyfill;
      target2[key] = polyfill;
    }
  });
}

function installPolyfills(gl, polyfills) {
  for (const extension of Object.getOwnPropertyNames(polyfills)) {
    if (extension !== 'overrides') {
      polyfillExtension(gl, {extension, target: gl.luma, target2: gl});
    }
  }
}

// Polyfills a single WebGL extension into the `target` object
function polyfillExtension(gl, {extension, target, target2}) {
  const defaults = WEBGL2_CONTEXT_POLYFILLS[extension];
  assert(defaults);

  const {meta = {}} = defaults;
  const {suffix = ''} = meta;

  const ext = gl.getExtension(extension);

  for (const key of Object.keys(defaults)) {
    const extKey = `${key}${suffix}`;

    let polyfill = null;
    if (key === 'meta') {
      // ignore
    } else if (typeof gl[key] === 'function') {
      // WebGL2 implementation is already
    } else if (ext && typeof ext[extKey] === 'function') {
      // pick extension implemenentation,if available
      polyfill = (...args) => ext[extKey](...args);
    } else if (typeof defaults[key] === 'function') {
      // pick the mock implementation, if no implementation was detected
      polyfill = defaults[key].bind(target);
    }

    if (polyfill) {
      target[key] = polyfill;
      target2[key] = polyfill;
    }
  }
}
