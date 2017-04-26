// Khronos Debug support module
import WebGLDebug from 'webgl-debug';
import {log} from '../utils';

// Uses webgl-debug
export function makeDebugContext(gl) {
  const debugGL = WebGLDebug.makeDebugContext(gl, throwOnError, validateArgsAndLog);
  class WebGLDebugContext {}
  Object.assign(WebGLDebugContext.prototype, debugGL);
  debugGL.debug = true;
  return debugGL;
}

// DEBUG TRACING

function getFunctionString(functionName, functionArgs) {
  let args = WebGLDebug.glFunctionArgsToString(functionName, functionArgs);
  args = `${args.slice(0, 100)}${args.length > 100 ? '...' : ''}`;
  return `gl.${functionName}(${args})`;
}

function throwOnError(err, functionName, args) {
  const errorMessage = WebGLDebug.glEnumToString(err);
  const functionArgs = WebGLDebug.glFunctionArgsToString(functionName, args);
  throw new Error(`${errorMessage} was caused by call to: ` +
    `gl.${functionName}(${functionArgs})`);
}

// Don't generate function string until it is needed
function validateArgsAndLog(functionName, functionArgs) {
  let functionString;
  if (log.priority >= 4) {
    functionString = getFunctionString(functionName, functionArgs);
    log.info(4, `${functionString}`);
  }

  for (const arg of functionArgs) {
    if (arg === undefined) {
      functionString = functionString ||
        getFunctionString(functionName, functionArgs);
      throw new Error(`Undefined argument: ${functionString}`);
    }
  }

  if (log.break) {
    functionString = functionString ||
      getFunctionString(functionName, functionArgs);
    const isBreakpoint = log.break && log.break.every(
      breakString => functionString.indexOf(breakString) !== -1
    );

    /* eslint-disable no-debugger */
    if (isBreakpoint) {
      debugger;
    }
    /* eslint-enable no-debugger */
  }
}
