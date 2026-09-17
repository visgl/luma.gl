// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Binding} from '@luma.gl/core';
import {Kernel} from '@luma.gl/engine';
import type {GPUCommandGraph, GraphDataView} from './gpu-command-graph';
import {createGPUComputeCommandNode, type GPUCommandNode} from './gpu-command-node';
import {createTransientView, getViewBinding, getViewElementOffset} from './graph-data-view-utils';
import {getGPUShaderSubgroupStrategy} from './gpu-subgroup-utils';
import {
  GPUScalar,
  getGPUScalarWGSLLoad,
  getGPUScalarWGSLStore,
  getGPUValueArenaWGSLBinding
} from './gpu-scalar';
import {setGPUComputeDispatchWorkgroups} from './gpu-command-dispatch-metadata';
import {getChunkDispatch} from './gpu-chunk-utils';

export const GPU_REDUCTION_WORKGROUP_SIZE = 256;

/** Partial lengths for a bounded hierarchical reduction, including its final scalar. @internal */
export function getGPUHierarchicalReductionLevels(length: number): number[] {
  if (!Number.isSafeInteger(length) || length < 1)
    throw new Error('reduction length must be positive');
  const levels: number[] = [];
  do {
    length = Math.ceil(length / GPU_REDUCTION_WORKGROUP_SIZE);
    levels.push(length);
  } while (length > 1);
  return levels;
}

type ReductionLevelProps = {
  id: string;
  input: GraphDataView<'float32'>;
  inputB?: GraphDataView<'float32'>;
  square?: boolean;
  output?: GraphDataView<'float32'>;
  finalScalar?: GPUScalar<'float32'>;
  accumulate?: boolean;
};

/** Shared lowering behind GPUDotProductScalar; each workgroup consumes at most 256 rows. @internal */
export function getGPUScalarReductionNodes<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  props: {
    id: string;
    input: GraphDataView<'float32'>;
    inputB: GraphDataView<'float32'>;
    output: GPUScalar<'float32'>;
    accumulate: boolean;
  }
): GPUCommandNode<Parameters>[] {
  const nodes: GPUCommandNode<Parameters>[] = [];
  let input = props.input;
  let inputB: GraphDataView<'float32'> | undefined =
    props.inputB === input ? undefined : props.inputB;
  let square = props.inputB === input;
  for (const [level, length] of getGPUHierarchicalReductionLevels(input.length).entries()) {
    const output =
      length > 1
        ? createTransientView(graph, `${props.id}-partials-${level}`, 'float32', length)
        : undefined;
    nodes.push(
      createReductionLevel(graph, {
        id: `${props.id}-level-${level}`,
        input,
        inputB,
        square,
        output,
        finalScalar: output ? undefined : props.output,
        accumulate: props.accumulate
      })
    );
    if (output) input = output;
    inputB = undefined;
    square = false;
  }
  return nodes;
}

function createReductionLevel<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  props: ReductionLevelProps
): GPUCommandNode<Parameters> {
  const outputCount = props.output?.length ?? 1;
  const dispatch = getChunkDispatch(
    outputCount,
    graph.device.limits.maxComputeWorkgroupsPerDimension
  );
  const arenaBuffer = props.finalScalar?.arena.buffer;
  const outputLocation = props.inputB ? 2 : 1;
  const usesSubgroups =
    getGPUShaderSubgroupStrategy(graph.device, {requiresSubgroupId: true}) === 'subgroups';
  const source = makeReductionLevelSource(props, dispatch, usesSubgroups);
  return setGPUComputeDispatchWorkgroups(
    createGPUComputeCommandNode<Parameters>({
      id: props.id,
      workload: {
        operation: 'GPUDotProductScalar',
        commandCount: 1,
        maximumWorkgroupCount: dispatch.x * dispatch.y * dispatch.z,
        maximumInvocationCount: dispatch.x * dispatch.y * dispatch.z * GPU_REDUCTION_WORKGROUP_SIZE,
        readByteLength: props.input.length * 4 * (props.inputB ? 2 : 1),
        writeByteLength: outputCount * 4
      },
      resources: [
        {buffer: props.input, usage: 'storage-read'},
        ...(props.inputB ? [{buffer: props.inputB, usage: 'storage-read' as const}] : []),
        ...(props.output ? [{buffer: props.output, usage: 'storage-write' as const}] : []),
        ...(arenaBuffer ? [{buffer: arenaBuffer, usage: 'storage-read-write' as const}] : [])
      ],
      compile: ({device}) => {
        const kernel = new Kernel(device, {
          id: props.id,
          source,
          shaderLayout: {
            bindings: [
              {name: 'inputValues', type: 'read-only-storage', group: 0, location: 0},
              ...(props.inputB
                ? [
                    {
                      name: 'inputBValues',
                      type: 'read-only-storage' as const,
                      group: 0,
                      location: 1
                    }
                  ]
                : []),
              {
                name: props.output ? 'outputValues' : 'gpuValues',
                type: 'storage',
                group: 0,
                location: outputLocation
              }
            ]
          }
        });
        return {
          encode: ({computePass, getBuffer}) => {
            const bindings: Record<string, Binding> = {
              inputValues: getViewBinding(props.input, getBuffer)
            };
            if (props.inputB) bindings['inputBValues'] = getViewBinding(props.inputB, getBuffer);
            if (props.output) bindings['outputValues'] = getViewBinding(props.output, getBuffer);
            if (arenaBuffer) bindings['gpuValues'] = getBuffer(arenaBuffer);
            kernel.dispatch(computePass, {bindings, ...dispatch});
          },
          destroy: () => kernel.destroy()
        };
      }
    }),
    [dispatch.x, dispatch.y, dispatch.z]
  );
}

