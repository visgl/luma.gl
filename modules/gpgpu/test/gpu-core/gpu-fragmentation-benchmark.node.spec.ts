// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer} from '@luma.gl/core';
import {NullDevice} from '@luma.gl/test-utils';
import {GPUCommandGraph, GraphVectorView} from '@luma.gl/gpgpu/gpu-core';
import {getGraphDataRange, validateChunkViews} from '../../src/gpu-core/gpu-chunk-utils';
import {expect, test} from 'vitest';

// Opt-in planning evidence; wall time is reported, never a correctness threshold.
test.skipIf(process.env.LUMA_TEST_FRAGMENTATION_BENCHMARK !== 'true')(
  'CPU fragmentation baseline',
  async ({annotate}) => {
    const reports = [];
    for (const count of [1024, 4096, 16384]) {
      const samples = [];
      for (let iteration = 0; iteration < 4; iteration++) {
        const device = new NullDevice({});
        Object.defineProperty(device, 'type', {value: 'webgpu'});
        const graph = new GPUCommandGraph(device);
        const buffers = Array.from({length: count}, (_, index) =>
          graph.createTransientBuffer({id: `chunk-${index}`, byteLength: 4, usage: Buffer.STORAGE})
        );
        const views = buffers.map(buffer =>
          graph.createDataView(buffer, {format: 'float32', length: 1})
        );
        const vector = new GraphVectorView({
          id: 'vector',
          name: 'vector',
          format: 'float32',
          length: count,
          valueLength: count,
          stride: 1,
          byteStride: 4,
          rowByteLength: 4,
          data: views
        });
        const rangeStart = performance.now();
        for (let index = 0; index < count; index++)
          expect(getGraphDataRange(graph, vector, index, 1).data[0]).toBe(views[index]);
        const rangesDone = performance.now();
        validateChunkViews(graph, [], [vector]);
        const validationDone = performance.now();
        // A long dependency chain followed by one consumer keeping every scratch chunk live.
        for (const [index, buffer] of buffers.entries())
          graph.addCopyPass({
            id: `write-${index}`,
            dependsOn: index ? [`write-${index - 1}`] : [],
            resources: [{buffer, usage: 'storage-write'}],
            compile: () => ({encode: () => {}})
          });
        graph.addCopyPass({
          id: 'consume',
          resources: buffers.map(buffer => ({buffer, usage: 'storage-read'})),
          compile: () => ({encode: () => {}})
        });
        const compileStart = performance.now();
        const compiled = graph.compile();
        const compileDone = performance.now();
        expect(compiled.stats.nodeOrder.length).toBe(count + 1);
        expect(compiled.stats.physicalTransientBufferCount).toBe(count);
        compiled.destroy();
        if (iteration)
          samples.push({
            rangeMilliseconds: rangesDone - rangeStart,
            validationMilliseconds: validationDone - rangesDone,
            compilationMilliseconds: compileDone - compileStart
          });
      }
      reports.push({chunkCount: count, samples});
    }
    await annotate(
      JSON.stringify({
        benchmark: 'CPU_FRAGMENTATION_BASELINE',
        warmupIterations: 1,
        measuredIterations: 3,
        reports
      }),
      'benchmark'
    );
  },
  120_000
);
