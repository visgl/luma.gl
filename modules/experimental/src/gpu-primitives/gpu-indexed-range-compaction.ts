// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {type Binding, type Buffer, type Device} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import {
  GPUCommandGraph,
  type GraphBufferHandle,
  type GraphDataView,
  GraphVectorView
} from './gpu-command-graph';
import {GPUScan} from './gpu-scan';
import {
  createTransientVectorView,
  createTransientView,
  getViewBinding,
  getViewElementOffset,
  validateMatchingVectorTopology,
  validatePackedUint32View
} from './graph-data-view-utils';

const RANGE_COMPACTION_WORKGROUP_SIZE = 256;

/** Packed record layout describing source ranges consumed by indexed range compaction. */
export type GPUIndexedRangeLayout = {
  /** Number of uint32 words in one range record. */
  wordStride: number;
  /** Word containing the first source index. */
  firstIndexWordOffset: number;
  /** Word containing the source row count. */
  countWordOffset: number;
};

/** Physical representation of source-aligned selection flags. */
export type GPUIndexedRangeFlagEncoding = 'uint32' | 'bitset';

/** Properties for candidate-driven stable source-index compaction. */
export type GPUIndexedRangeCompactionProps = {
  /** Prefix for generated resources and graph nodes. */
  id?: string;
  /** Source-aligned zero/nonzero selection flags. */
  flags: GraphDataView<'uint32'>;
  /** Packed source-range records. */
  ranges: GraphDataView<'uint32'>;
  /** Number of range records. */
  rangeCount: number;
  /** Packed range-record layout. */
  rangeLayout: GPUIndexedRangeLayout;
  /** Stable compacted IDs of active range records. */
  activeRangeIds: GraphDataView<'uint32'>;
  /** Indirect dispatch whose X dimension is one and Y dimension is the active range count. */
  activeRangeDispatch: GraphBufferHandle;
  /** Maximum number of source rows in one range. Must not exceed 256. */
  maximumRangeLength: number;
  /** Destination for stable compacted source indices. */
  output: GraphDataView<'uint32'>;
  /** Destination whose first row receives the total selected count. */
  count: GraphDataView<'uint32'>;
};

/** Graph-owned intermediate views exposed to downstream range-aware consumers. */
export type GPUIndexedRangeCompactionResult = {
  /** Source-aligned offsets within each active range. Only selected active rows are defined. */
  localOffsets: GraphDataView<'uint32'>;
  /** Selected row count for every range; inactive ranges contain zero. */
  rangeCounts: GraphDataView<'uint32'>;
  /** Exclusive selected-row offset for every range in canonical range order. */
  rangeOffsets: GraphDataView<'uint32'>;
};

/** Properties for partition-preserving candidate-driven source-index compaction. */
export type GPUPartitionedIndexedRangeCompactionProps = {
  /** Prefix for generated resources and graph nodes. */
  id?: string;
  /** Source-aligned flags split at complete range boundaries. */
  flags: GraphVectorView<'uint32'>;
  /** Flag representation. Defaults to one uint32 per source row. */
  flagEncoding?: GPUIndexedRangeFlagEncoding;
  /** Packed source-range records shared by every partition. */
  ranges: GraphDataView<'uint32'>;
  /** Number of range records. */
  rangeCount: number;
  /** Packed range-record layout. */
  rangeLayout: GPUIndexedRangeLayout;
  /** Exclusive ordered range ends, one for each flags chunk. */
  partitionRangeEnds: readonly number[];
  /** Stable compacted IDs of active range records. */
  activeRangeIds: GraphDataView<'uint32'>;
  /** Indirect dispatch whose X dimension is one and Y dimension is the active range count. */
  activeRangeDispatch: GraphBufferHandle;
  /** Maximum number of source rows in one range. Must not exceed 256. */
  maximumRangeLength: number;
  /** Partitioned output with the same capacity and chunk topology as flags. */
  output: GraphVectorView<'uint32'>;
  /** Destination whose first row receives the total selected count. */
  count: GraphDataView<'uint32'>;
};

/** GPU-generated partition metadata exposed to range-aware downstream consumers. */
export type GPUPartitionedIndexedRangeCompactionResult = {
  /** Source-aligned local offsets preserving the flags chunk topology. */
  localOffsets: GraphVectorView<'uint32'>;
  /** Selected row count for every canonical range. */
  rangeCounts: GraphDataView<'uint32'>;
  /** Partition-local exclusive selected-row offset for every canonical range. */
  rangeOffsets: GraphDataView<'uint32'>;
  /** Total selected row count for every output partition. */
  partitionCounts: GraphDataView<'uint32'>;
};

/**
 * Stably compacts source indices from a GPU-generated list of active, non-overlapping ranges.
 *
 * One workgroup scans each active range locally. A small canonical-range scan then supplies stable
 * global offsets before a second indirect pass scatters selected source IDs. Runtime work scales
 * with active ranges plus the range index rather than the full source domain.
 */
export class GPUIndexedRangeCompaction {
  readonly id: string;
  readonly flags: GraphDataView<'uint32'>;
  readonly ranges: GraphDataView<'uint32'>;
  readonly rangeCount: number;
  readonly rangeLayout: GPUIndexedRangeLayout;
  readonly activeRangeIds: GraphDataView<'uint32'>;
  readonly activeRangeDispatch: GraphBufferHandle;
  readonly maximumRangeLength: number;
  readonly output: GraphDataView<'uint32'>;
  readonly count: GraphDataView<'uint32'>;

