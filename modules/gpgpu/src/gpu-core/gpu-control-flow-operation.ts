// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  GPUCompositeOperation,
  type GPUOperation,
  type GPUProgramOperation,
  type GPUOperationMetadata
} from './gpu-operation';

/** Semantic predicate. Its concrete storage and execution mechanism belong to a backend compiler. */
export type GPUOperationPredicate = {
  id: string;
  /** Human-readable expression for diagnostics, e.g. `residualSquared > toleranceSquared`. */
  expression?: string;
  /** Where the predicate value is expected to be produced conceptually. */
  source: 'cpu' | 'gpu';
};

/** Optional semantic preference; the backend compiler remains responsible for legal realization. */
export type GPUControlFlowLowering = 'auto' | 'unroll' | 'dynamic-gpu';

/** Executes a semantic body only when a predicate is true. */
export class GPUConditionalOperation extends GPUCompositeOperation {
  override readonly type: string = 'conditional';
  readonly predicate: GPUOperationPredicate;
  readonly lowering: GPUControlFlowLowering;

  constructor(props: {
    id?: string;
    predicate: GPUOperationPredicate;
    body: GPUProgramOperation | readonly GPUProgramOperation[];
    metadata?: GPUOperationMetadata;
    lowering?: GPUControlFlowLowering;
  }) {
    const operations = Array.isArray(props.body) ? props.body : [props.body as GPUProgramOperation];
    super({id: props.id ?? 'gpu-conditional-operation', operations, metadata: props.metadata});
    this.predicate = Object.freeze({...props.predicate});
    this.lowering = props.lowering ?? 'auto';
  }
}

/** Semantic bounded loop. Its body remains one hierarchy regardless of backend realization. */
export class GPULoopOperation extends GPUCompositeOperation {
  override readonly type: string = 'loop';
  readonly predicate?: GPUOperationPredicate;
  readonly maximumIterations: number;
  readonly minimumIterations: number;
  readonly lowering: GPUControlFlowLowering;

  constructor(props: {
    id?: string;
    body: GPUProgramOperation | readonly GPUProgramOperation[];
    predicate?: GPUOperationPredicate;
    maximumIterations: number;
    minimumIterations?: number;
    metadata?: GPUOperationMetadata;
    lowering?: GPUControlFlowLowering;
  }) {
    const operations = Array.isArray(props.body) ? props.body : [props.body as GPUProgramOperation];
    super({id: props.id ?? 'gpu-loop-operation', operations, metadata: props.metadata});
    if (!Number.isSafeInteger(props.maximumIterations) || props.maximumIterations < 1) {
      throw new Error(`${this.id} maximumIterations must be a positive safe integer`);
    }
    const minimumIterations = props.minimumIterations ?? 0;
    if (
      !Number.isSafeInteger(minimumIterations) ||
      minimumIterations < 0 ||
      minimumIterations > props.maximumIterations
    ) {
      throw new Error(`${this.id} minimumIterations must be between zero and maximumIterations`);
    }
    this.predicate = props.predicate ? Object.freeze({...props.predicate}) : undefined;
    this.maximumIterations = props.maximumIterations;
    this.minimumIterations = minimumIterations;
    this.lowering = props.lowering ?? 'auto';
  }
}

export function isGPUControlFlowOperation(
  operation: GPUOperation
): operation is GPUConditionalOperation | GPULoopOperation {
  return operation.type === 'conditional' || operation.type === 'loop';
}
