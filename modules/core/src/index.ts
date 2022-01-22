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

import {
  isWebGL as isWebGLDeprecated,
  isWebGL2 as isWebGL2Deprecated,
  getParameters as getParametersDeprecated,
  setParameters as setParametersDeprecated,
  withParameters as withParametersDeprecated,
  resetParameters as resetParametersDeprecated,
  cssToDeviceRatio as cssToDeviceRatioDeprecated,
  cssToDevicePixels as cssToDevicePixelsDeprecated,
  lumaStats as lumaStatsDeprecated,
  Buffer as BufferDeprecated,
  Program as ProgramDeprecated,
  Framebuffer as FramebufferDeprecated,
  Renderbuffer as RenderbufferDeprecated,
  Texture2D as Texture2DDeprecated,
  TextureCube as TextureCubeDeprecated,
  clear as clearDeprecated,
  readPixelsToArray as readPixelsToArrayDeprecated,
  readPixelsToBuffer as readPixelsToBufferDeprecated,
  cloneTextureFrom as cloneTextureFromDeprecated,
  copyToTexture as copyToTextureDeprecated,
  Texture3D as Texture3DDeprecated,
  TransformFeedback as TransformFeedbackDeprecated
} from '@luma.gl/webgl';

/** @deprecated Import directly from `@luma.gl/webgl` */
export const isWebGL = isWebGLDeprecated;
/** @deprecated Import directly from `@luma.gl/webgl` */
export const isWebGL2 = isWebGL2Deprecated;
/** @deprecated Import directly from `@luma.gl/webgl` */
export const getParameters = getParametersDeprecated;
/** @deprecated Import directly from `@luma.gl/webgl` */
export const setParameters = setParametersDeprecated;
/** @deprecated Import directly from `@luma.gl/webgl` */
export const withParameters = withParametersDeprecated;
/** @deprecated Import directly from `@luma.gl/webgl` */
export const resetParameters = resetParametersDeprecated;
/** @deprecated Import directly from `@luma.gl/webgl` */
export const cssToDeviceRatio = cssToDeviceRatioDeprecated;
/** @deprecated Import directly from `@luma.gl/webgl` */
export const cssToDevicePixels = cssToDevicePixelsDeprecated;
/** @deprecated Import directly from `@luma.gl/webgl` */
export const lumaStats = lumaStatsDeprecated;
/** @deprecated Import directly from `@luma.gl/webgl` */
export const Buffer = BufferDeprecated;
/** @deprecated Import directly from `@luma.gl/webgl` */
export const Program = ProgramDeprecated;
/** @deprecated Import directly from `@luma.gl/webgl` */
export const Framebuffer = FramebufferDeprecated;
/** @deprecated Import directly from `@luma.gl/webgl` */
export const Renderbuffer = RenderbufferDeprecated;
/** @deprecated Import directly from `@luma.gl/webgl` */
export const Texture2D = Texture2DDeprecated;
/** @deprecated Import directly from `@luma.gl/webgl` */
export const TextureCube = TextureCubeDeprecated;
/** @deprecated Import directly from `@luma.gl/webgl` */
export const clear = clearDeprecated;
/** @deprecated Import directly from `@luma.gl/webgl` */
export const readPixelsToArray = readPixelsToArrayDeprecated;
/** @deprecated Import directly from `@luma.gl/webgl` */
export const readPixelsToBuffer = readPixelsToBufferDeprecated;
/** @deprecated Import directly from `@luma.gl/webgl` */
export const cloneTextureFrom = cloneTextureFromDeprecated;
/** @deprecated Import directly from `@luma.gl/webgl` */
export const copyToTexture = copyToTextureDeprecated;
/** @deprecated Import directly from `@luma.gl/webgl` */
export const Texture3D = Texture3DDeprecated;
/** @deprecated Import directly from `@luma.gl/webgl` */
export const TransformFeedback = TransformFeedbackDeprecated;

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

// GLTOOLS - Already marked as deprecated at source
export {
  createGLContext,
  instrumentGLContext,
  FEATURES,
  hasFeature,
  hasFeatures
} from '@luma.gl/webgl';
