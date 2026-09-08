// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import * as arrow from 'apache-arrow';
import {
  buildArrowGlyphLayout,
  buildArrowUtf8Chunks,
  buildGpuTextDictionaryCompressedStream,
  buildGpuTextDictionaryUtf8Input,
  buildGpuExpandedTextStream,
  buildGpuUtf8TextInput,
  createArrowUtf8TextIndexAccessor,
  decodeArrowUtf8CodePoints,
  populateUtf8TextIndices,
  type ArrowUtf8Dictionary
} from '@luma.gl/arrow';
import type {CharacterMapping, FontAtlas, TextKerning} from '../../src/index';
import {createTextKerning} from '../../src/text-2d/atlas/text-utils';

type TextDatum = {
  rowIndex: number;
};

it('createArrowUtf8TextIndexAccessor mutates the caller target', () => {
  const texts = arrow.vectorFromArray(['ASCII', 'e', '🙂', ''], new arrow.Utf8());
  const accessor = createArrowUtf8TextIndexAccessor<TextDatum>(texts, datum => datum.rowIndex);
  const target = {startIndex: -1, endIndex: -1};

  const firstResult = accessor({rowIndex: 0}, {index: 0, target});
  expect(firstResult, 'returns the caller target').toBe(target);
  expect([target.startIndex, target.endIndex], 'ASCII row range matches bytes').toEqual([0, 5]);

  accessor({rowIndex: 2}, {index: 1, target});
  expect([target.startIndex, target.endIndex], 'emoji row range matches bytes').toEqual([6, 10]);

  accessor({rowIndex: 3}, {index: 2, target});
  expect([target.startIndex, target.endIndex], 'empty row range is empty').toEqual([10, 10]);
  void 0;
});

it('Arrow UTF-8 chunks handle chunked, sliced, and null rows', () => {
  const firstChunk = arrow.vectorFromArray(['a', 'bb'], new arrow.Utf8());
  const secondChunk = arrow.vectorFromArray(['ccc', 'dddd'], new arrow.Utf8());
  const chunked = new arrow.Vector<arrow.Utf8>([firstChunk.data[0]!, secondChunk.data[0]!]);
  const chunks = buildArrowUtf8Chunks(chunked);
  const target = {startIndex: 0, endIndex: 0};

  populateUtf8TextIndices(chunks, 2, target);
  expect([target.startIndex, target.endIndex], 'chunked row bytes are normalized').toEqual([3, 6]);

  const source = arrow.vectorFromArray(['skip', null, 'kept'], new arrow.Utf8());
  const sliced = source.slice(1) as arrow.Vector<arrow.Utf8>;
  const slicedChunks = buildArrowUtf8Chunks(sliced);
  populateUtf8TextIndices(slicedChunks, 0, target);
  expect([target.startIndex, target.endIndex], 'null rows are empty').toEqual([0, 0]);
  populateUtf8TextIndices(slicedChunks, 1, target);
  expect([target.startIndex, target.endIndex], 'sliced rows keep local offsets').toEqual([0, 4]);
  void 0;
});

it('decodeArrowUtf8CodePoints and buildArrowGlyphLayout preserve Unicode glyph counts', () => {
  const texts = arrow.vectorFromArray(['AB', '🙂'], new arrow.Utf8());
  const chunks = buildArrowUtf8Chunks(texts);
  const target = {startIndex: 0, endIndex: 0};
  const decoded: string[] = [];
  populateUtf8TextIndices(chunks, 1, target);
  const decodedCount = decodeArrowUtf8CodePoints(
    chunks,
    target.startIndex,
    target.endIndex,
    codePoint => decoded.push(String.fromCodePoint(codePoint))
  );
  expect(decodedCount, 'emoji decodes as one code point').toBe(1);
  expect(decoded, 'emoji code point round-trips').toEqual(['🙂']);

  const mapping: CharacterMapping = {
    A: {x: 0, y: 0, width: 4, height: 6, anchorX: 2, anchorY: 3, advance: 5},
    B: {x: 4, y: 0, width: 4, height: 6, anchorX: 2, anchorY: 3, advance: 7},
    '🙂': {x: 8, y: 0, width: 8, height: 8, anchorX: 4, anchorY: 4, advance: 9}
  };
  const characterSet = new Set<string>();
  const layout = buildArrowGlyphLayout({
    texts,
    fontAtlas: makeFontAtlas(mapping),
    characterSet
  });

  expect(layout.startIndices, 'start indices count code points').toEqual([0, 2, 3]);
  expect(layout.glyphCount, 'glyph count includes the emoji once').toBe(3);
  expect(Array.from(layout.glyphOffsets), 'offsets use advances').toEqual([2, 6, 7, 6, 4, 6]);
  expect(Boolean(characterSet.has('🙂')), 'auto character collection sees Unicode').toBe(true);
  void 0;
});

