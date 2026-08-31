// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {Buffer, type Device} from '@luma.gl/core';
import {
  DrawCommandBuffer,
  GPUCommandGraph,
  GPUScene,
  GPUSceneDrawGeneration,
  GPUSceneResourceGroups,
  GPUVisibilityWorkflow,
  GPU_SCENE_RECORD_BYTE_LENGTH,
  type GraphDataView,
  type GPUSceneRecord
} from '@luma.gl/gpgpu/gpu-core';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {GPUData} from '@luma.gl/gpgpu/gpu-data';
import {
  GPURecordBatch,
  GPUTable,
  makeGPUSceneFromCPUScene,
  makeGPUScenePartitionsFromGPUTable
} from '@luma.gl/experimental/gpu-tables';

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

it('GPU scene adapters preserve CPU identity and table batch topology without packing', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
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
  expect(await readSceneIds(cpuScene), 'stable preorder visits shared nodes once').toEqual([
    10, 20
  ]);
  expect(cpuScene.getRecordIndex(20), 'CPU-adapted scenes retain mutable identity metadata').toBe(
    1
  );

  const firstSource = new GPUScene(device, {records: [firstRecord]});
  const secondSource = new GPUScene(device, {records: [secondRecord]});
  const table = new GPUTable({
    batches: [
      makeSceneBatch(firstSource, 1),
      makeSceneBatch(firstSource, 0),
      makeSceneBatch(secondSource, 1)
    ]
  });
  const adapted = makeGPUScenePartitionsFromGPUTable(device, table, {
    id: 'table-scene',
    activeCounts: [1, 0, 1]
  });

  expect(
    adapted.partitions.map(partition => ({
      batchIndex: partition.batchIndex,
      firstRecord: partition.firstRecord,
      recordCount: partition.recordCount,
      hasScene: Boolean(partition.scene)
    })),
    'empty and uneven table batches retain their partition indices and global bases'
  ).toEqual([
    {batchIndex: 0, firstRecord: 0, recordCount: 1, hasScene: true},
    {batchIndex: 1, firstRecord: 1, recordCount: 0, hasScene: false},
    {batchIndex: 2, firstRecord: 1, recordCount: 1, hasScene: true}
  ]);
  expect(adapted.stats, '').toEqual({
    batchCount: 3,
    sceneCount: 2,
    recordCount: 2,
    borrowedRecordByteLength: 256,
    ownedStateByteLength: 32
  });
  expect(
    adapted.partitions[0]!.scene!.recordBuffer,
    'the first table record allocation is borrowed directly'
  ).toBe(firstSource.recordBuffer);
  expect(
    Boolean(adapted.partitions[0]!.scene!.mutable),
    'opaque table storage is not CPU-mutable'
  ).toBe(false);
  expect(
    await readSceneRecordBytes(adapted.partitions[0]!.scene!),
    'CPU and table adapters expose the same canonical record bytes'
  ).toEqual((await readSceneRecordBytes(cpuScene)).slice(0, GPU_SCENE_RECORD_BYTE_LENGTH));
  expect(
    await readSceneIds(adapted.partitions[2]!.scene!),
    'later table partitions preserve their source records'
  ).toEqual([20]);
  expect(adapted.partitions[0]!.scene!.activeCount, 'producer-known active counts are exact').toBe(
    1
  );

  const firstStateBuffer = adapted.partitions[0]!.scene!.stateBuffer;
  adapted.destroy();
  adapted.destroy();
  expect(
    Boolean(firstStateBuffer.destroyed),
    'the adapter-owned state allocation is released'
  ).toBe(true);
  expect(Boolean(firstSource.recordBuffer.destroyed), 'table record storage remains borrowed').toBe(
    false
  );

  table.destroy();
  cpuScene.destroy();
  firstSource.destroy();
  secondSource.destroy();
  void 0;
});

