// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {type Binding} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import {GPUCommandGraph, type GraphBufferUse, type GraphDataView} from './gpu-command-graph';
import {
  createTransientView,
  doGraphDataViewsOverlap,
  getViewBinding,
  getViewElementOffset,
  validatePackedUint32View
} from './graph-data-view-utils';

const HASH_INDEX_WORKGROUP_SIZE = 256;
const HASH_INDEX_COMPARE_EXCHANGE_RETRY_COUNT = 4;
const MAXIMUM_UINT32 = 0xffffffff;

/** Empty table-key marker. Input rows containing this key are counted as invalid. */
export const GPU_HASH_INDEX_EMPTY_KEY = MAXIMUM_UINT32;
/** `[unique, duplicates, overflow, invalid, total probes, maximum probes]`. */
export const GPU_HASH_INDEX_STATISTICS_LENGTH = 6;
/** `[found, missing, total probes, maximum probes]`. */
export const GPU_HASH_QUERY_STATISTICS_LENGTH = 4;

type DispatchLayout = {x: number; y: number; z: number};

/** Storage contract consumed by {@link GPUHashIndexQuery}. */
export type GPUHashIndexView = {
  tableKeys: GraphDataView<'uint32'>;
  tableValues: GraphDataView<'uint32'>;
  /** Optional six-row build statistics used by consumers that propagate source overflow. */
  statistics?: GraphDataView<'uint32'>;
  maxProbeCount: number;
};

/** Properties for one packed fixed-capacity hash-index rebuild. */
export type GPUHashIndexProps = {
  id?: string;
  /** Packed keys. `0xffffffff` is reserved and ignored. */
  keys: GraphDataView<'uint32'>;
  /** Optional packed values aligned with keys. Generated row IDs are used by default. */
  values?: GraphDataView<'uint32'>;
  /** First generated row ID. Mutually exclusive with `values`. */
  firstValue?: number;
  /** Caller-owned power-of-two key table. Its length defines capacity. */
  tableKeys: GraphDataView<'uint32'>;
  /** Caller-owned values aligned with `tableKeys`. */
  tableValues: GraphDataView<'uint32'>;
  /** Caller-owned six-row build-statistics block. */
  statistics: GraphDataView<'uint32'>;
  /** Maximum slots examined per input. Defaults to table capacity. */
  maxProbeCount?: number;
};

/** CPU-visible allocation and bounded-work facts. */
export type GPUHashIndexStats = {
  capacity: number;
  maxProbeCount: number;
  tableByteLength: number;
  statisticsByteLength: number;
  outputByteLength: number;
};

/**
 * Rebuilds a packed `uint32` key/value hash index with bounded linear probing.
 *
 * Duplicate keys deterministically retain the value from the lowest source row. A full or
 * probe-limited table reports overflow; which distinct keys survive overflow is unspecified.
 */
export class GPUHashIndex implements GPUHashIndexView {
  readonly id: string;
  readonly keys: GraphDataView<'uint32'>;
  readonly values?: GraphDataView<'uint32'>;
  readonly firstValue: number;
  readonly tableKeys: GraphDataView<'uint32'>;
  readonly tableValues: GraphDataView<'uint32'>;
  readonly statistics: GraphDataView<'uint32'>;
  readonly maxProbeCount: number;
  readonly stats: GPUHashIndexStats;
  readonly updatePolicy = 'rebuild' as const;

