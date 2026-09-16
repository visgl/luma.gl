// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {NullDevice} from '@luma.gl/test-utils';
import {GPUByteRangeGather, GraphVectorView} from '@luma.gl/gpgpu/gpu-core';
import {BatchConformanceFixture} from './batch-conformance-utils';

test('byte range gather validates every chunk and borrows storage without allocations', () => {
  const device = new NullDevice({});
  Object.defineProperty(device, 'type', {value: 'webgpu'});
  Object.defineProperty(device.limits, 'maxComputeWorkgroupsPerDimension', {value: 65535});
  const fixture = new BatchConformanceFixture(device);
  const foreign = new BatchConformanceFixture(device);
  try {
    const props = {
      source: fixture.column('source', 'uint32', [1, 2, 3, 4], [1, 0, 3]),
      sourceOffsets: fixture.column('sources', 'uint32', [0, 4, 8], [1, 2]),
      lengths: fixture.column('lengths', 'uint32', [4, 4, 4], [2, 1]),
      outputOffsets: fixture.column('offsets', 'uint32', [0, 4, 8], [3]),
      output: fixture.column('output', 'uint32', [77, 77, 77, 77, 77], [2, 0, 3]),
      sourceByteLength: 13,
      outputByteCapacity: 15
    };
    const strided = fixture.column('strided', 'uint32', [1, 2, 3], [1, 2], {stride: 2});
    for (const name of ['source', 'sourceOffsets', 'lengths', 'outputOffsets', 'output'] as const) {
      expect(() => new GPUByteRangeGather({...props, [name]: strided})).toThrow(/packed/);
      const original = props[name];
      if (!('data' in original)) throw new Error('Expected vector fixture');
      const data = [...original.data];
      const last = data.length - 1;
      data[last] = foreign.output(name, 'uint32', data[last].length);
      const borrowed = new GraphVectorView({...original, data});
      expect(() =>
        new GPUByteRangeGather({...props, [name]: borrowed}).getCommandNodes(fixture.graph)
      ).toThrow(/target graph/);
    }
    for (const name of ['sourceOffsets', 'lengths', 'outputOffsets'] as const) {
      expect(
        () =>
          new GPUByteRangeGather({...props, [name]: fixture.output(`short-${name}`, 'uint32', 2)})
      ).toThrow(/matching lengths/);
    }
    for (const name of ['sourceByteLength', 'outputByteCapacity'] as const) {
      for (const value of [-1, 0.5, NaN, 0x100000000]) {
        expect(() => new GPUByteRangeGather({...props, [name]: value})).toThrow(/uint32/);
      }
      expect(() => new GPUByteRangeGather({...props, [name]: 100})).toThrow(/capacity/);
    }
    for (const output of [props.source, props.sourceOffsets, props.lengths, props.outputOffsets]) {
      expect(() => new GPUByteRangeGather({...props, output, outputByteCapacity: 4})).toThrow(
        /separate buffers/
      );
    }
    if (!('data' in props.output)) throw new Error('Expected vector fixture');
    const duplicated = new GraphVectorView({
      ...props.output,
      length: 4,
      valueLength: 4,
      data: [props.output.data[0], props.output.data[0]]
    });
    expect(() => new GPUByteRangeGather({...props, output: duplicated})).toThrow(
      /must not overlap/
    );
    const spareForeign = new GraphVectorView({
      ...props.output,
      length: 6,
      valueLength: 6,
      data: [...props.output.data, foreign.output('spare', 'uint32', 1)]
    });
    expect(() =>
      new GPUByteRangeGather({...props, output: spareForeign}).getCommandNodes(fixture.graph)
    ).toThrow(/target graph/);
    const allocate = vi.spyOn(fixture.graph, 'createTransientBuffer');
    const nodes = new GPUByteRangeGather(props).getCommandNodes(fixture.graph);
    expect(nodes).toHaveLength(12);
    expect(nodes[0].resources?.at(-1)?.usage).toBe('storage-write');
    expect(nodes[1].resources?.at(-1)?.usage).toBe('storage-read-write');
    expect(new Set(nodes.map(node => node.id)).size).toBe(nodes.length);
    expect(allocate).not.toHaveBeenCalled();
    expect(
      new GPUByteRangeGather({...props, outputByteCapacity: 0}).getCommandNodes(fixture.graph)
    ).toEqual([]);
    allocate.mockRestore();
  } finally {
    fixture.destroy();
    foreign.destroy();
    device.destroy();
  }
});
