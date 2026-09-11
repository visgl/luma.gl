// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';

export type GPUStrategyDecision<Id extends string = string, Details = unknown> = {
  /** Stable implementation identifier. */
  id: Id;
  /** Higher scores are preferred. */
  score: number;
  /** Human-readable explanation for inspector/debug output. */
  reason: string;
  /** Operation-specific execution details. */
  details: Details;
};

export type GPUStrategyCandidate<Id extends string, Workload, Details> = {
  id: Id;
  isSupported?: (context: {device: Device; workload: Workload}) => boolean;
  score: (context: {device: Device; workload: Workload}) => number;
  reason: (context: {device: Device; workload: Workload}) => string;
  createDetails: (context: {device: Device; workload: Workload}) => Details;
};

/**
 * Deterministically selects one implementation strategy for a GPU workload.
 *
 * Strategies expose policy without leaking it into public algorithm APIs. Today scores are
 * heuristic; later the same candidate contract can be fed by cached autotuning measurements.
 */
export function selectGPUStrategy<Id extends string, Workload, Details>(props: {
  device: Device;
  workload: Workload;
  candidates: readonly GPUStrategyCandidate<Id, Workload, Details>[];
  preferredId?: Id;
}): GPUStrategyDecision<Id, Details> {
  if (props.candidates.length === 0) throw new Error('GPU strategy candidate list must not be empty');
  const context = {device: props.device, workload: props.workload};
  const supported = props.candidates.filter(candidate => candidate.isSupported?.(context) ?? true);
  if (supported.length === 0) throw new Error('no supported GPU strategy candidate');

  if (props.preferredId) {
    const preferred = supported.find(candidate => candidate.id === props.preferredId);
    if (!preferred) throw new Error(`preferred GPU strategy "${props.preferredId}" is not supported`);
    return freezeDecision(preferred, context);
  }

  let best = supported[0];
  let bestScore = best.score(context);
  for (let index = 1; index < supported.length; index++) {
    const candidate = supported[index];
    const score = candidate.score(context);
    if (score > bestScore) {
      best = candidate;
      bestScore = score;
    }
  }
  return freezeDecision(best, context, bestScore);
}

function freezeDecision<Id extends string, Workload, Details>(
  candidate: GPUStrategyCandidate<Id, Workload, Details>,
  context: {device: Device; workload: Workload},
  score = candidate.score(context)
): GPUStrategyDecision<Id, Details> {
  return Object.freeze({
    id: candidate.id,
    score,
    reason: candidate.reason(context),
    details: Object.freeze(candidate.createDetails(context)) as Details
  });
}
