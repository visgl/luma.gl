// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  Buffer,
  type BufferLayout,
  type Device,
  type RenderPass,
  type ShaderLayout
} from '@luma.gl/core';
import {
  GPUVector,
  planGeneratedBufferBatches,
  type GeneratedBufferBatch,
  type GPUData
} from '@luma.gl/tables';
import {
  ArrowModel,
  getArrowVectorBufferSource,
  isNumericArrowType,
  makeArrowGPURecordBatch,
  makeArrowGPUVector,
  makeArrowFixedSizeListVector,
  type ArrowModelProps,
  type NumericArrowType
} from '@luma.gl/arrow';
import {DynamicBuffer, DynamicTexture, Model} from '@luma.gl/engine';
import {
  Data,
  DataType,
  Field,
  FixedSizeList,
  Float32,
  Int16,
  List,
  Schema,
  Table,
  Uint16,
  Uint32,
  Uint8,
  Utf8,
  Vector,
  makeData,
  makeVector,
  util
} from 'apache-arrow';
import FontAtlasManager, {
  DEFAULT_FONT_SETTINGS,
  type FontAtlas,
  type FontSettings
} from './font-atlas-manager';
import {
  buildArrowGlyphLayout,
  buildGpuDictionaryCompressedTextStream,
  buildGpuExpandedTextStream,
  buildGpuUtf8TextInput,
  buildArrowUtf8Chunks,
  decodeArrowUtf8CodePoints,
  isArrowUtf8DictionaryType,
  isArrowUtf8DictionaryVector,
  isArrowUtf8TextVector,
  isArrowUtf8Vector,
  populateUtf8TextIndices,
  type ArrowGlyphLayout,
  type ArrowUtf8Dictionary,
  type ArrowUtf8TextType,
  type ArrowUtf8TextVector,
  type GpuDictionaryCompressedTextStream,
  type GpuExpandedTextStream,
  type GpuUtf8TextInput,
  type Utf8TextIndexTarget
} from './arrow-text';
import {
  createGpuExpandedCompactInput,
  createGpuExpandedGeneratedState,
  createGpuUtf8ExpandedInput,
  createStorageGlyphLookup,
  createStorageGlyphMetrics,
  dispatchGpuExpandedTextCompute,
  dispatchGpuUtf8ExpandedTextCompute
} from './gpu-text-expansion';
import type {CharacterMapping} from './text-utils';

const GLYPH_OFFSETS_COLUMN = 'glyphOffsets';
const GLYPH_FRAMES_COLUMN = 'glyphFrames';
const GLYPH_INDICES_COLUMN = 'glyphIndices';
const GLYPH_CLIP_RECTS_COLUMN = 'glyphClipRects';
const ROW_INDICES_COLUMN = 'rowIndices';
const EXPANDED_GLYPH_VERTEX_DATA = 'expandedGlyphVertexData';
const COMPACT_GLYPH_VERTEX_DATA = 'compactGlyphVertexData';
const COMPACT_GLYPH_VERTEX_BYTE_STRIDE = Uint32Array.BYTES_PER_ELEMENT * 2;
const EXPANDED_GLYPH_VERTEX_BYTE_STRIDE = Uint32Array.BYTES_PER_ELEMENT * 4;
const CLIPPED_EXPANDED_GLYPH_VERTEX_BYTE_STRIDE =
  EXPANDED_GLYPH_VERTEX_BYTE_STRIDE + Int16Array.BYTES_PER_ELEMENT * 4;
const MISSING_CHAR_WIDTH = 32;
const MAX_UINT16 = 65535;
const DEFAULT_STORAGE_TEXT_COLOR: [number, number, number, number] = [0, 0, 0, 255];
const DEFAULT_STORAGE_TEXT_ANGLE = 0;
const DEFAULT_STORAGE_TEXT_SIZE = 32;
const DEFAULT_STORAGE_TEXT_PIXEL_OFFSET: [number, number] = [0, 0];
const DEFAULT_STORAGE_TEXT_ANCHOR = 0;
const DEFAULT_STORAGE_ALIGNMENT_BASELINE = 0;
const BITMAP_TEXT_SDF_THRESHOLD = -1;
const INVALID_DICTIONARY_INDEX = 0xffffffff;
const STORAGE_RENDER_CONFIG_BYTE_LENGTH = Uint32Array.BYTES_PER_ELEMENT * 4;
const DICTIONARY_RENDER_CONFIG_BYTE_LENGTH = Uint32Array.BYTES_PER_ELEMENT * 4;
type StorageTextBuffer = Buffer | DynamicBuffer;

type TextSdfRenderSettings = {
  sdf: boolean;
  threshold: number;
  smoothing: number;
};

type ResolvedCharacterMapping = {
  mapping: CharacterMapping;
  baselineOffset: number;
  lineHeight: number;
  characterSet?: Set<string>;
  fontAtlasManager?: FontAtlasManager;
  fontAtlas?: FontAtlas;
  sdfRenderSettings: TextSdfRenderSettings;
};

const DEFAULT_ARROW_TEXT_SHADER_LAYOUT: ShaderLayout = {
  attributes: [
    {name: 'positions', location: 0, type: 'vec2<f32>', stepMode: 'instance'},
    {name: GLYPH_OFFSETS_COLUMN, location: 1, type: 'vec2<i32>', stepMode: 'instance'},
    {name: GLYPH_FRAMES_COLUMN, location: 2, type: 'vec4<u32>', stepMode: 'instance'}
  ],
  bindings: []
};

const DEFAULT_CLIPPED_ARROW_TEXT_SHADER_LAYOUT: ShaderLayout = {
  attributes: [
    ...DEFAULT_ARROW_TEXT_SHADER_LAYOUT.attributes,
    {name: GLYPH_CLIP_RECTS_COLUMN, location: 3, type: 'vec4<i32>', stepMode: 'instance'}
  ],
  bindings: []
};

const DEFAULT_STORAGE_INDEXED_TEXT_SHADER_LAYOUT: ShaderLayout = {
  attributes: [
    {name: GLYPH_OFFSETS_COLUMN, location: 0, type: 'vec2<i32>', stepMode: 'instance'},
    {name: GLYPH_INDICES_COLUMN, location: 1, type: 'vec2<u32>', stepMode: 'instance'}
  ],
  bindings: []
};

const DEFAULT_DICTIONARY_STORAGE_TEXT_SHADER_LAYOUT: ShaderLayout = {
  attributes: [],
  bindings: []
};

const DEFAULT_ARROW_TEXT_VS = `#version 300 es
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

const DEFAULT_CLIPPED_ARROW_TEXT_VS = `#version 300 es
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

const DEFAULT_ARROW_TEXT_FS = `#version 300 es
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

const DEFAULT_STORAGE_INDEXED_TEXT_SOURCE = /* wgsl */ `
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

