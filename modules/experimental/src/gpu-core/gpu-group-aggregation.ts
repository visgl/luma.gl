// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {type Binding} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
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
  validateMatchingVectorTopology,
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

type GPUGroupAggregationDispatchLayout = GPUBoundedDispatchLayout;

/** One scalar group-key chunk or an ordered vector of scalar group-key chunks. */
export type GPUGroupAggregationKeys = GraphDataView<'uint32'> | GraphVectorView<'uint32'>;

/** Optional nonzero/zero row selection with the same topology as the group keys. */
export type GPUGroupAggregationMask = GraphDataView<'uint32'> | GraphVectorView<'uint32'>;

/** Optional floating-point contributions with the same topology as the group keys. */
export type GPUGroupAggregationValues = GraphDataView<'float32'> | GraphVectorView<'float32'>;

/** Statistic computed by {@link GPUGroupAggregation}. */
export type GPUGroupAggregationOperation = 'count' | 'sum' | 'min' | 'max' | 'mean';

type GPUGroupAggregationBaseProps = {
  /** Prefix for generated graph node IDs. */
  id?: string;
  /** Dense unsigned group keys. Keys outside the output range are ignored. */
  keys: GPUGroupAggregationKeys;
  /** Optional nonzero/zero selection with the same view kind and chunk topology as `keys`. */
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
        /** One finite floating-point contribution per key with identical chunk topology. */
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
 * larger keys are ignored. Nonzero mask values include a row. Count uses unsigned atomics; sum and
 * mean use compare-exchange float addition; minimum and maximum use ordered float bits. Vector
 * inputs retain their source chunk boundaries without packing.
 */
export class GPUGroupAggregation {
  /** Prefix for generated graph node IDs. */
  readonly id: string;
  /** Packed group keys or ordered group-key vector. */
  readonly keys: GPUGroupAggregationKeys;
  /** Optional packed values with the same view kind and chunk topology as keys. */
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
  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    const keyChunks = getGroupChunks(this.keys);
    const maskChunks = this.mask ? getGroupChunks(this.mask) : undefined;
    const valueChunks = this.values ? getValueChunks(this.values) : undefined;
    if (
      keyChunks.some(chunk => chunk.buffer.graph !== graph) ||
      maskChunks?.some(chunk => chunk.buffer.graph !== graph) ||
      valueChunks?.some(chunk => chunk.buffer.graph !== graph) ||
      this.output.buffer.graph !== graph
    ) {
      throw new Error(`${this.id} views must belong to the target graph`);
    }

    if (this.operation === 'count') {
      const output = this.output as GraphDataView<'uint32'>;
      addClearGroupsPass(graph, this.id, output);
      const accumulationPath = output.length <= MAXIMUM_LOCAL_GROUP_COUNT ? 'local' : 'global';
      for (let chunkIndex = 0; chunkIndex < keyChunks.length; chunkIndex++) {
        const keys = keyChunks[chunkIndex];
        if (keys.length === 0) continue;
        addGroupCountPass(graph, {
          id:
            this.keys instanceof GraphVectorView
              ? `${this.id}-chunk-${chunkIndex}-${accumulationPath}`
              : `${this.id}-${accumulationPath}`,
          keys,
          output,
          mask: maskChunks?.[chunkIndex],
          dispatchLayout: getGPUGroupAggregationDispatchLayout(
            keys.length,
            graph.device.limits.maxComputeWorkgroupsPerDimension
          )
        });
      }
      return;
    }

    const output = this.output as GraphDataView<'float32'>;
    const operation = this.operation;
    const counts =
      operation === 'mean'
        ? createTransientView(graph, `${this.id}-counts`, 'uint32', output.length)
        : undefined;
    addInitializeGroupStatisticsPass(graph, this.id, output, operation, counts);
    for (let chunkIndex = 0; chunkIndex < keyChunks.length; chunkIndex++) {
      const keys = keyChunks[chunkIndex];
      if (keys.length === 0) continue;
      addGroupStatisticPass(graph, {
        id: this.keys instanceof GraphVectorView ? `${this.id}-chunk-${chunkIndex}` : this.id,
        keys,
        values: valueChunks![chunkIndex],
        mask: maskChunks?.[chunkIndex],
        output,
        operation,
        counts,
        dispatchLayout: getGPUGroupAggregationDispatchLayout(
          keys.length,
          graph.device.limits.maxComputeWorkgroupsPerDimension
        )
      });
    }
    if (operation !== 'sum') {
      addFinalizeGroupStatisticsPass(graph, this.id, output, operation, counts);
    }
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

/** Validates atomic/vector kind, row count, and ordered vector chunk lengths. */
function validateMatchingInputs(
  keys: GPUGroupAggregationKeys,
  paired: GPUGroupAggregationMask | GPUGroupAggregationValues,
  label: string
): void {
  if (keys instanceof GraphVectorView !== paired instanceof GraphVectorView) {
    throw new Error(`${label} must use the same view kind`);
  }
  if (keys instanceof GraphVectorView && paired instanceof GraphVectorView) {
    validateMatchingVectorTopology(keys, paired, label);
  } else if (keys.length !== paired.length) {
    throw new Error(`${label} lengths must match`);
  }
}

/** Clears every group count before accumulation for the current graph encoding. */
function addClearGroupsPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  id: string,
  output: GraphDataView<'uint32'>
): void {
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
  addComputationPass(graph, {
    id: `${id}-clear`,
    source,
    resources: [{buffer: output, usage: 'storage-write'}],
    bindings: {outputCounts: output},
    dispatchSize: dispatchLayout
  });
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
): void {
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
  addComputationPass(graph, {
    id: props.id,
    source,
    resources,
    bindings: {
      groupKeys: props.keys,
      ...(props.mask ? {selectionMask: props.mask} : {}),
      outputCounts: props.output
    },
    dispatchSize: props.dispatchLayout
  });
}

/** Initializes every floating-point group result and optional mean count. */
function addInitializeGroupStatisticsPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  id: string,
  output: GraphDataView<'float32'>,
  operation: Exclude<GPUGroupAggregationOperation, 'count'>,
  counts?: GraphDataView<'uint32'>
): void {
  const dispatchLayout = getGPUGroupAggregationDispatchLayout(
    output.length,
    graph.device.limits.maxComputeWorkgroupsPerDimension
  );
  const initialBits = operation === 'min' ? '0xffffffffu' : '0u';
  const countBinding = counts
    ? '@group(0) @binding(1) var<storage, read_write> outputCounts: array<atomic<u32>>;'
    : '';
  const countInitialization = counts
    ? `atomicStore(&outputCounts[${getViewElementOffset(counts)}u + index], 0u);`
    : '';
  const source = /* wgsl */ `
const GROUP_COUNT: u32 = ${output.length}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(output)}u;
@group(0) @binding(0) var<storage, read_write> outputValues: array<atomic<u32>>;
${countBinding}
@compute @workgroup_size(${GROUP_AGGREGATION_WORKGROUP_SIZE}) fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${getBoundedInvocationIndexSource(dispatchLayout, GROUP_AGGREGATION_WORKGROUP_SIZE)}
  if (index < GROUP_COUNT) {
    atomicStore(&outputValues[OUTPUT_OFFSET + index], ${initialBits});
    ${countInitialization}
  }
}`;
  addComputationPass(graph, {
    id: operation === 'sum' ? `${id}-clear` : `${id}-initialize`,
    source,
    resources: [
      {buffer: output, usage: 'storage-write'},
      ...(counts ? ([{buffer: counts, usage: 'storage-write'}] as GraphBufferUse[]) : [])
    ],
    bindings: {outputValues: output, ...(counts ? {outputCounts: counts} : {})},
    dispatchSize: dispatchLayout
  });
}

