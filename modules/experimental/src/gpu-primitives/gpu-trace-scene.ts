// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {GPUCommandGraph, type GraphBufferHandle, type GraphDataView} from './gpu-command-graph';
import {
  GPUScene,
  GPU_SCENE_ACTIVE_FLAG,
  GPU_SCENE_INVALID_REFERENCE,
  GPU_SCENE_RECORD_BYTE_LENGTH,
  type GPUSceneView
} from './gpu-scene';

/** Number of uint32 words in one canonical packed trace span. */
export const GPU_TRACE_SPAN_RECORD_WORD_LENGTH = 8;
/** Number of uint32 words in one canonical source/destination dependency. */
export const GPU_TRACE_LINK_RECORD_WORD_LENGTH = 4;

const UINT32_BYTE_LENGTH = Uint32Array.BYTES_PER_ELEMENT;
const SOURCE_BUFFER_USAGE = Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC;

/** One explicitly preserved source batch in global span-row order. */
export type GPUTraceScenePartition = {
  firstSpan: number;
  spanCount: number;
  groupId?: number;
};

/** Source-ordered compressed sparse adjacency over global span-row indices. */
export type GPUTraceSceneAdjacency = {
  offsets: Uint32Array;
  neighbors: Uint32Array;
};

/** Canonical trace inputs projected once into a generic flat GPU scene. */
export type GPUTraceSceneProps = {
  id?: string;
  /** Packed start, duration, lane, group, process, thread, stable ID, and classification words. */
  spans: Uint32Array;
  /** One parent span-row index or GPU_SCENE_INVALID_REFERENCE per canonical row. */
  parents: Uint32Array;
  /** Packed source, destination, family, and application flags for every dependency. */
  links?: Uint32Array;
  /** Explicit source batches, including zero-row batches. Defaults to one complete partition. */
  partitions?: readonly GPUTraceScenePartition[];
  /** Number of addressable process identities. */
  processCount: number;
  /** Number of addressable thread identities. */
  threadCount: number;
  /** Optional renderer-owned geometry identity written into every projected scene row. */
  geometryId?: number;
  /** Optional precomputed forward adjacency. Otherwise it is derived once during ingestion. */
  outgoing?: GPUTraceSceneAdjacency;
  /** Optional precomputed reverse adjacency. Otherwise it is derived once during ingestion. */
  incoming?: GPUTraceSceneAdjacency;
};

/** Physical buffers owned by one canonical trace model. */
export type GPUTraceSceneBuffers = {
  spans: Buffer;
  parents: Buffer;
  links: Buffer;
  outgoingOffsets: Buffer;
  outgoingNeighbors: Buffer;
  incomingOffsets: Buffer;
  incomingNeighbors: Buffer;
};

/** Typed graph views over canonical trace data and its generic GPU scene projection. */
export type GPUTraceSceneView = {
  scene: GPUSceneView;
  spans: GraphBufferHandle;
  links: GraphBufferHandle;
  startTimes: GraphDataView<'float32'>;
  durations: GraphDataView<'float32'>;
  lanes: GraphDataView<'uint32'>;
  groupIds: GraphDataView<'uint32'>;
  processIds: GraphDataView<'uint32'>;
  threadIds: GraphDataView<'uint32'>;
  objectIds: GraphDataView<'uint32'>;
  classifications: GraphDataView<'uint32'>;
  parents: GraphDataView<'uint32'>;
  linkSources: GraphDataView<'uint32'>;
  linkDestinations: GraphDataView<'uint32'>;
  linkFamilies: GraphDataView<'uint32'>;
  linkFlags: GraphDataView<'uint32'>;
  outgoingOffsets: GraphDataView<'uint32'>;
  outgoingNeighbors: GraphDataView<'uint32'>;
  incomingOffsets: GraphDataView<'uint32'>;
  incomingNeighbors: GraphDataView<'uint32'>;
  partitions: readonly Readonly<GPUTraceScenePartition>[];
};

