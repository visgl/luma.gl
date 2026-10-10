// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {GPUCommandGraph} from '@luma.gl/gpgpu/gpu-core';
import {
  GPUDataFrame,
  column,
  parameter,
  type GPUDataFrameQueryParameters
} from '@luma.gl/experimental/gpu-dataframe';
import {GPUData} from '@luma.gl/gpgpu/gpu-data';
import {GPURecordBatch, GPUTable} from '@luma.gl/experimental/gpu-tables';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {expect, test} from 'vitest';

type BenchmarkSchema = {value: 'float32'};
type BatchLayout = 'shared' | 'separate';

const ROW_COUNT = 4_000_000;
// 2048 rows is DuckDB-Wasm's Arrow record batch size.
const BATCH_ROW_COUNTS = [ROW_COUNT, 65_536, 2_048];
const WARMUP_ITERATIONS = 3;
const MEASURED_ITERATIONS = 15;
const CUT = 500;

// Opt-in evidence, with no timing threshold: shared CI machines cannot establish a speedup.
test('GPUDataFrame filter cost scales with rows rather than preserved batch count', async ({
  annotate,
  skip
}) => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    skip('WebGPU is unavailable');
    return;
  }
  const values = new Float32Array(ROW_COUNT);
  for (let index = 0; index < ROW_COUNT; index++) {
    values[index] = (index * 7919) % 1000;
  }
  const expectedCount = values.reduce((count, value) => count + (value > CUT ? 1 : 0), 0);
  const results: object[] = [];

  for (const layout of ['shared', 'separate'] as const) {
    for (const batchRowCount of BATCH_ROW_COUNTS) {
      if (layout === 'separate' && batchRowCount === ROW_COUNT) {
        continue;
      }
      const {frame, buffers} = createFrame(device, values, batchRowCount, layout);
      const graph = new GPUCommandGraph<GPUDataFrameQueryParameters>(device, {
        id: `gpu-dataframe-batch-scaling-${layout}-${batchRowCount}`
      });
      const compileStart = performance.now();
      const compiled = frame
        .filter(column('value').greaterThan(parameter('cut', 0)))
        .compile(graph);
      const compileMilliseconds = performance.now() - compileStart;
      const encodeSamples: number[] = [];
      const submittedSamples: number[] = [];
      let computeNodeCount = 0;
      try {
        for (let iteration = 0; iteration < WARMUP_ITERATIONS + MEASURED_ITERATIONS; iteration++) {
          const start = performance.now();
          const commandEncoder = device.createCommandEncoder({id: 'gpu-dataframe-batch-scaling'});
          const encoding = compiled.encode(commandEncoder, {cut: CUT});
          const encoded = performance.now();
          device.submit(commandEncoder.finish());
          await device.handle.queue.onSubmittedWorkDone();
          const completed = performance.now();
          computeNodeCount = encoding.stats.nodes.filter(node => node.type === 'compute').length;
          if (iteration >= WARMUP_ITERATIONS) {
            encodeSamples.push(encoded - start);
            submittedSamples.push(completed - start);
          }
        }
        let selectedCount = 0;
        const bufferBytes = new Map<Buffer, Uint32Array>();
        const readChunk = async (chunk: GPUData) => {
          const buffer = chunk.buffer as Buffer;
          let words = bufferBytes.get(buffer);
          if (!words) {
            const bytes = await buffer.readAsync(0, buffer.byteLength);
            words = new Uint32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4);
            bufferBytes.set(buffer, words);
          }
          return words.subarray(chunk.byteOffset / 4, chunk.byteOffset / 4 + chunk.length);
        };
        let sourceRow = 0;
        for (let batchIndex = 0; batchIndex < frame.batches.length; batchIndex++) {
          const mask = await readChunk(compiled.selectionMask.data[batchIndex]);
          const indices = await readChunk(compiled.rowIndices.data[batchIndex]);
          const counts = await readChunk(compiled.selectedCounts.data[batchIndex]);
          let expectedBatchCount = 0;
          for (let localRow = 0; localRow < mask.length; localRow++) {
            const expectedMask = values[sourceRow + localRow] > CUT ? 1 : 0;
            if (mask[localRow] !== expectedMask)
              throw new Error(`Mask mismatch ${sourceRow + localRow}`);
            if (expectedMask) {
              if (indices[expectedBatchCount] !== sourceRow + localRow)
                throw new Error(`Index mismatch ${sourceRow + localRow}`);
              expectedBatchCount++;
            }
          }
          expect(counts[0]).toBe(expectedBatchCount);
          selectedCount += counts[0];
          sourceRow += mask.length;
        }
        bufferBytes.clear();
        expect(selectedCount, `${layout} ${batchRowCount}-row batches select every row`).toBe(
          expectedCount
        );
        results.push({
          layout,
          batchRowCount,
          batchCount: frame.batches.length,
          computeNodeCount,
          compileMilliseconds,
          encodeSamples,
          submittedSamples,
          encodeMilliseconds: getMedian(encodeSamples),
          encodeAndSubmittedWorkMilliseconds: getMedian(submittedSamples)
        });
      } finally {
        compiled.destroy();
        frame.destroy();
        for (const buffer of buffers) {
          buffer.destroy();
        }
      }
    }
  }

  await annotate(
    JSON.stringify({
      benchmark: 'GPU_DATAFRAME_BATCH_SCALING',
      device: device.info,
      rowCount: ROW_COUNT,
      warmupIterations: WARMUP_ITERATIONS,
      measuredIterations: MEASURED_ITERATIONS,
      results
    }),
    'benchmark'
  );
}, 600_000);

/** Slices one buffer into contiguous batch views, or copies every batch into its own buffer. */
function createFrame(
  device: Device,
  values: Float32Array,
  batchRowCount: number,
  layout: BatchLayout
): {frame: GPUDataFrame<BenchmarkSchema>; buffers: Buffer[]} {
  const buffers: Buffer[] = [];
  const sharedBuffer =
    layout === 'shared'
      ? device.createBuffer({id: 'batch-scaling-values', usage: Buffer.STORAGE, data: values})
      : undefined;
  if (sharedBuffer) {
    buffers.push(sharedBuffer);
  }
  const batches: GPURecordBatch<BenchmarkSchema>[] = [];
  for (let rowOffset = 0; rowOffset < values.length; rowOffset += batchRowCount) {
    const length = Math.min(batchRowCount, values.length - rowOffset);
    let buffer = sharedBuffer;
    if (!buffer) {
      buffer = device.createBuffer({
        id: `batch-scaling-values-${batches.length}`,
        usage: Buffer.STORAGE,
        data: values.subarray(rowOffset, rowOffset + length)
      });
      buffers.push(buffer);
    }
    batches.push(
      new GPURecordBatch<BenchmarkSchema>({
        gpuData: {
          value: new GPUData({
            buffer,
            format: 'float32',
            length,
            byteOffset: sharedBuffer ? rowOffset * Float32Array.BYTES_PER_ELEMENT : 0,
            ownsBuffer: false
          })
        },
        fields: [{name: 'value', format: 'float32', nullable: false}]
      })
    );
  }
  return {
    frame: new GPUDataFrame<BenchmarkSchema>({
      table: new GPUTable<BenchmarkSchema>({batches}),
      ownership: 'owned'
    }),
    buffers
  };
}

function getMedian(samples: readonly number[]): number {
  const sorted = [...samples].sort((left, right) => left - right);
  return sorted[Math.floor(sorted.length / 2)];
}
