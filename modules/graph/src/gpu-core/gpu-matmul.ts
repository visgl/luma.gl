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

export type GPUMatMulProps = {
  id?: string;
  /** Packed row-major M by K matrix, with arbitrary physical chunks. */
  left: DenseView;
  /** Packed row-major K by N matrix, independently partitioned. */
  right: DenseView;
  /** Packed row-major M by N destination; spare capacity is preserved. */
  output: DenseView;
  m: number;
  k: number;
  n: number;
};

/** Dense tiled row-major float32 multiplication: output = left * right. */
export class GPUMatMul {
  readonly id: string;
  readonly left: DenseView;
  readonly right: DenseView;
  readonly output: DenseView;
  readonly m: number;
  readonly k: number;
  readonly n: number;

  constructor(props: GPUMatMulProps) {
    this.id = props.id ?? 'gpu-matmul';
    this.left = props.left;
    this.right = props.right;
    this.output = props.output;
    this.m = props.m;
    this.k = props.k;
    this.n = props.n;
    validateDenseDimensions(
      [this.m, this.k, this.n],
      [this.m * this.k, this.k * this.n, this.m * this.n]
    );
    validateDenseView(this.left, this.m * this.k, this.id);
    validateDenseView(this.right, this.k * this.n, this.id);
    validateDenseView(this.output, this.m * this.n, this.id);
    validateDenseOutput([this.left, this.right], this.output);
  }

  getCommandNodes<Parameters>(
    graph: GPUCommandGraph<Parameters>
  ): readonly GPUCommandNode<Parameters>[] {
    const leftChunks = getDenseChunks(graph, this.left, this.m * this.k);
    const rightChunks = getDenseChunks(graph, this.right, this.k * this.n);
    const outputs = getDenseChunks(graph, this.output, this.m * this.n);
    const nodes: GPUCommandNode<Parameters>[] = [];
    for (const output of outputs) {
      if (!this.k) {
        nodes.push(
          createDenseZeroNode(graph, `${this.id}-zero-${nodes.length}`, 'GPUMatMul', output.data)
        );
        continue;
      }
      const firstRow = Math.floor(output.offset / this.n);
      const rowCount = Math.ceil((output.offset + output.length) / this.n) - firstRow;
      const tilesPerRow = Math.ceil(this.n / 16);
      const tileCount = Math.ceil(rowCount / 16) * tilesPerRow;
      const dispatch = getDenseDispatch(graph, tileCount);
      let accumulate = false;
      for (const left of leftChunks) {
        for (const right of rightChunks) {
          nodes.push(
            createDenseNode(graph, {
              id: `${this.id}-${nodes.length}`,
              operation: 'GPUMatMul',
              inputs: {leftValues: left.data, rightValues: right.data},
              output: output.data,
              dispatch,
              accumulate,
              tiled: true,
              source: makeShaderSource(
                this,
                left,
                right,
                output,
                firstRow,
                rowCount,
                tilesPerRow,
                tileCount,
                dispatch,
                accumulate
              )
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
  matrix: GPUMatMul,
  left: DenseChunk,
  right: DenseChunk,
  output: DenseChunk,
  firstRow: number,
  rowCount: number,
  tilesPerRow: number,
  tileCount: number,
  dispatch: DenseDispatch,
  accumulate: boolean
): string {
  return `@group(0) @binding(0) var<storage, read> leftValues: array<f32>;
@group(0) @binding(1) var<storage, read> rightValues: array<f32>;
@group(0) @binding(2) var<storage, read_write> outputValues: array<f32>;
var<workgroup> leftTile: array<array<f32, 16>, 16>;
var<workgroup> rightTile: array<array<f32, 16>, 16>;

@compute @workgroup_size(16, 16)
fn main(@builtin(workgroup_id) workgroupId: vec3u, @builtin(local_invocation_id) localId: vec3u) {
  ${getDenseWorkgroupIndex(dispatch)}
  if (workgroupIndex >= ${tileCount}u) {
    return;
  }
  let relativeRow = (workgroupIndex / ${tilesPerRow}u) * 16u + localId.y;
  let row = ${firstRow}u + relativeRow;
  let column = (workgroupIndex % ${tilesPerRow}u) * 16u + localId.x;
  var sum = 0.0;
  for (var tileStart = 0u; tileStart < ${matrix.k}u; tileStart += 16u) {
    let leftColumn = tileStart + localId.x;
    let rightRow = tileStart + localId.y;
    let leftIndex = row * ${matrix.k}u + leftColumn;
    let rightIndex = rightRow * ${matrix.n}u + column;
    leftTile[localId.y][localId.x] = 0.0;
    rightTile[localId.y][localId.x] = 0.0;
    if (relativeRow < ${rowCount}u && leftColumn < ${matrix.k}u &&
        leftIndex >= ${left.offset}u && leftIndex - ${left.offset}u < ${left.length}u) {
      leftTile[localId.y][localId.x] = leftValues[${getViewElementOffset(left.data)}u + leftIndex - ${left.offset}u];
    }
    if (rightRow < ${matrix.k}u && column < ${matrix.n}u &&
        rightIndex >= ${right.offset}u && rightIndex - ${right.offset}u < ${right.length}u) {
      rightTile[localId.y][localId.x] = rightValues[${getViewElementOffset(right.data)}u + rightIndex - ${right.offset}u];
    }
    workgroupBarrier();
    for (var inner = 0u; inner < 16u; inner++) {
      let leftElement = row * ${matrix.k}u + tileStart + inner;
      let rightElement = (tileStart + inner) * ${matrix.n}u + column;
      // Missing chunk contributions are absent, not zero times a potentially non-finite value.
      if (relativeRow < ${rowCount}u && column < ${matrix.n}u && tileStart + inner < ${matrix.k}u &&
          leftElement >= ${left.offset}u && leftElement - ${left.offset}u < ${left.length}u &&
          rightElement >= ${right.offset}u && rightElement - ${right.offset}u < ${right.length}u) {
        sum += leftTile[localId.y][inner] * rightTile[inner][localId.x];
      }
    }
    workgroupBarrier();
  }
  let outputIndex = row * ${matrix.n}u + column;
  if (relativeRow < ${rowCount}u && column < ${matrix.n}u &&
      outputIndex >= ${output.offset}u && outputIndex - ${output.offset}u < ${output.length}u) {
    outputValues[${getViewElementOffset(output.data)}u + outputIndex - ${output.offset}u] ${accumulate ? '+=' : '='} sum;
  }
}`;
}