it('Arrow glyph layouts preserve atlas pages, BMFont offsets, and kerning', () => {
  const mapping: CharacterMapping = {
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
  };
  const kerning = createTextKerning([{first: 65, second: 66, amount: -2}]);
  const layout = buildArrowGlyphLayout({
    texts: arrow.vectorFromArray(['AB'], new arrow.Utf8()),
    fontAtlas: makeFontAtlas(mapping, kerning)
  });
  const stream = buildGpuExpandedTextStream({
    texts: arrow.vectorFromArray(['AB'], new arrow.Utf8()),
    fontAtlas: makeFontAtlas(mapping, kerning)
  });

  expect(Array.from(layout.glyphOffsets), 'layout uses offsets and kerning').toEqual([
    -1, 9, 5, 10
  ]);
  expect(Array.from(layout.glyphPages), 'layout carries atlas pages per glyph').toEqual([1, 2]);
  expect(Array.from(stream.glyphPages), 'shared glyph pages align with ids').toEqual([0, 1, 2]);
  expect(Array.from(stream.glyphKernings), 'GPU kerning uses glyph ids').toEqual([1, 2, -2, 0]);
  void 0;
});

it('dictionary Arrow UTF-8 helpers expand repeated, chunked, sliced, and null labels', () => {
  const dictionaryType = new arrow.Dictionary(new arrow.Utf8(), new arrow.Int32());
  const firstChunk = makeArrowTextDictionaries(['AB', 'A', null], dictionaryType);
  const secondChunk = makeArrowTextDictionaries(['AB'], dictionaryType);
  const chunked = new arrow.Vector<ArrowUtf8Dictionary>([
    firstChunk.data[0]!,
    secondChunk.data[0]!
  ]);
  const mapping: CharacterMapping = {
    A: {x: 0, y: 0, width: 4, height: 6, anchorX: 2, anchorY: 3, advance: 5},
    B: {x: 4, y: 0, width: 4, height: 6, anchorX: 2, anchorY: 3, advance: 7}
  };
  const layout = buildArrowGlyphLayout({
    texts: chunked,
    fontAtlas: makeFontAtlas(mapping),
    characterSet: new Set<string>()
  });

  expect(layout.startIndices, 'row starts follow dictionary labels').toEqual([0, 2, 3, 3, 5]);
  expect(layout.glyphCount, 'repeated dictionary values still emit repeated glyphs').toBe(5);
  expect(Array.from(layout.glyphOffsets), 'glyph offsets are expanded per row occurrence').toEqual([
    2, 6, 7, 6, 2, 6, 2, 6, 7, 6
  ]);

  const sliced = makeExplicitArrowTextDictionaries(
    ['skip', 'AB', 'A'],
    new Int32Array([0, 1, 2])
  ).slice(1) as arrow.Vector<ArrowUtf8Dictionary>;
  const slicedTextInput = buildGpuTextDictionaryUtf8Input(sliced);
  expect(slicedTextInput.startIndices, 'sliced dictionary rows stay normalized').toEqual([0, 2, 3]);
  expect(
    Array.from(slicedTextInput.rowDictionaryIndices),
    'sliced dictionary rows read dictionary keys from the logical row offset'
  ).toEqual([1, 2]);
  expect(slicedTextInput.byteLength, 'sliced dictionary output reserves glyphs per row').toBe(3);
  const slicedStream = buildGpuTextDictionaryCompressedStream({
    texts: sliced,
    fontAtlas: makeFontAtlas(mapping)
  });
  expect(
    slicedStream.startIndices,
    'compressed sliced dictionary rows use the same logical key range'
  ).toEqual([0, 2, 3]);
  expect(
    Array.from(slicedStream.rowDictionaryIndices),
    'compressed sliced dictionary rows preserve shifted dictionary keys'
  ).toEqual([1, 2]);
  const offsetTextDictionaries = makeExplicitArrowTextDictionaries(
    ['skip', 'AB', 'A'],
    new Int32Array([0, 1, 2]),
    null,
    0,
    1,
    2
  );
  const offsetTextInput = buildGpuTextDictionaryUtf8Input(offsetTextDictionaries);
  expect(offsetTextInput.startIndices, 'offset dictionary data rows stay normalized').toEqual([
    0, 2, 3
  ]);
  expect(
    Array.from(offsetTextInput.rowDictionaryIndices),
    'offset dictionary data rows read dictionary keys from data.offset'
  ).toEqual([1, 2]);

  const nullableDictionaryValues = makeExplicitArrowTextDictionaries(
    ['AB', null, 'A'],
    new Int32Array([0, 1, 2])
  );
  const nullableLayout = buildArrowGlyphLayout({
    texts: nullableDictionaryValues,
    fontAtlas: makeFontAtlas(mapping)
  });
  expect(nullableLayout.startIndices, 'nullable dictionary values render as empty labels').toEqual([
    0, 2, 2, 3
  ]);
  void 0;
});

