// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer} from '@luma.gl/core';
import {GPUData} from '@luma.gl/gpgpu/gpu-data';
import {GPUIncrementalExecution, type GPUIncrementalBatch} from '@luma.gl/gpgpu/gpu-core';
import {NullDevice} from '@luma.gl/test-utils';
import {expect, test, vi} from 'vitest';

function createFixture() {
  const device = new NullDevice({});
  Object.defineProperty(device, 'type', {value: 'webgpu'});
  Object.defineProperty(device, 'limits', {
    value: {...device.limits, maxStorageBufferBindingSize: 1024}
  });
  const source = new GPUData({
    buffer: device.createBuffer({byteLength: 4, usage: Buffer.STORAGE}),
    format: 'uint32',
    length: 1
  });
  const partials: GPUData<'uint32'>[] = [];
  const merged: GPUData<'uint32'>[][] = [];
  let fail: 'create' | 'compile' | 'encode' | 'merge' | undefined;
  const execution = new GPUIncrementalExecution<GPUData<'uint32'>, GPUData<'uint32'>>(device, {
    createPartial: (_data, {graph, createData}) => {
      const output = createData('uint32', 1);
      partials.push(output);
      if (fail === 'create') throw new Error('create failed');
      graph.addCopyPass({
        id: 'partial',
        compile: () => {
          if (fail === 'compile') throw new Error('compile failed');
          return {
            encode: () => {
              if (fail === 'encode') throw new Error('encode failed');
            }
          };
        }
      });
      return output;
    },
    merge: (values, graph) => {
      if (fail === 'merge') throw new Error('merge failed');
      merged.push([...values]);
      graph.addCopyPass({id: 'merge', compile: () => ({encode: () => {}})});
    }
  });
  return {
    device,
    source,
    execution,
    partials,
    merged,
    setFailure: (value: typeof fail) => {
      fail = value;
    },
    batch: (id: string, revision = 0): GPUIncrementalBatch<GPUData<'uint32'>> => ({
      id,
      revision,
      data: source
    }),
    destroy: () => {
      execution.destroy();
      source.buffer.destroy();
      device.destroy();
    }
  };
}

test('incremental execution preserves partial storage across append, replacement, reorder and removal', () => {
  const fixture = createFixture();
  const {device, execution, batch, partials, merged, source} = fixture;
  const submit = vi.spyOn(device, 'submit');
  try {
    const first = execution.update([batch('a')]);
    expect(first).toMatchObject({
      computedBatchIds: ['a'],
      reusedBatchIds: [],
      batchNodeCount: 1,
      mergeNodeCount: 1,
      cachedByteLength: 4,
      invalidation: 'initial'
    });
    expect(execution.update([batch('a')])).toMatchObject({
      submitted: false,
      batchNodeCount: 0,
      mergeNodeCount: 0,
      invalidation: 'none'
    });
    expect(submit).toHaveBeenCalledTimes(1);
    expect(execution.update([batch('a'), batch('b')])).toMatchObject({
      computedBatchIds: ['b'],
      reusedBatchIds: ['a'],
      cachedByteLength: 8
    });
    expect(merged.at(-1)![0]).toBe(partials[0]);
    expect(execution.update([batch('b'), batch('a')])).toMatchObject({
      computedBatchIds: [],
      reusedBatchIds: ['b', 'a'],
      batchNodeCount: 0,
      mergeNodeCount: 1
    });
    expect(merged.at(-1)).toEqual([partials[1], partials[0]]);
    expect(execution.update([batch('b', 1), batch('a')])).toMatchObject({
      computedBatchIds: ['b'],
      reusedBatchIds: ['a']
    });
    expect(partials[1].buffer.destroyed).toBe(true);
    expect(partials[0].buffer.destroyed).toBe(false);
    expect(execution.update([batch('b', 1)])).toMatchObject({
      computedBatchIds: [],
      removedBatchIds: ['a'],
      batchNodeCount: 0
    });
    expect(partials[0].buffer.destroyed).toBe(true);
    expect(execution.update([batch('b', 1)], 1)).toMatchObject({
      computedBatchIds: ['b'],
      invalidation: 'revision'
    });
    expect(partials[2].buffer.destroyed).toBe(true);
    expect(execution.update([])).toMatchObject({removedBatchIds: ['b'], cachedByteLength: 0});
    expect(partials.every(partial => partial.buffer.destroyed)).toBe(true);
    expect(source.buffer.destroyed).toBe(false);
    execution.destroy();
    execution.destroy();
    expect(() => execution.update([])).toThrow();
  } finally {
    fixture.destroy();
  }
});

test.each([
  'create',
  'compile',
  'encode',
  'merge',
  'submit'
] as const)('incremental %s failure discards new partials and leaves the previous snapshot retryable', failure => {
  const fixture = createFixture();
  const {execution, batch, partials, device} = fixture;
  try {
    execution.update([batch('a')]);
    if (failure === 'submit')
      vi.spyOn(device, 'submit').mockImplementationOnce(() => {
        throw new Error('submit failed');
      });
    else fixture.setFailure(failure);
    expect(() => execution.update([batch('a', 1), batch('b')])).toThrow(`${failure} failed`);
    expect(partials[0].buffer.destroyed).toBe(false);
    expect(partials.slice(1).every(partial => partial.buffer.destroyed)).toBe(true);
    fixture.setFailure(undefined);
    expect(execution.update([batch('a')])).toMatchObject({submitted: false, reusedBatchIds: ['a']});
    expect(execution.update([batch('a', 1), batch('b')])).toMatchObject({
      computedBatchIds: ['a', 'b']
    });
    expect(partials[0].buffer.destroyed).toBe(true);
  } finally {
    fixture.destroy();
  }
});

test('incremental snapshots reject ambiguous changes before allocating and snapshot mutable revision fields', () => {
  const fixture = createFixture();
  const {execution, batch, partials, source} = fixture;
  try {
    expect(() => execution.update([batch('a'), batch('a')])).toThrow(/Duplicate/);
    expect(() => execution.update([batch('a', -1)])).toThrow(/revision/);
    expect(() => execution.update([], Number.NaN)).toThrow(/revision/);
    expect(partials).toHaveLength(0);
    const mutable = {id: 'a', revision: 0, data: source};
    execution.update([mutable]);
    mutable.revision++;
    expect(execution.update([mutable]).computedBatchIds).toEqual(['a']);
    const replacement = new GPUData({buffer: source.buffer, format: 'uint32', length: 1});
    expect(execution.update([{...mutable, data: replacement}]).computedBatchIds).toEqual(['a']);
  } finally {
    fixture.destroy();
  }
});

test('initial empty input publishes its identity once', () => {
  const fixture = createFixture();
  try {
    expect(fixture.execution.update([])).toMatchObject({
      submitted: true,
      computedBatchIds: [],
      mergeNodeCount: 1
    });
    expect(fixture.execution.update([])).toMatchObject({submitted: false, mergeNodeCount: 0});
  } finally {
    fixture.destroy();
  }
});
