// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {GPUCommandGraph, type GraphBufferHandle, type GraphDataView} from './gpu-command-graph';

const UINT32_BYTE_LENGTH = Uint32Array.BYTES_PER_ELEMENT;
const FLOAT32_BYTE_LENGTH = Float32Array.BYTES_PER_ELEMENT;
const REQUIRED_BUFFER_USAGE = Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC;

/** Byte size of one fixed-layout GPU scene record. */
export const GPU_SCENE_RECORD_BYTE_LENGTH = 128;
/** Byte size of the count, active-count, and overflow state block. */
export const GPU_SCENE_STATE_BYTE_LENGTH = 16;
/** Reserved reference value for records without a group, geometry, or command slot. */
export const GPU_SCENE_INVALID_REFERENCE = 0xffffffff;
/** Bit stored for records that participate in the scene. */
export const GPU_SCENE_ACTIVE_FLAG = 1;

const FIELD_OFFSETS = {
  objectId: 0,
  flags: 4,
  groupId: 8,
  geometryId: 12,
  commandSlot: 16,
  boundsMinimum: 32,
  boundsMaximum: 48,
  transform0: 64,
  transform1: 80,
  transform2: 96,
  transform3: 112
} as const;

const IDENTITY_TRANSFORM = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1] as const;

type GPUSceneBufferWrite = {
  target: 'records' | 'state';
  data: ArrayBufferView;
  byteOffset: number;
};

/** Three-dimensional scene coordinate. */
export type GPUScenePosition = readonly [number, number, number];

/** Axis-aligned bounds stored with each scene record. */
export type GPUSceneBounds = {
  minimum: GPUScenePosition;
  maximum: GPUScenePosition;
};

/** CPU description of one initial flat scene record. */
export type GPUSceneRecord = {
  /** Stable application identity. `0xffffffff` is reserved. */
  id: number;
  /** Three-dimensional object bounds. */
  bounds: GPUSceneBounds;
  /** Column-major 4x4 object transform. Defaults to identity. */
  transform?: readonly number[];
  /** Stable draw-group reference. Defaults to `0xffffffff`. */
  groupId?: number;
  /** Stable geometry reference. Defaults to `0xffffffff`. */
  geometryId?: number;
  /** Indirect-command slot reference. Defaults to `0xffffffff`. */
  commandSlot?: number;
};

/** Mutable fields for one existing stable object ID. */
export type GPUSceneRecordPatch = {
  id: number;
  bounds?: GPUSceneBounds;
  transform?: readonly number[];
  groupId?: number;
  geometryId?: number;
  commandSlot?: number;
};

/** One validated CPU-authored scene mutation transaction. */
export type GPUSceneMutation = {
  insert?: readonly GPUSceneRecord[];
  update?: readonly GPUSceneRecordPatch[];
  remove?: readonly number[];
  /** Densely repack active records in prior slot order after applying the transaction. */
  compact?: boolean;
};

/** One stable object's physical move during compaction. */
export type GPUSceneMove = {
  id: number;
  from: number;
  to: number;
};

/** Observable cost and identity effects of one mutation transaction. */
export type GPUSceneMutationResult = {
  insertedIds: readonly number[];
  updatedIds: readonly number[];
  removedIds: readonly number[];
  moves: readonly GPUSceneMove[];
  overflowCount: number;
  writeCount: number;
  uploadedByteLength: number;
  recordCount: number;
  activeCount: number;
};

/** Physical storage adopted by a {@link GPUScene}. */
export type GPUSceneBuffers = {
  records: Buffer;
  state: Buffer;
};

/** Properties for one flat GPU scene database. */
export type GPUSceneProps = {
  id?: string;
  /** Maximum number of fixed-layout records. Defaults to `records.length`. */
  capacity?: number;
  /** Optional initial active record prefix. */
  records?: readonly GPUSceneRecord[];
  /** Logical active-prefix length for pre-populated borrowed storage. */
  recordCount?: number;
  /** Optional compatible caller-owned record and state buffers. */
  buffers?: GPUSceneBuffers;
  /** Whether `destroy()` owns supplied buffers. Defaults to `false`. */
  ownsBuffers?: boolean;
};