/** Allocation and topology facts available without GPU readback. */
export type GPUTraceSceneStats = {
  spanCount: number;
  linkCount: number;
  partitionCount: number;
  processCount: number;
  threadCount: number;
  canonicalByteLength: number;
  topologyByteLength: number;
  sceneByteLength: number;
  totalByteLength: number;
};

/**
 * Owns canonical trace identity and topology beside a renderer-independent flat GPU scene.
 *
 * Time, process/thread ownership, parents, dependency links, and CSR adjacency remain separate
 * from `GPUScene`. The scene projection contains only stable IDs, temporal/lane bounds, group and
 * geometry references, and explicit indirect-command slots.
 */
export class GPUTraceScene {
  readonly device: Device;
  readonly id: string;
  readonly scene: GPUScene;
  readonly buffers: Readonly<GPUTraceSceneBuffers>;
  readonly partitions: readonly Readonly<GPUTraceScenePartition>[];
  readonly stats: Readonly<GPUTraceSceneStats>;
  private destroyed = false;

  constructor(device: Device, props: GPUTraceSceneProps) {
    if (device.type !== 'webgpu') throw new Error('GPUTraceScene requires a WebGPU device');
    validateProps(props);
    const spanCount = props.spans.length / GPU_TRACE_SPAN_RECORD_WORD_LENGTH;
    const links = props.links ?? new Uint32Array(0);
    const linkCount = links.length / GPU_TRACE_LINK_RECORD_WORD_LENGTH;
    const partitions = normalizePartitions(props.partitions, spanCount, props.spans);
    const outgoing = props.outgoing ?? makeAdjacency(spanCount, links, 'outgoing');
    const incoming = props.incoming ?? makeAdjacency(spanCount, links, 'incoming');
    validateAdjacency(outgoing, spanCount, links, 'outgoing');
    validateAdjacency(incoming, spanCount, links, 'incoming');

    this.device = device;
    this.id = props.id ?? 'gpu-trace-scene';
    this.partitions = Object.freeze(partitions.map(partition => Object.freeze({...partition})));

    const ownedBuffers: Buffer[] = [];
    const makeBuffer = (name: string, data: Uint32Array, minimumWordLength = 1): Buffer => {
      const buffer = device.createBuffer({
        id: `${this.id}-${name}`,
        data: data.length > 0 ? data : new Uint32Array(minimumWordLength),
        usage: SOURCE_BUFFER_USAGE
      });
      ownedBuffers.push(buffer);
      return buffer;
    };

    try {
      const buffers = {
        spans: makeBuffer('spans', props.spans, GPU_TRACE_SPAN_RECORD_WORD_LENGTH),
        parents: makeBuffer('parents', props.parents),
        links: makeBuffer('links', links, GPU_TRACE_LINK_RECORD_WORD_LENGTH),
        outgoingOffsets: makeBuffer('outgoing-offsets', outgoing.offsets),
        outgoingNeighbors: makeBuffer('outgoing-neighbors', outgoing.neighbors),
        incomingOffsets: makeBuffer('incoming-offsets', incoming.offsets),
        incomingNeighbors: makeBuffer('incoming-neighbors', incoming.neighbors)
      };
      const records = makeBuffer(
        'scene-records',
        makeSceneRecords(props.spans, props.geometryId ?? GPU_SCENE_INVALID_REFERENCE)
      );
      const state = makeBuffer('scene-state', Uint32Array.from([spanCount, spanCount, 0, 0]));
      this.scene = new GPUScene(device, {
        id: `${this.id}-scene`,
        capacity: Math.max(spanCount, 1),
        recordCount: spanCount,
        activeCount: spanCount,
        buffers: {records, state},
        ownsBuffers: true
      });
      this.buffers = Object.freeze(buffers);
    } catch (error) {
      for (const buffer of ownedBuffers) buffer.destroy();
      throw error;
    }

    const canonicalByteLength = this.buffers.spans.byteLength;
    const topologyByteLength =
      this.buffers.parents.byteLength +
      this.buffers.links.byteLength +
      this.buffers.outgoingOffsets.byteLength +
      this.buffers.outgoingNeighbors.byteLength +
      this.buffers.incomingOffsets.byteLength +
      this.buffers.incomingNeighbors.byteLength;
    const sceneByteLength = this.scene.stats.outputByteLength;
    this.stats = Object.freeze({
      spanCount,
      linkCount,
      partitionCount: this.partitions.length,
      processCount: props.processCount,
      threadCount: props.threadCount,
      canonicalByteLength,
      topologyByteLength,
      sceneByteLength,
      totalByteLength: canonicalByteLength + topologyByteLength + sceneByteLength
    });
  }

