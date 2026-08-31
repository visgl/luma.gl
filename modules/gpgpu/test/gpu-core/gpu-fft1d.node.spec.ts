import {expect, it} from 'vitest';
// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {
  getGPUFFT1DSupport,
  getGPUFFT1DStrategy,
  GPUCommandGraph,
  GPUFFT1D,
  GPU_FFT1D_MAX_LENGTH,
  GPU_FFT1D_MIN_LENGTH,
  makeGPUFFT1DStats
} from '@luma.gl/gpgpu/gpu-core';
import {WgslReflect} from 'wgsl_reflect';
import {getGPUFFT1DShaderSource} from '../../src/gpu-core/gpu-fft1d';
import {GPU_FFT2D_SHADER} from '../../src/gpu-core/gpu-fft2d-shaders';

it('GPUFFT1D publishes bounded batched radix-2 plans', () => {
  expect(makeGPUFFT1DStats(8, 3)).toEqual({
    length: 8,
    batchCount: 3,
    elementCount: 24,
    complexBufferByteLength: 192,
    stageCount: 3,
    passCount: 4,
    dispatchCount: 4,
    scratchBufferByteLength: 192,
    workgroupSize: 256
  });
  expect(GPU_FFT1D_MIN_LENGTH, 'minimum length is explicit').toBe(2);
  expect(GPU_FFT1D_MAX_LENGTH, 'maximum length is explicit').toBe(2048);
  expect(makeGPUFFT1DStats(2).passCount, 'minimum plan has one butterfly').toBe(2);
  expect(makeGPUFFT1DStats(2048).passCount, 'maximum plan has eleven butterflies').toBe(12);
  expect(() => makeGPUFFT1DStats(1)).toThrow(/from 2 through 2048/);
  expect(() => makeGPUFFT1DStats(12)).toThrow(/power of two/);
  expect(() => makeGPUFFT1DStats(8, 0)).toThrow(/positive integer/);
});

it('GPUFFT1D support selects portable and subgroup strategies explicitly', () => {
  const portableDevice = makeSupportDevice();
  const portableSupport = getGPUFFT1DSupport(portableDevice, {length: 256, batchCount: 4});
  expect(portableSupport.supported).toBe(true);
  expect(portableSupport.strategy).toBe('portable');
  expect(portableSupport.subgroupStageCount).toBe(0);

  const subgroupDevice = makeSupportDevice({subgroups: true, subgroupMinSize: 32});
  const subgroupSupport = getGPUFFT1DSupport(subgroupDevice, {
    length: 256,
    batchCount: 4
  });
  expect(subgroupSupport.strategy).toBe('subgroups');
  expect(subgroupSupport.subgroupStageCount, 'spans through 32 use subgroup shuffles').toBe(5);
  expect(
    getGPUFFT1DStrategy(subgroupDevice, 'portable'),
    'portable can be forced for benchmarking'
  ).toBe('portable');
  expect(() => getGPUFFT1DStrategy(portableDevice, 'subgroups')).toThrow(/not supported/);

  const smallStorageDevice = makeSupportDevice({maxStorageBufferBindingSize: 1024});
  const smallStorageSupport = getGPUFFT1DSupport(smallStorageDevice, {
    length: 256,
    batchCount: 1
  });
  expect(smallStorageSupport.supported).toBe(false);
  expect(smallStorageSupport.reason || '').toMatch(/maxStorageBufferBindingSize/);
  expect(
    getGPUFFT1DSupport(portableDevice, {length: 7}).stats,
    'invalid radix-2 lengths do not publish a plan'
  ).toBe(undefined);
});

