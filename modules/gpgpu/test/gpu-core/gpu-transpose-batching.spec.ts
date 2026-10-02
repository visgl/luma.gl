// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {
  GPUTranspose,
  GraphVectorView,
  type GraphDataView,
  type GPUTransposeFormat
} from '@luma.gl/gpgpu/gpu-core';
import {BATCH_PARTITIONS, BatchConformanceFixture} from './batch-conformance-utils';

const cases = [
  ...BATCH_PARTITIONS.map(partition => ({...partition, rows: 2, columns: 3})),
  ...[
    [1, 17],
    [17, 1],
    [17, 35],
    [35, 17],
    [32, 32]
  ].map(([rows, columns]) => {
    const length = rows * columns;
    const middle = Math.floor(length / 2);
    return {
      name: `${rows} by ${columns}`,
      rows,
      columns,
      input: [0, 1, middle, 0, length - middle - 1, 0],
      paired: [0, 15, 0, length - 15, 0]
    };
  })
];

for (const configuration of cases) {
  for (const format of ['uint32', 'sint32', 'float32'] as const) {
    test(`transpose batching: ${configuration.name}, ${format}`, async () => {
      const device = await getWebGPUTestDevice('core');
      if (!device) return;
      const fixture = new BatchConformanceFixture(device);
      const {rows, columns} = configuration;
      const length = rows * columns;
      // Include signed zeros, infinities, multiple NaN payloads, subnormals, and integer extremes.
      const patterns = [
        0, 0x80000000, 0x7f800000, 0xff800000, 0x7fc01234, 0xffc05678, 1, 0xffffffff
      ];
      const words = Array.from({length}, (_, index) => patterns[index % patterns.length]);
      const atomic = 'atomic' in configuration && configuration.atomic;
      const rawInput = fixture.column(
        'input',
        'uint32',
        [...words, 0xdeadbeef, 0xdeadbeef],
        atomic ? [length + 2] : [...configuration.input, 2],
        {atomic}
      );
      const rawOutput = fixture.column(
        'output',
        'uint32',
        Array(length + 3).fill(0x12345678),
        configuration.name === 'atomic' ? [length + 3] : [...configuration.paired, 3],
        {atomic: configuration.name === 'atomic'}
      );
      const input = reinterpret(fixture, rawInput, format);
      const output = reinterpret(fixture, rawOutput, format);
      fixture.graph.add(new GPUTranspose({input, output, rows, columns}));
      const executable = fixture.graph.compile();
      try {
        for (let iteration = 0; iteration < 3; iteration++) {
          if (iteration === 2) {
            words.fill(0xffffffff);
            let offset = 0;
            for (const chunk of 'data' in rawInput ? rawInput.data : [rawInput]) {
              const count = Math.min(chunk.length, length - offset);
              if (count > 0)
                fixture.storage
                  .get(chunk.buffer)!
                  .write(new Uint32Array(words.slice(offset, offset + count)), chunk.byteOffset);
              offset += chunk.length;
            }
          }
          const encoder = device.createCommandEncoder();
          executable.encode(encoder, {parameters: undefined});
          device.submit(encoder.finish());
          const expected = Array(length).fill(0);
          for (let row = 0; row < rows; row++) {
            for (let column = 0; column < columns; column++)
              expected[column * rows + row] = words[row * columns + column];
          }
          expect(await fixture.read(rawOutput)).toEqual([
            ...expected,
            0x12345678,
            0x12345678,
            0x12345678
          ]);
          expect(await fixture.read(rawInput)).toEqual([...words, 0xdeadbeef, 0xdeadbeef]);
        }
      } finally {
        executable.destroy();
        fixture.destroy();
      }
    });
  }
}

for (const [rows, columns] of [
  [0, 7],
  [7, 0],
  [0, 0]
]) {
  test(`transpose batching: empty ${rows} by ${columns}`, async () => {
    const device = await getWebGPUTestDevice('core');
    if (!device) return;
    const fixture = new BatchConformanceFixture(device);
    const input = fixture.column('input', 'uint32', [], [0, 0]);
    const output = fixture.column('output', 'uint32', [77, 77], [0, 1, 0, 1]);
    fixture.graph.add(new GPUTranspose({input, output, rows, columns}));
    const executable = fixture.graph.compile();
    try {
      expect(executable.stats.nodeOrder).toEqual([]);
      const encoder = device.createCommandEncoder();
      executable.encode(encoder, {parameters: undefined});
      device.submit(encoder.finish());
      expect(await fixture.read(output)).toEqual([77, 77]);
    } finally {
      executable.destroy();
      fixture.destroy();
    }
  });
}

function reinterpret<T extends GPUTransposeFormat>(
  fixture: BatchConformanceFixture,
  view: GraphDataView<'uint32'> | GraphVectorView<'uint32'>,
  format: T
): GraphDataView<T> | GraphVectorView<T> {
  const data = ('data' in view ? view.data : [view]).map(chunk =>
    fixture.graph.createDataView(chunk.buffer, {
      format,
      length: chunk.length,
      byteOffset: chunk.byteOffset
    })
  );
  return 'data' in view ? new GraphVectorView({...view, format, data}) : data[0];
}
