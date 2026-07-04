// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {FontAtlas} from '../atlas/font-atlas';
import {
  getCharacterAtlasPage,
  getCharacterLayoutOffset,
  getTextKerningOffset,
  type Character
} from '../atlas/text-utils';
import {getAlignmentBaselineOffset, getTextAnchorOffset} from '../atlas/text-metrics';
import type {
  GpuExpandedTextStream,
  GpuTextDictionaryCompressedStream,
  TextGlyphLayout
} from './gpu-text-types';

const DEFAULT_MISSING_CHARACTER_WIDTH = 32;
const MAX_UINT16 = 65535;
const INVALID_DICTIONARY_INDEX = 0xffffffff;

/** Row-oriented Unicode code-point source consumed by text layout builders. */
export type TextCodePointSource = {
  /** Number of source text rows. */
  rowCount: number;
  /** Returns the number of Unicode code points in one row. */
  countCodePoints: (rowIndex: number) => number;
  /** Visits the Unicode code points in one row in display order. */
  visitCodePoints: (rowIndex: number, visitCodePoint: (codePoint: number) => void) => void;
};

/** Dictionary-oriented Unicode code-point source consumed by compressed text layout. */
export type TextDictionaryCodePointSource = {
  /** Number of source text rows. */
  rowCount: number;
  /** Number of normalized dictionary values. */
  dictionaryValueCount: number;
  /** Returns a normalized dictionary index, or a negative value for an empty row. */
  getRowDictionaryIndex: (rowIndex: number) => number;
  /** Visits one normalized dictionary value's Unicode code points in display order. */
  visitDictionaryCodePoints: (
    dictionaryIndex: number,
    visitCodePoint: (codePoint: number) => void
  ) => void;
};

/** Shared options for atlas-backed one-line text layout. */
export type TextLayoutOptions = {
  /** Normalized glyph mapping, metrics, pages, and kerning. */
  fontAtlas: FontAtlas;
  /** Effective line height. Defaults to the atlas line height. */
  lineHeight?: number;
  /** Optional set populated with characters encountered while laying out text. */
  characterSet?: Set<string>;
  /** Advance assigned to characters missing from the atlas. */
  missingCharacterWidth?: number;
  /** Horizontal alignment relative to each row origin. */
  textAnchor?: 'start' | 'middle' | 'end';
  /** Vertical alignment relative to each row origin. */
  alignmentBaseline?: 'center' | 'top' | 'bottom';
};

/** Shared GPU glyph definitions used by direct UTF-8 text expansion. */
export type TextGpuGlyphDefinitions = {
  /** Shared Float32 atlas XYWH glyph frames. */
  glyphFrames: Float32Array;
  /** Shared Int32 layout offset XY plus advance tuples. */
  glyphMetrics: Int32Array;
  /** Shared Uint32 atlas page index per glyph definition. */
  glyphPages: Uint32Array;
  /** Shared Int32 glyph-id kerning tuples `[first, second, amount, 0]`. */
  glyphKernings: Int32Array;
  /** Sorted insertion-order code point and glyph-id pairs. */
  glyphLookup: Uint32Array;
  /** Signed baseline offset retained by generated glyph vertices. */
  baselineOffsetY: number;
};

type TextGlyphDefinition = {
  frame: Character | undefined;
  glyphId: number;
};

type TextGlyphDefinitionState = {
  fontAtlas: FontAtlas;
  characterSet?: Set<string>;
  definitionsByCodePoint: Map<number, TextGlyphDefinition>;
  glyphIdsByCodePoint: Map<number, number>;
  glyphFrameValues: number[];
  glyphMetricValues: number[];
  glyphPageValues: number[];
};

