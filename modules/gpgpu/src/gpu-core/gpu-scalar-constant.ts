// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Binding} from '@luma.gl/core';
import {Kernel} from '@luma.gl/engine';
import {GPUCommandGraph} from './gpu-command-graph';
import {createGPUComputeCommandNode, type GPUCommandNode} from './gpu-command-node';
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

  getCommandNodes<Parameters>(
    graph: GPUCommandGraph<Parameters>
  ): readonly GPUCommandNode<Parameters>[] {
    const {output, value} = this.props;
    if (output.arena.graph !== (graph as unknown as GPUCommandGraph<unknown>)) {
      throw new Error(`${this.id} output must belong to target graph`);
    }
    const literal =
      output.format === 'float32'
        ? `${value.toPrecision(9)}`
        : output.format === 'uint32'
          ? `${value}u`
          : `${value}i`;
    const source = `${getGPUValueArenaWGSLBinding(0, 0)}
@compute @workgroup_size(1) fn main(){${getGPUScalarWGSLStore(output, literal)}}`;
    const buffer = output.arena.buffer;
    return [
      createGPUComputeCommandNode({
        id: this.id,
        workload: {
          operation: 'GPUScalarConstant',
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
