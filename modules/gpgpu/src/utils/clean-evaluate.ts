// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Buffer, Device} from '@luma.gl/core';
import {GPUTableEvaluator} from '../operation/gpu-table';

type EvaluatorResult = GPUTableEvaluator | GPUTableEvaluator[] | Record<string, unknown>;

export async function cleanEvaluate<ResultT extends EvaluatorResult>(
  device: Device,
  result: ResultT
): Promise<void> {
  const rootEvaluators = collectReferencedEvaluators(result);

  await Promise.all(rootEvaluators.map(evaluator => evaluator.evaluate(device)));

  const preservedBuffers = new Set<Buffer>(rootEvaluators.map(evaluator => evaluator.buffer));

  const dependencyEvaluators = new Set<GPUTableEvaluator>();
  for (const evaluator of rootEvaluators) {
    collectDependencies(evaluator, dependencyEvaluators);
  }

  for (const evaluator of dependencyEvaluators) {
    // Multiple evaluators could share the same underlying buffer
    if (!preservedBuffers.has(evaluator.buffer)) {
      evaluator.destroy();
    }
  }
}

function collectReferencedEvaluators(value: EvaluatorResult): GPUTableEvaluator[] {
  const evaluators = new Set<GPUTableEvaluator>();
  let valuesArray: unknown[];
  if (value instanceof GPUTableEvaluator) {
    valuesArray = [value];
  }
  if (Array.isArray(value)) {
    valuesArray = value;
  } else {
    valuesArray = Object.values(value);
  }
  for (const item of valuesArray) {
    if (item instanceof GPUTableEvaluator) {
      evaluators.add(item);
    }
  }
  return Array.from(evaluators);
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
