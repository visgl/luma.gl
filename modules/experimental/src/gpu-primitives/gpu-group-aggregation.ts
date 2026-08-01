// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {type Binding} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import {
  GPUCommandGraph,
  GraphVectorView,
  type GraphBufferUse,
  type GraphDataView
} from './gpu-command-graph';
import {
  getViewBinding,
  getViewElementOffset,
  validateMatchingVectorTopology,
  validatePackedUint32View
} from './graph-data-view-utils';

const GROUP_AGGREGATION_WORKGROUP_SIZE = 256;
const MAXIMUM_LOCAL_GROUP_COUNT = 256;

type GPUGroupAggregationDispatchLayout = {x: number; y: number; z: number};

/** One packed group-key chunk or an ordered vector of packed group-key chunks. */
export type GPUGroupAggregationKeys = GraphDataView<'uint32'> | GraphVectorView<'uint32'>;

/** Optional nonzero/zero row selection with the same topology as the group keys. */
export type GPUGroupAggregationMask = GraphDataView<'uint32'> | GraphVectorView<'uint32'>;

/** Statistic computed by {@link GPUGroupAggregation}. */
export type GPUGroupAggregationOperation = 'count';

/** Properties for graph-native dense group aggregation. */
export type GPUGroupAggregationProps = {
  /** Prefix for generated graph node IDs. */
  id?: string;
  /** Dense unsigned group keys. Keys outside the output range are ignored. */
  keys: GPUGroupAggregationKeys;
  /** Caller-owned counts. Its length defines the valid group-key range. */
  output: GraphDataView<'uint32'>;
  /** Optional nonzero/zero selection with the same view kind and chunk topology as `keys`. */
  mask?: GPUGroupAggregationMask;
  /** Group statistic. Defaults to `'count'`. */
  operation?: GPUGroupAggregationOperation;
};

/**
 * Counts dense unsigned group keys, optionally restricted by a GPU-resident row selection.
 *
 * Output is cleared on every encoding. Group keys in `[0, output.length)` identify output rows;
 * larger keys are ignored. Nonzero mask values include a row. Up to 256 groups use
 * workgroup-local atomics before merging, while larger outputs accumulate directly with global
 * atomics. Vector inputs retain their source chunk boundaries without packing.
 */
export class GPUGroupAggregation {
  /** Prefix for generated graph node IDs. */
  readonly id: string;
  /** Packed group keys or ordered group-key vector. */
  readonly keys: GPUGroupAggregationKeys;
  /** Caller-owned dense group counts. */
  readonly output: GraphDataView<'uint32'>;
  /** Optional source-aligned row selection. */
  readonly mask?: GPUGroupAggregationMask;
  /** Group statistic computed by this aggregation. */
  readonly operation: GPUGroupAggregationOperation;

  /** Creates and validates a dense group-count description. */
  constructor(props: GPUGroupAggregationProps) {
    this.id = props.id ?? 'gpu-group-aggregation';
    this.keys = props.keys;
    this.output = props.output;
    this.mask = props.mask;
    this.operation = props.operation ?? 'count';

    for (const [chunkIndex, chunk] of getGroupChunks(this.keys).entries()) {
      validatePackedUint32View(chunk, `${this.id} keys chunk ${chunkIndex}`);
    }
    validatePackedUint32View(this.output, `${this.id} output`);
    if (this.output.length === 0) {
      throw new Error(`${this.id} output must contain at least one group`);
    }
    if (this.operation !== 'count') {
      throw new Error(`${this.id} operation must be count`);
    }
    if (getGroupChunks(this.keys).some(chunk => chunk.buffer === this.output.buffer)) {
      throw new Error(`${this.id} keys and output must use separate buffers`);
    }
    if (this.mask) {
      if (this.keys instanceof GraphVectorView !== this.mask instanceof GraphVectorView) {
        throw new Error(`${this.id} keys and mask must use the same view kind`);
      }
      for (const [chunkIndex, chunk] of getGroupChunks(this.mask).entries()) {
        validatePackedUint32View(chunk, `${this.id} mask chunk ${chunkIndex}`);
        if (chunk.buffer === this.output.buffer) {
          throw new Error(`${this.id} mask and output must use separate buffers`);
        }
      }
      if (this.keys instanceof GraphVectorView && this.mask instanceof GraphVectorView) {
        validateMatchingVectorTopology(this.keys, this.mask, `${this.id} keys and mask`);
      } else if (this.keys.length !== this.mask.length) {
        throw new Error(`${this.id} keys and mask lengths must match`);
      }
    }
  }

  /**
   * Adds one output-clear pass and one accumulation pass per non-empty source chunk.
   *
   * This method declares work only and does not submit or read back commands.
   */
  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    const keyChunks = getGroupChunks(this.keys);
    const maskChunks = this.mask ? getGroupChunks(this.mask) : undefined;
    if (
      keyChunks.some(chunk => chunk.buffer.graph !== graph) ||
      maskChunks?.some(chunk => chunk.buffer.graph !== graph) ||
      this.output.buffer.graph !== graph
    ) {
      throw new Error(`${this.id} views must belong to the target graph`);
    }