it('buildGpuExpandedTextStream packs glyph ids and shared definitions deterministically', () => {
  const mapping: CharacterMapping = {
    A: {x: 0, y: 0, width: 4, height: 6, anchorX: 2, anchorY: 3, advance: 5},
    B: {x: 4, y: 0, width: 4, height: 6, anchorX: 2, anchorY: 3, advance: 7},
    '🙂': {x: 8, y: 0, width: 8, height: 8, anchorX: 4, anchorY: 4, advance: 9}
  };
  const stream = buildGpuExpandedTextStream({
    texts: arrow.vectorFromArray(['AB', '🙂A'], new arrow.Utf8()),
    fontAtlas: makeFontAtlas(mapping),
    characterSet: new Set<string>()
  });

  expect(stream.startIndices, 'glyph row starts match code point counts').toEqual([0, 2, 4]);
  expect(Array.from(stream.labelGlyphRanges), 'label glyph spans are packed').toEqual([0, 2, 2, 4]);
  expect(
    Array.from(stream.packedGlyphIds),
    'two uint16 glyph ids share each uint32 input word'
  ).toEqual([1 | (2 << 16), 3 | (1 << 16)]);
  expect(
    Array.from(stream.glyphFrames),
    'frame definitions are deduplicated with a missing-glyph row at zero'
  ).toEqual([0, 0, 0, 0, 0, 0, 4, 6, 4, 0, 4, 6, 8, 0, 8, 8]);
  expect(
    Array.from(stream.glyphMetrics),
    'glyph metrics carry layout offset and advance for compute expansion'
  ).toEqual([0, 0, 32, 0, 2, 0, 5, 0, 2, 0, 7, 0, 4, 0, 9, 0]);
  expect(stream.baselineOffsetY, 'baseline output offset is prevalidated and stored once').toBe(6);
  expect(stream.glyphCount, 'glyph count stays CPU-known').toBe(4);
  void 0;
});

it('buildGpuTextDictionaryUtf8Input uploads dictionary bytes once per chunk', () => {
  const texts = makeExplicitArrowTextDictionaries(['AB', 'A'], new Int32Array([0, 1, 0]));
  const textInput = buildGpuTextDictionaryUtf8Input(texts);
  const packedBytes = new Uint8Array(textInput.packedDictionaryUtf8Bytes.buffer).subarray(
    0,
    textInput.dictionaryByteLength
  );

  expect(textInput.startIndices, 'row starts reserve glyph slots per row').toEqual([0, 2, 3, 5]);
  expect(
    Array.from(textInput.rowDictionaryIndices),
    'rows point at shared dictionary values'
  ).toEqual([0, 1, 0]);
  expect(
    Array.from(textInput.rowOutputGlyphRanges),
    'row output ranges allocate repeated labels independently'
  ).toEqual([0, 2, 2, 3, 3, 5]);
  expect(
    Array.from(textInput.dictionaryValueByteRanges),
    'dictionary value byte ranges are unique per dictionary entry'
  ).toEqual([0, 2, 2, 3]);
  expect(Array.from(packedBytes), 'source UTF-8 bytes are packed once').toEqual([65, 66, 65]);
  expect(textInput.dictionaryByteLength, 'dictionary source bytes are shared').toBe(3);
  expect(textInput.byteLength, 'output glyph slots are per visible label occurrence').toBe(5);
  void 0;
});