/** Builds expanded glyph offsets and atlas frames from a renderer-independent code-point source. */
export function buildTextGlyphLayout(
  source: TextCodePointSource,
  options: TextLayoutOptions
): TextGlyphLayout {
  const {fontAtlas, characterSet} = options;
  const lineHeight = options.lineHeight ?? fontAtlas.lineHeight;
  const missingCharacterWidth = options.missingCharacterWidth ?? DEFAULT_MISSING_CHARACTER_WIDTH;
  const startIndices = buildTextGlyphStartIndices(source);
  const glyphCount = startIndices[source.rowCount] ?? 0;
  const glyphOffsets = new Int16Array(glyphCount * 2);
  const glyphFrames = new Uint16Array(glyphCount * 4);
  const glyphPages = new Uint16Array(glyphCount);
  const definitions = createTextGlyphDefinitionState(fontAtlas, characterSet);
  let glyphOffsetIndex = 0;
  let glyphFrameIndex = 0;

  for (let rowIndex = 0; rowIndex < source.rowCount; rowIndex++) {
    const rowGlyphOffsetStart = glyphOffsetIndex;
    let width = 0;
    let previousCodePoint: number | undefined;
    source.visitCodePoints(rowIndex, codePoint => {
      const {frame} = getTextGlyphDefinition(definitions, codePoint);
      width += getTextKerningOffset(fontAtlas.kerning, previousCodePoint, codePoint);
      const [layoutOffsetX, layoutOffsetY] = frame ? getCharacterLayoutOffset(frame) : [0, 0];
      glyphOffsets[glyphOffsetIndex++] = toInt16(width + layoutOffsetX);
      glyphOffsets[glyphOffsetIndex++] = toInt16(
        fontAtlas.baselineOffset + lineHeight / 2 + layoutOffsetY
      );
      glyphFrames[glyphFrameIndex++] = toUint16(frame?.x ?? 0);
      glyphFrames[glyphFrameIndex++] = toUint16(frame?.y ?? 0);
      glyphFrames[glyphFrameIndex++] = toUint16(frame?.width ?? 0);
      glyphFrames[glyphFrameIndex++] = toUint16(frame?.height ?? 0);
      glyphPages[glyphFrameIndex / 4 - 1] = toUint16(frame ? getCharacterAtlasPage(frame) : 0);
      width += frame?.advance ?? missingCharacterWidth;
      previousCodePoint = codePoint;
    });
    const anchorOffset = getTextAnchorOffset(width, options.textAnchor);
    const baselineOffset = getAlignmentBaselineOffset(lineHeight, options.alignmentBaseline);
    for (
      let rowGlyphOffsetIndex = rowGlyphOffsetStart;
      rowGlyphOffsetIndex < glyphOffsetIndex;
      rowGlyphOffsetIndex += 2
    ) {
      glyphOffsets[rowGlyphOffsetIndex] = toInt16(glyphOffsets[rowGlyphOffsetIndex] + anchorOffset);
      glyphOffsets[rowGlyphOffsetIndex + 1] = toInt16(
        glyphOffsets[rowGlyphOffsetIndex + 1] + baselineOffset
      );
    }
  }

  return {startIndices, glyphCount, glyphOffsets, glyphFrames, glyphPages, characterSet};
}

