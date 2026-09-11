// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Binding} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import {GPUCommandGraph, type GraphDataView} from './gpu-command-graph';
import {getViewBinding, getViewElementOffset, validatePackedUint32View, validatePackedView} from './graph-data-view-utils';

const WORKGROUP_SIZE = 256;

export type GPUJacobiPreconditionerProps = {
  id?: string;
  rowOffsets: GraphDataView<'uint32'>;
  columnIndices: GraphDataView<'uint32'>;
  values: GraphDataView<'float32'>;
  /** Reciprocal diagonal written here: `inverseDiagonal[i] = 1 / A[i,i]`. */
  inverseDiagonal: GraphDataView<'float32'>;
};

/**
 * Builds a Jacobi preconditioner from a CSR matrix.
 *
 * Jacobi uses only the matrix diagonal: `M = diag(A)`. Applying the preconditioner is therefore
 * a cheap elementwise multiply by the reciprocal diagonal. Keeping construction and application
 * separate allows the inverse diagonal to be built once and reused by every PCG iteration.
 */
export class GPUJacobiPreconditioner {
  readonly id: string;
  readonly props: GPUJacobiPreconditionerProps;

  constructor(props: GPUJacobiPreconditionerProps) {
    this.id = props.id ?? 'gpu-jacobi-preconditioner';
    this.props = props;
    validatePackedUint32View(props.rowOffsets, `${this.id} rowOffsets`);
    validatePackedUint32View(props.columnIndices, `${this.id} columnIndices`);
    validatePackedView(props.values, ['float32'], `${this.id} values`);
    validatePackedView(props.inverseDiagonal, ['float32'], `${this.id} inverseDiagonal`);
    if (props.rowOffsets.length !== props.inverseDiagonal.length + 1) {
      throw new Error(`${this.id} rowOffsets length must equal inverseDiagonal.length + 1`);
    }
    if (props.columnIndices.length !== props.values.length) {
      throw new Error(`${this.id} columnIndices and values must have equal length`);
    }
  }

  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    const {rowOffsets, columnIndices, values, inverseDiagonal} = this.props;
    for (const view of [rowOffsets, columnIndices, values, inverseDiagonal]) {
      if (view.buffer.graph !== graph) throw new Error(`${this.id} views must belong to target graph`);
    }
    const rows = inverseDiagonal.length;
    if (rows === 0) return;
    const source = `const ROWS:u32=${rows}u;
const ROW_OFFSET:u32=${getViewElementOffset(rowOffsets)}u;
const COLUMN_OFFSET:u32=${getViewElementOffset(columnIndices)}u;
const VALUE_OFFSET:u32=${getViewElementOffset(values)}u;
const OUTPUT_OFFSET:u32=${getViewElementOffset(inverseDiagonal)}u;
@group(0) @binding(0) var<storage,read> rowOffsets:array<u32>;
@group(0) @binding(1) var<storage,read> columnIndices:array<u32>;
@group(0) @binding(2) var<storage,read> matrixValues:array<f32>;
@group(0) @binding(3) var<storage,read_write> inverseDiagonal:array<f32>;
@compute @workgroup_size(${WORKGROUP_SIZE}) fn main(@builtin(global_invocation_id) gid:vec3u){
  let row=gid.x;if(row>=ROWS){return;}let begin=rowOffsets[ROW_OFFSET+row];let end=rowOffsets[ROW_OFFSET+row+1u];var diagonal=0.0;
  for(var i=begin;i<end;i++){if(columnIndices[COLUMN_OFFSET+i]==row){diagonal=matrixValues[VALUE_OFFSET+i];break;}}
  inverseDiagonal[OUTPUT_OFFSET+row]=select(0.0,1.0/diagonal,diagonal!=0.0);
}`;
    graph.addComputePass({
      id: this.id,
      workload: {operation:'GPUJacobiPreconditioner',commandCount:1,maximumWorkgroupCount:Math.ceil(rows/WORKGROUP_SIZE),maximumInvocationCount:Math.ceil(rows/WORKGROUP_SIZE)*WORKGROUP_SIZE,readByteLength:(rowOffsets.length+columnIndices.length+values.length)*4,writeByteLength:rows*4},
      resources:[{buffer:rowOffsets,usage:'storage-read'},{buffer:columnIndices,usage:'storage-read'},{buffer:values,usage:'storage-read'},{buffer:inverseDiagonal,usage:'storage-write'}],
      compile:({device})=>{const computation=new Computation(device,{id:this.id,source,shaderLayout:{bindings:[{name:'rowOffsets',type:'read-only-storage',group:0,location:0},{name:'columnIndices',type:'read-only-storage',group:0,location:1},{name:'matrixValues',type:'read-only-storage',group:0,location:2},{name:'inverseDiagonal',type:'storage',group:0,location:3}]}});return{encode:({computePass,getBuffer})=>{const bindings:Record<string,Binding>={rowOffsets:getViewBinding(rowOffsets,getBuffer),columnIndices:getViewBinding(columnIndices,getBuffer),matrixValues:getViewBinding(values,getBuffer),inverseDiagonal:getViewBinding(inverseDiagonal,getBuffer)};computation.setBindings(bindings);computation.dispatch(computePass,Math.ceil(rows/WORKGROUP_SIZE),1,1);},destroy:()=>computation.destroy()};}
    });
  }
}

