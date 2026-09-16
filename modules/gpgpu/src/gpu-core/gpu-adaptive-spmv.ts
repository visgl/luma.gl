// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {type GPUCommandGraph, type GraphDataView, type GraphVectorView} from './gpu-command-graph';
import type {GPUCommandNode} from './gpu-command-node';
import {
  createTransientView,
  getViewElementOffset,
  validatePackedView
} from './graph-data-view-utils';
import {alignGraphVectorViews, getGraphVectorData} from './graph-vector-view-utils';
import {getGPUVectorChunks} from '../gpu-data/gpu-vector-chunks';
import {
  createChunkNode,
  getChunkDispatch,
  getGraphDataRange,
  validateChunkViews
} from './gpu-chunk-utils';
import {getBoundedInvocationIndexSource} from './gpu-dispatch-utils';
import {
  selectGPUSpMVStrategy,
  type GPUSpMVRowStatistics,
  type GPUSpMVStrategyId
} from './gpu-spmv-strategy';

export type GPUAdaptiveSpMVProps = {
  id?: string;
  rowOffsets: GraphDataView<'uint32'> | GraphVectorView<'uint32'>;
  columnIndices: GraphDataView<'uint32'> | GraphVectorView<'uint32'>;
  values: GraphDataView<'float32'> | GraphVectorView<'float32'>;
  vector: GraphDataView<'float32'> | GraphVectorView<'float32'>;
  output: GraphDataView<'float32'> | GraphVectorView<'float32'>;
  columns: number;
  /** Optional row-shape metadata. No CPU readback is performed to obtain it. */
  statistics?: GPUSpMVRowStatistics;
  strategy?: GPUSpMVStrategyId;
};

/** Adaptive CSR multiplication with global column indices and independently stored chunks. */
export class GPUAdaptiveSpMV {
  readonly id: string;
  readonly props: GPUAdaptiveSpMVProps;

  constructor(props: GPUAdaptiveSpMVProps) {
    this.id = props.id ?? 'gpu-adaptive-spmv';
    this.props = props;
    for (const [name, view] of Object.entries({
      rowOffsets: props.rowOffsets,
      columnIndices: props.columnIndices,
      values: props.values,
      vector: props.vector,
      output: props.output
    })) {
      for (const chunk of getGraphVectorData(view))
        validatePackedView(
          chunk,
          [name === 'rowOffsets' || name === 'columnIndices' ? 'uint32' : 'float32'],
          `${this.id} ${name}`
        );
      if (view.length > 0xffffffff) throw new Error('SpMV logical lengths must fit in uint32');
    }
    if (props.rowOffsets.length !== props.output.length + 1)
      throw new Error(`${this.id} rowOffsets length must equal output.length + 1`);
    if (props.columnIndices.length !== props.values.length)
      throw new Error(`${this.id} columnIndices and values must have equal length`);
    if (!Number.isSafeInteger(props.columns) || props.columns < 0)
      throw new Error(`${this.id} columns must be a non-negative integer`);
    if (props.vector.length !== props.columns)
      throw new Error(`${this.id} vector length must equal columns`);
  }

  getStrategy<Parameters>(graph: GPUCommandGraph<Parameters>) {
    return selectGPUSpMVStrategy(
      graph.device,
      {
        rows: this.props.output.length,
        nonZeros: this.props.values.length,
        statistics: this.props.statistics
      },
      this.props.strategy
    );
  }

  explain<Parameters>(graph: GPUCommandGraph<Parameters>) {
    const decision = this.getStrategy(graph);
    return Object.freeze({
      operation: 'GPUSpMV',
      strategy: decision.id,
      score: decision.score,
      reason: decision.reason,
      ...decision.details
    });
  }

