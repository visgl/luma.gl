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
} from '@luma.gl/experimental';
import test from 'test/utils/vitest-tape';
import {WgslReflect} from 'wgsl_reflect';
import {getGPUFFT1DShaderSource} from '../../src/gpu-core/gpu-fft1d';
import {GPU_FFT2D_SHADER} from '../../src/gpu-core/gpu-fft2d-shaders';

test('GPUFFT1D publishes bounded batched radix-2 plans', testCase => {
  testCase.deepEqual(makeGPUFFT1DStats(8, 3), {
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
  testCase.equal(GPU_FFT1D_MIN_LENGTH, 2, 'minimum length is explicit');
  testCase.equal(GPU_FFT1D_MAX_LENGTH, 2048, 'maximum length is explicit');
  testCase.equal(makeGPUFFT1DStats(2).passCount, 2, 'minimum plan has one butterfly');
  testCase.equal(makeGPUFFT1DStats(2048).passCount, 12, 'maximum plan has eleven butterflies');
  testCase.throws(() => makeGPUFFT1DStats(1), /from 2 through 2048/);
  testCase.throws(() => makeGPUFFT1DStats(12), /power of two/);
  testCase.throws(() => makeGPUFFT1DStats(8, 0), /positive integer/);
  testCase.end();
});

test('GPUFFT1D support selects portable and subgroup strategies explicitly', testCase => {
  const portableDevice = makeSupportDevice();
  const portableSupport = getGPUFFT1DSupport(portableDevice, {length: 256, batchCount: 4});
  testCase.equal(portableSupport.supported, true);
  testCase.equal(portableSupport.strategy, 'portable');
  testCase.equal(portableSupport.subgroupStageCount, 0);

  const subgroupDevice = makeSupportDevice({subgroups: true, subgroupMinSize: 32});
  const subgroupSupport = getGPUFFT1DSupport(subgroupDevice, {
    length: 256,
    batchCount: 4
  });
  testCase.equal(subgroupSupport.strategy, 'subgroups');
  testCase.equal(subgroupSupport.subgroupStageCount, 5, 'spans through 32 use subgroup shuffles');
  testCase.equal(
    getGPUFFT1DStrategy(subgroupDevice, 'portable'),
    'portable',
    'portable can be forced for benchmarking'
  );
  testCase.throws(() => getGPUFFT1DStrategy(portableDevice, 'subgroups'), /not supported/);

  const smallStorageDevice = makeSupportDevice({maxStorageBufferBindingSize: 1024});
  const smallStorageSupport = getGPUFFT1DSupport(smallStorageDevice, {
    length: 256,
    batchCount: 1
  });
  testCase.equal(smallStorageSupport.supported, false);
  testCase.match(smallStorageSupport.reason || '', /maxStorageBufferBindingSize/);
  testCase.equal(
    getGPUFFT1DSupport(portableDevice, {length: 7}).stats,
    undefined,
    'invalid radix-2 lengths do not publish a plan'
  );
  testCase.end();
});

test('GPUFFT1D validates packed complex views, capacity, aliasing, and ownership', testCase => {
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
  testCase.doesNotThrow(
    () => new GPUFFT1D({input, output, length: 4, batchCount: 2}),
    'packed batched views are accepted'
  );
  const shortOutput = graph.createDataView(outputHandle, {format: 'float32x2', length: 7});
  testCase.throws(
    () => new GPUFFT1D({input, output: shortOutput, length: 4, batchCount: 2}),
    /output must contain at least/
  );
  const stridedInput = graph.createDataView(inputHandle, {
    format: 'float32x2',
    length: 4,
    byteStride: 16
  });
  testCase.throws(() => new GPUFFT1D({input: stridedInput, output, length: 4}), /must be packed/);
  const aliasedOutput = graph.createDataView(inputHandle, {format: 'float32x2', length: 8});
  testCase.throws(
    () => new GPUFFT1D({input, output: aliasedOutput, length: 8}),
    /separate buffers/
  );

  const otherGraph = new GPUCommandGraph(makeSupportDevice());
  const otherHandle = otherGraph.importBuffer({
    id: 'other-output',
    byteLength: 128,
    usage: Buffer.STORAGE
  });
  const otherOutput = otherGraph.createDataView(otherHandle, {format: 'float32x2', length: 8});
  testCase.throws(
    () => new GPUFFT1D({input, output: otherOutput, length: 8}).addToGraph(graph),
    /different GPUCommandGraph/
  );
  testCase.end();
});

test('GPUFFT1D shaders share FFT helpers and expose portable and subgroup butterflies', testCase => {
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
  testCase.deepEqual(
    new WgslReflect(portableSource).entry.compute.map(entry => entry.name),
    ['main']
  );
  testCase.match(portableSource, /multiplyComplex/, 'portable shader uses shared complex math');
  testCase.match(subgroupSource, /enable subgroups/, 'subgroup extension is capability-gated');
  testCase.match(subgroupSource, /subgroupShuffleXor/, 'eligible butterflies shuffle partners');
  testCase.match(subgroupSource, /subgroupMappingMatches/, 'unexpected lane mappings fall back');
  testCase.match(GPU_FFT2D_SHADER, /GPU_FFT_PI/, 'GPUFFT2D consumes the same shared helpers');
  testCase.end();
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
