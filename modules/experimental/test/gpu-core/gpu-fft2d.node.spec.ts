// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import type {Device} from '@luma.gl/core';
import {
  getGPUFFT2DSupport,
  GPU_FFT2D_MAX_DIMENSION,
  GPU_FFT2D_MIN_DIMENSION,
  makeGPUFFT2DStats
} from '@luma.gl/experimental';
import {WgslReflect} from 'wgsl_reflect';
import {
  GPU_FFT2D_PARAMETER_BYTE_LENGTH,
  GPU_FFT2D_SHADER,
  GPU_FFT2D_WORKGROUP_DIMENSION
} from '../../src/gpu-core/gpu-fft2d-shaders';

test('GPUFFT2D publishes a bounded immutable radix-2 plan', testCase => {
  const stats = makeGPUFFT2DStats(8, 4);

  testCase.deepEqual(
    stats,
    {
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
    },
    'stats account for two bit reversals, five butterfly stages, and both directions'
  );
  testCase.ok(Object.isFrozen(stats), 'stats are immutable');
  testCase.ok(Object.isFrozen(stats.workgroupSize), 'workgroup size is immutable');
  testCase.ok(Object.isFrozen(stats.workgroupCount), 'workgroup count is immutable');
  testCase.equal(GPU_FFT2D_MIN_DIMENSION, 2, 'minimum dimension is explicit');
  testCase.equal(GPU_FFT2D_MAX_DIMENSION, 2048, 'maximum dimension is explicit');
  testCase.end();
});

test('GPUFFT2D validates both transform dimensions before allocation', testCase => {
  testCase.throws(() => makeGPUFFT2DStats(3, 4), /width must be a power of two/);
  testCase.throws(() => makeGPUFFT2DStats(4, 7), /height must be a power of two/);
  testCase.throws(() => makeGPUFFT2DStats(1, 4), /width must be from 2 through 2048/);
  testCase.throws(() => makeGPUFFT2DStats(4, 4096), /height must be from 2 through 2048/);
  testCase.throws(() => makeGPUFFT2DStats(4.5, 8), /width must be an integer/);
  testCase.throws(() => makeGPUFFT2DStats(4, 8, 0), /batchCount must be a positive integer/);
  testCase.end();
});

test('GPUFFT2D batches independent packed transforms in the dispatch depth dimension', testCase => {
  const stats = makeGPUFFT2DStats(8, 4, 3);

  testCase.equal(stats.batchCount, 3, 'the plan exposes the independent transform count');
  testCase.equal(stats.elementCount, 32, 'each transform retains its own spatial element count');
  testCase.equal(stats.complexBufferByteLength, 768, 'buffers contain all three packed transforms');
  testCase.deepEqual(stats.workgroupCount, [1, 1, 3], 'the batch index uses dispatch depth');
  testCase.equal(stats.dispatchCountPerEncode, 7, 'batching does not add FFT stage dispatches');
  testCase.end();
});

test('getGPUFFT2DSupport reports backend and resource-limit failures', testCase => {
  const supportedDevice = makeSupportDevice();
  const supported = getGPUFFT2DSupport(supportedDevice, {width: 256, height: 128});
  testCase.equal(supported.supported, true, 'representative WebGPU limits are supported');
  testCase.equal(supported.stats?.passCount, 17, 'support query includes the pass plan');

  const webglDevice = makeSupportDevice({type: 'webgl'});
  const webglSupport = getGPUFFT2DSupport(webglDevice, {width: 8, height: 8});
  testCase.equal(webglSupport.supported, false, 'WebGL is rejected');
  testCase.match(webglSupport.reason || '', /requires WebGPU/);

  const smallStorageDevice = makeSupportDevice({maxStorageBufferBindingSize: 1024});
  const smallStorageSupport = getGPUFFT2DSupport(smallStorageDevice, {
    width: 32,
    height: 32
  });
  testCase.equal(smallStorageSupport.supported, false, 'storage binding capacity is checked');
  testCase.match(smallStorageSupport.reason || '', /maxStorageBufferBindingSize/);

  const smallWorkgroupDevice = makeSupportDevice({maxComputeInvocationsPerWorkgroup: 32});
  const smallWorkgroupSupport = getGPUFFT2DSupport(smallWorkgroupDevice, {width: 8, height: 8});
  testCase.equal(smallWorkgroupSupport.supported, false, 'workgroup capacity is checked');
  testCase.match(smallWorkgroupSupport.reason || '', /8 by 8/);

  const invalidDimensions = getGPUFFT2DSupport(supportedDevice, {width: 12, height: 8});
  testCase.equal(invalidDimensions.supported, false, 'non-radix-2 dimensions are rejected');
  testCase.equal(invalidDimensions.stats, undefined, 'invalid dimensions do not publish a plan');
  testCase.end();
});

test('GPUFFT2D shader exposes one bounded storage-buffer compute pass', testCase => {
  const reflection = new WgslReflect(GPU_FFT2D_SHADER);

  testCase.deepEqual(
    reflection.entry.compute.map(entry => entry.name),
    ['main'],
    'shader has one compute entry point'
  );
  testCase.ok(
    reflection.storage.some(storage => storage.name === 'inputValues'),
    'shader reads packed complex input storage'
  );
  testCase.ok(
    reflection.storage.some(storage => storage.name === 'outputValues'),
    'shader writes packed complex output storage'
  );
  testCase.ok(
    reflection.uniforms.some(uniform => uniform.name === 'parameters'),
    'shader consumes immutable pass parameters'
  );
  testCase.equal(GPU_FFT2D_WORKGROUP_DIMENSION, 8, 'workgroup dimension is stable');
  testCase.equal(GPU_FFT2D_PARAMETER_BYTE_LENGTH, 32, 'uniform block remains 32 bytes');
  testCase.match(GPU_FFT2D_SHADER, /reverseLowBits/, 'shader explicitly performs bit reversal');
  testCase.match(GPU_FFT2D_SHADER, /multiplyComplex/, 'shader performs complex butterflies');
  testCase.end();
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
