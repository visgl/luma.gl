// Export core modules for luma.gl
// export * from './math';

// WebGL
export {isWebGLContext, isWebGL2Context} from './webgl/webgl-checks';
export * from './webgl/context';

// WebGL1
export {default as Buffer} from './webgl/buffer';
export {default as Shader, VertexShader, FragmentShader} from './webgl/shader';
export {default as Program} from './webgl/program';
export {default as Framebuffer} from './webgl/framebuffer';
export {default as Renderbuffer} from './webgl/renderbuffer';
export {default as Texture2D} from './webgl/texture-2d';
export {default as TextureCube} from './webgl/texture-cube';

import * as VertexAttributes from './webgl/vertex-attributes';
export {VertexAttributes};

// WebGL2 & Extensions
export {default as TimerQuery} from './webgl/timer-query';
export {default as VertexArrayObject} from './webgl/vertex-array-object';

// Functions
export * from './webgl/draw';
export * from './webgl/uniforms';

// Core
export {default as Model} from './core/model';
export {default as AnimationFrame} from './core/animation-frame';
export {addEvents} from './core/event';

// Geometry
export {default as Geometry} from './geometry/geometry';
export {default as ConeGeometry} from './geometry/cone-geometry';
export {default as CubeGeometry} from './geometry/cube-geometry';
export {default as CylinderGeometry} from './geometry/cylinder-geometry';
export {default as IcoSphereGeometry} from './geometry/ico-sphere-geometry';
export {default as PlaneGeometry} from './geometry/plane-geometry';
export {default as SphereGeometry} from './geometry/sphere-geometry';
export {default as TruncatedConeGeometry} from './geometry/truncated-cone-geometry';

// Models
export {default as Cone} from './models/cone';
export {default as Cube} from './models/cube';
export {default as Cylinder} from './models/cylinder';
export {default as IcoSphere} from './models/ico-sphere';
export {default as Plane} from './models/plane';
export {default as Sphere} from './models/sphere';
export {default as TruncatedCone} from './models/truncated-cone';

// Math
export {default as Vector2} from './packages/math/src/vector2';
export {default as Vector3} from './packages/math/src/vector3';
export {default as Vector4} from './packages/math/src/vector4';
export {default as Matrix4} from './packages/math/src/matrix4';
export {default as Quaternion} from './packages/math/src/quaternion';
export {default as Euler} from './packages/math/src/euler';

// IO
export {
  loadFile, loadImage,
  loadFiles, loadImages, loadTextures,
  loadProgram, loadModel, parseModel
} from './io';

// Experimental modules
import * as experimental from './experimental';
export {experimental};

// Deprecated in V3.0
export * from './deprecated/scenegraph';
export {default as Shaders} from './deprecated/shaderlib';
export {default as Fx} from './addons/fx';
export * from './deprecated';

// import * as scenegraph from './deprecated/scenegraph';
// import {default as Shaders} from './deprecated/shaderlib';
// import {default as Fx} from './addons/fx';
// import * as deprecated from './deprecated';
// import * as io from './io';
// import luma from './globals';