it('CPU scene hierarchies reuse generic visibility, indirect draws, and renderer groups after mutation', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }

  const bounds = {minimum: [0, 0, 0], maximum: [1, 1, 1]} as const;
  const roots: CPUNode[] = [
    {
      children: [
        {record: {id: 10, bounds, groupId: 0, geometryId: 7, commandSlot: 0}},
        {record: {id: 20, bounds, groupId: 0, geometryId: 7, commandSlot: 1}}
      ]
    },
    {
      children: [
        {record: {id: 30, bounds, groupId: 1, geometryId: 7, commandSlot: 2}},
        {record: {id: 40, bounds, groupId: 1, geometryId: 7, commandSlot: 3}}
      ]
    }
  ];
  const scene = makeGPUSceneFromCPUScene(device, {
    id: 'cpu-consumer-scene',
    roots,
    getChildren: node => node.children,
    getRecord: node => node.record ?? null
  });
  const commands = new DrawCommandBuffer(device, {
    type: 'draw',
    commands: Array.from({length: 4}, () => ({vertexCount: 6, instanceCount: 0}))
  });
  const graph = new GPUCommandGraph(device, {id: 'cpu-consumer-command-graph'});
  const source = scene.importToGraph(graph);
  const commandViews = commands.importToGraph(graph);
  const outputs: Buffer[] = [];
  const makeOutput = (id: string, values: readonly number[]) =>
    makeConsumerUint32(device, graph, outputs, id, values);
  const visibility = makeOutput('visibility', [1, 0, 1, 1]);
  const visibleRows = makeOutput('visible-rows', [0, 0, 0, 0]);
  const visibleCount = makeOutput('visible-count', [0]);
  const required = makeOutput('required', [0]);
  const published = makeOutput('published', [0]);
  const drawOverflow = makeOutput('draw-overflow', [0]);
  const groupCounts = makeOutput('group-counts', [0, 0]);
  const groupOverflows = makeOutput('group-overflows', [0, 0]);
  const groupOverflow = makeOutput('group-overflow', [0]);

  new GPUVisibilityWorkflow({
    predicates: [{kind: 'bounds', mask: visibility.view}],
    output: visibleRows.view,
    count: visibleCount.view
  }).addToGraph(graph);
  new GPUSceneDrawGeneration({
    scene: source,
    visibility: visibility.view,
    commands: commandViews,
    requiredCount: required.view,
    publishedCount: published.view,
    overflow: drawOverflow.view
  }).addToGraph(graph);
  new GPUSceneResourceGroups({
    scene: source,
    commands: commandViews,
    groups: [
      {id: 0, firstCommand: 0, commandCount: 2, geometryId: 7},
      {id: 1, firstCommand: 2, commandCount: 2, geometryId: 7}
    ],
    counts: groupCounts.view,
    overflows: groupOverflows.view,
    overflow: groupOverflow.view
  }).addToGraph(graph);
  const compiled = graph.compile();
  let encoder = device.createCommandEncoder();
  compiled.encode(encoder, {parameters: undefined});
  device.submit(encoder.finish());

  expect(await readConsumerUint32(visibleRows.buffer, 3), '').toEqual([0, 2, 3]);
  expect(await readConsumerUint32(groupCounts.buffer, 2), '').toEqual([1, 2]);
  expect(await readConsumerUint32(published.buffer, 1), '').toEqual([3]);
  expect(scene.getRecordIndex(40), 'stable application identity differs from scene row').toBe(3);

  const mutation = scene.mutate({remove: [30]});
  visibility.buffer.write(Uint32Array.from([1, 1, 0, 1]));
  encoder = device.createCommandEncoder();
  compiled.encode(encoder, {parameters: undefined});
  device.submit(encoder.finish());

  expect(mutation.uploadedByteLength, 'CPU hierarchy updates publish explicit bounded cost').toBe(
    20
  );
  expect(await readConsumerUint32(visibleRows.buffer, 3), '').toEqual([0, 1, 3]);
  expect(await readConsumerUint32(groupCounts.buffer, 2), '').toEqual([2, 1]);
  expect(await readConsumerUint32(groupOverflows.buffer, 2), '').toEqual([0, 0]);
  expect(await readConsumerUint32(groupOverflow.buffer, 1), '').toEqual([0]);
  const commandWords = await readConsumerUint32(commands.buffer, 16);
  expect(
    [commandWords[1], commandWords[5], commandWords[9], commandWords[13]],
    'one compiled graph updates stable renderer-owned command slots without CPU draw selection'
  ).toEqual([1, 1, 0, 1]);

  compiled.destroy();
  commands.destroy();
  scene.destroy();
  for (const buffer of outputs) buffer.destroy();
  void 0;
});

