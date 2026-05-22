// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer, type Device, type ShaderLayout} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import type {
  GpuDictionaryUtf8TextInput,
  GpuExpandedTextStream,
  GpuUtf8TextInput
} from './arrow-text';
import {getGpuUtf8MapShaderBindings, getGpuUtf8MapShaderSource} from './gpu-utf8-map';

/** Read-only storage buffer containing shared glyph anchor/advance pairs. */
export type StorageGlyphMetricState = {
  /** Read-only storage buffer consumed by text expansion compute. */
  buffer: Buffer;
  /** Logical bytes occupied by glyph metric data. */
  byteLength: number;
};

/** Read-only storage buffer containing UTF-8 code point to glyph id lookup rows. */
export type StorageGlyphLookupState = {
  /** Read-only storage buffer consumed by UTF-8 text expansion compute. */
  buffer: Buffer;
  /** Logical bytes occupied by glyph lookup data. */
  byteLength: number;
};

/** Read-only compact glyph stream inputs consumed by WebGPU text expansion. */
export type GpuExpandedCompactInputState = {
  /** Per-row half-open glyph range buffer. */
  glyphRangesBuffer: Buffer;
  /** Packed glyph definition id buffer. */
  glyphIdsBuffer: Buffer;
  /** Read-only text expansion config buffer. */
  expansionConfigBuffer: Buffer;
  /** Logical bytes occupied by compact glyph stream inputs. */
  byteLength: number;
};

/** Read-only plain UTF-8 text inputs consumed by WebGPU text expansion. */
export type GpuUtf8ExpandedInputState = {
  /** Per-row half-open UTF-8 byte range buffer. */
  rowByteRangesBuffer: Buffer;
  /** Packed UTF-8 byte buffer. */
  utf8BytesBuffer: Buffer;
  /** Read-only text expansion config buffer. */
  expansionConfigBuffer: Buffer;
  /** Logical bytes occupied by plain UTF-8 text inputs. */
  byteLength: number;
};

/** Read-only dictionary UTF-8 text inputs consumed by WebGPU text expansion. */
export type GpuDictionaryUtf8ExpandedInputState = {
  /** Per-dictionary-value half-open UTF-8 byte range buffer. */
  dictionaryValueByteRangesBuffer: Buffer;
  /** Packed dictionary UTF-8 byte buffer. */
  dictionaryUtf8BytesBuffer: Buffer;
  /** Per-row normalized dictionary value index buffer. */
  rowDictionaryIndicesBuffer: Buffer;
  /** Per-row half-open output glyph range buffer. */
  rowOutputGlyphRangesBuffer: Buffer;
  /** Logical bytes occupied by dictionary UTF-8 text inputs. */
  byteLength: number;
};

/** Read-only dictionary UTF-8 text expansion config buffer. */
export type GpuDictionaryUtf8ExpansionConfigState = {
  /** Read-only text expansion config buffer. */
  expansionConfigBuffer: Buffer;
  /** Logical bytes occupied by dictionary UTF-8 text expansion config. */
  byteLength: number;
};

/** Writable generated compact glyph vertex buffer. */
export type GpuExpandedGeneratedState = {
  /** Generated compact glyph vertex buffer. */
  compactGlyphVertexData: Buffer;
  /** Logical bytes occupied by generated compact glyph vertices. */
  byteLength: number;
};

/** Stable resource naming options shared by GPU text expansion helpers. */
export type GpuTextExpansionResourceOptions = {
  /** Stable resource id prefix. */
  id?: string;
};

/** Row-level anchor and baseline inputs used by GPU text expansion compute. */
export type GpuTextAlignmentExpansionOptions = {
  /** Optional packed per-row text anchor buffer. */
  rowTextAnchorsBuffer?: Buffer;
  /** Optional packed per-row alignment baseline buffer. */
  rowAlignmentBaselinesBuffer?: Buffer;
  /** Whether compute should read `rowTextAnchorsBuffer`. */
  useRowTextAnchors?: boolean;
  /** Whether compute should read `rowAlignmentBaselinesBuffer`. */
  useRowAlignmentBaselines?: boolean;
  /** Constant fallback text anchor enum. */
  textAnchor?: number;
  /** Constant fallback alignment baseline enum. */
  alignmentBaseline?: number;
  /** Constant line height used by alignment math. */
  lineHeight?: number;
};

