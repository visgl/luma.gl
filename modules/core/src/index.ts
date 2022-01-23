// luma.gl, MIT license
// core module exports

// UTILS: undocumented API for other luma.gl modules
export {log, assert, uid} from '@luma.gl/api';

// CORE MODULE EXPORTS FOR LUMA.GL

// ENGINE
export {
  ClassicAnimationLoop as AnimationLoop,
  ClassicModel as Model,
  Transform,
  ProgramManager,
  Timeline
} from '@luma.gl/engine';

export {
  Geometry,
  ClipSpace,
  ConeGeometry,
  CubeGeometry,
  CylinderGeometry,
  IcoSphereGeometry,
  PlaneGeometry,
  SphereGeometry,
  TruncatedConeGeometry
} from '@luma.gl/engine';

// TODO - the following exports will be removed in v9

// WEBGL - importing from `@luma.gl/core` is deprecated

// GLTOOLS
export {
  createGLContext,
  instrumentGLContext,
  FEATURES,
  hasFeature,
  hasFeatures
} from '@luma.gl/gltools';

import {
  lumaStats as lumaStatsDeprecated
} from '@luma.gl/api';

export {
  isWebGL,
  isWebGL2,
  getParameters,
  setParameters,
  withParameters,
  resetParameters,
  cssToDeviceRatio,
  cssToDevicePixels,
  Buffer,
  Program,
  Framebuffer,
  Renderbuffer,
  Texture2D,
  TextureCube,
  clear,
  readPixelsToArray,
  readPixelsToBuffer,
  cloneTextureFrom,
  copyToTexture,
  Texture3D,
  TransformFeedback
} from '@luma.gl/gltools';

// SHADERTOOLS - importing from `@luma.gl/core` is deprecated

import {
  // HELPERS
  normalizeShaderModule as normalizeShaderModuleDeprecated,
  // SHADER MODULES
  fp32 as fp32Deprecated,
  fp64 as fp64Deprecated,
  project as projectDeprecated,
  dirlight as dirlightDeprecated,
  picking as pickingDeprecated,
  gouraudLighting as gouraudLightingDeprecated,
  phongLighting as phongLightingDeprecated,
  pbr as pbrDeprecated
} from '@luma.gl/shadertools';

/** @deprecated Import directly from `@luma.gl/shadertools` */
export const normalizeShaderModule = normalizeShaderModuleDeprecated;
/** @deprecated Import directly from `@luma.gl/shadertools` */
export const fp32 = fp32Deprecated;
/** @deprecated Import directly from `@luma.gl/shadertools` */
export const fp64 = fp64Deprecated;
/** @deprecated Import directly from `@luma.gl/shadertools` */
export const project = projectDeprecated;
/** @deprecated Import directly from `@luma.gl/shadertools` */
export const dirlight = dirlightDeprecated;
/** @deprecated Import directly from `@luma.gl/shadertools` */
export const picking = pickingDeprecated;
/** @deprecated Import directly from `@luma.gl/shadertools` */
export const gouraudLighting = gouraudLightingDeprecated;
/** @deprecated Import directly from `@luma.gl/shadertools` */
export const phongLighting = phongLightingDeprecated;
/** @deprecated Import directly from `@luma.gl/shadertools` */
export const pbr = pbrDeprecated;
