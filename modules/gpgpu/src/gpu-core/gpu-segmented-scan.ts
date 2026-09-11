// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Binding} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import {GPUCommandGraph, type GraphDataView} from './gpu-command-graph';
import {getViewBinding, getViewElementOffset, validatePackedUint32View} from './graph-data-view-utils';

const WORKGROUP_SIZE = 256;

export type GPUSegmentedScanMode = 'exclusive' | 'inclusive';

export type GPUSegmentedScanProps = {
  id?: string;
  /** Packed uint32 values. */
  input: GraphDataView<'uint32'>;
  /** CSR-style offsets, one per segment plus a terminal offset. */
  segmentOffsets: GraphDataView<'uint32'>;
  /** Caller-owned packed uint32 output with the same length as input. */
  output: GraphDataView<'uint32'>;
  mode?: GPUSegmentedScanMode;
};

/** Performs an independent uint32 prefix sum inside every CSR-style segment. */
export class GPUSegmentedScan {
  readonly id: string;
  readonly input: GraphDataView<'uint32'>;
  readonly segmentOffsets: GraphDataView<'uint32'>;
  readonly output: GraphDataView<'uint32'>;
  readonly mode: GPUSegmentedScanMode;

  constructor(props: GPUSegmentedScanProps) {
    this.id = props.id ?? 'gpu-segmented-scan';
    this.input = props.input;
    this.segmentOffsets = props.segmentOffsets;
    this.output = props.output;
    this.mode = props.mode ?? 'exclusive';
    validatePackedUint32View(this.input, `${this.id} input`);
    validatePackedUint32View(this.segmentOffsets, `${this.id} segmentOffsets`);
    validatePackedUint32View(this.output, `${this.id} output`);
    if (this.output.length !== this.input.length) throw new Error(`${this.id} output length must match input length`);
    if (this.segmentOffsets.length < 1) throw new Error(`${this.id} segmentOffsets must contain at least the terminal offset`);
    if (!['exclusive', 'inclusive'].includes(this.mode)) throw new Error(`${this.id} mode must be exclusive or inclusive`);
    if (this.output.buffer === this.input.buffer || this.output.buffer === this.segmentOffsets.buffer) throw new Error(`${this.id} output must use a separate buffer`);
  }

  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    for (const view of [this.input, this.segmentOffsets, this.output]) {
      if (view.buffer.graph !== graph) throw new Error(`${this.id} views must belong to target graph`);
    }
    const segmentCount = this.segmentOffsets.length - 1;
    if (segmentCount === 0) return;
    const source = makeShaderSource(this);
    graph.addComputePass({
      id: this.id,
      workload: {operation:'GPUSegmentedScan',commandCount:1,maximumWorkgroupCount:segmentCount,maximumInvocationCount:segmentCount*WORKGROUP_SIZE,readByteLength:this.input.length*4+this.segmentOffsets.length*4,writeByteLength:this.output.length*4},
      resources:[{buffer:this.input,usage:'storage-read'},{buffer:this.segmentOffsets,usage:'storage-read'},{buffer:this.output,usage:'storage-write'}],
      compile:({device})=>{const computation=new Computation(device,{id:this.id,source,shaderLayout:{bindings:[{name:'inputValues',type:'read-only-storage',group:0,location:0},{name:'segmentOffsets',type:'read-only-storage',group:0,location:1},{name:'outputValues',type:'storage',group:0,location:2}]}});return{encode:({computePass,getBuffer})=>{const bindings:Record<string,Binding>={inputValues:getViewBinding(this.input,getBuffer),segmentOffsets:getViewBinding(this.segmentOffsets,getBuffer),outputValues:getViewBinding(this.output,getBuffer)};computation.setBindings(bindings);computation.dispatch(computePass,segmentCount,1,1);},destroy:()=>computation.destroy()};}
    });
  }
}

function makeShaderSource(scan: GPUSegmentedScan): string {
  return `const INPUT_OFFSET:u32=${getViewElementOffset(scan.input)}u; const SEGMENT_OFFSET:u32=${getViewElementOffset(scan.segmentOffsets)}u; const OUTPUT_OFFSET:u32=${getViewElementOffset(scan.output)}u; const INCLUSIVE:bool=${scan.mode === 'inclusive'};
@group(0) @binding(0) var<storage,read> inputValues:array<u32>; @group(0) @binding(1) var<storage,read> segmentOffsets:array<u32>; @group(0) @binding(2) var<storage,read_write> outputValues:array<u32>;
@compute @workgroup_size(${WORKGROUP_SIZE}) fn main(@builtin(workgroup_id) wg:vec3u,@builtin(local_invocation_index) lane:u32){let segment=wg.x;let begin=segmentOffsets[SEGMENT_OFFSET+segment];let end=segmentOffsets[SEGMENT_OFFSET+segment+1u];if(lane!=0u){return;}var sum=0u;var i=begin;loop{if(i>=end){break;}let value=inputValues[INPUT_OFFSET+i];outputValues[OUTPUT_OFFSET+i]=select(sum,sum+value,INCLUSIVE);sum+=value;i+=1u;}}`;
}
