// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it, vi} from 'vitest';
import {NullDevice} from '@luma.gl/test-utils';
import {runProjectionTableBenchmark} from '@luma.gl/experimental/gpu-project/benchmarks';
import {makeSourceBatches, makeTableTransform} from './projection-table-fixtures';

it('rejects invalid measurements and malformed inputs before allocating GPU resources', async () => {
  const device = new NullDevice({});
  const allocate = vi.spyOn(device, 'createBuffer');
  const options = {
    transform: makeTableTransform(),
    provider: 'test',
    batches: makeSourceBatches(),
    maximumError: 0.001
  };
  try {
    for (const overrides of [
      {provider: ''},
      {maximumError: NaN},
      {maximumError: -1},
      {warmupIterations: -1},
      {measuredIterations: 0},
      {measuredIterations: 1.5},
      {batches: []},
      {batches: [{positions: new Float64Array(0)}]},
      {batches: [{positions: Float64Array.of(1)}]},
      {batches: [{positions: new Float64Array(2), inputValidity: new Uint32Array(2)}]}
    ]) {
      await expect(
        runProjectionTableBenchmark(device, {...options, ...overrides})
      ).rejects.toThrow();
    }
    expect(allocate).not.toHaveBeenCalled();
  } finally {
    allocate.mockRestore();
    device.destroy();
  }
});

it('refuses unstable CPU results even when they would fit the requested GPU error budget', async () => {
  const device = new NullDevice({});
  const transform = makeTableTransform();
  const project = transform.projectBatch.bind(transform);
  let calls = 0;
  vi.spyOn(transform, 'projectBatch').mockImplementation(batch => {
    const output = project(batch);
    if (++calls > 1) output.positions[0] += 0.0001;
    return output;
  });
  const allocate = vi.spyOn(device, 'createBuffer');
  try {
    await expect(
      runProjectionTableBenchmark(device, {
        transform,
        provider: 'unstable',
        batches: [makeSourceBatches()[0]],
        maximumError: 1,
        warmupIterations: 0,
        measuredIterations: 1
      })
    ).rejects.toThrow(/mismatch/);
    expect(allocate).not.toHaveBeenCalled();
  } finally {
    allocate.mockRestore();
    device.destroy();
  }
});

it('propagates CPU provider failure without reporting timings', async () => {
  const device = new NullDevice({});
  const transform = makeTableTransform();
  vi.spyOn(transform.prepared.projection, 'projectToSync').mockImplementation(() => {
    throw new Error('provider unavailable');
  });
  const allocate = vi.spyOn(device, 'createBuffer');
  try {
    await expect(
      runProjectionTableBenchmark(device, {
        transform,
        provider: 'failing',
        batches: makeSourceBatches(),
        maximumError: 1
      })
    ).rejects.toThrow(/CPU table projection failed/);
    expect(allocate).not.toHaveBeenCalled();
  } finally {
    allocate.mockRestore();
    device.destroy();
  }
});

for (const corruption of ['sourceInfo', 'metadata'] as const) {
  it(`rejects CPU ${corruption} changes even when coordinates agree`, async () => {
    const device = new NullDevice({});
    const transform = makeTableTransform();
    const project = transform.projectBatch.bind(transform);
    let calls = 0;
    vi.spyOn(transform, 'projectBatch').mockImplementation(batch => {
      const output = project(batch);
      if (++calls > 1) {
        if (corruption === 'sourceInfo') output.sourceInfo = undefined;
        else output.metadata.set('source', 'incorrect');
      }
      return output;
    });
    const allocate = vi.spyOn(device, 'createBuffer');
    try {
      await expect(
        runProjectionTableBenchmark(device, {
          transform,
          provider: 'test',
          batches: [makeSourceBatches()[0]],
          maximumError: 0.001,
          warmupIterations: 0,
          measuredIterations: 1
        })
      ).rejects.toThrow(/provenance mismatch/);
      expect(allocate).not.toHaveBeenCalled();
    } finally {
      allocate.mockRestore();
      device.destroy();
    }
  });
}

it('cleans up partially allocated inputs without altering caller arrays', async () => {
  const device = new NullDevice({});
  const buffer = device.createBuffer({byteLength: 80});
  const destroy = vi.spyOn(buffer, 'destroy');
  const allocate = vi
    .spyOn(device, 'createBuffer')
    .mockReturnValueOnce(buffer)
    .mockImplementation(() => {
      throw new Error('allocation failed');
    });
  const batches = makeSourceBatches();
  const original = batches.map(batch => batch.positions.slice());
  try {
    await expect(
      runProjectionTableBenchmark(device, {
        transform: makeTableTransform(),
        provider: 'test',
        batches,
        maximumError: 0.001,
        warmupIterations: 0,
        measuredIterations: 1
      })
    ).rejects.toThrow('allocation failed');
    expect(destroy).toHaveBeenCalledOnce();
    expect(batches.map(batch => batch.positions)).toEqual(original);
  } finally {
    allocate.mockRestore();
    device.destroy();
  }
});