  getCommandNodes<Parameters>(
    graph: GPUCommandGraph<Parameters>
  ): readonly GPUCommandNode<Parameters>[] {
    const {rowOffsets, columnIndices, values, vector, output} = this.props;
    validateChunkViews(graph, [rowOffsets, columnIndices, values, vector], [output]);
    if (!output.length) return [];
    const nodes: GPUCommandNode<Parameters>[] = [];
    const decision = this.getStrategy(graph);
    const strategy = decision.id;
    const workgroupSize = decision.details.workgroupSize;
    const parts = strategy === 'long-row' ? decision.details.workgroupsPerLongRow : 1;
    const rows = alignGraphVectorViews(graph, [
      getGraphDataRange(graph, rowOffsets, 0, output.length),
      getGraphDataRange(graph, rowOffsets, 1, output.length),
      output
    ]);
    const nonzeros = alignGraphVectorViews(graph, [columnIndices, values]);
    const vectors = getGPUVectorChunks(getGraphVectorData(vector)).filter(chunk => chunk.length);
    const maximum = graph.device.limits.maxComputeWorkgroupsPerDimension;
    let rowIndex = 0;
    for (const rowSpan of rows) {
      // Bound long-row reduction scratch independently of the matrix and destination partitions.
      const blockLength = Math.min(
        4096,
        Math.floor(graph.device.limits.maxStorageBufferBindingSize / (parts * 4))
      );
      if (blockLength < 1) throw new Error('SpMV count scratch must fit a storage binding');
      for (let start = 0; start < rowSpan[0].length; start += blockLength) {
        const length = Math.min(blockLength, rowSpan[0].length - start);
        const [begins, ends, destination] = rowSpan.map(view =>
          graph.createDataView(view.buffer, {
            format: view.format,
            length,
            byteOffset: view.byteOffset + start * 4
          })
        );
        const partials =
          strategy === 'long-row'
            ? createTransientView(
                graph,
                `${this.id}-rows-${rowIndex}-partials`,
                'float32',
                length * parts
              )
            : undefined;
        let initialize = true;
        let nonzeroStart = 0;
        for (const [nonzeroIndex, [indices, matrixValues]] of nonzeros.entries()) {
          for (const [vectorIndex, chunk] of vectors.entries()) {
            const id = `${this.id}-rows-${rowIndex}-nonzeros-${nonzeroIndex}-vector-${vectorIndex}-${strategy}`;
            // One subgroup owns each row, independent of the device's subgroup width.
            const workgroups =
              strategy === 'scalar-row' ? Math.ceil(length / workgroupSize) : length * parts;
            const dispatch = getChunkDispatch(workgroups, maximum);
            const outputView = partials ?? destination;
            const source = makeShader({
              strategy,
              workgroupSize,
              parts,
              length,
              begins,
              ends,
              indices,
              matrixValues,
              vector: chunk.data,
              output: outputView,
              nonzeroStart,
              vectorStart: chunk.offset,
              initialize,
              dispatch
            });
            nodes.push(
              createChunkNode(graph, {
                id,
                source,
                inputs: {
                  rowBegins: begins,
                  rowEnds: ends,
                  columnIndices: indices,
                  matrixValues,
                  vectorValues: chunk.data
                },
                outputs: {[partials ? 'rowPartials' : 'outputValues']: outputView},
                dispatch,
                workgroupSize
              })
            );
            if (partials) {
              const finalizeDispatch = getChunkDispatch(Math.ceil(length / 64), maximum);
              nodes.push(
                createChunkNode(graph, {
                  id: `${id}-finalize`,
                  inputs: {rowPartials: partials},
                  outputs: {outputValues: destination},
                  dispatch: finalizeDispatch,
                  workgroupSize: 64,
                  source: /* wgsl */ `
@group(0) @binding(0) var<storage, read> rowPartials: array<f32>;
@group(0) @binding(1) var<storage, read_write> outputValues: array<f32>;
@compute @workgroup_size(64) fn main(@builtin(workgroup_id) workgroupId: vec3u, @builtin(local_invocation_index) localInvocationIndex: u32) {
  ${getBoundedInvocationIndexSource(finalizeDispatch, 64)}
  if (index >= ${length}u) { return; }
  var sum = 0.0;
  for (var part = 0u; part < ${parts}u; part++) { sum += rowPartials[index * ${parts}u + part]; }
  outputValues[${getViewElementOffset(destination)}u + index] ${initialize ? '=' : '+='} sum;
}`
                })
              );
            }
            initialize = false;
          }
          nonzeroStart += indices.length;
        }
        if (initialize) {
          const dispatch = getChunkDispatch(Math.ceil(length / 256), maximum);
          nodes.push(
            createChunkNode(graph, {
              id: `${this.id}-rows-${rowIndex}-clear`,
              outputs: {outputValues: destination},
              dispatch,
              source: /* wgsl */ `
@group(0) @binding(0) var<storage, read_write> outputValues: array<f32>;
@compute @workgroup_size(256) fn main(@builtin(workgroup_id) workgroupId: vec3u, @builtin(local_invocation_index) localInvocationIndex: u32) {
  ${getBoundedInvocationIndexSource(dispatch, 256)}
  if (index < ${length}u) { outputValues[${getViewElementOffset(destination)}u + index] = 0.0; }
}`
            })
          );
        }
        rowIndex++;
      }
    }
    return nodes;
  }
}