  constructor(props: GPUIndexedRangeCompactionProps) {
    this.id = props.id ?? 'gpu-indexed-range-compaction';
    this.flags = props.flags;
    this.ranges = props.ranges;
    this.rangeCount = props.rangeCount;
    this.rangeLayout = props.rangeLayout;
    this.activeRangeIds = props.activeRangeIds;
    this.activeRangeDispatch = props.activeRangeDispatch;
    this.maximumRangeLength = props.maximumRangeLength;
    this.output = props.output;
    this.count = props.count;

    for (const [name, view] of [
      ['flags', this.flags],
      ['ranges', this.ranges],
      ['activeRangeIds', this.activeRangeIds],
      ['output', this.output],
      ['count', this.count]
    ] as const) {
      validatePackedUint32View(view, `${this.id} ${name}`);
    }
    if (!Number.isSafeInteger(this.rangeCount) || this.rangeCount < 1) {
      throw new Error(`${this.id} rangeCount must be a positive safe integer`);
    }
    if (
      !Number.isSafeInteger(this.maximumRangeLength) ||
      this.maximumRangeLength < 1 ||
      this.maximumRangeLength > RANGE_COMPACTION_WORKGROUP_SIZE
    ) {
      throw new Error(`${this.id} maximumRangeLength must be between 1 and 256`);
    }
    validateRangeLayout(this.id, this.rangeLayout);
    if (this.ranges.length < this.rangeCount * this.rangeLayout.wordStride) {
      throw new Error(`${this.id} ranges does not contain rangeCount records`);
    }
    if (this.activeRangeIds.length < this.rangeCount) {
      throw new Error(`${this.id} activeRangeIds must have rangeCount capacity`);
    }
    if (this.output.length < this.flags.length) {
      throw new Error(`${this.id} output must contain at least flags.length rows`);
    }
    if (this.count.length < 1) {
      throw new Error(`${this.id} count must contain one uint32 row`);
    }
  }

  /** Adds range clearing, local scans, canonical range scan, scatter, and count publication. */
  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): GPUIndexedRangeCompactionResult {
    for (const view of [this.flags, this.ranges, this.activeRangeIds, this.output, this.count]) {
      if (view.buffer.graph !== graph) {
        throw new Error(`${this.id} views must belong to the target graph`);
      }
    }
    if (this.activeRangeDispatch.graph !== graph) {
      throw new Error(`${this.id} activeRangeDispatch must belong to the target graph`);
    }

    const localOffsets = createTransientView(
      graph,
      `${this.id}-local-offsets`,
      'uint32',
      this.flags.length
    );
    const rangeCounts: GraphDataView<'uint32'> = createTransientView(
      graph,
      `${this.id}-range-counts`,
      'uint32',
      this.rangeCount
    );
    const rangeOffsets: GraphDataView<'uint32'> = createTransientView(
      graph,
      `${this.id}-range-offsets`,
      'uint32',
      this.rangeCount
    );

    addClearRangeCountsPass(graph, this.id, rangeCounts);
    addLocalScanPass(graph, this, localOffsets, rangeCounts);
    new GPUScan({
      id: `${this.id}-range-scan`,
      input: rangeCounts,
      output: rangeOffsets
    }).addToGraph(graph);
    addScatterPass(graph, this, localOffsets, rangeOffsets);
    addCountPass(graph, this.id, rangeCounts, rangeOffsets, this.count);
    return {localOffsets, rangeCounts, rangeOffsets};
  }
}

/**
 * Stably compacts active ranges into matching bounded output partitions.
 *
 * Range records remain one logical canonical index, while source flags, local scratch, and output
 * IDs preserve caller-provided chunk boundaries. Every range must be wholly contained by the flags
 * chunk selected by `partitionRangeEnds`. Each partition receives an independent compacted list;
 * emitted values remain global source indices.
 */
export class GPUPartitionedIndexedRangeCompaction {
  readonly id: string;
  readonly flags: GraphVectorView<'uint32'>;
  readonly flagEncoding: GPUIndexedRangeFlagEncoding;
  readonly ranges: GraphDataView<'uint32'>;
  readonly rangeCount: number;
  readonly rangeLayout: GPUIndexedRangeLayout;
  readonly partitionRangeEnds: readonly number[];
  readonly activeRangeIds: GraphDataView<'uint32'>;
  readonly activeRangeDispatch: GraphBufferHandle;
  readonly maximumRangeLength: number;
  readonly output: GraphVectorView<'uint32'>;
  readonly count: GraphDataView<'uint32'>;

  constructor(props: GPUPartitionedIndexedRangeCompactionProps) {
    this.id = props.id ?? 'gpu-partitioned-indexed-range-compaction';
    this.flags = props.flags;
    this.flagEncoding = props.flagEncoding ?? 'uint32';
    this.ranges = props.ranges;
    this.rangeCount = props.rangeCount;
    this.rangeLayout = props.rangeLayout;
    this.partitionRangeEnds = props.partitionRangeEnds;
    this.activeRangeIds = props.activeRangeIds;
    this.activeRangeDispatch = props.activeRangeDispatch;
    this.maximumRangeLength = props.maximumRangeLength;
    this.output = props.output;
    this.count = props.count;

    for (const [name, view] of [
      ['ranges', this.ranges],
      ['activeRangeIds', this.activeRangeIds],
      ['count', this.count]
    ] as const) {
      validatePackedUint32View(view, `${this.id} ${name}`);
    }
    validatePartitionedVector(this.id, 'flags', this.flags);
    validatePartitionedVector(this.id, 'output', this.output);
    if (this.flagEncoding === 'bitset') {
      validateBitsetVectorTopology(this.id, this.flags, this.output);
    } else {
      validateMatchingVectorTopology(this.flags, this.output, `${this.id} output`);
    }
    validateRangeCompactionShape(this);
    validatePartitionRangeEnds(
      this.id,
      this.partitionRangeEnds,
      this.flags.data.length,
      this.rangeCount
    );
  }

