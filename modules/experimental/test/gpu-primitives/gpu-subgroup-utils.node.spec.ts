// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import {describe, expect, test} from 'vitest';
import {
  getGPUShaderSubgroupStrategy,
  getSubgroupBallotHelpersWGSL,
  getSubgroupCoalescedAtomicAddWGSL
} from '../../src/gpu-primitives/gpu-subgroup-utils';

describe('GPU subgroup shader utilities', () => {
  test('requires only the capabilities used by each shader path', () => {
    expect(getGPUShaderSubgroupStrategy(makeDevice([], []))).toBe('portable');
    expect(getGPUShaderSubgroupStrategy(makeDevice(['subgroups'], []))).toBe('subgroups');
    expect(getGPUShaderSubgroupStrategy(makeDevice([], ['subgroup_id']))).toBe('portable');
    expect(
      getGPUShaderSubgroupStrategy(makeDevice(['subgroups'], []), {requiresSubgroupId: true})
    ).toBe('portable');
    expect(
      getGPUShaderSubgroupStrategy(makeDevice(['subgroups'], ['subgroup_id']), {
        requiresSubgroupId: true
      })
    ).toBe('subgroups');
  });

  test('bounds coalescing work by the caller-provided key count', () => {
    const source = getSubgroupCoalescedAtomicAddWGSL('accepted', 'binIndex', 'localCounts', 8);

    expect(source).toContain('subgroupGroup < 8u');
    expect(source).toContain('let hasPending = any(pendingBallot != vec4<u32>(0u));');
    expect(source).not.toContain('break;');
  });

  test('publishes ballot totals and exclusive lane ranks for atomic append allocation', () => {
    const source = getSubgroupBallotHelpersWGSL();

    expect(source).toContain('fn getBallotLaneCount(mask: vec4<u32>) -> u32');
    expect(source).toContain(
      'fn getBallotPrefixLaneCount(mask: vec4<u32>, invocation: u32) -> u32'
    );
    expect(source).toContain('mask[word] & lowerBits');
  });
});

function makeDevice(features: string[], wgslLanguageFeatures: string[]): Device {
  return {
    features: new Set(features),
    wgslLanguageFeatures: new Set(wgslLanguageFeatures)
  } as unknown as Device;
}
