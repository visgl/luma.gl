// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {
  getEffectiveWebGPUFeatureLevel,
  getRequiredWebGPUFeatures,
  getRequiredWebGPULimits,
  getWebGPUFeatureLevel,
  getWebGPURequestAdapterOptions
} from '../../../src/adapter/webgpu-adapter';
import {
  isHighDynamicRangeCanvasConfiguration,
  WebGPUCanvasContext
} from '../../../src/adapter/webgpu-canvas-context';

test('WebGPUAdapter imports from the ESM package entry without circular init errors', async t => {
  t.plan(2);

  // Import the local entry file directly to avoid workspace alias resolution mixing src/dist modules.
  // This regression is about entry-module initialization, not package alias behavior.
  const webgpuModule = await import('../../../src/index');

  t.equal(webgpuModule.webgpuAdapter.type, 'webgpu', 'exports a WebGPU adapter instance');
  t.equal(webgpuModule.WebGPUDevice.name, 'WebGPUDevice', 'exports the WebGPU device class');
});

test('getRequiredWebGPULimits reads non-enumerable supported limits directly', t => {
  const supportedLimits = {} as GPUSupportedLimits;
  Object.defineProperties(supportedLimits, {
    maxBufferSize: {value: 4096, enumerable: false},
    maxStorageBufferBindingSize: {value: 2048, enumerable: false}
  });

  const requiredLimits = getRequiredWebGPULimits(supportedLimits);

  t.deepEqual(Object.keys(supportedLimits), [], 'the test limits are not enumerable');
  t.equal(requiredLimits.maxBufferSize, 4096, 'buffer size is still requested');
  t.equal(
    requiredLimits.maxStorageBufferBindingSize,
    2048,
    'storage binding size is still requested'
  );
  t.end();
});

test('WebGPUAdapter feature level helpers map luma props to WebGPU requests', t => {
  t.equal(getWebGPUFeatureLevel({}), 'core', 'defaults to core');
  t.equal(getWebGPUFeatureLevel({featureLevel: 'max'}), 'max', 'explicit level is returned');
  t.equal(
    getWebGPUFeatureLevel({featureLevel: 'compatibility'}),
    'compatibility',
    'compatibility level is returned'
  );
  t.equal(
    getWebGPUFeatureLevel({featureLevel: 'best-available'}),
    'best-available',
    'best available level is returned'
  );

  t.deepEqual(
    getWebGPURequestAdapterOptions({powerPreference: 'default'}),
    {featureLevel: 'core'},
    'core requests core and omits default power preference'
  );
  t.deepEqual(
    getWebGPURequestAdapterOptions({featureLevel: 'max', powerPreference: 'low-power'}),
    {featureLevel: 'core', powerPreference: 'low-power'},
    'max requests a core adapter'
  );
  t.deepEqual(
    getWebGPURequestAdapterOptions({featureLevel: 'compatibility'}),
    {featureLevel: 'compatibility'},
    'compatibility requests a compatibility adapter'
  );
  t.deepEqual(
    getWebGPURequestAdapterOptions({featureLevel: 'best-available'}),
    {featureLevel: 'compatibility'},
    'best available starts from a compatibility adapter'
  );
  t.deepEqual(
    getWebGPURequestAdapterOptions({
      featureLevel: 'compatibility',
      _forceFallbackAdapter: true
    }),
    {featureLevel: 'compatibility', forceFallbackAdapter: true},
    'software fallback is explicitly requested'
  );

  t.end();
});

test('WebGPUAdapter feature helpers keep requested profiles separate', t => {
  const coreFeatures = new Set([
    'core-features-and-limits',
    'texture-compression-bc'
  ]) as GPUSupportedFeatures;
  const compatibilityFeatures = new Set(['texture-compression-bc']) as GPUSupportedFeatures;

  t.deepEqual(
    getRequiredWebGPUFeatures(coreFeatures, 'core'),
    [],
    'core does not request optional features'
  );
  t.deepEqual(
    getRequiredWebGPUFeatures(coreFeatures, 'core', [
      'subgroups',
      'texture-compression-bc',
      'subgroups'
    ]),
    ['texture-compression-bc'],
    'core requests supported targeted features and ignores unsupported or duplicate entries'
  );
  t.deepEqual(
    getRequiredWebGPUFeatures(coreFeatures, 'max'),
    ['core-features-and-limits', 'texture-compression-bc'],
    'max requests all adapter features'
  );
  t.deepEqual(
    getRequiredWebGPUFeatures(coreFeatures, 'compatibility'),
    [],
    'compatibility does not opt into core'
  );
  t.deepEqual(
    getRequiredWebGPUFeatures(coreFeatures, 'best-available'),
    ['core-features-and-limits'],
    'best available opts into core when exposed'
  );
  t.deepEqual(
    getRequiredWebGPUFeatures(compatibilityFeatures, 'best-available'),
    [],
    'best available stays compatibility when core is unavailable'
  );

  t.equal(
    getEffectiveWebGPUFeatureLevel('compatibility', compatibilityFeatures),
    'compatibility',
    'compatibility reports compatibility without the core feature'
  );
  t.equal(
    getEffectiveWebGPUFeatureLevel('compatibility', coreFeatures),
    'core',
    'the created device feature identifies an upgraded core device'
  );
  t.equal(
    getEffectiveWebGPUFeatureLevel('best-available', coreFeatures),
    'core',
    'best available reports core after opting in'
  );
  t.equal(
    getEffectiveWebGPUFeatureLevel('best-available', compatibilityFeatures),
    'compatibility',
    'best available reports compatibility when core is unavailable'
  );

  t.end();
});

