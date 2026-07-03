// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {type Binding} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import {GPUCommandGraph, type GraphBufferUse, type GraphDataView} from './gpu-command-graph';
import {GPUScan} from './gpu-scan';
import {
  createTransientView,
  getViewBinding,
  getViewElementOffset,
  validatePackedUint32View
} from './graph-data-view-utils';

const BITONIC_WORKGROUP_SIZE = 256;
const RADIX_WORKGROUP_SIZE = 256;
const INVALID_INDEX = 0xffffffff;
const MAXIMUM_LOGICAL_LENGTH = 0x80000000;
const AUTO_BITONIC_MAXIMUM_LENGTH = 65_536;

/** Sort implementation requested by {@link GPUSort}. */
export type GPUSortAlgorithm = 'auto' | 'bitonic' | 'radix';

/** Final key ordering requested by {@link GPUSort}. */
export type GPUSortDirection = 'ascending' | 'descending';

/** Properties for one graph-native stable uint32 key/value sort. */
export type GPUSortProps = {
  /** Prefix for generated graph node and transient resource IDs. */
  id?: string;
  /** Packed unsigned sort keys. */
  keys: GraphDataView<'uint32'>;
  /** Packed payload values paired row-for-row with `keys`. */
  values: GraphDataView<'uint32'>;
  /** Caller-owned sorted key destination. */
  outputKeys: GraphDataView<'uint32'>;
  /** Caller-owned payload destination permuted with the keys. */
  outputValues: GraphDataView<'uint32'>;
  /** Requested implementation. Defaults to `'auto'`. */
  algorithm?: GPUSortAlgorithm;
  /** Requested final order. Defaults to `'ascending'`. */
  direction?: GPUSortDirection;
};

type BitonicStage = {
  blockWidth: number;
  compareStride: number;
};

/**
 * Stable graph-native sort for paired packed uint32 keys and values.
 *
 * @remarks
 * The operation is out-of-place. Inputs and outputs are caller-owned graph views, while all
 * implementation scratch is graph-owned. `addToGraph()` only records work; the caller retains
 * control of graph compilation, command encoding, submission, and optional readback.
 */
export class GPUSort {
  /** Prefix for generated graph node and transient resource IDs. */
  readonly id: string;
  /** Packed unsigned sort keys. */
  readonly keys: GraphDataView<'uint32'>;
  /** Packed payload values paired with the keys. */
  readonly values: GraphDataView<'uint32'>;
  /** Caller-owned sorted key destination. */
  readonly outputKeys: GraphDataView<'uint32'>;
  /** Caller-owned sorted payload destination. */
  readonly outputValues: GraphDataView<'uint32'>;
  /** Algorithm requested by the caller. */
  readonly algorithm: GPUSortAlgorithm;
  /** Final key ordering. */
  readonly direction: GPUSortDirection;
  /** Concrete implementation selected after resolving `'auto'`. */
  readonly resolvedAlgorithm: Exclude<GPUSortAlgorithm, 'auto'>;

  /**
   * Creates and validates an out-of-place stable sort description.
   *
   * @throws If views are not packed `uint32` data, lengths differ, writable buffers alias, or an
   * option or row count is unsupported.
   */
  constructor(props: GPUSortProps) {
    this.id = props.id ?? 'gpu-sort';
    this.keys = props.keys;
    this.values = props.values;
    this.outputKeys = props.outputKeys;
    this.outputValues = props.outputValues;
    this.algorithm = props.algorithm ?? 'auto';
    this.direction = props.direction ?? 'ascending';

    for (const [name, view] of [
      ['keys', this.keys],
      ['values', this.values],
      ['outputKeys', this.outputKeys],
      ['outputValues', this.outputValues]
    ] as const) {
      validatePackedUint32View(view, `${this.id} ${name}`);
    }
    if (!['auto', 'bitonic', 'radix'].includes(this.algorithm)) {
      throw new Error(`${this.id} algorithm must be auto, bitonic, or radix`);
    }
    if (!['ascending', 'descending'].includes(this.direction)) {
      throw new Error(`${this.id} direction must be ascending or descending`);
    }
    if (
      this.values.length !== this.keys.length ||
      this.outputKeys.length !== this.keys.length ||
      this.outputValues.length !== this.keys.length
    ) {
      throw new Error(`${this.id} key, value, and output lengths must match`);
    }
    if (this.keys.length > MAXIMUM_LOGICAL_LENGTH) {
      throw new Error(`${this.id} supports at most ${MAXIMUM_LOGICAL_LENGTH} rows`);
    }
    validateSeparateWritableBuffers(this);

    this.resolvedAlgorithm =
      this.algorithm === 'auto'
        ? this.keys.length <= AUTO_BITONIC_MAXIMUM_LENGTH
          ? 'bitonic'
          : 'radix'
        : this.algorithm;
  }