  constructor(props: GPUHashIndexProps) {
    this.id = props.id ?? 'gpu-hash-index';
    this.keys = props.keys;
    this.values = props.values;
    this.firstValue = props.firstValue ?? 0;
    this.tableKeys = props.tableKeys;
    this.tableValues = props.tableValues;
    this.statistics = props.statistics;
    this.maxProbeCount = props.maxProbeCount ?? this.tableKeys.length;

    for (const [view, name] of [
      [this.keys, 'keys'],
      ...(this.values ? ([[this.values, 'values']] as const) : []),
      [this.tableKeys, 'tableKeys'],
      [this.tableValues, 'tableValues'],
      [this.statistics, 'statistics']
    ] as const) {
      validatePackedUint32View(view, `${this.id} ${name}`);
    }
    if (!isPowerOfTwo(this.tableKeys.length)) {
      throw new Error(`${this.id} table capacity must be a positive power of two`);
    }
    if (this.tableKeys.length > MAXIMUM_UINT32) {
      throw new Error(`${this.id} table capacity must fit in uint32`);
    }
    if (this.tableValues.length !== this.tableKeys.length) {
      throw new Error(`${this.id} table key and value capacities must match`);
    }
    if (this.statistics.length < GPU_HASH_INDEX_STATISTICS_LENGTH) {
      throw new Error(`${this.id} statistics must contain six uint32 rows`);
    }
    if (this.values && this.values.length !== this.keys.length) {
      throw new Error(`${this.id} keys and values lengths must match`);
    }
    if (this.values && props.firstValue !== undefined) {
      throw new Error(`${this.id} values and firstValue are mutually exclusive`);
    }
    if (
      !Number.isSafeInteger(this.firstValue) ||
      this.firstValue < 0 ||
      this.firstValue > MAXIMUM_UINT32 ||
      (this.keys.length > 0 && this.firstValue + this.keys.length - 1 > MAXIMUM_UINT32)
    ) {
      throw new Error(`${this.id} generated values must fit in uint32`);
    }
    validateProbeCount(this.id, this.maxProbeCount, this.tableKeys.length, this.keys.length);
    validateDisjointViews(
      this.id,
      [this.keys, ...(this.values ? [this.values] : [])],
      [this.tableKeys, this.tableValues, this.statistics]
    );

    this.stats = Object.freeze({
      capacity: this.tableKeys.length,
      maxProbeCount: this.maxProbeCount,
      tableByteLength: this.tableKeys.length * 8,
      statisticsByteLength: GPU_HASH_INDEX_STATISTICS_LENGTH * 4,
      outputByteLength: this.tableKeys.length * 8 + GPU_HASH_INDEX_STATISTICS_LENGTH * 4
    });
  }

  /** Adds initialization, insertion, and deterministic value finalization to a command graph. */
  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    const views = [
      this.keys,
      ...(this.values ? [this.values] : []),
      this.tableKeys,
      this.tableValues,
      this.statistics
    ];
    if (views.some(view => view.buffer.graph !== graph)) {
      throw new Error(`${this.id} views must belong to the target graph`);
    }

    const sourceRows = createTransientView(
      graph,
      `${this.id}-source-rows`,
      'uint32',
      this.tableKeys.length
    );
    addBuildInitializePass(graph, this, sourceRows);
    if (this.keys.length > 0) addBuildPass(graph, this, sourceRows);
    addBuildFinalizePass(graph, this, sourceRows);
  }
}

/** Properties for one packed hash-index lookup batch. */
export type GPUHashIndexQueryProps = {
  id?: string;
  index: GPUHashIndexView;
  keys: GraphDataView<'uint32'>;
  /** Caller-owned values aligned with query keys. Missing values become `0xffffffff`. */
  values: GraphDataView<'uint32'>;
  /** Caller-owned nonzero/zero lookup results aligned with query keys. */
  found: GraphDataView<'uint32'>;
  /** Caller-owned number of examined slots per query. */
  probes: GraphDataView<'uint32'>;
  /** Caller-owned four-row query-statistics block. */
  statistics: GraphDataView<'uint32'>;
  /** Defaults to the index build probe bound. */
  maxProbeCount?: number;
};

/** Performs a packed batch of bounded hash-index lookups. */
export class GPUHashIndexQuery {
  readonly id: string;
  readonly index: GPUHashIndexView;
  readonly keys: GraphDataView<'uint32'>;
  readonly values: GraphDataView<'uint32'>;
  readonly found: GraphDataView<'uint32'>;
  readonly probes: GraphDataView<'uint32'>;
  readonly statistics: GraphDataView<'uint32'>;
  readonly maxProbeCount: number;

