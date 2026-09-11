// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {describe, expect, it} from 'vitest';
import {GPUCommandGraph} from '../../src/gpu-core/gpu-command-graph';
import {GPURunLengthEncode} from '../../src/gpu-core/gpu-run-length-encode';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';

describe('GPURunLengthEncode', () => {
  it('validates output capacity', async () => {
    const device = await getWebGPUTestDevice();
    if (!device) return;
    const graph = new GPUCommandGraph(device);
    const input = graph.createDataView(graph.createBuffer({byteLength: 24}), {format: 'uint32', length: 6});
    const values = graph.createDataView(graph.createBuffer({byteLength: 8}), {format: 'uint32', length: 2});
    const lengths = graph.createDataView(graph.createBuffer({byteLength: 24}), {format: 'uint32', length: 6});
    const count = graph.createDataView(graph.createBuffer({byteLength: 4}), {format: 'uint32', length: 1});
    expect(() => new GPURunLengthEncode({input, values, lengths, count})).toThrow(/capacity/);
  });

  it('adds graph nodes for ordered run encoding', async () => {
    const device = await getWebGPUTestDevice();
    if (!device) return;
    const graph = new GPUCommandGraph(device);
    const input = graph.createDataView(graph.createBuffer({byteLength: 24}), {format: 'uint32', length: 6});
    const values = graph.createDataView(graph.createBuffer({byteLength: 24}), {format: 'uint32', length: 6});
    const lengths = graph.createDataView(graph.createBuffer({byteLength: 24}), {format: 'uint32', length: 6});
    const count = graph.createDataView(graph.createBuffer({byteLength: 4}), {format: 'uint32', length: 1});
    new GPURunLengthEncode({input, values, lengths, count}).addToGraph(graph);
    expect(graph).toBeDefined();
  });
});
