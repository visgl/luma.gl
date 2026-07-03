// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import './test-device-cleanup';

import.meta.glob(
  [
    '../../modules/engine/test/**/*.spec.ts',
    '!../../modules/engine/test/**/*.node.spec.ts',
    '!../../modules/engine/test/geometry/gpu-geometry.spec.ts',
    '!../../modules/engine/test/shader-inputs-types.spec.ts'
  ],
  {eager: true}
);
