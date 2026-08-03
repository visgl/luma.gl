// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {type Binding} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import {GPUCommandGraph, type GraphBufferUse, type GraphDataView} from './gpu-command-graph';
import {GPUHashIndexQuery, type GPUHashIndexView} from './gpu-hash-index';
import {GPUScan} from './gpu-scan';
import {
  createTransientView,
  doGraphDataViewsOverlap,
  getViewBinding,
  getViewElementOffset,
  validatePackedUint32View
} from './graph-data-view-utils';

const HASH_JOIN_WORKGROUP_SIZE = 256;
const MAXIMUM_UINT32 = 0xffffffff;

type DispatchLayout = {x: number; y: number; z: number};

/** Properties for a stable, capacity-bounded sparse inner join. */
export type GPUHashJoinProps = {
  id?: string;
  /** Previously built right-side key-to-row index. */
  index: GPUHashIndexView;
  /** Packed left-side keys in source order. */
  keys: GraphDataView<'uint32'>;
  /** Optional left-side row IDs aligned with `keys`. */
  leftRows?: GraphDataView<'uint32'>;
  /** First generated left row ID. Mutually exclusive with `leftRows`. */
  firstLeftRow?: number;
  /** Stable compacted left row IDs. Its length defines output capacity. */
  outputLeftRows: GraphDataView<'uint32'>;
  /** Matched right row IDs aligned with `outputLeftRows`. */
  outputRightRows: GraphDataView<'uint32'>;
  /** Required match count before capacity truncation. */
  count: GraphDataView<'uint32'>;
  /** Nonzero when `count` exceeds output capacity. */
  overflow: GraphDataView<'uint32'>;
  /** Four-row hash-query statistics block. */
  statistics: GraphDataView<'uint32'>;
  /** Optional source-aligned match mask. */
  found?: GraphDataView<'uint32'>;
  /** Optional source-aligned probe counts. */
  probes?: GraphDataView<'uint32'>;
  /** Defaults to the index probe bound. */
  maxProbeCount?: number;
};

/** CPU-visible storage and bounded-work facts for {@link GPUHashJoin}. */
export type GPUHashJoinStats = {
  inputLength: number;
  outputCapacity: number;
  maxProbeCount: number;
  outputByteLength: number;
};

/**
 * Resolves sparse right rows and stably compacts matching row pairs.
 *
 * `count` reports required capacity even when output buffers truncate publication. The workflow
 * adds lookup, scan, and bounded pair-scatter passes without submission or readback.
 */
export class GPUHashJoin {
  readonly id: string;
  readonly index: GPUHashIndexView;
  readonly keys: GraphDataView<'uint32'>;
  readonly leftRows?: GraphDataView<'uint32'>;
  readonly firstLeftRow: number;
  readonly outputLeftRows: GraphDataView<'uint32'>;
  readonly outputRightRows: GraphDataView<'uint32'>;
  readonly count: GraphDataView<'uint32'>;
  readonly overflow: GraphDataView<'uint32'>;
  readonly statistics: GraphDataView<'uint32'>;
  readonly found?: GraphDataView<'uint32'>;
  readonly probes?: GraphDataView<'uint32'>;
  readonly maxProbeCount: number;
  readonly stats: GPUHashJoinStats;

