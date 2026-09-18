// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {createGLKeyByValue} from '../../src/constants/webgl-constant-utils';

const keyByValue = createGLKeyByValue({
  POINTS: 0,
  ZERO: 0,
  NO_ERROR: 0,
  NONE: 0,
  LINES: 1,
  ONE: 1,
  SYNC_FLUSH_COMMANDS_BIT: 1,
  drawingBufferWidth: 0,
  drawingBufferHeight: 0
});

it('createGLKeyByValue includes all names for overlapping values', () => {
  expect(keyByValue.get(0)).toBe('GL.POINTS, GL.ZERO, GL.NO_ERROR, GL.NONE');
  expect(keyByValue.get(1)).toBe('GL.LINES, GL.ONE, GL.SYNC_FLUSH_COMMANDS_BIT');
});
