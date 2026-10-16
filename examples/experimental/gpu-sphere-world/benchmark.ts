// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export type SphereBenchmark = {
  warmup: number;
  frames: number[];
  encoding: number[];
  gpu: number[];
  diagnosticSamples: number;
  maximumDroppedContacts: number;
  maximumInvalidBodies: number;
  samplingErrors: number;
  finishing: boolean;
};

export function createSphereBenchmark(): SphereBenchmark {
  return {
    warmup: 30,
    frames: [],
    encoding: [],
    gpu: [],
    diagnosticSamples: 0,
    maximumDroppedContacts: 0,
    maximumInvalidBodies: 0,
    samplingErrors: 0,
    finishing: false
  };
}

/** Benchmark frames never accrue playback time; slow playback retains at most eight steps. */
export function advanceSphereClock(
  accumulator: number,
  elapsed: number,
  speed: number,
  benchmarking: boolean
): {steps: number; accumulator: number} {
  if (benchmarking) return {steps: 1, accumulator: 0};
  const retained = Math.min(accumulator + elapsed * speed, 8 / 120);
  const steps = Math.floor(retained * 120);
  return {steps, accumulator: retained - steps / 120};
}

/** Bind asynchronous results to the run and phase captured when their GPU work was submitted. */
export function recordSphereBenchmarkSample(
  submittedRun: SphereBenchmark | undefined,
  currentRun: SphereBenchmark | undefined,
  measured: boolean,
  diagnostics: {droppedContacts: number; invalidBodies: number},
  gpuMilliseconds?: number
): void {
  if (!submittedRun || submittedRun !== currentRun) return;
  submittedRun.diagnosticSamples++;
  submittedRun.maximumDroppedContacts = Math.max(
    submittedRun.maximumDroppedContacts,
    diagnostics.droppedContacts
  );
  submittedRun.maximumInvalidBodies = Math.max(
    submittedRun.maximumInvalidBodies,
    diagnostics.invalidBodies
  );
  if (measured && gpuMilliseconds !== undefined) submittedRun.gpu.push(gpuMilliseconds);
}
