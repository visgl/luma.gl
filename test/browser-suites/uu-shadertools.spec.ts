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
    '!../../modules/shadertools/test/lib/shader-assembly/assemble-shaders.spec.ts',
    '!../../modules/shadertools/test/lib/shader-assembly/inject-shader.spec.ts',
    '!../../modules/shadertools/test/lib/shader-module/project-layout-regression.spec.ts',
    '!../../modules/shadertools/test/lib/shader-transpiler/transpile-shader.spec.ts',
    '!../../modules/shadertools/test/lib/uniform-types.spec.ts',
    '!../../modules/shadertools/test/modules/engine/clip.spec.ts',
    '!../../modules/shadertools/test/modules/engine/filter.spec.ts',
    '!../../modules/shadertools/test/modules/engine/picking.spec.ts',
    '!../../modules/shadertools/test/modules/lighting/dirlight.spec.ts',
    '!../../modules/shadertools/test/modules/math/fp64-arithmetic-transform.spec.ts'
  ],
  {eager: true}
);
