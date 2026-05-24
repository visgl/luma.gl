// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {type Buffer, type Device, type RenderPass, type ShaderLayout} from '@luma.gl/core';
import {ArrowModel, makeArrowGPURecordBatch, type ArrowModelProps} from '@luma.gl/arrow';
import {DynamicBuffer, DynamicTexture, Model} from '@luma.gl/engine';
import {planGeneratedBufferBatches} from '@luma.gl/tables';
import {Table, type Vector} from 'apache-arrow';
import FontAtlasManager from './font-atlas-manager';
import type {
  ArrowGlyphLayout,
  GpuDictionaryCompressedTextStream,
  GpuExpandedTextStream
} from './arrow-text';
import {
  appendArrowGlyphLayout,
  appendArrowStorageTextStateBatches,
  assertArrowTextAppendPrefixStable,
  assertArrowTextAppendProps,
  assertArrowTextSourceAppendPrefixStable,
  assertArrowTextVectorBatchAlignment,
  assertArrowTextVectorTypes,
  buildArrowTextGlyphTable,
  createArrowAttributeTextState,
  createArrowDictionaryStorageTextState,
  createArrowStorageTextState,
  createArrowTextRenderTable,
  createExpandedGlyphVertexData,
  getFirstArrowDictionaryStorageTextBatch,
  getFirstArrowDictionaryStorageTextRenderBatch,
  getFirstArrowStorageTextBatch,
  getFirstArrowStorageTextRenderBatch,
  getStorageRowGlyphStartsBuffer,
  refreshArrowDictionaryStorageTextRowBindings,
  refreshArrowStorageTextRowBindings,
  resolveArrowTextBatchInputs,
  resolveArrowTextShaderLayout,
  type ArrowAttributeTextModelStateProps,
  type ArrowDictionaryStorageTextBatchState,
  type ArrowDictionaryStorageTextInputProps,
  type ArrowDictionaryStorageTextModelProps,
  type ArrowDictionaryStorageTextRenderBatchState,
  type ArrowDictionaryStorageTextRenderProps,
  type ArrowDictionaryStorageTextState,
  type ArrowStorageTextBatchState,
  type ArrowStorageTextInputProps,
  type ArrowStorageTextModelProps,
  type ArrowStorageTextRenderBatchState,
  type ArrowStorageTextRenderProps,
  type ArrowStorageTextState,
  type ArrowTextModelProps,
  type ArrowTextRenderBatchState,
  type ResolvedCharacterMapping,
  type StorageTextBuffer,
  type TextSdfRenderSettings
} from './arrow-text-model';

const GLYPH_OFFSETS_COLUMN = 'glyphOffsets';
const GLYPH_FRAMES_COLUMN = 'glyphFrames';
const GLYPH_INDICES_COLUMN = 'glyphIndices';
const GLYPH_CLIP_RECTS_COLUMN = 'glyphClipRects';
const EXPANDED_GLYPH_VERTEX_DATA = 'expandedGlyphVertexData';
const COMPACT_GLYPH_VERTEX_DATA = 'compactGlyphVertexData';
const COMPACT_GLYPH_VERTEX_BYTE_STRIDE = Uint32Array.BYTES_PER_ELEMENT * 2;
const EXPANDED_GLYPH_VERTEX_BYTE_STRIDE = Uint32Array.BYTES_PER_ELEMENT * 4;
const CLIPPED_EXPANDED_GLYPH_VERTEX_BYTE_STRIDE =
  EXPANDED_GLYPH_VERTEX_BYTE_STRIDE + Int16Array.BYTES_PER_ELEMENT * 4;
const INVALID_DICTIONARY_INDEX = 0xffffffff;

export const DEFAULT_ARROW_TEXT_SHADER_LAYOUT: ShaderLayout = {
  attributes: [
    {name: 'positions', location: 0, type: 'vec2<f32>', stepMode: 'instance'},
    {name: GLYPH_OFFSETS_COLUMN, location: 1, type: 'vec2<i32>', stepMode: 'instance'},
    {name: GLYPH_FRAMES_COLUMN, location: 2, type: 'vec4<u32>', stepMode: 'instance'}
  ],
  bindings: []
};

export const DEFAULT_CLIPPED_ARROW_TEXT_SHADER_LAYOUT: ShaderLayout = {
  attributes: [
    ...DEFAULT_ARROW_TEXT_SHADER_LAYOUT.attributes,
    {name: GLYPH_CLIP_RECTS_COLUMN, location: 3, type: 'vec4<i32>', stepMode: 'instance'}
  ],
  bindings: []
};

export const DEFAULT_STORAGE_INDEXED_TEXT_SHADER_LAYOUT: ShaderLayout = {
  attributes: [
    {name: GLYPH_OFFSETS_COLUMN, location: 0, type: 'vec2<i32>', stepMode: 'instance'},
    {name: GLYPH_INDICES_COLUMN, location: 1, type: 'vec2<u32>', stepMode: 'instance'}
  ],
  bindings: []
};

export const DEFAULT_DICTIONARY_STORAGE_TEXT_SHADER_LAYOUT: ShaderLayout = {
  attributes: [],
  bindings: []
};

export const DEFAULT_ARROW_TEXT_VS = `#version 300 es
precision highp float;

in vec2 positions;
in ivec2 glyphOffsets;
in uvec4 glyphFrames;

out vec2 vTextureCoordinate;

uniform sampler2D fontAtlasTexture;

vec2 getCorner(int vertexIndex) {
  if (vertexIndex == 0) return vec2(0.0, 0.0);
  if (vertexIndex == 1) return vec2(1.0, 0.0);
  if (vertexIndex == 2) return vec2(1.0, 1.0);
  if (vertexIndex == 3) return vec2(0.0, 0.0);
  if (vertexIndex == 4) return vec2(1.0, 1.0);
  return vec2(0.0, 1.0);
}

void main() {
  vec2 corner = getCorner(gl_VertexID % 6);
  vec2 atlasSize = vec2(textureSize(fontAtlasTexture, 0));
  vec4 glyphFrame = vec4(glyphFrames);
  vec2 glyphOffset = vec2(glyphOffsets);
  vec2 glyphSize = glyphFrame.zw;
  vec2 glyphPosition = positions + (glyphOffset + corner * glyphSize) * 0.001;
  gl_Position = vec4(glyphPosition, 0.0, 1.0);
  vTextureCoordinate = (glyphFrame.xy + corner * glyphSize) / atlasSize;
}
`;

export const DEFAULT_CLIPPED_ARROW_TEXT_VS = `#version 300 es
precision highp float;

in vec2 positions;
in ivec2 glyphOffsets;
in uvec4 glyphFrames;
in ivec4 glyphClipRects;

out vec2 vTextureCoordinate;

uniform sampler2D fontAtlasTexture;

vec2 getCorner(int vertexIndex) {
  if (vertexIndex == 0) return vec2(0.0, 0.0);
  if (vertexIndex == 1) return vec2(1.0, 0.0);
  if (vertexIndex == 2) return vec2(1.0, 1.0);
  if (vertexIndex == 3) return vec2(0.0, 0.0);
  if (vertexIndex == 4) return vec2(1.0, 1.0);
  return vec2(0.0, 1.0);
}

bool isGlyphVertexClipped(vec2 glyphVertexOffset, ivec4 clipRect) {
  if (clipRect.z >= 0) {
    float clipMinX = float(clipRect.x);
    float clipMaxX = clipMinX + float(clipRect.z);
    if (glyphVertexOffset.x < clipMinX || glyphVertexOffset.x > clipMaxX) {
      return true;
    }
  }
  if (clipRect.w >= 0) {
    float clipMinY = float(clipRect.y);
    float clipMaxY = clipMinY + float(clipRect.w);
    if (glyphVertexOffset.y < clipMinY || glyphVertexOffset.y > clipMaxY) {
      return true;
    }
  }
  return false;
}

void main() {
  vec2 corner = getCorner(gl_VertexID % 6);
  vec2 atlasSize = vec2(textureSize(fontAtlasTexture, 0));
  vec4 glyphFrame = vec4(glyphFrames);
  vec2 glyphOffset = vec2(glyphOffsets);
  vec2 glyphSize = glyphFrame.zw;
  vec2 glyphVertexOffset = glyphOffset + corner * glyphSize;
  vec2 glyphPosition = positions + glyphVertexOffset * 0.001;
  gl_Position = isGlyphVertexClipped(glyphVertexOffset, glyphClipRects)
    ? vec4(0.0)
    : vec4(glyphPosition, 0.0, 1.0);
  vTextureCoordinate = (glyphFrame.xy + corner * glyphSize) / atlasSize;
}
`;

export const DEFAULT_ARROW_TEXT_FS = `#version 300 es
precision highp float;

uniform sampler2D fontAtlasTexture;
uniform float textUsesSdf;
uniform float textSdfThreshold;
uniform float textSdfSmoothing;
in vec2 vTextureCoordinate;
out vec4 fragColor;

void main() {
  float sampledAlpha = texture(fontAtlasTexture, vTextureCoordinate).a;
  float sdfAlpha = textSdfSmoothing > 0.0
    ? smoothstep(
        textSdfThreshold - textSdfSmoothing,
        textSdfThreshold + textSdfSmoothing,
        sampledAlpha
      )
    : step(textSdfThreshold, sampledAlpha);
  float alpha = textUsesSdf > 0.5 ? sdfAlpha : sampledAlpha;
  fragColor = vec4(1.0, 1.0, 1.0, alpha);
}
`;

