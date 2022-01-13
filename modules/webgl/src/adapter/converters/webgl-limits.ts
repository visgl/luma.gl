import {DeviceLimits} from '@luma.gl/api';

export function getWebGLLimits(gl: WebGLRenderingContext, gl2: WebGL2RenderingContext): DeviceLimits {
  return {
    maxTextureDimension1D: 0,
    maxTextureDimension2D: gl.getParameter(gl.MAX_TEXTURE_SIZE),
    maxTextureDimension3D: gl2 ? gl.getParameter(gl2.MAX_3D_TEXTURE_SIZE) : 0,
    maxTextureArrayLayers: gl2 ? gl.getParameter(gl2.MAX_ARRAY_TEXTURE_LAYERS) : 0,
    maxBindGroups: 0,
    maxDynamicUniformBuffersPerPipelineLayout: 0,
    maxDynamicStorageBuffersPerPipelineLayout: 0,
    maxSampledTexturesPerShaderStage: gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS),
    maxSamplersPerShaderStage: gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS),
    maxStorageBuffersPerShaderStage: 0,
    maxStorageTexturesPerShaderStage: 0,
    maxUniformBuffersPerShaderStage: gl2 ? gl2.getParameter(gl2.MAX_UNIFORM_BUFFER_BINDINGS) : 0,
    maxUniformBufferBindingSize: gl2 ? gl2.getParameter(gl2.MAX_UNIFORM_BLOCK_SIZE) : 0,
    maxStorageBufferBindingSize: 0,
    minUniformBufferOffsetAlignment: gl2 ? gl2.getParameter(gl2.UNIFORM_BUFFER_OFFSET_ALIGNMENT) : 0,
    minStorageBufferOffsetAlignment: 0,
    maxVertexBuffers: 0,
    maxVertexAttributes: gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
    maxVertexBufferArrayStride: 2048, // TBD
    maxInterStageShaderComponents: 0,
    maxComputeWorkgroupStorageSize: 0,
    maxComputeInvocationsPerWorkgroup: 0,
    maxComputeWorkgroupSizeX: 0,
    maxComputeWorkgroupSizeY: 0,
    maxComputeWorkgroupSizeZ: 0,
    maxComputeWorkgroupsPerDimension: 0
  };
}

/*
  [GL.ALIASED_LINE_WIDTH_RANGE]: {gl1: new Float32Array([1, 1])},
  [GL.ALIASED_POINT_SIZE_RANGE]: {gl1: new Float32Array([1, 1])},
  [GL.MAX_TEXTURE_SIZE]: {gl1: 64, gl2: 2048}, // GLint
  [GL.MAX_CUBE_MAP_TEXTURE_SIZE]: {gl1: 16}, // GLint
  [GL.MAX_TEXTURE_IMAGE_UNITS]: {gl1: 8}, // GLint
  [GL.MAX_COMBINED_TEXTURE_IMAGE_UNITS]: {gl1: 8}, // GLint
  [GL.MAX_VERTEX_TEXTURE_IMAGE_UNITS]: {gl1: 0}, // GLint
  [GL.MAX_RENDERBUFFER_SIZE]: {gl1: 1}, // GLint
  [GL.MAX_VARYING_VECTORS]: {gl1: 8}, // GLint
  [GL.MAX_VERTEX_ATTRIBS]: {gl1: 8}, // GLint
  [GL.MAX_VERTEX_UNIFORM_VECTORS]: {gl1: 128}, // GLint
  [GL.MAX_FRAGMENT_UNIFORM_VECTORS]: {gl1: 16}, // GLint
  [GL.MAX_VIEWPORT_DIMS]: {gl1: new Int32Array([0, 0])},

  // Extensions
  // [GL.MAX_TEXTURE_MAX_ANISOTROPY_EXT]: {gl1: 1.0, extension: 'EXT_texture_filter_anisotropic'},

  // WebGL2 Limits
  [GL.MAX_3D_TEXTURE_SIZE]: {gl1: 0, gl2: 256}, //  GLint
  [GL.MAX_ARRAY_TEXTURE_LAYERS]: {gl1: 0, gl2: 256}, // GLint
  [GL.MAX_CLIENT_WAIT_TIMEOUT_WEBGL]: {gl1: 0, gl2: 0}, //  GLint64
  [GL.MAX_COLOR_ATTACHMENTS]: {gl1: 0, gl2: 4}, //  GLint
  [GL.MAX_COMBINED_FRAGMENT_UNIFORM_COMPONENTS]: {gl1: 0, gl2: 0}, // GLint64
  [GL.MAX_COMBINED_UNIFORM_BLOCKS]: {gl1: 0, gl2: 0}, //  GLint
  [GL.MAX_COMBINED_VERTEX_UNIFORM_COMPONENTS]: {gl1: 0, gl2: 0}, // GLint64
  [GL.MAX_DRAW_BUFFERS]: {gl1: 0, gl2: 4}, // GLint
  [GL.MAX_ELEMENT_INDEX]: {gl1: 0, gl2: 0}, //  GLint64
  [GL.MAX_ELEMENTS_INDICES]: {gl1: 0, gl2: 0}, // GLint
  [GL.MAX_ELEMENTS_VERTICES]: {gl1: 0, gl2: 0}, //  GLint
  [GL.MAX_FRAGMENT_INPUT_COMPONENTS]: {gl1: 0, gl2: 0}, //  GLint
  [GL.MAX_FRAGMENT_UNIFORM_BLOCKS]: {gl1: 0, gl2: 0}, //  GLint
  [GL.MAX_FRAGMENT_UNIFORM_COMPONENTS]: {gl1: 0, gl2: 0}, //  GLint
  [GL.MAX_SAMPLES]: {gl1: 0, gl2: 0}, //  GLint
  [GL.MAX_SERVER_WAIT_TIMEOUT]: {gl1: 0, gl2: 0}, //  GLint64
  [GL.MAX_TEXTURE_LOD_BIAS]: {gl1: 0, gl2: 0}, // GLfloat
  [GL.MAX_TRANSFORM_FEEDBACK_INTERLEAVED_COMPONENTS]: {gl1: 0, gl2: 0}, //  GLint
  [GL.MAX_TRANSFORM_FEEDBACK_SEPARATE_ATTRIBS]: {gl1: 0, gl2: 0}, //  GLint
  [GL.MAX_TRANSFORM_FEEDBACK_SEPARATE_COMPONENTS]: {gl1: 0, gl2: 0}, // GLint
  [GL.MAX_UNIFORM_BLOCK_SIZE]: {gl1: 0, gl2: 0}, // GLint64
  [GL.MAX_UNIFORM_BUFFER_BINDINGS]: {gl1: 0, gl2: 0}, //  GLint
  [GL.MAX_VARYING_COMPONENTS]: {gl1: 0, gl2: 0}, // GLint
  [GL.MAX_VERTEX_OUTPUT_COMPONENTS]: {gl1: 0, gl2: 0}, // GLint
  [GL.MAX_VERTEX_UNIFORM_BLOCKS]: {gl1: 0, gl2: 0}, //  GLint
  [GL.MAX_VERTEX_UNIFORM_COMPONENTS]: {gl1: 0, gl2: 0}, //  GLint
  [GL.MIN_PROGRAM_TEXEL_OFFSET]: {gl1: 0, gl2: -8, negative: true}, // GLint
  [GL.MAX_PROGRAM_TEXEL_OFFSET]: {gl1: 0, gl2: 7}, // GLint
  [GL.UNIFORM_BUFFER_OFFSET_ALIGNMENT]: {gl1: 0, gl2: 0} // GLint
*/