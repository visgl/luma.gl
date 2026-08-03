// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {DynamicBuffer} from '@luma.gl/engine';
import type {GPUData, GPUTable} from '@luma.gl/tables';
import {
  GPUScene,
  GPU_SCENE_RECORD_BYTE_LENGTH,
  GPU_SCENE_STATE_BYTE_LENGTH,
  type GPUSceneRecord
} from './gpu-scene';

const REQUIRED_BUFFER_USAGE = Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC;

/** Traversal facts supplied while adapting an application-owned CPU hierarchy. */
export type GPUSceneCPUAdapterContext<Node> = {
  parent: Node | undefined;
  depth: number;
  sourceIndex: number;
  recordIndex: number;
};

/** Properties for mapping an application-owned CPU hierarchy into flat scene records. */
export type GPUSceneCPUAdapterProps<Node> = {
  id?: string;
  roots: Iterable<Node>;
  /** Returns children in stable application order. Omit for an already-flat iterable. */
  getChildren?: (node: Node) => Iterable<Node> | undefined;
  /** Returns one flat record, or `null` to traverse a grouping node without emitting it. */
  getRecord: (node: Node, context: GPUSceneCPUAdapterContext<Node>) => GPUSceneRecord | null;
  /** Fixed scene capacity. Defaults to the number of emitted records. */
  capacity?: number;
};

/** Canonical table-column roles required by the zero-copy scene adapter. */
export type GPUSceneTableColumnNames = {
  objectId: string;
  flags: string;
  groupId: string;
  geometryId: string;
  commandSlot: string;
  boundsMinimum: string;
  boundsMaximum: string;
  transform0: string;
  transform1: string;
  transform2: string;
  transform3: string;
};

/** Properties for adapting preserved table batches into scene partitions. */
export type GPUSceneTableAdapterProps = {
  id?: string;
  /** Optional table-column renaming. Unspecified roles use their canonical names. */
  columns?: Partial<GPUSceneTableColumnNames>;
  /** Exact producer-known active counts, including one zero for every empty batch. */
  activeCounts: readonly number[];
};

/** One preserved table batch and its optional nonempty zero-copy scene. */
export type GPUSceneTablePartition = {
  batchIndex: number;
  firstRecord: number;
  recordCount: number;
  scene: GPUScene | null;
};

/** Allocation and topology facts for a table-to-scene adaptation. */
export type GPUSceneTableAdapterStats = {
  batchCount: number;
  sceneCount: number;
  recordCount: number;
  borrowedRecordByteLength: number;
  ownedStateByteLength: number;
};

/** Ordered zero-copy table partitions plus their shared cleanup operation. */
export type GPUSceneTableAdapterResult = {
  partitions: readonly GPUSceneTablePartition[];
  stats: Readonly<GPUSceneTableAdapterStats>;
  destroy: () => void;
};

type SceneTableField = {
  role: keyof GPUSceneTableColumnNames;
  format: 'uint32' | 'float32x4';
  byteOffset: number;
};

const DEFAULT_TABLE_COLUMNS: GPUSceneTableColumnNames = {
  objectId: 'objectId',
  flags: 'flags',
  groupId: 'groupId',
  geometryId: 'geometryId',
  commandSlot: 'commandSlot',
  boundsMinimum: 'boundsMinimum',
  boundsMaximum: 'boundsMaximum',
  transform0: 'transform0',
  transform1: 'transform1',
  transform2: 'transform2',
  transform3: 'transform3'
};

const TABLE_FIELDS: readonly SceneTableField[] = [
  {role: 'objectId', format: 'uint32', byteOffset: 0},
  {role: 'flags', format: 'uint32', byteOffset: 4},
  {role: 'groupId', format: 'uint32', byteOffset: 8},
  {role: 'geometryId', format: 'uint32', byteOffset: 12},
  {role: 'commandSlot', format: 'uint32', byteOffset: 16},
  {role: 'boundsMinimum', format: 'float32x4', byteOffset: 32},
  {role: 'boundsMaximum', format: 'float32x4', byteOffset: 48},
  {role: 'transform0', format: 'float32x4', byteOffset: 64},
  {role: 'transform1', format: 'float32x4', byteOffset: 80},
  {role: 'transform2', format: 'float32x4', byteOffset: 96},
  {role: 'transform3', format: 'float32x4', byteOffset: 112}
];

