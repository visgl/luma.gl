// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {DeviceFeatures, _getTextureFormatTable, type TextureFormat} from '@luma.gl/core';
import {getWebGPUTextureFormatCapabilities} from '../../src/adapter/helpers/webgpu-texture-capabilities';

test('WebGPU texture capabilities require the matching optional features', t => {
  const baselineFeatures = new DeviceFeatures([], {});
  const optionalFeatures = new DeviceFeatures(
    ['bgra8unorm-storage', 'rg11b10ufloat-renderable', 'float32-filterable', 'float32-blendable'],
    {}
  );

  t.equal(
    getWebGPUTextureFormatCapabilities('bgra8unorm', baselineFeatures, 'core').store,
    false,
    'bgra storage is not over-reported'
  );
  t.equal(
    getWebGPUTextureFormatCapabilities('bgra8unorm', optionalFeatures, 'core').store,
    true,
    'bgra storage is enabled by its feature'
  );
  t.equal(
    getWebGPUTextureFormatCapabilities('rg11b10ufloat', baselineFeatures, 'core').render,
    false,
    'rg11b10 renderability is not over-reported'
  );
  t.equal(
    getWebGPUTextureFormatCapabilities('rg11b10ufloat', optionalFeatures, 'core').render,
    true,
    'rg11b10 renderability is enabled by its feature'
  );
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
  t.equal(baselineFloat32.filter, false, 'float32 filtering is not over-reported');
  t.equal(baselineFloat32.blend, false, 'float32 blending is not over-reported');
  t.equal(optionalFloat32.filter, true, 'float32 filtering follows its feature');
  t.equal(optionalFloat32.blend, true, 'float32 blending follows its feature');
  t.equal(
    getWebGPUTextureFormatCapabilities('rgba16float', baselineFeatures, 'core').store,
    true,
    'baseline rgba16float storage remains available to effects'
  );
  t.end();
});

test('WebGPU texture capability table covers every luma texture format', t => {
  const baselineFeatures = new DeviceFeatures([], {});
  const formats = Object.keys(_getTextureFormatTable()) as TextureFormat[];

  for (const format of formats) {
    const capabilities = getWebGPUTextureFormatCapabilities(format, baselineFeatures, 'core');
    t.equal(capabilities.format, format, `${format} preserves its format`);
    for (const capability of ['create', 'render', 'filter', 'blend', 'store'] as const) {
      t.equal(
        typeof capabilities[capability],
        'boolean',
        `${format}.${capability} is explicitly classified`
      );
    }
    if (format.includes('webgl')) {
      t.deepEqual(
        capabilities,
        {format, create: false, render: false, filter: false, blend: false, store: false},
        `${format} remains WebGL-only`
      );
    }
  }
  t.end();
});

test('WebGPU texture capabilities gate compressed, tier, and compatibility formats', t => {
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
    t.equal(
      getWebGPUTextureFormatCapabilities(format, baselineFeatures, 'core').create,
      false,
      `${format} requires its compression feature`
    );
    t.deepEqual(
      getWebGPUTextureFormatCapabilities(format, optionalFeatures, 'core'),
      {format, create: true, render: false, filter: true, blend: false, store: false},
      `${format} is sampleable but not renderable or storage-capable`
    );
  }

  t.equal(
    getWebGPUTextureFormatCapabilities('depth32float-stencil8', baselineFeatures, 'core').create,
    false,
    'depth32float-stencil8 requires its optional feature'
  );
  t.equal(
    getWebGPUTextureFormatCapabilities('depth32float-stencil8', optionalFeatures, 'core').render,
    true,
    'depth32float-stencil8 becomes renderable with its feature'
  );
  t.deepEqual(
    getWebGPUTextureFormatCapabilities('r16unorm', baselineFeatures, 'core'),
    {
      format: 'r16unorm',
      create: false,
      render: false,
      filter: false,
      blend: false,
      store: false
    },
    'tier-one normalized formats are unavailable without the feature'
  );
  t.deepEqual(
    getWebGPUTextureFormatCapabilities('r16unorm', optionalFeatures, 'core'),
    {
      format: 'r16unorm',
      create: true,
      render: true,
      filter: false,
      blend: true,
      store: true
    },
    'tier-one normalized formats expose only their specified capabilities'
  );
  t.equal(
    getWebGPUTextureFormatCapabilities('bgra8unorm-srgb', baselineFeatures, 'compatibility').create,
    false,
    'compatibility profile does not over-report core-only sRGB BGRA creation'
  );
  t.end();
});
