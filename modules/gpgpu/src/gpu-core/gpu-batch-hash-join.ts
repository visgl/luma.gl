// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {GPUCommandGraph, GraphVectorView, type GraphDataView} from './gpu-command-graph';
import {GPUHashJoin} from './gpu-hash-join';
import type {GPUHashIndexView} from './gpu-hash-index';
import {
  doGraphDataViewsOverlap,
  validateMatchingVectorTopology,
  validatePackedUint32View
} from './graph-data-view-utils';

const MAXIMUM_UINT32 = 0xffffffff;

/** Properties for batch-preserving sparse inner joins against one shared right index. */
export type GPUBatchHashJoinProps = {
  id?: string;
  /** Shared right-side key-to-row index queried by every batch. */
  index: GPUHashIndexView;
  /** Ordered left key chunks. Each chunk is an independent publication domain. */
  keys: GraphVectorView<'uint32'>;
  /** Optional explicit left row IDs with the same topology as `keys`. */
  leftRows?: GraphVectorView<'uint32'>;
  /** First globally generated left row ID. Mutually exclusive with `leftRows`. */
  firstLeftRow?: number;
  /** Per-batch left row outputs. Chunk lengths define independent capacities. */
  outputLeftRows: GraphVectorView<'uint32'>;
  /** Per-batch right row outputs with the same topology as `outputLeftRows`. */
  outputRightRows: GraphVectorView<'uint32'>;
  /** One required match count per input chunk. */
  counts: GraphDataView<'uint32'>;
  /** One source-or-capacity overflow flag per input chunk. */
  overflows: GraphDataView<'uint32'>;
  /** Four query statistics rows per input chunk. */
  statistics: GraphDataView<'uint32'>;
  /** Optional source-aligned match masks preserving key topology. */
  found?: GraphVectorView<'uint32'>;
  /** Optional source-aligned probe counts preserving key topology. */
  probes?: GraphVectorView<'uint32'>;
  /** Defaults to the shared index probe bound. */
  maxProbeCount?: number;
};

/** CPU-visible partition and storage facts for {@link GPUBatchHashJoin}. */
export type GPUBatchHashJoinStats = {
  batchCount: number;
  inputLength: number;
  outputCapacity: number;
  maxProbeCount: number;
  outputByteLength: number;
};

/**
 * Preserves left vector chunks while joining each independently against one shared hash index.
 *
 * No input chunk is packed or allowed to spill into another chunk's output capacity. Counts,
 * overflow, and lookup statistics remain batch-addressable, while generated left IDs advance
 * across empty and nonempty chunks in global source order.
 */
export class GPUBatchHashJoin {
  readonly id: string;
  readonly index: GPUHashIndexView;
  readonly keys: GraphVectorView<'uint32'>;
  readonly leftRows?: GraphVectorView<'uint32'>;
  readonly firstLeftRow: number;
  readonly outputLeftRows: GraphVectorView<'uint32'>;
  readonly outputRightRows: GraphVectorView<'uint32'>;
  readonly counts: GraphDataView<'uint32'>;
  readonly overflows: GraphDataView<'uint32'>;
  readonly statistics: GraphDataView<'uint32'>;
  readonly found?: GraphVectorView<'uint32'>;
  readonly probes?: GraphVectorView<'uint32'>;
  readonly maxProbeCount: number;
  readonly stats: GPUBatchHashJoinStats;

