// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Binding} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import type {GPUCommandGraph,GraphDataView} from './gpu-command-graph';
import {getViewBinding,getViewElementOffset} from './graph-data-view-utils';

/** Packed 32-bit vector copy used by semantic program lowering. */
export class GPUVectorCopy {
  readonly id:string;
  constructor(readonly props:{id?:string;input:GraphDataView;output:GraphDataView}){this.id=props.id??'gpu-vector-copy';if(props.input.format!==props.output.format||props.input.length!==props.output.length)throw new Error(`${this.id} vector shapes must match`);}
  addToGraph<Parameters>(graph:GPUCommandGraph<Parameters>):void{const{input,output}=this.props;if(input.buffer.graph!==graph||output.buffer.graph!==graph)throw new Error(`${this.id} vectors must belong to target graph`);if(output.length===0)return;const workgroups=Math.ceil(output.length/256),source=`const N:u32=${output.length}u;const I:u32=${getViewElementOffset(input)}u;const O:u32=${getViewElementOffset(output)}u;@group(0)@binding(0)var<storage,read>src:array<u32>;@group(0)@binding(1)var<storage,read_write>dst:array<u32>;@compute @workgroup_size(256)fn main(@builtin(global_invocation_id)gid:vec3u){if(gid.x<N){dst[O+gid.x]=src[I+gid.x];}}`;graph.addComputePass({id:this.id,workload:{operation:'GPUVectorCopy',commandCount:1,maximumWorkgroupCount:workgroups,maximumInvocationCount:workgroups*256,readByteLength:input.length*4,writeByteLength:output.length*4},resources:[{buffer:input,usage:'storage-read'},{buffer:output,usage:'storage-write'}],compile:({device})=>{const computation=new Computation(device,{id:this.id,source,shaderLayout:{bindings:[{name:'src',type:'read-only-storage',group:0,location:0},{name:'dst',type:'storage',group:0,location:1}]}});return{encode:({computePass,getBuffer})=>{const bindings:Record<string,Binding>={src:getViewBinding(input,getBuffer),dst:getViewBinding(output,getBuffer)};computation.setBindings(bindings);computation.dispatch(computePass,workgroups,1,1);},destroy:()=>computation.destroy()};}});}
}