  constructor(props: GPUHashJoinProps) {
    this.id = props.id ?? 'gpu-hash-join';
    this.index = props.index;
    this.keys = props.keys;
    this.leftRows = props.leftRows;
    this.firstLeftRow = props.firstLeftRow ?? 0;
    this.outputLeftRows = props.outputLeftRows;
    this.outputRightRows = props.outputRightRows;
    this.count = props.count;
    this.overflow = props.overflow;
    this.statistics = props.statistics;
    this.found = props.found;
    this.probes = props.probes;
    this.maxProbeCount = props.maxProbeCount ?? this.index.maxProbeCount;

    for (const [view, name] of [
      [this.index.tableKeys, 'index.tableKeys'],
      [this.index.tableValues, 'index.tableValues'],
      ...(this.index.statistics ? ([[this.index.statistics, 'index.statistics']] as const) : []),
      [this.keys, 'keys'],
      ...(this.leftRows ? ([[this.leftRows, 'leftRows']] as const) : []),
      [this.outputLeftRows, 'outputLeftRows'],
      [this.outputRightRows, 'outputRightRows'],
      [this.count, 'count'],
      [this.overflow, 'overflow'],
      [this.statistics, 'statistics'],
      ...(this.found ? ([[this.found, 'found']] as const) : []),
      ...(this.probes ? ([[this.probes, 'probes']] as const) : [])
    ] as const) {
      validatePackedUint32View(view, `${this.id} ${name}`);
    }
    if (this.leftRows && this.leftRows.length !== this.keys.length) {
      throw new Error(`${this.id} leftRows length must match keys`);
    }
    if (this.leftRows && props.firstLeftRow !== undefined) {
      throw new Error(`${this.id} leftRows and firstLeftRow are mutually exclusive`);
    }
    if (this.outputLeftRows.length !== this.outputRightRows.length) {
      throw new Error(`${this.id} output capacities must match`);
    }
    if (
      this.index.tableKeys.length !== this.index.tableValues.length ||
      !Number.isInteger(Math.log2(this.index.tableKeys.length))
    ) {
      throw new Error(`${this.id} index must have matching positive power-of-two capacities`);
    }
    if (this.index.statistics && this.index.statistics.length < 6) {
      throw new Error(`${this.id} index statistics must contain six uint32 rows`);
    }
    if (
      !Number.isSafeInteger(this.maxProbeCount) ||
      this.maxProbeCount < 1 ||
      this.maxProbeCount > this.index.tableKeys.length
    ) {
      throw new Error(`${this.id} maxProbeCount must be an integer from one through capacity`);
    }
    if (this.keys.length * this.maxProbeCount > MAXIMUM_UINT32) {
      throw new Error(`${this.id} aggregate probe count must fit in uint32 statistics`);
    }
    if (this.count.length < 1 || this.overflow.length < 1) {
      throw new Error(`${this.id} count and overflow must contain one uint32 row`);
    }
    if (this.statistics.length < 4) {
      throw new Error(`${this.id} statistics must contain four uint32 rows`);
    }
    if (this.found && this.found.length !== this.keys.length) {
      throw new Error(`${this.id} found length must match keys`);
    }
    if (this.probes && this.probes.length !== this.keys.length) {
      throw new Error(`${this.id} probes length must match keys`);
    }
    if (
      !Number.isSafeInteger(this.firstLeftRow) ||
      this.firstLeftRow < 0 ||
      this.firstLeftRow > MAXIMUM_UINT32 ||
      (this.keys.length > 0 && this.firstLeftRow + this.keys.length - 1 > MAXIMUM_UINT32)
    ) {
      throw new Error(`${this.id} generated left rows must fit in uint32`);
    }

    const inputs = [
      this.index.tableKeys,
      this.index.tableValues,
      ...(this.index.statistics ? [this.index.statistics] : []),
      this.keys,
      ...(this.leftRows ? [this.leftRows] : [])
    ];
    const outputs = [
      this.outputLeftRows,
      this.outputRightRows,
      this.count,
      this.overflow,
      this.statistics,
      ...(this.found ? [this.found] : []),
      ...(this.probes ? [this.probes] : [])
    ];
    validateDisjointViews(this.id, inputs, outputs);

    this.stats = Object.freeze({
      inputLength: this.keys.length,
      outputCapacity: this.outputLeftRows.length,
      maxProbeCount: this.maxProbeCount,
      outputByteLength:
        this.outputLeftRows.length * 8 +
        (2 + 4 + (this.found ? this.keys.length : 0) + (this.probes ? this.keys.length : 0)) * 4
    });
  }

  /** Adds lookup, exclusive scan, and stable bounded pair publication to a graph. */
  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    const views = [
      this.index.tableKeys,
      this.index.tableValues,
      ...(this.index.statistics ? [this.index.statistics] : []),
      this.keys,
      ...(this.leftRows ? [this.leftRows] : []),
      this.outputLeftRows,
      this.outputRightRows,
      this.count,
      this.overflow,
      this.statistics,
      ...(this.found ? [this.found] : []),
      ...(this.probes ? [this.probes] : [])
    ];
    if (views.some(view => view.buffer.graph !== graph)) {
      throw new Error(`${this.id} views must belong to the target graph`);
    }