const GPU_EXPANDED_TEXT_COMPUTE_SOURCE = /* wgsl */ `
@group(0) @binding(0) var<storage, read> textGlyphRanges : array<vec2<u32>>;
@group(0) @binding(1) var<storage, read> textGlyphIds : array<u32>;
@group(0) @binding(2) var<storage, read> textGlyphMetrics : array<vec2<i32>>;
@group(0) @binding(3) var<storage, read> textExpansionConfig : array<i32>;
struct GeneratedGlyphVertex {
  glyphOffsets : u32,
  glyphIndices : u32,
}
@group(0) @binding(4) var<storage, read_write> generatedGlyphVertices : array<GeneratedGlyphVertex>;
@group(0) @binding(5) var<storage, read> textRowTextAnchors : array<u32>;
@group(0) @binding(6) var<storage, read> textRowAlignmentBaselines : array<u32>;

fn unpackGlyphId(glyphIndex: u32) -> u32 {
  let word = textGlyphIds[glyphIndex >> 1u];
  return select(word & 0xffffu, word >> 16u, (glyphIndex & 1u) == 1u);
}

fn packSignedInt16Pair(lowerValue: i32, upperValue: i32) -> u32 {
  return (u32(lowerValue) & 0xffffu) | ((u32(upperValue) & 0xffffu) << 16u);
}

fn getTextAnchor(rowIndex: u32) -> u32 {
  let rowStorageIndex = rowIndex + u32(max(textExpansionConfig[3], 0));
  if (textExpansionConfig[5] != 0) {
    let packedAnchorWord = textRowTextAnchors[rowStorageIndex >> 2u];
    return (packedAnchorWord >> ((rowStorageIndex & 3u) * 8u)) & 0xffu;
  }
  return u32(max(textExpansionConfig[4], 0));
}

fn getAlignmentBaseline(rowIndex: u32) -> u32 {
  let rowStorageIndex = rowIndex + u32(max(textExpansionConfig[3], 0));
  if (textExpansionConfig[7] != 0) {
    let packedBaselineWord = textRowAlignmentBaselines[rowStorageIndex >> 2u];
    return (packedBaselineWord >> ((rowStorageIndex & 3u) * 8u)) & 0xffu;
  }
  return u32(max(textExpansionConfig[6], 0));
}

fn getAnchorShift(width: i32, textAnchor: u32) -> i32 {
  if (textAnchor == 1u) { return -(width / 2i); }
  if (textAnchor == 2u) { return -width; }
  return 0i;
}

fn getBaselineShift(alignmentBaseline: u32) -> i32 {
  let halfLineHeight = textExpansionConfig[8] / 2i;
  if (alignmentBaseline == 1u) { return halfLineHeight; }
  if (alignmentBaseline == 2u) { return -halfLineHeight; }
  return 0i;
}

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) globalInvocationId: vec3<u32>) {
  let rowIndex = globalInvocationId.x;
  let labelCount = u32(max(textExpansionConfig[1], 0));
  if (rowIndex >= labelCount) {
    return;
  }

  let glyphRange = textGlyphRanges[rowIndex];
  let baselineOffsetY = textExpansionConfig[0];
  var width = 0i;
  var glyphIndex = glyphRange.x;
  loop {
    if (glyphIndex >= glyphRange.y) {
      break;
    }
    let glyphId = unpackGlyphId(glyphIndex);
    let metrics = textGlyphMetrics[glyphId];
    width += metrics.y;
    glyphIndex += 1u;
  }
  let anchorShift = getAnchorShift(width, getTextAnchor(rowIndex));
  let baselineShift = getBaselineShift(getAlignmentBaseline(rowIndex));
  glyphIndex = glyphRange.x;
  width = 0i;
  loop {
    if (glyphIndex >= glyphRange.y) { break; }
    let glyphId = unpackGlyphId(glyphIndex);
    let metrics = textGlyphMetrics[glyphId];
    generatedGlyphVertices[glyphIndex] = GeneratedGlyphVertex(
      packSignedInt16Pair(width + metrics.x + anchorShift, baselineOffsetY + baselineShift),
      glyphId & 0xffffu
    );
    width += metrics.y;
    glyphIndex += 1u;
  }
}
`;

const GPU_EXPANDED_TEXT_COMPUTE_SHADER_LAYOUT: ShaderLayout = {
  bindings: [
    {name: 'textGlyphRanges', type: 'read-only-storage', group: 0, location: 0},
    {name: 'textGlyphIds', type: 'read-only-storage', group: 0, location: 1},
    {name: 'textGlyphMetrics', type: 'read-only-storage', group: 0, location: 2},
    {name: 'textExpansionConfig', type: 'read-only-storage', group: 0, location: 3},
    {name: 'generatedGlyphVertices', type: 'storage', group: 0, location: 4},
    {name: 'textRowTextAnchors', type: 'read-only-storage', group: 0, location: 5},
    {name: 'textRowAlignmentBaselines', type: 'read-only-storage', group: 0, location: 6}
  ],
  attributes: []
};

const GPU_UTF8_MAP_BINDING_OPTIONS = {
  rowByteRanges: 'textRowByteRanges',
  utf8Bytes: 'textUtf8Bytes',
  mapStorage: 'textGlyphLookup',
  mapEntryCountExpression: 'u32(max(textExpansionConfig[2], 0))'
} as const;

