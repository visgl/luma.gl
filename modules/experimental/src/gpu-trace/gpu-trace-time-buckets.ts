// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {type Binding} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import {
  GPUCommandGraph,
  GraphDataView,
  GraphVectorView,
  type GPUCommandGraphContributor,
  type GraphBufferUse
} from '../gpu-core/gpu-command-graph';
import {
  getBoundedDispatchLayout,
  getBoundedInvocationIndexSource,
  type GPUBoundedDispatchLayout
} from '../gpu-core/gpu-dispatch-utils';
import {
  doGraphDataViewsOverlap,
  getViewBinding,
  getViewElementOffset,
  validateMatchingVectorTopology,
  validatePackedUint32View,
  validatePackedView
} from '../gpu-core/graph-data-view-utils';
import type {GPUTraceAggregationColumn} from './gpu-trace-aggregation';

const TIME_BUCKET_WORKGROUP_SIZE = 256;
const UINT32_BYTE_LENGTH = Uint32Array.BYTES_PER_ELEMENT;

/** Minimal interval columns accepted by {@link GPUTraceTimeBuckets}. */
export type GPUTraceTimeBucketSource = {
  /** Source-aligned span start times. */
  startTimes: GPUTraceAggregationColumn<'float32'>;
  /** Source-aligned nonnegative span durations. */
  durations: GPUTraceAggregationColumn<'float32'>;
};

/** Literal or caller-owned dynamic trace-time domain. */
export type GPUTraceTimeBucketDomain = readonly [number, number] | GraphDataView<'float32'>;

/** Optional derived occupancy series produced after interval accumulation. */
export type GPUTraceTimeBucketOccupancy = {
  /** Number of logical lanes represented by the source. */
  laneCount: number;
  /** Mean number of concurrently occupied lanes in each bucket. */
  averageConcurrencyOutput: GraphDataView<'float32'>;
  /** Occupied lane-time divided by total lane-time capacity, clamped to `[0, 1]`. */
  laneUtilizationOutput: GraphDataView<'float32'>;
  /** Remaining lane-time capacity in each bucket. */
  idleLaneTimeOutput: GraphDataView<'float32'>;
};

/** Properties for one graph-native trace-time profile. */
export type GPUTraceTimeBucketsProps = {
  /** Prefix for generated command-graph node IDs. */
  id?: string;
  /** Canonical trace interval columns. */
  trace: GPUTraceTimeBucketSource;
  /** Inclusive trace-time domain partitioned into equal-width buckets. */
  domain: GPUTraceTimeBucketDomain;
  /** Optional source-aligned zero/nonzero selection. */
  selection?: GPUTraceAggregationColumn<'uint32'>;
  /** Intersecting-span counts. Its length defines the time-bucket count. */
  countOutput: GraphDataView<'uint32'>;
  /** Sum of span duration clipped to each bucket. */
  durationOutput: GraphDataView<'float32'>;
  /** Optional derived concurrency, lane utilization, and idle lane-time outputs. */
  occupancy?: GPUTraceTimeBucketOccupancy;
};

/**
 * Accumulates trace intervals into equal-width trace-time buckets.
 *
 * Each accepted span contributes once to every bucket it intersects. Counts therefore describe
 * interval occupancy rather than start events, while duration output contains the exact overlap
 * between the span and each bucket. The contributor preserves source chunks, declares graph work
 * only, and leaves output submission and readback policy to the caller.
 */
export class GPUTraceTimeBuckets implements GPUCommandGraphContributor {
  /** Prefix for generated graph nodes. */
  readonly id: string;
  /** Canonical source interval columns. */
  readonly trace: GPUTraceTimeBucketSource;
  /** Inclusive trace-time domain. */
  readonly domain: GPUTraceTimeBucketDomain;
  /** Optional source-aligned selection. */
  readonly selection?: GPUTraceAggregationColumn<'uint32'>;
  /** Intersecting-span counts. */
  readonly countOutput: GraphDataView<'uint32'>;
  /** Clipped duration sums. */
  readonly durationOutput: GraphDataView<'float32'>;
  /** Optional derived occupancy outputs. */
  readonly occupancy?: GPUTraceTimeBucketOccupancy;

