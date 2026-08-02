// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {Buffer} from '@luma.gl/core';
import {
  GPUCommandGraph,
  GPUScene,
  GPU_SCENE_ACTIVE_FLAG,
  GPU_SCENE_INVALID_REFERENCE,
  GPU_SCENE_RECORD_BYTE_LENGTH
} from '@luma.gl/experimental';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';

const REQUIRED_USAGE = Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC;

test('GPUScene stores fixed-layout records and publishes graph views', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
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

  t.equal(records.getUint32(0, true), 10, 'stable object ID is stored');
  t.equal(records.getUint32(4, true), GPU_SCENE_ACTIVE_FLAG, 'initial records are active');
  t.equal(records.getUint32(8, true), GPU_SCENE_INVALID_REFERENCE, 'references default to invalid');
  t.deepEqual(
    [records.getFloat32(32, true), records.getFloat32(36, true), records.getFloat32(40, true)],
    [-1, -2, -3],
    'bounds occupy fixed field offsets'
  );
  t.equal(records.getFloat32(64, true), 1, 'the default transform is identity');
  t.equal(records.getFloat32(84, true), 1, 'the second identity diagonal is present');
  t.deepEqual(
    [
      records.getUint32(second + 8, true),
      records.getUint32(second + 12, true),
      records.getUint32(second + 16, true)
    ],
    [2, 3, 4],
    'group, geometry, and command references are explicit'
  );
  t.equal(records.getFloat32(second + 112, true), 13, 'custom transforms are column-major');
  const stateBytes = await scene.stateBuffer.readAsync();
  t.deepEqual(
    Array.from(
      new Uint32Array(stateBytes.buffer, stateBytes.byteOffset, stateBytes.byteLength / 4)
    ),
    [2, 2, 0, 0]
  );
  t.deepEqual(scene.stats, {
    capacity: 3,
    recordCount: 2,
    activeCount: 2,
    recordByteLength: 128,
    recordBufferByteLength: 384,
    stateBufferByteLength: 16,
    outputByteLength: 400
  });
  t.equal(scene.getRecordByteOffset(2), 256);
  t.throws(() => scene.getRecordByteOffset(3), /out of range/);

  const graph = new GPUCommandGraph(device, {id: 'scene-graph'});
  const view = scene.importToGraph(graph);
  t.equal(view.objectIds.format, 'uint32');
  t.equal(view.objectIds.byteStride, 128);
  t.equal(view.boundsMinimum.byteOffset, 32);
  t.deepEqual(
    view.transformColumns.map(column => column.byteOffset),
    [64, 80, 96, 112],
    'all transform columns are addressable without repacking'
  );
  graph.compile().destroy();
  t.notOk(scene.recordBuffer.destroyed, 'compiled graphs only borrow scene storage');
  scene.destroy();
  t.ok(scene.recordBuffer.destroyed, 'owned buffers are destroyed with the scene');
  scene.destroy();
  t.end();
});

test('GPUScene validates identity, layout, and borrowed ownership', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
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
  t.notOk(recordBuffer.destroyed, 'borrowed record storage remains caller-owned');
  t.notOk(stateBuffer.destroyed, 'borrowed state storage remains caller-owned');

  const bounds = {minimum: [0, 0, 0], maximum: [1, 1, 1]} as const;
  t.throws(
    () =>
      new GPUScene(device, {
        records: [
          {id: 1, bounds},
          {id: 1, bounds}
        ]
      }),
    /duplicated/,
    'stable IDs are unique'
  );
  t.throws(
    () =>
      new GPUScene(device, {
        records: [{id: 1, bounds: {minimum: [2, 0, 0], maximum: [1, 1, 1]}}]
      }),
    /ordered minima/,
    'bounds are ordered'
  );
  t.throws(
    () => new GPUScene(device, {records: [{id: 1, bounds, transform: [1, 2]}]}),
    /16 finite values/,
    'transforms have a fixed layout'
  );
  t.throws(
    () =>
      new GPUScene(device, {
        capacity: 3,
        recordCount: 0,
        buffers: {records: recordBuffer, state: stateBuffer}
      }),
    /smaller than/,
    'borrowed buffers cover the declared capacity'
  );

  recordBuffer.destroy();
  stateBuffer.destroy();
  t.end();
});

test('GPUScene mutates holes, reports overflow, and compacts in stable slot order', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
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
  t.deepEqual(mutation, {
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
  t.deepEqual(await readSceneIds(scene, 4), [10, 40, 30, 50], 'the lowest hole is reused first');
  t.deepEqual(await readSceneState(scene), [4, 4, 1, 0], 'overflow is published to graph state');
  t.equal(scene.getRecordIndex(40), 1);

  const compacted = scene.mutate({remove: [10, 40], compact: true});
  t.deepEqual(compacted.moves, [
    {id: 30, from: 2, to: 0},
    {id: 50, from: 3, to: 1}
  ]);
  t.equal(compacted.uploadedByteLength, 528, 'compaction reports its bounded prefix upload');
  t.equal(compacted.writeCount, 2, 'one record-prefix write and one state write are issued');
  t.deepEqual(await readSceneIds(scene, 4), [30, 50, 0, 0]);
  t.deepEqual(await readSceneState(scene), [2, 2, 0, 0]);
  t.equal(scene.getRecordIndex(30), 0);
  t.equal(scene.getRecordIndex(50), 1);
  t.deepEqual(scene.stats, {
    capacity: 4,
    recordCount: 2,
    activeCount: 2,
    recordByteLength: 128,
    recordBufferByteLength: 512,
    stateBufferByteLength: 16,
    outputByteLength: 528
  });

  scene.destroy();
  t.end();
});

test('GPUScene validates complete transactions before changing CPU metadata', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
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
  t.throws(
    () =>
      scene.mutate({
        remove: [1],
        update: [{id: 2, bounds: {minimum: [2, 0, 0], maximum: [1, 1, 1]}}]
      }),
    /ordered minima/
  );
  t.equal(scene.activeCount, 2, 'a rejected transaction removes nothing');
  t.equal(scene.getRecordIndex(1), 0, 'stable ID metadata remains unchanged');

  const recordBuffer = device.createBuffer({byteLength: 128, usage: REQUIRED_USAGE});
  const stateBuffer = device.createBuffer({byteLength: 16, usage: REQUIRED_USAGE});
  const opaqueScene = new GPUScene(device, {
    capacity: 1,
    recordCount: 1,
    buffers: {records: recordBuffer, state: stateBuffer}
  });
  t.notOk(opaqueScene.mutable, 'opaque borrowed storage does not claim CPU-known IDs');
  t.throws(() => opaqueScene.compact(), /CPU-known initial records/);

  scene.destroy();
  opaqueScene.destroy();
  recordBuffer.destroy();
  stateBuffer.destroy();
  t.end();
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
