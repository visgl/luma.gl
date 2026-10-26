// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GPUCommandNode} from './gpu-command-node';
import type {GPUCommandGraph, GraphDataView, GraphVectorView} from './gpu-command-graph';
import {
  getViewElementOffset,
  validatePackedUint32View,
  validatePackedView
} from './graph-data-view-utils';
import {getGraphVectorData} from './graph-vector-view-utils';
import {createChunkNode, validateChunkViews} from './gpu-chunk-utils';
import {getBoundedDispatchLayout, getBoundedInvocationIndexSource} from './gpu-dispatch-utils';
import {GPUElementwise} from './gpu-elementwise';

export type GPUCOOToCSRProps = {
  id?: string;
  rowIndices: GraphDataView<'uint32'> | GraphVectorView<'uint32'>;
  columnIndices: GraphDataView<'uint32'> | GraphVectorView<'uint32'>;
  values: GraphDataView<'float32'> | GraphVectorView<'float32'>;
  rows: number;
  rowOffsets: GraphDataView<'uint32'> | GraphVectorView<'uint32'>;
  outputColumnIndices: GraphDataView<'uint32'> | GraphVectorView<'uint32'>;
  outputValues: GraphDataView<'float32'> | GraphVectorView<'float32'>;
};
/** Converts row-sorted COO entries into CSR without CPU readback. */
export class GPUCOOToCSR {
  readonly id: string;
  readonly props: GPUCOOToCSRProps;
  constructor(props: GPUCOOToCSRProps) {
    this.id = props.id ?? 'gpu-coo-to-csr';
    this.props = props;
    for (const chunk of getGraphVectorData(props.rowIndices))
      validatePackedUint32View(chunk, `${this.id} rowIndices`);
    for (const chunk of getGraphVectorData(props.columnIndices))
      validatePackedUint32View(chunk, `${this.id} columnIndices`);
    for (const chunk of getGraphVectorData(props.values))
      validatePackedView(chunk, ['float32'], `${this.id} values`);
    for (const chunk of getGraphVectorData(props.rowOffsets))
      validatePackedUint32View(chunk, `${this.id} rowOffsets`);
    for (const chunk of getGraphVectorData(props.outputColumnIndices))
      validatePackedUint32View(chunk, `${this.id} outputColumnIndices`);
    for (const chunk of getGraphVectorData(props.outputValues))
      validatePackedView(chunk, ['float32'], `${this.id} outputValues`);
    const nonzeroCount = props.rowIndices.length;
    if (props.columnIndices.length !== nonzeroCount || props.values.length !== nonzeroCount)
      throw new Error(`${this.id} COO arrays must have equal length`);
    if (
      !Number.isSafeInteger(props.rows) ||
      props.rows < 0 ||
      props.rows >= 0xffffffff ||
      nonzeroCount > 0xffffffff
    )
      throw new Error(`${this.id} rows must be a non-negative integer`);
    if (props.rowOffsets.length !== props.rows + 1)
      throw new Error(`${this.id} rowOffsets length must equal rows + 1`);
    if (
      props.outputColumnIndices.length !== nonzeroCount ||
      props.outputValues.length !== nonzeroCount
    )
      throw new Error(`${this.id} CSR entry outputs must have length nnz`);
  }
  getCommandNodes<Parameters>(
    graph: GPUCommandGraph<Parameters>
  ): readonly GPUCommandNode<Parameters>[] {
    const {rowIndices, columnIndices, values, rowOffsets, outputColumnIndices, outputValues} =
      this.props;
    validateChunkViews(
      graph,
      [rowIndices, columnIndices, values],
      [rowOffsets, outputColumnIndices, outputValues]
    );
    const nodes: GPUCommandNode<Parameters>[] = [
      ...new GPUElementwise({
        id: `${this.id}-copy-columns`,
        input: columnIndices,
        output: outputColumnIndices,
        operation: 'copy'
      }).getCommandNodes(graph),
      ...new GPUElementwise({
        id: `${this.id}-copy-values`,
        input: values,
        output: outputValues,
        operation: 'copy'
      }).getCommandNodes(graph)
    ];
    const inputChunks = getGraphVectorData(rowIndices).filter(chunk => chunk.length);
    let firstRow = 0;
    for (const [outputIndex, output] of getGraphVectorData(rowOffsets).entries()) {
      if (!output.length) continue;
      const dispatch = getBoundedDispatchLayout(
        this.id,
        output.length,
        256,
        graph.device.limits.maxComputeWorkgroupsPerDimension
      );
      // Add each chunk's lower bound. Sorted COO preserves global order without packing entries.
      for (let inputIndex = 0; inputIndex < Math.max(1, inputChunks.length); inputIndex++) {
        const input = inputChunks[inputIndex];
        nodes.push(
          createChunkNode(graph, {
            id: `${this.id}-offsets-${outputIndex}-${inputIndex}`,
            inputs: input ? {rows: input} : {},
            outputs: {offsets: output},
            dispatch,
            source: `
${input ? '@group(0) @binding(0) var<storage, read> rows: array<u32>;' : ''}
@group(0) @binding(${input ? 1 : 0}) var<storage, read_write> offsets: array<u32>;
@compute @workgroup_size(256)
fn main(@builtin(workgroup_id) workgroupId: vec3u, @builtin(local_invocation_index) localInvocationIndex: u32) {
  ${getBoundedInvocationIndexSource(dispatch, 256)}
  if (index >= ${output.length}u) { return; }
  let targetRow = ${firstRow}u + index;
  var low = 0u;
  ${
    input
      ? `var high = ${input.length}u;
  loop {
    if (low >= high) { break; }
    let middle = low + (high - low) / 2u;
    if (rows[${getViewElementOffset(input)}u + middle] < targetRow) { low = middle + 1u; }
    else { high = middle; }
  }`
      : ''
  }
  offsets[${getViewElementOffset(output)}u + index] ${inputIndex ? '+=' : '='} low;
}`
          })
        );
      }
      firstRow += output.length;
    }
    return nodes;
  }
}
