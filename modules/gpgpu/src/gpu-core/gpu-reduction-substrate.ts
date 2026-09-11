// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Binding, Device} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import {GPUCommandGraph, type GraphDataView} from './gpu-command-graph';
import {createTransientView, getViewBinding, getViewElementOffset, validatePackedView} from './graph-data-view-utils';
import {getGPUShaderSubgroupStrategy} from './gpu-subgroup-utils';
import {GPUScalar, getGPUScalarWGSLStore, getGPUValueArenaWGSLBinding} from './gpu-scalar';
import type {GPUScalarDispatchGate} from './gpu-scalar-dispatch-gate';

export const GPU_REDUCTION_WORKGROUP_SIZE = 256;

export type GPUFloat32ReductionMap = 'identity' | 'square' | 'multiply';
export type GPUHierarchicalReductionStrategy = 'portable' | 'subgroups';

/** Selects the fastest supported intra-workgroup reduction path. */
export function getGPUHierarchicalReductionStrategy(device: Device): GPUHierarchicalReductionStrategy {
  return getGPUShaderSubgroupStrategy(device, {requiresSubgroupId: true});
}

/** Returns the partial-row count at each hierarchy level, including the final scalar level. */
export function getGPUHierarchicalReductionLevels(length: number): number[] {
  if (!Number.isSafeInteger(length) || length < 1) throw new Error('reduction length must be positive');
  const levels: number[] = [];
  let count = length;
  while (count > 1) {
    count = Math.ceil(count / GPU_REDUCTION_WORKGROUP_SIZE);
    levels.push(count);
  }
  return levels.length ? levels : [1];
}

export type GPUFloat32HierarchicalReductionProps = {
  id?: string;
  input: GraphDataView<'float32'>;
  /** Required only for `multiply`; must match input length. */
  inputB?: GraphDataView<'float32'>;
  /** First-level map before summation. */
  map?: GPUFloat32ReductionMap;
  /** Final scalar destination in the graph value arena. */
  output: GPUScalar<'float32'>;
  /** Optional GPU-side convergence/active gate. */
  gate?: GPUScalarDispatchGate;
};

/**
 * Reusable hierarchical float32 sum substrate.
 *
 * The first level can reduce `x`, `x*x`, or `x*y`; later levels always sum partial rows. Large
 * inputs therefore scale to any number of workgroups while dot product, norm-squared, and sum all
 * share one implementation. The final row is written directly into a GPUScalar arena slot.
 */
export class GPUFloat32HierarchicalReduction {
  readonly id: string;
  readonly props: Readonly<GPUFloat32HierarchicalReductionProps>;

  constructor(props: GPUFloat32HierarchicalReductionProps) {
    this.id = props.id ?? 'gpu-float32-hierarchical-reduction';
    this.props = Object.freeze({...props, id: this.id, map: props.map ?? 'identity'});
    validatePackedView(props.input, ['float32'], `${this.id} input`);
    if (props.input.length < 1) throw new Error(`${this.id} input must not be empty`);
    if (this.props.map === 'multiply') {
      if (!props.inputB) throw new Error(`${this.id} multiply map requires inputB`);
      validatePackedView(props.inputB, ['float32'], `${this.id} inputB`);
      if (props.inputB.length !== props.input.length) throw new Error(`${this.id} input lengths must match`);
    } else if (props.inputB) {
      throw new Error(`${this.id} inputB is only valid for multiply map`);
    }
  }

  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    const {input, inputB, output, gate} = this.props;
    if (input.buffer.graph !== graph || inputB?.buffer.graph !== graph || output.arena.graph !== (graph as unknown as GPUCommandGraph<unknown>)) {
      throw new Error(`${this.id} resources must belong to target graph`);
    }

    let current = input;
    let currentB = inputB;
    let map = this.props.map ?? 'identity';
    let level = 0;

