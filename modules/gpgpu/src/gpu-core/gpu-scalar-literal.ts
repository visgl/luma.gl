// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Binding} from '@luma.gl/core';
import {Kernel} from '@luma.gl/engine';
import type {GPUCommandGraph} from './gpu-command-graph';
import {createGPUComputeCommandNode, type GPUComputeCommandNode} from './gpu-command-node';
import {GPUScalar, getGPUScalarWGSLStore, getGPUValueArenaWGSLBinding} from './gpu-scalar';

/** WebGPU execution primitive writing one host-known literal to an arena scalar. */
export class GPUScalarLiteral {
  readonly id: string;
  constructor(readonly props: {id?: string; output: GPUScalar; value: number}) {
    this.id = props.id ?? `${props.output.id}-literal`;
  }

  /** Constructs execution nodes without mutating the target graph. */
  getCommandNodes<Parameters>(
    graph: GPUCommandGraph<Parameters>
  ): readonly GPUComputeCommandNode<Parameters>[] {
    const {output, value} = this.props;
    if (output.arena.graph !== (graph as unknown as GPUCommandGraph<unknown>))
      throw new Error(`${this.id} output must belong to target graph`);
    const expression =
      output.format === 'float32'
        ? `f32(${value})`
        : output.format === 'uint32'
          ? `${value}u`
          : `${value}i`;
    const source = `
${getGPUValueArenaWGSLBinding(0, 0)}

@compute @workgroup_size(1)
fn main() {
  ${getGPUScalarWGSLStore(output, expression)}
}
`;
    const buffer = output.arena.buffer;
    return [
      createGPUComputeCommandNode({
        id: this.id,
        workload: {
          operation: 'GPUScalarLiteral',
          commandCount: 1,
          maximumWorkgroupCount: 1,
          maximumInvocationCount: 1,
          readByteLength: 0,
          writeByteLength: 4
        },
        resources: [{buffer, usage: 'storage-write'}],
        compile: ({device}) => {
          const kernel = new Kernel(device, {
            id: this.id,
            source,
            shaderLayout: {bindings: [{name: 'gpuValues', type: 'storage', group: 0, location: 0}]}
          });
          return {
            encode: ({computePass, getBuffer}) => {
              const bindings: Record<string, Binding> = {gpuValues: getBuffer(buffer)};

              kernel.dispatch(computePass, {bindings, x: 1, y: 1, z: 1});
            },
            destroy: () => kernel.destroy()
          };
        }
      })
    ];
  }
}
