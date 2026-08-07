// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {type Binding} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import {GPUCommandGraph, type GraphBufferUse, type GraphDataView} from './gpu-command-graph';
import {
  getBoundedDispatchLayout,
  getBoundedInvocationIndexSource,
  type GPUBoundedDispatchLayout
} from './gpu-dispatch-utils';
import {addGPUScanToGraphWithDispatchLimit, GPUScan} from './gpu-scan';
import {
  createTransientView,
  getViewBinding,
  getViewElementOffset,
  validatePackedUint32View
} from './graph-data-view-utils';

const BITONIC_WORKGROUP_SIZE = 256;
const RADIX_WORKGROUP_SIZE = 256;
const RADIX_DIGIT_BITS = 4;
const RADIX_MASK_WORD_COUNT = RADIX_WORKGROUP_SIZE / 32;
const INVALID_INDEX = 0xffffffff;
const MAXIMUM_LOGICAL_LENGTH = 0x80000000;
const AUTO_BITONIC_MAXIMUM_LENGTH = BITONIC_WORKGROUP_SIZE;

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
  /** Number of significant least-significant key bits processed by radix sort. Defaults to `32`. */
  keyBits?: number;
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
  /** Significant least-significant key bits processed by the radix implementation. */
  readonly keyBits: number;
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
    this.keyBits = props.keyBits ?? 32;

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
    if (!Number.isInteger(this.keyBits) || this.keyBits < 1 || this.keyBits > 32) {
      throw new Error(`${this.id} keyBits must be an integer from 1 to 32`);
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
    addGPUSortToGraphWithDispatchLimit(
      this,
      graph,
      graph.device.limits.maxComputeWorkgroupsPerDimension
    );
  }
}