const GPU_UTF8_EXPANDED_TEXT_COMPUTE_SOURCE = /* wgsl */ `
${getGpuUtf8MapShaderSource(GPU_UTF8_MAP_BINDING_OPTIONS)}
@group(0) @binding(3) var<storage, read> textGlyphMetrics : array<vec2<i32>>;
@group(0) @binding(4) var<storage, read> textExpansionConfig : array<i32>;
struct GeneratedGlyphVertex {
  glyphOffsets : u32,
  glyphIndices : u32,
}
@group(0) @binding(5) var<storage, read_write> generatedGlyphVertices : array<GeneratedGlyphVertex>;
@group(0) @binding(6) var<storage, read> textRowTextAnchors : array<u32>;
@group(0) @binding(7) var<storage, read> textRowAlignmentBaselines : array<u32>;

fn packSignedInt16Pair(lowerValue: i32, upperValue: i32) -> u32 {
  return (u32(lowerValue) & 0xffffu) | ((u32(upperValue) & 0xffffu) << 16u);
}

fn getTextAnchor(rowIndex: u32) -> u32 {
  let rowStorageIndex = rowIndex + u32(max(textExpansionConfig[4], 0));
  if (textExpansionConfig[6] != 0) {
    let packedAnchorWord = textRowTextAnchors[rowStorageIndex >> 2u];
    return (packedAnchorWord >> ((rowStorageIndex & 3u) * 8u)) & 0xffu;
  }
  return u32(max(textExpansionConfig[5], 0));
}

fn getAlignmentBaseline(rowIndex: u32) -> u32 {
  let rowStorageIndex = rowIndex + u32(max(textExpansionConfig[4], 0));
  if (textExpansionConfig[8] != 0) {
    let packedBaselineWord = textRowAlignmentBaselines[rowStorageIndex >> 2u];
    return (packedBaselineWord >> ((rowStorageIndex & 3u) * 8u)) & 0xffu;
  }
  return u32(max(textExpansionConfig[7], 0));
}

fn getAnchorShift(width: i32, textAnchor: u32) -> i32 {
  if (textAnchor == 1u) { return -(width / 2i); }
  if (textAnchor == 2u) { return -width; }
  return 0i;
}

fn getBaselineShift(alignmentBaseline: u32) -> i32 {
  let halfLineHeight = textExpansionConfig[9] / 2i;
  if (alignmentBaseline == 1u) { return halfLineHeight; }
  if (alignmentBaseline == 2u) { return -halfLineHeight; }
  return 0i;
}

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) globalInvocationId: vec3<u32>) {
  let rowIndex = globalInvocationId.x;
  let labelCount = u32(max(textExpansionConfig[1], 0));
  if (rowIndex >= labelCount) {
    return;
  }

  let rowByteRange = getGpuUtf8MapRowByteRange(rowIndex);
  let baselineOffsetY = textExpansionConfig[0];
  var width = 0i;
  var byteIndex = rowByteRange.x;
  loop {
    if (byteIndex >= rowByteRange.y) {
      break;
    }
    let firstByte = readGpuUtf8MapByte(byteIndex);
    if (isGpuUtf8MapCodePointStart(firstByte)) {
      let glyphId = mapGpuUtf8CodePoint(decodeGpuUtf8MapCodePoint(byteIndex));
      let metrics = textGlyphMetrics[glyphId];
      width += metrics.y;
    }
    byteIndex += 1u;
  }
  let anchorShift = getAnchorShift(width, getTextAnchor(rowIndex));
  let baselineShift = getBaselineShift(getAlignmentBaseline(rowIndex));
  width = 0i;
  byteIndex = rowByteRange.x;
  loop {
    if (byteIndex >= rowByteRange.y) { break; }
    let firstByte = readGpuUtf8MapByte(byteIndex);
    if (isGpuUtf8MapCodePointStart(firstByte)) {
      let glyphId = mapGpuUtf8CodePoint(decodeGpuUtf8MapCodePoint(byteIndex));
      let metrics = textGlyphMetrics[glyphId];
      generatedGlyphVertices[byteIndex] = GeneratedGlyphVertex(
        packSignedInt16Pair(width + metrics.x + anchorShift, baselineOffsetY + baselineShift),
        glyphId & 0xffffu
      );
      width += metrics.y;
    }
    byteIndex += 1u;
  }
}
`;

const GPU_UTF8_EXPANDED_TEXT_COMPUTE_SHADER_LAYOUT: ShaderLayout = {
  bindings: [
    ...getGpuUtf8MapShaderBindings(GPU_UTF8_MAP_BINDING_OPTIONS),
    {name: 'textGlyphMetrics', type: 'read-only-storage', group: 0, location: 3},
    {name: 'textExpansionConfig', type: 'read-only-storage', group: 0, location: 4},
    {name: 'generatedGlyphVertices', type: 'storage', group: 0, location: 5},
    {name: 'textRowTextAnchors', type: 'read-only-storage', group: 0, location: 6},
    {name: 'textRowAlignmentBaselines', type: 'read-only-storage', group: 0, location: 7}
  ],
  attributes: []
};

