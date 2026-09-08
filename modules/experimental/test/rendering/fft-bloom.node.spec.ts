// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Texture, type CommandEncoder, type Device} from '@luma.gl/core';
import {
  getGPUConvolutionBloomSupport,
  GPUConvolutionBloom,
  makeBloomPointSpreadFunction,
  makeBloomSpectralPointSpreadFunction,
  makeGPUConvolutionBloomStats
} from '@luma.gl/experimental';
import {WgslReflect} from 'wgsl_reflect';
import {expect, it} from 'vitest';
import {
  FFT_BLOOM_COMPOSITE_SHADER,
  FFT_BLOOM_EXTRACT_SHADER,
  FFT_BLOOM_MULTIPLY_SHADER,
  FFT_BLOOM_PARAMETER_BYTE_LENGTH
} from '../../src/rendering/fft-bloom-shaders';

it('GPUConvolutionBloom publishes bounded FFT memory and dispatch costs', () => {
  const stats = makeGPUConvolutionBloomStats({width: 1920, height: 1080});

  expect(
    stats,
    'a padded quarter-resolution 1080p kernel reports every batched RGB buffer and dispatch'
  ).toEqual({
    width: 1920,
    height: 1080,
    contentWidth: 480,
    contentHeight: 270,
    contentOffsetX: 272,
    contentOffsetY: 121,
    guardBand: 0.125,
    transformWidth: 1024,
    transformHeight: 512,
    elementCount: 524288,
    complexBufferCount: 4,
    complexBufferByteLength: 12582912,
    totalComplexBufferByteLength: 50331648,
    batchCount: 3,
    transformDispatchCount: 21,
    steadyStateDispatchCount: 45,
    kernelInitializationDispatchCount: 21
  });
  expect(Boolean(Object.isFrozen(stats)), 'the performance contract cannot be mutated').toBe(true);
  expect(
    () => makeGPUConvolutionBloomStats({width: 1920, height: 1080, resolutionScale: 0}),
    'zero-resolution transforms are rejected'
  ).toThrow(/resolutionScale/);
  expect(
    () => makeGPUConvolutionBloomStats({width: 8192, height: 1080, resolutionScale: 1}),
    'oversized FFT plans fail before allocating GPU resources'
  ).toThrow(/width must be from 2 through 2048/);
  expect(
    () => makeGPUConvolutionBloomStats({width: 64, height: 64, guardBand: -0.1}),
    'negative convolution guard bands are rejected'
  ).toThrow(/guardBand/);
  const unpadded = makeGPUConvolutionBloomStats({width: 1920, height: 1080, guardBand: 0});
  expect(unpadded.transformWidth, 'applications can opt out of the padded FFT size').toBe(512);
  expect(unpadded.steadyStateDispatchCount, 'packed RGB reduces the old 123 dispatches').toBe(43);
  void 0;
});

it('makeBloomSpectralPointSpreadFunction normalizes each physical wavelength', () => {
  const kernels = makeBloomSpectralPointSpreadFunction({
    width: 32,
    height: 32,
    diffractionStrength: 0.6,
    spectralSpread: 1
  });

  for (const [channel, kernel] of Object.entries(kernels)) {
    expect(
      Boolean(Math.abs(kernel.reduce((energy, sample) => energy + sample, 0) - 1) < 0.000001),
      `${channel} independently preserves optical energy`
    ).toBe(true);
  }
  expect(kernels.red[2], 'red and blue use different diffraction widths').not.toBe(kernels.blue[2]);
  void 0;
});

it('makeBloomPointSpreadFunction preserves energy and models anamorphic apertures', () => {
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

  expect(circular.length, 'the kernel covers the complete FFT domain').toBe(width * height);
  expect(
    Boolean(Math.abs(circular.reduce((energy, value) => energy + value, 0) - 1) < 0.000001),
    'the optical kernel conserves total highlight energy'
  ).toBe(true);
  expect(
    Boolean(circular.every(value => Number.isFinite(value) && value >= 0)),
    'all aperture samples are finite and nonnegative'
  ).toBe(true);
  expect(
    Boolean(horizontal[2] > horizontal[width * 2]),
    'positive anamorphism widens horizontal glow'
  ).toBe(true);
  expect(
    diffraction[width * 4],
    'aperture diffraction changes the normalized optical profile'
  ).not.toBe(circular[width * 4]);
  expect(
    () => makeBloomPointSpreadFunction({width: 0, height}),
    'invalid kernel dimensions are rejected'
  ).toThrow(/width must be a positive integer/);
  void 0;
});

