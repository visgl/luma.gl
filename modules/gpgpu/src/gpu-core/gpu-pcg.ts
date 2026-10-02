// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {type GPUCommandGraph, GraphVectorView} from './gpu-command-graph';
import type {GPUCommandNode, GPUCommandNodeProducer} from './gpu-command-node';
import {createTransientView, createTransientVectorView} from './graph-data-view-utils';
import {GPUAdaptiveSpMV, type GPUAdaptiveSpMVProps} from './gpu-adaptive-spmv';
import {GPUJacobiPreconditioner} from './gpu-jacobi-preconditioner';
import {GPUDotProductScalar} from './gpu-dot-product-scalar';
import {createGPUScalar, type GPUScalar} from './gpu-scalar';
import {GPUScalarCompute} from './gpu-scalar-operation';
import {GPUScalarLiteral} from './gpu-scalar-literal';
import {GPUVectorScalarMADD} from './gpu-elementwise-scalar';
import {GPUElementwise} from './gpu-elementwise';
import {validateChunkViews} from './gpu-chunk-utils';
import {gateGPUCommandNodes} from './gpu-scalar-dispatch-gate';

export type GPUJacobiPCGProps = {
  id?: string;
  rowOffsets: GPUAdaptiveSpMVProps['rowOffsets'];
  columnIndices: GPUAdaptiveSpMVProps['columnIndices'];
  values: GPUAdaptiveSpMVProps['values'];
  rhs: GPUAdaptiveSpMVProps['vector'];
  solution: GPUAdaptiveSpMVProps['output'];
  columns: number;
  /** Upper bound; converged or broken-down solves stop writing the solution on the GPU. */
  iterations: number;
  /** Absolute squared residual tolerance. Defaults to 1e-12. */
  toleranceSquared?: number;
  spmvStatistics?: GPUAdaptiveSpMVProps['statistics'];
};
export type GPUJacobiPCGResult = {
  residualSquared: GPUScalar<'float32'>;
  initialResidualSquared: GPUScalar<'float32'>;
  /** Nonzero when a nonpositive preconditioned residual or curvature prevents a valid step. */
  breakdown: GPUScalar<'uint32'>;
  spmvStrategy: string;
  /** Configured iteration budget. */
  iterations: number;
};

