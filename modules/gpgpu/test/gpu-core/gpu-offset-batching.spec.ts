// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {GPUFlagOffsets, GPUSegmentOffsets} from '@luma.gl/gpgpu/gpu-core';
import {BATCH_PARTITIONS, BatchConformanceFixture} from './batch-conformance-utils';

for (const partition of BATCH_PARTITIONS) {
  for (const empty of [false, true]) {
    test(`offset batching: ${partition.name}, ${empty ? 'empty' : 'selected'}`, async () => {
      const device = await getWebGPUTestDevice();
      if (!device) return;
      const fixture = new BatchConformanceFixture(device);
      const flags = fixture.column(
        'flags',
        'uint32',
        empty ? [] : [1, 0, 1, 1, 0, 1],
        empty ? partition.input.map(() => 0) : partition.input,
        {atomic: 'atomic' in partition && partition.atomic}
      );
      // Include capacity after the scanned prefix, both within and beyond its final chunk.
      const offsets = fixture.column('offsets', 'uint32', Array(9).fill(77), [
        ...partition.paired,
        3
      ]);
      const starts = fixture.column('starts', 'uint32', [1, 0, 0, 1, 0, 1, 1, 1], [0, 4, 0, 4, 0]);
      const indices = fixture.column(
        'indices',
        'uint32',
        Array(10).fill(77),
        'atomic' in partition ? [0, 2, 1, 7, 0] : [10],
        {atomic: !('atomic' in partition)}
      );
      const count = fixture.output('count', 'uint32', 1);
      const segmentOffsets = fixture.output('segment-offsets', 'uint32', 7);
      const segmentCount = fixture.output('segment-count', 'uint32', 1);
      fixture.graph.add([
        new GPUFlagOffsets({flags, offsets, count}),
        new GPUSegmentOffsets({
          elementFlags: flags,
          elementOffsets: offsets,
          segmentStartFlags: starts,
          segmentIndices: indices,
          segmentOffsets,
          segmentCount
        })
      ]);
      const executable = fixture.graph.compile();
      try {
        for (let iteration = 0; iteration < 3; iteration++) {
          if (iteration === 2) {
            for (const input of [flags, starts]) {
              for (const chunk of 'data' in input ? input.data : [input]) {
                if (chunk.length)
                  fixture.storage
                    .get(chunk.buffer)!
                    .write(new Uint32Array(chunk.length), chunk.byteOffset);
              }
            }
          }
          const encoder = device.createCommandEncoder();
          executable.encode(encoder, {parameters: undefined});
          device.submit(encoder.finish());
          const cleared = empty || iteration === 2;
          expect(await fixture.read(count)).toEqual([cleared ? 0 : 4]);
          expect(await fixture.read(segmentCount)).toEqual([cleared ? 0 : 3]);
          expect((await fixture.read(segmentOffsets)).slice(0, cleared ? 1 : 4)).toEqual(
            cleared ? [0] : [0, 2, 3, 4]
          );
          expect(await fixture.read(offsets)).toEqual(
            empty
              ? Array(9).fill(77)
              : [...(cleared ? Array(6).fill(0) : [0, 1, 1, 2, 3, 3]), 77, 77, 77]
          );
          expect(await fixture.read(indices)).toEqual(
            empty
              ? Array(10).fill(77)
              : [...(cleared ? Array(6).fill(0) : [0, 1, 1, 1, 2, 2]), 77, 77, 77, 77]
          );
        }
      } finally {
        executable.destroy();
        fixture.destroy();
      }
    });
  }
}

test('flag count uses the scanned row in a larger atomic destination', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return;
  const fixture = new BatchConformanceFixture(device);
  const flags = fixture.column('flags', 'uint32', [1, 0, 1, 1, 0, 1], [1, 0, 5, 0]);
  const offsets = fixture.output('offsets', 'uint32', 8);
  const count = fixture.output('count', 'uint32', 1);
  fixture.graph.add(new GPUFlagOffsets({flags, offsets, count}));
  const executable = fixture.graph.compile();
  try {
    const encoder = device.createCommandEncoder();
    executable.encode(encoder, {parameters: undefined});
    device.submit(encoder.finish());
    expect(await fixture.read(offsets)).toEqual([0, 1, 1, 2, 3, 3, 77, 77]);
    expect(await fixture.read(count)).toEqual([4]);
  } finally {
    executable.destroy();
    fixture.destroy();
  }
});
