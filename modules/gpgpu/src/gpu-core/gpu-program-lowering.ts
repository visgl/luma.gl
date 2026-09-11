// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GPUCommandGraph} from './gpu-command-graph';
import type {GPUOperation, GPUProgramOperation} from './gpu-operation';

/** Backend capabilities visible to semantic lowering without exposing backend implementation APIs. */
export type GPUProgramBackendCapabilities = {
  backend: string;
  /** Backend can realize device-side conditional execution without CPU readback. */
  gpuConditionals: boolean;
  /** Backend can realize a semantic loop without structurally duplicating the body. */
  nativeLoops: boolean;
  /** Backend supports nested executable graphs. */
  childGraphs: boolean;
};

/** Result recorded for one semantic operation lowering decision. */
export type GPUOperationLoweringDecision = {
  operationId: string;
  operationType: string;
  lowering: string;
  reason: string;
};

/** Context supplied to a backend-specific operation lowerer. */
export type GPUOperationLoweringContext<Parameters = void> = {
  graph: GPUCommandGraph<Parameters>;
  capabilities: GPUProgramBackendCapabilities;
  lower: (operation: GPUProgramOperation) => void;
  recordDecision: (decision: GPUOperationLoweringDecision) => void;
};

/** Backend-owned realization of one semantic operation type. */
export type GPUOperationLowerer<Parameters = void, Operation extends GPUOperation = GPUOperation> = (
  operation: Operation,
  context: GPUOperationLoweringContext<Parameters>
) => void;

/** Registry keeping semantic operation classes independent of concrete execution backends. */
export class GPUOperationLoweringRegistry<Parameters = void> {
  private readonly lowerers = new Map<string, GPUOperationLowerer<Parameters>>();

  register<Operation extends GPUOperation>(
    operationType: string,
    lowerer: GPUOperationLowerer<Parameters, Operation>
  ): this {
    if (!operationType) throw new Error('GPU operation lowering type is required');
    if (this.lowerers.has(operationType)) {
      throw new Error(`GPU operation lowering for "${operationType}" is already registered`);
    }
    this.lowerers.set(operationType, lowerer as GPUOperationLowerer<Parameters>);
    return this;
  }

  get(operationType: string): GPUOperationLowerer<Parameters> | undefined {
    return this.lowerers.get(operationType);
  }
}
