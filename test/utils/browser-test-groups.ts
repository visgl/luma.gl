// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export const BROWSER_TEST_GROUPS = ['general', 'compute', 'physics'] as const;
export type BrowserTestGroup =
  | 'all'
  | 'release'
  | 'physics-endurance'
  | 'render-conformance'
  | (typeof BROWSER_TEST_GROUPS)[number];
export const PHYSICS_ENDURANCE_TEST_PATTERNS = [
  'modules/graph/test/gpu-physics/domino-spiral.spec.ts',
  'modules/graph/test/gpu-physics/rigid-body-block-contacts-endurance.spec.ts',
  'modules/graph/test/gpu-physics/rigid-body-difficult-stacks.spec.ts',
  'modules/graph/test/gpu-physics/rigid-body-mass-ratio-stacks.spec.ts',
  'modules/graph/test/gpu-physics/rigid-body-offset-stacks.spec.ts',
  'modules/graph/test/gpu-physics/rigid-body-stack-stability-endurance.spec.ts',
  'modules/graph/test/gpu-physics/rigid-body-rotating-contact-endurance.spec.ts'
];
/** Full material transport matrices run nightly and when their implementation changes. */
export const RENDER_CONFORMANCE_TEST_PATTERNS = [
  'modules/engine/test/gltf/gltf/gltf-area-lights-render.spec.ts',
  'modules/three/test/geographic-renderer.spec.ts',
  'modules/anari/test/engine/ray-tracing-image-export.spec.ts',
  'modules/anari/test/engine/ray-material-anisotropy-bounce.spec.ts',
  'modules/anari/test/engine/ray-material-sheen-bounce.spec.ts',
  'modules/three/test/animated-renderer.spec.ts',
  'modules/anari/test/anari-reflection.spec.ts',
  'modules/three/test/physical-renderer.spec.ts',
  'modules/anari/test/anari-emitter-sampling-conformance.spec.ts',
  'modules/anari/test/engine/ray-alpha-pixels.spec.ts',
  'modules/anari/test/engine/ray-material-alpha-blend.spec.ts',
  'modules/anari/test/engine/ray-material-alpha-blend-shadow.spec.ts',
  'modules/anari/test/engine/ray-material-dispersion.spec.ts',
  'modules/anari/test/engine/ray-material-rough-dielectric.spec.ts',
  'modules/anari/test/engine/ray-material-sidedness.spec.ts',
  'modules/anari/test/engine/ray-secondary-emitter-mis.spec.ts',
  'modules/anari/test/engine/ray-environment-lighting.spec.ts',
  'modules/anari/test/engine/ray-material-occlusion.spec.ts',
  'modules/anari/test/engine/ray-secondary-texture-filtering.spec.ts',
  'modules/anari/test/engine/ray-material-iridescence.spec.ts',
  'modules/anari/test/engine/ray-material-anisotropy.spec.ts',
  'modules/anari/test/engine/ray-material-sheen.spec.ts',
  'modules/anari/test/engine/ray-material-maps.spec.ts',
  'modules/anari/test/engine/ray-material-normals.spec.ts',
  'modules/anari/test/engine/ray-material-dielectrics.spec.ts',
  'modules/anari/test/engine/ray-material-diffuse-transmission.spec.ts'
];
export const PHYSICS_TEST_PATTERNS = ['modules/graph/test/gpu-physics/**/*.spec.{ts,js}'];
// Graph explorer exercises document/pointer state and retains full browser isolation.
export const COMPUTE_TEST_PATTERNS = ['modules/graph/test/**/!(gpu-graph-explorer).spec.{ts,js}'];

export function getBrowserTestGroup(value: string | undefined): BrowserTestGroup {
  if (value === undefined || value === 'all') return 'all';
  if (value === 'physics-endurance' || value === 'render-conformance' || value === 'release')
    return value;
  if (value === 'general' || value === 'compute' || value === 'physics') return value;
  throw new Error(`Unknown browser test group: ${value}`);
}

/** Keep application-scale simulation qualification in physics CI, outside npm release gates. */
export function getReleaseQualificationExcludes(group: BrowserTestGroup): string[] {
  return group === 'release' ? PHYSICS_ENDURANCE_TEST_PATTERNS : [];
}
