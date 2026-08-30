// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {type Binding, Buffer, type Device} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import {GPUCommandGraph, type GraphBufferHandle, type GraphDataView} from './gpu-command-graph';
import {
  createTransientView,
  doGraphDataViewsOverlap,
  getViewBinding,
  getViewElementOffset,
  validatePackedUint32View
} from './graph-data-view-utils';
import {
  getGPUShaderSubgroupStrategy,
  getSubgroupBallotHelpersWGSL,
  getSubgroupCoalescedAtomicAddWGSL
} from './gpu-subgroup-utils';

const CHUNKED_SCATTER_WORKGROUP_SIZE = 256;
const PORTABLE_WORKGROUPS_PER_DIMENSION = 65_535;
const MAXIMUM_ROUTE_COUNT = 16;
const UINT32_BYTE_LENGTH = Uint32Array.BYTES_PER_ELEMENT;

/** Packed source-aligned route-record layout consumed by chunked indexed scatter. */
export type GPUChunkedIndexedScatterRouteLayout = {
  /** Number of uint32 words in one source route record. */
  wordStride: number;
  /** First word containing a route value. */
  firstRouteWordOffset: number;
  /** Number of consecutive route values emitted for each selected source. */
  routeCount: number;
};

/** Properties for routing GPU-compacted source IDs into bounded destination chunks. */
export type GPUChunkedIndexedScatterProps = {
  /** Prefix for generated resources and graph nodes. */
  id?: string;
  /** GPU-compacted stable source IDs. */
  sourceIds: GraphDataView<'uint32'>;
  /** GPU-resident selected source count. */
  sourceCount: GraphDataView<'uint32'>;
  /** Source-aligned packed route records. */
  routes: GraphDataView<'uint32'>;
  /** Packed route-record layout. */
  routeLayout: GPUChunkedIndexedScatterRouteLayout;
  /** Exclusive ordered ends of contiguous chunks beginning at zero. */
  chunkEnds: readonly number[];
  /** Destination for encoded `sourceId * routeCount + routeIndex` jobs. */
  output: GraphDataView<'uint32'>;
};

/** GPU-generated routing metadata exposed to one consumer per destination chunk. */
export type GPUChunkedIndexedScatterResult = {
  /** Routed job count for each chunk. */
  chunkCounts: GraphDataView<'uint32'>;
  /** Exclusive output offset for each chunk. */
  chunkOffsets: GraphDataView<'uint32'>;
  /** One three-word indirect compute dispatch command per chunk. */
  dispatchCommands: GraphDataView<'uint32'>;
};

/**
 * Routes compacted stable source IDs into contiguous destination chunks entirely on the GPU.
 *
 * Every selected source contributes a fixed number of route values. Values are mapped through
 * ordered exclusive chunk ends, counted with workgroup-local atomics, assigned contiguous chunk
 * ranges, and scattered as encoded source/route jobs. Output order within a chunk is unspecified.
 */
export class GPUChunkedIndexedScatter {
  readonly id: string;
  readonly sourceIds: GraphDataView<'uint32'>;
  readonly sourceCount: GraphDataView<'uint32'>;
  readonly routes: GraphDataView<'uint32'>;
  readonly routeLayout: GPUChunkedIndexedScatterRouteLayout;
  readonly chunkEnds: readonly number[];
  readonly output: GraphDataView<'uint32'>;

