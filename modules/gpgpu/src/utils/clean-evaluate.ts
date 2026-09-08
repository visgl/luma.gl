// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Buffer, Device} from '@luma.gl/core';
import {DynamicBuffer} from '@luma.gl/engine';
import {GPUDataEvaluator} from '../operation/gpu-data-evaluator';
import {GPUVectorEvaluator} from '../operation/gpu-vector-evaluator';

type Evaluator = GPUDataEvaluator | GPUVectorEvaluator;
type EvaluatorResult = Evaluator | unknown[] | Record<string, unknown>;

/**
 * Materializes result evaluators and destroys unreferenced intermediate GPUData dependencies.
 *
 * @param device - Device used to materialize every root evaluator.
 * @param result - Root evaluator shape that should remain alive after cleanup.
 * @returns The original result value after its root evaluators have been materialized.
 *
 * @remarks
 * `cleanEvaluate()` recursively inspects arrays and plain objects in `result`. `GPUVectorEvaluator`
 * roots are preserved as vectors, while their intermediate `GPUDataEvaluator` dependencies are
 * cleaned up when their buffers are not shared with a root output.
 */
export async function cleanEvaluate<ResultT extends EvaluatorResult>(
  device: Device,
  result: ResultT
): Promise<ResultT> {
  const rootEvaluators = collectReferencedEvaluators(result);

  await Promise.all(rootEvaluators.map(evaluator => evaluator.evaluate(device)));

  cleanupEvaluators(rootEvaluators);
  return result;
}

/** Synchronous counterpart of {@link cleanEvaluate}. */
export function cleanEvaluateSync<ResultT extends EvaluatorResult>(
  device: Device,
  result: ResultT
): ResultT {
  const rootEvaluators = collectReferencedEvaluators(result);

  for (const evaluator of rootEvaluators) {
    evaluator.evaluateSync(device);
  }

  cleanupEvaluators(rootEvaluators);
  return result;
}

function cleanupEvaluators(rootEvaluators: Evaluator[]): void {
  const preservedBuffers = new Set<Buffer>(rootEvaluators.flatMap(getEvaluatorBuffers));

  const dependencyEvaluators = new Set<GPUDataEvaluator>();
  for (const evaluator of rootEvaluators) {
    collectDependencies(evaluator, dependencyEvaluators);
  }

  for (const evaluator of dependencyEvaluators) {
    // Multiple evaluators could share the same underlying buffer
    if (evaluator.evaluated && !preservedBuffers.has(evaluator.buffer)) {
      evaluator.destroy();
    }
  }
}

function collectReferencedEvaluators(value: EvaluatorResult): Evaluator[] {
  const evaluators = new Set<Evaluator>();
  const visitedObjects = new Set<object>();
  collectReferencedEvaluatorsRecursive(value, evaluators, visitedObjects);
  return Array.from(evaluators);
}

function collectReferencedEvaluatorsRecursive(
  value: unknown,
  evaluators: Set<Evaluator>,
  visitedObjects: Set<object>
): void {
  if (isEvaluator(value)) {
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
  evaluator: Evaluator,
  dependencyEvaluators: Set<GPUDataEvaluator>
): void {
  if (evaluator instanceof GPUVectorEvaluator) {
    for (const gpuDataEvaluator of evaluator.gpuDataEvaluators) {
      collectDependencies(gpuDataEvaluator, dependencyEvaluators);
    }
    return;
  }

  const source = evaluator.source;
  if (!source) {
    return;
  }
  if (source instanceof GPUDataEvaluator) {
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

function getEvaluatorBuffers(evaluator: Evaluator): Buffer[] {
  if (evaluator instanceof GPUDataEvaluator) {
    return [evaluator.buffer];
  }
  return evaluator.gpuVector.data.map(data =>
    data.buffer instanceof DynamicBuffer ? data.buffer.buffer : data.buffer
  );
}

function isEvaluator(value: unknown): value is Evaluator {
  return value instanceof GPUDataEvaluator || value instanceof GPUVectorEvaluator;
}
