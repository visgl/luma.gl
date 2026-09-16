// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {NullDevice} from '@luma.gl/test-utils';
import {GPUGather, GPUUint32Gather, GraphVectorView} from '@luma.gl/gpgpu/gpu-core';
import {getGraphDataPrefix} from '../../src/gpu-core/graph-data-view-utils';
import {BatchConformanceFixture} from './batch-conformance-utils';

test('gather validates every chunk and lowers without allocating or copying buffers', () => {
  const device = new NullDevice({});
  Object.defineProperty(device, 'type', {value: 'webgpu'});
  Object.defineProperty(device.limits, 'maxComputeWorkgroupsPerDimension', {value: 65535});
  const fixture = new BatchConformanceFixture(device);
  const foreign = new BatchConformanceFixture(device);
  try {
    const props = {
      source: fixture.column('source', 'uint32', [9, 8, 7, 6], [1, 0, 3]),
      indices: fixture.column('indices', 'uint32', [3, 0, 2], [1, 2]),
      output: fixture.column('output', 'uint32', Array(5).fill(0), [2, 0, 3])
    };
    const strided = fixture.column('strided', 'uint32', Array(5).fill(0), [1, 4], {stride: 2});
    for (const Operation of [GPUGather, GPUUint32Gather]) {
      expect(() => new Operation({...props, source: strided})).not.toThrow();
      for (const name of ['indices', 'output'] as const) {
        expect(() => new Operation({...props, [name]: strided})).toThrow(/packed/);
      }
      expect(
        () =>
          new Operation({...props, output: fixture.output(`short-${Operation.name}`, 'uint32', 2)})
      ).toThrow(/at least/);
      expect(() => new Operation({...props, output: props.source})).toThrow(/separate buffer/);
      expect(() => new Operation({...props, output: props.indices})).toThrow(/separate buffer/);
      if (!('data' in props.output)) throw new Error('Expected vector fixture');
      const output = new GraphVectorView({
        ...props.output,
        length: 6,
        valueLength: 6,
        data: [...props.output.data, foreign.output(`foreign-${Operation.name}`, 'uint32', 1)]
      });
      expect(() => new Operation({...props, output}).getCommandNodes(fixture.graph)).toThrow(
        /target graph/
      );
    }
    for (const invalidValue of [-1, 0x100000000, 0.5, NaN]) {
      expect(() => new GPUUint32Gather({...props, invalidValue})).toThrow(/invalidValue/);
    }
    const allocate = vi.spyOn(fixture.graph, 'createTransientBuffer');
    try {
      const nodes = new GPUGather(props).getCommandNodes(fixture.graph);
      expect(nodes).toHaveLength(6);
      expect(new Set(nodes.map(node => node.id)).size).toBe(nodes.length);
      expect(allocate).not.toHaveBeenCalled();
    } finally {
      allocate.mockRestore();
    }
  } finally {
    fixture.destroy();
    foreign.destroy();
    device.destroy();
  }
});

test('fixed-size-list prefixes preserve flattened value counts and borrow complete chunks', () => {
  const device = new NullDevice({});
  Object.defineProperty(device, 'type', {value: 'webgpu'});
  const fixture = new BatchConformanceFixture(device);
  try {
    const storage = fixture.output('storage', 'uint32', 30);
    const first = fixture.graph.createDataView(storage.buffer, {
      format: 'fixed-size-list<uint32,3>',
      length: 2
    });
    const second = fixture.graph.createDataView(storage.buffer, {
      format: 'fixed-size-list<uint32,3>',
      length: 3,
      byteOffset: 24
    });
    const vector = new GraphVectorView({
      id: 'lists',
      name: 'lists',
      format: first.format,
      length: 5,
      valueLength: 15,
      stride: 3,
      byteStride: 12,
      rowByteLength: 12,
      data: [first, second]
    });
    const prefix = getGraphDataPrefix(fixture.graph, vector, 3);
    expect(prefix).toBeInstanceOf(GraphVectorView);
    if (!('data' in prefix)) throw new Error('Expected vector prefix');
    expect(prefix.valueLength).toBe(9);
    expect(prefix.data[0]).toBe(first);
    expect(prefix.data[1].buffer).toBe(second.buffer);
    expect(prefix.data[1].byteOffset).toBe(second.byteOffset);
    expect(prefix.data[1].length).toBe(1);
  } finally {
    fixture.destroy();
    device.destroy();
  }
});
