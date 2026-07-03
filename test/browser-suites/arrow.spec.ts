// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import './test-device-cleanup';

import.meta.glob(
  [
    '../../modules/arrow/test/**/*.spec.ts',
    '!../../modules/arrow/test/**/*.node.spec.ts',
    '!../../modules/arrow/test/arrow/arrow-column-info.spec.ts',
    '!../../modules/arrow/test/arrow/get-arrow-data.spec.ts'
  ],
  {eager: true}
);