  constructor(props: GPUTraceTimeBucketsProps) {
    this.id = props.id ?? 'gpu-trace-time-buckets';
    this.trace = props.trace;
    this.domain = props.domain;
    this.selection = props.selection;
    this.countOutput = props.countOutput;
    this.durationOutput = props.durationOutput;
    this.occupancy = props.occupancy;

    validateScalarColumn(this.trace.startTimes, 'float32', `${this.id} startTimes`);
    validateScalarColumn(this.trace.durations, 'float32', `${this.id} durations`);
    validateMatchingColumns(
      this.trace.startTimes,
      this.trace.durations,
      `${this.id} startTimes and durations`
    );
    if (this.selection) {
      validateScalarColumn(this.selection, 'uint32', `${this.id} selection`);
      validateMatchingColumns(this.trace.startTimes, this.selection, `${this.id} selection`);
    }
    validatePackedUint32View(this.countOutput, `${this.id} countOutput`);
    validatePackedView(this.durationOutput, ['float32'], `${this.id} durationOutput`);
    if (this.countOutput.length === 0 || this.durationOutput.length !== this.countOutput.length) {
      throw new Error(`${this.id} outputs must contain the same positive bucket count`);
    }
    if (this.occupancy) {
      if (!Number.isSafeInteger(this.occupancy.laneCount) || this.occupancy.laneCount <= 0) {
        throw new Error(`${this.id} occupancy laneCount must be a positive safe integer`);
      }
      const occupancyOutputs = [
        this.occupancy.averageConcurrencyOutput,
        this.occupancy.laneUtilizationOutput,
        this.occupancy.idleLaneTimeOutput
      ];
      occupancyOutputs.forEach((output, outputIndex) => {
        validatePackedView(output, ['float32'], `${this.id} occupancy output ${outputIndex}`);
        if (output.length !== this.countOutput.length) {
          throw new Error(`${this.id} occupancy outputs must match the time-bucket count`);
        }
      });
      const derivedViews = [this.durationOutput, ...occupancyOutputs];
      for (let firstIndex = 0; firstIndex < derivedViews.length; firstIndex++) {
        for (let secondIndex = firstIndex + 1; secondIndex < derivedViews.length; secondIndex++) {
          if (doGraphDataViewsOverlap(derivedViews[firstIndex], derivedViews[secondIndex])) {
            throw new Error(`${this.id} duration and occupancy outputs must not overlap`);
          }
        }
      }
    }
    if (this.domain instanceof GraphDataView) {
      validatePackedView(this.domain, ['float32'], `${this.id} domain`);
      if (this.domain.length !== 2) {
        throw new Error(`${this.id} GPU domain must contain two float32 rows`);
      }
    } else if (
      !Number.isFinite(this.domain[0]) ||
      !Number.isFinite(this.domain[1]) ||
      this.domain[1] <= this.domain[0]
    ) {
      throw new Error(`${this.id} domain must be a finite increasing pair`);
    }
    const sourceViews = [
      ...getColumnChunks(this.trace.startTimes),
      ...getColumnChunks(this.trace.durations),
      ...(this.selection ? getColumnChunks(this.selection) : [])
    ];
    if (
      sourceViews.some(view => view.buffer === this.countOutput.buffer) ||
      sourceViews.some(view => view.buffer === this.durationOutput.buffer) ||
      (this.domain instanceof GraphDataView &&
        (this.domain.buffer === this.countOutput.buffer ||
          this.domain.buffer === this.durationOutput.buffer))
    ) {
      throw new Error(`${this.id} source and output buffers must be separate`);
    }
  }

