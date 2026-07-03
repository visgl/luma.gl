// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import './test-device-cleanup';

import.meta.glob(
  [
    '../../modules/test-utils/test/**/*.spec.ts',
    '!../../modules/test-utils/test/**/*.node.spec.ts'
  ],
  {eager: true}
);