/** Adds one stable sort while propagating an explicit bounded dispatch limit. @internal */
export function addGPUSortToGraphWithDispatchLimit<Parameters>(
  sort: GPUSort,
  graph: GPUCommandGraph<Parameters>,
  maxComputeWorkgroupsPerDimension: number
): void {
  for (const view of [sort.keys, sort.values, sort.outputKeys, sort.outputValues]) {
    if (view.buffer.graph !== graph) {
      throw new Error(`${sort.id} views must belong to the target graph`);
    }
  }

  if (sort.keys.length === 0) {
    return;
  }
  if (sort.keys.length === 1) {
    addCopyPairPass(graph, sort);
    return;
  }

  const dispatchLayout = getBoundedDispatchLayout(
    'GPUSort',
    sort.keys.length,
    RADIX_WORKGROUP_SIZE,
    maxComputeWorkgroupsPerDimension
  );

  if (sort.resolvedAlgorithm === 'bitonic') {
    addBitonicSort(graph, sort, dispatchLayout, maxComputeWorkgroupsPerDimension);
  } else {
    addRadixSort(graph, sort, dispatchLayout, maxComputeWorkgroupsPerDimension);
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

/** Copies key/value pairs without allocating additional sort scratch. */
function addCopyPairPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  sort: GPUSort,
  inputKeys: GraphDataView<'uint32'> = sort.keys,
  inputValues: GraphDataView<'uint32'> = sort.values,
  identifier = 'copy-pair',
  dispatchLayout: GPUBoundedDispatchLayout = {x: 1, y: 1, z: 1}
): void {
  const source = /* wgsl */ `
const ELEMENT_COUNT: u32 = ${sort.keys.length}u;
const KEYS_OFFSET: u32 = ${getViewElementOffset(inputKeys)}u;
const VALUES_OFFSET: u32 = ${getViewElementOffset(inputValues)}u;
const OUTPUT_KEYS_OFFSET: u32 = ${getViewElementOffset(sort.outputKeys)}u;
const OUTPUT_VALUES_OFFSET: u32 = ${getViewElementOffset(sort.outputValues)}u;
@group(0) @binding(0) var<storage, read> keys: array<u32>;
@group(0) @binding(1) var<storage, read> values: array<u32>;
@group(0) @binding(2) var<storage, read_write> outputKeys: array<u32>;
@group(0) @binding(3) var<storage, read_write> outputValues: array<u32>;

@compute @workgroup_size(${RADIX_WORKGROUP_SIZE}) fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${getBoundedInvocationIndexSource(dispatchLayout, RADIX_WORKGROUP_SIZE)}
  if (index >= ELEMENT_COUNT) { return; }
  outputKeys[OUTPUT_KEYS_OFFSET + index] = keys[KEYS_OFFSET + index];
  outputValues[OUTPUT_VALUES_OFFSET + index] = values[VALUES_OFFSET + index];
}`;
  addComputationPass(graph, {
    id: `${sort.id}-${identifier}`,
    source,
    resources: [
      {buffer: inputKeys, usage: 'storage-read'},
      {buffer: inputValues, usage: 'storage-read'},
      {buffer: sort.outputKeys, usage: 'storage-write'},
      {buffer: sort.outputValues, usage: 'storage-write'}
    ],
    bindings: {
      keys: inputKeys,
      values: inputValues,
      outputKeys: sort.outputKeys,
      outputValues: sort.outputValues
    },
    dispatchLayout
  });
}

/** Adds padded-index initialization, every bitonic stage, and the final stable gather. */
function addBitonicSort<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  sort: GPUSort,
  dispatchLayout: GPUBoundedDispatchLayout,
  maxComputeWorkgroupsPerDimension: number
): void {
  const paddedLength = getNextPowerOfTwo(sort.keys.length);
  if (paddedLength <= BITONIC_WORKGROUP_SIZE) {
    addLocalBitonicSortPass(graph, sort, paddedLength);
    return;
  }
  const paddedDispatchLayout = getBoundedDispatchLayout(
    'GPUSort bitonic',
    paddedLength,
    BITONIC_WORKGROUP_SIZE,
    maxComputeWorkgroupsPerDimension
  );
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
  addBitonicInitializePass(graph, sort, indicesA, paddedLength, paddedDispatchLayout);

  let currentIndices = indicesA;
  let nextIndices = indicesB;
  for (const stage of getBitonicStages(paddedLength)) {
    addBitonicStagePass(
      graph,
      sort,
      currentIndices,
      nextIndices,
      paddedLength,
      stage,
      paddedDispatchLayout
    );
    [currentIndices, nextIndices] = [nextIndices, currentIndices];
  }
  addBitonicGatherPass(graph, sort, currentIndices, dispatchLayout);
}