  /** Imports source-owned buffers once and exposes source-aligned field and topology views. */
  importToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): GPUTraceSceneView {
    if (this.destroyed) throw new Error('GPUTraceScene has been destroyed');
    if (graph.device !== this.device) throw new Error('GPUTraceScene graph must use its device');
    const handles = Object.fromEntries(
      Object.entries(this.buffers).map(([name, buffer]) => [
        name,
        graph.importBuffer(
          {id: `${this.id}-${name}`, byteLength: buffer.byteLength, usage: buffer.usage},
          buffer
        )
      ])
    ) as Record<keyof GPUTraceSceneBuffers, GraphBufferHandle>;
    const spanUint = (word: number): GraphDataView<'uint32'> =>
      graph.createDataView(handles.spans, {
        format: 'uint32',
        length: this.stats.spanCount,
        byteOffset: word * UINT32_BYTE_LENGTH,
        byteStride: GPU_TRACE_SPAN_RECORD_WORD_LENGTH * UINT32_BYTE_LENGTH
      });
    const spanFloat = (word: number): GraphDataView<'float32'> =>
      graph.createDataView(handles.spans, {
        format: 'float32',
        length: this.stats.spanCount,
        byteOffset: word * UINT32_BYTE_LENGTH,
        byteStride: GPU_TRACE_SPAN_RECORD_WORD_LENGTH * UINT32_BYTE_LENGTH
      });
    const linkField = (word: number): GraphDataView<'uint32'> =>
      graph.createDataView(handles.links, {
        format: 'uint32',
        length: this.stats.linkCount,
        byteOffset: word * UINT32_BYTE_LENGTH,
        byteStride: GPU_TRACE_LINK_RECORD_WORD_LENGTH * UINT32_BYTE_LENGTH
      });
    const packed = (handle: GraphBufferHandle, length: number): GraphDataView<'uint32'> =>
      graph.createDataView(handle, {format: 'uint32', length});

    return {
      scene: this.scene.importToGraph(graph),
      spans: handles.spans,
      links: handles.links,
      startTimes: spanFloat(0),
      durations: spanFloat(1),
      lanes: spanUint(2),
      groupIds: spanUint(3),
      processIds: spanUint(4),
      threadIds: spanUint(5),
      objectIds: spanUint(6),
      classifications: spanUint(7),
      parents: packed(handles.parents, this.stats.spanCount),
      linkSources: linkField(0),
      linkDestinations: linkField(1),
      linkFamilies: linkField(2),
      linkFlags: linkField(3),
      outgoingOffsets: packed(handles.outgoingOffsets, this.stats.spanCount + 1),
      outgoingNeighbors: packed(handles.outgoingNeighbors, this.stats.linkCount),
      incomingOffsets: packed(handles.incomingOffsets, this.stats.spanCount + 1),
      incomingNeighbors: packed(handles.incomingNeighbors, this.stats.linkCount),
      partitions: this.partitions
    };
  }

  /** Releases canonical trace and scene allocations exactly once. */
  destroy(): void {
    if (this.destroyed) return;
    this.scene.destroy();
    for (const buffer of Object.values(this.buffers)) buffer.destroy();
    this.destroyed = true;
  }
}

