// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {GPUByteRangeGather} from '@luma.gl/gpgpu/gpu-core';
import {BatchConformanceFixture} from './batch-conformance-utils';

const cases = [
  {name: 'atomic', atomic: true},
  {name: 'one chunk'},
  {name: 'source batches', sourceBatched: true},
  {name: 'metadata batches', metadataBatched: true},
  {name: 'output batches', outputBatched: true},
  {name: 'independent batches', sourceBatched: true, metadataBatched: true, outputBatched: true},
  {
    name: 'multiple workgroups',
    sourceBatched: true,
    metadataBatched: true,
    outputBatched: true,
    large: true
  }
];

for (const configuration of cases) {
  for (const truncated of [false, true]) {
    test(`byte range gather: ${configuration.name}, truncated=${truncated}`, async () => {
      const device = await getWebGPUTestDevice('core');
      if (!device) return;
      const fixture = new BatchConformanceFixture(device);
      const large = 'large' in configuration && configuration.large;
      const atomic = 'atomic' in configuration && configuration.atomic;
      const sourceBytes = Array.from(
        {length: large ? 4099 : 45},
        (_, index) => (index * 19 + 3) & 255
      );
      const sourceByteLength = sourceBytes.length - 2;
      const sourceWords = packBytes(sourceBytes);
      const outputByteCapacity = truncated ? 21 : large ? 2057 : 31;
      const wordCount = Math.ceil(outputByteCapacity / 4);
      const sourceOffsets = large
        ? [0, 3, 5, 0xffffffff, 2047, 4090]
        : [0, 3, 7, 0xffffffff, 34, 41];
      const lengths = large ? [0, 3, 1027, 1, 1003, 5] : [0, 3, 8, 1, 9, 5];
      // Include a gap, empty ranges, non-word-aligned boundaries, and an invalid source address.
      const outputOffsets = large ? [0, 0, 3, 1032, 1033, 2036] : [0, 0, 3, 13, 14, 23];
      const source = fixture.column(
        'source',
        'uint32',
        sourceWords,
        'sourceBatched' in configuration
          ? [0, 1, 0, 2, sourceWords.length - 3, 0]
          : [sourceWords.length],
        {atomic}
      );
      const sources = fixture.column(
        'sources',
        'uint32',
        sourceOffsets,
        'metadataBatched' in configuration ? [0, 2, 0, 4] : [6],
        {atomic}
      );
      const sizes = fixture.column(
        'lengths',
        'uint32',
        lengths,
        'metadataBatched' in configuration ? [1, 0, 3, 2, 0] : [6],
        {atomic}
      );
      const destinations = fixture.column(
        'destinations',
        'uint32',
        outputOffsets,
        'metadataBatched' in configuration ? [0, 3, 3, 0] : [6],
        {atomic}
      );
      const output = fixture.column(
        'output',
        'uint32',
        Array(wordCount + 2).fill(0x77777777),
        'outputBatched' in configuration ? [0, 1, 0, wordCount - 2, 3, 0] : [wordCount + 2],
        {atomic}
      );
      fixture.graph.add(
        new GPUByteRangeGather({
          source,
          sourceOffsets: sources,
          lengths: sizes,
          outputOffsets: destinations,
          output,
          sourceByteLength,
          outputByteCapacity
        })
      );
      const executable = fixture.graph.compile();
      try {
        for (let iteration = 0; iteration < 4; iteration++) {
          if (iteration === 2) {
            // Adding a range-relative offset must not wrap an invalid address into the source.
            sourceOffsets[2] = 0xfffffffe;
            let offset = 0;
            for (const chunk of 'data' in sources ? sources.data : [sources]) {
              if (chunk.length)
                fixture.storage
                  .get(chunk.buffer)!
                  .write(
                    new Uint32Array(sourceOffsets.slice(offset, offset + chunk.length)),
                    chunk.byteOffset
                  );
              offset += chunk.length;
            }
          }
          if (iteration === 3) {
            // Changed ranges must erase bytes written by the previous encoding, including zero values.
            lengths.fill(0);
            for (const chunk of 'data' in sizes ? sizes.data : [sizes]) {
              if (chunk.length)
                fixture.storage
                  .get(chunk.buffer)!
                  .write(new Uint32Array(chunk.length), chunk.byteOffset);
            }
          }
          const encoder = device.createCommandEncoder();
          executable.encode(encoder, {parameters: undefined});
          device.submit(encoder.finish());
          const expected = Array(wordCount * 4).fill(0);
          for (let range = 0; range < lengths.length; range++) {
            for (let relative = 0; relative < lengths[range]; relative++) {
              const destination = outputOffsets[range] + relative;
              const sourceIndex = sourceOffsets[range] + relative;
              if (destination < outputByteCapacity && sourceIndex < sourceByteLength) {
                expected[destination] = sourceBytes[sourceIndex];
              }
            }
          }
          expect(await fixture.read(output)).toEqual([
            ...packBytes(expected),
            0x77777777,
            0x77777777
          ]);
        }
      } finally {
        executable.destroy();
        fixture.destroy();
      }
    });
  }
}

for (const empty of ['source', 'metadata', 'output'] as const) {
  test(`byte range gather: empty ${empty}`, async () => {
    const device = await getWebGPUTestDevice('core');
    if (!device) return;
    const fixture = new BatchConformanceFixture(device);
    const source = fixture.column(
      'source',
      'uint32',
      empty === 'source' ? [] : [0x04030201],
      empty === 'source' ? [0, 0] : [0, 1, 0]
    );
    const sources = fixture.column(
      'sources',
      'uint32',
      empty === 'metadata' ? [] : [0],
      empty === 'metadata' ? [0, 0] : [1]
    );
    const lengths = fixture.column(
      'lengths',
      'uint32',
      empty === 'metadata' ? [] : [4],
      empty === 'metadata' ? [] : [0, 1]
    );
    const offsets = fixture.column(
      'offsets',
      'uint32',
      empty === 'metadata' ? [] : [0],
      empty === 'metadata' ? [0] : [1, 0]
    );
    const output = fixture.column('output', 'uint32', [77, 77, 77], [0, 1, 0, 2]);
    fixture.graph.add(
      new GPUByteRangeGather({
        source,
        sourceOffsets: sources,
        lengths,
        outputOffsets: offsets,
        output,
        sourceByteLength: empty === 'source' ? 0 : 4,
        outputByteCapacity: empty === 'output' ? 0 : 5
      })
    );
    const executable = fixture.graph.compile();
    try {
      const encoder = device.createCommandEncoder();
      executable.encode(encoder, {parameters: undefined});
      device.submit(encoder.finish());
      expect(await fixture.read(output)).toEqual(empty === 'source' ? [0, 0, 77] : [77, 77, 77]);
    } finally {
      executable.destroy();
      fixture.destroy();
    }
  });
}

function packBytes(bytes: readonly number[]): number[] {
  const words = Array(Math.ceil(bytes.length / 4)).fill(0);
  for (let index = 0; index < bytes.length; index++) {
    words[index >>> 2] = (words[index >>> 2] | (bytes[index] << ((index & 3) * 8))) >>> 0;
  }
  return words;
}
