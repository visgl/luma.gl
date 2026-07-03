// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {registerTestDeviceCleanup} from './test-device-cleanup';

registerTestDeviceCleanup();

import.meta.glob(
  [
    '../../modules/*/test/**/*.spec.ts',
    '../devtools/**/*.spec.ts',
    '../examples/**/*.spec.ts',
    '!../../modules/**/test/**/*.node.spec.ts',
    '!../../modules/**/test/**/wip/**/*.spec.ts',
    '!../../modules/arrow/test/arrow/arrow-column-info.spec.ts',
    '!../../modules/arrow/test/arrow/get-arrow-data.spec.ts',
    '!../../modules/core/test/shadertypes/shader-types.spec.ts',
    '!../../modules/engine/test/geometry/gpu-geometry.spec.ts',
    '!../../modules/engine/test/shader-inputs-types.spec.ts',
    '!../../modules/shadertools/test/lib/uniform-types.spec.ts',
    '!../../modules/shadertools/test/modules/lighting/dirlight.spec.ts',
    '!../../modules/webgl/test/adapter/helpers/get-shader-layout.spec.ts'
  ],
  {eager: true}
);
