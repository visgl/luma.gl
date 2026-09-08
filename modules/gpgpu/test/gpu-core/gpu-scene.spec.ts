import {expect, it} from 'vitest';
// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer} from '@luma.gl/core';
import {
  GPUCommandGraph,
  GPUScene,
  GPU_SCENE_ACTIVE_FLAG,
  GPU_SCENE_INVALID_REFERENCE,
  GPU_SCENE_RECORD_BYTE_LENGTH
} from '@luma.gl/gpgpu/gpu-core';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';

const REQUIRED_USAGE = Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC;

it('GPUScene stores fixed-layout records and publishes graph views', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    return;
  }

  const transform = Float32Array.from({length: 16}, (_, index) => index + 1);
  const scene = new GPUScene(device, {
    id: 'scene-test',
    capacity: 3,
    records: [
      {id: 10, bounds: {minimum: [-1, -2, -3], maximum: [1, 2, 3]}},
      {
        id: 20,
        bounds: {minimum: [4, 5, 6], maximum: [7, 8, 9]},
        transform,
        groupId: 2,
        geometryId: 3,
        commandSlot: 4
      }
    ]
  });
  const recordBytes = await scene.recordBuffer.readAsync();
  const records = new DataView(recordBytes.buffer, recordBytes.byteOffset, recordBytes.byteLength);
  const second = GPU_SCENE_RECORD_BYTE_LENGTH;

  expect(records.getUint32(0, true), 'stable object ID is stored').toBe(10);
  expect(records.getUint32(4, true), 'initial records are active').toBe(GPU_SCENE_ACTIVE_FLAG);
  expect(records.getUint32(8, true), 'references default to invalid').toBe(
    GPU_SCENE_INVALID_REFERENCE
  );
  expect(
    [records.getFloat32(32, true), records.getFloat32(36, true), records.getFloat32(40, true)],
    'bounds occupy fixed field offsets'
  ).toEqual([-1, -2, -3]);
  expect(records.getFloat32(64, true), 'the default transform is identity').toBe(1);
  expect(records.getFloat32(84, true), 'the second identity diagonal is present').toBe(1);
  expect(
    [
      records.getUint32(second + 8, true),
      records.getUint32(second + 12, true),
      records.getUint32(second + 16, true)
    ],
    'group, geometry, and command references are explicit'
  ).toEqual([2, 3, 4]);
  expect(records.getFloat32(second + 112, true), 'custom transforms are column-major').toBe(13);
  const stateBytes = await scene.stateBuffer.readAsync();
  expect(
    Array.from(new Uint32Array(stateBytes.buffer, stateBytes.byteOffset, stateBytes.byteLength / 4))
  ).toEqual([2, 2, 0, 0]);
  expect(scene.stats).toEqual({
    capacity: 3,
    recordCount: 2,
    activeCount: 2,
    recordByteLength: 128,
    recordBufferByteLength: 384,
    stateBufferByteLength: 16,
    outputByteLength: 400
  });
  expect(scene.getRecordByteOffset(2)).toBe(256);
  expect(() => scene.getRecordByteOffset(3)).toThrow(/out of range/);

  const graph = new GPUCommandGraph(device, {id: 'scene-graph'});
  const view = scene.importToGraph(graph);
  expect(view.objectIds.format).toBe('uint32');
  expect(view.objectIds.byteStride).toBe(128);
  expect(view.boundsMinimum.byteOffset).toBe(32);
  expect(
    view.transformColumns.map(column => column.byteOffset),
    'all transform columns are addressable without repacking'
  ).toEqual([64, 80, 96, 112]);
  graph.compile().destroy();
  expect(Boolean(scene.recordBuffer.destroyed), 'compiled graphs only borrow scene storage').toBe(
    false
  );
  scene.destroy();
  expect(Boolean(scene.recordBuffer.destroyed), 'owned buffers are destroyed with the scene').toBe(
    true
  );
  scene.destroy();
});

it('GPUScene validates identity, layout, and borrowed ownership', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    return;
  }

  const recordBuffer = device.createBuffer({byteLength: 256, usage: REQUIRED_USAGE});
  const stateBuffer = device.createBuffer({byteLength: 16, usage: REQUIRED_USAGE});
  const scene = new GPUScene(device, {
    capacity: 2,
    recordCount: 0,
    buffers: {records: recordBuffer, state: stateBuffer}
  });
  scene.destroy();
  expect(Boolean(recordBuffer.destroyed), 'borrowed record storage remains caller-owned').toBe(
    false
  );
  expect(Boolean(stateBuffer.destroyed), 'borrowed state storage remains caller-owned').toBe(false);

  const bounds = {minimum: [0, 0, 0], maximum: [1, 1, 1]} as const;
  expect(
    () =>
      new GPUScene(device, {
        records: [
          {id: 1, bounds},
          {id: 1, bounds}
        ]
      }),
    'stable IDs are unique'
  ).toThrow(/duplicated/);
  expect(
    () =>
      new GPUScene(device, {
        records: [{id: 1, bounds: {minimum: [2, 0, 0], maximum: [1, 1, 1]}}]
      }),
    'bounds are ordered'
  ).toThrow(/ordered minima/);
  expect(
    () => new GPUScene(device, {records: [{id: 1, bounds, transform: [1, 2]}]}),
    'transforms have a fixed layout'
  ).toThrow(/16 finite values/);
  expect(
    () => new GPUScene(device, {capacity: 1, recordCount: 1}),
    'an active prefix cannot be declared over newly allocated empty storage'
  ).toThrow(/requires records or pre-populated buffers/);
  expect(
    () =>
      new GPUScene(device, {
        records: [{id: 1, bounds: {minimum: [0, 0, 0], maximum: [1e100, 1, 1]}}]
      }),
    'finite JavaScript bounds that overflow float32 are rejected'
  ).toThrow(/finite ordered minima/);
  expect(
    () =>
      new GPUScene(device, {
        records: [{id: 1, bounds, transform: Array.from({length: 16}, () => 1e100)}]
      }),
    'finite JavaScript transforms that overflow float32 are rejected'
  ).toThrow(/16 finite values/);
  expect(
    () =>
      new GPUScene(device, {
        capacity: 3,
        recordCount: 0,
        buffers: {records: recordBuffer, state: stateBuffer}
      }),
    'borrowed buffers cover the declared capacity'
  ).toThrow(/smaller than/);

  recordBuffer.destroy();
  stateBuffer.destroy();
});

