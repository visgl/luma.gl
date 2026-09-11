// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Binding} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import {GPUCommandGraph, type GraphDataView} from './gpu-command-graph';
import {
  createTransientView,
  getViewBinding,
  getViewElementOffset,
  validatePackedUint32View,
  validatePackedView
} from './graph-data-view-utils';
import {
  selectGPUSpMVStrategy,
  type GPUSpMVRowStatistics,
  type GPUSpMVStrategyId
} from './gpu-spmv-strategy';

export type GPUAdaptiveSpMVProps = {
  id?: string;
  rowOffsets: GraphDataView<'uint32'>;
  columnIndices: GraphDataView<'uint32'>;
  values: GraphDataView<'float32'>;
  vector: GraphDataView<'float32'>;
  output: GraphDataView<'float32'>;
  columns: number;
  /** Optional row-shape metadata. No CPU readback is performed to discover it. */
  statistics?: GPUSpMVRowStatistics;
  /** Debug/benchmark override. Normal callers should leave this unset. */
  strategy?: GPUSpMVStrategyId;
};

/**
 * Strategy-selecting CSR sparse matrix-vector multiplication: `output = matrix * vector`.
 *
 * The public operation remains stable while execution adapts between scalar rows, subgroup rows,
 * workgroup rows and a two-pass long-row path.
 */
export class GPUAdaptiveSpMV {
  readonly id: string;
  readonly props: GPUAdaptiveSpMVProps;

  constructor(props: GPUAdaptiveSpMVProps) {
    this.id = props.id ?? 'gpu-adaptive-spmv';
    this.props = props;
    validatePackedUint32View(props.rowOffsets, `${this.id} rowOffsets`);
    validatePackedUint32View(props.columnIndices, `${this.id} columnIndices`);
    validatePackedView(props.values, ['float32'], `${this.id} values`);
    validatePackedView(props.vector, ['float32'], `${this.id} vector`);
    validatePackedView(props.output, ['float32'], `${this.id} output`);
    if (props.rowOffsets.length !== props.output.length + 1) {
      throw new Error(`${this.id} rowOffsets length must equal output.length + 1`);
    }
    if (props.columnIndices.length !== props.values.length) {
      throw new Error(`${this.id} columnIndices and values must have equal length`);
    }
    if (!Number.isInteger(props.columns) || props.columns < 0) {
      throw new Error(`${this.id} columns must be a non-negative integer`);
    }
    if (props.vector.length !== props.columns) {
      throw new Error(`${this.id} vector length must equal columns`);
    }
  }

  getStrategy<Parameters>(graph: GPUCommandGraph<Parameters>) {
    return selectGPUSpMVStrategy(
      graph.device,
      {
        rows: this.props.output.length,
        nonZeros: this.props.values.length,
        statistics: this.props.statistics
      },
      this.props.strategy
    );
  }

  explain<Parameters>(graph: GPUCommandGraph<Parameters>) {
    const decision = this.getStrategy(graph);
    return Object.freeze({
      operation: 'GPUSpMV',
      strategy: decision.id,
      score: decision.score,
      reason: decision.reason,
      ...decision.details
    });
  }

  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    const {rowOffsets, columnIndices, values, vector, output} = this.props;
    for (const view of [rowOffsets, columnIndices, values, vector, output]) {
      if (view.buffer.graph !== graph) throw new Error(`${this.id} views must belong to target graph`);
    }
    if (output.length === 0) return;

    const decision = this.getStrategy(graph);
    switch (decision.id) {
      case 'scalar-row':
        addSinglePass(graph, this, decision.id, makeScalarRowShader(this, decision.details.workgroupSize),
          Math.ceil(output.length / decision.details.rowsPerWorkgroup));
        return;
      case 'subgroup-row':
        addSinglePass(graph, this, decision.id, makeSubgroupRowShader(this, decision.details.workgroupSize),
          Math.ceil(output.length / decision.details.rowsPerWorkgroup));
        return;
      case 'workgroup-row':
        addSinglePass(graph, this, decision.id, makeWorkgroupRowShader(this, decision.details.workgroupSize), output.length);
        return;
      case 'long-row':
        addLongRowPasses(graph, this, decision.details.workgroupSize, decision.details.workgroupsPerLongRow);
        return;
    }
  }
}

