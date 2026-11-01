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
/** Immutable compilation input; compose sets with ordinary array spread. */
export type GPUOperationLowering<
  Parameters = void,
  Operation extends GPUOperation = GPUOperation
> = Readonly<{
  type: string;
  lower(operation: Operation, context: GPUOperationLoweringContext<Parameters>): void;
}>;