function validateProps(props: GPUTraceSceneProps): void {
  if (props.spans.length % GPU_TRACE_SPAN_RECORD_WORD_LENGTH !== 0) {
    throw new Error('GPUTraceScene spans require complete eight-word records');
  }
  const spanCount = props.spans.length / GPU_TRACE_SPAN_RECORD_WORD_LENGTH;
  const links = props.links ?? new Uint32Array(0);
  if (
    props.parents.length !== spanCount ||
    links.length % GPU_TRACE_LINK_RECORD_WORD_LENGTH !== 0 ||
    !Number.isSafeInteger(props.processCount) ||
    props.processCount < 0 ||
    !Number.isSafeInteger(props.threadCount) ||
    props.threadCount < 0 ||
    (props.geometryId !== undefined &&
      (!Number.isSafeInteger(props.geometryId) ||
        props.geometryId < 0 ||
        props.geometryId >= GPU_SCENE_INVALID_REFERENCE))
  ) {
    throw new Error('GPUTraceScene requires source-aligned parents and complete dependency links');
  }

  const sourceIds = new Set<number>();
  const floats = new Float32Array(props.spans.buffer, props.spans.byteOffset, props.spans.length);
  for (let index = 0; index < spanCount; index++) {
    const word = index * GPU_TRACE_SPAN_RECORD_WORD_LENGTH;
    const start = floats[word]!;
    const duration = floats[word + 1]!;
    const end = Math.fround(start + duration);
    const sourceId = props.spans[word + 6]!;
    const parent = props.parents[index]!;
    if (
      !Number.isFinite(start) ||
      !Number.isFinite(duration) ||
      duration < 0 ||
      !Number.isFinite(end) ||
      props.spans[word + 3]! >= GPU_SCENE_INVALID_REFERENCE ||
      props.spans[word + 4]! >= props.processCount ||
      props.spans[word + 5]! >= props.threadCount ||
      sourceId >= GPU_SCENE_INVALID_REFERENCE ||
      sourceIds.has(sourceId) ||
      (parent !== GPU_SCENE_INVALID_REFERENCE && parent >= spanCount)
    ) {
      throw new Error(`GPUTraceScene span ${index} has invalid time, identity, or ownership`);
    }
    sourceIds.add(sourceId);
  }
  for (let index = 0; index < links.length; index += GPU_TRACE_LINK_RECORD_WORD_LENGTH) {
    if (links[index]! >= spanCount || links[index + 1]! >= spanCount) {
      throw new Error('GPUTraceScene dependency endpoints must reference canonical span rows');
    }
  }
}

function normalizePartitions(
  input: readonly GPUTraceScenePartition[] | undefined,
  spanCount: number,
  spans: Uint32Array
): GPUTraceScenePartition[] {
  const partitions = input ?? [{firstSpan: 0, spanCount}];
  let nextSpan = 0;
  for (const partition of partitions) {
    if (
      !Number.isSafeInteger(partition.firstSpan) ||
      partition.firstSpan !== nextSpan ||
      !Number.isSafeInteger(partition.spanCount) ||
      partition.spanCount < 0 ||
      partition.firstSpan + partition.spanCount > spanCount ||
      (partition.groupId !== undefined &&
        (!Number.isSafeInteger(partition.groupId) ||
          partition.groupId < 0 ||
          partition.groupId >= GPU_SCENE_INVALID_REFERENCE))
    ) {
      throw new Error('GPUTraceScene partitions must preserve contiguous global source rows');
    }
    if (partition.groupId !== undefined) {
      for (
        let index = partition.firstSpan;
        index < partition.firstSpan + partition.spanCount;
        index++
      ) {
        if (spans[index * GPU_TRACE_SPAN_RECORD_WORD_LENGTH + 3] !== partition.groupId) {
          throw new Error('GPUTraceScene partition group must match every source span');
        }
      }
    }
    nextSpan += partition.spanCount;
  }
  if (nextSpan !== spanCount) {
    throw new Error('GPUTraceScene partitions must preserve contiguous global source rows');
  }
  return Array.from(partitions);
}

