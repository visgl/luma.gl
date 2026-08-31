// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {DeviceFeatures, _getTextureFormatTable, type TextureFormat} from '@luma.gl/core';
import {getWebGPUTextureFormatCapabilities} from '../../src/adapter/helpers/webgpu-texture-capabilities';

it('WebGPU texture capabilities require the matching optional features', () => {
  const baselineFeatures = new DeviceFeatures([], {});
  const optionalFeatures = new DeviceFeatures(
    ['bgra8unorm-storage', 'rg11b10ufloat-renderable', 'float32-filterable', 'float32-blendable'],
    {}
  );

  expect(
    getWebGPUTextureFormatCapabilities('bgra8unorm', baselineFeatures, 'core').store,
    'bgra storage is not over-reported'
  ).toBe(false);
  expect(
    getWebGPUTextureFormatCapabilities('bgra8unorm', optionalFeatures, 'core').store,
    'bgra storage is enabled by its feature'
  ).toBe(true);
  expect(
    getWebGPUTextureFormatCapabilities('rg11b10ufloat', baselineFeatures, 'core').render,
    'rg11b10 renderability is not over-reported'
  ).toBe(false);
  expect(
    getWebGPUTextureFormatCapabilities('rg11b10ufloat', optionalFeatures, 'core').render,
    'rg11b10 renderability is enabled by its feature'
  ).toBe(true);
  const baselineFloat32 = getWebGPUTextureFormatCapabilities(
    'rgba32float',
    baselineFeatures,
    'core'
  );
  const optionalFloat32 = getWebGPUTextureFormatCapabilities(
    'rgba32float',
    optionalFeatures,
    'core'
  );
  expect(baselineFloat32.filter, 'float32 filtering is not over-reported').toBe(false);
  expect(baselineFloat32.blend, 'float32 blending is not over-reported').toBe(false);
  expect(optionalFloat32.filter, 'float32 filtering follows its feature').toBe(true);
  expect(optionalFloat32.blend, 'float32 blending follows its feature').toBe(true);
  expect(
    getWebGPUTextureFormatCapabilities('rgba16float', baselineFeatures, 'core').store,
    'baseline rgba16float storage remains available to effects'
  ).toBe(true);
  void 0;
});

it('WebGPU texture capability table covers every luma texture format', () => {
  const baselineFeatures = new DeviceFeatures([], {});
  const formats = Object.keys(_getTextureFormatTable()) as TextureFormat[];

  for (const format of formats) {
    const capabilities = getWebGPUTextureFormatCapabilities(format, baselineFeatures, 'core');
    expect(capabilities.format, `${format} preserves its format`).toBe(format);
    for (const capability of ['create', 'render', 'filter', 'blend', 'store'] as const) {
      expect(
        typeof capabilities[capability],
        `${format}.${capability} is explicitly classified`
      ).toBe('boolean');
    }
    if (format.includes('webgl')) {
      expect(capabilities, `${format} remains WebGL-only`).toEqual({
        format,
        create: false,
        render: false,
        filter: false,
        blend: false,
        store: false
      });
    }
  }
  void 0;
});

it('WebGPU texture capabilities gate compressed, tier, and compatibility formats', () => {
  const baselineFeatures = new DeviceFeatures([], {});
  const optionalFeatures = new DeviceFeatures(
    [
      'core-features-and-limits',
      'texture-compression-bc',
      'texture-compression-etc2',
      'texture-compression-astc',
      'depth32float-stencil8',
      'texture-formats-tier1',
      'texture-formats-tier2'
    ],
    {}
  );

  for (const format of ['bc1-rgba-unorm', 'etc2-rgb8unorm', 'astc-4x4-unorm'] as const) {
    expect(
      getWebGPUTextureFormatCapabilities(format, baselineFeatures, 'core').create,
      `${format} requires its compression feature`
    ).toBe(false);
    expect(
      getWebGPUTextureFormatCapabilities(format, optionalFeatures, 'core'),
      `${format} is sampleable but not renderable or storage-capable`
    ).toEqual({format, create: true, render: false, filter: true, blend: false, store: false});
  }

  expect(
    getWebGPUTextureFormatCapabilities('depth32float-stencil8', baselineFeatures, 'core').create,
    'depth32float-stencil8 requires its optional feature'
  ).toBe(false);
  expect(
    getWebGPUTextureFormatCapabilities('depth32float-stencil8', optionalFeatures, 'core').render,
    'depth32float-stencil8 becomes renderable with its feature'
  ).toBe(true);
  expect(
    getWebGPUTextureFormatCapabilities('r16unorm', baselineFeatures, 'core'),
    'tier-one normalized formats are unavailable without the feature'
  ).toEqual({
    format: 'r16unorm',
    create: false,
    render: false,
    filter: false,
    blend: false,
    store: false
  });
  expect(
    getWebGPUTextureFormatCapabilities('r16unorm', optionalFeatures, 'core'),
    'tier-one normalized formats expose their render, filter, blend, and storage capabilities'
  ).toEqual({
    format: 'r16unorm',
    create: true,
    render: true,
    filter: true,
    blend: true,
    store: true
  });
  expect(
    getWebGPUTextureFormatCapabilities('bgra8unorm-srgb', baselineFeatures, 'compatibility').create,
    'compatibility profile does not over-report core-only sRGB BGRA creation'
  ).toBe(false);
  void 0;
});
