// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {registerTestDeviceCleanup} from './test-device-cleanup';

registerTestDeviceCleanup();

import.meta.glob(
  [
    '../../modules/core/test/adapter/resources/{buffer,command-encoder,compute-pipeline,fence,framebuffer,query-set,render-bundle,render-pipeline,sampler,shader}.spec.ts',
    '!../../modules/core/test/**/*.node.spec.ts'
  ],
  {eager: true}
);
