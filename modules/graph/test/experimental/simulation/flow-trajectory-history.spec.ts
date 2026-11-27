// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, it, vi} from 'vitest';
import {Buffer} from '@luma.gl/core';
import {getTestDevice} from '@luma.gl/core/test-utils';
import {FlowTrajectoryHistory} from '@luma.gl/graph/experimental-simulation';

it('trajectory history retains chronological GPU frames across overwrite and reset', async context => {
  const device = await getTestDevice('webgpu');
  if (!device) return context.skip();
  const history = new FlowTrajectoryHistory(device, {particleCount: 2, capacity: 2});
  const sources: Buffer[] = [];
  try {
    const encoder = device.createCommandEncoder();
    for (let frame = 0; frame < 3; frame++) {
      const source = device.createBuffer({
        data: new Float32Array([frame / 10, 0.2, frame, 1, 0.8, 0.9, frame, 7]),
        usage: Buffer.COPY_SRC
      });
      sources.push(source);
      history.record(encoder, source, frame);
    }
    device.submit(encoder.finish());
    expect(history.buffer.byteLength).toBe(64);
    expect(history.frames).toEqual([
      {time: 1, sequence: 1, byteOffset: 32},
      {time: 2, sequence: 2, byteOffset: 0}
    ]);
    const bytes = await history.buffer.readAsync();
    const values = new Float32Array(bytes.buffer, bytes.byteOffset, 16);
    for (const frame of history.frames) {
      const offset = frame.byteOffset / 4;
      expect(values[offset]).toBeCloseTo(frame.time / 10, 6);
      expect(values[offset + 2]).toBe(frame.time);
      expect(values[offset + 7]).toBe(7);
    }
    const metadata = history.frames;
    metadata[0].time = -1;
    expect(history.frames[0].time).toBe(1);
    const invalidEncoder = device.createCommandEncoder();
    expect(() => history.record(invalidEncoder, sources[0], 0)).toThrow();
    invalidEncoder.destroy();
    history.reset();
    expect(history.frames).toEqual([]);
    const resetEncoder = device.createCommandEncoder();
    history.record(resetEncoder, sources[0], 0);
    device.submit(resetEncoder.finish());
    expect(history.frames).toEqual([{time: 0, sequence: 0, byteOffset: 0}]);
    history.destroy();
    expect(sources.every(source => !source.destroyed)).toBe(true);
  } finally {
    if (!history.buffer.destroyed) history.destroy();
    for (const source of sources) source.destroy();
  }
});

it('trajectory history rejects allocations beyond the storage binding limit', async context => {
  const device = await getTestDevice('webgpu');
  if (!device) return context.skip();
  expect(
    () =>
      new FlowTrajectoryHistory(device, {
        particleCount: 1,
        capacity: Math.floor(device.limits.maxStorageBufferBindingSize / 16) + 1
      })
  ).toThrow();
  expect(() => new FlowTrajectoryHistory(device, {particleCount: 1, capacity: 0})).toThrow();
});

it('explicit history readback spans only retained slots and survives later captures', async context => {
  const device = await getTestDevice('webgpu');
  if (!device) return context.skip();
  const history = new FlowTrajectoryHistory(device, {particleCount: 1, capacity: 2});
  const source = device.createBuffer({byteLength: 16, usage: Buffer.COPY_SRC | Buffer.COPY_DST});
  const read = vi.spyOn(history.buffer, 'readAsync');
  try {
    expect(await history.readFrames()).toEqual([]);
    expect(read).not.toHaveBeenCalled();
    for (let frame = 0; frame < 3; frame++) {
      source.write(new Float32Array([frame / 10, 0.5, frame, 1]));
      const encoder = device.createCommandEncoder();
      history.record(encoder, source, frame);
      device.submit(encoder.finish());
    }
    const pending = history.readFrames();
    expect(read.mock.calls).toEqual([
      [16, 16],
      [0, 16]
    ]);
    expect(() => history.destroy()).toThrow();
    history.reset();
    source.write(new Float32Array([0.9, 0.5, 0, 2]));
    const encoder = device.createCommandEncoder();
    history.record(encoder, source, 0);
    device.submit(encoder.finish());
    const frames = await pending;
    expect(frames.map(frame => frame.time)).toEqual([1, 2]);
    expect(frames.map(frame => frame.particles[2])).toEqual([1, 2]);
    expect(frames[0].particles[0]).toBeCloseTo(0.1, 6);
    expect(frames[1].particles[0]).toBeCloseTo(0.2, 6);
    read.mockClear();
    const current = await history.readFrames();
    expect(read.mock.calls).toEqual([[0, 16]]);
    expect(current[0].particles[0]).toBeCloseTo(0.9, 6);
    current[0].particles[0] = -1;
    expect((await history.readFrames())[0].particles[0]).toBeCloseTo(0.9, 6);
  } finally {
    read.mockRestore();
    history.destroy();
    source.destroy();
  }
});
