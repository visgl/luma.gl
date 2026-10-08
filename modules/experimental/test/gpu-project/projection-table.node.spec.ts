// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it, vi} from 'vitest';
import {NullDevice} from '@luma.gl/test-utils';
import {Buffer} from '@luma.gl/core';
import {GPUData} from '@luma.gl/gpgpu/gpu-data';
import {GPUCommandGraph} from '@luma.gl/gpgpu/gpu-core';
import {GPURecordBatch, GPUTable} from '@luma.gl/experimental/gpu-tables';
import {GPUProjectionTable, findProjectionPatch} from '@luma.gl/experimental/gpu-project';
import {
  ProjectionTableError,
  ProjectionTableTransform,
  prepareCRSProjection
} from '@luma.gl/experimental/gpu-project/crs';
import {
  makeSourceBatches,
  makeTableTransform,
  uploadSourceTable
} from './projection-table-fixtures';

it('uses a constant-time CPU domain check matching a multi-patch plan at boundaries', () => {
  const prepared = prepareCRSProjection({
    from: 'EPSG:4326',
    to: 'EPSG:3857',
    bounds: [-20, -20, 20, 20],
    degree: 1,
    tolerance: 5000
  });
  if (prepared.status !== 'ready') throw new Error(JSON.stringify(prepared.reasons));
  const operation = prepared.program.operations[0];
  if (operation.type !== 'adaptive') throw new Error('expected adaptive plan');
  const plan = operation.plan;
  expect(plan.patches.length).toBeGreaterThan(1);
  const points = [
    [-20, -20],
    [20, 20],
    [0, 0],
    [-20, 20],
    [20, -20],
    [20.0000001, 0],
    [0, -20.0000001],
    [Infinity, 0],
    [NaN, 0]
  ] as const;
  const expected = points.map(point => Number(findProjectionPatch(plan, point) >= 0));
  const search = vi.spyOn(plan.patches, 'findIndex');
  const transform = new ProjectionTableTransform(prepared);
  const result = transform.projectBatch({positions: new Float64Array(points.flat())});
  expect(Array.from(result.validity)).toEqual(expected);
  expect(search).not.toHaveBeenCalled();
});

it('preserves CPU batch boundaries, source offsets, validity and binary64 precision', () => {
  const transform = makeTableTransform();
  const source = makeSourceBatches();
  const original = source.map(batch => batch.positions.slice());
  const output = [...transform.projectBatches(source)];
  expect(output.map(batch => batch.numRows)).toEqual([5, 0, 2]);
  expect(output.map(batch => Array.from(batch.validity))).toEqual([[1, 1, 1, 0, 0], [], [1, 0]]);
  for (const [index, batch] of output.entries()) {
    expect(batch.encoding).toBe('float64-absolute');
    expect(batch.sourceInfo).toEqual(source[index].sourceInfo);
    expect(batch.sourceInfo).not.toBe(source[index].sourceInfo);
    expect(batch.metadata).toEqual(source[index].metadata);
    expect(source[index].positions).toEqual(original[index]);
    for (let row = 0; row < batch.numRows; row++) {
      const actual = Array.from(batch.positions.subarray(row * 2, row * 2 + 2));
      expect(actual).toEqual(
        batch.validity[row]
          ? transform.prepared.projection.projectSync(
              Array.from(source[index].positions.subarray(row * 2, row * 2 + 2))
            )
          : [0, 0]
      );
    }
  }
  expect(Math.fround(output[0].positions[0])).toBe(Math.fround(output[0].positions[2]));
  expect(output[0].positions[0]).not.toBe(output[0].positions[2]);
});

