// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// Shader transform tests create enough pipelines to exhaust a software WebGL context when
// combined with the full monorepo catch-all.
import.meta.glob(
  [
    '../../modules/shadertools/test/**/*.spec.ts',
    '!../../modules/shadertools/test/**/*.node.spec.ts',
    '!../../modules/shadertools/test/**/wip/**/*.spec.ts',
    '!../../modules/shadertools/test/lib/uniform-types.spec.ts',
    '!../../modules/shadertools/test/modules/lighting/dirlight.spec.ts'
  ],
  {eager: true}
);
