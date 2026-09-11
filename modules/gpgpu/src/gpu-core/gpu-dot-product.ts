// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Binding} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import {GPUCommandGraph, type GraphDataView} from './gpu-command-graph';
import {getViewBinding, getViewElementOffset, validatePackedView} from './graph-data-view-utils';

const WORKGROUP_SIZE = 256;

export type GPUDotProductProps = {
  id?: string;
  left: GraphDataView<'float32'>;
  right: GraphDataView<'float32'>;
  /** Single float32 output row. */
  output: GraphDataView<'float32'>;
};

/** Computes the float32 dot product of two packed vectors. */
export class GPUDotProduct {
  readonly id: string;
  readonly left: GraphDataView<'float32'>;
  readonly right: GraphDataView<'float32'>;
  readonly output: GraphDataView<'float32'>;

  constructor(props: GPUDotProductProps) {
    this.id = props.id ?? 'gpu-dot-product';
    this.left = props.left;
    this.right = props.right;
    this.output = props.output;
    validatePackedView(this.left, ['float32'], `${this.id} left`);
    validatePackedView(this.right, ['float32'], `${this.id} right`);
    validatePackedView(this.output, ['float32'], `${this.id} output`);
    if (this.left.length !== this.right.length) throw new Error(`${this.id} inputs must have equal length`);
    if (this.output.length < 1) throw new Error(`${this.id} output must contain one float32 row`);
    if (this.output.buffer === this.left.buffer || this.output.buffer === this.right.buffer) throw new Error(`${this.id} output must use a separate buffer`);
  }

  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    for (const view of [this.left, this.right, this.output]) if (view.buffer.graph !== graph) throw new Error(`${this.id} views must belong to target graph`);
    const source = makeDotSource(this);
    graph.addComputePass({id:this.id,workload:{operation:'GPUDotProduct',commandCount:1,maximumWorkgroupCount:1,maximumInvocationCount:WORKGROUP_SIZE,readByteLength:(this.left.length+this.right.length)*4,writeByteLength:4},resources:[{buffer:this.left,usage:'storage-read'},{buffer:this.right,usage:'storage-read'},{buffer:this.output,usage:'storage-write'}],compile:({device})=>{const computation=new Computation(device,{id:this.id,source,shaderLayout:{bindings:[{name:'leftValues',type:'read-only-storage',group:0,location:0},{name:'rightValues',type:'read-only-storage',group:0,location:1},{name:'outputValues',type:'storage',group:0,location:2}]}});return{encode:({computePass,getBuffer})=>{const bindings:Record<string,Binding>={leftValues:getViewBinding(this.left,getBuffer),rightValues:getViewBinding(this.right,getBuffer),outputValues:getViewBinding(this.output,getBuffer)};computation.setBindings(bindings);computation.dispatch(computePass,1,1,1);},destroy:()=>computation.destroy()};}});
  }
}

export type GPUVectorNormProps = {id?:string; input:GraphDataView<'float32'>; output:GraphDataView<'float32'>};

/** Computes the Euclidean/L2 norm of a packed float32 vector. */
export class GPUVectorNorm {
  readonly id:string; readonly input:GraphDataView<'float32'>; readonly output:GraphDataView<'float32'>;
  constructor(props:GPUVectorNormProps){this.id=props.id??'gpu-vector-norm';this.input=props.input;this.output=props.output;validatePackedView(this.input,['float32'],`${this.id} input`);validatePackedView(this.output,['float32'],`${this.id} output`);if(this.output.length<1)throw new Error(`${this.id} output must contain one float32 row`);if(this.output.buffer===this.input.buffer)throw new Error(`${this.id} output must use a separate buffer`);}
  addToGraph<Parameters>(graph:GPUCommandGraph<Parameters>):void{for(const view of [this.input,this.output])if(view.buffer.graph!==graph)throw new Error(`${this.id} views must belong to target graph`);const source=makeNormSource(this);graph.addComputePass({id:this.id,workload:{operation:'GPUVectorNorm',commandCount:1,maximumWorkgroupCount:1,maximumInvocationCount:WORKGROUP_SIZE,readByteLength:this.input.length*4,writeByteLength:4},resources:[{buffer:this.input,usage:'storage-read'},{buffer:this.output,usage:'storage-write'}],compile:({device})=>{const computation=new Computation(device,{id:this.id,source,shaderLayout:{bindings:[{name:'inputValues',type:'read-only-storage',group:0,location:0},{name:'outputValues',type:'storage',group:0,location:1}]}});return{encode:({computePass,getBuffer})=>{computation.setBindings({inputValues:getViewBinding(this.input,getBuffer),outputValues:getViewBinding(this.output,getBuffer)});computation.dispatch(computePass,1,1,1);},destroy:()=>computation.destroy()};}});}
}

function makeDotSource(dot:GPUDotProduct):string{return `const LENGTH:u32=${dot.left.length}u;const L:u32=${getViewElementOffset(dot.left)}u;const R:u32=${getViewElementOffset(dot.right)}u;const O:u32=${getViewElementOffset(dot.output)}u;@group(0)@binding(0)var<storage,read>leftValues:array<f32>;@group(0)@binding(1)var<storage,read>rightValues:array<f32>;@group(0)@binding(2)var<storage,read_write>outputValues:array<f32>;var<workgroup>s:array<f32,${WORKGROUP_SIZE}>;@compute @workgroup_size(${WORKGROUP_SIZE})fn main(@builtin(local_invocation_index)lane:u32){var v=0.0;var i=lane;loop{if(i>=LENGTH){break;}v+=leftValues[L+i]*rightValues[R+i];i+=${WORKGROUP_SIZE}u;}s[lane]=v;workgroupBarrier();var stride=${WORKGROUP_SIZE/2}u;loop{if(stride==0u){break;}if(lane<stride){s[lane]+=s[lane+stride];}workgroupBarrier();stride/=2u;}if(lane==0u){outputValues[O]=s[0];}}`;}
function makeNormSource(norm:GPUVectorNorm):string{return `const LENGTH:u32=${norm.input.length}u;const I:u32=${getViewElementOffset(norm.input)}u;const O:u32=${getViewElementOffset(norm.output)}u;@group(0)@binding(0)var<storage,read>inputValues:array<f32>;@group(0)@binding(1)var<storage,read_write>outputValues:array<f32>;var<workgroup>s:array<f32,${WORKGROUP_SIZE}>;@compute @workgroup_size(${WORKGROUP_SIZE})fn main(@builtin(local_invocation_index)lane:u32){var v=0.0;var i=lane;loop{if(i>=LENGTH){break;}let x=inputValues[I+i];v+=x*x;i+=${WORKGROUP_SIZE}u;}s[lane]=v;workgroupBarrier();var stride=${WORKGROUP_SIZE/2}u;loop{if(stride==0u){break;}if(lane<stride){s[lane]+=s[lane+stride];}workgroupBarrier();stride/=2u;}if(lane==0u){outputValues[O]=sqrt(s[0]);}}`;}