const DEFAULT_DICTIONARY_STORAGE_TEXT_SOURCE = /* wgsl */ `
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

/** Expanded Arrow glyph table plus layout and allocation diagnostics. */
export type ArrowTextGlyphTable = {
  /** Expanded Arrow table containing glyph-instance columns. */
  table: Table;
  /** One-line glyph offsets and atlas frames expanded from source text rows. */
  glyphLayout: ArrowGlyphLayout;
  /** Optional character set accumulated while laying out glyphs. */
  characterSet?: Set<string>;
  /** Bytes occupied by generated glyph-instance Arrow attributes. */
  attributeByteLength: number;
  /** CPU time spent building generated glyph-instance Arrow attributes. */
  glyphAttributeBuildTimeMs: number;
};

/** CPU Arrow vectors used when one-line text layout expands rows into glyph attributes. */
export type ArrowTextSourceVectors = {
  /** CPU label origins aligned one-for-one with `texts`. */
  positions: Vector<FixedSizeList<Float32>>;
  /** CPU plain or dictionary-encoded UTF-8 labels used for glyph expansion. */
  texts: ArrowUtf8TextVector;
  /** Optional CPU packed RGBA8 text colors aligned with label rows or label characters. */
  colors?: Vector<ArrowTextColorType>;
  /** Optional CPU per-row angles in degrees. */
  angles?: Vector<Float32>;
  /** Optional CPU per-row deck-style text sizes. */
  sizes?: Vector<Float32>;
  /** Optional CPU per-row pixel offsets. */
  pixelOffsets?: Vector<FixedSizeList<Float32>>;
  /** Optional CPU packed clip rectangles aligned with label rows. */
  clipRects?: Vector<FixedSizeList<Int16>>;
};

/** CPU Arrow vectors still needed by storage-backed text expansion. */
export type ArrowStorageTextSourceVectors = {
  /** CPU plain or dictionary-encoded UTF-8 labels used for storage glyph expansion. */
  texts: ArrowUtf8TextVector;
  /** Optional CPU packed clip rectangles aligned with label rows. */
  clipRects?: Vector<FixedSizeList<Int16>>;
};

/** Props for the attribute-backed Arrow text renderer. */
export type ArrowTextModelProps = Omit<
  ArrowModelProps,
  'arrowTable' | 'arrowGPUTable' | 'arrowCount'
> & {
  /** GPU-resident label origins aligned one-for-one with `texts`. */
  positions: GPUVector<FixedSizeList<Float32>>;
  /** Optional packed RGBA8 text colors, consumed as label or character attributes when declared by the shader. */
  colors?: GPUVector<ArrowTextColorType>;
  /** Optional per-row angles in degrees, consumed as label attributes when declared by the shader. */
  angles?: GPUVector<Float32>;
  /** Optional per-row deck-style text sizes, consumed as label attributes when declared by the shader. */
  sizes?: GPUVector<Float32>;
  /** Optional per-row pixel offsets, consumed as label attributes when declared by the shader. */
  pixelOffsets?: GPUVector<FixedSizeList<Float32>>;
  /** GPU UTF-8 labels aligned row-for-row with `positions`. */
  texts: GPUVector<ArrowUtf8TextType>;
  /** CPU Arrow vectors explicitly retained by the caller for glyph/layout expansion. */
  sourceVectors: ArrowTextSourceVectors;
  /**
   * Optional packed per-label clip rectangles `[x, y, width, height]`.
   * Values are signed 16-bit glyph-layout units relative to the label origin.
   * Negative width or height disables clipping on that axis.
   */
  clipRects?: GPUVector<FixedSizeList<Int16>>;
  /** Character set for atlas generation. Pass `'auto'` to derive it from Arrow labels. */
  characterSet?: FontSettings['characterSet'] | 'auto';
  /** Font atlas generation settings. */
  fontSettings?: FontSettings;
  /** Multiplier applied to the atlas font size for the single-line baseline layout. */
  lineHeight?: number;
  /** Optional prebuilt atlas manager for shared atlas reuse. */
  fontAtlasManager?: FontAtlasManager;
  /** Optional deterministic mapping, mainly useful when atlas generation is managed externally. */
  characterMapping?: CharacterMapping;
  /** Optional prebuilt atlas for texture binding when `characterMapping` is injected. */
  fontAtlas?: FontAtlas;
};

export type ArrowTextRowColorType = FixedSizeList<Uint8>;
export type ArrowTextCharacterColorType = List<FixedSizeList<Uint8>>;
export type ArrowTextColorType = ArrowTextRowColorType | ArrowTextCharacterColorType;

type ArrowStorageTextSharedInputProps = Omit<
  ArrowTextModelProps,
  'sourceVectors' | 'texts' | 'colors'
> & {
  /** Optional packed RGBA8 text colors aligned with label rows. */
  colors?: GPUVector<FixedSizeList<Uint8>>;
  /** Optional per-row text anchor enum: 0=start, 1=middle, 2=end. */
  textAnchors?: GPUVector<Uint8>;
  /** Optional per-row alignment baseline enum: 0=center, 1=top, 2=bottom. */
  alignmentBaselines?: GPUVector<Uint8>;
  /** Constant fallback color used when `colors` is absent. */
  color?: [number, number, number, number];
  /** Constant fallback angle in degrees used when `angles` is absent. */
  angle?: number;
  /** Constant fallback deck-style text size used when `sizes` is absent. */
  size?: number;
  /** Constant fallback pixel offset used when `pixelOffsets` is absent. */
  pixelOffset?: [number, number];
  /** Constant fallback text anchor used when `textAnchors` is absent. */
  textAnchor?: 'start' | 'middle' | 'end';
  /** Constant fallback alignment baseline used when `alignmentBaselines` is absent. */
  alignmentBaseline?: 'center' | 'top' | 'bottom';
};

/** Props for the WebGPU storage-backed Arrow text renderer. */
export type ArrowStorageTextInputProps = ArrowStorageTextSharedInputProps & {
  /** GPU UTF-8 or dictionary-encoded UTF-8 labels aligned row-for-row with `positions`. */
  texts: GPUVector<ArrowUtf8TextType>;
  /** CPU Arrow vectors explicitly retained by the caller for storage glyph expansion. */
  sourceVectors: ArrowStorageTextSourceVectors;
};

/** CPU Arrow vectors still needed by compressed dictionary storage text expansion. */
export type ArrowDictionaryStorageTextSourceVectors = {
  /** CPU dictionary-encoded UTF-8 labels used for compressed glyph layout. */
  texts: Vector<ArrowUtf8Dictionary>;
  /** Optional CPU packed clip rectangles aligned with label rows. */
  clipRects?: Vector<FixedSizeList<Int16>>;
};

/** Props for the WebGPU compressed dictionary Arrow text renderer. */
export type ArrowDictionaryStorageTextInputProps = ArrowStorageTextSharedInputProps & {
  /** GPU dictionary-encoded UTF-8 labels aligned row-for-row with `positions`. */
  texts: GPUVector<ArrowUtf8Dictionary>;
  /** CPU Arrow vectors explicitly retained by the caller for compressed dictionary glyph layout. */
  sourceVectors: ArrowDictionaryStorageTextSourceVectors;
};

export type ArrowAttributeTextRenderProps = Omit<
  ArrowTextModelProps,
  | 'positions'
  | 'texts'
  | 'colors'
  | 'angles'
  | 'sizes'
  | 'pixelOffsets'
  | 'clipRects'
  | 'characterSet'
  | 'fontSettings'
  | 'lineHeight'
  | 'fontAtlasManager'
  | 'characterMapping'
  | 'fontAtlas'
  | 'sourceVectors'
>;

export type ArrowAttributeTextState = {
  /** Props used to build the prepared attribute state. */
  textProps: ArrowTextModelProps;
  /** Model props produced from the prepared glyph table. */
  modelProps: ArrowModelProps;
  /** Expanded glyph table and layout diagnostics. */
  glyphTable: ArrowTextGlyphTable;
  /** First generated expanded glyph vertex attribute buffer. */
  expandedGlyphVertexData: Buffer;
  /** Generated render batches preserved for device buffer-size limits. */
  renderBatches: ArrowTextRenderBatchState[];
  /** Optional atlas manager retained when this state built the atlas. */
  fontAtlasManager?: FontAtlasManager;
  /** Optional atlas texture owned by this state. */
  atlasTexture?: DynamicTexture;
  /** CPU time spent building generated glyph-instance Arrow attributes. */
  glyphAttributeBuildTimeMs: number;
  /** SDF render settings retained for built-in fragment shader uniforms. */
  sdfRenderSettings: TextSdfRenderSettings;
  /** Default fragment shader uniforms, when the built-in shader is used. */
  defaultFragmentShaderUniforms?: Record<string, unknown>;
  /** Character mapping retained for append compatibility. */
  mappingState: ResolvedCharacterMapping;
};

export type ArrowAttributeTextModelStateProps = ArrowAttributeTextRenderProps & {
  /** Prepared attribute text state produced by the Arrow adapter layer. */
  attributeState: ArrowAttributeTextState;
};

export type ArrowStorageTextRenderProps = Omit<
  ArrowStorageTextInputProps,
  | 'positions'
  | 'texts'
  | 'colors'
  | 'angles'
  | 'sizes'
  | 'pixelOffsets'
  | 'textAnchors'
  | 'alignmentBaselines'
  | 'clipRects'
  | 'characterSet'
  | 'fontSettings'
  | 'lineHeight'
  | 'fontAtlasManager'
  | 'characterMapping'
  | 'fontAtlas'
  | 'sourceVectors'
>;

/** Per-source-batch row bindings retained by {@link ArrowStorageTextState}. */
export type ArrowStorageTextBatchState = {
  /** Global source text row index assigned to local row zero. */
  batchRowIndexBase: number;
  /** Global row-storage index assigned to local row zero. */
  rowStorageIndexBase: number;
  /** Source text rows included in this storage batch. */
  rowCount: number;
  /** Glyph instances generated from this storage batch. */
  glyphCount: number;
  /** Read-only storage buffer for label origins. */
  rowPositionsBuffer: StorageTextBuffer;
  /** Read-only storage buffer for packed RGBA8 row colors. */
  rowColorsBuffer: StorageTextBuffer;
  /** Read-only storage buffer for per-row angles. */
  rowAnglesBuffer: StorageTextBuffer;
  /** Read-only storage buffer for per-row text sizes. */
  rowSizesBuffer: StorageTextBuffer;
  /** Read-only storage buffer for per-row pixel offsets. */
  rowPixelOffsetsBuffer: StorageTextBuffer;
  /** Read-only storage buffer for packed per-row text anchor enums. */
  rowTextAnchorsBuffer: StorageTextBuffer;
  /** Read-only storage buffer for packed per-row alignment baseline enums. */
  rowAlignmentBaselinesBuffer: StorageTextBuffer;
  /** Read-only storage buffer for packed per-row clip rectangles. */
  rowClipRectsBuffer: Buffer;
  /** Optional read-only storage buffer for cumulative row glyph starts. */
  rowGlyphStartsBuffer?: Buffer;
  /** Uniform buffer selecting row style binding usage and constant fallbacks. */
  styleConfigBuffer: DynamicBuffer;
};

/** Generated storage text render-batch state. */
export type ArrowStorageTextRenderBatchState = {
  /** Source storage batch whose row bindings feed this generated render batch. */
  rowBindingBatchIndex: number;
  /** First source text row included in this generated render batch. */
  rowStart: number;
  /** Source text row after the last row included in this generated render batch. */
  rowEnd: number;
  /** Global glyph index assigned to local glyph zero. */
  glyphIndexBase: number;
  /** Glyph instances drawn by this render batch. */
  glyphCount: number;
  /** Generated compact glyph vertex buffer. */
  compactGlyphVertexData: Buffer;
  /** Uniform buffer scoping row/glyph lookup to this render batch. */
  storageRenderConfigBuffer: DynamicBuffer;
};

/** Reusable WebGPU storage text expansion and row-binding state. */
export type ArrowStorageTextState = {
  /** Optional atlas manager retained when this state built the atlas. */
  fontAtlasManager?: FontAtlasManager;
  /** Optional atlas texture owned by this storage state. */
  atlasTexture?: DynamicTexture;
  /** Optional character set accumulated while laying out glyphs. */
  characterSet?: Set<string>;
  /** Optional compact glyph stream retained for CPU-expanded storage mode. */
  glyphStream?: GpuExpandedTextStream;
  /** Glyph instances across all preserved render batches. */
  glyphCount: number;
  /** CPU time spent building generated glyph attributes. */
  glyphAttributeBuildTimeMs: number;
  /** Bytes occupied by generated glyph attributes and render control buffers. */
  glyphAttributeByteLength: number;
  /** CPU time spent building compact glyph stream inputs. */
  compactStreamBuildTimeMs: number;
  /** Bytes occupied by compact glyph stream inputs. */
  compactStreamByteLength: number;
  /** Bytes occupied by generated compact glyph vertex buffers. */
  generatedRenderBufferByteLength: number;
  /** Bytes occupied by row glyph starts and per-render-batch config buffers. */
  renderControlByteLength: number;
  /** Bytes occupied by retained row style/default binding resources. */
  rowStorageByteLength: number;
  /** Bytes occupied by retained glyph frame/lookup definition resources. */
  glyphDefinitionStorageByteLength: number;
  /** Bytes occupied by transient compute input buffers released after expansion. */
  transientComputeInputByteLength: number;
  /** SDF render settings retained for built-in fragment shader uniforms. */
  sdfRenderSettings: TextSdfRenderSettings;
  /** Read-only storage buffer for glyph atlas frames. */
  glyphFramesBuffer: Buffer;
  /** Per-source-batch row bindings. */
  batches: ArrowStorageTextBatchState[];
  /** Generated render batches preserved for device buffer-size limits. */
  renderBatches: ArrowStorageTextRenderBatchState[];
  /** Row/default binding resources owned by this storage state. */
  ownedRowBindingResources: StorageTextOwnedResource[];
  /** Glyph definition and render-control resources owned by this storage state. */
  ownedGlyphResources: StorageTextOwnedResource[];
  /** First batch label origin buffer. */
  rowPositionsBuffer: StorageTextBuffer;
  /** First batch packed RGBA8 row color buffer. */
  rowColorsBuffer: StorageTextBuffer;
  /** First batch row angle buffer. */
  rowAnglesBuffer: StorageTextBuffer;
  /** First batch row text size buffer. */
  rowSizesBuffer: StorageTextBuffer;
  /** First batch row pixel offset buffer. */
  rowPixelOffsetsBuffer: StorageTextBuffer;
  /** First batch packed row text anchor buffer. */
  rowTextAnchorsBuffer: StorageTextBuffer;
  /** First batch packed row alignment baseline buffer. */
  rowAlignmentBaselinesBuffer: StorageTextBuffer;
  /** First batch packed row clip rectangle buffer. */
  rowClipRectsBuffer: Buffer;
  /** First batch cumulative row glyph start buffer. */
  rowGlyphStartsBuffer: Buffer;
  /** First batch row style config uniform buffer. */
  styleConfigBuffer: DynamicBuffer;
  /** First render batch row/glyph lookup config uniform buffer. */
  storageRenderConfigBuffer: DynamicBuffer;
  /** First generated compact glyph vertex buffer. */
  compactGlyphVertexData: Buffer;
  /** Releases owned atlas, row, glyph, and generated render resources. */
  destroy: () => void;
};

/** Props for constructing or rebinding a WebGPU storage-backed Arrow text model. */
export type ArrowStorageTextModelProps =
  | (ArrowStorageTextInputProps & {storageState?: never})
  | (ArrowStorageTextRenderProps & {storageState: ArrowStorageTextState});

export type ArrowDictionaryStorageTextRenderProps = Omit<
  ArrowDictionaryStorageTextInputProps,
  | 'positions'
  | 'texts'
  | 'colors'
  | 'angles'
  | 'sizes'
  | 'pixelOffsets'
  | 'textAnchors'
  | 'alignmentBaselines'
  | 'clipRects'
  | 'characterSet'
  | 'fontSettings'
  | 'lineHeight'
  | 'fontAtlasManager'
  | 'characterMapping'
  | 'fontAtlas'
  | 'sourceVectors'
>;

/** Per-source-batch dictionary glyph storage retained by compressed dictionary text state. */
export type ArrowDictionaryStorageTextBatchState = ArrowStorageTextBatchState & {
  /** Per row `(dictionary index, row glyph start)` records plus one terminal sentinel. */
  rowDictionaryRecordsBuffer: Buffer;
  /** Per dictionary value half-open ranges into `dictionaryGlyphRecordsBuffer`. */
  dictionaryGlyphRangesBuffer: Buffer;
  /** Shared per-glyph layout records for unique dictionary values in this Arrow batch. */
  dictionaryGlyphRecordsBuffer: Buffer;
  /** Glyph atlas frames referenced by the shared dictionary glyph records. */
  glyphFramesBuffer: Buffer;
  /** Shared dictionary glyph records in this Arrow batch. */
  dictionaryGlyphCount: number;
  /** Normalized dictionary values in this Arrow batch. */
  dictionaryValueCount: number;
};

/** Generated compressed dictionary text render-batch state. */
export type ArrowDictionaryStorageTextRenderBatchState = {
  /** Source storage batch whose row bindings feed this generated render batch. */
  rowBindingBatchIndex: number;
  /** First source text row included in this generated render batch. */
  rowStart: number;
  /** Source text row after the last row included in this generated render batch. */
  rowEnd: number;
  /** Global visible-glyph base for this draw batch; added to `instance_index` in WGSL. */
  glyphIndexBase: number;
  /** Glyph instances drawn by this render batch. */
  glyphCount: number;
  /** Tiny uniform that scopes row lookup to this render batch. */
  dictionaryRenderConfigBuffer: DynamicBuffer;
};

/** Reusable WebGPU compressed dictionary text storage and row-binding state. */
export type ArrowDictionaryStorageTextState = {
  /** Optional atlas manager retained when this state built the atlas. */
  fontAtlasManager?: FontAtlasManager;
  /** Optional atlas texture owned by this dictionary storage state. */
  atlasTexture?: DynamicTexture;
  /** Optional character set accumulated while laying out glyphs. */
  characterSet?: Set<string>;
  /** Optional compressed dictionary glyph stream retained for diagnostics. */
  glyphStream?: GpuDictionaryCompressedTextStream;
  /** Visible glyph instances across all source text rows. */
  glyphCount: number;
  /** Shared glyph records across unique dictionary values. */
  dictionaryGlyphCount: number;
  /** Normalized dictionary values retained across Arrow data chunks. */
  dictionaryValueCount: number;
  /** CPU time spent building generated glyph attributes. */
  glyphAttributeBuildTimeMs: number;
  /** Bytes occupied by generated glyph attributes. */
  glyphAttributeByteLength: number;
  /** CPU time spent building compressed dictionary glyph stream inputs. */
  compactStreamBuildTimeMs: number;
  /** Resident dictionary text storage: row records, dictionary ranges, glyph records, configs. */
  compactStreamByteLength: number;
  /** Currently zero for the compressed dictionary path: instances are implicit draw instances. */
  generatedRenderBufferByteLength: number;
  /** Bytes occupied by retained row style/default binding resources. */
  rowStorageByteLength: number;
  /** Bytes occupied by retained glyph frame definitions. */
  glyphDefinitionStorageByteLength: number;
  /** Bytes occupied by transient compute input buffers released after expansion. */
  transientComputeInputByteLength: number;
  /** SDF render settings retained for built-in fragment shader uniforms. */
  sdfRenderSettings: TextSdfRenderSettings;
  /** Read-only storage buffer for glyph atlas frames. */
  glyphFramesBuffer: Buffer;
  /** Per-source-batch row and dictionary glyph bindings. */
  batches: ArrowDictionaryStorageTextBatchState[];
  /** Generated render batches preserved for device buffer-size limits. */
  renderBatches: ArrowDictionaryStorageTextRenderBatchState[];
  /** Row/default binding resources owned by this dictionary storage state. */
  ownedRowBindingResources: StorageTextOwnedResource[];
  /** Dictionary glyph and render-control resources owned by this dictionary storage state. */
  ownedDictionaryResources: StorageTextOwnedResource[];
  /** First batch label origin buffer. */
  rowPositionsBuffer: StorageTextBuffer;
  /** First batch packed RGBA8 row color buffer. */
  rowColorsBuffer: StorageTextBuffer;
  /** First batch row angle buffer. */
  rowAnglesBuffer: StorageTextBuffer;
  /** First batch row text size buffer. */
  rowSizesBuffer: StorageTextBuffer;
  /** First batch row pixel offset buffer. */
  rowPixelOffsetsBuffer: StorageTextBuffer;
  /** First batch packed row text anchor buffer. */
  rowTextAnchorsBuffer: StorageTextBuffer;
  /** First batch packed row alignment baseline buffer. */
  rowAlignmentBaselinesBuffer: StorageTextBuffer;
  /** First batch packed row clip rectangle buffer. */
  rowClipRectsBuffer: Buffer;
  /** First batch per-row dictionary reference buffer. */
  rowDictionaryRecordsBuffer: Buffer;
  /** First batch per-dictionary-value glyph range buffer. */
  dictionaryGlyphRangesBuffer: Buffer;
  /** First batch shared dictionary glyph record buffer. */
  dictionaryGlyphRecordsBuffer: Buffer;
  /** First render batch dictionary lookup config uniform buffer. */
  dictionaryRenderConfigBuffer: DynamicBuffer;
  /** First batch row style config uniform buffer. */
  styleConfigBuffer: DynamicBuffer;
  /** Releases owned atlas, row, dictionary, and generated render resources. */
  destroy: () => void;
};

/** Props for constructing or rebinding a WebGPU compressed dictionary Arrow text model. */
export type ArrowDictionaryStorageTextModelProps =
  | (ArrowDictionaryStorageTextInputProps & {storageState?: never})
  | (ArrowDictionaryStorageTextRenderProps & {storageState: ArrowDictionaryStorageTextState});

/** Generated attribute text render-batch state. */
export type ArrowTextRenderBatchState = {
  /** First source text row included in this generated render batch. */
  rowStart: number;
  /** Source text row after the last row included in this generated render batch. */
  rowEnd: number;
  /** Glyph instances drawn by this render batch. */
  glyphCount: number;
  /** Generated expanded glyph vertex attribute buffer. */
  expandedGlyphVertexData: Buffer;
};

type StorageTextOwnedResource = Pick<GPUVector, 'destroy'> | Pick<DynamicBuffer, 'destroy'>;
type AnyStorageTextInputProps = ArrowStorageTextInputProps | ArrowDictionaryStorageTextInputProps;

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

    const prepared = prepareArrowTextModel(this.device, nextProps);
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

/** Props alias matching {@link ArrowAttributeTextModel}. */
export type ArrowAttributeTextModelProps = ArrowTextModelProps;
/** Source vector alias matching {@link ArrowAttributeTextModel}. */
export type ArrowAttributeTextSourceVectors = ArrowTextSourceVectors;
/** Render batch alias matching {@link ArrowAttributeTextModel}. */
export type ArrowAttributeTextRenderBatchState = ArrowTextRenderBatchState;
/** Input props alias matching {@link ArrowDictionaryTextModel}. */
export type ArrowDictionaryTextInputProps = ArrowDictionaryStorageTextInputProps;
/** Model props alias matching {@link ArrowDictionaryTextModel}. */
export type ArrowDictionaryTextModelProps = ArrowDictionaryStorageTextModelProps;
/** Source vector alias matching {@link ArrowDictionaryTextModel}. */
export type ArrowDictionaryTextSourceVectors = ArrowDictionaryStorageTextSourceVectors;
/** Storage state alias matching {@link ArrowDictionaryTextModel}. */
export type ArrowDictionaryTextState = ArrowDictionaryStorageTextState;
/** Batch state alias matching {@link ArrowDictionaryTextModel}. */
export type ArrowDictionaryTextBatchState = ArrowDictionaryStorageTextBatchState;
/** Render batch state alias matching {@link ArrowDictionaryTextModel}. */
export type ArrowDictionaryTextRenderBatchState = ArrowDictionaryStorageTextRenderBatchState;

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

/** Build an Arrow glyph table without creating a Model. */
export function buildArrowTextGlyphTable(props: {
  labelTable: Table;
  texts: ArrowUtf8TextVector;
  clipRects?: Vector<FixedSizeList<Int16>>;
  mapping: CharacterMapping;
  baselineOffset: number;
  lineHeight: number;
  characterSet?: Set<string>;
  rowIndexBase?: number;
}): ArrowTextGlyphTable {
  if (props.labelTable.numRows !== props.texts.length) {
    throw new Error('ArrowTextModel requires labelTable rows to match UTF-8 text rows');
  }
  assertClipRects(props.clipRects, props.texts.length);
  assertColumnAvailable(props.labelTable, GLYPH_OFFSETS_COLUMN);
  assertColumnAvailable(props.labelTable, GLYPH_FRAMES_COLUMN);
  assertColumnAvailable(props.labelTable, GLYPH_CLIP_RECTS_COLUMN);
  assertColumnAvailable(props.labelTable, ROW_INDICES_COLUMN);

  const glyphAttributeBuildStartTime = getNow();
  const glyphLayout = buildArrowGlyphLayout({
    texts: props.texts,
    mapping: props.mapping,
    baselineOffset: props.baselineOffset,
    lineHeight: props.lineHeight,
    characterSet: props.characterSet
  });
  const fields: Field[] = [];
  const columns: Record<string, Vector> = {};

  for (const field of props.labelTable.schema.fields) {
    const vector = props.labelTable.getChild(field.name);
    if (!vector) {
      continue;
    }
    if (field.name === 'colors' && isArrowTextCharacterColorType(vector.type)) {
      fields.push(
        new Field(field.name, vector.type.children[0]!.type, field.nullable, field.metadata)
      );
      columns[field.name] = expandArrowTextCharacterColorRows(
        vector as Vector<ArrowTextCharacterColorType>,
        glyphLayout.startIndices
      );
      continue;
    }
    if (!isInstanceCompatibleArrowType(vector.type)) {
      continue;
    }
    fields.push(field);
    columns[field.name] = repeatArrowVectorRows(vector, glyphLayout.startIndices);
  }

  fields.push(makeFixedSizeListField(GLYPH_OFFSETS_COLUMN, new Int16(), 2));
  fields.push(makeFixedSizeListField(GLYPH_FRAMES_COLUMN, new Uint16(), 4));
  if (props.clipRects) {
    fields.push(makeFixedSizeListField(GLYPH_CLIP_RECTS_COLUMN, new Int16(), 4));
  }
  fields.push(new Field(ROW_INDICES_COLUMN, new Uint32(), false));
  columns[GLYPH_OFFSETS_COLUMN] = makeArrowFixedSizeListVector(
    new Int16(),
    2,
    glyphLayout.glyphOffsets
  );
  columns[GLYPH_FRAMES_COLUMN] = makeArrowFixedSizeListVector(
    new Uint16(),
    4,
    glyphLayout.glyphFrames
  );
  if (props.clipRects) {
    columns[GLYPH_CLIP_RECTS_COLUMN] = repeatArrowVectorRows(
      props.clipRects,
      glyphLayout.startIndices
    );
  }
  columns[ROW_INDICES_COLUMN] = makeNumericArrowVector(
    new Uint32(),
    makeGlyphRowIndices(glyphLayout.startIndices, props.rowIndexBase)
  );
  const attributeByteLength = getGeneratedAttributeByteLength(columns);
  const glyphAttributeBuildTimeMs = getNow() - glyphAttributeBuildStartTime;

  return {
    table: new Table(new Schema(fields, props.labelTable.schema.metadata), columns),
    glyphLayout,
    characterSet: props.characterSet,
    attributeByteLength,
    glyphAttributeBuildTimeMs
  };
}

type ResolvedArrowTextInputs = {
  labelTable: Table;
  texts: ArrowUtf8TextVector;
  clipRects?: Vector<FixedSizeList<Int16>>;
};

function resolveArrowTextInputs(props: ArrowTextModelProps): ResolvedArrowTextInputs {
  if (!props.sourceVectors) {
    throw new Error('ArrowTextModel requires explicit sourceVectors for CPU glyph expansion');
  }
  assertArrowTextVectorTypes(props);
  assertArrowTextVectorRowAlignment(props);
  assertArrowTextSourceVectorAlignment(props);
  const {sourceVectors} = props;
  const columns: Record<string, Vector> = {
    positions: sourceVectors.positions
  };
  if (sourceVectors.colors) {
    columns['colors'] = sourceVectors.colors;
  }
  if (sourceVectors.angles) {
    columns['angles'] = sourceVectors.angles;
  }
  if (sourceVectors.sizes) {
    columns['sizes'] = sourceVectors.sizes;
  }
  if (sourceVectors.pixelOffsets) {
    columns['pixelOffsets'] = sourceVectors.pixelOffsets;
  }
  const labelTable = new Table(columns);

  return {
    labelTable,
    texts: sourceVectors.texts,
    clipRects: sourceVectors.clipRects
  };
}

function resolveArrowTextBatchInputs(
  props: ArrowTextModelProps,
  batchIndex: number
): ResolvedArrowTextInputs {
  const {sourceVectors} = props;
  const columns: Record<string, Vector> = {
    positions: getArrowTextSourceBatch(sourceVectors.positions, 'positions', batchIndex)
  };
  appendArrowTextBatchSourceColumn(columns, 'colors', sourceVectors.colors, batchIndex);
  appendArrowTextBatchSourceColumn(columns, 'angles', sourceVectors.angles, batchIndex);
  appendArrowTextBatchSourceColumn(columns, 'sizes', sourceVectors.sizes, batchIndex);
  appendArrowTextBatchSourceColumn(columns, 'pixelOffsets', sourceVectors.pixelOffsets, batchIndex);

  return {
    labelTable: new Table(columns),
    texts: getArrowTextSourceBatch(sourceVectors.texts, 'texts', batchIndex),
    clipRects: sourceVectors.clipRects
      ? (getArrowTextSourceBatch(sourceVectors.clipRects, 'clipRects', batchIndex) as Vector<
          FixedSizeList<Int16>
        >)
      : undefined
  };
}

function appendArrowTextBatchSourceColumn(
  columns: Record<string, Vector>,
  columnName: string,
  vector: Vector | undefined,
  batchIndex: number
): void {
  if (!vector) {
    return;
  }
  columns[columnName] = getArrowTextSourceBatch(vector, columnName, batchIndex);
}

function getArrowTextSourceBatch<T extends DataType>(
  vector: Vector<T>,
  vectorName: string,
  batchIndex: number
): Vector<T> {
  const data = vector.data[batchIndex];
  if (!data) {
    throw new Error(`Arrow text ${vectorName} source is missing batch ${batchIndex}`);
  }
  return new Vector([data]) as Vector<T>;
}

function assertArrowTextVectorTypes(props: ArrowTextModelProps): void {
  if (!isArrowUtf8TextVector(props.texts)) {
    throw new Error('ArrowTextModel texts must be GPUVector<Utf8 | Dictionary<Utf8>>');
  }
  if (!isArrowUtf8TextVector(props.sourceVectors.texts)) {
    throw new Error('ArrowTextModel sourceVectors.texts must be Utf8 or Dictionary<Utf8>');
  }
  if (!util.compareTypes(props.sourceVectors.texts.type, props.texts.type)) {
    throw new Error('ArrowTextModel sourceVectors.texts type must match GPU texts type');
  }
  if (
    !DataType.isFixedSizeList(props.positions.type) ||
    props.positions.type.listSize !== 2 ||
    !(props.positions.type.children[0]?.type instanceof Float32)
  ) {
    throw new Error('ArrowTextModel positions must be GPUVector<FixedSizeList<Float32>[2]>');
  }
  if (props.colors && !isArrowTextColorType(props.colors.type)) {
    throw new Error(
      'ArrowTextModel colors must be GPUVector<FixedSizeList<Uint8>[4]> or GPUVector<List<FixedSizeList<Uint8>[4]>>'
    );
  }
  if (props.angles && !(props.angles.type instanceof Float32)) {
    throw new Error('ArrowTextModel angles must be GPUVector<Float32>');
  }
  if (props.sizes && !(props.sizes.type instanceof Float32)) {
    throw new Error('ArrowTextModel sizes must be GPUVector<Float32>');
  }
  if (
    props.pixelOffsets &&
    (!DataType.isFixedSizeList(props.pixelOffsets.type) ||
      props.pixelOffsets.type.listSize !== 2 ||
      !(props.pixelOffsets.type.children[0]?.type instanceof Float32))
  ) {
    throw new Error('ArrowTextModel pixelOffsets must be GPUVector<FixedSizeList<Float32>[2]>');
  }
}

function assertArrowTextVectorRowAlignment(props: ArrowTextModelProps): void {
  const rowInputs: Array<[string, GPUVector<any> | undefined]> = [
    ['positions', props.positions],
    ['texts', props.texts],
    ['colors', props.colors],
    ['angles', props.angles],
    ['sizes', props.sizes],
    ['pixelOffsets', props.pixelOffsets],
    ['clipRects', props.clipRects]
  ];
  const suppliedInputs = rowInputs.filter(([, vector]) => vector !== undefined) as Array<
    [string, GPUVector<any>]
  >;
  const [referenceName, referenceVector] = suppliedInputs[0];
  for (const [name, vector] of suppliedInputs.slice(1)) {
    if (vector.length !== referenceVector.length) {
      throw new Error(
        `ArrowTextModel ${name} rows must match ${referenceName} rows (${vector.length} !== ${referenceVector.length})`
      );
    }
  }
}

function assertArrowTextVectorBatchAlignment(props: ArrowTextModelProps): void {
  assertArrowTextVectorRowAlignment(props);
  const rowInputs = getArrowTextRowInputs(props);
  const [referenceName, referenceVector] = rowInputs[0];
  for (const [name, vector] of rowInputs.slice(1)) {
    if (vector.data.length !== referenceVector.data.length) {
      throw new Error(`ArrowTextModel ${name} batch count must match ${referenceName} batch count`);
    }
    for (let batchIndex = 0; batchIndex < vector.data.length; batchIndex++) {
      if (vector.data[batchIndex].length !== referenceVector.data[batchIndex].length) {
        throw new Error(
          `ArrowTextModel ${name} batch ${batchIndex} rows must match ${referenceName}`
        );
      }
    }
  }
}

function assertArrowTextSourceVectorAlignment(props: ArrowTextModelProps): void {
  const sourceInputs: Array<[string, GPUVector<any> | undefined, Vector | undefined]> = [
    ['positions', props.positions, props.sourceVectors.positions],
    ['texts', props.texts, props.sourceVectors.texts],
    ['colors', props.colors, props.sourceVectors.colors],
    ['angles', props.angles, props.sourceVectors.angles],
    ['sizes', props.sizes, props.sourceVectors.sizes],
    ['pixelOffsets', props.pixelOffsets, props.sourceVectors.pixelOffsets],
    ['clipRects', props.clipRects, props.sourceVectors.clipRects]
  ];

  for (const [name, gpuVector, sourceVector] of sourceInputs) {
    if (gpuVector && !sourceVector) {
      throw new Error(`ArrowTextModel ${name} GPU rows require matching sourceVectors rows`);
    }
    if (!gpuVector && sourceVector) {
      throw new Error(`ArrowTextModel sourceVectors.${name} requires matching GPU rows`);
    }
    if (!gpuVector || !sourceVector) {
      continue;
    }
    assertSourceVectorMatchesGPUVector('ArrowTextModel', name, gpuVector, sourceVector);
  }
}

function getArrowTextRowInputs(props: ArrowTextModelProps): Array<[string, GPUVector<any>]> {
  return [
    ['positions', props.positions],
    ['texts', props.texts],
    ['colors', props.colors],
    ['angles', props.angles],
    ['sizes', props.sizes],
    ['pixelOffsets', props.pixelOffsets],
    ['clipRects', props.clipRects]
  ].filter(([, vector]) => vector !== undefined) as Array<[string, GPUVector<any>]>;
}

function assertArrowTextAppendProps(props: Partial<ArrowTextModelProps>): void {
  const appendablePropNames = new Set([
    'positions',
    'texts',
    'colors',
    'angles',
    'sizes',
    'pixelOffsets',
    'clipRects',
    'sourceVectors'
  ]);
  for (const propName of Object.keys(props)) {
    if (!appendablePropNames.has(propName)) {
      throw new Error(
        `ArrowTextModel appendTextBatches() cannot update non-row prop "${propName}"`
      );
    }
  }
}

function assertArrowTextAppendPrefixStable(
  previousProps: ArrowTextModelProps,
  nextProps: ArrowTextModelProps,
  processedBatchCount: number
): void {
  const previousInputs = new Map(getArrowTextRowInputs(previousProps));
  for (const [name, nextVector] of getArrowTextRowInputs(nextProps)) {
    const previousVector = previousInputs.get(name);
    if (!previousVector && processedBatchCount > 0) {
      throw new Error(`ArrowTextModel appendTextBatches() cannot add prior ${name} rows`);
    }
    for (let batchIndex = 0; batchIndex < processedBatchCount; batchIndex++) {
      if (previousVector?.data[batchIndex] !== nextVector.data[batchIndex]) {
        throw new Error(
          `ArrowTextModel appendTextBatches() requires existing ${name} batches to stay unchanged`
        );
      }
    }
  }
}

function assertArrowTextSourceAppendPrefixStable(
  previousProps: ArrowTextModelProps,
  nextProps: ArrowTextModelProps,
  processedBatchCount: number
): void {
  const previousSourceVectors = previousProps.sourceVectors;
  const nextSourceVectors = nextProps.sourceVectors;
  const sourceInputs: Array<[string, Vector | undefined, Vector | undefined]> = [
    ['positions', previousSourceVectors.positions, nextSourceVectors.positions],
    ['texts', previousSourceVectors.texts, nextSourceVectors.texts],
    ['colors', previousSourceVectors.colors, nextSourceVectors.colors],
    ['angles', previousSourceVectors.angles, nextSourceVectors.angles],
    ['sizes', previousSourceVectors.sizes, nextSourceVectors.sizes],
    ['pixelOffsets', previousSourceVectors.pixelOffsets, nextSourceVectors.pixelOffsets],
    ['clipRects', previousSourceVectors.clipRects, nextSourceVectors.clipRects]
  ];

  for (const [name, previousVector, nextVector] of sourceInputs) {
    if (!previousVector && nextVector && processedBatchCount > 0) {
      throw new Error(`ArrowTextModel appendTextBatches() cannot add prior ${name} sources`);
    }
    if (!previousVector || !nextVector) {
      continue;
    }
    for (let batchIndex = 0; batchIndex < processedBatchCount; batchIndex++) {
      if (previousVector.data[batchIndex] !== nextVector.data[batchIndex]) {
        throw new Error(
          `ArrowTextModel appendTextBatches() requires existing ${name} source batches to stay unchanged`
        );
      }
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

function assertSourceVectorMatchesGPUVector(
  ownerName: 'ArrowTextModel' | 'ArrowStorageTextModel' | 'ArrowDictionaryStorageTextModel',
  vectorName: string,
  gpuVector: GPUVector<any>,
  sourceVector: Vector
): void {
  if (sourceVector.length !== gpuVector.length) {
    throw new Error(
      `${ownerName} sourceVectors.${vectorName} rows must match GPU rows (${sourceVector.length} !== ${gpuVector.length})`
    );
  }
  if (sourceVector.data.length !== gpuVector.data.length) {
    throw new Error(`${ownerName} sourceVectors.${vectorName} batch count must match GPU batches`);
  }
  for (let batchIndex = 0; batchIndex < sourceVector.data.length; batchIndex++) {
    if (sourceVector.data[batchIndex].length !== gpuVector.data[batchIndex].length) {
      throw new Error(
        `${ownerName} sourceVectors.${vectorName} batch ${batchIndex} rows must match GPU rows`
      );
    }
  }
}

type ResolvedArrowStorageTextBatchInputs = {
  batchRowIndexBase: number;
  rowStorageIndexBase: number;
  texts: ArrowUtf8TextVector;
  clipRects?: Vector<FixedSizeList<Int16>>;
  positionsBuffer: StorageTextBuffer;
  colorsBuffer?: StorageTextBuffer;
  anglesBuffer?: StorageTextBuffer;
  sizesBuffer?: StorageTextBuffer;
  pixelOffsetsBuffer?: StorageTextBuffer;
  textAnchorsBuffer?: StorageTextBuffer;
  alignmentBaselinesBuffer?: StorageTextBuffer;
};

type ResolvedArrowStorageTextInputs = {
  texts: ArrowUtf8TextVector;
  batches: ResolvedArrowStorageTextBatchInputs[];
};

function resolveArrowStorageTextInputs(
  props: ArrowStorageTextInputProps
): ResolvedArrowStorageTextInputs {
  if (!props.sourceVectors) {
    throw new Error(
      'ArrowStorageTextModel requires explicit sourceVectors for CPU glyph expansion'
    );
  }
  assertStorageVectorTypes(props);
  assertStorageVectorBatchAlignment(props);
  assertStorageSourceVectorAlignment(props);
  const {sourceVectors} = props;
  const batches: ResolvedArrowStorageTextBatchInputs[] = [];
  let batchRowIndexBase = 0;

  for (let batchIndex = 0; batchIndex < props.texts.data.length; batchIndex++) {
    const textData = props.texts.data[batchIndex];
    const positionsData = props.positions.data[batchIndex];
    batches.push({
      batchRowIndexBase,
      rowStorageIndexBase: getGpuDataRowStorageIndexBase(positionsData, 'positions', batchIndex),
      texts: getArrowTextSourceBatch(sourceVectors.texts, 'texts', batchIndex),
      clipRects: sourceVectors.clipRects
        ? (getArrowTextSourceBatch(sourceVectors.clipRects, 'clipRects', batchIndex) as Vector<
            FixedSizeList<Int16>
          >)
        : undefined,
      positionsBuffer: positionsData.buffer,
      colorsBuffer: props.colors?.data[batchIndex].buffer,
      anglesBuffer: props.angles?.data[batchIndex].buffer,
      sizesBuffer: props.sizes?.data[batchIndex].buffer,
      pixelOffsetsBuffer: props.pixelOffsets?.data[batchIndex].buffer,
      textAnchorsBuffer: props.textAnchors?.data[batchIndex].buffer,
      alignmentBaselinesBuffer: props.alignmentBaselines?.data[batchIndex].buffer
    });
    batchRowIndexBase += textData.length;
  }

  return {texts: sourceVectors.texts, batches};
}

function resolveArrowDictionaryStorageTextInputs(
  props: ArrowDictionaryStorageTextInputProps
): ResolvedArrowStorageTextInputs {
  if (!props.sourceVectors) {
    throw new Error(
      'ArrowDictionaryStorageTextModel requires explicit sourceVectors for compressed dictionary glyph layout'
    );
  }
  assertDictionaryStorageVectorTypes(props);
  assertStorageVectorBatchAlignment(props, 'ArrowDictionaryStorageTextModel');
  assertDictionaryStorageSourceVectorAlignment(props);
  const {sourceVectors} = props;
  const batches: ResolvedArrowStorageTextBatchInputs[] = [];
  let batchRowIndexBase = 0;

  for (let batchIndex = 0; batchIndex < props.texts.data.length; batchIndex++) {
    const textData = props.texts.data[batchIndex];
    const positionsData = props.positions.data[batchIndex];
    batches.push({
      batchRowIndexBase,
      rowStorageIndexBase: getGpuDataRowStorageIndexBase(positionsData, 'positions', batchIndex),
      texts: getArrowTextSourceBatch(sourceVectors.texts, 'texts', batchIndex),
      clipRects: sourceVectors.clipRects
        ? (getArrowTextSourceBatch(sourceVectors.clipRects, 'clipRects', batchIndex) as Vector<
            FixedSizeList<Int16>
          >)
        : undefined,
      positionsBuffer: positionsData.buffer,
      colorsBuffer: props.colors?.data[batchIndex].buffer,
      anglesBuffer: props.angles?.data[batchIndex].buffer,
      sizesBuffer: props.sizes?.data[batchIndex].buffer,
      pixelOffsetsBuffer: props.pixelOffsets?.data[batchIndex].buffer,
      textAnchorsBuffer: props.textAnchors?.data[batchIndex].buffer,
      alignmentBaselinesBuffer: props.alignmentBaselines?.data[batchIndex].buffer
    });
    batchRowIndexBase += textData.length;
  }

  return {texts: sourceVectors.texts, batches};
}

function assertStorageVectorTypes(props: ArrowStorageTextInputProps): void {
  if (!isArrowUtf8TextVector(props.texts)) {
    throw new Error('ArrowStorageTextModel texts must be GPUVector<Utf8 | Dictionary<Utf8>>');
  }
  if (!isArrowUtf8TextVector(props.sourceVectors.texts)) {
    throw new Error('ArrowStorageTextModel sourceVectors.texts must be Utf8 or Dictionary<Utf8>');
  }
  if (!util.compareTypes(props.sourceVectors.texts.type, props.texts.type)) {
    throw new Error('ArrowStorageTextModel sourceVectors.texts type must match GPU texts type');
  }
  if (
    !DataType.isFixedSizeList(props.positions.type) ||
    props.positions.type.listSize !== 2 ||
    !(props.positions.type.children[0]?.type instanceof Float32)
  ) {
    throw new Error('ArrowStorageTextModel positions must be GPUVector<FixedSizeList<Float32>[2]>');
  }
  if (
    props.colors &&
    (!DataType.isFixedSizeList(props.colors.type) ||
      props.colors.type.listSize !== 4 ||
      !(props.colors.type.children[0]?.type instanceof Uint8))
  ) {
    throw new Error('ArrowStorageTextModel colors must be GPUVector<FixedSizeList<Uint8>[4]>');
  }
  if (props.angles && !(props.angles.type instanceof Float32)) {
    throw new Error('ArrowStorageTextModel angles must be GPUVector<Float32>');
  }
  if (props.sizes && !(props.sizes.type instanceof Float32)) {
    throw new Error('ArrowStorageTextModel sizes must be GPUVector<Float32>');
  }
  if (
    props.pixelOffsets &&
    (!DataType.isFixedSizeList(props.pixelOffsets.type) ||
      props.pixelOffsets.type.listSize !== 2 ||
      !(props.pixelOffsets.type.children[0]?.type instanceof Float32))
  ) {
    throw new Error(
      'ArrowStorageTextModel pixelOffsets must be GPUVector<FixedSizeList<Float32>[2]>'
    );
  }
  if (props.textAnchors && !(props.textAnchors.type instanceof Uint8)) {
    throw new Error('ArrowStorageTextModel textAnchors must be GPUVector<Uint8>');
  }
  if (props.alignmentBaselines && !(props.alignmentBaselines.type instanceof Uint8)) {
    throw new Error('ArrowStorageTextModel alignmentBaselines must be GPUVector<Uint8>');
  }
  const clipRects = props.sourceVectors.clipRects;
  assertClipRects(clipRects as Vector<FixedSizeList<Int16>> | undefined, props.texts.length);
}

function assertStorageVectorBatchAlignment(
  props: AnyStorageTextInputProps,
  ownerName: 'ArrowStorageTextModel' | 'ArrowDictionaryStorageTextModel' = 'ArrowStorageTextModel'
): void {
  const rowInputs: Array<[string, GPUVector<any> | undefined]> = [
    ['positions', props.positions],
    ['texts', props.texts],
    ['colors', props.colors],
    ['angles', props.angles],
    ['sizes', props.sizes],
    ['pixelOffsets', props.pixelOffsets],
    ['textAnchors', props.textAnchors],
    ['alignmentBaselines', props.alignmentBaselines],
    ['clipRects', props.clipRects]
  ];
  const suppliedInputs = rowInputs.filter(([, vector]) => vector !== undefined) as Array<
    [string, GPUVector<any>]
  >;
  const [referenceName, referenceVector] = suppliedInputs[0];
  for (const [name, vector] of suppliedInputs.slice(1)) {
    if (vector.length !== referenceVector.length) {
      throw new Error(
        `${ownerName} ${name} rows must match ${referenceName} rows (${vector.length} !== ${referenceVector.length})`
      );
    }
    if (vector.data.length !== referenceVector.data.length) {
      throw new Error(`${ownerName} ${name} batch count must match ${referenceName} batch count`);
    }
    for (let batchIndex = 0; batchIndex < vector.data.length; batchIndex++) {
      if (vector.data[batchIndex].length !== referenceVector.data[batchIndex].length) {
        throw new Error(
          `${ownerName} ${name} batch ${batchIndex} rows must match ${referenceName}`
        );
      }
    }
  }
}

function assertStorageSourceVectorAlignment(props: ArrowStorageTextInputProps): void {
  assertSourceVectorMatchesGPUVector(
    'ArrowStorageTextModel',
    'texts',
    props.texts,
    props.sourceVectors.texts
  );
  if (props.clipRects && !props.sourceVectors.clipRects) {
    throw new Error('ArrowStorageTextModel clipRects GPU rows require matching sourceVectors rows');
  }
  if (!props.clipRects && props.sourceVectors.clipRects) {
    throw new Error(
      'ArrowStorageTextModel sourceVectors.clipRects requires matching GPU clipRects rows'
    );
  }
  if (props.clipRects && props.sourceVectors.clipRects) {
    assertSourceVectorMatchesGPUVector(
      'ArrowStorageTextModel',
      'clipRects',
      props.clipRects,
      props.sourceVectors.clipRects
    );
  }
}

function assertDictionaryStorageVectorTypes(props: ArrowDictionaryStorageTextInputProps): void {
  if (!isArrowUtf8DictionaryVector(props.texts)) {
    throw new Error('ArrowDictionaryStorageTextModel texts must be GPUVector<Dictionary<Utf8>>');
  }
  if (!isArrowUtf8DictionaryVector(props.sourceVectors.texts)) {
    throw new Error('ArrowDictionaryStorageTextModel sourceVectors.texts must be Dictionary<Utf8>');
  }
  if (!util.compareTypes(props.sourceVectors.texts.type, props.texts.type)) {
    throw new Error(
      'ArrowDictionaryStorageTextModel sourceVectors.texts type must match GPU texts type'
    );
  }
  if (
    !DataType.isFixedSizeList(props.positions.type) ||
    props.positions.type.listSize !== 2 ||
    !(props.positions.type.children[0]?.type instanceof Float32)
  ) {
    throw new Error(
      'ArrowDictionaryStorageTextModel positions must be GPUVector<FixedSizeList<Float32>[2]>'
    );
  }
  if (
    props.colors &&
    (!DataType.isFixedSizeList(props.colors.type) ||
      props.colors.type.listSize !== 4 ||
      !(props.colors.type.children[0]?.type instanceof Uint8))
  ) {
    throw new Error(
      'ArrowDictionaryStorageTextModel colors must be GPUVector<FixedSizeList<Uint8>[4]>'
    );
  }
  if (props.angles && !(props.angles.type instanceof Float32)) {
    throw new Error('ArrowDictionaryStorageTextModel angles must be GPUVector<Float32>');
  }
  if (props.sizes && !(props.sizes.type instanceof Float32)) {
    throw new Error('ArrowDictionaryStorageTextModel sizes must be GPUVector<Float32>');
  }
  if (
    props.pixelOffsets &&
    (!DataType.isFixedSizeList(props.pixelOffsets.type) ||
      props.pixelOffsets.type.listSize !== 2 ||
      !(props.pixelOffsets.type.children[0]?.type instanceof Float32))
  ) {
    throw new Error(
      'ArrowDictionaryStorageTextModel pixelOffsets must be GPUVector<FixedSizeList<Float32>[2]>'
    );
  }
  if (props.textAnchors && !(props.textAnchors.type instanceof Uint8)) {
    throw new Error('ArrowDictionaryStorageTextModel textAnchors must be GPUVector<Uint8>');
  }
  if (props.alignmentBaselines && !(props.alignmentBaselines.type instanceof Uint8)) {
    throw new Error('ArrowDictionaryStorageTextModel alignmentBaselines must be GPUVector<Uint8>');
  }
  const clipRects = props.sourceVectors.clipRects;
  assertClipRects(clipRects as Vector<FixedSizeList<Int16>> | undefined, props.texts.length);
}

function assertDictionaryStorageSourceVectorAlignment(
  props: ArrowDictionaryStorageTextInputProps
): void {
  assertSourceVectorMatchesGPUVector(
    'ArrowDictionaryStorageTextModel',
    'texts',
    props.texts,
    props.sourceVectors.texts
  );
  if (props.clipRects && !props.sourceVectors.clipRects) {
    throw new Error(
      'ArrowDictionaryStorageTextModel clipRects GPU rows require matching sourceVectors rows'
    );
  }
  if (!props.clipRects && props.sourceVectors.clipRects) {
    throw new Error(
      'ArrowDictionaryStorageTextModel sourceVectors.clipRects requires matching GPU clipRects rows'
    );
  }
  if (props.clipRects && props.sourceVectors.clipRects) {
    assertSourceVectorMatchesGPUVector(
      'ArrowDictionaryStorageTextModel',
      'clipRects',
      props.clipRects,
      props.sourceVectors.clipRects
    );
  }
}

function getGpuDataRowStorageIndexBase(
  data: GPUData,
  vectorName: string,
  batchIndex: number
): number {
  if (!Number.isFinite(data.byteStride) || data.byteStride <= 0) {
    throw new Error(
      `ArrowStorageTextModel ${vectorName} batch ${batchIndex} has invalid byte stride`
    );
  }
  const rowStorageIndexBase = data.byteOffset / data.byteStride;
  if (!Number.isInteger(rowStorageIndexBase)) {
    throw new Error(
      `ArrowStorageTextModel ${vectorName} batch ${batchIndex} byte offset is not row aligned`
    );
  }
  return rowStorageIndexBase;
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

/** Builds reusable attribute text state for GPU/state-only model construction. */
export function createArrowAttributeTextState(
  device: Device,
  props: ArrowTextModelProps
): ArrowAttributeTextState {
  return {
    ...prepareArrowTextModel(device, props),
    textProps: props
  };
}

function prepareArrowTextModel(
  device: Device,
  props: ArrowTextModelProps
): {
  modelProps: ArrowModelProps;
  glyphTable: ArrowTextGlyphTable;
  expandedGlyphVertexData: Buffer;
  renderBatches: ArrowTextRenderBatchState[];
  fontAtlasManager?: FontAtlasManager;
  atlasTexture?: DynamicTexture;
  glyphAttributeBuildTimeMs: number;
  sdfRenderSettings: TextSdfRenderSettings;
  defaultFragmentShaderUniforms?: Record<string, unknown>;
  mappingState: ResolvedCharacterMapping;
} {
  const textInputs = resolveArrowTextInputs(props);
  const mappingState = resolveCharacterMapping(props, textInputs.texts);
  const usesDefaultFragmentShader = props.fs === undefined || props.fs === null;
  const defaultFragmentShaderUniforms = usesDefaultFragmentShader
    ? createArrowTextDefaultFragmentShaderUniforms(props.uniforms, mappingState.sdfRenderSettings)
    : undefined;
  const glyphTable = buildArrowTextGlyphTable({
    labelTable: textInputs.labelTable,
    texts: textInputs.texts,
    clipRects: textInputs.clipRects,
    mapping: mappingState.mapping,
    baselineOffset: mappingState.baselineOffset,
    lineHeight: mappingState.lineHeight,
    characterSet: mappingState.characterSet
  });
  const shaderLayout = resolveArrowTextShaderLayout(props);
  const generatedBufferBatches = planGeneratedBufferBatches({
    device,
    recordOffsets: glyphTable.glyphLayout.startIndices,
    recordByteStride: textInputs.clipRects
      ? CLIPPED_EXPANDED_GLYPH_VERTEX_BYTE_STRIDE
      : EXPANDED_GLYPH_VERTEX_BYTE_STRIDE,
    resourceLabel: 'ArrowTextModel expanded glyph vertex data'
  });
  const expandedGlyphVertexStates = generatedBufferBatches.map(generatedBufferBatch =>
    createExpandedGlyphVertexData(device, props, {
      glyphTable,
      shaderLayout,
      generatedBufferBatch,
      rowIndexBase: 0
    })
  );
  const firstExpandedGlyphVertexState = expandedGlyphVertexStates[0];
  if (!firstExpandedGlyphVertexState) {
    throw new Error('ArrowTextModel requires at least one generated glyph render batch');
  }
  const renderBatches = generatedBufferBatches.map((generatedBufferBatch, batchIndex) => ({
    rowStart: generatedBufferBatch.rowStart,
    rowEnd: generatedBufferBatch.rowEnd,
    glyphCount: generatedBufferBatch.recordCount,
    expandedGlyphVertexData: expandedGlyphVertexStates[batchIndex]!.buffer
  }));
  const expandedGlyphVertexState = firstExpandedGlyphVertexState;
  const atlasTexture = mappingState.fontAtlas
    ? new DynamicTexture(device, {
        id: `${props.id || 'arrow-text-model'}-atlas`,
        data: mappingState.fontAtlas.data
      })
    : undefined;

  return {
    modelProps: {
      ...props,
      vs:
        props.vs ?? (textInputs.clipRects ? DEFAULT_CLIPPED_ARROW_TEXT_VS : DEFAULT_ARROW_TEXT_VS),
      fs: props.fs ?? DEFAULT_ARROW_TEXT_FS,
      uniforms: defaultFragmentShaderUniforms ?? props.uniforms,
      shaderLayout,
      bindings: {
        ...(props.bindings || {}),
        ...(atlasTexture ? {fontAtlasTexture: atlasTexture} : {})
      },
      attributes: {
        ...(props.attributes || {}),
        [EXPANDED_GLYPH_VERTEX_DATA]: expandedGlyphVertexState.buffer
      },
      bufferLayout: [...(props.bufferLayout || []), expandedGlyphVertexState.bufferLayout],
      vertexCount: props.vertexCount ?? 6,
      arrowTable: createArrowTextRenderTable(glyphTable.table, generatedBufferBatches),
      arrowCount: 'instance'
    },
    glyphTable,
    expandedGlyphVertexData: expandedGlyphVertexState.buffer,
    renderBatches,
    fontAtlasManager: mappingState.fontAtlasManager,
    atlasTexture,
    glyphAttributeBuildTimeMs: glyphTable.glyphAttributeBuildTimeMs,
    sdfRenderSettings: mappingState.sdfRenderSettings,
    defaultFragmentShaderUniforms,
    mappingState
  };
}

function resolveArrowTextShaderLayout(props: ArrowTextModelProps): ShaderLayout {
  return (
    props.shaderLayout ??
    (props.clipRects ? DEFAULT_CLIPPED_ARROW_TEXT_SHADER_LAYOUT : DEFAULT_ARROW_TEXT_SHADER_LAYOUT)
  );
}

function createArrowTextRenderTable(
  glyphTable: Table,
  generatedBufferBatches?: GeneratedBufferBatch[]
): Table {
  const generatedGlyphColumnNames = new Set([
    GLYPH_OFFSETS_COLUMN,
    GLYPH_FRAMES_COLUMN,
    GLYPH_CLIP_RECTS_COLUMN,
    ROW_INDICES_COLUMN
  ]);
  const fields: Field[] = [];
  const columns: Record<string, Vector> = {};

  for (const field of glyphTable.schema.fields) {
    if (generatedGlyphColumnNames.has(field.name)) {
      continue;
    }
    const vector = glyphTable.getChild(field.name);
    if (!vector) {
      continue;
    }
    fields.push(field);
    columns[field.name] = vector;
  }

  const renderTable = new Table(new Schema(fields, new Map(glyphTable.schema.metadata)), columns);
  if (!generatedBufferBatches || generatedBufferBatches.length <= 1) {
    return renderTable;
  }
  const recordBatches = generatedBufferBatches.flatMap(
    batch => renderTable.slice(batch.recordStart, batch.recordEnd).batches
  );
  return new Table(renderTable.schema, recordBatches);
}

function createExpandedGlyphVertexData(
  device: Device,
  props: ArrowTextModelProps,
  {
    glyphTable,
    shaderLayout,
    generatedBufferBatch,
    rowIndexBase = 0
  }: {
    glyphTable: ArrowTextGlyphTable;
    shaderLayout: ShaderLayout;
    generatedBufferBatch: GeneratedBufferBatch;
    rowIndexBase?: number;
  }
): {
  buffer: Buffer;
  bufferLayout: BufferLayout;
  byteLength: number;
} {
  const {glyphLayout} = glyphTable;
  const glyphClipRects = glyphTable.table.getChild(GLYPH_CLIP_RECTS_COLUMN) as Vector<
    FixedSizeList<Int16>
  > | null;
  const glyphClipRectValues = glyphClipRects
    ? (getArrowVectorBufferSource(glyphClipRects) as Int16Array)
    : undefined;
  const byteStride = glyphClipRectValues
    ? CLIPPED_EXPANDED_GLYPH_VERTEX_BYTE_STRIDE
    : EXPANDED_GLYPH_VERTEX_BYTE_STRIDE;
  const byteLength = generatedBufferBatch.byteLength;
  const arrayBuffer = new ArrayBuffer(Math.max(byteLength, byteStride));
  const int16Values = new Int16Array(arrayBuffer);
  const uint16Values = new Uint16Array(arrayBuffer);
  const uint32Values = new Uint32Array(arrayBuffer);
  const rowIndices = makeGlyphRowIndices(glyphLayout.startIndices, rowIndexBase);

  for (
    let glyphIndex = generatedBufferBatch.recordStart;
    glyphIndex < generatedBufferBatch.recordEnd;
    glyphIndex++
  ) {
    const batchGlyphIndex = glyphIndex - generatedBufferBatch.recordStart;
    const recordInt16Index = (batchGlyphIndex * byteStride) / Int16Array.BYTES_PER_ELEMENT;
    const recordUint32Index = (batchGlyphIndex * byteStride) / Uint32Array.BYTES_PER_ELEMENT;
    const glyphOffsetIndex = glyphIndex * 2;
    const glyphFrameIndex = glyphIndex * 4;

    int16Values[recordInt16Index] = glyphLayout.glyphOffsets[glyphOffsetIndex];
    int16Values[recordInt16Index + 1] = glyphLayout.glyphOffsets[glyphOffsetIndex + 1];
    uint16Values[recordInt16Index + 2] = glyphLayout.glyphFrames[glyphFrameIndex];
    uint16Values[recordInt16Index + 3] = glyphLayout.glyphFrames[glyphFrameIndex + 1];
    uint16Values[recordInt16Index + 4] = glyphLayout.glyphFrames[glyphFrameIndex + 2];
    uint16Values[recordInt16Index + 5] = glyphLayout.glyphFrames[glyphFrameIndex + 3];
    uint32Values[recordUint32Index + 3] = rowIndices[glyphIndex];

    if (glyphClipRectValues) {
      const glyphClipRectIndex = glyphIndex * 4;
      int16Values[recordInt16Index + 8] = glyphClipRectValues[glyphClipRectIndex];
      int16Values[recordInt16Index + 9] = glyphClipRectValues[glyphClipRectIndex + 1];
      int16Values[recordInt16Index + 10] = glyphClipRectValues[glyphClipRectIndex + 2];
      int16Values[recordInt16Index + 11] = glyphClipRectValues[glyphClipRectIndex + 3];
    }
  }

  const shaderAttributeNames = new Set(shaderLayout.attributes.map(attribute => attribute.name));
  const attributes: NonNullable<BufferLayout['attributes']> = [];
  if (shaderAttributeNames.has(GLYPH_OFFSETS_COLUMN)) {
    attributes.push({attribute: GLYPH_OFFSETS_COLUMN, format: 'sint16x2', byteOffset: 0});
  }
  if (shaderAttributeNames.has(GLYPH_FRAMES_COLUMN)) {
    attributes.push({
      attribute: GLYPH_FRAMES_COLUMN,
      format: 'uint16x4',
      byteOffset: Int16Array.BYTES_PER_ELEMENT * 2
    });
  }
  if (shaderAttributeNames.has(ROW_INDICES_COLUMN)) {
    attributes.push({
      attribute: ROW_INDICES_COLUMN,
      format: 'uint32',
      byteOffset: Int16Array.BYTES_PER_ELEMENT * 6
    });
  }
  if (glyphClipRectValues && shaderAttributeNames.has(GLYPH_CLIP_RECTS_COLUMN)) {
    attributes.push({
      attribute: GLYPH_CLIP_RECTS_COLUMN,
      format: 'sint16x4',
      byteOffset: EXPANDED_GLYPH_VERTEX_BYTE_STRIDE
    });
  }

  return {
    buffer: device.createBuffer({
      id:
        `${props.id || 'arrow-text-model'}-expanded-glyph-vertex-data-` +
        `${generatedBufferBatch.rowStart}`,
      usage: Buffer.VERTEX | Buffer.COPY_DST | Buffer.COPY_SRC,
      data: new Uint8Array(arrayBuffer)
    }),
    bufferLayout: {
      name: EXPANDED_GLYPH_VERTEX_DATA,
      stepMode: 'instance',
      byteStride,
      attributes
    },
    byteLength
  };
}

/** Builds reusable WebGPU storage text expansion and row-binding state. */
export function createArrowStorageTextState(
  device: Device,
  props: ArrowStorageTextInputProps
): ArrowStorageTextState {
  if (device.type !== 'webgpu') {
    throw new Error('createArrowStorageTextState requires a WebGPU device');
  }
  const textInputs = resolveArrowStorageTextInputs(props);
  const mappingState = resolveCharacterMapping(props, textInputs.texts);
  const atlasTexture = mappingState.fontAtlas
    ? new DynamicTexture(device, {
        id: `${props.id || 'arrow-storage-text-model'}-atlas`,
        data: mappingState.fontAtlas.data
      })
    : undefined;
  const useGpuUtf8Decode = Boolean(
    mappingState.characterSet &&
      props.characterSet !== 'auto' &&
      isArrowUtf8Vector(textInputs.texts)
  );

  let glyphStream: GpuExpandedTextStream | undefined;
  let glyphFrames: StorageGlyphFrameState | undefined;
  let utf8GlyphDefinitions: ReturnType<typeof buildGpuUtf8GlyphDefinitions> | undefined;
  let glyphCount = 0;
  let glyphAttributeBuildTimeMs = 0;
  let compactStreamByteLength = 0;
  let generatedRenderBufferByteLength = 0;
  let renderControlByteLength = 0;
  let rowStorageByteLength = 0;
  let glyphDefinitionStorageByteLength = 0;
  let transientComputeInputByteLength = 0;
  const ownedRowStorageResources: StorageTextOwnedResource[] = [];
  const ownedGlyphResources: StorageTextOwnedResource[] = [];
  const batches: ArrowStorageTextBatchState[] = [];
  const renderBatches: ArrowStorageTextRenderBatchState[] = [];
  const defaultBuffers = createStorageTextDefaultBuffers(device, props);
  ownedRowStorageResources.push(...defaultBuffers.ownedResources);
  rowStorageByteLength += defaultBuffers.byteLength;

  if (useGpuUtf8Decode) {
    const glyphDefinitions = buildGpuUtf8GlyphDefinitions({
      mapping: mappingState.mapping,
      baselineOffset: mappingState.baselineOffset,
      lineHeight: mappingState.lineHeight,
      characterSet: mappingState.characterSet!
    });
    utf8GlyphDefinitions = glyphDefinitions;
    glyphFrames = createStorageGlyphFrames(device, props, glyphDefinitions.glyphFrames);
    glyphDefinitionStorageByteLength = glyphFrames.byteLength;
    for (const [rowBindingBatchIndex, batchInput] of textInputs.batches.entries()) {
      const rowState = createStorageTextBatchRowState(
        device,
        props,
        batchInput,
        defaultBuffers,
        mappingState.sdfRenderSettings
      );
      const utf8TextInput = buildGpuUtf8TextInput(batchInput.texts as Vector<Utf8>);
      const rowGlyphStarts = createStorageRowGlyphStartsBuffer(
        device,
        props,
        batchInput.batchRowIndexBase,
        utf8TextInput.startIndices
      );
      ownedGlyphResources.push(rowGlyphStarts.buffer);
      renderControlByteLength += rowGlyphStarts.byteLength;
      const glyphMetrics = createStorageGlyphMetrics(
        device,
        {id: props.id},
        glyphDefinitions.glyphMetrics
      );
      const glyphLookup = createStorageGlyphLookup(
        device,
        {id: props.id},
        glyphDefinitions.glyphLookup
      );
      const generatedBufferBatches = planGeneratedBufferBatches({
        device,
        recordOffsets: utf8TextInput.startIndices,
        recordByteStride: COMPACT_GLYPH_VERTEX_BYTE_STRIDE,
        maxBatchByteLength: device.limits.maxStorageBufferBindingSize,
        resourceLabel: 'ArrowStorageTextModel UTF-8 generated glyph vertex data'
      });
      for (const generatedBufferBatch of generatedBufferBatches) {
        const partitionedUtf8TextInput = createPartitionedGpuUtf8TextInput(
          utf8TextInput,
          generatedBufferBatch
        );
        const utf8Input = createGpuUtf8ExpandedInput(
          device,
          {id: props.id},
          {
            utf8TextInput: partitionedUtf8TextInput,
            baselineOffsetY: glyphDefinitions.baselineOffsetY,
            glyphLookupCount: glyphDefinitions.glyphLookup.length / 2,
            labelCount: generatedBufferBatch.rowEnd - generatedBufferBatch.rowStart,
            batchRowIndexBase: batchInput.batchRowIndexBase + generatedBufferBatch.rowStart,
            rowStorageIndexBase: batchInput.rowStorageIndexBase + generatedBufferBatch.rowStart,
            alignment: createGpuTextAlignmentOptions(props, rowState, mappingState.lineHeight)
          }
        );
        const generated = createGpuExpandedGeneratedState(
          device,
          {id: props.id},
          partitionedUtf8TextInput.byteLength
        );
        dispatchGpuUtf8ExpandedTextCompute(
          device,
          {id: props.id},
          {
            utf8Input,
            glyphLookup,
            glyphMetrics,
            generated,
            outputSlotCount: partitionedUtf8TextInput.byteLength,
            labelCount: generatedBufferBatch.rowEnd - generatedBufferBatch.rowStart,
            alignment: {
              rowTextAnchorsBuffer: getComputeStorageBuffer(rowState.rowTextAnchorsBuffer),
              rowAlignmentBaselinesBuffer: getComputeStorageBuffer(
                rowState.rowAlignmentBaselinesBuffer
              )
            }
          }
        );
        const storageRenderConfigBuffer = createStorageRenderConfigBuffer(
          device,
          props,
          batchInput.batchRowIndexBase,
          generatedBufferBatch
        );
        renderBatches.push({
          rowBindingBatchIndex,
          rowStart: generatedBufferBatch.rowStart,
          rowEnd: generatedBufferBatch.rowEnd,
          glyphIndexBase: generatedBufferBatch.recordStart,
          glyphCount: partitionedUtf8TextInput.byteLength,
          compactGlyphVertexData: generated.compactGlyphVertexData,
          storageRenderConfigBuffer
        });
        ownedGlyphResources.push(storageRenderConfigBuffer);
        renderControlByteLength += storageRenderConfigBuffer.byteLength;
        generatedRenderBufferByteLength += generated.byteLength;
        transientComputeInputByteLength += utf8Input.byteLength;
        utf8Input.rowByteRangesBuffer.destroy();
        utf8Input.utf8BytesBuffer.destroy();
        utf8Input.expansionConfigBuffer.destroy();
      }
      batches.push({
        ...rowState,
        batchRowIndexBase: batchInput.batchRowIndexBase,
        rowCount: batchInput.texts.length,
        glyphCount: utf8TextInput.byteLength,
        rowGlyphStartsBuffer: rowGlyphStarts.buffer
      });
      glyphCount += utf8TextInput.byteLength;
      glyphAttributeBuildTimeMs += utf8TextInput.textInputBuildTimeMs;
      compactStreamByteLength += utf8TextInput.inputByteLength;
      rowStorageByteLength += rowState.ownedByteLength;
      transientComputeInputByteLength += glyphLookup.byteLength + glyphMetrics.byteLength;
      ownedRowStorageResources.push(...rowState.ownedResources);
      glyphMetrics.buffer.destroy();
      glyphLookup.buffer.destroy();
    }
  } else {
    for (const [batchIndex, batchInput] of textInputs.batches.entries()) {
      const rowState = createStorageTextBatchRowState(
        device,
        props,
        batchInput,
        defaultBuffers,
        mappingState.sdfRenderSettings
      );
      const batchGlyphStream = buildGpuExpandedTextStream({
        texts: batchInput.texts,
        mapping: mappingState.mapping,
        baselineOffset: mappingState.baselineOffset,
        lineHeight: mappingState.lineHeight,
        characterSet: mappingState.characterSet
      });
      const rowGlyphStarts = createStorageRowGlyphStartsBuffer(
        device,
        props,
        batchInput.batchRowIndexBase,
        batchGlyphStream.startIndices
      );
      ownedGlyphResources.push(rowGlyphStarts.buffer);
      renderControlByteLength += rowGlyphStarts.byteLength;
      glyphStream ??= batchGlyphStream;
      glyphFrames ??= createStorageGlyphFrames(device, props, batchGlyphStream.glyphFrames);
      if (batchIndex === 0) {
        glyphDefinitionStorageByteLength = glyphFrames.byteLength;
      }
      const glyphMetrics = createStorageGlyphMetrics(
        device,
        {id: props.id},
        batchGlyphStream.glyphMetrics
      );
      const generatedBufferBatches = planGeneratedBufferBatches({
        device,
        recordOffsets: batchGlyphStream.startIndices,
        recordByteStride: COMPACT_GLYPH_VERTEX_BYTE_STRIDE,
        maxBatchByteLength: device.limits.maxStorageBufferBindingSize,
        resourceLabel: 'ArrowStorageTextModel compact generated glyph vertex data'
      });
      for (const generatedBufferBatch of generatedBufferBatches) {
        const partitionedGlyphStream = createPartitionedGpuExpandedTextStream(
          batchGlyphStream,
          generatedBufferBatch
        );
        const compactInput = createGpuExpandedCompactInput(
          device,
          {id: props.id},
          partitionedGlyphStream,
          batchInput.batchRowIndexBase + generatedBufferBatch.rowStart,
          createGpuTextAlignmentOptions(props, rowState, mappingState.lineHeight),
          batchInput.rowStorageIndexBase + generatedBufferBatch.rowStart
        );
        const generated = createGpuExpandedGeneratedState(
          device,
          {id: props.id},
          partitionedGlyphStream.glyphCount
        );
        dispatchGpuExpandedTextCompute(
          device,
          {id: props.id},
          {
            compactInput,
            glyphMetrics,
            generated,
            glyphCount: partitionedGlyphStream.glyphCount,
            labelCount: generatedBufferBatch.rowEnd - generatedBufferBatch.rowStart,
            alignment: {
              rowTextAnchorsBuffer: getComputeStorageBuffer(rowState.rowTextAnchorsBuffer),
              rowAlignmentBaselinesBuffer: getComputeStorageBuffer(
                rowState.rowAlignmentBaselinesBuffer
              )
            }
          }
        );
        const storageRenderConfigBuffer = createStorageRenderConfigBuffer(
          device,
          props,
          batchInput.batchRowIndexBase,
          generatedBufferBatch
        );
        renderBatches.push({
          rowBindingBatchIndex: batchIndex,
          rowStart: generatedBufferBatch.rowStart,
          rowEnd: generatedBufferBatch.rowEnd,
          glyphIndexBase: generatedBufferBatch.recordStart,
          glyphCount: partitionedGlyphStream.glyphCount,
          compactGlyphVertexData: generated.compactGlyphVertexData,
          storageRenderConfigBuffer
        });
        ownedGlyphResources.push(storageRenderConfigBuffer);
        renderControlByteLength += storageRenderConfigBuffer.byteLength;
        generatedRenderBufferByteLength += generated.byteLength;
        transientComputeInputByteLength += compactInput.byteLength;
        compactInput.glyphRangesBuffer.destroy();
        compactInput.glyphIdsBuffer.destroy();
        compactInput.expansionConfigBuffer.destroy();
      }
      batches.push({
        ...rowState,
        batchRowIndexBase: batchInput.batchRowIndexBase,
        rowCount: batchInput.texts.length,
        glyphCount: batchGlyphStream.glyphCount,
        rowGlyphStartsBuffer: rowGlyphStarts.buffer
      });
      glyphCount += batchGlyphStream.glyphCount;
      glyphAttributeBuildTimeMs += batchGlyphStream.glyphStreamBuildTimeMs;
      compactStreamByteLength += batchGlyphStream.compactStreamByteLength;
      rowStorageByteLength += rowState.ownedByteLength;
      transientComputeInputByteLength += glyphMetrics.byteLength;
      ownedRowStorageResources.push(...rowState.ownedResources);
      glyphMetrics.buffer.destroy();
    }
  }

  glyphFrames ??= createStorageGlyphFrames(device, props, new Float32Array(4));
  const firstBatch = getFirstArrowStorageTextBatch({batches});
  const firstRenderBatch = getFirstArrowStorageTextRenderBatch({renderBatches});
  let destroyed = false;
  const storageState: ArrowStorageTextState = {
    glyphStream,
    fontAtlasManager: mappingState.fontAtlasManager,
    atlasTexture,
    characterSet: mappingState.characterSet,
    glyphCount,
    glyphAttributeBuildTimeMs,
    glyphAttributeByteLength: generatedRenderBufferByteLength + renderControlByteLength,
    compactStreamBuildTimeMs: glyphAttributeBuildTimeMs,
    compactStreamByteLength,
    generatedRenderBufferByteLength,
    renderControlByteLength,
    rowStorageByteLength,
    glyphDefinitionStorageByteLength,
    transientComputeInputByteLength,
    sdfRenderSettings: mappingState.sdfRenderSettings,
    batches,
    renderBatches,
    ownedRowBindingResources: ownedRowStorageResources,
    ownedGlyphResources,
    rowPositionsBuffer: firstBatch.rowPositionsBuffer,
    rowColorsBuffer: firstBatch.rowColorsBuffer,
    rowAnglesBuffer: firstBatch.rowAnglesBuffer,
    rowSizesBuffer: firstBatch.rowSizesBuffer,
    rowPixelOffsetsBuffer: firstBatch.rowPixelOffsetsBuffer,
    rowTextAnchorsBuffer: firstBatch.rowTextAnchorsBuffer,
    rowAlignmentBaselinesBuffer: firstBatch.rowAlignmentBaselinesBuffer,
    rowClipRectsBuffer: firstBatch.rowClipRectsBuffer,
    rowGlyphStartsBuffer: getStorageRowGlyphStartsBuffer(firstBatch),
    styleConfigBuffer: firstBatch.styleConfigBuffer,
    storageRenderConfigBuffer: firstRenderBatch.storageRenderConfigBuffer,
    glyphFramesBuffer: glyphFrames.buffer,
    compactGlyphVertexData: firstRenderBatch.compactGlyphVertexData,
    destroy: () => {
      if (destroyed) {
        return;
      }
      destroyed = true;
      atlasTexture?.destroy();
      destroyStorageTextResources(ownedRowStorageResources);
      destroyStorageTextResources(ownedGlyphResources);
      glyphFrames.buffer.destroy();
      for (const renderBatch of renderBatches) {
        renderBatch.compactGlyphVertexData.destroy();
      }
    }
  };
  arrowStorageTextAppendContexts.set(storageState, {
    defaultBuffers,
    mappingState,
    useGpuUtf8Decode,
    utf8GlyphDefinitions
  });
  return storageState;
}

/** Builds reusable WebGPU compressed dictionary text storage state. */
export function createArrowDictionaryStorageTextState(
  device: Device,
  props: ArrowDictionaryStorageTextInputProps
): ArrowDictionaryStorageTextState {
  if (device.type !== 'webgpu') {
    throw new Error('createArrowDictionaryStorageTextState requires a WebGPU device');
  }
  const textInputs = resolveArrowDictionaryStorageTextInputs(props);
  const mappingState = resolveCharacterMapping(props, textInputs.texts);
  const atlasTexture = mappingState.fontAtlas
    ? new DynamicTexture(device, {
        id: `${props.id || 'arrow-dictionary-storage-text-model'}-atlas`,
        data: mappingState.fontAtlas.data
      })
    : undefined;

  let glyphStream: GpuDictionaryCompressedTextStream | undefined;
  let glyphCount = 0;
  let dictionaryGlyphCount = 0;
  let dictionaryValueCount = 0;
  let glyphAttributeBuildTimeMs = 0;
  let compactStreamByteLength = 0;
  let generatedRenderBufferByteLength = 0;
  let rowStorageByteLength = 0;
  let glyphDefinitionStorageByteLength = 0;
  const ownedRowStorageResources: StorageTextOwnedResource[] = [];
  const ownedDictionaryResources: StorageTextOwnedResource[] = [];
  const batches: ArrowDictionaryStorageTextBatchState[] = [];
  const renderBatches: ArrowDictionaryStorageTextRenderBatchState[] = [];
  const defaultBuffers = createStorageTextDefaultBuffers(device, props);
  ownedRowStorageResources.push(...defaultBuffers.ownedResources);
  rowStorageByteLength += defaultBuffers.byteLength;

  for (const [rowBindingBatchIndex, batchInput] of textInputs.batches.entries()) {
    // Row/style buffers stay row-aligned and are shared with the storage text path.
    // The dictionary-specific buffers below only describe text content.
    const rowState = createStorageTextBatchRowState(
      device,
      props,
      batchInput,
      defaultBuffers,
      mappingState.sdfRenderSettings
    );
    const batchGlyphStream = buildGpuDictionaryCompressedTextStream({
      texts: batchInput.texts as Vector<ArrowUtf8Dictionary>,
      mapping: mappingState.mapping,
      baselineOffset: mappingState.baselineOffset,
      lineHeight: mappingState.lineHeight,
      characterSet: mappingState.characterSet
    });
    // One record per row plus a terminal sentinel lets the shader recover the
    // row for an instance_index by binary-searching visible glyph starts.
    const rowDictionaryRecords = createDictionaryRowRecords(batchGlyphStream);
    const rowDictionaryRecordsBuffer = createDictionaryStorageBuffer(
      device,
      props,
      `row-dictionary-records-${batchInput.batchRowIndexBase}`,
      rowDictionaryRecords,
      new Uint32Array(2)
    );
    // One range per unique dictionary value. Repeated rows reference these
    // ranges instead of storing their own glyph ids and layout offsets.
    const dictionaryGlyphRangesBuffer = createDictionaryStorageBuffer(
      device,
      props,
      `dictionary-glyph-ranges-${batchInput.batchRowIndexBase}`,
      batchGlyphStream.dictionaryGlyphRanges,
      new Uint32Array(2)
    );
    // Shared glyph layout records for dictionary strings in this Arrow batch.
    // This is the main compressed payload and scales with unique dictionary text.
    const dictionaryGlyphRecordsBuffer = createDictionaryStorageBuffer(
      device,
      props,
      `dictionary-glyph-records-${batchInput.batchRowIndexBase}`,
      batchGlyphStream.dictionaryGlyphRecords,
      new Uint32Array(2)
    );
    const glyphFrames = createStorageGlyphFrames(device, props, batchGlyphStream.glyphFrames);
    const generatedBufferBatches = planGeneratedBufferBatches({
      device,
      recordOffsets: batchGlyphStream.startIndices,
      // The dictionary model does not allocate a generated vertex buffer; the
      // planner is used only to split draw instance counts by device limits.
      recordByteStride: 1,
      maxBatchByteLength: device.limits.maxStorageBufferBindingSize,
      resourceLabel: 'ArrowDictionaryStorageTextModel glyph instances'
    });

    for (const generatedBufferBatch of generatedBufferBatches) {
      const dictionaryRenderConfigBuffer = createDictionaryRenderConfigBuffer(
        device,
        props,
        batchInput.batchRowIndexBase,
        generatedBufferBatch
      );
      renderBatches.push({
        rowBindingBatchIndex,
        rowStart: generatedBufferBatch.rowStart,
        rowEnd: generatedBufferBatch.rowEnd,
        glyphIndexBase: generatedBufferBatch.recordStart,
        glyphCount: generatedBufferBatch.recordCount,
        dictionaryRenderConfigBuffer
      });
      ownedDictionaryResources.push(dictionaryRenderConfigBuffer);
      compactStreamByteLength += dictionaryRenderConfigBuffer.byteLength;
    }

    batches.push({
      ...rowState,
      batchRowIndexBase: batchInput.batchRowIndexBase,
      rowCount: batchInput.texts.length,
      glyphCount: batchGlyphStream.glyphCount,
      rowDictionaryRecordsBuffer,
      dictionaryGlyphRangesBuffer,
      dictionaryGlyphRecordsBuffer,
      glyphFramesBuffer: glyphFrames.buffer,
      dictionaryGlyphCount: batchGlyphStream.dictionaryGlyphCount,
      dictionaryValueCount: batchGlyphStream.dictionaryValueCount
    });
    glyphStream ??= batchGlyphStream;
    glyphCount += batchGlyphStream.glyphCount;
    dictionaryGlyphCount += batchGlyphStream.dictionaryGlyphCount;
    dictionaryValueCount += batchGlyphStream.dictionaryValueCount;
    glyphAttributeBuildTimeMs += batchGlyphStream.glyphStreamBuildTimeMs;
    compactStreamByteLength +=
      rowDictionaryRecords.byteLength +
      batchGlyphStream.dictionaryGlyphRanges.byteLength +
      batchGlyphStream.dictionaryGlyphRecords.byteLength;
    rowStorageByteLength += rowState.ownedByteLength;
    glyphDefinitionStorageByteLength += glyphFrames.byteLength;
    ownedRowStorageResources.push(...rowState.ownedResources);
    ownedDictionaryResources.push(
      rowDictionaryRecordsBuffer,
      dictionaryGlyphRangesBuffer,
      dictionaryGlyphRecordsBuffer,
      glyphFrames.buffer
    );
  }

  const firstBatch = getFirstArrowDictionaryStorageTextBatch({batches});
  const firstRenderBatch = getFirstArrowDictionaryStorageTextRenderBatch({renderBatches});
  let destroyed = false;
  const storageState: ArrowDictionaryStorageTextState = {
    glyphStream,
    fontAtlasManager: mappingState.fontAtlasManager,
    atlasTexture,
    characterSet: mappingState.characterSet,
    glyphCount,
    dictionaryGlyphCount,
    dictionaryValueCount,
    glyphAttributeBuildTimeMs,
    glyphAttributeByteLength: generatedRenderBufferByteLength,
    compactStreamBuildTimeMs: glyphAttributeBuildTimeMs,
    compactStreamByteLength,
    generatedRenderBufferByteLength,
    rowStorageByteLength,
    glyphDefinitionStorageByteLength,
    transientComputeInputByteLength: 0,
    sdfRenderSettings: mappingState.sdfRenderSettings,
    batches,
    renderBatches,
    ownedRowBindingResources: ownedRowStorageResources,
    ownedDictionaryResources,
    rowPositionsBuffer: firstBatch.rowPositionsBuffer,
    rowColorsBuffer: firstBatch.rowColorsBuffer,
    rowAnglesBuffer: firstBatch.rowAnglesBuffer,
    rowSizesBuffer: firstBatch.rowSizesBuffer,
    rowPixelOffsetsBuffer: firstBatch.rowPixelOffsetsBuffer,
    rowTextAnchorsBuffer: firstBatch.rowTextAnchorsBuffer,
    rowAlignmentBaselinesBuffer: firstBatch.rowAlignmentBaselinesBuffer,
    rowClipRectsBuffer: firstBatch.rowClipRectsBuffer,
    rowDictionaryRecordsBuffer: firstBatch.rowDictionaryRecordsBuffer,
    dictionaryGlyphRangesBuffer: firstBatch.dictionaryGlyphRangesBuffer,
    dictionaryGlyphRecordsBuffer: firstBatch.dictionaryGlyphRecordsBuffer,
    dictionaryRenderConfigBuffer: firstRenderBatch.dictionaryRenderConfigBuffer,
    styleConfigBuffer: firstBatch.styleConfigBuffer,
    glyphFramesBuffer: firstBatch.glyphFramesBuffer,
    destroy: () => {
      if (destroyed) {
        return;
      }
      destroyed = true;
      atlasTexture?.destroy();
      destroyStorageTextResources(ownedRowStorageResources);
      destroyStorageTextResources(ownedDictionaryResources);
    }
  };
  return storageState;
}

function createDictionaryRenderConfigBuffer(
  device: Device,
  props: ArrowDictionaryStorageTextInputProps,
  batchRowIndexBase: number,
  generatedBufferBatch: GeneratedBufferBatch
): DynamicBuffer {
  // The render config is the only per-render-batch dictionary allocation. It
  // tells WGSL which visible-glyph instance range and row range this draw owns.
  const data = new Uint32Array(
    DICTIONARY_RENDER_CONFIG_BYTE_LENGTH / Uint32Array.BYTES_PER_ELEMENT
  );
  data[0] = generatedBufferBatch.recordStart;
  data[1] = generatedBufferBatch.rowStart;
  data[2] = generatedBufferBatch.rowEnd;
  data[3] = 0;
  return new DynamicBuffer(device, {
    id:
      `${props.id || 'arrow-dictionary-storage-text-model'}-render-config-` +
      `${batchRowIndexBase}-${generatedBufferBatch.rowStart}`,
    usage: Buffer.UNIFORM | Buffer.COPY_DST | Buffer.COPY_SRC,
    data
  });
}

function createStorageRenderConfigBuffer(
  device: Device,
  props: ArrowStorageTextInputProps,
  batchRowIndexBase: number,
  generatedBufferBatch: GeneratedBufferBatch
): DynamicBuffer {
  const data = new Uint32Array(STORAGE_RENDER_CONFIG_BYTE_LENGTH / Uint32Array.BYTES_PER_ELEMENT);
  data[0] = generatedBufferBatch.recordStart;
  data[1] = generatedBufferBatch.rowStart;
  data[2] = generatedBufferBatch.rowEnd;
  data[3] = 0;
  return new DynamicBuffer(device, {
    id:
      `${props.id || 'arrow-storage-text-model'}-render-config-` +
      `${batchRowIndexBase}-${generatedBufferBatch.rowStart}`,
    usage: Buffer.UNIFORM | Buffer.COPY_DST | Buffer.COPY_SRC,
    data
  });
}

function createStorageRowGlyphStartsBuffer(
  device: Device,
  props: ArrowStorageTextInputProps,
  batchRowIndexBase: number,
  startIndices: readonly number[]
): {buffer: Buffer; byteLength: number} {
  const rowGlyphStarts = new Uint32Array(startIndices);
  return {
    buffer: device.createBuffer({
      id: `${props.id || 'arrow-storage-text-model'}-row-glyph-starts-${batchRowIndexBase}`,
      usage: Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
      data: rowGlyphStarts.byteLength > 0 ? rowGlyphStarts : new Uint32Array(1)
    }),
    byteLength: rowGlyphStarts.byteLength
  };
}

function createDictionaryRowRecords(glyphStream: GpuDictionaryCompressedTextStream): Uint32Array {
  const rowCount = glyphStream.rowDictionaryIndices.length;
  const records = new Uint32Array((rowCount + 1) * 2);
  // Pair each row's dictionary key with the first visible glyph occurrence for
  // that row. The final sentinel makes row-end lookup a single indexed read.
  for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
    records[rowIndex * 2] = glyphStream.rowDictionaryIndices[rowIndex] ?? INVALID_DICTIONARY_INDEX;
    records[rowIndex * 2 + 1] = glyphStream.rowGlyphRanges[rowIndex * 2] ?? 0;
  }
  records[rowCount * 2] = INVALID_DICTIONARY_INDEX;
  records[rowCount * 2 + 1] = glyphStream.glyphCount;
  return records;
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

function getNow(): number {
  return globalThis.performance?.now() ?? Date.now();
}

function resolveCharacterMapping(
  props: ArrowTextModelProps | AnyStorageTextInputProps,
  texts: ArrowUtf8TextVector
): ResolvedCharacterMapping {
  const characterSet =
    props.characterSet === 'auto'
      ? collectArrowCharacterSet(texts)
      : normalizeCharacterSet(props.characterSet);
  const lineHeightMultiplier = props.lineHeight ?? 1;

  if (props.characterMapping) {
    const fontSize = props.fontSettings?.fontSize ?? DEFAULT_FONT_SETTINGS.fontSize;
    return {
      mapping: props.characterMapping,
      baselineOffset: props.fontAtlas?.baselineOffset ?? 0,
      lineHeight: lineHeightMultiplier * fontSize,
      characterSet,
      fontAtlas: props.fontAtlas,
      sdfRenderSettings: resolveTextSdfRenderSettings(props)
    };
  }

  const fontAtlasManager = props.fontAtlasManager ?? new FontAtlasManager();
  fontAtlasManager.setProps({
    ...(props.fontSettings || {}),
    ...(characterSet ? {characterSet} : {})
  });
  const fontAtlas = fontAtlasManager.atlas;
  const mapping = fontAtlasManager.mapping;
  if (!fontAtlas || !mapping) {
    throw new Error('Text models require a generated or injected font atlas mapping');
  }

  return {
    mapping,
    baselineOffset: fontAtlas.baselineOffset,
    lineHeight: lineHeightMultiplier * fontAtlasManager.props.fontSize,
    characterSet,
    fontAtlasManager,
    fontAtlas,
    sdfRenderSettings: resolveTextSdfRenderSettings(props, fontAtlasManager)
  };
}

function collectArrowCharacterSet(texts: ArrowUtf8TextVector): Set<string> {
  const characterSet = new Set<string>();
  if (isArrowUtf8DictionaryType(texts.type)) {
    for (let rowIndex = 0; rowIndex < texts.length; rowIndex++) {
      const value = texts.get(rowIndex);
      if (typeof value !== 'string') {
        continue;
      }
      for (const character of Array.from(value)) {
        characterSet.add(character);
      }
    }
    return characterSet;
  }

  const chunks = buildArrowUtf8Chunks(texts as Vector<Utf8>);
  const target: Utf8TextIndexTarget = {startIndex: 0, endIndex: 0};
  for (let rowIndex = 0; rowIndex < texts.length; rowIndex++) {
    populateUtf8TextIndices(chunks, rowIndex, target);
    decodeArrowUtf8CodePoints(chunks, target.startIndex, target.endIndex, codePoint => {
      characterSet.add(String.fromCodePoint(codePoint));
    });
  }
  return characterSet;
}

function normalizeCharacterSet(
  characterSet: FontSettings['characterSet'] | undefined
): Set<string> | undefined {
  if (!characterSet) {
    return undefined;
  }
  return typeof characterSet === 'string'
    ? new Set(Array.from(characterSet))
    : new Set(characterSet);
}

function resolveTextSdfRenderSettings(
  props: ArrowTextModelProps | AnyStorageTextInputProps,
  fontAtlasManager?: FontAtlasManager
): TextSdfRenderSettings {
  const fontSettings = fontAtlasManager?.props ?? {
    ...DEFAULT_FONT_SETTINGS,
    ...(props.fontSettings || {})
  };
  return {
    sdf: fontSettings.sdf,
    threshold: 1 - fontSettings.cutoff,
    smoothing: Math.max(0, fontSettings.smoothing)
  };
}

function createArrowTextDefaultFragmentShaderUniforms(
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

function assertColumnAvailable(table: Table, columnName: string): void {
  if (table.getChild(columnName)) {
    throw new Error(`ArrowTextModel labelTable column "${columnName}" is reserved`);
  }
}

function assertClipRects(
  clipRects: Vector<FixedSizeList<Int16>> | undefined,
  labelCount: number
): void {
  if (!clipRects) {
    return;
  }
  if (clipRects.length !== labelCount) {
    throw new Error('ArrowTextModel clipRects rows must match UTF-8 text rows');
  }
  if (
    !DataType.isFixedSizeList(clipRects.type) ||
    clipRects.type.listSize !== 4 ||
    !(clipRects.type.children[0]?.type instanceof Int16)
  ) {
    throw new Error('ArrowTextModel clipRects must be FixedSizeList<Int16>[4]');
  }
}

type StorageTextDefaultBuffers = {
  colorsBuffer: Buffer;
  anglesBuffer: Buffer;
  sizesBuffer: Buffer;
  pixelOffsetsBuffer: Buffer;
  textAnchorsBuffer: Buffer;
  alignmentBaselinesBuffer: Buffer;
  clipRectsBuffer: Buffer;
  byteLength: number;
  ownedResources: StorageTextOwnedResource[];
};

type StorageTextBatchRowState = {
  rowStorageIndexBase: number;
  rowPositionsBuffer: StorageTextBuffer;
  rowColorsBuffer: StorageTextBuffer;
  rowAnglesBuffer: StorageTextBuffer;
  rowSizesBuffer: StorageTextBuffer;
  rowPixelOffsetsBuffer: StorageTextBuffer;
  rowTextAnchorsBuffer: StorageTextBuffer;
  rowAlignmentBaselinesBuffer: StorageTextBuffer;
  rowClipRectsBuffer: Buffer;
  styleConfigBuffer: DynamicBuffer;
  ownedResources: StorageTextOwnedResource[];
  ownedByteLength: number;
};

type StorageGlyphFrameState = {
  buffer: Buffer;
  byteLength: number;
};

type ArrowStorageTextAppendContext = {
  defaultBuffers: StorageTextDefaultBuffers;
  mappingState: ResolvedCharacterMapping;
  useGpuUtf8Decode: boolean;
  utf8GlyphDefinitions?: ReturnType<typeof buildGpuUtf8GlyphDefinitions>;
};

const arrowStorageTextAppendContexts = new WeakMap<
  ArrowStorageTextState,
  ArrowStorageTextAppendContext
>();

function createStorageTextDefaultBuffers(
  device: Device,
  props: AnyStorageTextInputProps
): StorageTextDefaultBuffers {
  const id = props.id || 'storage-text-model';
  const colorsVector = createStorageTextOwnedGpuVector(
    device,
    `${id}-default-row-colors`,
    makeArrowFixedSizeListVector(
      new Uint8(),
      4,
      new Uint8Array(props.color ?? DEFAULT_STORAGE_TEXT_COLOR)
    )
  );
  const anglesVector = createStorageTextOwnedGpuVector(
    device,
    `${id}-default-row-angles`,
    makeNumericArrowVector(
      new Float32(),
      new Float32Array([props.angle ?? DEFAULT_STORAGE_TEXT_ANGLE])
    )
  );
  const sizesVector = createStorageTextOwnedGpuVector(
    device,
    `${id}-default-row-sizes`,
    makeNumericArrowVector(
      new Float32(),
      new Float32Array([props.size ?? DEFAULT_STORAGE_TEXT_SIZE])
    )
  );
  const pixelOffsetsVector = createStorageTextOwnedGpuVector(
    device,
    `${id}-default-row-pixel-offsets`,
    makeArrowFixedSizeListVector(
      new Float32(),
      2,
      new Float32Array(props.pixelOffset ?? DEFAULT_STORAGE_TEXT_PIXEL_OFFSET)
    )
  );
  const textAnchorsVector = createStorageTextOwnedGpuVector(
    device,
    `${id}-default-row-text-anchors`,
    makeNumericArrowVector(new Uint32(), new Uint32Array([getTextAnchorEnum(props.textAnchor)]))
  );
  const alignmentBaselinesVector = createStorageTextOwnedGpuVector(
    device,
    `${id}-default-row-alignment-baselines`,
    makeNumericArrowVector(
      new Uint32(),
      new Uint32Array([getAlignmentBaselineEnum(props.alignmentBaseline)])
    )
  );
  const clipRectsVector = createStorageTextOwnedGpuVector(
    device,
    `${id}-default-row-clip-rects`,
    makeArrowFixedSizeListVector(new Uint32(), 2, new Uint32Array(2))
  );
  return {
    colorsBuffer: getStorageTextGpuVectorBuffer(colorsVector),
    anglesBuffer: getStorageTextGpuVectorBuffer(anglesVector),
    sizesBuffer: getStorageTextGpuVectorBuffer(sizesVector),
    pixelOffsetsBuffer: getStorageTextGpuVectorBuffer(pixelOffsetsVector),
    textAnchorsBuffer: getStorageTextGpuVectorBuffer(textAnchorsVector),
    alignmentBaselinesBuffer: getStorageTextGpuVectorBuffer(alignmentBaselinesVector),
    clipRectsBuffer: getStorageTextGpuVectorBuffer(clipRectsVector),
    byteLength:
      Uint8Array.BYTES_PER_ELEMENT * 4 +
      Float32Array.BYTES_PER_ELEMENT +
      Float32Array.BYTES_PER_ELEMENT +
      Float32Array.BYTES_PER_ELEMENT * 2 +
      Uint32Array.BYTES_PER_ELEMENT +
      Uint32Array.BYTES_PER_ELEMENT +
      Uint32Array.BYTES_PER_ELEMENT * 2,
    ownedResources: [
      colorsVector,
      anglesVector,
      sizesVector,
      pixelOffsetsVector,
      textAnchorsVector,
      alignmentBaselinesVector,
      clipRectsVector
    ]
  };
}

function createStorageTextBatchRowState(
  device: Device,
  props: AnyStorageTextInputProps,
  batchInput: ResolvedArrowStorageTextBatchInputs,
  defaultBuffers: StorageTextDefaultBuffers,
  sdfRenderSettings: TextSdfRenderSettings
): StorageTextBatchRowState {
  const packedClipRects = batchInput.clipRects
    ? packStorageTextClipRects(batchInput.clipRects)
    : undefined;
  const rowClipRectsVector = packedClipRects
    ? createStorageTextOwnedGpuVector(
        device,
        `${props.id || 'storage-text-model'}-row-clip-rects-${batchInput.batchRowIndexBase}`,
        makeArrowFixedSizeListVector(
          new Uint32(),
          2,
          packedClipRects.byteLength > 0 ? packedClipRects : new Uint32Array(2)
        )
      )
    : undefined;
  const rowClipRectsBuffer = rowClipRectsVector
    ? getStorageTextGpuVectorBuffer(rowClipRectsVector)
    : defaultBuffers.clipRectsBuffer;
  const styleConfigData = createStorageTextStyleConfigData(
    props,
    batchInput.batchRowIndexBase,
    batchInput.rowStorageIndexBase,
    sdfRenderSettings
  );
  const styleConfigBuffer = new DynamicBuffer(device, {
    id: `${props.id || 'storage-text-model'}-style-config-${batchInput.batchRowIndexBase}`,
    usage: Buffer.UNIFORM | Buffer.COPY_DST | Buffer.COPY_SRC,
    data: styleConfigData
  });
  const ownedResources = [styleConfigBuffer, ...(rowClipRectsVector ? [rowClipRectsVector] : [])];

  return {
    rowPositionsBuffer: batchInput.positionsBuffer,
    rowStorageIndexBase: batchInput.rowStorageIndexBase,
    rowColorsBuffer: batchInput.colorsBuffer ?? defaultBuffers.colorsBuffer,
    rowAnglesBuffer: batchInput.anglesBuffer ?? defaultBuffers.anglesBuffer,
    rowSizesBuffer: batchInput.sizesBuffer ?? defaultBuffers.sizesBuffer,
    rowPixelOffsetsBuffer: batchInput.pixelOffsetsBuffer ?? defaultBuffers.pixelOffsetsBuffer,
    rowTextAnchorsBuffer: batchInput.textAnchorsBuffer ?? defaultBuffers.textAnchorsBuffer,
    rowAlignmentBaselinesBuffer:
      batchInput.alignmentBaselinesBuffer ?? defaultBuffers.alignmentBaselinesBuffer,
    rowClipRectsBuffer,
    styleConfigBuffer,
    ownedResources,
    ownedByteLength: styleConfigData.byteLength + (packedClipRects?.byteLength ?? 0)
  };
}

function createStorageTextOwnedGpuVector<T extends DataType>(
  device: Device,
  name: string,
  vector: Vector<T>
): GPUVector<T> {
  return makeArrowGPUVector(device, vector, {
    name,
    id: name,
    usage: Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC
  });
}

function getStorageTextGpuVectorBuffer(vector: GPUVector): Buffer {
  const buffer = vector.buffer;
  return buffer instanceof DynamicBuffer ? buffer.buffer : buffer;
}

function createDictionaryStorageBuffer(
  device: Device,
  props: ArrowDictionaryStorageTextInputProps,
  name: string,
  data: Uint32Array | Float32Array,
  emptyData: Uint32Array | Float32Array,
  usage: number = Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC
): Buffer {
  return device.createBuffer({
    id: `${props.id || 'arrow-dictionary-storage-text-model'}-${name}`,
    usage,
    data: data.byteLength > 0 ? data : emptyData
  });
}

function appendArrowStorageTextStateBatches(
  device: Device,
  props: ArrowStorageTextInputProps,
  storageState: ArrowStorageTextState
): void {
  const appendContext = arrowStorageTextAppendContexts.get(storageState);
  if (!appendContext) {
    throw new Error('ArrowStorageTextState cannot append text batches it does not own');
  }
  const textInputs = resolveArrowStorageTextInputs(props);
  assertStorageTextAppendCompatible(storageState, textInputs.batches);
  if (textInputs.batches.length === storageState.batches.length) {
    return;
  }

  for (
    let batchIndex = storageState.batches.length;
    batchIndex < textInputs.batches.length;
    batchIndex++
  ) {
    const batchInput = textInputs.batches[batchIndex];
    const rowState = createStorageTextBatchRowState(
      device,
      props,
      batchInput,
      appendContext.defaultBuffers,
      appendContext.mappingState.sdfRenderSettings
    );
    const rowBindingBatchIndex = storageState.batches.length;
    storageState.ownedRowBindingResources.push(...rowState.ownedResources);
    storageState.rowStorageByteLength += rowState.ownedByteLength;

    if (appendContext.useGpuUtf8Decode) {
      const glyphDefinitions = appendContext.utf8GlyphDefinitions;
      if (!glyphDefinitions) {
        throw new Error('ArrowStorageTextState is missing UTF-8 glyph definitions');
      }
      const utf8TextInput = buildGpuUtf8TextInput(batchInput.texts as Vector<Utf8>);
      const rowGlyphStarts = createStorageRowGlyphStartsBuffer(
        device,
        props,
        batchInput.batchRowIndexBase,
        utf8TextInput.startIndices
      );
      storageState.ownedGlyphResources.push(rowGlyphStarts.buffer);
      storageState.renderControlByteLength += rowGlyphStarts.byteLength;
      const glyphMetrics = createStorageGlyphMetrics(
        device,
        {id: props.id},
        glyphDefinitions.glyphMetrics
      );
      const glyphLookup = createStorageGlyphLookup(
        device,
        {id: props.id},
        glyphDefinitions.glyphLookup
      );
      const generatedBufferBatches = planGeneratedBufferBatches({
        device,
        recordOffsets: utf8TextInput.startIndices,
        recordByteStride: COMPACT_GLYPH_VERTEX_BYTE_STRIDE,
        maxBatchByteLength: device.limits.maxStorageBufferBindingSize,
        resourceLabel: 'ArrowStorageTextModel UTF-8 generated glyph vertex data'
      });
      for (const generatedBufferBatch of generatedBufferBatches) {
        const partitionedUtf8TextInput = createPartitionedGpuUtf8TextInput(
          utf8TextInput,
          generatedBufferBatch
        );
        const utf8Input = createGpuUtf8ExpandedInput(
          device,
          {id: props.id},
          {
            utf8TextInput: partitionedUtf8TextInput,
            baselineOffsetY: glyphDefinitions.baselineOffsetY,
            glyphLookupCount: glyphDefinitions.glyphLookup.length / 2,
            labelCount: generatedBufferBatch.rowEnd - generatedBufferBatch.rowStart,
            batchRowIndexBase: batchInput.batchRowIndexBase + generatedBufferBatch.rowStart,
            rowStorageIndexBase: batchInput.rowStorageIndexBase + generatedBufferBatch.rowStart,
            alignment: createGpuTextAlignmentOptions(
              props,
              rowState,
              appendContext.mappingState.lineHeight
            )
          }
        );
        const generated = createGpuExpandedGeneratedState(
          device,
          {id: props.id},
          partitionedUtf8TextInput.byteLength
        );
        dispatchGpuUtf8ExpandedTextCompute(
          device,
          {id: props.id},
          {
            utf8Input,
            glyphLookup,
            glyphMetrics,
            generated,
            outputSlotCount: partitionedUtf8TextInput.byteLength,
            labelCount: generatedBufferBatch.rowEnd - generatedBufferBatch.rowStart,
            alignment: {
              rowTextAnchorsBuffer: getComputeStorageBuffer(rowState.rowTextAnchorsBuffer),
              rowAlignmentBaselinesBuffer: getComputeStorageBuffer(
                rowState.rowAlignmentBaselinesBuffer
              )
            }
          }
        );
        const storageRenderConfigBuffer = createStorageRenderConfigBuffer(
          device,
          props,
          batchInput.batchRowIndexBase,
          generatedBufferBatch
        );
        storageState.renderBatches.push({
          rowBindingBatchIndex,
          rowStart: generatedBufferBatch.rowStart,
          rowEnd: generatedBufferBatch.rowEnd,
          glyphIndexBase: generatedBufferBatch.recordStart,
          glyphCount: partitionedUtf8TextInput.byteLength,
          compactGlyphVertexData: generated.compactGlyphVertexData,
          storageRenderConfigBuffer
        });
        storageState.ownedGlyphResources.push(storageRenderConfigBuffer);
        storageState.renderControlByteLength += storageRenderConfigBuffer.byteLength;
        storageState.generatedRenderBufferByteLength += generated.byteLength;
        storageState.transientComputeInputByteLength += utf8Input.byteLength;
        utf8Input.rowByteRangesBuffer.destroy();
        utf8Input.utf8BytesBuffer.destroy();
        utf8Input.expansionConfigBuffer.destroy();
      }
      storageState.batches.push({
        ...rowState,
        batchRowIndexBase: batchInput.batchRowIndexBase,
        rowCount: batchInput.texts.length,
        glyphCount: utf8TextInput.byteLength,
        rowGlyphStartsBuffer: rowGlyphStarts.buffer
      });
      storageState.glyphCount += utf8TextInput.byteLength;
      storageState.glyphAttributeBuildTimeMs += utf8TextInput.textInputBuildTimeMs;
      storageState.compactStreamBuildTimeMs = storageState.glyphAttributeBuildTimeMs;
      storageState.compactStreamByteLength += utf8TextInput.inputByteLength;
      storageState.transientComputeInputByteLength +=
        glyphLookup.byteLength + glyphMetrics.byteLength;
      glyphMetrics.buffer.destroy();
      glyphLookup.buffer.destroy();
    } else {
      const batchGlyphStream = buildGpuExpandedTextStream({
        texts: batchInput.texts,
        mapping: appendContext.mappingState.mapping,
        baselineOffset: appendContext.mappingState.baselineOffset,
        lineHeight: appendContext.mappingState.lineHeight,
        characterSet: appendContext.mappingState.characterSet
      });
      const rowGlyphStarts = createStorageRowGlyphStartsBuffer(
        device,
        props,
        batchInput.batchRowIndexBase,
        batchGlyphStream.startIndices
      );
      storageState.ownedGlyphResources.push(rowGlyphStarts.buffer);
      storageState.renderControlByteLength += rowGlyphStarts.byteLength;
      const glyphMetrics = createStorageGlyphMetrics(
        device,
        {id: props.id},
        batchGlyphStream.glyphMetrics
      );
      const generatedBufferBatches = planGeneratedBufferBatches({
        device,
        recordOffsets: batchGlyphStream.startIndices,
        recordByteStride: COMPACT_GLYPH_VERTEX_BYTE_STRIDE,
        maxBatchByteLength: device.limits.maxStorageBufferBindingSize,
        resourceLabel: 'ArrowStorageTextModel compact generated glyph vertex data'
      });
      for (const generatedBufferBatch of generatedBufferBatches) {
        const partitionedGlyphStream = createPartitionedGpuExpandedTextStream(
          batchGlyphStream,
          generatedBufferBatch
        );
        const compactInput = createGpuExpandedCompactInput(
          device,
          {id: props.id},
          partitionedGlyphStream,
          batchInput.batchRowIndexBase + generatedBufferBatch.rowStart,
          createGpuTextAlignmentOptions(props, rowState, appendContext.mappingState.lineHeight),
          batchInput.rowStorageIndexBase + generatedBufferBatch.rowStart
        );
        const generated = createGpuExpandedGeneratedState(
          device,
          {id: props.id},
          partitionedGlyphStream.glyphCount
        );
        dispatchGpuExpandedTextCompute(
          device,
          {id: props.id},
          {
            compactInput,
            glyphMetrics,
            generated,
            glyphCount: partitionedGlyphStream.glyphCount,
            labelCount: generatedBufferBatch.rowEnd - generatedBufferBatch.rowStart,
            alignment: {
              rowTextAnchorsBuffer: getComputeStorageBuffer(rowState.rowTextAnchorsBuffer),
              rowAlignmentBaselinesBuffer: getComputeStorageBuffer(
                rowState.rowAlignmentBaselinesBuffer
              )
            }
          }
        );
        const storageRenderConfigBuffer = createStorageRenderConfigBuffer(
          device,
          props,
          batchInput.batchRowIndexBase,
          generatedBufferBatch
        );
        storageState.renderBatches.push({
          rowBindingBatchIndex,
          rowStart: generatedBufferBatch.rowStart,
          rowEnd: generatedBufferBatch.rowEnd,
          glyphIndexBase: generatedBufferBatch.recordStart,
          glyphCount: partitionedGlyphStream.glyphCount,
          compactGlyphVertexData: generated.compactGlyphVertexData,
          storageRenderConfigBuffer
        });
        storageState.ownedGlyphResources.push(storageRenderConfigBuffer);
        storageState.renderControlByteLength += storageRenderConfigBuffer.byteLength;
        storageState.generatedRenderBufferByteLength += generated.byteLength;
        storageState.transientComputeInputByteLength += compactInput.byteLength;
        compactInput.glyphRangesBuffer.destroy();
        compactInput.glyphIdsBuffer.destroy();
        compactInput.expansionConfigBuffer.destroy();
      }
      storageState.batches.push({
        ...rowState,
        batchRowIndexBase: batchInput.batchRowIndexBase,
        rowCount: batchInput.texts.length,
        glyphCount: batchGlyphStream.glyphCount,
        rowGlyphStartsBuffer: rowGlyphStarts.buffer
      });
      storageState.glyphCount += batchGlyphStream.glyphCount;
      storageState.glyphAttributeBuildTimeMs += batchGlyphStream.glyphStreamBuildTimeMs;
      storageState.compactStreamBuildTimeMs = storageState.glyphAttributeBuildTimeMs;
      storageState.compactStreamByteLength += batchGlyphStream.compactStreamByteLength;
      storageState.transientComputeInputByteLength += glyphMetrics.byteLength;
      glyphMetrics.buffer.destroy();
    }
  }

  storageState.glyphAttributeByteLength =
    storageState.generatedRenderBufferByteLength + storageState.renderControlByteLength;
  syncArrowStorageTextStateFirstBatch(storageState);
}

function assertStorageTextAppendCompatible(
  storageState: ArrowStorageTextState,
  batches: ResolvedArrowStorageTextBatchInputs[]
): void {
  if (batches.length < storageState.batches.length) {
    throw new Error('ArrowStorageTextModel appended text batches cannot remove existing batches');
  }
  for (const [batchIndex, existingBatch] of storageState.batches.entries()) {
    const batchInput = batches[batchIndex];
    if (
      !batchInput ||
      batchInput.batchRowIndexBase !== existingBatch.batchRowIndexBase ||
      batchInput.rowStorageIndexBase !== existingBatch.rowStorageIndexBase ||
      batchInput.texts.length !== existingBatch.rowCount ||
      batchInput.positionsBuffer !== existingBatch.rowPositionsBuffer
    ) {
      throw new Error(
        'ArrowStorageTextModel appendTextBatches() requires existing row batches to stay unchanged'
      );
    }
  }
}

function refreshArrowStorageTextRowBindings(
  device: Device,
  props: ArrowStorageTextInputProps,
  storageState: ArrowStorageTextState
): void {
  const textInputs = resolveArrowStorageTextInputs(props);
  assertStorageTextRowBindingRefreshCompatible(storageState, textInputs.batches);

  const nextOwnedRowBindingResources: StorageTextOwnedResource[] = [];
  const defaultBuffers = createStorageTextDefaultBuffers(device, props);
  nextOwnedRowBindingResources.push(...defaultBuffers.ownedResources);

  let rowStorageByteLength = defaultBuffers.byteLength;
  let nextBatches: ArrowStorageTextBatchState[] = [];
  try {
    nextBatches = textInputs.batches.map((batchInput, batchIndex) => {
      const previousBatch = storageState.batches[batchIndex];
      const rowState = createStorageTextBatchRowState(
        device,
        props,
        batchInput,
        defaultBuffers,
        storageState.sdfRenderSettings
      );
      nextOwnedRowBindingResources.push(...rowState.ownedResources);
      rowStorageByteLength += rowState.ownedByteLength;
      return {
        ...rowState,
        batchRowIndexBase: previousBatch.batchRowIndexBase,
        rowStorageIndexBase: batchInput.rowStorageIndexBase,
        rowCount: previousBatch.rowCount,
        glyphCount: previousBatch.glyphCount,
        rowGlyphStartsBuffer: previousBatch.rowGlyphStartsBuffer
      };
    });
  } catch (error) {
    destroyStorageTextResources(nextOwnedRowBindingResources);
    throw error;
  }

  replaceOwnedStorageTextResources(
    storageState.ownedRowBindingResources,
    nextOwnedRowBindingResources
  );
  storageState.batches = nextBatches;
  storageState.rowStorageByteLength = rowStorageByteLength;
  const appendContext = arrowStorageTextAppendContexts.get(storageState);
  if (appendContext) {
    appendContext.defaultBuffers = defaultBuffers;
  }
  syncArrowStorageTextStateFirstBatch(storageState);
}

function assertStorageTextRowBindingRefreshCompatible(
  storageState: ArrowStorageTextState,
  batches: ResolvedArrowStorageTextBatchInputs[]
): void {
  if (batches.length !== storageState.batches.length) {
    throw new Error('ArrowStorageTextModel row-binding updates must preserve text batch count');
  }
  for (const [batchIndex, batchInput] of batches.entries()) {
    const existingBatch = storageState.batches[batchIndex];
    if (
      !existingBatch ||
      existingBatch.batchRowIndexBase !== batchInput.batchRowIndexBase ||
      existingBatch.rowCount !== batchInput.texts.length
    ) {
      throw new Error('ArrowStorageTextModel row-binding updates must preserve text batch rows');
    }
  }
}

function syncArrowStorageTextStateFirstBatch(storageState: ArrowStorageTextState): void {
  const firstBatch = getFirstArrowStorageTextBatch(storageState);
  const firstRenderBatch = getFirstArrowStorageTextRenderBatch(storageState);
  storageState.rowPositionsBuffer = firstBatch.rowPositionsBuffer;
  storageState.rowColorsBuffer = firstBatch.rowColorsBuffer;
  storageState.rowAnglesBuffer = firstBatch.rowAnglesBuffer;
  storageState.rowSizesBuffer = firstBatch.rowSizesBuffer;
  storageState.rowPixelOffsetsBuffer = firstBatch.rowPixelOffsetsBuffer;
  storageState.rowTextAnchorsBuffer = firstBatch.rowTextAnchorsBuffer;
  storageState.rowAlignmentBaselinesBuffer = firstBatch.rowAlignmentBaselinesBuffer;
  storageState.rowClipRectsBuffer = firstBatch.rowClipRectsBuffer;
  storageState.rowGlyphStartsBuffer = getStorageRowGlyphStartsBuffer(firstBatch);
  storageState.styleConfigBuffer = firstBatch.styleConfigBuffer;
  storageState.storageRenderConfigBuffer = firstRenderBatch.storageRenderConfigBuffer;
  storageState.compactGlyphVertexData = firstRenderBatch.compactGlyphVertexData;
}

function refreshArrowDictionaryStorageTextRowBindings(
  device: Device,
  props: ArrowDictionaryStorageTextInputProps,
  storageState: ArrowDictionaryStorageTextState
): void {
  const textInputs = resolveArrowDictionaryStorageTextInputs(props);
  assertDictionaryStorageTextRowBindingRefreshCompatible(storageState, textInputs.batches);

  const nextOwnedRowBindingResources: StorageTextOwnedResource[] = [];
  const defaultBuffers = createStorageTextDefaultBuffers(device, props);
  nextOwnedRowBindingResources.push(...defaultBuffers.ownedResources);

  let rowStorageByteLength = defaultBuffers.byteLength;
  let nextBatches: ArrowDictionaryStorageTextBatchState[] = [];
  try {
    nextBatches = textInputs.batches.map((batchInput, batchIndex) => {
      const previousBatch = storageState.batches[batchIndex];
      const rowState = createStorageTextBatchRowState(
        device,
        props,
        batchInput,
        defaultBuffers,
        storageState.sdfRenderSettings
      );
      nextOwnedRowBindingResources.push(...rowState.ownedResources);
      rowStorageByteLength += rowState.ownedByteLength;
      return {
        ...rowState,
        batchRowIndexBase: previousBatch.batchRowIndexBase,
        rowStorageIndexBase: batchInput.rowStorageIndexBase,
        rowCount: previousBatch.rowCount,
        glyphCount: previousBatch.glyphCount,
        rowDictionaryRecordsBuffer: previousBatch.rowDictionaryRecordsBuffer,
        dictionaryGlyphRangesBuffer: previousBatch.dictionaryGlyphRangesBuffer,
        dictionaryGlyphRecordsBuffer: previousBatch.dictionaryGlyphRecordsBuffer,
        glyphFramesBuffer: previousBatch.glyphFramesBuffer,
        dictionaryGlyphCount: previousBatch.dictionaryGlyphCount,
        dictionaryValueCount: previousBatch.dictionaryValueCount
      };
    });
  } catch (error) {
    destroyStorageTextResources(nextOwnedRowBindingResources);
    throw error;
  }

  replaceOwnedStorageTextResources(
    storageState.ownedRowBindingResources,
    nextOwnedRowBindingResources
  );
  storageState.batches = nextBatches;
  storageState.rowStorageByteLength = rowStorageByteLength;
  syncArrowDictionaryStorageTextStateFirstBatch(storageState);
}

function assertDictionaryStorageTextRowBindingRefreshCompatible(
  storageState: ArrowDictionaryStorageTextState,
  batches: ResolvedArrowStorageTextBatchInputs[]
): void {
  if (batches.length !== storageState.batches.length) {
    throw new Error(
      'ArrowDictionaryStorageTextModel row-binding updates must preserve text batch count'
    );
  }
  for (const [batchIndex, batchInput] of batches.entries()) {
    const existingBatch = storageState.batches[batchIndex];
    if (
      !existingBatch ||
      existingBatch.batchRowIndexBase !== batchInput.batchRowIndexBase ||
      existingBatch.rowStorageIndexBase !== batchInput.rowStorageIndexBase ||
      existingBatch.rowCount !== batchInput.texts.length
    ) {
      throw new Error(
        'ArrowDictionaryStorageTextModel row-binding updates must preserve text batch rows'
      );
    }
  }
}

function syncArrowDictionaryStorageTextStateFirstBatch(
  storageState: ArrowDictionaryStorageTextState
): void {
  const firstBatch = getFirstArrowDictionaryStorageTextBatch(storageState);
  const firstRenderBatch = getFirstArrowDictionaryStorageTextRenderBatch(storageState);
  storageState.rowPositionsBuffer = firstBatch.rowPositionsBuffer;
  storageState.rowColorsBuffer = firstBatch.rowColorsBuffer;
  storageState.rowAnglesBuffer = firstBatch.rowAnglesBuffer;
  storageState.rowSizesBuffer = firstBatch.rowSizesBuffer;
  storageState.rowPixelOffsetsBuffer = firstBatch.rowPixelOffsetsBuffer;
  storageState.rowTextAnchorsBuffer = firstBatch.rowTextAnchorsBuffer;
  storageState.rowAlignmentBaselinesBuffer = firstBatch.rowAlignmentBaselinesBuffer;
  storageState.rowClipRectsBuffer = firstBatch.rowClipRectsBuffer;
  storageState.rowDictionaryRecordsBuffer = firstBatch.rowDictionaryRecordsBuffer;
  storageState.dictionaryGlyphRangesBuffer = firstBatch.dictionaryGlyphRangesBuffer;
  storageState.dictionaryGlyphRecordsBuffer = firstBatch.dictionaryGlyphRecordsBuffer;
  storageState.dictionaryRenderConfigBuffer = firstRenderBatch.dictionaryRenderConfigBuffer;
  storageState.styleConfigBuffer = firstBatch.styleConfigBuffer;
  storageState.glyphFramesBuffer = firstBatch.glyphFramesBuffer;
}

function destroyStorageTextResources(resources: StorageTextOwnedResource[]): void {
  for (const resource of resources) {
    resource.destroy();
  }
}

function replaceOwnedStorageTextResources(
  currentResources: StorageTextOwnedResource[],
  nextResources: StorageTextOwnedResource[]
): void {
  destroyStorageTextResources(currentResources);
  currentResources.splice(0, currentResources.length, ...nextResources);
}

function createStorageTextStyleConfigData(
  props: AnyStorageTextInputProps,
  batchRowIndexBase: number,
  rowStorageIndexBase: number,
  sdfRenderSettings: TextSdfRenderSettings
): Uint32Array {
  const arrayBuffer = new ArrayBuffer(80);
  const floatValues = new Float32Array(arrayBuffer);
  const uintValues = new Uint32Array(arrayBuffer);
  const color = props.color ?? DEFAULT_STORAGE_TEXT_COLOR;
  floatValues[0] = color[0] / 255;
  floatValues[1] = color[1] / 255;
  floatValues[2] = color[2] / 255;
  floatValues[3] = color[3] / 255;
  floatValues[4] = props.angle ?? DEFAULT_STORAGE_TEXT_ANGLE;
  floatValues[5] = props.size ?? DEFAULT_STORAGE_TEXT_SIZE;
  floatValues[6] = (props.pixelOffset ?? DEFAULT_STORAGE_TEXT_PIXEL_OFFSET)[0];
  floatValues[7] = (props.pixelOffset ?? DEFAULT_STORAGE_TEXT_PIXEL_OFFSET)[1];
  uintValues[8] = props.colors ? 1 : 0;
  uintValues[9] = props.angles ? 1 : 0;
  uintValues[10] = props.sizes ? 1 : 0;
  uintValues[11] = props.pixelOffsets ? 1 : 0;
  uintValues[12] = props.clipRects ? 1 : 0;
  uintValues[13] = batchRowIndexBase;
  uintValues[14] = rowStorageIndexBase;
  uintValues[15] = 0;
  floatValues[16] = sdfRenderSettings.sdf ? sdfRenderSettings.threshold : BITMAP_TEXT_SDF_THRESHOLD;
  floatValues[17] = sdfRenderSettings.smoothing;
  return uintValues;
}

function createGpuTextAlignmentOptions(
  props: AnyStorageTextInputProps,
  rowState: StorageTextBatchRowState,
  lineHeight: number
) {
  return {
    rowTextAnchorsBuffer: getComputeStorageBuffer(rowState.rowTextAnchorsBuffer),
    rowAlignmentBaselinesBuffer: getComputeStorageBuffer(rowState.rowAlignmentBaselinesBuffer),
    useRowTextAnchors: Boolean(props.textAnchors),
    useRowAlignmentBaselines: Boolean(props.alignmentBaselines),
    textAnchor: getTextAnchorEnum(props.textAnchor),
    alignmentBaseline: getAlignmentBaselineEnum(props.alignmentBaseline),
    lineHeight
  };
}

function getComputeStorageBuffer(buffer: StorageTextBuffer): Buffer {
  return buffer instanceof DynamicBuffer ? buffer.buffer : buffer;
}

function createStorageGlyphFrames(
  device: Device,
  props: ArrowTextModelProps | AnyStorageTextInputProps,
  glyphFrameData: Float32Array
): StorageGlyphFrameState {
  return {
    buffer: device.createBuffer({
      id: `${props.id || 'arrow-storage-text-model'}-glyph-frames`,
      usage: Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
      data: glyphFrameData.byteLength > 0 ? glyphFrameData : new Float32Array(4)
    }),
    byteLength: glyphFrameData.byteLength
  };
}

function buildGpuUtf8GlyphDefinitions({
  mapping,
  baselineOffset,
  lineHeight,
  characterSet
}: {
  mapping: CharacterMapping;
  baselineOffset: number;
  lineHeight: number;
  characterSet: Set<string>;
}): {
  glyphFrames: Float32Array;
  glyphMetrics: Int32Array;
  glyphLookup: Uint32Array;
  baselineOffsetY: number;
} {
  const glyphFrameValues = [0, 0, 0, 0];
  const glyphMetricValues = [0, MISSING_CHAR_WIDTH];
  const glyphLookupValues: number[] = [];
  const handledCodePoints = new Set<number>();

  for (const characterEntry of characterSet) {
    for (const character of Array.from(characterEntry)) {
      const codePoint = character.codePointAt(0);
      if (codePoint === undefined || handledCodePoints.has(codePoint)) {
        continue;
      }
      handledCodePoints.add(codePoint);
      const frame = mapping[character];
      let glyphId = 0;
      if (frame) {
        glyphId = glyphFrameValues.length / 4;
        if (glyphId > MAX_UINT16) {
          throw new Error('GPU UTF-8 text glyph definitions exceed the uint16 glyph id range');
        }
        glyphFrameValues.push(frame.x, frame.y, frame.width, frame.height);
        glyphMetricValues.push(frame.anchorX, frame.advance);
      }
      glyphLookupValues.push(codePoint, glyphId);
    }
  }

  return {
    glyphFrames: new Float32Array(glyphFrameValues),
    glyphMetrics: new Int32Array(glyphMetricValues),
    glyphLookup: new Uint32Array(glyphLookupValues),
    baselineOffsetY: toSignedInt16(baselineOffset + lineHeight / 2)
  };
}

/** Pack signed `[x, y, width, height]` Int16 clip rows into two uint32 words per row. */
export function packStorageTextClipRects(clipRects: Vector<FixedSizeList<Int16>>): Uint32Array {
  assertClipRects(clipRects, clipRects.length);
  const clipRectValues = getArrowVectorBufferSource(clipRects) as Int16Array;
  const packedClipRects = new Uint32Array(clipRects.length * 2);
  for (let rowIndex = 0; rowIndex < clipRects.length; rowIndex++) {
    const valueIndex = rowIndex * 4;
    packedClipRects[rowIndex * 2] = packSignedInt16Pair(
      clipRectValues[valueIndex],
      clipRectValues[valueIndex + 1]
    );
    packedClipRects[rowIndex * 2 + 1] = packSignedInt16Pair(
      clipRectValues[valueIndex + 2],
      clipRectValues[valueIndex + 3]
    );
  }
  return packedClipRects;
}

function packSignedInt16Pair(lowerValue: number, upperValue: number): number {
  return ((upperValue & 0xffff) << 16) | (lowerValue & 0xffff);
}

function getTextAnchorEnum(textAnchor: AnyStorageTextInputProps['textAnchor']): number {
  switch (textAnchor) {
    case 'middle':
      return 1;
    case 'end':
      return 2;
    case 'start':
    default:
      return DEFAULT_STORAGE_TEXT_ANCHOR;
  }
}

function getAlignmentBaselineEnum(
  alignmentBaseline: AnyStorageTextInputProps['alignmentBaseline']
): number {
  switch (alignmentBaseline) {
    case 'top':
      return 1;
    case 'bottom':
      return 2;
    case 'center':
    default:
      return DEFAULT_STORAGE_ALIGNMENT_BASELINE;
  }
}

function getFirstArrowStorageTextBatch(
  storageState: Pick<ArrowStorageTextState, 'batches'>
): ArrowStorageTextBatchState {
  const firstBatch = storageState.batches[0];
  if (!firstBatch) {
    throw new Error('ArrowStorageTextState requires at least one row-binding batch');
  }
  return firstBatch;
}

function getFirstArrowStorageTextRenderBatch(
  storageState: Pick<ArrowStorageTextState, 'renderBatches'>
): ArrowStorageTextRenderBatchState {
  const firstRenderBatch = storageState.renderBatches[0];
  if (!firstRenderBatch) {
    throw new Error('ArrowStorageTextState requires at least one render batch');
  }
  return firstRenderBatch;
}

function getStorageRowGlyphStartsBuffer(batch: ArrowStorageTextBatchState): Buffer {
  if (!batch.rowGlyphStartsBuffer) {
    throw new Error('ArrowStorageTextState batch is missing row glyph starts');
  }
  return batch.rowGlyphStartsBuffer;
}

function getFirstArrowDictionaryStorageTextBatch(
  storageState: Pick<ArrowDictionaryStorageTextState, 'batches'>
): ArrowDictionaryStorageTextBatchState {
  const firstBatch = storageState.batches[0];
  if (!firstBatch) {
    throw new Error('ArrowDictionaryStorageTextState requires at least one row-binding batch');
  }
  return firstBatch;
}

function getFirstArrowDictionaryStorageTextRenderBatch(
  storageState: Pick<ArrowDictionaryStorageTextState, 'renderBatches'>
): ArrowDictionaryStorageTextRenderBatchState {
  const firstRenderBatch = storageState.renderBatches[0];
  if (!firstRenderBatch) {
    throw new Error('ArrowDictionaryStorageTextState requires at least one render batch');
  }
  return firstRenderBatch;
}

function destroyArrowTextRenderBatches(renderBatches: ArrowTextRenderBatchState[]): void {
  for (const renderBatch of renderBatches) {
    renderBatch.expandedGlyphVertexData.destroy();
  }
}

function createPartitionedGpuExpandedTextStream(
  glyphStream: GpuExpandedTextStream,
  generatedBufferBatch: GeneratedBufferBatch
): GpuExpandedTextStream {
  const rowCount = generatedBufferBatch.rowEnd - generatedBufferBatch.rowStart;
  const startIndices = new Array<number>(rowCount + 1);
  const labelGlyphRanges = new Uint32Array(rowCount * 2);
  startIndices[0] = 0;

  for (let localRowIndex = 0; localRowIndex < rowCount; localRowIndex++) {
    const sourceRowIndex = generatedBufferBatch.rowStart + localRowIndex;
    const sourceGlyphStart =
      glyphStream.startIndices[sourceRowIndex] ?? generatedBufferBatch.recordStart;
    const sourceGlyphEnd =
      glyphStream.startIndices[sourceRowIndex + 1] ?? generatedBufferBatch.recordStart;
    const localGlyphStart = sourceGlyphStart - generatedBufferBatch.recordStart;
    const localGlyphEnd = sourceGlyphEnd - generatedBufferBatch.recordStart;
    labelGlyphRanges[localRowIndex * 2] = localGlyphStart;
    labelGlyphRanges[localRowIndex * 2 + 1] = localGlyphEnd;
    startIndices[localRowIndex + 1] = localGlyphEnd;
  }

  const packedGlyphIds = copyPackedUint16Range(
    glyphStream.packedGlyphIds,
    generatedBufferBatch.recordStart,
    generatedBufferBatch.recordEnd
  );
  return {
    ...glyphStream,
    startIndices,
    glyphCount: generatedBufferBatch.recordCount,
    labelGlyphRanges,
    packedGlyphIds,
    compactStreamByteLength: labelGlyphRanges.byteLength + packedGlyphIds.byteLength,
    glyphStreamBuildTimeMs: 0
  };
}

function createPartitionedGpuUtf8TextInput(
  utf8TextInput: GpuUtf8TextInput,
  generatedBufferBatch: GeneratedBufferBatch
): GpuUtf8TextInput {
  const rowCount = generatedBufferBatch.rowEnd - generatedBufferBatch.rowStart;
  const rowByteRanges = new Uint32Array(rowCount * 2);
  const startIndices = new Array<number>(rowCount + 1);
  startIndices[0] = 0;

  for (let localRowIndex = 0; localRowIndex < rowCount; localRowIndex++) {
    const sourceRowIndex = generatedBufferBatch.rowStart + localRowIndex;
    const sourceByteStart = utf8TextInput.rowByteRanges[sourceRowIndex * 2] ?? 0;
    const sourceByteEnd = utf8TextInput.rowByteRanges[sourceRowIndex * 2 + 1] ?? sourceByteStart;
    const hasPartitionLocalBytes =
      sourceByteEnd > sourceByteStart &&
      sourceByteStart >= generatedBufferBatch.recordStart &&
      sourceByteEnd <= generatedBufferBatch.recordEnd;
    const localByteStart = hasPartitionLocalBytes
      ? sourceByteStart - generatedBufferBatch.recordStart
      : 0;
    const localByteEnd = hasPartitionLocalBytes
      ? sourceByteEnd - generatedBufferBatch.recordStart
      : localByteStart;
    rowByteRanges[localRowIndex * 2] = localByteStart;
    rowByteRanges[localRowIndex * 2 + 1] = localByteEnd;
    startIndices[localRowIndex + 1] = Math.max(startIndices[localRowIndex] ?? 0, localByteEnd);
  }

  const packedUtf8Bytes = copyPackedByteRange(
    utf8TextInput.packedUtf8Bytes,
    generatedBufferBatch.recordStart,
    generatedBufferBatch.recordEnd
  );
  return {
    startIndices,
    rowByteRanges,
    packedUtf8Bytes,
    byteLength: generatedBufferBatch.recordCount,
    inputByteLength: rowByteRanges.byteLength + packedUtf8Bytes.byteLength,
    textInputBuildTimeMs: 0
  };
}

function copyPackedUint16Range(
  source: Uint32Array,
  startIndex: number,
  endIndex: number
): Uint32Array {
  const valueCount = Math.max(0, endIndex - startIndex);
  const target = new Uint32Array(Math.ceil(valueCount / 2));
  for (let localIndex = 0; localIndex < valueCount; localIndex++) {
    const value = readPackedUint16(source, startIndex + localIndex);
    writePackedUint16(target, localIndex, value);
  }
  return target;
}

function readPackedUint16(source: Uint32Array, index: number): number {
  const word = source[index >> 1] ?? 0;
  return index & 1 ? word >>> 16 : word & 0xffff;
}

function writePackedUint16(target: Uint32Array, index: number, value: number): void {
  const wordIndex = index >> 1;
  const word = target[wordIndex] ?? 0;
  target[wordIndex] = index & 1 ? word | ((value & 0xffff) << 16) : word | (value & 0xffff);
}

function copyPackedByteRange(
  source: Uint32Array,
  startByteIndex: number,
  endByteIndex: number
): Uint32Array {
  const byteLength = Math.max(0, endByteIndex - startByteIndex);
  const target = new Uint32Array(Math.ceil(byteLength / Uint32Array.BYTES_PER_ELEMENT));
  const sourceBytes = new Uint8Array(source.buffer, source.byteOffset, source.byteLength);
  new Uint8Array(target.buffer).set(sourceBytes.subarray(startByteIndex, endByteIndex));
  return target;
}

function toSignedInt16(value: number): number {
  const integerValue = Math.round(value);
  if (integerValue < -32768 || integerValue > 32767) {
    throw new Error(`Arrow text glyph offset ${value} is outside the signed 16-bit range`);
  }
  return integerValue;
}

function makeFixedSizeListField(name: string, childType: Int16 | Uint16, listSize: 2 | 4): Field {
  return new Field(name, new FixedSizeList(listSize, new Field('value', childType, false)), false);
}

function isInstanceCompatibleArrowType(type: DataType): boolean {
  return (
    isNumericArrowType(type) ||
    (DataType.isFixedSizeList(type) && isNumericArrowType(type.children[0].type))
  );
}

function isArrowTextRowColorType(type: DataType | undefined): type is ArrowTextRowColorType {
  return (
    Boolean(type) &&
    DataType.isFixedSizeList(type) &&
    type.listSize === 4 &&
    type.children[0]?.type instanceof Uint8
  );
}

function isArrowTextCharacterColorType(
  type: DataType | undefined
): type is ArrowTextCharacterColorType {
  return Boolean(type) && DataType.isList(type) && isArrowTextRowColorType(type.children[0]?.type);
}

function isArrowTextColorType(type: DataType | undefined): type is ArrowTextColorType {
  return isArrowTextRowColorType(type) || isArrowTextCharacterColorType(type);
}

function expandArrowTextCharacterColorRows(
  vector: Vector<ArrowTextCharacterColorType>,
  startIndices: number[]
): Vector<ArrowTextRowColorType> {
  const glyphCount = startIndices[startIndices.length - 1] ?? 0;
  const expandedValues = new Uint8Array(glyphCount * 4);
  let rowIndexBase = 0;

  for (const data of vector.data) {
    const valueOffsets = data.valueOffsets as Int32Array | undefined;
    const elementData = data.children[0] as Data<ArrowTextRowColorType> | undefined;
    const valueData = elementData?.children[0] as Data<Uint8> | undefined;
    const values = valueData?.values as Uint8Array | undefined;
    if (!valueOffsets || !elementData || !valueData || !values) {
      throw new Error('ArrowTextModel character colors require Arrow list offsets and values');
    }

    const firstElementOffset = valueOffsets[0] ?? 0;
    const valueOffset = valueData.offset ?? 0;
    for (let localRowIndex = 0; localRowIndex < data.length; localRowIndex++) {
      const rowIndex = rowIndexBase + localRowIndex;
      const glyphStart = startIndices[rowIndex] ?? 0;
      const glyphEnd = startIndices[rowIndex + 1] ?? glyphStart;
      const glyphRowLength = glyphEnd - glyphStart;
      const colorStart = (valueOffsets[localRowIndex] ?? firstElementOffset) - firstElementOffset;
      const colorEnd = (valueOffsets[localRowIndex + 1] ?? colorStart) - firstElementOffset;

      if (colorEnd - colorStart !== glyphRowLength) {
        throw new Error(
          'ArrowTextModel character colors must provide one color per UTF-8 code point'
        );
      }

      expandedValues.set(
        values.subarray(valueOffset + colorStart * 4, valueOffset + colorEnd * 4),
        glyphStart * 4
      );
    }
    rowIndexBase += data.length;
  }

  return makeArrowFixedSizeListVector(new Uint8(), 4, expandedValues);
}

function repeatArrowVectorRows(vector: Vector, startIndices: number[]): Vector {
  const glyphCount = startIndices[startIndices.length - 1] ?? 0;
  if (DataType.isFixedSizeList(vector.type)) {
    const childType = vector.type.children[0].type as NumericArrowType;
    const listSize = vector.type.listSize as 1 | 2 | 3 | 4;
    const sourceValues = getArrowVectorBufferSource(vector) as NumericArray;
    const repeatedValues = createTypedArrayLike(sourceValues, glyphCount * listSize);
    for (let rowIndex = 0; rowIndex < startIndices.length - 1; rowIndex++) {
      const sourceOffset = rowIndex * listSize;
      const glyphStart = startIndices[rowIndex];
      const glyphEnd = startIndices[rowIndex + 1];
      for (let glyphIndex = glyphStart; glyphIndex < glyphEnd; glyphIndex++) {
        const targetOffset = glyphIndex * listSize;
        for (let component = 0; component < listSize; component++) {
          repeatedValues[targetOffset + component] = sourceValues[sourceOffset + component];
        }
      }
    }
    return makeArrowFixedSizeListVector(childType as any, listSize, repeatedValues as any);
  }

  const type = vector.type as NumericArrowType;
  const sourceValues = getArrowVectorBufferSource(vector) as NumericArray;
  const repeatedValues = createTypedArrayLike(sourceValues, glyphCount);
  for (let rowIndex = 0; rowIndex < startIndices.length - 1; rowIndex++) {
    const glyphStart = startIndices[rowIndex];
    const glyphEnd = startIndices[rowIndex + 1];
    const sourceValue = sourceValues[rowIndex];
    for (let glyphIndex = glyphStart; glyphIndex < glyphEnd; glyphIndex++) {
      repeatedValues[glyphIndex] = sourceValue;
    }
  }
  const makeNumericData = makeData as <TypeT extends NumericArrowType>(props: {
    type: TypeT;
    length: number;
    data: TypeT['TArray'];
  }) => Data<TypeT>;
  return makeVector(
    makeNumericData({
      type,
      length: glyphCount,
      data: repeatedValues as typeof type.TArray
    })
  );
}

function makeNumericArrowVector<TypeT extends NumericArrowType>(
  type: TypeT,
  data: TypeT['TArray']
): Vector<TypeT> {
  const makeNumericData = makeData as <NumericTypeT extends NumericArrowType>(props: {
    type: NumericTypeT;
    length: number;
    data: NumericTypeT['TArray'];
  }) => Data<NumericTypeT>;
  return makeVector(
    makeNumericData({
      type,
      length: data.length,
      data
    })
  );
}

function appendArrowGlyphLayout(
  glyphLayout: ArrowGlyphLayout,
  appendedGlyphLayout: ArrowGlyphLayout
): ArrowGlyphLayout {
  const nextStartIndices = [
    ...glyphLayout.startIndices,
    ...appendedGlyphLayout.startIndices
      .slice(1)
      .map(startIndex => startIndex + glyphLayout.glyphCount)
  ];
  const glyphOffsets = new Int16Array(
    glyphLayout.glyphOffsets.length + appendedGlyphLayout.glyphOffsets.length
  );
  glyphOffsets.set(glyphLayout.glyphOffsets);
  glyphOffsets.set(appendedGlyphLayout.glyphOffsets, glyphLayout.glyphOffsets.length);
  const glyphFrames = new Uint16Array(
    glyphLayout.glyphFrames.length + appendedGlyphLayout.glyphFrames.length
  );
  glyphFrames.set(glyphLayout.glyphFrames);
  glyphFrames.set(appendedGlyphLayout.glyphFrames, glyphLayout.glyphFrames.length);
  return {
    startIndices: nextStartIndices,
    glyphCount: glyphLayout.glyphCount + appendedGlyphLayout.glyphCount,
    glyphOffsets,
    glyphFrames,
    characterSet: glyphLayout.characterSet
  };
}

function makeGlyphRowIndices(startIndices: number[], rowIndexBase: number = 0): Uint32Array {
  const glyphCount = startIndices[startIndices.length - 1] ?? 0;
  const rowIndices = new Uint32Array(glyphCount);
  for (let rowIndex = 0; rowIndex < startIndices.length - 1; rowIndex++) {
    rowIndices.fill(rowIndexBase + rowIndex, startIndices[rowIndex], startIndices[rowIndex + 1]);
  }
  return rowIndices;
}

type NumericArray =
  | Float32Array
  | Int8Array
  | Int16Array
  | Int32Array
  | Uint8Array
  | Uint16Array
  | Uint32Array;

function createTypedArrayLike(values: NumericArray, length: number): NumericArray {
  const ArrayType = values.constructor as new (length: number) => NumericArray;
  return new ArrayType(length);
}

function getGeneratedAttributeByteLength(columns: Record<string, Vector>): number {
  let attributeByteLength = 0;
  for (const vector of Object.values(columns)) {
    if (isInstanceCompatibleArrowType(vector.type)) {
      attributeByteLength += (getArrowVectorBufferSource(vector) as NumericArray).byteLength;
    }
  }
  return attributeByteLength;
}
