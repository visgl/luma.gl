// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import type {BindingDeclaration} from '@luma.gl/core';
import {getWebGPUBindingVisibility} from '../../../src/adapter/resources/webgpu-pipeline-layout';

test('WebGPUPipelineLayout uses valid default visibility for writable storage buffers', t => {
  const writableStorage: BindingDeclaration = {
    name: 'fragments',
    type: 'storage',
    group: 0,
    location: 0
  };
  const readOnlyStorage: BindingDeclaration = {
    name: 'input',
    type: 'read-only-storage',
    group: 0,
    location: 1
  };

  t.equal(
    getWebGPUBindingVisibility(writableStorage),
    0x2 | 0x4,
    'writable storage defaults to fragment and compute visibility'
  );
  t.equal(
    getWebGPUBindingVisibility({...writableStorage, visibility: 0x2}),
    0x2,
    'explicit visibility remains authoritative'
  );
  t.equal(
    getWebGPUBindingVisibility(readOnlyStorage),
    0x1 | 0x2 | 0x4,
    'read-only storage retains all-stage default visibility'
  );

  t.end();
});
