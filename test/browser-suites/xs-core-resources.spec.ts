// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import.meta.glob(
  [
    '../../modules/core/test/adapter/resources/**/*.spec.ts',
    '!../../modules/core/test/adapter/resources/buffer.spec.ts',
    '!../../modules/core/test/adapter/resources/command-encoder.spec.ts',
    '!../../modules/core/test/adapter/resources/compute-pipeline.spec.ts',
    '!../../modules/core/test/adapter/resources/texture.spec.ts'
  ],
  {eager: true}
);
