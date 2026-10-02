// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {NullDevice} from '@luma.gl/test-utils';
import {GPUScan, GPUReduction, GPUHistogram, GPUGroupAggregation} from '@luma.gl/gpgpu/gpu-core';
import {alignGraphVectorViews} from '../../src/gpu-core/graph-vector-view-utils';
import {BatchConformanceFixture} from './batch-conformance-utils';

test('heterogeneous alignment borrows source storage and preserves row layout', () => {
  const fixture = makeFixture();
  try {
    const keys = fixture.column('keys', 'uint32', [0, 1, 2, 3, 4, 5], [2, 0, 4], {stride: 2});
    const values = fixture.column('values', 'float32', [1, 2, 3, 4, 5, 6], [1, 3, 2], {stride: 3});
    const allocate = vi.spyOn(fixture.device, 'createBuffer');
    const spans = alignGraphVectorViews(fixture.graph, [keys, values]);
    expect(spans.map(([key]) => key.length)).toEqual([1, 1, 2, 2]);
    expect(spans.map(([key, value]) => [key.format, value.format])).toEqual(
      Array(4).fill(['uint32', 'float32'])
    );
    expect(spans.map(([key, value]) => [key.byteStride, value.byteStride])).toEqual(
      Array(4).fill([8, 12])
    );
    expect(spans.map(([key, value]) => [key.byteOffset, value.byteOffset])).toEqual([
      [4, 4],
      [12, 4],
      [4, 16],
      [20, 4]
    ]);
    for (const [key, value] of spans) {
      expect(fixture.storage.has(key.buffer)).toBe(true);
      expect(fixture.storage.has(value.buffer)).toBe(true);
    }
    expect(allocate).not.toHaveBeenCalled();
    allocate.mockRestore();
  } finally {
    fixture.destroy();
  }
});

test('reference families reject invalid layouts and writable aliases', () => {
  const fixture = makeFixture();
  try {
    const keys = fixture.column('keys', 'uint32', [0, 1, 0], [1, 2]);
    const values = fixture.column('values', 'float32', [1, 2, 3], [2, 1]);
    const short = fixture.column('short', 'uint32', [1, 1], [2]);
    const output = fixture.output('output', 'float32', 2);
    expect(
      () => new GPUGroupAggregation({keys, values, output, mask: short, operation: 'sum'})
    ).toThrow(/lengths must match/);
    expect(
      () => new GPUReduction({input: values, mask: short, output, operation: 'extent'})
    ).toThrow(/lengths must match/);
    expect(
      () =>
        new GPUHistogram({
          input: values,
          mask: short,
          output: fixture.output('bins', 'uint32', 2),
          domain: [0, 3]
        })
    ).toThrow(/lengths must match/);
    const strided = fixture.column('strided', 'float32', [1, 2, 3], [3], {stride: 2});
    expect(() => new GPUReduction({input: strided, output, operation: 'extent'})).toThrow(/packed/);
    const mismatched = fixture.column('mismatched', 'uint32', [0, 0, 0], [2, 1]);
    expect(() => new GPUScan({input: keys, output: mismatched})).not.toThrow();
    expect(() => new GPUScan({input: keys, output: keys, segmentFlags: mismatched})).not.toThrow();
    const atomic = fixture.output('atomic', 'uint32', 3);
    expect(() => new GPUScan({input: keys, output: atomic})).not.toThrow();
    expect(() => new GPUGroupAggregation({keys: atomic, output: atomic})).toThrow(
      /separate buffers/
    );
  } finally {
    fixture.destroy();
  }
});

function makeFixture() {
  const device = new NullDevice({});
  Object.defineProperty(device, 'type', {value: 'webgpu'});
  return new BatchConformanceFixture(device);
}

test('empty scan adds no work and retains empty chunk topology', () => {
  const fixture = makeFixture();
  try {
    for (const atomic of [false, true]) {
      const input = fixture.column(`input-${atomic}`, 'uint32', [], atomic ? [0] : [0, 0], {
        atomic
      });
      const output = fixture.column(`output-${atomic}`, 'uint32', [], atomic ? [0] : [0, 0], {
        atomic
      });
      expect(new GPUScan({input, output}).getCommandNodes(fixture.graph)).toEqual([]);
    }
  } finally {
    fixture.destroy();
  }
});
