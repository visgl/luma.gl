// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GPUCommandGraph, GPUCommandGraphComputeNode} from './gpu-command-graph';

export type GPUCommandGraphComputeLowering = <Parameters>(
  node: Omit<GPUCommandGraphComputeNode<Parameters>, 'type'>
) => Omit<GPUCommandGraphComputeNode<Parameters>, 'type'>;

const loweringStacks = new WeakMap<object, GPUCommandGraphComputeLowering[]>();

/**
 * Applies an explicit compiler-owned transform to compute nodes emitted during `callback`.
 *
 * This is the supported lowering seam between semantic/compiler code and execution-level
 * contributors. It replaces ad-hoc replacement of `graph.addComputePass` while legacy execution
 * primitives are migrated to direct node factories.
 */
export function withGPUCommandGraphComputeLowering<Parameters, Result>(
  graph: GPUCommandGraph<Parameters>,
  lowering: GPUCommandGraphComputeLowering,
  callback: () => Result
): Result {
  let stack = loweringStacks.get(graph);
  if (!stack) {
    stack = [];
    loweringStacks.set(graph, stack);
  }
  stack.push(lowering);
  try {
    return callback();
  } finally {
    stack.pop();
    if (stack.length === 0) loweringStacks.delete(graph);
  }
}

/** @internal Called by GPUCommandGraph.addComputePass before node insertion. */
export function applyGPUCommandGraphComputeLowering<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  node: Omit<GPUCommandGraphComputeNode<Parameters>, 'type'>
): Omit<GPUCommandGraphComputeNode<Parameters>, 'type'> {
  const stack = loweringStacks.get(graph);
  if (!stack?.length) return node;
  let lowered = node;
  for (const lowering of stack) lowered = lowering(lowered);
  return lowered;
}
