// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {makeManufacturedPoissonProblem, relativePoissonResidual} from '../../examples/showcase/poisson-lab/poisson-problem';

describe('Poisson Lab manufactured problem', () => {
  test('builds a square symmetric five-point CSR system with positive diagonal', () => {
    const problem = makeManufacturedPoissonProblem(18);
    const n = problem.rhs.length;
    expect(problem.rowOffsets.length).toBe(n + 1);
    expect(problem.columnIndices.length).toBe(problem.values.length);
    expect(problem.rowOffsets[n]).toBe(problem.values.length);

    const entries = new Map<string, number>();
    for (let row=0; row<n; row++) {
      let diagonal = 0;
      for (let i=problem.rowOffsets[row]; i<problem.rowOffsets[row+1]; i++) {
        const column=problem.columnIndices[i]; const value=problem.values[i];
        entries.set(`${row}:${column}`, value);
        if(column===row) diagonal=value;
      }
      expect(diagonal).toBeGreaterThan(0);
    }
    for (const [key,value] of entries) {
      const [row,column]=key.split(':').map(Number);
      expect(entries.get(`${column}:${row}`)).toBeCloseTo(value, 5);
    }
  });

  test('manufactured exact samples satisfy the discrete system with second-order truncation error', () => {
    const coarse = makeManufacturedPoissonProblem(18);
    const fine = makeManufacturedPoissonProblem(34);
    const coarseResidual = relativePoissonResidual(coarse, coarse.exact);
    const fineResidual = relativePoissonResidual(fine, fine.exact);
    expect(fineResidual).toBeLessThan(coarseResidual * 0.35);
  });
});
