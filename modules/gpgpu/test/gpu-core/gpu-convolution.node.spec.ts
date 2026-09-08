import {expect, it} from 'vitest';
// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {
  getGPUConvolutionSupport,
  GPUCommandGraph,
  GPUConvolution,
  GPU_CONVOLUTION_AUTO_DIRECT_KERNEL_AREA,
  makeGPUConvolutionStats
} from '@luma.gl/gpgpu/gpu-core';
import {WgslReflect} from 'wgsl_reflect';
import {
  getGPUConvolutionDirectShaderSource,
  getGPUConvolutionFFTShaderSource,
  getGPUConvolutionPackShaderSource
} from '../../src/gpu-core/gpu-convolution';

it('GPUConvolution publishes direct and padded FFT workload plans', () => {
  expect(
    makeGPUConvolutionStats({
      width: 8,
      height: 6,
      kernelWidth: 3,
      kernelHeight: 3
    })
  ).toEqual({
    width: 8,
    height: 6,
    kernelWidth: 3,
    kernelHeight: 3,
    boundary: 'zero',
    elementCount: 48,
    kernelElementCount: 9,
    directMultiplyAddCount: 432,
    fftWidth: 16,
    fftHeight: 8,
    fftElementCount: 128,
    fftTransformPassCount: 9,
    fftDispatchCount: 30,
    fftComplexBufferByteLength: 1024,
    fftLogicalTransientByteLength: 9216
  });
  const wrap = makeGPUConvolutionStats({
    width: 8,
    height: 8,
    kernelWidth: 5,
    kernelHeight: 3,
    boundary: 'wrap'
  });
  expect(wrap.fftWidth).toBe(8);
  expect(wrap.fftHeight).toBe(8);
  expect(wrap.fftTransformPassCount).toBe(8);
  expect(GPU_CONVOLUTION_AUTO_DIRECT_KERNEL_AREA).toBe(4096);
  expect(() =>
    makeGPUConvolutionStats({width: 8, height: 8, kernelWidth: 4, kernelHeight: 3})
  ).toThrow(/must be odd/);
});

it('GPUConvolution support exposes the automatic crossover and FFT constraints', () => {
  const device = makeSupportDevice();
  expect(
    getGPUConvolutionSupport(device, {
      width: 64,
      height: 32,
      kernelWidth: 3,
      kernelHeight: 3
    }).strategy
  ).toBe('direct');
  expect(
    getGPUConvolutionSupport(device, {
      width: 64,
      height: 32,
      kernelWidth: 65,
      kernelHeight: 65
    }).strategy
  ).toBe('fft');
  const automaticFallback = getGPUConvolutionSupport(device, {
    width: 60,
    height: 30,
    kernelWidth: 11,
    kernelHeight: 11,
    boundary: 'wrap'
  });
  expect(automaticFallback.supported).toBe(true);
  expect(automaticFallback.strategy).toBe('direct');
  const explicitUnsupported = getGPUConvolutionSupport(device, {
    width: 60,
    height: 30,
    kernelWidth: 11,
    kernelHeight: 11,
    boundary: 'wrap',
    strategy: 'fft'
  });
  expect(explicitUnsupported.supported).toBe(false);
  expect(explicitUnsupported.reason || '').toMatch(/power-of-two/);
});

