// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Buffer, Device} from '@luma.gl/core';
import {DynamicBuffer} from '@luma.gl/engine';
import {GPUDataEvaluator} from '../operation/gpu-data-evaluator';
import {GPUVectorEvaluator} from '../operation/gpu-vector-evaluator';

type Evaluator = GPUDataEvaluator | GPUVectorEvaluator;
type EvaluatorResult = Evaluator | Evaluator[] | Record<string, unknown>;

/**
 * Materializes result evaluators and destroys unreferenced intermediate GPUData dependencies.
 *
 * @param device - Device used to materialize every root evaluator.
 * @param result - Root evaluator shape that should remain alive after cleanup.
 * @returns The original result value after its root evaluators have been materialized.
 *
 * @remarks
 * `cleanEvaluate()` only inspects evaluators directly contained in `result`. `GPUVectorEvaluator`
 * roots are preserved as vectors, while their intermediate `GPUDataEvaluator` dependencies are
 * cleaned up when their buffers are not shared with a root output.
 */
export async function cleanEvaluate<ResultT extends EvaluatorResult>(
  device: Device,
  result: ResultT
): Promise<ResultT> {
  const rootEvaluators = collectReferencedEvaluators(result);

  await Promise.all(rootEvaluators.map(evaluator => evaluator.evaluate(device)));

  const preservedBuffers = new Set<Buffer>(rootEvaluators.flatMap(getEvaluatorBuffers));

  const dependencyEvaluators = new Set<GPUDataEvaluator>();
  for (const evaluator of rootEvaluators) {
    collectDependencies(evaluator, dependencyEvaluators);
  }

  for (const evaluator of dependencyEvaluators) {
    // Multiple evaluators could share the same underlying buffer
    if (!preservedBuffers.has(evaluator.buffer)) {
      evaluator.destroy();
    }
  }
  return result;
}

function collectReferencedEvaluators(value: EvaluatorResult): Evaluator[] {
  const evaluators = new Set<Evaluator>();
  if (isEvaluator(value)) {
    return [value];
  }
  let valuesArray: unknown[];
  if (Array.isArray(value)) {
    valuesArray = value;
  } else {
    valuesArray = Object.values(value);
  }
  for (const item of valuesArray) {
    if (isEvaluator(item)) {
      evaluators.add(item);
    }
  }
  return Array.from(evaluators);
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
