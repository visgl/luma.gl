// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Binding} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import {GPUCommandGraph, type GraphDataView} from './gpu-command-graph';
import {GPUScan} from './gpu-scan';
import {createTransientView, getViewBinding, getViewElementOffset, validatePackedUint32View} from './graph-data-view-utils';

const WORKGROUP_SIZE = 256;

export type GPURunLengthEncodeProps = {
  id?: string;
  /** Ordered packed uint32 input. Equal adjacent values form one run. */
  input: GraphDataView<'uint32'>;
  /** Caller-owned unique run values, capacity >= input.length. */
  values: GraphDataView<'uint32'>;
  /** Caller-owned run lengths, capacity >= input.length. */
  lengths: GraphDataView<'uint32'>;
  /** Single uint32 receiving the number of valid runs. */
  count: GraphDataView<'uint32'>;
};

/** Graph-native run-length encoding for ordered uint32 values. */
export class GPURunLengthEncode {
  readonly id: string;
  readonly input: GraphDataView<'uint32'>;
  readonly values: GraphDataView<'uint32'>;
  readonly lengths: GraphDataView<'uint32'>;
  readonly count: GraphDataView<'uint32'>;

  constructor(props: GPURunLengthEncodeProps) {
    this.id = props.id ?? 'gpu-run-length-encode';
    this.input = props.input;
    this.values = props.values;
    this.lengths = props.lengths;
    this.count = props.count;
    for (const [name, view] of Object.entries({input: this.input, values: this.values, lengths: this.lengths, count: this.count})) {
      validatePackedUint32View(view, `${this.id} ${name}`);
    }
    if (this.values.length < this.input.length || this.lengths.length < this.input.length) {
      throw new Error(`${this.id} values and lengths must have capacity >= input.length`);
    }
    if (this.count.length < 1) throw new Error(`${this.id} count must contain at least one row`);
    if ([this.values.buffer, this.lengths.buffer, this.count.buffer].includes(this.input.buffer)) {
      throw new Error(`${this.id} outputs must use separate buffers from input`);
    }
  }

  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    for (const view of [this.input, this.values, this.lengths, this.count]) {
      if (view.buffer.graph !== graph) throw new Error(`${this.id} views must belong to target graph`);
    }
    if (this.input.length === 0) {
      addEmptyPass(graph, this);
      return;
    }
    const flags = createTransientView(graph, `${this.id}-run-start-flags`, 'uint32', this.input.length);
    const runIndices = createTransientView(graph, `${this.id}-run-indices`, 'uint32', this.input.length);
    addFlagsPass(graph, this, flags);
    new GPUScan({id: `${this.id}-run-index-scan`, input: flags, output: runIndices, mode: 'exclusive'}).addToGraph(graph);
    addMaterializePass(graph, this, flags, runIndices);
  }
}

/** `GPUUnique` is the value-only form of run-length encoding. */
export class GPUUnique extends GPURunLengthEncode {}

function addFlagsPass<Parameters>(graph: GPUCommandGraph<Parameters>, rle: GPURunLengthEncode, flags: GraphDataView<'uint32'>): void {
  const source = `const LENGTH: u32 = ${rle.input.length}u; const INPUT_OFFSET: u32 = ${getViewElementOffset(rle.input)}u; const FLAG_OFFSET: u32 = ${getViewElementOffset(flags)}u;
@group(0) @binding(0) var<storage, read> inputValues: array<u32>;
@group(0) @binding(1) var<storage, read_write> flags: array<u32>;
@compute @workgroup_size(${WORKGROUP_SIZE}) fn main(@builtin(global_invocation_id) id: vec3u) { let i=id.x; if(i>=LENGTH){return;} flags[FLAG_OFFSET+i]=select(0u,1u,i==0u || inputValues[INPUT_OFFSET+i]!=inputValues[INPUT_OFFSET+i-1u]); }`;
  addPass(graph, `${rle.id}-flags`, source, rle.input.length, [{name:'inputValues',view:rle.input,usage:'storage-read'},{name:'flags',view:flags,usage:'storage-write'}]);
}

