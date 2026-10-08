// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it, vi} from 'vitest';
import {Buffer} from '@luma.gl/core';
import {GPUCommandGraph} from '@luma.gl/gpgpu/gpu-core';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {
  makeSourceBatches,
  makeTableTransform,
  uploadSourceTable
} from './projection-table-fixtures';

it.each([
  'double-single',
  'local-f32'
] as const)('projects a preserved UTM table with explicit %s output and caller submission', async (precision, context) => {
  const device = await getWebGPUTestDevice();
  if (!device) context.skip();
  // Raw binary64/double-single arithmetic is qualified on hardware separately from software CI.
  if (device.info.gpu === 'software' || device.info.gpuType === 'cpu' || device.info.fallback)
    context.skip();
  const transform = makeTableTransform(precision);
  const batches = makeSourceBatches();
  const expected = [...transform.projectBatches(batches)];
  const source = uploadSourceTable(device, batches);
  const graph = new GPUCommandGraph(device);
  let compiled: ReturnType<GPUCommandGraph['compile']> | undefined;
  const submit = vi.spyOn(device, 'submit');
  const result = transform.createGPUProjectionTable(device, {
    id: `utm-${precision}`,
    table: source,
    positions: 'coordinates',
    inputValidity: 'selected'
  });
  try {
    const readbacks = source.batches.map(batch =>
      vi.spyOn(
        batch.gpuData.coordinates.buffer instanceof Buffer
          ? batch.gpuData.coordinates.buffer
          : batch.gpuData.coordinates.buffer.buffer,
        'readAsync'
      )
    );
    result.addToGraph(graph);
    compiled = graph.compile();
    expect(submit).not.toHaveBeenCalled();
    for (const readback of readbacks) {
      expect(readback).not.toHaveBeenCalled();
      readback.mockRestore();
    }
    submit.mockRestore();
    const encoder = device.createCommandEncoder();
    compiled.encode(encoder, {parameters: undefined});
    device.submit(encoder.finish());
    const decoded: number[][] = [];
    for (const [index, batch] of result.table.batches.entries()) {
      expect(batch.sourceInfo).toEqual(batches[index].sourceInfo);
      expect(batch.schema.metadata).toEqual(batches[index].metadata);
      if (!batch.numRows) {
        decoded.push([]);
        continue;
      }
      const data = batch.gpuData.positions;
      const buffer = data.buffer instanceof Buffer ? data.buffer : data.buffer.buffer;
      const validityData = batch.gpuData.validity;
      const validityBuffer =
        validityData.buffer instanceof Buffer ? validityData.buffer : validityData.buffer.buffer;
      const values = new Float32Array(
        (await buffer.readAsync(0, batch.numRows * data.byteStride)).buffer
      );
      const validity = new Uint32Array(
        (await validityBuffer.readAsync(0, batch.numRows * 4)).buffer
      );
      expect(validity).toEqual(expected[index].validity);
      const coordinates: number[] = [];
      for (let row = 0; row < batch.numRows; row++) {
        const width = precision === 'double-single' ? 4 : 2;
        if (!validity[row]) {
          expect(Array.from(values.subarray(row * width, (row + 1) * width))).toEqual(
            new Array(width).fill(0)
          );
          coordinates.push(0, 0);
          continue;
        }
        const first =
          precision === 'double-single'
            ? values[row * 4] + values[row * 4 + 1]
            : values[row * 2] + transform.prepared.compiled.destinationOrigin[0];
        const second =
          precision === 'double-single'
            ? values[row * 4 + 2] + values[row * 4 + 3]
            : values[row * 2 + 1] + transform.prepared.compiled.destinationOrigin[1];
        coordinates.push(first, second);
        expect(
          Math.hypot(
            first - expected[index].positions[row * 2],
            second - expected[index].positions[row * 2 + 1]
          )
        ).toBeLessThan(precision === 'double-single' ? 0.0002 : 0.01);
      }
      decoded.push(coordinates);
    }
    if (precision === 'double-single') {
      expect(Math.abs(decoded[0][0] - decoded[0][2])).toBeGreaterThan(0.0005);
    }
    // Sources remain borrowed and unchanged after execution and result disposal.
    const sourceBuffer = source.batches[0].gpuData.coordinates.buffer;
    result.destroy();
    expect(sourceBuffer.destroyed).toBe(false);
    const raw = sourceBuffer instanceof Buffer ? sourceBuffer : sourceBuffer.buffer;
    expect(
      new Float64Array((await raw.readAsync(256, batches[0].positions.byteLength)).buffer)
    ).toEqual(batches[0].positions);
  } finally {
    submit.mockRestore();
    compiled?.destroy();
    result.destroy();
    source.destroy();
  }
});
