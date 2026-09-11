// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  GPUCompositeOperation,
  getGPUOperationTree,
  type GPUOperationLike,
  type GPUOperationTree,
  type GPUProgramOperation
} from './gpu-operation';

/**
 * Backend-independent semantic GPU program.
 *
 * GPUProgram owns operation intent and hierarchy only. It deliberately has no Device, Buffer,
 * dispatch, binding, command encoder, or command-graph API. A GPUProgramCompiler lowers the same
 * program into a backend execution graph.
 */
export class GPUProgram {
  readonly id: string;
  private readonly programOperations: GPUProgramOperation[] = [];

  constructor(props: {id?: string} = {}) {
    this.id = props.id ?? 'gpu-program';
  }

  /** Adds semantic operations. Arrays are construction sugar and flatten at the program root. */
  add(operation: GPUOperationLike): this {
    this.assertOperationLike(operation);
    this.addOperationLike(operation);
    return this;
  }

  /** Root semantic operations in insertion order. */
  get operations(): readonly GPUProgramOperation[] {
    return Object.freeze([...this.programOperations]);
  }

  /** Immutable inspector-friendly semantic hierarchy. */
  get operationTree(): readonly GPUOperationTree[] {
    return Object.freeze(this.programOperations.map(getGPUOperationTree));
  }

  private addOperationLike(operation: GPUOperationLike): void {
    if (Array.isArray(operation)) {
      for (const child of operation) this.addOperationLike(child);
      return;
    }
    this.programOperations.push(operation as GPUProgramOperation);
  }

  private assertOperationLike(operation: GPUOperationLike): void {
    if (Array.isArray(operation)) {
      for (const child of operation) this.assertOperationLike(child);
      return;
    }
    if (!operation || typeof operation !== 'object') {
      throw new Error(`${this.id} accepts GPU operations only`);
    }
  }
}

/** Convenience helper for explicit semantic grouping. */
export function composite(
  operations: readonly GPUProgramOperation[],
  props: {id?: string} = {}
): GPUCompositeOperation {
  return new GPUCompositeOperation({id: props.id, operations});
}
