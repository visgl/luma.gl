// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer} from '@luma.gl/core';
import {GPUChunkedIndexedScatter, GPUCommandGraph} from '@luma.gl/gpgpu/gpu-core';
import {NullDevice} from '@luma.gl/test-utils';
import {describe, expect, test, vi} from 'vitest';

describe('GPUChunkedIndexedScatter graph construction', () => {
  test('owns the complete GPU route workflow', () => {
    const fixture = createScatterFixture();
    const addComputePass = vi.spyOn(fixture.graph, 'addComputePass');

    try {
      const result = fixture.scatter.addToGraph(fixture.graph);
      expect(addComputePass.mock.calls.map(([pass]) => pass.id)).toEqual([
        'routes-initialize',
        'routes-count',
        'routes-publish',
        'routes-scatter'
      ]);
      expect(result.chunkCounts.length).toBe(3);
      expect(result.chunkOffsets.length).toBe(3);
      expect(result.dispatchCommands.length).toBe(9);
      expect(result.chunkCounts.buffer).toBe(result.chunkOffsets.buffer);
    } finally {
      addComputePass.mockRestore();
      fixture.device.destroy();
    }
  });

  test('validates route records, chunk boundaries, and output capacity', () => {
    const fixture = createScatterFixture();
    const props = {
      sourceIds: fixture.scatter.sourceIds,
      sourceCount: fixture.scatter.sourceCount,
      routes: fixture.scatter.routes,
      routeLayout: fixture.scatter.routeLayout,
      chunkEnds: fixture.scatter.chunkEnds,
      output: fixture.scatter.output
    };

    try {
      expect(() => new GPUChunkedIndexedScatter({...props, chunkEnds: [4, 4, 12]})).toThrow(
        /strictly increasing uint32 values/i
      );
      expect(
        () =>
          new GPUChunkedIndexedScatter({
            ...props,
            routeLayout: {wordStride: 2, firstRouteWordOffset: 0, routeCount: 0}
          })
      ).toThrow(/routeCount must be between 1 and 16/i);
      expect(
        () =>
          new GPUChunkedIndexedScatter({
            ...props,
            output: createView(fixture.graph, 'short-output', 5)
          })
      ).toThrow(/sourceIds.length \* routeCount/i);
    } finally {
      fixture.device.destroy();
    }
  });
});

function createScatterFixture(): {
  device: NullDevice;
  graph: GPUCommandGraph;
  scatter: GPUChunkedIndexedScatter;
} {
  const device = new NullDevice({id: 'chunked-scatter-node-device'});
  Object.defineProperty(device, 'type', {value: 'webgpu'});
  const graph = new GPUCommandGraph(device, {id: 'chunked-scatter-node-graph'});
  const scatter = new GPUChunkedIndexedScatter({
    id: 'routes',
    sourceIds: createView(graph, 'source-ids', 3),
    sourceCount: createView(graph, 'source-count', 1),
    routes: createView(graph, 'routes', 6),
    routeLayout: {wordStride: 2, firstRouteWordOffset: 0, routeCount: 2},
    chunkEnds: [4, 8, 12],
    output: createView(graph, 'output', 6)
  });
  return {device, graph, scatter};
}

function createView(graph: GPUCommandGraph, id: string, length: number) {
  const buffer = graph.createTransientBuffer({
    id,
    byteLength: Math.max(length, 1) * Uint32Array.BYTES_PER_ELEMENT,
    usage: Buffer.STORAGE
  });
  return graph.createDataView(buffer, {format: 'uint32', length});
}