it('getGPUConvolutionBloomSupport reports WebGPU and storage requirements', () => {
  const supportedDevice = makeSupportDevice();
  const supported = getGPUConvolutionBloomSupport(supportedDevice, {width: 256, height: 128});

  expect(supported.supported, 'representative WebGPU limits support RGB convolution').toBe(true);
  expect(supported.stats?.transformWidth, 'support queries include the padded plan').toBe(128);
  expect(
    getGPUConvolutionBloomSupport(supportedDevice, {
      width: 2048,
      height: 2048,
      resolutionScale: 1,
      guardBand: 0
    }).supported,
    'two-dimensional frequency dispatch supports the largest bounded FFT without exceeding WebGPU limits'
  ).toBe(true);
  expect(
    getGPUConvolutionBloomSupport(makeSupportDevice({type: 'webgl'}), {width: 64, height: 64})
      .reason || '',
    'WebGL devices fall back before allocating premium resources'
  ).toMatch(/requires WebGPU/);
  expect(
    getGPUConvolutionBloomSupport(makeSupportDevice({maxStorageBuffersPerShaderStage: 2}), {
      width: 64,
      height: 64
    }).reason || '',
    'packed RGB multiplication checks only three simultaneous storage bindings'
  ).toMatch(/three storage buffers/);
  expect(
    getGPUConvolutionBloomSupport(makeSupportDevice({store: false}), {width: 64, height: 64})
      .reason || '',
    'HDR storage support is mandatory for the final composite'
  ).toMatch(/rgba16float storage textures/);
  void 0;
});

it('GPUConvolutionBloom rejects auxiliary textures aliasing its output', () => {
  const device = makeSupportDevice();
  const renderer = Object.create(GPUConvolutionBloom.prototype) as GPUConvolutionBloom;
  Object.assign(renderer, {
    device,
    stats: makeGPUConvolutionBloomStats({width: 16, height: 16})
  });
  const makeTexture = (handle: object = {}): Texture =>
    ({
      device,
      width: 16,
      height: 16,
      format: 'rgba16float',
      props: {usage: Texture.STORAGE},
      handle
    }) as Texture;
  const sourceTexture = makeTexture();
  const outputTexture = makeTexture();
  const outputAlias = makeTexture(outputTexture.handle as object);
  const commandEncoder = {device} as CommandEncoder;

  for (const auxiliaryName of ['exposureTexture', 'lensDirtTexture'] as const) {
    expect(
      () =>
        renderer.encode(commandEncoder, {
          sourceTexture,
          outputTexture,
          [auxiliaryName]: outputTexture
        }),
      `${auxiliaryName} cannot directly alias the writable output`
    ).toThrow(/auxiliary and output textures must be separate/);
    expect(
      () =>
        renderer.encode(commandEncoder, {
          sourceTexture,
          outputTexture,
          [auxiliaryName]: outputAlias
        }),
      `${auxiliaryName} cannot share the output handle through a separate wrapper`
    ).toThrow(/auxiliary and output textures must be separate/);
  }

  void 0;
});

it('GPUConvolutionBloom WGSL exposes extraction, multiplication, and HDR output', () => {
  const extract = new WgslReflect(FFT_BLOOM_EXTRACT_SHADER);
  const multiply = new WgslReflect(FFT_BLOOM_MULTIPLY_SHADER);
  const composite = new WgslReflect(FFT_BLOOM_COMPOSITE_SHADER);

  expect(extract.entry.compute.length, 'extraction exposes one bounded compute stage').toBe(1);
  expect(multiply.entry.compute.length, 'all RGB spectra share one multiply dispatch').toBe(1);
  expect(composite.entry.compute.length, 'HDR composition exposes one compute stage').toBe(1);
  expect(multiply.storage.length, 'packed RGB multiplication binds only three fields').toBe(3);
  expect(
    FFT_BLOOM_EXTRACT_SHADER,
    'highlight extraction applies exposure compensation in photographic stops'
  ).toMatch(/adaptedExposure \* exp2\(parameters\.exposureCompensation\)/);
  expect(
    FFT_BLOOM_COMPOSITE_SHADER,
    'the optical result remains in floating-point HDR space'
  ).toMatch(/texture_storage_2d<rgba16float, write>/);
  expect(
    FFT_BLOOM_MULTIPLY_SHADER,
    'frequency multiplication tiles across both dispatch dimensions for maximum-sized transforms'
  ).toMatch(/globalInvocation\.y \*\s+65536u/);
  expect(
    FFT_BLOOM_EXTRACT_SHADER,
    'the extraction shader leaves guard-band pixels zero instead of stretching the image'
  ).toMatch(/coordinate < parameters\.contentOffset \+ parameters\.contentDimensions/);
  expect(FFT_BLOOM_PARAMETER_BYTE_LENGTH, 'uniform packing remains explicitly bounded').toBe(96);
  void 0;
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
