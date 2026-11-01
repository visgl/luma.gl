// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {TextureFormat} from '@luma.gl/core';
import type {GraphTextureHandle, GraphTextureView} from './gpu-command-graph';

import type {GPUCommandGraph, GraphVectorView} from './gpu-command-graph';
import type {GPUScalar} from './gpu-scalar';
import type {
  GPUGraphScalar,
  GPUGraphVector,
  GPUGraphVectorFormat,
  GPUGraphTexture,
  GPUGraphTextureView
} from './gpu-graph-value';
import type {GPUOperationPredicate} from './gpu-control-flow-operation';
import type {GPUOperation, GPUGraphOperation} from './gpu-operation';
export type GPUGraphBackendCapabilities = {
  backend: string;
  gpuConditionals: boolean;
  nativeLoops: boolean;
  childGraphs: boolean;
};
export type GPUOperationLoweringDecision = {
  operationId: string;
  operationType: string;
  lowering: string;
  reason: string;
};
export type GPUOperationLoweringContext<Parameters = void> = {
  graph: GPUCommandGraph<Parameters>;
  capabilities: GPUGraphBackendCapabilities;
  lower: (operation: GPUGraphOperation) => void;
  lowerConditional: (predicate: GPUOperationPredicate, operation: GPUGraphOperation) => void;
  resolveScalar: <T extends 'float32' | 'uint32' | 'sint32'>(
    scalar: GPUGraphScalar<T> | string
  ) => GPUScalar<T>;
  resolveVector: <T extends GPUGraphVectorFormat>(
    vector: GPUGraphVector<T> | string
  ) => GraphVectorView<T>;
  resolveTexture: <Format extends TextureFormat>(
    texture: GPUGraphTexture<Format> | string
  ) => GraphTextureHandle<Format>;
  resolveTextureView: <Format extends TextureFormat>(
    texture: GPUGraphTexture<Format> | GPUGraphTextureView<Format> | string
  ) => GraphTextureView<Format>;
  recordDecision: (decision: GPUOperationLoweringDecision) => void;
};
export type GPUOperationLowerer<
  Parameters = void,
  Operation extends GPUOperation = GPUOperation
> = (operation: Operation, context: GPUOperationLoweringContext<Parameters>) => void;
export class GPUOperationLoweringRegistry<Parameters = void> {
  private readonly lowerers = new Map<string, GPUOperationLowerer<Parameters>>();
  register<Operation extends GPUOperation>(
    operationType: string,
    lowerer: GPUOperationLowerer<Parameters, Operation>
  ): this {
    if (!operationType) throw new Error('GPU operation lowering type is required');
    if (this.lowerers.has(operationType))
      throw new Error(`GPU operation lowering for "${operationType}" is already registered`);
    this.lowerers.set(operationType, lowerer as GPUOperationLowerer<Parameters>);
    return this;
  }
  /** Adds a registry without replacing existing lowerings or retaining mutable shared state. */
  registerAll(registry: GPUOperationLoweringRegistry<Parameters>): this {
    for (const name of registry.lowerers.keys())
      if (this.lowerers.has(name))
        throw new Error(`GPU operation lowering for "${name}" is already registered`);
    for (const [name, lowerer] of registry.lowerers) this.lowerers.set(name, lowerer);
    return this;
  }
  /** Copies registrations for an independent compiled program. @internal */
  clone(): GPUOperationLoweringRegistry<Parameters> {
    const registry = new GPUOperationLoweringRegistry<Parameters>();
    for (const [name, lowerer] of this.lowerers) registry.register(name, lowerer);
    return registry;
  }
  get(operationType: string): GPUOperationLowerer<Parameters> | undefined {
    return this.lowerers.get(operationType);
  }
}
