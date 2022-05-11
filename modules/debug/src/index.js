import {log} from '@luma.gl/core';

export {COLOR_MODE} from './glsl-to-js-compiler/draw-model';
export {default as _DebugContext} from './glsl-to-js-compiler/debug-context';
export {
  compileShaderModule,
  compileVertexShader,
  compileFragmentShader
} from './glsl-to-js-compiler/compile-shader';

export {makeDebugContext} from './webgl-api-tracing/webgl-debug-context';

// Register the Khronons WebGLDebugger module that lets us instrument WebGLContexts
// TODO - move the instrumentation code into this module
import {makeDebugContext} from './webgl-api-tracing/webgl-debug-context';
globalThis.makeDebugContext = makeDebugContext;

// Since debug support has been explicitly installed, no qualms about printing to console
log.info('@luma.gl/debug: WebGL debug support installed')();
