// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {GPUCommandGraph, type GraphDataView} from './gpu-command-graph';

/** Sparse SPD matrix views consumed by the conjugate-gradient solver. */
export type GPUConjugateGradientMatrix = {
  rowOffsets: GraphDataView<'uint32'>;
  columnIndices: GraphDataView<'uint32'>;
  values: GraphDataView<'float32'>;
  columns: number;
};

export type GPUConjugateGradientProps = {
  id?: string;
  /** Symmetric positive-definite matrix in CSR form. */
  matrix: GPUConjugateGradientMatrix;
  /** Right-hand side b. */
  rhs: GraphDataView<'float32'>;
  /** Initial guess on input and final solution on output. */
  solution: GraphDataView<'float32'>;
  /** Maximum number of CG iterations contributed to the graph. */
  maxIterations: number;
  /** Optional relative residual tolerance for future GPU-side convergence control. */
  tolerance?: number;
};

/**
 * Graph-level conjugate-gradient solver for sparse SPD systems.
 *
 * The class intentionally represents solver orchestration rather than another private collection of
 * vector kernels. The implementation is staged until the proposed GPUSpMV, GPUDotProduct and
 * GPUElementwise primitives land on master; those operations form the solver's execution substrate.
 */
export class GPUConjugateGradient {
  readonly id: string;
  readonly matrix: GPUConjugateGradientMatrix;
  readonly rhs: GraphDataView<'float32'>;
  readonly solution: GraphDataView<'float32'>;
  readonly maxIterations: number;
  readonly tolerance?: number;

  constructor(props: GPUConjugateGradientProps) {
    this.id = props.id ?? 'gpu-conjugate-gradient';
    this.matrix = props.matrix;
    this.rhs = props.rhs;
    this.solution = props.solution;
    this.maxIterations = props.maxIterations;
    this.tolerance = props.tolerance;

    if (!Number.isInteger(this.maxIterations) || this.maxIterations < 1) {
      throw new Error(`${this.id} maxIterations must be a positive integer`);
    }
    if (this.tolerance !== undefined && (!(this.tolerance > 0) || !Number.isFinite(this.tolerance))) {
      throw new Error(`${this.id} tolerance must be a finite positive number`);
    }
    if (this.matrix.rowOffsets.length !== this.rhs.length + 1) {
      throw new Error(`${this.id} matrix row count must match rhs length`);
    }
    if (this.solution.length !== this.rhs.length) {
      throw new Error(`${this.id} solution length must match rhs length`);
    }
    if (this.matrix.columns !== this.rhs.length) {
      throw new Error(`${this.id} initial solver contract requires a square matrix`);
    }
  }

  /**
   * Adds the solver to a command graph.
   *
   * This draft defines the orchestration boundary and validates graph ownership. The execution body
   * will be enabled once the dependent Jarnevon primitives are merged, so CG can compose those
   * public operations instead of duplicating private SpMV/dot/vector kernels here.
   */
  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    const views = [
      this.matrix.rowOffsets,
      this.matrix.columnIndices,
      this.matrix.values,
      this.rhs,
      this.solution
    ];
    if (views.some(view => view.buffer.graph !== graph)) {
      throw new Error(`${this.id} views must belong to the target graph`);
    }

    throw new Error(
      `${this.id} execution requires GPUSpMV, GPUDotProduct and GPUElementwise to land on master`
    );
  }
}