/** Sorts one complete stable bitonic network in workgroup memory with one graph dispatch. */
function addLocalBitonicSortPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  sort: GPUSort,
  paddedLength: number
): void {
  const descending = sort.direction === 'descending';
  const source = /* wgsl */ `
const INVALID_INDEX: u32 = ${INVALID_INDEX}u;
const LOGICAL_LENGTH: u32 = ${sort.keys.length}u;
const PADDED_LENGTH: u32 = ${paddedLength}u;
const KEYS_OFFSET: u32 = ${getViewElementOffset(sort.keys)}u;
const VALUES_OFFSET: u32 = ${getViewElementOffset(sort.values)}u;
const OUTPUT_KEYS_OFFSET: u32 = ${getViewElementOffset(sort.outputKeys)}u;
const OUTPUT_VALUES_OFFSET: u32 = ${getViewElementOffset(sort.outputValues)}u;
@group(0) @binding(0) var<storage, read> keys: array<u32>;
@group(0) @binding(1) var<storage, read> values: array<u32>;
@group(0) @binding(2) var<storage, read_write> outputKeys: array<u32>;
@group(0) @binding(3) var<storage, read_write> outputValues: array<u32>;
var<workgroup> indices: array<u32, ${paddedLength}>;
var<workgroup> cachedKeys: array<u32, ${paddedLength}>;

fn comes_before(leftIndex: u32, rightIndex: u32) -> bool {
  let leftValid = leftIndex != INVALID_INDEX && leftIndex < LOGICAL_LENGTH;
  let rightValid = rightIndex != INVALID_INDEX && rightIndex < LOGICAL_LENGTH;
  if (leftValid != rightValid) { return leftValid; }
  if (!leftValid) { return false; }
  let leftKey = cachedKeys[leftIndex];
  let rightKey = cachedKeys[rightIndex];
  if (leftKey == rightKey) { return leftIndex < rightIndex; }
  return ${descending ? 'leftKey > rightKey' : 'leftKey < rightKey'};
}

@compute @workgroup_size(${paddedLength}) fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32
) {
  if (localInvocationIndex < PADDED_LENGTH) {
    indices[localInvocationIndex] = select(
      INVALID_INDEX,
      localInvocationIndex,
      localInvocationIndex < LOGICAL_LENGTH
    );
    if (localInvocationIndex < LOGICAL_LENGTH) {
      cachedKeys[localInvocationIndex] = keys[KEYS_OFFSET + localInvocationIndex];
    } else {
      cachedKeys[localInvocationIndex] = 0u;
    }
  }
  workgroupBarrier();

  for (var blockWidth = 2u; blockWidth <= PADDED_LENGTH; blockWidth <<= 1u) {
    for (var compareStride = blockWidth >> 1u; compareStride > 0u; compareStride >>= 1u) {
      let partnerIndex = localInvocationIndex ^ compareStride;
      if (localInvocationIndex < PADDED_LENGTH && partnerIndex > localInvocationIndex) {
        let leftIndex = indices[localInvocationIndex];
        let rightIndex = indices[partnerIndex];
        let ascending = (localInvocationIndex & blockWidth) == 0u;
        let shouldSwap = select(
          comes_before(leftIndex, rightIndex),
          comes_before(rightIndex, leftIndex),
          ascending
        );
        indices[localInvocationIndex] = select(leftIndex, rightIndex, shouldSwap);
        indices[partnerIndex] = select(rightIndex, leftIndex, shouldSwap);
      }
      workgroupBarrier();
    }
  }

  if (localInvocationIndex < LOGICAL_LENGTH) {
    let sourceIndex = indices[localInvocationIndex];
    outputKeys[OUTPUT_KEYS_OFFSET + localInvocationIndex] = cachedKeys[sourceIndex];
    outputValues[OUTPUT_VALUES_OFFSET + localInvocationIndex] = values[VALUES_OFFSET + sourceIndex];
  }
}`;
  addComputationPass(graph, {
    id: `${sort.id}-bitonic-local`,
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
    dispatchLayout: {x: 1, y: 1, z: 1}
  });
}

/** Initializes logical indices and invalid padding for a power-of-two bitonic network. */
function addBitonicInitializePass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  sort: GPUSort,
  indices: GraphDataView<'uint32'>,
  paddedLength: number,
  dispatchLayout: GPUBoundedDispatchLayout
): void {
  const source = /* wgsl */ `
const INVALID_INDEX: u32 = ${INVALID_INDEX}u;
const LOGICAL_LENGTH: u32 = ${sort.keys.length}u;
const PADDED_LENGTH: u32 = ${paddedLength}u;
const INDICES_OFFSET: u32 = ${getViewElementOffset(indices)}u;
@group(0) @binding(0) var<storage, read_write> indices: array<u32>;

@compute @workgroup_size(${BITONIC_WORKGROUP_SIZE}) fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${getBoundedInvocationIndexSource(dispatchLayout, BITONIC_WORKGROUP_SIZE)}
  if (index < PADDED_LENGTH) {
    indices[INDICES_OFFSET + index] = select(INVALID_INDEX, index, index < LOGICAL_LENGTH);
  }
}`;
  addComputationPass(graph, {
    id: `${sort.id}-bitonic-initialize`,
    source,
    resources: [{buffer: indices, usage: 'storage-write'}],
    bindings: {indices},
    dispatchLayout
  });
}

