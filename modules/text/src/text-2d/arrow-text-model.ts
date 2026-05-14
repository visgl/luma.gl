// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer, type Device, type ShaderLayout} from '@luma.gl/core';
import {
  ArrowModel,
  getArrowVectorBufferSource,
  isNumericArrowType,
  makeArrowFixedSizeListVector,
  type ArrowModelProps,
  type NumericArrowType
} from '@luma.gl/arrow';
import {Computation, DynamicTexture, Model} from '@luma.gl/engine';
import * as arrow from 'apache-arrow';
import FontAtlasManager, {
  DEFAULT_FONT_SETTINGS,
  type FontAtlas,
  type FontSettings
} from './font-atlas-manager';
import {
  buildArrowGlyphLayout,
  buildIndirectArrowGlyphLayout,
  buildGpuExpandedTextStream,
  buildGpuUtf8TextInput,
  buildArrowUtf8Chunks,
  decodeArrowUtf8CodePoints,
  populateUtf8TextIndices,
  type ArrowGlyphLayout,
  type GpuExpandedTextStream,
  type GpuUtf8TextInput,
  type IndirectArrowGlyphLayout,
  type Utf8TextIndexTarget
} from './arrow-text';
import type {CharacterMapping} from './text-utils';

const GLYPH_OFFSETS_COLUMN = 'glyphOffsets';
const GLYPH_FRAMES_COLUMN = 'glyphFrames';
const GLYPH_INDICES_COLUMN = 'glyphIndices';
const GLYPH_CLIP_RECTS_COLUMN = 'glyphClipRects';
const ROW_INDICES_COLUMN = 'rowIndices';
const MISSING_CHAR_WIDTH = 32;
const MAX_UINT16 = 65535;

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

const DEFAULT_STORAGE_TEXT_SHADER_LAYOUT: ShaderLayout = {
  attributes: [
    {name: GLYPH_OFFSETS_COLUMN, location: 0, type: 'vec2<i32>', stepMode: 'instance'},
    {name: GLYPH_FRAMES_COLUMN, location: 1, type: 'vec4<u32>', stepMode: 'instance'},
    {name: ROW_INDICES_COLUMN, location: 2, type: 'u32', stepMode: 'instance'}
  ],
  bindings: []
};

