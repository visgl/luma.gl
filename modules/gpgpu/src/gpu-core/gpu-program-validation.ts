// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GPUProgram} from './gpu-program';
import {GPUCompositeOperation, isGPUOperation, type GPUProgramOperation} from './gpu-operation';
import {GPUConditionalOperation, GPULoopOperation} from './gpu-control-flow-operation';
import type {GPUProgramBindings} from './gpu-program-compiler';

export type GPUProgramValidationIssue = {
  level: 'error' | 'warning';
  code: string;
  message: string;
  operationId?: string;
  valueId?: string;
};

export type GPUProgramValidationReport = {
  valid: boolean;
  issues: readonly GPUProgramValidationIssue[];
};

/** Device-independent semantic validation performed before backend lowering. */
export function validateGPUProgram(program: GPUProgram, bindings: GPUProgramBindings = {}): GPUProgramValidationReport {
  const issues: GPUProgramValidationIssue[] = [];
  const scalarIds = new Set(program.scalars.map(value => value.id));
  const vectorIds = new Set(program.vectors.map(value => value.id));

  for (const vector of program.vectors) {
    if (vector.external && !bindings.vectors?.[vector.id]) {
      issues.push({level: 'error', code: 'missing-external-vector', valueId: vector.id, message: `External vector "${vector.id}" has no backend binding`});
    }
  }

  const visit = (operation: GPUProgramOperation): void => {
    const operationId = 'id' in operation && typeof operation.id === 'string' ? operation.id : undefined;
    if (isGPUOperation(operation)) {
      for (const resource of operation.metadata?.inputs ?? []) {
        if (resource.kind === 'scalar' && !scalarIds.has(resource.name)) {
          issues.push({level: 'warning', code: 'unresolved-scalar-metadata', operationId, valueId: resource.name, message: `Operation metadata references scalar "${resource.name}" that is not declared by the program`});
        }
      }
    }
    if (operation instanceof GPUConditionalOperation) {
      if (operation.predicate.source === 'gpu' && !scalarIds.has(operation.predicate.value.id)) {
        issues.push({level: 'error', code: 'missing-predicate-scalar', operationId, valueId: operation.predicate.value.id, message: `GPU predicate "${operation.predicate.id}" references undeclared scalar "${operation.predicate.value.id}"`});
      }
    }
    if (operation instanceof GPULoopOperation) {
      if (operation.maximumIterations < operation.minimumIterations) {
        issues.push({level: 'error', code: 'invalid-loop-bounds', operationId, message: `Loop minimumIterations exceeds maximumIterations`});
      }
    }
    if (operation instanceof GPUCompositeOperation) {
      for (const child of operation.operations) visit(child);
    }
  };

  for (const operation of program.operations) visit(operation);
  return Object.freeze({valid: !issues.some(issue => issue.level === 'error'), issues: Object.freeze(issues.map(issue => Object.freeze({...issue}))) });
}
