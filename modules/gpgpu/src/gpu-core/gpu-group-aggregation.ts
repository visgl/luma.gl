// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {alignGraphVectorViews} from './graph-vector-view-utils';

import {type GPUCommandNode, createGPUComputeCommandNode} from './gpu-command-node';
import {type Binding} from '@luma.gl/core';
import {Kernel} from '@luma.gl/engine';
import {
  GPUCommandGraph,
  GraphVectorView,
  type GraphBufferUse,
  type GraphDataView
} from './gpu-command-graph';
import {
  getBoundedDispatchLayout,
  getBoundedInvocationIndexSource,
  type GPUBoundedDispatchLayout
} from './gpu-dispatch-utils';
import {
  createTransientView,
  getViewBinding,
  getViewElementOffset,
  validatePackedView,
  validatePackedUint32View
} from './graph-data-view-utils';
import {
  getGPUShaderSubgroupStrategy,
  getSubgroupBallotHelpersWGSL,
  getSubgroupCoalescedAtomicAddWGSL
} from './gpu-subgroup-utils';

const GROUP_AGGREGATION_WORKGROUP_SIZE = 256;
const MAXIMUM_LOCAL_GROUP_COUNT = 256;
const MAXIMUM_SUBGROUP_COALESCED_GROUP_COUNT = 16;
const UINT32_BYTE_LENGTH = Uint32Array.BYTES_PER_ELEMENT;
/** Rows loaded, sorted, and reduced together by one floating-point sum workgroup iteration. */
const SUM_TILE_ROW_COUNT = GROUP_AGGREGATION_WORKGROUP_SIZE;
/** Smallest number of row tiles reduced by one floating-point sum workgroup. */
const MINIMUM_SUM_TILES_PER_WORKGROUP = 16;
/** Target number of per-workgroup partials per group statistic before row ranges grow. */
const TARGET_SUM_PARTIAL_COUNT = 1 << 20;
/** WebGPU's guaranteed `maxComputeWorkgroupStorageSize`, used when a device reports no limit. */
const MINIMUM_WORKGROUP_STORAGE_BYTE_LENGTH = 16384;
/** Workgroup bytes used by the sort keys, staged values, and scan values and counts of one tile. */
const SUM_TILE_WORKGROUP_BYTE_LENGTH = 4 * SUM_TILE_ROW_COUNT * UINT32_BYTE_LENGTH;
/** Largest workgroup-memory group accumulator, small enough to keep several workgroups resident. */
const MAXIMUM_WORKGROUP_ACCUMULATOR_BYTE_LENGTH = 8192;
/** Sort keys reserve 8 low bits for the tile lane. */
const MAXIMUM_SUM_GROUP_COUNT = 0xffffff;

type GPUGroupAggregationDispatchLayout = GPUBoundedDispatchLayout;
type GPUGroupOrderedOperation = 'min' | 'max';
type GPUGroupSumOperation = 'sum' | 'mean';

/** One scalar group-key chunk or an ordered vector of scalar group-key chunks. */
export type GPUGroupAggregationKeys = GraphDataView<'uint32'> | GraphVectorView<'uint32'>;

/** Optional nonzero/zero row selection with the same logical length as the group keys. */
export type GPUGroupAggregationMask = GraphDataView<'uint32'> | GraphVectorView<'uint32'>;

/** Optional floating-point contributions with the same logical length as the group keys. */
export type GPUGroupAggregationValues = GraphDataView<'float32'> | GraphVectorView<'float32'>;

/** Statistic computed by {@link GPUGroupAggregation}. */
export type GPUGroupAggregationOperation = 'count' | 'sum' | 'min' | 'max' | 'mean';

type GPUGroupAggregationBaseProps = {
  /** Prefix for generated graph node IDs. */
  id?: string;
  /** Dense unsigned group keys. Keys outside the output range are ignored. */
  keys: GPUGroupAggregationKeys;
  /** Optional nonzero/zero selection with the same logical length as `keys`; chunk boundaries may differ. */
  mask?: GPUGroupAggregationMask;
};

/** Properties for graph-native dense group aggregation. */
export type GPUGroupAggregationProps = GPUGroupAggregationBaseProps &
  (
    | {
        /** Caller-owned counts. Its length defines the valid group-key range. */
        output: GraphDataView<'uint32'>;
        /** Row count is the default operation and does not consume values. */
        operation?: 'count';
        values?: never;
      }
    | {
        /** One finite floating-point contribution per key with equal logical length. */
        values: GPUGroupAggregationValues;
        /** Caller-owned floating-point group statistics. */
        output: GraphDataView<'float32'>;
        /** Floating-point statistic to compute. */
        operation: Exclude<GPUGroupAggregationOperation, 'count'>;
      }
  );

/**
 * Aggregates dense unsigned group keys, optionally restricted by a GPU-resident row selection.
 *
 * Inputs may be packed or interleaved scalar columns. Output is cleared on every encoding. Group
 * keys in `[0, output.length)` identify output rows;
 * larger keys are ignored. Nonzero mask values include a row. Count uses unsigned atomics, and
 * minimum and maximum use ordered float bits. Vector inputs retain their source chunk boundaries
 * without packing.
 *
 * Sum and mean use a deterministic two-pass reduction without float atomics. Each workgroup reduces
 * a fixed row range into one column of per-group partials in graph-owned scratch, by sorting each
 * 256-row tile by group and running a fixed-shape segmented scan. A second pass sums each group's
 * partials in a fixed tree order. The same inputs, chunking, and device give bitwise-identical
 * results on every run.
 */
export class GPUGroupAggregation {
  /** Prefix for generated graph node IDs. */
  readonly id: string;
  /** Packed group keys or ordered group-key vector. */
  readonly keys: GPUGroupAggregationKeys;
  /** Optional packed values with the same logical length as keys. */
  readonly values?: GPUGroupAggregationValues;
  /** Caller-owned dense group result. */
  readonly output: GraphDataView<'uint32'> | GraphDataView<'float32'>;
  /** Optional source-aligned row selection. */
  readonly mask?: GPUGroupAggregationMask;
  /** Group statistic computed by this aggregation. */
  readonly operation: GPUGroupAggregationOperation;

