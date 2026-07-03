// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
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

test('createArrowUtf8TextIndexAccessor mutates the caller target', t => {
  const texts = arrow.vectorFromArray(['ASCII', 'e', '🙂', ''], new arrow.Utf8());
  const accessor = createArrowUtf8TextIndexAccessor<TextDatum>(texts, datum => datum.rowIndex);
  const target = {startIndex: -1, endIndex: -1};

  const firstResult = accessor({rowIndex: 0}, {index: 0, target});
  t.equal(firstResult, target, 'returns the caller target');
  t.deepEqual([target.startIndex, target.endIndex], [0, 5], 'ASCII row range matches bytes');

  accessor({rowIndex: 2}, {index: 1, target});
  t.deepEqual([target.startIndex, target.endIndex], [6, 10], 'emoji row range matches bytes');

  accessor({rowIndex: 3}, {index: 2, target});
  t.deepEqual([target.startIndex, target.endIndex], [10, 10], 'empty row range is empty');
  t.end();
});

test('Arrow UTF-8 chunks handle chunked, sliced, and null rows', t => {
  const firstChunk = arrow.vectorFromArray(['a', 'bb'], new arrow.Utf8());
  const secondChunk = arrow.vectorFromArray(['ccc', 'dddd'], new arrow.Utf8());
  const chunked = new arrow.Vector<arrow.Utf8>([firstChunk.data[0]!, secondChunk.data[0]!]);
  const chunks = buildArrowUtf8Chunks(chunked);
  const target = {startIndex: 0, endIndex: 0};

  populateUtf8TextIndices(chunks, 2, target);
  t.deepEqual([target.startIndex, target.endIndex], [3, 6], 'chunked row bytes are normalized');

  const source = arrow.vectorFromArray(['skip', null, 'kept'], new arrow.Utf8());
  const sliced = source.slice(1) as arrow.Vector<arrow.Utf8>;
  const slicedChunks = buildArrowUtf8Chunks(sliced);
  populateUtf8TextIndices(slicedChunks, 0, target);
  t.deepEqual([target.startIndex, target.endIndex], [0, 0], 'null rows are empty');
  populateUtf8TextIndices(slicedChunks, 1, target);
  t.deepEqual([target.startIndex, target.endIndex], [0, 4], 'sliced rows keep local offsets');
  t.end();
});

test('decodeArrowUtf8CodePoints and buildArrowGlyphLayout preserve Unicode glyph counts', t => {
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
  t.equal(decodedCount, 1, 'emoji decodes as one code point');
  t.deepEqual(decoded, ['🙂'], 'emoji code point round-trips');

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

  t.deepEqual(layout.startIndices, [0, 2, 3], 'start indices count code points');
  t.equal(layout.glyphCount, 3, 'glyph count includes the emoji once');
  t.deepEqual(Array.from(layout.glyphOffsets), [2, 6, 7, 6, 4, 6], 'offsets use advances');
  t.ok(characterSet.has('🙂'), 'auto character collection sees Unicode');
  t.end();
});

test('Arrow glyph layouts preserve atlas pages, BMFont offsets, and kerning', t => {
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

  t.deepEqual(Array.from(layout.glyphOffsets), [-1, 9, 5, 10], 'layout uses offsets and kerning');
  t.deepEqual(Array.from(layout.glyphPages), [1, 2], 'layout carries atlas pages per glyph');
  t.deepEqual(Array.from(stream.glyphPages), [0, 1, 2], 'shared glyph pages align with ids');
  t.deepEqual(Array.from(stream.glyphKernings), [1, 2, -2, 0], 'GPU kerning uses glyph ids');
  t.end();
});

test('dictionary Arrow UTF-8 helpers expand repeated, chunked, sliced, and null labels', t => {
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

  t.deepEqual(layout.startIndices, [0, 2, 3, 3, 5], 'row starts follow dictionary labels');
  t.equal(layout.glyphCount, 5, 'repeated dictionary values still emit repeated glyphs');
  t.deepEqual(
    Array.from(layout.glyphOffsets),
    [2, 6, 7, 6, 2, 6, 2, 6, 7, 6],
    'glyph offsets are expanded per row occurrence'
  );

  const sliced = makeExplicitArrowTextDictionaries(
    ['skip', 'AB', 'A'],
    new Int32Array([0, 1, 2])
  ).slice(1) as arrow.Vector<ArrowUtf8Dictionary>;
  const slicedTextInput = buildGpuTextDictionaryUtf8Input(sliced);
  t.deepEqual(slicedTextInput.startIndices, [0, 2, 3], 'sliced dictionary rows stay normalized');
  t.deepEqual(
    Array.from(slicedTextInput.rowDictionaryIndices),
    [1, 2],
    'sliced dictionary rows read dictionary keys from the logical row offset'
  );
  t.equal(slicedTextInput.byteLength, 3, 'sliced dictionary output reserves glyphs per row');
  const slicedStream = buildGpuTextDictionaryCompressedStream({
    texts: sliced,
    fontAtlas: makeFontAtlas(mapping)
  });
  t.deepEqual(
    slicedStream.startIndices,
    [0, 2, 3],
    'compressed sliced dictionary rows use the same logical key range'
  );
  t.deepEqual(
    Array.from(slicedStream.rowDictionaryIndices),
    [1, 2],
    'compressed sliced dictionary rows preserve shifted dictionary keys'
  );
  const offsetTextDictionaries = makeExplicitArrowTextDictionaries(
    ['skip', 'AB', 'A'],
    new Int32Array([0, 1, 2]),
    null,
    0,
    1,
    2
  );
  const offsetTextInput = buildGpuTextDictionaryUtf8Input(offsetTextDictionaries);
  t.deepEqual(
    offsetTextInput.startIndices,
    [0, 2, 3],
    'offset dictionary data rows stay normalized'
  );
  t.deepEqual(
    Array.from(offsetTextInput.rowDictionaryIndices),
    [1, 2],
    'offset dictionary data rows read dictionary keys from data.offset'
  );

  const nullableDictionaryValues = makeExplicitArrowTextDictionaries(
    ['AB', null, 'A'],
    new Int32Array([0, 1, 2])
  );
  const nullableLayout = buildArrowGlyphLayout({
    texts: nullableDictionaryValues,
    fontAtlas: makeFontAtlas(mapping)
  });
  t.deepEqual(
    nullableLayout.startIndices,
    [0, 2, 2, 3],
    'nullable dictionary values render as empty labels'
  );
  t.end();
});

