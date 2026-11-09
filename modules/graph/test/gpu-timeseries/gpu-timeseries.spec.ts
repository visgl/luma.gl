// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {getWebGPUTestDevice} from '@luma.gl/core/test-utils';
import {GPUCommandGraph} from '@luma.gl/graph/gpu-core';
import {calculateEnvelope, createFixture} from './test-utils';

const scenarios = [
  {
    name: 'spikes, ties, missing and chunk boundaries',
    chunks: [[3, -4, 9], [], [9, NaN, 2, Infinity], [0, -4, 8]],
    bins: 3
  },
  {name: 'more bins than samples', chunks: [[2], [8]], bins: 7},
  {name: 'empty source', chunks: [[], []], bins: 4},
  {name: 'all invalid', chunks: [[NaN, Infinity, -Infinity]], bins: 2},
  {name: 'masked source', chunks: [[4, 8], [], [2, 7]], masks: [[1, 0], [], [0, 1]], bins: 2},
  {
    name: 'parallel workgroup reduction',
    chunks: [Array.from({length: 2001}, (_, index) => ((index * 13) % 111) - 50)],
    bins: 5
  }
];
for (const scenario of scenarios) {
  test(`GPUTimeSeriesEnvelope: ${scenario.name}`, async context => {
    const device = await getWebGPUTestDevice();
    if (!device) {
      context.skip();
      return;
    }
    const fixture = createFixture(device, scenario.chunks, scenario.bins, scenario.masks);
    const graph = new GPUCommandGraph(device);
    fixture.operation.addToGraph(graph);
    const compiled = graph.compile();
    try {
      for (const [first, last] of [
        [0, fixture.series.length],
        [1, 4],
        [99999, 999999],
        [4, 1],
        [0, fixture.series.length]
      ]) {
        fixture.range.buffer.write(new Uint32Array([first, last]), 4);
        const encoder = device.createCommandEncoder();
        compiled.encode(encoder, {parameters: undefined});
        device.submit(encoder.finish());
        const expected = calculateEnvelope(
          scenario.chunks.flat(),
          scenario.bins,
          first,
          last,
          scenario.masks?.flat()
        );
        const [output, sourceIds, counts] = await Promise.all([
          fixture.output.buffer.readAsync(4, scenario.bins * 16),
          fixture.sourceIds.buffer.readAsync(4, scenario.bins * 16),
          fixture.counts.buffer.readAsync(4, scenario.bins * 8)
        ]);
        expect(
          Array.from(new Float32Array(output.buffer, output.byteOffset, output.byteLength / 4))
        ).toEqual(expected.output);
        expect(
          Array.from(
            new Uint32Array(sourceIds.buffer, sourceIds.byteOffset, sourceIds.byteLength / 4)
          )
        ).toEqual(expected.sourceIds);
        expect(
          Array.from(new Uint32Array(counts.buffer, counts.byteOffset, counts.byteLength / 4))
        ).toEqual(expected.counts);
      }
      compiled.destroy();
      expect(fixture.buffers.every(buffer => !buffer.destroyed)).toBe(true);
    } finally {
      compiled.destroy();
      fixture.destroy();
    }
  });
}
