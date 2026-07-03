// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import './test-device-cleanup';

import.meta.glob(
  ['../../modules/text/test/**/*.spec.ts', '!../../modules/text/test/**/*.node.spec.ts'],
  {eager: true}
);