/** Adds one compare/exchange stage of the stable bitonic sorting network. */
function addBitonicStagePass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  sort: GPUSort,
  indicesIn: GraphDataView<'uint32'>,
  indicesOut: GraphDataView<'uint32'>,
  paddedLength: number,
  stage: BitonicStage,
  dispatchLayout: GPUBoundedDispatchLayout
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
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${getBoundedInvocationIndexSource(dispatchLayout, BITONIC_WORKGROUP_SIZE)}
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
    dispatchLayout
  });
}

/** Gathers keys and payloads through the final sorted logical-index permutation. */
function addBitonicGatherPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  sort: GPUSort,
  indices: GraphDataView<'uint32'>,
  dispatchLayout: GPUBoundedDispatchLayout
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
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${getBoundedInvocationIndexSource(dispatchLayout, BITONIC_WORKGROUP_SIZE)}
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
    dispatchLayout
  });
}

/** Adds stable four-bit least-significant-digit histogram, scan, and scatter partitions. */
function addRadixSort<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  sort: GPUSort,
  dispatchLayout: GPUBoundedDispatchLayout,
  maxComputeWorkgroupsPerDimension: number
): void {
  const digitCount = Math.ceil(sort.keyBits / RADIX_DIGIT_BITS);
  const workgroupCount = Math.ceil(sort.keys.length / RADIX_WORKGROUP_SIZE);
  const scratchKeys =
    digitCount > 1
      ? createTransientView(graph, `${sort.id}-radix-scratch-keys`, 'uint32', sort.keys.length)
      : undefined;
  const scratchValues =
    digitCount > 1
      ? createTransientView(graph, `${sort.id}-radix-scratch-values`, 'uint32', sort.keys.length)
      : undefined;
  let currentKeys = sort.keys;
  let currentValues = sort.values;

  for (let digitIndex = 0; digitIndex < digitCount; digitIndex++) {
    const bitOffset = digitIndex * RADIX_DIGIT_BITS;
    const digitBits = Math.min(RADIX_DIGIT_BITS, sort.keyBits - bitOffset);
    const bucketCount = 2 ** digitBits;
    const histogram = createTransientView(
      graph,
      `${sort.id}-radix-digit-${bitOffset}-histogram`,
      'uint32',
      bucketCount * workgroupCount
    );
    const offsets = createTransientView(
      graph,
      `${sort.id}-radix-digit-${bitOffset}-offsets`,
      'uint32',
      bucketCount * workgroupCount
    );
    const writesFinalOutput = (digitCount - digitIndex) % 2 === 1;
    const nextKeys = writesFinalOutput ? sort.outputKeys : scratchKeys;
    const nextValues = writesFinalOutput ? sort.outputValues : scratchValues;
    if (!nextKeys || !nextValues) {
      throw new Error(`${sort.id} radix scratch is missing`);
    }
    addRadixHistogramPass(
      graph,
      sort,
      currentKeys,
      histogram,
      bitOffset,
      digitBits,
      workgroupCount,
      dispatchLayout
    );
    const scan = new GPUScan({
      id: `${sort.id}-radix-digit-${bitOffset}-scan`,
      input: histogram,
      output: offsets
    });
    addGPUScanToGraphWithDispatchLimit(scan, graph, maxComputeWorkgroupsPerDimension);
    addRadixScatterPass(
      graph,
      sort,
      currentKeys,
      currentValues,
      offsets,
      nextKeys,
      nextValues,
      bitOffset,
      digitBits,
      workgroupCount,
      dispatchLayout
    );
    currentKeys = nextKeys;
    currentValues = nextValues;
  }
}

