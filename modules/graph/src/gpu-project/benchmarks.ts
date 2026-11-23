// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Independently implemented for WebGPU; inspired by NVIDIA RAPIDS cuProj.

export {runProjectionBenchmark} from './projection-benchmark';
export {runProjectionRoutingBenchmark} from './projection-routing-benchmark';
export type {
  ProjectionRoutingBenchmarkOptions,
  ProjectionRoutingBenchmarkReport
} from './projection-routing-benchmark';
export type {
  ProjectionBenchmarkDistribution,
  ProjectionBenchmarkOptions,
  ProjectionBenchmarkPathReport,
  ProjectionBenchmarkReport,
  ProjectionBenchmarkStrategy
} from './projection-benchmark';

export {runGPUProjectionBenchmark} from './gpu-projection-benchmark';
export {runProjectionProgramBenchmark} from './projection-program-benchmark';
export {runProjectionTableBenchmark} from './projection-table-benchmark';
export type {
  ProjectionTableBenchmarkOptions,
  ProjectionTableBenchmarkMode,
  ProjectionTableBenchmarkReport
} from './projection-table-benchmark';
export type {
  ProjectionProgramCPUPathReport,
  ProjectionProgramCPUVariant
} from './projection-program-cpu-benchmark';
export {measureProjectionProgramCPU} from './projection-program-cpu-benchmark';
export type {
  ProjectionProgramBenchmarkVariant,
  ProjectionProgramBenchmarkOptions,
  ProjectionProgramBenchmarkPathReport,
  ProjectionProgramBenchmarkReport
} from './projection-program-benchmark';
export type {
  GPUProjectionBenchmarkInputFormat,
  GPUProjectionBenchmarkPatchStrategy,
  GPUProjectionBenchmarkPathReport,
  GPUProjectionBenchmarkReport
} from './gpu-projection-benchmark';
