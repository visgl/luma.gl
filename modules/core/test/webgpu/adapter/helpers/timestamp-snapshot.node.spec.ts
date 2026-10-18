// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {afterEach, expect, test, vi} from 'vitest';
import {WebGPUCommandEncoder} from '../../../../src/webgpu/adapter/resources/webgpu-command-encoder';
import {WebGPUTimestampSnapshot} from '../../../../src/webgpu/adapter/resources/webgpu-timestamp-snapshot';
import {GPUClockCorrelator} from '../../../../src/webgpu/adapter/helpers/gpu-clock-correlator';
import type {WebGPUDevice} from '../../../../src/webgpu/adapter/webgpu-device';
import type {WebGPUQuerySet} from '../../../../src/webgpu/adapter/resources/webgpu-query-set';

afterEach(() => vi.unstubAllGlobals());

function createFixture() {
  vi.stubGlobal('GPUBufferUsage', {QUERY_RESOLVE: 1, COPY_SRC: 2, COPY_DST: 4, MAP_READ: 8});
  vi.stubGlobal('GPUMapMode', {READ: 1});
  const buffers: {data: BigUint64Array; destroy: ReturnType<typeof vi.fn>}[] = [];
  const device = {
    clockCorrelator: new GPUClockCorrelator(),
    handle: {
      createBuffer: () => {
        const buffer = {
          data: new BigUint64Array(2),
          destroy: vi.fn(),
          unmap: vi.fn(),
          mapAsync: async () => {},
          getMappedRange: () => buffer.data.buffer
        };
        buffers.push(buffer);
        return buffer;
      }
    }
  } as unknown as WebGPUDevice;
  const querySet = {props: {count: 2}, handle: {}} as WebGPUQuerySet;
  let timestamps = [1000000000n, 1004000000n];
  const encoder = {
    resolveQuerySet: (
      _query: unknown,
      _first: number,
      _count: number,
      buffer: {data: BigUint64Array}
    ) => buffer.data.set(timestamps),
    copyBufferToBuffer: (
      source: {data: BigUint64Array},
      _sourceOffset: number,
      destination: {data: BigUint64Array}
    ) => destination.data.set(source.data)
  } as unknown as GPUCommandEncoder;
  return {
    device,
    querySet,
    encoder,
    buffers,
    setTimestamps: (values: bigint[]) => {
      timestamps = values;
    }
  };
}

test('in-flight snapshots cannot switch to a later submission and release their buffers', async () => {
  const fixture = createFixture();
  const first = new WebGPUTimestampSnapshot(fixture.device, fixture.querySet);
  first.addPair(0, 1);
  first.encodeResolve(fixture.encoder);
  let finishFirst!: (time: number) => void;
  first.submit(
    100,
    new Promise(resolve => {
      finishFirst = resolve;
    })
  );
  const pendingRead = first.readResults();

  fixture.setTimestamps([1020000000n, 1024000000n]);
  const second = new WebGPUTimestampSnapshot(fixture.device, fixture.querySet);
  second.addPair(0, 1);
  second.encodeResolve(fixture.encoder);
  second.submit(120, Promise.resolve(130));
  expect(await second.readResults()).toEqual([1020000000n, 1024000000n]);
  finishFirst(110);
  expect(await pendingRead).toEqual([1000000000n, 1004000000n]);
  expect(await first.readResults()).toEqual([1000000000n, 1004000000n]);
  expect(first.clockCorrelation).toMatchObject({
    offsetMilliseconds: -897,
    uncertaintyMilliseconds: 3
  });
  expect(fixture.buffers.every(buffer => buffer.destroy.mock.calls.length === 1)).toBe(true);
});

test('discarded and failed submissions reject reads and release buffers', async () => {
  const fixture = createFixture();
  const discarded = new WebGPUTimestampSnapshot(fixture.device, fixture.querySet);
  discarded.encodeResolve(fixture.encoder);
  discarded.destroy();
  await expect(discarded.readResults()).rejects.toThrow('discarded');
  const failed = new WebGPUTimestampSnapshot(fixture.device, fixture.querySet);
  failed.encodeResolve(fixture.encoder);
  failed.submit(100, Promise.reject(new Error('device lost')));
  await expect(failed.readResults()).rejects.toThrow('device lost');
  expect(fixture.buffers.every(buffer => buffer.destroy.mock.calls.length === 1)).toBe(true);
});

test('snapshot reads reject invalid query windows before submission', async () => {
  const fixture = createFixture();
  const snapshot = new WebGPUTimestampSnapshot(fixture.device, fixture.querySet);
  try {
    for (const options of [
      {firstQuery: -1},
      {queryCount: -1},
      {firstQuery: 1, queryCount: 2},
      {firstQuery: 3, queryCount: 0}
    ]) {
      await expect(snapshot.readResults(options)).rejects.toThrow(
        'Query read range is out of bounds'
      );
    }
  } finally {
    snapshot.destroy();
  }
});

test('scoped profiling restores the caller query set and slot count on success and failure', () => {
  const fixture = createFixture();
  const encoder: WebGPUCommandEncoder = Object.create(WebGPUCommandEncoder.prototype);
  Object.assign(encoder, {_timeProfilingQuerySet: null, _timeProfilingSlotCount: 8});
  expect(
    encoder.withTimeProfilingQuerySet(fixture.querySet, () => {
      expect(encoder.getTimeProfilingQuerySet()).toBe(fixture.querySet);
      expect(encoder.getTimeProfilingSlotCount()).toBe(0);
      return 42;
    })
  ).toBe(42);
  expect(encoder.getTimeProfilingQuerySet()).toBeNull();
  expect(encoder.getTimeProfilingSlotCount()).toBe(8);
  expect(() =>
    encoder.withTimeProfilingQuerySet(fixture.querySet, () => {
      throw new Error('encoding failed');
    })
  ).toThrow('encoding failed');
  expect(encoder.getTimeProfilingQuerySet()).toBeNull();
  expect(encoder.getTimeProfilingSlotCount()).toBe(8);
});
