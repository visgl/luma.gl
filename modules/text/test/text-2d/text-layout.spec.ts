// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
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

test('text layout helpers own atlas offsets, pages, kerning, and GPU definitions', t => {
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

  t.deepEqual(layout.startIndices, [0, 2, 4], 'row glyph starts are source-independent');
  t.deepEqual(
    Array.from(layout.glyphOffsets),
    [-1, 9, 5, 10, 2, 10, 6, 9],
    'layout applies atlas offsets and pair kerning'
  );
  t.deepEqual(Array.from(layout.glyphPages), [1, 2, 2, 1], 'layout retains atlas pages');
  t.deepEqual(Array.from(layout.rowAdvances), [10, 12], 'layout retains row advances');
  t.deepEqual(
    Array.from(layout.rowBounds),
    [-1, 9, 9, 16, 2, 9, 10, 16],
    'layout retains canonical row ink bounds'
  );
  t.deepEqual(Array.from(stream.glyphPages), [0, 1, 2], 'GPU definitions retain atlas pages');
  t.deepEqual(Array.from(stream.glyphKernings), [1, 2, -2, 0], 'GPU stream uses glyph kerning');
  t.deepEqual(
    Array.from(definitions.glyphLookup),
    [65, 1, 66, 2],
    'direct UTF-8 lookup uses the same glyph ids'
  );
  t.ok(characterSet.has('A') && characterSet.has('B'), 'layout collects encountered characters');
  t.end();
});

test('text layout and measurement share anchor and baseline semantics', t => {
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

  t.deepEqual(
    Array.from(layout.glyphOffsets),
    [-6, 14, 0, 15],
    'layout applies centered advance and top baseline offsets'
  );
  t.equal(metrics.advance, 10, 'measurement applies pair kerning to the final advance');
  t.equal(layout.rowAdvances[0], metrics.advance, 'layout and measurement share row advance');
  t.deepEqual(
    Array.from(layout.rowBounds),
    [...metrics.bounds.min, ...metrics.bounds.max],
    'layout and measurement share row bounds'
  );
  t.deepEqual(metrics.bounds, {min: [-6, 14], max: [4, 21]}, 'measurement returns ink bounds');
  t.deepEqual(
    measureFontAtlasText('', FONT_ATLAS).bounds,
    {min: [0, 0], max: [0, 0]},
    'empty text returns finite bounds'
  );
  t.end();
});

test('dictionary text layout is independent of dictionary storage format', t => {
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

  t.deepEqual(stream.startIndices, [0, 2, 3, 5, 5], 'rows reference shared dictionary runs');
  t.deepEqual(
    Array.from(stream.rowDictionaryIndices),
    [0, 1, 0, 0xffffffff],
    'empty rows use the invalid dictionary sentinel'
  );
  t.deepEqual(
    Array.from(stream.dictionaryGlyphRanges),
    [0, 2, 2, 3],
    'each dictionary value owns one glyph run'
  );
  t.deepEqual(
    Array.from(stream.dictionaryGlyphRecords),
    [
      packSignedInt16Pair(-1, 9),
      packGlyphPageAndId(1, 1),
      packSignedInt16Pair(5, 10),
      packGlyphPageAndId(2, 2),
      packSignedInt16Pair(-1, 9),
      packGlyphPageAndId(1, 1)
    ],
    'shared records use common text layout and page packing'
  );
  t.end();
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
