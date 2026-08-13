// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Binding} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import type {GPUCommandGraph, GraphDataView} from './gpu-command-graph';
import {getBoundedDispatchLayout, type GPUBoundedDispatchLayout} from './gpu-dispatch-utils';
import {
  getViewBinding,
  getViewElementOffset,
  validatePackedUint32View
} from './graph-data-view-utils';
import type {GPUSortDirection} from './gpu-sort';
import {getGPUShaderSubgroupStrategy} from './gpu-subgroup-utils';

const MAXIMUM_SEGMENT_LENGTH = 256;
const INVALID_INDEX = 0xffffffff;
const UINT32_MAXIMUM = 0xffffffff;

/** One independent stable sort domain within four caller-owned packed views. */
export type GPUSortSegment = {
  /** First key row, relative to the parent key view. */
  keysOffset: number;
  /** First payload row, relative to the parent payload view. */
  valuesOffset: number;
  /** First sorted-key destination row, relative to the parent output-key view. */
  outputKeysOffset: number;
  /** First sorted-payload destination row, relative to the parent output-payload view. */
  outputValuesOffset: number;
  /** Number of paired rows in this independent comparison domain, from zero through 256. */
  length: number;
};

/** Properties for one or more independent packed workgroup-local stable sorts. */
export type GPUSegmentedSortProps = {
  /** Prefix for the generated width-bucket graph nodes. */
  id?: string;
  /** Parent packed unsigned-key view. */
  keys: GraphDataView<'uint32'>;
  /** Parent packed unsigned-payload view. */
  values: GraphDataView<'uint32'>;
  /** Parent caller-owned sorted-key destination. */
  outputKeys: GraphDataView<'uint32'>;
  /** Parent caller-owned sorted-payload destination. */
  outputValues: GraphDataView<'uint32'>;
  /** CPU-known independent domains; offsets are relative to their corresponding parent views. */
  segments: readonly GPUSortSegment[];
  /** Requested stable order within every nonempty segment. Defaults to ascending. */
  direction?: GPUSortDirection;
};

/**
 * Stable independent sorting of many small domains within four shared packed buffers.
 *
 * @remarks
 * Each nonempty segment is sorted by a separate workgroup. Segments are grouped by their padded
 * power-of-two width, so any number of domains containing at most 256 rows require at most eight
 * graph nodes and eight dispatches. Gaps remain untouched, source data is never repacked, and all
 * four views remain caller-owned. Every generated shader uses four CORE WebGPU storage bindings.
 */
export class GPUSegmentedSort {
  /** Prefix for generated width-bucket graph nodes. */
  readonly id: string;
  /** Parent packed unsigned-key view. */
  readonly keys: GraphDataView<'uint32'>;
  /** Parent packed unsigned-payload view. */
  readonly values: GraphDataView<'uint32'>;
  /** Parent caller-owned sorted-key destination. */
  readonly outputKeys: GraphDataView<'uint32'>;
  /** Parent caller-owned sorted-payload destination. */
  readonly outputValues: GraphDataView<'uint32'>;
  /** Immutable snapshot of the independent source and destination domains. */
  readonly segments: readonly GPUSortSegment[];
  /** Stable order requested within each independent domain. */
  readonly direction: GPUSortDirection;

  /** Creates and validates packed independent workgroup-local sorting domains. */
  constructor(props: GPUSegmentedSortProps) {
    this.id = props.id ?? 'gpu-segmented-sort';
    this.keys = props.keys;
    this.values = props.values;
    this.outputKeys = props.outputKeys;
    this.outputValues = props.outputValues;
    this.direction = props.direction ?? 'ascending';

    for (const [name, view] of [
      ['keys', this.keys],
      ['values', this.values],
      ['outputKeys', this.outputKeys],
      ['outputValues', this.outputValues]
    ] as const) {
      validatePackedUint32View(view, `${this.id} ${name}`);
    }
    if (!['ascending', 'descending'].includes(this.direction)) {
      throw new Error(`${this.id} direction must be ascending or descending`);
    }
    if (
      this.outputKeys.buffer === this.outputValues.buffer ||
      this.outputKeys.buffer === this.keys.buffer ||
      this.outputKeys.buffer === this.values.buffer ||
      this.outputValues.buffer === this.keys.buffer ||
      this.outputValues.buffer === this.values.buffer
    ) {
      throw new Error(`${this.id} outputs must use separate buffers from inputs and each other`);
    }

    this.segments = props.segments.map((segment, segmentIndex) =>
      validateSegment(this, segment, segmentIndex)
    );
    validateDisjointOutputSegments(this.segments, 'outputKeysOffset', `${this.id} output keys`);
    validateDisjointOutputSegments(this.segments, 'outputValuesOffset', `${this.id} output values`);
  }