/** Accumulates one aligned packed key/value chunk with direct global atomics. */
function addGroupStatisticPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  props: {
    id: string;
    keys: GraphDataView<'uint32'>;
    values: GraphDataView<'float32'>;
    mask?: GraphDataView<'uint32'>;
    output: GraphDataView<'float32'>;
    operation: Exclude<GPUGroupAggregationOperation, 'count'>;
    counts?: GraphDataView<'uint32'>;
    dispatchLayout: GPUGroupAggregationDispatchLayout;
  }
): void {
  const useSubgroups =
    props.output.length <= MAXIMUM_SUBGROUP_COALESCED_GROUP_COUNT &&
    getGPUShaderSubgroupStrategy(graph.device) === 'subgroups';
  const maskBinding = props.mask
    ? '@group(0) @binding(2) var<storage, read> selectionMask: array<u32>;'
    : '';
  const outputBinding = props.mask ? 3 : 2;
  const countsBinding = props.counts
    ? `@group(0) @binding(${outputBinding + 1}) var<storage, read_write> outputCounts: array<atomic<u32>>;`
    : '';
  const maskCondition = props.mask
    ? `selectionMask[${getViewElementOffset(props.mask)}u + index * ${getScalarStride(props.mask)}u] != 0u`
    : 'true';
  const accumulation = useSubgroups
    ? getSubgroupStatisticAggregationWGSL(props.operation, props.output.length, props.counts)
    : `  if (accepted) {
    ${getFloatAggregationCall(props.operation, 'groupIndex')}
    ${props.counts ? `atomicAdd(&outputCounts[${getViewElementOffset(props.counts)}u + groupIndex], 1u);` : ''}
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
${countsBinding}

${getFloatAggregationFunction(props.operation)}
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
    {buffer: props.output, usage: 'storage-read-write'},
    ...(props.counts
      ? ([{buffer: props.counts, usage: 'storage-read-write'}] as GraphBufferUse[])
      : [])
  ];
  addComputationPass(graph, {
    id: `${props.id}-${props.operation}`,
    source,
    resources,
    bindings: {
      groupKeys: props.keys,
      inputValues: props.values,
      ...(props.mask ? {selectionMask: props.mask} : {}),
      outputValues: props.output,
      ...(props.counts ? {outputCounts: props.counts} : {})
    },
    dispatchSize: props.dispatchLayout
  });
}

/** Converts aggregate identities into empty-group NaNs and divides sums for means. */
function addFinalizeGroupStatisticsPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  id: string,
  output: GraphDataView<'float32'>,
  operation: 'min' | 'max' | 'mean',
  counts?: GraphDataView<'uint32'>
): void {
  const dispatchLayout = getGPUGroupAggregationDispatchLayout(
    output.length,
    graph.device.limits.maxComputeWorkgroupsPerDimension
  );
  const countBinding = counts
    ? '@group(0) @binding(1) var<storage, read> outputCounts: array<u32>;'
    : '';
  const finalizeStatement =
    operation === 'mean'
      ? `let count = outputCounts[${getViewElementOffset(counts as GraphDataView)}u + index];
    if (count == 0u) {
      outputValues[OUTPUT_OFFSET + index] = 0x7fc00000u;
    } else {
      let sum = bitcast<f32>(outputValues[OUTPUT_OFFSET + index]);
      outputValues[OUTPUT_OFFSET + index] = bitcast<u32>(sum / f32(count));
    }`
      : `let orderedValue = outputValues[OUTPUT_OFFSET + index];
    if (orderedValue == ${operation === 'min' ? '0xffffffffu' : '0u'}) {
      outputValues[OUTPUT_OFFSET + index] = 0x7fc00000u;
    } else {
      outputValues[OUTPUT_OFFSET + index] = bitcast<u32>(decodeOrderedFloat(orderedValue));
    }`;
  const decodeFunction =
    operation === 'mean'
      ? ''
      : `fn decodeOrderedFloat(value: u32) -> f32 {
  let bits = select(~value, value ^ 0x80000000u, (value & 0x80000000u) != 0u);
  return bitcast<f32>(bits);
}`;
  const source = /* wgsl */ `
const GROUP_COUNT: u32 = ${output.length}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(output)}u;
@group(0) @binding(0) var<storage, read_write> outputValues: array<u32>;
${countBinding}
${decodeFunction}
@compute @workgroup_size(${GROUP_AGGREGATION_WORKGROUP_SIZE}) fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${getBoundedInvocationIndexSource(dispatchLayout, GROUP_AGGREGATION_WORKGROUP_SIZE)}
  if (index < GROUP_COUNT) {
    ${finalizeStatement}
  }
}`;
  addComputationPass(graph, {
    id: `${id}-finalize`,
    source,
    resources: [
      {buffer: output, usage: 'storage-read-write'},
      ...(counts ? ([{buffer: counts, usage: 'storage-read'}] as GraphBufferUse[]) : [])
    ],
    bindings: {outputValues: output, ...(counts ? {outputCounts: counts} : {})},
    dispatchSize: dispatchLayout
  });
}

/** Returns the WGSL helper for one floating-point group statistic. */
function getFloatAggregationFunction(
  operation: Exclude<GPUGroupAggregationOperation, 'count'>
): string {
  if (operation === 'min' || operation === 'max') {
    return `fn encodeOrderedFloat(value: f32) -> u32 {
  let bits = bitcast<u32>(value);
  return select(bits ^ 0x80000000u, ~bits, (bits & 0x80000000u) != 0u);
}`;
  }
  return `fn atomicAddFloat(destination: ptr<storage, atomic<u32>, read_write>, value: f32) {
  var oldBits = atomicLoad(destination);
  loop {
    let newBits = bitcast<u32>(bitcast<f32>(oldBits) + value);
    let result = atomicCompareExchangeWeak(destination, oldBits, newBits);
    if (result.exchanged) { break; }
    oldBits = result.old_value;
  }
}`;
}

/** Returns the WGSL statement that contributes one accepted floating-point value. */
function getFloatAggregationCall(
  operation: Exclude<GPUGroupAggregationOperation, 'count'>,
  groupIndex: string,
  valueExpression: string = 'value'
): string {
  if (operation === 'min' || operation === 'max') {
    const atomicOperation = operation === 'min' ? 'atomicMin' : 'atomicMax';
    return `${atomicOperation}(&outputValues[OUTPUT_OFFSET + ${groupIndex}], encodeOrderedFloat(${valueExpression}));`;
  }
  return `atomicAddFloat(&outputValues[OUTPUT_OFFSET + ${groupIndex}], ${valueExpression});`;
}

/** Coalesces equal group keys and emits one statistic atomic per key represented in a subgroup. */
function getSubgroupStatisticAggregationWGSL(
  operation: Exclude<GPUGroupAggregationOperation, 'count'>,
  groupCount: number,
  counts?: GraphDataView<'uint32'>
): string {
  const orderedOperation = operation === 'min' || operation === 'max';
  const selectedValue = orderedOperation
    ? `select(${operation === 'min' ? '0xffffffffu' : '0u'}, encodeOrderedFloat(value), matchingKey)`
    : 'select(0.0, value, matchingKey)';
  const collective =
    operation === 'min'
      ? 'subgroupMin(selectedValue)'
      : operation === 'max'
        ? 'subgroupMax(selectedValue)'
        : 'subgroupAdd(selectedValue)';
  const aggregationCall = orderedOperation
    ? `${operation === 'min' ? 'atomicMin' : 'atomicMax'}(&outputValues[OUTPUT_OFFSET + leaderKey], aggregatedValue);`
    : getFloatAggregationCall(operation, 'leaderKey', 'aggregatedValue');
  return /* wgsl */ `
  var subgroupPending = accepted;
  for (var subgroupGroup = 0u; subgroupGroup < ${groupCount}u; subgroupGroup++) {
    let pendingBallot = subgroupBallot(subgroupPending);
    let hasPending = any(pendingBallot != vec4<u32>(0u));
    let leaderInvocation = getFirstBallotLane(pendingBallot);
    let leaderKey = subgroupShuffle(groupIndex, leaderInvocation);
    let matchingKey = hasPending && subgroupPending && groupIndex == leaderKey;
    let matchingBallot = subgroupBallot(matchingKey);
    let selectedValue = ${selectedValue};
    let aggregatedValue = ${collective};
    if (hasPending && subgroupInvocationId == leaderInvocation) {
      ${aggregationCall}
      ${counts ? `atomicAdd(&outputCounts[${getViewElementOffset(counts)}u + leaderKey], getBallotLaneCount(matchingBallot));` : ''}
    }
    subgroupPending = subgroupPending && !matchingKey;
  }`;
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
function addComputationPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  props: {
    id: string;
    source: string;
    resources: GraphBufferUse[];
    bindings: Record<string, GraphDataView>;
    dispatchCount?: number;
    dispatchSize?: GPUGroupAggregationDispatchLayout;
  }
): void {
  const maximumWorkgroupCount = props.dispatchSize
    ? props.dispatchSize.x * props.dispatchSize.y * props.dispatchSize.z
    : (props.dispatchCount ?? 1);
  graph.addComputePass({
    id: props.id,
    resources: props.resources,
    workload: {
      operation: 'GPUGroupAggregation',
      commandCount: 1,
      maximumWorkgroupCount,
      maximumInvocationCount: maximumWorkgroupCount * GROUP_AGGREGATION_WORKGROUP_SIZE
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
          if (props.dispatchSize) {
            computation.dispatch(
              computePass,
              props.dispatchSize.x,
              props.dispatchSize.y,
              props.dispatchSize.z
            );
          } else {
            computation.dispatch(computePass, props.dispatchCount!);
          }
        },
        destroy: () => computation.destroy()
      };
    }
  });
}
