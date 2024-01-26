// luma.gl, MIT license
// Copyright (c) vis.gl contributors

import type {DeviceLimits} from '@luma.gl/core';
import {GL} from '@luma.gl/constants';

/** Populate a WebGPU style device limits */
export function getDeviceLimits(gl: WebGL2RenderingContext): DeviceLimits {
  return {
    maxTextureDimension1D: 0, // WebGL does not support 1D textures
    maxTextureDimension2D: gl.getParameter(GL.MAX_TEXTURE_SIZE),
    maxTextureDimension3D: gl.getParameter(GL.MAX_3D_TEXTURE_SIZE),
    maxTextureArrayLayers: gl.getParameter(GL.MAX_ARRAY_TEXTURE_LAYERS),
    maxBindGroups: 1, // TBD - if we emulate bind groups we could support any number...
    maxDynamicUniformBuffersPerPipelineLayout: 0, // TBD
    maxDynamicStorageBuffersPerPipelineLayout: 0, // TBD
    maxSampledTexturesPerShaderStage: gl.getParameter(GL.MAX_VERTEX_TEXTURE_IMAGE_UNITS), // TBD
    maxSamplersPerShaderStage: gl.getParameter(GL.MAX_COMBINED_TEXTURE_IMAGE_UNITS),
    maxStorageBuffersPerShaderStage: 0, // TBD
    maxStorageTexturesPerShaderStage: 0, // TBD
    maxUniformBuffersPerShaderStage: gl.getParameter(GL.MAX_UNIFORM_BUFFER_BINDINGS),
    maxUniformBufferBindingSize: gl.getParameter(GL.MAX_UNIFORM_BLOCK_SIZE),
    maxStorageBufferBindingSize: 0,
    minUniformBufferOffsetAlignment: gl.getParameter(GL.UNIFORM_BUFFER_OFFSET_ALIGNMENT),
    minStorageBufferOffsetAlignment: 0, // TBD
    maxVertexBuffers: 0,
    maxVertexAttributes: gl.getParameter(GL.MAX_VERTEX_ATTRIBS),
    maxVertexBufferArrayStride: 2048, // TBD, this is just the default value from WebGPU
    maxInterStageShaderComponents: gl.getParameter(GL.MAX_VARYING_COMPONENTS),
    maxComputeWorkgroupStorageSize: 0, // WebGL does not support compute shaders
    maxComputeInvocationsPerWorkgroup: 0, // WebGL does not support compute shaders
    maxComputeWorkgroupSizeX: 0, // WebGL does not support compute shaders
    maxComputeWorkgroupSizeY: 0, // WebGL does not support compute shaders
    maxComputeWorkgroupSizeZ: 0, // WebGL does not support compute shaders
    maxComputeWorkgroupsPerDimension: 0 // WebGL does not support compute shaders
  };
}

