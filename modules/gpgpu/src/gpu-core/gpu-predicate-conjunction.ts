// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Binding} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import type {GPUCommandGraph} from './gpu-command-graph';
import {GPUScalar,getGPUScalarWGSLLoad,getGPUScalarWGSLStore,getGPUValueArenaWGSLBinding} from './gpu-scalar';

/** Computes logical AND across uint32 predicate scalars into one arena scalar. */
export class GPUPredicateConjunction {
  readonly id:string;
  constructor(readonly props:{id?:string;inputs:readonly GPUScalar<'uint32'>[];output:GPUScalar<'uint32'>}){this.id=props.id??'gpu-predicate-conjunction';if(props.inputs.length<2)throw new Error(`${this.id} requires at least two predicates`);const arena=props.output.arena;if(props.inputs.some(input=>input.arena!==arena))throw new Error(`${this.id} predicates must share one GPUValueArena`);}
  addToGraph<Parameters>(graph:GPUCommandGraph<Parameters>):void{const{inputs,output}=this.props;if(output.arena.graph!==(graph as unknown as GPUCommandGraph<unknown>))throw new Error(`${this.id} predicates must belong to target graph`);const buffer=output.arena.buffer;const expression=inputs.map(input=>`(${getGPUScalarWGSLLoad(input)} != 0u)`).join(' && ');const source=`${getGPUValueArenaWGSLBinding(0,0)}\n@compute @workgroup_size(1)fn main(){${getGPUScalarWGSLStore(output,`select(0u,1u,${expression})`)}}`;graph.addComputePass({id:this.id,workload:{operation:'GPUPredicateConjunction',commandCount:1,maximumWorkgroupCount:1,maximumInvocationCount:1,readByteLength:inputs.length*4,writeByteLength:4},resources:[{buffer,usage:'storage-write'}],compile:({device})=>{const computation=new Computation(device,{id:this.id,source,shaderLayout:{bindings:[{name:'gpuValues',type:'storage',group:0,location:0}]}});return{encode:({computePass,getBuffer})=>{const bindings:Record<string,Binding>={gpuValues:getBuffer(buffer)};computation.setBindings(bindings);computation.dispatch(computePass,1,1,1);},destroy:()=>computation.destroy()};}});}
}
