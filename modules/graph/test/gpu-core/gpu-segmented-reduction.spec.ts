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

  it.each([
    false,
    true
  ])('sums sorted float32 segments (multi-axis dispatch: %s)', async multiAxis => {
    const device = await getWebGPUTestDevice();
    if (
      !device ||
      device.info.gpu === 'software' ||
      device.info.gpuType === 'cpu' ||
      device.info.fallback
    )
      return;
    const graph = new GPUCommandGraph(device);
    const segmentCount = multiAxis ? device.limits.maxComputeWorkgroupsPerDimension + 1 : 3;
    const inputValues = new Float32Array(segmentCount + 4);
    const offsetValues = new Uint32Array(segmentCount + 3);
    const expected = new Float32Array(segmentCount + 2).fill(-10);
    for (let segment = 0; segment < segmentCount; segment++) {
      offsetValues[segment + 1] = segment < 2 ? segment * 2 : segment;
      if (segment === 1) {
        expected[segment + 1] = 0;
      } else {
        inputValues[segment + 1] = segment + 1;
        expected[segment + 1] = segment + 1;
      }
    }
    inputValues[segmentCount + 1] = 1000;
    offsetValues[segmentCount + 1] = segmentCount + 2;
    const inputBuffer = device.createBuffer({data: inputValues, usage: Buffer.STORAGE});
    const offsetBuffer = device.createBuffer({data: offsetValues, usage: Buffer.STORAGE});
    const outputBuffer = device.createBuffer({
      data: new Float32Array(segmentCount + 2).fill(-10),
      usage: Buffer.STORAGE | Buffer.COPY_SRC
    });
    const input = graph.createDataView(
      graph.importBuffer(
        {id: 'input', byteLength: inputBuffer.byteLength, usage: inputBuffer.usage},
        inputBuffer
      ),
      {format: 'float32', length: segmentCount, byteOffset: 4}
    );
    const offsets = graph.createDataView(
      graph.importBuffer(
        {id: 'offsets', byteLength: offsetBuffer.byteLength, usage: offsetBuffer.usage},
        offsetBuffer
      ),
      {format: 'uint32', length: segmentCount + 1, byteOffset: 4}
    );
    const output = graph.createDataView(
      graph.importBuffer(
        {id: 'output', byteLength: outputBuffer.byteLength, usage: outputBuffer.usage},
        outputBuffer
      ),
      {format: 'float32', length: segmentCount, byteOffset: 4}
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
      expect(new Float32Array(bytes.buffer, bytes.byteOffset, expected.length)).toEqual(expected);
    } finally {
      compiled.destroy();
      inputBuffer.destroy();
      offsetBuffer.destroy();
      outputBuffer.destroy();
    }
  });
});
