// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {assert, vertexFormatDecoder} from '@luma.gl/core';
import {GPUDataEvaluator} from './gpu-data-evaluator';

/** One evaluator output in a snapshot of the lazy dependency graph. */
export type GPUEvaluatorInspectionNode = Readonly<{
  /** Snapshot-local identity; shared dependencies appear once. */
  id: string;
  label?: string;
  kind: 'source' | 'alias' | 'operation';
  operation?: string;
  /** Actual execution dependencies, including fused arithmetic inputs. */
  dependencies: readonly string[];
  type: GPUDataEvaluator['type'];
  size: number;
  format: GPUDataEvaluator['format'];
  length: number;
  normalized: boolean;
  isConstant: boolean;
  offset: number;
  stride: number;
  byteLength: number;
  evaluated: boolean;
}>;

/** Immutable metadata only: no device, buffers, CPU payloads, or execution. */
export type GPUEvaluatorInspection = Readonly<{
  /** Ordered output references, one per chunk for vector evaluators. */
  outputs: readonly string[];
  nodes: readonly GPUEvaluatorInspectionNode[];
}>;

/**
 * Builds a snapshot without evaluating, reading back, or resolving backend handlers.
 * Optional getId integrates the snapshot with a caller's namespace; it must return unique IDs
 * for distinct evaluators. Without it, IDs are local to this snapshot.
 */
export function inspectEvaluators(
  evaluators: readonly GPUDataEvaluator[],
  getId?: (evaluator: GPUDataEvaluator, index: number) => string
): GPUEvaluatorInspection {
  const identities = new Map<GPUDataEvaluator, string>();
  const nodes: GPUEvaluatorInspectionNode[] = [];
  const visiting = new Set<GPUDataEvaluator>();
  function visit(evaluator: GPUDataEvaluator): string {
    // Mutable custom operations must not introduce dependency cycles.
    assert(!visiting.has(evaluator));
    const existing = identities.get(evaluator);
    if (existing) return existing;
    const id = getId?.(evaluator, identities.size) ?? `value-${identities.size}`;
    visiting.add(evaluator);
    identities.set(evaluator, id);
    const source = evaluator.source;
    const alias = source instanceof GPUDataEvaluator;
    const dependencies = alias ? [source] : (source?.dependencies ?? []);
    const dependencyIds = dependencies.map(visit);
    nodes.push(
      Object.freeze({
        id,
        label: evaluator.id,
        kind: alias ? 'alias' : source ? 'operation' : 'source',
        operation: source && !alias ? source.name : undefined,
        dependencies: Object.freeze(dependencyIds),
        type: evaluator.type,
        size: evaluator.size,
        format: getEvaluatorFormat(evaluator),
        length: evaluator.length,
        normalized: evaluator.normalized,
        isConstant: evaluator.isConstant,
        offset: evaluator.offset,
        stride: evaluator.stride,
        byteLength: evaluator.byteLength,
        evaluated: evaluator.evaluated
      })
    );
    visiting.delete(evaluator);
    return id;
  }
  const outputs = evaluators.map(visit);
  return Object.freeze({outputs: Object.freeze(outputs), nodes: Object.freeze(nodes)});
}

function getEvaluatorFormat(evaluator: GPUDataEvaluator): GPUDataEvaluator['format'] {
  if (evaluator.format) return evaluator.format;
  const components = evaluator.size;
  if (components !== 1 && components !== 2 && components !== 3 && components !== 4)
    return undefined;
  if (
    components === 3 &&
    !evaluator.normalized &&
    (evaluator.type === 'uint8' || evaluator.type === 'sint8')
  ) {
    return evaluator.type === 'uint8' ? 'uint8x3-webgl' : 'sint8x3-webgl';
  }
  try {
    return vertexFormatDecoder.makeVertexFormat(evaluator.type, components, evaluator.normalized);
  } catch {
    // Interleaved and other unsupported layouts have no single canonical format.
    return undefined;
  }
}
