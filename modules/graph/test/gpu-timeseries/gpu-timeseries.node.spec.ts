// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {GPUVector} from '@luma.gl/gpgpu/gpu-data';
import {NullDevice} from '@luma.gl/test-utils';
import {GPUTimeSeries, GPUTimeSeriesEnvelope} from '@luma.gl/graph/gpu-timeseries';
import {createFixture} from './test-utils';

test('time-series operations preserve chunks and borrowed storage without submission or allocation', () => {
  const device = new NullDevice({});
  const fixture = createFixture(device, [[1, 2], [], [3, 4]]);
  try {
    const allocate = vi.spyOn(device, 'createBuffer');
    const submit = vi.spyOn(device, 'submit');
    const operation = new GPUTimeSeriesEnvelope(fixture.props);
    expect(operation.props.series).toBe(fixture.series);
    expect(allocate).not.toHaveBeenCalled();
    expect(submit).not.toHaveBeenCalled();
    expect(fixture.series.values.data.map(chunk => chunk.length)).toEqual([2, 0, 2]);
    for (const vector of fixture.vectors) vector.destroy();
    expect(fixture.buffers.every(buffer => !buffer.destroyed)).toBe(true);
    allocate.mockRestore();
    submit.mockRestore();
  } finally {
    fixture.destroy();
    device.destroy();
  }
});

test('time-series contracts reject invalid time metadata and writable aliases', () => {
  const device = new NullDevice({});
  const fixture = createFixture(device, [[1, 2]]);
  try {
    expect(() => new GPUTimeSeries({values: fixture.series.values, interval: 0})).toThrow();
    expect(() => new GPUTimeSeries({values: fixture.series.values, origin: Infinity})).toThrow();
    expect(
      () => new GPUTimeSeriesEnvelope({...fixture.props, range: fixture.counts.vector})
    ).toThrow();
    expect(
      () =>
        new GPUTimeSeriesEnvelope({
          ...fixture.props,
          sourceIds: new GPUVector<'uint32x4'>({
            type: 'buffer',
            name: 'alias',
            format: 'uint32x4',
            buffer: fixture.output.buffer,
            length: 4,
            byteOffset: 4,
            ownsBuffer: false
          })
        })
    ).toThrow();
  } finally {
    fixture.destroy();
    device.destroy();
  }
});
