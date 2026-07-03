// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import.meta.glob(
  [
    '../../modules/*/test/**/*.spec.ts',
    '../devtools/**/*.spec.ts',
    '../examples/**/*.spec.ts',
    '!../../modules/arrow/test/**/*.spec.ts',
    '!../../modules/arrow-layers/test/**/*.spec.ts',
    '!../../modules/constants/test/**/*.spec.ts',
    '!../../modules/core/test/**/*.spec.ts',
    '!../../modules/geoarrow/test/**/*.spec.ts',
    '!../../modules/tables/test/**/*.spec.ts',
    '!../../modules/test-utils/test/**/*.spec.ts',
    '!../../modules/text/test/**/*.spec.ts',
    '!../../modules/webgl/test/**/*.spec.ts',
    '!../../modules/webgpu/test/**/*.spec.ts',
    '!../../modules/**/test/**/*.node.spec.ts',
    '!../../modules/**/test/**/wip/**/*.spec.ts',
    '!../../modules/engine/test/geometry/gpu-geometry.spec.ts',
    '!../../modules/engine/test/shader-inputs-types.spec.ts',
    '!../../modules/shadertools/test/lib/uniform-types.spec.ts',
    '!../../modules/shadertools/test/modules/lighting/dirlight.spec.ts',
    '!../../modules/webgl/test/adapter/helpers/get-shader-layout.spec.ts'
  ],
  {eager: true}
);