export const DEFAULT_STORAGE_INDEXED_TEXT_SOURCE = /* wgsl */ `
@group(0) @binding(auto) var fontAtlasTexture : texture_2d<f32>;
@group(0) @binding(auto) var fontAtlasTextureSampler : sampler;
@group(0) @binding(auto) var<storage, read> textRowPositions : array<vec2<f32>>;
@group(0) @binding(auto) var<storage, read> textRowColors : array<u32>;
@group(0) @binding(auto) var<storage, read> textRowAngles : array<f32>;
@group(0) @binding(auto) var<storage, read> textRowSizes : array<f32>;
@group(0) @binding(auto) var<storage, read> textRowPixelOffsets : array<vec2<f32>>;
@group(0) @binding(auto) var<storage, read> textRowClipRects : array<vec2<u32>>;
@group(0) @binding(auto) var<storage, read> textRowGlyphStarts : array<u32>;
@group(0) @binding(auto) var<storage, read> textGlyphFrames : array<vec4<f32>>;

struct TextStorageStyleConfig {
  constantColor : vec4<f32>,
  constantAngleDegrees : f32,
  constantSize : f32,
  constantPixelOffset : vec2<f32>,
  useRowColors : u32,
  useRowAngles : u32,
  useRowSizes : u32,
  useRowPixelOffsets : u32,
  hasClipRects : u32,
  batchRowIndexBase : u32,
  rowStorageIndexBase : u32,
  _padding0 : u32,
  sdfThreshold : f32,
  sdfSmoothing : f32,
  _padding1 : vec2<f32>,
};

@group(0) @binding(auto) var<uniform> textStorageStyleConfig : TextStorageStyleConfig;

struct TextStorageRenderConfig {
  glyphIndexBase : u32,
  rowStart : u32,
  rowEnd : u32,
  _padding : u32,
};

@group(0) @binding(auto) var<uniform> textStorageRenderConfig : TextStorageRenderConfig;

struct VertexInputs {
  @builtin(vertex_index) vertexIndex : u32,
  @builtin(instance_index) instanceIndex : u32,
  @location(0) glyphOffsets : vec2<i32>,
  @location(1) glyphIndices : vec2<u32>,
};

struct FragmentInputs {
  @builtin(position) position : vec4<f32>,
  @location(0) atlasUV : vec2<f32>,
  @location(1) color : vec4<f32>,
};

fn getGlyphCorner(vertexIndex: u32) -> vec2<f32> {
  let corners = array<vec2<f32>, 6>(
    vec2<f32>(0.0, 0.0),
    vec2<f32>(1.0, 0.0),
    vec2<f32>(1.0, 1.0),
    vec2<f32>(0.0, 0.0),
    vec2<f32>(1.0, 1.0),
    vec2<f32>(0.0, 1.0)
  );
  return corners[vertexIndex % 6u];
}

fn unpackLowInt16(word: u32) -> i32 {
  return i32(word << 16u) >> 16;
}

fn unpackHighInt16(word: u32) -> i32 {
  return i32(word) >> 16;
}

fn unpackClipRect(words: vec2<u32>) -> vec4<i32> {
  return vec4<i32>(
    unpackLowInt16(words.x),
    unpackHighInt16(words.x),
    unpackLowInt16(words.y),
    unpackHighInt16(words.y)
  );
}

fn isGlyphVertexClipped(glyphVertexOffset: vec2<f32>, clipRect: vec4<i32>) -> bool {
  if (clipRect.z >= 0) {
    let clipMinX = f32(clipRect.x);
    let clipMaxX = clipMinX + f32(clipRect.z);
    if (glyphVertexOffset.x < clipMinX || glyphVertexOffset.x > clipMaxX) {
      return true;
    }
  }
  if (clipRect.w >= 0) {
    let clipMinY = f32(clipRect.y);
    let clipMaxY = clipMinY + f32(clipRect.w);
    if (glyphVertexOffset.y < clipMinY || glyphVertexOffset.y > clipMaxY) {
      return true;
    }
  }
  return false;
}

fn unpackTextColor(colorWord: u32) -> vec4<f32> {
  return vec4<f32>(
    f32(colorWord & 0xffu),
    f32((colorWord >> 8u) & 0xffu),
    f32((colorWord >> 16u) & 0xffu),
    f32((colorWord >> 24u) & 0xffu)
  ) / 255.0;
}

fn rotateTextOffset(offset: vec2<f32>, angleDegrees: f32) -> vec2<f32> {
  let angleRadians = angleDegrees * 0.017453292519943295;
  let rotation = mat2x2<f32>(
    cos(angleRadians),
    sin(angleRadians),
    -sin(angleRadians),
    cos(angleRadians)
  );
  return rotation * offset;
}

fn findRowIndex(glyphIndex : u32) -> u32 {
  var low = textStorageRenderConfig.rowStart;
  var high = textStorageRenderConfig.rowEnd;
  loop {
    if (low >= high) {
      break;
    }
    let middle = (low + high) / 2u;
    let nextRowGlyphStart = textRowGlyphStarts[middle + 1u];
    if (nextRowGlyphStart <= glyphIndex) {
      low = middle + 1u;
    } else {
      high = middle;
    }
  }
  return low;
}

@vertex
fn vertexMain(inputs: VertexInputs) -> FragmentInputs {
  let corner = getGlyphCorner(inputs.vertexIndex);
  let glyphFrame = textGlyphFrames[inputs.glyphIndices.x];
  let glyphOffset = vec2<f32>(inputs.glyphOffsets);
  let glyphSize = glyphFrame.zw;
  let glyphVertexOffset = glyphOffset + corner * glyphSize;
  let glyphIndex = textStorageRenderConfig.glyphIndexBase + inputs.instanceIndex;
  let rowIndex = findRowIndex(glyphIndex);
  let rowStorageIndex = rowIndex + textStorageStyleConfig.rowStorageIndexBase;
  var angleDegrees = textStorageStyleConfig.constantAngleDegrees;
  if (textStorageStyleConfig.useRowAngles != 0u) {
    angleDegrees = textRowAngles[rowStorageIndex];
  }
  var textSize = textStorageStyleConfig.constantSize;
  if (textStorageStyleConfig.useRowSizes != 0u) {
    textSize = textRowSizes[rowStorageIndex];
  }
  let textScale = textSize / 32.0;
  let styledGlyphVertexOffset = rotateTextOffset(glyphVertexOffset * textScale, angleDegrees);
  var pixelOffset = textStorageStyleConfig.constantPixelOffset;
  if (textStorageStyleConfig.useRowPixelOffsets != 0u) {
    pixelOffset = textRowPixelOffsets[rowStorageIndex];
  }
  let glyphPosition =
    textRowPositions[rowStorageIndex] + (styledGlyphVertexOffset + pixelOffset) * 0.001;
  let clipRect = unpackClipRect(textRowClipRects[rowIndex]);
  let isClipped =
    textStorageStyleConfig.hasClipRects != 0u &&
    isGlyphVertexClipped(glyphVertexOffset, clipRect);
  var outputs : FragmentInputs;
  outputs.position = select(
    vec4<f32>(glyphPosition, 0.0, 1.0),
    vec4<f32>(0.0),
    isClipped
  );
  outputs.atlasUV = (glyphFrame.xy + corner * glyphSize) / vec2<f32>(textureDimensions(fontAtlasTexture));
  outputs.color = textStorageStyleConfig.constantColor;
  if (textStorageStyleConfig.useRowColors != 0u) {
    outputs.color = unpackTextColor(textRowColors[rowStorageIndex]);
  }
  return outputs;
}

@fragment
fn fragmentMain(inputs: FragmentInputs) -> @location(0) vec4<f32> {
  let sampledAlpha = textureSample(fontAtlasTexture, fontAtlasTextureSampler, inputs.atlasUV).a;
  var alpha = sampledAlpha;
  if (textStorageStyleConfig.sdfThreshold >= 0.0) {
    if (textStorageStyleConfig.sdfSmoothing > 0.0) {
      alpha = smoothstep(
        textStorageStyleConfig.sdfThreshold - textStorageStyleConfig.sdfSmoothing,
        textStorageStyleConfig.sdfThreshold + textStorageStyleConfig.sdfSmoothing,
        sampledAlpha
      );
    } else {
      alpha = select(0.0, 1.0, sampledAlpha >= textStorageStyleConfig.sdfThreshold);
    }
  }
  return vec4<f32>(inputs.color.rgb, inputs.color.a * alpha);
}
`;