/** Typed graph views over one scene's fixed record and state layouts. */
export type GPUSceneView = {
  capacity: number;
  recordCount: number;
  records: GraphBufferHandle;
  state: GraphBufferHandle;
  objectIds: GraphDataView<'uint32'>;
  flags: GraphDataView<'uint32'>;
  groupIds: GraphDataView<'uint32'>;
  geometryIds: GraphDataView<'uint32'>;
  commandSlots: GraphDataView<'uint32'>;
  boundsMinimum: GraphDataView<'float32x4'>;
  boundsMaximum: GraphDataView<'float32x4'>;
  transformColumns: readonly [
    GraphDataView<'float32x4'>,
    GraphDataView<'float32x4'>,
    GraphDataView<'float32x4'>,
    GraphDataView<'float32x4'>
  ];
  count: GraphDataView<'uint32'>;
  activeCount: GraphDataView<'uint32'>;
  overflow: GraphDataView<'uint32'>;
};

/** Allocation and layout facts available without GPU readback. */
export type GPUSceneStats = {
  capacity: number;
  recordCount: number;
  activeCount: number;
  recordByteLength: number;
  recordBufferByteLength: number;
  stateBufferByteLength: number;
  outputByteLength: number;
};

/**
 * Owns or borrows a flat, fixed-capacity GPU draw database.
 *
 * The class defines storage and identity only. Mutation, compaction, visibility, draw-command
 * generation, and CPU-scene or table adapters are separate policies layered in later tranches.
 */
export class GPUScene {
  readonly device: Device;
  readonly id: string;
  readonly capacity: number;
  readonly recordBuffer: Buffer;
  readonly stateBuffer: Buffer;
  /** Whether stable IDs and slots are known well enough for CPU-authored mutation. */
  readonly mutable: boolean;
  private ownsBuffers: boolean;
  private destroyed = false;
  private highWaterMark: number;
  private activeRecordCount: number;
  private readonly recordsBySlot: Array<GPUSceneRecord | undefined>;
  private readonly slotsById = new Map<number, number>();

  constructor(device: Device, props: GPUSceneProps) {
    if (device.type !== 'webgpu') {
      throw new Error('GPUScene requires a WebGPU device');
    }
    const records = props.records ?? [];
    const recordCount = props.recordCount ?? records.length;
    const capacity = props.capacity ?? records.length;
    if (!Number.isSafeInteger(capacity) || capacity < 1) {
      throw new Error('GPUScene capacity must be a positive safe integer');
    }
    if (
      !Number.isSafeInteger(recordCount) ||
      recordCount < 0 ||
      recordCount > capacity ||
      records.length > capacity
    ) {
      throw new Error('GPUScene record count must fit capacity');
    }
    if (records.length > 0 && recordCount !== records.length) {
      throw new Error('GPUScene recordCount must equal records.length when records are supplied');
    }
    if (props.buffers && records.length === 0 && props.recordCount === undefined) {
      throw new Error('GPUScene borrowed storage requires recordCount or initial records');
    }
    validateRecords(records);

    this.device = device;
    this.id = props.id ?? 'gpu-scene';
    this.capacity = capacity;
    this.highWaterMark = recordCount;
    this.activeRecordCount = recordCount;
    this.mutable = records.length === recordCount;
    this.recordsBySlot = new Array(capacity);
    records.forEach((record, recordIndex) => {
      const normalizedRecord = normalizeRecord(record);
      this.recordsBySlot[recordIndex] = normalizedRecord;
      this.slotsById.set(normalizedRecord.id, recordIndex);
    });
    const recordBufferByteLength = capacity * GPU_SCENE_RECORD_BYTE_LENGTH;
    if (!Number.isSafeInteger(recordBufferByteLength)) {
      throw new Error('GPUScene record storage exceeds safe integer range');
    }

    if (props.buffers) {
      validateBuffers(device, props.buffers, recordBufferByteLength);
      this.recordBuffer = props.buffers.records;
      this.stateBuffer = props.buffers.state;
      this.ownsBuffers = props.ownsBuffers ?? false;
      if (records.length > 0) {
        this.recordBuffer.write(makeRecordData(records));
        this.stateBuffer.write(makeStateData(recordCount));
      }
    } else {
      this.recordBuffer = device.createBuffer({
        id: `${this.id}-records`,
        byteLength: recordBufferByteLength,
        usage: REQUIRED_BUFFER_USAGE
      });
      if (records.length > 0) {
        this.recordBuffer.write(makeRecordData(records));
      }
      this.stateBuffer = device.createBuffer({
        id: `${this.id}-state`,
        data: makeStateData(recordCount),
        usage: REQUIRED_BUFFER_USAGE
      });
      this.ownsBuffers = true;
    }
  }

