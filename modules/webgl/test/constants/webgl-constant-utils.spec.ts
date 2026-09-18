// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {createGLKeyByValue, getGLKey, getGLKeys} from '../../src/constants';

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

it('getGLKey includes all names for overlapping values', () => {
  expect(getGLKey(0, keyByValue)).toBe('GL.POINTS, GL.ZERO, GL.NO_ERROR, GL.NONE');
});

it('getGLKey falls back for unknown values', () => {
  expect(getGLKey('unknown', keyByValue)).toBe('unknown');
  expect(getGLKey('unknown', keyByValue, {emptyIfUnknown: true})).toBe('');
});

it('getGLKeys formats overlapping parameter names and values', () => {
  expect(getGLKeys({0: 1}, keyByValue)).toEqual({
    '0:GL.POINTS, GL.ZERO, GL.NO_ERROR, GL.NONE': '1:GL.LINES, GL.ONE, GL.SYNC_FLUSH_COMMANDS_BIT'
  });
});
