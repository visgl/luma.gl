// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import {GPUCommandGraph} from './gpu-command-graph';
import {
  GPUCompositeOperation,
  isGPUCommandGraphContributor,
  isGPUOperation,
  type GPUProgramOperation,
  type GPUOperationTree
} from './gpu-operation';
import {GPUConditionalOperation, GPULoopOperation} from './gpu-control-flow-operation';
import {
  GPUOperationLoweringRegistry,
  type GPUOperationLoweringDecision,
  type GPUProgramBackendCapabilities
} from './gpu-program-lowering';
import type {GPUProgram} from './gpu-program';

export type GPUProgramLoweredNode = {
  nodeId: string;
  nodeType: 'compute' | 'render' | 'copy';
  operationPath: readonly string[];
};
export type GPUProgramLoweringReport = {
  operations: readonly GPUOperationTree[];
  nodes: readonly GPUProgramLoweredNode[];
  decisions: readonly GPUOperationLoweringDecision[];
};
export type GPUProgramCompilation<Parameters = void> = {
  program: GPUProgram;
  graph: GPUCommandGraph<Parameters>;
  lowering: GPUProgramLoweringReport;
};

/** WebGPU compiler from semantic GPUProgram to executable GPUCommandGraph. */
export class GPUProgramCompiler<Parameters = void> {
  readonly device: Device;
  readonly capabilities: GPUProgramBackendCapabilities;
  readonly lowerings = new GPUOperationLoweringRegistry<Parameters>();

  constructor(device: Device) {
    this.device = device;
    this.capabilities = Object.freeze({
      backend: 'webgpu',
      gpuConditionals: true,
      nativeLoops: false,
      childGraphs: false
    });
    this.registerCoreLowerings();
  }

  compile(program: GPUProgram): GPUProgramCompilation<Parameters> {
    const graph = new GPUCommandGraph<Parameters>(this.device, {id: `${program.id}-commands`});
    const state: LoweringState = {path: [], nodes: [], decisions: []};
    const restore = instrumentGraph(graph, state);
    try {
      for (const operation of program.operations) this.lower(graph, operation, state);
    } finally {
      restore();
    }
    return Object.freeze({
      program,
      graph,
      lowering: Object.freeze({
        operations: program.operationTree,
        nodes: Object.freeze(
          state.nodes.map(node =>
            Object.freeze({...node, operationPath: Object.freeze([...node.operationPath])})
          )
        ),
        decisions: Object.freeze(state.decisions.map(decision => Object.freeze({...decision})))
      })
    });
  }

  protected registerCoreLowerings(): void {
    this.lowerings.register<GPUConditionalOperation>('conditional', (operation, context) => {
      if (operation.predicate.source === 'cpu' && operation.lowering !== 'dynamic-gpu') {
        throw new Error(
          `${operation.id} CPU predicate requires a compile-time value before WebGPU lowering`
        );
      }
      // The semantic/compiler split is now correct; concrete GPU predicate storage and per-node
      // indirect dispatch geometry are intentionally the next WebGPU lowering capability.
      throw new Error(
        `${operation.id} requires WebGPU predicate binding and indirect-dispatch lowering`
      );
    });

    this.lowerings.register<GPULoopOperation>('loop', (operation, context) => {
      const unroll = operation.lowering === 'unroll' || !operation.predicate;
      if (unroll) {
        context.recordDecision({
          operationId: operation.id,
          operationType: operation.type,
          lowering: 'bounded-unroll',
          reason: operation.predicate
            ? 'explicit unroll preference'
            : 'loop has no runtime predicate'
        });
        for (let iteration = 0; iteration < operation.maximumIterations; iteration++) {
          for (const child of operation.operations) context.lower(child);
        }
        return;
      }
      throw new Error(
        `${operation.id} requires WebGPU predicate binding and indirect-dispatch loop lowering`
      );
    });
  }

  protected lower(
    graph: GPUCommandGraph<Parameters>,
    operation: GPUProgramOperation,
    state: LoweringState
  ): void {
    const id =
      'id' in operation && typeof operation.id === 'string'
        ? operation.id
        : operation.constructor?.name ?? 'legacy-contributor';
    state.path.push(id);
    try {
      if (operation instanceof GPUCompositeOperation && operation.type === 'composite') {
        state.decisions.push({
          operationId: operation.id,
          operationType: operation.type,
          lowering: 'flatten',
          reason: 'WebGPU command graphs have no executable child-graph primitive'
        });
        for (const child of operation.operations) this.lower(graph, child, state);
        return;
      }
      if (isGPUOperation(operation)) {
        const lowerer = this.lowerings.get(operation.type);
        if (lowerer) {
          lowerer(operation, {
            graph,
            capabilities: this.capabilities,
            lower: child => this.lower(graph, child, state),
            recordDecision: decision => state.decisions.push(decision)
          });
          return;
        }
      }
      if (isGPUCommandGraphContributor(operation)) {
        state.decisions.push({
          operationId: id,
          operationType: 'legacy-contributor',
          lowering: 'legacy-addToGraph',
          reason: 'migration adapter for existing WebGPU algorithm'
        });
        operation.addToGraph(graph);
        return;
      }
      throw new Error(
        `GPUProgram operation "${id}" (${isGPUOperation(operation) ? operation.type : 'unknown'}) has no WebGPU lowering`
      );
    } finally {
      state.path.pop();
    }
  }
}

type LoweringState = {
  path: string[];
  nodes: GPUProgramLoweredNode[];
  decisions: GPUOperationLoweringDecision[];
};

function instrumentGraph<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  state: LoweringState
): () => void {
  const target = graph as any;
  const originals: Record<string, Function> = {};
  for (const [method, nodeType] of [
    ['addComputePass', 'compute'],
    ['addRenderPass', 'render'],
    ['addCopyPass', 'copy']
  ] as const) {
    const original = target[method];
    if (typeof original !== 'function') continue;
    originals[method] = original;
    target[method] = function (node: {id: string}, ...rest: unknown[]) {
      if (state.path.length) {
        state.nodes.push({nodeId: node.id, nodeType, operationPath: [...state.path]});
      }
      return original.call(graph, node, ...rest);
    };
  }
  return () => {
    for (const [method, original] of Object.entries(originals)) target[method] = original;
  };
}