it('executes streams lazily and never publishes a failed batch prefix', () => {
  const transform = makeTableTransform();
  const source = makeSourceBatches();
  const yielded = vi.fn();
  function* batches() {
    for (const batch of source) {
      yielded();
      yield batch;
    }
  }
  const iterator = transform.projectBatches(batches());
  expect(yielded).not.toHaveBeenCalled();
  const first = iterator.next().value;
  expect(yielded).toHaveBeenCalledTimes(1);
  expect(iterator.next().value.numRows).toBe(0);
  const cause = new Error('provider failed');
  vi.spyOn(transform.prepared.projection, 'projectToSync').mockImplementation(() => {
    throw cause;
  });
  try {
    iterator.next();
    throw new Error('expected failure');
  } catch (error) {
    expect(error).toBeInstanceOf(ProjectionTableError);
    expect(error).toMatchObject({rowIndex: 0, sourceInfo: source[2].sourceInfo, cause});
  }
  expect(first.numRows).toBe(5);
  expect(iterator.next().done).toBe(true);
});

it('rejects incomplete provider output and batch shape mismatches', () => {
  const transform = makeTableTransform();
  expect(() => transform.projectBatch({positions: Float64Array.of(1)})).toThrow(/coordinate pairs/);
  expect(() =>
    transform.projectBatch({positions: new Float64Array(2), inputValidity: new Uint32Array(2)})
  ).toThrow(/matching validity/);
  vi.spyOn(transform.prepared.projection, 'projectToSync').mockImplementation(
    (_coordinate, output) => output
  );
  expect(() => transform.projectBatch(makeSourceBatches()[0])).toThrow(ProjectionTableError);
});

it('allocates a derived GPU table without uploading, submitting, reading or owning source chunks', () => {
  const device = new NullDevice({});
  const transform = makeTableTransform();
  const source = uploadSourceTable(device, makeSourceBatches());
  const submit = vi.spyOn(device, 'submit');
  const buffers = source.batches.flatMap(batch =>
    Object.values(batch.gpuData).map(data => data.buffer)
  );
  const destroyed = buffers.map(buffer => vi.spyOn(buffer, 'destroy'));
  const result = transform.createGPUProjectionTable(device, {
    id: 'table',
    table: source,
    positions: 'coordinates',
    inputValidity: 'selected'
  });
  expect(submit).not.toHaveBeenCalled();
  expect(result.table.batches.map(batch => batch.numRows)).toEqual([5, 0, 2]);
  expect(result.table.gpuVectors.positions.data.map(data => data.length)).toEqual([5, 0, 2]);
  expect(result.table.batches.map(batch => batch.sourceInfo)).toEqual(
    source.batches.map(batch => batch.sourceInfo)
  );
  expect(result.table.gpuVectors.positions.format).toBe('float32x4');
  result.table.gpuVectors.positions.destroy(); // aggregate vectors borrow output chunks
  expect(result.table.batches[0].gpuData.positions.ownsBuffer).toBe(true);
  const outputs = result.table.batches.flatMap(batch =>
    Object.values(batch.gpuData).map(data => vi.spyOn(data.buffer, 'destroy'))
  );
  result.destroy();
  result.destroy();
  for (const spy of outputs) expect(spy).toHaveBeenCalledOnce();
  for (const spy of destroyed) expect(spy).not.toHaveBeenCalled();
  Object.defineProperty(device, 'type', {value: 'webgpu'});
  const graph = new GPUCommandGraph(device);
  expect(() => result.addToGraph(graph)).toThrow(/live/);
  source.destroy();
  device.destroy();
});

