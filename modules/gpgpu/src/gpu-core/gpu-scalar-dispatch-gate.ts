// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Binding} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import {GPUCommandGraph, type GraphBufferHandle} from './gpu-command-graph';
import {GPUScalar, getGPUScalarWGSLLoad, getGPUValueArenaWGSLBinding} from './gpu-scalar';

/** Reusable indirect-dispatch gate controlled by one uint32 GPUScalar (zero = disabled). */
export class GPUScalarDispatchGate {
  readonly id:string; readonly active:GPUScalar<'uint32'>; readonly workgroups:readonly[number,number,number]; readonly dispatchBuffer:GraphBufferHandle;
  constructor<Parameters>(graph:GPUCommandGraph<Parameters>,props:{id:string;active:GPUScalar<'uint32'>;workgroups:readonly[number,number,number]}){this.id=props.id;this.active=props.active;this.workgroups=props.workgroups;if(props.active.arena.graph!==(graph as unknown as GPUCommandGraph<unknown>))throw new Error(`${this.id} active scalar must belong to target graph`);this.dispatchBuffer=graph.createTransientBuffer({id:`${this.id}-dispatch`,byteLength:12,usage:Buffer.STORAGE|Buffer.INDIRECT|Buffer.COPY_SRC});}
  addUpdateToGraph<Parameters>(graph:GPUCommandGraph<Parameters>,id=`${this.id}-update`):void{const arenaBuffer=this.active.arena.buffer;const[x,y,z]=this.workgroups;const source=`${getGPUValueArenaWGSLBinding(0,0)}\n@group(0) @binding(1) var<storage,read_write> dispatch:array<u32>;\n@compute @workgroup_size(1) fn main(){let enabled=${getGPUScalarWGSLLoad(this.active)} != 0u;dispatch[0]=select(0u,${x}u,enabled);dispatch[1]=${y}u;dispatch[2]=${z}u;}`;graph.addComputePass({id,workload:{operation:'GPUScalarDispatchGate',commandCount:1,maximumWorkgroupCount:1,maximumInvocationCount:1,readByteLength:4,writeByteLength:12},resources:[{buffer:arenaBuffer,usage:'storage-read'},{buffer:this.dispatchBuffer,usage:'storage-write'}],compile:({device})=>{const computation=new Computation(device,{id,source,shaderLayout:{bindings:[{name:'gpuValues',type:'read-only-storage',group:0,location:0},{name:'dispatch',type:'storage',group:0,location:1}]}});return{encode:({computePass,getBuffer})=>{const bindings:Record<string,Binding>={gpuValues:getBuffer(arenaBuffer),dispatch:getBuffer(this.dispatchBuffer)};computation.setBindings(bindings);computation.dispatch(computePass,1,1,1);},destroy:()=>computation.destroy()};}});}
  get condition(){return{id:`${this.id}-active`,source:'gpu' as const,mode:'indirect' as const,buffer:this.dispatchBuffer};}
}
