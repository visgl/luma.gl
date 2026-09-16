// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {GPUSegmentedLayout} from '@luma.gl/gpgpu/gpu-core';
import {BATCH_PARTITIONS, BatchConformanceFixture} from './batch-conformance-utils';

const partitions = [
  ...BATCH_PARTITIONS,
  {name: 'multiple workgroups', input: [0, 257, 512, 0, 260, 0], paired: [1, 256, 700, 72]}
];

for (const partition of partitions) {
  for (const empty of [false, true]) {
    test(`segmented layout batching: ${partition.name}, ${empty ? 'empty' : 'selected'}`, async () => {
      const device = await getWebGPUTestDevice('core');
      if (!device) return;
      const fixture = new BatchConformanceFixture(device);
      const length = empty ? 0 : partition.input.reduce((total, count) => total + count, 0);
      const inputLengths = empty ? partition.input.map(() => 0) : partition.input;
      const pairedLengths = empty ? partition.paired.map(() => 0) : partition.paired;
      const atomic = 'atomic' in partition && partition.atomic;
      const values = Array.from({length}, (_, index) => (index % 3 === 1 ? 0 : 1));
      const elements = Array.from({length}, (_, index) => (index % 4 === 3 ? 0 : 1));
      // Include starts at chunk boundaries and segments that continue through multiple chunks.
      const starts = Array.from({length}, (_, index) =>
        index > 0 && (index === 2 || index === 257 || index === length - 1) ? 1 : 0
      );
      const valueFlags = fixture.column('values', 'uint32', values, inputLengths, {atomic});
      const elementFlags = fixture.column(
        'elements',
        'uint32',
        [...elements, 1, 1],
        [...pairedLengths, 2]
      );
      const segmentStartFlags = fixture.column(
        'starts',
        'uint32',
        [...starts, 1, 1],
        [length + 2],
        {atomic: true}
      );
      const valueOffsets = fixture.column('value-offsets', 'uint32', Array(length + 3).fill(77), [
        ...pairedLengths,
        3
      ]);
      const elementOffsets = fixture.output('element-offsets', 'uint32', length + 3);
      const segmentIndices = fixture.column('indices', 'uint32', Array(length + 3).fill(77), [
        ...inputLengths,
        3
      ]);
      const segmentOffsets = fixture.output('segments', 'uint32', length + 1);
      const valueCount = fixture.output('value-count', 'uint32', 1);
      const elementCount = fixture.output('element-count', 'uint32', 1);
      const segmentCount = fixture.output('segment-count', 'uint32', 1);
      fixture.graph.add(
        new GPUSegmentedLayout({
          valueFlags,
          elementFlags,
          segmentStartFlags,
          valueOffsets,
          elementOffsets,
          segmentIndices,
          segmentOffsets,
          valueCount,
          elementCount,
          segmentCount
        })
      );
      const executable = fixture.graph.compile();
      try {
        for (let iteration = 0; iteration < 3; iteration++) {
          if (iteration === 2) {
            values.fill(0);
            elements.fill(0);
            starts.fill(0);
            for (const input of [valueFlags, elementFlags, segmentStartFlags]) {
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
          const expected = getExpectedLayout(values, elements, starts);
          expect(await fixture.read(valueOffsets)).toEqual([...expected.valueOffsets, 77, 77, 77]);
          expect(await fixture.read(elementOffsets)).toEqual([
            ...expected.elementOffsets,
            77,
            77,
            77
          ]);
          expect(await fixture.read(segmentIndices)).toEqual([
            ...expected.segmentIndices,
            77,
            77,
            77
          ]);
          expect(
            (await fixture.read(segmentOffsets)).slice(0, expected.segmentOffsets.length)
          ).toEqual(expected.segmentOffsets);
          expect(await fixture.read(valueCount)).toEqual([expected.valueCount]);
          expect(await fixture.read(elementCount)).toEqual([expected.elementCount]);
          expect(await fixture.read(segmentCount)).toEqual([expected.segmentCount]);
        }
      } finally {
        executable.destroy();
        fixture.destroy();
      }
    });
  }
}

function getExpectedLayout(values: number[], elements: number[], starts: number[]) {
  const valueOffsets: number[] = [];
  const elementOffsets: number[] = [];
  const segmentIndices: number[] = [];
  const segmentOffsets = [0];
  let valueCount = 0;
  let elementCount = 0;
  let segmentCount = values.length ? 1 : 0;
  for (let index = 0; index < values.length; index++) {
    if (starts[index]) {
      segmentOffsets.push(elementCount);
      segmentCount++;
    }
    valueOffsets.push(valueCount);
    elementOffsets.push(elementCount);
    segmentIndices.push(segmentCount - 1);
    valueCount += values[index];
    elementCount += elements[index];
  }
  if (values.length) segmentOffsets.push(elementCount);
  return {
    valueOffsets,
    elementOffsets,
    segmentIndices,
    segmentOffsets,
    valueCount,
    elementCount,
    segmentCount
  };
}