  constructor(props: GPUChunkedIndexedScatterProps) {
    this.id = props.id ?? 'gpu-chunked-indexed-scatter';
    this.sourceIds = props.sourceIds;
    this.sourceCount = props.sourceCount;
    this.routes = props.routes;
    this.routeLayout = props.routeLayout;
    this.chunkEnds = props.chunkEnds;
    this.output = props.output;

    for (const [name, view] of [
      ['sourceIds', this.sourceIds],
      ['sourceCount', this.sourceCount],
      ['routes', this.routes],
      ['output', this.output]
    ] as const) {
      validatePackedUint32View(view, `${this.id} ${name}`);
    }
    validateRouteLayout(this.id, this.routeLayout);
    validateChunkEnds(this.id, this.chunkEnds);
    if (this.sourceCount.length < 1) {
      throw new Error(`${this.id} sourceCount must contain one uint32 row`);
    }
    if (this.routes.length < this.sourceIds.length * this.routeLayout.wordStride) {
      throw new Error(`${this.id} routes must contain one record per source ID capacity`);
    }
    const outputLength = this.sourceIds.length * this.routeLayout.routeCount;
    if (!Number.isSafeInteger(outputLength) || outputLength > 0xffffffff) {
      throw new Error(`${this.id} encoded job domain exceeds uint32 capacity`);
    }
    if (this.output.length < outputLength) {
      throw new Error(`${this.id} output must contain sourceIds.length * routeCount rows`);
    }
    for (const input of [this.sourceIds, this.sourceCount, this.routes]) {
      if (doGraphDataViewsOverlap(input, this.output)) {
        throw new Error(`${this.id} output must not overlap source inputs`);
      }
    }
  }

  /** Adds route initialization, counting, prefix publication, and indirect scatter passes. */
  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): GPUChunkedIndexedScatterResult {
    for (const view of [this.sourceIds, this.sourceCount, this.routes, this.output]) {
      if (view.buffer.graph !== graph) {
        throw new Error(`${this.id} views must belong to the target graph`);
      }
    }

    const chunkCount = this.chunkEnds.length;
    const chunkState: GraphDataView<'uint32'> = createTransientView(
      graph,
      `${this.id}-chunk-state`,
      'uint32',
      chunkCount * 3
    );
    const chunkCounts: GraphDataView<'uint32'> = graph.createDataView(chunkState.buffer, {
      format: 'uint32',
      length: chunkCount
    });
    const chunkOffsets: GraphDataView<'uint32'> = graph.createDataView(chunkState.buffer, {
      format: 'uint32',
      length: chunkCount,
      byteOffset: chunkCount * UINT32_BYTE_LENGTH
    });
    const dispatchCommands: GraphDataView<'uint32'> = createTransientView(
      graph,
      `${this.id}-dispatch-commands`,
      'uint32',
      chunkCount * 3,
      Buffer.STORAGE | Buffer.INDIRECT
    );
    const sourceDispatchCommand: GraphDataView<'uint32'> = createTransientView(
      graph,
      `${this.id}-source-dispatch-command`,
      'uint32',
      3,
      Buffer.STORAGE | Buffer.INDIRECT
    );

    addInitializePass(graph, this, chunkState, sourceDispatchCommand);
    addCountPass(graph, this, chunkState, sourceDispatchCommand.buffer);
    addPublishPass(graph, this, chunkState, dispatchCommands);
    addScatterPass(graph, this, chunkState, sourceDispatchCommand.buffer);
    return {chunkCounts, chunkOffsets, dispatchCommands};
  }
}

function validateRouteLayout(id: string, layout: GPUChunkedIndexedScatterRouteLayout): void {
  if (!Number.isSafeInteger(layout.wordStride) || layout.wordStride < 1) {
    throw new Error(`${id} routeLayout.wordStride must be a positive safe integer`);
  }
  if (
    !Number.isSafeInteger(layout.routeCount) ||
    layout.routeCount < 1 ||
    layout.routeCount > MAXIMUM_ROUTE_COUNT
  ) {
    throw new Error(`${id} routeLayout.routeCount must be between 1 and 16`);
  }
  if (
    !Number.isSafeInteger(layout.firstRouteWordOffset) ||
    layout.firstRouteWordOffset < 0 ||
    layout.firstRouteWordOffset + layout.routeCount > layout.wordStride
  ) {
    throw new Error(`${id} routeLayout route words must fit inside one record`);
  }
}

