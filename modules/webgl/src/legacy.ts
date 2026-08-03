// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Explicit entry point for deprecated WebGL parameter helpers. */

export {
  resetGLParameters,
  setGLParameters,
  getGLParameters
} from './context/parameters/unified-parameter-api';
export {withGLParameters} from './context/state-tracker/with-parameters';
