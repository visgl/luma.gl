// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {
  GPUScene,
  GPU_SCENE_RECORD_BYTE_LENGTH,
  makeGPUSceneFromCPUScene,
  makeGPUScenePartitionsFromGPUTable,
  type GPUSceneRecord
} from '@luma.gl/experimental';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {GPUData, GPURecordBatch, GPUTable} from '@luma.gl/tables';

const FIELD_LAYOUT = {
  objectId: ['uint32', 0],
  flags: ['uint32', 4],
  groupId: ['uint32', 8],
  geometryId: ['uint32', 12],
  commandSlot: ['uint32', 16],
  boundsMinimum: ['float32x4', 32],
  boundsMaximum: ['float32x4', 48],
  transform0: ['float32x4', 64],
  transform1: ['float32x4', 80],
  transform2: ['float32x4', 96],
  transform3: ['float32x4', 112]
} as const;

type CPUNode = {
  record?: GPUSceneRecord;
  children?: CPUNode[];
};

test('GPU scene adapters preserve CPU identity and table batch topology without packing', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const firstRecord: GPUSceneRecord = {
    id: 10,
    bounds: {minimum: [-1, -2, -3], maximum: [1, 2, 3]},
    groupId: 2,
    geometryId: 3,
    commandSlot: 4
  };
  const secondRecord: GPUSceneRecord = {
    id: 20,
    bounds: {minimum: [4, 5, 6], maximum: [7, 8, 9]},
    transform: [1, 0, 0, 0, 0, 2, 0, 0, 0, 0, 3, 0, 4, 5, 6, 1]
  };
  const sharedLeaf: CPUNode = {record: secondRecord};
  const root: CPUNode = {
    children: [{record: firstRecord, children: [sharedLeaf]}, sharedLeaf]
  };
  const cpuScene = makeGPUSceneFromCPUScene(device, {
    id: 'cpu-adapted-scene',
    roots: [root],
    getChildren: node => node.children,
    getRecord: node => node.record ?? null,
    capacity: 3
  });
  t.deepEqual(await readSceneIds(cpuScene), [10, 20], 'stable preorder visits shared nodes once');
  t.equal(cpuScene.getRecordIndex(20), 1, 'CPU-adapted scenes retain mutable identity metadata');

  const firstSource = new GPUScene(device, {records: [firstRecord]});
  const secondSource = new GPUScene(device, {records: [secondRecord]});
  const table = new GPUTable({
    batches: [
      makeSceneBatch(firstSource, 1),
      makeSceneBatch(firstSource, 0),
      makeSceneBatch(secondSource, 1)
    ]
  });
  const adapted = makeGPUScenePartitionsFromGPUTable(device, table, {id: 'table-scene'});

  t.deepEqual(
    adapted.partitions.map(partition => ({
      batchIndex: partition.batchIndex,
      firstRecord: partition.firstRecord,
      recordCount: partition.recordCount,
      hasScene: Boolean(partition.scene)
    })),
    [
      {batchIndex: 0, firstRecord: 0, recordCount: 1, hasScene: true},
      {batchIndex: 1, firstRecord: 1, recordCount: 0, hasScene: false},
      {batchIndex: 2, firstRecord: 1, recordCount: 1, hasScene: true}
    ],
    'empty and uneven table batches retain their partition indices and global bases'
  );
  t.deepEqual(adapted.stats, {
    batchCount: 3,
    sceneCount: 2,
    recordCount: 2,
    borrowedRecordByteLength: 256,
    ownedStateByteLength: 32
  });
  t.equal(
    adapted.partitions[0]!.scene!.recordBuffer,
    firstSource.recordBuffer,
    'the first table record allocation is borrowed directly'
  );
  t.notOk(adapted.partitions[0]!.scene!.mutable, 'opaque table storage is not CPU-mutable');
  t.deepEqual(
    await readSceneRecordBytes(adapted.partitions[0]!.scene!),
    (await readSceneRecordBytes(cpuScene)).slice(0, GPU_SCENE_RECORD_BYTE_LENGTH),
    'CPU and table adapters expose the same canonical record bytes'
  );
  t.deepEqual(
    await readSceneIds(adapted.partitions[2]!.scene!),
    [20],
    'later table partitions preserve their source records'
  );

  const firstStateBuffer = adapted.partitions[0]!.scene!.stateBuffer;
  adapted.destroy();
  adapted.destroy();
  t.ok(firstStateBuffer.destroyed, 'the adapter-owned state allocation is released');
  t.notOk(firstSource.recordBuffer.destroyed, 'table record storage remains borrowed');

  table.destroy();
  cpuScene.destroy();
  firstSource.destroy();
  secondSource.destroy();
  t.end();
});

test('GPU scene adapters reject ambiguous CPU and table storage contracts', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  t.throws(
    () =>
      makeGPUSceneFromCPUScene(device, {
        roots: [],
        getRecord: () => null
      }),
    /requires capacity/,
    'an empty CPU source needs an explicit allocation policy'
  );

  const source = new GPUScene(device, {
    records: [{id: 1, bounds: {minimum: [0, 0, 0], maximum: [1, 1, 1]}}]
  });
  const invalidBatch = makeSceneBatch(source, 1, {objectId: 4});
  const invalidTable = new GPUTable({batches: [invalidBatch]});
  t.throws(
    () => makeGPUScenePartitionsFromGPUTable(device, invalidTable),
    /canonical scene record layout/,
    'columnar or shifted layouts are not silently packed'
  );
  t.throws(
    () =>
      makeGPUScenePartitionsFromGPUTable(device, invalidTable, {
        columns: {objectId: 'flags'}
      }),
    /column names must be unique/,
    'one physical column cannot fill multiple scene roles'
  );

  invalidTable.destroy();
  source.destroy();
  t.end();
});

function makeSceneBatch(
  scene: GPUScene,
  length: number,
  offsetOverrides: Partial<Record<keyof typeof FIELD_LAYOUT, number>> = {}
): GPURecordBatch {
  const gpuData: Record<string, GPUData> = {};
  for (const [name, [format, byteOffset]] of Object.entries(FIELD_LAYOUT)) {
    gpuData[name] = new GPUData({
      buffer: scene.recordBuffer,
      format,
      length,
      byteOffset: offsetOverrides[name as keyof typeof FIELD_LAYOUT] ?? byteOffset,
      byteStride: GPU_SCENE_RECORD_BYTE_LENGTH,
      ownsBuffer: false
    });
  }
  return new GPURecordBatch({gpuData});
}

async function readSceneIds(scene: GPUScene): Promise<number[]> {
  const bytes = await readSceneRecordBytes(scene);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return Array.from({length: scene.recordCount}, (_, index) =>
    view.getUint32(index * GPU_SCENE_RECORD_BYTE_LENGTH, true)
  );
}

async function readSceneRecordBytes(scene: GPUScene): Promise<Uint8Array> {
  const bytes = await scene.recordBuffer.readAsync();
  return bytes.slice(0, scene.recordCount * GPU_SCENE_RECORD_BYTE_LENGTH);
}
