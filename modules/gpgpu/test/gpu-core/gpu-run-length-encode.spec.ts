// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {describe, expect, it} from 'vitest';
import {Buffer} from '@luma.gl/core';
import {GPUCommandGraph} from '../../src/gpu-core/gpu-command-graph';
import {GPURunLengthEncode} from '../../src/gpu-core/gpu-run-length-encode';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';

describe('GPURunLengthEncode', () => {
  it('validates output capacity', async () => {
    const device = await getWebGPUTestDevice();
    if (!device) return;
    const graph = new GPUCommandGraph(device);
    const input = createView(graph, 'input', 6);
    const values = createView(graph, 'values', 2);
    const lengths = createView(graph, 'lengths', 6);
    const count = createView(graph, 'count', 1);
    expect(() => new GPURunLengthEncode({input, values, lengths, count})).toThrow(/capacity/);
  });

  it('adds graph nodes for ordered run encoding', async () => {
    const device = await getWebGPUTestDevice();
    if (!device) return;
    const graph = new GPUCommandGraph(device);
    const input = createView(graph, 'input', 6);
    const values = createView(graph, 'values', 6);
    const lengths = createView(graph, 'lengths', 6);
    const count = createView(graph, 'count', 1);
    graph.add(new GPURunLengthEncode({input, values, lengths, count}));
    expect(graph).toBeDefined();
  });
});

function createView(graph: GPUCommandGraph, id: string, length: number) {
  const buffer = graph.createTransientBuffer({
    id,
    byteLength: length * Uint32Array.BYTES_PER_ELEMENT,
    usage: Buffer.STORAGE
  });
  return graph.createDataView(buffer, {format: 'uint32', length});
}