function addMaterializePass<Parameters>(graph: GPUCommandGraph<Parameters>, rle: GPURunLengthEncode, flags: GraphDataView<'uint32'>, runIndices: GraphDataView<'uint32'>): void {
  const source = `const LENGTH:u32=${rle.input.length}u; const INPUT_OFFSET:u32=${getViewElementOffset(rle.input)}u; const FLAG_OFFSET:u32=${getViewElementOffset(flags)}u; const INDEX_OFFSET:u32=${getViewElementOffset(runIndices)}u; const VALUE_OFFSET:u32=${getViewElementOffset(rle.values)}u; const LENGTH_OFFSET:u32=${getViewElementOffset(rle.lengths)}u; const COUNT_OFFSET:u32=${getViewElementOffset(rle.count)}u;
@group(0) @binding(0) var<storage,read> inputValues:array<u32>; @group(0) @binding(1) var<storage,read> flags:array<u32>; @group(0) @binding(2) var<storage,read> runIndices:array<u32>; @group(0) @binding(3) var<storage,read_write> values:array<u32>; @group(0) @binding(4) var<storage,read_write> lengths:array<u32>; @group(0) @binding(5) var<storage,read_write> count:array<u32>;
@compute @workgroup_size(${WORKGROUP_SIZE}) fn main(@builtin(global_invocation_id) id:vec3u){let i=id.x;if(i>=LENGTH){return;} let run=runIndices[INDEX_OFFSET+i]; if(flags[FLAG_OFFSET+i]!=0u){values[VALUE_OFFSET+run]=inputValues[INPUT_OFFSET+i];} let isEnd=i+1u==LENGTH || flags[FLAG_OFFSET+i+1u]!=0u; if(isEnd){let start=select(0u, runIndices[INDEX_OFFSET+i], run==0u); var j=i; loop { if(j==0u || flags[FLAG_OFFSET+j]!=0u){break;} j-=1u;} lengths[LENGTH_OFFSET+run]=i-j+1u; if(i+1u==LENGTH){count[COUNT_OFFSET]=run+1u;}}}`;
  addPass(graph, `${rle.id}-materialize`, source, rle.input.length, [
    {name:'inputValues',view:rle.input,usage:'storage-read'},{name:'flags',view:flags,usage:'storage-read'},{name:'runIndices',view:runIndices,usage:'storage-read'},
    {name:'values',view:rle.values,usage:'storage-write'},{name:'lengths',view:rle.lengths,usage:'storage-write'},{name:'count',view:rle.count,usage:'storage-write'}]);
}

function addEmptyPass<Parameters>(graph: GPUCommandGraph<Parameters>, rle: GPURunLengthEncode): void {
  const source=`const COUNT_OFFSET:u32=${getViewElementOffset(rle.count)}u; @group(0) @binding(0) var<storage,read_write> count:array<u32>; @compute @workgroup_size(1) fn main(){count[COUNT_OFFSET]=0u;}`;
  addPass(graph,`${rle.id}-empty`,source,1,[{name:'count',view:rle.count,usage:'storage-write'}]);
}

type Resource={name:string;view:GraphDataView<'uint32'>;usage:'storage-read'|'storage-write'};
function addPass<Parameters>(graph:GPUCommandGraph<Parameters>,id:string,source:string,length:number,resources:Resource[]):void{
  graph.addComputePass({id,workload:{operation:'GPURunLengthEncode',commandCount:1,maximumWorkgroupCount:Math.ceil(length/WORKGROUP_SIZE),maximumInvocationCount:Math.ceil(length/WORKGROUP_SIZE)*WORKGROUP_SIZE,readByteLength:resources.filter(r=>r.usage==='storage-read').length*length*4,writeByteLength:resources.filter(r=>r.usage==='storage-write').length*length*4},resources:resources.map(r=>({buffer:r.view,usage:r.usage})),compile:({device})=>{const computation=new Computation(device,{id,source,shaderLayout:{bindings:resources.map((r,location)=>({name:r.name,type:r.usage==='storage-read'?'read-only-storage':'storage',group:0,location}))}});return{encode:({computePass,getBuffer})=>{const bindings:Record<string,Binding>={};for(const r of resources)bindings[r.name]=getViewBinding(r.view,getBuffer);computation.setBindings(bindings);computation.dispatch(computePass,Math.ceil(length/WORKGROUP_SIZE),1,1);},destroy:()=>computation.destroy()};}});
}
