// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {NullDevice} from '@luma.gl/test-utils';
import {
  GPUHashIndex,
  GPUHashIndexQuery,
  GPUHashJoin,
  GraphVectorView
} from '@luma.gl/gpgpu/gpu-core';
import {BatchConformanceFixture} from './batch-conformance-utils';
import {getViewBindingRange} from '../../src/gpu-core/graph-data-view-utils';

function setup() {
  const device = new NullDevice({});
  Object.defineProperty(device, 'type', {value: 'webgpu'});
  Object.defineProperty(device, 'limits', {
    value: {
      ...device.limits,
      maxComputeWorkgroupsPerDimension: 65535,
      maxStorageBufferBindingSize: 1024,
      maxBufferSize: 1024
    }
  });
  const fixture = new BatchConformanceFixture(device);
  const keys = fixture.column('keys', 'uint32', Array(600).fill(7), [0, 200, 200, 0, 200, 0]);
  const values = fixture.column('values', 'uint32', Array(600).fill(70), [100, 200, 100, 200]);
  const indexProps = {
    keys,
    values,
    tableKeys: fixture.output('table-keys', 'uint32', 16),
    tableValues: fixture.output('table-values', 'uint32', 16),
    statistics: fixture.output('build-statistics', 'uint32', 6)
  };
  const index = new GPUHashIndex(indexProps);
  const queryProps = {
    index,
    keys,
    values: fixture.column('result', 'uint32', Array(600).fill(77), [200, 200, 200]),
    found: fixture.column('found', 'uint32', Array(600).fill(77), [100, 200, 200, 100]),
    probes: fixture.column('probes', 'uint32', Array(600).fill(77), [200, 0, 200, 200]),
    statistics: fixture.output('query-statistics', 'uint32', 4)
  };
  const joinProps = {
    index,
    keys,
    outputLeftRows: queryProps.values,
    outputRightRows: queryProps.found,
    count: fixture.output('count', 'uint32', 1),
    overflow: fixture.output('overflow', 'uint32', 1),
    statistics: queryProps.statistics
  };
  return {device, fixture, keys, values, index, indexProps, queryProps, joinProps};
}

test('hash planning borrows independent chunks and keeps scratch below a single binding', () => {
  const {device, fixture, index, queryProps, joinProps} = setup();
  const allocate = vi.spyOn(fixture.graph, 'createTransientBuffer');
  const createBuffer = vi.spyOn(device, 'createBuffer');
  try {
    const indexNodes = index.getCommandNodes(fixture.graph);
    expect(allocate.mock.calls.map(([props]) => props.byteLength)).toEqual([64]);
    allocate.mockClear();
    const queryNodes = new GPUHashIndexQuery(queryProps).getCommandNodes(fixture.graph);
    expect(allocate).not.toHaveBeenCalled();
    const joinNodes = new GPUHashJoin(joinProps).getCommandNodes(fixture.graph);
    expect(createBuffer).not.toHaveBeenCalled();
    expect(allocate.mock.calls.length).toBeGreaterThan(0);
    expect(allocate.mock.calls.every(([props]) => props.byteLength <= 800)).toBe(true);
    const borrowed = new Set(fixture.storage.keys());
    for (const node of [...indexNodes, ...queryNodes, ...joinNodes]) {
      for (const resource of node.resources ?? []) {
        if ('buffer' in resource && 'buffer' in resource.buffer) {
          expect(getViewBindingRange(resource.buffer).size).toBeLessThanOrEqual(1024);
          if (queryNodes.includes(node)) expect(borrowed.has(resource.buffer.buffer)).toBe(true);
        }
      }
    }
  } finally {
    allocate.mockRestore();
    createBuffer.mockRestore();
    fixture.destroy();
    device.destroy();
  }
});

test('hash family validates every chunk, including foreign empty chunks', () => {
  const {device, fixture, keys, indexProps, queryProps, joinProps} = setup();
  const foreign = new BatchConformanceFixture(device);
  try {
    if (!(keys instanceof GraphVectorView)) throw new Error('Expected vector');
    const invalid = new GraphVectorView({
      ...keys,
      data: [...keys.data, foreign.output('empty', 'uint32', 0)]
    });
    for (const operation of [
      new GPUHashIndex({...indexProps, keys: invalid}),
      new GPUHashIndexQuery({...queryProps, keys: invalid}),
      new GPUHashJoin({...joinProps, keys: invalid})
    ])
      expect(() => operation.getCommandNodes(fixture.graph)).toThrow(/target graph/);
    const output = queryProps.probes;
    if (!(output instanceof GraphVectorView)) throw new Error('Expected vector');
    const invalidOutput = new GraphVectorView({
      ...output,
      data: [...output.data, foreign.output('empty-output', 'uint32', 0)]
    });
    expect(() =>
      new GPUHashIndexQuery({...queryProps, probes: invalidOutput}).getCommandNodes(fixture.graph)
    ).toThrow(/target graph/);
    expect(() =>
      new GPUHashJoin({...joinProps, outputLeftRows: invalidOutput}).getCommandNodes(fixture.graph)
    ).toThrow(/target graph/);
    const strided = fixture.column('strided', 'uint32', Array(600).fill(7), Array(6).fill(100), {
      stride: 2
    });
    expect(() => new GPUHashIndex({...indexProps, keys: strided})).toThrow(/packed/);
    expect(() => new GPUHashIndexQuery({...queryProps, found: strided})).toThrow(/packed/);
    expect(() => new GPUHashJoin({...joinProps, leftRows: strided})).toThrow(/packed/);
  } finally {
    fixture.destroy();
    foreign.destroy();
    device.destroy();
  }
});

test('hash family rejects cross-chunk aliases, overlapping outputs, and invalid logical lengths', () => {
  const {device, fixture, keys, indexProps, queryProps, joinProps} = setup();
  try {
    const output = queryProps.values;
    if (!(output instanceof GraphVectorView)) throw new Error('Expected vector');
    const overlap = new GraphVectorView({
      ...output,
      data: [output.data[0], output.data[0], output.data[2]]
    });
    expect(
      () => new GPUHashIndex({...indexProps, tableKeys: 'data' in keys ? keys.data[1] : keys})
    ).toThrow(/power of two/);
    expect(() => new GPUHashIndex({...indexProps, values: indexProps.tableKeys})).toThrow(
      /lengths must match/
    );
    expect(
      () => new GPUHashIndex({...indexProps, values: undefined, firstValue: 0xffffffff})
    ).toThrow(/fit in uint32/);
    expect(() => new GPUHashIndexQuery({...queryProps, values: keys})).toThrow(/overlap/);
    expect(() => new GPUHashIndexQuery({...queryProps, values: overlap})).toThrow(/overlap/);
    expect(() => new GPUHashIndexQuery({...queryProps, values: indexProps.tableKeys})).toThrow(
      /match key length/
    );
    expect(() => new GPUHashJoin({...joinProps, outputLeftRows: keys})).toThrow(/overlap/);
    expect(() => new GPUHashJoin({...joinProps, outputLeftRows: overlap})).toThrow(/overlap/);
    expect(() => new GPUHashJoin({...joinProps, outputRightRows: indexProps.tableKeys})).toThrow(
      /capacities must match/
    );
  } finally {
    fixture.destroy();
    device.destroy();
  }
});
