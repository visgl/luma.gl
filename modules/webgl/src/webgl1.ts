// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Explicit entry point for legacy WebGL1 compatibility. */

export {
  enforceWebGL2,
  polyfillWebGL1Extensions
} from './context/polyfills/polyfill-webgl1-extensions';
