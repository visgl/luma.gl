// Depends on Khronos Debug support module being imported via "luma.gl/debug"
// NOTE deprecated, this file has been copied into luma.gl/webgl
import {log} from '@luma.gl/core';
import {GL} from '@luma.gl/constants';

// Expose Khronos Debug support module on global context
import {WebGLDebugUtils} from './webgl-debug';
globalThis.WebGLDebugUtils = WebGLDebugUtils;

// Helper to get shared context data
function getContextDebugData(gl) {
  gl.luma = gl.luma || {};
  return gl.luma;
}

/** Returns (a potentially new) context with debug instrumentation turned off or on.
 * Note that this actually returns a new context
 * @deprecated Use `makeDebugContext` in luma.gl/webgl
 */
export function makeDebugContext(
  gl,
  {debug = true, throwOnError = false, break: breakpoints = false} = {}
) {
  if (!gl) {
    // Return to ensure we don't create a context in this case.
    return null;
  }

  return debug ? getDebugContext(gl, {throwOnError, break: breakpoints}) : getRealContext(gl);
}

// Returns the real context from either of the real/debug contexts
function getRealContext(gl) {
  const data = getContextDebugData(gl);
  // If the context has a realContext member, it is a debug context so return the realContext
  return data.realContext ? data.realContext : gl;
}

// Returns the debug context from either of the real/debug contexts
function getDebugContext(gl, opts) {
  const data = getContextDebugData(gl);

  // If this already has a debug context, return it.
  if (data.debugContext) {
    return data.debugContext;
  }

  // Make sure we have all WebGL2 and extension constants (todo dynamic import to circumvent minification?)
  for (const key in GL) {
    if (!(key in gl) && typeof GL[key] === 'number') {
      gl[key] = GL[key];
    }
  }

  // Create a new debug context
  class WebGLDebugContext {}
  const debugContext = WebGLDebugUtils.makeDebugContext(
    gl,
    onGLError.bind(null, opts),
    onValidateGLFunc.bind(null, opts)
  );
  // Make sure we have all constants
  Object.assign(WebGLDebugContext.prototype, debugContext);

  // Store the debug context
  data.realContext = gl;
  data.debugContext = debugContext;
  debugContext.debug = true;

  log.info('debug context actived.')();

  // Return it
  return debugContext;
}

// DEBUG TRACING

function getFunctionString(functionName, functionArgs) {
  let args = WebGLDebugUtils.glFunctionArgsToString(functionName, functionArgs);
  args = `${args.slice(0, 100)}${args.length > 100 ? '...' : ''}`;
  return `gl.${functionName}(${args})`;
}

function onGLError(opts, err, functionName, args) {
  const errorMessage = WebGLDebugUtils.glEnumToString(err);
  const functionArgs = WebGLDebugUtils.glFunctionArgsToString(functionName, args);
  const message = `${errorMessage} in gl.${functionName}(${functionArgs})`;
  if (opts.throwOnError) {
    throw new Error(message);
  } else {
    log.error(message)();
    debugger; // eslint-disable-line
  }
}

// Don't generate function string until it is needed
function onValidateGLFunc(opts, functionName, functionArgs) {
  let functionString;
  if (log.level >= 4) {
    functionString = getFunctionString(functionName, functionArgs);
    log.log(4, functionString)();
  }

  if (opts.break) {
    functionString = functionString || getFunctionString(functionName, functionArgs);
    const isBreakpoint =
      opts.break && opts.break.every((breakOn) => functionString.indexOf(breakOn) !== -1);
    if (isBreakpoint) {
      debugger; // eslint-disable-line
    }
  }

  for (const arg of functionArgs) {
    if (arg === undefined) {
      functionString = functionString || getFunctionString(functionName, functionArgs);
      if (opts.throwOnError) {
        throw new Error(`Undefined argument: ${functionString}`);
      } else {
        log.error(`Undefined argument: ${functionString}`)();
        debugger; // eslint-disable-line
      }
    }
  }
}
