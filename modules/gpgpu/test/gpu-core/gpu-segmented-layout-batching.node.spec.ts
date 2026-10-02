// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {NullDevice} from '@luma.gl/test-utils';
import {GPUSegmentedLayout, GraphVectorView} from '@luma.gl/gpgpu/gpu-core';
import {BatchConformanceFixture} from './batch-conformance-utils';

test('segmented layout validates every chunk, including unused capacity', () => {
  const device = new NullDevice({});
  Object.defineProperty(device, 'type', {value: 'webgpu'});
  Object.defineProperty(device.limits, 'maxComputeWorkgroupsPerDimension', {value: 65535});
  const fixture = new BatchConformanceFixture(device);
  const foreign = new BatchConformanceFixture(device);
  try {
    const props = {
      valueFlags: fixture.column('values', 'uint32', [1, 0, 1], [1, 0, 2]),
      elementFlags: fixture.output('elements', 'uint32', 3),
      segmentStartFlags: fixture.output('starts', 'uint32', 3),
      valueOffsets: fixture.output('value-offsets', 'uint32', 3),
      elementOffsets: fixture.output('element-offsets', 'uint32', 3),
      segmentIndices: fixture.output('indices', 'uint32', 3),
      segmentOffsets: fixture.output('segments', 'uint32', 4),
      valueCount: fixture.output('value-count', 'uint32', 1),
      elementCount: fixture.output('element-count', 'uint32', 1),
      segmentCount: fixture.output('segment-count', 'uint32', 1)
    };
    const short = fixture.column('short', 'uint32', [0, 0], [1, 1]);
    const strided = fixture.column('strided', 'uint32', [0, 0, 0], [1, 2], {stride: 2});
    for (const name of [
      'elementFlags',
      'segmentStartFlags',
      'valueOffsets',
      'elementOffsets',
      'segmentIndices'
    ] as const) {
      expect(() => new GPUSegmentedLayout({...props, [name]: short})).toThrow(/cover every flag/);
      expect(() => new GPUSegmentedLayout({...props, [name]: strided})).toThrow(/packed/);
    }
    expect(() => new GPUSegmentedLayout({...props, segmentOffsets: props.valueOffsets})).toThrow(
      /too short/
    );
    if (!('data' in props.valueFlags)) throw new Error('Expected vector fixture');
    const withForeignCapacity = new GraphVectorView({
      ...props.valueFlags,
      length: 4,
      valueLength: 4,
      data: [...props.valueFlags.data, foreign.output('foreign-tail', 'uint32', 1)]
    });
    expect(() =>
      new GPUSegmentedLayout({...props, elementFlags: withForeignCapacity}).getCommandNodes(
        fixture.graph
      )
    ).toThrow(/target graph/);
    const allocate = vi.spyOn(fixture.graph, 'createTransientBuffer');
    try {
      const nodes = new GPUSegmentedLayout(props).getCommandNodes(fixture.graph);
      // No concatenated slot storage is needed; only scan carry scratch is allocated.
      expect(allocate.mock.calls.every(([descriptor]) => descriptor.byteLength < 3 * 4)).toBe(true);
      expect(nodes.length).toBeGreaterThan(0);
    } finally {
      allocate.mockRestore();
    }
  } finally {
    fixture.destroy();
    foreign.destroy();
    device.destroy();
  }
});
