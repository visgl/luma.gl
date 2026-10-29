// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export const BROWSER_TEST_GROUPS = ['general', 'compute', 'physics'] as const;
export type BrowserTestGroup = 'all' | (typeof BROWSER_TEST_GROUPS)[number];
export const PHYSICS_TEST_PATTERNS = ['modules/graph/test/gpu-physics/**/*.spec.{ts,js}'];
// Graph explorer exercises document/pointer state and retains full browser isolation.
export const COMPUTE_TEST_PATTERNS = [
  'modules/gpgpu/test/**/*.spec.{ts,js}',
  'modules/graph/test/**/!(gpu-graph-explorer).spec.{ts,js}'
];

export function getBrowserTestGroup(value: string | undefined): BrowserTestGroup {
  if (value === undefined || value === 'all') return 'all';
  if (value === 'general' || value === 'compute' || value === 'physics') return value;
  throw new Error(`Unknown browser test group: ${value}`);
}
