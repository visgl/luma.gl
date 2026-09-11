// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Binding} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import {GPUCommandGraph, type GraphDataView} from './gpu-command-graph';
import {getViewBinding, getViewElementOffset, validatePackedUint32View, validatePackedView} from './graph-data-view-utils';

const WORKGROUP_SIZE = 256;

export type GPUSpMVProps = {
  id?: string;
  /** Offset-delimited CSR row boundaries. Length = rows + 1. */
  rowOffsets: GraphDataView<'uint32'>;
  /** CSR column index for each stored nonzero. */
  columnIndices: GraphDataView<'uint32'>;
  /** CSR float32 value for each stored nonzero. */
  values: GraphDataView<'float32'>;
  /** Dense input vector. */
  vector: GraphDataView<'float32'>;
  /** Dense output vector, one value per matrix row. */
  output: GraphDataView<'float32'>;
  /** Sparse matrix column count. */
  columns: number;
};

/** CSR sparse matrix-vector multiplication: `output = matrix * vector`. */
export class GPUSpMV {
  readonly id: string;
  readonly rowOffsets: GraphDataView<'uint32'>;
  readonly columnIndices: GraphDataView<'uint32'>;
  readonly values: GraphDataView<'float32'>;
  readonly vector: GraphDataView<'float32'>;
  readonly output: GraphDataView<'float32'>;
  readonly columns: number;

  constructor(props: GPUSpMVProps) {
    this.id = props.id ?? 'gpu-spmv';
    this.rowOffsets = props.rowOffsets;
    this.columnIndices = props.columnIndices;
    this.values = props.values;
    this.vector = props.vector;
    this.output = props.output;
    this.columns = props.columns;

    validatePackedUint32View(this.rowOffsets, `${this.id} rowOffsets`);
    validatePackedUint32View(this.columnIndices, `${this.id} columnIndices`);
    validatePackedView(this.values, ['float32'], `${this.id} values`);
    validatePackedView(this.vector, ['float32'], `${this.id} vector`);
    validatePackedView(this.output, ['float32'], `${this.id} output`);
    if (this.rowOffsets.length !== this.output.length + 1) throw new Error(`${this.id} rowOffsets length must equal output.length + 1`);
    if (this.columnIndices.length !== this.values.length) throw new Error(`${this.id} columnIndices and values must have equal length`);
    if (!Number.isInteger(this.columns) || this.columns < 0) throw new Error(`${this.id} columns must be a non-negative integer`);
    if (this.vector.length !== this.columns) throw new Error(`${this.id} vector length must equal columns`);
    if ([this.rowOffsets.buffer, this.columnIndices.buffer, this.values.buffer, this.vector.buffer].includes(this.output.buffer)) throw new Error(`${this.id} output must use a separate buffer`);
  }

  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    for (const view of [this.rowOffsets, this.columnIndices, this.values, this.vector, this.output]) {
      if (view.buffer.graph !== graph) throw new Error(`${this.id} views must belong to the target graph`);
    }
    const rows = this.output.length;
    if (rows === 0) return;
    const source = makeShaderSource(this);
    graph.addComputePass({
      id: this.id,
      workload: {operation:'GPUSpMV',commandCount:1,maximumWorkgroupCount:rows,maximumInvocationCount:rows*WORKGROUP_SIZE,readByteLength:(this.rowOffsets.length+this.columnIndices.length)*4+(this.values.length+this.vector.length)*4,writeByteLength:this.output.length*4},
      resources:[{buffer:this.rowOffsets,usage:'storage-read'},{buffer:this.columnIndices,usage:'storage-read'},{buffer:this.values,usage:'storage-read'},{buffer:this.vector,usage:'storage-read'},{buffer:this.output,usage:'storage-write'}],
      compile:({device})=>{const computation=new Computation(device,{id:this.id,source,shaderLayout:{bindings:[{name:'rowOffsets',type:'read-only-storage',group:0,location:0},{name:'columnIndices',type:'read-only-storage',group:0,location:1},{name:'matrixValues',type:'read-only-storage',group:0,location:2},{name:'vectorValues',type:'read-only-storage',group:0,location:3},{name:'outputValues',type:'storage',group:0,location:4}]}});return{encode:({computePass,getBuffer})=>{const bindings:Record<string,Binding>={rowOffsets:getViewBinding(this.rowOffsets,getBuffer),columnIndices:getViewBinding(this.columnIndices,getBuffer),matrixValues:getViewBinding(this.values,getBuffer),vectorValues:getViewBinding(this.vector,getBuffer),outputValues:getViewBinding(this.output,getBuffer)};computation.setBindings(bindings);computation.dispatch(computePass,rows,1,1);},destroy:()=>computation.destroy()};}
    });
  }
}

function makeShaderSource(spmv: GPUSpMV): string {
  return `const ROW_OFFSET:u32=${getViewElementOffset(spmv.rowOffsets)}u; const COLUMN_OFFSET:u32=${getViewElementOffset(spmv.columnIndices)}u; const VALUE_OFFSET:u32=${getViewElementOffset(spmv.values)}u; const VECTOR_OFFSET:u32=${getViewElementOffset(spmv.vector)}u; const OUTPUT_OFFSET:u32=${getViewElementOffset(spmv.output)}u; const COLUMNS:u32=${spmv.columns}u;
@group(0) @binding(0) var<storage,read> rowOffsets:array<u32>; @group(0) @binding(1) var<storage,read> columnIndices:array<u32>; @group(0) @binding(2) var<storage,read> matrixValues:array<f32>; @group(0) @binding(3) var<storage,read> vectorValues:array<f32>; @group(0) @binding(4) var<storage,read_write> outputValues:array<f32>; var<workgroup> partials:array<f32,${WORKGROUP_SIZE}>;
@compute @workgroup_size(${WORKGROUP_SIZE}) fn main(@builtin(workgroup_id) wg:vec3u,@builtin(local_invocation_index) lane:u32){let row=wg.x;let begin=rowOffsets[ROW_OFFSET+row];let end=rowOffsets[ROW_OFFSET+row+1u];var sum=0.0;var i=begin+lane;loop{if(i>=end){break;}let column=columnIndices[COLUMN_OFFSET+i];if(column<COLUMNS){sum += matrixValues[VALUE_OFFSET+i]*vectorValues[VECTOR_OFFSET+column];}i+=${WORKGROUP_SIZE}u;}partials[lane]=sum;workgroupBarrier();var stride=${WORKGROUP_SIZE / 2}u;loop{if(stride==0u){break;}if(lane<stride){partials[lane]+=partials[lane+stride];}workgroupBarrier();stride/=2u;}if(lane==0u){outputValues[OUTPUT_OFFSET+row]=partials[0];}}`;
}