const GPU_DICTIONARY_UTF8_EXPANDED_TEXT_COMPUTE_SOURCE = /* wgsl */ `
@group(0) @binding(0) var<storage, read> textDictionaryValueByteRanges : array<vec2<u32>>;
@group(0) @binding(1) var<storage, read> textDictionaryUtf8Bytes : array<u32>;
@group(0) @binding(2) var<storage, read> textRowDictionaryIndices : array<u32>;
@group(0) @binding(3) var<storage, read> textRowOutputGlyphRanges : array<vec2<u32>>;
@group(0) @binding(4) var<storage, read> textGlyphLookup : array<vec2<u32>>;
@group(0) @binding(5) var<storage, read> textGlyphMetrics : array<vec2<i32>>;
@group(0) @binding(6) var<storage, read> textExpansionConfig : array<i32>;
struct GeneratedGlyphVertex {
  glyphOffsets : u32,
  glyphIndices : u32,
}
@group(0) @binding(7) var<storage, read_write> generatedGlyphVertices : array<GeneratedGlyphVertex>;
@group(0) @binding(8) var<storage, read> textRowTextAnchors : array<u32>;
@group(0) @binding(9) var<storage, read> textRowAlignmentBaselines : array<u32>;

fn readDictionaryUtf8Byte(byteIndex: u32) -> u32 {
  let word = textDictionaryUtf8Bytes[byteIndex >> 2u];
  let byteShift = (byteIndex & 3u) << 3u;
  return (word >> byteShift) & 0xffu;
}

fn isDictionaryUtf8CodePointStart(firstByte: u32) -> bool {
  return (firstByte & 0xc0u) != 0x80u;
}

fn decodeDictionaryUtf8CodePoint(byteIndex: u32) -> u32 {
  let firstByte = readDictionaryUtf8Byte(byteIndex);
  if ((firstByte & 0x80u) == 0u) {
    return firstByte;
  }
  if ((firstByte & 0xe0u) == 0xc0u) {
    return ((firstByte & 0x1fu) << 6u) | (readDictionaryUtf8Byte(byteIndex + 1u) & 0x3fu);
  }
  if ((firstByte & 0xf0u) == 0xe0u) {
    return
      ((firstByte & 0x0fu) << 12u) |
      ((readDictionaryUtf8Byte(byteIndex + 1u) & 0x3fu) << 6u) |
      (readDictionaryUtf8Byte(byteIndex + 2u) & 0x3fu);
  }
  if ((firstByte & 0xf8u) == 0xf0u) {
    return
      ((firstByte & 0x07u) << 18u) |
      ((readDictionaryUtf8Byte(byteIndex + 1u) & 0x3fu) << 12u) |
      ((readDictionaryUtf8Byte(byteIndex + 2u) & 0x3fu) << 6u) |
      (readDictionaryUtf8Byte(byteIndex + 3u) & 0x3fu);
  }
  return 0xfffdu;
}

fn mapDictionaryUtf8CodePoint(codePoint: u32) -> u32 {
  let mapEntryCount = u32(max(textExpansionConfig[2], 0));
  var mapEntryIndex = 0u;
  loop {
    if (mapEntryIndex >= mapEntryCount) {
      break;
    }
    let mapEntry = textGlyphLookup[mapEntryIndex];
    if (mapEntry.x == codePoint) {
      return mapEntry.y;
    }
    mapEntryIndex += 1u;
  }
  return 0u;
}

fn packSignedInt16Pair(lowerValue: i32, upperValue: i32) -> u32 {
  return (u32(lowerValue) & 0xffffu) | ((u32(upperValue) & 0xffffu) << 16u);
}

fn getTextAnchor(rowIndex: u32) -> u32 {
  let rowStorageIndex = rowIndex + u32(max(textExpansionConfig[4], 0));
  if (textExpansionConfig[7] != 0) {
    let packedAnchorWord = textRowTextAnchors[rowStorageIndex >> 2u];
    return (packedAnchorWord >> ((rowStorageIndex & 3u) * 8u)) & 0xffu;
  }
  return u32(max(textExpansionConfig[6], 0));
}

fn getAlignmentBaseline(rowIndex: u32) -> u32 {
  let rowStorageIndex = rowIndex + u32(max(textExpansionConfig[4], 0));
  if (textExpansionConfig[9] != 0) {
    let packedBaselineWord = textRowAlignmentBaselines[rowStorageIndex >> 2u];
    return (packedBaselineWord >> ((rowStorageIndex & 3u) * 8u)) & 0xffu;
  }
  return u32(max(textExpansionConfig[8], 0));
}

fn getAnchorShift(width: i32, textAnchor: u32) -> i32 {
  if (textAnchor == 1u) { return -(width / 2i); }
  if (textAnchor == 2u) { return -width; }
  return 0i;
}

fn getBaselineShift(alignmentBaseline: u32) -> i32 {
  let halfLineHeight = textExpansionConfig[10] / 2i;
  if (alignmentBaseline == 1u) { return halfLineHeight; }
  if (alignmentBaseline == 2u) { return -halfLineHeight; }
  return 0i;
}

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) globalInvocationId: vec3<u32>) {
  let rowIndex = globalInvocationId.x;
  let labelCount = u32(max(textExpansionConfig[1], 0));
  if (rowIndex >= labelCount) {
    return;
  }

  let rowStorageIndex = rowIndex + u32(max(textExpansionConfig[4], 0));
  let dictionaryIndex = textRowDictionaryIndices[rowStorageIndex];
  if (dictionaryIndex == 0xffffffffu) {
    return;
  }

  let rowOutputRange = textRowOutputGlyphRanges[rowStorageIndex];
  let outputGlyphIndexBase = u32(max(textExpansionConfig[5], 0));
  let outputGlyphStart = select(0u, rowOutputRange.x - outputGlyphIndexBase, rowOutputRange.x >= outputGlyphIndexBase);
  let dictionaryByteRange = textDictionaryValueByteRanges[dictionaryIndex];
  let baselineOffsetY = textExpansionConfig[0];
  var width = 0i;
  var byteIndex = dictionaryByteRange.x;
  loop {
    if (byteIndex >= dictionaryByteRange.y) {
      break;
    }
    let firstByte = readDictionaryUtf8Byte(byteIndex);
    if (isDictionaryUtf8CodePointStart(firstByte)) {
      let glyphId = mapDictionaryUtf8CodePoint(decodeDictionaryUtf8CodePoint(byteIndex));
      let metrics = textGlyphMetrics[glyphId];
      width += metrics.y;
    }
    byteIndex += 1u;
  }
  let anchorShift = getAnchorShift(width, getTextAnchor(rowIndex));
  let baselineShift = getBaselineShift(getAlignmentBaseline(rowIndex));
  width = 0i;
  byteIndex = dictionaryByteRange.x;
  var outputGlyphIndex = outputGlyphStart;
  loop {
    if (byteIndex >= dictionaryByteRange.y) { break; }
    let firstByte = readDictionaryUtf8Byte(byteIndex);
    if (isDictionaryUtf8CodePointStart(firstByte)) {
      let glyphId = mapDictionaryUtf8CodePoint(decodeDictionaryUtf8CodePoint(byteIndex));
      let metrics = textGlyphMetrics[glyphId];
      generatedGlyphVertices[outputGlyphIndex] = GeneratedGlyphVertex(
        packSignedInt16Pair(width + metrics.x + anchorShift, baselineOffsetY + baselineShift),
        glyphId & 0xffffu
      );
      width += metrics.y;
      outputGlyphIndex += 1u;
    }
    byteIndex += 1u;
  }
}
`;

