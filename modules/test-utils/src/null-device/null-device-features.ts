// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {DeviceLimits} from '@luma.gl/core';

export class NullDeviceLimits extends DeviceLimits {
  maxTextureDimension1D = 0;
  maxTextureDimension2D = 2048;
  maxTextureDimension3D = 256;
  maxTextureArrayLayers = 256;
  maxBindGroups = 0;
  maxDynamicUniformBuffersPerPipelineLayout = 0;
  maxDynamicStorageBuffersPerPipelineLayout = 0;
  maxSampledTexturesPerShaderStage = 8;
  maxSamplersPerShaderStage = 16;
  maxStorageBuffersPerShaderStage = 0;
  maxStorageTexturesPerShaderStage = 0;
  maxUniformBuffersPerShaderStage = 20;
  maxUniformBufferBindingSize = 16384;
  maxStorageBufferBindingSize = 0;
  minUniformBufferOffsetAlignment = 0;
  minStorageBufferOffsetAlignment = 0;
  maxVertexBuffers = 16;
  maxVertexAttributes = 16;
  maxVertexBufferArrayStride = 2048;
  maxInterStageShaderComponents = 60;
  maxComputeWorkgroupStorageSize = 0;
  maxComputeInvocationsPerWorkgroup = 0;
  maxComputeWorkgroupSizeX = 0;
  maxComputeWorkgroupSizeY = 0;
  maxComputeWorkgroupSizeZ = 0;
  maxComputeWorkgroupsPerDimension = 0;
}