export const DEFAULT_DICTIONARY_STORAGE_TEXT_SOURCE = /* wgsl */ `
@group(0) @binding(auto) var fontAtlasTexture : texture_2d<f32>;
@group(0) @binding(auto) var fontAtlasTextureSampler : sampler;
// Dictionary text keeps row styling in row buffers, shared glyph layout in
// dictionary buffers, and uses instance_index for visible glyph occurrences.
// There is deliberately no per-visible-glyph vertex/occurrence buffer.
@group(0) @binding(auto) var<storage, read> textRowPositions : array<vec2<f32>>;
@group(0) @binding(auto) var<storage, read> textRowColors : array<u32>;
@group(0) @binding(auto) var<storage, read> textRowAngles : array<f32>;
@group(0) @binding(auto) var<storage, read> textRowSizes : array<f32>;
@group(0) @binding(auto) var<storage, read> textRowPixelOffsets : array<vec2<f32>>;
@group(0) @binding(auto) var<storage, read> textRowClipRects : array<vec2<u32>>;
// textRowDictionaryRecords[row] = (dictionary value index, row glyph start).
// The extra terminal record stores rowCount/invalid and total visible glyphs.
@group(0) @binding(auto) var<storage, read> textRowDictionaryRecords : array<vec2<u32>>;
// textDictionaryGlyphRanges[value] is a half-open range into
// textDictionaryGlyphRecords for one unique dictionary string.
@group(0) @binding(auto) var<storage, read> textDictionaryGlyphRanges : array<vec2<u32>>;
// textDictionaryGlyphRecords[glyph] = (packed i16 x/y layout offset, glyph id).
// Repeated rows reuse these records instead of copying glyph offsets and ids.
@group(0) @binding(auto) var<storage, read> textDictionaryGlyphRecords : array<vec2<u32>>;
@group(0) @binding(auto) var<storage, read> textGlyphFrames : array<vec4<f32>>;

struct TextStorageStyleConfig {
  constantColor : vec4<f32>,
  constantAngleDegrees : f32,
  constantSize : f32,
  constantPixelOffset : vec2<f32>,
  useRowColors : u32,
  useRowAngles : u32,
  useRowSizes : u32,
  useRowPixelOffsets : u32,
  hasClipRects : u32,
  batchRowIndexBase : u32,
  rowStorageIndexBase : u32,
  _padding0 : u32,
  sdfThreshold : f32,
  sdfSmoothing : f32,
  _padding1 : vec2<f32>,
};

@group(0) @binding(auto) var<uniform> textStorageStyleConfig : TextStorageStyleConfig;

struct TextDictionaryRenderConfig {
  glyphIndexBase : u32,
  rowStart : u32,
  rowEnd : u32,
  _padding : u32,
};

@group(0) @binding(auto) var<uniform> textDictionaryRenderConfig : TextDictionaryRenderConfig;

struct VertexInputs {
  @builtin(vertex_index) vertexIndex : u32,
  @builtin(instance_index) instanceIndex : u32,
};

struct FragmentInputs {
  @builtin(position) position : vec4<f32>,
  @location(0) atlasUV : vec2<f32>,
  @location(1) color : vec4<f32>,
};

fn getGlyphCorner(vertexIndex: u32) -> vec2<f32> {
  let corners = array<vec2<f32>, 6>(
    vec2<f32>(0.0, 0.0),
    vec2<f32>(1.0, 0.0),
    vec2<f32>(1.0, 1.0),
    vec2<f32>(0.0, 0.0),
    vec2<f32>(1.0, 1.0),
    vec2<f32>(0.0, 1.0)
  );
  return corners[vertexIndex % 6u];
}

fn unpackLowInt16(word: u32) -> i32 {
  return i32(word << 16u) >> 16;
}

fn unpackHighInt16(word: u32) -> i32 {
  return i32(word) >> 16;
}

fn unpackClipRect(words: vec2<u32>) -> vec4<i32> {
  return vec4<i32>(
    unpackLowInt16(words.x),
    unpackHighInt16(words.x),
    unpackLowInt16(words.y),
    unpackHighInt16(words.y)
  );
}

fn isGlyphVertexClipped(glyphVertexOffset: vec2<f32>, clipRect: vec4<i32>) -> bool {
  if (clipRect.z >= 0) {
    let clipMinX = f32(clipRect.x);
    let clipMaxX = clipMinX + f32(clipRect.z);
    if (glyphVertexOffset.x < clipMinX || glyphVertexOffset.x > clipMaxX) {
      return true;
    }
  }
  if (clipRect.w >= 0) {
    let clipMinY = f32(clipRect.y);
    let clipMaxY = clipMinY + f32(clipRect.w);
    if (glyphVertexOffset.y < clipMinY || glyphVertexOffset.y > clipMaxY) {
      return true;
    }
  }
  return false;
}

fn unpackTextColor(colorWord: u32) -> vec4<f32> {
  return vec4<f32>(
    f32(colorWord & 0xffu),
    f32((colorWord >> 8u) & 0xffu),
    f32((colorWord >> 16u) & 0xffu),
    f32((colorWord >> 24u) & 0xffu)
  ) / 255.0;
}

fn rotateTextOffset(offset: vec2<f32>, angleDegrees: f32) -> vec2<f32> {
  let angleRadians = angleDegrees * 0.017453292519943295;
  let rotation = mat2x2<f32>(
    cos(angleRadians),
    sin(angleRadians),
    -sin(angleRadians),
    cos(angleRadians)
  );
  return rotation * offset;
}

fn emptyFragmentInputs() -> FragmentInputs {
  var outputs : FragmentInputs;
  outputs.position = vec4<f32>(0.0);
  outputs.atlasUV = vec2<f32>(0.0);
  outputs.color = vec4<f32>(0.0);
  return outputs;
}

fn findRowIndex(glyphIndex: u32) -> u32 {
  // Convert a glyph occurrence index back to its row by searching row starts.
  // This replaces the older per-glyph row-index buffer.
  var low = textDictionaryRenderConfig.rowStart;
  var high = textDictionaryRenderConfig.rowEnd;
  loop {
    if (low >= high) {
      break;
    }
    let middle = (low + high) / 2u;
    let nextRowGlyphStart = textRowDictionaryRecords[middle + 1u].y;
    if (nextRowGlyphStart <= glyphIndex) {
      low = middle + 1u;
    } else {
      high = middle;
    }
  }
  return low;
}

@vertex
fn vertexMain(inputs: VertexInputs) -> FragmentInputs {
  // Each instance is one visible glyph occurrence. The occurrence is not stored;
  // glyphIndex plus the row/dictionary ranges resolves the shared glyph record.
  let glyphIndex = textDictionaryRenderConfig.glyphIndexBase + inputs.instanceIndex;
  let rowIndex = findRowIndex(glyphIndex);
  if (rowIndex >= textDictionaryRenderConfig.rowEnd) {
    return emptyFragmentInputs();
  }
  let rowDictionaryRecord = textRowDictionaryRecords[rowIndex];
  let rowGlyphStart = rowDictionaryRecord.y;
  let rowGlyphEnd = textRowDictionaryRecords[rowIndex + 1u].y;
  if (glyphIndex < rowGlyphStart || glyphIndex >= rowGlyphEnd) {
    return emptyFragmentInputs();
  }
  let dictionaryGlyphOffset = glyphIndex - rowGlyphStart;
  let dictionaryIndex = rowDictionaryRecord.x;
  if (dictionaryIndex == ${INVALID_DICTIONARY_INDEX}u) {
    return emptyFragmentInputs();
  }
  let dictionaryGlyphRange = textDictionaryGlyphRanges[dictionaryIndex];
  let dictionaryGlyphIndex = dictionaryGlyphRange.x + dictionaryGlyphOffset;
  if (dictionaryGlyphIndex >= dictionaryGlyphRange.y) {
    return emptyFragmentInputs();
  }

  let corner = getGlyphCorner(inputs.vertexIndex);
  let glyphRecord = textDictionaryGlyphRecords[dictionaryGlyphIndex];
  let glyphFrame = textGlyphFrames[glyphRecord.y];
  let glyphOffset = vec2<f32>(
    f32(unpackLowInt16(glyphRecord.x)),
    f32(unpackHighInt16(glyphRecord.x))
  );
  let glyphSize = glyphFrame.zw;
  let glyphVertexOffset = glyphOffset + corner * glyphSize;
  let rowStorageIndex = rowIndex + textStorageStyleConfig.rowStorageIndexBase;
  var angleDegrees = textStorageStyleConfig.constantAngleDegrees;
  if (textStorageStyleConfig.useRowAngles != 0u) {
    angleDegrees = textRowAngles[rowStorageIndex];
  }
  var textSize = textStorageStyleConfig.constantSize;
  if (textStorageStyleConfig.useRowSizes != 0u) {
    textSize = textRowSizes[rowStorageIndex];
  }
  let textScale = textSize / 32.0;
  let styledGlyphVertexOffset = rotateTextOffset(glyphVertexOffset * textScale, angleDegrees);
  var pixelOffset = textStorageStyleConfig.constantPixelOffset;
  if (textStorageStyleConfig.useRowPixelOffsets != 0u) {
    pixelOffset = textRowPixelOffsets[rowStorageIndex];
  }
  let glyphPosition =
    textRowPositions[rowStorageIndex] + (styledGlyphVertexOffset + pixelOffset) * 0.001;
  let clipRect = unpackClipRect(textRowClipRects[rowIndex]);
  let isClipped =
    textStorageStyleConfig.hasClipRects != 0u &&
    isGlyphVertexClipped(glyphVertexOffset, clipRect);
  var outputs : FragmentInputs;
  outputs.position = select(
    vec4<f32>(glyphPosition, 0.0, 1.0),
    vec4<f32>(0.0),
    isClipped
  );
  outputs.atlasUV = (glyphFrame.xy + corner * glyphSize) / vec2<f32>(textureDimensions(fontAtlasTexture));
  outputs.color = textStorageStyleConfig.constantColor;
  if (textStorageStyleConfig.useRowColors != 0u) {
    outputs.color = unpackTextColor(textRowColors[rowStorageIndex]);
  }
  return outputs;
}

@fragment
fn fragmentMain(inputs: FragmentInputs) -> @location(0) vec4<f32> {
  let sampledAlpha = textureSample(fontAtlasTexture, fontAtlasTextureSampler, inputs.atlasUV).a;
  var alpha = sampledAlpha;
  if (textStorageStyleConfig.sdfThreshold >= 0.0) {
    if (textStorageStyleConfig.sdfSmoothing > 0.0) {
      alpha = smoothstep(
        textStorageStyleConfig.sdfThreshold - textStorageStyleConfig.sdfSmoothing,
        textStorageStyleConfig.sdfThreshold + textStorageStyleConfig.sdfSmoothing,
        sampledAlpha
      );
    } else {
      alpha = select(0.0, 1.0, sampledAlpha >= textStorageStyleConfig.sdfThreshold);
    }
  }
  return vec4<f32>(inputs.color.rgb, inputs.color.a * alpha);
}
`;

