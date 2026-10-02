// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Binding} from '@luma.gl/core';
import {Kernel} from '@luma.gl/engine';
import {createGPUComputeCommandNode, type GPUCommandNode} from './gpu-command-node';
import type {GPUCommandGraph, GraphBufferUse, GraphDataView} from './gpu-command-graph';
import type {GPUBoundedDispatchLayout} from './gpu-dispatch-utils';
import {
  doGraphDataViewsOverlap,
  getViewBinding,
  getViewBindingRange
} from './graph-data-view-utils';

/** Validates writable spatial columns without changing their storage. @internal */
export function validateSpatialWrites(
  id: string,
  inputs: readonly GraphDataView[],
  outputs: readonly GraphDataView[]
): void {
  for (const [index, output] of outputs.entries()) {
    if (
      inputs.some(input => doGraphDataViewsOverlap(input, output)) ||
      outputs.slice(0, index).some(previous => doGraphDataViewsOverlap(previous, output))
    ) {
      throw new Error(`${id} writable views must not overlap inputs or other outputs`);
    }
  }
}

/** Shared bounded spatial dispatch with deferred buffer resolution. @internal */
export function getSpatialCommandNodes<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  props: {
    id: string;
    source: string;
    resources: GraphBufferUse[];
    bindings: Record<string, GraphDataView>;
    dispatch: GPUBoundedDispatchLayout;
  }
): readonly GPUCommandNode<Parameters>[] {
  for (const view of Object.values(props.bindings)) {
    if (getViewBindingRange(view).size > graph.device.limits.maxStorageBufferBindingSize) {
      throw new Error(`${props.id} active chunks must fit a storage binding`);
    }
  }
  return [
    createGPUComputeCommandNode<Parameters>({
      id: props.id,
      resources: props.resources,
      compile: ({device}) => {
        const kernel = new Kernel(device, {
          id: props.id,
          source: props.source,
          shaderLayout: {
            bindings: Object.keys(props.bindings).map((name, location) => ({
              name,
              type: 'storage' as const,
              group: 0,
              location
            }))
          }
        });
        return {
          encode: ({computePass, getBuffer}) => {
            const bindings: Record<string, Binding> = {};
            for (const [name, view] of Object.entries(props.bindings))
              bindings[name] = getViewBinding(view, getBuffer);

            kernel.dispatch(computePass, {
              bindings,
              x: props.dispatch.x,
              y: props.dispatch.y,
              z: props.dispatch.z
            });
          },
          destroy: () => kernel.destroy()
        };
      }
    })
  ];
}
