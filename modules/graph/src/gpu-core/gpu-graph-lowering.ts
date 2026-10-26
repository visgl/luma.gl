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
    scalar: GPUGraphScalar<T>
  ) => GPUScalar<T>;
  resolveVector: <T extends 'float32' | 'uint32' | 'sint32'>(
    vector: GPUGraphVector<T>
  ) => GraphVectorView<T>;
  resolveTexture: <Format extends TextureFormat>(
    texture: GPUGraphTexture<Format>
  ) => GraphTextureHandle<Format>;
  resolveTextureView: <Format extends TextureFormat>(
    texture: GPUGraphTexture<Format> | GPUGraphTextureView<Format>
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
  get(operationType: string): GPUOperationLowerer<Parameters> | undefined {
    return this.lowerers.get(operationType);
  }
}
