// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {NullDevice} from '@luma.gl/test-utils';
import {GPUFlagOffsets, GPUSegmentOffsets} from '@luma.gl/gpgpu/gpu-core';
import {getGraphDataPrefix} from '../../src/gpu-core/graph-data-view-utils';
import {BatchConformanceFixture} from './batch-conformance-utils';

test('prefix views borrow buffers and retain complete chunks without allocating scratch', () => {
  const device = new NullDevice({});
  Object.defineProperty(device, 'type', {value: 'webgpu'});
  const fixture = new BatchConformanceFixture(device);
  const input = fixture.column('input', 'uint32', Array(9).fill(1), [0, 2, 0, 5, 2]);
  const allocate = vi.spyOn(device, 'createBuffer');
  try {
    const prefix = getGraphDataPrefix(fixture.graph, input, 6);
    expect('data' in prefix).toBe(true);
    if (!('data' in prefix) || !('data' in input)) throw new Error('Expected vector fixture');
    expect(prefix.length).toBe(6);
    expect(prefix.data.map(chunk => chunk.length)).toEqual([0, 2, 0, 4]);
    expect(prefix.data[1]).toBe(input.data[1]);
    expect(prefix.data[3].buffer).toBe(input.data[3].buffer);
    expect(prefix.data[3].byteOffset).toBe(input.data[3].byteOffset);
    expect(getGraphDataPrefix(fixture.graph, input, 9)).toBe(input);
    expect(allocate).not.toHaveBeenCalled();
    expect(() => getGraphDataPrefix(fixture.graph, input, 10)).toThrow(/prefix/);
  } finally {
    allocate.mockRestore();
    fixture.destroy();
    device.destroy();
  }
});

test('offset operations reject short capacity and unpacked views', () => {
  const device = new NullDevice({});
  Object.defineProperty(device, 'type', {value: 'webgpu'});
  const fixture = new BatchConformanceFixture(device);
  try {
    const flags = fixture.column('flags', 'uint32', [1, 0, 1], [1, 2]);
    const short = fixture.output('short', 'uint32', 2);
    const offsets = fixture.output('offsets', 'uint32', 3);
    const count = fixture.output('count', 'uint32', 1);
    const strided = fixture.column('strided', 'uint32', [1, 0, 1], [3], {stride: 2});
    expect(() => new GPUFlagOffsets({flags, offsets: short, count})).toThrow(/at least/);
    expect(() => new GPUFlagOffsets({flags: strided, offsets, count})).toThrow(/packed/);
    const props = {
      elementFlags: flags,
      elementOffsets: offsets,
      segmentStartFlags: flags,
      segmentIndices: offsets,
      segmentOffsets: fixture.output('segments', 'uint32', 4),
      segmentCount: count
    };
    for (const name of ['elementOffsets', 'segmentStartFlags', 'segmentIndices'] as const) {
      expect(() => new GPUSegmentOffsets({...props, [name]: short})).toThrow(/cover every/);
      expect(() => new GPUSegmentOffsets({...props, [name]: strided})).toThrow(/packed/);
    }
  } finally {
    fixture.destroy();
    device.destroy();
  }
});
