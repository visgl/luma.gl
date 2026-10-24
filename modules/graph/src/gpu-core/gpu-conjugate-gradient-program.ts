// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {GPUGraph} from './gpu-graph';
import {GPUCompositeOperation} from './gpu-operation';
import {GPULoopOperation} from './gpu-control-flow-operation';
import {GPUGraphScalarLiteral} from './gpu-semantic-state-operation';
import {GPUGraphScalarOperation} from './gpu-semantic-scalar-operation';
import {GPUGraphDotProduct, GPUGraphVectorMADD} from './gpu-semantic-vector-operation';
import {GPUGraphCSRMatrix, GPUGraphSpMV} from './gpu-semantic-spmv';
import type {GPUSpMVRowStatistics} from './gpu-spmv-strategy';

/** Builds a complete backend-independent convergence-controlled conjugate-gradient program. */
export function createGPUConjugateGradientGraph(props: {
  id?: string;
  size: number;
  nonZeros: number;
  maxIterations: number;
  toleranceSquared: number;
  statistics?: GPUSpMVRowStatistics;
}) {
  const id = props.id ?? 'gpu-conjugate-gradient';
  if (!Number.isSafeInteger(props.size) || props.size < 1)
    throw new Error(`${id} size must be positive`);
  if (!Number.isSafeInteger(props.nonZeros) || props.nonZeros < 0)
    throw new Error(`${id} nonZeros must be non-negative`);
  if (!Number.isSafeInteger(props.maxIterations) || props.maxIterations < 1)
    throw new Error(`${id} maxIterations must be positive`);
  if (!Number.isFinite(props.toleranceSquared) || !(props.toleranceSquared > 0))
    throw new Error(`${id} toleranceSquared must be positive`);
  const n = props.size,
    program = new GPUGraph({id});
  const rowOffsets = program.vector(`${id}-row-offsets`, 'uint32', n + 1, {external: true}),
    columnIndices = program.vector(`${id}-column-indices`, 'uint32', props.nonZeros, {
      external: true
    }),
    values = program.vector(`${id}-values`, 'float32', props.nonZeros, {external: true}),
    rhs = program.vector(`${id}-rhs`, 'float32', n, {external: true}),
    solution = program.vector(`${id}-x`, 'float32', n, {external: true});
  const matrix = new GPUGraphCSRMatrix({
    id: `${id}-matrix`,
    rows: n,
    columns: n,
    rowOffsets,
    columnIndices,
    values,
    statistics: props.statistics
  });
  const ax = program.vector(`${id}-ax`, 'float32', n),
    residual = program.vector(`${id}-r`, 'float32', n),
    search = program.vector(`${id}-p`, 'float32', n),
    q = program.vector(`${id}-q`, 'float32', n);
  const rr = program.scalar(`${id}-rr`, 'float32'),
    pq = program.scalar(`${id}-pq`, 'float32'),
    alpha = program.scalar(`${id}-alpha`, 'float32'),
    newRR = program.scalar(`${id}-new-rr`, 'float32'),
    beta = program.scalar(`${id}-beta`, 'float32'),
    negAlpha = program.scalar(`${id}-neg-alpha`, 'float32'),
    minusOne = program.scalar(`${id}-minus-one`, 'float32'),
    tolerance = program.scalar(`${id}-tolerance-squared`, 'float32'),
    active = program.scalar(`${id}-active`, 'uint32'),
    zero = program.scalar(`${id}-zero`, 'float32'),
    breakdown = program.scalar(`${id}-breakdown`, 'uint32');
  program.add([
    new GPUGraphScalarLiteral({output: minusOne, value: -1}),
    new GPUGraphScalarLiteral({output: tolerance, value: props.toleranceSquared}),
    new GPUGraphScalarLiteral({output: zero, value: 0}),
    new GPUGraphScalarLiteral({output: breakdown, value: 0}),
    new GPUGraphSpMV({id: `${id}-initial-spmv`, matrix, vector: solution, output: ax}),
    new GPUGraphVectorMADD({
      id: `${id}-initial-residual`,
      input: ax,
      scale: minusOne,
      addend: rhs,
      output: residual
    }),
    new GPUGraphVectorMADD({
      id: `${id}-initial-search`,
      input: ax,
      scale: minusOne,
      addend: rhs,
      output: search
    }),
    new GPUGraphDotProduct({id: `${id}-rr0`, left: residual, right: residual, output: rr}),
    new GPUGraphScalarOperation({
      id: `${id}-initial-active`,
      operation: 'greater-than',
      left: rr,
      right: tolerance,
      output: active
    })
  ]);
  const body = new GPUCompositeOperation({
    id: `${id}-iteration`,
    operations: [
      new GPUGraphSpMV({id: `${id}-spmv`, matrix, vector: search, output: q}),
      new GPUGraphDotProduct({id: `${id}-pq`, left: search, right: q, output: pq}),
      new GPUGraphScalarOperation({
        id: `${id}-breakdown`,
        operation: 'less-than-or-equal',
        left: pq,
        right: zero,
        output: breakdown
      }),
      new GPUGraphScalarOperation({
        id: `${id}-curvature-active`,
        operation: 'greater-than',
        left: pq,
        right: zero,
        output: active
      }),
      new GPUGraphScalarOperation({
        id: `${id}-alpha`,
        operation: 'divide',
        left: rr,
        right: pq,
        output: alpha
      }),
      new GPUGraphVectorMADD({
        id: `${id}-x-update`,
        input: search,
        scale: alpha,
        addend: solution,
        output: solution
      }),
      new GPUGraphScalarOperation({
        id: `${id}-neg-alpha`,
        operation: 'multiply',
        left: alpha,
        right: minusOne,
        output: negAlpha
      }),
      new GPUGraphVectorMADD({
        id: `${id}-r-update`,
        input: q,
        scale: negAlpha,
        addend: residual,
        output: residual
      }),
      new GPUGraphDotProduct({
        id: `${id}-new-rr`,
        left: residual,
        right: residual,
        output: newRR
      }),
      new GPUGraphScalarOperation({
        id: `${id}-beta`,
        operation: 'divide',
        left: newRR,
        right: rr,
        output: beta
      }),
      new GPUGraphVectorMADD({
        id: `${id}-p-update`,
        input: search,
        scale: beta,
        addend: residual,
        output: search
      }),
      new GPUGraphScalarOperation({
        id: `${id}-rr-copy`,
        operation: 'copy',
        left: newRR,
        output: rr
      }),
      new GPUGraphScalarOperation({
        id: `${id}-active`,
        operation: 'greater-than',
        left: rr,
        right: tolerance,
        output: active
      })
    ]
  });
  program.add(
    new GPULoopOperation({
      id: `${id}-loop`,
      body,
      predicate: {
        id: `${id}-continue`,
        source: 'gpu',
        value: active,
        expression: 'residualSquared > toleranceSquared'
      },
      maximumIterations: props.maxIterations,
      minimumIterations: 0
    })
  );
  return {
    program,
    matrix,
    rowOffsets,
    columnIndices,
    values,
    rhs,
    solution,
    residualSquared: rr,
    breakdown
  };
}