const DEFAULT_STORAGE_INDEXED_TEXT_SHADER_LAYOUT: ShaderLayout = {
  attributes: [
    {name: GLYPH_OFFSETS_COLUMN, location: 0, type: 'vec2<i32>', stepMode: 'instance'},
    {name: GLYPH_INDICES_COLUMN, location: 1, type: 'vec2<u32>', stepMode: 'instance'},
    {name: ROW_INDICES_COLUMN, location: 2, type: 'u32', stepMode: 'instance'}
  ],
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
in vec2 vTextureCoordinate;
out vec4 fragColor;

void main() {
  float alpha = texture(fontAtlasTexture, vTextureCoordinate).a;
  fragColor = vec4(1.0, 1.0, 1.0, alpha);
}
`;

const DEFAULT_STORAGE_TEXT_SOURCE = /* wgsl */ `
@group(0) @binding(auto) var fontAtlasTexture : texture_2d<f32>;
@group(0) @binding(auto) var fontAtlasTextureSampler : sampler;
@group(0) @binding(auto) var<storage, read> textRowPositions : array<vec2<f32>>;

struct VertexInputs {
  @builtin(vertex_index) vertexIndex : u32,
  @location(0) glyphOffsets : vec2<i32>,
  @location(1) glyphFrames : vec4<u32>,
  @location(2) rowIndices : u32,
};

struct FragmentInputs {
  @builtin(position) position : vec4<f32>,
  @location(0) atlasUV : vec2<f32>,
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

@vertex
fn vertexMain(inputs: VertexInputs) -> FragmentInputs {
  let corner = getGlyphCorner(inputs.vertexIndex);
  let glyphFrame = vec4<f32>(inputs.glyphFrames);
  let glyphOffset = vec2<f32>(inputs.glyphOffsets);
  let glyphSize = glyphFrame.zw;
  let glyphPosition = textRowPositions[inputs.rowIndices] + (glyphOffset + corner * glyphSize) * 0.001;
  var outputs : FragmentInputs;
  outputs.position = vec4<f32>(glyphPosition, 0.0, 1.0);
  outputs.atlasUV = (glyphFrame.xy + corner * glyphSize) / vec2<f32>(textureDimensions(fontAtlasTexture));
  return outputs;
}

@fragment
fn fragmentMain(inputs: FragmentInputs) -> @location(0) vec4<f32> {
  let alpha = textureSample(fontAtlasTexture, fontAtlasTextureSampler, inputs.atlasUV).a;
  return vec4<f32>(1.0, 1.0, 1.0, alpha);
}
`;

const DEFAULT_CLIPPED_STORAGE_TEXT_SOURCE = /* wgsl */ `
@group(0) @binding(auto) var fontAtlasTexture : texture_2d<f32>;
@group(0) @binding(auto) var fontAtlasTextureSampler : sampler;
@group(0) @binding(auto) var<storage, read> textRowPositions : array<vec2<f32>>;
@group(0) @binding(auto) var<storage, read> textRowClipRects : array<vec2<u32>>;

struct VertexInputs {
  @builtin(vertex_index) vertexIndex : u32,
  @location(0) glyphOffsets : vec2<i32>,
  @location(1) glyphFrames : vec4<u32>,
  @location(2) rowIndices : u32,
};

struct FragmentInputs {
  @builtin(position) position : vec4<f32>,
  @location(0) atlasUV : vec2<f32>,
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

@vertex
fn vertexMain(inputs: VertexInputs) -> FragmentInputs {
  let corner = getGlyphCorner(inputs.vertexIndex);
  let glyphFrame = vec4<f32>(inputs.glyphFrames);
  let glyphOffset = vec2<f32>(inputs.glyphOffsets);
  let glyphSize = glyphFrame.zw;
  let glyphVertexOffset = glyphOffset + corner * glyphSize;
  let glyphPosition = textRowPositions[inputs.rowIndices] + glyphVertexOffset * 0.001;
  let clipRect = unpackClipRect(textRowClipRects[inputs.rowIndices]);
  var outputs : FragmentInputs;
  outputs.position = select(
    vec4<f32>(glyphPosition, 0.0, 1.0),
    vec4<f32>(0.0),
    isGlyphVertexClipped(glyphVertexOffset, clipRect)
  );
  outputs.atlasUV = (glyphFrame.xy + corner * glyphSize) / vec2<f32>(textureDimensions(fontAtlasTexture));
  return outputs;
}

@fragment
fn fragmentMain(inputs: FragmentInputs) -> @location(0) vec4<f32> {
  let alpha = textureSample(fontAtlasTexture, fontAtlasTextureSampler, inputs.atlasUV).a;
  return vec4<f32>(1.0, 1.0, 1.0, alpha);
}
`;

const DEFAULT_STORAGE_INDEXED_TEXT_SOURCE = /* wgsl */ `
@group(0) @binding(auto) var fontAtlasTexture : texture_2d<f32>;
@group(0) @binding(auto) var fontAtlasTextureSampler : sampler;
@group(0) @binding(auto) var<storage, read> textRowPositions : array<vec2<f32>>;
@group(0) @binding(auto) var<storage, read> textGlyphFrames : array<vec4<f32>>;

struct VertexInputs {
  @builtin(vertex_index) vertexIndex : u32,
  @location(0) glyphOffsets : vec2<i32>,
  @location(1) glyphIndices : vec2<u32>,
  @location(2) rowIndices : u32,
};

struct FragmentInputs {
  @builtin(position) position : vec4<f32>,
  @location(0) atlasUV : vec2<f32>,
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

@vertex
fn vertexMain(inputs: VertexInputs) -> FragmentInputs {
  let corner = getGlyphCorner(inputs.vertexIndex);
  let glyphFrame = textGlyphFrames[inputs.glyphIndices.x];
  let glyphOffset = vec2<f32>(inputs.glyphOffsets);
  let glyphSize = glyphFrame.zw;
  let glyphPosition = textRowPositions[inputs.rowIndices] + (glyphOffset + corner * glyphSize) * 0.001;
  var outputs : FragmentInputs;
  outputs.position = vec4<f32>(glyphPosition, 0.0, 1.0);
  outputs.atlasUV = (glyphFrame.xy + corner * glyphSize) / vec2<f32>(textureDimensions(fontAtlasTexture));
  return outputs;
}

@fragment
fn fragmentMain(inputs: FragmentInputs) -> @location(0) vec4<f32> {
  let alpha = textureSample(fontAtlasTexture, fontAtlasTextureSampler, inputs.atlasUV).a;
  return vec4<f32>(1.0, 1.0, 1.0, alpha);
}
`;

const DEFAULT_CLIPPED_STORAGE_INDEXED_TEXT_SOURCE = /* wgsl */ `
@group(0) @binding(auto) var fontAtlasTexture : texture_2d<f32>;
@group(0) @binding(auto) var fontAtlasTextureSampler : sampler;
@group(0) @binding(auto) var<storage, read> textRowPositions : array<vec2<f32>>;
@group(0) @binding(auto) var<storage, read> textRowClipRects : array<vec2<u32>>;
@group(0) @binding(auto) var<storage, read> textGlyphFrames : array<vec4<f32>>;

struct VertexInputs {
  @builtin(vertex_index) vertexIndex : u32,
  @location(0) glyphOffsets : vec2<i32>,
  @location(1) glyphIndices : vec2<u32>,
  @location(2) rowIndices : u32,
};

struct FragmentInputs {
  @builtin(position) position : vec4<f32>,
  @location(0) atlasUV : vec2<f32>,
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

@vertex
fn vertexMain(inputs: VertexInputs) -> FragmentInputs {
  let corner = getGlyphCorner(inputs.vertexIndex);
  let glyphFrame = textGlyphFrames[inputs.glyphIndices.x];
  let glyphOffset = vec2<f32>(inputs.glyphOffsets);
  let glyphSize = glyphFrame.zw;
  let glyphVertexOffset = glyphOffset + corner * glyphSize;
  let glyphPosition = textRowPositions[inputs.rowIndices] + glyphVertexOffset * 0.001;
  let clipRect = unpackClipRect(textRowClipRects[inputs.rowIndices]);
  var outputs : FragmentInputs;
  outputs.position = select(
    vec4<f32>(glyphPosition, 0.0, 1.0),
    vec4<f32>(0.0),
    isGlyphVertexClipped(glyphVertexOffset, clipRect)
  );
  outputs.atlasUV = (glyphFrame.xy + corner * glyphSize) / vec2<f32>(textureDimensions(fontAtlasTexture));
  return outputs;
}

@fragment
fn fragmentMain(inputs: FragmentInputs) -> @location(0) vec4<f32> {
  let alpha = textureSample(fontAtlasTexture, fontAtlasTextureSampler, inputs.atlasUV).a;
  return vec4<f32>(1.0, 1.0, 1.0, alpha);
}
`;

const GPU_EXPANDED_TEXT_COMPUTE_SOURCE = /* wgsl */ `
@group(0) @binding(0) var<storage, read> textGlyphRanges : array<vec2<u32>>;
@group(0) @binding(1) var<storage, read> textGlyphIds : array<u32>;
@group(0) @binding(2) var<storage, read> textGlyphMetrics : array<vec2<i32>>;
@group(0) @binding(3) var<storage, read> textExpansionConfig : array<i32>;
@group(0) @binding(4) var<storage, read_write> generatedGlyphOffsets : array<u32>;
@group(0) @binding(5) var<storage, read_write> generatedGlyphIndices : array<u32>;
@group(0) @binding(6) var<storage, read_write> generatedRowIndices : array<u32>;

fn unpackGlyphId(glyphIndex: u32) -> u32 {
  let word = textGlyphIds[glyphIndex >> 1u];
  return select(word & 0xffffu, word >> 16u, (glyphIndex & 1u) == 1u);
}

fn packSignedInt16Pair(lowerValue: i32, upperValue: i32) -> u32 {
  return (u32(lowerValue) & 0xffffu) | ((u32(upperValue) & 0xffffu) << 16u);
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
    generatedGlyphOffsets[glyphIndex] = packSignedInt16Pair(width + metrics.x, baselineOffsetY);
    generatedGlyphIndices[glyphIndex] = glyphId & 0xffffu;
    generatedRowIndices[glyphIndex] = rowIndex;
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
    {name: 'generatedGlyphOffsets', type: 'storage', group: 0, location: 4},
    {name: 'generatedGlyphIndices', type: 'storage', group: 0, location: 5},
    {name: 'generatedRowIndices', type: 'storage', group: 0, location: 6}
  ],
  attributes: []
};

const GPU_UTF8_EXPANDED_TEXT_COMPUTE_SOURCE = /* wgsl */ `
@group(0) @binding(0) var<storage, read> textRowByteRanges : array<vec2<u32>>;
@group(0) @binding(1) var<storage, read> textUtf8Bytes : array<u32>;
@group(0) @binding(2) var<storage, read> textGlyphLookup : array<vec2<u32>>;
@group(0) @binding(3) var<storage, read> textGlyphMetrics : array<vec2<i32>>;
@group(0) @binding(4) var<storage, read> textExpansionConfig : array<i32>;
@group(0) @binding(5) var<storage, read_write> generatedGlyphOffsets : array<u32>;
@group(0) @binding(6) var<storage, read_write> generatedGlyphIndices : array<u32>;
@group(0) @binding(7) var<storage, read_write> generatedRowIndices : array<u32>;

fn readUtf8Byte(byteIndex: u32) -> u32 {
  let word = textUtf8Bytes[byteIndex >> 2u];
  let byteShift = (byteIndex & 3u) << 3u;
  return (word >> byteShift) & 0xffu;
}

fn findGlyphId(codePoint: u32) -> u32 {
  let glyphLookupCount = u32(max(textExpansionConfig[2], 0));
  var lookupIndex = 0u;
  loop {
    if (lookupIndex >= glyphLookupCount) {
      break;
    }
    let glyphLookup = textGlyphLookup[lookupIndex];
    if (glyphLookup.x == codePoint) {
      return glyphLookup.y;
    }
    lookupIndex += 1u;
  }
  return 0u;
}

fn decodeCodePoint(byteIndex: u32) -> u32 {
  let firstByte = readUtf8Byte(byteIndex);
  if ((firstByte & 0x80u) == 0u) {
    return firstByte;
  }
  if ((firstByte & 0xe0u) == 0xc0u) {
    return ((firstByte & 0x1fu) << 6u) | (readUtf8Byte(byteIndex + 1u) & 0x3fu);
  }
  if ((firstByte & 0xf0u) == 0xe0u) {
    return
      ((firstByte & 0x0fu) << 12u) |
      ((readUtf8Byte(byteIndex + 1u) & 0x3fu) << 6u) |
      (readUtf8Byte(byteIndex + 2u) & 0x3fu);
  }
  if ((firstByte & 0xf8u) == 0xf0u) {
    return
      ((firstByte & 0x07u) << 18u) |
      ((readUtf8Byte(byteIndex + 1u) & 0x3fu) << 12u) |
      ((readUtf8Byte(byteIndex + 2u) & 0x3fu) << 6u) |
      (readUtf8Byte(byteIndex + 3u) & 0x3fu);
  }
  return 0xfffdu;
}

fn packSignedInt16Pair(lowerValue: i32, upperValue: i32) -> u32 {
  return (u32(lowerValue) & 0xffffu) | ((u32(upperValue) & 0xffffu) << 16u);
}

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) globalInvocationId: vec3<u32>) {
  let rowIndex = globalInvocationId.x;
  let labelCount = u32(max(textExpansionConfig[1], 0));
  if (rowIndex >= labelCount) {
    return;
  }

  let rowByteRange = textRowByteRanges[rowIndex];
  let baselineOffsetY = textExpansionConfig[0];
  var width = 0i;
  var byteIndex = rowByteRange.x;
  loop {
    if (byteIndex >= rowByteRange.y) {
      break;
    }
    let firstByte = readUtf8Byte(byteIndex);
    if ((firstByte & 0xc0u) != 0x80u) {
      let glyphId = findGlyphId(decodeCodePoint(byteIndex));
      let metrics = textGlyphMetrics[glyphId];
      generatedGlyphOffsets[byteIndex] =
        packSignedInt16Pair(width + metrics.x, baselineOffsetY);
      generatedGlyphIndices[byteIndex] = glyphId & 0xffffu;
      generatedRowIndices[byteIndex] = rowIndex;
      width += metrics.y;
    }
    byteIndex += 1u;
  }
}
`;

const GPU_UTF8_EXPANDED_TEXT_COMPUTE_SHADER_LAYOUT: ShaderLayout = {
  bindings: [
    {name: 'textRowByteRanges', type: 'read-only-storage', group: 0, location: 0},
    {name: 'textUtf8Bytes', type: 'read-only-storage', group: 0, location: 1},
    {name: 'textGlyphLookup', type: 'read-only-storage', group: 0, location: 2},
    {name: 'textGlyphMetrics', type: 'read-only-storage', group: 0, location: 3},
    {name: 'textExpansionConfig', type: 'read-only-storage', group: 0, location: 4},
    {name: 'generatedGlyphOffsets', type: 'storage', group: 0, location: 5},
    {name: 'generatedGlyphIndices', type: 'storage', group: 0, location: 6},
    {name: 'generatedRowIndices', type: 'storage', group: 0, location: 7}
  ],
  attributes: []
};

const DEFAULT_INDIRECT_TEXT_SHADER_LAYOUT: ShaderLayout = {
  attributes: [
    {name: 'positions', location: 0, type: 'vec2<f32>', stepMode: 'instance'},
    {name: GLYPH_OFFSETS_COLUMN, location: 1, type: 'vec2<i32>', stepMode: 'instance'},
    {name: GLYPH_INDICES_COLUMN, location: 2, type: 'vec2<u32>', stepMode: 'instance'}
  ],
  bindings: []
};

const DEFAULT_CLIPPED_INDIRECT_TEXT_SHADER_LAYOUT: ShaderLayout = {
  attributes: [
    ...DEFAULT_INDIRECT_TEXT_SHADER_LAYOUT.attributes,
    {name: GLYPH_CLIP_RECTS_COLUMN, location: 3, type: 'vec4<i32>', stepMode: 'instance'}
  ],
  bindings: []
};

const DEFAULT_INDIRECT_TEXT_VS = `#version 300 es
precision highp float;

in vec2 positions;
in ivec2 glyphOffsets;
in uvec2 glyphIndices;

out vec2 vTextureCoordinate;

uniform sampler2D fontAtlasTexture;
uniform sampler2D glyphFrameTexture;

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
  ivec2 glyphFrameTextureSize = textureSize(glyphFrameTexture, 0);
  int glyphFrameLinearIndex = int(glyphIndices.x);
  ivec2 glyphFrameTextureCoordinate = ivec2(
    glyphFrameLinearIndex % glyphFrameTextureSize.x,
    glyphFrameLinearIndex / glyphFrameTextureSize.x
  );
  vec4 glyphFrame = texelFetch(glyphFrameTexture, glyphFrameTextureCoordinate, 0);
  vec2 glyphOffset = vec2(glyphOffsets);
  vec2 glyphSize = glyphFrame.zw;
  vec2 glyphPosition = positions + (glyphOffset + corner * glyphSize) * 0.001;
  gl_Position = vec4(glyphPosition, 0.0, 1.0);
  vTextureCoordinate = (glyphFrame.xy + corner * glyphSize) / atlasSize;
}
`;

const DEFAULT_CLIPPED_INDIRECT_TEXT_VS = `#version 300 es
precision highp float;

in vec2 positions;
in ivec2 glyphOffsets;
in uvec2 glyphIndices;
in ivec4 glyphClipRects;

out vec2 vTextureCoordinate;

uniform sampler2D fontAtlasTexture;
uniform sampler2D glyphFrameTexture;

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
  ivec2 glyphFrameTextureSize = textureSize(glyphFrameTexture, 0);
  int glyphFrameLinearIndex = int(glyphIndices.x);
  ivec2 glyphFrameTextureCoordinate = ivec2(
    glyphFrameLinearIndex % glyphFrameTextureSize.x,
    glyphFrameLinearIndex / glyphFrameTextureSize.x
  );
  vec4 glyphFrame = texelFetch(glyphFrameTexture, glyphFrameTextureCoordinate, 0);
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

export type ArrowTextGlyphTable = {
  table: arrow.Table;
  glyphLayout: ArrowGlyphLayout;
  characterSet?: Set<string>;
  attributeByteLength: number;
  glyphAttributeBuildTimeMs: number;
};

export type IndirectTextGlyphTable = {
  table: arrow.Table;
  glyphLayout: IndirectArrowGlyphLayout;
  characterSet?: Set<string>;
  attributeByteLength: number;
  glyphAttributeBuildTimeMs: number;
};

export type StorageTextGlyphTable = {
  table: arrow.Table;
  glyphLayout: ArrowGlyphLayout;
  characterSet?: Set<string>;
  attributeByteLength: number;
  glyphAttributeBuildTimeMs: number;
};

export type StorageIndexedTextGlyphTable = {
  table: arrow.Table;
  glyphLayout: IndirectArrowGlyphLayout;
  characterSet?: Set<string>;
  attributeByteLength: number;
  glyphAttributeBuildTimeMs: number;
};

export type ArrowTextModelProps = Omit<
  ArrowModelProps,
  'arrowTable' | 'arrowGPUTable' | 'streamingArrowGPUTable' | 'arrowCount'
> & {
  /** One row per label. GPU-compatible numeric columns are repeated for every generated glyph. */
  labelTable: arrow.Table;
  /** Arrow UTF-8 labels aligned row-for-row with `labelTable`. */
  texts: arrow.Vector<arrow.Utf8>;
  /**
   * Optional packed per-label clip rectangles `[x, y, width, height]`.
   * Values are signed 16-bit glyph-layout units relative to the label origin.
   * Negative width or height disables clipping on that axis.
   */
  clipRects?: arrow.Vector<arrow.FixedSizeList<arrow.Int16>>;
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

export type StorageTextModelProps = ArrowTextModelProps;
export type StorageIndexedTextModelProps = ArrowTextModelProps;
export type GpuExpandedTextModelProps = ArrowTextModelProps;

/** Arrow-backed one-line text model that expands labels into glyph instances. */
export class ArrowTextModel extends ArrowModel {
  fontAtlasManager?: FontAtlasManager;
  atlasTexture?: DynamicTexture;
  glyphLayout: ArrowGlyphLayout;
  characterSet?: Set<string>;
  glyphTable: arrow.Table;
  glyphAttributeBuildTimeMs: number;
  glyphAttributeByteLength: number;
  private textProps: ArrowTextModelProps;

  constructor(device: Device, props: ArrowTextModelProps) {
    const prepared = prepareArrowTextModel(device, props);
    super(device, prepared.modelProps);
    this.textProps = props;
    this.fontAtlasManager = prepared.fontAtlasManager;
    this.atlasTexture = prepared.atlasTexture;
    this.glyphLayout = prepared.glyphTable.glyphLayout;
    this.characterSet = prepared.glyphTable.characterSet;
    this.glyphTable = prepared.glyphTable.table;
    this.glyphAttributeBuildTimeMs = prepared.glyphAttributeBuildTimeMs;
    this.glyphAttributeByteLength = prepared.glyphTable.attributeByteLength;
  }

  /** Rebuild generated glyph attributes when label rows, text, or font layout inputs change. */
  override setProps(props: Partial<ArrowTextModelProps>): void {
    const nextProps = {...this.textProps, ...props};
    const shouldRebuild =
      props.labelTable !== undefined ||
      props.texts !== undefined ||
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
    this.fontAtlasManager = prepared.fontAtlasManager;
    this.atlasTexture = prepared.atlasTexture;
    this.glyphLayout = prepared.glyphTable.glyphLayout;
    this.characterSet = prepared.glyphTable.characterSet;
    this.glyphTable = prepared.glyphTable.table;
    this.glyphAttributeBuildTimeMs = prepared.glyphAttributeBuildTimeMs;
    this.glyphAttributeByteLength = prepared.glyphTable.attributeByteLength;
    super.setProps({arrowTable: prepared.glyphTable.table});
    if (prepared.atlasTexture) {
      this.setBindings({fontAtlasTexture: prepared.atlasTexture});
    }
    this.setInstanceCount(prepared.glyphTable.glyphLayout.glyphCount);
    this.setNeedsRedraw('Arrow text glyph table updated');
  }

  override destroy(): void {
    this.atlasTexture?.destroy();
    super.destroy();
  }
}

/**
 * WebGPU-only Arrow text model that stores per-label row state once and fetches it by glyph row index.
 */
export class StorageTextModel extends ArrowModel {
  fontAtlasManager?: FontAtlasManager;
  atlasTexture?: DynamicTexture;
  glyphLayout: ArrowGlyphLayout;
  characterSet?: Set<string>;
  glyphTable: arrow.Table;
  glyphAttributeBuildTimeMs: number;
  glyphAttributeByteLength: number;
  rowStorageByteLength: number;
  rowPositionsBuffer: Buffer;
  rowClipRectsBuffer?: Buffer;
  private textProps: StorageTextModelProps;

  constructor(device: Device, props: StorageTextModelProps) {
    if (device.type !== 'webgpu') {
      throw new Error('StorageTextModel is WebGPU-only');
    }
    const prepared = prepareStorageTextModel(device, props);
    super(device, prepared.modelProps);
    this.textProps = props;
    this.fontAtlasManager = prepared.fontAtlasManager;
    this.atlasTexture = prepared.atlasTexture;
    this.glyphLayout = prepared.glyphTable.glyphLayout;
    this.characterSet = prepared.glyphTable.characterSet;
    this.glyphTable = prepared.glyphTable.table;
    this.glyphAttributeBuildTimeMs = prepared.glyphAttributeBuildTimeMs;
    this.glyphAttributeByteLength = prepared.glyphTable.attributeByteLength;
    this.rowStorageByteLength = prepared.rowState.byteLength;
    this.rowPositionsBuffer = prepared.rowState.positionsBuffer;
    this.rowClipRectsBuffer = prepared.rowState.clipRectsBuffer;
  }

  override setProps(props: Partial<StorageTextModelProps>): void {
    const nextProps = {...this.textProps, ...props};
    const shouldRebuild =
      props.labelTable !== undefined ||
      props.texts !== undefined ||
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

    const prepared = prepareStorageTextModel(this.device, nextProps);
    this.atlasTexture?.destroy();
    this.rowPositionsBuffer.destroy();
    this.rowClipRectsBuffer?.destroy();
    this.fontAtlasManager = prepared.fontAtlasManager;
    this.atlasTexture = prepared.atlasTexture;
    this.glyphLayout = prepared.glyphTable.glyphLayout;
    this.characterSet = prepared.glyphTable.characterSet;
    this.glyphTable = prepared.glyphTable.table;
    this.glyphAttributeBuildTimeMs = prepared.glyphAttributeBuildTimeMs;
    this.glyphAttributeByteLength = prepared.glyphTable.attributeByteLength;
    this.rowStorageByteLength = prepared.rowState.byteLength;
    this.rowPositionsBuffer = prepared.rowState.positionsBuffer;
    this.rowClipRectsBuffer = prepared.rowState.clipRectsBuffer;
    super.setProps({arrowTable: prepared.glyphTable.table});
    this.setBindings({
      textRowPositions: prepared.rowState.positionsBuffer,
      ...(prepared.rowState.clipRectsBuffer
        ? {textRowClipRects: prepared.rowState.clipRectsBuffer}
        : {}),
      ...(prepared.atlasTexture ? {fontAtlasTexture: prepared.atlasTexture} : {})
    });
    this.setInstanceCount(prepared.glyphTable.glyphLayout.glyphCount);
    this.setNeedsRedraw('Storage text row state updated');
  }

  override destroy(): void {
    this.atlasTexture?.destroy();
    this.rowPositionsBuffer.destroy();
    this.rowClipRectsBuffer?.destroy();
    super.destroy();
  }
}

/**
 * WebGPU-only Arrow text model that keeps row state and shared glyph frames in storage buffers.
 */
export class StorageIndexedTextModel extends ArrowModel {
  fontAtlasManager?: FontAtlasManager;
  atlasTexture?: DynamicTexture;
  glyphLayout: IndirectArrowGlyphLayout;
  characterSet?: Set<string>;
  glyphTable: arrow.Table;
  glyphAttributeBuildTimeMs: number;
  glyphAttributeByteLength: number;
  rowStorageByteLength: number;
  glyphFrameStorageByteLength: number;
  rowPositionsBuffer: Buffer;
  rowClipRectsBuffer?: Buffer;
  glyphFramesBuffer: Buffer;
  private textProps: StorageIndexedTextModelProps;

  constructor(device: Device, props: StorageIndexedTextModelProps) {
    if (device.type !== 'webgpu') {
      throw new Error('StorageIndexedTextModel is WebGPU-only');
    }
    const prepared = prepareStorageIndexedTextModel(device, props);
    super(device, prepared.modelProps);
    this.textProps = props;
    this.fontAtlasManager = prepared.fontAtlasManager;
    this.atlasTexture = prepared.atlasTexture;
    this.glyphLayout = prepared.glyphTable.glyphLayout;
    this.characterSet = prepared.glyphTable.characterSet;
    this.glyphTable = prepared.glyphTable.table;
    this.glyphAttributeBuildTimeMs = prepared.glyphAttributeBuildTimeMs;
    this.glyphAttributeByteLength = prepared.glyphTable.attributeByteLength;
    this.rowStorageByteLength = prepared.rowState.byteLength;
    this.glyphFrameStorageByteLength = prepared.glyphFrames.byteLength;
    this.rowPositionsBuffer = prepared.rowState.positionsBuffer;
    this.rowClipRectsBuffer = prepared.rowState.clipRectsBuffer;
    this.glyphFramesBuffer = prepared.glyphFrames.buffer;
  }

  override setProps(props: Partial<StorageIndexedTextModelProps>): void {
    const nextProps = {...this.textProps, ...props};
    const shouldRebuild =
      props.labelTable !== undefined ||
      props.texts !== undefined ||
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

    const prepared = prepareStorageIndexedTextModel(this.device, nextProps);
    this.atlasTexture?.destroy();
    this.rowPositionsBuffer.destroy();
    this.rowClipRectsBuffer?.destroy();
    this.glyphFramesBuffer.destroy();
    this.fontAtlasManager = prepared.fontAtlasManager;
    this.atlasTexture = prepared.atlasTexture;
    this.glyphLayout = prepared.glyphTable.glyphLayout;
    this.characterSet = prepared.glyphTable.characterSet;
    this.glyphTable = prepared.glyphTable.table;
    this.glyphAttributeBuildTimeMs = prepared.glyphAttributeBuildTimeMs;
    this.glyphAttributeByteLength = prepared.glyphTable.attributeByteLength;
    this.rowStorageByteLength = prepared.rowState.byteLength;
    this.glyphFrameStorageByteLength = prepared.glyphFrames.byteLength;
    this.rowPositionsBuffer = prepared.rowState.positionsBuffer;
    this.rowClipRectsBuffer = prepared.rowState.clipRectsBuffer;
    this.glyphFramesBuffer = prepared.glyphFrames.buffer;
    super.setProps({arrowTable: prepared.glyphTable.table});
    this.setBindings({
      textRowPositions: prepared.rowState.positionsBuffer,
      textGlyphFrames: prepared.glyphFrames.buffer,
      ...(prepared.rowState.clipRectsBuffer
        ? {textRowClipRects: prepared.rowState.clipRectsBuffer}
        : {}),
      ...(prepared.atlasTexture ? {fontAtlasTexture: prepared.atlasTexture} : {})
    });
    this.setInstanceCount(prepared.glyphTable.glyphLayout.glyphCount);
    this.setNeedsRedraw('Storage indexed text state updated');
  }

  override destroy(): void {
    this.atlasTexture?.destroy();
    this.rowPositionsBuffer.destroy();
    this.rowClipRectsBuffer?.destroy();
    this.glyphFramesBuffer.destroy();
    super.destroy();
  }
}

/**
 * WebGPU-only text model that expands compact label glyph streams into render instances with compute.
 */
export class GpuExpandedTextModel extends Model {
  fontAtlasManager?: FontAtlasManager;
  atlasTexture?: DynamicTexture;
  characterSet?: Set<string>;
  glyphStream?: GpuExpandedTextStream;
  glyphCount: number;
  glyphAttributeBuildTimeMs: number;
  glyphAttributeByteLength: number;
  compactStreamBuildTimeMs: number;
  compactStreamByteLength: number;
  generatedRenderBufferByteLength: number;
  rowStorageByteLength: number;
  glyphDefinitionStorageByteLength: number;
  transientComputeInputByteLength: number;
  rowPositionsBuffer: Buffer;
  rowClipRectsBuffer?: Buffer;
  glyphFramesBuffer: Buffer;
  generatedGlyphOffsetsBuffer: Buffer;
  generatedGlyphIndicesBuffer: Buffer;
  generatedRowIndicesBuffer: Buffer;
  private textProps: GpuExpandedTextModelProps;

  constructor(device: Device, props: GpuExpandedTextModelProps) {
    if (device.type !== 'webgpu') {
      throw new Error('GpuExpandedTextModel is WebGPU-only');
    }
    const prepared = prepareGpuExpandedTextModel(device, props);
    super(device, prepared.modelProps);
    this.textProps = props;
    this.fontAtlasManager = prepared.fontAtlasManager;
    this.atlasTexture = prepared.atlasTexture;
    this.characterSet = prepared.characterSet;
    this.glyphStream = prepared.glyphStream;
    this.glyphCount = prepared.renderInstanceCount;
    this.glyphAttributeBuildTimeMs = prepared.computeInputBuildTimeMs;
    this.glyphAttributeByteLength = prepared.generated.byteLength;
    this.compactStreamBuildTimeMs = prepared.computeInputBuildTimeMs;
    this.compactStreamByteLength = prepared.computeTextInputByteLength;
    this.generatedRenderBufferByteLength = prepared.generated.byteLength;
    this.rowStorageByteLength = prepared.rowState.byteLength;
    this.glyphDefinitionStorageByteLength = prepared.glyphFrames.byteLength;
    this.transientComputeInputByteLength = prepared.transientComputeInputByteLength;
    this.rowPositionsBuffer = prepared.rowState.positionsBuffer;
    this.rowClipRectsBuffer = prepared.rowState.clipRectsBuffer;
    this.glyphFramesBuffer = prepared.glyphFrames.buffer;
    this.generatedGlyphOffsetsBuffer = prepared.generated.glyphOffsetsBuffer;
    this.generatedGlyphIndicesBuffer = prepared.generated.glyphIndicesBuffer;
    this.generatedRowIndicesBuffer = prepared.generated.rowIndicesBuffer;
  }

  setProps(props: Partial<GpuExpandedTextModelProps>): void {
    const nextProps = {...this.textProps, ...props};
    const shouldRebuildGlyphs =
      props.texts !== undefined ||
      props.characterSet !== undefined ||
      props.fontSettings !== undefined ||
      props.lineHeight !== undefined ||
      props.characterMapping !== undefined ||
      props.fontAtlas !== undefined;
    const shouldRebuildRows = props.labelTable !== undefined || props.clipRects !== undefined;
    this.textProps = nextProps;

    if (!shouldRebuildGlyphs && shouldRebuildRows) {
      const rowState = createStorageTextRowState(this.device, nextProps);
      this.rowPositionsBuffer.destroy();
      this.rowClipRectsBuffer?.destroy();
      this.rowPositionsBuffer = rowState.positionsBuffer;
      this.rowClipRectsBuffer = rowState.clipRectsBuffer;
      this.rowStorageByteLength = rowState.byteLength;
      this.setBindings({
        textRowPositions: rowState.positionsBuffer,
        ...(rowState.clipRectsBuffer ? {textRowClipRects: rowState.clipRectsBuffer} : {})
      });
      this.setNeedsRedraw('GPU expanded text row state updated');
      return;
    }

    if (!shouldRebuildGlyphs) {
      return;
    }

    const prepared = prepareGpuExpandedTextModel(this.device, nextProps);
    this.destroyOwnedTextResources();
    this.fontAtlasManager = prepared.fontAtlasManager;
    this.atlasTexture = prepared.atlasTexture;
    this.characterSet = prepared.characterSet;
    this.glyphStream = prepared.glyphStream;
    this.glyphCount = prepared.renderInstanceCount;
    this.glyphAttributeBuildTimeMs = prepared.computeInputBuildTimeMs;
    this.glyphAttributeByteLength = prepared.generated.byteLength;
    this.compactStreamBuildTimeMs = prepared.computeInputBuildTimeMs;
    this.compactStreamByteLength = prepared.computeTextInputByteLength;
    this.generatedRenderBufferByteLength = prepared.generated.byteLength;
    this.rowStorageByteLength = prepared.rowState.byteLength;
    this.glyphDefinitionStorageByteLength = prepared.glyphFrames.byteLength;
    this.transientComputeInputByteLength = prepared.transientComputeInputByteLength;
    this.rowPositionsBuffer = prepared.rowState.positionsBuffer;
    this.rowClipRectsBuffer = prepared.rowState.clipRectsBuffer;
    this.glyphFramesBuffer = prepared.glyphFrames.buffer;
    this.generatedGlyphOffsetsBuffer = prepared.generated.glyphOffsetsBuffer;
    this.generatedGlyphIndicesBuffer = prepared.generated.glyphIndicesBuffer;
    this.generatedRowIndicesBuffer = prepared.generated.rowIndicesBuffer;
    this.setAttributes({
      [GLYPH_OFFSETS_COLUMN]: prepared.generated.glyphOffsetsBuffer,
      [GLYPH_INDICES_COLUMN]: prepared.generated.glyphIndicesBuffer,
      [ROW_INDICES_COLUMN]: prepared.generated.rowIndicesBuffer
    });
    this.setBindings({
      textRowPositions: prepared.rowState.positionsBuffer,
      textGlyphFrames: prepared.glyphFrames.buffer,
      ...(prepared.rowState.clipRectsBuffer
        ? {textRowClipRects: prepared.rowState.clipRectsBuffer}
        : {}),
      ...(prepared.atlasTexture ? {fontAtlasTexture: prepared.atlasTexture} : {})
    });
    this.setInstanceCount(prepared.renderInstanceCount);
    this.setNeedsRedraw('GPU expanded text stream rebuilt');
  }

  override destroy(): void {
    this.destroyOwnedTextResources();
    super.destroy();
  }

  private destroyOwnedTextResources(): void {
    this.atlasTexture?.destroy();
    this.rowPositionsBuffer.destroy();
    this.rowClipRectsBuffer?.destroy();
    this.glyphFramesBuffer.destroy();
    this.generatedGlyphOffsetsBuffer.destroy();
    this.generatedGlyphIndicesBuffer.destroy();
    this.generatedRowIndicesBuffer.destroy();
  }
}

/** Arrow-backed one-line text model that stores atlas frames in a shared Float32x4 texture. */
export class IndirectTextModel extends ArrowModel {
  fontAtlasManager?: FontAtlasManager;
  atlasTexture?: DynamicTexture;
  glyphFrameTexture: DynamicTexture;
  glyphLayout: IndirectArrowGlyphLayout;
  characterSet?: Set<string>;
  glyphTable: arrow.Table;
  glyphAttributeBuildTimeMs: number;
  glyphAttributeByteLength: number;
  private textProps: ArrowTextModelProps;

  constructor(device: Device, props: ArrowTextModelProps) {
    const prepared = prepareIndirectTextModel(device, props);
    super(device, prepared.modelProps);
    this.textProps = props;
    this.fontAtlasManager = prepared.fontAtlasManager;
    this.atlasTexture = prepared.atlasTexture;
    this.glyphFrameTexture = prepared.glyphFrameTexture;
    this.glyphLayout = prepared.glyphTable.glyphLayout;
    this.characterSet = prepared.glyphTable.characterSet;
    this.glyphTable = prepared.glyphTable.table;
    this.glyphAttributeBuildTimeMs = prepared.glyphAttributeBuildTimeMs;
    this.glyphAttributeByteLength = prepared.glyphTable.attributeByteLength;
  }

  /** Rebuild generated glyph attributes and shared glyph frame texture. */
  override setProps(props: Partial<ArrowTextModelProps>): void {
    const nextProps = {...this.textProps, ...props};
    const shouldRebuild =
      props.labelTable !== undefined ||
      props.texts !== undefined ||
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

    const prepared = prepareIndirectTextModel(this.device, nextProps);
    this.atlasTexture?.destroy();
    this.glyphFrameTexture.destroy();
    this.fontAtlasManager = prepared.fontAtlasManager;
    this.atlasTexture = prepared.atlasTexture;
    this.glyphFrameTexture = prepared.glyphFrameTexture;
    this.glyphLayout = prepared.glyphTable.glyphLayout;
    this.characterSet = prepared.glyphTable.characterSet;
    this.glyphTable = prepared.glyphTable.table;
    this.glyphAttributeBuildTimeMs = prepared.glyphAttributeBuildTimeMs;
    this.glyphAttributeByteLength = prepared.glyphTable.attributeByteLength;
    super.setProps({arrowTable: prepared.glyphTable.table});
    this.setBindings({
      glyphFrameTexture: prepared.glyphFrameTexture,
      ...(prepared.atlasTexture ? {fontAtlasTexture: prepared.atlasTexture} : {})
    });
    this.setInstanceCount(prepared.glyphTable.glyphLayout.glyphCount);
    this.setNeedsRedraw('Indirect text glyph table updated');
  }

  override destroy(): void {
    this.atlasTexture?.destroy();
    this.glyphFrameTexture.destroy();
    super.destroy();
  }
}

/** Build an Arrow glyph table without creating a Model. */
export function buildArrowTextGlyphTable(props: {
  labelTable: arrow.Table;
  texts: arrow.Vector<arrow.Utf8>;
  clipRects?: arrow.Vector<arrow.FixedSizeList<arrow.Int16>>;
  mapping: CharacterMapping;
  baselineOffset: number;
  lineHeight: number;
  characterSet?: Set<string>;
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
  const fields: arrow.Field[] = [];
  const columns: Record<string, arrow.Vector> = {};

  for (const field of props.labelTable.schema.fields) {
    const vector = props.labelTable.getChild(field.name);
    if (!vector || !isInstanceCompatibleArrowType(vector.type)) {
      continue;
    }
    fields.push(field);
    columns[field.name] = repeatArrowVectorRows(vector, glyphLayout.startIndices);
  }

  fields.push(makeFixedSizeListField(GLYPH_OFFSETS_COLUMN, new arrow.Int16(), 2));
  fields.push(makeFixedSizeListField(GLYPH_FRAMES_COLUMN, new arrow.Uint16(), 4));
  if (props.clipRects) {
    fields.push(makeFixedSizeListField(GLYPH_CLIP_RECTS_COLUMN, new arrow.Int16(), 4));
  }
  fields.push(new arrow.Field(ROW_INDICES_COLUMN, new arrow.Uint32(), false));
  columns[GLYPH_OFFSETS_COLUMN] = makeArrowFixedSizeListVector(
    new arrow.Int16(),
    2,
    glyphLayout.glyphOffsets
  );
  columns[GLYPH_FRAMES_COLUMN] = makeArrowFixedSizeListVector(
    new arrow.Uint16(),
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
    new arrow.Uint32(),
    makeGlyphRowIndices(glyphLayout.startIndices)
  );
  const attributeByteLength = getGeneratedAttributeByteLength(columns);
  const glyphAttributeBuildTimeMs = getNow() - glyphAttributeBuildStartTime;

  return {
    table: new arrow.Table(new arrow.Schema(fields, props.labelTable.schema.metadata), columns),
    glyphLayout,
    characterSet: props.characterSet,
    attributeByteLength,
    glyphAttributeBuildTimeMs
  };
}

/** Build a storage-row glyph table without repeating label-row numeric columns. */
export function buildStorageTextGlyphTable(props: {
  labelTable: arrow.Table;
  texts: arrow.Vector<arrow.Utf8>;
  clipRects?: arrow.Vector<arrow.FixedSizeList<arrow.Int16>>;
  mapping: CharacterMapping;
  baselineOffset: number;
  lineHeight: number;
  characterSet?: Set<string>;
}): StorageTextGlyphTable {
  if (props.labelTable.numRows !== props.texts.length) {
    throw new Error('StorageTextModel requires labelTable rows to match UTF-8 text rows');
  }
  assertClipRects(props.clipRects, props.texts.length);
  assertColumnAvailable(props.labelTable, GLYPH_OFFSETS_COLUMN);
  assertColumnAvailable(props.labelTable, GLYPH_FRAMES_COLUMN);
  assertColumnAvailable(props.labelTable, ROW_INDICES_COLUMN);

  const glyphAttributeBuildStartTime = getNow();
  const glyphLayout = buildArrowGlyphLayout({
    texts: props.texts,
    mapping: props.mapping,
    baselineOffset: props.baselineOffset,
    lineHeight: props.lineHeight,
    characterSet: props.characterSet
  });
  const fields = [
    makeFixedSizeListField(GLYPH_OFFSETS_COLUMN, new arrow.Int16(), 2),
    makeFixedSizeListField(GLYPH_FRAMES_COLUMN, new arrow.Uint16(), 4),
    new arrow.Field(ROW_INDICES_COLUMN, new arrow.Uint32(), false)
  ];
  const columns: Record<string, arrow.Vector> = {
    [GLYPH_OFFSETS_COLUMN]: makeArrowFixedSizeListVector(
      new arrow.Int16(),
      2,
      glyphLayout.glyphOffsets
    ),
    [GLYPH_FRAMES_COLUMN]: makeArrowFixedSizeListVector(
      new arrow.Uint16(),
      4,
      glyphLayout.glyphFrames
    ),
    [ROW_INDICES_COLUMN]: makeNumericArrowVector(
      new arrow.Uint32(),
      makeGlyphRowIndices(glyphLayout.startIndices)
    )
  };
  const attributeByteLength = getGeneratedAttributeByteLength(columns);
  const glyphAttributeBuildTimeMs = getNow() - glyphAttributeBuildStartTime;

  return {
    table: new arrow.Table(new arrow.Schema(fields, props.labelTable.schema.metadata), columns),
    glyphLayout,
    characterSet: props.characterSet,
    attributeByteLength,
    glyphAttributeBuildTimeMs
  };
}

/** Build compact storage-backed glyph rows with frame indexes instead of repeated frame quads. */
export function buildStorageIndexedTextGlyphTable(props: {
  labelTable: arrow.Table;
  texts: arrow.Vector<arrow.Utf8>;
  clipRects?: arrow.Vector<arrow.FixedSizeList<arrow.Int16>>;
  mapping: CharacterMapping;
  baselineOffset: number;
  lineHeight: number;
  characterSet?: Set<string>;
}): StorageIndexedTextGlyphTable {
  if (props.labelTable.numRows !== props.texts.length) {
    throw new Error('StorageIndexedTextModel requires labelTable rows to match UTF-8 text rows');
  }
  assertClipRects(props.clipRects, props.texts.length);
  assertColumnAvailable(props.labelTable, GLYPH_OFFSETS_COLUMN);
  assertColumnAvailable(props.labelTable, GLYPH_INDICES_COLUMN);
  assertColumnAvailable(props.labelTable, ROW_INDICES_COLUMN);

  const glyphAttributeBuildStartTime = getNow();
  const glyphLayout = buildIndirectArrowGlyphLayout({
    texts: props.texts,
    mapping: props.mapping,
    baselineOffset: props.baselineOffset,
    lineHeight: props.lineHeight,
    characterSet: props.characterSet
  });
  const fields = [
    makeFixedSizeListField(GLYPH_OFFSETS_COLUMN, new arrow.Int16(), 2),
    makeFixedSizeListField(GLYPH_INDICES_COLUMN, new arrow.Uint16(), 2),
    new arrow.Field(ROW_INDICES_COLUMN, new arrow.Uint32(), false)
  ];
  const columns: Record<string, arrow.Vector> = {
    [GLYPH_OFFSETS_COLUMN]: makeArrowFixedSizeListVector(
      new arrow.Int16(),
      2,
      glyphLayout.glyphOffsets
    ),
    [GLYPH_INDICES_COLUMN]: makeArrowFixedSizeListVector(
      new arrow.Uint16(),
      2,
      glyphLayout.glyphIndices
    ),
    [ROW_INDICES_COLUMN]: makeNumericArrowVector(
      new arrow.Uint32(),
      makeGlyphRowIndices(glyphLayout.startIndices)
    )
  };
  const attributeByteLength = getGeneratedAttributeByteLength(columns);
  const glyphAttributeBuildTimeMs = getNow() - glyphAttributeBuildStartTime;

  return {
    table: new arrow.Table(new arrow.Schema(fields, props.labelTable.schema.metadata), columns),
    glyphLayout,
    characterSet: props.characterSet,
    attributeByteLength,
    glyphAttributeBuildTimeMs
  };
}

/** Build an Arrow glyph table with uint16 glyph-frame texture references. */
export function buildIndirectTextGlyphTable(props: {
  labelTable: arrow.Table;
  texts: arrow.Vector<arrow.Utf8>;
  clipRects?: arrow.Vector<arrow.FixedSizeList<arrow.Int16>>;
  mapping: CharacterMapping;
  baselineOffset: number;
  lineHeight: number;
  characterSet?: Set<string>;
}): IndirectTextGlyphTable {
  if (props.labelTable.numRows !== props.texts.length) {
    throw new Error('IndirectTextModel requires labelTable rows to match UTF-8 text rows');
  }
  assertClipRects(props.clipRects, props.texts.length);
  assertColumnAvailable(props.labelTable, GLYPH_OFFSETS_COLUMN);
  assertColumnAvailable(props.labelTable, GLYPH_INDICES_COLUMN);
  assertColumnAvailable(props.labelTable, GLYPH_CLIP_RECTS_COLUMN);
  assertColumnAvailable(props.labelTable, ROW_INDICES_COLUMN);

  const glyphAttributeBuildStartTime = getNow();
  const glyphLayout = buildIndirectArrowGlyphLayout({
    texts: props.texts,
    mapping: props.mapping,
    baselineOffset: props.baselineOffset,
    lineHeight: props.lineHeight,
    characterSet: props.characterSet
  });
  const fields: arrow.Field[] = [];
  const columns: Record<string, arrow.Vector> = {};

  for (const field of props.labelTable.schema.fields) {
    const vector = props.labelTable.getChild(field.name);
    if (!vector || !isInstanceCompatibleArrowType(vector.type)) {
      continue;
    }
    fields.push(field);
    columns[field.name] = repeatArrowVectorRows(vector, glyphLayout.startIndices);
  }

  fields.push(makeFixedSizeListField(GLYPH_OFFSETS_COLUMN, new arrow.Int16(), 2));
  fields.push(makeFixedSizeListField(GLYPH_INDICES_COLUMN, new arrow.Uint16(), 2));
  if (props.clipRects) {
    fields.push(makeFixedSizeListField(GLYPH_CLIP_RECTS_COLUMN, new arrow.Int16(), 4));
  }
  fields.push(new arrow.Field(ROW_INDICES_COLUMN, new arrow.Uint32(), false));
  columns[GLYPH_OFFSETS_COLUMN] = makeArrowFixedSizeListVector(
    new arrow.Int16(),
    2,
    glyphLayout.glyphOffsets
  );
  columns[GLYPH_INDICES_COLUMN] = makeArrowFixedSizeListVector(
    new arrow.Uint16(),
    2,
    glyphLayout.glyphIndices
  );
  if (props.clipRects) {
    columns[GLYPH_CLIP_RECTS_COLUMN] = repeatArrowVectorRows(
      props.clipRects,
      glyphLayout.startIndices
    );
  }
  columns[ROW_INDICES_COLUMN] = makeNumericArrowVector(
    new arrow.Uint32(),
    makeGlyphRowIndices(glyphLayout.startIndices)
  );
  const attributeByteLength = getGeneratedAttributeByteLength(columns);
  const glyphAttributeBuildTimeMs = getNow() - glyphAttributeBuildStartTime;

  return {
    table: new arrow.Table(new arrow.Schema(fields, props.labelTable.schema.metadata), columns),
    glyphLayout,
    characterSet: props.characterSet,
    attributeByteLength,
    glyphAttributeBuildTimeMs
  };
}

function prepareArrowTextModel(
  device: Device,
  props: ArrowTextModelProps
): {
  modelProps: ArrowModelProps;
  glyphTable: ArrowTextGlyphTable;
  fontAtlasManager?: FontAtlasManager;
  atlasTexture?: DynamicTexture;
  glyphAttributeBuildTimeMs: number;
} {
  const mappingState = resolveCharacterMapping(props);
  const glyphTable = buildArrowTextGlyphTable({
    labelTable: props.labelTable,
    texts: props.texts,
    clipRects: props.clipRects,
    mapping: mappingState.mapping,
    baselineOffset: mappingState.baselineOffset,
    lineHeight: mappingState.lineHeight,
    characterSet: mappingState.characterSet
  });
  const atlasTexture = mappingState.fontAtlas
    ? new DynamicTexture(device, {
        id: `${props.id || 'arrow-text-model'}-atlas`,
        data: mappingState.fontAtlas.data
      })
    : undefined;

  return {
    modelProps: {
      ...props,
      vs: props.vs ?? (props.clipRects ? DEFAULT_CLIPPED_ARROW_TEXT_VS : DEFAULT_ARROW_TEXT_VS),
      fs: props.fs ?? DEFAULT_ARROW_TEXT_FS,
      shaderLayout:
        props.shaderLayout ??
        (props.clipRects
          ? DEFAULT_CLIPPED_ARROW_TEXT_SHADER_LAYOUT
          : DEFAULT_ARROW_TEXT_SHADER_LAYOUT),
      bindings: {
        ...(props.bindings || {}),
        ...(atlasTexture ? {fontAtlasTexture: atlasTexture} : {})
      },
      vertexCount: props.vertexCount ?? 6,
      arrowTable: glyphTable.table,
      arrowCount: 'instance'
    },
    glyphTable,
    fontAtlasManager: mappingState.fontAtlasManager,
    atlasTexture,
    glyphAttributeBuildTimeMs: glyphTable.glyphAttributeBuildTimeMs
  };
}

function prepareStorageTextModel(
  device: Device,
  props: StorageTextModelProps
): {
  modelProps: ArrowModelProps;
  glyphTable: StorageTextGlyphTable;
  fontAtlasManager?: FontAtlasManager;
  atlasTexture?: DynamicTexture;
  rowState: StorageTextRowState;
  glyphAttributeBuildTimeMs: number;
} {
  const mappingState = resolveCharacterMapping(props);
  const glyphTable = buildStorageTextGlyphTable({
    labelTable: props.labelTable,
    texts: props.texts,
    clipRects: props.clipRects,
    mapping: mappingState.mapping,
    baselineOffset: mappingState.baselineOffset,
    lineHeight: mappingState.lineHeight,
    characterSet: mappingState.characterSet
  });
  const atlasTexture = mappingState.fontAtlas
    ? new DynamicTexture(device, {
        id: `${props.id || 'storage-text-model'}-atlas`,
        data: mappingState.fontAtlas.data
      })
    : undefined;
  const rowState = createStorageTextRowState(device, props);

  return {
    modelProps: {
      ...props,
      source:
        props.source ??
        (props.clipRects ? DEFAULT_CLIPPED_STORAGE_TEXT_SOURCE : DEFAULT_STORAGE_TEXT_SOURCE),
      shaderLayout: props.shaderLayout ?? DEFAULT_STORAGE_TEXT_SHADER_LAYOUT,
      bindings: {
        ...(props.bindings || {}),
        textRowPositions: rowState.positionsBuffer,
        ...(rowState.clipRectsBuffer ? {textRowClipRects: rowState.clipRectsBuffer} : {}),
        ...(atlasTexture ? {fontAtlasTexture: atlasTexture} : {})
      },
      vertexCount: props.vertexCount ?? 6,
      arrowTable: glyphTable.table,
      arrowCount: 'instance'
    },
    glyphTable,
    fontAtlasManager: mappingState.fontAtlasManager,
    atlasTexture,
    rowState,
    glyphAttributeBuildTimeMs: glyphTable.glyphAttributeBuildTimeMs
  };
}

function prepareStorageIndexedTextModel(
  device: Device,
  props: StorageIndexedTextModelProps
): {
  modelProps: ArrowModelProps;
  glyphTable: StorageIndexedTextGlyphTable;
  fontAtlasManager?: FontAtlasManager;
  atlasTexture?: DynamicTexture;
  rowState: StorageTextRowState;
  glyphFrames: StorageGlyphFrameState;
  glyphAttributeBuildTimeMs: number;
} {
  const mappingState = resolveCharacterMapping(props);
  const glyphTable = buildStorageIndexedTextGlyphTable({
    labelTable: props.labelTable,
    texts: props.texts,
    clipRects: props.clipRects,
    mapping: mappingState.mapping,
    baselineOffset: mappingState.baselineOffset,
    lineHeight: mappingState.lineHeight,
    characterSet: mappingState.characterSet
  });
  const atlasTexture = mappingState.fontAtlas
    ? new DynamicTexture(device, {
        id: `${props.id || 'storage-indexed-text-model'}-atlas`,
        data: mappingState.fontAtlas.data
      })
    : undefined;
  const rowState = createStorageTextRowState(device, props);
  const glyphFrames = createStorageGlyphFrames(
    device,
    props,
    glyphTable.glyphLayout.glyphFrameTextureData
  );

  return {
    modelProps: {
      ...props,
      source:
        props.source ??
        (props.clipRects
          ? DEFAULT_CLIPPED_STORAGE_INDEXED_TEXT_SOURCE
          : DEFAULT_STORAGE_INDEXED_TEXT_SOURCE),
      shaderLayout: props.shaderLayout ?? DEFAULT_STORAGE_INDEXED_TEXT_SHADER_LAYOUT,
      bindings: {
        ...(props.bindings || {}),
        textRowPositions: rowState.positionsBuffer,
        textGlyphFrames: glyphFrames.buffer,
        ...(rowState.clipRectsBuffer ? {textRowClipRects: rowState.clipRectsBuffer} : {}),
        ...(atlasTexture ? {fontAtlasTexture: atlasTexture} : {})
      },
      vertexCount: props.vertexCount ?? 6,
      arrowTable: glyphTable.table,
      arrowCount: 'instance'
    },
    glyphTable,
    fontAtlasManager: mappingState.fontAtlasManager,
    atlasTexture,
    rowState,
    glyphFrames,
    glyphAttributeBuildTimeMs: glyphTable.glyphAttributeBuildTimeMs
  };
}

function prepareGpuExpandedTextModel(
  device: Device,
  props: GpuExpandedTextModelProps
): {
  modelProps: ArrowModelProps;
  glyphStream?: GpuExpandedTextStream;
  characterSet?: Set<string>;
  renderInstanceCount: number;
  computeInputBuildTimeMs: number;
  computeTextInputByteLength: number;
  fontAtlasManager?: FontAtlasManager;
  atlasTexture?: DynamicTexture;
  rowState: StorageTextRowState;
  glyphFrames: StorageGlyphFrameState;
  generated: GpuExpandedGeneratedState;
  transientComputeInputByteLength: number;
} {
  const mappingState = resolveCharacterMapping(props);
  const atlasTexture = mappingState.fontAtlas
    ? new DynamicTexture(device, {
        id: `${props.id || 'gpu-expanded-text-model'}-atlas`,
        data: mappingState.fontAtlas.data
      })
    : undefined;
  const rowState = createStorageTextRowState(device, props);
  const useGpuUtf8Decode = Boolean(mappingState.characterSet && props.characterSet !== 'auto');

  let glyphStream: GpuExpandedTextStream | undefined;
  let glyphFrames: StorageGlyphFrameState;
  let generated: GpuExpandedGeneratedState;
  let renderInstanceCount: number;
  let computeInputBuildTimeMs: number;
  let computeTextInputByteLength: number;
  let transientComputeInputByteLength: number;

  if (useGpuUtf8Decode) {
    const utf8TextInput = buildGpuUtf8TextInput(props.texts);
    const glyphDefinitions = buildGpuUtf8GlyphDefinitions({
      mapping: mappingState.mapping,
      baselineOffset: mappingState.baselineOffset,
      lineHeight: mappingState.lineHeight,
      characterSet: mappingState.characterSet!
    });
    glyphFrames = createStorageGlyphFrames(device, props, glyphDefinitions.glyphFrames);
    const glyphMetrics = createStorageGlyphMetrics(device, props, glyphDefinitions.glyphMetrics);
    const glyphLookup = createStorageGlyphLookup(device, props, glyphDefinitions.glyphLookup);
    const utf8Input = createGpuUtf8ExpandedInput(device, props, {
      utf8TextInput,
      baselineOffsetY: glyphDefinitions.baselineOffsetY,
      glyphLookupCount: glyphDefinitions.glyphLookup.length / 2
    });
    generated = createGpuExpandedGeneratedState(device, props, utf8TextInput.byteLength);
    dispatchGpuUtf8ExpandedTextCompute(device, props, {
      utf8Input,
      glyphLookup,
      glyphMetrics,
      generated,
      outputSlotCount: utf8TextInput.byteLength,
      labelCount: props.texts.length
    });
    renderInstanceCount = utf8TextInput.byteLength;
    computeInputBuildTimeMs = utf8TextInput.textInputBuildTimeMs;
    computeTextInputByteLength = utf8TextInput.inputByteLength;
    transientComputeInputByteLength =
      utf8Input.byteLength + glyphLookup.byteLength + glyphMetrics.byteLength;
    glyphMetrics.buffer.destroy();
    glyphLookup.buffer.destroy();
    utf8Input.rowByteRangesBuffer.destroy();
    utf8Input.utf8BytesBuffer.destroy();
    utf8Input.expansionConfigBuffer.destroy();
  } else {
    glyphStream = buildGpuExpandedTextStream({
      texts: props.texts,
      mapping: mappingState.mapping,
      baselineOffset: mappingState.baselineOffset,
      lineHeight: mappingState.lineHeight,
      characterSet: mappingState.characterSet
    });
    glyphFrames = createStorageGlyphFrames(device, props, glyphStream.glyphFrames);
    const glyphMetrics = createStorageGlyphMetrics(device, props, glyphStream.glyphMetrics);
    const compactInput = createGpuExpandedCompactInput(device, props, glyphStream);
    generated = createGpuExpandedGeneratedState(device, props, glyphStream.glyphCount);
    dispatchGpuExpandedTextCompute(device, props, {
      compactInput,
      glyphMetrics,
      generated,
      glyphCount: glyphStream.glyphCount,
      labelCount: props.texts.length
    });
    renderInstanceCount = glyphStream.glyphCount;
    computeInputBuildTimeMs = glyphStream.glyphStreamBuildTimeMs;
    computeTextInputByteLength = glyphStream.compactStreamByteLength;
    transientComputeInputByteLength = compactInput.byteLength + glyphMetrics.byteLength;
    glyphMetrics.buffer.destroy();
    compactInput.glyphRangesBuffer.destroy();
    compactInput.glyphIdsBuffer.destroy();
    compactInput.expansionConfigBuffer.destroy();
  }

  return {
    modelProps: {
      ...props,
      source:
        props.source ??
        (props.clipRects
          ? DEFAULT_CLIPPED_STORAGE_INDEXED_TEXT_SOURCE
          : DEFAULT_STORAGE_INDEXED_TEXT_SOURCE),
      shaderLayout: props.shaderLayout ?? DEFAULT_STORAGE_INDEXED_TEXT_SHADER_LAYOUT,
      bindings: {
        ...(props.bindings || {}),
        textRowPositions: rowState.positionsBuffer,
        textGlyphFrames: glyphFrames.buffer,
        ...(rowState.clipRectsBuffer ? {textRowClipRects: rowState.clipRectsBuffer} : {}),
        ...(atlasTexture ? {fontAtlasTexture: atlasTexture} : {})
      },
      attributes: {
        ...(props.attributes || {}),
        [GLYPH_OFFSETS_COLUMN]: generated.glyphOffsetsBuffer,
        [GLYPH_INDICES_COLUMN]: generated.glyphIndicesBuffer,
        [ROW_INDICES_COLUMN]: generated.rowIndicesBuffer
      },
      bufferLayout: [
        ...(props.bufferLayout || []),
        {name: GLYPH_OFFSETS_COLUMN, format: 'sint16x2', stepMode: 'instance'},
        {name: GLYPH_INDICES_COLUMN, format: 'uint16x2', stepMode: 'instance'},
        {name: ROW_INDICES_COLUMN, format: 'uint32', stepMode: 'instance'}
      ],
      vertexCount: props.vertexCount ?? 6,
      instanceCount: renderInstanceCount
    },
    glyphStream,
    characterSet: mappingState.characterSet,
    renderInstanceCount,
    computeInputBuildTimeMs,
    computeTextInputByteLength,
    fontAtlasManager: mappingState.fontAtlasManager,
    atlasTexture,
    rowState,
    glyphFrames,
    generated,
    transientComputeInputByteLength
  };
}

function prepareIndirectTextModel(
  device: Device,
  props: ArrowTextModelProps
): {
  modelProps: ArrowModelProps;
  glyphTable: IndirectTextGlyphTable;
  fontAtlasManager?: FontAtlasManager;
  atlasTexture?: DynamicTexture;
  glyphFrameTexture: DynamicTexture;
  glyphAttributeBuildTimeMs: number;
} {
  const mappingState = resolveCharacterMapping(props);
  const glyphTable = buildIndirectTextGlyphTable({
    labelTable: props.labelTable,
    texts: props.texts,
    clipRects: props.clipRects,
    mapping: mappingState.mapping,
    baselineOffset: mappingState.baselineOffset,
    lineHeight: mappingState.lineHeight,
    characterSet: mappingState.characterSet
  });
  const atlasTexture = mappingState.fontAtlas
    ? new DynamicTexture(device, {
        id: `${props.id || 'indirect-text-model'}-atlas`,
        data: mappingState.fontAtlas.data
      })
    : undefined;
  const glyphFrameTexture = new DynamicTexture(device, {
    id: `${props.id || 'indirect-text-model'}-glyph-frames`,
    format: 'rgba32float',
    data: {
      data: glyphTable.glyphLayout.glyphFrameTextureData,
      width: glyphTable.glyphLayout.glyphFrameTextureWidth,
      height: glyphTable.glyphLayout.glyphFrameTextureHeight,
      format: 'rgba32float'
    }
  });

  return {
    modelProps: {
      ...props,
      vs:
        props.vs ?? (props.clipRects ? DEFAULT_CLIPPED_INDIRECT_TEXT_VS : DEFAULT_INDIRECT_TEXT_VS),
      fs: props.fs ?? DEFAULT_ARROW_TEXT_FS,
      shaderLayout:
        props.shaderLayout ??
        (props.clipRects
          ? DEFAULT_CLIPPED_INDIRECT_TEXT_SHADER_LAYOUT
          : DEFAULT_INDIRECT_TEXT_SHADER_LAYOUT),
      bindings: {
        ...(props.bindings || {}),
        glyphFrameTexture,
        ...(atlasTexture ? {fontAtlasTexture: atlasTexture} : {})
      },
      vertexCount: props.vertexCount ?? 6,
      arrowTable: glyphTable.table,
      arrowCount: 'instance'
    },
    glyphTable,
    fontAtlasManager: mappingState.fontAtlasManager,
    atlasTexture,
    glyphFrameTexture,
    glyphAttributeBuildTimeMs: glyphTable.glyphAttributeBuildTimeMs
  };
}

function getNow(): number {
  return globalThis.performance?.now() ?? Date.now();
}

function resolveCharacterMapping(props: ArrowTextModelProps): {
  mapping: CharacterMapping;
  baselineOffset: number;
  lineHeight: number;
  characterSet?: Set<string>;
  fontAtlasManager?: FontAtlasManager;
  fontAtlas?: FontAtlas;
} {
  const characterSet =
    props.characterSet === 'auto'
      ? collectArrowCharacterSet(props.texts)
      : normalizeCharacterSet(props.characterSet);
  const lineHeightMultiplier = props.lineHeight ?? 1;

  if (props.characterMapping) {
    const fontSize = props.fontSettings?.fontSize ?? DEFAULT_FONT_SETTINGS.fontSize;
    return {
      mapping: props.characterMapping,
      baselineOffset: props.fontAtlas?.baselineOffset ?? 0,
      lineHeight: lineHeightMultiplier * fontSize,
      characterSet,
      fontAtlas: props.fontAtlas
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
    fontAtlas
  };
}

function collectArrowCharacterSet(texts: arrow.Vector<arrow.Utf8>): Set<string> {
  const characterSet = new Set<string>();
  const chunks = buildArrowUtf8Chunks(texts);
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

function assertColumnAvailable(table: arrow.Table, columnName: string): void {
  if (table.getChild(columnName)) {
    throw new Error(`ArrowTextModel labelTable column "${columnName}" is reserved`);
  }
}

function assertClipRects(
  clipRects: arrow.Vector<arrow.FixedSizeList<arrow.Int16>> | undefined,
  labelCount: number
): void {
  if (!clipRects) {
    return;
  }
  if (clipRects.length !== labelCount) {
    throw new Error('ArrowTextModel clipRects rows must match UTF-8 text rows');
  }
  if (
    !arrow.DataType.isFixedSizeList(clipRects.type) ||
    clipRects.type.listSize !== 4 ||
    !(clipRects.type.children[0]?.type instanceof arrow.Int16)
  ) {
    throw new Error('ArrowTextModel clipRects must be FixedSizeList<Int16>[4]');
  }
}

type StorageTextRowState = {
  positionsBuffer: Buffer;
  clipRectsBuffer?: Buffer;
  byteLength: number;
};

type StorageGlyphFrameState = {
  buffer: Buffer;
  byteLength: number;
};

type StorageGlyphMetricState = {
  buffer: Buffer;
  byteLength: number;
};

type StorageGlyphLookupState = {
  buffer: Buffer;
  byteLength: number;
};

type GpuExpandedCompactInputState = {
  glyphRangesBuffer: Buffer;
  glyphIdsBuffer: Buffer;
  expansionConfigBuffer: Buffer;
  byteLength: number;
};

type GpuUtf8ExpandedInputState = {
  rowByteRangesBuffer: Buffer;
  utf8BytesBuffer: Buffer;
  expansionConfigBuffer: Buffer;
  byteLength: number;
};

type GpuExpandedGeneratedState = {
  glyphOffsetsBuffer: Buffer;
  glyphIndicesBuffer: Buffer;
  rowIndicesBuffer: Buffer;
  byteLength: number;
};

function createStorageTextRowState(
  device: Device,
  props: StorageTextModelProps
): StorageTextRowState {
  const positions = getStorageTextPositions(props.labelTable, props.texts.length);
  const packedClipRects = props.clipRects ? packStorageTextClipRects(props.clipRects) : undefined;
  const positionsBuffer = device.createBuffer({
    id: `${props.id || 'storage-text-model'}-row-positions`,
    usage: Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
    data: positions.byteLength > 0 ? positions : new Float32Array(2)
  });
  const clipRectsBuffer = packedClipRects
    ? device.createBuffer({
        id: `${props.id || 'storage-text-model'}-row-clip-rects`,
        usage: Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
        data: packedClipRects.byteLength > 0 ? packedClipRects : new Uint32Array(2)
      })
    : undefined;

  return {
    positionsBuffer,
    clipRectsBuffer,
    byteLength: positions.byteLength + (packedClipRects?.byteLength ?? 0)
  };
}

function createStorageGlyphFrames(
  device: Device,
  props: StorageIndexedTextModelProps | GpuExpandedTextModelProps,
  glyphFrameData: Float32Array
): StorageGlyphFrameState {
  return {
    buffer: device.createBuffer({
      id: `${props.id || 'storage-indexed-text-model'}-glyph-frames`,
      usage: Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
      data: glyphFrameData.byteLength > 0 ? glyphFrameData : new Float32Array(4)
    }),
    byteLength: glyphFrameData.byteLength
  };
}

function createStorageGlyphMetrics(
  device: Device,
  props: GpuExpandedTextModelProps,
  glyphMetricData: Int32Array
): StorageGlyphMetricState {
  return {
    buffer: device.createBuffer({
      id: `${props.id || 'gpu-expanded-text-model'}-glyph-metrics`,
      usage: Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
      data: glyphMetricData.byteLength > 0 ? glyphMetricData : new Int32Array(2)
    }),
    byteLength: glyphMetricData.byteLength
  };
}

function createStorageGlyphLookup(
  device: Device,
  props: GpuExpandedTextModelProps,
  glyphLookupData: Uint32Array
): StorageGlyphLookupState {
  return {
    buffer: device.createBuffer({
      id: `${props.id || 'gpu-expanded-text-model'}-glyph-lookup`,
      usage: Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
      data: glyphLookupData.byteLength > 0 ? glyphLookupData : new Uint32Array(2)
    }),
    byteLength: glyphLookupData.byteLength
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

function createGpuExpandedCompactInput(
  device: Device,
  props: GpuExpandedTextModelProps,
  glyphStream: GpuExpandedTextStream
): GpuExpandedCompactInputState {
  const expansionConfig = new Int32Array([
    glyphStream.baselineOffsetY,
    glyphStream.labelGlyphRanges.length / 2
  ]);
  return {
    glyphRangesBuffer: device.createBuffer({
      id: `${props.id || 'gpu-expanded-text-model'}-glyph-ranges`,
      usage: Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
      data:
        glyphStream.labelGlyphRanges.byteLength > 0
          ? glyphStream.labelGlyphRanges
          : new Uint32Array(2)
    }),
    glyphIdsBuffer: device.createBuffer({
      id: `${props.id || 'gpu-expanded-text-model'}-glyph-ids`,
      usage: Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
      data:
        glyphStream.packedGlyphIds.byteLength > 0 ? glyphStream.packedGlyphIds : new Uint32Array(1)
    }),
    expansionConfigBuffer: device.createBuffer({
      id: `${props.id || 'gpu-expanded-text-model'}-expansion-config`,
      usage: Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
      data: expansionConfig
    }),
    byteLength:
      glyphStream.labelGlyphRanges.byteLength +
      glyphStream.packedGlyphIds.byteLength +
      expansionConfig.byteLength
  };
}

function createGpuUtf8ExpandedInput(
  device: Device,
  props: GpuExpandedTextModelProps,
  {
    utf8TextInput,
    baselineOffsetY,
    glyphLookupCount
  }: {
    utf8TextInput: GpuUtf8TextInput;
    baselineOffsetY: number;
    glyphLookupCount: number;
  }
): GpuUtf8ExpandedInputState {
  const expansionConfig = new Int32Array([baselineOffsetY, props.texts.length, glyphLookupCount]);
  return {
    rowByteRangesBuffer: device.createBuffer({
      id: `${props.id || 'gpu-expanded-text-model'}-utf8-row-byte-ranges`,
      usage: Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
      data:
        utf8TextInput.rowByteRanges.byteLength > 0
          ? utf8TextInput.rowByteRanges
          : new Uint32Array(2)
    }),
    utf8BytesBuffer: device.createBuffer({
      id: `${props.id || 'gpu-expanded-text-model'}-utf8-bytes`,
      usage: Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
      data:
        utf8TextInput.packedUtf8Bytes.byteLength > 0
          ? utf8TextInput.packedUtf8Bytes
          : new Uint32Array(1)
    }),
    expansionConfigBuffer: device.createBuffer({
      id: `${props.id || 'gpu-expanded-text-model'}-utf8-expansion-config`,
      usage: Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
      data: expansionConfig
    }),
    byteLength: utf8TextInput.inputByteLength + expansionConfig.byteLength
  };
}

function createGpuExpandedGeneratedState(
  device: Device,
  props: GpuExpandedTextModelProps,
  glyphCount: number
): GpuExpandedGeneratedState {
  const outputWordCount = Math.max(glyphCount, 1);
  const byteLength = glyphCount * Uint32Array.BYTES_PER_ELEMENT * 3;
  return {
    glyphOffsetsBuffer: device.createBuffer({
      id: `${props.id || 'gpu-expanded-text-model'}-generated-glyph-offsets`,
      usage: Buffer.VERTEX | Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
      data: new Uint32Array(outputWordCount)
    }),
    glyphIndicesBuffer: device.createBuffer({
      id: `${props.id || 'gpu-expanded-text-model'}-generated-glyph-indices`,
      usage: Buffer.VERTEX | Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
      data: new Uint32Array(outputWordCount)
    }),
    rowIndicesBuffer: device.createBuffer({
      id: `${props.id || 'gpu-expanded-text-model'}-generated-row-indices`,
      usage: Buffer.VERTEX | Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
      data: new Uint32Array(outputWordCount)
    }),
    byteLength
  };
}

function dispatchGpuExpandedTextCompute(
  device: Device,
  props: GpuExpandedTextModelProps,
  state: {
    compactInput: GpuExpandedCompactInputState;
    glyphMetrics: StorageGlyphMetricState;
    generated: GpuExpandedGeneratedState;
    glyphCount: number;
    labelCount: number;
  }
): void {
  const computation = new Computation(device, {
    id: `${props.id || 'gpu-expanded-text-model'}-compute`,
    source: GPU_EXPANDED_TEXT_COMPUTE_SOURCE,
    shaderLayout: GPU_EXPANDED_TEXT_COMPUTE_SHADER_LAYOUT,
    bindings: {
      textGlyphRanges: state.compactInput.glyphRangesBuffer,
      textGlyphIds: state.compactInput.glyphIdsBuffer,
      textGlyphMetrics: state.glyphMetrics.buffer,
      textExpansionConfig: state.compactInput.expansionConfigBuffer,
      generatedGlyphOffsets: state.generated.glyphOffsetsBuffer,
      generatedGlyphIndices: state.generated.glyphIndicesBuffer,
      generatedRowIndices: state.generated.rowIndicesBuffer
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

function dispatchGpuUtf8ExpandedTextCompute(
  device: Device,
  props: GpuExpandedTextModelProps,
  state: {
    utf8Input: GpuUtf8ExpandedInputState;
    glyphLookup: StorageGlyphLookupState;
    glyphMetrics: StorageGlyphMetricState;
    generated: GpuExpandedGeneratedState;
    outputSlotCount: number;
    labelCount: number;
  }
): void {
  const computation = new Computation(device, {
    id: `${props.id || 'gpu-expanded-text-model'}-utf8-compute`,
    source: GPU_UTF8_EXPANDED_TEXT_COMPUTE_SOURCE,
    shaderLayout: GPU_UTF8_EXPANDED_TEXT_COMPUTE_SHADER_LAYOUT,
    bindings: {
      textRowByteRanges: state.utf8Input.rowByteRangesBuffer,
      textUtf8Bytes: state.utf8Input.utf8BytesBuffer,
      textGlyphLookup: state.glyphLookup.buffer,
      textGlyphMetrics: state.glyphMetrics.buffer,
      textExpansionConfig: state.utf8Input.expansionConfigBuffer,
      generatedGlyphOffsets: state.generated.glyphOffsetsBuffer,
      generatedGlyphIndices: state.generated.glyphIndicesBuffer,
      generatedRowIndices: state.generated.rowIndicesBuffer
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

function getStorageTextPositions(labelTable: arrow.Table, labelCount: number): Float32Array {
  const positions = labelTable.getChild('positions');
  if (!positions) {
    throw new Error('StorageTextModel requires labelTable.positions');
  }
  if (positions.length !== labelCount) {
    throw new Error('StorageTextModel positions rows must match UTF-8 text rows');
  }
  if (
    !arrow.DataType.isFixedSizeList(positions.type) ||
    positions.type.listSize !== 2 ||
    !(positions.type.children[0]?.type instanceof arrow.Float32)
  ) {
    throw new Error('StorageTextModel positions must be FixedSizeList<Float32>[2]');
  }
  return getArrowVectorBufferSource(positions) as Float32Array;
}

/** Pack signed `[x, y, width, height]` Int16 clip rows into two uint32 words per row. */
export function packStorageTextClipRects(
  clipRects: arrow.Vector<arrow.FixedSizeList<arrow.Int16>>
): Uint32Array {
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

function toSignedInt16(value: number): number {
  const integerValue = Math.round(value);
  if (integerValue < -32768 || integerValue > 32767) {
    throw new Error(`Arrow text glyph offset ${value} is outside the signed 16-bit range`);
  }
  return integerValue;
}

function makeFixedSizeListField(
  name: string,
  childType: arrow.Int16 | arrow.Uint16,
  listSize: 2 | 4
): arrow.Field {
  return new arrow.Field(
    name,
    new arrow.FixedSizeList(listSize, new arrow.Field('value', childType, false)),
    false
  );
}

function isInstanceCompatibleArrowType(type: arrow.DataType): boolean {
  return (
    isNumericArrowType(type) ||
    (arrow.DataType.isFixedSizeList(type) && isNumericArrowType(type.children[0].type))
  );
}

function repeatArrowVectorRows(vector: arrow.Vector, startIndices: number[]): arrow.Vector {
  const glyphCount = startIndices[startIndices.length - 1] ?? 0;
  if (arrow.DataType.isFixedSizeList(vector.type)) {
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
  const makeNumericData = arrow.makeData as <TypeT extends NumericArrowType>(props: {
    type: TypeT;
    length: number;
    data: TypeT['TArray'];
  }) => arrow.Data<TypeT>;
  return arrow.makeVector(
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
): arrow.Vector<TypeT> {
  const makeNumericData = arrow.makeData as <NumericTypeT extends NumericArrowType>(props: {
    type: NumericTypeT;
    length: number;
    data: NumericTypeT['TArray'];
  }) => arrow.Data<NumericTypeT>;
  return arrow.makeVector(
    makeNumericData({
      type,
      length: data.length,
      data
    })
  );
}

function makeGlyphRowIndices(startIndices: number[]): Uint32Array {
  const glyphCount = startIndices[startIndices.length - 1] ?? 0;
  const rowIndices = new Uint32Array(glyphCount);
  for (let rowIndex = 0; rowIndex < startIndices.length - 1; rowIndex++) {
    rowIndices.fill(rowIndex, startIndices[rowIndex], startIndices[rowIndex + 1]);
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

function getGeneratedAttributeByteLength(columns: Record<string, arrow.Vector>): number {
  let attributeByteLength = 0;
  for (const vector of Object.values(columns)) {
    if (isInstanceCompatibleArrowType(vector.type)) {
      attributeByteLength += (getArrowVectorBufferSource(vector) as NumericArray).byteLength;
    }
  }
  return attributeByteLength;
}