/** Arrow-backed one-line text model that expands labels into glyph attribute instances. */
export class ArrowAttributeTextModel extends ArrowModel {
  /** Optional atlas manager retained when this model built the atlas. */
  fontAtlasManager?: FontAtlasManager;
  /** Optional atlas texture owned by this model. */
  atlasTexture?: DynamicTexture;
  /** One-line glyph offsets and atlas frames expanded from source text rows. */
  glyphLayout: ArrowGlyphLayout;
  /** Optional character set accumulated while laying out glyphs. */
  characterSet?: Set<string>;
  /** Expanded Arrow table containing glyph-instance columns. */
  glyphTable: Table;
  /** CPU time spent building generated glyph-instance Arrow attributes. */
  glyphAttributeBuildTimeMs: number;
  /** Bytes occupied by generated glyph-instance Arrow attributes. */
  glyphAttributeByteLength: number;
  /** First generated expanded glyph vertex attribute buffer. */
  expandedGlyphVertexData: Buffer;
  /** Generated render batches preserved for device buffer-size limits. */
  renderBatches: ArrowTextRenderBatchState[];
  private defaultFragmentShaderUniforms?: Record<string, unknown>;
  private textProps: ArrowTextModelProps;
  private mappingState: ResolvedCharacterMapping;
  private processedTextBatchCount: number;
  private processedTextRowCount: number;

  /** Creates an attribute-backed Arrow text model from prepared text props. */
  constructor(device: Device, props: ArrowTextModelProps | ArrowAttributeTextModelStateProps) {
    const prepared = hasArrowAttributeTextState(props)
      ? props.attributeState
      : createArrowAttributeTextState(device, props);
    super(device, prepared.modelProps);
    this.textProps = prepared.textProps;
    this.fontAtlasManager = prepared.fontAtlasManager;
    this.atlasTexture = prepared.atlasTexture;
    this.glyphLayout = prepared.glyphTable.glyphLayout;
    this.characterSet = prepared.glyphTable.characterSet;
    this.glyphTable = prepared.glyphTable.table;
    this.glyphAttributeBuildTimeMs = prepared.glyphAttributeBuildTimeMs;
    this.glyphAttributeByteLength = prepared.glyphTable.attributeByteLength;
    this.expandedGlyphVertexData = prepared.expandedGlyphVertexData;
    this.renderBatches = prepared.renderBatches;
    this.defaultFragmentShaderUniforms = prepared.defaultFragmentShaderUniforms;
    this.mappingState = prepared.mappingState;
    this.processedTextBatchCount = prepared.textProps.texts.data.length;
    this.processedTextRowCount = prepared.textProps.texts.length;
  }

  /** Rebuild generated glyph attributes when label rows, text, or font layout inputs change. */
  override setProps(props: Partial<ArrowTextModelProps>): void {
    const nextProps = {...this.textProps, ...props};
    const shouldRebuild =
      props.positions !== undefined ||
      props.colors !== undefined ||
      props.angles !== undefined ||
      props.sizes !== undefined ||
      props.pixelOffsets !== undefined ||
      props.texts !== undefined ||
      props.sourceVectors !== undefined ||
      props.clipRects !== undefined ||
      props.characterSet !== undefined ||
      props.fontSettings !== undefined ||
      props.lineHeight !== undefined ||
      props.characterMapping !== undefined ||
      props.fontAtlas !== undefined;

    this.textProps = nextProps;
    if (!shouldRebuild) {
      super.setProps({});
      return;
    }

    const prepared = createArrowAttributeTextState(this.device, nextProps);
    this.atlasTexture?.destroy();
    destroyArrowTextRenderBatches(this.renderBatches);
    this.fontAtlasManager = prepared.fontAtlasManager;
    this.atlasTexture = prepared.atlasTexture;
    this.glyphLayout = prepared.glyphTable.glyphLayout;
    this.characterSet = prepared.glyphTable.characterSet;
    this.glyphTable = prepared.glyphTable.table;
    this.glyphAttributeBuildTimeMs = prepared.glyphAttributeBuildTimeMs;
    this.glyphAttributeByteLength = prepared.glyphTable.attributeByteLength;
    this.expandedGlyphVertexData = prepared.expandedGlyphVertexData;
    this.renderBatches = prepared.renderBatches;
    this.mappingState = prepared.mappingState;
    this.processedTextBatchCount = nextProps.texts.data.length;
    this.processedTextRowCount = nextProps.texts.length;
    if (this.defaultFragmentShaderUniforms && prepared.defaultFragmentShaderUniforms) {
      updateArrowTextDefaultFragmentShaderUniforms(
        this.defaultFragmentShaderUniforms,
        prepared.sdfRenderSettings
      );
    }
    super.setProps({arrowTable: prepared.modelProps.arrowTable as Table});
    this.setAttributes({[EXPANDED_GLYPH_VERTEX_DATA]: prepared.expandedGlyphVertexData});
    if (prepared.atlasTexture) {
      this.setBindings({fontAtlasTexture: prepared.atlasTexture});
    }
    this.setInstanceCount(prepared.glyphTable.glyphLayout.glyphCount);
    this.setNeedsRedraw('Arrow text glyph table updated');
  }

  /** Converts only newly appended source GPUVector batches into retained glyph render batches. */
  appendTextBatches(props: Partial<ArrowTextModelProps>): void {
    const nextProps = {...this.textProps, ...props};
    assertArrowTextAppendProps(props);
    assertArrowTextVectorTypes(nextProps);
    assertArrowTextVectorBatchAlignment(nextProps);
    assertArrowTextAppendPrefixStable(this.textProps, nextProps, this.processedTextBatchCount);
    assertArrowTextSourceAppendPrefixStable(
      this.textProps,
      nextProps,
      this.processedTextBatchCount
    );

    const nextBatchCount = nextProps.texts.data.length;
    if (nextBatchCount < this.processedTextBatchCount) {
      throw new Error('ArrowTextModel appended text batches cannot remove existing batches');
    }
    if (nextBatchCount === this.processedTextBatchCount) {
      this.textProps = nextProps;
      return;
    }
    const arrowGPUTable = this.arrowGPUTable;
    if (!arrowGPUTable) {
      throw new Error('ArrowTextModel appended text batches require an Arrow GPU render table');
    }

    const shaderLayout = resolveArrowTextShaderLayout(nextProps);
    let batchRowIndexBase = this.processedTextRowCount;
    for (let batchIndex = this.processedTextBatchCount; batchIndex < nextBatchCount; batchIndex++) {
      const batchInputs = resolveArrowTextBatchInputs(nextProps, batchIndex);
      const glyphTable = buildArrowTextGlyphTable({
        labelTable: batchInputs.labelTable,
        texts: batchInputs.texts,
        clipRects: batchInputs.clipRects,
        mapping: this.mappingState.mapping,
        baselineOffset: this.mappingState.baselineOffset,
        lineHeight: this.mappingState.lineHeight,
        characterSet: this.mappingState.characterSet,
        rowIndexBase: batchRowIndexBase
      });
      const generatedBufferBatches = planGeneratedBufferBatches({
        device: this.device,
        recordOffsets: glyphTable.glyphLayout.startIndices,
        recordByteStride: batchInputs.clipRects
          ? CLIPPED_EXPANDED_GLYPH_VERTEX_BYTE_STRIDE
          : EXPANDED_GLYPH_VERTEX_BYTE_STRIDE,
        resourceLabel: 'ArrowTextModel expanded glyph vertex data'
      });
      const renderTable = createArrowTextRenderTable(glyphTable.table, generatedBufferBatches);

      for (const recordBatch of renderTable.batches) {
        arrowGPUTable.addBatch(
          makeArrowGPURecordBatch(this.device, recordBatch, {
            shaderLayout,
            arrowPaths: nextProps.arrowPaths,
            bufferProps: nextProps.arrowBufferProps,
            allowWebGLOnlyFormats: nextProps.allowWebGLOnlyFormats
          })
        );
      }

      for (const generatedBufferBatch of generatedBufferBatches) {
        const expandedGlyphVertexState = createExpandedGlyphVertexData(this.device, nextProps, {
          glyphTable,
          shaderLayout,
          generatedBufferBatch,
          rowIndexBase: batchRowIndexBase
        });
        this.renderBatches.push({
          rowStart: batchRowIndexBase + generatedBufferBatch.rowStart,
          rowEnd: batchRowIndexBase + generatedBufferBatch.rowEnd,
          glyphCount: generatedBufferBatch.recordCount,
          expandedGlyphVertexData: expandedGlyphVertexState.buffer
        });
      }

      this.glyphLayout = appendArrowGlyphLayout(this.glyphLayout, glyphTable.glyphLayout);
      this.glyphTable = new Table(this.glyphTable.schema, [
        ...this.glyphTable.batches,
        ...glyphTable.table.batches
      ]);
      this.glyphAttributeBuildTimeMs += glyphTable.glyphAttributeBuildTimeMs;
      this.glyphAttributeByteLength += glyphTable.attributeByteLength;
      batchRowIndexBase += batchInputs.texts.length;
    }

    this.textProps = nextProps;
    this.processedTextBatchCount = nextBatchCount;
    this.processedTextRowCount = nextProps.texts.length;
    this.setInstanceCount(this.glyphLayout.glyphCount);
    this.setNeedsRedraw('Arrow text glyph batches appended');
  }

