// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {Buffer} from '@luma.gl/core';
import {NullDevice} from '@luma.gl/test-utils';
import {GPUData} from '@luma.gl/gpgpu/gpu-data';
import {GPUCommandGraph} from '@luma.gl/gpgpu/gpu-core';
import {
  getGraphDataRange,
  getChunkDispatch,
  validateChunkViews
} from '../../src/gpu-core/gpu-chunk-utils';

test('logical ranges borrow whole chunks, preserve format metadata and never allocate', () => {
  const device = new NullDevice({});
  Object.defineProperty(device, 'type', {value: 'webgpu'});
  const graph = new GPUCommandGraph(device);
  const buffers = [0, 1, 2].map(() =>
    device.createBuffer({byteLength: 256, usage: Buffer.STORAGE})
  );
  const data = [2, 0, 3].map(
    (length, index) =>
      new GPUData({
        buffer: buffers[index],
        format: 'float32x2',
        length,
        byteOffset: 16,
        byteStride: 12
      })
  );
  const vector = graph.importGPUVector('input', {format: 'float32x2', length: 5, data});
  const allocate = vi.spyOn(device, 'createBuffer');
  const whole = getGraphDataRange(graph, vector, 0, 5);
  expect(whole.data).toEqual([vector.data[0], vector.data[2]]);
  expect(whole.stride).toBe(vector.stride);
  const range = getGraphDataRange(graph, vector, 1, 3);
  expect(
    range.data.map(chunk => [chunk.byteOffset, chunk.length, chunk.byteStride, chunk.rowByteLength])
  ).toEqual([
    [28, 1, 12, 8],
    [16, 2, 12, 8]
  ]);
  expect(range.data.map(chunk => chunk.buffer)).toEqual([
    vector.data[0].buffer,
    vector.data[2].buffer
  ]);
  expect(getGraphDataRange(graph, vector, 5, 0).data).toEqual([]);
  expect(() => getGraphDataRange(graph, vector, 4, 2)).toThrow(/fit/);
  expect(allocate).not.toHaveBeenCalled();
  device.destroy();
});

test('chunk validation checks empty ownership and overlapping writable intervals', () => {
  const device = new NullDevice({});
  Object.defineProperty(device, 'type', {value: 'webgpu'});
  const graph = new GPUCommandGraph(device);
  const foreign = new GPUCommandGraph(device);
  const buffer = graph.createTransientBuffer({id: 'local', byteLength: 256, usage: Buffer.STORAGE});
  const input = graph.createDataView(buffer, {format: 'uint32', length: 2});
  const overlap = graph.createDataView(buffer, {format: 'uint32', length: 2, byteOffset: 4});
  const foreignBuffer = foreign.createTransientBuffer({
    id: 'foreign',
    byteLength: 4,
    usage: Buffer.STORAGE
  });
  const empty = foreign.createDataView(foreignBuffer, {format: 'uint32', length: 0});
  expect(() => validateChunkViews(graph, [empty], [])).toThrow(/target graph/);
  expect(() => validateChunkViews(graph, [input], [overlap])).toThrow(/separate buffers/);
  expect(() => validateChunkViews(graph, [], [input, overlap])).toThrow(/overlap/);
  expect(getChunkDispatch(7, 2)).toEqual({x: 2, y: 2, z: 2});
  expect(() => getChunkDispatch(9, 2)).toThrow();
  device.destroy();
});