  /**
   * Records one compute graph node per occupied padded-width bucket.
   *
   * Empty segments produce no work. This method does not concatenate, compile, encode, submit,
   * upload, read back, or allocate physical GPU resources.
   */
  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    addGPUSegmentedSortToGraphWithDispatchLimit(
      this,
      graph,
      graph.device.limits.maxComputeWorkgroupsPerDimension
    );
  }
}

/** Adds independent stable local domains while propagating a bounded dispatch limit. @internal */
export function addGPUSegmentedSortToGraphWithDispatchLimit<Parameters>(
  sort: GPUSegmentedSort,
  graph: GPUCommandGraph<Parameters>,
  maxComputeWorkgroupsPerDimension: number
): void {
  for (const view of [sort.keys, sort.values, sort.outputKeys, sort.outputValues]) {
    if (view.buffer.graph !== graph) {
      throw new Error(`${sort.id} views must belong to the target graph`);
    }
  }

  const groups = groupSegmentsByWidth(sort.segments);
  const plans = Array.from(groups, ([width, segments]) => ({
    width,
    segments,
    dispatchLayout: getBoundedDispatchLayout(
      `${sort.id} ${width}-wide segments`,
      segments.length * width,
      width,
      maxComputeWorkgroupsPerDimension
    )
  }));

  for (const plan of plans) {
    addSegmentBucketPass(graph, sort, plan.width, plan.segments, plan.dispatchLayout);
  }
}

/** Validates and snapshots one source/output range against its corresponding parent view. */
function validateSegment(
  sort: GPUSegmentedSort,
  segment: GPUSortSegment,
  segmentIndex: number
): GPUSortSegment {
  const segmentName = `${sort.id} segment ${segmentIndex}`;
  if (
    !Number.isInteger(segment.length) ||
    segment.length < 0 ||
    segment.length > MAXIMUM_SEGMENT_LENGTH
  ) {
    throw new Error(`${segmentName} length must be an integer from 0 to ${MAXIMUM_SEGMENT_LENGTH}`);
  }

  for (const [offsetName, view] of [
    ['keysOffset', sort.keys],
    ['valuesOffset', sort.values],
    ['outputKeysOffset', sort.outputKeys],
    ['outputValuesOffset', sort.outputValues]
  ] as const) {
    const offset = segment[offsetName];
    if (!Number.isSafeInteger(offset) || offset < 0 || offset > UINT32_MAXIMUM) {
      throw new Error(`${segmentName} ${offsetName} must be a non-negative uint32`);
    }
    if (offset > view.length || segment.length > view.length - offset) {
      throw new Error(`${segmentName} ${offsetName} and length exceed the parent view`);
    }
  }

  return {
    keysOffset: segment.keysOffset,
    valuesOffset: segment.valuesOffset,
    outputKeysOffset: segment.outputKeysOffset,
    outputValuesOffset: segment.outputValuesOffset,
    length: segment.length
  };
}

/** Rejects output overlap while preserving every caller-owned byte between segments. */
function validateDisjointOutputSegments(
  segments: readonly GPUSortSegment[],
  offsetName: 'outputKeysOffset' | 'outputValuesOffset',
  name: string
): void {
  const populatedSegments = segments
    .filter(segment => segment.length > 0)
    .slice()
    .sort((left, right) => left[offsetName] - right[offsetName]);
  for (let index = 1; index < populatedSegments.length; index++) {
    const previous = populatedSegments[index - 1];
    const current = populatedSegments[index];
    if (current[offsetName] < previous[offsetName] + previous.length) {
      throw new Error(`${name} segments must not overlap`);
    }
  }
}

/** Buckets nonempty domains by their required CORE-compatible workgroup width. */
function groupSegmentsByWidth(segments: readonly GPUSortSegment[]): Map<number, GPUSortSegment[]> {
  const groups = new Map<number, GPUSortSegment[]>();
  for (const segment of segments) {
    if (segment.length === 0) {
      continue;
    }
    let width = 2;
    while (width < segment.length) {
      width *= 2;
    }
    const group = groups.get(width);
    if (group) {
      group.push(segment);
    } else {
      groups.set(width, [segment]);
    }
  }
  return new Map(
    Array.from(groups).sort(([firstWidth], [secondWidth]) => firstWidth - secondWidth)
  );
}

