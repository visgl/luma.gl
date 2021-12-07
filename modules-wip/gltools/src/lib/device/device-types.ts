// luma.gl, MIT license
import GL from '@luma.gl/constants';

/**
 * Identifies the GPU vendor and driver.
 * @see https://www.khronos.org/registry/webgl/extensions/WEBGL_debug_renderer_info/
 */
export type WebGLDeviceInfo = {
  type: 'webgl' | 'webgl2';
  vendor: string;
  renderer: string;
  version: string;
  shadingLanguages: string[];
  shadingLanguageVersion: string;
};

/** Limits for a device */
export type WebGPUDeviceLimits = {
  readonly maxTextureDimension1D?: number;
  readonly maxTextureDimension2D?: number;
  readonly maxTextureDimension3D?: number;
  readonly maxTextureArrayLayers?: number;
  readonly maxBindGroups: number;
  readonly maxDynamicUniformBuffersPerPipelineLayout: number;
  readonly maxDynamicStorageBuffersPerPipelineLayout: number;
  readonly maxSampledTexturesPerShaderStage: number;
  readonly maxSamplersPerShaderStage: number;
  readonly maxStorageBuffersPerShaderStage: number;
  readonly maxStorageTexturesPerShaderStage: number;
  readonly maxUniformBuffersPerShaderStage: number;
  readonly maxUniformBufferBindingSize: number;
  readonly maxStorageBufferBindingSize?: number;
  readonly minUniformBufferOffsetAlignment?: number;
  readonly minStorageBufferOffsetAlignment?: number;
  readonly maxVertexBuffers?: number;
  readonly maxVertexAttributes?: number;
  readonly maxVertexBufferArrayStride?: number;
  readonly maxInterStageShaderComponents?: number;
  readonly maxComputeWorkgroupStorageSize?: number;
  readonly maxComputeInvocationsPerWorkgroup?: number;
  readonly maxComputeWorkgroupSizeX?: number;
  readonly maxComputeWorkgroupSizeY?: number;
  readonly maxComputeWorkgroupSizeZ?: number;
  readonly maxComputeWorkgroupsPerDimension?: number;
};

/** WebGL context limits */
export type WebGLContextLimits = {
  [GL.ALIASED_LINE_WIDTH_RANGE]: [number, number];
  [GL.ALIASED_POINT_SIZE_RANGE]: [number, number];
  [GL.MAX_TEXTURE_SIZE]: number;
  [GL.MAX_CUBE_MAP_TEXTURE_SIZE]: number;
  [GL.MAX_TEXTURE_IMAGE_UNITS]: number;
  [GL.MAX_COMBINED_TEXTURE_IMAGE_UNITS]: number;
  [GL.MAX_VERTEX_TEXTURE_IMAGE_UNITS]: number;
  [GL.MAX_RENDERBUFFER_SIZE]: number;
  [GL.MAX_VARYING_VECTORS]: number;
  [GL.MAX_VERTEX_ATTRIBS]: number;
  [GL.MAX_VERTEX_UNIFORM_VECTORS]: number;
  [GL.MAX_FRAGMENT_UNIFORM_VECTORS]: number;
  [GL.MAX_VIEWPORT_DIMS]: [number, number];

  // Extensions
  [GL.MAX_TEXTURE_MAX_ANISOTROPY_EXT]: number;

  // WebGL2 Limits
  [GL.MAX_3D_TEXTURE_SIZE]: number;
  [GL.MAX_ARRAY_TEXTURE_LAYERS]: number;
  [GL.MAX_CLIENT_WAIT_TIMEOUT_WEBGL]: number;
  [GL.MAX_COLOR_ATTACHMENTS]: number;
  [GL.MAX_COMBINED_FRAGMENT_UNIFORM_COMPONENTS]: number;
  [GL.MAX_COMBINED_UNIFORM_BLOCKS]: number;
  [GL.MAX_COMBINED_VERTEX_UNIFORM_COMPONENTS]: number;
  [GL.MAX_DRAW_BUFFERS]: number;
  [GL.MAX_ELEMENT_INDEX]: number;
  [GL.MAX_ELEMENTS_INDICES]: number;
  [GL.MAX_ELEMENTS_VERTICES]: number;
  [GL.MAX_FRAGMENT_INPUT_COMPONENTS]: number;
  [GL.MAX_FRAGMENT_UNIFORM_BLOCKS]: number;
  [GL.MAX_FRAGMENT_UNIFORM_COMPONENTS]: number;
  [GL.MAX_SAMPLES]: number;
  [GL.MAX_SERVER_WAIT_TIMEOUT]: number;
  [GL.MAX_TEXTURE_LOD_BIAS]: number;
  [GL.MAX_TRANSFORM_FEEDBACK_INTERLEAVED_COMPONENTS]: number;
  [GL.MAX_TRANSFORM_FEEDBACK_SEPARATE_ATTRIBS]: number;
  [GL.MAX_TRANSFORM_FEEDBACK_SEPARATE_COMPONENTS]: number;
  [GL.MAX_UNIFORM_BLOCK_SIZE]: number;
  [GL.MAX_UNIFORM_BUFFER_BINDINGS]: number;
  [GL.MAX_VARYING_COMPONENTS]: number;
  [GL.MAX_VERTEX_OUTPUT_COMPONENTS]: number;
  [GL.MAX_VERTEX_UNIFORM_BLOCKS]: number;
  [GL.MAX_VERTEX_UNIFORM_COMPONENTS]: number;
  [GL.MIN_PROGRAM_TEXEL_OFFSET]: number;
  [GL.MAX_PROGRAM_TEXEL_OFFSET]: number;
  [GL.UNIFORM_BUFFER_OFFSET_ALIGNMENT]: number;
};
