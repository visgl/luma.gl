import test from 'tape-promise/tape';
import GL from '@luma.gl/constants';
import {getTestDevices, getWebGLTestDevices} from '@luma.gl/test-utils';

const DEVICE_LIMITS = {
  maxTextureDimension1D: true,
  maxTextureDimension2D: true,
  maxTextureDimension3D: true,
  maxTextureArrayLayers: true,
  maxBindGroups: true,
  maxDynamicUniformBuffersPerPipelineLayout: true,
  maxDynamicStorageBuffersPerPipelineLayout: true,
  maxSampledTexturesPerShaderStage: true,
  maxSamplersPerShaderStage: true,
  maxStorageBuffersPerShaderStage: true,
  maxStorageTexturesPerShaderStage: true,
  maxUniformBuffersPerShaderStage: true,
  maxUniformBufferBindingSize: true,
  maxStorageBufferBindingSize: true,
  minUniformBufferOffsetAlignment: true,
  minStorageBufferOffsetAlignment: true,
  maxVertexBuffers: true,
  maxVertexAttributes: true,
  maxVertexBufferArrayStride: true,
  maxInterStageShaderComponents: true,
  maxComputeWorkgroupStorageSize: true,
  maxComputeInvocationsPerWorkgroup: true,
  maxComputeWorkgroupSizeX: true,
  maxComputeWorkgroupSizeY: true,
  maxComputeWorkgroupSizeZ: true,
  maxComputeWorkgroupsPerDimension: true
};

/** WebGL context limits */
export const WEBGL_LIMITS = {
  [GL.ALIASED_LINE_WIDTH_RANGE]: false,
  [GL.ALIASED_POINT_SIZE_RANGE]: false,
  [GL.MAX_TEXTURE_SIZE]: true,
  [GL.MAX_CUBE_MAP_TEXTURE_SIZE]: true,
  [GL.MAX_TEXTURE_IMAGE_UNITS]: true,
  [GL.MAX_COMBINED_TEXTURE_IMAGE_UNITS]: true,
  [GL.MAX_VERTEX_TEXTURE_IMAGE_UNITS]: true,
  [GL.MAX_RENDERBUFFER_SIZE]: true,
  [GL.MAX_VARYING_VECTORS]: true,
  [GL.MAX_VERTEX_ATTRIBS]: true,
  [GL.MAX_VERTEX_UNIFORM_VECTORS]: true,
  [GL.MAX_FRAGMENT_UNIFORM_VECTORS]: true,
  [GL.MAX_VIEWPORT_DIMS]: false,

  // Extensions
  // [GL.MAX_TEXTURE_MAX_ANISOTROPY_EXT]: true,

  // WebGL2 Limits
  [GL.MAX_3D_TEXTURE_SIZE]: true,
  [GL.MAX_ARRAY_TEXTURE_LAYERS]: true,
  [GL.MAX_CLIENT_WAIT_TIMEOUT_WEBGL]: true,
  [GL.MAX_COLOR_ATTACHMENTS]: true,
  [GL.MAX_COMBINED_FRAGMENT_UNIFORM_COMPONENTS]: true,
  [GL.MAX_COMBINED_UNIFORM_BLOCKS]: true,
  [GL.MAX_COMBINED_VERTEX_UNIFORM_COMPONENTS]: true,
  [GL.MAX_DRAW_BUFFERS]: true,
  [GL.MAX_ELEMENT_INDEX]: true,
  [GL.MAX_ELEMENTS_INDICES]: true,
  [GL.MAX_ELEMENTS_VERTICES]: true,
  [GL.MAX_FRAGMENT_INPUT_COMPONENTS]: true,
  [GL.MAX_FRAGMENT_UNIFORM_BLOCKS]: true,
  [GL.MAX_FRAGMENT_UNIFORM_COMPONENTS]: true,
  [GL.MAX_SAMPLES]: true,
  [GL.MAX_SERVER_WAIT_TIMEOUT]: true,
  [GL.MAX_TEXTURE_LOD_BIAS]: true,
  [GL.MAX_TRANSFORM_FEEDBACK_INTERLEAVED_COMPONENTS]: true,
  [GL.MAX_TRANSFORM_FEEDBACK_SEPARATE_ATTRIBS]: true,
  [GL.MAX_TRANSFORM_FEEDBACK_SEPARATE_COMPONENTS]: true,
  [GL.MAX_UNIFORM_BLOCK_SIZE]: true,
  [GL.MAX_UNIFORM_BUFFER_BINDINGS]: true,
  [GL.MAX_VARYING_COMPONENTS]: true,
  [GL.MAX_VERTEX_OUTPUT_COMPONENTS]: true,
  [GL.MAX_VERTEX_UNIFORM_BLOCKS]: true,
  [GL.MAX_VERTEX_UNIFORM_COMPONENTS]: true,
  [GL.MIN_PROGRAM_TEXEL_OFFSET]: true,
  [GL.MAX_PROGRAM_TEXEL_OFFSET]: true,
  [GL.UNIFORM_BUFFER_OFFSET_ALIGNMENT]: true
};

test('WebGLDevice#limits (WebGPU style limits)', async (t) => {
  for (const testDevice of await getTestDevices()) {
    for (const [limit, numeric] of Object.entries(DEVICE_LIMITS)) {
      const actual = testDevice.limits[limit];
      if (numeric) {
        t.ok(Number.isFinite(actual), `device.limits.${limit} returns a number: ${actual}`);
      } else {
        t.ok(actual !== undefined, `device.limits.${limit} returns a value: ${actual}`);
      }
    }
  }
  t.end();
});

test('WebGLDevice#webglLimits (WebGL style limits)', async (t) => {
  for (const testDevice of getWebGLTestDevices()) {
    for (const [limit, numeric] of Object.entries(WEBGL_LIMITS)) {
      const actual = testDevice.webglLimits[limit];
      if (numeric) {
        t.ok(
          Number.isFinite(actual),
          `device.limits[${testDevice.getGLKey(limit)}] returns a number: ${actual}`
        );
      } else {
        t.ok(actual !== undefined, `device.limits.${limit} returns a value: ${actual}`);
      }
    }
  }
  t.end();
});