  /** Adds output initialization and one bounded accumulation pass per non-empty source chunk. */
  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    const startTimeChunks = getColumnChunks(this.trace.startTimes);
    const durationChunks = getColumnChunks(this.trace.durations);
    const selectionChunks = this.selection ? getColumnChunks(this.selection) : undefined;
    if (
      startTimeChunks.some(view => view.buffer.graph !== graph) ||
      durationChunks.some(view => view.buffer.graph !== graph) ||
      selectionChunks?.some(view => view.buffer.graph !== graph) ||
      (this.domain instanceof GraphDataView && this.domain.buffer.graph !== graph) ||
      this.countOutput.buffer.graph !== graph ||
      this.durationOutput.buffer.graph !== graph ||
      (this.occupancy &&
        [
          this.occupancy.averageConcurrencyOutput,
          this.occupancy.laneUtilizationOutput,
          this.occupancy.idleLaneTimeOutput
        ].some(view => view.buffer.graph !== graph))
    ) {
      throw new Error(`${this.id} views must belong to the target graph`);
    }

    addClearTimeBucketsPass(graph, this.id, this.countOutput, this.durationOutput);
    for (let chunkIndex = 0; chunkIndex < startTimeChunks.length; chunkIndex++) {
      const startTimes = startTimeChunks[chunkIndex];
      if (startTimes.length === 0) continue;
      addAccumulateTimeBucketsPass(graph, {
        id:
          this.trace.startTimes instanceof GraphVectorView
            ? `${this.id}-chunk-${chunkIndex}`
            : this.id,
        startTimes,
        durations: durationChunks[chunkIndex],
        selection: selectionChunks?.[chunkIndex],
        countOutput: this.countOutput,
        durationOutput: this.durationOutput,
        domain: this.domain,
        dispatchLayout: getTimeBucketDispatchLayout(graph, startTimes.length)
      });
    }
    if (this.occupancy) {
      addDeriveTimeBucketOccupancyPass(graph, {
        id: this.id,
        domain: this.domain,
        durationOutput: this.durationOutput,
        occupancy: this.occupancy
      });
    }
  }
}

function getColumnChunks<T extends 'uint32' | 'float32'>(
  column: GPUTraceAggregationColumn<T>
): readonly GraphDataView<T>[] {
  return column instanceof GraphVectorView ? column.data : [column];
}

function validateScalarColumn<T extends 'uint32' | 'float32'>(
  column: GPUTraceAggregationColumn<T>,
  format: T,
  name: string
): void {
  for (const [chunkIndex, view] of getColumnChunks(column).entries()) {
    if (
      view.format !== format ||
      view.rowByteLength !== UINT32_BYTE_LENGTH ||
      view.byteStride < UINT32_BYTE_LENGTH ||
      view.byteStride % UINT32_BYTE_LENGTH !== 0 ||
      view.byteOffset % UINT32_BYTE_LENGTH !== 0
    ) {
      throw new Error(`${name} chunk ${chunkIndex} must be a uint32-aligned scalar ${format} view`);
    }
  }
}

function validateMatchingColumns(
  first: GPUTraceAggregationColumn<'uint32' | 'float32'>,
  second: GPUTraceAggregationColumn<'uint32' | 'float32'>,
  name: string
): void {
  if (first instanceof GraphVectorView !== second instanceof GraphVectorView) {
    throw new Error(`${name} must use the same view kind`);
  }
  if (first instanceof GraphVectorView && second instanceof GraphVectorView) {
    validateMatchingVectorTopology(first, second, name);
  } else if (first.length !== second.length) {
    throw new Error(`${name} must have matching lengths`);
  }
}

function getScalarStride(view: GraphDataView): number {
  return view.byteStride / UINT32_BYTE_LENGTH;
}

function addClearTimeBucketsPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  id: string,
  countOutput: GraphDataView<'uint32'>,
  durationOutput: GraphDataView<'float32'>
): void {
  const dispatchLayout = getTimeBucketDispatchLayout(graph, countOutput.length);
  const sharedOutputBuffer = countOutput.buffer === durationOutput.buffer;
  const sharedOutputView = sharedOutputBuffer
    ? graph.createDataView(countOutput.buffer, {
        format: 'uint32',
        length: Math.floor(countOutput.buffer.byteLength / UINT32_BYTE_LENGTH)
      })
    : undefined;
  const outputBindings = sharedOutputBuffer
    ? '@group(0) @binding(0) var<storage, read_write> outputValues: array<atomic<u32>>;'
    : `@group(0) @binding(0) var<storage, read_write> outputCounts: array<atomic<u32>>;
@group(0) @binding(1) var<storage, read_write> outputDurations: array<atomic<u32>>;`;
  const countTarget = sharedOutputBuffer ? 'outputValues' : 'outputCounts';
  const durationTarget = sharedOutputBuffer ? 'outputValues' : 'outputDurations';
  const source = /* wgsl */ `
const BUCKET_COUNT: u32 = ${countOutput.length}u;
const COUNT_OFFSET: u32 = ${sharedOutputBuffer ? countOutput.byteOffset / UINT32_BYTE_LENGTH : getViewElementOffset(countOutput)}u;
const DURATION_OFFSET: u32 = ${sharedOutputBuffer ? durationOutput.byteOffset / UINT32_BYTE_LENGTH : getViewElementOffset(durationOutput)}u;
${outputBindings}

@compute @workgroup_size(${TIME_BUCKET_WORKGROUP_SIZE}) fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${getBoundedInvocationIndexSource(dispatchLayout, TIME_BUCKET_WORKGROUP_SIZE)}
  if (index < BUCKET_COUNT) {
    atomicStore(&${countTarget}[COUNT_OFFSET + index], 0u);
    atomicStore(&${durationTarget}[DURATION_OFFSET + index], 0u);
  }
}`;
  addComputationPass(graph, {
    id: `${id}-clear`,
    source,
    resources: sharedOutputBuffer
      ? [{buffer: sharedOutputView!, usage: 'storage-write'}]
      : [
          {buffer: countOutput, usage: 'storage-write'},
          {buffer: durationOutput, usage: 'storage-write'}
        ],
    bindings: sharedOutputBuffer
      ? {outputValues: sharedOutputView!}
      : {outputCounts: countOutput, outputDurations: durationOutput},
    dispatchLayout
  });
}

function addAccumulateTimeBucketsPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  props: {
    id: string;
    startTimes: GraphDataView<'float32'>;
    durations: GraphDataView<'float32'>;
    selection?: GraphDataView<'uint32'>;
    countOutput: GraphDataView<'uint32'>;
    durationOutput: GraphDataView<'float32'>;
    domain: GPUTraceTimeBucketDomain;
    dispatchLayout: GPUBoundedDispatchLayout;
  }
): void {
  const gpuDomain = props.domain instanceof GraphDataView;
  const literalDomain = props.domain as readonly [number, number];
  const domainBinding = gpuDomain
    ? '@group(0) @binding(2) var<storage, read> domainValues: array<f32>;'
    : '';
  const selectionBindingIndex = gpuDomain ? 3 : 2;
  const selectionBinding = props.selection
    ? `@group(0) @binding(${selectionBindingIndex}) var<storage, read> selectionMask: array<u32>;`
    : '';
  const countBinding = selectionBindingIndex + Number(Boolean(props.selection));
  const sharedOutputBuffer = props.countOutput.buffer === props.durationOutput.buffer;
  const sharedOutputView = sharedOutputBuffer
    ? graph.createDataView(props.countOutput.buffer, {
        format: 'uint32',
        length: Math.floor(props.countOutput.buffer.byteLength / UINT32_BYTE_LENGTH)
      })
    : undefined;
  const outputBindings = sharedOutputBuffer
    ? `@group(0) @binding(${countBinding}) var<storage, read_write> outputValues: array<atomic<u32>>;`
    : `@group(0) @binding(${countBinding}) var<storage, read_write> outputCounts: array<atomic<u32>>;
@group(0) @binding(${countBinding + 1}) var<storage, read_write> outputDurations: array<atomic<u32>>;`;
  const countTarget = sharedOutputBuffer ? 'outputValues' : 'outputCounts';
  const durationTarget = sharedOutputBuffer ? 'outputValues' : 'outputDurations';
  const selectionCondition = props.selection
    ? `selectionMask[${getViewElementOffset(props.selection)}u + index * ${getScalarStride(props.selection)}u] != 0u`
    : 'true';
  const source = /* wgsl */ `
const ELEMENT_COUNT: u32 = ${props.startTimes.length}u;
const BUCKET_COUNT: u32 = ${props.countOutput.length}u;
${gpuDomain ? `const DOMAIN_OFFSET: u32 = ${getViewElementOffset(props.domain as GraphDataView)}u;` : ''}
const START_OFFSET: u32 = ${getViewElementOffset(props.startTimes)}u;
const DURATION_INPUT_OFFSET: u32 = ${getViewElementOffset(props.durations)}u;
const START_STRIDE: u32 = ${getScalarStride(props.startTimes)}u;
const DURATION_INPUT_STRIDE: u32 = ${getScalarStride(props.durations)}u;
const COUNT_OUTPUT_OFFSET: u32 = ${sharedOutputBuffer ? props.countOutput.byteOffset / UINT32_BYTE_LENGTH : getViewElementOffset(props.countOutput)}u;
const DURATION_OUTPUT_OFFSET: u32 = ${sharedOutputBuffer ? props.durationOutput.byteOffset / UINT32_BYTE_LENGTH : getViewElementOffset(props.durationOutput)}u;
@group(0) @binding(0) var<storage, read> inputStartTimes: array<f32>;
@group(0) @binding(1) var<storage, read> inputDurations: array<f32>;
${domainBinding}
${selectionBinding}
${outputBindings}

fn atomicAddFloat(destination: ptr<storage, atomic<u32>, read_write>, value: f32) {
  var oldBits = atomicLoad(destination);
  loop {
    let newBits = bitcast<u32>(bitcast<f32>(oldBits) + value);
    let result = atomicCompareExchangeWeak(destination, oldBits, newBits);
    if (result.exchanged) { break; }
    oldBits = result.old_value;
  }
}

@compute @workgroup_size(${TIME_BUCKET_WORKGROUP_SIZE}) fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${getBoundedInvocationIndexSource(props.dispatchLayout, TIME_BUCKET_WORKGROUP_SIZE)}
  if (index >= ELEMENT_COUNT || !(${selectionCondition})) { return; }
  let domainMinimum = ${gpuDomain ? 'domainValues[DOMAIN_OFFSET]' : toWgslFloat(literalDomain[0])};
  let domainMaximum = ${gpuDomain ? 'domainValues[DOMAIN_OFFSET + 1u]' : toWgslFloat(literalDomain[1])};
  let bucketDuration = (domainMaximum - domainMinimum) / f32(BUCKET_COUNT);
  if (!(domainMaximum > domainMinimum)) { return; }
  let start = inputStartTimes[START_OFFSET + index * START_STRIDE];
  let duration = inputDurations[DURATION_INPUT_OFFSET + index * DURATION_INPUT_STRIDE];
  let end = start + duration;
  let finiteInterval = start == start && duration == duration && duration >= 0.0 &&
    abs(start) <= 3.402823466e+38 && abs(duration) <= 3.402823466e+38;
  if (!finiteInterval || end <= domainMinimum || start >= domainMaximum) { return; }

  let firstBucket = min(u32(max(floor((start - domainMinimum) / bucketDuration), 0.0)), BUCKET_COUNT - 1u);
  let lastTime = max(start, end - max(abs(end), 1.0) * 1e-7);
  let lastBucket = min(u32(max(floor((lastTime - domainMinimum) / bucketDuration), 0.0)), BUCKET_COUNT - 1u);
  for (var bucketIndex = firstBucket; bucketIndex <= lastBucket; bucketIndex++) {
    let bucketStart = domainMinimum + f32(bucketIndex) * bucketDuration;
    let bucketEnd = bucketStart + bucketDuration;
    let overlap = max(0.0, min(end, bucketEnd) - max(start, bucketStart));
    if (overlap > 0.0) {
      atomicAdd(&${countTarget}[COUNT_OUTPUT_OFFSET + bucketIndex], 1u);
      atomicAddFloat(&${durationTarget}[DURATION_OUTPUT_OFFSET + bucketIndex], overlap);
    }
  }
}`;
  addComputationPass(graph, {
    id: `${props.id}-accumulate`,
    source,
    resources: [
      {buffer: props.startTimes, usage: 'storage-read'},
      {buffer: props.durations, usage: 'storage-read'},
      ...(gpuDomain
        ? ([{buffer: props.domain as GraphDataView, usage: 'storage-read'}] as GraphBufferUse[])
        : []),
      ...(props.selection
        ? ([{buffer: props.selection, usage: 'storage-read'}] as GraphBufferUse[])
        : []),
      {
        buffer: sharedOutputView ?? props.countOutput,
        usage: 'storage-read-write'
      },
      ...(sharedOutputBuffer
        ? []
        : ([{buffer: props.durationOutput, usage: 'storage-read-write'}] as GraphBufferUse[]))
    ],
    bindings: {
      inputStartTimes: props.startTimes,
      inputDurations: props.durations,
      ...(gpuDomain ? {domainValues: props.domain as GraphDataView} : {}),
      ...(props.selection ? {selectionMask: props.selection} : {}),
      ...(sharedOutputBuffer
        ? {outputValues: sharedOutputView!}
        : {outputCounts: props.countOutput, outputDurations: props.durationOutput})
    },
    dispatchLayout: props.dispatchLayout
  });
}