  /** Creates and validates a dense group-aggregation description. */
  constructor(props: GPUGroupAggregationProps) {
    this.id = props.id ?? 'gpu-group-aggregation';
    this.keys = props.keys;
    this.values = props.values;
    this.output = props.output;
    this.mask = props.mask;
    this.operation = props.operation ?? 'count';

    for (const [chunkIndex, chunk] of getGroupChunks(this.keys).entries()) {
      validateScalarInputView(chunk, 'uint32', `${this.id} keys chunk ${chunkIndex}`);
    }
    if (this.output.length === 0) {
      throw new Error(`${this.id} output must contain at least one group`);
    }
    if (!['count', 'sum', 'min', 'max', 'mean'].includes(this.operation)) {
      throw new Error(`${this.id} operation must be count, sum, min, max, or mean`);
    }
    if (this.operation === 'count') {
      validatePackedUint32View(this.output, `${this.id} count output`);
      if (this.values) {
        throw new Error(`${this.id} count operation must not provide values`);
      }
    } else {
      validatePackedView(this.output, ['float32'], `${this.id} statistic output`);
      if (!this.values) {
        throw new Error(`${this.id} ${this.operation} operation requires values`);
      }
      for (const [chunkIndex, chunk] of getValueChunks(this.values).entries()) {
        validateScalarInputView(chunk, 'float32', `${this.id} values chunk ${chunkIndex}`);
      }
      validateMatchingInputs(this.keys, this.values, `${this.id} keys and values`);
      if (this.operation === 'mean' && this.keys.length > 0xffffffff) {
        throw new Error(`${this.id} mean input length must fit in uint32 group counts`);
      }
    }
    if (getGroupChunks(this.keys).some(chunk => chunk.buffer === this.output.buffer)) {
      throw new Error(`${this.id} keys and output must use separate buffers`);
    }
    if (
      this.values &&
      getValueChunks(this.values).some(chunk => chunk.buffer === this.output.buffer)
    ) {
      throw new Error(`${this.id} values and output must use separate buffers`);
    }
    if (this.mask) {
      for (const [chunkIndex, chunk] of getGroupChunks(this.mask).entries()) {
        validateScalarInputView(chunk, 'uint32', `${this.id} mask chunk ${chunkIndex}`);
        if (chunk.buffer === this.output.buffer) {
          throw new Error(`${this.id} mask and output must use separate buffers`);
        }
      }
      validateMatchingInputs(this.keys, this.mask, `${this.id} keys and mask`);
    }
  }

  /**
   * Adds initialization, one accumulation pass per non-empty source chunk, and any required
   * finalization.
   *
   * This method declares work only and does not submit or read back commands.
   */
  getCommandNodes<Parameters>(
    graph: GPUCommandGraph<Parameters>
  ): readonly GPUCommandNode<Parameters>[] {
    const nodes: GPUCommandNode<Parameters>[] = [];
    let keyChunks = getGroupChunks(this.keys);
    let maskChunks = this.mask ? getGroupChunks(this.mask) : undefined;
    let valueChunks = this.values ? getValueChunks(this.values) : undefined;
    if (
      keyChunks.some(chunk => chunk.buffer.graph !== graph) ||
      maskChunks?.some(chunk => chunk.buffer.graph !== graph) ||
      valueChunks?.some(chunk => chunk.buffer.graph !== graph) ||
      this.output.buffer.graph !== graph
    ) {
      throw new Error(`${this.id} views must belong to the target graph`);
    }
    if (this.values) {
      const spans = alignGraphVectorViews(graph, [this.keys, this.values, this.mask ?? this.keys]);
      keyChunks = spans.map(([keys]) => keys);
      valueChunks = spans.map(([, values]) => values);
      maskChunks = this.mask ? spans.map(([, , mask]) => mask) : undefined;
    } else if (this.mask) {
      const spans = alignGraphVectorViews(graph, [this.keys, this.mask]);
      keyChunks = spans.map(([keys]) => keys);
      maskChunks = spans.map(([, mask]) => mask);
    }

    if (this.operation === 'count') {
      const output = this.output as GraphDataView<'uint32'>;
      nodes.push(...addClearGroupsPass(graph, this.id, output));
      const accumulationPath = output.length <= MAXIMUM_LOCAL_GROUP_COUNT ? 'local' : 'global';
      for (let chunkIndex = 0; chunkIndex < keyChunks.length; chunkIndex++) {
        const keys = keyChunks[chunkIndex];
        if (keys.length === 0) continue;
        nodes.push(
          ...addGroupCountPass(graph, {
            id:
              this.keys instanceof GraphVectorView || keyChunks.length > 1
                ? `${this.id}-chunk-${chunkIndex}-${accumulationPath}`
                : `${this.id}-${accumulationPath}`,
            keys,
            output,
            mask: maskChunks?.[chunkIndex],
            dispatchLayout: getGPUGroupAggregationDispatchLayout(
              keys.length,
              graph.device.limits.maxComputeWorkgroupsPerDimension
            )
          })
        );
      }
      return nodes;
    }

    const output = this.output as GraphDataView<'float32'>;
    const operation = this.operation;
    if (operation === 'sum' || operation === 'mean') {
      nodes.push(
        ...addGroupSumNodes(graph, {
          id: this.id,
          vectorInput: this.keys instanceof GraphVectorView || keyChunks.length > 1,
          keyChunks,
          valueChunks: valueChunks!,
          maskChunks,
          output,
          operation
        })
      );
      return nodes;
    }

    nodes.push(...addInitializeGroupStatisticsPass(graph, this.id, output, operation));
    for (let chunkIndex = 0; chunkIndex < keyChunks.length; chunkIndex++) {
      const keys = keyChunks[chunkIndex];
      if (keys.length === 0) continue;
      nodes.push(
        ...addGroupStatisticPass(graph, {
          id:
            this.keys instanceof GraphVectorView || keyChunks.length > 1
              ? `${this.id}-chunk-${chunkIndex}`
              : this.id,
          keys,
          values: valueChunks![chunkIndex],
          mask: maskChunks?.[chunkIndex],
          output,
          operation,
          dispatchLayout: getGPUGroupAggregationDispatchLayout(
            keys.length,
            graph.device.limits.maxComputeWorkgroupsPerDimension
          )
        })
      );
    }
    nodes.push(...addFinalizeGroupStatisticsPass(graph, this.id, output, operation));

    return nodes;
  }
}