  constructor(props: GPUHashIndexQueryProps) {
    this.id = props.id ?? 'gpu-hash-index-query';
    this.index = props.index;
    this.keys = props.keys;
    this.values = props.values;
    this.found = props.found;
    this.probes = props.probes;
    this.statistics = props.statistics;
    this.maxProbeCount = props.maxProbeCount ?? this.index.maxProbeCount;

    for (const [view, name] of [
      [this.index.tableKeys, 'index.tableKeys'],
      [this.index.tableValues, 'index.tableValues'],
      [this.keys, 'keys'],
      [this.values, 'values'],
      [this.found, 'found'],
      [this.probes, 'probes'],
      [this.statistics, 'statistics']
    ] as const) {
      validatePackedUint32View(view, `${this.id} ${name}`);
    }
    if (this.index.tableKeys.length !== this.index.tableValues.length) {
      throw new Error(`${this.id} index table key and value capacities must match`);
    }
    if (!isPowerOfTwo(this.index.tableKeys.length)) {
      throw new Error(`${this.id} index capacity must be a positive power of two`);
    }
    if (
      this.values.length !== this.keys.length ||
      this.found.length !== this.keys.length ||
      this.probes.length !== this.keys.length
    ) {
      throw new Error(`${this.id} query outputs must match key length`);
    }
    if (this.statistics.length < GPU_HASH_QUERY_STATISTICS_LENGTH) {
      throw new Error(`${this.id} statistics must contain four uint32 rows`);
    }
    validateProbeCount(this.id, this.maxProbeCount, this.index.tableKeys.length, this.keys.length);
    validateDisjointViews(
      this.id,
      [this.index.tableKeys, this.index.tableValues, this.keys],
      [this.values, this.found, this.probes, this.statistics]
    );
  }

  /** Adds statistics initialization and one bounded lookup pass without submission or readback. */
  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    const views = [
      this.index.tableKeys,
      this.index.tableValues,
      this.keys,
      this.values,
      this.found,
      this.probes,
      this.statistics
    ];
    if (views.some(view => view.buffer.graph !== graph)) {
      throw new Error(`${this.id} views must belong to the target graph`);
    }
    addQueryInitializePass(graph, this);
    if (this.keys.length > 0) addQueryPass(graph, this);
  }
}

function addBuildInitializePass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  index: GPUHashIndex,
  sourceRows: GraphDataView<'uint32'>
): void {
  const layout = getDispatchLayout(
    Math.max(index.tableKeys.length, GPU_HASH_INDEX_STATISTICS_LENGTH),
    graph.device.limits.maxComputeWorkgroupsPerDimension
  );
  const source = /* wgsl */ `
const CAPACITY: u32 = ${index.tableKeys.length}u;
const DISPATCH_X: u32 = ${layout.x}u;
const DISPATCH_Y: u32 = ${layout.y}u;
const TABLE_KEYS_OFFSET: u32 = ${getViewElementOffset(index.tableKeys)}u;
const TABLE_VALUES_OFFSET: u32 = ${getViewElementOffset(index.tableValues)}u;
const SOURCE_ROWS_OFFSET: u32 = ${getViewElementOffset(sourceRows)}u;
const STATISTICS_OFFSET: u32 = ${getViewElementOffset(index.statistics)}u;
@group(0) @binding(0) var<storage, read_write> tableKeys: array<u32>;
@group(0) @binding(1) var<storage, read_write> tableValues: array<u32>;
@group(0) @binding(2) var<storage, read_write> sourceRows: array<u32>;
@group(0) @binding(3) var<storage, read_write> statistics: array<u32>;
@compute @workgroup_size(${HASH_INDEX_WORKGROUP_SIZE}) fn main(
  @builtin(workgroup_id) workgroupId: vec3u,
  @builtin(local_invocation_index) localIndex: u32
) {
  let workgroupIndex = (workgroupId.z * DISPATCH_Y + workgroupId.y) * DISPATCH_X + workgroupId.x;
  let elementIndex = workgroupIndex * ${HASH_INDEX_WORKGROUP_SIZE}u + localIndex;
  if (elementIndex < CAPACITY) {
    tableKeys[TABLE_KEYS_OFFSET + elementIndex] = ${GPU_HASH_INDEX_EMPTY_KEY}u;
    tableValues[TABLE_VALUES_OFFSET + elementIndex] = ${GPU_HASH_INDEX_EMPTY_KEY}u;
    sourceRows[SOURCE_ROWS_OFFSET + elementIndex] = ${GPU_HASH_INDEX_EMPTY_KEY}u;
  }
  if (elementIndex < ${GPU_HASH_INDEX_STATISTICS_LENGTH}u) {
    statistics[STATISTICS_OFFSET + elementIndex] = 0u;
  }
}`;
  addComputationPass(graph, {
    id: `${index.id}-initialize`,
    source,
    resources: [
      {buffer: index.tableKeys, usage: 'storage-write'},
      {buffer: index.tableValues, usage: 'storage-write'},
      {buffer: sourceRows, usage: 'storage-write'},
      {buffer: index.statistics, usage: 'storage-write'}
    ],
    bindings: {
      tableKeys: index.tableKeys,
      tableValues: index.tableValues,
      sourceRows,
      statistics: index.statistics
    },
    dispatchSize: layout
  });
}

function addBuildPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  index: GPUHashIndex,
  sourceRows: GraphDataView<'uint32'>
): void {
  const layout = getDispatchLayout(
    index.keys.length,
    graph.device.limits.maxComputeWorkgroupsPerDimension
  );
  const source = /* wgsl */ `
const ELEMENT_COUNT: u32 = ${index.keys.length}u;
const CAPACITY_MASK: u32 = ${index.tableKeys.length - 1}u;
const MAX_PROBES: u32 = ${index.maxProbeCount}u;
const DISPATCH_X: u32 = ${layout.x}u;
const DISPATCH_Y: u32 = ${layout.y}u;
const KEYS_OFFSET: u32 = ${getViewElementOffset(index.keys)}u;
const TABLE_KEYS_OFFSET: u32 = ${getViewElementOffset(index.tableKeys)}u;
const SOURCE_ROWS_OFFSET: u32 = ${getViewElementOffset(sourceRows)}u;
const STATISTICS_OFFSET: u32 = ${getViewElementOffset(index.statistics)}u;
@group(0) @binding(0) var<storage, read> inputKeys: array<u32>;
@group(0) @binding(1) var<storage, read_write> tableKeys: array<atomic<u32>>;
@group(0) @binding(2) var<storage, read_write> sourceRows: array<atomic<u32>>;
@group(0) @binding(3) var<storage, read_write> statistics: array<atomic<u32>>;

fn hashKey(key: u32) -> u32 {
  var value = key;
  value = (value ^ (value >> 16u)) * 0x7feb352du;
  value = (value ^ (value >> 15u)) * 0x846ca68bu;
  return value ^ (value >> 16u);
}

@compute @workgroup_size(${HASH_INDEX_WORKGROUP_SIZE}) fn main(
  @builtin(workgroup_id) workgroupId: vec3u,
  @builtin(local_invocation_index) localIndex: u32
) {
  let workgroupIndex = (workgroupId.z * DISPATCH_Y + workgroupId.y) * DISPATCH_X + workgroupId.x;
  let inputIndex = workgroupIndex * ${HASH_INDEX_WORKGROUP_SIZE}u + localIndex;
  if (inputIndex >= ELEMENT_COUNT) { return; }
  let key = inputKeys[KEYS_OFFSET + inputIndex];
  if (key == ${GPU_HASH_INDEX_EMPTY_KEY}u) {
    atomicAdd(&statistics[STATISTICS_OFFSET + 3u], 1u);
    return;
  }
  let start = hashKey(key) & CAPACITY_MASK;
  var probes = 0u;
  var inserted = false;
  var duplicate = false;
  for (var probe = 0u; probe < MAX_PROBES; probe++) {
    probes = probe + 1u;
    let slot = (start + probe) & CAPACITY_MASK;
    var result = atomicCompareExchangeWeak(
      &tableKeys[TABLE_KEYS_OFFSET + slot], ${GPU_HASH_INDEX_EMPTY_KEY}u, key
    );
    // Bound spurious weak-CAS retries without probing onward and risking a duplicate slot.
    var exchangeAttempt = 1u;
    while (
      !result.exchanged &&
      result.old_value == ${GPU_HASH_INDEX_EMPTY_KEY}u &&
      exchangeAttempt < ${HASH_INDEX_COMPARE_EXCHANGE_RETRY_COUNT}u
    ) {
      result = atomicCompareExchangeWeak(
        &tableKeys[TABLE_KEYS_OFFSET + slot], ${GPU_HASH_INDEX_EMPTY_KEY}u, key
      );
      exchangeAttempt++;
    }
    if (!result.exchanged && result.old_value == ${GPU_HASH_INDEX_EMPTY_KEY}u) {
      break;
    }
    if (result.exchanged || result.old_value == key) {
      atomicMin(&sourceRows[SOURCE_ROWS_OFFSET + slot], inputIndex);
      inserted = result.exchanged;
      duplicate = !result.exchanged;
      break;
    }
  }
  atomicAdd(&statistics[STATISTICS_OFFSET + 4u], probes);
  atomicMax(&statistics[STATISTICS_OFFSET + 5u], probes);
  if (inserted) {
    atomicAdd(&statistics[STATISTICS_OFFSET], 1u);
  } else if (duplicate) {
    atomicAdd(&statistics[STATISTICS_OFFSET + 1u], 1u);
  } else {
    atomicAdd(&statistics[STATISTICS_OFFSET + 2u], 1u);
  }
}`;
  addComputationPass(graph, {
    id: `${index.id}-build`,
    source,
    resources: [
      {buffer: index.keys, usage: 'storage-read'},
      {buffer: index.tableKeys, usage: 'storage-read-write'},
      {buffer: sourceRows, usage: 'storage-read-write'},
      {buffer: index.statistics, usage: 'storage-read-write'}
    ],
    bindings: {
      inputKeys: index.keys,
      tableKeys: index.tableKeys,
      sourceRows,
      statistics: index.statistics
    },
    dispatchSize: layout
  });
}

