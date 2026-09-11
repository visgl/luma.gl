// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Binding} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import {GPUCommandGraph, type GraphDataView} from './gpu-command-graph';
import {getViewBinding, getViewElementOffset, validatePackedView} from './graph-data-view-utils';

const WORKGROUP_SIZE = 256;

export type GPUMatVecProps = {
  id?: string;
  /** Row-major packed float32 matrix containing rows * columns values. */
  matrix: GraphDataView<'float32'>;
  /** Packed float32 vector containing columns values. */
  vector: GraphDataView<'float32'>;
  /** Packed float32 result containing rows values. */
  output: GraphDataView<'float32'>;
  /** Matrix row count. */
  rows: number;
  /** Matrix column count. */
  columns: number;
};

/** Dense row-major float32 matrix-vector multiplication: `output = matrix * vector`. */
export class GPUMatVec {
  readonly id: string;
  readonly matrix: GraphDataView<'float32'>;
  readonly vector: GraphDataView<'float32'>;
  readonly output: GraphDataView<'float32'>;
  readonly rows: number;
  readonly columns: number;

  constructor(props: GPUMatVecProps) {
    this.id = props.id ?? 'gpu-matvec';
    this.matrix = props.matrix;
    this.vector = props.vector;
    this.output = props.output;
    this.rows = props.rows;
    this.columns = props.columns;

    validatePackedView(this.matrix, ['float32'], `${this.id} matrix`);
    validatePackedView(this.vector, ['float32'], `${this.id} vector`);
    validatePackedView(this.output, ['float32'], `${this.id} output`);
    if (!Number.isInteger(this.rows) || this.rows < 0) throw new Error(`${this.id} rows must be a non-negative integer`);
    if (!Number.isInteger(this.columns) || this.columns < 0) throw new Error(`${this.id} columns must be a non-negative integer`);
    if (this.matrix.length !== this.rows * this.columns) throw new Error(`${this.id} matrix length must equal rows * columns`);
    if (this.vector.length !== this.columns) throw new Error(`${this.id} vector length must equal columns`);
    if (this.output.length !== this.rows) throw new Error(`${this.id} output length must equal rows`);
    if (this.output.buffer === this.matrix.buffer || this.output.buffer === this.vector.buffer) throw new Error(`${this.id} output must use a separate buffer`);
  }

  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    for (const view of [this.matrix, this.vector, this.output]) {
      if (view.buffer.graph !== graph) throw new Error(`${this.id} views must belong to the target graph`);
    }
    if (this.rows === 0) return;

    const source = makeShaderSource(this);
    graph.addComputePass({
      id: this.id,
      workload: {
        operation: 'GPUMatVec',
        commandCount: 1,
        maximumWorkgroupCount: this.rows,
        maximumInvocationCount: this.rows * WORKGROUP_SIZE,
        readByteLength: (this.matrix.length + this.vector.length) * 4,
        writeByteLength: this.output.length * 4
      },
      resources: [
        {buffer: this.matrix, usage: 'storage-read'},
        {buffer: this.vector, usage: 'storage-read'},
        {buffer: this.output, usage: 'storage-write'}
      ],
      compile: ({device}) => {
        const computation = new Computation(device, {
          id: this.id,
          source,
          shaderLayout: {bindings: [
            {name: 'matrixValues', type: 'read-only-storage', group: 0, location: 0},
            {name: 'vectorValues', type: 'read-only-storage', group: 0, location: 1},
            {name: 'outputValues', type: 'storage', group: 0, location: 2}
          ]}
        });
        return {
          encode: ({computePass, getBuffer}) => {
            const bindings: Record<string, Binding> = {
              matrixValues: getViewBinding(this.matrix, getBuffer),
              vectorValues: getViewBinding(this.vector, getBuffer),
              outputValues: getViewBinding(this.output, getBuffer)
            };
            computation.setBindings(bindings);
            computation.dispatch(computePass, this.rows, 1, 1);
          },
          destroy: () => computation.destroy()
        };
      }
    });
  }
}

function makeShaderSource(matvec: GPUMatVec): string {
  return `const ROWS:u32=${matvec.rows}u; const COLUMNS:u32=${matvec.columns}u;
const MATRIX_OFFSET:u32=${getViewElementOffset(matvec.matrix)}u; const VECTOR_OFFSET:u32=${getViewElementOffset(matvec.vector)}u; const OUTPUT_OFFSET:u32=${getViewElementOffset(matvec.output)}u;
@group(0) @binding(0) var<storage,read> matrixValues:array<f32>; @group(0) @binding(1) var<storage,read> vectorValues:array<f32>; @group(0) @binding(2) var<storage,read_write> outputValues:array<f32>;
var<workgroup> partials:array<f32,${WORKGROUP_SIZE}>;
@compute @workgroup_size(${WORKGROUP_SIZE}) fn main(@builtin(workgroup_id) wg:vec3u,@builtin(local_invocation_index) lane:u32){let row=wg.x;if(row>=ROWS){return;}var sum=0.0;var column=lane;loop{if(column>=COLUMNS){break;}sum += matrixValues[MATRIX_OFFSET+row*COLUMNS+column]*vectorValues[VECTOR_OFFSET+column];column+=${WORKGROUP_SIZE}u;}partials[lane]=sum;workgroupBarrier();var stride=${WORKGROUP_SIZE / 2}u;loop{if(stride==0u){break;}if(lane<stride){partials[lane]+=partials[lane+stride];}workgroupBarrier();stride/=2u;}if(lane==0u){outputValues[OUTPUT_OFFSET+row]=partials[0];}}`;
}