const GPU_DICTIONARY_UTF8_EXPANDED_TEXT_COMPUTE_SHADER_LAYOUT: ShaderLayout = {
  bindings: [
    {name: 'textDictionaryValueByteRanges', type: 'read-only-storage', group: 0, location: 0},
    {name: 'textDictionaryUtf8Bytes', type: 'read-only-storage', group: 0, location: 1},
    {name: 'textRowDictionaryIndices', type: 'read-only-storage', group: 0, location: 2},
    {name: 'textRowOutputGlyphRanges', type: 'read-only-storage', group: 0, location: 3},
    {name: 'textGlyphLookup', type: 'read-only-storage', group: 0, location: 4},
    {name: 'textGlyphMetrics', type: 'read-only-storage', group: 0, location: 5},
    {name: 'textExpansionConfig', type: 'read-only-storage', group: 0, location: 6},
    {name: 'generatedGlyphVertices', type: 'storage', group: 0, location: 7},
    {name: 'textRowTextAnchors', type: 'read-only-storage', group: 0, location: 8},
    {name: 'textRowAlignmentBaselines', type: 'read-only-storage', group: 0, location: 9}
  ],
  attributes: []
};

/** Creates one read-only storage buffer for shared glyph metric rows. */
export function createStorageGlyphMetrics(
  device: Device,
  options: GpuTextExpansionResourceOptions,
  glyphMetricData: Int32Array
): StorageGlyphMetricState {
  return {
    buffer: device.createBuffer({
      id: `${options.id || 'gpu-expanded-text-model'}-glyph-metrics`,
      usage: Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
      data: glyphMetricData.byteLength > 0 ? glyphMetricData : new Int32Array(2)
    }),
    byteLength: glyphMetricData.byteLength
  };
}

