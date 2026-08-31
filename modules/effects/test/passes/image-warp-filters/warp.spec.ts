// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {_warp as warp} from '@luma.gl/effects';
import {expect, it} from 'vitest';

it('warp#build', () => {
  expect(Boolean(warp.fs), 'warp module fs is ok').toBe(true);
  void 0;
});
