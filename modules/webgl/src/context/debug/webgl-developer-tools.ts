// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {log} from '@luma.gl/core';
// Rename constant to prevent inlining. We need the full set of constants for generating debug strings.
import {GL as GLEnum} from '@luma.gl/constants';
import {isBrowser} from '@probe.gl/env';
import {loadScript} from '../../utils/load-script';

const WEBGL_DEBUG_CDN_URL = 'https://unpkg.com/webgl-debug@2.0.1/index.js';

type DebugContextProps = {
  debugWebGL?: boolean;
  traceWebGL?: boolean;
};

type ContextData = {
  realContext?: WebGL2RenderingContext;
  debugContext?: WebGL2RenderingContext;
};

// Helper to get shared context data
function getWebGLContextData(gl: any): ContextData {
  gl.luma = gl.luma || {};
  return gl.luma;
}

declare global {
  // eslint-disable-next-line no-var
  var WebGLDebugUtils: any;
}

/**
 * Loads Khronos WebGLDeveloperTools from CDN if not already installed
 * const WebGLDebugUtils = require('webgl-debug');
 * @see https://github.com/KhronosGroup/WebGLDeveloperTools
 * @see https://github.com/vorg/webgl-debug
 */
export async function loadWebGLDeveloperTools(): Promise<void> {
  if (isBrowser() && !globalThis.WebGLDebugUtils) {
    globalThis.global = globalThis.global || globalThis;
    // @ts-expect-error Developer tools expects global to be set
    globalThis.global.module = {};
    await loadScript(WEBGL_DEBUG_CDN_URL);
  }
}

// Returns (a potentially new) context with debug instrumentation turned off or on.
// Note that this actually returns a new context
export function makeDebugContext(
  gl: WebGL2RenderingContext,
  props: DebugContextProps = {}
): WebGL2RenderingContext {
  return props.debugWebGL || props.traceWebGL ? getDebugContext(gl, props) : getRealContext(gl);
}

// Returns the real context from either of the real/debug contexts
function getRealContext(gl: WebGL2RenderingContext): WebGL2RenderingContext {
  const data = getWebGLContextData(gl);
  // If the context has a realContext member, it is a debug context so return the realContext
  return data.realContext ? data.realContext : gl;
}

// Returns the debug context from either of the real/debug contexts
function getDebugContext(
  gl: WebGL2RenderingContext,
  props: DebugContextProps
): WebGL2RenderingContext {
  if (!globalThis.WebGLDebugUtils) {
    log.warn('webgl-debug not loaded')();
    return gl;
  }

  const data = getWebGLContextData(gl);

  // If this already has a debug context, return it.
  if (data.debugContext) {
    return data.debugContext;
  }

  // Create a new debug context
  globalThis.WebGLDebugUtils.init({...GLEnum, ...gl});
  const glDebug = globalThis.WebGLDebugUtils.makeDebugContext(
    gl,
    onGLError.bind(null, props),
    onValidateGLFunc.bind(null, props)
  );

  // Make sure we have all WebGL2 and extension constants (todo dynamic import to circumvent minification?)
  for (const key in GLEnum) {
    if (!(key in glDebug) && typeof GLEnum[key] === 'number') {
      glDebug[key] = GLEnum[key];
    }
  }

  // Ensure we have a clean prototype on the instrumented object
  // Note: setPrototypeOf does come with perf warnings, but we already take a bigger perf reduction
  // by synchronizing the WebGL errors after each WebGL call.
  class WebGLDebugContext {}
  Object.setPrototypeOf(glDebug, Object.getPrototypeOf(gl));
  Object.setPrototypeOf(WebGLDebugContext, glDebug);
  const debugContext = Object.create(WebGLDebugContext);
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
  functionArgs = Array.from(functionArgs).map(arg => (arg === undefined ? 'undefined' : arg));
  let args = globalThis.WebGLDebugUtils.glFunctionArgsToString(functionName, functionArgs);
  args = `${args.slice(0, 100)}${args.length > 100 ? '...' : ''}`;
  return `gl.${functionName}(${args})`;
}

function onGLError(props: DebugContextProps, err, functionName: string, args: any[]): void {
  // Cover bug in webgl-debug-tools
  args = Array.from(args).map(arg => (arg === undefined ? 'undefined' : arg));
  const errorMessage = globalThis.WebGLDebugUtils.glEnumToString(err);
  const functionArgs = globalThis.WebGLDebugUtils.glFunctionArgsToString(functionName, args);
  const message = `${errorMessage} in gl.${functionName}(${functionArgs})`;
  log.error(message)();
  debugger; // eslint-disable-line
  // throw new Error(message);
}

// Don't generate function string until it is needed
function onValidateGLFunc(
  props: DebugContextProps,
  functionName: string,
  functionArgs: any[]
): void {
  let functionString: string = '';
  if (log.level >= 1) {
    functionString = getFunctionString(functionName, functionArgs);
    if (props.traceWebGL) {
      log.log(1, functionString)();
    }
  }

  for (const arg of functionArgs) {
    if (arg === undefined) {
      functionString = functionString || getFunctionString(functionName, functionArgs);
      debugger; // eslint-disable-line
      // throw new Error(`Undefined argument: ${functionString}`);
    }
  }
}
