// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {GPUScanUint64} from '@luma.gl/gpgpu/gpu-core';
import {BATCH_PARTITIONS, BatchConformanceFixture} from './batch-conformance-utils';

const partitions = [
  ...BATCH_PARTITIONS,
  {name: 'multiple workgroups', input: [0, 257, 512, 0, 260, 0], paired: [1, 256, 700, 72]}
];

for (const partition of partitions) {
  for (const empty of [false, true]) {
    for (const inPlaceHigh of [false, true]) {
      test(`uint64 scan: ${partition.name}, empty=${empty}, in-place high=${inPlaceHigh}`, async () => {
        const device = await getWebGPUTestDevice('core');
        if (!device) return;
        const fixture = new BatchConformanceFixture(device);
        const inputLengths = empty ? partition.input.map(() => 0) : partition.input;
        const highLengths = empty ? partition.paired.map(() => 0) : partition.paired;
        const length = inputLengths.reduce((total, count) => total + count, 0);
        const atomic = 'atomic' in partition && partition.atomic;
        const low = Array.from(
          {length},
          (_, index) => [0xffffffff, 1, 0, 0xfffffffe, 3, 5][index % 6]
        );
        const high = Array.from(
          {length},
          (_, index) => [0xffffffff, 0, 1, 3, 0xfffffffe, 0][index % 6]
        );
        const inputLow = fixture.column('input-low', 'uint32', low, inputLengths, {atomic});
        const inputHigh = fixture.column('input-high', 'uint32', high, highLengths, {
          atomic: partition.name === 'atomic'
        });
        const outputLow = fixture.column(
          'output-low',
          'uint32',
          Array(length + 3).fill(77),
          atomic ? [length + 3] : [...highLengths.slice().reverse(), 3],
          {atomic}
        );
        const outputHigh = inPlaceHigh
          ? inputHigh
          : fixture.column(
              'output-high',
              'uint32',
              Array(length + 3).fill(77),
              atomic
                ? [length + 3]
                : [...inputLengths.slice(0, -1), inputLengths[inputLengths.length - 1] + 3],
              {atomic}
            );
        fixture.graph.add(new GPUScanUint64({inputLow, inputHigh, outputLow, outputHigh}));
        const executable = fixture.graph.compile();
        try {
          for (let iteration = 0; iteration < 3; iteration++) {
            if (iteration === 2) {
              low.fill(0);
              high.fill(0);
            }
            // Restore both words, including an aliased high-word destination, on every encoding.
            for (const [view, values] of [
              [inputLow, low],
              [inputHigh, high]
            ] as const) {
              let offset = 0;
              for (const chunk of 'data' in view ? view.data : [view]) {
                if (chunk.length)
                  fixture.storage
                    .get(chunk.buffer)!
                    .write(
                      new Uint32Array(values.slice(offset, offset + chunk.length)),
                      chunk.byteOffset
                    );
                offset += chunk.length;
              }
            }
            const encoder = device.createCommandEncoder();
            executable.encode(encoder, {parameters: undefined});
            device.submit(encoder.finish());
            let sum = 0n;
            const expectedLow: number[] = [];
            const expectedHigh: number[] = [];
            for (let index = 0; index < length; index++) {
              sum = BigInt.asUintN(64, sum + (BigInt(high[index]) << 32n) + BigInt(low[index]));
              expectedLow.push(Number(sum & 0xffffffffn));
              expectedHigh.push(Number(sum >> 32n));
            }
            expect(await fixture.read(outputLow)).toEqual([...expectedLow, 77, 77, 77]);
            expect(await fixture.read(outputHigh)).toEqual(
              inPlaceHigh ? expectedHigh : [...expectedHigh, 77, 77, 77]
            );
          }
        } finally {
          executable.destroy();
          fixture.destroy();
        }
      });
    }
  }
}
