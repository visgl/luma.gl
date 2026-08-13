// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';

/** Portable or subgroup shader strategy shared by workgroup-local primitives. @internal */
export type GPUShaderSubgroupStrategy = 'portable' | 'subgroups';

/**
 * Selects subgroup shaders only when the device feature and logical subgroup indexing are present.
 *
 * The algorithms using this helper deliberately map subgroup lanes to their own logical workgroup
 * order instead of assuming a relationship with `local_invocation_index`.
 */
export function getGPUShaderSubgroupStrategy(device: Device): GPUShaderSubgroupStrategy {
  return device.features?.has('subgroups') && device.wgslLanguageFeatures?.has('subgroup_id')
    ? 'subgroups'
    : 'portable';
}

/** WGSL helpers for iterating the nonempty lanes in a subgroup ballot. @internal */
export function getSubgroupBallotHelpersWGSL(): string {
  return /* wgsl */ `
fn getFirstBallotLane(mask: vec4<u32>) -> u32 {
  if (mask.x != 0u) { return firstTrailingBit(mask.x); }
  if (mask.y != 0u) { return 32u + firstTrailingBit(mask.y); }
  if (mask.z != 0u) { return 64u + firstTrailingBit(mask.z); }
  if (mask.w != 0u) { return 96u + firstTrailingBit(mask.w); }
  return 0u;
}

fn getBallotLaneCount(mask: vec4<u32>) -> u32 {
  return countOneBits(mask.x) + countOneBits(mask.y) +
    countOneBits(mask.z) + countOneBits(mask.w);
}`;
}

/**
 * Coalesces equal subgroup keys into one unsigned atomic add per distinct key. @internal
 *
 * All invocations execute every collective uniformly. The optimized callers have at most 16
 * distinct keys, so a fixed loop avoids subgroup-uniformity analysis depending on ballot values.
 */
export function getSubgroupCoalescedAtomicAddWGSL(
  acceptedExpression: string,
  keyExpression: string,
  atomicArrayName: string,
  maximumDistinctKeyCount: number
): string {
  return /* wgsl */ `
  var subgroupPending = ${acceptedExpression};
  for (var subgroupGroup = 0u; subgroupGroup < ${maximumDistinctKeyCount}u; subgroupGroup++) {
    let pendingBallot = subgroupBallot(subgroupPending);
    let hasPending = any(pendingBallot != vec4<u32>(0u));
    let leaderInvocation = getFirstBallotLane(pendingBallot);
    let leaderKey = subgroupShuffle(${keyExpression}, leaderInvocation);
    let matchingKey = hasPending && subgroupPending && ${keyExpression} == leaderKey;
    let matchingBallot = subgroupBallot(matchingKey);
    if (hasPending && subgroupInvocationId == leaderInvocation) {
      atomicAdd(&${atomicArrayName}[leaderKey], getBallotLaneCount(matchingBallot));
    }
    subgroupPending = subgroupPending && !matchingKey;
  }`;
}