  /** Draws each generated glyph render batch against the supplied render pass. */
  override draw(renderPass: RenderPass): boolean {
    const arrowBatches = this.arrowGPUTable?.batches;
    if (!arrowBatches || arrowBatches.length !== this.renderBatches.length) {
      throw new Error('ArrowTextModel draw batches must align with generated glyph render batches');
    }

    let drawSuccess = true;
    try {
      for (const [batchIndex, renderBatch] of this.renderBatches.entries()) {
        const arrowBatch = arrowBatches[batchIndex];
        if (!arrowBatch) {
          throw new Error('ArrowTextModel is missing a GPU Arrow render batch');
        }
        this.setAttributes({
          ...arrowBatch.attributes,
          [EXPANDED_GLYPH_VERTEX_DATA]: renderBatch.expandedGlyphVertexData
        });
        this.setInstanceCount(renderBatch.glyphCount);
        drawSuccess = super.draw(renderPass) && drawSuccess;
      }
    } finally {
      this.setAttributes({
        ...(this.arrowGPUTable?.attributes || {}),
        [EXPANDED_GLYPH_VERTEX_DATA]: this.expandedGlyphVertexData
      });
      this.setInstanceCount(this.glyphLayout.glyphCount);
    }

    return drawSuccess;
  }

  /** Releases owned atlas and generated glyph render buffers. */
  override destroy(): void {
    this.atlasTexture?.destroy();
    destroyArrowTextRenderBatches(this.renderBatches);
    super.destroy();
  }
}

/** Backward-compatible alias for {@link ArrowAttributeTextModel}. */
export {ArrowAttributeTextModel as ArrowTextModel};

/**
 * WebGPU-only Arrow text model backed by reusable storage state.
 */
export class ArrowStorageTextModel extends Model {
  /** Optional atlas manager retained when this model built the atlas. */
  fontAtlasManager?: FontAtlasManager;
  /** Optional atlas texture owned by this model storage state. */
  atlasTexture?: DynamicTexture;
  /** Optional character set accumulated while laying out glyphs. */
  characterSet?: Set<string>;
  /** Optional compact glyph stream retained for diagnostics. */
  glyphStream?: GpuExpandedTextStream;
  /** Glyph instances across all preserved render batches. */
  glyphCount!: number;
  /** CPU time spent building generated glyph attributes. */
  glyphAttributeBuildTimeMs!: number;
  /** Bytes occupied by generated glyph attributes and render control buffers. */
  glyphAttributeByteLength!: number;
  /** CPU time spent building compact glyph stream inputs. */
  compactStreamBuildTimeMs!: number;
  /** Bytes occupied by compact glyph stream inputs. */
  compactStreamByteLength!: number;
  /** Bytes occupied by generated compact glyph vertex buffers. */
  generatedRenderBufferByteLength!: number;
  /** Bytes occupied by row glyph starts and per-render-batch config buffers. */
  renderControlByteLength!: number;
  /** Bytes occupied by retained row style/default binding resources. */
  rowStorageByteLength!: number;
  /** Bytes occupied by retained glyph frame/lookup definition resources. */
  glyphDefinitionStorageByteLength!: number;
  /** Bytes occupied by transient compute input buffers released after expansion. */
  transientComputeInputByteLength!: number;
  /** First batch label origin buffer. */
  rowPositionsBuffer!: StorageTextBuffer;
  /** First batch packed RGBA8 row color buffer. */
  rowColorsBuffer!: StorageTextBuffer;
  /** First batch row angle buffer. */
  rowAnglesBuffer!: StorageTextBuffer;
  /** First batch row text size buffer. */
  rowSizesBuffer!: StorageTextBuffer;
  /** First batch row pixel offset buffer. */
  rowPixelOffsetsBuffer!: StorageTextBuffer;
  /** First batch packed row text anchor buffer. */
  rowTextAnchorsBuffer!: StorageTextBuffer;
  /** First batch packed row alignment baseline buffer. */
  rowAlignmentBaselinesBuffer!: StorageTextBuffer;
  /** First batch packed row clip rectangle buffer. */
  rowClipRectsBuffer!: Buffer;
  /** First batch cumulative row glyph start buffer. */
  rowGlyphStartsBuffer!: Buffer;
  /** First batch row style config uniform buffer. */
  styleConfigBuffer!: DynamicBuffer;
  /** First render batch row/glyph lookup config uniform buffer. */
  storageRenderConfigBuffer!: DynamicBuffer;
  /** Read-only storage buffer for glyph atlas frames. */
  glyphFramesBuffer!: Buffer;
  /** First generated compact glyph vertex buffer. */
  compactGlyphVertexData!: Buffer;
  /** Per-source-batch row bindings. */
  batches!: ArrowStorageTextBatchState[];
  /** Generated render batches preserved for device buffer-size limits. */
  renderBatches!: ArrowStorageTextRenderBatchState[];
  /** Reusable storage text expansion and row-binding state currently bound by the model. */
  storageState: ArrowStorageTextState;
  private textProps: ArrowStorageTextModelProps;
  private ownsStorageState: boolean;

  /** Creates a WebGPU storage-backed Arrow text model. */
  constructor(device: Device, props: ArrowStorageTextModelProps) {
    if (device.type !== 'webgpu') {
      throw new Error('ArrowStorageTextModel is WebGPU-only');
    }
    const ownsStorageState = !hasArrowStorageTextState(props);
    const storageState = ownsStorageState
      ? createArrowStorageTextState(device, props)
      : props.storageState;
    super(device, createArrowStorageTextModelProps(props, storageState));
    this.textProps = props;
    this.storageState = storageState;
    this.ownsStorageState = ownsStorageState;
    this.applyStorageState(storageState);
  }

  /** Updates storage text props, rebuilding state only when glyph/layout inputs change. */
  setProps(props: Partial<ArrowStorageTextModelProps>): void {
    const nextProps = {...this.textProps, ...props} as ArrowStorageTextModelProps;
    const nextUsesExternalState = hasArrowStorageTextState(nextProps);
    const arrowProps = props as Partial<ArrowStorageTextInputProps>;
    const shouldReplaceExternalState = 'storageState' in props && props.storageState !== undefined;
    const shouldReplaceState =
      shouldReplaceExternalState ||
      arrowProps.texts !== undefined ||
      arrowProps.sourceVectors !== undefined ||
      arrowProps.textAnchors !== undefined ||
      arrowProps.alignmentBaselines !== undefined ||
      arrowProps.textAnchor !== undefined ||
      arrowProps.alignmentBaseline !== undefined ||
      arrowProps.characterSet !== undefined ||
      arrowProps.fontSettings !== undefined ||
      arrowProps.lineHeight !== undefined ||
      arrowProps.characterMapping !== undefined ||
      arrowProps.fontAtlas !== undefined;
    const shouldRefreshRowBindings =
      !nextUsesExternalState &&
      (arrowProps.positions !== undefined ||
        arrowProps.colors !== undefined ||
        arrowProps.angles !== undefined ||
        arrowProps.sizes !== undefined ||
        arrowProps.pixelOffsets !== undefined ||
        arrowProps.color !== undefined ||
        arrowProps.angle !== undefined ||
        arrowProps.size !== undefined ||
        arrowProps.pixelOffset !== undefined ||
        arrowProps.clipRects !== undefined);

    this.textProps = nextProps;
    if (!shouldReplaceState) {
      if (shouldRefreshRowBindings) {
        refreshArrowStorageTextRowBindings(this.device, nextProps, this.storageState);
        this.applyStorageState(this.storageState);
        const firstBatch = getFirstArrowStorageTextBatch(this.storageState);
        const firstRenderBatch = getFirstArrowStorageTextRenderBatch(this.storageState);
        this.setBindings(
          createArrowStorageTextBindings(nextProps, this.storageState, firstBatch, firstRenderBatch)
        );
        this.setNeedsRedraw('Arrow storage text row bindings updated');
      }
      return;
    }

    const nextStorageState = nextUsesExternalState
      ? nextProps.storageState
      : createArrowStorageTextState(this.device, nextProps);
    if (this.ownsStorageState) {
      this.storageState.destroy();
    }
    this.storageState = nextStorageState;
    this.ownsStorageState = !nextUsesExternalState;
    this.applyStorageState(nextStorageState);
    const firstBatch = getFirstArrowStorageTextBatch(nextStorageState);
    const firstRenderBatch = getFirstArrowStorageTextRenderBatch(nextStorageState);
    this.setAttributes({
      [COMPACT_GLYPH_VERTEX_DATA]: firstRenderBatch.compactGlyphVertexData
    });
    this.setBindings(
      createArrowStorageTextBindings(nextProps, nextStorageState, firstBatch, firstRenderBatch)
    );
    this.setInstanceCount(firstRenderBatch.glyphCount);
    this.setNeedsRedraw('Arrow storage text state updated');
  }