function addSinglePass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  spmv: GPUAdaptiveSpMV,
  strategy: GPUSpMVStrategyId,
  source: string,
  workgroupCount: number
): void {
  const {rowOffsets, columnIndices, values, vector, output} = spmv.props;
  graph.addComputePass({
    id: `${spmv.id}-${strategy}`,
    workload: {
      operation: `GPUSpMV:${strategy}`,
      commandCount: 1,
      maximumWorkgroupCount: workgroupCount,
      maximumInvocationCount: workgroupCount * 256,
      readByteLength: (rowOffsets.length + columnIndices.length + values.length + vector.length) * 4,
      writeByteLength: output.length * 4
    },
    resources: [
      {buffer: rowOffsets, usage: 'storage-read'},
      {buffer: columnIndices, usage: 'storage-read'},
      {buffer: values, usage: 'storage-read'},
      {buffer: vector, usage: 'storage-read'},
      {buffer: output, usage: 'storage-write'}
    ],
    compile: ({device}) => {
      const computation = new Computation(device, {
        id: `${spmv.id}-${strategy}`,
        source,
        shaderLayout: {bindings: getSpMVBindings()}
      });
      return {
        encode: ({computePass, getBuffer}) => {
          computation.setBindings(getSpMVResolvedBindings(spmv, getBuffer));
          computation.dispatch(computePass, workgroupCount, 1, 1);
        },
        destroy: () => computation.destroy()
      };
    }
  });
}

function addLongRowPasses<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  spmv: GPUAdaptiveSpMV,
  workgroupSize: number,
  workgroupsPerRow: number
): void {
  const rows = spmv.props.output.length;
  const partials = createTransientView(graph, `${spmv.id}-long-row-partials`, 'float32', rows * workgroupsPerRow);
  const partialSource = makeLongRowPartialShader(spmv, workgroupSize, workgroupsPerRow);
  const reduceSource = makeLongRowFinalizeShader(spmv, workgroupsPerRow);

  graph.addComputePass({
    id: `${spmv.id}-long-row-partials`,
    workload: {
      operation: 'GPUSpMV:long-row-partials',
      commandCount: 1,
      maximumWorkgroupCount: rows * workgroupsPerRow,
      maximumInvocationCount: rows * workgroupsPerRow * workgroupSize,
      readByteLength: (spmv.props.rowOffsets.length + spmv.props.columnIndices.length + spmv.props.values.length + spmv.props.vector.length) * 4,
      writeByteLength: partials.length * 4
    },
    resources: [
      {buffer: spmv.props.rowOffsets, usage: 'storage-read'},
      {buffer: spmv.props.columnIndices, usage: 'storage-read'},
      {buffer: spmv.props.values, usage: 'storage-read'},
      {buffer: spmv.props.vector, usage: 'storage-read'},
      {buffer: partials, usage: 'storage-write'}
    ],
    compile: ({device}) => {
      const computation = new Computation(device, {
        id: `${spmv.id}-long-row-partials`,
        source: partialSource,
        shaderLayout: {bindings: [...getSpMVBindings().slice(0, 4), {name: 'partials', type: 'storage', group: 0, location: 4}]}
      });
      return {
        encode: ({computePass, getBuffer}) => {
          const bindings = getSpMVResolvedBindings(spmv, getBuffer);
          delete bindings.outputValues;
          bindings.partials = getViewBinding(partials, getBuffer);
          computation.setBindings(bindings);
          computation.dispatch(computePass, rows * workgroupsPerRow, 1, 1);
        },
        destroy: () => computation.destroy()
      };
    }
  });

  graph.addComputePass({
    id: `${spmv.id}-long-row-finalize`,
    workload: {
      operation: 'GPUSpMV:long-row-finalize',
      commandCount: 1,
      maximumWorkgroupCount: Math.ceil(rows / 64),
      maximumInvocationCount: Math.ceil(rows / 64) * 64,
      readByteLength: partials.length * 4,
      writeByteLength: rows * 4
    },
    resources: [{buffer: partials, usage: 'storage-read'}, {buffer: spmv.props.output, usage: 'storage-write'}],
    compile: ({device}) => {
      const computation = new Computation(device, {
        id: `${spmv.id}-long-row-finalize`,
        source: reduceSource,
        shaderLayout: {bindings: [
          {name: 'partials', type: 'read-only-storage', group: 0, location: 0},
          {name: 'outputValues', type: 'storage', group: 0, location: 1}
        ]}
      });
      return {
        encode: ({computePass, getBuffer}) => {
          computation.setBindings({
            partials: getViewBinding(partials, getBuffer),
            outputValues: getViewBinding(spmv.props.output, getBuffer)
          });
          computation.dispatch(computePass, Math.ceil(rows / 64), 1, 1);
        },
        destroy: () => computation.destroy()
      };
    }
  });
}

