// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {describe, expect, it} from 'vitest';
import {Buffer} from '@luma.gl/core';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {GPUCommandGraph} from '../../src/gpu-core/gpu-command-graph';
import {GPUSegmentedReduction} from '../../src/gpu-core/gpu-segmented-reduction';

describe('GPUSegmentedReduction', () => {
  it('validates CSR-style offset cardinality', async () => {
    const device = await getWebGPUTestDevice();
    if (!device) return;
    const graph = new GPUCommandGraph(device);
    const input = graph.createDataView(graph.createBuffer({byteLength: 16}), {format: 'uint32', length: 4});
    const offsets = graph.createDataView(graph.createBuffer({byteLength: 8}), {format: 'uint32', length: 2});
    const output = graph.createDataView(graph.createBuffer({byteLength: 8}), {format: 'uint32', length: 2});
    expect(() => new GPUSegmentedReduction({input, segmentOffsets: offsets, output, operation: 'sum'})).toThrow(/output.length \+ 1/);
  });

  it('reduces independent uint32 segments including an empty segment', async () => {
    const device = await getWebGPUTestDevice();
    if (!device || device.info.gpu === 'software' || device.info.gpuType === 'cpu' || device.info.fallback) return;
    const graph = new GPUCommandGraph(device);
    const inputBuffer = graph.createBuffer({data: new Uint32Array([2, 3, 5, 7, 11]), usage: Buffer.STORAGE | Buffer.COPY_SRC});
    const offsetBuffer = graph.createBuffer({data: new Uint32Array([0, 2, 2, 5]), usage: Buffer.STORAGE | Buffer.COPY_SRC});
    const outputBuffer = graph.createBuffer({byteLength: 3 * 4, usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST});
    const input = graph.createDataView(inputBuffer, {format: 'uint32', length: 5});
    const offsets = graph.createDataView(offsetBuffer, {format: 'uint32', length: 4});
    const output = graph.createDataView(outputBuffer, {format: 'uint32', length: 3});
    new GPUSegmentedReduction({input, segmentOffsets: offsets, output, operation: 'sum'}).addToGraph(graph);
    const compiled = graph.compile();
    compiled.execute();
    const bytes = await outputBuffer.buffer.readAsync();
    expect(Array.from(new Uint32Array(bytes.buffer, bytes.byteOffset, 3))).toEqual([5, 0, 23]);
    compiled.destroy();
  });
});