/** Counts one radix digit per workgroup into a digit-major histogram suitable for global scan. */
function addRadixHistogramPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  sort: GPUSort,
  keys: GraphDataView<'uint32'>,
  histogram: GraphDataView<'uint32'>,
  bitOffset: number,
  digitBits: number,
  workgroupCount: number,
  dispatchLayout: GPUBoundedDispatchLayout
): void {
  const bucketCount = 2 ** digitBits;
  const descending = sort.direction === 'descending';
  const source = /* wgsl */ `
const ELEMENT_COUNT: u32 = ${sort.keys.length}u;
const BIT_OFFSET: u32 = ${bitOffset}u;
const BUCKET_COUNT: u32 = ${bucketCount}u;
const DIGIT_MASK: u32 = ${bucketCount - 1}u;
const WORKGROUP_COUNT: u32 = ${workgroupCount}u;
const KEYS_OFFSET: u32 = ${getViewElementOffset(keys)}u;
const HISTOGRAM_OFFSET: u32 = ${getViewElementOffset(histogram)}u;
@group(0) @binding(0) var<storage, read> keys: array<u32>;
@group(0) @binding(1) var<storage, read_write> histogram: array<u32>;
var<workgroup> digitCounts: array<atomic<u32>, ${bucketCount}>;

@compute @workgroup_size(${RADIX_WORKGROUP_SIZE}) fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  let workgroupIndex =
    (workgroupId.z * ${dispatchLayout.y}u + workgroupId.y) * ${dispatchLayout.x}u + workgroupId.x;
  if (workgroupIndex >= WORKGROUP_COUNT) { return; }
  if (localInvocationIndex < BUCKET_COUNT) {
    atomicStore(&digitCounts[localInvocationIndex], 0u);
  }
  workgroupBarrier();

  let index = workgroupIndex * ${RADIX_WORKGROUP_SIZE}u + localInvocationIndex;
  if (index < ELEMENT_COUNT) {
    let key = keys[KEYS_OFFSET + index];
    let digit = (key >> BIT_OFFSET) & DIGIT_MASK;
    let bucket = ${descending ? 'DIGIT_MASK - digit' : 'digit'};
    atomicAdd(&digitCounts[bucket], 1u);
  }
  workgroupBarrier();

  if (localInvocationIndex < BUCKET_COUNT) {
    histogram[HISTOGRAM_OFFSET + localInvocationIndex * WORKGROUP_COUNT + workgroupIndex] =
      atomicLoad(&digitCounts[localInvocationIndex]);
  }
}`;
  addComputationPass(graph, {
    id: `${sort.id}-radix-digit-${bitOffset}-histogram`,
    source,
    resources: [
      {buffer: keys, usage: 'storage-read'},
      {buffer: histogram, usage: 'storage-write'}
    ],
    bindings: {keys, histogram},
    dispatchLayout
  });
}