  /** Converts only newly appended source GPUVector batches into retained storage render batches. */
  appendTextBatches(props: Partial<ArrowStorageTextInputProps>): void {
    if (!this.ownsStorageState) {
      throw new Error('ArrowStorageTextModel appendTextBatches() requires owned storage state');
    }
    const nextProps = {...this.textProps, ...props} as ArrowStorageTextInputProps;
    assertArrowStorageTextAppendProps(props);
    assertArrowStorageTextSourceAppendPrefixStable(
      this.textProps as ArrowStorageTextInputProps,
      nextProps,
      this.storageState.batches.length
    );
    appendArrowStorageTextStateBatches(this.device, nextProps, this.storageState);
    this.textProps = nextProps;
    this.applyStorageState(this.storageState);
    this.setInstanceCount(this.storageState.glyphCount);
    this.setNeedsRedraw('Arrow storage text glyph batches appended');
  }

  /** Draws each generated storage text render batch against the supplied render pass. */
  override draw(renderPass: RenderPass): boolean {
    let drawSuccess = true;
    const usePreparedDraw =
      this.device.type === 'webgpu' && this.storageState.renderBatches.length > 1;
    for (const renderBatch of this.storageState.renderBatches) {
      const batch = this.storageState.batches[renderBatch.rowBindingBatchIndex];
      if (!batch) {
        throw new Error('ArrowStorageTextModel render batch is missing its row-binding batch');
      }
      this.setAttributes({
        [COMPACT_GLYPH_VERTEX_DATA]: renderBatch.compactGlyphVertexData
      });
      this.setBindings(
        createArrowStorageTextBindings(this.textProps, this.storageState, batch, renderBatch)
      );
      this.setInstanceCount(renderBatch.glyphCount);
      drawSuccess =
        (usePreparedDraw
          ? drawPreparedStorageTextModelBatch(this, renderPass)
          : super.draw(renderPass)) && drawSuccess;
    }
    const firstBatch = getFirstArrowStorageTextBatch(this.storageState);
    const firstRenderBatch = getFirstArrowStorageTextRenderBatch(this.storageState);
    this.setAttributes({
      [COMPACT_GLYPH_VERTEX_DATA]: firstRenderBatch.compactGlyphVertexData
    });
    this.setBindings(
      createArrowStorageTextBindings(
        this.textProps,
        this.storageState,
        firstBatch,
        firstRenderBatch
      )
    );
    this.setInstanceCount(this.storageState.glyphCount);
    return drawSuccess;
  }

  /** Releases owned storage text state plus inherited model resources. */
  override destroy(): void {
    if (this.ownsStorageState) {
      this.storageState.destroy();
    }
    super.destroy();
  }

  private applyStorageState(storageState: ArrowStorageTextState): void {
    this.fontAtlasManager = storageState.fontAtlasManager;
    this.atlasTexture = storageState.atlasTexture;
    this.characterSet = storageState.characterSet;
    this.glyphStream = storageState.glyphStream;
    this.glyphCount = storageState.glyphCount;
    this.glyphAttributeBuildTimeMs = storageState.glyphAttributeBuildTimeMs;
    this.glyphAttributeByteLength = storageState.glyphAttributeByteLength;
    this.compactStreamBuildTimeMs = storageState.compactStreamBuildTimeMs;
    this.compactStreamByteLength = storageState.compactStreamByteLength;
    this.generatedRenderBufferByteLength = storageState.generatedRenderBufferByteLength;
    this.renderControlByteLength = storageState.renderControlByteLength;
    this.rowStorageByteLength = storageState.rowStorageByteLength;
    this.glyphDefinitionStorageByteLength = storageState.glyphDefinitionStorageByteLength;
    this.transientComputeInputByteLength = storageState.transientComputeInputByteLength;
    this.batches = storageState.batches;
    this.renderBatches = storageState.renderBatches;
    this.rowPositionsBuffer = storageState.rowPositionsBuffer;
    this.rowColorsBuffer = storageState.rowColorsBuffer;
    this.rowAnglesBuffer = storageState.rowAnglesBuffer;
    this.rowSizesBuffer = storageState.rowSizesBuffer;
    this.rowPixelOffsetsBuffer = storageState.rowPixelOffsetsBuffer;
    this.rowTextAnchorsBuffer = storageState.rowTextAnchorsBuffer;
    this.rowAlignmentBaselinesBuffer = storageState.rowAlignmentBaselinesBuffer;
    this.rowClipRectsBuffer = storageState.rowClipRectsBuffer;
    this.rowGlyphStartsBuffer = storageState.rowGlyphStartsBuffer;
    this.styleConfigBuffer = storageState.styleConfigBuffer;
    this.storageRenderConfigBuffer = storageState.storageRenderConfigBuffer;
    this.glyphFramesBuffer = storageState.glyphFramesBuffer;
    this.compactGlyphVertexData = storageState.compactGlyphVertexData;
  }
}

/**
 * WebGPU-only Arrow text model that renders dictionary-encoded labels through shared glyph runs.
 */
export class ArrowDictionaryTextModel extends Model {
  /** Optional atlas manager retained when this model built the atlas. */
  fontAtlasManager?: FontAtlasManager;
  /** Optional atlas texture owned by this model dictionary storage state. */
  atlasTexture?: DynamicTexture;
  /** Optional character set accumulated while laying out glyphs. */
  characterSet?: Set<string>;
  /** Optional compressed dictionary glyph stream retained for diagnostics. */
  glyphStream?: GpuDictionaryCompressedTextStream;
  /** Visible glyph instances across all source text rows. */
  glyphCount!: number;
  /** Shared glyph records across unique dictionary values. */
  dictionaryGlyphCount!: number;
  /** Normalized dictionary values retained across Arrow data chunks. */
  dictionaryValueCount!: number;
  /** CPU time spent building generated glyph attributes. */
  glyphAttributeBuildTimeMs!: number;
  /** Bytes occupied by generated glyph attributes. */
  glyphAttributeByteLength!: number;
  /** CPU time spent building compressed dictionary glyph stream inputs. */
  compactStreamBuildTimeMs!: number;
  /** Bytes occupied by compressed dictionary glyph stream inputs. */
  compactStreamByteLength!: number;
  /** Bytes occupied by generated compact glyph vertex buffers. */
  generatedRenderBufferByteLength!: number;
  /** Bytes occupied by retained row style/default binding resources. */
  rowStorageByteLength!: number;
  /** Bytes occupied by retained glyph frame definitions. */
  glyphDefinitionStorageByteLength!: number;
  /** Bytes occupied by transient compute input buffers released after expansion. */
  transientComputeInputByteLength!: number;
  /** First batch label origin buffer. */
  rowPositionsBuffer!: StorageTextBuffer;
  /** First batch packed RGBA8 row color buffer. */
  rowColorsBuffer!: StorageTextBuffer;
  /** First batch row angle buffer. */
  rowAnglesBuffer!: StorageTextBuffer;
  /** First batch row text size buffer. */
  rowSizesBuffer!: StorageTextBuffer;
  /** First batch row pixel offset buffer. */
  rowPixelOffsetsBuffer!: StorageTextBuffer;
  /** First batch packed row text anchor buffer. */
  rowTextAnchorsBuffer!: StorageTextBuffer;
  /** First batch packed row alignment baseline buffer. */
  rowAlignmentBaselinesBuffer!: StorageTextBuffer;
  /** First batch packed row clip rectangle buffer. */
  rowClipRectsBuffer!: Buffer;
  /** First batch per-row dictionary reference buffer. */
  rowDictionaryRecordsBuffer!: Buffer;
  /** First batch per-dictionary-value glyph range buffer. */
  dictionaryGlyphRangesBuffer!: Buffer;
  /** First batch shared dictionary glyph record buffer. */
  dictionaryGlyphRecordsBuffer!: Buffer;
  /** First batch row style config uniform buffer. */
  styleConfigBuffer!: DynamicBuffer;
  /** Read-only storage buffer for glyph atlas frames. */
  glyphFramesBuffer!: Buffer;
  /** First render batch dictionary lookup config uniform buffer. */
  dictionaryRenderConfigBuffer!: DynamicBuffer;
  /** Per-source-batch row and dictionary glyph bindings. */
  batches!: ArrowDictionaryStorageTextBatchState[];
  /** Generated render batches preserved for device buffer-size limits. */
  renderBatches!: ArrowDictionaryStorageTextRenderBatchState[];
  /** Reusable compressed dictionary text storage state currently bound by the model. */
  storageState: ArrowDictionaryStorageTextState;
  private textProps: ArrowDictionaryStorageTextModelProps;
  private ownsStorageState: boolean;