function addBuildFinalizePass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  index: GPUHashIndex,
  sourceRows: GraphDataView<'uint32'>
): void {
  const layout = getDispatchLayout(
    index.tableKeys.length,
    graph.device.limits.maxComputeWorkgroupsPerDimension
  );
  const valueBinding = index.values
    ? '@group(0) @binding(3) var<storage, read> inputValues: array<u32>;'
    : '';
  const valueExpression = index.values
    ? `inputValues[${getViewElementOffset(index.values)}u + sourceRow]`
    : `${index.firstValue}u + sourceRow`;
  const source = /* wgsl */ `
const CAPACITY: u32 = ${index.tableKeys.length}u;
const DISPATCH_X: u32 = ${layout.x}u;
const DISPATCH_Y: u32 = ${layout.y}u;
const TABLE_KEYS_OFFSET: u32 = ${getViewElementOffset(index.tableKeys)}u;
const TABLE_VALUES_OFFSET: u32 = ${getViewElementOffset(index.tableValues)}u;
const SOURCE_ROWS_OFFSET: u32 = ${getViewElementOffset(sourceRows)}u;
@group(0) @binding(0) var<storage, read> tableKeys: array<u32>;
@group(0) @binding(1) var<storage, read> sourceRows: array<u32>;
@group(0) @binding(2) var<storage, read_write> tableValues: array<u32>;
${valueBinding}
@compute @workgroup_size(${HASH_INDEX_WORKGROUP_SIZE}) fn main(
  @builtin(workgroup_id) workgroupId: vec3u,
  @builtin(local_invocation_index) localIndex: u32
) {
  let workgroupIndex = (workgroupId.z * DISPATCH_Y + workgroupId.y) * DISPATCH_X + workgroupId.x;
  let slot = workgroupIndex * ${HASH_INDEX_WORKGROUP_SIZE}u + localIndex;
  if (slot >= CAPACITY || tableKeys[TABLE_KEYS_OFFSET + slot] == ${GPU_HASH_INDEX_EMPTY_KEY}u) { return; }
  let sourceRow = sourceRows[SOURCE_ROWS_OFFSET + slot];
  tableValues[TABLE_VALUES_OFFSET + slot] = ${valueExpression};
}`;
  addComputationPass(graph, {
    id: `${index.id}-finalize`,
    source,
    resources: [
      {buffer: index.tableKeys, usage: 'storage-read'},
      {buffer: sourceRows, usage: 'storage-read'},
      {buffer: index.tableValues, usage: 'storage-write'},
      ...(index.values ? ([{buffer: index.values, usage: 'storage-read'}] as GraphBufferUse[]) : [])
    ],
    bindings: {
      tableKeys: index.tableKeys,
      sourceRows,
      tableValues: index.tableValues,
      ...(index.values ? {inputValues: index.values} : {})
    },
    dispatchSize: layout
  });
}

