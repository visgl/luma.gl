// luma.gl, MIT license
import GL from '@luma.gl/constants';
import type {WebGPUDeviceLimits} from './device-types';
import {getWebGL2Context} from '../context/webgl-checks';

/** Populate a WebGPU style device limits */
export function getDeviceLimits(gl: WebGLRenderingContext): WebGPUDeviceLimits {
  const gl2: WebGL2RenderingContext = getWebGL2Context(gl);
  return {
    maxTextureDimension1D: 0, // WebGL does not support 1D textures
    maxTextureDimension2D: gl.getParameter(GL.MAX_TEXTURE_SIZE),
    maxTextureDimension3D: gl2 ? gl2.getParameter(GL.MAX_3D_TEXTURE_SIZE) : 0,
    maxTextureArrayLayers: gl2 ? gl2.getParameter(GL.MAX_ARRAY_TEXTURE_LAYERS) : 0,
    maxBindGroups: 1, // TBD
    maxDynamicUniformBuffersPerPipelineLayout: 0, // TBD
    maxDynamicStorageBuffersPerPipelineLayout: 0, // TBD
    maxSampledTexturesPerShaderStage: gl.getParameter(GL.MAX_VERTEX_TEXTURE_IMAGE_UNITS), // TBD
    maxSamplersPerShaderStage: gl.getParameter(GL.MAX_COMBINED_TEXTURE_IMAGE_UNITS),
    maxStorageBuffersPerShaderStage: 0, // TBD
    maxStorageTexturesPerShaderStage: 0, // TBD
    maxUniformBuffersPerShaderStage: gl2 ? gl2.getParameter(GL.MAX_UNIFORM_BUFFER_BINDINGS) : 0,
    maxUniformBufferBindingSize: gl2 ? gl2.getParameter(GL.MAX_UNIFORM_BLOCK_SIZE) : 0,
    maxStorageBufferBindingSize: 0,
    minUniformBufferOffsetAlignment: gl2 ? gl2.getParameter(GL.UNIFORM_BUFFER_OFFSET_ALIGNMENT) : 0,
    minStorageBufferOffsetAlignment: 0, // TBD
    maxVertexBuffers: 0,
    maxVertexAttributes: gl.getParameter(GL.MAX_VERTEX_ATTRIBS),
    maxVertexBufferArrayStride: 2048, // TBD, this is just the default value from WebGPU
    maxInterStageShaderComponents: gl2 ? gl2.getParameter(GL.MAX_VARYING_COMPONENTS) : 0,
    maxComputeWorkgroupStorageSize: 0, // WebGL does not support compute shaders
    maxComputeInvocationsPerWorkgroup: 0, // WebGL does not support compute shaders
    maxComputeWorkgroupSizeX: 0, // WebGL does not support compute shaders
    maxComputeWorkgroupSizeY: 0, // WebGL does not support compute shaders
    maxComputeWorkgroupSizeZ: 0, // WebGL does not support compute shaders
    maxComputeWorkgroupsPerDimension: 0, // WebGL does not support compute shaders
  }
}
