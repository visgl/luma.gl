// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export type PoissonProblem2D = {
  resolution: number;
  spacing: number;
  exact: Float32Array;
  rhs: Float32Array;
  rowOffsets: Uint32Array;
  columnIndices: Uint32Array;
  values: Float32Array;
};

/**
 * Five-point finite-difference discretization of `-Δu=f` on `(0,1)²` with `u=0` on the boundary.
 * The manufactured solution `u=sin(πx)sin(πy)` gives `f=2π²sin(πx)sin(πy)`, providing a known
 * analytical reference for validating the numerical solver rather than trusting appearance alone.
 */
export function makeManufacturedPoissonProblem(resolution = 128): PoissonProblem2D {
  if (!Number.isInteger(resolution) || resolution < 4) throw new Error('Poisson resolution must be an integer >= 4');
  const interior = resolution - 2;
  const unknowns = interior * interior;
  const h = 1 / (resolution - 1);
  const invH2 = 1 / (h * h);
  const exact = new Float32Array(unknowns);
  const rhs = new Float32Array(unknowns);
  const rowOffsets = new Uint32Array(unknowns + 1);
  const columns: number[] = [];
  const coefficients: number[] = [];
  const index = (ix: number, iy: number) => iy * interior + ix;

  for (let iy = 0; iy < interior; iy++) {
    const y = (iy + 1) * h;
    for (let ix = 0; ix < interior; ix++) {
      const x = (ix + 1) * h;
      const row = index(ix, iy);
      rowOffsets[row] = columns.length;
      const u = Math.sin(Math.PI * x) * Math.sin(Math.PI * y);
      exact[row] = u;
      rhs[row] = 2 * Math.PI * Math.PI * u;
      if (iy > 0) { columns.push(index(ix, iy - 1)); coefficients.push(-invH2); }
      if (ix > 0) { columns.push(index(ix - 1, iy)); coefficients.push(-invH2); }
      columns.push(row); coefficients.push(4 * invH2);
      if (ix + 1 < interior) { columns.push(index(ix + 1, iy)); coefficients.push(-invH2); }
      if (iy + 1 < interior) { columns.push(index(ix, iy + 1)); coefficients.push(-invH2); }
    }
  }
  rowOffsets[unknowns] = columns.length;
  return {resolution, spacing:h, exact, rhs, rowOffsets, columnIndices:Uint32Array.from(columns), values:Float32Array.from(coefficients)};
}

/** CPU reference multiply used only by tests/validation, never by the interactive GPU solve. */
export function applyPoissonCSR(problem: PoissonProblem2D, vector: Float32Array): Float64Array {
  if (vector.length !== problem.rhs.length) throw new Error('Poisson vector length mismatch');
  const output = new Float64Array(vector.length);
  for (let row=0; row<vector.length; row++) {
    let sum=0;
    for (let i=problem.rowOffsets[row]; i<problem.rowOffsets[row+1]; i++) sum += problem.values[i]*vector[problem.columnIndices[i]];
    output[row]=sum;
  }
  return output;
}

/** Relative L2 norm `||a-b||₂ / ||b||₂`. */
export function relativeL2Error(a: ArrayLike<number>, b: ArrayLike<number>): number {
  if (a.length !== b.length) throw new Error('relativeL2Error length mismatch');
  let error2=0; let reference2=0;
  for(let i=0;i<a.length;i++){const d=a[i]-b[i];error2+=d*d;reference2+=b[i]*b[i];}
  return Math.sqrt(error2 / Math.max(reference2, Number.MIN_VALUE));
}

/** Relative residual `||b-Ax||₂ / ||b||₂` using the CPU reference path for verification. */
export function relativePoissonResidual(problem: PoissonProblem2D, solution: Float32Array): number {
  const ax=applyPoissonCSR(problem,solution);let residual2=0;let rhs2=0;
  for(let i=0;i<solution.length;i++){const r=problem.rhs[i]-ax[i];residual2+=r*r;rhs2+=problem.rhs[i]*problem.rhs[i];}
  return Math.sqrt(residual2/Math.max(rhs2,Number.MIN_VALUE));
}
