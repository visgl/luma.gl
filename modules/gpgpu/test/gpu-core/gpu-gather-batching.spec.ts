// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {Buffer, type Device} from '@luma.gl/core';
import {GPUData, getGPUVectorFormatInfo} from '@luma.gl/gpgpu/gpu-data';
import {
  GPUCommandGraph,
  GPUGather,
  GPUUint32Gather,
  type GPUGatherFormat,
  type GraphDataView,
  type GraphVectorView
} from '@luma.gl/gpgpu/gpu-core';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {BATCH_PARTITIONS} from './batch-conformance-utils';

const SENTINEL = 0xdeadbeef;
const partitions = [
  ...BATCH_PARTITIONS,
  {name: 'multiple workgroups', input: [0, 257, 512, 0, 260], paired: [1, 256, 700, 72]},
  {name: 'empty source', input: [0, 0], paired: [2, 0, 4]},
  {name: 'empty indices', input: [1, 0, 5], paired: [0, 0]},
  {name: 'no source chunks', input: [], paired: [1, 5]},
  {name: 'no index chunks', input: [6], paired: []}
];

for (const format of ['uint32', 'float32x3', 'fixed-size-list<uint32,5>'] as const) {
  for (const partition of partitions) {
    test(`gather batching: ${format}, ${partition.name}`, async () => {
      const device = await getWebGPUTestDevice('core');
      if (!device) return;
      const graph = new GPUCommandGraph(device);
      const sourceLength = partition.input.reduce((total, length) => total + length, 0);
      const indexLength = partition.paired.reduce((total, length) => total + length, 0);
      const wordsPerRow = getGPUVectorFormatInfo(format).byteLength / 4;
      const sourceWords = Array.from({length: sourceLength * wordsPerRow}, (_, index) =>
        // Preserve negative zero and a NaN payload as raw bits in the float format too.
        index === 0 ? 0x80000000 : index === 1 ? 0x7fc00123 : index + 1
      );
      const indexPattern = [
        0xffffffff,
        sourceLength,
        0,
        Math.max(0, sourceLength - 1),
        Math.floor(sourceLength / 2),
        Math.max(0, sourceLength - 1)
      ];
      const indices = Array.from({length: indexLength}, (_, index) => indexPattern[index % 6]);
      const atomic = 'atomic' in partition && partition.atomic;
      const source = makeColumn(
        device,
        graph,
        'source',
        format,
        sourceWords,
        partition.input,
        atomic
      );
      const index = makeColumn(
        device,
        graph,
        'indices',
        'uint32',
        indices,
        partition.paired,
        partition.name === 'one chunk'
      );
      // The active prefix ends inside a chunk; the final chunk is entirely spare capacity.
      const output = makeColumn(
        device,
        graph,
        'output',
        format,
        Array((indexLength + 3) * wordsPerRow).fill(SENTINEL),
        atomic
          ? [indexLength + 3]
          : [0, Math.min(1, indexLength), 0, Math.max(0, indexLength - 1) + 2, 1],
        atomic
      );
      graph.add(new GPUGather({source: source.view, indices: index.view, output: output.view}));
      const uint32Output =
        format === 'uint32'
          ? makeColumn(
              device,
              graph,
              'uint32-output',
              'uint32',
              Array(indexLength + 3).fill(SENTINEL),
              [indexLength + 3],
              true
            )
          : undefined;
      if (format === 'uint32' && uint32Output) {
        graph.add(
          new GPUUint32Gather({
            source: source.view as GraphDataView<'uint32'> | GraphVectorView<'uint32'>,
            indices: index.view,
            output: uint32Output.view,
            invalidValue: 0xffffffff
          })
        );
      }
      const executable = graph.compile();
      try {
        for (let iteration = 0; iteration < 3; iteration++) {
          if (iteration === 2) {
            // Rows move between source chunks and from valid to invalid on the same graph.
            indices.forEach((value, row) => {
              indices[row] =
                row % 2
                  ? 0xffffffff
                  : Math.max(0, sourceLength - 1 - (row % Math.max(1, sourceLength)));
            });
            sourceWords.forEach((value, word) => {
              sourceWords[word] = value ^ 0x12345678;
            });
            source.write(sourceWords);
            index.write(indices);
          }
          const encoder = device.createCommandEncoder();
          executable.encode(encoder, {parameters: undefined});
          device.submit(encoder.finish());
          const reference = indices.flatMap(row =>
            row < sourceLength
              ? sourceWords
                  .slice(row * wordsPerRow, (row + 1) * wordsPerRow)
                  .map(value => value >>> 0)
              : Array(wordsPerRow).fill(0)
          );
          expect(await output.read()).toEqual([
            ...reference,
            ...Array(3 * wordsPerRow).fill(SENTINEL)
          ]);
          if (uint32Output) {
            expect(await uint32Output.read()).toEqual([
              ...indices.map(row => (row < sourceLength ? sourceWords[row] >>> 0 : 0xffffffff)),
              SENTINEL,
              SENTINEL,
              SENTINEL
            ]);
          }
        }
      } finally {
        executable.destroy();
        for (const column of [source, index, output, uint32Output]) column?.destroy();
      }
    });
  }
}

function makeColumn<T extends GPUGatherFormat>(
  device: Device,
  graph: GPUCommandGraph,
  id: string,
  format: T,
  words: readonly number[],
  lengths: readonly number[],
  atomic = false
) {
  const wordsPerRow = getGPUVectorFormatInfo(format).byteLength / 4;
  const buffers: Buffer[] = [];
  let offset = 0;
  const data = lengths.map(length => {
    const storage = new Uint32Array(Math.max(1, length * wordsPerRow) + 1).fill(SENTINEL);
    storage.set(words.slice(offset, offset + length * wordsPerRow), 1);
    offset += length * wordsPerRow;
    const buffer = device.createBuffer({
      data: storage,
      usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST
    });
    buffers.push(buffer);
    return new GPUData({buffer, format, length, byteOffset: 4, ownsBuffer: false});
  });
  const vector = graph.importGPUVector(id, {
    format,
    length: lengths.reduce((total, length) => total + length, 0),
    data
  });
  return {
    view: atomic ? vector.data[0] : vector,
    write(values: readonly number[]) {
      let position = 0;
      buffers.forEach((buffer, index) => {
        const wordCount = lengths[index] * wordsPerRow;
        if (wordCount)
          buffer.write(Uint32Array.from(values.slice(position, position + wordCount)), 4);
        position += wordCount;
      });
    },
    async read() {
      const values: number[] = [];
      for (const [index, buffer] of buffers.entries()) {
        const bytes = await buffer.readAsync();
        const storage = new Uint32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4);
        expect(storage[0]).toBe(SENTINEL);
        values.push(...storage.slice(1, 1 + lengths[index] * wordsPerRow));
      }
      return values;
    },
    destroy() {
      for (const buffer of buffers) buffer.destroy();
    }
  };
}