it('GPU scene adapters reject ambiguous CPU and table storage contracts', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }

  expect(
    () =>
      makeGPUSceneFromCPUScene(device, {
        roots: [],
        getRecord: () => null
      }),
    'an empty CPU source needs an explicit allocation policy'
  ).toThrow(/requires capacity/);

  const source = new GPUScene(device, {
    records: [{id: 1, bounds: {minimum: [0, 0, 0], maximum: [1, 1, 1]}}]
  });
  const invalidBatch = makeSceneBatch(source, 1, {objectId: 4});
  const invalidTable = new GPUTable({batches: [invalidBatch]});
  expect(
    () => makeGPUScenePartitionsFromGPUTable(device, invalidTable, {activeCounts: [1]}),
    'columnar or shifted layouts are not silently packed'
  ).toThrow(/canonical scene record layout/);
  expect(
    () =>
      makeGPUScenePartitionsFromGPUTable(device, invalidTable, {
        columns: {objectId: 'flags'},
        activeCounts: [1]
      }),
    'one physical column cannot fill multiple scene roles'
  ).toThrow(/column names must be unique/);

  const validTable = new GPUTable({batches: [makeSceneBatch(source, 1)]});
  expect(
    () => makeGPUScenePartitionsFromGPUTable(device, validTable, {activeCounts: []}),
    'opaque table records require producer-known active-count metadata'
  ).toThrow(/exact active count per batch/);
  expect(
    () => makeGPUScenePartitionsFromGPUTable(device, validTable, {activeCounts: [2]}),
    'active counts cannot exceed their physical batch size'
  ).toThrow(/exact active count per batch/);

  validTable.destroy();
  invalidTable.destroy();
  source.destroy();
  void 0;
});

it('GPU scene table adapters preserve exact active counts for batches with holes', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }

  const bounds = {minimum: [0, 0, 0], maximum: [1, 1, 1]} as const;
  const source = new GPUScene(device, {
    records: [
      {id: 1, bounds},
      {id: 2, bounds}
    ]
  });
  source.mutate({remove: [1]});
  const table = new GPUTable({batches: [makeSceneBatch(source, 2)]});
  const adapted = makeGPUScenePartitionsFromGPUTable(device, table, {activeCounts: [1]});
  const scene = adapted.partitions[0]!.scene!;

  expect(scene.recordCount, 'the physical prefix retains its inactive hole').toBe(2);
  expect(scene.activeCount, 'only the producer-known live row contributes to activeCount').toBe(1);
  const stateBytes = await scene.stateBuffer.readAsync();
  expect(
    Array.from(new Uint32Array(stateBytes.buffer, stateBytes.byteOffset, 4)),
    'GPU state distinguishes physical prefix length from exact live count'
  ).toEqual([2, 1, 0, 0]);

  adapted.destroy();
  table.destroy();
  source.destroy();
  void 0;
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

function makeConsumerUint32(
  device: Device,
  graph: GPUCommandGraph,
  outputs: Buffer[],
  id: string,
  values: readonly number[]
): {buffer: Buffer; view: GraphDataView<'uint32'>} {
  const buffer = device.createBuffer({
    id: `cpu-consumer-${id}`,
    data: Uint32Array.from(values),
    usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST
  });
  outputs.push(buffer);
  const handle = graph.importBuffer(
    {id, byteLength: buffer.byteLength, usage: buffer.usage},
    buffer
  );
  return {buffer, view: graph.createDataView(handle, {format: 'uint32', length: values.length})};
}

async function readConsumerUint32(buffer: Buffer, length: number): Promise<number[]> {
  const bytes = await buffer.readAsync();
  return Array.from(new Uint32Array(bytes.buffer, bytes.byteOffset, length));
}