    const matchedRightRows = createTransientView(
      graph,
      `${this.id}-matched-right-rows`,
      'uint32',
      this.keys.length
    );
    const found =
      this.found ?? createTransientView(graph, `${this.id}-found`, 'uint32', this.keys.length);
    const probes =
      this.probes ?? createTransientView(graph, `${this.id}-probes`, 'uint32', this.keys.length);
    new GPUHashIndexQuery({
      id: `${this.id}-lookup`,
      index: this.index,
      keys: this.keys,
      values: matchedRightRows,
      found,
      probes,
      statistics: this.statistics,
      maxProbeCount: this.maxProbeCount
    }).addToGraph(graph);

    if (this.keys.length === 0) {
      addEmptyJoinPass(graph, this);
    } else {
      const offsets = createTransientView(graph, `${this.id}-offsets`, 'uint32', this.keys.length);
      new GPUScan({id: `${this.id}-scan`, input: found, output: offsets}).addToGraph(graph);
      addJoinScatterPass(graph, this, matchedRightRows, found, offsets);
    }
    if (this.index.statistics) {
      addSourceOverflowPass(graph, this.id, this.index.statistics, this.overflow);
    }
  }
}

function addEmptyJoinPass<Parameters>(graph: GPUCommandGraph<Parameters>, join: GPUHashJoin): void {
  const source = /* wgsl */ `
const COUNT_OFFSET: u32 = ${getViewElementOffset(join.count)}u;
const OVERFLOW_OFFSET: u32 = ${getViewElementOffset(join.overflow)}u;
@group(0) @binding(0) var<storage, read_write> count: array<u32>;
@group(0) @binding(1) var<storage, read_write> overflow: array<u32>;
@compute @workgroup_size(1) fn main() {
  count[COUNT_OFFSET] = 0u;
  overflow[OVERFLOW_OFFSET] = 0u;
}`;
  addComputationPass(graph, {
    id: `${join.id}-empty`,
    source,
    resources: [
      {buffer: join.count, usage: 'storage-write'},
      {buffer: join.overflow, usage: 'storage-write'}
    ],
    bindings: {count: join.count, overflow: join.overflow},
    dispatchSize: {x: 1, y: 1, z: 1}
  });
}

function addJoinScatterPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  join: GPUHashJoin,
  matchedRightRows: GraphDataView<'uint32'>,
  found: GraphDataView<'uint32'>,
  offsets: GraphDataView<'uint32'>
): void {
  const layout = getDispatchLayout(
    join.keys.length,
    graph.device.limits.maxComputeWorkgroupsPerDimension
  );
  const leftRowsBinding = join.leftRows
    ? '@group(0) @binding(3) var<storage, read> leftRows: array<u32>;'
    : '';
  const leftRowExpression = join.leftRows
    ? `leftRows[${getViewElementOffset(join.leftRows)}u + inputIndex]`
    : `${join.firstLeftRow}u + inputIndex`;
  const firstOutputBinding = join.leftRows ? 4 : 3;
  const source = /* wgsl */ `
const ELEMENT_COUNT: u32 = ${join.keys.length}u;
const OUTPUT_CAPACITY: u32 = ${join.outputLeftRows.length}u;
const DISPATCH_X: u32 = ${layout.x}u;
const DISPATCH_Y: u32 = ${layout.y}u;
const MATCHED_ROWS_OFFSET: u32 = ${getViewElementOffset(matchedRightRows)}u;
const FOUND_OFFSET: u32 = ${getViewElementOffset(found)}u;
const OFFSETS_OFFSET: u32 = ${getViewElementOffset(offsets)}u;
const OUTPUT_LEFT_OFFSET: u32 = ${getViewElementOffset(join.outputLeftRows)}u;
const OUTPUT_RIGHT_OFFSET: u32 = ${getViewElementOffset(join.outputRightRows)}u;
const COUNT_OFFSET: u32 = ${getViewElementOffset(join.count)}u;
const OVERFLOW_OFFSET: u32 = ${getViewElementOffset(join.overflow)}u;
@group(0) @binding(0) var<storage, read> matchedRightRows: array<u32>;
@group(0) @binding(1) var<storage, read> found: array<u32>;
@group(0) @binding(2) var<storage, read> offsets: array<u32>;
${leftRowsBinding}
@group(0) @binding(${firstOutputBinding}) var<storage, read_write> outputLeftRows: array<u32>;
@group(0) @binding(${firstOutputBinding + 1}) var<storage, read_write> outputRightRows: array<u32>;
@group(0) @binding(${firstOutputBinding + 2}) var<storage, read_write> count: array<u32>;
@group(0) @binding(${firstOutputBinding + 3}) var<storage, read_write> overflow: array<u32>;

@compute @workgroup_size(${HASH_JOIN_WORKGROUP_SIZE}) fn main(
  @builtin(workgroup_id) workgroupId: vec3u,
  @builtin(local_invocation_index) localIndex: u32
) {
  let workgroupIndex = (workgroupId.z * DISPATCH_Y + workgroupId.y) * DISPATCH_X + workgroupId.x;
  let inputIndex = workgroupIndex * ${HASH_JOIN_WORKGROUP_SIZE}u + localIndex;
  if (inputIndex >= ELEMENT_COUNT) { return; }
  let accepted = min(found[FOUND_OFFSET + inputIndex], 1u);
  let outputIndex = offsets[OFFSETS_OFFSET + inputIndex];
  if (accepted != 0u && outputIndex < OUTPUT_CAPACITY) {
    outputLeftRows[OUTPUT_LEFT_OFFSET + outputIndex] = ${leftRowExpression};
    outputRightRows[OUTPUT_RIGHT_OFFSET + outputIndex] =
      matchedRightRows[MATCHED_ROWS_OFFSET + inputIndex];
  }
  if (inputIndex == ELEMENT_COUNT - 1u) {
    let requiredCount = outputIndex + accepted;
    count[COUNT_OFFSET] = requiredCount;
    overflow[OVERFLOW_OFFSET] = select(0u, 1u, requiredCount > OUTPUT_CAPACITY);
  }
}`;
  addComputationPass(graph, {
    id: `${join.id}-scatter`,
    source,
    resources: [
      {buffer: matchedRightRows, usage: 'storage-read'},
      {buffer: found, usage: 'storage-read'},
      {buffer: offsets, usage: 'storage-read'},
      ...(join.leftRows
        ? ([{buffer: join.leftRows, usage: 'storage-read'}] as GraphBufferUse[])
        : []),
      {buffer: join.outputLeftRows, usage: 'storage-write'},
      {buffer: join.outputRightRows, usage: 'storage-write'},
      {buffer: join.count, usage: 'storage-write'},
      {buffer: join.overflow, usage: 'storage-write'}
    ],
    bindings: {
      matchedRightRows,
      found,
      offsets,
      ...(join.leftRows ? {leftRows: join.leftRows} : {}),
      outputLeftRows: join.outputLeftRows,
      outputRightRows: join.outputRightRows,
      count: join.count,
      overflow: join.overflow
    },
    dispatchSize: layout
  });
}

function addSourceOverflowPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  id: string,
  indexStatistics: GraphDataView<'uint32'>,
  overflow: GraphDataView<'uint32'>
): void {
  const source = /* wgsl */ `
const INDEX_STATISTICS_OFFSET: u32 = ${getViewElementOffset(indexStatistics)}u;
const OVERFLOW_OFFSET: u32 = ${getViewElementOffset(overflow)}u;
@group(0) @binding(0) var<storage, read> indexStatistics: array<u32>;
@group(0) @binding(1) var<storage, read_write> overflow: array<u32>;
@compute @workgroup_size(1) fn main() {
  if (indexStatistics[INDEX_STATISTICS_OFFSET + 2u] != 0u) {
    overflow[OVERFLOW_OFFSET] = 1u;
  }
}`;
  addComputationPass(graph, {
    id: `${id}-source-overflow`,
    source,
    resources: [
      {buffer: indexStatistics, usage: 'storage-read'},
      {buffer: overflow, usage: 'storage-read-write'}
    ],
    bindings: {indexStatistics, overflow},
    dispatchSize: {x: 1, y: 1, z: 1}
  });
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

function getDispatchLayout(elementCount: number, maximumDimension: number): DispatchLayout {
  const maximum = Math.floor(maximumDimension);
  const workgroupCount = Math.max(1, Math.ceil(elementCount / HASH_JOIN_WORKGROUP_SIZE));
  const x = Math.min(workgroupCount, maximum);
  const y = Math.min(Math.ceil(workgroupCount / x), maximum);
  const z = Math.ceil(workgroupCount / x / y);
  if (z > maximum) {
    throw new Error(`GPUHashJoin work exceeds the device 3D dispatch limit`);
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
