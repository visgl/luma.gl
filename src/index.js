// Export core modules for luma.gl

// Initialize any global state
require('./init');

// WebGL
export {
  isWebGL,
  isWebGL2} from './webgl-utils/webgl-checks';
export {
  getKeyValue,
  getKey} from './webgl-utils/constants-to-keys';
export {
  createGLContext,
  destroyGLContext,
  resizeGLContext,
  pollGLContext,
  setContextDefaults
} from './webgl-context/context';
export {
  trackContextState} from './webgl-context';
export {
  resetParameters,
  getParameter,
  getParameters,
  setParameter,
  setParameters,
  withParameters,
  getModifiedParameters} from './webgl-context/context-state';
export {
  getContextInfo,
  getGLContextInfo,
  getContextLimits,
  glGetDebugInfo} from './webgl-context/context-limits';
export {
  FEATURES,
  hasFeature,
  hasFeatures,
  getFeatures,
  canCompileGLGSExtension} from './webgl-context/context-features';
export {
  makeDebugContext} from './webgl-context/debug-context';

// WebGL1 classes
export {default as Buffer} from './webgl/buffer';
export {Shader, VertexShader, FragmentShader} from './webgl/shader';
export {default as Program} from './webgl/program';
export {default as Framebuffer} from './webgl/framebuffer';
export {default as Renderbuffer} from './webgl/renderbuffer';
export {default as Texture2D} from './webgl/texture-2d';
export {default as TextureCube} from './webgl/texture-cube';

export {clear, clearBuffer} from './webgl/clear';

// WebGL2 classes & Extensions
export {default as FenceSync} from './webgl/fence-sync';
export {default as Query} from './webgl/query';
export {default as Sampler} from './webgl/sampler';
export {default as Texture3D} from './webgl/texture-3d';
export {default as Texture2DArray} from './webgl/texture-2d-array';
export {default as TransformFeedback} from './webgl/transform-feedback';
export {default as VertexArray} from './webgl/vertex-array';
export {default as UniformBufferLayout} from './webgl/uniform-buffer-layout';

// Core
export {default as Model} from './core/model';
export {default as AnimationLoop} from './core/animation-loop';
export {default as AnimationLoopProxy} from './core/animation-loop-proxy';

// export {default as Object3D} from './core/object-3d';
// export {default as Group} from './core/group';
export {default as pickModels} from './core/pick-models';
export {
  encodePickingColor,
  decodePickingColor,
  getNullPickingColor} from './core/picking-colors';

// Experimental core exports
export {default as _Attribute} from './core/attribute';

// Addons
export {addEvents} from './packages/events';

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

export {default as ClipSpace} from './models/clip-space';

// IO
export {
  setPathPrefix,
  loadFile,
  loadImage,
  loadFiles,
  loadImages,
  loadTextures,
  loadProgram,
  loadModel,
  parseModel
} from './io';

// shadertools
export {
  setDefaultShaderModules,
  registerShaderModules
} from './shadertools/src/lib/resolve-modules';
export {assembleShaders} from './shadertools/src/lib/assemble-shaders';

// shader modules
export {default as fp32} from './shadertools/src/modules/fp32/fp32';
export {default as fp64} from './shadertools/src/modules/fp64/fp64';
export {default as project} from './shadertools/src/modules/project/project';
export {default as lighting} from './shadertools/src/modules/lighting/lighting';
export {default as dirlight} from './shadertools/src/modules/dirlight/dirlight';
export {default as picking} from './shadertools/src/modules/picking/picking';
export {default as diffuse} from './shadertools/src/modules/diffuse/diffuse';

// EXPERIMENTAL EXPORTS

export {clearBuffer as _clearBuffer} from './webgl/clear';
export {default as _Transform} from './core/transform';
export {default as _ShaderCache} from './core/shader-cache';

// DEPRECATED EXPORTS IN v6.0

export {default as ClipSpaceQuad} from './models/clip-space';

// DEPRECATED EXPORTS IN v5.3

export {glGet, glKey, glKeyType} from './webgl-utils/constants-to-keys';
