// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GPUCommandGraph} from './gpu-command-graph';
import type {
  GPUCommandGraphComputeNode,
  GPUCommandGraphCopyNode,
  GPUCommandGraphNode,
  GPUCommandGraphNodeType,
  GPUCommandGraphRenderNode
} from './gpu-command-graph-types';

/** Execution-layer node scheduled by a GPUCommandGraph. Never a semantic GPUOperation. */
export type GPUCommandNode<Parameters = void> = GPUCommandGraphNode<Parameters>;
export type GPUComputeCommandNode<Parameters = void> = GPUCommandGraphComputeNode<Parameters>;
export type GPURenderCommandNode<Parameters = void> = GPUCommandGraphRenderNode<Parameters>;
export type GPUCopyCommandNode<Parameters = void> = GPUCommandGraphCopyNode<Parameters>;
export type GPUCommandNodeType = GPUCommandGraphNodeType;

/** Execution primitive that constructs concrete command nodes without mutating a graph. */
export interface GPUCommandNodeProducer<Parameters = void> {
  getCommandNodes(graph: GPUCommandGraph<Parameters>): readonly GPUCommandNode<Parameters>[];
}

/** Adds one already-constructed execution node to a command graph. */
export function addGPUCommandNode<Parameters>(graph: GPUCommandGraph<Parameters>, node: GPUCommandNode<Parameters>): void {
  switch (node.type) {
    case 'compute': { const {type: _type, ...value} = node; graph.addComputePass(value); return; }
    case 'render': { const {type: _type, ...value} = node; graph.addRenderPass(value); return; }
    case 'copy': { const {type: _type, ...value} = node; graph.addCopyPass(value); return; }
  }
}

export function addGPUCommandNodes<Parameters>(graph: GPUCommandGraph<Parameters>, nodes: readonly GPUCommandNode<Parameters>[]): void {
  for (const node of nodes) addGPUCommandNode(graph, node);
}

export function createGPUComputeCommandNode<Parameters = void>(node: Omit<GPUComputeCommandNode<Parameters>, 'type'>): GPUComputeCommandNode<Parameters> { return {...node, type: 'compute'}; }
export function createGPURenderCommandNode<Parameters = void>(node: Omit<GPURenderCommandNode<Parameters>, 'type'>): GPURenderCommandNode<Parameters> { return {...node, type: 'render'}; }
export function createGPUCopyCommandNode<Parameters = void>(node: Omit<GPUCopyCommandNode<Parameters>, 'type'>): GPUCopyCommandNode<Parameters> { return {...node, type: 'copy'}; }
