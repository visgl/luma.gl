import {expect, test} from 'vitest';
// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import { _warp as warp } from '@luma.gl/effects';
test('warp#build', () => {
  expect(warp.fs, 'warp module fs is ok').toBeTruthy();
});
