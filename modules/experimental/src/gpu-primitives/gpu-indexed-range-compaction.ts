// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {type Binding, type Buffer, type Device} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import {GPUCommandGraph, type GraphBufferHandle, type GraphDataView} from './gpu-command-graph';
import {GPUScan} from './gpu-scan';
import {
  createTransientView,
  getViewBinding,
  getViewElementOffset,
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
    const rangeCounts = createTransientView(
      graph,
      `${this.id}-range-counts`,
      'uint32',
      this.rangeCount
    );
    const rangeOffsets = createTransientView(
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