  /**
   * Adds the selected sort implementation and graph-owned scratch to a command graph.
   *
   * Empty inputs add no nodes; one-row inputs add one copy pass. This method does not compile,
   * encode, submit, or read back commands.
   */
  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    for (const view of [this.keys, this.values, this.outputKeys, this.outputValues]) {
      if (view.buffer.graph !== graph) {
        throw new Error(`${this.id} views must belong to the target graph`);
      }
    }
    if (this.keys.length === 0) {
      return;
    }
    if (this.keys.length === 1) {
      addCopyPairPass(graph, this);
      return;
    }
    if (this.resolvedAlgorithm === 'bitonic') {
      addBitonicSort(graph, this);
    } else {
      addRadixSort(graph, this);
    }
  }
}

/** Enforces out-of-place writes and distinct writable destinations. */
function validateSeparateWritableBuffers(sort: GPUSort): void {
  if (
    sort.outputKeys.buffer === sort.outputValues.buffer ||
    sort.outputKeys.buffer === sort.keys.buffer ||
    sort.outputKeys.buffer === sort.values.buffer ||
    sort.outputValues.buffer === sort.keys.buffer ||
    sort.outputValues.buffer === sort.values.buffer
  ) {
    throw new Error(`${sort.id} outputs must use separate buffers from inputs and each other`);
  }
}

/** Copies a one-row key/value pair without allocating sort scratch. */
function addCopyPairPass<Parameters>(graph: GPUCommandGraph<Parameters>, sort: GPUSort): void {
  const source = /* wgsl */ `
const KEYS_OFFSET: u32 = ${getViewElementOffset(sort.keys)}u;
const VALUES_OFFSET: u32 = ${getViewElementOffset(sort.values)}u;
const OUTPUT_KEYS_OFFSET: u32 = ${getViewElementOffset(sort.outputKeys)}u;
const OUTPUT_VALUES_OFFSET: u32 = ${getViewElementOffset(sort.outputValues)}u;
@group(0) @binding(0) var<storage, read> keys: array<u32>;
@group(0) @binding(1) var<storage, read> values: array<u32>;
@group(0) @binding(2) var<storage, read_write> outputKeys: array<u32>;
@group(0) @binding(3) var<storage, read_write> outputValues: array<u32>;

@compute @workgroup_size(1) fn main() {
  outputKeys[OUTPUT_KEYS_OFFSET] = keys[KEYS_OFFSET];
  outputValues[OUTPUT_VALUES_OFFSET] = values[VALUES_OFFSET];
}`;
  addComputationPass(graph, {
    id: `${sort.id}-copy-pair`,
    source,
    resources: [
      {buffer: sort.keys, usage: 'storage-read'},
      {buffer: sort.values, usage: 'storage-read'},
      {buffer: sort.outputKeys, usage: 'storage-write'},
      {buffer: sort.outputValues, usage: 'storage-write'}
    ],
    bindings: {
      keys: sort.keys,
      values: sort.values,
      outputKeys: sort.outputKeys,
      outputValues: sort.outputValues
    },
    dispatchCount: 1
  });
}

