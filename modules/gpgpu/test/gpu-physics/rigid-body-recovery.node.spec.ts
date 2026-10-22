// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, it} from 'vitest';
import {decodeRigidBodySimulationDiagnostics, growRigidBodyBudgets} from '../../src/gpu-physics';

it('grows only recoverable budgets and respects traversal ceilings', () => {
  const values = new Uint32Array(16);
  values[1] = values[2] = values[3] = values[4] = values[11] = 1;
  const diagnostics = decodeRigidBodySimulationDiagnostics(values);
  expect(
    growRigidBodyBudgets({bodies: [], broadPhase: 'hierarchical-grid'}, diagnostics, 16)
  ).toMatchObject({
    maximumPairs: 32,
    maximumCandidateTestsPerCollider: 8192,
    maximumMeshTraversalTestsPerPair: 131072
  });
  expect(growRigidBodyBudgets({bodies: []}, diagnostics, 16)).toBeNull();
  for (const index of [5, 6, 7, 8, 12, 13, 14, 15]) {
    const failed = values.slice();
    failed[index] = 1;
    expect(
      growRigidBodyBudgets(
        {bodies: [], broadPhase: 'hierarchical-grid'},
        decodeRigidBodySimulationDiagnostics(failed),
        16
      )
    ).toBeNull();
  }
  const exhausted = new Uint32Array(16);
  exhausted[4] = exhausted[11] = 1;
  expect(
    growRigidBodyBudgets(
      {
        bodies: [],
        maximumCandidateTestsPerCollider: 65535,
        maximumMeshTraversalTestsPerPair: 1048576
      },
      decodeRigidBodySimulationDiagnostics(exhausted),
      16
    )
  ).toBeNull();
});