  /** Adds partitioned local scans, bounded range scans, scatter, and count publication. */
  addToGraph<Parameters>(
    graph: GPUCommandGraph<Parameters>
  ): GPUPartitionedIndexedRangeCompactionResult {
    for (const view of [
      ...this.flags.data,
      this.ranges,
      this.activeRangeIds,
      ...this.output.data,
      this.count
    ]) {
      if (view.buffer.graph !== graph) {
        throw new Error(`${this.id} views must belong to the target graph`);
      }
    }
    if (this.activeRangeDispatch.graph !== graph) {
      throw new Error(`${this.id} activeRangeDispatch must belong to the target graph`);
    }

    const localOffsets = createTransientVectorView(graph, `${this.id}-local-offsets`, this.output);
    const rangeCounts: GraphDataView<'uint32'> = createTransientView(
      graph,
      `${this.id}-range-counts`,
      'uint32',
      this.rangeCount
    );
    const rangeOffsets: GraphDataView<'uint32'> = createTransientView(
      graph,
      `${this.id}-range-offsets`,
      'uint32',
      this.rangeCount
    );
    const partitionCounts: GraphDataView<'uint32'> = createTransientView(
      graph,
      `${this.id}-partition-counts`,
      'uint32',
      this.partitionRangeEnds.length
    );

    addClearRangeCountsPass(graph, this.id, rangeCounts);
    let sourceStart = 0;
    let rangeStart = 0;
    for (let partitionIndex = 0; partitionIndex < this.flags.data.length; partitionIndex++) {
      const flags = this.flags.data[partitionIndex];
      const output = this.output.data[partitionIndex];
      const offsets = localOffsets.data[partitionIndex];
      const sourceEnd = sourceStart + output.length;
      const rangeEnd = this.partitionRangeEnds[partitionIndex];
      addPartitionLocalScanPass(graph, this, {
        partitionIndex,
        sourceStart,
        sourceEnd,
        rangeStart,
        rangeEnd,
        flags,
        localOffsets: offsets,
        rangeCounts
      });
      const partitionRangeCount = rangeEnd - rangeStart;
      const partitionRangeCounts = graph.createDataView<'uint32'>(rangeCounts.buffer, {
        format: 'uint32',
        length: partitionRangeCount,
        byteOffset: rangeStart * Uint32Array.BYTES_PER_ELEMENT
      });
      const partitionRangeOffsets = graph.createDataView<'uint32'>(rangeOffsets.buffer, {
        format: 'uint32',
        length: partitionRangeCount,
        byteOffset: rangeStart * Uint32Array.BYTES_PER_ELEMENT
      });
      new GPUScan({
        id: `${this.id}-partition-${partitionIndex}-range-scan`,
        input: partitionRangeCounts,
        output: partitionRangeOffsets
      }).addToGraph(graph);
      addPartitionScatterPass(graph, this, {
        partitionIndex,
        sourceStart,
        sourceEnd,
        rangeStart,
        rangeEnd,
        flags,
        localOffsets: offsets,
        rangeOffsets,
        output
      });
      sourceStart = sourceEnd;
      rangeStart = rangeEnd;
    }
    addPartitionCountPass(graph, this, rangeCounts, rangeOffsets, partitionCounts);
    return {localOffsets, rangeCounts, rangeOffsets, partitionCounts};
  }
}

function validateBitsetVectorTopology(
  id: string,
  flags: GraphVectorView<'uint32'>,
  output: GraphVectorView<'uint32'>
): void {
  if (flags.data.length !== output.data.length) {
    throw new Error(`${id} bitset flags must contain one chunk per output chunk`);
  }
  for (let chunkIndex = 0; chunkIndex < flags.data.length; chunkIndex++) {
    const flagWordCount = flags.data[chunkIndex].length;
    const sourceLength = output.data[chunkIndex].length;
    if (flagWordCount !== Math.ceil(sourceLength / 32)) {
      throw new Error(`${id} bitset flag chunks must contain one bit per output row`);
    }
  }
}

function validatePartitionedVector(
  id: string,
  name: string,
  vector: GraphVectorView<'uint32'>
): void {
  if (!(vector instanceof GraphVectorView) || vector.format !== 'uint32') {
    throw new Error(`${id} ${name} must be a uint32 GraphVectorView`);
  }
  if (vector.data.length < 1 || vector.data.some(chunk => chunk.length < 1)) {
    throw new Error(`${id} ${name} must contain non-empty chunks`);
  }
  if (vector.data.length > RANGE_COMPACTION_WORKGROUP_SIZE || vector.length > 0xffffffff) {
    throw new Error(`${id} ${name} must contain at most 256 chunks and uint32 rows`);
  }
  for (const chunk of vector.data) {
    validatePackedUint32View(chunk, `${id} ${name} chunk`);
  }
}