/** Stably scatters one digit using workgroup ballot masks and digit-major global offsets. */
function addRadixScatterPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  sort: GPUSort,
  keys: GraphDataView<'uint32'>,
  values: GraphDataView<'uint32'>,
  offsets: GraphDataView<'uint32'>,
  outputKeys: GraphDataView<'uint32'>,
  outputValues: GraphDataView<'uint32'>,
  bitOffset: number,
  digitBits: number,
  workgroupCount: number,
  dispatchLayout: GPUBoundedDispatchLayout
): void {
  const bucketCount = 2 ** digitBits;
  const descending = sort.direction === 'descending';
  const source = /* wgsl */ `
const ELEMENT_COUNT: u32 = ${sort.keys.length}u;
const BIT_OFFSET: u32 = ${bitOffset}u;
const DIGIT_MASK: u32 = ${bucketCount - 1}u;
const WORKGROUP_COUNT: u32 = ${workgroupCount}u;
const MASK_WORD_COUNT: u32 = ${RADIX_MASK_WORD_COUNT}u;
const MASK_COUNT: u32 = ${bucketCount * RADIX_MASK_WORD_COUNT}u;
const KEYS_OFFSET: u32 = ${getViewElementOffset(keys)}u;
const VALUES_OFFSET: u32 = ${getViewElementOffset(values)}u;
const OFFSETS_OFFSET: u32 = ${getViewElementOffset(offsets)}u;
const OUTPUT_KEYS_OFFSET: u32 = ${getViewElementOffset(outputKeys)}u;
const OUTPUT_VALUES_OFFSET: u32 = ${getViewElementOffset(outputValues)}u;
@group(0) @binding(0) var<storage, read> keys: array<u32>;
@group(0) @binding(1) var<storage, read> values: array<u32>;
@group(0) @binding(2) var<storage, read> offsets: array<u32>;
@group(0) @binding(3) var<storage, read_write> outputKeys: array<u32>;
@group(0) @binding(4) var<storage, read_write> outputValues: array<u32>;
var<workgroup> digitMasks: array<atomic<u32>, ${bucketCount * RADIX_MASK_WORD_COUNT}>;

@compute @workgroup_size(${RADIX_WORKGROUP_SIZE}) fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  let workgroupIndex =
    (workgroupId.z * ${dispatchLayout.y}u + workgroupId.y) * ${dispatchLayout.x}u + workgroupId.x;
  if (workgroupIndex >= WORKGROUP_COUNT) { return; }
  if (localInvocationIndex < MASK_COUNT) {
    atomicStore(&digitMasks[localInvocationIndex], 0u);
  }
  workgroupBarrier();

  let index = workgroupIndex * ${RADIX_WORKGROUP_SIZE}u + localInvocationIndex;
  let valid = index < ELEMENT_COUNT;
  var key = 0u;
  var bucket = 0u;
  if (valid) {
    key = keys[KEYS_OFFSET + index];
    let digit = (key >> BIT_OFFSET) & DIGIT_MASK;
    bucket = ${descending ? 'DIGIT_MASK - digit' : 'digit'};
    let wordIndex = localInvocationIndex >> 5u;
    let bitIndex = localInvocationIndex & 31u;
    atomicOr(&digitMasks[bucket * MASK_WORD_COUNT + wordIndex], 1u << bitIndex);
  }
  workgroupBarrier();

  if (index >= ELEMENT_COUNT) { return; }
  let maskBase = bucket * MASK_WORD_COUNT;
  let currentWord = localInvocationIndex >> 5u;
  var localRank = 0u;
  for (var word = 0u; word < currentWord; word++) {
    localRank += countOneBits(atomicLoad(&digitMasks[maskBase + word]));
  }
  let precedingBits = (1u << (localInvocationIndex & 31u)) - 1u;
  localRank += countOneBits(atomicLoad(&digitMasks[maskBase + currentWord]) & precedingBits);
  let bucketOffset = offsets[OFFSETS_OFFSET + bucket * WORKGROUP_COUNT + workgroupIndex];
  let outputIndex = bucketOffset + localRank;
  outputKeys[OUTPUT_KEYS_OFFSET + outputIndex] = key;
  outputValues[OUTPUT_VALUES_OFFSET + outputIndex] = values[VALUES_OFFSET + index];
}`;
  addComputationPass(graph, {
    id: `${sort.id}-radix-digit-${bitOffset}-scatter`,
    source,
    resources: [
      {buffer: keys, usage: 'storage-read'},
      {buffer: values, usage: 'storage-read'},
      {buffer: offsets, usage: 'storage-read'},
      {buffer: outputKeys, usage: 'storage-write'},
      {buffer: outputValues, usage: 'storage-write'}
    ],
    bindings: {keys, values, offsets, outputKeys, outputValues},
    dispatchLayout
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
    dispatchLayout: GPUBoundedDispatchLayout;
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