/** WebGL context limits */
export type WebGLLimits = {
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
  // [GL.MAX_CLIENT_WAIT_TIMEOUT_WEBGL]: number;
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
  // [GL.MAX_SERVER_WAIT_TIMEOUT]: number;
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

export function getWebGLLimits(gl: WebGL2RenderingContext): WebGLLimits {
  function get<T = number>(pname: number): T {
    return gl.getParameter(pname) as T;
  }
  function get2(pname: number, defaultValue?: number): number;
  function get2<T>(pname: number, defaultValue: T): T;
  function get2<T>(pname: number, defaultValue: T): T {
    return (gl.getParameter(pname) as T) || defaultValue;
  }
  // function getMaxAnistropy() {
  //   const extension = gl.getExtension('EXT_texture_filter_anisotropic');
  // }
  return {
    [GL.ALIASED_LINE_WIDTH_RANGE]: get(GL.ALIASED_LINE_WIDTH_RANGE),
    [GL.ALIASED_POINT_SIZE_RANGE]: get(GL.ALIASED_POINT_SIZE_RANGE),
    [GL.MAX_TEXTURE_SIZE]: get(GL.MAX_TEXTURE_SIZE),
    [GL.MAX_CUBE_MAP_TEXTURE_SIZE]: get(GL.MAX_CUBE_MAP_TEXTURE_SIZE), // GLint
    [GL.MAX_TEXTURE_IMAGE_UNITS]: get(GL.MAX_TEXTURE_IMAGE_UNITS), // GLint
    [GL.MAX_COMBINED_TEXTURE_IMAGE_UNITS]: get(GL.MAX_COMBINED_TEXTURE_IMAGE_UNITS), // GLint
    [GL.MAX_VERTEX_TEXTURE_IMAGE_UNITS]: get(GL.MAX_VERTEX_TEXTURE_IMAGE_UNITS), // GLint
    [GL.MAX_RENDERBUFFER_SIZE]: get(GL.MAX_RENDERBUFFER_SIZE), // GLint
    [GL.MAX_VARYING_VECTORS]: get(GL.MAX_VARYING_VECTORS), // GLint
    [GL.MAX_VERTEX_ATTRIBS]: get(GL.MAX_VERTEX_ATTRIBS), // GLint
    [GL.MAX_VERTEX_UNIFORM_VECTORS]: get(GL.MAX_VERTEX_UNIFORM_VECTORS), // GLint
    [GL.MAX_FRAGMENT_UNIFORM_VECTORS]: get(GL.MAX_FRAGMENT_UNIFORM_VECTORS), // GLint
    [GL.MAX_VIEWPORT_DIMS]: get(GL.MAX_VIEWPORT_DIMS),

    // Extensions
    [GL.MAX_TEXTURE_MAX_ANISOTROPY_EXT]: get(GL.MAX_TEXTURE_MAX_ANISOTROPY_EXT), // getMaxAnistropy(),

    // WebGL2 Limits
    [GL.MAX_3D_TEXTURE_SIZE]: get2(GL.MAX_3D_TEXTURE_SIZE), //  GLint
    [GL.MAX_ARRAY_TEXTURE_LAYERS]: get2(GL.MAX_ARRAY_TEXTURE_LAYERS), // GLint
    // [GL.MAX_CLIENT_WAIT_TIMEOUT_WEBGL]: get2(GL.MAX_CLIENT_WAIT_TIMEOUT_WEBGL), //  GLint64
    [GL.MAX_COLOR_ATTACHMENTS]: get2(GL.MAX_COLOR_ATTACHMENTS), //  GLint
    [GL.MAX_COMBINED_FRAGMENT_UNIFORM_COMPONENTS]: get2(
      GL.MAX_COMBINED_FRAGMENT_UNIFORM_COMPONENTS
    ), // GLint64
    [GL.MAX_COMBINED_UNIFORM_BLOCKS]: get2(GL.MAX_COMBINED_UNIFORM_BLOCKS), //  GLint
    [GL.MAX_COMBINED_VERTEX_UNIFORM_COMPONENTS]: get2(GL.MAX_COMBINED_VERTEX_UNIFORM_COMPONENTS), // GLint64
    [GL.MAX_DRAW_BUFFERS]: get2(GL.MAX_DRAW_BUFFERS), // GLint
    [GL.MAX_ELEMENT_INDEX]: get2(GL.MAX_ELEMENT_INDEX), //  GLint64
    [GL.MAX_ELEMENTS_INDICES]: get2(GL.MAX_ELEMENTS_INDICES), // GLint
    [GL.MAX_ELEMENTS_VERTICES]: get2(GL.MAX_ELEMENTS_VERTICES), //  GLint
    [GL.MAX_FRAGMENT_INPUT_COMPONENTS]: get2(GL.MAX_FRAGMENT_INPUT_COMPONENTS), //  GLint
    [GL.MAX_FRAGMENT_UNIFORM_BLOCKS]: get2(GL.MAX_FRAGMENT_UNIFORM_BLOCKS), //  GLint
    [GL.MAX_FRAGMENT_UNIFORM_COMPONENTS]: get2(GL.MAX_FRAGMENT_UNIFORM_COMPONENTS), //  GLint
    [GL.MAX_SAMPLES]: get2(GL.MAX_SAMPLES), //  GLint
    // [GL.MAX_SERVER_WAIT_TIMEOUT]: get2(GL.MAX_SERVER_WAIT_TIMEOUT), //  GLint64
    [GL.MAX_TEXTURE_LOD_BIAS]: get2(GL.MAX_TEXTURE_LOD_BIAS), // GLfloat
    [GL.MAX_TRANSFORM_FEEDBACK_INTERLEAVED_COMPONENTS]: get2(
      GL.MAX_TRANSFORM_FEEDBACK_INTERLEAVED_COMPONENTS
    ), //  GLint
    [GL.MAX_TRANSFORM_FEEDBACK_SEPARATE_ATTRIBS]: get2(GL.MAX_TRANSFORM_FEEDBACK_SEPARATE_ATTRIBS), //  GLint
    [GL.MAX_TRANSFORM_FEEDBACK_SEPARATE_COMPONENTS]: get2(
      GL.MAX_TRANSFORM_FEEDBACK_SEPARATE_COMPONENTS
    ), // GLint
    [GL.MAX_UNIFORM_BLOCK_SIZE]: get2(GL.MAX_UNIFORM_BLOCK_SIZE), // GLint64
    [GL.MAX_UNIFORM_BUFFER_BINDINGS]: get2(GL.MAX_UNIFORM_BUFFER_BINDINGS), //  GLint
    [GL.MAX_VARYING_COMPONENTS]: get2(GL.MAX_VARYING_COMPONENTS), // GLint
    [GL.MAX_VERTEX_OUTPUT_COMPONENTS]: get2(GL.MAX_VERTEX_OUTPUT_COMPONENTS), // GLint
    [GL.MAX_VERTEX_UNIFORM_BLOCKS]: get2(GL.MAX_VERTEX_UNIFORM_BLOCKS), //  GLint
    [GL.MAX_VERTEX_UNIFORM_COMPONENTS]: get2(GL.MAX_VERTEX_UNIFORM_COMPONENTS), //  GLint
    [GL.MIN_PROGRAM_TEXEL_OFFSET]: get2(GL.MIN_PROGRAM_TEXEL_OFFSET), // GLint
    [GL.MAX_PROGRAM_TEXEL_OFFSET]: get2(GL.MAX_PROGRAM_TEXEL_OFFSET), // GLint
    [GL.UNIFORM_BUFFER_OFFSET_ALIGNMENT]: get2(GL.UNIFORM_BUFFER_OFFSET_ALIGNMENT) // GLint
  };
}
