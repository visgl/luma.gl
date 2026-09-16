// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {NullDevice} from '@luma.gl/test-utils';
import {
  GPUFFT1D,
  GPUConvolution,
  GraphVectorView,
  getGPUFFT1DSupport,
  getGPUConvolutionSupport
} from '@luma.gl/gpgpu/gpu-core';
import {getViewBindingRange} from '../../src/gpu-core/graph-data-view-utils';
import {BatchConformanceFixture} from './batch-conformance-utils';

test('FFT batching bounds scratch and splits bindings without packing caller buffers', () => {
  const device = makeDevice(1024);
  const fixture = new BatchConformanceFixture(device);
  try {
    const input = fixture.column('input', 'float32x2', Array(512).fill(1), [0, 129, 127]);
    const output = fixture.column('output', 'float32x2', Array(512).fill(77), [65, 0, 191]);
    const props = {input, output, length: 8, batchCount: 32, strategy: 'portable' as const};
    expect(getGPUFFT1DSupport(device, {length: 8, batchCount: 32}).supported).toBe(false);
    expect(getGPUFFT1DSupport(device, props).supported).toBe(true);
    const allocate = vi.spyOn(fixture.graph, 'createTransientBuffer');
    const nodes = new GPUFFT1D(props).getCommandNodes(fixture.graph);
    expect(allocate).toHaveBeenCalledTimes(2);
    expect(allocate.mock.calls.every(([allocation]) => allocation.byteLength <= 1024)).toBe(true);
    for (const node of nodes) {
      for (const resource of node.resources ?? []) {
        if ('buffer' in resource && 'format' in resource.buffer)
          expect(getViewBindingRange(resource.buffer).size).toBeLessThanOrEqual(1024);
      }
    }
    expect(new Set(nodes.map(node => node.id)).size).toBe(nodes.length);
    // Compile resource planning without asking NullDevice to compile GPU pipelines.
    fixture.graph.add(nodes.map(node => ({...node, compile: () => ({encode() {}})})));
    const executable = fixture.graph.compile();
    try {
      expect(executable.preflight.largestBufferByteLength).toBeGreaterThan(1024);
      expect(executable.preflight.largestStorageBufferBindingByteLength).toBeLessThanOrEqual(1024);
      expect(executable.preflight.fitsDeviceLimits).toBe(true);
    } finally {
      executable.destroy();
    }
    allocate.mockRestore();
  } finally {
    fixture.destroy();
    device.destroy();
  }
});

test('direct convolution accepts a globally large field using independently bounded chunks', () => {
  const device = makeDevice(1024);
  const fixture = new BatchConformanceFixture(device);
  try {
    const input = fixture.column('input', 'float32', Array(1024).fill(1), Array(8).fill(128));
    const kernel = fixture.column('kernel', 'float32', Array(9).fill(1), [4, 0, 5]);
    const output = fixture.column('output', 'float32', Array(1024).fill(77), Array(8).fill(128));
    const plan = {
      width: 32,
      height: 32,
      kernelWidth: 3,
      kernelHeight: 3,
      strategy: 'direct' as const
    };
    expect(getGPUConvolutionSupport(device, plan).supported).toBe(false);
    expect(getGPUConvolutionSupport(device, {...plan, input, kernel, output}).supported).toBe(true);
    const allocate = vi.spyOn(fixture.graph, 'createTransientBuffer');
    const nodes = new GPUConvolution({...plan, input, kernel, output}).getCommandNodes(
      fixture.graph
    );
    expect(nodes).toHaveLength(128);
    expect(
      nodes.filter(node => node.resources?.some(resource => resource.usage === 'storage-write'))
    ).toHaveLength(8);
    expect(
      nodes.filter(node =>
        node.resources?.some(resource => resource.usage === 'storage-read-write')
      )
    ).toHaveLength(120);
    expect(allocate).not.toHaveBeenCalled();
    allocate.mockRestore();
  } finally {
    fixture.destroy();
    device.destroy();
  }
});

test('chunked spectral convolution retains its existing FFT workspace and automatic strategy', () => {
  const device = makeDevice();
  const fixture = new BatchConformanceFixture(device);
  try {
    const input = fixture.column('input', 'float32', Array(64).fill(1), [31, 0, 33]);
    const kernel = fixture.column('kernel', 'float32', Array(65 * 65).fill(1), [2048, 0, 2177]);
    const output = fixture.column('output', 'float32', Array(64).fill(77), [1, 63]);
    const props = {input, kernel, output, width: 8, height: 8, kernelWidth: 65, kernelHeight: 65};
    expect(getGPUConvolutionSupport(device, props).strategy).toBe('fft');
    const allocate = vi.spyOn(fixture.graph, 'createTransientBuffer');
    const nodes = new GPUConvolution(props).getCommandNodes(fixture.graph);
    expect(allocate).toHaveBeenCalledTimes(9);
    expect(
      nodes.filter(node => node.workload?.operation === 'GPUConvolution.fft.pack')
    ).toHaveLength(4);
    expect(
      nodes.filter(node => node.workload?.operation === 'GPUConvolution.fft.crop')
    ).toHaveLength(2);
    allocate.mockRestore();
  } finally {
    fixture.destroy();
    device.destroy();
  }
});

