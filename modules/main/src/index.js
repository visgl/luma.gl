// Export core modules for luma.gl

// Initialize any global state
require('./init');

// WebGL
export {
  isWebGL,
  isWebGL2} from '@luma.g/core';
export {cloneTextureFrom} from '@luma.g/core';
export {
  getKeyValue,
  getKey} from '@luma.g/core';
export {
  createGLContext,
  destroyGLContext,
  resizeGLContext,
  pollGLContext,
  setContextDefaults
} from '@luma.g/core';
export {
  trackContextState} from '@luma.g/core';
export {
  resetParameters,
  getParameter,
  getParameters,
  setParameter,
  setParameters,
  withParameters,
  getModifiedParameters} from '@luma.g/core';
export {
  getContextInfo,
  getGLContextInfo,
  getContextLimits,
  glGetDebugInfo} from '@luma.g/core';
export {
  FEATURES,
  hasFeature,
  hasFeatures,
  getFeatures,
  canCompileGLGSExtension} from '@luma.g/core';

// WebGL1 classes
export {default as Buffer} from '@luma.g/core';
export {Shader, VertexShader, FragmentShader} from '@luma.g/core';
export {default as Program} from '@luma.g/core';
export {default as Framebuffer} from '@luma.g/core';
export {default as Renderbuffer} from '@luma.g/core';
export {default as Texture2D} from '@luma.g/core';
export {default as TextureCube} from '@luma.g/core';

export {clear, clearBuffer} from '@luma.g/core';

// Copy and Blit
export {
  readPixelsToArray,
  readPixelsToBuffer,
  copyToDataUrl,
  copyToImage,
  copyToTexture,
  blit
} from '@luma.g/core';

// WebGL2 classes & Extensions
export {default as FenceSync} from '@luma.g/core';
export {default as Query} from '@luma.g/core';
export {default as Sampler} from '@luma.g/core';
export {default as Texture3D} from '@luma.g/core';
export {default as Texture2DArray} from '@luma.g/core';
export {default as TransformFeedback} from '@luma.g/core';
export {default as VertexArrayObject} from '@luma.g/core';
export {default as VertexArray} from '@luma.g/core';
export {default as UniformBufferLayout} from '@luma.g/core';

// experimental WebGL exports
export {default as _Accessor} from '@luma.g/core';
export {clearBuffer as _clearBuffer} from '@luma.g/core';

// CORE
export {default as Object3D} from '@luma.g/core';
export {default as Group} from '@luma.g/core';
export {default as Model} from '@luma.g/core';
export {default as AnimationLoop} from '@luma.g/core';
export {default as pickModels} from '@luma.g/core';
export {
  encodePickingColor,
  decodePickingColor,
  getNullPickingColor} from '@luma.g/core';

// Experimental core exports
export {default as Transform} from '@luma.g/core';
export {default as _Attribute} from '@luma.g/core';
export {default as _ShaderCache} from '@luma.g/core';
export {default as _AnimationLoopProxy} from '@luma.g/core';

// Multipass Rendering
export {default as _MultiPassRenderer} from '@luma.g/core';
export {default as _RenderState} from '@luma.g/core';
export {default as _Pass} from '@luma.g/core';
export {default as _CompositePass} from '@luma.g/core';
export {default as _ClearPass} from '@luma.g/core';
export {default as _RenderPass} from '@luma.g/core';
export {default as _CopyPass} from '@luma.g/core';
export {default as _TexturePass} from '@luma.g/core';
// export {default as _MaskPass} from '@luma.g/core';
// export {default as _ClearMaskPass} from '@luma.g/core';
export {default as _PickingPass} from '@luma.g/core';

export {default as _ShaderModulePass} from '@luma.g/core';
export {default as _Canvas} from '@luma.g/core';

// Geometry
export {default as Geometry} from '@luma.g/core';
export {default as ConeGeometry} from '@luma.g/core';
export {default as CubeGeometry} from '@luma.g/core';
export {default as CylinderGeometry} from '@luma.g/core';
export {default as IcoSphereGeometry} from '@luma.g/core';
export {default as PlaneGeometry} from '@luma.g/core';
export {default as SphereGeometry} from '@luma.g/core';
export {default as TruncatedConeGeometry} from '@luma.g/core';

// Models
export {default as Cone} from '@luma.g/core';
export {default as Cube} from '@luma.g/core';
export {default as Cylinder} from '@luma.g/core';
export {default as IcoSphere} from '@luma.g/core';
export {default as Plane} from '@luma.g/core';
export {default as Sphere} from '@luma.g/core';
export {default as TruncatedCone} from '@luma.g/core';

export {default as ClipSpace} from '@luma.g/core';

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
} from '@luma.g/core';

// lighting
export {
  DirectionalLight,
  AmbientLight,
  PointLight
} from '@luma.g/core';

// material
export {default as PhongMaterial} from '@luma.g/core';

// shadertools
export {
  setDefaultShaderModules,
  registerShaderModules
} from '@luma.g/shadertools';
export {assembleShaders} from '@luma.g/shadertools';
export {normalizeShaderModule} from '@luma.g/shadertools';

// shader modules
export {default as fp32} from '@luma.g/shadertools';
export {default as fp64} from '@luma.g/shadertools';
export {default as project} from '@luma.g/shadertools';
export {default as lighting} from '@luma.g/shadertools';
export {default as dirlight} from '@luma.g/shadertools';
export {default as picking} from '@luma.g/shadertools';
export {default as diffuse} from '@luma.g/shadertools';

export {default as phonglighting} from '@luma.g/shadertools';
export {default as pbr} from '@luma.g/shadertools';

// UTILS - mainly for sub-modules
export {default as assert} from '@luma.g/shadertools';
export {default as log} from '@luma.g/shadertools';
export {global, window, document, self} from '@luma.g/shadertools';
export {default as isBrowser} from '@luma.g/shadertools';
export {default as isOldIE} from '@luma.g/shadertools';
export {stubRemovedMethods} from '@luma.g/shadertools';
