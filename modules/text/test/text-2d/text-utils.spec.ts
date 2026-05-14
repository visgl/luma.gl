// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {
  buildMapping,
  getTextFromBuffer,
  nextPowOfTwo,
  transformParagraph,
  type CharacterMapping
} from '../../src/index';

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
    advance: 4,
    anchorX: 2,
    anchorY: 3
  });
  t.end();
});

test('transformParagraph and getTextFromBuffer preserve deck-compatible layout behavior', t => {
  const mapping: CharacterMapping = {
    a: {width: 1, height: 4, advance: 2, anchorX: 0.5, anchorY: 3, x: 0, y: 0},
    b: {width: 2, height: 4, advance: 3, anchorX: 1, anchorY: 3, x: 0, y: 0},
    c: {width: 3, height: 4, advance: 4, anchorX: 1.5, anchorY: 3, x: 0, y: 0}
  };
  const transformed = transformParagraph('ab\nc', 1, 4, null, null, mapping);
  t.deepEqual(transformed, {
    x: [0.5, 3, 0, 1.5],
    y: [3, 3, 0, 7],
    rowWidth: [5, 5, 0, 4],
    size: [5, 8]
  });

  const value = new Uint8Array([72, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100, 33]);
  const result = getTextFromBuffer({value, length: 2, startIndices: [0, 6]});
  t.deepEqual(result.texts, ['Hello ', 'world!'], 'binary text decoding matches deck contract');
  t.equal(result.characterCount, 12, 'binary character count matches input');
  t.end();
});
