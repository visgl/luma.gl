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
import {GPUProgramScalar, type GPUProgramScalarFormat} from './gpu-program-value';

/** Backend-independent semantic GPU program. */
export class GPUProgram {
  readonly id: string;
  private readonly programOperations: GPUProgramOperation[] = [];
  private readonly programScalars = new Map<string, GPUProgramScalar>();

  constructor(props: {id?: string} = {}) {
    this.id = props.id ?? 'gpu-program';
  }

  add(operation: GPUOperationLike): this {
    this.assertOperationLike(operation);
    this.addOperationLike(operation);
    return this;
  }

  /** Declares backend-independent scalar state used by predicates and scalar operations. */
  scalar<T extends GPUProgramScalarFormat>(id: string, format: T): GPUProgramScalar<T> {
    if (this.programScalars.has(id)) throw new Error(`${this.id} scalar "${id}" already exists`);
    const scalar = new GPUProgramScalar(id, format);
    this.programScalars.set(id, scalar);
    return scalar;
  }

  get scalars(): readonly GPUProgramScalar[] {
    return Object.freeze([...this.programScalars.values()]);
  }

  get operations(): readonly GPUProgramOperation[] {
    return Object.freeze([...this.programOperations]);
  }

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

export function composite(
  operations: readonly GPUProgramOperation[],
  props: {id?: string} = {}
): GPUCompositeOperation {
  return new GPUCompositeOperation({id: props.id, operations});
}