/** Derives normalized occupancy without reading clipped duration sums back to JavaScript. */
function addDeriveTimeBucketOccupancyPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  props: {
    id: string;
    domain: GPUTraceTimeBucketDomain;
    durationOutput: GraphDataView<'float32'>;
    occupancy: GPUTraceTimeBucketOccupancy;
  }
): void {
  const outputViews = [
    props.durationOutput,
    props.occupancy.averageConcurrencyOutput,
    props.occupancy.laneUtilizationOutput,
    props.occupancy.idleLaneTimeOutput
  ];
  const uniqueBufferViews: GraphDataView<'uint32'>[] = [];
  const bufferNames = outputViews.map(view => {
    let bufferIndex = uniqueBufferViews.findIndex(candidate => candidate.buffer === view.buffer);
    if (bufferIndex < 0) {
      bufferIndex = uniqueBufferViews.length;
      uniqueBufferViews.push(
        graph.createDataView(view.buffer, {
          format: 'uint32',
          length: Math.floor(view.buffer.byteLength / UINT32_BYTE_LENGTH)
        })
      );
    }
    return `bucketValues${bufferIndex}`;
  });
  const gpuDomain = props.domain instanceof GraphDataView;
  const literalDomain = props.domain as readonly [number, number];
  const domainBinding = gpuDomain
    ? '@group(0) @binding(0) var<storage, read> domainValues: array<f32>;'
    : '';
  const firstOutputBinding = Number(gpuDomain);
  const outputBindings = uniqueBufferViews
    .map(
      (_, bufferIndex) =>
        `@group(0) @binding(${firstOutputBinding + bufferIndex}) var<storage, read_write> bucketValues${bufferIndex}: array<u32>;`
    )
    .join('\n');
  const dispatchLayout = getTimeBucketDispatchLayout(graph, props.durationOutput.length);
  const source = /* wgsl */ `
const BUCKET_COUNT: u32 = ${props.durationOutput.length}u;
const LANE_COUNT: f32 = ${toWgslFloat(props.occupancy.laneCount)};
const DURATION_OFFSET: u32 = ${props.durationOutput.byteOffset / UINT32_BYTE_LENGTH}u;
const CONCURRENCY_OFFSET: u32 = ${props.occupancy.averageConcurrencyOutput.byteOffset / UINT32_BYTE_LENGTH}u;
const UTILIZATION_OFFSET: u32 = ${props.occupancy.laneUtilizationOutput.byteOffset / UINT32_BYTE_LENGTH}u;
const IDLE_OFFSET: u32 = ${props.occupancy.idleLaneTimeOutput.byteOffset / UINT32_BYTE_LENGTH}u;
${gpuDomain ? `const DOMAIN_OFFSET: u32 = ${getViewElementOffset(props.domain as GraphDataView)}u;` : ''}
${domainBinding}
${outputBindings}

@compute @workgroup_size(${TIME_BUCKET_WORKGROUP_SIZE}) fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${getBoundedInvocationIndexSource(dispatchLayout, TIME_BUCKET_WORKGROUP_SIZE)}
  if (index >= BUCKET_COUNT) { return; }
  let domainMinimum = ${gpuDomain ? 'domainValues[DOMAIN_OFFSET]' : toWgslFloat(literalDomain[0])};
  let domainMaximum = ${gpuDomain ? 'domainValues[DOMAIN_OFFSET + 1u]' : toWgslFloat(literalDomain[1])};
  let bucketDuration = max((domainMaximum - domainMinimum) / f32(BUCKET_COUNT), 0.0);
  let laneTimeCapacity = bucketDuration * LANE_COUNT;
  let occupiedLaneTime = bitcast<f32>(${bufferNames[0]}[DURATION_OFFSET + index]);
  let averageConcurrency = select(0.0, occupiedLaneTime / bucketDuration, bucketDuration > 0.0);
  let laneUtilization = select(0.0, clamp(occupiedLaneTime / laneTimeCapacity, 0.0, 1.0), laneTimeCapacity > 0.0);
  ${bufferNames[1]}[CONCURRENCY_OFFSET + index] = bitcast<u32>(averageConcurrency);
  ${bufferNames[2]}[UTILIZATION_OFFSET + index] = bitcast<u32>(laneUtilization);
  ${bufferNames[3]}[IDLE_OFFSET + index] = bitcast<u32>(max(laneTimeCapacity - occupiedLaneTime, 0.0));
}`;
  const bindings: Record<string, GraphDataView> = {
    ...(gpuDomain ? {domainValues: props.domain as GraphDataView} : {})
  };
  uniqueBufferViews.forEach((view, bufferIndex) => {
    bindings[`bucketValues${bufferIndex}`] = view;
  });
  addComputationPass(graph, {
    id: `${props.id}-derive-occupancy`,
    source,
    resources: [
      ...(gpuDomain
        ? ([{buffer: props.domain as GraphDataView, usage: 'storage-read'}] as GraphBufferUse[])
        : []),
      ...uniqueBufferViews.map(view => ({buffer: view, usage: 'storage-read-write' as const}))
    ],
    bindings,
    dispatchLayout
  });
}

function addComputationPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  props: {
    id: string;
    source: string;
    resources: GraphBufferUse[];
    bindings: Record<string, GraphDataView>;
    dispatchLayout: GPUBoundedDispatchLayout;
  }
): void {
  const maximumWorkgroupCount =
    props.dispatchLayout.x * props.dispatchLayout.y * props.dispatchLayout.z;
  graph.addComputePass({
    id: props.id,
    resources: props.resources,
    workload: {
      operation: 'GPUTraceTimeBuckets',
      commandCount: 1,
      maximumWorkgroupCount,
      maximumInvocationCount: maximumWorkgroupCount * TIME_BUCKET_WORKGROUP_SIZE
    },
    compile: ({device}) => {
      const computation = new Computation(device, {
        id: props.id,
        source: props.source,
        shaderLayout: {
          bindings: Object.keys(props.bindings).map((name, location) => ({
            name,
            type: 'storage' as const,
            group: 0,
            location
          }))
        }
      });
      return {
        encode: ({computePass, getBuffer}) => {
          const bindings: Record<string, Binding> = {};
          for (const [name, view] of Object.entries(props.bindings)) {
            bindings[name] = getViewBinding(view, getBuffer);
          }
          computation.setBindings(bindings);
          computation.dispatch(
            computePass,
            props.dispatchLayout.x,
            props.dispatchLayout.y,
            props.dispatchLayout.z
          );
        },
        destroy: () => computation.destroy()
      };
    }
  });
}

function getTimeBucketDispatchLayout<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  elementCount: number
): GPUBoundedDispatchLayout {
  return getBoundedDispatchLayout(
    'GPUTraceTimeBuckets',
    elementCount,
    TIME_BUCKET_WORKGROUP_SIZE,
    graph.device.limits.maxComputeWorkgroupsPerDimension
  );
}

function toWgslFloat(value: number): string {
  return Number.isInteger(value) ? `${value}.0` : String(value);
}