function validateRangeCompactionShape(
  compaction: Pick<
    GPUPartitionedIndexedRangeCompaction,
    | 'id'
    | 'ranges'
    | 'rangeCount'
    | 'rangeLayout'
    | 'activeRangeIds'
    | 'maximumRangeLength'
    | 'count'
  >
): void {
  if (
    !Number.isSafeInteger(compaction.rangeCount) ||
    compaction.rangeCount < 1 ||
    compaction.rangeCount > 0xffffffff
  ) {
    throw new Error(`${compaction.id} rangeCount must be a positive uint32`);
  }
  validateRangeLayout(compaction.id, compaction.rangeLayout);
  if (compaction.ranges.length < compaction.rangeCount * compaction.rangeLayout.wordStride) {
    throw new Error(`${compaction.id} ranges does not contain rangeCount records`);
  }
  if (compaction.activeRangeIds.length < compaction.rangeCount) {
    throw new Error(`${compaction.id} activeRangeIds must have rangeCount capacity`);
  }
  if (
    !Number.isSafeInteger(compaction.maximumRangeLength) ||
    compaction.maximumRangeLength < 1 ||
    compaction.maximumRangeLength > RANGE_COMPACTION_WORKGROUP_SIZE
  ) {
    throw new Error(`${compaction.id} maximumRangeLength must be between 1 and 256`);
  }
  if (compaction.count.length < 1) {
    throw new Error(`${compaction.id} count must contain one uint32 row`);
  }
}

function validatePartitionRangeEnds(
  id: string,
  partitionRangeEnds: readonly number[],
  partitionCount: number,
  rangeCount: number
): void {
  if (partitionRangeEnds.length !== partitionCount) {
    throw new Error(`${id} partitionRangeEnds must contain one end per vector chunk`);
  }
  let previousEnd = 0;
  for (const rangeEnd of partitionRangeEnds) {
    if (!Number.isSafeInteger(rangeEnd) || rangeEnd <= previousEnd || rangeEnd > rangeCount) {
      throw new Error(`${id} partitionRangeEnds must be strictly increasing range indices`);
    }
    previousEnd = rangeEnd;
  }
  if (previousEnd !== rangeCount) {
    throw new Error(`${id} partitionRangeEnds must terminate at rangeCount`);
  }
}

function addPartitionLocalScanPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  compaction: GPUPartitionedIndexedRangeCompaction,
  props: {
    partitionIndex: number;
    sourceStart: number;
    sourceEnd: number;
    rangeStart: number;
    rangeEnd: number;
    flags: GraphDataView<'uint32'>;
    localOffsets: GraphDataView<'uint32'>;
    rangeCounts: GraphDataView<'uint32'>;
  }
): void {
  const {rangeLayout} = compaction;
  const selectedExpression = getFlagSelectionExpression(compaction.flagEncoding, 'chunkIndex');
  const source = /* wgsl */ `
const RANGE_START: u32 = ${props.rangeStart}u;
const RANGE_END: u32 = ${props.rangeEnd}u;
const SOURCE_START: u32 = ${props.sourceStart}u;
const SOURCE_END: u32 = ${props.sourceEnd}u;
const RANGE_WORD_STRIDE: u32 = ${rangeLayout.wordStride}u;
const RANGE_FIRST_WORD: u32 = ${rangeLayout.firstIndexWordOffset}u;
const RANGE_COUNT_WORD: u32 = ${rangeLayout.countWordOffset}u;
const FLAGS_OFFSET: u32 = ${getViewElementOffset(props.flags)}u;
const RANGES_OFFSET: u32 = ${getViewElementOffset(compaction.ranges)}u;
const ACTIVE_RANGE_IDS_OFFSET: u32 = ${getViewElementOffset(compaction.activeRangeIds)}u;
const LOCAL_OFFSETS_OFFSET: u32 = ${getViewElementOffset(props.localOffsets)}u;
const RANGE_COUNTS_OFFSET: u32 = ${getViewElementOffset(props.rangeCounts)}u;
@group(0) @binding(0) var<storage, read> flags: array<u32>;
@group(0) @binding(1) var<storage, read> ranges: array<u32>;
@group(0) @binding(2) var<storage, read> activeRangeIds: array<u32>;
@group(0) @binding(3) var<storage, read_write> localOffsets: array<u32>;
@group(0) @binding(4) var<storage, read_write> rangeCounts: array<u32>;
var<workgroup> prefixes: array<u32, ${RANGE_COMPACTION_WORKGROUP_SIZE}>;

@compute @workgroup_size(${RANGE_COMPACTION_WORKGROUP_SIZE})
fn main(
  @builtin(local_invocation_id) localId: vec3<u32>,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  let rangeId = activeRangeIds[ACTIVE_RANGE_IDS_OFFSET + workgroupId.y];
  if (rangeId < RANGE_START || rangeId >= RANGE_END) {
    return;
  }
  let recordOffset = RANGES_OFFSET + rangeId * RANGE_WORD_STRIDE;
  let firstIndex = ranges[recordOffset + RANGE_FIRST_WORD];
  let elementCount = ranges[recordOffset + RANGE_COUNT_WORD];
  if (firstIndex < SOURCE_START || firstIndex + elementCount > SOURCE_END) {
    return;
  }
  let localIndex = localId.x;
  let chunkIndex = firstIndex - SOURCE_START + localIndex;
  var selected = 0u;
  if (localIndex < elementCount && ${selectedExpression}) {
    selected = 1u;
  }
  prefixes[localIndex] = selected;
  workgroupBarrier();

  var step = 1u;
  loop {
    if (step >= ${RANGE_COMPACTION_WORKGROUP_SIZE}u) {
      break;
    }
    var addend = 0u;
    if (localIndex >= step) {
      addend = prefixes[localIndex - step];
    }
    workgroupBarrier();
    prefixes[localIndex] += addend;
    workgroupBarrier();
    step *= 2u;
  }

  if (localIndex < elementCount) {
    localOffsets[LOCAL_OFFSETS_OFFSET + chunkIndex] = prefixes[localIndex] - selected;
  }
  if (localIndex == 0u) {
    var selectedCount = 0u;
    if (elementCount != 0u) {
      selectedCount = prefixes[elementCount - 1u];
    }
    rangeCounts[RANGE_COUNTS_OFFSET + rangeId] = selectedCount;
  }
}`;
  addIndirectPass(graph, {
    id: `${compaction.id}-partition-${props.partitionIndex}-local-scan`,
    source,
    views: {
      flags: props.flags,
      ranges: compaction.ranges,
      activeRangeIds: compaction.activeRangeIds,
      localOffsets: props.localOffsets,
      rangeCounts: props.rangeCounts
    },
    resources: [
      {buffer: props.flags, usage: 'storage-read'},
      {buffer: compaction.ranges, usage: 'storage-read'},
      {buffer: compaction.activeRangeIds, usage: 'storage-read'},
      {buffer: props.localOffsets, usage: 'storage-write'},
      {buffer: props.rangeCounts, usage: 'storage-write'}
    ],
    dispatchBuffer: compaction.activeRangeDispatch
  });
}

function addPartitionScatterPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  compaction: GPUPartitionedIndexedRangeCompaction,
  props: {
    partitionIndex: number;
    sourceStart: number;
    sourceEnd: number;
    rangeStart: number;
    rangeEnd: number;
    flags: GraphDataView<'uint32'>;
    localOffsets: GraphDataView<'uint32'>;
    rangeOffsets: GraphDataView<'uint32'>;
    output: GraphDataView<'uint32'>;
  }
): void {
  const {rangeLayout} = compaction;
  const selectedExpression = getFlagSelectionExpression(compaction.flagEncoding, 'chunkIndex');
  const source = /* wgsl */ `
const RANGE_START: u32 = ${props.rangeStart}u;
const RANGE_END: u32 = ${props.rangeEnd}u;
const SOURCE_START: u32 = ${props.sourceStart}u;
const SOURCE_END: u32 = ${props.sourceEnd}u;
const RANGE_WORD_STRIDE: u32 = ${rangeLayout.wordStride}u;
const RANGE_FIRST_WORD: u32 = ${rangeLayout.firstIndexWordOffset}u;
const RANGE_COUNT_WORD: u32 = ${rangeLayout.countWordOffset}u;
const FLAGS_OFFSET: u32 = ${getViewElementOffset(props.flags)}u;
const RANGES_OFFSET: u32 = ${getViewElementOffset(compaction.ranges)}u;
const ACTIVE_RANGE_IDS_OFFSET: u32 = ${getViewElementOffset(compaction.activeRangeIds)}u;
const LOCAL_OFFSETS_OFFSET: u32 = ${getViewElementOffset(props.localOffsets)}u;
const RANGE_OFFSETS_OFFSET: u32 = ${getViewElementOffset(props.rangeOffsets)}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(props.output)}u;
@group(0) @binding(0) var<storage, read> flags: array<u32>;
@group(0) @binding(1) var<storage, read> ranges: array<u32>;
@group(0) @binding(2) var<storage, read> activeRangeIds: array<u32>;
@group(0) @binding(3) var<storage, read> localOffsets: array<u32>;
@group(0) @binding(4) var<storage, read> rangeOffsets: array<u32>;
@group(0) @binding(5) var<storage, read_write> outputIds: array<u32>;

@compute @workgroup_size(${RANGE_COMPACTION_WORKGROUP_SIZE})
fn main(
  @builtin(local_invocation_id) localId: vec3<u32>,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  let rangeId = activeRangeIds[ACTIVE_RANGE_IDS_OFFSET + workgroupId.y];
  if (rangeId < RANGE_START || rangeId >= RANGE_END) {
    return;
  }
  let recordOffset = RANGES_OFFSET + rangeId * RANGE_WORD_STRIDE;
  let firstIndex = ranges[recordOffset + RANGE_FIRST_WORD];
  let elementCount = ranges[recordOffset + RANGE_COUNT_WORD];
  if (firstIndex < SOURCE_START || firstIndex + elementCount > SOURCE_END ||
      localId.x >= elementCount) {
    return;
  }
  let chunkIndex = firstIndex - SOURCE_START + localId.x;
  if (${selectedExpression}) {
    let outputIndex = rangeOffsets[RANGE_OFFSETS_OFFSET + rangeId] +
      localOffsets[LOCAL_OFFSETS_OFFSET + chunkIndex];
    outputIds[OUTPUT_OFFSET + outputIndex] = firstIndex + localId.x;
  }
}`;
  addIndirectPass(graph, {
    id: `${compaction.id}-partition-${props.partitionIndex}-scatter`,
    source,
    views: {
      flags: props.flags,
      ranges: compaction.ranges,
      activeRangeIds: compaction.activeRangeIds,
      localOffsets: props.localOffsets,
      rangeOffsets: props.rangeOffsets,
      outputIds: props.output
    },
    resources: [
      {buffer: props.flags, usage: 'storage-read'},
      {buffer: compaction.ranges, usage: 'storage-read'},
      {buffer: compaction.activeRangeIds, usage: 'storage-read'},
      {buffer: props.localOffsets, usage: 'storage-read'},
      {buffer: props.rangeOffsets, usage: 'storage-read'},
      {buffer: props.output, usage: 'storage-write'}
    ],
    dispatchBuffer: compaction.activeRangeDispatch
  });
}

