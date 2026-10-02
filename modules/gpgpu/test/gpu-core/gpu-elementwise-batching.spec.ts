// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {GPUElementwise} from '@luma.gl/gpgpu/gpu-core';
import {BATCH_PARTITIONS, BatchConformanceFixture} from './batch-conformance-utils';

const operations = {
  copy: (first: number) => first,
  add: (first: number, second: number) => first + second,
  subtract: (first: number, second: number) => first - second,
  multiply: (first: number, second: number) => first * second,
  'multiply-add': (first: number, second: number, third: number) => first * second + third,
  min: (first: number, second: number) => Math.min(first, second),
  max: (first: number, second: number) => Math.max(first, second)
};

for (const partition of BATCH_PARTITIONS) {
  for (const format of ['uint32', 'sint32', 'float32'] as const) {
    test(`elementwise batching: ${partition.name}, ${format}`, async () => {
      const device = await getWebGPUTestDevice('core');
      if (!device) return;
      const fixture = new BatchConformanceFixture(device);
      const first = format === 'uint32' ? [0, 1, 2, 5, 7, 0xffffffff] : [0, -1, 2, -5, 7, 11];
      const second = [3, 2, 1, 3, 2, 1];
      const third = [11, 13, 17, 19, 23, 29];
      const input = fixture.column('first', format, first, partition.input, {
        atomic: 'atomic' in partition && partition.atomic
      });
      const inputB = fixture.column('second', format, second, partition.paired, {
        atomic: partition.name === 'atomic'
      });
      const inputC = fixture.column(
        'third',
        format,
        third,
        partition.name === 'atomic' ? [6] : [1, 0, 1, 4],
        {atomic: partition.name === 'atomic'}
      );
      const outputs = Object.keys(operations).map(operation => {
        const output = fixture.column(
          operation,
          format,
          Array(6).fill(77),
          partition.name === 'atomic' ? [6] : [0, 3, 0, 3],
          {atomic: partition.name === 'atomic'}
        );
        fixture.graph.add(
          new GPUElementwise({
            id: operation,
            input,
            inputB: operation === 'copy' ? undefined : inputB,
            inputC: operation === 'multiply-add' ? inputC : undefined,
            output,
            operation: operation as keyof typeof operations
          })
        );
        return {operation: operation as keyof typeof operations, output};
      });
      const executable = fixture.graph.compile();
      try {
        for (let iteration = 0; iteration < 3; iteration++) {
          if (iteration === 2) {
            first.fill(2);
            for (const chunk of 'data' in input ? input.data : [input]) {
              if (chunk.length) {
                const ArrayType =
                  format === 'uint32'
                    ? Uint32Array
                    : format === 'sint32'
                      ? Int32Array
                      : Float32Array;
                fixture.storage
                  .get(chunk.buffer)!
                  .write(new ArrayType(chunk.length).fill(2), chunk.byteOffset);
              }
            }
          }
          const encoder = device.createCommandEncoder();
          executable.encode(encoder, {parameters: undefined});
          device.submit(encoder.finish());
          for (const {operation, output} of outputs) {
            const expected = first.map((value, index) => {
              const result = operations[operation](value, second[index], third[index]);
              return format === 'uint32' ? result >>> 0 : format === 'sint32' ? result | 0 : result;
            });
            expect(await fixture.read(output)).toEqual(expected);
          }
        }
      } finally {
        executable.destroy();
        fixture.destroy();
      }
    });
  }
}

test('elementwise batching: empty vectors emit no commands', async () => {
  const device = await getWebGPUTestDevice('core');
  if (!device) return;
  const fixture = new BatchConformanceFixture(device);
  try {
    const input = fixture.column('input', 'float32', [], [0, 0]);
    const output = fixture.column('output', 'float32', [], []);
    expect(
      new GPUElementwise({input, output, operation: 'copy'}).getCommandNodes(fixture.graph)
    ).toEqual([]);
  } finally {
    fixture.destroy();
  }
});