function getSpMVBindings() {
  return [
    {name: 'rowOffsets', type: 'read-only-storage' as const, group: 0, location: 0},
    {name: 'columnIndices', type: 'read-only-storage' as const, group: 0, location: 1},
    {name: 'matrixValues', type: 'read-only-storage' as const, group: 0, location: 2},
    {name: 'vectorValues', type: 'read-only-storage' as const, group: 0, location: 3},
    {name: 'outputValues', type: 'storage' as const, group: 0, location: 4}
  ];
}

function getSpMVResolvedBindings(spmv: GPUAdaptiveSpMV, getBuffer: (buffer: any) => any): Record<string, Binding> {
  return {
    rowOffsets: getViewBinding(spmv.props.rowOffsets, getBuffer),
    columnIndices: getViewBinding(spmv.props.columnIndices, getBuffer),
    matrixValues: getViewBinding(spmv.props.values, getBuffer),
    vectorValues: getViewBinding(spmv.props.vector, getBuffer),
    outputValues: getViewBinding(spmv.props.output, getBuffer)
  };
}

function sharedConstants(spmv: GPUAdaptiveSpMV): string {
  return `const ROW_OFFSET:u32=${getViewElementOffset(spmv.props.rowOffsets)}u;
const COLUMN_OFFSET:u32=${getViewElementOffset(spmv.props.columnIndices)}u;
const VALUE_OFFSET:u32=${getViewElementOffset(spmv.props.values)}u;
const VECTOR_OFFSET:u32=${getViewElementOffset(spmv.props.vector)}u;
const OUTPUT_OFFSET:u32=${getViewElementOffset(spmv.props.output)}u;
const ROWS:u32=${spmv.props.output.length}u;
const COLUMNS:u32=${spmv.props.columns}u;
@group(0) @binding(0) var<storage,read> rowOffsets:array<u32>;
@group(0) @binding(1) var<storage,read> columnIndices:array<u32>;
@group(0) @binding(2) var<storage,read> matrixValues:array<f32>;
@group(0) @binding(3) var<storage,read> vectorValues:array<f32>;`;
}

function makeScalarRowShader(spmv: GPUAdaptiveSpMV, workgroupSize: number): string {
  return `${sharedConstants(spmv)}
@group(0) @binding(4) var<storage,read_write> outputValues:array<f32>;
@compute @workgroup_size(${workgroupSize}) fn main(@builtin(global_invocation_id) gid:vec3u){
  let row=gid.x;if(row>=ROWS){return;}let begin=rowOffsets[ROW_OFFSET+row];let end=rowOffsets[ROW_OFFSET+row+1u];var sum=0.0;
  for(var i=begin;i<end;i++){let c=columnIndices[COLUMN_OFFSET+i];if(c<COLUMNS){sum+=matrixValues[VALUE_OFFSET+i]*vectorValues[VECTOR_OFFSET+c];}}
  outputValues[OUTPUT_OFFSET+row]=sum;
}`;
}