function validateScalarInputView(
  view: GraphDataView,
  format: 'uint32' | 'float32',
  name: string
): void {
  if (
    view.format !== format ||
    view.rowByteLength !== UINT32_BYTE_LENGTH ||
    view.byteStride < UINT32_BYTE_LENGTH ||
    view.byteStride % UINT32_BYTE_LENGTH !== 0 ||
    view.byteOffset % UINT32_BYTE_LENGTH !== 0
  ) {
    throw new Error(`${name} must be a uint32-aligned scalar ${format} GPU data view`);
  }
}

function getScalarStride(view: GraphDataView): number {
  return view.byteStride / UINT32_BYTE_LENGTH;
}

/** Returns one atomic view or the original ordered vector chunks. */
function getGroupChunks(
  input: GPUGroupAggregationKeys | GPUGroupAggregationMask
): readonly GraphDataView<'uint32'>[] {
  return input instanceof GraphVectorView ? input.data : [input];
}

/** Returns one atomic value view or the original ordered value chunks. */
function getValueChunks(input: GPUGroupAggregationValues): readonly GraphDataView<'float32'>[] {
  return input instanceof GraphVectorView ? input.data : [input];
}

/** Validates row correspondence independently of physical chunk boundaries. */
function validateMatchingInputs(
  keys: GPUGroupAggregationKeys,
  paired: GPUGroupAggregationMask | GPUGroupAggregationValues,
  label: string
): void {
  if (keys.length !== paired.length) {
    throw new Error(`${label} lengths must match`);
  }
}

/** Clears every group count before accumulation for the current graph encoding. */
function addClearGroupsPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  id: string,
  output: GraphDataView<'uint32'>
): readonly GPUCommandNode<Parameters>[] {
  const nodes: GPUCommandNode<Parameters>[] = [];
  const dispatchLayout = getGPUGroupAggregationDispatchLayout(
    output.length,
    graph.device.limits.maxComputeWorkgroupsPerDimension
  );
  const source = /* wgsl */ `
const GROUP_COUNT: u32 = ${output.length}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(output)}u;
@group(0) @binding(0) var<storage, read_write> outputCounts: array<atomic<u32>>;

@compute @workgroup_size(${GROUP_AGGREGATION_WORKGROUP_SIZE})
fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${getBoundedInvocationIndexSource(dispatchLayout, GROUP_AGGREGATION_WORKGROUP_SIZE)}
  if (index < GROUP_COUNT) {
    atomicStore(&outputCounts[OUTPUT_OFFSET + index], 0u);
  }
}`;
  nodes.push(
    ...addKernelPass(graph, {
      id: `${id}-clear`,
      source,
      resources: [{buffer: output, usage: 'storage-write'}],
      bindings: {outputCounts: output},
      dispatchSize: dispatchLayout
    })
  );

  return nodes;
}

/** Counts one packed key chunk using local or global atomics. */
function addGroupCountPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  props: {
    id: string;
    keys: GraphDataView<'uint32'>;
    output: GraphDataView<'uint32'>;
    mask?: GraphDataView<'uint32'>;
    dispatchLayout: GPUGroupAggregationDispatchLayout;
  }
): readonly GPUCommandNode<Parameters>[] {
  const nodes: GPUCommandNode<Parameters>[] = [];
  const local = props.output.length <= MAXIMUM_LOCAL_GROUP_COUNT;
  const useSubgroups =
    local &&
    props.output.length <= MAXIMUM_SUBGROUP_COALESCED_GROUP_COUNT &&
    getGPUShaderSubgroupStrategy(graph.device) === 'subgroups';
  const maskBinding = props.mask
    ? '@group(0) @binding(1) var<storage, read> selectionMask: array<u32>;'
    : '';
  const outputBinding = props.mask ? 2 : 1;
  const maskCondition = props.mask
    ? `selectionMask[${getViewElementOffset(props.mask)}u + index * ${getScalarStride(props.mask)}u] != 0u`
    : 'true';
  const localAccumulation = useSubgroups
    ? getSubgroupCoalescedAtomicAddWGSL(
        'accepted',
        'groupIndex',
        'localCounts',
        props.output.length
      )
    : '  if (accepted) { atomicAdd(&localCounts[groupIndex], 1u); }';
  const accumulation = local
    ? `${localAccumulation}
  workgroupBarrier();
  if (lane < GROUP_COUNT) {
    atomicAdd(&outputCounts[OUTPUT_OFFSET + lane], atomicLoad(&localCounts[lane]));
  }`
    : 'if (accepted) { atomicAdd(&outputCounts[OUTPUT_OFFSET + groupIndex], 1u); }';
  const source = /* wgsl */ `
${useSubgroups ? 'enable subgroups;' : ''}
const ELEMENT_COUNT: u32 = ${props.keys.length}u;
const GROUP_COUNT: u32 = ${props.output.length}u;
const KEYS_OFFSET: u32 = ${getViewElementOffset(props.keys)}u;
const KEYS_STRIDE: u32 = ${getScalarStride(props.keys)}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(props.output)}u;
@group(0) @binding(0) var<storage, read> groupKeys: array<u32>;
${maskBinding}
@group(0) @binding(${outputBinding}) var<storage, read_write> outputCounts: array<atomic<u32>>;
${local ? `var<workgroup> localCounts: array<atomic<u32>, ${props.output.length}>;` : ''}
${useSubgroups ? getSubgroupBallotHelpersWGSL() : ''}

@compute @workgroup_size(${GROUP_AGGREGATION_WORKGROUP_SIZE}) fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_id) localId: vec3<u32>${useSubgroups ? ',\n  @builtin(subgroup_invocation_id) subgroupInvocationId: u32' : ''}
) {
  let workgroupIndex = (workgroupId.z * ${props.dispatchLayout.y}u + workgroupId.y) * ${props.dispatchLayout.x}u + workgroupId.x;
  let index = workgroupIndex * ${GROUP_AGGREGATION_WORKGROUP_SIZE}u + localId.x;
  let lane = localId.x;
  ${local ? 'if (lane < GROUP_COUNT) { atomicStore(&localCounts[lane], 0u); }\n  workgroupBarrier();' : ''}
  var accepted = false;
  var groupIndex = 0u;
  if (index < ELEMENT_COUNT && ${maskCondition}) {
    groupIndex = groupKeys[KEYS_OFFSET + index * KEYS_STRIDE];
    accepted = groupIndex < GROUP_COUNT;
  }
  ${accumulation}
}`;
  const resources: GraphBufferUse[] = [
    {buffer: props.keys, usage: 'storage-read'},
    ...(props.mask ? ([{buffer: props.mask, usage: 'storage-read'}] as GraphBufferUse[]) : []),
    {buffer: props.output, usage: 'storage-read-write'}
  ];
  nodes.push(
    ...addKernelPass(graph, {
      id: props.id,
      source,
      resources,
      bindings: {
        groupKeys: props.keys,
        ...(props.mask ? {selectionMask: props.mask} : {}),
        outputCounts: props.output
      },
      dispatchSize: props.dispatchLayout
    })
  );

  return nodes;
}

