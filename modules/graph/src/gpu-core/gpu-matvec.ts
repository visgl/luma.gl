// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GPUCommandNode} from './gpu-command-node';
import type {GPUCommandGraph} from './gpu-command-graph';
import {getViewElementOffset} from './graph-data-view-utils';
import {
  type DenseView,
  type DenseChunk,
  type DenseDispatch,
  validateDenseDimensions,
  validateDenseView,
  validateDenseOutput,
  getDenseChunks,
  getDenseDispatch,
  getDenseWorkgroupIndex,
  createDenseNode,
  createDenseZeroNode
} from './gpu-dense-utils';

export type GPUMatVecProps = {
  id?: string;
  /** Packed row-major matrix; chunks may split rows. */
  matrix: DenseView;
  /** Packed vector with independent physical chunks. */
  vector: DenseView;
  /** Packed destination; spare capacity is preserved. */
  output: DenseView;
  rows: number;
  columns: number;
};

/** Dense row-major float32 multiplication: output = matrix * vector. */
export class GPUMatVec {
  readonly id: string;
  readonly matrix: DenseView;
  readonly vector: DenseView;
  readonly output: DenseView;
  readonly rows: number;
  readonly columns: number;

  constructor(props: GPUMatVecProps) {
    this.id = props.id ?? 'gpu-matvec';
    this.matrix = props.matrix;
    this.vector = props.vector;
    this.output = props.output;
    this.rows = props.rows;
    this.columns = props.columns;
    validateDenseDimensions([this.rows, this.columns], [this.rows * this.columns]);
    validateDenseView(this.matrix, this.rows * this.columns, this.id);
    validateDenseView(this.vector, this.columns, this.id);
    validateDenseView(this.output, this.rows, this.id);
    validateDenseOutput([this.matrix, this.vector], this.output);
  }

  getCommandNodes<Parameters>(
    graph: GPUCommandGraph<Parameters>
  ): readonly GPUCommandNode<Parameters>[] {
    const matrices = getDenseChunks(graph, this.matrix, this.rows * this.columns);
    const vectors = getDenseChunks(graph, this.vector, this.columns);
    const outputs = getDenseChunks(graph, this.output, this.rows);
    const nodes: GPUCommandNode<Parameters>[] = [];
    for (const output of outputs) {
      if (!this.columns) {
        nodes.push(
          createDenseZeroNode(graph, `${this.id}-zero-${nodes.length}`, 'GPUMatVec', output.data)
        );
        continue;
      }
      const dispatch = getDenseDispatch(graph, output.length);
      let accumulate = false;
      for (const matrix of matrices) {
        for (const vector of vectors) {
          nodes.push(
            createDenseNode(graph, {
              id: `${this.id}-${nodes.length}`,
              operation: 'GPUMatVec',
              inputs: {matrixValues: matrix.data, vectorValues: vector.data},
              output: output.data,
              dispatch,
              accumulate,
              source: makeShaderSource(this.columns, matrix, vector, output, dispatch, accumulate)
            })
          );
          accumulate = true;
        }
      }
    }
    return nodes;
  }
}

function makeShaderSource(
  columns: number,
  matrix: DenseChunk,
  vector: DenseChunk,
  output: DenseChunk,
  dispatch: DenseDispatch,
  accumulate: boolean
): string {
  return `@group(0) @binding(0) var<storage, read> matrixValues: array<f32>;
@group(0) @binding(1) var<storage, read> vectorValues: array<f32>;
@group(0) @binding(2) var<storage, read_write> outputValues: array<f32>;
var<workgroup> partials: array<f32, 256>;

@compute @workgroup_size(256)
fn main(@builtin(workgroup_id) workgroupId: vec3u, @builtin(local_invocation_index) lane: u32) {
  ${getDenseWorkgroupIndex(dispatch)}
  if (workgroupIndex >= ${output.length}u) {
    return;
  }
  let row = ${output.offset}u + workgroupIndex;
  var sum = 0.0;
  for (var column = ${vector.offset}u + lane; column < ${vector.offset + vector.length}u; column += 256u) {
    let matrixIndex = row * ${columns}u + column;
    if (matrixIndex >= ${matrix.offset}u && matrixIndex - ${matrix.offset}u < ${matrix.length}u) {
      sum += matrixValues[${getViewElementOffset(matrix.data)}u + matrixIndex - ${matrix.offset}u] *
        vectorValues[${getViewElementOffset(vector.data)}u + column - ${vector.offset}u];
    }
  }
  partials[lane] = sum;
  workgroupBarrier();
  for (var stride = 128u; stride > 0u; stride /= 2u) {
    if (lane < stride) {
      partials[lane] += partials[lane + stride];
    }
    workgroupBarrier();
  }
  if (lane == 0u) {
    outputValues[${getViewElementOffset(output.data)}u + workgroupIndex] ${accumulate ? '+=' : '='} partials[0];
  }
}`;
}
