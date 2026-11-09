// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it, vi} from 'vitest';
import {buildMapping, nextPowOfTwo} from '../../../src/text/fonts/atlas/text-utils';

it('keeps an empty font atlas uploadable without changing packing cursors', () => {
  const measureText = vi.fn();
  expect(
    buildMapping({characterSet: new Set(), measureText, buffer: 4, maxCanvasWidth: 1024})
  ).toEqual({
    mapping: {},
    xOffset: 0,
    yOffsetMin: 0,
    yOffsetMax: 0,
    canvasHeight: 1
  });
  expect(measureText).not.toHaveBeenCalled();
  expect(nextPowOfTwo(0)).toBe(0);
});