/** Adds padded-index initialization, every bitonic stage, and the final stable gather. */
function addBitonicSort<Parameters>(graph: GPUCommandGraph<Parameters>, sort: GPUSort): void {
  const paddedLength = getNextPowerOfTwo(sort.keys.length);
  const indicesA = createTransientView(
    graph,
    `${sort.id}-bitonic-indices-a`,
    'uint32',
    paddedLength
  );
  const indicesB = createTransientView(
    graph,
    `${sort.id}-bitonic-indices-b`,
    'uint32',
    paddedLength
  );
  addBitonicInitializePass(graph, sort, indicesA, paddedLength);

  let currentIndices = indicesA;
  let nextIndices = indicesB;
  for (const stage of getBitonicStages(paddedLength)) {
    addBitonicStagePass(graph, sort, currentIndices, nextIndices, paddedLength, stage);
    [currentIndices, nextIndices] = [nextIndices, currentIndices];
  }
  addBitonicGatherPass(graph, sort, currentIndices);
}

/** Initializes logical indices and invalid padding for a power-of-two bitonic network. */
function addBitonicInitializePass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  sort: GPUSort,
  indices: GraphDataView<'uint32'>,
  paddedLength: number
): void {
  const source = /* wgsl */ `
const INVALID_INDEX: u32 = ${INVALID_INDEX}u;
const LOGICAL_LENGTH: u32 = ${sort.keys.length}u;
const PADDED_LENGTH: u32 = ${paddedLength}u;
const INDICES_OFFSET: u32 = ${getViewElementOffset(indices)}u;
@group(0) @binding(0) var<storage, read_write> indices: array<u32>;

@compute @workgroup_size(${BITONIC_WORKGROUP_SIZE}) fn main(
  @builtin(global_invocation_id) globalId: vec3<u32>
) {
  let index = globalId.x;
  if (index < PADDED_LENGTH) {
    indices[INDICES_OFFSET + index] = select(INVALID_INDEX, index, index < LOGICAL_LENGTH);
  }
}`;
  addComputationPass(graph, {
    id: `${sort.id}-bitonic-initialize`,
    source,
    resources: [{buffer: indices, usage: 'storage-write'}],
    bindings: {indices},
    dispatchCount: Math.ceil(paddedLength / BITONIC_WORKGROUP_SIZE)
  });
}

