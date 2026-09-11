// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Binding} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import {GPUCommandGraph, type GraphDataView} from './gpu-command-graph';
import {getBoundedDispatchLayout, getBoundedInvocationIndexSource} from './gpu-dispatch-utils';
import {getViewBinding, getViewElementOffset, validatePackedView} from './graph-data-view-utils';
import {GPUScalar, getGPUScalarWGSLLoad, getGPUValueArenaWGSLBinding} from './gpu-scalar';
import type {GPUScalarDispatchGate} from './gpu-scalar-dispatch-gate';

const WORKGROUP_SIZE = 256;

export type GPUVectorScalarMADDProps = {
  id?: string;
  /** Vector multiplied by scale. */
  input: GraphDataView<'float32'>;
  /** GPU-resident scalar broadcast across every vector row. */
  scale: GPUScalar<'float32'>;
  /** Vector added after scaling. May alias output for in-place `output += scale * input`. */
  addend: GraphDataView<'float32'>;
  /** Output vector. May alias input or addend when each row is read before its corresponding write. */
  output: GraphDataView<'float32'>;
  /** Optional GPU-controlled indirect gate. */
  gate?: GPUScalarDispatchGate;
};

/** Broadcast MADD: `output[i] = scale * input[i] + addend[i]`. */
export class GPUVectorScalarMADD {
  readonly props: GPUVectorScalarMADDProps;
  readonly id: string;
  constructor(props: GPUVectorScalarMADDProps) {
    this.props = props;
    this.id = props.id ?? 'gpu-vector-scalar-madd';
    for (const [name, view] of Object.entries({input: props.input, addend: props.addend, output: props.output})) validatePackedView(view, ['float32'], `${this.id} ${name}`);
    if (props.input.length !== props.addend.length || props.input.length !== props.output.length) throw new Error(`${this.id} vector lengths must match`);
  }

  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    const {input, scale, addend, output, gate} = this.props;
    if ([input, addend, output].some(view => view.buffer.graph !== graph) || scale.arena.graph !== (graph as unknown as GPUCommandGraph<unknown>)) throw new Error(`${this.id} resources must belong to target graph`);
    if (output.length === 0) return;
    const arenaBuffer = scale.arena.seal().buffer;
    const layout = getBoundedDispatchLayout('GPUVectorScalarMADD', output.length, WORKGROUP_SIZE, graph.device.limits.maxComputeWorkgroupsPerDimension);
    const source = `const LENGTH:u32=${output.length}u; const I:u32=${getViewElementOffset(input)}u; const A:u32=${getViewElementOffset(addend)}u; const O:u32=${getViewElementOffset(output)}u;
@group(0) @binding(0) var<storage,read> inputValues:array<f32>;
@group(0) @binding(1) var<storage,read> addendValues:array<f32>;
@group(0) @binding(2) var<storage,read_write> outputValues:array<f32>;
${getGPUValueArenaWGSLBinding(0,3)}
@compute @workgroup_size(${WORKGROUP_SIZE}) fn main(@builtin(workgroup_id) workgroupId:vec3u,@builtin(local_invocation_index) localInvocationIndex:u32){${getBoundedInvocationIndexSource(layout,WORKGROUP_SIZE)} if(index>=LENGTH){return;} let x=inputValues[I+index]; let y=addendValues[A+index]; outputValues[O+index]=${getGPUScalarWGSLLoad(scale)}*x+y;}`;
    graph.addComputePass({id:this.id,condition:gate?.condition,workload:{operation:'GPUVectorScalarMADD',commandCount:1,maximumWorkgroupCount:layout.x*layout.y*layout.z,maximumInvocationCount:layout.x*layout.y*layout.z*WORKGROUP_SIZE,readByteLength:input.length*8+4,writeByteLength:output.length*4},resources:[{buffer:input,usage:'storage-read'},{buffer:addend,usage:'storage-read'},{buffer:output,usage:'storage-write'},{buffer:arenaBuffer,usage:'storage-read'},...(gate?[{buffer:gate.dispatchBuffer,usage:'indirect' as const}]:[])],compile:({device})=>{const computation=new Computation(device,{id:this.id,source,shaderLayout:{bindings:[{name:'inputValues',type:'read-only-storage',group:0,location:0},{name:'addendValues',type:'read-only-storage',group:0,location:1},{name:'outputValues',type:'storage',group:0,location:2},{name:'gpuValues',type:'read-only-storage',group:0,location:3}]}});return{encode:({computePass,getBuffer})=>{const bindings:Record<string,Binding>={inputValues:getViewBinding(input,getBuffer),addendValues:getViewBinding(addend,getBuffer),outputValues:getViewBinding(output,getBuffer),gpuValues:getBuffer(arenaBuffer)};computation.setBindings(bindings);if(gate)computation.dispatchIndirect(computePass,getBuffer(gate.dispatchBuffer));else computation.dispatch(computePass,layout.x,layout.y,layout.z);},destroy:()=>computation.destroy()};}});
  }
}