  /** Current physical prefix length, including inactive holes. */
  get recordCount(): number {
    return this.highWaterMark;
  }

  /** Current number of active records. */
  get activeCount(): number {
    return this.activeRecordCount;
  }

  /** Current allocation and logical-count facts available without readback. */
  get stats(): GPUSceneStats {
    return {
      capacity: this.capacity,
      recordCount: this.highWaterMark,
      activeCount: this.activeRecordCount,
      recordByteLength: GPU_SCENE_RECORD_BYTE_LENGTH,
      recordBufferByteLength: this.capacity * GPU_SCENE_RECORD_BYTE_LENGTH,
      stateBufferByteLength: GPU_SCENE_STATE_BYTE_LENGTH,
      outputByteLength: this.capacity * GPU_SCENE_RECORD_BYTE_LENGTH + GPU_SCENE_STATE_BYTE_LENGTH
    };
  }

  /** Returns the current physical slot for a stable object ID, if CPU metadata is available. */
  getRecordIndex(id: number): number | undefined {
    return this.slotsById.get(id);
  }

  /** Applies one validated mutation transaction and reports its bounded queue-write cost. */
  mutate(mutation: GPUSceneMutation): GPUSceneMutationResult {
    this.assertMutable();
    const insert = mutation.insert ?? [];
    const update = mutation.update ?? [];
    const remove = mutation.remove ?? [];
    validateMutation(this.slotsById, this.recordsBySlot, insert, update, remove);

    const writes: GPUSceneBufferWrite[] = [];
    const removedIds = [...remove];
    for (const id of remove) {
      const slot = this.slotsById.get(id)!;
      this.recordsBySlot[slot] = undefined;
      this.slotsById.delete(id);
      this.activeRecordCount--;
      if (!mutation.compact) {
        writes.push({
          target: 'records',
          data: Uint32Array.of(0),
          byteOffset: this.getRecordByteOffset(slot) + FIELD_OFFSETS.flags
        });
      }
    }

    const updatedIds: number[] = [];
    for (const patch of update) {
      const slot = this.slotsById.get(patch.id)!;
      const record = applyRecordPatch(this.recordsBySlot[slot]!, patch);
      this.recordsBySlot[slot] = record;
      updatedIds.push(record.id);
      if (!mutation.compact) {
        writes.push({
          target: 'records',
          data: makeRecordData([record]),
          byteOffset: this.getRecordByteOffset(slot)
        });
      }
    }

    const freeSlots: number[] = [];
    for (let slot = 0; slot < this.capacity; slot++) {
      if (!this.recordsBySlot[slot]) freeSlots.push(slot);
    }
    const insertedIds: number[] = [];
    const insertedCount = Math.min(insert.length, freeSlots.length);
    for (let insertIndex = 0; insertIndex < insertedCount; insertIndex++) {
      const record = normalizeRecord(insert[insertIndex]!);
      const slot = freeSlots[insertIndex]!;
      this.recordsBySlot[slot] = record;
      this.slotsById.set(record.id, slot);
      this.activeRecordCount++;
      this.highWaterMark = Math.max(this.highWaterMark, slot + 1);
      insertedIds.push(record.id);
      if (!mutation.compact) {
        writes.push({
          target: 'records',
          data: makeRecordData([record]),
          byteOffset: this.getRecordByteOffset(slot)
        });
      }
    }

    const overflowCount = insert.length - insertedCount;
    const moves = mutation.compact ? this.compactRecords(this.highWaterMark, writes) : [];
    if (!mutation.compact) this.trimHighWaterMark();
    writes.push({
      target: 'state',
      data: makeStateData(this.highWaterMark, this.activeRecordCount, overflowCount > 0),
      byteOffset: 0
    });
    for (const write of writes) this.writeBuffer(write);

    return Object.freeze({
      insertedIds: Object.freeze(insertedIds),
      updatedIds: Object.freeze(updatedIds),
      removedIds: Object.freeze(removedIds),
      moves: Object.freeze(moves),
      overflowCount,
      writeCount: writes.length,
      uploadedByteLength: writes.reduce((sum, write) => sum + write.data.byteLength, 0),
      recordCount: this.highWaterMark,
      activeCount: this.activeRecordCount
    });
  }