/** Adds one compare/exchange stage of the stable bitonic sorting network. */
function addBitonicStagePass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  sort: GPUSort,
  indicesIn: GraphDataView<'uint32'>,
  indicesOut: GraphDataView<'uint32'>,
  paddedLength: number,
  stage: BitonicStage
): void {
  const descending = sort.direction === 'descending';
  const source = /* wgsl */ `
const INVALID_INDEX: u32 = ${INVALID_INDEX}u;
const LOGICAL_LENGTH: u32 = ${sort.keys.length}u;
const PADDED_LENGTH: u32 = ${paddedLength}u;
const BLOCK_WIDTH: u32 = ${stage.blockWidth}u;
const COMPARE_STRIDE: u32 = ${stage.compareStride}u;
const KEYS_OFFSET: u32 = ${getViewElementOffset(sort.keys)}u;
const INDICES_IN_OFFSET: u32 = ${getViewElementOffset(indicesIn)}u;
const INDICES_OUT_OFFSET: u32 = ${getViewElementOffset(indicesOut)}u;
@group(0) @binding(0) var<storage, read> keys: array<u32>;
@group(0) @binding(1) var<storage, read> indicesIn: array<u32>;
@group(0) @binding(2) var<storage, read_write> indicesOut: array<u32>;

fn is_valid(index: u32) -> bool {
  return index != INVALID_INDEX && index < LOGICAL_LENGTH;
}

fn comes_before(leftIndex: u32, rightIndex: u32) -> bool {
  let leftValid = is_valid(leftIndex);
  let rightValid = is_valid(rightIndex);
  if (leftValid != rightValid) { return leftValid; }
  if (!leftValid) { return false; }
  let leftKey = keys[KEYS_OFFSET + leftIndex];
  let rightKey = keys[KEYS_OFFSET + rightIndex];
  if (leftKey == rightKey) { return leftIndex < rightIndex; }
  return ${descending ? 'leftKey > rightKey' : 'leftKey < rightKey'};
}

@compute @workgroup_size(${BITONIC_WORKGROUP_SIZE}) fn main(
  @builtin(global_invocation_id) globalId: vec3<u32>
) {
  let index = globalId.x;
  if (index >= PADDED_LENGTH) { return; }
  let partnerIndex = index ^ COMPARE_STRIDE;
  if (partnerIndex <= index) { return; }
  let leftIndex = indicesIn[INDICES_IN_OFFSET + index];
  let rightIndex = indicesIn[INDICES_IN_OFFSET + partnerIndex];
  let ascending = (index & BLOCK_WIDTH) == 0u;
  let shouldSwap = select(
    comes_before(leftIndex, rightIndex),
    comes_before(rightIndex, leftIndex),
    ascending
  );
  indicesOut[INDICES_OUT_OFFSET + index] = select(leftIndex, rightIndex, shouldSwap);
  indicesOut[INDICES_OUT_OFFSET + partnerIndex] = select(rightIndex, leftIndex, shouldSwap);
}`;
  addComputationPass(graph, {
    id: `${sort.id}-bitonic-${stage.blockWidth}-${stage.compareStride}`,
    source,
    resources: [
      {buffer: sort.keys, usage: 'storage-read'},
      {buffer: indicesIn, usage: 'storage-read'},
      {buffer: indicesOut, usage: 'storage-write'}
    ],
    bindings: {keys: sort.keys, indicesIn, indicesOut},
    dispatchCount: Math.ceil(paddedLength / BITONIC_WORKGROUP_SIZE)
  });
}

/** Gathers keys and payloads through the final sorted logical-index permutation. */
function addBitonicGatherPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  sort: GPUSort,
  indices: GraphDataView<'uint32'>
): void {
  const source = /* wgsl */ `
const LOGICAL_LENGTH: u32 = ${sort.keys.length}u;
const KEYS_OFFSET: u32 = ${getViewElementOffset(sort.keys)}u;
const VALUES_OFFSET: u32 = ${getViewElementOffset(sort.values)}u;
const INDICES_OFFSET: u32 = ${getViewElementOffset(indices)}u;
const OUTPUT_KEYS_OFFSET: u32 = ${getViewElementOffset(sort.outputKeys)}u;
const OUTPUT_VALUES_OFFSET: u32 = ${getViewElementOffset(sort.outputValues)}u;
@group(0) @binding(0) var<storage, read> keys: array<u32>;
@group(0) @binding(1) var<storage, read> values: array<u32>;
@group(0) @binding(2) var<storage, read> indices: array<u32>;
@group(0) @binding(3) var<storage, read_write> outputKeys: array<u32>;
@group(0) @binding(4) var<storage, read_write> outputValues: array<u32>;

@compute @workgroup_size(${BITONIC_WORKGROUP_SIZE}) fn main(
  @builtin(global_invocation_id) globalId: vec3<u32>
) {
  let index = globalId.x;
  if (index >= LOGICAL_LENGTH) { return; }
  let sourceIndex = indices[INDICES_OFFSET + index];
  outputKeys[OUTPUT_KEYS_OFFSET + index] = keys[KEYS_OFFSET + sourceIndex];
  outputValues[OUTPUT_VALUES_OFFSET + index] = values[VALUES_OFFSET + sourceIndex];
}`;
  addComputationPass(graph, {
    id: `${sort.id}-bitonic-gather`,
    source,
    resources: [
      {buffer: sort.keys, usage: 'storage-read'},
      {buffer: sort.values, usage: 'storage-read'},
      {buffer: indices, usage: 'storage-read'},
      {buffer: sort.outputKeys, usage: 'storage-write'},
      {buffer: sort.outputValues, usage: 'storage-write'}
    ],
    bindings: {
      keys: sort.keys,
      values: sort.values,
      indices,
      outputKeys: sort.outputKeys,
      outputValues: sort.outputValues
    },
    dispatchCount: Math.ceil(sort.keys.length / BITONIC_WORKGROUP_SIZE)
  });
}

