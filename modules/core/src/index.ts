
// UTILS: undocumented API for other luma.gl modules
export {log, assert, uid} from '@luma.gl/api';

// CORE MODULE EXPORTS FOR LUMA.GL

export {
  isWebGL,
  isWebGL2,
  getParameters,
  setParameters,
  withParameters,
  resetParameters,
  cssToDeviceRatio,
  cssToDevicePixels
} from '@luma.gl/webgl';

// WEBGL
export {
  lumaStats,
  Buffer,
  Program,
  Framebuffer,
  Renderbuffer,
  Texture2D,
  TextureCube,
  clear,
  // Copy and Blit
  readPixelsToArray,
  readPixelsToBuffer,
  cloneTextureFrom,
  copyToTexture,
  // WebGL2 classes & Extensions
  Texture3D,
  TransformFeedback
} from '@luma.gl/webgl';

// ENGINE
export {
  AnimationLoop,
  Model,
  Transform,
  ProgramManager,
  Timeline,
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

// TODO/CLEAN UP FOR V7
//  We should have a minimal set of forwarding exports from shadertools (ideally none)
//  Analyze risk of breaking apps
export {
  // HELPERS
  normalizeShaderModule,
  // SHADER MODULES
  fp32,
  fp64,
  project,
  dirlight,
  picking,
  gouraudLighting,
  phongLighting,
  pbr
} from '@luma.gl/shadertools';

/* TODO restore for 8.7
// GLTOOLS
export {
  createGLContext,
  instrumentGLContext,
  FEATURES,
  // hasFeature,
  // hasFeatures,
} from '@luma.gl/gltools';
*/