/** Builds compact glyph IDs and shared definitions for GPU text expansion. */
export function buildTextGpuExpandedStream(
  source: TextCodePointSource,
  options: TextLayoutOptions
): GpuExpandedTextStream {
  const buildStartTime = getNow();
  const {fontAtlas, characterSet} = options;
  const lineHeight = options.lineHeight ?? fontAtlas.lineHeight;
  const missingCharacterWidth = options.missingCharacterWidth ?? DEFAULT_MISSING_CHARACTER_WIDTH;
  const startIndices = buildTextGlyphStartIndices(source);
  const glyphCount = startIndices[source.rowCount] ?? 0;
  const labelGlyphRanges = new Uint32Array(source.rowCount * 2);
  const packedGlyphIds = new Uint32Array(Math.ceil(glyphCount / 2));
  const definitions = createTextGlyphDefinitionState(
    fontAtlas,
    characterSet,
    missingCharacterWidth
  );
  let glyphWriteIndex = 0;

  for (let rowIndex = 0; rowIndex < source.rowCount; rowIndex++) {
    const glyphStart = startIndices[rowIndex] ?? 0;
    const glyphEnd = startIndices[rowIndex + 1] ?? glyphStart;
    labelGlyphRanges[rowIndex * 2] = glyphStart;
    labelGlyphRanges[rowIndex * 2 + 1] = glyphEnd;
    let width = 0;
    let previousCodePoint: number | undefined;
    source.visitCodePoints(rowIndex, codePoint => {
      const {frame, glyphId} = getTextGlyphDefinition(definitions, codePoint);
      width += getTextKerningOffset(fontAtlas.kerning, previousCodePoint, codePoint);
      const [layoutOffsetX] = frame ? getCharacterLayoutOffset(frame) : [0, 0];
      toInt16(width + layoutOffsetX);
      writePackedUint16(packedGlyphIds, glyphWriteIndex, glyphId);
      glyphWriteIndex++;
      width += frame?.advance ?? missingCharacterWidth;
      previousCodePoint = codePoint;
    });
  }

  const glyphFrames = new Float32Array(definitions.glyphFrameValues);
  const glyphMetrics = new Int32Array(definitions.glyphMetricValues);
  const glyphPages = new Uint32Array(definitions.glyphPageValues);
  const glyphKernings = buildTextGlyphKerningTuples(definitions.glyphIdsByCodePoint, fontAtlas);
  const compactStreamByteLength = labelGlyphRanges.byteLength + packedGlyphIds.byteLength;
  const glyphDefinitionByteLength =
    glyphFrames.byteLength +
    glyphMetrics.byteLength +
    glyphPages.byteLength +
    glyphKernings.byteLength;

  return {
    startIndices,
    glyphCount,
    labelGlyphRanges,
    packedGlyphIds,
    glyphFrames,
    glyphMetrics,
    glyphPages,
    glyphKernings,
    baselineOffsetY: toInt16(fontAtlas.baselineOffset + lineHeight / 2),
    characterSet,
    compactStreamByteLength,
    glyphDefinitionByteLength,
    glyphStreamBuildTimeMs: getNow() - buildStartTime
  };
}

/** Builds shared dictionary glyph runs plus compact per-row dictionary references. */
export function buildTextGpuDictionaryCompressedStream(
  source: TextDictionaryCodePointSource,
  options: TextLayoutOptions
): GpuTextDictionaryCompressedStream {
  const buildStartTime = getNow();
  const {fontAtlas, characterSet} = options;
  const lineHeight = options.lineHeight ?? fontAtlas.lineHeight;
  const missingCharacterWidth = options.missingCharacterWidth ?? DEFAULT_MISSING_CHARACTER_WIDTH;
  const baselineOffsetY = toInt16(fontAtlas.baselineOffset + lineHeight / 2);
  const rowGlyphRanges = new Uint32Array(source.rowCount * 2);
  const rowDictionaryIndices = new Uint32Array(source.rowCount);
  const dictionaryGlyphRanges = new Uint32Array(source.dictionaryValueCount * 2);
  const dictionaryGlyphRecordValues: number[] = [];
  const startIndices = new Array<number>(source.rowCount + 1);
  const definitions = createTextGlyphDefinitionState(
    fontAtlas,
    characterSet,
    missingCharacterWidth
  );
  let glyphCount = 0;

  startIndices[0] = 0;
  rowDictionaryIndices.fill(INVALID_DICTIONARY_INDEX);

  for (let dictionaryIndex = 0; dictionaryIndex < source.dictionaryValueCount; dictionaryIndex++) {
    const dictionaryGlyphStart = dictionaryGlyphRecordValues.length / 2;
    let width = 0;
    let previousCodePoint: number | undefined;
    source.visitDictionaryCodePoints(dictionaryIndex, codePoint => {
      const {frame, glyphId} = getTextGlyphDefinition(definitions, codePoint);
      width += getTextKerningOffset(fontAtlas.kerning, previousCodePoint, codePoint);
      const [layoutOffsetX, layoutOffsetY] = frame ? getCharacterLayoutOffset(frame) : [0, 0];
      dictionaryGlyphRecordValues.push(
        packSignedInt16Pair(width + layoutOffsetX, baselineOffsetY + layoutOffsetY),
        packGlyphPageAndId(glyphId, frame ? getCharacterAtlasPage(frame) : 0)
      );
      width += frame?.advance ?? missingCharacterWidth;
      previousCodePoint = codePoint;
    });
    dictionaryGlyphRanges[dictionaryIndex * 2] = dictionaryGlyphStart;
    dictionaryGlyphRanges[dictionaryIndex * 2 + 1] = dictionaryGlyphRecordValues.length / 2;
  }

  for (let rowIndex = 0; rowIndex < source.rowCount; rowIndex++) {
    const dictionaryIndex = source.getRowDictionaryIndex(rowIndex);
    const normalizedDictionaryIndex =
      dictionaryIndex >= 0 && dictionaryIndex < source.dictionaryValueCount
        ? dictionaryIndex
        : INVALID_DICTIONARY_INDEX;
    rowDictionaryIndices[rowIndex] = normalizedDictionaryIndex;
    rowGlyphRanges[rowIndex * 2] = glyphCount;
    if (normalizedDictionaryIndex !== INVALID_DICTIONARY_INDEX) {
      const dictionaryGlyphStart = dictionaryGlyphRanges[normalizedDictionaryIndex * 2] ?? 0;
      const dictionaryGlyphEnd =
        dictionaryGlyphRanges[normalizedDictionaryIndex * 2 + 1] ?? dictionaryGlyphStart;
      glyphCount += Math.max(0, dictionaryGlyphEnd - dictionaryGlyphStart);
    }
    rowGlyphRanges[rowIndex * 2 + 1] = glyphCount;
    startIndices[rowIndex + 1] = glyphCount;
  }

  const dictionaryGlyphRecords = new Uint32Array(dictionaryGlyphRecordValues);
  const glyphFrames = new Float32Array(definitions.glyphFrameValues);
  const compressedStreamByteLength =
    rowGlyphRanges.byteLength +
    rowDictionaryIndices.byteLength +
    dictionaryGlyphRanges.byteLength +
    dictionaryGlyphRecords.byteLength;

  return {
    startIndices,
    rowGlyphRanges,
    rowDictionaryIndices,
    dictionaryGlyphRanges,
    dictionaryGlyphRecords,
    glyphFrames,
    glyphCount,
    dictionaryGlyphCount: dictionaryGlyphRecords.length / 2,
    dictionaryValueCount: source.dictionaryValueCount,
    characterSet,
    compressedStreamByteLength,
    glyphDefinitionByteLength: glyphFrames.byteLength,
    glyphStreamBuildTimeMs: getNow() - buildStartTime
  };
}

