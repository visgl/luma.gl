// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {NullDevice} from '@luma.gl/test-utils';
import {
  GPUGridBinning,
  GPUGridAggregation,
  GPUPointSpatialFilter,
  GraphVectorView
} from '@luma.gl/gpgpu/gpu-core';
import {BatchConformanceFixture} from './batch-conformance-utils';
import {getViewBindingRange} from '../../src/gpu-core/graph-data-view-utils';

for (const operation of ['binning', 'sum', 'min', 'max', 'mean', 'filter'] as const) {
  test(`spatial ${operation} borrows independently partitioned storage within binding limits`, () => {
    const device = makeDevice(2048);
    const fixture = new BatchConformanceFixture(device);
    try {
      const positions = fixture.column(
        'positions',
        'float32x2',
        Array(1024).fill(0),
        [0, 128, 128, 128, 128]
      );
      const weights = fixture.column('weights', 'float32', Array(512).fill(1), [200, 0, 312]);
      const output = fixture.column(
        'output',
        'float32',
        Array(1024).fill(77),
        [256, 0, 256, 256, 256]
      );
      const counts = fixture.column(
        'counts',
        'uint32',
        Array(1024).fill(77),
        [256, 256, 0, 256, 256]
      );
      const mask = fixture.column('mask', 'uint32', Array(512).fill(77), [100, 0, 412]);
      const ids = fixture.column('ids', 'uint32', Array(512).fill(0), [255, 0, 257]);
      const count = fixture.output('count', 'uint32', 1);
      const overflow = fixture.output('overflow', 'uint32', 1);
      const query = fixture.output('query', 'float32', 4);
      const allocate = vi.spyOn(fixture.graph, 'createTransientBuffer');
      const shared = {positions, gridSize: [32, 32] as const, bounds: [0, 0, 1, 1] as const};
      const nodes = (
        operation === 'binning'
          ? new GPUGridBinning({...shared, output: counts})
          : operation === 'filter'
            ? new GPUPointSpatialFilter({
                positions,
                outputMask: mask,
                query,
                kind: 'bounds',
                overflow,
                candidates: {ids, count}
              })
            : new GPUGridAggregation({...shared, weights, output, operation})
      ).getCommandNodes(fixture.graph);
      expect(allocate).toHaveBeenCalledTimes(operation === 'mean' ? 4 : 0);
      for (const [props] of allocate.mock.calls) expect(props.byteLength).toBe(256 * 4);
      const borrowed = new Set(fixture.storage.keys());
      for (const node of nodes) {
        for (const resource of node.resources ?? []) {
          if ('buffer' in resource && 'buffer' in resource.buffer) {
            expect(getViewBindingRange(resource.buffer).size).toBeLessThanOrEqual(2048);
            if (operation !== 'mean') expect(borrowed.has(resource.buffer.buffer)).toBe(true);
          }
        }
      }
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

test('spatial validation rejects writable overlap, packed-layout mismatches, and foreign empty chunks', () => {
  const device = makeDevice();
  const fixture = new BatchConformanceFixture(device);
  const foreign = new BatchConformanceFixture(device);
  try {
    const positions = fixture.column('positions', 'float32x2', Array(8).fill(0), [2, 0, 2]);
    const weights = fixture.column('weights', 'float32', Array(4).fill(1), [1, 3]);
    const output = fixture.column('output', 'float32', Array(4).fill(77), [2, 2]);
    const mask = fixture.column('mask', 'uint32', Array(4).fill(77), [2, 2]);
    const query = fixture.output('query', 'float32', 4);
    const overflow = fixture.output('overflow', 'uint32', 1);
    if (!('data' in positions) || !('data' in output) || !('data' in mask))
      throw new Error('Expected vectors');
    const foreignPositions = new GraphVectorView({
      ...positions,
      data: [...positions.data, foreign.output('empty', 'float32x2', 0)]
    });
    const foreignMask = new GraphVectorView({
      ...mask,
      data: [...mask.data, foreign.output('empty-mask', 'uint32', 0)]
    });
    const overlappingOutput = new GraphVectorView({
      ...output,
      data: [output.data[0], output.data[0]]
    });
    const overlappingMask = new GraphVectorView({...mask, data: [mask.data[0], mask.data[0]]});
    const shared = {positions, gridSize: [2, 2] as const, bounds: [0, 0, 1, 1] as const};
    expect(() => new GPUGridAggregation({...shared, weights, output: overlappingOutput})).toThrow(
      /overlap/
    );
    expect(() => new GPUGridAggregation({...shared, weights, output: weights})).toThrow(/overlap/);
    expect(() => new GPUGridBinning({...shared, output: overlappingMask})).toThrow(/overlap/);
    expect(() =>
      new GPUGridBinning({...shared, positions: foreignPositions, output: mask}).getCommandNodes(
        fixture.graph
      )
    ).toThrow(/target graph/);
    expect(() =>
      new GPUGridAggregation({
        ...shared,
        positions: foreignPositions,
        weights,
        output
      }).getCommandNodes(fixture.graph)
    ).toThrow(/target graph/);
    expect(() =>
      new GPUGridBinning({...shared, output: foreignMask}).getCommandNodes(fixture.graph)
    ).toThrow(/target graph/);
    const filter = {positions, outputMask: mask, query, overflow, kind: 'bounds' as const};
    expect(() => new GPUPointSpatialFilter({...filter, outputMask: overlappingMask})).toThrow(
      /overlap/
    );
    expect(
      () => new GPUPointSpatialFilter({...filter, candidates: {ids: mask, count: overflow}})
    ).toThrow(/overlap/);
    expect(() =>
      new GPUPointSpatialFilter({...filter, positions: foreignPositions}).getCommandNodes(
        fixture.graph
      )
    ).toThrow(/target graph/);
    const count = fixture.output('candidate-count', 'uint32', 1);
    const foreignIds = foreign.column('foreign-ids', 'uint32', [], [0]);
    expect(() =>
      new GPUPointSpatialFilter({...filter, candidates: {ids: foreignIds, count}}).getCommandNodes(
        fixture.graph
      )
    ).toThrow(/target graph/);
    const strided = fixture.column('strided', 'float32x2', Array(8).fill(0), [4], {stride: 3});
    expect(() => new GPUGridBinning({...shared, positions: strided, output: mask})).toThrow(
      /packed/
    );
    expect(() => new GPUGridAggregation({...shared, positions: strided, weights, output})).toThrow(
      /packed/
    );
    expect(() => new GPUPointSpatialFilter({...filter, positions: strided})).toThrow(/packed/);
    expect(
      () =>
        new GPUGridAggregation({...shared, weights: fixture.output('short', 'float32', 3), output})
    ).toThrow(/same number/);
    expect(() => new GPUGridBinning({...shared, gridSize: [65536, 65536], output: mask})).toThrow(
      /output.length/
    );
  } finally {
    fixture.destroy();
    foreign.destroy();
    device.destroy();
  }
});

test('spatial lowering rejects oversized active bindings and dispatches', () => {
  for (const [bindingLimit, dispatchLimit, expected] of [
    [32, 65535, /storage binding/],
    [1 << 28, 1, /dispatch limit/]
  ] as const) {
    const device = makeDevice(bindingLimit, dispatchLimit);
    const fixture = new BatchConformanceFixture(device);
    try {
      const positions = fixture.output('positions', 'float32x2', 257);
      const weights = fixture.output('weights', 'float32', 257);
      const counts = fixture.output('counts', 'uint32', 4);
      const output = fixture.output('output', 'float32', 4);
      const mask = fixture.output('mask', 'uint32', 257);
      const shared = {positions, gridSize: [2, 2] as const, bounds: [0, 0, 1, 1] as const};
      expect(() =>
        new GPUGridBinning({...shared, output: counts}).getCommandNodes(fixture.graph)
      ).toThrow(expected);
      expect(() =>
        new GPUGridAggregation({...shared, weights, output}).getCommandNodes(fixture.graph)
      ).toThrow(expected);
      expect(() =>
        new GPUPointSpatialFilter({
          positions,
          outputMask: mask,
          kind: 'bounds',
          query: fixture.output('query', 'float32', 4),
          overflow: fixture.output('overflow', 'uint32', 1)
        }).getCommandNodes(fixture.graph)
      ).toThrow(expected);
    } finally {
      fixture.destroy();
      device.destroy();
    }
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
