// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import {selectGPUStrategy, type GPUStrategyDecision} from './gpu-strategy';

export type GPUSpMVStrategyId = 'scalar-row' | 'subgroup-row' | 'workgroup-row' | 'long-row';

export type GPUSpMVRowStatistics = {
  /** Optional CPU-known or previously profiled maximum nonzeros in a row. */
  maxNonZerosPerRow?: number;
  /** Optional CPU-known or previously profiled fraction of rows with <= 8 nonzeros. */
  shortRowFraction?: number;
};

export type GPUSpMVWorkload = {
  rows: number;
  nonZeros: number;
  statistics?: GPUSpMVRowStatistics;
};

export type GPUSpMVStrategyDetails = {
  rowsPerWorkgroup: number;
  workgroupSize: 64 | 128 | 256;
  workgroupsPerLongRow: number;
};

/** Selects a CSR SpMV execution family from matrix shape and optional row statistics. */
export function selectGPUSpMVStrategy(
  device: Device,
  workload: GPUSpMVWorkload,
  preferredId?: GPUSpMVStrategyId
): GPUStrategyDecision<GPUSpMVStrategyId, GPUSpMVStrategyDetails> {
  if (!Number.isSafeInteger(workload.rows) || workload.rows < 1) throw new Error('SpMV rows must be positive');
  if (!Number.isSafeInteger(workload.nonZeros) || workload.nonZeros < 0) throw new Error('SpMV nonZeros must be non-negative');
  const average = workload.nonZeros / workload.rows;
  const maxRow = workload.statistics?.maxNonZerosPerRow;
  const shortFraction = workload.statistics?.shortRowFraction;
  const hasSubgroups = device.features?.has?.('subgroups') ?? false;

  return selectGPUStrategy({device, workload, preferredId, candidates: [
    {
      id: 'scalar-row',
      score: () => average <= 8 ? 100 : average <= 16 ? 60 : 10,
      reason: () => `average row length ${average.toFixed(1)} favors one invocation per row`,
      createDetails: () => ({rowsPerWorkgroup: 64, workgroupSize: 64 as const, workgroupsPerLongRow: 1})
    },
    {
      id: 'subgroup-row',
      isSupported: () => hasSubgroups,
      score: () => average <= 64 && (shortFraction === undefined || shortFraction < 0.9) ? 110 : 35,
      reason: () => `subgroups available; medium CSR rows can reduce within a subgroup`,
      createDetails: () => ({rowsPerWorkgroup: 4, workgroupSize: 128 as const, workgroupsPerLongRow: 1})
    },
    {
      id: 'workgroup-row',
      score: () => average > 32 && (maxRow === undefined || maxRow <= 2048) ? 100 : 50,
      reason: () => `average row length ${average.toFixed(1)} favors cooperative row reduction`,
      createDetails: () => ({rowsPerWorkgroup: 1, workgroupSize: 256 as const, workgroupsPerLongRow: 1})
    },
    {
      id: 'long-row',
      score: () => (maxRow !== undefined && maxRow > 2048) || average > 1024 ? 140 : 0,
      reason: () => `very long rows favor multi-workgroup partial reduction`,
      createDetails: () => ({rowsPerWorkgroup: 1, workgroupSize: 256 as const, workgroupsPerLongRow: 4})
    }
  ]});
}
