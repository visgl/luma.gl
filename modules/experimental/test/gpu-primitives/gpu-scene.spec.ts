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
