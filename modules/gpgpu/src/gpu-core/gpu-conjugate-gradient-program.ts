// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {GPUProgram} from './gpu-program';
import {GPUCompositeOperation} from './gpu-operation';
import {GPULoopOperation} from './gpu-control-flow-operation';
import {GPUProgramScalarLiteral} from './gpu-semantic-state-operation';
import {GPUProgramScalarOperation} from './gpu-semantic-scalar-operation';
import {GPUProgramDotProduct, GPUProgramVectorMADD} from './gpu-semantic-vector-operation';
import {GPUProgramSpMV, type GPUProgramCSRMatrix} from './gpu-semantic-spmv';

/**
 * Builds the iterative core of conjugate gradient entirely from semantic GPU operations.
 *
 * The caller supplies initialized residual/search/solution state. This deliberately keeps solver
 * setup (x0, r0=b-Ax0) separate from the reusable convergence-controlled iteration program.
 */
export function createGPUConjugateGradientProgram(props: {
  id?: string;
  matrix: GPUProgramCSRMatrix;
  maxIterations: number;
  toleranceSquared: number;
}): {
  program: GPUProgram;
  solution: ReturnType<GPUProgram['vector']>;
  residual: ReturnType<GPUProgram['vector']>;
  search: ReturnType<GPUProgram['vector']>;
} {
  const id = props.id ?? 'gpu-conjugate-gradient';
  if (props.matrix.rows !== props.matrix.columns) throw new Error(`${id} matrix must be square`);
  if (!Number.isSafeInteger(props.maxIterations) || props.maxIterations < 1) throw new Error(`${id} maxIterations must be positive`);
  if (!(props.toleranceSquared > 0)) throw new Error(`${id} toleranceSquared must be positive`);
  const n = props.matrix.rows;
  const program = new GPUProgram({id});
  const solution = program.vector(`${id}-x`, 'float32', n, {external: true});
  const residual = program.vector(`${id}-r`, 'float32', n, {external: true});
  const search = program.vector(`${id}-p`, 'float32', n, {external: true});
  const q = program.vector(`${id}-q`, 'float32', n);
  const rr = program.scalar(`${id}-rr`, 'float32');
  const pq = program.scalar(`${id}-pq`, 'float32');
  const alpha = program.scalar(`${id}-alpha`, 'float32');
  const newRR = program.scalar(`${id}-new-rr`, 'float32');
  const beta = program.scalar(`${id}-beta`, 'float32');
  const negAlpha = program.scalar(`${id}-neg-alpha`, 'float32');
  const minusOne = program.scalar(`${id}-minus-one`, 'float32');
  const tolerance = program.scalar(`${id}-tolerance-squared`, 'float32');
  const active = program.scalar(`${id}-active`, 'uint32');

  program.add([
    new GPUProgramScalarLiteral({output: minusOne, value: -1}),
    new GPUProgramScalarLiteral({output: tolerance, value: props.toleranceSquared}),
    new GPUProgramScalarLiteral({output: active, value: 1}),
    new GPUProgramDotProduct({id: `${id}-rr0`, left: residual, right: residual, output: rr})
  ]);

  const body = new GPUCompositeOperation({id: `${id}-iteration`, operations: [
    new GPUProgramSpMV({id: `${id}-spmv`, matrix: props.matrix, vector: search, output: q}),
    new GPUProgramDotProduct({id: `${id}-pq`, left: search, right: q, output: pq}),
    new GPUProgramScalarOperation({id: `${id}-alpha`, operation: 'divide', left: rr, right: pq, output: alpha}),
    new GPUProgramVectorMADD({id: `${id}-x-update`, input: search, scale: alpha, addend: solution, output: solution}),
    new GPUProgramScalarOperation({id: `${id}-neg-alpha`, operation: 'multiply', left: alpha, right: minusOne, output: negAlpha}),
    new GPUProgramVectorMADD({id: `${id}-r-update`, input: q, scale: negAlpha, addend: residual, output: residual}),
    new GPUProgramDotProduct({id: `${id}-new-rr`, left: residual, right: residual, output: newRR}),
    new GPUProgramScalarOperation({id: `${id}-active`, operation: 'greater-than', left: newRR, right: tolerance, output: active}),
    new GPUProgramScalarOperation({id: `${id}-beta`, operation: 'divide', left: newRR, right: rr, output: beta}),
    new GPUProgramVectorMADD({id: `${id}-p-update`, input: search, scale: beta, addend: residual, output: search}),
    new GPUProgramScalarOperation({id: `${id}-rr-copy`, operation: 'copy', left: newRR, output: rr})
  ]});

  program.add(new GPULoopOperation({
    id: `${id}-loop`,
    body,
    predicate: {id: `${id}-continue`, source: 'gpu', value: active, expression: 'residualSquared > toleranceSquared'},
    maximumIterations: props.maxIterations,
    minimumIterations: 1
  }));
  return {program, solution, residual, search};
}