function addQueryInitializePass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  query: GPUHashIndexQuery
): void {
  const source = /* wgsl */ `
const STATISTICS_OFFSET: u32 = ${getViewElementOffset(query.statistics)}u;
@group(0) @binding(0) var<storage, read_write> statistics: array<u32>;
@compute @workgroup_size(${HASH_INDEX_WORKGROUP_SIZE}) fn main(
  @builtin(global_invocation_id) globalId: vec3u
) {
  if (globalId.x < ${GPU_HASH_QUERY_STATISTICS_LENGTH}u) {
    statistics[STATISTICS_OFFSET + globalId.x] = 0u;
  }
}`;
  addComputationPass(graph, {
    id: `${query.id}-initialize`,
    source,
    resources: [{buffer: query.statistics, usage: 'storage-write'}],
    bindings: {statistics: query.statistics},
    dispatchSize: {x: 1, y: 1, z: 1}
  });
}

function addQueryPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  query: GPUHashIndexQuery
): void {
  const layout = getDispatchLayout(
    query.keys.length,
    graph.device.limits.maxComputeWorkgroupsPerDimension
  );
  const source = /* wgsl */ `
const ELEMENT_COUNT: u32 = ${query.keys.length}u;
const CAPACITY_MASK: u32 = ${query.index.tableKeys.length - 1}u;
const MAX_PROBES: u32 = ${query.maxProbeCount}u;
const DISPATCH_X: u32 = ${layout.x}u;
const DISPATCH_Y: u32 = ${layout.y}u;
const KEYS_OFFSET: u32 = ${getViewElementOffset(query.keys)}u;
const TABLE_KEYS_OFFSET: u32 = ${getViewElementOffset(query.index.tableKeys)}u;
const TABLE_VALUES_OFFSET: u32 = ${getViewElementOffset(query.index.tableValues)}u;
const VALUES_OFFSET: u32 = ${getViewElementOffset(query.values)}u;
const FOUND_OFFSET: u32 = ${getViewElementOffset(query.found)}u;
const PROBES_OFFSET: u32 = ${getViewElementOffset(query.probes)}u;
const STATISTICS_OFFSET: u32 = ${getViewElementOffset(query.statistics)}u;
@group(0) @binding(0) var<storage, read> queryKeys: array<u32>;
@group(0) @binding(1) var<storage, read> tableKeys: array<u32>;
@group(0) @binding(2) var<storage, read> tableValues: array<u32>;
@group(0) @binding(3) var<storage, read_write> outputValues: array<u32>;
@group(0) @binding(4) var<storage, read_write> outputFound: array<u32>;
@group(0) @binding(5) var<storage, read_write> outputProbes: array<u32>;
@group(0) @binding(6) var<storage, read_write> statistics: array<atomic<u32>>;

fn hashKey(key: u32) -> u32 {
  var value = key;
  value = (value ^ (value >> 16u)) * 0x7feb352du;
  value = (value ^ (value >> 15u)) * 0x846ca68bu;
  return value ^ (value >> 16u);
}

@compute @workgroup_size(${HASH_INDEX_WORKGROUP_SIZE}) fn main(
  @builtin(workgroup_id) workgroupId: vec3u,
  @builtin(local_invocation_index) localIndex: u32
) {
  let workgroupIndex = (workgroupId.z * DISPATCH_Y + workgroupId.y) * DISPATCH_X + workgroupId.x;
  let queryIndex = workgroupIndex * ${HASH_INDEX_WORKGROUP_SIZE}u + localIndex;
  if (queryIndex >= ELEMENT_COUNT) { return; }
  let key = queryKeys[KEYS_OFFSET + queryIndex];
  var value = ${GPU_HASH_INDEX_EMPTY_KEY}u;
  var found = false;
  var probes = 0u;
  if (key != ${GPU_HASH_INDEX_EMPTY_KEY}u) {
    let start = hashKey(key) & CAPACITY_MASK;
    for (var probe = 0u; probe < MAX_PROBES; probe++) {
      probes = probe + 1u;
      let slot = (start + probe) & CAPACITY_MASK;
      let storedKey = tableKeys[TABLE_KEYS_OFFSET + slot];
      if (storedKey == key) {
        value = tableValues[TABLE_VALUES_OFFSET + slot];
        found = true;
        break;
      }
      if (storedKey == ${GPU_HASH_INDEX_EMPTY_KEY}u) { break; }
    }
  }
  outputValues[VALUES_OFFSET + queryIndex] = value;
  outputFound[FOUND_OFFSET + queryIndex] = select(0u, 1u, found);
  outputProbes[PROBES_OFFSET + queryIndex] = probes;
  atomicAdd(&statistics[STATISTICS_OFFSET + select(1u, 0u, found)], 1u);
  atomicAdd(&statistics[STATISTICS_OFFSET + 2u], probes);
  atomicMax(&statistics[STATISTICS_OFFSET + 3u], probes);
}`;
  addComputationPass(graph, {
    id: `${query.id}-lookup`,
    source,
    resources: [
      {buffer: query.keys, usage: 'storage-read'},
      {buffer: query.index.tableKeys, usage: 'storage-read'},
      {buffer: query.index.tableValues, usage: 'storage-read'},
      {buffer: query.values, usage: 'storage-write'},
      {buffer: query.found, usage: 'storage-write'},
      {buffer: query.probes, usage: 'storage-write'},
      {buffer: query.statistics, usage: 'storage-read-write'}
    ],
    bindings: {
      queryKeys: query.keys,
      tableKeys: query.index.tableKeys,
      tableValues: query.index.tableValues,
      outputValues: query.values,
      outputFound: query.found,
      outputProbes: query.probes,
      statistics: query.statistics
    },
    dispatchSize: layout
  });
}