function getFlagSelectionExpression(
  encoding: GPUIndexedRangeFlagEncoding,
  sourceIndex: string
): string {
  return encoding === 'bitset'
    ? `(flags[FLAGS_OFFSET + (${sourceIndex} >> 5u)] & (1u << (${sourceIndex} & 31u))) != 0u`
    : `flags[FLAGS_OFFSET + ${sourceIndex}] != 0u`;
}

function addPartitionCountPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  compaction: GPUPartitionedIndexedRangeCompaction,
  rangeCounts: GraphDataView<'uint32'>,
  rangeOffsets: GraphDataView<'uint32'>,
  partitionCounts: GraphDataView<'uint32'>
): void {
  const rangeEnds = compaction.partitionRangeEnds.map(rangeEnd => `${rangeEnd}u`).join(', ');
  const source = /* wgsl */ `
const PARTITION_COUNT: u32 = ${compaction.partitionRangeEnds.length}u;
const RANGE_ENDS = array<u32, ${compaction.partitionRangeEnds.length}>(${rangeEnds});
const RANGE_COUNTS_OFFSET: u32 = ${getViewElementOffset(rangeCounts)}u;
const RANGE_OFFSETS_OFFSET: u32 = ${getViewElementOffset(rangeOffsets)}u;
const PARTITION_COUNTS_OFFSET: u32 = ${getViewElementOffset(partitionCounts)}u;
const COUNT_OFFSET: u32 = ${getViewElementOffset(compaction.count)}u;
@group(0) @binding(0) var<storage, read> rangeCounts: array<u32>;
@group(0) @binding(1) var<storage, read> rangeOffsets: array<u32>;
@group(0) @binding(2) var<storage, read_write> partitionCounts: array<u32>;
@group(0) @binding(3) var<storage, read_write> outputCount: array<u32>;

@compute @workgroup_size(1)
fn main() {
  var totalCount = 0u;
  for (var partitionIndex = 0u; partitionIndex < PARTITION_COUNT; partitionIndex++) {
    let lastRangeIndex = RANGE_ENDS[partitionIndex] - 1u;
    let partitionCount = rangeOffsets[RANGE_OFFSETS_OFFSET + lastRangeIndex] +
      rangeCounts[RANGE_COUNTS_OFFSET + lastRangeIndex];
    partitionCounts[PARTITION_COUNTS_OFFSET + partitionIndex] = partitionCount;
    totalCount += partitionCount;
  }
  outputCount[COUNT_OFFSET] = totalCount;
}`;
  addDirectPass(graph, {
    id: `${compaction.id}-publish-counts`,
    source,
    views: {rangeCounts, rangeOffsets, partitionCounts, outputCount: compaction.count},
    resources: [
      {buffer: rangeCounts, usage: 'storage-read'},
      {buffer: rangeOffsets, usage: 'storage-read'},
      {buffer: partitionCounts, usage: 'storage-write'},
      {buffer: compaction.count, usage: 'storage-write'}
    ],
    dispatchCount: 1
  });
}

function validateRangeLayout(id: string, layout: GPUIndexedRangeLayout): void {
  if (!Number.isSafeInteger(layout.wordStride) || layout.wordStride < 2) {
    throw new Error(`${id} rangeLayout.wordStride must be at least two`);
  }
  for (const [name, offset] of [
    ['firstIndexWordOffset', layout.firstIndexWordOffset],
    ['countWordOffset', layout.countWordOffset]
  ] as const) {
    if (!Number.isSafeInteger(offset) || offset < 0 || offset >= layout.wordStride) {
      throw new Error(`${id} rangeLayout.${name} must address one record word`);
    }
  }
}

function addClearRangeCountsPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  id: string,
  rangeCounts: GraphDataView<'uint32'>
): void {
  const passId = `${id}-clear-range-counts`;
  const source = /* wgsl */ `
const RANGE_COUNT: u32 = ${rangeCounts.length}u;
const RANGE_COUNTS_OFFSET: u32 = ${getViewElementOffset(rangeCounts)}u;
@group(0) @binding(0) var<storage, read_write> rangeCounts: array<u32>;
@compute @workgroup_size(${RANGE_COMPACTION_WORKGROUP_SIZE})
fn main(@builtin(global_invocation_id) globalId: vec3<u32>) {
  if (globalId.x < RANGE_COUNT) {
    rangeCounts[RANGE_COUNTS_OFFSET + globalId.x] = 0u;
  }
}`;
  addDirectPass(graph, {
    id: passId,
    source,
    views: {rangeCounts},
    resources: [{buffer: rangeCounts, usage: 'storage-write'}],
    dispatchCount: Math.ceil(rangeCounts.length / RANGE_COMPACTION_WORKGROUP_SIZE)
  });
}

function addLocalScanPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  compaction: GPUIndexedRangeCompaction,
  localOffsets: GraphDataView<'uint32'>,
  rangeCounts: GraphDataView<'uint32'>
): void {
  const {rangeLayout} = compaction;
  const passId = `${compaction.id}-local-scan`;
  const source = /* wgsl */ `
const RANGE_COUNT: u32 = ${compaction.rangeCount}u;
const RANGE_WORD_STRIDE: u32 = ${rangeLayout.wordStride}u;
const RANGE_FIRST_WORD: u32 = ${rangeLayout.firstIndexWordOffset}u;
const RANGE_COUNT_WORD: u32 = ${rangeLayout.countWordOffset}u;
const FLAGS_OFFSET: u32 = ${getViewElementOffset(compaction.flags)}u;
const RANGES_OFFSET: u32 = ${getViewElementOffset(compaction.ranges)}u;
const ACTIVE_RANGE_IDS_OFFSET: u32 = ${getViewElementOffset(compaction.activeRangeIds)}u;
const LOCAL_OFFSETS_OFFSET: u32 = ${getViewElementOffset(localOffsets)}u;
const RANGE_COUNTS_OFFSET: u32 = ${getViewElementOffset(rangeCounts)}u;
@group(0) @binding(0) var<storage, read> flags: array<u32>;
@group(0) @binding(1) var<storage, read> ranges: array<u32>;
@group(0) @binding(2) var<storage, read> activeRangeIds: array<u32>;
@group(0) @binding(3) var<storage, read_write> localOffsets: array<u32>;
@group(0) @binding(4) var<storage, read_write> rangeCounts: array<u32>;
var<workgroup> prefixes: array<u32, ${RANGE_COMPACTION_WORKGROUP_SIZE}>;

@compute @workgroup_size(${RANGE_COMPACTION_WORKGROUP_SIZE})
fn main(
  @builtin(local_invocation_id) localId: vec3<u32>,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  let rangeId = activeRangeIds[ACTIVE_RANGE_IDS_OFFSET + workgroupId.y];
  if (rangeId >= RANGE_COUNT) {
    return;
  }
  let recordOffset = RANGES_OFFSET + rangeId * RANGE_WORD_STRIDE;
  let firstIndex = ranges[recordOffset + RANGE_FIRST_WORD];
  let elementCount = ranges[recordOffset + RANGE_COUNT_WORD];
  let localIndex = localId.x;
  var selected = 0u;
  if (localIndex < elementCount && flags[FLAGS_OFFSET + firstIndex + localIndex] != 0u) {
    selected = 1u;
  }
  prefixes[localIndex] = selected;
  workgroupBarrier();

  var step = 1u;
  loop {
    if (step >= ${RANGE_COMPACTION_WORKGROUP_SIZE}u) {
      break;
    }
    var addend = 0u;
    if (localIndex >= step) {
      addend = prefixes[localIndex - step];
    }
    workgroupBarrier();
    prefixes[localIndex] += addend;
    workgroupBarrier();
    step *= 2u;
  }

  if (localIndex < elementCount) {
    localOffsets[LOCAL_OFFSETS_OFFSET + firstIndex + localIndex] =
      prefixes[localIndex] - selected;
  }
  if (localIndex == 0u) {
    var selectedCount = 0u;
    if (elementCount != 0u) {
      selectedCount = prefixes[elementCount - 1u];
    }
    rangeCounts[RANGE_COUNTS_OFFSET + rangeId] = selectedCount;
  }
}`;
  addIndirectPass(graph, {
    id: passId,
    source,
    views: {
      flags: compaction.flags,
      ranges: compaction.ranges,
      activeRangeIds: compaction.activeRangeIds,
      localOffsets,
      rangeCounts
    },
    resources: [
      {buffer: compaction.flags, usage: 'storage-read'},
      {buffer: compaction.ranges, usage: 'storage-read'},
      {buffer: compaction.activeRangeIds, usage: 'storage-read'},
      {buffer: localOffsets, usage: 'storage-write'},
      {buffer: rangeCounts, usage: 'storage-write'}
    ],
    dispatchBuffer: compaction.activeRangeDispatch
  });
}

function addScatterPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  compaction: GPUIndexedRangeCompaction,
  localOffsets: GraphDataView<'uint32'>,
  rangeOffsets: GraphDataView<'uint32'>
): void {
  const {rangeLayout} = compaction;
  const passId = `${compaction.id}-scatter`;
  const source = /* wgsl */ `
const RANGE_COUNT: u32 = ${compaction.rangeCount}u;
const RANGE_WORD_STRIDE: u32 = ${rangeLayout.wordStride}u;
const RANGE_FIRST_WORD: u32 = ${rangeLayout.firstIndexWordOffset}u;
const RANGE_COUNT_WORD: u32 = ${rangeLayout.countWordOffset}u;
const FLAGS_OFFSET: u32 = ${getViewElementOffset(compaction.flags)}u;
const RANGES_OFFSET: u32 = ${getViewElementOffset(compaction.ranges)}u;
const ACTIVE_RANGE_IDS_OFFSET: u32 = ${getViewElementOffset(compaction.activeRangeIds)}u;
const LOCAL_OFFSETS_OFFSET: u32 = ${getViewElementOffset(localOffsets)}u;
const RANGE_OFFSETS_OFFSET: u32 = ${getViewElementOffset(rangeOffsets)}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(compaction.output)}u;
@group(0) @binding(0) var<storage, read> flags: array<u32>;
@group(0) @binding(1) var<storage, read> ranges: array<u32>;
@group(0) @binding(2) var<storage, read> activeRangeIds: array<u32>;
@group(0) @binding(3) var<storage, read> localOffsets: array<u32>;
@group(0) @binding(4) var<storage, read> rangeOffsets: array<u32>;
@group(0) @binding(5) var<storage, read_write> outputIds: array<u32>;

@compute @workgroup_size(${RANGE_COMPACTION_WORKGROUP_SIZE})
fn main(
  @builtin(local_invocation_id) localId: vec3<u32>,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  let rangeId = activeRangeIds[ACTIVE_RANGE_IDS_OFFSET + workgroupId.y];
  if (rangeId >= RANGE_COUNT) {
    return;
  }
  let recordOffset = RANGES_OFFSET + rangeId * RANGE_WORD_STRIDE;
  let firstIndex = ranges[recordOffset + RANGE_FIRST_WORD];
  let elementCount = ranges[recordOffset + RANGE_COUNT_WORD];
  let localIndex = localId.x;
  if (localIndex >= elementCount) {
    return;
  }
  let sourceIndex = firstIndex + localIndex;
  if (flags[FLAGS_OFFSET + sourceIndex] != 0u) {
    let outputIndex = rangeOffsets[RANGE_OFFSETS_OFFSET + rangeId] +
      localOffsets[LOCAL_OFFSETS_OFFSET + sourceIndex];
    outputIds[OUTPUT_OFFSET + outputIndex] = sourceIndex;
  }
}`;
  addIndirectPass(graph, {
    id: passId,
    source,
    views: {
      flags: compaction.flags,
      ranges: compaction.ranges,
      activeRangeIds: compaction.activeRangeIds,
      localOffsets,
      rangeOffsets,
      outputIds: compaction.output
    },
    resources: [
      {buffer: compaction.flags, usage: 'storage-read'},
      {buffer: compaction.ranges, usage: 'storage-read'},
      {buffer: compaction.activeRangeIds, usage: 'storage-read'},
      {buffer: localOffsets, usage: 'storage-read'},
      {buffer: rangeOffsets, usage: 'storage-read'},
      {buffer: compaction.output, usage: 'storage-write'}
    ],
    dispatchBuffer: compaction.activeRangeDispatch
  });
}

function addCountPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  id: string,
  rangeCounts: GraphDataView<'uint32'>,
  rangeOffsets: GraphDataView<'uint32'>,
  count: GraphDataView<'uint32'>
): void {
  const passId = `${id}-publish-count`;
  const source = /* wgsl */ `
const LAST_RANGE_INDEX: u32 = ${rangeCounts.length - 1}u;
const RANGE_COUNTS_OFFSET: u32 = ${getViewElementOffset(rangeCounts)}u;
const RANGE_OFFSETS_OFFSET: u32 = ${getViewElementOffset(rangeOffsets)}u;
const COUNT_OFFSET: u32 = ${getViewElementOffset(count)}u;
@group(0) @binding(0) var<storage, read> rangeCounts: array<u32>;
@group(0) @binding(1) var<storage, read> rangeOffsets: array<u32>;
@group(0) @binding(2) var<storage, read_write> outputCount: array<u32>;
@compute @workgroup_size(1)
fn main() {
  outputCount[COUNT_OFFSET] = rangeOffsets[RANGE_OFFSETS_OFFSET + LAST_RANGE_INDEX] +
    rangeCounts[RANGE_COUNTS_OFFSET + LAST_RANGE_INDEX];
}`;
  addDirectPass(graph, {
    id: passId,
    source,
    views: {rangeCounts, rangeOffsets, outputCount: count},
    resources: [
      {buffer: rangeCounts, usage: 'storage-read'},
      {buffer: rangeOffsets, usage: 'storage-read'},
      {buffer: count, usage: 'storage-write'}
    ],
    dispatchCount: 1
  });
}

type RangePassResource = {
  buffer: GraphDataView;
  usage: 'storage-read' | 'storage-write';
};

function addDirectPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  props: {
    id: string;
    source: string;
    views: Record<string, GraphDataView>;
    resources: RangePassResource[];
    dispatchCount: number;
  }
): void {
  graph.addComputePass({
    id: props.id,
    resources: props.resources,
    compile: ({device}) => {
      const computation = makeComputation(device, props.id, props.source, props.views);
      return {
        encode: ({computePass, getBuffer}) => {
          computation.setBindings(resolveBindings(props.views, getBuffer));
          computation.dispatch(computePass, props.dispatchCount);
        },
        destroy: () => computation.destroy()
      };
    }
  });
}

function addIndirectPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  props: {
    id: string;
    source: string;
    views: Record<string, GraphDataView>;
    resources: RangePassResource[];
    dispatchBuffer: GraphBufferHandle;
  }
): void {
  graph.addComputePass({
    id: props.id,
    resources: [...props.resources, {buffer: props.dispatchBuffer, usage: 'indirect' as const}],
    compile: ({device}) => {
      const computation = makeComputation(device, props.id, props.source, props.views);
      return {
        encode: ({computePass, getBuffer}) => {
          computation.setBindings(resolveBindings(props.views, getBuffer));
          computation.dispatchIndirect(computePass, getBuffer(props.dispatchBuffer));
        },
        destroy: () => computation.destroy()
      };
    }
  });
}

function makeComputation(
  device: Device,
  id: string,
  source: string,
  views: Record<string, GraphDataView>
): Computation {
  return new Computation(device, {
    id,
    source,
    shaderLayout: {
      bindings: Object.keys(views).map((name, location) => ({
        name,
        type: 'storage' as const,
        group: 0,
        location
      }))
    }
  });
}

function resolveBindings(
  views: Record<string, GraphDataView>,
  getBuffer: (handle: GraphBufferHandle | GraphDataView) => Buffer
): Record<string, Binding> {
  const bindings: Record<string, Binding> = {};
  for (const [name, view] of Object.entries(views)) {
    bindings[name] = getViewBinding(view, getBuffer);
  }
  return bindings;
}