function makeSubgroupRowShader(spmv: GPUAdaptiveSpMV, workgroupSize: number): string {
  return `enable subgroups;\n${sharedConstants(spmv)}
@group(0) @binding(4) var<storage,read_write> outputValues:array<f32>;
@compute @workgroup_size(${workgroupSize}) fn main(@builtin(workgroup_id) wg:vec3u,@builtin(subgroup_id) sg:u32,@builtin(subgroup_invocation_id) lane:u32,@builtin(subgroup_size) subgroupSize:u32){
  let row=wg.x*(${workgroupSize}u/subgroupSize)+sg;if(row>=ROWS){return;}let begin=rowOffsets[ROW_OFFSET+row];let end=rowOffsets[ROW_OFFSET+row+1u];var sum=0.0;
  var i=begin+lane;loop{if(i>=end){break;}let c=columnIndices[COLUMN_OFFSET+i];if(c<COLUMNS){sum+=matrixValues[VALUE_OFFSET+i]*vectorValues[VECTOR_OFFSET+c];}i+=subgroupSize;}
  let total=subgroupAdd(sum);if(lane==0u){outputValues[OUTPUT_OFFSET+row]=total;}
}`;
}

function makeWorkgroupRowShader(spmv: GPUAdaptiveSpMV, workgroupSize: number): string {
  return `${sharedConstants(spmv)}
@group(0) @binding(4) var<storage,read_write> outputValues:array<f32>;
var<workgroup> partials:array<f32,${workgroupSize}>;
@compute @workgroup_size(${workgroupSize}) fn main(@builtin(workgroup_id) wg:vec3u,@builtin(local_invocation_index) lane:u32){
  let row=wg.x;if(row>=ROWS){return;}let begin=rowOffsets[ROW_OFFSET+row];let end=rowOffsets[ROW_OFFSET+row+1u];var sum=0.0;var i=begin+lane;
  loop{if(i>=end){break;}let c=columnIndices[COLUMN_OFFSET+i];if(c<COLUMNS){sum+=matrixValues[VALUE_OFFSET+i]*vectorValues[VECTOR_OFFSET+c];}i+=${workgroupSize}u;}
  partials[lane]=sum;workgroupBarrier();for(var stride=${workgroupSize / 2}u;stride>0u;stride/=2u){if(lane<stride){partials[lane]+=partials[lane+stride];}workgroupBarrier();}
  if(lane==0u){outputValues[OUTPUT_OFFSET+row]=partials[0];}
}`;
}

function makeLongRowPartialShader(spmv: GPUAdaptiveSpMV, workgroupSize: number, workgroupsPerRow: number): string {
  return `${sharedConstants(spmv)}
@group(0) @binding(4) var<storage,read_write> partials:array<f32>;
var<workgroup> scratch:array<f32,${workgroupSize}>;
@compute @workgroup_size(${workgroupSize}) fn main(@builtin(workgroup_id) wg:vec3u,@builtin(local_invocation_index) lane:u32){
  let row=wg.x/${workgroupsPerRow}u;let part=wg.x%${workgroupsPerRow}u;if(row>=ROWS){return;}let begin=rowOffsets[ROW_OFFSET+row];let end=rowOffsets[ROW_OFFSET+row+1u];
  var sum=0.0;var i=begin+part*${workgroupSize}u+lane;let stride=${workgroupsPerRow * workgroupSize}u;
  loop{if(i>=end){break;}let c=columnIndices[COLUMN_OFFSET+i];if(c<COLUMNS){sum+=matrixValues[VALUE_OFFSET+i]*vectorValues[VECTOR_OFFSET+c];}i+=stride;}
  scratch[lane]=sum;workgroupBarrier();for(var s=${workgroupSize / 2}u;s>0u;s/=2u){if(lane<s){scratch[lane]+=scratch[lane+s];}workgroupBarrier();}
  if(lane==0u){partials[row*${workgroupsPerRow}u+part]=scratch[0];}
}`;
}

function makeLongRowFinalizeShader(spmv: GPUAdaptiveSpMV, workgroupsPerRow: number): string {
  return `const ROWS:u32=${spmv.props.output.length}u;const OUTPUT_OFFSET:u32=${getViewElementOffset(spmv.props.output)}u;
@group(0) @binding(0) var<storage,read> partials:array<f32>;
@group(0) @binding(1) var<storage,read_write> outputValues:array<f32>;
@compute @workgroup_size(64) fn main(@builtin(global_invocation_id) gid:vec3u){let row=gid.x;if(row>=ROWS){return;}var total=0.0;for(var p=0u;p<${workgroupsPerRow}u;p++){total+=partials[row*${workgroupsPerRow}u+p];}outputValues[OUTPUT_OFFSET+row]=total;}`;
}