  /** Densely repacks active records in stable prior-slot order. */
  compact(): GPUSceneMutationResult {
    return this.mutate({compact: true});
  }

  /** Returns the byte offset of one validated record. */
  getRecordByteOffset(recordIndex: number): number {
    if (!Number.isSafeInteger(recordIndex) || recordIndex < 0 || recordIndex >= this.capacity) {
      throw new Error(`GPUScene record index ${recordIndex} is out of range`);
    }
    return recordIndex * GPU_SCENE_RECORD_BYTE_LENGTH;
  }

  /** Imports borrowed scene storage and publishes its field-level graph views. */
  importToGraph<Parameters>(
    graph: GPUCommandGraph<Parameters>,
    id: string = this.id
  ): GPUSceneView {
    if (graph.device !== this.device) {
      throw new Error('GPUScene graph must use the scene device');
    }
    const records = graph.importBuffer(
      {
        id: `${id}-records`,
        byteLength: this.recordBuffer.byteLength,
        usage: this.recordBuffer.usage
      },
      this.recordBuffer
    );
    const state = graph.importBuffer(
      {
        id: `${id}-state`,
        byteLength: this.stateBuffer.byteLength,
        usage: this.stateBuffer.usage
      },
      this.stateBuffer
    );
    const uintField = (byteOffset: number): GraphDataView<'uint32'> =>
      graph.createDataView(records, {
        format: 'uint32',
        length: this.capacity,
        byteOffset,
        byteStride: GPU_SCENE_RECORD_BYTE_LENGTH
      });
    const vectorField = (byteOffset: number): GraphDataView<'float32x4'> =>
      graph.createDataView(records, {
        format: 'float32x4',
        length: this.capacity,
        byteOffset,
        byteStride: GPU_SCENE_RECORD_BYTE_LENGTH
      });
    return {
      capacity: this.capacity,
      recordCount: this.recordCount,
      records,
      state,
      objectIds: uintField(FIELD_OFFSETS.objectId),
      flags: uintField(FIELD_OFFSETS.flags),
      groupIds: uintField(FIELD_OFFSETS.groupId),
      geometryIds: uintField(FIELD_OFFSETS.geometryId),
      commandSlots: uintField(FIELD_OFFSETS.commandSlot),
      boundsMinimum: vectorField(FIELD_OFFSETS.boundsMinimum),
      boundsMaximum: vectorField(FIELD_OFFSETS.boundsMaximum),
      transformColumns: [
        vectorField(FIELD_OFFSETS.transform0),
        vectorField(FIELD_OFFSETS.transform1),
        vectorField(FIELD_OFFSETS.transform2),
        vectorField(FIELD_OFFSETS.transform3)
      ],
      count: graph.createDataView(state, {format: 'uint32', length: 1}),
      activeCount: graph.createDataView(state, {
        format: 'uint32',
        length: 1,
        byteOffset: UINT32_BYTE_LENGTH
      }),
      overflow: graph.createDataView(state, {
        format: 'uint32',
        length: 1,
        byteOffset: UINT32_BYTE_LENGTH * 2
      })
    };
  }

  /** Releases record and state storage only when this scene owns it. */
  destroy(): void {
    if (this.destroyed) return;
    if (this.ownsBuffers) {
      this.recordBuffer.destroy();
      this.stateBuffer.destroy();
      this.ownsBuffers = false;
    }
    this.destroyed = true;
  }

