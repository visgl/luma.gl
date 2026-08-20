// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {GPUCommandGraph, type GraphBufferHandle, type GraphDataView} from '@luma.gl/gpgpu/gpu-core';
import {
  GPUScene,
  GPU_SCENE_ACTIVE_FLAG,
  GPU_SCENE_INVALID_REFERENCE,
  GPU_SCENE_RECORD_BYTE_LENGTH,
  type GPUSceneView
} from '@luma.gl/gpgpu/gpu-core';

/**
 * Number of 32-bit words in a canonical execution span.
 *
 * Records contain start time, duration, lane, group, process, thread, stable object identity,
 * and classification bits. The first two words are interpreted as `float32`; the remaining words
 * are `uint32` values. Multiply this constant by `Uint32Array.BYTES_PER_ELEMENT` for byte stride.
 */
export const GPU_TRACE_SPAN_RECORD_WORD_LENGTH = 8;
/**
 * Number of 32-bit words in one directed dependency record.
 *
 * Records contain the canonical source row, canonical destination row, application-defined link
 * family, and application-defined flags. Source and destination refer to rows, not object IDs.
 */
export const GPU_TRACE_LINK_RECORD_WORD_LENGTH = 4;

const UINT32_BYTE_LENGTH = Uint32Array.BYTES_PER_ELEMENT;
const SOURCE_BUFFER_USAGE = Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC;

/**
 * One explicitly preserved source batch in global canonical-span order.
 *
 * Adjacent partitions must cover every source row without gaps or overlap. Empty partitions are
 * retained so streaming producers do not lose their original batch boundaries.
 */
export type GPUTraceScenePartition = {
  /** Global canonical row at which this source batch begins. */
  firstSpan: number;
  /** Number of canonical span rows in the batch; zero-length batches remain observable. */
  spanCount: number;
  /** Optional renderer group that every span in this partition must share. */
  groupId?: number;
};

/**
 * Source-ordered compressed-sparse-row dependency adjacency over canonical span rows.
 *
 * `offsets` has `spanCount + 1` entries. Neighbors for source row `index` occupy
 * `neighbors.subarray(offsets[index], offsets[index + 1])` and retain source-edge order.
 */
export type GPUTraceSceneAdjacency = {
  /** Monotonic neighbor-range boundaries; the final entry equals `neighbors.length`. */
  offsets: Uint32Array;
  /** Canonical target rows arranged by source row in original dependency order. */
  neighbors: Uint32Array;
};

/**
 * Canonical trace inputs projected once into a generic flat GPU scene.
 *
 * The constructor copies these CPU-side arrays into trace-owned GPU allocations. Parent and
 * dependency references always use canonical source rows, never compacted positions or object IDs.
 */
