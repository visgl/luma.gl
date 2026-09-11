// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {
  GPUCommandGraphComputeNode,
  GPUCommandGraphCopyNode,
  GPUCommandGraphNode,
  GPUCommandGraphNodeType,
  GPUCommandGraphRenderNode
} from './gpu-command-graph-types';

/**
 * Execution-layer node scheduled by a {@link GPUCommandGraph}.
 *
 * A command node is deliberately not a `GPUOperation`. Operations belong to `GPUProgram` and are
 * lowered by a backend compiler; command nodes are the concrete compute/render/copy units produced
 * by that lowering and scheduled by the execution graph.
 */
export type GPUCommandNode<Parameters = void> = GPUCommandGraphNode<Parameters>;

/** Concrete compute-pass execution node. */
export type GPUComputeCommandNode<Parameters = void> = GPUCommandGraphComputeNode<Parameters>;

/** Concrete render-pass execution node. */
export type GPURenderCommandNode<Parameters = void> = GPUCommandGraphRenderNode<Parameters>;

/** Concrete copy/pass-independent execution node. */
export type GPUCopyCommandNode<Parameters = void> = GPUCommandGraphCopyNode<Parameters>;

/** Execution category of a command node. */
export type GPUCommandNodeType = GPUCommandGraphNodeType;

/** Creates a compute command node without involving a semantic GPU operation. */
export function createGPUComputeCommandNode<Parameters = void>(
  node: Omit<GPUComputeCommandNode<Parameters>, 'type'>
): GPUComputeCommandNode<Parameters> {
  return {...node, type: 'compute'};
}

/** Creates a render command node without involving a semantic GPU operation. */
export function createGPURenderCommandNode<Parameters = void>(
  node: Omit<GPURenderCommandNode<Parameters>, 'type'>
): GPURenderCommandNode<Parameters> {
  return {...node, type: 'render'};
}

/** Creates a copy/pass-independent command node without involving a semantic GPU operation. */
export function createGPUCopyCommandNode<Parameters = void>(
  node: Omit<GPUCopyCommandNode<Parameters>, 'type'>
): GPUCopyCommandNode<Parameters> {
  return {...node, type: 'copy'};
}
