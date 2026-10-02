// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {summarizeGPUWorkgroupScanBenchmarkSamples as summarizeSamples} from '@luma.gl/gpgpu/gpu-core';
import {GPUAdaptiveSpMV} from '../../src/gpu-core/gpu-adaptive-spmv';
import {BatchConformanceFixture} from './batch-conformance-utils';
import {expect, test} from 'vitest';

// Fixed data volume; only physical fragmentation changes. No timing assertions on shared hosts.
test('fragmentation baseline reports lowering, compilation, encoding, GPU time and scratch', async ({
  annotate,
  skip
}) => {
  const device = await getWebGPUTestDevice('core');
  if (!device) skip('WebGPU unavailable');
  const length = 256;
  const reports = [];
  for (const profile of [
    {name: 'contiguous', lengths: [length]},
    {name: 'four chunks', lengths: Array(4).fill(length / 4)},
    {name: 'sixteen chunks', lengths: Array(16).fill(length / 16)},
    {name: 'skewed with empties', lengths: [0, ...Array(15).fill(1), 0, length - 15, 0]}
  ]) {
    const lowering: number[] = [],
      compilation: number[] = [],
      encoding: number[] = [],
      gpu: number[] = [];
    let nodeCount = 0,
      scratchBytes = 0;
    for (let iteration = 0; iteration < 6; iteration++) {
      const fixture = new BatchConformanceFixture(device);
      const rowOffsets = fixture.column(
        'rows',
        'uint32',
        Array.from({length: length + 1}, (_, index) => index),
        [length + 1]
      );
      const columnIndices = fixture.column(
        'columns',
        'uint32',
        Array.from({length}, (_, index) => (index * 17) % length),
        profile.lengths
      );
      const values = fixture.column('values', 'float32', Array(length).fill(2), profile.lengths);
      const vector = fixture.column(
        'vector',
        'float32',
        Array.from({length}, (_, index) => index + 1),
        profile.lengths
      );
      const output = fixture.column('output', 'float32', Array(length).fill(77), profile.lengths);
      const start = performance.now();
      fixture.graph.add(
        new GPUAdaptiveSpMV({
          rowOffsets,
          columnIndices,
          values,
          vector,
          output,
          columns: length,
          strategy: 'scalar-row'
        })
      );
      const lowered = performance.now();
      const compiled = fixture.graph.compile();
      const compiledAt = performance.now();
      const querySet = device.features.has('timestamp-query')
        ? device.createQuerySet({type: 'timestamp', count: 2})
        : undefined;
      try {
        const encoder = device.createCommandEncoder({timeProfilingQuerySet: querySet});
        const result = compiled.encode(encoder, {parameters: undefined});
        device.submit(encoder.finish());
        const timings = await result.readTimings();
        expect(await fixture.read(output)).toEqual(
          Array.from({length}, (_, index) => 2 * (((index * 17) % length) + 1))
        );
        if (iteration > 0) {
          lowering.push(lowered - start);
          compilation.push(compiledAt - lowered);
          encoding.push(timings.cpuEncodeTimeMilliseconds);
          if (timings.gpuTimeMilliseconds !== undefined) gpu.push(timings.gpuTimeMilliseconds);
        }
        nodeCount = compiled.stats.nodeOrder.length;
        scratchBytes = compiled.stats.physicalTransientBytes;
      } finally {
        querySet?.destroy();
        compiled.destroy();
        fixture.destroy();
      }
    }
    reports.push({
      profile: profile.name,
      chunkCount: profile.lengths.length,
      nodeCount,
      scratchBytes,
      loweringMilliseconds: summarizeSamples(lowering),
      compilationMilliseconds: summarizeSamples(compilation),
      cpuEncodeMilliseconds: summarizeSamples(encoding),
      ...(gpu.length ? {gpuMilliseconds: summarizeSamples(gpu)} : {})
    });
  }
  await annotate(
    JSON.stringify({
      benchmark: 'GPU_FRAGMENTATION_BASELINE',
      device: device.info,
      rows: length,
      nonzeros: length,
      warmupIterations: 1,
      measuredIterations: 5,
      reports
    }),
    'benchmark'
  );
}, 120_000);