test('buildGpuExpandedTextStream packs glyph ids and shared definitions deterministically', t => {
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

  t.deepEqual(stream.startIndices, [0, 2, 4], 'glyph row starts match code point counts');
  t.deepEqual(Array.from(stream.labelGlyphRanges), [0, 2, 2, 4], 'label glyph spans are packed');
  t.deepEqual(
    Array.from(stream.packedGlyphIds),
    [1 | (2 << 16), 3 | (1 << 16)],
    'two uint16 glyph ids share each uint32 input word'
  );
  t.deepEqual(
    Array.from(stream.glyphFrames),
    [0, 0, 0, 0, 0, 0, 4, 6, 4, 0, 4, 6, 8, 0, 8, 8],
    'frame definitions are deduplicated with a missing-glyph row at zero'
  );
  t.deepEqual(
    Array.from(stream.glyphMetrics),
    [0, 0, 32, 0, 2, 0, 5, 0, 2, 0, 7, 0, 4, 0, 9, 0],
    'glyph metrics carry layout offset and advance for compute expansion'
  );
  t.equal(stream.baselineOffsetY, 6, 'baseline output offset is prevalidated and stored once');
  t.equal(stream.glyphCount, 4, 'glyph count stays CPU-known');
  t.end();
});

test('buildGpuTextDictionaryUtf8Input uploads dictionary bytes once per chunk', t => {
  const texts = makeExplicitArrowTextDictionaries(['AB', 'A'], new Int32Array([0, 1, 0]));
  const textInput = buildGpuTextDictionaryUtf8Input(texts);
  const packedBytes = new Uint8Array(textInput.packedDictionaryUtf8Bytes.buffer).subarray(
    0,
    textInput.dictionaryByteLength
  );

  t.deepEqual(textInput.startIndices, [0, 2, 3, 5], 'row starts reserve glyph slots per row');
  t.deepEqual(
    Array.from(textInput.rowDictionaryIndices),
    [0, 1, 0],
    'rows point at shared dictionary values'
  );
  t.deepEqual(
    Array.from(textInput.rowOutputGlyphRanges),
    [0, 2, 2, 3, 3, 5],
    'row output ranges allocate repeated labels independently'
  );
  t.deepEqual(
    Array.from(textInput.dictionaryValueByteRanges),
    [0, 2, 2, 3],
    'dictionary value byte ranges are unique per dictionary entry'
  );
  t.deepEqual(Array.from(packedBytes), [65, 66, 65], 'source UTF-8 bytes are packed once');
  t.equal(textInput.dictionaryByteLength, 3, 'dictionary source bytes are shared');
  t.equal(textInput.byteLength, 5, 'output glyph slots are per visible label occurrence');
  t.end();
});

test('buildGpuTextDictionaryCompressedStream shares dictionary glyph records per chunk', t => {
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

  t.deepEqual(stream.startIndices, [0, 2, 3, 5, 6], 'row starts remain per label occurrence');
  t.deepEqual(
    Array.from(stream.rowDictionaryIndices),
    [0, 1, 0, 1],
    'rows reference shared dictionary values'
  );
  t.deepEqual(
    Array.from(stream.dictionaryGlyphRanges),
    [0, 2, 2, 3],
    'dictionary values own one shared glyph run each'
  );
  t.deepEqual(
    Array.from(stream.dictionaryGlyphRecords),
    [packSignedInt16Pair(2, 6), 1, packSignedInt16Pair(7, 6), 2, packSignedInt16Pair(2, 6), 1],
    'dictionary glyph ids and offsets are stored once per dictionary value'
  );
  t.deepEqual(
    Array.from(stream.rowGlyphRanges),
    [0, 2, 2, 3, 3, 5, 5, 6],
    'row glyph ranges map instance indices back to source rows'
  );
  t.equal(stream.dictionaryGlyphCount, 3, 'shared dictionary glyph records scale with values');
  t.equal(stream.glyphCount, 6, 'visible glyph count still scales with row occurrences');
  t.end();
});

test('buildGpuUtf8TextInput preserves Arrow UTF-8 bytes without glyph decoding', t => {
  const textInput = buildGpuUtf8TextInput(arrow.vectorFromArray(['AB', '🙂'], new arrow.Utf8()));
  const packedBytes = new Uint8Array(textInput.packedUtf8Bytes.buffer).subarray(
    0,
    textInput.byteLength
  );

  t.deepEqual(textInput.startIndices, [0, 2, 6], 'row byte prefixes support limit batching');
  t.deepEqual(Array.from(textInput.rowByteRanges), [0, 2, 2, 6], 'row byte spans stay aligned');
  t.deepEqual(
    Array.from(packedBytes),
    [65, 66, 240, 159, 153, 130],
    'packed upload retains the normalized UTF-8 byte stream'
  );
  t.equal(textInput.byteLength, 6, 'one render slot can be reserved per source byte');
  t.end();
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
