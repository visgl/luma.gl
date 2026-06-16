// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {getTestDevices, getWebGLTestDevice} from '@luma.gl/test-utils';
import {DeviceFeature, isHTMLInCanvasSupported} from '@luma.gl/core';

const DEVICE_LIMITS = {
  maxTextureDimension1D: true,
  maxTextureDimension2D: true,
  maxTextureDimension3D: true,
  maxTextureArrayLayers: true,
  maxBindGroups: true,
  maxBindGroupsPlusVertexBuffers: true,
  maxBindingsPerBindGroup: true,
  maxDynamicUniformBuffersPerPipelineLayout: true,
  maxDynamicStorageBuffersPerPipelineLayout: true,
  maxSampledTexturesPerShaderStage: true,
  maxSamplersPerShaderStage: true,
  maxStorageBuffersPerShaderStage: true,
  maxStorageBuffersInVertexStage: true,
  maxStorageBuffersInFragmentStage: true,
  maxStorageTexturesPerShaderStage: true,
  maxStorageTexturesInVertexStage: true,
  maxStorageTexturesInFragmentStage: true,
  maxUniformBuffersPerShaderStage: true,
  maxUniformBufferBindingSize: true,
  maxStorageBufferBindingSize: true,
  maxBufferSize: true,
  minUniformBufferOffsetAlignment: true,
  minStorageBufferOffsetAlignment: true,
  maxVertexBuffers: true,
  maxVertexAttributes: true,
  maxVertexBufferArrayStride: true,
  maxInterStageShaderVariables: true,
  maxColorAttachments: true,
  maxColorAttachmentBytesPerSample: true,
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

test('isHTMLInCanvasSupported checks canvas proposal APIs', t => {
  const originalHTMLCanvasElement = globalThis.HTMLCanvasElement;
  const setHTMLCanvasElement = (HTMLCanvasElement_: typeof HTMLCanvasElement | undefined) => {
    if (HTMLCanvasElement_) {
      Object.defineProperty(globalThis, 'HTMLCanvasElement', {
        configurable: true,
        value: HTMLCanvasElement_
      });
    } else {
      Reflect.deleteProperty(globalThis, 'HTMLCanvasElement');
    }
  };

  class SupportedHTMLCanvasElement {}
  Object.defineProperties(SupportedHTMLCanvasElement.prototype, {
    layoutSubtree: {configurable: true, value: false},
    requestPaint: {configurable: true, value: () => {}}
  });

  setHTMLCanvasElement(SupportedHTMLCanvasElement as unknown as typeof HTMLCanvasElement);
  t.ok(isHTMLInCanvasSupported(), 'layoutSubtree and requestPaint enable HTML-in-Canvas');

  setHTMLCanvasElement(class {} as unknown as typeof HTMLCanvasElement);
  t.notOk(isHTMLInCanvasSupported(), 'missing proposal APIs disable HTML-in-Canvas');

  setHTMLCanvasElement(originalHTMLCanvasElement);
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