  /** Creates a WebGPU compressed dictionary Arrow text model. */
  constructor(device: Device, props: ArrowDictionaryStorageTextModelProps) {
    if (device.type !== 'webgpu') {
      throw new Error('ArrowDictionaryStorageTextModel is WebGPU-only');
    }
    const ownsStorageState = !hasArrowDictionaryStorageTextState(props);
    const storageState = ownsStorageState
      ? createArrowDictionaryStorageTextState(device, props)
      : props.storageState;
    super(device, createArrowDictionaryStorageTextModelProps(props, storageState));
    this.textProps = props;
    this.storageState = storageState;
    this.ownsStorageState = ownsStorageState;
    this.applyStorageState(storageState);
  }

  /** Updates dictionary text props, rebuilding state only when glyph/layout inputs change. */
  setProps(props: Partial<ArrowDictionaryStorageTextModelProps>): void {
    const nextProps = {...this.textProps, ...props} as ArrowDictionaryStorageTextModelProps;
    const nextUsesExternalState = hasArrowDictionaryStorageTextState(nextProps);
    const arrowProps = props as Partial<ArrowDictionaryStorageTextInputProps>;
    const shouldReplaceExternalState = 'storageState' in props && props.storageState !== undefined;
    const shouldReplaceState =
      shouldReplaceExternalState ||
      arrowProps.texts !== undefined ||
      arrowProps.sourceVectors !== undefined ||
      arrowProps.textAnchors !== undefined ||
      arrowProps.alignmentBaselines !== undefined ||
      arrowProps.textAnchor !== undefined ||
      arrowProps.alignmentBaseline !== undefined ||
      arrowProps.characterSet !== undefined ||
      arrowProps.fontSettings !== undefined ||
      arrowProps.lineHeight !== undefined ||
      arrowProps.characterMapping !== undefined ||
      arrowProps.fontAtlas !== undefined;
    const shouldRefreshRowBindings =
      !nextUsesExternalState &&
      (arrowProps.positions !== undefined ||
        arrowProps.colors !== undefined ||
        arrowProps.angles !== undefined ||
        arrowProps.sizes !== undefined ||
        arrowProps.pixelOffsets !== undefined ||
        arrowProps.color !== undefined ||
        arrowProps.angle !== undefined ||
        arrowProps.size !== undefined ||
        arrowProps.pixelOffset !== undefined ||
        arrowProps.clipRects !== undefined);

    this.textProps = nextProps;
    if (!shouldReplaceState) {
      if (shouldRefreshRowBindings) {
        refreshArrowDictionaryStorageTextRowBindings(this.device, nextProps, this.storageState);
        this.applyStorageState(this.storageState);
        const firstBatch = getFirstArrowDictionaryStorageTextBatch(this.storageState);
        const firstRenderBatch = getFirstArrowDictionaryStorageTextRenderBatch(this.storageState);
        this.setBindings(
          createArrowDictionaryStorageTextBindings(
            nextProps,
            this.storageState,
            firstBatch,
            firstRenderBatch
          )
        );
        this.setNeedsRedraw('Arrow dictionary storage text row bindings updated');
      }
      return;
    }

    const nextStorageState = nextUsesExternalState
      ? nextProps.storageState
      : createArrowDictionaryStorageTextState(this.device, nextProps);
    if (this.ownsStorageState) {
      this.storageState.destroy();
    }
    this.storageState = nextStorageState;
    this.ownsStorageState = !nextUsesExternalState;
    this.applyStorageState(nextStorageState);
    const firstBatch = getFirstArrowDictionaryStorageTextBatch(nextStorageState);
    const firstRenderBatch = getFirstArrowDictionaryStorageTextRenderBatch(nextStorageState);
    this.setBindings(
      createArrowDictionaryStorageTextBindings(
        nextProps,
        nextStorageState,
        firstBatch,
        firstRenderBatch
      )
    );
    this.setInstanceCount(firstRenderBatch.glyphCount);
    this.setNeedsRedraw('Arrow dictionary storage text state updated');
  }

  /** Draws each compressed dictionary text render batch against the supplied render pass. */
  override draw(renderPass: RenderPass): boolean {
    let drawSuccess = true;
    const usePreparedDraw =
      this.device.type === 'webgpu' && this.storageState.renderBatches.length > 1;
    for (const renderBatch of this.storageState.renderBatches) {
      const batch = this.storageState.batches[renderBatch.rowBindingBatchIndex];
      if (!batch) {
        throw new Error(
          'ArrowDictionaryStorageTextModel render batch is missing its row-binding batch'
        );
      }
      this.setBindings(
        createArrowDictionaryStorageTextBindings(
          this.textProps,
          this.storageState,
          batch,
          renderBatch
        )
      );
      this.setInstanceCount(renderBatch.glyphCount);
      drawSuccess =
        (usePreparedDraw
          ? drawPreparedStorageTextModelBatch(this, renderPass)
          : super.draw(renderPass)) && drawSuccess;
    }
    const firstBatch = getFirstArrowDictionaryStorageTextBatch(this.storageState);
    const firstRenderBatch = getFirstArrowDictionaryStorageTextRenderBatch(this.storageState);
    this.setBindings(
      createArrowDictionaryStorageTextBindings(
        this.textProps,
        this.storageState,
        firstBatch,
        firstRenderBatch
      )
    );
    this.setInstanceCount(this.storageState.glyphCount);
    return drawSuccess;
  }

  /** Releases owned dictionary text state plus inherited model resources. */
  override destroy(): void {
    if (this.ownsStorageState) {
      this.storageState.destroy();
    }
    super.destroy();
  }

  private applyStorageState(storageState: ArrowDictionaryStorageTextState): void {
    this.fontAtlasManager = storageState.fontAtlasManager;
    this.atlasTexture = storageState.atlasTexture;
    this.characterSet = storageState.characterSet;
    this.glyphStream = storageState.glyphStream;
    this.glyphCount = storageState.glyphCount;
    this.dictionaryGlyphCount = storageState.dictionaryGlyphCount;
    this.dictionaryValueCount = storageState.dictionaryValueCount;
    this.glyphAttributeBuildTimeMs = storageState.glyphAttributeBuildTimeMs;
    this.glyphAttributeByteLength = storageState.glyphAttributeByteLength;
    this.compactStreamBuildTimeMs = storageState.compactStreamBuildTimeMs;
    this.compactStreamByteLength = storageState.compactStreamByteLength;
    this.generatedRenderBufferByteLength = storageState.generatedRenderBufferByteLength;
    this.rowStorageByteLength = storageState.rowStorageByteLength;
    this.glyphDefinitionStorageByteLength = storageState.glyphDefinitionStorageByteLength;
    this.transientComputeInputByteLength = storageState.transientComputeInputByteLength;
    this.batches = storageState.batches;
    this.renderBatches = storageState.renderBatches;
    this.rowPositionsBuffer = storageState.rowPositionsBuffer;
    this.rowColorsBuffer = storageState.rowColorsBuffer;
    this.rowAnglesBuffer = storageState.rowAnglesBuffer;
    this.rowSizesBuffer = storageState.rowSizesBuffer;
    this.rowPixelOffsetsBuffer = storageState.rowPixelOffsetsBuffer;
    this.rowTextAnchorsBuffer = storageState.rowTextAnchorsBuffer;
    this.rowAlignmentBaselinesBuffer = storageState.rowAlignmentBaselinesBuffer;
    this.rowClipRectsBuffer = storageState.rowClipRectsBuffer;
    this.rowDictionaryRecordsBuffer = storageState.rowDictionaryRecordsBuffer;
    this.dictionaryGlyphRangesBuffer = storageState.dictionaryGlyphRangesBuffer;
    this.dictionaryGlyphRecordsBuffer = storageState.dictionaryGlyphRecordsBuffer;
    this.dictionaryRenderConfigBuffer = storageState.dictionaryRenderConfigBuffer;
    this.styleConfigBuffer = storageState.styleConfigBuffer;
    this.glyphFramesBuffer = storageState.glyphFramesBuffer;
  }
}

/** Backward-compatible alias for {@link ArrowDictionaryTextModel}. */
export {ArrowDictionaryTextModel as ArrowDictionaryStorageTextModel};

function drawPreparedStorageTextModelBatch(model: Model, renderPass: RenderPass): boolean {
  const drawableModel = model as unknown as {
    _areBindingsLoading(): string | false;
    _syncAttachmentFormats(renderPass: RenderPass): void;
    _updatePipeline(): typeof model.pipeline;
    _getBindings(): Record<string, any>;
    _getBindGroups(): Record<number, Record<string, any>>;
    _getBindGroupCacheKeys(): Partial<Record<number, object>>;
    pipeline: typeof model.pipeline;
    vertexArray: typeof model.vertexArray;
    isInstanced: typeof model.isInstanced;
    vertexCount: typeof model.vertexCount;
    instanceCount: typeof model.instanceCount;
    transformFeedback: typeof model.transformFeedback;
    props: {uniforms?: Record<string, unknown>};
    parameters: typeof model.parameters;
  };
  if (drawableModel._areBindingsLoading()) {
    return false;
  }
  drawableModel._syncAttachmentFormats(renderPass);
  drawableModel.pipeline = drawableModel._updatePipeline();
  if (drawableModel.pipeline.isErrored) {
    return false;
  }
  const indexBuffer = drawableModel.vertexArray.indexBuffer;
  const indexCount = indexBuffer
    ? indexBuffer.byteLength / (indexBuffer.indexType === 'uint32' ? 4 : 2)
    : undefined;

  return drawableModel.pipeline.draw({
    renderPass,
    vertexArray: drawableModel.vertexArray,
    isInstanced: drawableModel.isInstanced,
    vertexCount: drawableModel.vertexCount,
    instanceCount: drawableModel.instanceCount,
    indexCount,
    transformFeedback: drawableModel.transformFeedback || undefined,
    bindings: drawableModel._getBindings(),
    bindGroups: drawableModel._getBindGroups(),
    _bindGroupCacheKeys: drawableModel._getBindGroupCacheKeys(),
    uniforms: drawableModel.props.uniforms,
    parameters: drawableModel.parameters
  });
}