it('GPUConvolution validates views, capacity, aliasing, and graph ownership', () => {
  const graph = new GPUCommandGraph(makeSupportDevice());
  const input = makeView(graph, 'input', 64);
  const kernel = makeView(graph, 'kernel', 9);
  const output = makeView(graph, 'output', 64);
  expect(
    () =>
      new GPUConvolution({
        input,
        kernel,
        output,
        width: 8,
        height: 8,
        kernelWidth: 3,
        kernelHeight: 3
      })
  ).not.toThrow();
  expect(
    () =>
      new GPUConvolution({
        input,
        kernel,
        output: makeView(graph, 'short-output', 63),
        width: 8,
        height: 8,
        kernelWidth: 3,
        kernelHeight: 3
      })
  ).toThrow(/output must contain at least/);
  const aliasedOutput = graph.createDataView(input.buffer, {format: 'float32', length: 64});
  expect(
    () =>
      new GPUConvolution({
        input,
        kernel,
        output: aliasedOutput,
        width: 8,
        height: 8,
        kernelWidth: 3,
        kernelHeight: 3
      })
  ).toThrow(/separate buffer/);
  const otherGraph = new GPUCommandGraph(makeSupportDevice());
  const otherOutput = makeView(otherGraph, 'other-output', 64);
  expect(() =>
    new GPUConvolution({
      input,
      kernel,
      output: otherOutput,
      width: 8,
      height: 8,
      kernelWidth: 3,
      kernelHeight: 3
    }).addToGraph(graph)
  ).toThrow(/different GPUCommandGraph/);
});

it('GPUConvolution generated direct, packing, and FFT shaders reflect', () => {
  const graph = new GPUCommandGraph(makeSupportDevice());
  const input = makeView(graph, 'input', 64);
  const kernel = makeView(graph, 'kernel', 9);
  const output = makeView(graph, 'output', 64);
  const convolution = new GPUConvolution({
    input,
    kernel,
    output,
    width: 8,
    height: 8,
    kernelWidth: 3,
    kernelHeight: 3,
    boundary: 'wrap'
  });
  const direct = getGPUConvolutionDirectShaderSource(convolution, {x: 1, y: 1, z: 1});
  const pack = getGPUConvolutionPackShaderSource(convolution, {x: 1, y: 1, z: 1});
  const complexInput = makeComplexView(graph, 'complex-input', 64);
  const complexOutput = makeComplexView(graph, 'complex-output', 64);
  const fft = getGPUConvolutionFFTShaderSource(
    {
      id: 'fft-pass',
      input: complexInput,
      output: complexOutput,
      width: 8,
      height: 8,
      direction: 'forward',
      pass: {axis: 'vertical', kind: 'butterfly', stage: 2},
      finalPass: false
    },
    {x: 1, y: 1, z: 1}
  );
  for (const source of [direct, pack, fft]) {
    expect(new WgslReflect(source).entry.compute.map(entry => entry.name)).toEqual(['main']);
  }
  expect(direct, 'direct wrap boundary is explicit').toMatch(/wrappedX/);
  expect(pack, 'FFT path centers the kernel in the padded field').toMatch(/packedKernel/);
  expect(fft, 'FFT path consumes shared complex arithmetic').toMatch(/multiplyComplex/);
});

function makeView(graph: GPUCommandGraph, id: string, length: number) {
  const handle = graph.importBuffer({
    id,
    byteLength: length * Float32Array.BYTES_PER_ELEMENT,
    usage: Buffer.STORAGE
  });
  return graph.createDataView(handle, {format: 'float32', length});
}

function makeComplexView(graph: GPUCommandGraph, id: string, length: number) {
  const handle = graph.importBuffer({
    id,
    byteLength: length * 2 * Float32Array.BYTES_PER_ELEMENT,
    usage: Buffer.STORAGE
  });
  return graph.createDataView(handle, {format: 'float32x2', length});
}

function makeSupportDevice(): Device {
  return {
    type: 'webgpu',
    isLost: false,
    features: new Set(),
    wgslLanguageFeatures: new Set(),
    info: {},
    limits: {
      maxBufferSize: 256 * 1024 * 1024,
      maxStorageBufferBindingSize: 128 * 1024 * 1024,
      maxStorageBuffersPerShaderStage: 8,
      maxComputeInvocationsPerWorkgroup: 256,
      maxComputeWorkgroupSizeX: 256,
      maxComputeWorkgroupSizeY: 256,
      maxComputeWorkgroupsPerDimension: 65_535
    }
  } as Device;
}
