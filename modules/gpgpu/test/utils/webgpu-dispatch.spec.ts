// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {getWebGPUDispatchLayout} from '../../src/operations/webgpu/common/dispatch';

test('getWebGPUDispatchLayout expands into y when workgroups exceed x capacity', () => {
  expect(getWebGPUDispatchLayout(5, 4)).toEqual({x: 4, y: 2, z: 1});
});

test('getWebGPUDispatchLayout expands into z when workgroups exceed x and y capacity', () => {
  expect(getWebGPUDispatchLayout(17, 4)).toEqual({x: 4, y: 4, z: 2});
});

test('getWebGPUDispatchLayout rejects counts beyond the 3D dispatch limit', () => {
  expect(() => getWebGPUDispatchLayout(65, 4)).toThrow(/exceeding the 3D dispatch limit/);
});