/** GPU-controlled Jacobi PCG for symmetric positive-definite systems, including warm starts. */
export class GPUJacobiPCG {
  readonly id: string;
  private result?: GPUJacobiPCGResult;
  constructor(readonly props: GPUJacobiPCGProps) {
    this.id = props.id ?? 'gpu-jacobi-pcg';
    if (!Number.isSafeInteger(props.iterations) || props.iterations < 1)
      throw new Error(`${this.id} iterations must be positive`);
    if (!Number.isFinite(props.toleranceSquared ?? 1e-12) || (props.toleranceSquared ?? 1e-12) < 0)
      throw new Error(`${this.id} toleranceSquared must be finite and non-negative`);
    if (props.rhs.length !== props.solution.length || props.columns !== props.rhs.length)
      throw new Error(`${this.id} requires a square system matching rhs/solution length`);
  }
  getResult(): GPUJacobiPCGResult {
    if (!this.result) throw new Error(`${this.id} must be added before reading its result`);
    return this.result;
  }
  getCommandNodes<Parameters>(
    graph: GPUCommandGraph<Parameters>
  ): readonly GPUCommandNode<Parameters>[] {
    if (this.result) throw new Error(`${this.id} can only be added once`);
    const nodes: GPUCommandNode<Parameters>[] = [];
    const {rowOffsets, columnIndices, values, rhs, solution, columns, iterations, spmvStatistics} =
      this.props;
    validateChunkViews(graph, [rowOffsets, columnIndices, values, rhs], [solution]);
    const scratch = (name: string) =>
      rhs instanceof GraphVectorView
        ? createTransientVectorView(graph, `${this.id}-${name}`, rhs)
        : createTransientView(graph, `${this.id}-${name}`, 'float32', rhs.length);
    const inverseDiagonal = scratch('inverse-diagonal');
    const residual = scratch('residual');
    const preconditioned = scratch('preconditioned');
    const search = scratch('search');
    const product = scratch('product');
    // Declare every scalar before constructing nodes seals the arena.
    const scalar = (name: string) => createGPUScalar(graph, `${this.id}-${name}`, 'float32');
    const rho = scalar('rho'),
      nextRho = scalar('next-rho'),
      curvature = scalar('curvature');
    const alpha = scalar('alpha'),
      beta = scalar('beta'),
      negativeAlpha = scalar('negative-alpha');
    const minusOne = scalar('minus-one'),
      zero = scalar('zero'),
      tolerance = scalar('tolerance');
    const initialResidualSquared = scalar('initial-residual-squared'),
      residualSquared = scalar('residual-squared');
    const active = createGPUScalar(graph, `${this.id}-active`, 'uint32');
    const breakdown = createGPUScalar(graph, `${this.id}-breakdown`, 'uint32');
    const add = (primitive: GPUCommandNodeProducer<Parameters>, gated = false) => {
      const commands = primitive.getCommandNodes(graph);
      nodes.push(...(gated ? gateGPUCommandNodes(graph, commands, active) : commands));
    };
    const multiply = (id: string, vector: typeof rhs, output: typeof rhs) =>
      new GPUAdaptiveSpMV({
        id,
        rowOffsets,
        columnIndices,
        values,
        vector,
        output,
        columns,
        statistics: spmvStatistics
      });
    add(new GPUScalarLiteral({output: minusOne, value: -1}));
    add(new GPUScalarLiteral({output: zero, value: 0}));
    add(new GPUScalarLiteral({output: tolerance, value: this.props.toleranceSquared ?? 1e-12}));
    add(new GPUScalarLiteral({output: breakdown, value: 0}));
    add(
      new GPUJacobiPreconditioner({
        id: `${this.id}-jacobi`,
        rowOffsets,
        columnIndices,
        values,
        inverseDiagonal
      })
    );
    const initialProduct = multiply(`${this.id}-initial-product`, solution, product);
    const spmvStrategy = initialProduct.getStrategy(graph).id;
    add(initialProduct);
    add(
      new GPUVectorScalarMADD({
        id: `${this.id}-initial-residual`,
        input: product,
        scale: minusOne,
        addend: rhs,
        output: residual
      })
    );
    add(
      new GPUElementwise({
        id: `${this.id}-initial-preconditioned`,
        input: inverseDiagonal,
        inputB: residual,
        output: preconditioned,
        operation: 'multiply'
      })
    );
    add(
      new GPUElementwise({
        id: `${this.id}-initial-search`,
        input: preconditioned,
        output: search,
        operation: 'copy'
      })
    );
    add(
      new GPUDotProductScalar({
        id: `${this.id}-initial-rho`,
        left: residual,
        right: preconditioned,
        output: rho
      })
    );
    add(
      new GPUDotProductScalar({
        id: `${this.id}-initial-norm`,
        left: residual,
        right: residual,
        output: initialResidualSquared
      })
    );
    add(
      new GPUScalarCompute({
        id: `${this.id}-initial-norm-copy`,
        operation: 'copy',
        left: initialResidualSquared,
        output: residualSquared
      })
    );
    add(
      new GPUScalarCompute({
        id: `${this.id}-initial-active`,
        operation: 'greater-than',
        left: residualSquared,
        right: tolerance,
        output: active
      })
    );
    const checkPositive = (id: string, value: GPUScalar<'float32'>) => {
      add(
        new GPUScalarCompute({
          id: `${id}-breakdown`,
          operation: 'less-than-or-equal',
          left: value,
          right: zero,
          output: breakdown
        }),
        true
      );
      add(
        new GPUScalarCompute({
          id: `${id}-active`,
          operation: 'greater-than',
          left: value,
          right: zero,
          output: active
        }),
        true
      );
    };
    checkPositive(`${this.id}-initial-rho`, rho);
    for (let iteration = 0; iteration < iterations; iteration++) {
      const prefix = `${this.id}-iteration-${iteration}`;
      add(multiply(`${prefix}-product`, search, product), true);
      add(
        new GPUDotProductScalar({
          id: `${prefix}-curvature`,
          left: search,
          right: product,
          output: curvature
        }),
        true
      );
      checkPositive(`${prefix}-curvature`, curvature);
      add(
        new GPUScalarCompute({
          id: `${prefix}-alpha`,
          operation: 'divide',
          left: rho,
          right: curvature,
          output: alpha
        }),
        true
      );
      add(
        new GPUVectorScalarMADD({
          id: `${prefix}-solution`,
          input: search,
          scale: alpha,
          addend: solution,
          output: solution
        }),
        true
      );
      add(
        new GPUScalarCompute({
          id: `${prefix}-negative-alpha`,
          operation: 'multiply',
          left: alpha,
          right: minusOne,
          output: negativeAlpha
        }),
        true
      );
      add(
        new GPUVectorScalarMADD({
          id: `${prefix}-residual`,
          input: product,
          scale: negativeAlpha,
          addend: residual,
          output: residual
        }),
        true
      );
      add(
        new GPUDotProductScalar({
          id: `${prefix}-norm`,
          left: residual,
          right: residual,
          output: residualSquared
        }),
        true
      );
      add(
        new GPUScalarCompute({
          id: `${prefix}-convergence`,
          operation: 'greater-than',
          left: residualSquared,
          right: tolerance,
          output: active
        }),
        true
      );
      add(
        new GPUElementwise({
          id: `${prefix}-preconditioned`,
          input: inverseDiagonal,
          inputB: residual,
          output: preconditioned,
          operation: 'multiply'
        }),
        true
      );
      add(
        new GPUDotProductScalar({
          id: `${prefix}-rho`,
          left: residual,
          right: preconditioned,
          output: nextRho
        }),
        true
      );
      checkPositive(`${prefix}-rho`, nextRho);
      add(
        new GPUScalarCompute({
          id: `${prefix}-beta`,
          operation: 'divide',
          left: nextRho,
          right: rho,
          output: beta
        }),
        true
      );
      add(
        new GPUVectorScalarMADD({
          id: `${prefix}-search`,
          input: search,
          scale: beta,
          addend: preconditioned,
          output: search
        }),
        true
      );
      add(
        new GPUScalarCompute({
          id: `${prefix}-rho-copy`,
          operation: 'copy',
          left: nextRho,
          output: rho
        }),
        true
      );
    }
    this.result = {residualSquared, initialResidualSquared, breakdown, spmvStrategy, iterations};
    return nodes;
  }
}
