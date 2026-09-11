// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Binding} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import {GPUCommandGraph} from './gpu-command-graph';
import {GPUScalar, getGPUScalarWGSLStore, getGPUValueArenaWGSLBinding} from './gpu-scalar';

/** Initializes one arena-backed GPU scalar from a compile-time literal. */
export class GPUScalarConstant {
  readonly id: string;
  constructor(readonly props: {id?: string; output: GPUScalar; value: number}) {
    this.id = props.id ?? `gpu-scalar-constant-${props.output.id}`;
    if (!Number.isFinite(props.value)) throw new Error(`${this.id} value must be finite`);
    if (props.output.format !== 'float32' && !Number.isInteger(props.value)) {
      throw new Error(`${this.id} integer scalar requires an integer value`);
    }
  }

  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    const {output, value} = this.props;
    if (output.arena.graph !== (graph as unknown as GPUCommandGraph<unknown>)) {
      throw new Error(`${this.id} output must belong to target graph`);
    }
    const literal = output.format === 'float32'
      ? `${value.toPrecision(9)}`
      : output.format === 'uint32'
        ? `${value}u`
        : `${value}i`;
    const source = `${getGPUValueArenaWGSLBinding(0, 0)}
@compute @workgroup_size(1) fn main(){${getGPUScalarWGSLStore(output, literal)}}`;
    const buffer = output.arena.buffer;
    graph.addComputePass({
      id: this.id,
      workload: {operation:'GPUScalarConstant',commandCount:1,maximumWorkgroupCount:1,maximumInvocationCount:1,readByteLength:0,writeByteLength:4},
      resources: [{buffer,usage:'storage-write'}],
      compile: ({device}) => {
        const computation = new Computation(device,{id:this.id,source,shaderLayout:{bindings:[{name:'gpuValues',type:'storage',group:0,location:0}]}});
        return {encode:({computePass,getBuffer})=>{const bindings:Record<string,Binding>={gpuValues:getBuffer(buffer)};computation.setBindings(bindings);computation.dispatch(computePass,1,1,1);},destroy:()=>computation.destroy()};
      }
    });
  }
}
