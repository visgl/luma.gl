// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {
  buildTextGlyphLayout,
  measureFontAtlasText,
  type FontAtlas,
  type TextCodePointSource
} from '../../src/index';
import {
  buildTextGpuDictionaryCompressedStream,
  buildTextGpuExpandedStream,
  buildTextGpuGlyphDefinitions,
  type TextDictionaryCodePointSource
} from '../../src/text-2d/experimental';
import {createTextKerning} from '../../src/text-2d/atlas/text-utils';

const FONT_ATLAS: FontAtlas = {
  baselineOffset: 1,
  lineHeight: 10,
  xOffset: 0,
  yOffsetMin: 0,
  yOffsetMax: 10,
  mapping: {
    A: {
      x: 0,
      y: 0,
      width: 4,
      height: 6,
      atlasPage: 1,
      anchorX: 2,
      anchorY: 3,
      layoutOffsetX: -1,
      layoutOffsetY: 3,
      advance: 5
    },
    B: {
      x: 4,
      y: 0,
      width: 4,
      height: 6,
      atlasPage: 2,
      anchorX: 2,
      anchorY: 3,
      layoutOffsetX: 2,
      layoutOffsetY: 4,
      advance: 7
    }
  },
  kerning: createTextKerning([{first: 65, second: 66, amount: -2}]),
  renderSettings: {mode: 'bitmap', threshold: 0.5, smoothing: 0},
  pages: [],
  width: 16,
  height: 16
};

it('text layout helpers own atlas offsets, pages, kerning, and GPU definitions', () => {
  const source = makeTextCodePointSource([
    [65, 66],
    [66, 65]
  ]);
  const characterSet = new Set<string>();
  const layout = buildTextGlyphLayout(source, {fontAtlas: FONT_ATLAS, characterSet});
  const stream = buildTextGpuExpandedStream(source, {fontAtlas: FONT_ATLAS});
  const definitions = buildTextGpuGlyphDefinitions(new Set(['AB']), {
    fontAtlas: FONT_ATLAS
  });

  expect(layout.startIndices, 'row glyph starts are source-independent').toEqual([0, 2, 4]);
  expect(Array.from(layout.glyphOffsets), 'layout applies atlas offsets and pair kerning').toEqual([
    -1, 9, 5, 10, 2, 10, 6, 9
  ]);
  expect(Array.from(layout.glyphPages), 'layout retains atlas pages').toEqual([1, 2, 2, 1]);
  expect(Array.from(layout.rowAdvances), 'layout retains row advances').toEqual([10, 12]);
  expect(Array.from(layout.rowBounds), 'layout retains canonical row ink bounds').toEqual([
    -1, 9, 9, 16, 2, 9, 10, 16
  ]);
  expect(Array.from(stream.glyphPages), 'GPU definitions retain atlas pages').toEqual([0, 1, 2]);
  expect(Array.from(stream.glyphKernings), 'GPU stream uses glyph kerning').toEqual([1, 2, -2, 0]);
  expect(
    Array.from(definitions.glyphLookup),
    'direct UTF-8 lookup uses the same glyph ids'
  ).toEqual([65, 1, 66, 2]);
  expect(
    Boolean(characterSet.has('A') && characterSet.has('B')),
    'layout collects encountered characters'
  ).toBe(true);
  void 0;
});

it('text layout and measurement share anchor and baseline semantics', () => {
  const source = makeTextCodePointSource([[65, 66]]);
  const layout = buildTextGlyphLayout(source, {
    fontAtlas: FONT_ATLAS,
    textAnchor: 'middle',
    alignmentBaseline: 'top'
  });
  const metrics = measureFontAtlasText('AB', FONT_ATLAS, {
    textAnchor: 'middle',
    alignmentBaseline: 'top'
  });

  expect(
    Array.from(layout.glyphOffsets),
    'layout applies centered advance and top baseline offsets'
  ).toEqual([-6, 14, 0, 15]);
  expect(metrics.advance, 'measurement applies pair kerning to the final advance').toBe(10);
  expect(layout.rowAdvances[0], 'layout and measurement share row advance').toBe(metrics.advance);
  expect(Array.from(layout.rowBounds), 'layout and measurement share row bounds').toEqual([
    ...metrics.bounds.min,
    ...metrics.bounds.max
  ]);
  expect(metrics.bounds, 'measurement returns ink bounds').toEqual({min: [-6, 14], max: [4, 21]});
  expect(measureFontAtlasText('', FONT_ATLAS).bounds, 'empty text returns finite bounds').toEqual({
    min: [0, 0],
    max: [0, 0]
  });
  void 0;
});

it('dictionary text layout is independent of dictionary storage format', () => {
  const dictionaryValues = [[65, 66], [65]];
  const rowDictionaryIndices = [0, 1, 0, -1];
  const source: TextDictionaryCodePointSource = {
    rowCount: rowDictionaryIndices.length,
    dictionaryValueCount: dictionaryValues.length,
    getRowDictionaryIndex: rowIndex => rowDictionaryIndices[rowIndex] ?? -1,
    visitDictionaryCodePoints: (dictionaryIndex, visitCodePoint) => {
      for (const codePoint of dictionaryValues[dictionaryIndex] ?? []) {
        visitCodePoint(codePoint);
      }
    }
  };
  const stream = buildTextGpuDictionaryCompressedStream(source, {fontAtlas: FONT_ATLAS});

  expect(stream.startIndices, 'rows reference shared dictionary runs').toEqual([0, 2, 3, 5, 5]);
  expect(
    Array.from(stream.rowDictionaryIndices),
    'empty rows use the invalid dictionary sentinel'
  ).toEqual([0, 1, 0, 0xffffffff]);
  expect(
    Array.from(stream.dictionaryGlyphRanges),
    'each dictionary value owns one glyph run'
  ).toEqual([0, 2, 2, 3]);
  expect(
    Array.from(stream.dictionaryGlyphRecords),
    'shared records use common text layout and page packing'
  ).toEqual([
    packSignedInt16Pair(-1, 9),
    packGlyphPageAndId(1, 1),
    packSignedInt16Pair(5, 10),
    packGlyphPageAndId(2, 2),
    packSignedInt16Pair(-1, 9),
    packGlyphPageAndId(1, 1)
  ]);
  void 0;
});

function makeTextCodePointSource(rows: readonly (readonly number[])[]): TextCodePointSource {
  return {
    rowCount: rows.length,
    countCodePoints: rowIndex => rows[rowIndex]?.length ?? 0,
    visitCodePoints: (rowIndex, visitCodePoint) => {
      for (const codePoint of rows[rowIndex] ?? []) {
        visitCodePoint(codePoint);
      }
    }
  };
}

function packSignedInt16Pair(lowerValue: number, upperValue: number): number {
  return ((upperValue & 0xffff) << 16) | (lowerValue & 0xffff);
}

function packGlyphPageAndId(glyphId: number, atlasPage: number): number {
  return ((atlasPage & 0xffff) << 16) | (glyphId & 0xffff);
}