export type GPUTraceSceneProps = {
  /** Optional diagnostic identifier used as the prefix for owned GPU resources. */
  id?: string;
  /** Eight-word records containing start, duration, lane, group, process, thread, ID, and flags. */
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

/**
 * Physical GPU buffers owned by one canonical trace model.
 *
 * These buffers remain valid until their owning {@link GPUTraceScene} is destroyed. Consumers must
 * borrow them through {@link GPUTraceScene.importToGraph} instead of destroying them independently.
 */
export type GPUTraceSceneBuffers = {
  /** Packed eight-word canonical span records, including time and hierarchy ownership. */
  spans: Buffer;
  /** One canonical parent row or invalid-reference sentinel per span. */
  parents: Buffer;
  /** Packed four-word directed dependency records. */
  links: Buffer;
  /** Forward compressed-sparse-row boundaries with `spanCount + 1` logical entries. */
  outgoingOffsets: Buffer;
  /** Forward dependency destinations addressed by canonical span row. */
  outgoingNeighbors: Buffer;
  /** Reverse compressed-sparse-row boundaries with `spanCount + 1` logical entries. */
  incomingOffsets: Buffer;
  /** Reverse dependency sources addressed by canonical span row. */
  incomingNeighbors: Buffer;
};

/**
 * Borrowed command-graph views over canonical trace data and its generic GPU scene projection.
 *
 * Every span-field view preserves canonical source order. Link views preserve source-edge order,
 * while adjacency views expose forward and reverse dependency neighborhoods without repacking.
 */
export type GPUTraceSceneView = {
  /** Generic, renderer-independent flat scene projected from the canonical span records. */
  scene: GPUSceneView;
  /** Imported handle for the packed canonical span-record buffer. */
  spans: GraphBufferHandle;
  /** Imported handle for the packed directed dependency-record buffer. */
  links: GraphBufferHandle;
  /** Source-aligned `float32` span start times. */
  startTimes: GraphDataView<'float32'>;
  /** Source-aligned, nonnegative `float32` span durations. */
  durations: GraphDataView<'float32'>;
  /** Source-aligned original timeline lane identities before hierarchy collapse. */
  lanes: GraphDataView<'uint32'>;
  /** Source-aligned renderer-owned pipeline or resource-group identities. */
  groupIds: GraphDataView<'uint32'>;
  /** Source-aligned process identities used by the expansion hierarchy. */
  processIds: GraphDataView<'uint32'>;
  /** Source-aligned globally numbered thread identities. */
  threadIds: GraphDataView<'uint32'>;
  /** Source-aligned, stable application object identities distinct from canonical row indices. */
  objectIds: GraphDataView<'uint32'>;
  /** Source-aligned application-defined classification and filtering bits. */
  classifications: GraphDataView<'uint32'>;
  /** Source-aligned canonical parent rows or invalid-reference sentinels. */
  parents: GraphDataView<'uint32'>;
  /** Canonical source row for each directed dependency. */
  linkSources: GraphDataView<'uint32'>;
  /** Canonical destination row for each directed dependency. */
  linkDestinations: GraphDataView<'uint32'>;
  /** Application-defined dependency family for each directed edge. */
  linkFamilies: GraphDataView<'uint32'>;
  /** Application-defined dependency flags for each directed edge. */
  linkFlags: GraphDataView<'uint32'>;
  /** Forward compressed-sparse-row neighbor boundaries indexed by canonical source row. */
  outgoingOffsets: GraphDataView<'uint32'>;
  /** Forward dependency destinations in preserved source-edge order. */
  outgoingNeighbors: GraphDataView<'uint32'>;
  /** Reverse compressed-sparse-row neighbor boundaries indexed by canonical destination row. */
  incomingOffsets: GraphDataView<'uint32'>;
  /** Reverse dependency sources in preserved source-edge order. */
  incomingNeighbors: GraphDataView<'uint32'>;
  /** Immutable source batch descriptors, including explicitly supplied empty partitions. */
  partitions: readonly Readonly<GPUTraceScenePartition>[];
};

/**
 * Immutable allocation and topology facts available without GPU readback.
 *
 * Byte lengths report actual backing allocations, so empty logical inputs may still reserve the
 * minimum valid storage-buffer size. Scene projection is accounted for separately from topology.
 */
export type GPUTraceSceneStats = {
  /** Number of canonical source spans and projected logical scene records. */
  spanCount: number;
  /** Number of directed dependency records. */
  linkCount: number;
  /** Number of preserved source partitions, including zero-span batches. */
  partitionCount: number;
  /** Number of addressable process identities. */
  processCount: number;
  /** Number of addressable globally numbered thread identities. */
  threadCount: number;
  /** Actual allocated byte length of the packed canonical span buffer. */
  canonicalByteLength: number;
  /** Combined allocated byte length of parents, links, and both CSR representations. */
  topologyByteLength: number;
  /** Allocated byte length of the projected generic scene records and scene state. */
  sceneByteLength: number;
  /** Sum of canonical, topology, and generic scene allocation costs. */
  totalByteLength: number;
};

/**
 * Owns canonical trace identity and topology beside a renderer-independent flat GPU scene.
 *
 * Time, process/thread ownership, parents, dependency links, and CSR adjacency remain separate
 * from `GPUScene`. The scene projection contains only stable IDs, temporal/lane bounds, group and
 * geometry references, and explicit indirect-command slots.
 *
 * @example
 * ```ts
 * import {GPUCommandGraph} from '@luma.gl/gpgpu/gpu-core';
 * import {GPUTraceScene} from '@luma.gl/experimental/gpu-trace';
 *
 * const trace = new GPUTraceScene(device, {
 *   spans: canonicalSpanWords,
 *   parents: canonicalParentRows,
 *   links: dependencyWords,
 *   processCount: 4,
 *   threadCount: 16
 * });
 * const graph = new GPUCommandGraph(device);
 * const source = trace.importToGraph(graph);
 * ```
 */
export class GPUTraceScene {
  /** WebGPU device that owns the canonical buffers and projected generic scene. */
  readonly device: Device;
  /** Diagnostic identifier shared by this trace model and its owned resources. */
  readonly id: string;
  /** Generic flat scene containing stable span identities and timeline bounds. */
  readonly scene: GPUScene;
  /** Immutable collection of trace-owned canonical and topology GPU buffers. */
  readonly buffers: Readonly<GPUTraceSceneBuffers>;
  /** Immutable source partitions in canonical global row order. */
  readonly partitions: readonly Readonly<GPUTraceScenePartition>[];
  /** Immutable topology counts and allocation costs available without readback. */
  readonly stats: Readonly<GPUTraceSceneStats>;
  private destroyed = false;

  /**
   * Uploads canonical span and topology data and creates its generic flat scene projection.
   *
   * @param device - WebGPU device used for all trace-owned allocations.
   * @param props - Packed span records, hierarchy parents, dependencies, and source partitions.
   */
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

  /**
   * Borrows trace-owned buffers into a caller-owned graph and creates source-aligned field views.
   *
   * The returned views do not transfer ownership, submit work, or read GPU data back. The graph
   * must belong to this trace model's device, and the trace must outlive every graph execution.
   *
   * @param graph - Command graph that will schedule consumers of the canonical trace buffers.
   * @returns Typed span fields, dependency topology, preserved partitions, and generic scene views.
   */
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

  /**
   * Releases every trace-owned canonical, topology, and generic scene allocation exactly once.
   *
   * Destruction is idempotent. Imported graph views become invalid after destruction, so callers
   * must complete or stop using dependent graph work before releasing the trace.
   */
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
