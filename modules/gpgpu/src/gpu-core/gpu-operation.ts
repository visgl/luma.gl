// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GPUCommandGraphContributor} from './gpu-command-graph';
import type {GPUCommandNode} from './gpu-command-node';

export type GPUOperationResource = {
  name: string;
  kind?: string;
  format?: string;
  shape?: readonly number[];
};
export type GPUOperationWorkload = Readonly<Record<string, number | string | boolean>>;
export type GPUOperationConstraints = Readonly<Record<string, number | string | boolean>>;
export type GPUOperationMetadata = {
  inputs?: readonly GPUOperationResource[];
  outputs?: readonly GPUOperationResource[];
  workload?: GPUOperationWorkload;
  constraints?: GPUOperationConstraints;
};

/** Semantic unit in a GPUProgram. */
export interface GPUOperation {
  readonly id: string;
  readonly type: string;
  readonly metadata?: GPUOperationMetadata;
}

/**
 * Reusable graph-native GPU algorithm that can be added directly to a program.
 *
 * A primitive already owns graph-level resource views and knows how to expand itself into command
 * graph work. Unlike a concrete GPUCommandNode it may expand into many nodes; unlike a semantic
 * GPUOperation it does not require a backend-specific semantic transform before doing so.
 */
export type GPUProgramPrimitive = GPUCommandGraphContributor;

/** One item accepted by GPUProgram. */
export type GPUProgramOperation = GPUOperation | GPUProgramPrimitive | GPUCommandNode<any>;
export type GPUOperationLike = GPUProgramOperation | readonly GPUOperationLike[];

/** Semantic hierarchy. Grouping never implies synchronization or a command-graph child graph. */
export class GPUCompositeOperation implements GPUOperation {
  readonly id: string;
  readonly type: string = 'composite';
  readonly operations: readonly GPUProgramOperation[];
  readonly metadata?: GPUOperationMetadata;

  constructor(
    props:
      | readonly GPUProgramOperation[]
      | {
          id?: string;
          operations: readonly GPUProgramOperation[];
          metadata?: GPUOperationMetadata;
        }
  ) {
    const normalized = Array.isArray(props) ? {operations: props} : props;
    this.id = normalized.id ?? 'gpu-composite-operation';
    this.operations = Object.freeze([...normalized.operations]);
    this.metadata = normalized.metadata;
  }
}

export type GPUOperationTree = {
  id: string;
  type: string;
  metadata?: GPUOperationMetadata;
  children?: readonly GPUOperationTree[];
};

export function isGPUCommandNode(operation: GPUProgramOperation): operation is GPUCommandNode<any> {
  const candidate = operation as Partial<GPUCommandNode<any>>;
  return candidate.type === 'compute' || candidate.type === 'render' || candidate.type === 'copy';
}

export function isGPUProgramPrimitive(
  operation: GPUProgramOperation
): operation is GPUProgramPrimitive {
  return !isGPUCommandNode(operation) && typeof (operation as GPUProgramPrimitive).addToGraph === 'function';
}

export function isGPUOperation(operation: GPUProgramOperation): operation is GPUOperation {
  if (isGPUCommandNode(operation) || isGPUProgramPrimitive(operation)) return false;
  const candidate = operation as Partial<GPUOperation>;
  return typeof candidate.id === 'string' && typeof candidate.type === 'string';
}

export function getGPUOperationTree(operation: GPUProgramOperation): GPUOperationTree {
  if (operation instanceof GPUCompositeOperation) {
    return Object.freeze({
      id: operation.id,
      type: operation.type,
      ...(operation.metadata ? {metadata: operation.metadata} : {}),
      children: Object.freeze(operation.operations.map(getGPUOperationTree))
    });
  }
  if (isGPUCommandNode(operation)) {
    return Object.freeze({id: operation.id, type: `command:${operation.type}`});
  }
  if (isGPUProgramPrimitive(operation)) {
    return Object.freeze({
      id: 'id' in operation && typeof operation.id === 'string' ? operation.id : operation.constructor?.name ?? 'gpu-primitive',
      type: 'primitive'
    });
  }
  return Object.freeze({
    id: operation.id,
    type: operation.type,
    ...(operation.metadata ? {metadata: operation.metadata} : {})
  });
}

/** @deprecated Prefer isGPUProgramPrimitive. */
export const isGPUCommandGraphContributor = isGPUProgramPrimitive;