/** Records one complete stable sorting network for every equal-width segment workgroup. */
function addSegmentBucketPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  sort: GPUSegmentedSort,
  width: number,
  segments: readonly GPUSortSegment[],
  dispatchLayout: GPUBoundedDispatchLayout
): void {
  const descriptorSource = segments
    .map(
      segment =>
        `  SortSegment(${segment.keysOffset}u, ${segment.valuesOffset}u, ` +
        `${segment.outputKeysOffset}u, ${segment.outputValuesOffset}u, ${segment.length}u)`
    )
    .join(',\n');
  const descending = sort.direction === 'descending';
  const useSubgroups = getGPUShaderSubgroupStrategy(graph.device) === 'subgroups';
  const source = /* wgsl */ `
${useSubgroups ? 'enable subgroups;\nrequires subgroup_id;' : ''}
struct SortSegment {
  keysOffset: u32,
  valuesOffset: u32,
  outputKeysOffset: u32,
  outputValuesOffset: u32,
  length: u32,
};

const INVALID_INDEX: u32 = ${INVALID_INDEX}u;
const SEGMENT_COUNT: u32 = ${segments.length}u;
const KEYS_OFFSET: u32 = ${getViewElementOffset(sort.keys)}u;
const VALUES_OFFSET: u32 = ${getViewElementOffset(sort.values)}u;
const OUTPUT_KEYS_OFFSET: u32 = ${getViewElementOffset(sort.outputKeys)}u;
const OUTPUT_VALUES_OFFSET: u32 = ${getViewElementOffset(sort.outputValues)}u;
const SEGMENTS: array<SortSegment, ${segments.length}> = array<SortSegment, ${segments.length}>(
${descriptorSource}
);

@group(0) @binding(0) var<storage, read> keys: array<u32>;
@group(0) @binding(1) var<storage, read> values: array<u32>;
@group(0) @binding(2) var<storage, read_write> outputKeys: array<u32>;
@group(0) @binding(3) var<storage, read_write> outputValues: array<u32>;
var<workgroup> indices: array<u32, ${width}>;
var<workgroup> cachedKeys: array<u32, ${width}>;

fn comes_before(leftIndex: u32, rightIndex: u32, length: u32) -> bool {
  let leftValid = leftIndex != INVALID_INDEX && leftIndex < length;
  let rightValid = rightIndex != INVALID_INDEX && rightIndex < length;
  if (leftValid != rightValid) { return leftValid; }
  if (!leftValid) { return false; }
  let leftKey = cachedKeys[leftIndex];
  let rightKey = cachedKeys[rightIndex];
  if (leftKey == rightKey) { return leftIndex < rightIndex; }
  return ${descending ? 'leftKey > rightKey' : 'leftKey < rightKey'};
}

@compute @workgroup_size(${width}) fn main(
  ${useSubgroups ? '@builtin(subgroup_invocation_id) subgroupInvocationId: u32,\n  @builtin(subgroup_size) subgroupSize: u32,\n  @builtin(subgroup_id) subgroupId: u32,' : '@builtin(local_invocation_index) localInvocationIndex: u32,'}
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  let segmentIndex =
    (workgroupId.z * ${dispatchLayout.y}u + workgroupId.y) * ${dispatchLayout.x}u + workgroupId.x;
  if (segmentIndex >= SEGMENT_COUNT) { return; }
  let segment = SEGMENTS[segmentIndex];
${useSubgroups ? getSubgroupSegmentedBitonicShader(width) : getPortableSegmentedBitonicShader(width)}
}`;
  const identifier = `${sort.id}-bitonic-local-${width}`;
  const bindingViews: Record<string, GraphDataView> = {
    keys: sort.keys,
    values: sort.values,
    outputKeys: sort.outputKeys,
    outputValues: sort.outputValues
  };
  graph.addComputePass({
    id: identifier,
    resources: [
      {buffer: sort.keys, usage: 'storage-read'},
      {buffer: sort.values, usage: 'storage-read'},
      {buffer: sort.outputKeys, usage: 'storage-write'},
      {buffer: sort.outputValues, usage: 'storage-write'}
    ],
    compile: ({device}) => {
      const computation = new Computation(device, {
        id: identifier,
        source,
        shaderLayout: {
          bindings: Object.keys(bindingViews).map((name, location) => ({
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
          for (const [name, view] of Object.entries(bindingViews)) {
            bindings[name] = getViewBinding(view, getBuffer);
          }
          computation.setBindings(bindings);
          computation.dispatch(computePass, dispatchLayout.x, dispatchLayout.y, dispatchLayout.z);
        },
        destroy: () => computation.destroy()
      };
    }
  });
}

/** Emits the portable shared-memory network retained for CORE devices. */
function getPortableSegmentedBitonicShader(width: number): string {
  return /* wgsl */ `
  indices[localInvocationIndex] = select(
    INVALID_INDEX,
    localInvocationIndex,
    localInvocationIndex < segment.length
  );
  if (localInvocationIndex < segment.length) {
    cachedKeys[localInvocationIndex] =
      keys[KEYS_OFFSET + segment.keysOffset + localInvocationIndex];
  } else {
    cachedKeys[localInvocationIndex] = 0u;
  }
  workgroupBarrier();

  for (var blockWidth = 2u; blockWidth <= ${width}u; blockWidth <<= 1u) {
    for (var compareStride = blockWidth >> 1u; compareStride > 0u; compareStride >>= 1u) {
      let partnerIndex = localInvocationIndex ^ compareStride;
      if (partnerIndex > localInvocationIndex) {
        let leftIndex = indices[localInvocationIndex];
        let rightIndex = indices[partnerIndex];
        let ascending = (localInvocationIndex & blockWidth) == 0u;
        let shouldSwap = select(
          comes_before(leftIndex, rightIndex, segment.length),
          comes_before(rightIndex, leftIndex, segment.length),
          ascending
        );
        indices[localInvocationIndex] = select(leftIndex, rightIndex, shouldSwap);
        indices[partnerIndex] = select(rightIndex, leftIndex, shouldSwap);
      }
      workgroupBarrier();
    }
  }

  if (localInvocationIndex < segment.length) {
    let sourceIndex = indices[localInvocationIndex];
    outputKeys[OUTPUT_KEYS_OFFSET + segment.outputKeysOffset + localInvocationIndex] =
      cachedKeys[sourceIndex];
    outputValues[OUTPUT_VALUES_OFFSET + segment.outputValuesOffset + localInvocationIndex] =
      values[VALUES_OFFSET + segment.valuesOffset + sourceIndex];
  }`;
}

/** Keeps subgroup-local compare/exchange stages in registers and synchronizes only cross-subgroup stages. */
function getSubgroupSegmentedBitonicShader(width: number): string {
  return /* wgsl */ `
  let lane = subgroupId * subgroupSize + subgroupInvocationId;
  var currentIndex = select(INVALID_INDEX, lane, lane < segment.length);
  if (lane < segment.length) {
    cachedKeys[lane] = keys[KEYS_OFFSET + segment.keysOffset + lane];
  } else {
    cachedKeys[lane] = 0u;
  }
  workgroupBarrier();

  for (var blockWidth = 2u; blockWidth <= ${width}u; blockWidth <<= 1u) {
    for (var compareStride = blockWidth >> 1u; compareStride > 0u; compareStride >>= 1u) {
      var partnerIndex = INVALID_INDEX;
      if (compareStride < subgroupSize) {
        partnerIndex = subgroupShuffleXor(currentIndex, compareStride);
      } else {
        indices[lane] = currentIndex;
        workgroupBarrier();
        partnerIndex = indices[lane ^ compareStride];
      }

      let lowerLane = (lane & compareStride) == 0u;
      let leftIndex = select(partnerIndex, currentIndex, lowerLane);
      let rightIndex = select(currentIndex, partnerIndex, lowerLane);
      let ascending = (lane & blockWidth) == 0u;
      let shouldSwap = select(
        comes_before(leftIndex, rightIndex, segment.length),
        comes_before(rightIndex, leftIndex, segment.length),
        ascending
      );
      let sortedLeft = select(leftIndex, rightIndex, shouldSwap);
      let sortedRight = select(rightIndex, leftIndex, shouldSwap);
      currentIndex = select(sortedRight, sortedLeft, lowerLane);

      if (compareStride >= subgroupSize) {
        workgroupBarrier();
      }
    }
  }

  if (lane < segment.length) {
    outputKeys[OUTPUT_KEYS_OFFSET + segment.outputKeysOffset + lane] = cachedKeys[currentIndex];
    outputValues[OUTPUT_VALUES_OFFSET + segment.outputValuesOffset + lane] =
      values[VALUES_OFFSET + segment.valuesOffset + currentIndex];
  }`;
}
