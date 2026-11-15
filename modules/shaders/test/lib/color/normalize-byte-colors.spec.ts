// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

// Also exercise native Float16Array in browsers that provide it.
import './normalize-byte-colors.node.spec';

import {expect, it} from 'vitest';
import {
  normalizeByteColor3,
  normalizeByteColor4
} from '../../../src/lib/color/normalize-byte-colors';

it('normalizes and borrows typed colors from another window', () => {
  const iframe = document.createElement('iframe');
  document.body.append(iframe);
  try {
    const otherWindow = iframe.contentWindow as Window & typeof globalThis;
    for (const Constructor of [otherWindow.Uint8Array, otherWindow.Uint8ClampedArray]) {
      const color = new Constructor([255, 128, 0]);
      expect(normalizeByteColor3(color, false)).toEqual([1, 128 / 255, 0]);
      expect(normalizeByteColor4(color, false)).toEqual([1, 128 / 255, 0, 1]);
    }
    const color = new otherWindow.Float32Array([1, 0.5, 0, 0]);
    expect(normalizeByteColor4(color)).toBe(color);
    const rgb = new otherWindow.Float64Array([1, 0.5, 0]);
    expect(normalizeByteColor3(rgb)).toBe(rgb);
  } finally {
    iframe.remove();
  }
});
