// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  makeArrowTableFromGPUAnalyticsTable,
  makeGPUAnalyticsTableFromArrowTable
} from '@luma.gl/graph/arrow';
import {GPUCommandGraph} from '@luma.gl/graph/gpu-core';
import {GPUDataFrame} from '@luma.gl/graph/gpu-dataframe';
import {GPUSQLContext} from '@luma.gl/graph/gpu-sql';
import {getWebGPUTestDevice} from '@luma.gl/core/test-utils';
import * as arrow from 'apache-arrow';
import {expect, test, vi} from 'vitest';

const ROW_COUNT = 16_384;
const LEFT_BATCH_COUNT = 8;
const STAGING_BYTES = ROW_COUNT * 2 * Uint32Array.BYTES_PER_ELEMENT;
const MEASURED_ITERATIONS = 5;

test('GPU SQL right projection benchmark across fixed-row batch layouts and scratch caps', async ({
  annotate,
  skip
}) => {
  const device = await getWebGPUTestDevice('max');
  if (!device) skip('WebGPU is unavailable');

  const identifiers = Uint32Array.from({length: ROW_COUNT}, (_, index) => index);
  const scores = Array.from(identifiers, identifier => (identifier % 7 === 0 ? null : identifier));
  const leftRows = arrow.tableFromArrays({identifier: identifiers});
  const rightRows = arrow.tableFromArrays({
    identifier: identifiers,
    score: arrow.vectorFromArray(scores, new arrow.Float32())
  });
  const left = new GPUDataFrame({
    ...makeGPUAnalyticsTableFromArrowTable(device, splitArrowRows(leftRows, LEFT_BATCH_COUNT)),
    ownership: 'owned'
  });
  try {
    for (const rightBatchCount of [1, 8, 32]) {
      const right = new GPUDataFrame({
        ...makeGPUAnalyticsTableFromArrowTable(device, splitArrowRows(rightRows, rightBatchCount)),
        ownership: 'owned'
      });
      try {
        const context = new GPUSQLContext({left_rows: left, right_rows: right});
        const stagingCaps = rightBatchCount === 1 ? [0] : [0, STAGING_BYTES / 2, STAGING_BYTES];
        for (const maxJoinProjectionScratchBytes of stagingCaps) {
          const query = context.query(
            'SELECT r.score FROM left_rows AS l INNER JOIN right_rows AS r ON l.identifier = r.identifier',
            {maxJoinProjectionScratchBytes}
          );
          const graph = new GPUCommandGraph(device);
          const computePasses = vi.spyOn(graph, 'addComputePass');
          const copyPasses = vi.spyOn(graph, 'addCopyPass');
          const transientBuffers = vi.spyOn(graph, 'createTransientBuffer');
          const compileStart = performance.now();
          const result = query.compile(graph);
          const compileMilliseconds = performance.now() - compileStart;
          try {
            const projectionComputePasses = computePasses.mock.calls.filter(([pass]) =>
              pass.id.includes('-join-projection-')
            ).length;
            const projectionCopyPasses = copyPasses.mock.calls.filter(([pass]) =>
              pass.id.includes('-join-projection-')
            ).length;
            const projectionScratchBytes = transientBuffers.mock.calls
              .filter(([buffer]) => buffer.id.includes('-join-projection-'))
              .reduce((bytes, [buffer]) => bytes + buffer.byteLength, 0);
            const stagedChunks = Math.floor(
              (rightBatchCount * maxJoinProjectionScratchBytes) / STAGING_BYTES
            );
            const projectedRanges = rightBatchCount - stagedChunks + Number(stagedChunks > 0);
            expect(projectionComputePasses).toBe(LEFT_BATCH_COUNT * projectedRanges);
            expect(projectionCopyPasses).toBe(stagedChunks);
            expect(projectionScratchBytes).toBe(maxJoinProjectionScratchBytes);
            const queryCount = computePasses.mock.calls.length * 2;
            const timestampQueries = device.features.has('timestamp-query');
            const encodeSamples: number[] = [];
            const wallSamples: number[] = [];
            const gpuSamples: number[] = [];
            // Timestamp profiling changes pass boundaries. Use separate runs for wall measurements.
            for (const profile of timestampQueries ? [false, true] : [false]) {
              const querySet = profile
                ? device.createQuerySet({type: 'timestamp', count: queryCount})
                : undefined;
              try {
                for (let iteration = 0; iteration <= MEASURED_ITERATIONS; iteration++) {
                  const start = performance.now();
                  const encoder = device.createCommandEncoder({timeProfilingQuerySet: querySet});
                  const encoding = result.encode(encoder);
                  const commands = encoder.finish();
                  const encoded = performance.now();
                  device.submit(commands);
                  const fence = device.createFence();
                  try {
                    await fence.signaled;
                  } finally {
                    fence.destroy();
                  }
                  const completed = performance.now();
                  if (iteration === 0) continue;
                  if (profile) {
                    const {gpuTimeMilliseconds} = await encoding.readTimings();
                    if (gpuTimeMilliseconds !== undefined) gpuSamples.push(gpuTimeMilliseconds);
                  } else {
                    encodeSamples.push(encoded - start);
                    wallSamples.push(completed - start);
                  }
                }
              } finally {
                querySet?.destroy();
              }
            }
            const output = await makeArrowTableFromGPUAnalyticsTable({
              table: result.table,
              validity: result.validity,
              rowIndices: result.rowIndices,
              selectedCounts: result.selectedCounts
            });
            expect(Array.from(output.getChild('score') ?? [])).toEqual(scores);
            await annotate(
              JSON.stringify({
                benchmark: 'GPU_SQL_JOIN_PROJECTION',
                rowsPerSide: ROW_COUNT,
                leftBatchCount: LEFT_BATCH_COUNT,
                rightBatchCount,
                maxJoinProjectionScratchBytes,
                projectionScratchBytes,
                projectionComputePasses,
                projectionCopyPasses,
                compileMilliseconds,
                medianEncodeMilliseconds: median(encodeSamples),
                medianEndToEndMilliseconds: median(wallSamples),
                medianGpuMilliseconds: median(gpuSamples)
              }),
              'benchmark'
            );
          } finally {
            result.destroy();
          }
        }
      } finally {
        right.destroy();
      }
    }
  } finally {
    left.destroy();
  }
}, 300_000);

/** Splits equal-size Arrow batches while preserving the input row sequence. */
function splitArrowRows(table: arrow.Table, batchCount: number): arrow.Table {
  const rowsPerBatch = table.numRows / batchCount;
  return new arrow.Table(
    Array.from(
      {length: batchCount},
      (_, index) => table.slice(index * rowsPerBatch, (index + 1) * rowsPerBatch).batches[0]
    )
  );
}

/** Returns the middle measurement or null when the device provided no timestamp samples. */
function median(samples: number[]): number | null {
  return (
    samples.toSorted((first, second) => first - second)[Math.floor(samples.length / 2)] ?? null
  );
}
