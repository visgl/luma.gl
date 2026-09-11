// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GPUProgramCompilation} from './gpu-program-compiler';

export type GPUProgramCompilationSummary = {
  programId: string;
  semanticOperationCount: number;
  loweredNodeCount: number;
  loweringDecisionCount: number;
  scalarCount: number;
  vectorCount: number;
  externalVectorCount: number;
  cpuReadbackCount: number;
  backend: string;
  decisions: readonly string[];
};

/** Compact semantic/backend summary suitable for examples, diagnostics and future inspector UI. */
export function inspectGPUProgramCompilation(compilation: GPUProgramCompilation): GPUProgramCompilationSummary {
  const decisions = compilation.lowering.decisions.map(
    decision => `${decision.operationId}: ${decision.lowering} — ${decision.reason}`
  );
  return Object.freeze({
    programId: compilation.program.id,
    semanticOperationCount: countOperations(compilation.program.operationTree),
    loweredNodeCount: compilation.lowering.nodes.length,
    loweringDecisionCount: compilation.lowering.decisions.length,
    scalarCount: compilation.program.scalars.length,
    vectorCount: compilation.program.vectors.length,
    externalVectorCount: compilation.program.vectors.filter(vector => vector.external).length,
    cpuReadbackCount: 0,
    backend: 'webgpu',
    decisions: Object.freeze(decisions)
  });
}

function countOperations(trees: readonly {children?: readonly any[]}[]): number {
  return trees.reduce((count, tree) => count + 1 + countOperations(tree.children ?? []), 0);
}
