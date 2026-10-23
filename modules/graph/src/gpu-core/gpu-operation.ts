// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GPUCommandNode, GPUNode} from './gpu-command-node';
import type {GPUCommandGraph} from './gpu-command-graph';

export interface GPUProgramPrimitive {
  getCommandNodes<Parameters>(
    graph: GPUCommandGraph<Parameters>
  ): readonly GPUCommandNode<Parameters>[];
}

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

/**
 * Semantic unit in a GPUProgram.
 *
 * Operations describe intent and contain no execution-graph mutation API. Backends lower them
 * through GPUProgramCompiler. Concrete primitives construct execution nodes explicitly.
 */
export interface GPUOperation {
  readonly id: string;
  readonly type: string;
  readonly metadata?: GPUOperationMetadata;
}

/** Semantic operations and concrete execution primitives accepted by GPUProgram. */
export type GPUProgramOperation =
  | GPUOperation
  | GPUProgramPrimitive
  | {getNodes<Parameters>(): readonly GPUNode<Parameters>[]};
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
    const normalized: {
      id?: string;
      operations: readonly GPUProgramOperation[];
      metadata?: GPUOperationMetadata;
    } = Array.isArray(props)
      ? {operations: props as readonly GPUProgramOperation[]}
      : (props as {
          id?: string;
          operations: readonly GPUProgramOperation[];
          metadata?: GPUOperationMetadata;
        });
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

export function isGPUOperation(operation: GPUProgramOperation): operation is GPUOperation {
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
  if (isGPUOperation(operation)) {
    return Object.freeze({
      id: operation.id,
      type: operation.type,
      ...(operation.metadata ? {metadata: operation.metadata} : {})
    });
  }
  return Object.freeze({
    id: operation.constructor?.name ?? 'gpu-command-node-producer',
    type: 'command-node-producer'
  });
}

/** Identifies concrete execution primitives. */
export function isGPUCommandNodeProducer(
  operation: GPUProgramOperation
): operation is GPUProgramPrimitive {
  return typeof (operation as GPUProgramPrimitive).getCommandNodes === 'function';
}