function validateChunkEnds(id: string, chunkEnds: readonly number[]): void {
  if (chunkEnds.length < 1 || chunkEnds.length > CHUNKED_SCATTER_WORKGROUP_SIZE) {
    throw new Error(`${id} chunkEnds must contain between 1 and 256 entries`);
  }
  let previousEnd = 0;
  for (const chunkEnd of chunkEnds) {
    if (!Number.isSafeInteger(chunkEnd) || chunkEnd <= previousEnd || chunkEnd > 0xffffffff) {
      throw new Error(`${id} chunkEnds must be strictly increasing uint32 values`);
    }
    previousEnd = chunkEnd;
  }
}

function getRouteDeclarations(scatter: GPUChunkedIndexedScatter): string {
  const chunkEnds = scatter.chunkEnds.map(chunkEnd => `${chunkEnd}u`).join(', ');
  return `const SOURCE_CAPACITY: u32 = ${scatter.sourceIds.length}u;
const ROUTE_WORD_STRIDE: u32 = ${scatter.routeLayout.wordStride}u;
const FIRST_ROUTE_WORD: u32 = ${scatter.routeLayout.firstRouteWordOffset}u;
const ROUTE_COUNT: u32 = ${scatter.routeLayout.routeCount}u;
const CHUNK_COUNT: u32 = ${scatter.chunkEnds.length}u;
const INVALID_CHUNK_INDEX: u32 = 0xffffffffu;
const CHUNK_ENDS = array<u32, ${scatter.chunkEnds.length}>(${chunkEnds});

fn getChunkIndex(routeValue: u32) -> u32 {
  for (var chunkIndex = 0u; chunkIndex < CHUNK_COUNT; chunkIndex++) {
    if (routeValue < CHUNK_ENDS[chunkIndex]) {
      return chunkIndex;
    }
  }
  return INVALID_CHUNK_INDEX;
}`;
}

function addInitializePass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  scatter: GPUChunkedIndexedScatter,
  chunkState: GraphDataView<'uint32'>,
  sourceDispatchCommand: GraphDataView<'uint32'>
): void {
  const source = /* wgsl */ `
const SOURCE_CAPACITY: u32 = ${scatter.sourceIds.length}u;
const CHUNK_STATE_LENGTH: u32 = ${chunkState.length}u;
const SOURCE_COUNT_OFFSET: u32 = ${getViewElementOffset(scatter.sourceCount)}u;
const CHUNK_STATE_OFFSET: u32 = ${getViewElementOffset(chunkState)}u;
const DISPATCH_OFFSET: u32 = ${getViewElementOffset(sourceDispatchCommand)}u;
@group(0) @binding(0) var<storage, read> sourceCount: array<u32>;
@group(0) @binding(1) var<storage, read_write> chunkState: array<atomic<u32>>;
@group(0) @binding(2) var<storage, read_write> sourceDispatchCommand: array<u32>;

@compute @workgroup_size(${CHUNKED_SCATTER_WORKGROUP_SIZE})
fn main(@builtin(global_invocation_id) globalId: vec3<u32>) {
  if (globalId.x < CHUNK_STATE_LENGTH) {
    atomicStore(&chunkState[CHUNK_STATE_OFFSET + globalId.x], 0u);
  }
  if (globalId.x == 0u) {
    let count = min(sourceCount[SOURCE_COUNT_OFFSET], SOURCE_CAPACITY);
    let workgroupCount =
      (count + ${CHUNKED_SCATTER_WORKGROUP_SIZE - 1}u) / ${CHUNKED_SCATTER_WORKGROUP_SIZE}u;
    var workgroupCountX = 0u;
    var workgroupCountY = 1u;
    if (workgroupCount > 0u) {
      workgroupCountX = min(workgroupCount, ${PORTABLE_WORKGROUPS_PER_DIMENSION}u);
      workgroupCountY = (workgroupCount + workgroupCountX - 1u) / workgroupCountX;
    }
    sourceDispatchCommand[DISPATCH_OFFSET] = workgroupCountX;
    sourceDispatchCommand[DISPATCH_OFFSET + 1u] = workgroupCountY;
    sourceDispatchCommand[DISPATCH_OFFSET + 2u] = 1u;
  }
}`;
  addDirectPass(graph, {
    id: `${scatter.id}-initialize`,
    source,
    views: {sourceCount: scatter.sourceCount, chunkState, sourceDispatchCommand},
    resources: [
      {buffer: scatter.sourceCount, usage: 'storage-read'},
      {buffer: chunkState, usage: 'storage-write'},
      {buffer: sourceDispatchCommand, usage: 'storage-write'}
    ],
    dispatchCount: Math.ceil(chunkState.length / CHUNKED_SCATTER_WORKGROUP_SIZE)
  });
}

function addCountPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  scatter: GPUChunkedIndexedScatter,
  chunkState: GraphDataView<'uint32'>,
  sourceDispatchCommand: GraphBufferHandle
): void {
  const useSubgroups =
    scatter.chunkEnds.length <= MAXIMUM_ROUTE_COUNT &&
    getGPUShaderSubgroupStrategy(graph.device) === 'subgroups';
  const source = /* wgsl */ `
${useSubgroups ? 'enable subgroups;' : ''}
${getRouteDeclarations(scatter)}
const SOURCE_IDS_OFFSET: u32 = ${getViewElementOffset(scatter.sourceIds)}u;
const SOURCE_COUNT_OFFSET: u32 = ${getViewElementOffset(scatter.sourceCount)}u;
const ROUTES_OFFSET: u32 = ${getViewElementOffset(scatter.routes)}u;
const CHUNK_STATE_OFFSET: u32 = ${getViewElementOffset(chunkState)}u;
@group(0) @binding(0) var<storage, read> sourceIds: array<u32>;
@group(0) @binding(1) var<storage, read> sourceCount: array<u32>;
@group(0) @binding(2) var<storage, read> routes: array<u32>;
@group(0) @binding(3) var<storage, read_write> chunkState: array<atomic<u32>>;
var<workgroup> localChunkCounts: array<atomic<u32>, ${scatter.chunkEnds.length}>;
${useSubgroups ? getSubgroupBallotHelpersWGSL() : ''}

@compute @workgroup_size(${CHUNKED_SCATTER_WORKGROUP_SIZE})
fn main(
  @builtin(local_invocation_id) localId: vec3<u32>,
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(num_workgroups) workgroupCount: vec3<u32>${useSubgroups ? ',\n  @builtin(subgroup_invocation_id) subgroupInvocationId: u32' : ''}
) {
  if (localId.x < CHUNK_COUNT) {
    atomicStore(&localChunkCounts[localId.x], 0u);
  }
  workgroupBarrier();

${
  useSubgroups
    ? `  let count = min(sourceCount[SOURCE_COUNT_OFFSET], SOURCE_CAPACITY);
  let workgroupIndex =
    (workgroupId.z * workgroupCount.y + workgroupId.y) * workgroupCount.x + workgroupId.x;
  let sourceListIndex =
    workgroupIndex * ${CHUNKED_SCATTER_WORKGROUP_SIZE}u + localId.x;
  var routeRecordOffset = 0u;
  var routeAccepted = false;
  if (sourceListIndex < count) {
    let sourceId = sourceIds[SOURCE_IDS_OFFSET + sourceListIndex];
    routeAccepted = sourceId < SOURCE_CAPACITY;
    routeRecordOffset = ROUTES_OFFSET + sourceId * ROUTE_WORD_STRIDE + FIRST_ROUTE_WORD;
  }
  for (var routeIndex = 0u; routeIndex < ROUTE_COUNT; routeIndex++) {
    var chunkIndex = INVALID_CHUNK_INDEX;
    if (routeAccepted) {
      chunkIndex = getChunkIndex(routes[routeRecordOffset + routeIndex]);
    }
${getSubgroupCoalescedAtomicAddWGSL(
  'chunkIndex != INVALID_CHUNK_INDEX',
  'chunkIndex',
  'localChunkCounts',
  scatter.chunkEnds.length
)}
  }`
    : `  let count = min(sourceCount[SOURCE_COUNT_OFFSET], SOURCE_CAPACITY);
  let workgroupIndex =
    (workgroupId.z * workgroupCount.y + workgroupId.y) * workgroupCount.x + workgroupId.x;
  let sourceListIndex =
    workgroupIndex * ${CHUNKED_SCATTER_WORKGROUP_SIZE}u + localId.x;
  if (sourceListIndex < count) {
    let sourceId = sourceIds[SOURCE_IDS_OFFSET + sourceListIndex];
    if (sourceId < SOURCE_CAPACITY) {
      let routeRecordOffset = ROUTES_OFFSET + sourceId * ROUTE_WORD_STRIDE + FIRST_ROUTE_WORD;
      for (var routeIndex = 0u; routeIndex < ROUTE_COUNT; routeIndex++) {
        let chunkIndex = getChunkIndex(routes[routeRecordOffset + routeIndex]);
        if (chunkIndex != INVALID_CHUNK_INDEX) {
          atomicAdd(&localChunkCounts[chunkIndex], 1u);
        }
      }
    }
  }`
}
  workgroupBarrier();

  if (localId.x < CHUNK_COUNT) {
    atomicAdd(
      &chunkState[CHUNK_STATE_OFFSET + localId.x],
      atomicLoad(&localChunkCounts[localId.x])
    );
  }
}`;
  addIndirectPass(graph, {
    id: `${scatter.id}-count`,
    source,
    views: {
      sourceIds: scatter.sourceIds,
      sourceCount: scatter.sourceCount,
      routes: scatter.routes,
      chunkState
    },
    resources: [
      {buffer: scatter.sourceIds, usage: 'storage-read'},
      {buffer: scatter.sourceCount, usage: 'storage-read'},
      {buffer: scatter.routes, usage: 'storage-read'},
      {buffer: chunkState, usage: 'storage-read-write'}
    ],
    dispatchBuffer: sourceDispatchCommand
  });
}

function addPublishPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  scatter: GPUChunkedIndexedScatter,
  chunkState: GraphDataView<'uint32'>,
  dispatchCommands: GraphDataView<'uint32'>
): void {
  const chunkCount = scatter.chunkEnds.length;
  const source = /* wgsl */ `
const CHUNK_COUNT: u32 = ${chunkCount}u;
const OFFSET_BASE: u32 = ${chunkCount}u;
const CURSOR_BASE: u32 = ${chunkCount * 2}u;
const CHUNK_STATE_OFFSET: u32 = ${getViewElementOffset(chunkState)}u;
const DISPATCH_OFFSET: u32 = ${getViewElementOffset(dispatchCommands)}u;
@group(0) @binding(0) var<storage, read_write> chunkState: array<atomic<u32>>;
@group(0) @binding(1) var<storage, read_write> dispatchCommands: array<u32>;

@compute @workgroup_size(1)
fn main() {
  var offset = 0u;
  for (var chunkIndex = 0u; chunkIndex < CHUNK_COUNT; chunkIndex++) {
    let count = atomicLoad(&chunkState[CHUNK_STATE_OFFSET + chunkIndex]);
    atomicStore(&chunkState[CHUNK_STATE_OFFSET + OFFSET_BASE + chunkIndex], offset);
    atomicStore(&chunkState[CHUNK_STATE_OFFSET + CURSOR_BASE + chunkIndex], offset);
    let dispatchIndex = DISPATCH_OFFSET + chunkIndex * 3u;
    dispatchCommands[dispatchIndex] =
      (count + ${CHUNKED_SCATTER_WORKGROUP_SIZE - 1}u) / ${CHUNKED_SCATTER_WORKGROUP_SIZE}u;
    dispatchCommands[dispatchIndex + 1u] = 1u;
    dispatchCommands[dispatchIndex + 2u] = 1u;
    offset += count;
  }
}`;
  addDirectPass(graph, {
    id: `${scatter.id}-publish`,
    source,
    views: {chunkState, dispatchCommands},
    resources: [
      {buffer: chunkState, usage: 'storage-read-write'},
      {buffer: dispatchCommands, usage: 'storage-write'}
    ],
    dispatchCount: 1
  });
}

function addScatterPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  scatter: GPUChunkedIndexedScatter,
  chunkState: GraphDataView<'uint32'>,
  sourceDispatchCommand: GraphBufferHandle
): void {
  const chunkCount = scatter.chunkEnds.length;
  const useSubgroups =
    chunkCount <= MAXIMUM_ROUTE_COUNT && getGPUShaderSubgroupStrategy(graph.device) === 'subgroups';
  const source = /* wgsl */ `
${useSubgroups ? 'enable subgroups;' : ''}
${getRouteDeclarations(scatter)}
const CURSOR_BASE: u32 = ${chunkCount * 2}u;
const SOURCE_IDS_OFFSET: u32 = ${getViewElementOffset(scatter.sourceIds)}u;
const SOURCE_COUNT_OFFSET: u32 = ${getViewElementOffset(scatter.sourceCount)}u;
const ROUTES_OFFSET: u32 = ${getViewElementOffset(scatter.routes)}u;
const CHUNK_STATE_OFFSET: u32 = ${getViewElementOffset(chunkState)}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(scatter.output)}u;
@group(0) @binding(0) var<storage, read> sourceIds: array<u32>;
@group(0) @binding(1) var<storage, read> sourceCount: array<u32>;
@group(0) @binding(2) var<storage, read> routes: array<u32>;
@group(0) @binding(3) var<storage, read_write> chunkState: array<atomic<u32>>;
@group(0) @binding(4) var<storage, read_write> outputJobs: array<u32>;
var<workgroup> localChunkCounts: array<atomic<u32>, ${chunkCount}>;
var<workgroup> chunkOutputBases: array<u32, ${chunkCount}>;
${useSubgroups ? getSubgroupBallotHelpersWGSL() : ''}

@compute @workgroup_size(${CHUNKED_SCATTER_WORKGROUP_SIZE})
fn main(
  @builtin(local_invocation_id) localId: vec3<u32>,
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(num_workgroups) workgroupCount: vec3<u32>${useSubgroups ? ',\n  @builtin(subgroup_invocation_id) subgroupInvocationId: u32' : ''}
) {
  if (localId.x < CHUNK_COUNT) {
    atomicStore(&localChunkCounts[localId.x], 0u);
  }
  workgroupBarrier();

  var routeChunks: array<u32, ${scatter.routeLayout.routeCount}>;
  var routeLocalOffsets: array<u32, ${scatter.routeLayout.routeCount}>;
  for (var routeIndex = 0u; routeIndex < ROUTE_COUNT; routeIndex++) {
    routeChunks[routeIndex] = INVALID_CHUNK_INDEX;
    routeLocalOffsets[routeIndex] = 0u;
  }
  var sourceId = 0u;
  let count = min(sourceCount[SOURCE_COUNT_OFFSET], SOURCE_CAPACITY);
  let workgroupIndex =
    (workgroupId.z * workgroupCount.y + workgroupId.y) * workgroupCount.x + workgroupId.x;
  let sourceListIndex =
    workgroupIndex * ${CHUNKED_SCATTER_WORKGROUP_SIZE}u + localId.x;
${
  useSubgroups
    ? `  var routeRecordOffset = 0u;
  var routeAccepted = false;
  if (sourceListIndex < count) {
    sourceId = sourceIds[SOURCE_IDS_OFFSET + sourceListIndex];
    routeAccepted = sourceId < SOURCE_CAPACITY;
    routeRecordOffset = ROUTES_OFFSET + sourceId * ROUTE_WORD_STRIDE + FIRST_ROUTE_WORD;
  }
  for (var routeIndex = 0u; routeIndex < ROUTE_COUNT; routeIndex++) {
    var chunkIndex = INVALID_CHUNK_INDEX;
    if (routeAccepted) {
      chunkIndex = getChunkIndex(routes[routeRecordOffset + routeIndex]);
    }
    routeChunks[routeIndex] = chunkIndex;
    var subgroupPending = chunkIndex != INVALID_CHUNK_INDEX;
    for (var subgroupChunk = 0u; subgroupChunk < CHUNK_COUNT; subgroupChunk++) {
      let pendingBallot = subgroupBallot(subgroupPending);
      let hasPending = any(pendingBallot != vec4<u32>(0u));
      let leaderInvocation = getFirstBallotLane(pendingBallot);
      let leaderChunk = subgroupShuffle(chunkIndex, leaderInvocation);
      let matchingChunk = hasPending && subgroupPending && chunkIndex == leaderChunk;
      let matchingBallot = subgroupBallot(matchingChunk);
      let matchingCount = getBallotLaneCount(matchingBallot);
      var subgroupBase = 0u;
      if (hasPending && subgroupInvocationId == leaderInvocation) {
        subgroupBase = atomicAdd(&localChunkCounts[leaderChunk], matchingCount);
      }
      subgroupBase = subgroupShuffle(subgroupBase, leaderInvocation);
      if (matchingChunk) {
        routeLocalOffsets[routeIndex] = subgroupBase +
          getBallotPrefixLaneCount(matchingBallot, subgroupInvocationId);
      }
      subgroupPending = subgroupPending && !matchingChunk;
    }
  }`
    : `  if (sourceListIndex < count) {
    sourceId = sourceIds[SOURCE_IDS_OFFSET + sourceListIndex];
    if (sourceId < SOURCE_CAPACITY) {
      let routeRecordOffset = ROUTES_OFFSET + sourceId * ROUTE_WORD_STRIDE + FIRST_ROUTE_WORD;
      for (var routeIndex = 0u; routeIndex < ROUTE_COUNT; routeIndex++) {
        let chunkIndex = getChunkIndex(routes[routeRecordOffset + routeIndex]);
        routeChunks[routeIndex] = chunkIndex;
        if (chunkIndex != INVALID_CHUNK_INDEX) {
          routeLocalOffsets[routeIndex] = atomicAdd(&localChunkCounts[chunkIndex], 1u);
        }
      }
    }
  }`
}
  workgroupBarrier();

  if (localId.x < CHUNK_COUNT) {
    chunkOutputBases[localId.x] = atomicAdd(
      &chunkState[CHUNK_STATE_OFFSET + CURSOR_BASE + localId.x],
      atomicLoad(&localChunkCounts[localId.x])
    );
  }
  workgroupBarrier();

  for (var routeIndex = 0u; routeIndex < ROUTE_COUNT; routeIndex++) {
    let chunkIndex = routeChunks[routeIndex];
    if (chunkIndex != INVALID_CHUNK_INDEX) {
      let outputIndex = chunkOutputBases[chunkIndex] + routeLocalOffsets[routeIndex];
      outputJobs[OUTPUT_OFFSET + outputIndex] = sourceId * ROUTE_COUNT + routeIndex;
    }
  }
}`;
  addIndirectPass(graph, {
    id: `${scatter.id}-scatter`,
    source,
    views: {
      sourceIds: scatter.sourceIds,
      sourceCount: scatter.sourceCount,
      routes: scatter.routes,
      chunkState,
      outputJobs: scatter.output
    },
    resources: [
      {buffer: scatter.sourceIds, usage: 'storage-read'},
      {buffer: scatter.sourceCount, usage: 'storage-read'},
      {buffer: scatter.routes, usage: 'storage-read'},
      {buffer: chunkState, usage: 'storage-read-write'},
      {buffer: scatter.output, usage: 'storage-write'}
    ],
    dispatchBuffer: sourceDispatchCommand
  });
}

type ChunkedScatterPassResource = {
  buffer: GraphDataView;
  usage: 'storage-read' | 'storage-write' | 'storage-read-write';
};

function addDirectPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  props: {
    id: string;
    source: string;
    views: Record<string, GraphDataView>;
    resources: ChunkedScatterPassResource[];
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
    resources: ChunkedScatterPassResource[];
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