function makeShader(props: {
  strategy: GPUSpMVStrategyId;
  workgroupSize: number;
  parts: number;
  length: number;
  begins: GraphDataView;
  ends: GraphDataView;
  indices: GraphDataView;
  matrixValues: GraphDataView;
  vector: GraphDataView;
  output: GraphDataView;
  nonzeroStart: number;
  vectorStart: number;
  initialize: boolean;
  dispatch: {x: number; y: number; z: number};
}): string {
  const {strategy, workgroupSize, parts, length, dispatch} = props;
  const subgroup = strategy === 'subgroup-row';
  const cooperative = strategy === 'workgroup-row' || strategy === 'long-row';
  const longRow = strategy === 'long-row';
  const resultName = longRow ? 'rowPartials' : 'outputValues';
  return /* wgsl */ `
${subgroup ? 'enable subgroups;\nrequires subgroup_id;' : ''}
@group(0) @binding(0) var<storage, read> rowBegins: array<u32>;
@group(0) @binding(1) var<storage, read> rowEnds: array<u32>;
@group(0) @binding(2) var<storage, read> columnIndices: array<u32>;
@group(0) @binding(3) var<storage, read> matrixValues: array<f32>;
@group(0) @binding(4) var<storage, read> vectorValues: array<f32>;
@group(0) @binding(5) var<storage, read_write> ${resultName}: array<f32>;
${cooperative ? `var<workgroup> scratch: array<f32, ${workgroupSize}>;` : ''}
@compute @workgroup_size(${workgroupSize}) fn main(
  @builtin(workgroup_id) workgroupId: vec3u,
  @builtin(local_invocation_index) localInvocationIndex: u32${subgroup ? ',\n  @builtin(subgroup_id) subgroupId: u32,\n  @builtin(subgroup_invocation_id) subgroupLane: u32,\n  @builtin(subgroup_size) subgroupSize: u32' : ''}
) {
  let workgroupIndex = (workgroupId.z * ${dispatch.y}u + workgroupId.y) * ${dispatch.x}u + workgroupId.x;
  ${strategy === 'scalar-row' ? `let row = workgroupIndex * ${workgroupSize}u + localInvocationIndex;` : `let row = workgroupIndex / ${parts}u;`}
  if (row >= ${length}u) { return; }
  ${subgroup ? 'if (subgroupId != 0u) { return; }' : ''}
  let begin = max(rowBegins[${getViewElementOffset(props.begins)}u + row], ${props.nonzeroStart}u);
  let end = min(rowEnds[${getViewElementOffset(props.ends)}u + row], ${props.nonzeroStart + props.indices.length}u);
  let part = workgroupIndex % ${parts}u;
  let lane = ${subgroup ? 'subgroupLane' : cooperative ? 'localInvocationIndex' : '0u'};
  let stride = ${subgroup ? 'subgroupSize' : `${cooperative ? workgroupSize * parts : 1}u`};
  var sum = 0.0;
  // Test the lane offset before addition so an empty or final uint32 range cannot wrap.
  var localIndex = part * ${workgroupSize}u + lane;
  loop {
    if (begin >= end || localIndex >= end - begin) { break; }
    let nonzero = begin - ${props.nonzeroStart}u + localIndex;
    let column = columnIndices[${getViewElementOffset(props.indices)}u + nonzero];
    if (column >= ${props.vectorStart}u && column - ${props.vectorStart}u < ${props.vector.length}u) {
      sum += matrixValues[${getViewElementOffset(props.matrixValues)}u + nonzero] * vectorValues[${getViewElementOffset(props.vector)}u + column - ${props.vectorStart}u];
    }
    if (end - begin - localIndex <= stride) { break; }
    localIndex += stride;
  }
  ${subgroup ? 'sum = subgroupAdd(sum);' : ''}
  ${
    cooperative
      ? `scratch[lane] = sum;
  workgroupBarrier();
  for (var reductionStride = ${workgroupSize / 2}u; reductionStride > 0u; reductionStride /= 2u) {
    if (lane < reductionStride) { scratch[lane] += scratch[lane + reductionStride]; }
    workgroupBarrier();
  }
  sum = scratch[0];`
      : ''
  }
  if (lane == 0u) {
    ${resultName}[${getViewElementOffset(props.output)}u + row * ${parts}u + ${longRow ? 'part' : '0u'}] ${longRow || props.initialize ? '=' : '+='} sum;
  }
}`;
}
