// luma.gl, MIT license
// Copyright (c) vis.gl contributors

// WebGL1/WebGL2 extension polyfill support
//
// Provides a function that creates polyfills for WebGL2 functions based
// on available extensions and installs them on a supplied target (could be
// the WebGLContext or its prototype, or a separate object).
//
// This is intended to be a stand-alone file with minimal dependencies,
// easy to reuse or repurpose in other projects.

import {assert} from '@luma.gl/core';
import {polyfillVertexArrayObject} from './polyfill-vertex-array-object';

import {WEBGL2_CONTEXT_POLYFILLS, WEBGL2_CONTEXT_OVERRIDES} from './polyfill-table';
import {getContextData} from './context-data';

/**
 * Registers extensions, polyfills or mock functions for extensions in the polyfills list
 */
export function polyfillContext(gl: WebGLRenderingContext): WebGL2RenderingContext {
  const contextState = getContextData(gl);

  if (!contextState._polyfilled) {
    polyfillVertexArrayObject(gl);
    initializeExtensions(gl);
    installPolyfills(gl, WEBGL2_CONTEXT_POLYFILLS);
    installOverrides(gl, {target: contextState, target2: gl});
    contextState._polyfilled = true;
  }

  // Note - only supports a subset of WebGL2
  return gl as WebGL2RenderingContext;
}

function initializeExtensions(gl: WebGLRenderingContext): void {
  const contextState = getContextData(gl);
  // `getSupportedExtensions` can return null when context is lost.
  const EXTENSIONS = gl.getSupportedExtensions() || [];
  // Generates warnings in Chrome
  const IGNORE_EXTENSIONS = ['WEBGL_polygon_mode'];
  for (const extensionName of EXTENSIONS) {
    if (!IGNORE_EXTENSIONS.includes(extensionName)) {
      const extension = gl.getExtension(extensionName);
      contextState._extensions[extensionName] = extension;
    }
  }
}

function installPolyfills(gl: WebGLRenderingContext, polyfills): void {
  const contextState = getContextData(gl);
  for (const extension of Object.getOwnPropertyNames(polyfills)) {
    if (extension !== 'overrides') {
      polyfillExtension(gl, {extension, target: contextState, target2: gl});
    }
  }
}

/** Polyfills a single WebGL extension into the `target` object */
function polyfillExtension(gl: WebGLRenderingContext, {extension, target, target2}): void {
  const defaults = WEBGL2_CONTEXT_POLYFILLS[extension];
  assert(defaults);

  const {meta = {}} = defaults;
  const {suffix = ''} = meta;

  const ext = gl.getExtension(extension);

  for (const key of Object.keys(defaults)) {
    const extKey = `${key}${suffix}`;

    let polyfill: Function | null = null;
    if (key === 'meta') {
      // ignore
    } else if (typeof gl[key] === 'function') {
      // WebGL2 implementation is already
    } else if (ext && typeof ext[extKey] === 'function') {
      // pick extension implementation,if available
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

/** Install simple overrides (mostly get* functions) */
function installOverrides(gl: WebGLRenderingContext, {target, target2}) {
  Object.keys(WEBGL2_CONTEXT_OVERRIDES).forEach((key) => {
    if (typeof WEBGL2_CONTEXT_OVERRIDES[key] === 'function') {
      // install an override, if no implementation was detected
      const originalFunc = gl[key] ? gl[key].bind(gl) : () => {};
      const polyfill = WEBGL2_CONTEXT_OVERRIDES[key].bind(null, gl, originalFunc);
      target[key] = polyfill;
      target2[key] = polyfill;
    }
  });
}
