// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import.meta.glob(
  [
    '../../modules/engine/test/**/*.spec.ts',
    '!../../modules/engine/test/**/*.node.spec.ts',
    '!../../modules/engine/test/**/wip/**/*.spec.ts',
    '!../../modules/engine/test/compute/**/*.spec.ts',
    '!../../modules/engine/test/lib/model.spec.ts',
    '!../../modules/engine/test/passes/shader-pass-renderer.spec.ts',
    '!../../modules/engine/test/geometry/gpu-geometry.spec.ts',
    '!../../modules/engine/test/shader-inputs-types.spec.ts'
  ],
  {eager: true}
);