it('buildGpuTextDictionaryCompressedStream shares dictionary glyph records per chunk', () => {
  const mapping: CharacterMapping = {
    A: {x: 0, y: 0, width: 4, height: 6, anchorX: 2, anchorY: 3, advance: 5},
    B: {x: 4, y: 0, width: 4, height: 6, anchorX: 2, anchorY: 3, advance: 7}
  };
  const texts = makeExplicitArrowTextDictionaries(['AB', 'A'], new Int32Array([0, 1, 0, 1]));
  const stream = buildGpuTextDictionaryCompressedStream({
    texts,
    fontAtlas: makeFontAtlas(mapping),
    characterSet: new Set<string>()
  });

  expect(stream.startIndices, 'row starts remain per label occurrence').toEqual([0, 2, 3, 5, 6]);
  expect(
    Array.from(stream.rowDictionaryIndices),
    'rows reference shared dictionary values'
  ).toEqual([0, 1, 0, 1]);
  expect(
    Array.from(stream.dictionaryGlyphRanges),
    'dictionary values own one shared glyph run each'
  ).toEqual([0, 2, 2, 3]);
  expect(
    Array.from(stream.dictionaryGlyphRecords),
    'dictionary glyph ids and offsets are stored once per dictionary value'
  ).toEqual([
    packSignedInt16Pair(2, 6),
    1,
    packSignedInt16Pair(7, 6),
    2,
    packSignedInt16Pair(2, 6),
    1
  ]);
  expect(
    Array.from(stream.rowGlyphRanges),
    'row glyph ranges map instance indices back to source rows'
  ).toEqual([0, 2, 2, 3, 3, 5, 5, 6]);
  expect(stream.dictionaryGlyphCount, 'shared dictionary glyph records scale with values').toBe(3);
  expect(stream.glyphCount, 'visible glyph count still scales with row occurrences').toBe(6);
  void 0;
});

it('buildGpuUtf8TextInput preserves Arrow UTF-8 bytes without glyph decoding', () => {
  const textInput = buildGpuUtf8TextInput(arrow.vectorFromArray(['AB', '🙂'], new arrow.Utf8()));
  const packedBytes = new Uint8Array(textInput.packedUtf8Bytes.buffer).subarray(
    0,
    textInput.byteLength
  );

  expect(textInput.startIndices, 'row byte prefixes support limit batching').toEqual([0, 2, 6]);
  expect(Array.from(textInput.rowByteRanges), 'row byte spans stay aligned').toEqual([0, 2, 2, 6]);
  expect(Array.from(packedBytes), 'packed upload retains the normalized UTF-8 byte stream').toEqual(
    [65, 66, 240, 159, 153, 130]
  );
  expect(textInput.byteLength, 'one render slot can be reserved per source byte').toBe(6);
  void 0;
});

function makeFontAtlas(mapping: CharacterMapping, kerning?: TextKerning): FontAtlas {
  return {
    baselineOffset: 1,
    lineHeight: 10,
    xOffset: 0,
    yOffsetMin: 0,
    yOffsetMax: 10,
    mapping,
    kerning,
    renderSettings: {mode: 'bitmap', threshold: 0.5, smoothing: 0},
    pages: [],
    width: 16,
    height: 16
  };
}

function makeArrowTextDictionaries(
  labels: readonly (string | null)[],
  dictionaryType = new arrow.Dictionary(new arrow.Utf8(), new arrow.Int32())
): arrow.Vector<ArrowUtf8Dictionary> {
  return arrow.vectorFromArray(labels, dictionaryType) as arrow.Vector<ArrowUtf8Dictionary>;
}

function makeExplicitArrowTextDictionaries(
  dictionaryValues: readonly (string | null)[],
  indices: Int32Array,
  nullBitmap: Uint8Array | null = null,
  nullCount = 0,
  offset = 0,
  length = indices.length - offset
): arrow.Vector<ArrowUtf8Dictionary> {
  const dictionaryType = new arrow.Dictionary(new arrow.Utf8(), new arrow.Int32());
  const dictionary = arrow.vectorFromArray(
    dictionaryValues,
    new arrow.Utf8()
  ) as arrow.Vector<arrow.Utf8>;
  const data = arrow.makeData({
    type: dictionaryType,
    length,
    offset,
    nullCount,
    nullBitmap,
    data: indices,
    dictionary
  });
  return new arrow.Vector([data]) as arrow.Vector<ArrowUtf8Dictionary>;
}

function packSignedInt16Pair(lowerValue: number, upperValue: number): number {
  return ((lowerValue & 0xffff) | ((upperValue & 0xffff) << 16)) >>> 0;
}
