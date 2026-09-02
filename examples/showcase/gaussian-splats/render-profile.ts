// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export type GaussianSplatRenderEnvironment = {
  coarsePointer: boolean;
  maxTouchPoints: number;
};

export type GaussianSplatRenderProfile = {
  isMobile: boolean;
  maxConcurrentPageLoads: number;
  maxDecodeWorkers: number;
  maxResidentSplatCount: number;
  maxTraversalRows: number;
};

/** Keeps mobile decoding, residency, and main-thread hierarchy work within conservative budgets. */
export function makeGaussianSplatRenderProfile({
  coarsePointer,
  maxTouchPoints
}: GaussianSplatRenderEnvironment): GaussianSplatRenderProfile {
  const isMobile = coarsePointer && maxTouchPoints > 0;
  return isMobile
    ? {
        isMobile,
        maxConcurrentPageLoads: 2,
        maxDecodeWorkers: 1,
        maxResidentSplatCount: 250_000,
        maxTraversalRows: 2047
      }
    : {
        isMobile,
        maxConcurrentPageLoads: 4,
        maxDecodeWorkers: 2,
        maxResidentSplatCount: 1_000_000,
        maxTraversalRows: 8191
      };
}
