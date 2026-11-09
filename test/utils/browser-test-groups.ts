// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export const BROWSER_TEST_GROUPS = ['general', 'compute', 'physics'] as const;
export type BrowserTestGroup =
  | 'all'
  | 'release'
  | 'physics-endurance'
  | (typeof BROWSER_TEST_GROUPS)[number];
export const PHYSICS_ENDURANCE_TEST_PATTERNS = [
  'modules/graph/test/gpu-physics/rigid-body-difficult-stacks.spec.ts',
  'modules/graph/test/gpu-physics/rigid-body-mass-ratio-stacks.spec.ts',
  'modules/graph/test/gpu-physics/rigid-body-offset-stacks.spec.ts',
  'modules/graph/test/gpu-physics/rigid-body-stack-stability-endurance.spec.ts',
  'modules/graph/test/gpu-physics/rigid-body-rotating-contact-endurance.spec.ts'
];
export const PHYSICS_TEST_PATTERNS = ['modules/graph/test/gpu-physics/**/*.spec.{ts,js}'];
export const PHYSICS_QUALIFICATION_TEST_PATTERNS = [
  ...PHYSICS_ENDURANCE_TEST_PATTERNS,
  'modules/graph/test/gpu-physics/domino-spiral.spec.ts'
];
// Graph explorer exercises document/pointer state and retains full browser isolation.
export const COMPUTE_TEST_PATTERNS = ['modules/graph/test/**/!(gpu-graph-explorer).spec.{ts,js}'];

export function getBrowserTestGroup(value: string | undefined): BrowserTestGroup {
  if (value === undefined || value === 'all') return 'all';
  if (value === 'physics-endurance' || value === 'release') return value;
  if (value === 'general' || value === 'compute' || value === 'physics') return value;
  throw new Error(`Unknown browser test group: ${value}`);
}

/** Keep application-scale simulation qualification in physics CI, outside npm release gates. */
export function getReleaseQualificationExcludes(group: BrowserTestGroup): string[] {
  return group === 'release' ? PHYSICS_QUALIFICATION_TEST_PATTERNS : [];
}
