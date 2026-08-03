// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {buildMapping, nextPowOfTwo} from '../../src/index';

test('text-2d mapping helpers preserve deck-compatible packing behavior', t => {
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

  t.equal(nextPowOfTwo(5), 8, 'power-of-two helper matches atlas sizing expectations');
  t.equal(xOffset, 15, 'x offset matches deck packing');
  t.equal(yOffsetMin, 8, 'row min y matches deck packing');
  t.equal(yOffsetMax, 16, 'row max y matches deck packing');
  t.equal(canvasHeight, 16, 'canvas height rounds to a power of two');
  t.deepEqual(mapping.d, {
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
  t.end();
});

test('text-2d mapping aligns glyphs to a shared baseline', t => {
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

  t.equal(mapping.a?.layoutOffsetY, -3, 'non-descender top is offset by its ascent');
  t.equal(mapping.g?.layoutOffsetY, -2, 'descender top is offset by its ascent');
  t.equal(
    (mapping.a?.layoutOffsetY ?? 0) + (mapping.a?.height ?? 0),
    1,
    'non-descender bottom uses its descent'
  );
  t.equal(
    (mapping.g?.layoutOffsetY ?? 0) + (mapping.g?.height ?? 0),
    2,
    'descender extends below the shared baseline'
  );
  t.end();
});