it('GPUFFT1D validates packed complex views, capacity, aliasing, and ownership', () => {
  const graph = new GPUCommandGraph(makeSupportDevice());
  const inputHandle = graph.importBuffer({
    id: 'input',
    byteLength: 128,
    usage: Buffer.STORAGE
  });
  const outputHandle = graph.importBuffer({
    id: 'output',
    byteLength: 128,
    usage: Buffer.STORAGE
  });
  const input = graph.createDataView(inputHandle, {format: 'float32x2', length: 8});
  const output = graph.createDataView(outputHandle, {format: 'float32x2', length: 8});
  expect(
    () => new GPUFFT1D({input, output, length: 4, batchCount: 2}),
    'packed batched views are accepted'
  ).not.toThrow();
  const shortOutput = graph.createDataView(outputHandle, {format: 'float32x2', length: 7});
  expect(() => new GPUFFT1D({input, output: shortOutput, length: 4, batchCount: 2})).toThrow(
    /output must contain at least/
  );
  const stridedInput = graph.createDataView(inputHandle, {
    format: 'float32x2',
    length: 4,
    byteStride: 16
  });
  expect(() => new GPUFFT1D({input: stridedInput, output, length: 4})).toThrow(/must be packed/);
  const aliasedOutput = graph.createDataView(inputHandle, {format: 'float32x2', length: 8});
  expect(() => new GPUFFT1D({input, output: aliasedOutput, length: 8})).toThrow(/separate buffers/);

  const otherGraph = new GPUCommandGraph(makeSupportDevice());
  const otherHandle = otherGraph.importBuffer({
    id: 'other-output',
    byteLength: 128,
    usage: Buffer.STORAGE
  });
  const otherOutput = otherGraph.createDataView(otherHandle, {format: 'float32x2', length: 8});
  expect(() => new GPUFFT1D({input, output: otherOutput, length: 8}).addToGraph(graph)).toThrow(
    /different GPUCommandGraph/
  );
});

it('GPUFFT1D shaders share FFT helpers and expose portable and subgroup butterflies', () => {
  const graph = new GPUCommandGraph(makeSupportDevice());
  const inputHandle = graph.importBuffer({
    id: 'input',
    byteLength: 64,
    usage: Buffer.STORAGE
  });
  const outputHandle = graph.importBuffer({
    id: 'output',
    byteLength: 64,
    usage: Buffer.STORAGE
  });
  const input = graph.createDataView(inputHandle, {format: 'float32x2', length: 8});
  const output = graph.createDataView(outputHandle, {format: 'float32x2', length: 8});
  const baseProps = {
    id: 'fft-pass',
    input,
    output,
    length: 8,
    batchCount: 1,
    direction: 'forward' as const,
    pass: {kind: 'butterfly' as const, stage: 3},
    finalPass: true
  };
  const portableSource = getGPUFFT1DShaderSource(
    {...baseProps, useSubgroups: false},
    {x: 1, y: 1, z: 1}
  );
  const subgroupSource = getGPUFFT1DShaderSource(
    {...baseProps, pass: {kind: 'butterfly', stage: 2}, useSubgroups: true},
    {x: 1, y: 1, z: 1}
  );
  expect(new WgslReflect(portableSource).entry.compute.map(entry => entry.name)).toEqual(['main']);
  expect(portableSource, 'portable shader uses shared complex math').toMatch(/multiplyComplex/);
  expect(subgroupSource, 'subgroup extension is capability-gated').toMatch(/enable subgroups/);
  expect(subgroupSource, 'eligible butterflies shuffle partners').toMatch(/subgroupShuffleXor/);
  expect(subgroupSource, 'unexpected lane mappings fall back').toMatch(/subgroupMappingMatches/);
  expect(GPU_FFT2D_SHADER, 'GPUFFT2D consumes the same shared helpers').toMatch(/GPU_FFT_PI/);
});

function makeSupportDevice(
  overrides: {
    subgroups?: boolean;
    subgroupMinSize?: number;
    maxStorageBufferBindingSize?: number;
  } = {}
): Device {
  return {
    type: 'webgpu',
    isLost: false,
    features: new Set(overrides.subgroups ? ['subgroups'] : []),
    wgslLanguageFeatures: new Set(overrides.subgroups ? ['subgroup_id'] : []),
    info: {subgroupMinSize: overrides.subgroupMinSize},
    limits: {
      maxBufferSize: 256 * 1024 * 1024,
      maxStorageBufferBindingSize: overrides.maxStorageBufferBindingSize ?? 128 * 1024 * 1024,
      maxStorageBuffersPerShaderStage: 8,
      maxComputeInvocationsPerWorkgroup: 256,
      maxComputeWorkgroupSizeX: 256,
      maxComputeWorkgroupSizeY: 256,
      maxComputeWorkgroupsPerDimension: 65_535
    }
  } as Device;
}
