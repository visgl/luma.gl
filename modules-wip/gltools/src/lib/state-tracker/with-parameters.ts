import {GLParameters, setParameters} from '../parameters/unified-parameter-api';
import {pushContextState, popContextState} from './track-context-state';

/**
 * Execute a function with a set of temporary WebGL parameter overrides
 * - Saves current "global" WebGL context settings
 * - Sets the supplies WebGL context parameters,
 * - Executes supplied function
 * - Restores parameters
 * - Returns the return value of the supplied function
 */
 export function withParameters(gl: WebGLRenderingContext, parameters: GLParameters & {nocatch?: boolean}, func: any): any {
  if (isObjectEmpty(parameters)) {
    // Avoid setting state if no parameters provided. Just call and return
    return func(gl);
  }

  const {nocatch = true} = parameters;

  pushContextState(gl);
  setParameters(gl, parameters);

  // Setup is done, call the function
  let value;

  if (nocatch) {
    // Avoid try catch to minimize stack size impact for safe execution paths
    value = func(gl);
    popContextState(gl);
  } else {
    // Wrap in a try-catch to ensure that parameters are restored on exceptions
    try {
      value = func(gl);
    } finally {
      popContextState(gl);
    }
  }

  return value;
}

// Helpers

// Returns true if given object is empty, false otherwise.
function isObjectEmpty(object) {
  for (const key in object) {
    return false;
  }
  return true;
}