/** Creates one read-only storage buffer for UTF-8 code point lookup rows. */
export function createStorageGlyphLookup(
  device: Device,
  options: GpuTextExpansionResourceOptions,
  glyphLookupData: Uint32Array
): StorageGlyphLookupState {
  return {
    buffer: device.createBuffer({
      id: `${options.id || 'gpu-expanded-text-model'}-glyph-lookup`,
      usage: Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
      data: glyphLookupData.byteLength > 0 ? glyphLookupData : new Uint32Array(2)
    }),
    byteLength: glyphLookupData.byteLength
  };
}

/** Creates read-only storage inputs for compact glyph id expansion. */
export function createGpuExpandedCompactInput(
  device: Device,
  options: GpuTextExpansionResourceOptions,
  glyphStream: GpuExpandedTextStream,
  batchRowIndexBase = 0,
  alignment: GpuTextAlignmentExpansionOptions = {},
  rowStorageIndexBase = 0
): GpuExpandedCompactInputState {
  const expansionConfig = new Int32Array([
    glyphStream.baselineOffsetY,
    glyphStream.labelGlyphRanges.length / 2,
    batchRowIndexBase,
    rowStorageIndexBase,
    alignment.textAnchor ?? 0,
    alignment.useRowTextAnchors ? 1 : 0,
    alignment.alignmentBaseline ?? 0,
    alignment.useRowAlignmentBaselines ? 1 : 0,
    alignment.lineHeight ?? 0
  ]);
  return {
    glyphRangesBuffer: device.createBuffer({
      id: `${options.id || 'gpu-expanded-text-model'}-glyph-ranges`,
      usage: Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
      data:
        glyphStream.labelGlyphRanges.byteLength > 0
          ? glyphStream.labelGlyphRanges
          : new Uint32Array(2)
    }),
    glyphIdsBuffer: device.createBuffer({
      id: `${options.id || 'gpu-expanded-text-model'}-glyph-ids`,
      usage: Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
      data:
        glyphStream.packedGlyphIds.byteLength > 0 ? glyphStream.packedGlyphIds : new Uint32Array(1)
    }),
    expansionConfigBuffer: device.createBuffer({
      id: `${options.id || 'gpu-expanded-text-model'}-expansion-config`,
      usage: Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
      data: expansionConfig
    }),
    byteLength:
      glyphStream.labelGlyphRanges.byteLength +
      glyphStream.packedGlyphIds.byteLength +
      expansionConfig.byteLength
  };
}

/** Creates read-only storage inputs for plain UTF-8 text expansion. */
export function createGpuUtf8ExpandedInput(
  device: Device,
  options: GpuTextExpansionResourceOptions,
  {
    utf8TextInput,
    baselineOffsetY,
    glyphLookupCount,
    labelCount,
    batchRowIndexBase = 0,
    rowStorageIndexBase = 0,
    alignment = {}
  }: {
    utf8TextInput: GpuUtf8TextInput;
    baselineOffsetY: number;
    glyphLookupCount: number;
    labelCount: number;
    batchRowIndexBase?: number;
    rowStorageIndexBase?: number;
    alignment?: GpuTextAlignmentExpansionOptions;
  }
): GpuUtf8ExpandedInputState {
  const expansionConfig = new Int32Array([
    baselineOffsetY,
    labelCount,
    glyphLookupCount,
    batchRowIndexBase,
    rowStorageIndexBase,
    alignment.textAnchor ?? 0,
    alignment.useRowTextAnchors ? 1 : 0,
    alignment.alignmentBaseline ?? 0,
    alignment.useRowAlignmentBaselines ? 1 : 0,
    alignment.lineHeight ?? 0
  ]);
  return {
    rowByteRangesBuffer: device.createBuffer({
      id: `${options.id || 'gpu-expanded-text-model'}-utf8-row-byte-ranges`,
      usage: Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
      data:
        utf8TextInput.rowByteRanges.byteLength > 0
          ? utf8TextInput.rowByteRanges
          : new Uint32Array(2)
    }),
    utf8BytesBuffer: device.createBuffer({
      id: `${options.id || 'gpu-expanded-text-model'}-utf8-bytes`,
      usage: Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
      data:
        utf8TextInput.packedUtf8Bytes.byteLength > 0
          ? utf8TextInput.packedUtf8Bytes
          : new Uint32Array(1)
    }),
    expansionConfigBuffer: device.createBuffer({
      id: `${options.id || 'gpu-expanded-text-model'}-utf8-expansion-config`,
      usage: Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
      data: expansionConfig
    }),
    byteLength: utf8TextInput.inputByteLength + expansionConfig.byteLength
  };
}

