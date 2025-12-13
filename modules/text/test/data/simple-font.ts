// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Adapted from THREE.js font data format.

import {type TypefaceFontData} from '../../src/font'

/** Minimal typeface JSON used for text geometry tests. */
export const simpleFont: TypefaceFontData = {
  familyName: 'SimpleTest',
  resolution: 1000,
  boundingBox: {
    yMin: 0,
    yMax: 10
  },
  underlineThickness: 1,
  glyphs: {
    A: {
      ha: 12,
      o: 'm 0 0 l 0 10 l 10 10 l 10 0 l 0 0 m 3 3 l 7 3 l 7 7 l 3 7 l 3 3'
    },
    '?': {
      ha: 12,
      o: 'm 0 0 l 0 10 l 10 10 l 10 0 l 0 0'
    }
  }
}
