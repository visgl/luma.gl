// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {GLParameters, setGLParameters} from '../parameters/unified-parameter-api';
import {WebGLStateTracker} from './webgl-state-tracker';

/**
 * Execute a function with a set of temporary WebGL parameter overrides
 * - Saves current "global" WebGL context settings
 * - Sets the supplies WebGL context parameters,
 * - Executes supplied function
 * - Restores parameters
 * - Returns the return value of the supplied function
 */
export function withGLParameters(
  gl: WebGL2RenderingContext,
  parameters: GLParameters & {nocatch?: boolean},
  func: any
): any {
  if (isObjectEmpty(parameters)) {
    // Avoid setting state if no parameters provided. Just call and return
    return func(gl);
  }

  const {nocatch = true} = parameters;

  const webglState = WebGLStateTracker.get(gl);
  webglState.push();
  setGLParameters(gl, parameters);

  // Setup is done, call the function
  let value;

  if (nocatch) {
    // Avoid try catch to minimize stack size impact for safe execution paths
    value = func(gl);
    webglState.pop();
  } else {
    // Wrap in a try-catch to ensure that parameters are restored on exceptions
    try {
      value = func(gl);
    } finally {
      webglState.pop();
    }
  }

  return value;
}

// Helpers

// Returns true if given object is empty, false otherwise.
function isObjectEmpty(object) {
  // @ts-ignore - dummy key variable
  for (const key in object) {
    return false;
  }
  return true;
}