    while (current.length > GPU_REDUCTION_WORKGROUP_SIZE) {
      const partialCount = Math.ceil(current.length / GPU_REDUCTION_WORKGROUP_SIZE);
      const partials = createTransientView(graph, `${this.id}-level-${level}-partials`, 'float32', partialCount);
      addReductionLevel(graph, {
        id: `${this.id}-level-${level}`,
        input: current,
        inputB: currentB,
        map,
        output: partials,
        finalScalar: undefined,
        gate
      });
      current = partials;
      currentB = undefined;
      map = 'identity';
      level++;
    }

    addReductionLevel(graph, {
      id: `${this.id}-level-${level}`,
      input: current,
      inputB: currentB,
      map,
      finalScalar: output,
      gate
    });
  }
}

type ReductionLevelProps = {
  id: string;
  input: GraphDataView<'float32'>;
  inputB?: GraphDataView<'float32'>;
  map: GPUFloat32ReductionMap;
  output?: GraphDataView<'float32'>;
  finalScalar?: GPUScalar<'float32'>;
  gate?: GPUScalarDispatchGate;
};

function addReductionLevel<Parameters>(graph: GPUCommandGraph<Parameters>, props: ReductionLevelProps): void {
  const outputCount = props.output?.length ?? 1;
  const arenaBuffer = props.finalScalar?.arena.seal().buffer;
  graph.addComputePass({
    id: props.id,
    condition: props.gate?.condition,
    workload: {
      operation: 'GPUHierarchicalReductionLevel',
      commandCount: 1,
      maximumWorkgroupCount: outputCount,
      maximumInvocationCount: outputCount * GPU_REDUCTION_WORKGROUP_SIZE,
      readByteLength: props.input.length * 4 * (props.inputB ? 2 : 1),
      writeByteLength: outputCount * 4
    },
    resources: [
      {buffer: props.input, usage: 'storage-read'},
      ...(props.inputB ? [{buffer: props.inputB, usage: 'storage-read' as const}] : []),
      ...(props.output ? [{buffer: props.output, usage: 'storage-write' as const}] : []),
      ...(arenaBuffer ? [{buffer: arenaBuffer, usage: 'storage-write' as const}] : []),
      ...(props.gate ? [{buffer: props.gate.dispatchBuffer, usage: 'indirect' as const}] : [])
    ],
    compile: ({device}) => {
      const strategy = getGPUHierarchicalReductionStrategy(device);
      const source = makeReductionLevelSource(props, strategy);
      const bindings = [
        {name: 'inputValues', type: 'read-only-storage' as const, group: 0, location: 0},
        ...(props.inputB ? [{name: 'inputBValues', type: 'read-only-storage' as const, group: 0, location: 1}] : []),
        props.output
          ? {name: 'outputValues', type: 'storage' as const, group: 0, location: props.inputB ? 2 : 1}
          : {name: 'gpuValues', type: 'storage' as const, group: 0, location: props.inputB ? 2 : 1}
      ];
      const computation = new Computation(device, {id: props.id, source, shaderLayout: {bindings}});
      return {
        encode: ({computePass, getBuffer}) => {
          const resolved: Record<string, Binding> = {inputValues: getViewBinding(props.input, getBuffer)};
          if (props.inputB) resolved.inputBValues = getViewBinding(props.inputB, getBuffer);
          if (props.output) resolved.outputValues = getViewBinding(props.output, getBuffer);
          if (arenaBuffer) resolved.gpuValues = getBuffer(arenaBuffer);
          computation.setBindings(resolved);
          if (props.gate) computation.dispatchIndirect(computePass, getBuffer(props.gate.dispatchBuffer));
          else computation.dispatch(computePass, outputCount, 1, 1);
        },
        destroy: () => computation.destroy()
      };
    }
  });
}

