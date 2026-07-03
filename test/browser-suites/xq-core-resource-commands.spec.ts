// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// Command and buffer resource tests exercise the shared backend command lifecycle together.
import.meta.glob(
  [
    '../../modules/core/test/adapter/resources/buffer.spec.ts',
    '../../modules/core/test/adapter/resources/command-encoder.spec.ts',
    '../../modules/core/test/adapter/resources/compute-pipeline.spec.ts'
  ],
  {eager: true}
);