/** Applies `z = M^-1 r` for a precomputed Jacobi reciprocal diagonal. */
export class GPUApplyJacobiPreconditioner {
  readonly id: string;
  constructor(readonly props: {id?:string; inverseDiagonal:GraphDataView<'float32'>; residual:GraphDataView<'float32'>; output:GraphDataView<'float32'>}) {
    this.id = props.id ?? 'gpu-apply-jacobi-preconditioner';
    for (const [name, view] of Object.entries({inverseDiagonal:props.inverseDiagonal,residual:props.residual,output:props.output})) {
      validatePackedView(view, ['float32'], `${this.id} ${name}`);
    }
    if (props.inverseDiagonal.length !== props.residual.length || props.residual.length !== props.output.length) {
      throw new Error(`${this.id} vector lengths must match`);
    }
  }

  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    const {inverseDiagonal,residual,output}=this.props;
    if ([inverseDiagonal,residual,output].some(view=>view.buffer.graph!==graph)) throw new Error(`${this.id} views must belong to target graph`);
    const length=output.length;if(length===0)return;
    const source=`const LENGTH:u32=${length}u;const D:u32=${getViewElementOffset(inverseDiagonal)}u;const R:u32=${getViewElementOffset(residual)}u;const O:u32=${getViewElementOffset(output)}u;@group(0)@binding(0)var<storage,read>d:array<f32>;@group(0)@binding(1)var<storage,read>r:array<f32>;@group(0)@binding(2)var<storage,read_write>o:array<f32>;@compute @workgroup_size(${WORKGROUP_SIZE})fn main(@builtin(global_invocation_id)gid:vec3u){let i=gid.x;if(i<LENGTH){o[O+i]=d[D+i]*r[R+i];}}`;
    graph.addComputePass({id:this.id,workload:{operation:'GPUApplyJacobiPreconditioner',commandCount:1,maximumWorkgroupCount:Math.ceil(length/WORKGROUP_SIZE),maximumInvocationCount:Math.ceil(length/WORKGROUP_SIZE)*WORKGROUP_SIZE,readByteLength:length*8,writeByteLength:length*4},resources:[{buffer:inverseDiagonal,usage:'storage-read'},{buffer:residual,usage:'storage-read'},{buffer:output,usage:'storage-write'}],compile:({device})=>{const computation=new Computation(device,{id:this.id,source,shaderLayout:{bindings:[{name:'d',type:'read-only-storage',group:0,location:0},{name:'r',type:'read-only-storage',group:0,location:1},{name:'o',type:'storage',group:0,location:2}]}});return{encode:({computePass,getBuffer})=>{computation.setBindings({d:getViewBinding(inverseDiagonal,getBuffer),r:getViewBinding(residual,getBuffer),o:getViewBinding(output,getBuffer)});computation.dispatch(computePass,Math.ceil(length/WORKGROUP_SIZE),1,1);},destroy:()=>computation.destroy()};}});
  }
}