    addClearGroupsPass(graph, this.id, this.output);
    const accumulationPath = this.output.length <= MAXIMUM_LOCAL_GROUP_COUNT ? 'local' : 'global';
    for (let chunkIndex = 0; chunkIndex < keyChunks.length; chunkIndex++) {
      const keys = keyChunks[chunkIndex];
      if (keys.length === 0) continue;
      addGroupCountPass(graph, {
        id:
          this.keys instanceof GraphVectorView
            ? `${this.id}-chunk-${chunkIndex}-${accumulationPath}`
            : `${this.id}-${accumulationPath}`,
        keys,
        output: this.output,
        mask: maskChunks?.[chunkIndex],
        dispatchLayout: getGPUGroupAggregationDispatchLayout(
          keys.length,
          graph.device.limits.maxComputeWorkgroupsPerDimension
        )
      });
    }
  }
}

/** Returns one atomic view or the original ordered vector chunks. */
function getGroupChunks(
  input: GPUGroupAggregationKeys | GPUGroupAggregationMask
): readonly GraphDataView<'uint32'>[] {
  return input instanceof GraphVectorView ? input.data : [input];
}

/** Clears every group count before accumulation for the current graph encoding. */
function addClearGroupsPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  id: string,
  output: GraphDataView<'uint32'>
): void {
  const source = /* wgsl */ `
const GROUP_COUNT: u32 = ${output.length}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(output)}u;
@group(0) @binding(0) var<storage, read_write> outputCounts: array<atomic<u32>>;

@compute @workgroup_size(${GROUP_AGGREGATION_WORKGROUP_SIZE})
fn main(@builtin(global_invocation_id) globalId: vec3<u32>) {
  if (globalId.x < GROUP_COUNT) {
    atomicStore(&outputCounts[OUTPUT_OFFSET + globalId.x], 0u);
  }
}`;
  addComputationPass(graph, {
    id: `${id}-clear`,
    source,
    resources: [{buffer: output, usage: 'storage-write'}],
    bindings: {outputCounts: output},
    dispatchCount: Math.ceil(output.length / GROUP_AGGREGATION_WORKGROUP_SIZE)
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
  const maskBinding = props.mask
    ? '@group(0) @binding(1) var<storage, read> selectionMask: array<u32>;'
    : '';
  const outputBinding = props.mask ? 2 : 1;
  const maskCondition = props.mask
    ? `selectionMask[${getViewElementOffset(props.mask)}u + index] != 0u`
    : 'true';
  const accumulation = local
    ? `if (accepted) { atomicAdd(&localCounts[groupIndex], 1u); }
  workgroupBarrier();
  if (lane < GROUP_COUNT) {
    atomicAdd(&outputCounts[OUTPUT_OFFSET + lane], atomicLoad(&localCounts[lane]));
  }`
    : 'if (accepted) { atomicAdd(&outputCounts[OUTPUT_OFFSET + groupIndex], 1u); }';
  const source = /* wgsl */ `
const ELEMENT_COUNT: u32 = ${props.keys.length}u;
const GROUP_COUNT: u32 = ${props.output.length}u;
const KEYS_OFFSET: u32 = ${getViewElementOffset(props.keys)}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(props.output)}u;
@group(0) @binding(0) var<storage, read> groupKeys: array<u32>;
${maskBinding}
@group(0) @binding(${outputBinding}) var<storage, read_write> outputCounts: array<atomic<u32>>;
${local ? `var<workgroup> localCounts: array<atomic<u32>, ${props.output.length}>;` : ''}

@compute @workgroup_size(${GROUP_AGGREGATION_WORKGROUP_SIZE}) fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_id) localId: vec3<u32>
) {
  let workgroupIndex = (workgroupId.z * ${props.dispatchLayout.y}u + workgroupId.y) * ${props.dispatchLayout.x}u + workgroupId.x;
  let index = workgroupIndex * ${GROUP_AGGREGATION_WORKGROUP_SIZE}u + localId.x;
  let lane = localId.x;
  ${local ? 'if (lane < GROUP_COUNT) { atomicStore(&localCounts[lane], 0u); }\n  workgroupBarrier();' : ''}
  var accepted = false;
  var groupIndex = 0u;
  if (index < ELEMENT_COUNT && ${maskCondition}) {
    groupIndex = groupKeys[KEYS_OFFSET + index];
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

/** Plans a bounded 3D dispatch for one packed group-key chunk. @internal */
export function getGPUGroupAggregationDispatchLayout(
  elementCount: number,
  maxComputeWorkgroupsPerDimension: number
): GPUGroupAggregationDispatchLayout {
  const maximum = Math.floor(maxComputeWorkgroupsPerDimension);
  const workgroupCount = Math.max(1, Math.ceil(elementCount / GROUP_AGGREGATION_WORKGROUP_SIZE));
  const x = Math.min(workgroupCount, maximum);
  const y = Math.min(Math.ceil(workgroupCount / x), maximum);
  const z = Math.ceil(workgroupCount / x / y);
  if (z > maximum) {
    throw new Error(
      `GPUGroupAggregation requires ${workgroupCount} workgroups, exceeding the 3D dispatch limit of ${maximum} per dimension`
    );
  }
  return {x, y, z};
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
  graph.addComputePass({
    id: props.id,
    resources: props.resources,
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