test('isHighDynamicRangeCanvasConfiguration verifies accepted HDR presentation', t => {
  const standardConfiguration = {
    format: 'rgba16float',
    toneMapping: {mode: 'standard'}
  } as GPUCanvasConfigurationOut;
  const highDynamicRangeConfiguration = {
    format: 'rgba16float',
    toneMapping: {mode: 'extended'}
  } as GPUCanvasConfigurationOut;

  t.equal(
    isHighDynamicRangeCanvasConfiguration(standardConfiguration),
    false,
    'floating-point presentation without extended tone mapping is not HDR'
  );
  t.equal(
    isHighDynamicRangeCanvasConfiguration(highDynamicRangeConfiguration),
    true,
    'floating-point presentation with extended tone mapping is HDR'
  );
  t.equal(
    isHighDynamicRangeCanvasConfiguration(null),
    false,
    'an unavailable configuration cannot verify HDR support'
  );
  t.end();
});

test('WebGPUCanvasContext configures SDR without getConfiguration', t => {
  const configurations: GPUCanvasConfiguration[] = [];
  const context = makeMockCanvasContext({
    preferredColorFormat: navigator.gpu.getPreferredCanvasFormat(),
    toneMapping: 'standard',
    handle: {
      configure: configuration => configurations.push(configuration)
    }
  });

  context._configureDevice();

  t.equal(configurations.length, 1, 'standard canvas configures without introspection');
  t.equal(
    configurations[0]?.format,
    navigator.gpu.getPreferredCanvasFormat(),
    'standard canvas uses the browser preferred format'
  );
  t.equal(context.toneMapping, 'standard', 'standard tone mapping is recorded');
  t.end();
});

test('WebGPUCanvasContext falls back from unverifiable or rejected HDR to SDR', t => {
  const missingIntrospectionConfigurations: GPUCanvasConfiguration[] = [];
  const missingIntrospectionContext = makeMockCanvasContext({
    preferredColorFormat: 'rgba16float',
    toneMapping: 'extended',
    handle: {
      configure: configuration => missingIntrospectionConfigurations.push(configuration)
    }
  });
  missingIntrospectionContext._configureDevice();

  t.equal(
    missingIntrospectionConfigurations.length,
    1,
    'missing getConfiguration skips an unverifiable HDR request'
  );
  t.equal(
    missingIntrospectionConfigurations[0]?.format,
    navigator.gpu.getPreferredCanvasFormat(),
    'missing getConfiguration uses the SDR format'
  );
  t.equal(
    missingIntrospectionContext.toneMapping,
    'standard',
    'missing getConfiguration records the SDR fallback'
  );

  const rejectedConfigurations: GPUCanvasConfiguration[] = [];
  const rejectedContext = makeMockCanvasContext({
    preferredColorFormat: 'rgba16float',
    toneMapping: 'extended',
    handle: {
      configure: configuration => {
        rejectedConfigurations.push(configuration);
        if (configuration.toneMapping?.mode === 'extended') {
          throw new Error('HDR is unsupported');
        }
      },
      getConfiguration: () => null
    }
  });
  rejectedContext._configureDevice();

  t.equal(rejectedConfigurations.length, 2, 'rejected HDR is followed by an SDR configuration');
  t.equal(
    rejectedConfigurations[1]?.format,
    navigator.gpu.getPreferredCanvasFormat(),
    'rejected HDR uses the SDR format'
  );
  t.equal(rejectedContext.toneMapping, 'standard', 'rejected HDR records the SDR fallback');
  t.end();
});

function makeMockCanvasContext(options: {
  preferredColorFormat: 'rgba8unorm' | 'bgra8unorm' | 'rgba16float';
  toneMapping: 'standard' | 'extended';
  handle: Pick<GPUCanvasContext, 'configure'> & Partial<Pick<GPUCanvasContext, 'getConfiguration'>>;
}): WebGPUCanvasContext {
  const context = Object.create(WebGPUCanvasContext.prototype) as WebGPUCanvasContext;
  Object.assign(context, {
    device: {
      preferredColorFormat: options.preferredColorFormat,
      preferredDepthFormat: 'depth24plus',
      handle: {}
    },
    handle: options.handle,
    props: {toneMapping: options.toneMapping, colorSpace: 'srgb', alphaMode: 'opaque'},
    _createDepthStencilAttachment: () => {}
  });
  return context;
}
