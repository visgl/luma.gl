// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {buildMapping, nextPowOfTwo} from '../../src/index';

it('text-2d mapping helpers preserve deck-compatible packing behavior', () => {
  const {mapping, xOffset, yOffsetMin, yOffsetMax, canvasHeight} = buildMapping({
    characterSet: new Set('abcd'),
    measureText: character => ({
      advance: character.charCodeAt(0) - 96,
      width: character.charCodeAt(0) - 96,
      ascent: 3,
      descent: 1
    }),
    buffer: 2,
    maxCanvasWidth: 16
  });

  expect(nextPowOfTwo(5), 'power-of-two helper matches atlas sizing expectations').toBe(8);
  expect(xOffset, 'x offset matches deck packing').toBe(15);
  expect(yOffsetMin, 'row min y matches deck packing').toBe(8);
  expect(yOffsetMax, 'row max y matches deck packing').toBe(16);
  expect(canvasHeight, 'canvas height rounds to a power of two').toBe(16);
  expect(mapping.d, '').toEqual({
    x: 9,
    y: 10,
    width: 4,
    height: 4,
    atlasPage: 0,
    advance: 4,
    anchorX: 2,
    anchorY: 3,
    layoutOffsetX: 0,
    layoutOffsetY: -3
  });
  void 0;
});

it('text-2d mapping aligns glyphs to a shared baseline', () => {
  const {mapping} = buildMapping({
    characterSet: new Set('ag'),
    measureText: character => ({
      advance: 4,
      width: 4,
      ascent: character === 'g' ? 2 : 3,
      descent: character === 'g' ? 2 : 1
    }),
    buffer: 1,
    maxCanvasWidth: 32
  });

  expect(mapping.a?.layoutOffsetY, 'non-descender top is offset by its ascent').toBe(-3);
  expect(mapping.g?.layoutOffsetY, 'descender top is offset by its ascent').toBe(-2);
  expect(
    (mapping.a?.layoutOffsetY ?? 0) + (mapping.a?.height ?? 0),
    'non-descender bottom uses its descent'
  ).toBe(1);
  expect(
    (mapping.g?.layoutOffsetY ?? 0) + (mapping.g?.height ?? 0),
    'descender extends below the shared baseline'
  ).toBe(2);
  void 0;
});