function makeReductionLevelSource(props: ReductionLevelProps, strategy: GPUHierarchicalReductionStrategy): string {
  const inputBDeclaration = props.inputB
    ? `const INPUT_B_OFFSET:u32=${getViewElementOffset(props.inputB)}u;\n@group(0) @binding(1) var<storage,read> inputBValues:array<f32>;`
    : '';
  const outputBinding = props.inputB ? 2 : 1;
  const outputDeclaration = props.output
    ? `@group(0) @binding(${outputBinding}) var<storage,read_write> outputValues:array<f32>;`
    : `${getGPUValueArenaWGSLBinding(0, outputBinding)}`;
  const mapped = getMappedExpression(props.map, props.inputB ? 'inputBValues[INPUT_B_OFFSET+i]' : undefined);
  const store = props.output
    ? `outputValues[workgroupId.x] = total;`
    : getGPUScalarWGSLStore(props.finalScalar!, 'total');
  const subgroupHeader = strategy === 'subgroups' ? 'enable subgroups;\nrequires subgroup_id;' : '';
  const reducer = strategy === 'subgroups' ? getSubgroupReducerWGSL() : getPortableReducerWGSL();
  const subgroupParams = strategy === 'subgroups'
    ? ', @builtin(subgroup_invocation_id) subgroupInvocationId:u32, @builtin(subgroup_size) subgroupSize:u32, @builtin(subgroup_id) subgroupId:u32'
    : '';
  const reducerCall = strategy === 'subgroups'
    ? 'reduceValue(value, lane, subgroupInvocationId, subgroupSize, subgroupId)'
    : 'reduceValue(value, lane)';

  return `${subgroupHeader}
const LENGTH:u32=${props.input.length}u;
const INPUT_OFFSET:u32=${getViewElementOffset(props.input)}u;
@group(0) @binding(0) var<storage,read> inputValues:array<f32>;
${inputBDeclaration}
${outputDeclaration}
${reducer}
@compute @workgroup_size(${GPU_REDUCTION_WORKGROUP_SIZE}) fn main(
  @builtin(local_invocation_index) lane:u32,
  @builtin(workgroup_id) workgroupId:vec3u${subgroupParams}
){
  let i = workgroupId.x * ${GPU_REDUCTION_WORKGROUP_SIZE}u + lane;
  var value = 0.0;
  if (i < LENGTH) { value = ${mapped}; }
  let total = ${reducerCall};
  if (lane == 0u) { ${store} }
}`;
}

function getMappedExpression(map: GPUFloat32ReductionMap, inputB?: string): string {
  switch (map) {
    case 'identity': return 'inputValues[INPUT_OFFSET+i]';
    case 'square': return 'inputValues[INPUT_OFFSET+i] * inputValues[INPUT_OFFSET+i]';
    case 'multiply': return `inputValues[INPUT_OFFSET+i] * ${inputB}`;
  }
}

function getPortableReducerWGSL(): string {
  return `var<workgroup> reductionScratch:array<f32,${GPU_REDUCTION_WORKGROUP_SIZE}>;
fn reduceValue(inputValue:f32,lane:u32)->f32{
  reductionScratch[lane]=inputValue;
  workgroupBarrier();
  for(var stride=${GPU_REDUCTION_WORKGROUP_SIZE / 2}u;stride>0u;stride/=2u){
    if(lane<stride){reductionScratch[lane]+=reductionScratch[lane+stride];}
    workgroupBarrier();
  }
  return reductionScratch[0];
}`;
}

function getSubgroupReducerWGSL(): string {
  return `var<workgroup> subgroupTotals:array<f32,64>;
fn reduceValue(inputValue:f32,lane:u32,subgroupInvocationId:u32,subgroupSize:u32,subgroupId:u32)->f32{
  let subgroupTotal=subgroupAdd(inputValue);
  if(subgroupInvocationId==0u){subgroupTotals[subgroupId]=subgroupTotal;}
  workgroupBarrier();
  let subgroupCount=${GPU_REDUCTION_WORKGROUP_SIZE}u/subgroupSize;
  if(subgroupCount>1u){
    for(var stride=subgroupCount/2u;stride>0u;stride/=2u){
      if(lane<stride){subgroupTotals[lane]+=subgroupTotals[lane+stride];}
      workgroupBarrier();
    }
  }
  return subgroupTotals[0];
}`;
}