/** Builds shared GPU glyph definitions for direct UTF-8 decoding. */
export function buildTextGpuGlyphDefinitions(
  characterSet: ReadonlySet<string>,
  options: TextLayoutOptions
): TextGpuGlyphDefinitions {
  const {fontAtlas} = options;
  const lineHeight = options.lineHeight ?? fontAtlas.lineHeight;
  const missingCharacterWidth = options.missingCharacterWidth ?? DEFAULT_MISSING_CHARACTER_WIDTH;
  const definitions = createTextGlyphDefinitionState(fontAtlas, undefined, missingCharacterWidth);
  const glyphLookupValues: number[] = [];
  const handledCodePoints = new Set<number>();

  for (const characterEntry of characterSet) {
    for (const character of characterEntry) {
      const codePoint = character.codePointAt(0);
      if (codePoint === undefined || handledCodePoints.has(codePoint)) {
        continue;
      }
      handledCodePoints.add(codePoint);
      const {glyphId} = getTextGlyphDefinition(definitions, codePoint);
      glyphLookupValues.push(codePoint, glyphId);
    }
  }

  return {
    glyphFrames: new Float32Array(definitions.glyphFrameValues),
    glyphMetrics: new Int32Array(definitions.glyphMetricValues),
    glyphPages: new Uint32Array(definitions.glyphPageValues),
    glyphKernings: buildTextGlyphKerningTuples(definitions.glyphIdsByCodePoint, fontAtlas),
    glyphLookup: new Uint32Array(glyphLookupValues),
    baselineOffsetY: toInt16(fontAtlas.baselineOffset + lineHeight / 2)
  };
}

function buildTextGlyphStartIndices(source: TextCodePointSource): number[] {
  const startIndices = new Array<number>(source.rowCount + 1);
  let glyphCount = 0;
  startIndices[0] = 0;
  for (let rowIndex = 0; rowIndex < source.rowCount; rowIndex++) {
    glyphCount += source.countCodePoints(rowIndex);
    startIndices[rowIndex + 1] = glyphCount;
  }
  return startIndices;
}

