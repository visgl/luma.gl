// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {getGLKey, getGLKeys, GL} from '../../src/constants';

it('getGLKey includes all names for overlapping values', () => {
  expect(getGLKey(0)).toBe('GL.POINTS, GL.ZERO, GL.NO_ERROR, GL.NONE');
});

it('getGLKey falls back for unknown values', () => {
  expect(getGLKey('unknown')).toBe('unknown');
  expect(getGLKey('unknown', {emptyIfUnknown: true})).toBe('');
});

it('getGLKeys formats overlapping parameter names and values', () => {
  expect(getGLKeys({[GL.ZERO]: GL.ONE})).toEqual({
    '0:GL.POINTS, GL.ZERO, GL.NO_ERROR, GL.NONE': '1:GL.LINES, GL.ONE, GL.SYNC_FLUSH_COMMANDS_BIT'
  });
});
