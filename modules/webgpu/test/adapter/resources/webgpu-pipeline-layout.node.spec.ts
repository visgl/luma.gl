// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import type {BindingDeclaration} from '@luma.gl/core';
import {getWebGPUBindingVisibility} from '../../../src/adapter/resources/webgpu-pipeline-layout';

it('WebGPUPipelineLayout uses valid default visibility for writable storage buffers', () => {
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

  expect(
    getWebGPUBindingVisibility(writableStorage),
    'writable storage defaults to fragment and compute visibility'
  ).toBe(0x2 | 0x4);
  expect(
    getWebGPUBindingVisibility({...writableStorage, visibility: 0x2}),
    'explicit visibility remains authoritative'
  ).toBe(0x2);
  expect(
    getWebGPUBindingVisibility(readOnlyStorage),
    'read-only storage retains all-stage default visibility'
  ).toBe(0x1 | 0x2 | 0x4);

  void 0;
});