/** Adds 32 stable least-significant-bit radix partitions and the final output copy if needed. */
function addRadixSort<Parameters>(graph: GPUCommandGraph<Parameters>, sort: GPUSort): void {
  const scratchKeys = createTransientView(
    graph,
    `${sort.id}-radix-scratch-keys`,
    'uint32',
    sort.keys.length
  );
  const scratchValues = createTransientView(
    graph,
    `${sort.id}-radix-scratch-values`,
    'uint32',
    sort.keys.length
  );
  let currentKeys = sort.keys;
  let currentValues = sort.values;

  for (let bit = 0; bit < 32; bit++) {
    const flags = createTransientView(
      graph,
      `${sort.id}-radix-bit-${bit}-flags`,
      'uint32',
      sort.keys.length
    );
    const offsets = createTransientView(
      graph,
      `${sort.id}-radix-bit-${bit}-offsets`,
      'uint32',
      sort.keys.length
    );
    const nextKeys = bit % 2 === 0 ? scratchKeys : sort.outputKeys;
    const nextValues = bit % 2 === 0 ? scratchValues : sort.outputValues;
    addRadixClassifyPass(graph, sort, currentKeys, flags, bit);
    new GPUScan({
      id: `${sort.id}-radix-bit-${bit}-scan`,
      input: flags,
      output: offsets
    }).addToGraph(graph);
    addRadixScatterPass(
      graph,
      sort,
      currentKeys,
      currentValues,
      flags,
      offsets,
      nextKeys,
      nextValues,
      bit
    );
    currentKeys = nextKeys;
    currentValues = nextValues;
  }
}

/** Classifies one key bit into packed zero/one flags for the radix prefix scan. */
function addRadixClassifyPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  sort: GPUSort,
  keys: GraphDataView<'uint32'>,
  flags: GraphDataView<'uint32'>,
  bit: number
): void {
  const firstBit = sort.direction === 'ascending' ? 0 : 1;
  const source = /* wgsl */ `
const ELEMENT_COUNT: u32 = ${sort.keys.length}u;
const BIT_INDEX: u32 = ${bit}u;
const FIRST_BIT: u32 = ${firstBit}u;
const KEYS_OFFSET: u32 = ${getViewElementOffset(keys)}u;
const FLAGS_OFFSET: u32 = ${getViewElementOffset(flags)}u;
@group(0) @binding(0) var<storage, read> keys: array<u32>;
@group(0) @binding(1) var<storage, read_write> flags: array<u32>;

@compute @workgroup_size(${RADIX_WORKGROUP_SIZE}) fn main(
  @builtin(global_invocation_id) globalId: vec3<u32>
) {
  let index = globalId.x;
  if (index >= ELEMENT_COUNT) { return; }
  let bitValue = (keys[KEYS_OFFSET + index] >> BIT_INDEX) & 1u;
  flags[FLAGS_OFFSET + index] = select(0u, 1u, bitValue == FIRST_BIT);
}`;
  addComputationPass(graph, {
    id: `${sort.id}-radix-bit-${bit}-classify`,
    source,
    resources: [
      {buffer: keys, usage: 'storage-read'},
      {buffer: flags, usage: 'storage-write'}
    ],
    bindings: {keys, flags},
    dispatchCount: Math.ceil(sort.keys.length / RADIX_WORKGROUP_SIZE)
  });
}

