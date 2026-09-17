// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Binding} from '@luma.gl/core';
import {Kernel} from '@luma.gl/engine';
import {GPUCommandGraph, type GraphBufferHandle} from './gpu-command-graph';
import {createGPUComputeCommandNode, type GPUCommandNode} from './gpu-command-node';
import {
  getGPUComputeDispatchWorkgroups,
  setGPUComputeDispatchWorkgroups
} from './gpu-command-dispatch-metadata';
import {GPUScalar, getGPUScalarWGSLLoad, getGPUValueArenaWGSLBinding} from './gpu-scalar';

/** Reusable indirect-dispatch gate controlled by one uint32 GPUScalar (zero = disabled). */
export class GPUScalarDispatchGate {
  readonly id: string;
  readonly active: GPUScalar<'uint32'>;
  readonly workgroups: readonly [number, number, number];
  readonly dispatchBuffer: GraphBufferHandle;
  constructor(
    graph: Pick<GPUCommandGraph<unknown>, 'createTransientBuffer'> & object,
    props: {id: string; active: GPUScalar<'uint32'>; workgroups: readonly [number, number, number]}
  ) {
    this.id = props.id;
    this.active = props.active;
    this.workgroups = props.workgroups;
    if (props.active.arena.graph !== graph)
      throw new Error(`${this.id} active scalar must belong to target graph`);
    this.dispatchBuffer = graph.createTransientBuffer({
      id: `${this.id}-dispatch`,
      byteLength: 12,
      usage: Buffer.STORAGE | Buffer.INDIRECT | Buffer.COPY_SRC
    });
  }
  getUpdateCommandNodes<Parameters>(
    graph: GPUCommandGraph<Parameters>,
    id = `${this.id}-update`
  ): readonly GPUCommandNode<Parameters>[] {
    if (this.active.arena.graph !== (graph as unknown as GPUCommandGraph<unknown>))
      throw new Error(`${this.id} active scalar must belong to target graph`);
    const arenaBuffer = this.active.arena.buffer;
    const [x, y, z] = this.workgroups;
    const source = `${getGPUValueArenaWGSLBinding(0, 0)}
@group(0) @binding(1) var<storage, read_write> dispatch: array<u32>;
@compute @workgroup_size(1)
fn main() {
  let enabled = ${getGPUScalarWGSLLoad(this.active)} != 0u;
  dispatch[0] = select(0u, ${x}u, enabled);
  dispatch[1] = ${y}u;
  dispatch[2] = ${z}u;
}`;
    return [
      createGPUComputeCommandNode<Parameters>({
        id,
        workload: {
          operation: 'GPUScalarDispatchGate',
          commandCount: 1,
          maximumWorkgroupCount: 1,
          maximumInvocationCount: 1,
          readByteLength: 4,
          writeByteLength: 12
        },
        resources: [
          {buffer: arenaBuffer, usage: 'storage-read'},
          {buffer: this.dispatchBuffer, usage: 'storage-write'}
        ],
        compile: ({device}) => {
          const kernel = new Kernel(device, {
            id,
            source,
            shaderLayout: {
              bindings: [
                {name: 'gpuValues', type: 'read-only-storage', group: 0, location: 0},
                {name: 'dispatch', type: 'storage', group: 0, location: 1}
              ]
            }
          });
          return {
            encode: ({computePass, getBuffer}) => {
              const bindings: Record<string, Binding> = {
                gpuValues: getBuffer(arenaBuffer),
                dispatch: getBuffer(this.dispatchBuffer)
              };

              kernel.dispatch(computePass, {bindings, x: 1, y: 1, z: 1});
            },
            destroy: () => kernel.destroy()
          };
        }
      })
    ];
  }
  get condition() {
    return {
      id: `${this.id}-active`,
      source: 'gpu' as const,
      mode: 'indirect' as const,
      buffer: this.dispatchBuffer
    };
  }
}

/** Adds a fresh GPU predicate command for each concrete dispatch. @internal */
export function gateGPUCommandNodes<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  nodes: readonly GPUCommandNode<Parameters>[],
  active: GPUScalar<'uint32'>
): GPUCommandNode<Parameters>[] {
  return nodes.flatMap(node => {
    const workgroups = getGPUComputeDispatchWorkgroups(node);
    if (node.type !== 'compute' || node.condition || !workgroups) {
      throw new Error(
        'Gated primitives must expose unconditional compute nodes with exact dispatch geometry'
      );
    }
    const gate = new GPUScalarDispatchGate(graph, {id: `${node.id}-gate`, active, workgroups});
    return [
      ...gate
        .getUpdateCommandNodes(graph)
        .map(update => setGPUComputeDispatchWorkgroups(update, [1, 1, 1])),
      {...node, condition: gate.condition}
    ];
  });
}