/** Initializes every ordered minimum or maximum group result. */
function addInitializeGroupStatisticsPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  id: string,
  output: GraphDataView<'float32'>,
  operation: GPUGroupOrderedOperation
): readonly GPUCommandNode<Parameters>[] {
  const dispatchLayout = getGPUGroupAggregationDispatchLayout(
    output.length,
    graph.device.limits.maxComputeWorkgroupsPerDimension
  );
  const initialBits = operation === 'min' ? '0xffffffffu' : '0u';
  const source = /* wgsl */ `
const GROUP_COUNT: u32 = ${output.length}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(output)}u;
@group(0) @binding(0) var<storage, read_write> outputValues: array<atomic<u32>>;
@compute @workgroup_size(${GROUP_AGGREGATION_WORKGROUP_SIZE}) fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${getBoundedInvocationIndexSource(dispatchLayout, GROUP_AGGREGATION_WORKGROUP_SIZE)}
  if (index < GROUP_COUNT) {
    atomicStore(&outputValues[OUTPUT_OFFSET + index], ${initialBits});
  }
}`;
  return addKernelPass(graph, {
    id: `${id}-initialize`,
    source,
    resources: [{buffer: output, usage: 'storage-write'}],
    bindings: {outputValues: output},
    dispatchSize: dispatchLayout
  });
}

/** Accumulates one aligned minimum or maximum chunk with direct ordered-bit atomics. */
function addGroupStatisticPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  props: {
    id: string;
    keys: GraphDataView<'uint32'>;
    values: GraphDataView<'float32'>;
    mask?: GraphDataView<'uint32'>;
    output: GraphDataView<'float32'>;
    operation: GPUGroupOrderedOperation;
    dispatchLayout: GPUGroupAggregationDispatchLayout;
  }
): readonly GPUCommandNode<Parameters>[] {
  const nodes: GPUCommandNode<Parameters>[] = [];
  const useSubgroups =
    props.output.length <= MAXIMUM_SUBGROUP_COALESCED_GROUP_COUNT &&
    getGPUShaderSubgroupStrategy(graph.device) === 'subgroups';
  const maskBinding = props.mask
    ? '@group(0) @binding(2) var<storage, read> selectionMask: array<u32>;'
    : '';
  const outputBinding = props.mask ? 3 : 2;
  const maskCondition = props.mask
    ? `selectionMask[${getViewElementOffset(props.mask)}u + index * ${getScalarStride(props.mask)}u] != 0u`
    : 'true';
  const accumulation = useSubgroups
    ? getSubgroupStatisticAggregationWGSL(props.operation, props.output.length)
    : `  if (accepted) {
    ${getOrderedAggregationCall(props.operation, 'groupIndex')}
  }`;
  const source = /* wgsl */ `
${useSubgroups ? 'enable subgroups;' : ''}
const ELEMENT_COUNT: u32 = ${props.keys.length}u;
const GROUP_COUNT: u32 = ${props.output.length}u;
const KEYS_OFFSET: u32 = ${getViewElementOffset(props.keys)}u;
const VALUES_OFFSET: u32 = ${getViewElementOffset(props.values)}u;
const KEYS_STRIDE: u32 = ${getScalarStride(props.keys)}u;
const VALUES_STRIDE: u32 = ${getScalarStride(props.values)}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(props.output)}u;
@group(0) @binding(0) var<storage, read> groupKeys: array<u32>;
@group(0) @binding(1) var<storage, read> inputValues: array<f32>;
${maskBinding}
@group(0) @binding(${outputBinding}) var<storage, read_write> outputValues: array<atomic<u32>>;

${ORDERED_FLOAT_ENCODE_WGSL}
${useSubgroups ? getSubgroupBallotHelpersWGSL() : ''}

@compute @workgroup_size(${GROUP_AGGREGATION_WORKGROUP_SIZE}) fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_id) localId: vec3<u32>${useSubgroups ? ',\n  @builtin(subgroup_invocation_id) subgroupInvocationId: u32' : ''}
) {
  let workgroupIndex = (workgroupId.z * ${props.dispatchLayout.y}u + workgroupId.y) * ${props.dispatchLayout.x}u + workgroupId.x;
  let index = workgroupIndex * ${GROUP_AGGREGATION_WORKGROUP_SIZE}u + localId.x;
  var accepted = false;
  var groupIndex = 0u;
  var value = 0.0;
  if (index < ELEMENT_COUNT && ${maskCondition}) {
    groupIndex = groupKeys[KEYS_OFFSET + index * KEYS_STRIDE];
    value = inputValues[VALUES_OFFSET + index * VALUES_STRIDE];
    let finiteValue = value == value && abs(value) <= 3.402823466e+38;
    accepted = groupIndex < GROUP_COUNT && finiteValue;
  }
${accumulation}
}`;
  const resources: GraphBufferUse[] = [
    {buffer: props.keys, usage: 'storage-read'},
    {buffer: props.values, usage: 'storage-read'},
    ...(props.mask ? ([{buffer: props.mask, usage: 'storage-read'}] as GraphBufferUse[]) : []),
    {buffer: props.output, usage: 'storage-read-write'}
  ];
  nodes.push(
    ...addKernelPass(graph, {
      id: `${props.id}-${props.operation}`,
      source,
      resources,
      bindings: {
        groupKeys: props.keys,
        inputValues: props.values,
        ...(props.mask ? {selectionMask: props.mask} : {}),
        outputValues: props.output
      },
      dispatchSize: props.dispatchLayout
    })
  );

  return nodes;
}