it('GPUScene mutates holes, reports overflow, and compacts in stable slot order', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    return;
  }

  const bounds = {minimum: [0, 0, 0], maximum: [1, 1, 1]} as const;
  const scene = new GPUScene(device, {
    capacity: 4,
    records: [
      {id: 10, bounds},
      {id: 20, bounds},
      {id: 30, bounds}
    ]
  });
  const mutation = scene.mutate({
    remove: [20],
    update: [{id: 30, geometryId: 9}],
    insert: [
      {id: 40, bounds},
      {id: 50, bounds},
      {id: 60, bounds}
    ]
  });
  expect(mutation).toEqual({
    insertedIds: [40, 50],
    updatedIds: [30],
    removedIds: [20],
    moves: [],
    overflowCount: 1,
    writeCount: 5,
    uploadedByteLength: 404,
    recordCount: 4,
    activeCount: 4
  });
  expect(await readSceneIds(scene, 4), 'the lowest hole is reused first').toEqual([10, 40, 30, 50]);
  expect(await readSceneState(scene), 'overflow is published to graph state').toEqual([4, 4, 1, 0]);
  expect(scene.getRecordIndex(40)).toBe(1);

  const compacted = scene.mutate({remove: [10, 40], compact: true});
  expect(compacted.moves).toEqual([
    {id: 30, from: 2, to: 0},
    {id: 50, from: 3, to: 1}
  ]);
  expect(compacted.uploadedByteLength, 'compaction reports its bounded prefix upload').toBe(528);
  expect(compacted.writeCount, 'one record-prefix write and one state write are issued').toBe(2);
  expect(await readSceneIds(scene, 4)).toEqual([30, 50, 0, 0]);
  expect(await readSceneState(scene)).toEqual([2, 2, 0, 0]);
  expect(scene.getRecordIndex(30)).toBe(0);
  expect(scene.getRecordIndex(50)).toBe(1);
  expect(scene.stats).toEqual({
    capacity: 4,
    recordCount: 2,
    activeCount: 2,
    recordByteLength: 128,
    recordBufferByteLength: 512,
    stateBufferByteLength: 16,
    outputByteLength: 528
  });

  const denseUpdate = scene.mutate({update: [{id: 30, geometryId: 17}], compact: true});
  expect(denseUpdate.writeCount, 'dense compacting updates upload their changed records').toBe(2);
  expect(denseUpdate.uploadedByteLength).toBe(272);
  const updatedBytes = await scene.recordBuffer.readAsync();
  expect(
    new DataView(updatedBytes.buffer, updatedBytes.byteOffset).getUint32(12, true),
    'the GPU record reflects the dense compacting update'
  ).toBe(17);

  const denseInsertion = scene.mutate({insert: [{id: 60, bounds}], compact: true});
  expect(denseInsertion.writeCount, 'dense compacting insertions upload their new tail').toBe(2);
  expect(await readSceneIds(scene, 3)).toEqual([30, 50, 60]);

  scene.destroy();
});

it('GPUScene validates complete transactions before changing CPU metadata', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    return;
  }

  const bounds = {minimum: [0, 0, 0], maximum: [1, 1, 1]} as const;
  const scene = new GPUScene(device, {
    capacity: 2,
    records: [
      {id: 1, bounds},
      {id: 2, bounds}
    ]
  });
  expect(() =>
    scene.mutate({
      remove: [1],
      update: [{id: 2, bounds: {minimum: [2, 0, 0], maximum: [1, 1, 1]}}]
    })
  ).toThrow(/ordered minima/);
  expect(scene.activeCount, 'a rejected transaction removes nothing').toBe(2);
  expect(scene.getRecordIndex(1), 'stable ID metadata remains unchanged').toBe(0);

  const recordBuffer = device.createBuffer({byteLength: 128, usage: REQUIRED_USAGE});
  const stateBuffer = device.createBuffer({byteLength: 16, usage: REQUIRED_USAGE});
  const opaqueScene = new GPUScene(device, {
    capacity: 1,
    recordCount: 1,
    buffers: {records: recordBuffer, state: stateBuffer}
  });
  expect(Boolean(opaqueScene.mutable), 'opaque borrowed storage does not claim CPU-known IDs').toBe(
    false
  );
  expect(() => opaqueScene.compact()).toThrow(/CPU-known initial records/);

  scene.destroy();
  opaqueScene.destroy();
  recordBuffer.destroy();
  stateBuffer.destroy();
});

async function readSceneIds(scene: GPUScene, count: number): Promise<number[]> {
  const bytes = await scene.recordBuffer.readAsync();
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return Array.from({length: count}, (_, index) =>
    view.getUint32(index * GPU_SCENE_RECORD_BYTE_LENGTH, true)
  );
}

async function readSceneState(scene: GPUScene): Promise<number[]> {
  const bytes = await scene.stateBuffer.readAsync();
  return Array.from(new Uint32Array(bytes.buffer, bytes.byteOffset, 4));
}
