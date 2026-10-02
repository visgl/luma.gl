// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {GLParameters, setGLParameters} from '../parameters/unified-parameter-api';
import {WebGLStateTracker} from './webgl-state-tracker';

/**
 * Execute a function with a set of temporary WebGL parameter overrides
 * - Saves current "global" WebGL context settings
 * - Sets the supplied WebGL context parameters,
 * - Executes supplied function
 * - Restores parameters, including when setup or the callback throws
 * - `nocatch: true` skips exception cleanup; use only for operations known not to throw
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

  const {nocatch = false} = parameters;

  const webglState = WebGLStateTracker.get(gl);
  webglState.push();
  let value;

  if (nocatch) {
    // Explicit opt-out for operations known not to throw.
    setGLParameters(gl, parameters);
    value = func(gl);
    webglState.pop();
  } else {
    // Restore state if setup or the callback throws; propagate the exception.
    try {
      setGLParameters(gl, parameters);
      value = func(gl);
    } finally {
      webglState.pop();
    }
  }

  return value;
}

// Helpers

// Returns true if given object is empty, false otherwise.
function isObjectEmpty(object: unknown): boolean {
  for (const _key in object as Record<string, unknown>) {
    return false;
  }
  return true;
}