/** Converts ordered minimum or maximum identities into empty-group NaNs and decodes values. */
function addFinalizeGroupStatisticsPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  id: string,
  output: GraphDataView<'float32'>,
  operation: GPUGroupOrderedOperation
): readonly GPUCommandNode<Parameters>[] {
  const dispatchLayout = getGPUGroupAggregationDispatchLayout(
    output.length,
    graph.device.limits.maxComputeWorkgroupsPerDimension
  );
  const source = /* wgsl */ `
const GROUP_COUNT: u32 = ${output.length}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(output)}u;
@group(0) @binding(0) var<storage, read_write> outputValues: array<u32>;
fn decodeOrderedFloat(value: u32) -> f32 {
  let bits = select(~value, value ^ 0x80000000u, (value & 0x80000000u) != 0u);
  return bitcast<f32>(bits);
}
@compute @workgroup_size(${GROUP_AGGREGATION_WORKGROUP_SIZE}) fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${getBoundedInvocationIndexSource(dispatchLayout, GROUP_AGGREGATION_WORKGROUP_SIZE)}
  if (index < GROUP_COUNT) {
    let orderedValue = outputValues[OUTPUT_OFFSET + index];
    if (orderedValue == ${operation === 'min' ? '0xffffffffu' : '0u'}) {
      outputValues[OUTPUT_OFFSET + index] = 0x7fc00000u;
    } else {
      outputValues[OUTPUT_OFFSET + index] = bitcast<u32>(decodeOrderedFloat(orderedValue));
    }
  }
}`;
  return addKernelPass(graph, {
    id: `${id}-finalize`,
    source,
    resources: [{buffer: output, usage: 'storage-read-write'}],
    bindings: {outputValues: output},
    dispatchSize: dispatchLayout
  });
}

const ORDERED_FLOAT_ENCODE_WGSL = /* wgsl */ `fn encodeOrderedFloat(value: f32) -> u32 {
  let bits = bitcast<u32>(value);
  return select(bits ^ 0x80000000u, ~bits, (bits & 0x80000000u) != 0u);
}`;

/** Returns the WGSL statement that contributes one accepted ordered minimum or maximum value. */
function getOrderedAggregationCall(
  operation: GPUGroupOrderedOperation,
  groupIndex: string,
  valueExpression: string = 'encodeOrderedFloat(value)'
): string {
  const atomicOperation = operation === 'min' ? 'atomicMin' : 'atomicMax';
  return `${atomicOperation}(&outputValues[OUTPUT_OFFSET + ${groupIndex}], ${valueExpression});`;
}

/** Coalesces equal group keys and emits one ordered atomic per key represented in a subgroup. */
function getSubgroupStatisticAggregationWGSL(
  operation: GPUGroupOrderedOperation,
  groupCount: number
): string {
  const identity = operation === 'min' ? '0xffffffffu' : '0u';
  const collective = operation === 'min' ? 'subgroupMin' : 'subgroupMax';
  return /* wgsl */ `
  var subgroupPending = accepted;
  for (var subgroupGroup = 0u; subgroupGroup < ${groupCount}u; subgroupGroup++) {
    let pendingBallot = subgroupBallot(subgroupPending);
    let hasPending = any(pendingBallot != vec4<u32>(0u));
    let leaderInvocation = getFirstBallotLane(pendingBallot);
    let leaderKey = subgroupShuffle(groupIndex, leaderInvocation);
    let matchingKey = hasPending && subgroupPending && groupIndex == leaderKey;
    let selectedValue = select(${identity}, encodeOrderedFloat(value), matchingKey);
    let aggregatedValue = ${collective}(selectedValue);
    if (hasPending && subgroupInvocationId == leaderInvocation) {
      ${getOrderedAggregationCall(operation, 'leaderKey', 'aggregatedValue')}
    }
    subgroupPending = subgroupPending && !matchingKey;
  }`;
}

/** Adds deterministic per-workgroup partial sums and one fixed-order combine pass. */
function addGroupSumNodes<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  props: {
    id: string;
    vectorInput: boolean;
    keyChunks: readonly GraphDataView<'uint32'>[];
    valueChunks: readonly GraphDataView<'float32'>[];
    maskChunks?: readonly GraphDataView<'uint32'>[];
    output: GraphDataView<'float32'>;
    operation: GPUGroupSumOperation;
  }
): readonly GPUCommandNode<Parameters>[] {
  const {limits} = graph.device;
  const plan = getGPUGroupSumPlan(
    props.keyChunks.map(chunk => chunk.length),
    props.output.length,
    props.operation,
    limits.maxComputeWorkgroupStorageSize || MINIMUM_WORKGROUP_STORAGE_BYTE_LENGTH
  );
  // Sort keys pack the group above an 8-bit tile lane, and partials must fit one storage binding.
  if (
    props.output.length > MAXIMUM_SUM_GROUP_COUNT ||
    plan.partialCount * UINT32_BYTE_LENGTH > limits.maxStorageBufferBindingSize
  ) {
    throw new Error(`${props.id} sum partials exceed device limits`);
  }
  const partialSums = createTransientView(
    graph,
    `${props.id}-partial-sums`,
    'float32',
    plan.partialCount
  );
  const partialCounts =
    props.operation === 'mean'
      ? createTransientView(graph, `${props.id}-partial-counts`, 'uint32', plan.partialCount)
      : undefined;

  const nodes: GPUCommandNode<Parameters>[] = [];
  let rowBlockOffset = 0;
  for (let chunkIndex = 0; chunkIndex < props.keyChunks.length; chunkIndex++) {
    const keys = props.keyChunks[chunkIndex];
    if (keys.length === 0) continue;
    const rowBlockCount = Math.ceil(keys.length / plan.rowsPerWorkgroup);
    nodes.push(
      ...addGroupPartialSumPass(graph, {
        id: props.vectorInput
          ? `${props.id}-chunk-${chunkIndex}-${props.operation}`
          : `${props.id}-${props.operation}`,
        keys,
        values: props.valueChunks[chunkIndex],
        mask: props.maskChunks?.[chunkIndex],
        partialSums,
        partialCounts,
        groupCount: props.output.length,
        accumulateInWorkgroup: plan.accumulateInWorkgroup,
        rowsPerWorkgroup: plan.rowsPerWorkgroup,
        rowBlockCount,
        rowBlockOffset
      })
    );
    rowBlockOffset += rowBlockCount;
  }
  nodes.push(
    ...addGroupCombineSumPass(graph, {
      id: `${props.id}-finalize`,
      partialSums,
      partialCounts,
      output: props.output,
      rowBlockCount: plan.rowBlockCount
    })
  );
  return nodes;
}