/**
 * Flattens an application-owned CPU hierarchy into ordinary mutable {@link GPUScene} records.
 *
 * Traversal is stable preorder. Repeated node identities are visited once, which bounds cyclic or
 * shared hierarchies without assigning hierarchy semantics to the resulting flat scene.
 */
export function makeGPUSceneFromCPUScene<Node>(
  device: Device,
  props: GPUSceneCPUAdapterProps<Node>
): GPUScene {
  const records: GPUSceneRecord[] = [];
  const visited = new Set<Node>();
  const stack = Array.from(props.roots)
    .reverse()
    .map(node => ({node, parent: undefined as Node | undefined, depth: 0}));
  let sourceIndex = 0;

  while (stack.length > 0) {
    const entry = stack.pop()!;
    if (visited.has(entry.node)) continue;
    visited.add(entry.node);

    const record = props.getRecord(entry.node, {
      parent: entry.parent,
      depth: entry.depth,
      sourceIndex,
      recordIndex: records.length
    });
    sourceIndex++;
    if (record) records.push(record);

    const children = props.getChildren?.(entry.node);
    if (children) {
      const orderedChildren = Array.from(children);
      for (let childIndex = orderedChildren.length - 1; childIndex >= 0; childIndex--) {
        stack.push({
          node: orderedChildren[childIndex]!,
          parent: entry.node,
          depth: entry.depth + 1
        });
      }
    }
  }

  if (records.length === 0 && props.capacity === undefined) {
    throw new Error('CPU scene adapter requires capacity when no records are emitted');
  }
  return new GPUScene(device, {
    id: props.id,
    capacity: props.capacity ?? records.length,
    records
  });
}

/**
 * Borrows exact scene-record storage from every nonempty preserved GPU table batch.
 *
 * The adapter allocates only one 16-byte state block per nonempty partition. It never reads,
 * concatenates, or repacks table rows. Empty batches remain represented by partitions with a null
 * scene so that batch indices and cumulative record bases stay stable.
 */
