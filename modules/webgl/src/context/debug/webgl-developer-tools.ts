// luma.gl, MIT license
import {log, loadScript} from '@luma.gl/api/';
import GL from '@luma.gl/constants';

const WEBGL_DEBUG_CDN_URL = 'https://unpkg.com/webgl-debug@2.0.1/index.js';

type DebugContextProps = {
  debug?: boolean;
  throwOnError?: boolean;
  break?: string[];
  webgl2?: boolean;
  gl?: any;
};

const DEFAULT_DEBUG_CONTEXT_PROPS: Required<DebugContextProps> = {
  debug: true,
  throwOnError: false,
  break: undefined,
  webgl2: false,
  gl: undefined
}

// Helper to get shared context data
function getContextData(gl) {
  gl.luma = gl.luma || {};
  return gl.luma;
}

/**
 * Loads Khronos WebGLDeveloperTools from CDN if not already installed 
 * const WebGLDebugUtils = require('webgl-debug');
 * @see https://github.com/KhronosGroup/WebGLDeveloperTools
 * @see https://github.com/vorg/webgl-debug
 */
export async function loadWebGLDeveloperTools() {
  if (!globalThis.WebGLDebugUtils) {
    // @ts-expect-error Developer tools expects global to be set
    globalThis.global = globalThis.global || globalThis;
    // @ts-expect-error Developer tools expects global to be set
    globalThis.global.module = {};
    await loadScript(WEBGL_DEBUG_CDN_URL);
  }
}

// Returns (a potentially new) context with debug instrumentation turned off or on.
// Note that this actually returns a new context
export function makeDebugContext(gl, props: DebugContextProps = {}) {
  if (!gl) {
    // Return null to ensure we don't try to create a context in this case.
    return null;
  }

  return props.debug ? getDebugContext(gl, props) : getRealContext(gl);
}

// Returns the real context from either of the real/debug contexts
function getRealContext(gl) {
  const data = getContextData(gl);
  // If the context has a realContext member, it is a debug context so return the realContext
  return data.realContext ? data.realContext : gl;
}

// Returns the debug context from either of the real/debug contexts
function getDebugContext(gl, props: DebugContextProps) {
  if (!globalThis.WebGLDebugUtils) {
    log.warn('webgl-debug not loaded')();
    return gl;
  }

  const data = getContextData(gl);

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
  const debugContext = globalThis.WebGLDebugUtils.makeDebugContext(
    gl,
    onGLError.bind(null, props),
    onValidateGLFunc.bind(null, props)
  );
  // Make sure we have all constants
  Object.assign(WebGLDebugContext.prototype, debugContext);

  // Store the debug context
  data.realContext = gl;
  data.debugContext = debugContext;
  debugContext.debug = true;

  // Return it
  return debugContext;
}

// DEBUG TRACING

function getFunctionString(functionName: string, functionArgs): string {
  // Cover bug in webgl-debug-tools
  functionArgs = Array.from(functionArgs).map(arg => arg === undefined ? 'undefined' : arg);
  let args = globalThis.WebGLDebugUtils.glFunctionArgsToString(functionName, functionArgs);
  args = `${args.slice(0, 100)}${args.length > 100 ? '...' : ''}`;
  return `gl.${functionName}(${args})`;
}

function onGLError(props: DebugContextProps, err, functionName: string, args): void {
  // Cover bug in webgl-debug-tools
  args = Array.from(args).map(arg => arg === undefined ? 'undefined' : arg);
  const errorMessage = globalThis.WebGLDebugUtils.glEnumToString(err);
  const functionArgs = globalThis.WebGLDebugUtils.glFunctionArgsToString(functionName, args);
  const glName = props.webgl2 ? 'gl2' : 'gl1';
  const message = `${errorMessage} in ${glName}.${functionName}(${functionArgs})`;
  if (props.throwOnError) {
    throw new Error(message);
  } else {
    log.error(message)();
    debugger; // eslint-disable-line
  }
}

// Don't generate function string until it is needed
function onValidateGLFunc(props: DebugContextProps, functionName: string, functionArgs): void {
  let functionString;
  if (log.level >= 4) {
    functionString = getFunctionString(functionName, functionArgs);
    log.log(4, functionString)();
  }

  if (props.break) {
    functionString = functionString || getFunctionString(functionName, functionArgs);
    const isBreakpoint =
      props.break && props.break.every((breakOn) => functionString.indexOf(breakOn) !== -1);
    if (isBreakpoint) {
      debugger; // eslint-disable-line
    }
  }

  for (const arg of functionArgs) {
    if (arg === undefined) {
      functionString = functionString || getFunctionString(functionName, functionArgs);
      if (props.throwOnError) {
        throw new Error(`Undefined argument: ${functionString}`);
      } else {
        log.error(`Undefined argument: ${functionString}`)();
        debugger; // eslint-disable-line
      }
    }
  }
}
