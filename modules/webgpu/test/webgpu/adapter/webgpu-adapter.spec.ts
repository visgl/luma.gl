// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {
  getEffectiveWebGPUFeatureLevel,
  getRequiredWebGPUFeatures,
  getRequiredWebGPULimits,
  getWebGPUFeatureLevel,
  getWebGPURequestAdapterOptions
} from '../../../src/adapter/webgpu-adapter';
import {isHighDynamicRangeCanvasConfiguration} from '../../../src/adapter/webgpu-canvas-context';

it('WebGPUAdapter imports from the ESM package entry without circular init errors', async () => {
  void 0;

  // Import the local entry file directly to avoid workspace alias resolution mixing src/dist modules.
  // This regression is about entry-module initialization, not package alias behavior.
  const webgpuModule = await import('../../../src/index');

  expect(webgpuModule.webgpuAdapter.type, 'exports a WebGPU adapter instance').toBe('webgpu');
  expect(webgpuModule.WebGPUDevice.name, 'exports the WebGPU device class').toBe('WebGPUDevice');
});

it('getRequiredWebGPULimits reads non-enumerable supported limits directly', () => {
  const supportedLimits = {} as GPUSupportedLimits;
  Object.defineProperties(supportedLimits, {
    maxBufferSize: {value: 4096, enumerable: false},
    maxStorageBufferBindingSize: {value: 2048, enumerable: false}
  });

  const requiredLimits = getRequiredWebGPULimits(supportedLimits);

  expect(Object.keys(supportedLimits), 'the test limits are not enumerable').toEqual([]);
  expect(requiredLimits.maxBufferSize, 'buffer size is still requested').toBe(4096);
  expect(
    requiredLimits.maxStorageBufferBindingSize,
    'storage binding size is still requested'
  ).toBe(2048);
  void 0;
});

it('WebGPUAdapter feature level helpers map luma props to WebGPU requests', () => {
  expect(getWebGPUFeatureLevel({}), 'defaults to core').toBe('core');
  expect(getWebGPUFeatureLevel({featureLevel: 'max'}), 'explicit level is returned').toBe('max');
  expect(
    getWebGPUFeatureLevel({featureLevel: 'compatibility'}),
    'compatibility level is returned'
  ).toBe('compatibility');
  expect(
    getWebGPUFeatureLevel({featureLevel: 'best-available'}),
    'best available level is returned'
  ).toBe('best-available');

  expect(
    getWebGPURequestAdapterOptions({powerPreference: 'default'}),
    'core requests core and omits default power preference'
  ).toEqual({featureLevel: 'core'});
  expect(
    getWebGPURequestAdapterOptions({featureLevel: 'max', powerPreference: 'low-power'}),
    'max requests a core adapter'
  ).toEqual({featureLevel: 'core', powerPreference: 'low-power'});
  expect(
    getWebGPURequestAdapterOptions({featureLevel: 'compatibility'}),
    'compatibility requests a compatibility adapter'
  ).toEqual({featureLevel: 'compatibility'});
  expect(
    getWebGPURequestAdapterOptions({featureLevel: 'best-available'}),
    'best available starts from a compatibility adapter'
  ).toEqual({featureLevel: 'compatibility'});

  void 0;
});

it('WebGPUAdapter feature helpers keep requested profiles separate', () => {
  const coreFeatures = new Set([
    'core-features-and-limits',
    'texture-compression-bc'
  ]) as GPUSupportedFeatures;
  const compatibilityFeatures = new Set(['texture-compression-bc']) as GPUSupportedFeatures;

  expect(
    getRequiredWebGPUFeatures(coreFeatures, 'core'),
    'core does not request optional features'
  ).toEqual([]);
  expect(
    getRequiredWebGPUFeatures(coreFeatures, 'core', [
      'subgroups',
      'texture-compression-bc',
      'subgroups'
    ]),
    'core requests supported targeted features and ignores unsupported or duplicate entries'
  ).toEqual(['texture-compression-bc']);
  expect(
    getRequiredWebGPUFeatures(coreFeatures, 'max'),
    'max requests all adapter features'
  ).toEqual(['core-features-and-limits', 'texture-compression-bc']);
  expect(
    getRequiredWebGPUFeatures(coreFeatures, 'compatibility'),
    'compatibility does not opt into core'
  ).toEqual([]);
  expect(
    getRequiredWebGPUFeatures(coreFeatures, 'best-available'),
    'best available opts into core when exposed'
  ).toEqual(['core-features-and-limits']);
  expect(
    getRequiredWebGPUFeatures(compatibilityFeatures, 'best-available'),
    'best available stays compatibility when core is unavailable'
  ).toEqual([]);

  expect(
    getEffectiveWebGPUFeatureLevel('compatibility', compatibilityFeatures),
    'compatibility reports compatibility without the core feature'
  ).toBe('compatibility');
  expect(
    getEffectiveWebGPUFeatureLevel('compatibility', coreFeatures),
    'the created device feature identifies an upgraded core device'
  ).toBe('core');
  expect(
    getEffectiveWebGPUFeatureLevel('best-available', coreFeatures),
    'best available reports core after opting in'
  ).toBe('core');
  expect(
    getEffectiveWebGPUFeatureLevel('best-available', compatibilityFeatures),
    'best available reports compatibility when core is unavailable'
  ).toBe('compatibility');

  void 0;
});

it('isHighDynamicRangeCanvasConfiguration verifies accepted HDR presentation', () => {
  const standardConfiguration = {
    format: 'rgba16float',
    toneMapping: {mode: 'standard'}
  } as GPUCanvasConfigurationOut;
  const highDynamicRangeConfiguration = {
    format: 'rgba16float',
    toneMapping: {mode: 'extended'}
  } as GPUCanvasConfigurationOut;

  expect(
    isHighDynamicRangeCanvasConfiguration(standardConfiguration),
    'floating-point presentation without extended tone mapping is not HDR'
  ).toBe(false);
  expect(
    isHighDynamicRangeCanvasConfiguration(highDynamicRangeConfiguration),
    'floating-point presentation with extended tone mapping is HDR'
  ).toBe(true);
  expect(
    isHighDynamicRangeCanvasConfiguration(null),
    'an unavailable configuration cannot verify HDR support'
  ).toBe(false);
  void 0;
});