/** Creates read-only storage inputs for dictionary UTF-8 text expansion. */
export function createGpuDictionaryUtf8ExpandedInput(
  device: Device,
  options: GpuTextExpansionResourceOptions,
  dictionaryTextInput: GpuDictionaryUtf8TextInput
): GpuDictionaryUtf8ExpandedInputState {
  return {
    dictionaryValueByteRangesBuffer: device.createBuffer({
      id: `${options.id || 'gpu-expanded-text-model'}-dictionary-value-byte-ranges`,
      usage: Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
      data:
        dictionaryTextInput.dictionaryValueByteRanges.byteLength > 0
          ? dictionaryTextInput.dictionaryValueByteRanges
          : new Uint32Array(2)
    }),
    dictionaryUtf8BytesBuffer: device.createBuffer({
      id: `${options.id || 'gpu-expanded-text-model'}-dictionary-utf8-bytes`,
      usage: Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
      data:
        dictionaryTextInput.packedDictionaryUtf8Bytes.byteLength > 0
          ? dictionaryTextInput.packedDictionaryUtf8Bytes
          : new Uint32Array(1)
    }),
    rowDictionaryIndicesBuffer: device.createBuffer({
      id: `${options.id || 'gpu-expanded-text-model'}-row-dictionary-indices`,
      usage: Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
      data:
        dictionaryTextInput.rowDictionaryIndices.byteLength > 0
          ? dictionaryTextInput.rowDictionaryIndices
          : new Uint32Array(1)
    }),
    rowOutputGlyphRangesBuffer: device.createBuffer({
      id: `${options.id || 'gpu-expanded-text-model'}-row-output-glyph-ranges`,
      usage: Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
      data:
        dictionaryTextInput.rowOutputGlyphRanges.byteLength > 0
          ? dictionaryTextInput.rowOutputGlyphRanges
          : new Uint32Array(2)
    }),
    byteLength: dictionaryTextInput.inputByteLength
  };
}

/** Creates read-only config for dictionary UTF-8 text expansion. */
export function createGpuDictionaryUtf8ExpansionConfig(
  device: Device,
  options: GpuTextExpansionResourceOptions,
  {
    baselineOffsetY,
    glyphLookupCount,
    labelCount,
    batchRowIndexBase = 0,
    rowStorageIndexBase = 0,
    outputGlyphIndexBase = 0,
    alignment = {}
  }: {
    baselineOffsetY: number;
    glyphLookupCount: number;
    labelCount: number;
    batchRowIndexBase?: number;
    rowStorageIndexBase?: number;
    outputGlyphIndexBase?: number;
    alignment?: GpuTextAlignmentExpansionOptions;
  }
): GpuDictionaryUtf8ExpansionConfigState {
  const expansionConfig = new Int32Array([
    baselineOffsetY,
    labelCount,
    glyphLookupCount,
    batchRowIndexBase,
    rowStorageIndexBase,
    outputGlyphIndexBase,
    alignment.textAnchor ?? 0,
    alignment.useRowTextAnchors ? 1 : 0,
    alignment.alignmentBaseline ?? 0,
    alignment.useRowAlignmentBaselines ? 1 : 0,
    alignment.lineHeight ?? 0
  ]);
  return {
    expansionConfigBuffer: device.createBuffer({
      id: `${options.id || 'gpu-expanded-text-model'}-dictionary-utf8-expansion-config`,
      usage: Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
      data: expansionConfig
    }),
    byteLength: expansionConfig.byteLength
  };
}

/** Creates one writable compact glyph vertex output buffer. */
export function createGpuExpandedGeneratedState(
  device: Device,
  options: GpuTextExpansionResourceOptions,
  glyphCount: number
): GpuExpandedGeneratedState {
  const outputRecordCount = Math.max(glyphCount, 1);
  const byteLength = glyphCount * Uint32Array.BYTES_PER_ELEMENT * 2;
  return {
    compactGlyphVertexData: device.createBuffer({
      id: `${options.id || 'gpu-expanded-text-model'}-generated-glyph-vertices`,
      usage: Buffer.VERTEX | Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
      data: new Uint32Array(outputRecordCount * 2)
    }),
    byteLength
  };
}

/** Dispatches WebGPU compute that expands compact glyph ids into glyph vertices. */
export function dispatchGpuExpandedTextCompute(
  device: Device,
  options: GpuTextExpansionResourceOptions,
  state: {
    compactInput: GpuExpandedCompactInputState;
    glyphMetrics: StorageGlyphMetricState;
    generated: GpuExpandedGeneratedState;
    glyphCount: number;
    labelCount: number;
    alignment: Required<
      Pick<GpuTextAlignmentExpansionOptions, 'rowTextAnchorsBuffer' | 'rowAlignmentBaselinesBuffer'>
    >;
  }
): void {
  const computation = new Computation(device, {
    id: `${options.id || 'gpu-expanded-text-model'}-compute`,
    source: GPU_EXPANDED_TEXT_COMPUTE_SOURCE,
    shaderLayout: GPU_EXPANDED_TEXT_COMPUTE_SHADER_LAYOUT,
    bindings: {
      textGlyphRanges: state.compactInput.glyphRangesBuffer,
      textGlyphIds: state.compactInput.glyphIdsBuffer,
      textGlyphMetrics: state.glyphMetrics.buffer,
      textExpansionConfig: state.compactInput.expansionConfigBuffer,
      generatedGlyphVertices: state.generated.compactGlyphVertexData,
      textRowTextAnchors: state.alignment.rowTextAnchorsBuffer,
      textRowAlignmentBaselines: state.alignment.rowAlignmentBaselinesBuffer
    }
  });
  if (state.glyphCount > 0 && state.labelCount > 0) {
    const computePass = device.beginComputePass({});
    computation.dispatch(computePass, Math.ceil(state.labelCount / 64));
    computePass.end();
    device.submit();
  }
  computation.destroy();
}

