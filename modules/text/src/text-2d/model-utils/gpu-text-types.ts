// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** One-line glyph offsets and atlas frames expanded from source text rows. */
export type TextGlyphLayout = {
  /** Cumulative glyph offsets, length = source text rows + 1. */
  startIndices: number[];
  /** Expanded glyph instances across all source text rows. */
  glyphCount: number;
  /** Packed signed XY glyph offsets, two Int16 values per glyph. */
  glyphOffsets: Int16Array;
  /** Packed atlas XYWH glyph frames, four Uint16 values per glyph. */
  glyphFrames: Uint16Array;
  /** Packed atlas page index per glyph. */
  glyphPages: Uint16Array;
  /** Horizontal pen advance for each source row. */
  rowAdvances: Float32Array;
  /** Packed minX, minY, maxX, maxY ink bounds for each source row. */
  rowBounds: Float32Array;
  /** Optional character set accumulated while laying out glyphs. */
  characterSet?: Set<string>;
};

/** Compact glyph id stream plus shared glyph definitions for WebGPU text expansion. */
export type GpuExpandedTextStream = {
  /** Cumulative glyph offsets, length = source text rows + 1. */
  startIndices: number[];
  /** Expanded glyph instances across all source text rows. */
  glyphCount: number;
  /** Per-row half-open glyph ranges. */
  labelGlyphRanges: Uint32Array;
  /** Packed Uint16 glyph definition ids, two ids per Uint32 word. */
  packedGlyphIds: Uint32Array;
  /** Shared Float32 atlas XYWH glyph frames. */
  glyphFrames: Float32Array;
  /** Shared Int32 glyph layout offset XY plus advance tuples. */
  glyphMetrics: Int32Array;
  /** Shared Uint32 atlas page index per glyph definition. */
  glyphPages: Uint32Array;
  /** Shared Int32 glyph-id kerning tuples `[first, second, amount, 0]`. */
  glyphKernings: Int32Array;
  /** Signed Float32-compatible baseline offset retained by generated glyph vertices. */
  baselineOffsetY: number;
  /** Optional character set accumulated while laying out glyphs. */
  characterSet?: Set<string>;
  /** Bytes occupied by row glyph ranges plus packed glyph ids. */
  compactStreamByteLength: number;
  /** Bytes occupied by shared glyph frames plus glyph metrics. */
  glyphDefinitionByteLength: number;
  /** CPU time spent building the compact glyph stream. */
  glyphStreamBuildTimeMs: number;
};

/** Packed plain UTF-8 byte ranges used by WebGPU text expansion. */
export type GpuUtf8TextInput = {
  /** Cumulative UTF-8 byte offsets, length = source text rows + 1. */
  startIndices: number[];
  /** Per-row half-open virtual UTF-8 byte ranges. */
  rowByteRanges: Uint32Array;
  /** UTF-8 bytes packed four per Uint32 word. */
  packedUtf8Bytes: Uint32Array;
  /** Total UTF-8 bytes across source text rows. */
  byteLength: number;
  /** Bytes occupied by row ranges plus packed UTF-8 bytes. */
  inputByteLength: number;
  /** CPU time spent building the packed UTF-8 input. */
  textInputBuildTimeMs: number;
};

/** Packed dictionary UTF-8 byte ranges used by WebGPU text expansion. */
export type GpuTextDictionaryUtf8Input = {
  /** Cumulative output glyph offsets, length = source text rows + 1. */
  startIndices: number[];
  /** Normalized dictionary value index for each source text row. */
  rowDictionaryIndices: Uint32Array;
  /** Per-row half-open output glyph ranges. */
  rowOutputGlyphRanges: Uint32Array;
  /** Per-dictionary-value half-open UTF-8 byte ranges. */
  dictionaryValueByteRanges: Uint32Array;
  /** Dictionary UTF-8 bytes packed four per Uint32 word. */
  packedDictionaryUtf8Bytes: Uint32Array;
  /** Expanded glyph instances across all source text rows. */
  byteLength: number;
  /** Total UTF-8 bytes across unique dictionary values. */
  dictionaryByteLength: number;
  /** Bytes occupied by dictionary row/range metadata plus packed UTF-8 bytes. */
  inputByteLength: number;
  /** CPU time spent building the packed dictionary UTF-8 input. */
  textInputBuildTimeMs: number;
};

/** Compressed dictionary glyph runs plus per-row dictionary references. */
export type GpuTextDictionaryCompressedStream = {
  /** Cumulative visible glyph offsets, length = source text rows + 1. */
  startIndices: number[];
  /** Per-row half-open visible glyph ranges. */
  rowGlyphRanges: Uint32Array;
  /** Normalized dictionary value index for each source text row. */
  rowDictionaryIndices: Uint32Array;
  /** Per-dictionary-value half-open ranges into `dictionaryGlyphRecords`. */
  dictionaryGlyphRanges: Uint32Array;
  /** Shared packed dictionary glyph records, two Uint32 words per glyph. */
  dictionaryGlyphRecords: Uint32Array;
  /** Shared Float32 atlas XYWH glyph frames. */
  glyphFrames: Float32Array;
  /** Visible glyph instances across all source text rows. */
  glyphCount: number;
  /** Shared glyph records across unique dictionary values. */
  dictionaryGlyphCount: number;
  /** Normalized dictionary values retained across source data chunks. */
  dictionaryValueCount: number;
  /** Optional character set accumulated while laying out glyphs. */
  characterSet?: Set<string>;
  /** Bytes occupied by compressed row and dictionary glyph stream metadata. */
  compressedStreamByteLength: number;
  /** Bytes occupied by shared glyph frame definitions. */
  glyphDefinitionByteLength: number;
  /** CPU time spent building the compressed dictionary glyph stream. */
  glyphStreamBuildTimeMs: number;
};