/** Static sizing for the deterministic floating-point sum path. @internal */
export type GPUGroupSumPlan = {
  /** Rows reduced by one workgroup, a multiple of the 256-row tile. */
  rowsPerWorkgroup: number;
  /** Total row blocks across every non-empty chunk. */
  rowBlockCount: number;
  /** Whether group accumulators fit in workgroup memory instead of the scratch column. */
  accumulateInWorkgroup: boolean;
  /** Partial values per scratch array, `rowBlockCount * groupCount`. */
  partialCount: number;
};

/**
 * Sizes row blocks and the accumulator location for deterministic sums. @internal
 *
 * Row blocks grow beyond the minimum when `rows * groups` would otherwise need more than about one
 * million partials, so scratch stays near 4 MB per array. Group accumulators live in workgroup
 * memory while they fit an 8 KB budget beside the 3 KB row tile, which keeps several workgroups
 * resident per compute unit. Larger outputs accumulate directly in the workgroup's own scratch
 * column, which no other workgroup touches.
 */
export function getGPUGroupSumPlan(
  chunkLengths: readonly number[],
  groupCount: number,
  operation: GPUGroupSumOperation,
  maxComputeWorkgroupStorageSize: number
): GPUGroupSumPlan {
  const rowCount = chunkLengths.reduce((total, length) => total + length, 0);
  const tilesPerWorkgroup = Math.max(
    MINIMUM_SUM_TILES_PER_WORKGROUP,
    Math.ceil((rowCount * groupCount) / (TARGET_SUM_PARTIAL_COUNT * SUM_TILE_ROW_COUNT))
  );
  const rowsPerWorkgroup = tilesPerWorkgroup * SUM_TILE_ROW_COUNT;
  const rowBlockCount = chunkLengths.reduce(
    (total, length) => total + Math.ceil(length / rowsPerWorkgroup),
    0
  );
  const accumulatorByteLength = groupCount * (operation === 'mean' ? 2 : 1) * UINT32_BYTE_LENGTH;
  return {
    rowsPerWorkgroup,
    rowBlockCount,
    accumulateInWorkgroup:
      accumulatorByteLength <= MAXIMUM_WORKGROUP_ACCUMULATOR_BYTE_LENGTH &&
      SUM_TILE_WORKGROUP_BYTE_LENGTH + accumulatorByteLength <= maxComputeWorkgroupStorageSize,
    partialCount: rowBlockCount * groupCount
  };
}

/**
 * Reduces each fixed row block of one chunk into one column of per-group partials.
 *
 * Every 256-row tile is staged in workgroup memory with a packed `(group << 8) | lane` sort key,
 * bitonic-sorted, and reduced with a segmented Hillis-Steele scan. The last row of each run adds
 * the run total to the group's accumulator. Each accumulator has one writer per tile, and tiles are
 * separated by barriers, so the addition order is fixed by the input rows alone. Accumulators are
 * workgroup memory, flushed at the end, or the workgroup's own scratch column.
 */
function addGroupPartialSumPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  props: {
    id: string;
    keys: GraphDataView<'uint32'>;
    values: GraphDataView<'float32'>;
    mask?: GraphDataView<'uint32'>;
    partialSums: GraphDataView<'float32'>;
    partialCounts?: GraphDataView<'uint32'>;
    groupCount: number;
    accumulateInWorkgroup: boolean;
    rowsPerWorkgroup: number;
    rowBlockCount: number;
    rowBlockOffset: number;
  }
): readonly GPUCommandNode<Parameters>[] {
  const dispatchLayout = getGPUGroupAggregationDispatchLayout(
    props.rowBlockCount * GROUP_AGGREGATION_WORKGROUP_SIZE,
    graph.device.limits.maxComputeWorkgroupsPerDimension
  );
  const includesCounts = Boolean(props.partialCounts);
  const local = props.accumulateInWorkgroup;
  const maskBinding = props.mask
    ? '@group(0) @binding(2) var<storage, read> selectionMask: array<u32>;'
    : '';
  const partialBinding = props.mask ? 3 : 2;
  const maskCondition = props.mask
    ? `selectionMask[${getViewElementOffset(props.mask)}u + index * ${getScalarStride(props.mask)}u] != 0u`
    : 'true';
  const sumAccumulator = local
    ? 'localSums[group]'
    : 'partialSums[PARTIAL_SUMS_OFFSET + columnStart + group]';
  const countAccumulator = local
    ? 'localCounts[group]'
    : 'partialCounts[PARTIAL_COUNTS_OFFSET + columnStart + group]';
  const source = /* wgsl */ `
const ELEMENT_COUNT: u32 = ${props.keys.length}u;
const GROUP_COUNT: u32 = ${props.groupCount}u;
const ROWS_PER_WORKGROUP: u32 = ${props.rowsPerWorkgroup}u;
const ROW_BLOCK_COUNT: u32 = ${props.rowBlockCount}u;
const ROW_BLOCK_OFFSET: u32 = ${props.rowBlockOffset}u;
const KEYS_OFFSET: u32 = ${getViewElementOffset(props.keys)}u;
const VALUES_OFFSET: u32 = ${getViewElementOffset(props.values)}u;
const KEYS_STRIDE: u32 = ${getScalarStride(props.keys)}u;
const VALUES_STRIDE: u32 = ${getScalarStride(props.values)}u;
const PARTIAL_SUMS_OFFSET: u32 = ${getViewElementOffset(props.partialSums)}u;
const PARTIAL_COUNTS_OFFSET: u32 = ${props.partialCounts ? getViewElementOffset(props.partialCounts) : 0}u;
const TILE_ROW_COUNT: u32 = ${SUM_TILE_ROW_COUNT}u;
const INVALID_SORT_KEY: u32 = 0xffffffffu;
@group(0) @binding(0) var<storage, read> groupKeys: array<u32>;
@group(0) @binding(1) var<storage, read> inputValues: array<f32>;
${maskBinding}
@group(0) @binding(${partialBinding}) var<storage, read_write> partialSums: array<f32>;
${includesCounts ? `@group(0) @binding(${partialBinding + 1}) var<storage, read_write> partialCounts: array<u32>;` : ''}

var<workgroup> sortKeys: array<u32, ${SUM_TILE_ROW_COUNT}>;
var<workgroup> tileValues: array<f32, ${SUM_TILE_ROW_COUNT}>;
var<workgroup> scanValues: array<f32, ${SUM_TILE_ROW_COUNT}>;
${includesCounts ? `var<workgroup> scanCounts: array<u32, ${SUM_TILE_ROW_COUNT}>;` : ''}
${local ? `var<workgroup> localSums: array<f32, ${props.groupCount}>;` : ''}
${local && includesCounts ? `var<workgroup> localCounts: array<u32, ${props.groupCount}>;` : ''}

@compute @workgroup_size(${GROUP_AGGREGATION_WORKGROUP_SIZE}) fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_index) lane: u32
) {
  let rowBlock = (workgroupId.z * ${dispatchLayout.y}u + workgroupId.y) * ${dispatchLayout.x}u + workgroupId.x;
  if (rowBlock >= ROW_BLOCK_COUNT) { return; }
  let columnStart = (ROW_BLOCK_OFFSET + rowBlock) * GROUP_COUNT;
  for (var group = lane; group < GROUP_COUNT; group += TILE_ROW_COUNT) {
    ${sumAccumulator} = 0.0;
    ${includesCounts ? `${countAccumulator} = 0u;` : ''}
  }

  let rowStart = rowBlock * ROWS_PER_WORKGROUP;
  let rowEnd = min(rowStart + ROWS_PER_WORKGROUP, ELEMENT_COUNT);
  for (var tileStart = rowStart; tileStart < rowEnd; tileStart += TILE_ROW_COUNT) {
    let index = tileStart + lane;
    var sortKey = INVALID_SORT_KEY;
    var value = 0.0;
    if (index < rowEnd && ${maskCondition}) {
      let groupIndex = groupKeys[KEYS_OFFSET + index * KEYS_STRIDE];
      value = inputValues[VALUES_OFFSET + index * VALUES_STRIDE];
      let finiteValue = value == value && abs(value) <= 3.402823466e+38;
      if (finiteValue && groupIndex < GROUP_COUNT) {
        sortKey = (groupIndex << 8u) | lane;
      }
    }
    // Accumulator updates and sort-key reads of the previous tile are complete.
    ${local ? 'workgroupBarrier();' : 'storageBarrier();\n    workgroupBarrier();'}
    sortKeys[lane] = sortKey;
    tileValues[lane] = value;
    workgroupBarrier();

    for (var size = 2u; size <= TILE_ROW_COUNT; size <<= 1u) {
      for (var stride = size >> 1u; stride > 0u; stride >>= 1u) {
        let partner = lane ^ stride;
        if (partner > lane) {
          let first = sortKeys[lane];
          let second = sortKeys[partner];
          if ((first > second) == ((lane & size) == 0u)) {
            sortKeys[lane] = second;
            sortKeys[partner] = first;
          }
        }
        workgroupBarrier();
      }
    }

    let sortedKey = sortKeys[lane];
    let group = sortedKey >> 8u;
    let valid = sortedKey != INVALID_SORT_KEY;
    var sum = select(0.0, tileValues[sortedKey & 0xffu], valid);
    ${includesCounts ? 'var count = select(0u, 1u, valid);' : ''}
    for (var offset = 1u; offset < TILE_ROW_COUNT; offset <<= 1u) {
      scanValues[lane] = sum;
      ${includesCounts ? 'scanCounts[lane] = count;' : ''}
      workgroupBarrier();
      if (lane >= offset && (sortKeys[lane - offset] >> 8u) == group) {
        sum = scanValues[lane - offset] + sum;
        ${includesCounts ? 'count = scanCounts[lane - offset] + count;' : ''}
      }
      workgroupBarrier();
    }
    let segmentEnd = lane == TILE_ROW_COUNT - 1u || (sortKeys[lane + 1u] >> 8u) != group;
    if (valid && segmentEnd) {
      ${sumAccumulator} = ${sumAccumulator} + sum;
      ${includesCounts ? `${countAccumulator} = ${countAccumulator} + count;` : ''}
    }
  }
${
  local
    ? `  workgroupBarrier();
  for (var group = lane; group < GROUP_COUNT; group += TILE_ROW_COUNT) {
    partialSums[PARTIAL_SUMS_OFFSET + columnStart + group] = localSums[group];
    ${includesCounts ? 'partialCounts[PARTIAL_COUNTS_OFFSET + columnStart + group] = localCounts[group];' : ''}
  }`
    : ''
}
}`;
  const resources: GraphBufferUse[] = [
    {buffer: props.keys, usage: 'storage-read'},
    {buffer: props.values, usage: 'storage-read'},
    ...(props.mask ? ([{buffer: props.mask, usage: 'storage-read'}] as GraphBufferUse[]) : []),
    {buffer: props.partialSums, usage: 'storage-read-write'},
    ...(props.partialCounts
      ? ([{buffer: props.partialCounts, usage: 'storage-read-write'}] as GraphBufferUse[])
      : [])
  ];
  return addKernelPass(graph, {
    id: props.id,
    source,
    resources,
    bindings: {
      groupKeys: props.keys,
      inputValues: props.values,
      ...(props.mask ? {selectionMask: props.mask} : {}),
      partialSums: props.partialSums,
      ...(props.partialCounts ? {partialCounts: props.partialCounts} : {})
    },
    dispatchSize: dispatchLayout
  });
}

/**
 * Sums each group's row-block partials in a fixed order and writes the sum or mean.
 *
 * One workgroup reduces one group at a time: each lane adds a strided subset of row blocks in index
 * order, then a fixed binary tree combines the lanes. Workgroups stride over groups when the group
 * count exceeds one dispatch dimension. Means of groups without accepted rows are NaN.
 */
function addGroupCombineSumPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  props: {
    id: string;
    partialSums: GraphDataView<'float32'>;
    partialCounts?: GraphDataView<'uint32'>;
    output: GraphDataView<'float32'>;
    rowBlockCount: number;
  }
): readonly GPUCommandNode<Parameters>[] {
  const groupCount = props.output.length;
  const workgroupCount = Math.min(
    groupCount,
    Math.floor(graph.device.limits.maxComputeWorkgroupsPerDimension)
  );
  const includesCounts = Boolean(props.partialCounts);
  const outputBinding = includesCounts ? 2 : 1;
  const resultStatement = includesCounts
    ? `let count = reductionCounts[0];
    outputValues[OUTPUT_OFFSET + groupIndex] = select(
      bitcast<u32>(reductionSums[0] / f32(max(count, 1u))),
      0x7fc00000u,
      count == 0u
    );`
    : 'outputValues[OUTPUT_OFFSET + groupIndex] = bitcast<u32>(reductionSums[0]);';
  const source = /* wgsl */ `
const GROUP_COUNT: u32 = ${groupCount}u;
const ROW_BLOCK_COUNT: u32 = ${props.rowBlockCount}u;
const PARTIAL_SUMS_OFFSET: u32 = ${getViewElementOffset(props.partialSums)}u;
const PARTIAL_COUNTS_OFFSET: u32 = ${props.partialCounts ? getViewElementOffset(props.partialCounts) : 0}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(props.output)}u;
const WORKGROUP_SIZE: u32 = ${GROUP_AGGREGATION_WORKGROUP_SIZE}u;
const WORKGROUP_COUNT: u32 = ${workgroupCount}u;
@group(0) @binding(0) var<storage, read> partialSums: array<f32>;
${includesCounts ? '@group(0) @binding(1) var<storage, read> partialCounts: array<u32>;' : ''}
@group(0) @binding(${outputBinding}) var<storage, read_write> outputValues: array<u32>;
var<workgroup> reductionSums: array<f32, ${GROUP_AGGREGATION_WORKGROUP_SIZE}>;
${includesCounts ? `var<workgroup> reductionCounts: array<u32, ${GROUP_AGGREGATION_WORKGROUP_SIZE}>;` : ''}

@compute @workgroup_size(${GROUP_AGGREGATION_WORKGROUP_SIZE}) fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_index) lane: u32
) {
  for (var groupIndex = workgroupId.x; groupIndex < GROUP_COUNT; groupIndex += WORKGROUP_COUNT) {
    var sum = 0.0;
    ${includesCounts ? 'var count = 0u;' : ''}
    for (var rowBlock = lane; rowBlock < ROW_BLOCK_COUNT; rowBlock += WORKGROUP_SIZE) {
      let partialIndex = rowBlock * GROUP_COUNT + groupIndex;
      sum += partialSums[PARTIAL_SUMS_OFFSET + partialIndex];
      ${includesCounts ? 'count += partialCounts[PARTIAL_COUNTS_OFFSET + partialIndex];' : ''}
    }
    // Lane 0 has finished reading the previous group's reduction.
    workgroupBarrier();
    reductionSums[lane] = sum;
    ${includesCounts ? 'reductionCounts[lane] = count;' : ''}
    for (var stride = WORKGROUP_SIZE >> 1u; stride > 0u; stride >>= 1u) {
      workgroupBarrier();
      if (lane < stride) {
        reductionSums[lane] = reductionSums[lane] + reductionSums[lane + stride];
        ${includesCounts ? 'reductionCounts[lane] = reductionCounts[lane] + reductionCounts[lane + stride];' : ''}
      }
    }
    if (lane == 0u) {
      ${resultStatement}
    }
  }
}`;
  return addKernelPass(graph, {
    id: props.id,
    source,
    resources: [
      {buffer: props.partialSums, usage: 'storage-read'},
      ...(props.partialCounts
        ? ([{buffer: props.partialCounts, usage: 'storage-read'}] as GraphBufferUse[])
        : []),
      {buffer: props.output, usage: 'storage-write'}
    ],
    bindings: {
      partialSums: props.partialSums,
      ...(props.partialCounts ? {partialCounts: props.partialCounts} : {}),
      outputValues: props.output
    },
    dispatchCount: workgroupCount
  });
}

/** Plans a bounded 3D dispatch for one packed group-key chunk. @internal */
export function getGPUGroupAggregationDispatchLayout(
  elementCount: number,
  maxComputeWorkgroupsPerDimension: number
): GPUGroupAggregationDispatchLayout {
  return getBoundedDispatchLayout(
    'GPUGroupAggregation',
    elementCount,
    GROUP_AGGREGATION_WORKGROUP_SIZE,
    maxComputeWorkgroupsPerDimension
  );
}

/** Wraps generated WGSL in one graph compute node with deferred physical buffer resolution. */
function addKernelPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  props: {
    id: string;
    source: string;
    resources: GraphBufferUse[];
    bindings: Record<string, GraphDataView>;
    dispatchCount?: number;
    dispatchSize?: GPUGroupAggregationDispatchLayout;
  }
): readonly GPUCommandNode<Parameters>[] {
  const nodes: GPUCommandNode<Parameters>[] = [];
  const maximumWorkgroupCount = props.dispatchSize
    ? props.dispatchSize.x * props.dispatchSize.y * props.dispatchSize.z
    : (props.dispatchCount ?? 1);
  nodes.push(
    createGPUComputeCommandNode<Parameters>({
      id: props.id,
      resources: props.resources,
      workload: {
        operation: 'GPUGroupAggregation',
        commandCount: 1,
        maximumWorkgroupCount,
        maximumInvocationCount: maximumWorkgroupCount * GROUP_AGGREGATION_WORKGROUP_SIZE
      },
      compile: ({device}) => {
        const kernel = new Kernel(device, {
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

            if (props.dispatchSize) {
              kernel.dispatch(computePass, {
                bindings,
                x: props.dispatchSize.x,
                y: props.dispatchSize.y,
                z: props.dispatchSize.z
              });
            } else {
              kernel.dispatch(computePass, {bindings, x: props.dispatchCount!});
            }
          },
          destroy: () => kernel.destroy()
        };
      }
    })
  );

  return nodes;
}