function createTextGlyphDefinitionState(
  fontAtlas: FontAtlas,
  characterSet?: Set<string>,
  missingCharacterWidth = DEFAULT_MISSING_CHARACTER_WIDTH
): TextGlyphDefinitionState {
  return {
    fontAtlas,
    characterSet,
    definitionsByCodePoint: new Map(),
    glyphIdsByCodePoint: new Map(),
    glyphFrameValues: [0, 0, 0, 0],
    glyphMetricValues: [0, 0, missingCharacterWidth, 0],
    glyphPageValues: [0]
  };
}

function getTextGlyphDefinition(
  state: TextGlyphDefinitionState,
  codePoint: number
): TextGlyphDefinition {
  const existingDefinition = state.definitionsByCodePoint.get(codePoint);
  if (existingDefinition) {
    return existingDefinition;
  }

  const character = String.fromCodePoint(codePoint);
  const frame = state.fontAtlas.mapping[character];
  let glyphId = 0;
  if (frame) {
    glyphId = state.glyphFrameValues.length / 4;
    if (glyphId > MAX_UINT16) {
      throw new Error('Text glyph definitions exceed the uint16 glyph id range');
    }
    const [layoutOffsetX, layoutOffsetY] = getCharacterLayoutOffset(frame);
    state.glyphFrameValues.push(frame.x, frame.y, frame.width, frame.height);
    state.glyphMetricValues.push(layoutOffsetX, layoutOffsetY, frame.advance, 0);
    state.glyphPageValues.push(getCharacterAtlasPage(frame));
  }
  const definition = {frame, glyphId};
  state.definitionsByCodePoint.set(codePoint, definition);
  state.glyphIdsByCodePoint.set(codePoint, glyphId);
  state.characterSet?.add(character);
  return definition;
}

function buildTextGlyphKerningTuples(
  glyphIdsByCodePoint: ReadonlyMap<number, number>,
  fontAtlas: FontAtlas
): Int32Array {
  if (!fontAtlas.kerning) {
    return new Int32Array(0);
  }
  const glyphKerningTuples: number[][] = [];
  for (const pair of fontAtlas.kerning.pairs) {
    const firstGlyphId = glyphIdsByCodePoint.get(pair.first);
    const secondGlyphId = glyphIdsByCodePoint.get(pair.second);
    if (firstGlyphId === undefined || secondGlyphId === undefined) {
      continue;
    }
    glyphKerningTuples.push([firstGlyphId, secondGlyphId, pair.amount, 0]);
  }
  glyphKerningTuples.sort(
    (left, right) => (left[0] ?? 0) - (right[0] ?? 0) || (left[1] ?? 0) - (right[1] ?? 0)
  );
  return new Int32Array(glyphKerningTuples.flat());
}

function writePackedUint16(values: Uint32Array, index: number, value: number): void {
  const wordIndex = index >> 1;
  const word = values[wordIndex] ?? 0;
  values[wordIndex] = index & 1 ? word | ((value & MAX_UINT16) << 16) : word | (value & MAX_UINT16);
}

function packSignedInt16Pair(lowerValue: number, upperValue: number): number {
  return ((toInt16(upperValue) & 0xffff) << 16) | (toInt16(lowerValue) & 0xffff);
}

function packGlyphPageAndId(glyphId: number, atlasPage: number): number {
  return ((toUint16(atlasPage) & MAX_UINT16) << 16) | (toUint16(glyphId) & MAX_UINT16);
}

function toInt16(value: number): number {
  const integerValue = Math.round(value);
  if (integerValue < -32768 || integerValue > 32767) {
    throw new Error(`Text glyph offset ${value} is outside the signed 16-bit range`);
  }
  return integerValue;
}

function toUint16(value: number): number {
  const integerValue = Math.round(value);
  if (integerValue < 0 || integerValue > MAX_UINT16) {
    throw new Error(`Text glyph value ${value} is outside the unsigned 16-bit range`);
  }
  return integerValue;
}

function getNow(): number {
  return globalThis.performance?.now() ?? Date.now();
}
