// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Binding} from '@luma.gl/core';
import {Kernel} from '@luma.gl/engine';
import {GPUCommandGraph, GraphVectorView, type GraphDataView} from './gpu-command-graph';
import {createGPUComputeCommandNode, type GPUCommandNode} from './gpu-command-node';
import {getViewBinding, getViewElementOffset, validatePackedView} from './graph-data-view-utils';
import {
  GPUScalar,
  getGPUScalarWGSLLoad,
  getGPUScalarWGSLStore,
  getGPUValueArenaWGSLBinding
} from './gpu-scalar';
import type {GPUScalarDispatchGate} from './gpu-scalar-dispatch-gate';
import {alignGraphVectorViews, getGraphVectorData} from './graph-vector-view-utils';
import {setGPUComputeDispatchWorkgroups} from './gpu-command-dispatch-metadata';
import {GPUScalarLiteral} from './gpu-scalar-literal';
const WORKGROUP_SIZE = 256;
/** Fused float32 dot product whose scalar result is written directly into the graph value arena. */
export class GPUDotProductScalar {
  readonly id: string;
  constructor(
    readonly props: {
      id?: string;
      left: GraphDataView<'float32'> | GraphVectorView<'float32'>;
      right: GraphDataView<'float32'> | GraphVectorView<'float32'>;
      output: GPUScalar<'float32'>;
      gate?: GPUScalarDispatchGate;
      /** @internal Adds a chunk partial to an existing scalar result. */
      accumulate?: boolean;
    }
  ) {
    this.id = props.id ?? 'gpu-dot-product-scalar';
    for (const chunk of getGraphVectorData(props.left))
      validatePackedView(chunk, ['float32'], `${this.id} left`);
    for (const chunk of getGraphVectorData(props.right))
      validatePackedView(chunk, ['float32'], `${this.id} right`);
    if (props.left.length !== props.right.length)
      throw new Error(`${this.id} inputs must have equal length`);
  }
  getCommandNodes<Parameters>(
    graph: GPUCommandGraph<Parameters>
  ): readonly GPUCommandNode<Parameters>[] {
    const {left, right, output, gate, accumulate} = this.props;
    if (left instanceof GraphVectorView || right instanceof GraphVectorView) {
      const spans = alignGraphVectorViews(graph, [left, right]);
      if (spans.length === 0) {
        if (accumulate) return [];
        return new GPUScalarLiteral({id: this.id, output, value: 0})
          .getCommandNodes(graph)
          .map(node =>
            setGPUComputeDispatchWorkgroups(
              {
                ...node,
                condition: gate?.condition,
                resources: [
                  ...(node.resources ?? []),
                  ...(gate ? [{buffer: gate.dispatchBuffer, usage: 'indirect' as const}] : [])
                ]
              },
              [1, 1, 1]
            )
          );
      }
      return spans.flatMap(([leftChunk, rightChunk], index) =>
        new GPUDotProductScalar({
          id: `${this.id}-chunk-${index}`,
          left: leftChunk,
          right: rightChunk,
          output,
          gate,
          accumulate: accumulate || index > 0
        }).getCommandNodes(graph)
      );
    }
    if (
      left.buffer.graph !== graph ||
      right.buffer.graph !== graph ||
      output.arena.graph !== (graph as unknown as GPUCommandGraph<unknown>)
    )
      throw new Error(`${this.id} resources must belong to target graph`);
    const arenaBuffer = output.arena.buffer;
    const source = `
const LENGTH: u32 = ${left.length}u;
const L: u32 = ${getViewElementOffset(left)}u;
const R: u32 = ${getViewElementOffset(right)}u;

@group(0) @binding(0) var<storage, read> leftValues: array<f32>;
@group(0) @binding(1) var<storage, read> rightValues: array<f32>;
${getGPUValueArenaWGSLBinding(0, 2)}

var<workgroup> s: array<f32, ${WORKGROUP_SIZE}>;

@compute @workgroup_size(${WORKGROUP_SIZE})
fn main(@builtin(local_invocation_index) lane: u32) {
  var v = 0.0;
  var i = lane;
  loop {
    if (i >= LENGTH) {
      break;
    }
    v += leftValues[L + i] * rightValues[R + i];
    i += ${WORKGROUP_SIZE}u;
  }

  s[lane] = v;
  workgroupBarrier();

  var stride = ${WORKGROUP_SIZE / 2}u;
  loop {
    if (stride == 0u) {
      break;
    }
    if (lane < stride) {
      s[lane] += s[lane + stride];
    }
    workgroupBarrier();
    stride /= 2u;
  }

  if (lane == 0u) {
    ${getGPUScalarWGSLStore(output, accumulate ? `${getGPUScalarWGSLLoad(output)} + s[0]` : 's[0]')}
  }
}
`;
    return [
      setGPUComputeDispatchWorkgroups(
        createGPUComputeCommandNode<Parameters>({
          id: this.id,
          condition: gate?.condition,
          workload: {
            operation: 'GPUDotProductScalar',
            commandCount: 1,
            maximumWorkgroupCount: 1,
            maximumInvocationCount: WORKGROUP_SIZE,
            readByteLength: (left.length + right.length) * 4,
            writeByteLength: 4
          },
          resources: [
            {buffer: left, usage: 'storage-read'},
            {buffer: right, usage: 'storage-read'},
            {buffer: arenaBuffer, usage: accumulate ? 'storage-read-write' : 'storage-write'},
            ...(gate ? [{buffer: gate.dispatchBuffer, usage: 'indirect' as const}] : [])
          ],
          compile: ({device}) => {
            const kernel = new Kernel(device, {
              id: this.id,
              source,
              shaderLayout: {
                bindings: [
                  {name: 'leftValues', type: 'read-only-storage', group: 0, location: 0},
                  {name: 'rightValues', type: 'read-only-storage', group: 0, location: 1},
                  {name: 'gpuValues', type: 'storage', group: 0, location: 2}
                ]
              }
            });
            return {
              encode: ({computePass, getBuffer}) => {
                const bindings: Record<string, Binding> = {
                  leftValues: getViewBinding(left, getBuffer),
                  rightValues: getViewBinding(right, getBuffer),
                  gpuValues: getBuffer(arenaBuffer)
                };

                if (gate)
                  kernel.dispatchIndirect(computePass, {
                    bindings,
                    indirectBuffer: getBuffer(gate.dispatchBuffer)
                  });
                else kernel.dispatch(computePass, {bindings, x: 1, y: 1, z: 1});
              },
              destroy: () => kernel.destroy()
            };
          }
        }),
        [1, 1, 1]
      )
    ];
  }
}
