// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import './test-device-cleanup';

import.meta.glob(
  ['../../modules/gltf/test/**/*.spec.ts', '!../../modules/gltf/test/**/*.node.spec.ts'],
  {eager: true}
);
