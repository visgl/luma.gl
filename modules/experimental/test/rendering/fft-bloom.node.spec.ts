// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import {
  getGPUConvolutionBloomSupport,
  makeBloomPointSpreadFunction,
  makeGPUConvolutionBloomStats
} from '@luma.gl/experimental';
import {WgslReflect} from 'wgsl_reflect';
import test from 'test/utils/vitest-tape';
import {
  FFT_BLOOM_COMPOSITE_SHADER,
  FFT_BLOOM_EXTRACT_SHADER,
  FFT_BLOOM_MULTIPLY_SHADER,
  FFT_BLOOM_PARAMETER_BYTE_LENGTH
} from '../../src/rendering/fft-bloom-shaders';

test('GPUConvolutionBloom publishes bounded FFT memory and dispatch costs', testCase => {
  const stats = makeGPUConvolutionBloomStats({width: 1920, height: 1080});

  testCase.deepEqual(
    stats,
    {
      width: 1920,
      height: 1080,
      transformWidth: 512,
      transformHeight: 512,
      elementCount: 262144,
      complexBufferCount: 9,
      complexBufferByteLength: 2097152,
      totalComplexBufferByteLength: 18874368,
      transformDispatchCount: 20,
      steadyStateDispatchCount: 123,
      kernelInitializationDispatchCount: 20
    },
    'a quarter-resolution 1080p kernel reports every RGB transform, buffer, and dispatch'
  );
  testCase.ok(Object.isFrozen(stats), 'the performance contract cannot be mutated');
  testCase.throws(
    () => makeGPUConvolutionBloomStats({width: 1920, height: 1080, resolutionScale: 0}),
    /resolutionScale/,
    'zero-resolution transforms are rejected'
  );
  testCase.throws(
    () => makeGPUConvolutionBloomStats({width: 8192, height: 1080, resolutionScale: 1}),
    /width must be from 2 through 2048/,
    'oversized FFT plans fail before allocating GPU resources'
  );
  testCase.end();
});

test('makeBloomPointSpreadFunction preserves energy and models anamorphic apertures', testCase => {
  const width = 32;
  const height = 32;
  const circular = makeBloomPointSpreadFunction({width, height, diffractionStrength: 0});
  const horizontal = makeBloomPointSpreadFunction({
    width,
    height,
    apertureBlades: 6,
    diffractionStrength: 0,
    anamorphicRatio: 1
  });
  const diffraction = makeBloomPointSpreadFunction({
    width,
    height,
    apertureBlades: 6,
    diffractionStrength: 1
  });

  testCase.equal(circular.length, width * height, 'the kernel covers the complete FFT domain');
  testCase.ok(
    Math.abs(circular.reduce((energy, value) => energy + value, 0) - 1) < 0.000001,
    'the optical kernel conserves total highlight energy'
  );
  testCase.ok(
    circular.every(value => Number.isFinite(value) && value >= 0),
    'all aperture samples are finite and nonnegative'
  );
  testCase.ok(horizontal[2] > horizontal[width * 2], 'positive anamorphism widens horizontal glow');
  testCase.notEqual(
    diffraction[width * 4],
    circular[width * 4],
    'aperture diffraction changes the normalized optical profile'
  );
  testCase.throws(
    () => makeBloomPointSpreadFunction({width: 0, height}),
    /width must be a positive integer/,
    'invalid kernel dimensions are rejected'
  );
  testCase.end();
});

test('getGPUConvolutionBloomSupport reports WebGPU and storage requirements', testCase => {
  const supportedDevice = makeSupportDevice();
  const supported = getGPUConvolutionBloomSupport(supportedDevice, {width: 256, height: 128});

  testCase.equal(supported.supported, true, 'representative WebGPU limits support RGB convolution');
  testCase.equal(supported.stats?.transformWidth, 64, 'support queries include the transform plan');
  testCase.equal(
    getGPUConvolutionBloomSupport(supportedDevice, {
      width: 2048,
      height: 2048,
      resolutionScale: 1
    }).supported,
    true,
    'two-dimensional frequency dispatch supports the largest bounded FFT without exceeding WebGPU limits'
  );
  testCase.match(
    getGPUConvolutionBloomSupport(makeSupportDevice({type: 'webgl'}), {width: 64, height: 64})
      .reason || '',
    /requires WebGPU/,
    'WebGL devices fall back before allocating premium resources'
  );
  testCase.match(
    getGPUConvolutionBloomSupport(makeSupportDevice({maxStorageBuffersPerShaderStage: 6}), {
      width: 64,
      height: 64
    }).reason || '',
    /seven storage buffers/,
    'RGB spectrum multiplication checks its seven simultaneous storage bindings'
  );
  testCase.match(
    getGPUConvolutionBloomSupport(makeSupportDevice({store: false}), {width: 64, height: 64})
      .reason || '',
    /rgba16float storage textures/,
    'HDR storage support is mandatory for the final composite'
  );
  testCase.end();
});

test('GPUConvolutionBloom WGSL exposes extraction, multiplication, and HDR output', testCase => {
  const extract = new WgslReflect(FFT_BLOOM_EXTRACT_SHADER);
  const multiply = new WgslReflect(FFT_BLOOM_MULTIPLY_SHADER);
  const composite = new WgslReflect(FFT_BLOOM_COMPOSITE_SHADER);

  testCase.equal(extract.entry.compute.length, 1, 'extraction exposes one bounded compute stage');
  testCase.equal(multiply.entry.compute.length, 1, 'all RGB spectra share one multiply dispatch');
  testCase.equal(composite.entry.compute.length, 1, 'HDR composition exposes one compute stage');
  testCase.equal(multiply.storage.length, 7, 'frequency multiplication binds exactly seven fields');
  testCase.match(
    FFT_BLOOM_EXTRACT_SHADER,
    /parameters\.exposure \* exp2\(parameters\.exposureCompensation\)/,
    'highlight extraction applies exposure compensation in photographic stops'
  );
  testCase.match(
    FFT_BLOOM_COMPOSITE_SHADER,
    /texture_storage_2d<rgba16float, write>/,
    'the optical result remains in floating-point HDR space'
  );
  testCase.match(
    FFT_BLOOM_MULTIPLY_SHADER,
    /globalInvocation\.y \*\s+65536u/,
    'frequency multiplication tiles across both dispatch dimensions for maximum-sized transforms'
  );
  testCase.equal(FFT_BLOOM_PARAMETER_BYTE_LENGTH, 32, 'uniform packing remains explicitly bounded');
  testCase.end();
});

function makeSupportDevice(overrides: Record<string, unknown> = {}): Device {
  const {type = 'webgpu', store = true, ...limitOverrides} = overrides;
  return {
    type,
    limits: {
      maxStorageBuffersPerShaderStage: 8,
      maxStorageTexturesPerShaderStage: 4,
      maxUniformBuffersPerShaderStage: 12,
      maxComputeInvocationsPerWorkgroup: 256,
      maxComputeWorkgroupSizeX: 256,
      maxComputeWorkgroupSizeY: 256,
      maxComputeWorkgroupsPerDimension: 65535,
      maxStorageBufferBindingSize: 128 * 1024 * 1024,
      maxBufferSize: 256 * 1024 * 1024,
      ...limitOverrides
    },
    getTextureFormatCapabilities: () => ({store})
  } as Device;
}
