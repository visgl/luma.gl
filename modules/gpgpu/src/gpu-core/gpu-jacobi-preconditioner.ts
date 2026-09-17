// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GPUCommandGraph, GraphDataView, GraphVectorView} from './gpu-command-graph';
import type {GPUCommandNode} from './gpu-command-node';
import {getViewElementOffset, validatePackedView} from './graph-data-view-utils';
import {alignGraphVectorViews, getGraphVectorData} from './graph-vector-view-utils';
import {createChunkNode, getGraphDataRange, validateChunkViews} from './gpu-chunk-utils';
import {getBoundedDispatchLayout, getBoundedInvocationIndexSource} from './gpu-dispatch-utils';

export type GPUJacobiPreconditionerProps = {
  id?: string;
  rowOffsets: GraphDataView<'uint32'> | GraphVectorView<'uint32'>;
  columnIndices: GraphDataView<'uint32'> | GraphVectorView<'uint32'>;
  values: GraphDataView<'float32'> | GraphVectorView<'float32'>;
  /** Reciprocal of the sum of each row's diagonal entries; zero when the diagonal is missing. */
  inverseDiagonal: GraphDataView<'float32'> | GraphVectorView<'float32'>;
};

/** Builds a Jacobi reciprocal diagonal from independently chunked CSR storage. */
export class GPUJacobiPreconditioner {
  readonly id: string;
  constructor(readonly props: GPUJacobiPreconditionerProps) {
    this.id = props.id ?? 'gpu-jacobi-preconditioner';
    for (const [name, view] of Object.entries({
      rowOffsets: props.rowOffsets,
      columnIndices: props.columnIndices,
      values: props.values,
      inverseDiagonal: props.inverseDiagonal
    })) {
      if (typeof view === 'string') continue;
      for (const chunk of getGraphVectorData(view))
        validatePackedView(
          chunk,
          [name === 'rowOffsets' || name === 'columnIndices' ? 'uint32' : 'float32'],
          this.id
        );
    }
    if (
      props.rowOffsets.length !== props.inverseDiagonal.length + 1 ||
      props.columnIndices.length !== props.values.length
    )
      throw new Error('Jacobi CSR dimensions must match the destination');
  }
  getCommandNodes<Parameters>(
    graph: GPUCommandGraph<Parameters>
  ): readonly GPUCommandNode<Parameters>[] {
    const {rowOffsets, columnIndices, values, inverseDiagonal} = this.props;
    validateChunkViews(graph, [rowOffsets, columnIndices, values], [inverseDiagonal]);
    const rows = alignGraphVectorViews(graph, [
      getGraphDataRange(graph, rowOffsets, 0, inverseDiagonal.length),
      getGraphDataRange(graph, rowOffsets, 1, inverseDiagonal.length),
      inverseDiagonal
    ]);
    const entries = alignGraphVectorViews(graph, [columnIndices, values]);
    const nodes: GPUCommandNode<Parameters>[] = [];
    let rowStart = 0;
    for (const [rowIndex, [begins, ends, output]] of rows.entries()) {
      let entryStart = 0;
      const dispatch = getBoundedDispatchLayout(
        this.id,
        output.length,
        256,
        graph.device.limits.maxComputeWorkgroupsPerDimension
      );
      for (let entryIndex = 0; entryIndex < Math.max(entries.length, 1); entryIndex++) {
        const pair = entries[entryIndex];
        const final = entryIndex === Math.max(entries.length, 1) - 1;
        const source = `
@group(0) @binding(0) var<storage, read> rowBegins: array<u32>;
@group(0) @binding(1) var<storage, read> rowEnds: array<u32>;
${
  pair
    ? `@group(0) @binding(2) var<storage, read> columns: array<u32>;
@group(0) @binding(3) var<storage, read> values: array<f32>;`
    : ''
}
@group(0) @binding(${pair ? 4 : 2}) var<storage, read_write> diagonalValues: array<f32>;
@compute @workgroup_size(256)
fn main(@builtin(workgroup_id) workgroupId: vec3u, @builtin(local_invocation_index) localInvocationIndex: u32) {
  ${getBoundedInvocationIndexSource(dispatch, 256)}
  if (index >= ${output.length}u) { return; }
  let destination = ${getViewElementOffset(output)}u + index;
  var diagonal = ${entryIndex === 0 ? '0.0' : 'diagonalValues[destination]'};
  ${
    pair
      ? `let begin = max(rowBegins[${getViewElementOffset(begins)}u + index], ${entryStart}u);
  let end = min(rowEnds[${getViewElementOffset(ends)}u + index], ${entryStart + pair[0].length}u);
  for (var entry = begin; entry < end; entry++) {
    let localEntry = entry - ${entryStart}u;
    if (columns[${getViewElementOffset(pair[0])}u + localEntry] == ${rowStart}u + index) {
      diagonal += values[${getViewElementOffset(pair[1])}u + localEntry];
    }
  }`
      : ''
  }
  ${final ? `if (diagonal != 0.0) { diagonal = 1.0 / diagonal; }` : ''}
  diagonalValues[destination] = diagonal;
}`;
        nodes.push(
          createChunkNode(graph, {
            id: `${this.id}-rows-${rowIndex}-entries-${entryIndex}`,
            source,
            inputs: {
              rowBegins: begins,
              rowEnds: ends,
              ...(pair ? {columns: pair[0], values: pair[1]} : {})
            },
            outputs: {diagonalValues: output},
            dispatch
          })
        );
        entryStart += pair?.[0].length ?? 0;
      }
      rowStart += output.length;
    }
    return nodes;
  }
}