/** Dispatches WebGPU compute that decodes plain UTF-8 rows into glyph vertices. */
export function dispatchGpuUtf8ExpandedTextCompute(
  device: Device,
  options: GpuTextExpansionResourceOptions,
  state: {
    utf8Input: GpuUtf8ExpandedInputState;
    glyphLookup: StorageGlyphLookupState;
    glyphMetrics: StorageGlyphMetricState;
    generated: GpuExpandedGeneratedState;
    outputSlotCount: number;
    labelCount: number;
    alignment: Required<
      Pick<GpuTextAlignmentExpansionOptions, 'rowTextAnchorsBuffer' | 'rowAlignmentBaselinesBuffer'>
    >;
  }
): void {
  const computation = new Computation(device, {
    id: `${options.id || 'gpu-expanded-text-model'}-utf8-compute`,
    source: GPU_UTF8_EXPANDED_TEXT_COMPUTE_SOURCE,
    shaderLayout: GPU_UTF8_EXPANDED_TEXT_COMPUTE_SHADER_LAYOUT,
    bindings: {
      textRowByteRanges: state.utf8Input.rowByteRangesBuffer,
      textUtf8Bytes: state.utf8Input.utf8BytesBuffer,
      textGlyphLookup: state.glyphLookup.buffer,
      textGlyphMetrics: state.glyphMetrics.buffer,
      textExpansionConfig: state.utf8Input.expansionConfigBuffer,
      generatedGlyphVertices: state.generated.compactGlyphVertexData,
      textRowTextAnchors: state.alignment.rowTextAnchorsBuffer,
      textRowAlignmentBaselines: state.alignment.rowAlignmentBaselinesBuffer
    }
  });
  if (state.outputSlotCount > 0 && state.labelCount > 0) {
    const computePass = device.beginComputePass({});
    computation.dispatch(computePass, Math.ceil(state.labelCount / 64));
    computePass.end();
    device.submit();
  }
  computation.destroy();
}

/** Dispatches WebGPU compute that decodes dictionary UTF-8 rows into glyph vertices. */
export function dispatchGpuDictionaryUtf8ExpandedTextCompute(
  device: Device,
  options: GpuTextExpansionResourceOptions,
  state: {
    dictionaryInput: GpuDictionaryUtf8ExpandedInputState;
    expansionConfig: GpuDictionaryUtf8ExpansionConfigState;
    glyphLookup: StorageGlyphLookupState;
    glyphMetrics: StorageGlyphMetricState;
    generated: GpuExpandedGeneratedState;
    glyphCount: number;
    labelCount: number;
    alignment: Required<
      Pick<GpuTextAlignmentExpansionOptions, 'rowTextAnchorsBuffer' | 'rowAlignmentBaselinesBuffer'>
    >;
  }
): void {
  const computation = new Computation(device, {
    id: `${options.id || 'gpu-expanded-text-model'}-dictionary-utf8-compute`,
    source: GPU_DICTIONARY_UTF8_EXPANDED_TEXT_COMPUTE_SOURCE,
    shaderLayout: GPU_DICTIONARY_UTF8_EXPANDED_TEXT_COMPUTE_SHADER_LAYOUT,
    bindings: {
      textDictionaryValueByteRanges: state.dictionaryInput.dictionaryValueByteRangesBuffer,
      textDictionaryUtf8Bytes: state.dictionaryInput.dictionaryUtf8BytesBuffer,
      textRowDictionaryIndices: state.dictionaryInput.rowDictionaryIndicesBuffer,
      textRowOutputGlyphRanges: state.dictionaryInput.rowOutputGlyphRangesBuffer,
      textGlyphLookup: state.glyphLookup.buffer,
      textGlyphMetrics: state.glyphMetrics.buffer,
      textExpansionConfig: state.expansionConfig.expansionConfigBuffer,
      generatedGlyphVertices: state.generated.compactGlyphVertexData,
      textRowTextAnchors: state.alignment.rowTextAnchorsBuffer,
      textRowAlignmentBaselines: state.alignment.rowAlignmentBaselinesBuffer
    }
  });
  if (state.glyphCount > 0 && state.labelCount > 0) {
    const computePass = device.beginComputePass({});
    computation.dispatch(computePass, Math.ceil(state.labelCount / 64));
    computePass.end();
    device.submit();
  }
  computation.destroy();
}