function validateAdjacency(
  adjacency: GPUTraceSceneAdjacency,
  spanCount: number,
  links: Uint32Array,
  direction: 'outgoing' | 'incoming'
): void {
  const linkCount = links.length / GPU_TRACE_LINK_RECORD_WORD_LENGTH;
  if (
    adjacency.offsets.length !== spanCount + 1 ||
    adjacency.neighbors.length !== linkCount ||
    adjacency.offsets[0] !== 0 ||
    adjacency.offsets[spanCount] !== linkCount
  ) {
    throw new Error(`GPUTraceScene ${direction} adjacency must match its spans and links`);
  }
  for (let index = 0; index < spanCount; index++) {
    if (adjacency.offsets[index]! > adjacency.offsets[index + 1]!) {
      throw new Error(`GPUTraceScene ${direction} adjacency offsets must be monotonic`);
    }
  }
  if (adjacency.neighbors.some(neighbor => neighbor >= spanCount)) {
    throw new Error(`GPUTraceScene ${direction} adjacency neighbors must reference span rows`);
  }

  const sourceWord = direction === 'outgoing' ? 0 : 1;
  const destinationWord = direction === 'outgoing' ? 1 : 0;
  const cursors = adjacency.offsets.slice(0, spanCount);
  for (let index = 0; index < links.length; index += GPU_TRACE_LINK_RECORD_WORD_LENGTH) {
    const source = links[index + sourceWord]!;
    const cursor = cursors[source]!;
    if (
      cursor >= adjacency.offsets[source + 1]! ||
      adjacency.neighbors[cursor] !== links[index + destinationWord]
    ) {
      throw new Error(`GPUTraceScene ${direction} adjacency must preserve source edge order`);
    }
    cursors[source] = cursor + 1;
  }
}

function makeAdjacency(
  spanCount: number,
  links: Uint32Array,
  direction: 'outgoing' | 'incoming'
): GPUTraceSceneAdjacency {
  const offsets = new Uint32Array(spanCount + 1);
  const sourceWord = direction === 'outgoing' ? 0 : 1;
  const destinationWord = direction === 'outgoing' ? 1 : 0;
  for (let index = 0; index < links.length; index += GPU_TRACE_LINK_RECORD_WORD_LENGTH) {
    offsets[links[index + sourceWord]! + 1]!++;
  }
  for (let index = 0; index < spanCount; index++) offsets[index + 1]! += offsets[index]!;
  const neighbors = new Uint32Array(links.length / GPU_TRACE_LINK_RECORD_WORD_LENGTH);
  const cursors = offsets.slice(0, spanCount);
  for (let index = 0; index < links.length; index += GPU_TRACE_LINK_RECORD_WORD_LENGTH) {
    const source = links[index + sourceWord]!;
    neighbors[cursors[source]!] = links[index + destinationWord]!;
    cursors[source]!++;
  }
  return {offsets, neighbors};
}

function makeSceneRecords(spans: Uint32Array, geometryId: number): Uint32Array {
  const spanCount = spans.length / GPU_TRACE_SPAN_RECORD_WORD_LENGTH;
  const sceneWordLength = GPU_SCENE_RECORD_BYTE_LENGTH / UINT32_BYTE_LENGTH;
  const words = new Uint32Array(Math.max(spanCount, 1) * sceneWordLength);
  const sourceFloats = new Float32Array(spans.buffer, spans.byteOffset, spans.length);
  const sceneFloats = new Float32Array(words.buffer);
  for (let index = 0; index < spanCount; index++) {
    const source = index * GPU_TRACE_SPAN_RECORD_WORD_LENGTH;
    const destination = index * sceneWordLength;
    const start = sourceFloats[source]!;
    const duration = sourceFloats[source + 1]!;
    const lane = spans[source + 2]!;
    words[destination] = spans[source + 6]!;
    words[destination + 1] = GPU_SCENE_ACTIVE_FLAG;
    words[destination + 2] = spans[source + 3]!;
    words[destination + 3] = geometryId;
    words[destination + 4] = index;
    sceneFloats[destination + 8] = start;
    sceneFloats[destination + 9] = lane;
    sceneFloats[destination + 12] = start + duration;
    sceneFloats[destination + 13] = lane + 1;
    sceneFloats[destination + 14] = 1;
    sceneFloats[destination + 16] = 1;
    sceneFloats[destination + 21] = 1;
    sceneFloats[destination + 26] = 1;
    sceneFloats[destination + 31] = 1;
  }
  return words;
}
