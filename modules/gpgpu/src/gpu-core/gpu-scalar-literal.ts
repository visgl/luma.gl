// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Binding} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import type {GPUCommandGraph} from './gpu-command-graph';
import {GPUScalar, getGPUScalarWGSLStore, getGPUValueArenaWGSLBinding} from './gpu-scalar';

/** WebGPU execution primitive writing one host-known literal to an arena scalar. */
export class GPUScalarLiteral {
  readonly id: string;
  constructor(readonly props: {id?: string; output: GPUScalar; value: number}) {
    this.id = props.id ?? `${props.output.id}-literal`;
  }
  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    const {output, value} = this.props;
    if (output.arena.graph !== (graph as unknown as GPUCommandGraph<unknown>)) throw new Error(`${this.id} output must belong to target graph`);
    const expression = output.format === 'float32' ? `${value}` : output.format === 'uint32' ? `${value}u` : `${value}i`;
    const source = `${getGPUValueArenaWGSLBinding(0,0)}\n@compute @workgroup_size(1) fn main(){${getGPUScalarWGSLStore(output, expression)}}`;
    const buffer = output.arena.buffer;
    graph.addComputePass({id:this.id,workload:{operation:'GPUScalarLiteral',commandCount:1,maximumWorkgroupCount:1,maximumInvocationCount:1,readByteLength:0,writeByteLength:4},resources:[{buffer,usage:'storage-write'}],compile:({device})=>{const computation=new Computation(device,{id:this.id,source,shaderLayout:{bindings:[{name:'gpuValues',type:'storage',group:0,location:0}]}});return{encode:({computePass,getBuffer})=>{const bindings:Record<string,Binding>={gpuValues:getBuffer(buffer)};computation.setBindings(bindings);computation.dispatch(computePass,1,1,1);},destroy:()=>computation.destroy()};}});
  }
}
