// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {NullDevice} from '@luma.gl/test-utils';
import {GPUMatVec, GPUMatMul, GraphVectorView} from '@luma.gl/gpgpu/gpu-core';
import {BatchConformanceFixture} from './batch-conformance-utils';
import {getViewBindingRange} from '../../src/gpu-core/graph-data-view-utils';

for (const kind of ['matvec', 'matmul'] as const) {
  test(`${kind} preserves chunks and bounds bindings without scratch`, () => {
    const device = makeDevice(1024);
    const fixture = new BatchConformanceFixture(device);
    try {
      const left = fixture.column('left', 'float32', Array(1024).fill(1), Array(8).fill(128));
      const rightCount = kind === 'matvec' ? 32 : 512;
      const right = fixture.column(
        'right',
        'float32',
        Array(rightCount).fill(2),
        kind === 'matvec' ? [0, 13, 19] : [128, 0, 128, 128, 128]
      );
      const outputCount = kind === 'matvec' ? 32 : 512;
      const output = fixture.column(
        'output',
        'float32',
        Array(outputCount).fill(77),
        kind === 'matvec' ? [3, 0, 29] : [127, 0, 128, 128, 129]
      );
      const allocate = vi.spyOn(fixture.graph, 'createTransientBuffer');
      const nodes = (
        kind === 'matvec'
          ? new GPUMatVec({matrix: left, vector: right, output, rows: 32, columns: 32})
          : new GPUMatMul({left, right, output, m: 32, k: 32, n: 16})
      ).getCommandNodes(fixture.graph);
      expect(allocate).not.toHaveBeenCalled();
      expect(nodes.length).toBeGreaterThan(1);
      const handles = new Set(fixture.storage.keys());
      for (const node of nodes) {
        for (const resource of node.resources ?? []) {
          if ('buffer' in resource && 'buffer' in resource.buffer) {
            expect(handles.has(resource.buffer.buffer)).toBe(true);
            expect(getViewBindingRange(resource.buffer).size).toBeLessThanOrEqual(1024);
          }
        }
      }
      expect(
        nodes.filter(node => node.resources?.some(resource => resource.usage === 'storage-write'))
      ).toHaveLength(kind === 'matvec' ? 2 : 4);
      fixture.graph.add(nodes.map(node => ({...node, compile: () => ({encode() {}})})));
      const executable = fixture.graph.compile();
      try {
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
}

test('dense validation rejects aliases, overlap, layouts, capacities, dimensions, and foreign empty chunks', () => {
  const device = makeDevice();
  const fixture = new BatchConformanceFixture(device);
  const foreign = new BatchConformanceFixture(device);
  try {
    const left = fixture.column('left', 'float32', Array(12).fill(1), [5, 0, 7]);
    const right = fixture.column('right', 'float32', Array(12).fill(1), [7, 5]);
    const output = fixture.column('output', 'float32', Array(16).fill(77), [8, 8]);
    if (!('data' in left) || !('data' in output)) throw new Error('Expected vector');
    const overlap = new GraphVectorView({...output, data: [output.data[0], output.data[0]]});
    const invalid = new GraphVectorView({
      ...left,
      data: [...left.data, foreign.output('empty', 'float32', 0)]
    });
    const strided = fixture.column('strided', 'float32', Array(12).fill(1), [12], {stride: 2});
    for (const kind of ['matvec', 'matmul'] as const) {
      const make = (
        matrix: GPUMatVec['matrix'] = left,
        destination: GPUMatVec['output'] = output,
        columns = 3
      ) =>
        kind === 'matvec'
          ? new GPUMatVec({matrix, vector: right, output: destination, rows: 4, columns})
          : new GPUMatMul({left: matrix, right, output: destination, m: 4, k: columns, n: 3});
      expect(() => make(left, left)).toThrow(/separate/);
      expect(() => make(left, overlap)).toThrow(/overlap/);
      expect(() => make(strided)).toThrow(/packed/);
      expect(() => make(left, output, 5)).toThrow(/capacity/);
      expect(() => make(left, output, -1)).toThrow(/dimensions/);
      expect(() => make(left, output, 0x80000000)).toThrow(/dimensions/);
      expect(() => make(invalid).getCommandNodes(fixture.graph)).toThrow(/target graph/);
    }
  } finally {
    fixture.destroy();
    foreign.destroy();
    device.destroy();
  }
});

test('dense dispatch spreads work across dimensions and rejects unsupported limits', () => {
  const device = makeDevice(1 << 28, 2);
  const fixture = new BatchConformanceFixture(device);
  try {
    const matrix = fixture.output('matrix', 'float32', 5);
    const vector = fixture.output('vector', 'float32', 1);
    const output = fixture.output('output', 'float32', 5);
    const nodes = new GPUMatVec({matrix, vector, output, rows: 5, columns: 1}).getCommandNodes(
      fixture.graph
    );
    expect(nodes[0].workload?.maximumWorkgroupCount).toBe(8);
    const large = fixture.output('large', 'float32', 9);
    const destination = fixture.output('destination', 'float32', 9);
    expect(() =>
      new GPUMatVec({
        matrix: large,
        vector,
        output: destination,
        rows: 9,
        columns: 1
      }).getCommandNodes(fixture.graph)
    ).toThrow(/dispatch limit/);
  } finally {
    fixture.destroy();
    device.destroy();
  }
  const limited = makeDevice(32);
  const oversized = new BatchConformanceFixture(limited);
  try {
    const left = oversized.output('left', 'float32', 8);
    const right = oversized.output('right', 'float32', 1);
    const output = oversized.output('output', 'float32', 8);
    expect(() =>
      new GPUMatVec({matrix: left, vector: right, output, rows: 8, columns: 1}).getCommandNodes(
        oversized.graph
      )
    ).toThrow(/buffer limits/);
  } finally {
    oversized.destroy();
    limited.destroy();
  }
});

function makeDevice(bindingLimit = 1 << 28, dispatchLimit = 65535) {
  const device = new NullDevice({});
  Object.defineProperty(device, 'type', {value: 'webgpu'});
  for (const [name, value] of Object.entries({
    maxStorageBufferBindingSize: bindingLimit,
    maxBufferSize: 1 << 30,
    maxComputeWorkgroupsPerDimension: dispatchLimit,
    maxComputeInvocationsPerWorkgroup: 256,
    maxComputeWorkgroupSizeX: 256,
    maxComputeWorkgroupSizeY: 256,
    maxComputeWorkgroupStorageSize: 16384,
    maxStorageBuffersPerShaderStage: 8
  }))
    Object.defineProperty(device.limits, name, {value});
  return device;
}
