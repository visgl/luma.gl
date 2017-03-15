// luma.gl Base WebGL wrapper library
// Provides simple class/function wrappers around the low level webgl objects
// These classes are intentionally close to the WebGL API
// but make it easier to use.
// Higher level abstractions can be built on these classes
export * from './webgl';

// WebGL context functions and helpers
export * from './context';
export {isWebGLContext, isWebGL2Context} from './webgl-checks';

// WebGL1 objects
export {default as Buffer} from './buffer';
export {default as Shader, VertexShader, FragmentShader} from './shader';
export {default as Program} from './program';
export {default as Framebuffer} from './framebuffer';
export {default as Renderbuffer} from './renderbuffer';
export {default as Texture2D} from './texture-2d';
export {default as TextureCube} from './texture-cube';

import * as VertexAttributes from './vertex-attributes';
export {VertexAttributes};

// Extensions
export {default as TimerQuery} from './timer-query';

// Functions
export * from './draw';
export * from './uniforms';

// WebGL2
export {default as VertexArrayObject} from './vertex-array-object';