it.each([
  'wrong-format',
  'interleaved',
  'bitmap',
  'missing',
  'device',
  'no-storage',
  'indexed',
  'nulls'
])('rejects %s input before allocating output', mode => {
  const device = new NullDevice({});
  const other = new NullDevice({});
  const buffer = (mode === 'device' ? other : device).createBuffer({
    byteLength: 64,
    usage: mode === 'no-storage' ? Buffer.COPY_SRC : Buffer.STORAGE
  });
  const data = new GPUData({
    buffer,
    format: mode === 'wrong-format' ? 'float32x4' : 'uint32x4',
    length: 1,
    byteStride: mode === 'interleaved' ? 32 : 16,
    nullBitmap: mode === 'bitmap' ? Uint8Array.of(1) : undefined
  });
  const batch = new GPURecordBatch({
    gpuData: {coordinates: data, ...(mode === 'indexed' ? {indices: data} : {})},
    nullCount: mode === 'nulls' ? 1 : 0
  });
  const table = new GPUTable({batches: [batch]});
  const allocate = vi.spyOn(device, 'createBuffer');
  expect(
    () =>
      new GPUProjectionTable(device, {
        id: 'invalid',
        projection: makeTableTransform().prepared.compiled,
        table,
        positions: mode === 'missing' ? 'absent' : 'coordinates'
      })
  ).toThrow();
  expect(allocate).not.toHaveBeenCalled();
  buffer.destroy();
  device.destroy();
  other.destroy();
});

it('cleans up outputs when allocation fails partway through construction', () => {
  const device = new NullDevice({});
  const source = uploadSourceTable(device, makeSourceBatches());
  const createBuffer = device.createBuffer.bind(device);
  const allocated: Buffer[] = [];
  vi.spyOn(device, 'createBuffer').mockImplementation(props => {
    if (allocated.length === 3) throw new Error('allocation failed');
    const buffer = createBuffer(props);
    allocated.push(buffer);
    return buffer;
  });
  expect(() =>
    makeTableTransform().createGPUProjectionTable(device, {
      id: 'failure',
      table: source,
      positions: 'coordinates',
      inputValidity: 'selected'
    })
  ).toThrow(/allocation failed/);
  expect(allocated).toHaveLength(3);
  expect(allocated.every(buffer => buffer.destroyed)).toBe(true);
  source.destroy();
  device.destroy();
});

it('preserves a schema-only empty table and rejects cross-device graph registration', () => {
  const device = new NullDevice({});
  Object.defineProperty(device, 'type', {value: 'webgpu'});
  const source = new GPUTable({
    schema: {
      fields: [{name: 'coordinates', format: 'uint32x4', nullable: false, metadata: new Map()}],
      metadata: new Map([['source', 'empty']])
    }
  });
  const result = makeTableTransform('local-f32').createGPUProjectionTable(device, {
    id: 'empty',
    table: source,
    positions: 'coordinates'
  });
  expect(result.table.numRows).toBe(0);
  expect(result.table.batches).toHaveLength(0);
  expect(result.table.schema.fields.map(field => field.format)).toEqual(['float32x2', 'uint32']);
  expect(result.table.schema.metadata).toEqual(source.schema.metadata);
  const other = new NullDevice({});
  Object.defineProperty(other, 'type', {value: 'webgpu'});
  const wrongGraph = new GPUCommandGraph(other);
  expect(() => result.addToGraph(wrongGraph)).toThrow(/device/);
  const graph = new GPUCommandGraph(device);
  result.addToGraph(graph);
  expect(() => result.addToGraph(graph)).toThrow(/unregistered/);
  graph.compile().destroy();
  result.destroy();
  device.destroy();
  other.destroy();
});

it('does not expose a successful row prefix when the provider fails later in a batch', () => {
  const transform = makeTableTransform();
  const source = makeSourceBatches()[0];
  const original = source.positions.slice();
  const project = transform.prepared.projection.projectToSync.bind(transform.prepared.projection);
  const cause = new Error('second row failed');
  const spy = vi
    .spyOn(transform.prepared.projection, 'projectToSync')
    .mockImplementationOnce(project)
    .mockImplementation(() => {
      throw cause;
    });
  expect(() => transform.projectBatch(source)).toThrow(
    expect.objectContaining({rowIndex: 1, cause})
  );
  expect(spy).toHaveBeenCalledTimes(2);
  expect(source.positions).toEqual(original);
});