/** Stably scatters key/value pairs according to one scanned radix bit. */
function addRadixScatterPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  sort: GPUSort,
  keys: GraphDataView<'uint32'>,
  values: GraphDataView<'uint32'>,
  flags: GraphDataView<'uint32'>,
  offsets: GraphDataView<'uint32'>,
  outputKeys: GraphDataView<'uint32'>,
  outputValues: GraphDataView<'uint32'>,
  bit: number
): void {
  const lastIndex = sort.keys.length - 1;
  const source = /* wgsl */ `
const ELEMENT_COUNT: u32 = ${sort.keys.length}u;
const LAST_INDEX: u32 = ${lastIndex}u;
const KEYS_OFFSET: u32 = ${getViewElementOffset(keys)}u;
const VALUES_OFFSET: u32 = ${getViewElementOffset(values)}u;
const FLAGS_OFFSET: u32 = ${getViewElementOffset(flags)}u;
const OFFSETS_OFFSET: u32 = ${getViewElementOffset(offsets)}u;
const OUTPUT_KEYS_OFFSET: u32 = ${getViewElementOffset(outputKeys)}u;
const OUTPUT_VALUES_OFFSET: u32 = ${getViewElementOffset(outputValues)}u;
@group(0) @binding(0) var<storage, read> keys: array<u32>;
@group(0) @binding(1) var<storage, read> values: array<u32>;
@group(0) @binding(2) var<storage, read> flags: array<u32>;
@group(0) @binding(3) var<storage, read> offsets: array<u32>;
@group(0) @binding(4) var<storage, read_write> outputKeys: array<u32>;
@group(0) @binding(5) var<storage, read_write> outputValues: array<u32>;

@compute @workgroup_size(${RADIX_WORKGROUP_SIZE}) fn main(
  @builtin(global_invocation_id) globalId: vec3<u32>
) {
  let index = globalId.x;
  if (index >= ELEMENT_COUNT) { return; }
  let firstOffset = offsets[OFFSETS_OFFSET + index];
  let firstCount = offsets[OFFSETS_OFFSET + LAST_INDEX] + flags[FLAGS_OFFSET + LAST_INDEX];
  let isFirst = flags[FLAGS_OFFSET + index] != 0u;
  let outputIndex = select(firstCount + index - firstOffset, firstOffset, isFirst);
  outputKeys[OUTPUT_KEYS_OFFSET + outputIndex] = keys[KEYS_OFFSET + index];
  outputValues[OUTPUT_VALUES_OFFSET + outputIndex] = values[VALUES_OFFSET + index];
}`;
  addComputationPass(graph, {
    id: `${sort.id}-radix-bit-${bit}-scatter`,
    source,
    resources: [
      {buffer: keys, usage: 'storage-read'},
      {buffer: values, usage: 'storage-read'},
      {buffer: flags, usage: 'storage-read'},
      {buffer: offsets, usage: 'storage-read'},
      {buffer: outputKeys, usage: 'storage-write'},
      {buffer: outputValues, usage: 'storage-write'}
    ],
    bindings: {keys, values, flags, offsets, outputKeys, outputValues},
    dispatchCount: Math.ceil(sort.keys.length / RADIX_WORKGROUP_SIZE)
  });
}

/** Returns the smallest power of two greater than or equal to `length`. */
function getNextPowerOfTwo(length: number): number {
  let paddedLength = 1;
  while (paddedLength < length) {
    paddedLength *= 2;
  }
  return paddedLength;
}

/** Enumerates compare/exchange stages for a complete bitonic network. */
function getBitonicStages(paddedLength: number): BitonicStage[] {
  const stages: BitonicStage[] = [];
  for (let blockWidth = 2; blockWidth <= paddedLength; blockWidth *= 2) {
    for (let compareStride = blockWidth / 2; compareStride >= 1; compareStride /= 2) {
      stages.push({blockWidth, compareStride});
    }
  }
  return stages;
}

/** Wraps generated WGSL in a graph compute node with deferred physical buffer resolution. */
function addComputationPass<GraphParameters>(
  graph: GPUCommandGraph<GraphParameters>,
  props: {
    id: string;
    source: string;
    resources: GraphBufferUse[];
    bindings: Record<string, GraphDataView>;
    dispatchCount: number;
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
          computation.dispatch(computePass, props.dispatchCount);
        },
        destroy: () => computation.destroy()
      };
    }
  });
}
