// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// These shader tests compile and execute enough transforms to warrant their own WebGL context.
import.meta.glob(
  [
    '../../modules/shadertools/test/lib/shader-assembly/assemble-shaders.spec.ts',
    '../../modules/shadertools/test/lib/shader-assembly/inject-shader.spec.ts',
    '../../modules/shadertools/test/lib/shader-module/project-layout-regression.spec.ts',
    '../../modules/shadertools/test/lib/shader-transpiler/transpile-shader.spec.ts',
    '../../modules/shadertools/test/modules/engine/clip.spec.ts',
    '../../modules/shadertools/test/modules/engine/filter.spec.ts',
    '../../modules/shadertools/test/modules/engine/picking.spec.ts',
    '../../modules/shadertools/test/modules/math/fp64-arithmetic-transform.spec.ts'
  ],
  {eager: true}
);