test('transform batching rejects aliases, overlapping destinations, bad layouts, and foreign empty chunks', () => {
  const device = makeDevice();
  const fixture = new BatchConformanceFixture(device);
  const foreign = new BatchConformanceFixture(device);
  try {
    const input = fixture.column('input', 'float32x2', Array(32).fill(1), [0, 8, 8]);
    const output = fixture.column('output', 'float32x2', Array(32).fill(77), [8, 8, 0]);
    if (!('data' in input) || !('data' in output)) throw new Error('Expected vectors');
    const overlap = new GraphVectorView({...output, data: [output.data[0], output.data[0]]});
    const empty = foreign.output('empty', 'float32x2', 0);
    const invalid = new GraphVectorView({...input, data: [...input.data, empty]});
    const props = {input, output, length: 8, batchCount: 2};
    expect(() => new GPUFFT1D({...props, output: input})).toThrow(/separate buffers/);
    expect(() => new GPUFFT1D({...props, output: overlap})).toThrow(/overlap/);
    expect(() => new GPUFFT1D({...props, input: invalid}).getCommandNodes(fixture.graph)).toThrow(
      /different GPUCommandGraph/
    );
    const misaligned = fixture.graph.createDataView(input.data[1].buffer, {
      format: 'float32x2',
      byteOffset: 4,
      length: 8
    });
    expect(() => new GPUFFT1D({...props, input: misaligned, batchCount: 1})).toThrow(
      /vec2-aligned/
    );

    const scalarInput = fixture.column('scalar-input', 'float32', Array(16).fill(1), [8, 8]);
    const scalarOutput = fixture.column('scalar-output', 'float32', Array(16).fill(1), [8, 8]);
    const kernel = fixture.column('kernel', 'float32', Array(9).fill(1), [3, 6]);
    if (!('data' in scalarOutput) || !('data' in kernel)) throw new Error('Expected vectors');
    const convolution = {
      input: scalarInput,
      output: scalarOutput,
      kernel,
      width: 4,
      height: 4,
      kernelWidth: 3,
      kernelHeight: 3
    };
    expect(() => new GPUConvolution({...convolution, output: scalarInput})).toThrow(
      /separate buffer/
    );
    expect(
      () =>
        new GPUConvolution({
          ...convolution,
          output: new GraphVectorView({
            ...scalarOutput,
            data: [scalarOutput.data[0], scalarOutput.data[0]]
          })
        })
    ).toThrow(/overlap/);
    expect(() =>
      new GPUConvolution({
        ...convolution,
        kernel: new GraphVectorView({
          ...kernel,
          data: [...kernel.data, foreign.output('empty-kernel', 'float32', 0)]
        })
      }).getCommandNodes(fixture.graph)
    ).toThrow(/different GPUCommandGraph/);
    const strided = fixture.column('strided', 'float32', Array(16).fill(1), [8, 8], {stride: 2});
    expect(() => new GPUConvolution({...convolution, input: strided})).toThrow(/packed/);
  } finally {
    fixture.destroy();
    foreign.destroy();
    device.destroy();
  }
});

test('support checks the actual FFT block and active convolution destination spans', () => {
  const device = makeDevice(1024, 1);
  const fixture = new BatchConformanceFixture(device);
  try {
    const input = fixture.column('input', 'float32x2', Array(1024).fill(1), [512], {atomic: true});
    const output = fixture.column('output', 'float32x2', Array(1024).fill(77), [512], {
      atomic: true
    });
    const props = {input, output, length: 8, batchCount: 64};
    expect(getGPUFFT1DSupport(device, props).supported).toBe(true);
    expect(() => new GPUFFT1D(props).getCommandNodes(fixture.graph)).not.toThrow();
    // The fixture adds a four-byte prefix; use 255 rows per active binding.
    const scalarInput = fixture.column(
      'scalar-input',
      'float32',
      Array(512).fill(1),
      [255, 255, 2]
    );
    const scalarOutput = fixture.column(
      'scalar-output',
      'float32',
      Array(1024).fill(77),
      [255, 255, 2, 512]
    );
    const kernel = fixture.column('kernel', 'float32', [1], [1]);
    const convolution = {
      input: scalarInput,
      kernel,
      output: scalarOutput,
      width: 32,
      height: 16,
      kernelWidth: 1,
      kernelHeight: 1
    };
    expect(getGPUConvolutionSupport(device, convolution).supported).toBe(true);
  } finally {
    fixture.destroy();
    device.destroy();
  }
  const atomicDevice = makeDevice(1 << 28, 1);
  const atomicFixture = new BatchConformanceFixture(atomicDevice);
  try {
    const input = atomicFixture.column('input', 'float32x2', Array(16384).fill(1), [8192], {
      atomic: true
    });
    const output = atomicFixture.column('output', 'float32x2', Array(16384).fill(0), [8192], {
      atomic: true
    });
    expect(
      getGPUFFT1DSupport(atomicDevice, {input, output, length: 8, batchCount: 1024}).supported
    ).toBe(false);
  } finally {
    atomicFixture.destroy();
    atomicDevice.destroy();
  }
});

function makeDevice(bindingLimit = 1 << 28, dispatchLimit = 65535) {
  const device = new NullDevice({});
  Object.defineProperty(device, 'type', {value: 'webgpu'});
  for (const [name, value] of Object.entries({
    maxComputeWorkgroupsPerDimension: dispatchLimit,
    maxComputeInvocationsPerWorkgroup: 256,
    maxComputeWorkgroupSizeX: 256,
    maxStorageBuffersPerShaderStage: 8,
    maxStorageBufferBindingSize: bindingLimit,
    maxBufferSize: 1 << 30
  })) {
    Object.defineProperty(device.limits, name, {value});
  }
  return device;
}
