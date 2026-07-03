// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import.meta.glob(
  [
    '../../modules/constants/test/**/*.spec.ts',
    '../../modules/core/test/**/*.spec.ts',
    '../../modules/test-utils/test/**/*.spec.ts',
    '../../modules/webgl/test/**/*.spec.ts',
    '../../modules/webgpu/test/**/*.spec.ts',
    '!../../modules/**/test/**/*.node.spec.ts',
    '!../../modules/**/test/**/wip/**/*.spec.ts',
    '!../../modules/core/test/shadertypes/shader-types.spec.ts',
    '!../../modules/webgl/test/adapter/helpers/get-shader-layout.spec.ts'
  ],
  {eager: true}
);
