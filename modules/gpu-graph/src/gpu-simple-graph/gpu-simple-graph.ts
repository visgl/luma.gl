// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {assert, type Device} from '@luma.gl/core';
import {GPUDataEvaluator, GPUVectorEvaluator} from '@luma.gl/gpgpu';
import type {GPUVector, GPUVectorFormat} from '@luma.gl/gpgpu/gpu-data';

/** Lazy, evaluator-backed value accepted by the simple graph prototype. */
export type GPUSimpleGraphEvaluator = GPUDataEvaluator | GPUVectorEvaluator;

/** Inspection record for one evaluator in dependency order. */
export type GPUSimpleGraphNode = {
  readonly id: string;
  readonly operation: string;
  readonly dependencies: readonly string[];
  readonly rowCount: number;
  readonly format?: GPUVectorFormat;
};

export type GPUSimpleGraphCompileOptions = {
  /** Named values to materialize. Defaults to the last registered value. */
  outputs?: readonly string[];
};

/**
 * Prototype graph-shaped interface to the existing lazy GPGPU evaluator.
 *
 * Operations, backend selection, fusion, caching, and storage ownership remain with
 * the evaluators. The graph borrows every registered value and never destroys it.
 */
export class GPUSimpleGraph {
  readonly device: Device;
  readonly id: string;
  private readonly evaluators = new Map<string, GPUSimpleGraphEvaluator>();

  constructor(device: Device, props: {id?: string} = {}) {
    this.device = device;
    this.id = props.id ?? 'simple-graph';
  }

  /** Registers a lazy value and returns it unchanged for use by later operations. */
  add<Evaluator extends GPUSimpleGraphEvaluator>(
    identifier: string,
    evaluator: Evaluator
  ): Evaluator {
    // Each registered value needs a unique name within this graph.
    assert(!this.evaluators.has(identifier));
    this.evaluators.set(identifier, evaluator);
    return evaluator;
  }

  /** Captures selected roots and an inspectable dependency plan without executing work. */
  compile(options: GPUSimpleGraphCompileOptions = {}): CompiledGPUSimpleGraph {
    const lastIdentifier = Array.from(this.evaluators.keys()).at(-1);
    const outputNames = options.outputs ?? (lastIdentifier === undefined ? [] : [lastIdentifier]);
    const roots = outputNames.map(identifier => {
      const evaluator = this.evaluators.get(identifier);
      // Selected outputs must be registered before compiling the graph.
      assert(evaluator);
      return {identifier, evaluator};
    });
    const identifiers = new Map<GPUSimpleGraphEvaluator, string>();
    for (const [identifier, evaluator] of this.evaluators) {
      if (!identifiers.has(evaluator)) identifiers.set(evaluator, identifier);
    }
    const usedIdentifiers = new Set(this.evaluators.keys());
    const visiting = new Set<GPUSimpleGraphEvaluator>();
    const visited = new Set<GPUSimpleGraphEvaluator>();
    const nodes: GPUSimpleGraphNode[] = [];
    let nextIdentifier = 0;

    const getIdentifier = (evaluator: GPUSimpleGraphEvaluator): string => {
      let identifier = identifiers.get(evaluator);
      if (identifier === undefined) {
        do {
          identifier = `${this.id}-node-${nextIdentifier++}`;
        } while (usedIdentifiers.has(identifier));
        identifiers.set(evaluator, identifier);
        usedIdentifiers.add(identifier);
      }
      return identifier;
    };

    const visit = (evaluator: GPUSimpleGraphEvaluator): void => {
      if (visited.has(evaluator)) return;
      // Mutable custom operations must not introduce dependency cycles.
      assert(!visiting.has(evaluator));
      visiting.add(evaluator);
      const dependencies = getDependencies(evaluator);
      for (const dependency of dependencies) visit(dependency);
      nodes.push({
        id: getIdentifier(evaluator),
        operation: getOperationName(evaluator),
        dependencies: dependencies.map(getIdentifier),
        rowCount: evaluator.length,
        format: evaluator.format
      });
      visiting.delete(evaluator);
      visited.add(evaluator);
    };
    for (const {evaluator} of roots) visit(evaluator);
    return new CompiledGPUSimpleGraph(this.device, nodes, roots);
  }

  /** Forgets registration metadata without releasing caller-owned evaluators or buffers. */
  clear(): void {
    this.evaluators.clear();
  }
}

/** Snapshot of named evaluator outputs and their reachable dependency plan. */
export class CompiledGPUSimpleGraph {
  readonly nodes: readonly GPUSimpleGraphNode[];
  readonly outputs: Readonly<Record<string, GPUSimpleGraphEvaluator>>;
  private readonly device: Device;
  private running = false;

  constructor(
    device: Device,
    nodes: readonly GPUSimpleGraphNode[],
    roots: readonly {identifier: string; evaluator: GPUSimpleGraphEvaluator}[]
  ) {
    this.device = device;
    this.nodes = nodes;
    this.outputs = Object.fromEntries(
      roots.map(({identifier, evaluator}) => [identifier, evaluator])
    );
  }

  /**
   * Materializes named outputs through the existing CPU, WebGL, or WebGPU handlers.
   * Returned vectors remain owned by their evaluators. No CPU readback is performed.
   */
  async run(): Promise<Record<string, GPUVector>> {
    // The underlying evaluators do not support concurrent evaluation of shared outputs.
    assert(!this.running);
    this.running = true;
    try {
      const results: [string, GPUVector][] = [];
      for (const [identifier, evaluator] of Object.entries(this.outputs)) {
        results.push([identifier, await evaluator.evaluate(this.device)]);
      }
      return Object.fromEntries(results);
    } finally {
      this.running = false;
    }
  }
}

function getDependencies(evaluator: GPUSimpleGraphEvaluator): readonly GPUSimpleGraphEvaluator[] {
  if (evaluator instanceof GPUVectorEvaluator) return evaluator.gpuDataEvaluators;
  if (evaluator.source instanceof GPUDataEvaluator) return [evaluator.source];
  return evaluator.source?.dependencies ?? [];
}

function getOperationName(evaluator: GPUSimpleGraphEvaluator): string {
  if (evaluator instanceof GPUVectorEvaluator) return 'collect-chunks';
  if (evaluator.source instanceof GPUDataEvaluator) return 'alias';
  return evaluator.source?.name ?? (evaluator.isConstant ? 'constant' : 'input');
}
