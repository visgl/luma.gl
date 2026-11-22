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
  maximumExhaustedCandidateBodies: number;
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
    maximumExhaustedCandidateBodies: 0,
    samplingErrors: 0,
    finishing: false
  };
}

/** Benchmark frames advance a single fixed step. Playback retains only one frame of work. */
export function advanceSphereClock(
  accumulator: number,
  elapsed: number,
  speed: number,
  benchmarking: boolean,
  timeStep = 1 / 120,
  maximumSteps = 8
): {steps: number; accumulator: number} {
  if (benchmarking) return {steps: 1, accumulator: 0};
  const retained = Math.min(accumulator + elapsed * speed, maximumSteps * timeStep);
  const steps = Math.min(maximumSteps, Math.floor(retained / timeStep));
  return {steps, accumulator: retained - steps * timeStep};
}

/** Bind asynchronous results to the run and phase captured when their GPU work was submitted. */
export function recordSphereBenchmarkSample(
  submittedRun: SphereBenchmark | undefined,
  currentRun: SphereBenchmark | undefined,
  measured: boolean,
  diagnostics: {droppedContacts: number; invalidBodies: number; exhaustedCandidateBodies?: number},
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
  submittedRun.maximumExhaustedCandidateBodies = Math.max(
    submittedRun.maximumExhaustedCandidateBodies,
    diagnostics.exhaustedCandidateBodies ?? 0
  );
  if (measured && gpuMilliseconds !== undefined) submittedRun.gpu.push(gpuMilliseconds);
}