function validateProbeCount(id: string, probes: number, capacity: number, rows: number): void {
  if (!Number.isSafeInteger(probes) || probes < 1 || probes > capacity) {
    throw new Error(`${id} maxProbeCount must be an integer from one through capacity`);
  }
  if (rows * probes > MAXIMUM_UINT32) {
    throw new Error(`${id} aggregate probe count must fit in uint32 statistics`);
  }
}

function validateDisjointViews(
  id: string,
  inputs: readonly GraphDataView<'uint32'>[],
  outputs: readonly GraphDataView<'uint32'>[]
): void {
  for (const input of inputs) {
    for (const output of outputs) {
      if (doGraphDataViewsOverlap(input, output)) {
        throw new Error(`${id} input and output views must not overlap`);
      }
    }
  }
  for (let first = 0; first < outputs.length; first++) {
    for (let second = first + 1; second < outputs.length; second++) {
      if (doGraphDataViewsOverlap(outputs[first], outputs[second])) {
        throw new Error(`${id} output views must not overlap`);
      }
    }
  }
}

function isPowerOfTwo(value: number): boolean {
  return Number.isSafeInteger(value) && value > 0 && Number.isInteger(Math.log2(value));
}

function getDispatchLayout(elementCount: number, maximumDimension: number): DispatchLayout {
  const maximum = Math.floor(maximumDimension);
  const workgroupCount = Math.max(1, Math.ceil(elementCount / HASH_INDEX_WORKGROUP_SIZE));
  const x = Math.min(workgroupCount, maximum);
  const y = Math.min(Math.ceil(workgroupCount / x), maximum);
  const z = Math.ceil(workgroupCount / x / y);
  if (z > maximum) {
    throw new Error(`GPUHashIndex work exceeds the device 3D dispatch limit`);
  }
  return {x, y, z};
}

function addComputationPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  props: {
    id: string;
    source: string;
    resources: GraphBufferUse[];
    bindings: Record<string, GraphDataView>;
    dispatchSize: DispatchLayout;
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
            props.dispatchSize.x,
            props.dispatchSize.y,
            props.dispatchSize.z
          );
        },
        destroy: () => computation.destroy()
      };
    }
  });
}
