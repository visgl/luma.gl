// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {describe, expect, it} from 'vitest';
import {Buffer} from '@luma.gl/core';
import {getWebGPUTestDevice} from '@luma.gl/core/test-utils';
import {GPUCommandGraph, GPUSegmentedReduction} from '@luma.gl/graph/gpu-core';

describe('GPUSegmentedReduction', () => {
  it('validates CSR-style offset cardinality', async () => {
    const device = await getWebGPUTestDevice();
    if (!device) return;
    const graph = new GPUCommandGraph(device);
    const input = graph.createDataView(
      graph.createTransientBuffer({id: 'input', byteLength: 16, usage: Buffer.STORAGE}),
      {format: 'uint32', length: 4}
    );
    const offsets = graph.createDataView(
      graph.createTransientBuffer({id: 'offsets', byteLength: 8, usage: Buffer.STORAGE}),
      {format: 'uint32', length: 2}
    );
    const output = graph.createDataView(
      graph.createTransientBuffer({id: 'output', byteLength: 8, usage: Buffer.STORAGE}),
      {format: 'uint32', length: 2}
    );
    expect(
      () => new GPUSegmentedReduction({input, segmentOffsets: offsets, output, operation: 'sum'})
    ).toThrow(/output.length \+ 1/);
  });

  it('sums sorted float32 segments into an offset output view', async () => {
    const device = await getWebGPUTestDevice();
    if (
      !device ||
      device.info.gpu === 'software' ||
      device.info.gpuType === 'cpu' ||
      device.info.fallback
    )
      return;
    const graph = new GPUCommandGraph(device);
    const inputBuffer = device.createBuffer({
      data: new Float32Array([100, 2, 3, 5, 7, 11, 200]),
      usage: Buffer.STORAGE | Buffer.COPY_SRC
    });
    const offsetBuffer = device.createBuffer({
      data: new Uint32Array([99, 0, 2, 2, 7, 99]),
      usage: Buffer.STORAGE | Buffer.COPY_SRC
    });
    const outputBuffer = device.createBuffer({
      data: new Float32Array([-10, -10, -10, -10, -10]),
      usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST
    });
    const input = graph.createDataView(
      graph.importBuffer(
        {id: 'input', byteLength: inputBuffer.byteLength, usage: inputBuffer.usage},
        inputBuffer
      ),
      {format: 'float32', length: 5, byteOffset: 4}
    );
    const offsets = graph.createDataView(
      graph.importBuffer(
        {id: 'offsets', byteLength: offsetBuffer.byteLength, usage: offsetBuffer.usage},
        offsetBuffer
      ),
      {format: 'uint32', length: 4, byteOffset: 4}
    );
    const output = graph.createDataView(
      graph.importBuffer(
        {id: 'output', byteLength: outputBuffer.byteLength, usage: outputBuffer.usage},
        outputBuffer
      ),
      {format: 'float32', length: 3, byteOffset: 4}
    );
    graph.add(
      new GPUSegmentedReduction({
        input,
        segmentOffsets: offsets,
        output,
        operation: 'sum'
      })
    );
    const compiled = graph.compile();
    try {
      const commandEncoder = device.createCommandEncoder({id: 'segmented-reduction-test'});
      compiled.encode(commandEncoder, {parameters: undefined});
      device.submit(commandEncoder.finish());
      const bytes = await outputBuffer.readAsync();
      expect(Array.from(new Float32Array(bytes.buffer, bytes.byteOffset, 5))).toEqual([
        -10, 5, 0, 23, -10
      ]);
    } finally {
      compiled.destroy();
      inputBuffer.destroy();
      offsetBuffer.destroy();
      outputBuffer.destroy();
    }
  });
});