function createArrowStorageTextModelProps(
  props: ArrowStorageTextModelProps,
  storageState: ArrowStorageTextState
): ArrowModelProps {
  const firstBatch = getFirstArrowStorageTextBatch(storageState);
  const firstRenderBatch = getFirstArrowStorageTextRenderBatch(storageState);
  return {
    ...props,
    source: props.source ?? DEFAULT_STORAGE_INDEXED_TEXT_SOURCE,
    shaderLayout: props.shaderLayout ?? DEFAULT_STORAGE_INDEXED_TEXT_SHADER_LAYOUT,
    bindings: createArrowStorageTextBindings(props, storageState, firstBatch, firstRenderBatch),
    attributes: {
      ...(props.attributes || {}),
      [COMPACT_GLYPH_VERTEX_DATA]: firstRenderBatch.compactGlyphVertexData
    },
    bufferLayout: [
      ...(props.bufferLayout || []),
      {
        name: COMPACT_GLYPH_VERTEX_DATA,
        stepMode: 'instance',
        byteStride: COMPACT_GLYPH_VERTEX_BYTE_STRIDE,
        attributes: [
          {attribute: GLYPH_OFFSETS_COLUMN, format: 'sint16x2', byteOffset: 0},
          {
            attribute: GLYPH_INDICES_COLUMN,
            format: 'uint16x2',
            byteOffset: Uint32Array.BYTES_PER_ELEMENT
          }
        ]
      }
    ],
    vertexCount: props.vertexCount ?? 6,
    instanceCount: firstRenderBatch.glyphCount
  };
}

function createArrowStorageTextBindings(
  props: ArrowStorageTextModelProps,
  storageState: ArrowStorageTextState,
  batch: ArrowStorageTextBatchState,
  renderBatch: ArrowStorageTextRenderBatchState
): NonNullable<ArrowModelProps['bindings']> {
  return {
    ...(props.bindings || {}),
    textRowPositions: batch.rowPositionsBuffer,
    textRowColors: batch.rowColorsBuffer,
    textRowAngles: batch.rowAnglesBuffer,
    textRowSizes: batch.rowSizesBuffer,
    textRowPixelOffsets: batch.rowPixelOffsetsBuffer,
    textRowClipRects: batch.rowClipRectsBuffer,
    textRowGlyphStarts: getStorageRowGlyphStartsBuffer(batch),
    textGlyphFrames: storageState.glyphFramesBuffer,
    textStorageStyleConfig: batch.styleConfigBuffer,
    textStorageRenderConfig: renderBatch.storageRenderConfigBuffer,
    ...(storageState.atlasTexture ? {fontAtlasTexture: storageState.atlasTexture} : {})
  };
}

function createArrowDictionaryStorageTextModelProps(
  props: ArrowDictionaryStorageTextModelProps,
  storageState: ArrowDictionaryStorageTextState
): ArrowModelProps {
  const firstBatch = getFirstArrowDictionaryStorageTextBatch(storageState);
  const firstRenderBatch = getFirstArrowDictionaryStorageTextRenderBatch(storageState);
  return {
    ...props,
    source: props.source ?? DEFAULT_DICTIONARY_STORAGE_TEXT_SOURCE,
    shaderLayout: props.shaderLayout ?? DEFAULT_DICTIONARY_STORAGE_TEXT_SHADER_LAYOUT,
    bindings: createArrowDictionaryStorageTextBindings(
      props,
      storageState,
      firstBatch,
      firstRenderBatch
    ),
    attributes: props.attributes ?? {},
    bufferLayout: props.bufferLayout ?? [],
    vertexCount: props.vertexCount ?? 6,
    instanceCount: firstRenderBatch.glyphCount
  };
}

function createArrowDictionaryStorageTextBindings(
  props: ArrowDictionaryStorageTextModelProps,
  storageState: ArrowDictionaryStorageTextState,
  batch: ArrowDictionaryStorageTextBatchState,
  renderBatch: ArrowDictionaryStorageTextRenderBatchState
): NonNullable<ArrowModelProps['bindings']> {
  return {
    ...(props.bindings || {}),
    textRowPositions: batch.rowPositionsBuffer,
    textRowColors: batch.rowColorsBuffer,
    textRowAngles: batch.rowAnglesBuffer,
    textRowSizes: batch.rowSizesBuffer,
    textRowPixelOffsets: batch.rowPixelOffsetsBuffer,
    textRowClipRects: batch.rowClipRectsBuffer,
    textRowDictionaryRecords: batch.rowDictionaryRecordsBuffer,
    textDictionaryGlyphRanges: batch.dictionaryGlyphRangesBuffer,
    textDictionaryGlyphRecords: batch.dictionaryGlyphRecordsBuffer,
    textGlyphFrames: batch.glyphFramesBuffer,
    textStorageStyleConfig: batch.styleConfigBuffer,
    textDictionaryRenderConfig: renderBatch.dictionaryRenderConfigBuffer,
    ...(storageState.atlasTexture ? {fontAtlasTexture: storageState.atlasTexture} : {})
  };
}

function assertArrowStorageTextAppendProps(props: Partial<ArrowStorageTextInputProps>): void {
  const appendablePropNames = new Set([
    'positions',
    'texts',
    'colors',
    'angles',
    'sizes',
    'pixelOffsets',
    'textAnchors',
    'alignmentBaselines',
    'clipRects',
    'sourceVectors'
  ]);
  for (const propName of Object.keys(props)) {
    if (!appendablePropNames.has(propName)) {
      throw new Error(
        `ArrowStorageTextModel appendTextBatches() cannot update non-row prop "${propName}"`
      );
    }
  }
}

function assertArrowStorageTextSourceAppendPrefixStable(
  previousProps: ArrowStorageTextInputProps,
  nextProps: ArrowStorageTextInputProps,
  processedBatchCount: number
): void {
  const sourceInputs: Array<[string, Vector | undefined, Vector | undefined]> = [
    ['texts', previousProps.sourceVectors.texts, nextProps.sourceVectors.texts],
    ['clipRects', previousProps.sourceVectors.clipRects, nextProps.sourceVectors.clipRects]
  ];

  for (const [name, previousVector, nextVector] of sourceInputs) {
    if (!previousVector && nextVector && processedBatchCount > 0) {
      throw new Error(`ArrowStorageTextModel appendTextBatches() cannot add prior ${name} sources`);
    }
    if (!previousVector || !nextVector) {
      continue;
    }
    for (let batchIndex = 0; batchIndex < processedBatchCount; batchIndex++) {
      if (previousVector.data[batchIndex] !== nextVector.data[batchIndex]) {
        throw new Error(
          `ArrowStorageTextModel appendTextBatches() requires existing ${name} source batches to stay unchanged`
        );
      }
    }
  }
}

function hasArrowStorageTextState(
  props: ArrowStorageTextModelProps
): props is ArrowStorageTextRenderProps & {storageState: ArrowStorageTextState} {
  return 'storageState' in props && props.storageState !== undefined;
}

function hasArrowAttributeTextState(
  props: ArrowTextModelProps | ArrowAttributeTextModelStateProps
): props is ArrowAttributeTextModelStateProps {
  return 'attributeState' in props && props.attributeState !== undefined;
}

function hasArrowDictionaryStorageTextState(
  props: ArrowDictionaryStorageTextModelProps
): props is ArrowDictionaryStorageTextRenderProps & {
  storageState: ArrowDictionaryStorageTextState;
} {
  return 'storageState' in props && props.storageState !== undefined;
}

export function createArrowTextDefaultFragmentShaderUniforms(
  uniforms: Record<string, unknown> | undefined,
  sdfRenderSettings: TextSdfRenderSettings
): Record<string, unknown> {
  const nextUniforms = {...(uniforms || {})};
  updateArrowTextDefaultFragmentShaderUniforms(nextUniforms, sdfRenderSettings);
  return nextUniforms;
}

function updateArrowTextDefaultFragmentShaderUniforms(
  uniforms: Record<string, unknown>,
  sdfRenderSettings: TextSdfRenderSettings
): void {
  uniforms['textUsesSdf'] = sdfRenderSettings.sdf ? 1 : 0;
  uniforms['textSdfThreshold'] = sdfRenderSettings.threshold;
  uniforms['textSdfSmoothing'] = sdfRenderSettings.smoothing;
}

function destroyArrowTextRenderBatches(renderBatches: ArrowTextRenderBatchState[]): void {
  for (const renderBatch of renderBatches) {
    renderBatch.expandedGlyphVertexData.destroy();
  }
}
