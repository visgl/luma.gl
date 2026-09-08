// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
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

it('Device#info (unknown)', async () => {
  for (const testDevice of await getTestDevices()) {
    expect(Boolean(testDevice.info.type), '').toBe(true);
    // TODO check all info fields
  }
  void 0;
});

it('Device#limits (WebGPU style limits)', async () => {
  for (const testDevice of await getTestDevices()) {
    for (const [limit, numeric] of Object.entries(DEVICE_LIMITS)) {
      const actual = testDevice.limits[limit as keyof typeof DEVICE_LIMITS];
      if (numeric) {
        expect(
          Boolean(Number.isFinite(actual)),
          `device.limits.${limit} returns a number: ${actual}`
        ).toBe(true);
      } else {
        expect(
          Boolean(actual !== undefined),
          `device.limits.${limit} returns a value: ${actual}`
        ).toBe(true);
      }
    }
  }
  void 0;
});

it('Device#features (unknown features)', async () => {
  const webglDevice = await getWebGLTestDevice();

  // @ts-expect-error
  expect(Boolean(webglDevice.features.has('unknown')), 'features.has should return false').toBe(
    false
  );
  // @ts-expect-error
  expect(Boolean(webglDevice.features.has('')), 'features.has should return false').toBe(false);
  void 0;
});

it('isHTMLInCanvasSupported checks canvas proposal APIs', () => {
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
  expect(
    Boolean(isHTMLInCanvasSupported()),
    'layoutSubtree and requestPaint enable HTML-in-Canvas'
  ).toBe(true);

  setHTMLCanvasElement(class {} as unknown as typeof HTMLCanvasElement);
  expect(Boolean(isHTMLInCanvasSupported()), 'missing proposal APIs disable HTML-in-Canvas').toBe(
    false
  );

  setHTMLCanvasElement(originalHTMLCanvasElement);
  void 0;
});

it('Device#hasFeatures (WebGL)', async () => {
  const webglDevice = await getWebGLTestDevice();

  for (const feature of WEBGL2_ALWAYS_FEATURES) {
    expect(webglDevice.features.has(feature), `${feature} is always supported under WebGL`).toBe(
      true
    );
  }

  for (const feature of WEBGL2_NEVER_FEATURES) {
    expect(webglDevice.features.has(feature), `${feature} is never supported under WebGL`).toBe(
      false
    );
  }
  void 0;
});
