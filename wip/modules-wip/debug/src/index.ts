import {log} from '@luma.gl/core';

export {makeDebugContext} from './webgl-api-tracing/webgl-debug-context';

// Register the Khronos WebGLDebugger module that lets us instrument WebGLContexts
// TODO - move the instrumentation code into this module
import {makeDebugContext} from './webgl-api-tracing/webgl-debug-context';
globalThis.makeDebugContext = makeDebugContext;

// Since debug support has been explicitly installed, printing to console is fair game
log.info('@luma.gl/debug: WebGL debug support installed')();
