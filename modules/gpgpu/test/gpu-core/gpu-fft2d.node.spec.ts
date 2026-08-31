import {expect, it} from 'vitest';
// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import {
  getGPUFFT2DSupport,
  GPU_FFT2D_MAX_DIMENSION,
  GPU_FFT2D_MIN_DIMENSION,
  makeGPUFFT2DStats
} from '@luma.gl/gpgpu/gpu-core';
import {WgslReflect} from 'wgsl_reflect';
import {
  GPU_FFT2D_PARAMETER_BYTE_LENGTH,
  GPU_FFT2D_SHADER,
  GPU_FFT2D_WORKGROUP_DIMENSION
} from '../../src/gpu-core/gpu-fft2d-shaders';

it('GPUFFT2D publishes a bounded immutable radix-2 plan', () => {
  const stats = makeGPUFFT2DStats(8, 4);

  expect(
    stats,
    'stats account for two bit reversals, five butterfly stages, and both directions'
  ).toEqual({
    width: 8,
    height: 4,
    elementCount: 32,
    complexBufferByteLength: 256,
    horizontalStageCount: 3,
    verticalStageCount: 2,
    passCount: 7,
    dispatchCountPerEncode: 7,
    workgroupSize: [8, 8, 1],
    workgroupCount: [1, 1, 1],
    scratchBufferByteLength: 256,
    parameterBufferCount: 14,
    parameterBufferByteLength: 448
  });
  expect(Boolean(Object.isFrozen(stats)), 'stats are immutable').toBe(true);
  expect(Boolean(Object.isFrozen(stats.workgroupSize)), 'workgroup size is immutable').toBe(true);
  expect(Boolean(Object.isFrozen(stats.workgroupCount)), 'workgroup count is immutable').toBe(true);
  expect(GPU_FFT2D_MIN_DIMENSION, 'minimum dimension is explicit').toBe(2);
  expect(GPU_FFT2D_MAX_DIMENSION, 'maximum dimension is explicit').toBe(2048);
});

it('GPUFFT2D validates both transform dimensions before allocation', () => {
  expect(() => makeGPUFFT2DStats(3, 4)).toThrow(/width must be a power of two/);
  expect(() => makeGPUFFT2DStats(4, 7)).toThrow(/height must be a power of two/);
  expect(() => makeGPUFFT2DStats(1, 4)).toThrow(/width must be from 2 through 2048/);
  expect(() => makeGPUFFT2DStats(4, 4096)).toThrow(/height must be from 2 through 2048/);
  expect(() => makeGPUFFT2DStats(4.5, 8)).toThrow(/width must be an integer/);
  expect(() => makeGPUFFT2DStats(4, 8, 0)).toThrow(/batchCount must be a positive integer/);
});

it('GPUFFT2D batches independent packed transforms in the dispatch depth dimension', () => {
  const stats = makeGPUFFT2DStats(8, 4, 3);

  expect(stats.batchCount, 'the plan exposes the independent transform count').toBe(3);
  expect(stats.elementCount, 'each transform retains its own spatial element count').toBe(32);
  expect(stats.complexBufferByteLength, 'buffers contain all three packed transforms').toBe(768);
  expect(stats.workgroupCount, 'the batch index uses dispatch depth').toEqual([1, 1, 3]);
  expect(stats.dispatchCountPerEncode, 'batching does not add FFT stage dispatches').toBe(7);
});

it('getGPUFFT2DSupport reports backend and resource-limit failures', () => {
  const supportedDevice = makeSupportDevice();
  const supported = getGPUFFT2DSupport(supportedDevice, {width: 256, height: 128});
  expect(supported.supported, 'representative WebGPU limits are supported').toBe(true);
  expect(supported.stats?.passCount, 'support query includes the pass plan').toBe(17);

  const webglDevice = makeSupportDevice({type: 'webgl'});
  const webglSupport = getGPUFFT2DSupport(webglDevice, {width: 8, height: 8});
  expect(webglSupport.supported, 'WebGL is rejected').toBe(false);
  expect(webglSupport.reason || '').toMatch(/requires WebGPU/);

  const smallStorageDevice = makeSupportDevice({maxStorageBufferBindingSize: 1024});
  const smallStorageSupport = getGPUFFT2DSupport(smallStorageDevice, {
    width: 32,
    height: 32
  });
  expect(smallStorageSupport.supported, 'storage binding capacity is checked').toBe(false);
  expect(smallStorageSupport.reason || '').toMatch(/maxStorageBufferBindingSize/);

  const smallWorkgroupDevice = makeSupportDevice({maxComputeInvocationsPerWorkgroup: 32});
  const smallWorkgroupSupport = getGPUFFT2DSupport(smallWorkgroupDevice, {width: 8, height: 8});
  expect(smallWorkgroupSupport.supported, 'workgroup capacity is checked').toBe(false);
  expect(smallWorkgroupSupport.reason || '').toMatch(/8 by 8/);

  const invalidDimensions = getGPUFFT2DSupport(supportedDevice, {width: 12, height: 8});
  expect(invalidDimensions.supported, 'non-radix-2 dimensions are rejected').toBe(false);
  expect(invalidDimensions.stats, 'invalid dimensions do not publish a plan').toBe(undefined);
});

it('GPUFFT2D shader exposes one bounded storage-buffer compute pass', () => {
  const reflection = new WgslReflect(GPU_FFT2D_SHADER);

  expect(
    reflection.entry.compute.map(entry => entry.name),
    'shader has one compute entry point'
  ).toEqual(['main']);
  expect(
    Boolean(reflection.storage.some(storage => storage.name === 'inputValues')),
    'shader reads packed complex input storage'
  ).toBe(true);
  expect(
    Boolean(reflection.storage.some(storage => storage.name === 'outputValues')),
    'shader writes packed complex output storage'
  ).toBe(true);
  expect(
    Boolean(reflection.uniforms.some(uniform => uniform.name === 'parameters')),
    'shader consumes immutable pass parameters'
  ).toBe(true);
  expect(GPU_FFT2D_WORKGROUP_DIMENSION, 'workgroup dimension is stable').toBe(8);
  expect(GPU_FFT2D_PARAMETER_BYTE_LENGTH, 'uniform block remains 32 bytes').toBe(32);
  expect(GPU_FFT2D_SHADER, 'shader explicitly performs bit reversal').toMatch(/reverseLowBits/);
  expect(GPU_FFT2D_SHADER, 'shader performs complex butterflies').toMatch(/multiplyComplex/);
});

function makeSupportDevice(overrides: Record<string, unknown> = {}): Device {
  const {type = 'webgpu', ...limitOverrides} = overrides;
  return {
    type,
    limits: {
      maxStorageBuffersPerShaderStage: 8,
      maxUniformBuffersPerShaderStage: 12,
      maxComputeInvocationsPerWorkgroup: 256,
      maxComputeWorkgroupSizeX: 256,
      maxComputeWorkgroupSizeY: 256,
      maxComputeWorkgroupsPerDimension: 65_535,
      maxStorageBufferBindingSize: 128 * 1024 * 1024,
      maxBufferSize: 256 * 1024 * 1024,
      ...limitOverrides
    }
  } as Device;
}