  private compactRecords(
    previousHighWaterMark: number,
    writes: GPUSceneBufferWrite[]
  ): GPUSceneMove[] {
    const compacted = this.recordsBySlot.filter(
      (record): record is GPUSceneRecord => record !== undefined
    );
    const moves: GPUSceneMove[] = [];
    compacted.forEach((record, to) => {
      const from = this.slotsById.get(record.id)!;
      if (from !== to) moves.push(Object.freeze({id: record.id, from, to}));
    });
    this.recordsBySlot.fill(undefined);
    this.slotsById.clear();
    compacted.forEach((record, slot) => {
      this.recordsBySlot[slot] = record;
      this.slotsById.set(record.id, slot);
    });
    this.highWaterMark = compacted.length;
    if (moves.length > 0 || previousHighWaterMark > compacted.length) {
      const upload = new Uint8Array(previousHighWaterMark * GPU_SCENE_RECORD_BYTE_LENGTH);
      upload.set(makeRecordData(compacted));
      writes.push({target: 'records', data: upload, byteOffset: 0});
    }
    return moves;
  }

  private trimHighWaterMark(): void {
    while (this.highWaterMark > 0 && !this.recordsBySlot[this.highWaterMark - 1]) {
      this.highWaterMark--;
    }
  }

  private writeBuffer(write: GPUSceneBufferWrite): void {
    const buffer = write.target === 'state' ? this.stateBuffer : this.recordBuffer;
    buffer.write(write.data, write.byteOffset);
  }

  private assertMutable(): void {
    if (this.destroyed) throw new Error('GPUScene has been destroyed');
    if (!this.mutable) {
      throw new Error('GPUScene mutation requires CPU-known initial records');
    }
  }
}

function validateBuffers(device: Device, buffers: GPUSceneBuffers, recordByteLength: number): void {
  if (buffers.records.device !== device || buffers.state.device !== device) {
    throw new Error('GPUScene buffers must belong to the supplied device');
  }
  if (
    buffers.records.byteLength < recordByteLength ||
    buffers.state.byteLength < GPU_SCENE_STATE_BYTE_LENGTH
  ) {
    throw new Error('GPUScene buffers are smaller than the declared capacity');
  }
  if (
    (buffers.records.usage & REQUIRED_BUFFER_USAGE) !== REQUIRED_BUFFER_USAGE ||
    (buffers.state.usage & REQUIRED_BUFFER_USAGE) !== REQUIRED_BUFFER_USAGE
  ) {
    throw new Error('GPUScene buffers require STORAGE, COPY_DST, and COPY_SRC usage');
  }
}

function validateRecords(records: readonly GPUSceneRecord[]): void {
  const ids = new Set<number>();
  for (const record of records) {
    validateUint32(record.id, 'id', false);
    if (ids.has(record.id)) {
      throw new Error(`GPUScene record id ${record.id} is duplicated`);
    }
    ids.add(record.id);
    for (let axis = 0; axis < 3; axis++) {
      const minimum = record.bounds.minimum[axis];
      const maximum = record.bounds.maximum[axis];
      if (!Number.isFinite(minimum) || !Number.isFinite(maximum) || minimum > maximum) {
        throw new Error('GPUScene bounds must contain finite ordered minima and maxima');
      }
    }
    if (
      record.transform &&
      (record.transform.length !== 16 || !record.transform.every(Number.isFinite))
    ) {
      throw new Error('GPUScene transform must contain 16 finite values');
    }
    validateUint32(record.groupId ?? GPU_SCENE_INVALID_REFERENCE, 'groupId', true);
    validateUint32(record.geometryId ?? GPU_SCENE_INVALID_REFERENCE, 'geometryId', true);
    validateUint32(record.commandSlot ?? GPU_SCENE_INVALID_REFERENCE, 'commandSlot', true);
  }
}

function validateUint32(value: number, name: string, allowInvalid: boolean): void {
  const maximum = allowInvalid ? GPU_SCENE_INVALID_REFERENCE : GPU_SCENE_INVALID_REFERENCE - 1;
  if (!Number.isSafeInteger(value) || value < 0 || value > maximum) {
    throw new Error(
      `GPUScene ${name} must be a uint32 value${allowInvalid ? '' : ' below 0xffffffff'}`
    );
  }
}