export function makeGPUScenePartitionsFromGPUTable(
  device: Device,
  table: GPUTable,
  props: GPUSceneTableAdapterProps
): GPUSceneTableAdapterResult {
  if (device.type !== 'webgpu') {
    throw new Error('GPU scene table adapter requires a WebGPU device');
  }
  const columns = {...DEFAULT_TABLE_COLUMNS, ...props.columns};
  if (new Set(Object.values(columns)).size !== TABLE_FIELDS.length) {
    throw new Error('GPU scene table adapter column names must be unique');
  }

  const recordBuffers = table.batches.map((batch, batchIndex) => {
    if (batch.numRows === 0) return null;
    const recordBuffer = validateTableBatch(batch.gpuData, batch.numRows, columns, batchIndex);
    if (recordBuffer.device !== device) {
      throw new Error(`GPU scene table batch ${batchIndex} belongs to a different device`);
    }
    return recordBuffer;
  });
  if (
    !props.activeCounts ||
    props.activeCounts.length !== table.batches.length ||
    props.activeCounts.some(
      (activeCount, batchIndex) =>
        !Number.isSafeInteger(activeCount) ||
        activeCount < 0 ||
        activeCount > table.batches[batchIndex]!.numRows
    )
  ) {
    throw new Error('GPU scene table adapter requires one exact active count per batch');
  }

  const partitions: GPUSceneTablePartition[] = [];
  let firstRecord = 0;
  let borrowedRecordByteLength = 0;
  let sceneCount = 0;

  try {
    for (let batchIndex = 0; batchIndex < table.batches.length; batchIndex++) {
      const batch = table.batches[batchIndex]!;
      const recordCount = batch.numRows;
      const activeCount = props.activeCounts[batchIndex]!;
      const recordBuffer = recordBuffers[batchIndex];
      if (!recordBuffer) {
        partitions.push(Object.freeze({batchIndex, firstRecord, recordCount, scene: null}));
        continue;
      }

      const stateBuffer = device.createBuffer({
        id: `${props.id ?? 'gpu-scene-table'}-batch-${batchIndex}-state`,
        data: new Uint32Array([recordCount, activeCount, 0, 0]),
        usage: REQUIRED_BUFFER_USAGE
      });
      let scene: GPUScene;
      try {
        scene = new GPUScene(device, {
          id: `${props.id ?? 'gpu-scene-table'}-batch-${batchIndex}`,
          capacity: recordCount,
          recordCount,
          activeCount,
          buffers: {records: recordBuffer, state: stateBuffer},
          ownsBuffers: {records: false, state: true}
        });
      } catch (error) {
        stateBuffer.destroy();
        throw error;
      }
      partitions.push(Object.freeze({batchIndex, firstRecord, recordCount, scene}));
      firstRecord += recordCount;
      borrowedRecordByteLength += recordCount * GPU_SCENE_RECORD_BYTE_LENGTH;
      sceneCount++;
    }
  } catch (error) {
    for (const partition of partitions) partition.scene?.destroy();
    throw error;
  }

  let destroyed = false;
  return Object.freeze({
    partitions: Object.freeze(partitions),
    stats: Object.freeze({
      batchCount: table.batches.length,
      sceneCount,
      recordCount: firstRecord,
      borrowedRecordByteLength,
      ownedStateByteLength: sceneCount * GPU_SCENE_STATE_BYTE_LENGTH
    }),
    destroy: () => {
      if (destroyed) return;
      for (const partition of partitions) partition.scene?.destroy();
      destroyed = true;
    }
  });
}

function validateTableBatch(
  dataByName: Record<string, GPUData>,
  recordCount: number,
  columns: GPUSceneTableColumnNames,
  batchIndex: number
): Buffer {
  let recordBuffer: Buffer | undefined;
  for (const field of TABLE_FIELDS) {
    const columnName = columns[field.role];
    const data = dataByName[columnName];
    if (!data) {
      throw new Error(`GPU scene table batch ${batchIndex} is missing column "${columnName}"`);
    }
    if (data.format !== field.format) {
      throw new Error(`GPU scene table column "${columnName}" must use ${field.format} storage`);
    }
    if (data.length !== recordCount) {
      throw new Error(`GPU scene table column "${columnName}" must cover the complete batch`);
    }
    if (data.byteStride !== GPU_SCENE_RECORD_BYTE_LENGTH || data.byteOffset !== field.byteOffset) {
      throw new Error(
        `GPU scene table column "${columnName}" must use the canonical scene record layout`
      );
    }
    if (data.buffer instanceof DynamicBuffer) {
      throw new Error('GPU scene table adapter does not borrow replaceable DynamicBuffer storage');
    }
    if (recordBuffer && recordBuffer !== data.buffer) {
      throw new Error('GPU scene table columns in one batch must share one interleaved buffer');
    }
    recordBuffer = data.buffer;
  }

  if (!recordBuffer) {
    throw new Error(`GPU scene table batch ${batchIndex} has no scene record storage`);
  }
  const requiredByteLength = recordCount * GPU_SCENE_RECORD_BYTE_LENGTH;
  if (recordBuffer.byteLength < requiredByteLength) {
    throw new Error(`GPU scene table batch ${batchIndex} record buffer is too small`);
  }
  if ((recordBuffer.usage & REQUIRED_BUFFER_USAGE) !== REQUIRED_BUFFER_USAGE) {
    throw new Error('GPU scene table record buffers require STORAGE, COPY_DST, and COPY_SRC usage');
  }
  return recordBuffer;
}
