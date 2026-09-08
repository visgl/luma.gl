// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {random} from '@luma.gl/shadertools';
import {expect, it} from 'vitest';

it('random#build', () => {
  expect(random.fs, 'random module fs is ok').toBeTruthy();
});
