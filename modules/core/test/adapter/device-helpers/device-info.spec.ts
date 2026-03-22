// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {getTestDevices, getWebGLTestDevice} from '@luma.gl/test-utils';
import {DeviceFeature} from '@luma.gl/core';

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
  maxInterStageShaderVariables: true,
  maxComputeWorkgroupStorageSize: true,
  maxComputeInvocationsPerWorkgroup: true,
  maxComputeWorkgroupSizeX: true,
  maxComputeWorkgroupSizeY: true,
  maxComputeWorkgroupSizeZ: true,
  maxComputeWorkgroupsPerDimension: true
};

// TODO - we are not actually testing any features
const WEBGL2_ALWAYS_FEATURES: DeviceFeature[] = [];
const WEBGL2_NEVER_FEATURES: DeviceFeature[] = [];

test('Device#info (unknown)', async t => {
  for (const testDevice of await getTestDevices()) {
    t.ok(testDevice.info.type);
    // TODO check all info fields
  }
  t.end();
});

test('Device#limits (WebGPU style limits)', async t => {
  for (const testDevice of await getTestDevices()) {
    for (const [limit, numeric] of Object.entries(DEVICE_LIMITS)) {
      const actual = testDevice.limits[limit as keyof typeof DEVICE_LIMITS];
      if (numeric) {
        t.ok(Number.isFinite(actual), `device.limits.${limit} returns a number: ${actual}`);
      } else {
        t.ok(actual !== undefined, `device.limits.${limit} returns a value: ${actual}`);
      }
    }
  }
  t.end();
});

test('Device#features (unknown features)', async t => {
  const webglDevice = await getWebGLTestDevice();

  // @ts-expect-error
  t.notOk(webglDevice.features.has('unknown'), 'features.has should return false');
  // @ts-expect-error
  t.notOk(webglDevice.features.has(''), 'features.has should return false');
  t.end();
});

test('Device#hasFeatures (WebGL)', async t => {
  const webglDevice = await getWebGLTestDevice();

  for (const feature of WEBGL2_ALWAYS_FEATURES) {
    t.equal(webglDevice.features.has(feature), true, `${feature} is always supported under WebGL`);
  }

  for (const feature of WEBGL2_NEVER_FEATURES) {
    t.equal(webglDevice.features.has(feature), false, `${feature} is never supported under WebGL`);
  }
  t.end();
});