function makeReductionLevelSource(
  props: ReductionLevelProps,
  dispatch: {x: number; y: number},
  usesSubgroups: boolean
): string {
  const outputLocation = props.inputB ? 2 : 1;
  const inputValue = `inputValues[${getViewElementOffset(props.input)}u + index]`;
  const mappedValue = props.inputB
    ? `${inputValue} * inputBValues[${getViewElementOffset(props.inputB)}u + index]`
    : props.square
      ? `${inputValue} * ${inputValue}`
      : inputValue;
  const store = props.output
    ? `outputValues[${getViewElementOffset(props.output)}u + groupIndex] = total;`
    : getGPUScalarWGSLStore(
        props.finalScalar!,
        props.accumulate ? `${getGPUScalarWGSLLoad(props.finalScalar!)} + total` : 'total'
      );
  return `${usesSubgroups ? 'enable subgroups;\nrequires subgroup_id;\n' : ''}
@group(0) @binding(0) var<storage, read> inputValues: array<f32>;
${props.inputB ? '@group(0) @binding(1) var<storage, read> inputBValues: array<f32>;' : ''}
${props.output ? `@group(0) @binding(${outputLocation}) var<storage, read_write> outputValues: array<f32>;` : getGPUValueArenaWGSLBinding(0, outputLocation)}
${usesSubgroups ? subgroupReducer : portableReducer}
@compute @workgroup_size(${GPU_REDUCTION_WORKGROUP_SIZE})
fn main(
  @builtin(local_invocation_index) lane: u32,
  @builtin(workgroup_id) workgroupId: vec3u${
    usesSubgroups
      ? `,
  @builtin(subgroup_invocation_id) subgroupInvocationId: u32,
  @builtin(subgroup_size) subgroupSize: u32,
  @builtin(subgroup_id) subgroupId: u32`
      : ''
  }
) {
  let groupIndex = workgroupId.x + ${dispatch.x}u * (workgroupId.y + ${dispatch.y}u * workgroupId.z);
  if (groupIndex >= ${props.output?.length ?? 1}u) { return; }
  let index = groupIndex * ${GPU_REDUCTION_WORKGROUP_SIZE}u + lane;
  var value = 0.0;
  if (index < ${props.input.length}u) { value = ${mappedValue}; }
  let total = reduceValue(value, lane${usesSubgroups ? ', subgroupInvocationId, subgroupSize, subgroupId' : ''});
  if (lane == 0u) { ${store} }
}`;
}

const portableReducer = `
var<workgroup> reductionScratch: array<f32, ${GPU_REDUCTION_WORKGROUP_SIZE}>;
fn reduceValue(value: f32, lane: u32) -> f32 {
  reductionScratch[lane] = value;
  workgroupBarrier();
  for (var stride = ${GPU_REDUCTION_WORKGROUP_SIZE / 2}u; stride > 0u; stride /= 2u) {
    if (lane < stride) { reductionScratch[lane] += reductionScratch[lane + stride]; }
    workgroupBarrier();
  }
  return reductionScratch[0];
}`;

const subgroupReducer = `
var<workgroup> subgroupTotals: array<f32, 64>;
fn reduceValue(value: f32, lane: u32, subgroupInvocationId: u32, subgroupSize: u32, subgroupId: u32) -> f32 {
  let subtotal = subgroupAdd(value);
  if (subgroupInvocationId == 0u) { subgroupTotals[subgroupId] = subtotal; }
  workgroupBarrier();
  let subgroupCount = ${GPU_REDUCTION_WORKGROUP_SIZE}u / subgroupSize;
  for (var stride = subgroupCount / 2u; stride > 0u; stride /= 2u) {
    if (lane < stride) { subgroupTotals[lane] += subgroupTotals[lane + stride]; }
    workgroupBarrier();
  }
  return subgroupTotals[0];
}`;