function makeRecordData(records: readonly GPUSceneRecord[]): Uint8Array {
  const data = new ArrayBuffer(records.length * GPU_SCENE_RECORD_BYTE_LENGTH);
  const view = new DataView(data);
  records.forEach((record, recordIndex) => {
    const base = recordIndex * GPU_SCENE_RECORD_BYTE_LENGTH;
    view.setUint32(base + FIELD_OFFSETS.objectId, record.id, true);
    view.setUint32(base + FIELD_OFFSETS.flags, GPU_SCENE_ACTIVE_FLAG, true);
    view.setUint32(
      base + FIELD_OFFSETS.groupId,
      record.groupId ?? GPU_SCENE_INVALID_REFERENCE,
      true
    );
    view.setUint32(
      base + FIELD_OFFSETS.geometryId,
      record.geometryId ?? GPU_SCENE_INVALID_REFERENCE,
      true
    );
    view.setUint32(
      base + FIELD_OFFSETS.commandSlot,
      record.commandSlot ?? GPU_SCENE_INVALID_REFERENCE,
      true
    );
    writeVector4(view, base + FIELD_OFFSETS.boundsMinimum, [...record.bounds.minimum, 0]);
    writeVector4(view, base + FIELD_OFFSETS.boundsMaximum, [...record.bounds.maximum, 0]);
    const transform = record.transform ?? IDENTITY_TRANSFORM;
    writeVector4(view, base + FIELD_OFFSETS.transform0, transform.slice(0, 4));
    writeVector4(view, base + FIELD_OFFSETS.transform1, transform.slice(4, 8));
    writeVector4(view, base + FIELD_OFFSETS.transform2, transform.slice(8, 12));
    writeVector4(view, base + FIELD_OFFSETS.transform3, transform.slice(12, 16));
  });
  return new Uint8Array(data);
}

function makeStateData(
  recordCount: number,
  activeCount = recordCount,
  overflow = false
): Uint32Array {
  return Uint32Array.from([recordCount, activeCount, overflow ? 1 : 0, 0]);
}

function normalizeRecord(record: GPUSceneRecord): GPUSceneRecord {
  return Object.freeze({
    id: record.id,
    bounds: Object.freeze({
      minimum: Object.freeze([...record.bounds.minimum]) as GPUScenePosition,
      maximum: Object.freeze([...record.bounds.maximum]) as GPUScenePosition
    }),
    transform: record.transform ? Object.freeze([...record.transform]) : undefined,
    groupId: record.groupId,
    geometryId: record.geometryId,
    commandSlot: record.commandSlot
  });
}

function applyRecordPatch(record: GPUSceneRecord, patch: GPUSceneRecordPatch): GPUSceneRecord {
  const updated = normalizeRecord({
    ...record,
    bounds: patch.bounds ?? record.bounds,
    transform: patch.transform ?? record.transform,
    groupId: patch.groupId ?? record.groupId,
    geometryId: patch.geometryId ?? record.geometryId,
    commandSlot: patch.commandSlot ?? record.commandSlot
  });
  validateRecords([updated]);
  return updated;
}

function validateMutation(
  slotsById: ReadonlyMap<number, number>,
  recordsBySlot: readonly (GPUSceneRecord | undefined)[],
  insert: readonly GPUSceneRecord[],
  update: readonly GPUSceneRecordPatch[],
  remove: readonly number[]
): void {
  validateRecords(insert);
  const touched = new Set<number>();
  for (const id of remove) {
    validateUint32(id, 'remove id', false);
    if (!slotsById.has(id)) throw new Error(`GPUScene record id ${id} does not exist`);
    if (touched.has(id)) throw new Error(`GPUScene record id ${id} appears more than once`);
    touched.add(id);
  }
  for (const patch of update) {
    validateUint32(patch.id, 'patch id', false);
    if (!slotsById.has(patch.id)) throw new Error(`GPUScene record id ${patch.id} does not exist`);
    if (touched.has(patch.id))
      throw new Error(`GPUScene record id ${patch.id} appears more than once`);
    const slot = slotsById.get(patch.id)!;
    applyRecordPatch(recordsBySlot[slot]!, patch);
    touched.add(patch.id);
  }
  for (const record of insert) {
    if (slotsById.has(record.id) || touched.has(record.id)) {
      throw new Error(`GPUScene record id ${record.id} already exists`);
    }
    touched.add(record.id);
  }
}

function writeVector4(view: DataView, byteOffset: number, values: readonly number[]): void {
  for (let index = 0; index < 4; index++) {
    view.setFloat32(byteOffset + index * FLOAT32_BYTE_LENGTH, values[index], true);
  }
}