  constructor(props: GPUBatchHashJoinProps) {
    this.id = props.id ?? 'gpu-batch-hash-join';
    this.index = props.index;
    this.keys = props.keys;
    this.leftRows = props.leftRows;
    this.firstLeftRow = props.firstLeftRow ?? 0;
    this.outputLeftRows = props.outputLeftRows;
    this.outputRightRows = props.outputRightRows;
    this.counts = props.counts;
    this.overflows = props.overflows;
    this.statistics = props.statistics;
    this.found = props.found;
    this.probes = props.probes;
    this.maxProbeCount = props.maxProbeCount ?? this.index.maxProbeCount;

    validatePackedUint32View(this.index.tableKeys, `${this.id} index.tableKeys`);
    validatePackedUint32View(this.index.tableValues, `${this.id} index.tableValues`);
    if (this.index.statistics) {
      validatePackedUint32View(this.index.statistics, `${this.id} index.statistics`);
      if (this.index.statistics.length < 6) {
        throw new Error(`${this.id} index statistics must contain six uint32 rows`);
      }
    }
    for (const [vector, name] of [
      [this.keys, 'keys'],
      ...(this.leftRows ? ([[this.leftRows, 'leftRows']] as const) : []),
      [this.outputLeftRows, 'outputLeftRows'],
      [this.outputRightRows, 'outputRightRows'],
      ...(this.found ? ([[this.found, 'found']] as const) : []),
      ...(this.probes ? ([[this.probes, 'probes']] as const) : [])
    ] as const) {
      validateUint32Vector(vector, `${this.id} ${name}`);
    }
    for (const [view, name] of [
      [this.counts, 'counts'],
      [this.overflows, 'overflows'],
      [this.statistics, 'statistics']
    ] as const) {
      validatePackedUint32View(view, `${this.id} ${name}`);
    }
    if (this.leftRows) {
      validateMatchingVectorTopology(this.keys, this.leftRows, `${this.id} leftRows`);
      if (props.firstLeftRow !== undefined) {
        throw new Error(`${this.id} leftRows and firstLeftRow are mutually exclusive`);
      }
    }
    validateBatchChunkCount(this.keys, this.outputLeftRows, `${this.id} outputLeftRows`);
    validateBatchChunkCount(this.keys, this.outputRightRows, `${this.id} outputRightRows`);
    validateMatchingVectorTopology(
      this.outputLeftRows,
      this.outputRightRows,
      `${this.id} pair outputs`
    );
    if (this.found) {
      validateMatchingVectorTopology(this.keys, this.found, `${this.id} found`);
    }
    if (this.probes) {
      validateMatchingVectorTopology(this.keys, this.probes, `${this.id} probes`);
    }

    const batchCount = this.keys.data.length;
    if (this.counts.length < batchCount || this.overflows.length < batchCount) {
      throw new Error(`${this.id} counts and overflows require one row per batch`);
    }
    if (this.statistics.length < batchCount * 4) {
      throw new Error(`${this.id} statistics require four rows per batch`);
    }
    if (
      this.index.tableKeys.length !== this.index.tableValues.length ||
      !Number.isInteger(Math.log2(this.index.tableKeys.length))
    ) {
      throw new Error(`${this.id} index must have matching positive power-of-two capacities`);
    }
    if (
      !Number.isSafeInteger(this.maxProbeCount) ||
      this.maxProbeCount < 1 ||
      this.maxProbeCount > this.index.tableKeys.length
    ) {
      throw new Error(`${this.id} maxProbeCount must be an integer from one through capacity`);
    }
    for (const chunk of this.keys.data) {
      if (chunk.length * this.maxProbeCount > MAXIMUM_UINT32) {
        throw new Error(`${this.id} per-batch probe statistics must fit in uint32`);
      }
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
      ...this.keys.data,
      ...(this.leftRows ? this.leftRows.data : [])
    ];
    const outputs = [
      ...this.outputLeftRows.data,
      ...this.outputRightRows.data,
      this.counts,
      this.overflows,
      this.statistics,
      ...(this.found ? this.found.data : []),
      ...(this.probes ? this.probes.data : [])
    ];
    validateDisjointViews(this.id, inputs, outputs);

    const outputCapacity = this.outputLeftRows.data.reduce((sum, chunk) => sum + chunk.length, 0);
    this.stats = Object.freeze({
      batchCount,
      inputLength: this.keys.length,
      outputCapacity,
      maxProbeCount: this.maxProbeCount,
      outputByteLength:
        outputCapacity * 8 +
        (batchCount * 6 +
          (this.found ? this.keys.length : 0) +
          (this.probes ? this.keys.length : 0)) *
          4
    });
  }

  /** Adds one independently bounded join workflow per source chunk. */
  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    let globalLeftRow = this.firstLeftRow;
    for (let batchIndex = 0; batchIndex < this.keys.data.length; batchIndex++) {
      const keys = this.keys.data[batchIndex];
      new GPUHashJoin({
        id: `${this.id}-batch-${batchIndex}`,
        index: this.index,
        keys,
        ...(this.leftRows
          ? {leftRows: this.leftRows.data[batchIndex]}
          : {firstLeftRow: globalLeftRow}),
        outputLeftRows: this.outputLeftRows.data[batchIndex],
        outputRightRows: this.outputRightRows.data[batchIndex],
        count: slicePackedView(graph, this.counts, batchIndex, 1),
        overflow: slicePackedView(graph, this.overflows, batchIndex, 1),
        statistics: slicePackedView(graph, this.statistics, batchIndex * 4, 4),
        ...(this.found ? {found: this.found.data[batchIndex]} : {}),
        ...(this.probes ? {probes: this.probes.data[batchIndex]} : {}),
        maxProbeCount: this.maxProbeCount
      }).addToGraph(graph);
      globalLeftRow += keys.length;
    }
  }
}

function validateUint32Vector(vector: GraphVectorView<'uint32'>, name: string): void {
  if (!(vector instanceof GraphVectorView) || vector.format !== 'uint32') {
    throw new Error(`${name} must be a uint32 GraphVectorView`);
  }
  for (const chunk of vector.data) validatePackedUint32View(chunk, name);
  if (vector.length !== vector.data.reduce((sum, chunk) => sum + chunk.length, 0)) {
    throw new Error(`${name} length must equal its ordered chunk lengths`);
  }
}

function validateBatchChunkCount(
  keys: GraphVectorView<'uint32'>,
  output: GraphVectorView<'uint32'>,
  name: string
): void {
  if (output.data.length !== keys.data.length) {
    throw new Error(`${name} must contain one capacity chunk per input batch`);
  }
}

function slicePackedView<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  view: GraphDataView<'uint32'>,
  rowOffset: number,
  length: number
): GraphDataView<'uint32'> {
  return graph.createDataView(view.buffer, {
    format: 'uint32',
    length,
    byteOffset: view.byteOffset + rowOffset * Uint32Array.BYTES_PER_ELEMENT
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
