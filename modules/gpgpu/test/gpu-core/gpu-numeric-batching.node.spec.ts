// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {NullDevice} from '@luma.gl/test-utils';
import {
  GPUElementwise,
  GPUFiniteDifference2D,
  GPUFiniteDifference3D,
  getGPUFiniteDifference2DSupport,
  GraphVectorView
} from '@luma.gl/gpgpu/gpu-core';
import {BatchConformanceFixture} from './batch-conformance-utils';

test('elementwise aligns four independently partitioned operands without allocation', () => {
  const device = makeDevice();
  const fixture = new BatchConformanceFixture(device);
  try {
    const input = fixture.column('input', 'float32', Array(6).fill(1), [2, 0, 4]);
    const inputB = fixture.column('second', 'float32', Array(6).fill(1), [0, 1, 5]);
    const inputC = fixture.column('third', 'float32', Array(6).fill(1), [3, 3]);
    const output = fixture.column('output', 'float32', Array(6).fill(1), [4, 0, 2]);
    const allocate = vi.spyOn(fixture.graph, 'createTransientBuffer');
    const nodes = new GPUElementwise({
      input,
      inputB,
      inputC,
      output,
      operation: 'multiply-add'
    }).getCommandNodes(fixture.graph);
    expect(nodes).toHaveLength(5);
    expect(nodes.reduce((total, node) => total + (node.workload?.writeByteLength ?? 0), 0)).toBe(
      24
    );
    expect(allocate).not.toHaveBeenCalled();
    allocate.mockRestore();
  } finally {
    fixture.destroy();
    device.destroy();
  }
});

test('numeric batching rejects aliases, bad layouts, and foreign empty chunks before lowering', () => {
  const device = makeDevice();
  const fixture = new BatchConformanceFixture(device);
  const foreign = new BatchConformanceFixture(device);
  try {
    const input = fixture.column('input', 'float32', Array(64).fill(1), [0, 16, 48]);
    const output = fixture.column('output', 'float32', Array(64).fill(1), [32, 32, 0]);
    const strided = fixture.column('strided', 'float32', Array(64).fill(1), [32, 32], {stride: 2});
    if (!('data' in input) || !('data' in output)) throw new Error('Expected vector');
    const overlap = new GraphVectorView({...output, data: [output.data[0], output.data[0]]});
    const foreignEmpty = new GraphVectorView({
      ...input,
      data: [foreign.output('empty', 'float32', 0), ...input.data]
    });
    const factories = [
      (source: typeof strided, destination: typeof strided) =>
        new GPUElementwise({input: source, output: destination, operation: 'copy'}),
      (source: typeof strided, destination: typeof strided) =>
        new GPUFiniteDifference2D({
          input: source,
          output: destination,
          width: 8,
          height: 8,
          spacing: [1, 1],
          operator: 'laplacian'
        }),
      (source: typeof strided, destination: typeof strided) =>
        new GPUFiniteDifference3D({
          input: source,
          output: destination,
          width: 4,
          height: 4,
          depth: 4,
          spacing: [1, 1, 1],
          operator: 'laplacian'
        })
    ];
    for (const makeOperation of factories) {
      expect(() => makeOperation(input, input)).toThrow(/separate buffers/);
      expect(() => makeOperation(input, overlap)).toThrow(/overlap/);
      expect(() => makeOperation(strided, output)).toThrow(/packed/);
      expect(() => makeOperation(foreignEmpty, output).getCommandNodes(fixture.graph)).toThrow(
        /graph/i
      );
    }
    expect(() => new GPUElementwise({input, output, operation: 'multiply-add'})).toThrow(
      /requires inputB/
    );
    expect(
      () => new GPUElementwise({input, inputB: output, output, operation: 'multiply-add'})
    ).toThrow(/requires inputC/);
    const short = fixture.output('short', 'float32', 63);
    expect(() => new GPUElementwise({input, output: short, operation: 'copy'})).toThrow(/length/);
    expect(
      () =>
        new GPUFiniteDifference2D({
          input,
          output: short,
          width: 8,
          height: 8,
          spacing: [1, 1],
          operator: 'laplacian'
        })
    ).toThrow(/contain the field/);
  } finally {
    fixture.destroy();
    foreign.destroy();
    device.destroy();
  }
});

test('finite differences check chunk binding limits and reuse bounded stencil scratch', () => {
  const device = makeDevice(1024);
  const fixture = new BatchConformanceFixture(device);
  try {
    const input = fixture.column('input', 'float32', Array(1024).fill(1), Array(8).fill(128));
    const output = fixture.column('output', 'float32', Array(1024).fill(77), Array(8).fill(128));
    const plan = {width: 32, height: 32, spacing: [1, 1] as const, operator: 'laplacian' as const};
    expect(getGPUFiniteDifference2DSupport(device, plan).supported).toBe(false);
    expect(getGPUFiniteDifference2DSupport(device, {...plan, input, output}).supported).toBe(true);
    const allocate = vi.spyOn(fixture.graph, 'createTransientBuffer');
    const nodes = new GPUFiniteDifference2D({...plan, input, output}).getCommandNodes(
      fixture.graph
    );
    expect(nodes.length).toBeGreaterThan(8);
    expect(allocate).toHaveBeenCalledTimes(1);
    expect(allocate.mock.calls[0][0].byteLength).toBeLessThanOrEqual(1024);
    const oversized = fixture.output('oversized', 'float32', 1024);
    expect(
      getGPUFiniteDifference2DSupport(device, {...plan, input: oversized, output}).supported
    ).toBe(false);
    expect(() =>
      new GPUFiniteDifference2D({...plan, input: oversized, output}).getCommandNodes(fixture.graph)
    ).toThrow(/chunk exceeds/);
    allocate.mockRestore();
  } finally {
    fixture.destroy();
    device.destroy();
  }
});

test('finite differences with one source chunk allocate no stencil scratch', () => {
  const device = makeDevice();
  const fixture = new BatchConformanceFixture(device);
  try {
    const input = fixture.column('input', 'float32', Array(64).fill(1), [0, 64, 0]);
    const output = fixture.column('output', 'float32', Array(64).fill(1), [17, 0, 47]);
    const allocate = vi.spyOn(fixture.graph, 'createTransientBuffer');
    expect(
      new GPUFiniteDifference2D({
        input,
        output,
        width: 8,
        height: 8,
        spacing: [1, 1],
        operator: 'laplacian'
      }).getCommandNodes(fixture.graph)
    ).toHaveLength(2);
    expect(allocate).not.toHaveBeenCalled();
    allocate.mockRestore();
  } finally {
    fixture.destroy();
    device.destroy();
  }
});

function makeDevice(bindingLimit = 1 << 28) {
  const device = new NullDevice({});
  Object.defineProperty(device, 'type', {value: 'webgpu'});
  for (const [name, value] of Object.entries({
    maxComputeWorkgroupsPerDimension: 65535,
    maxComputeInvocationsPerWorkgroup: 256,
    maxComputeWorkgroupSizeX: 256,
    maxStorageBufferBindingSize: bindingLimit,
    maxBufferSize: 1 << 30
  })) {
    Object.defineProperty(device.limits, name, {value});
  }
  return device;
}
