// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Independently implemented for WebGPU; inspired by NVIDIA RAPIDS cuProj.

import type {ProjectionCoordinates} from './types';
import {
  getProjectionBenchmarkTime,
  getProjectionBenchmarkThroughput,
  summarizeProjectionBenchmarkSamples,
  type ProjectionBenchmarkDistribution
} from './projection-benchmark';

export type ProjectionProgramCPUPathReport = {
  api: string;
  layout: string;
  provider: string;
  scratchByteLength: number;
  preparationTimeMilliseconds: number;
  maximumAllowedError: number;
  maximumObservedError: number;
  mode: 'inline' | 'materialized';
  outputEncoding: 'binary64';
  projectionsPerRow: number;
  outputByteLength: number;
  intermediateByteLength: number;
  validRows: number;
  checksum: number;
  durationMilliseconds: ProjectionBenchmarkDistribution;
  coordinatesPerSecond: number;
};

type ProjectionResult = {position: ProjectionCoordinates; valid: boolean};
type CPUOutput = {positions: Float64Array; validity: Uint32Array};

/** Optional batch baseline. Preparation/allocation is excluded; execute includes input packing. */
export type ProjectionProgramCPUVariant = {
  api: string;
  layout?: string;
  /** Absolute Euclidean error in destination units. Default zero; validity stays exact. */
  maximumError?: number;
  provider: string;
  prepare: (coordinates: readonly ProjectionCoordinates[]) => {
    scratchByteLength: number;
    execute: (output: CPUOutput) => void;
  };
};

/** @internal Same consumer work as the GPU paths; allocations and validation are outside timing. */
export function measureProjectionProgramCPU(options: {
  coordinates: readonly ProjectionCoordinates[];
  oracle: (position: ProjectionCoordinates) => ProjectionResult;
  expected: readonly ProjectionResult[];
  consumerCount: number;
  warmupIterations: number;
  measuredIterations: number;
  variants?: readonly ProjectionProgramCPUVariant[];
  provider?: string;
}): ProjectionProgramCPUPathReport[] {
  const {coordinates, oracle, expected, consumerCount, warmupIterations, measuredIterations} =
    options;
  if (
    options.variants?.some(
      variant => !Number.isFinite(variant.maximumError ?? 0) || (variant.maximumError ?? 0) < 0
    )
  )
    throw new Error('invalid CPU projection error budget');
  const makeOutput = (): CPUOutput => ({
    positions: new Float64Array(coordinates.length * 2),
    validity: new Uint32Array(coordinates.length)
  });
  return [undefined, ...(options.variants ?? [])].flatMap(variant =>
    (['inline', 'materialized'] as const).map((mode): ProjectionProgramCPUPathReport => {
      const preparationStart = getProjectionBenchmarkTime();
      const batch = variant?.prepare(coordinates);
      const outputs = Array.from({length: consumerCount}, makeOutput);
      const intermediate = mode === 'materialized' ? makeOutput() : undefined;
      const preparationTimeMilliseconds = getProjectionBenchmarkTime() - preparationStart;
      const maximumAllowedError = variant?.maximumError ?? 0;
      let maximumObservedError = 0;
      let referenceOutputs: Float64Array[] | undefined;
      const projectRows = (output: CPUOutput, swap: boolean): void => {
        if (batch) {
          batch.execute(output);
          if (swap)
            for (let row = 0; row < coordinates.length; row++) {
              const first = output.positions[2 * row];
              output.positions[2 * row] = output.positions[2 * row + 1];
              output.positions[2 * row + 1] = first;
            }
          return;
        }
        for (let row = 0; row < coordinates.length; row++) {
          const result = oracle(coordinates[row]);
          output.positions[2 * row] = result.valid ? result.position[swap ? 1 : 0] : 0;
          output.positions[2 * row + 1] = result.valid ? result.position[swap ? 0 : 1] : 0;
          output.validity[row] = Number(result.valid);
        }
      };
      const execute = (): void => {
        if (intermediate) {
          projectRows(intermediate, false);
          for (const output of outputs) {
            for (let row = 0; row < coordinates.length; row++) {
              output.positions[2 * row] = intermediate.positions[2 * row + 1];
              output.positions[2 * row + 1] = intermediate.positions[2 * row];
              output.validity[row] = intermediate.validity[row];
            }
          }
        } else {
          for (const output of outputs) projectRows(output, true);
        }
      };
      const validate = (): number => {
        let checksum = 0;
        for (const [outputIndex, output] of outputs.entries()) {
          for (let row = 0; row < coordinates.length; row++) {
            const reference = expected[row];
            const error = reference.valid
              ? Math.hypot(
                  output.positions[2 * row] - reference.position[1],
                  output.positions[2 * row + 1] - reference.position[0]
                )
              : 0;
            const baseline = referenceOutputs?.[outputIndex];
            if (
              output.validity[row] !== Number(reference.valid) ||
              !Number.isFinite(error) ||
              error > maximumAllowedError ||
              (!reference.valid &&
                (output.positions[2 * row] !== 0 || output.positions[2 * row + 1] !== 0)) ||
              (baseline &&
                (output.positions[2 * row] !== baseline[2 * row] ||
                  output.positions[2 * row + 1] !== baseline[2 * row + 1]))
            )
              throw new Error(
                `CPU ${mode}: oracle changed or consumer output differs at row ${row}`
              );
            maximumObservedError = Math.max(maximumObservedError, error);
            checksum += output.positions[2 * row] + output.positions[2 * row + 1];
          }
        }
        return checksum;
      };
      execute();
      validate();
      referenceOutputs = outputs.map(output => output.positions.slice());
      const samples: number[] = [];
      for (let iteration = -warmupIterations; iteration < measuredIterations; iteration++) {
        const start = getProjectionBenchmarkTime();
        execute();
        if (iteration >= 0) samples.push(getProjectionBenchmarkTime() - start);
      }
      const checksum = validate();
      const durationMilliseconds = summarizeProjectionBenchmarkSamples(samples);
      return {
        api: variant?.api ?? 'scalar-allocating',
        layout: variant?.layout ?? 'coordinate-pairs',
        provider: variant?.provider ?? options.provider ?? 'caller-supplied oracle',
        scratchByteLength: batch?.scratchByteLength ?? 0,
        preparationTimeMilliseconds,
        maximumAllowedError,
        maximumObservedError,
        mode,
        outputEncoding: 'binary64',
        projectionsPerRow: intermediate ? 1 : consumerCount,
        outputByteLength: consumerCount * coordinates.length * 20,
        intermediateByteLength: intermediate ? coordinates.length * 20 : 0,
        validRows: expected.filter(result => result.valid).length,
        checksum,
        durationMilliseconds,
        coordinatesPerSecond: getProjectionBenchmarkThroughput(
          coordinates.length,
          durationMilliseconds.median
        )
      };
    })
  );
}
