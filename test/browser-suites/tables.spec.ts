// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import './test-device-cleanup';

import.meta.glob(
  ['../../modules/tables/test/**/*.spec.ts', '!../../modules/tables/test/**/*.node.spec.ts'],
  {eager: true}
);
