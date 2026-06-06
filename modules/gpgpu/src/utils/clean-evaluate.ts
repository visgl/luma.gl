// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Buffer, Device} from '@luma.gl/core';
import {GPUTableEvaluator} from '../operation/gpu-table-evaluator';

type EvaluatorResult = GPUTableEvaluator | unknown[] | Record<string, unknown>;

export async function cleanEvaluate<ResultT extends EvaluatorResult>(
  device: Device,
  result: ResultT
): Promise<ResultT> {
  const rootEvaluators = collectReferencedEvaluators(result);

  await Promise.all(rootEvaluators.map(evaluator => evaluator.evaluate(device)));

  const preservedBuffers = new Set<Buffer>(rootEvaluators.map(evaluator => evaluator.buffer));

  const dependencyEvaluators = new Set<GPUTableEvaluator>();
  for (const evaluator of rootEvaluators) {
    collectDependencies(evaluator, dependencyEvaluators);
  }

  for (const evaluator of dependencyEvaluators) {
    // Multiple evaluators could share the same underlying buffer
    if (evaluator.evaluated && !preservedBuffers.has(evaluator.buffer)) {
      evaluator.destroy();
    }
  }
  return result;
}

function collectReferencedEvaluators(value: EvaluatorResult): GPUTableEvaluator[] {
  const evaluators = new Set<GPUTableEvaluator>();
  const visitedObjects = new Set<object>();
  collectReferencedEvaluatorsRecursive(value, evaluators, visitedObjects);
  return Array.from(evaluators);
}

function collectReferencedEvaluatorsRecursive(
  value: unknown,
  evaluators: Set<GPUTableEvaluator>,
  visitedObjects: Set<object>
): void {
  if (value instanceof GPUTableEvaluator) {
    evaluators.add(value);
    return;
  }

  if (!value || typeof value !== 'object' || visitedObjects.has(value)) {
    return;
  }
  visitedObjects.add(value);

  if (Array.isArray(value)) {
    for (const item of value) {
      collectReferencedEvaluatorsRecursive(item, evaluators, visitedObjects);
    }
    return;
  }

  if (!isPlainObject(value)) {
    return;
  }

  for (const item of Object.values(value)) {
    collectReferencedEvaluatorsRecursive(item, evaluators, visitedObjects);
  }
}

function isPlainObject(value: object): value is Record<string, unknown> {
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function collectDependencies(
  evaluator: GPUTableEvaluator,
  dependencyEvaluators: Set<GPUTableEvaluator>
): void {
  const source = evaluator.source;
  if (!source) {
    return;
  }
  if (source instanceof GPUTableEvaluator) {
    if (!dependencyEvaluators.has(source)) {
      dependencyEvaluators.add(source);
      collectDependencies(source, dependencyEvaluators);
    }
    return;
  }
  for (const dependency of source.dependencies) {
    if (!dependencyEvaluators.has(dependency)) {
      dependencyEvaluators.add(dependency);
      collectDependencies(dependency, dependencyEvaluators);
    }
  }
}
