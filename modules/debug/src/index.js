export {COLOR_MODE} from './glsl-to-js-compiler/draw-model';
export {default as _DebugContext} from './glsl-to-js-compiler/debug-context';
export {
	compileShaderModule,
	compileVertexShader,
	compileFragmentShader
} from './glsl-to-js-compiler/compile-shader';

// Register the Khronons WebGLDebugger module that lets us instrument WebGLContexts
// TODO - move the instrumentation code into this module
import './webgl-api-tracing/webgl-debugger';

// Install additional parameter definitions on luma.gl classes
// TODO: This needs a bit more plumbing
// import {installParameterDefinitions} from './webgl-api-tracing/parameter-definitions';
// installParameterDefinitions();

// Since debug support has been explicitly installed, no qualms about printing to console
// TODO - That said: We could import probe.gl from luma.gl
console.log('@luma.gl/debug: WebGL debug support installed'); // eslint-disable-line
