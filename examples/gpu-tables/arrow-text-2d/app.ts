// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {GPURecordBatch, GPUVector, GPUTable, makeArrowFixedSizeListVector} from '@luma.gl/arrow';
import {type Device, type RenderPass, type ShaderLayout} from '@luma.gl/core';
import type {AnimationProps} from '@luma.gl/engine';
import {
  AnimationLoopTemplate,
  Model,
  PickingManager,
  ShaderInputs,
  indexColorPicking,
  indexPicking,
  picking,
  supportsIndexPicking
} from '@luma.gl/engine';
import {ShaderModule} from '@luma.gl/shadertools';
import {
  ArrowStorageTextModel,
  ArrowTextModel,
  type ArrowStorageTextInputProps,
  type ArrowTextModelProps
} from '@luma.gl/text';
import * as arrow from 'apache-arrow';

export const title = 'Arrow Text';
export const description = 'Generated Arrow UTF-8 labels expanded into GPU glyph instances.';

const LABEL_COLUMN_COUNT = 400;
const LABEL_COLUMN_SPACING = 540;
const LABEL_ROW_SPACING = 72;
const LABEL_FIELD_WIDTH = LABEL_COLUMN_COUNT * LABEL_COLUMN_SPACING;
const GLYPH_WORLD_SCALE = 0.36;
const VIEW_HEIGHT = 820;
const LABEL_CLIP_WIDTH = 720;
const CAMERA_PAN_SPEED_X = 72;
const CAMERA_PAN_SPEED_Y = 56;
const CHARACTER_SET = ' ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/-';
const ANIMATE_TOGGLE_ID = 'arrow-text-2d-animate';
const CLIPPING_TOGGLE_ID = 'arrow-text-2d-clipping';
const COLOR_TOGGLE_ID = 'arrow-text-2d-colors';
const SIZE_TOGGLE_ID = 'arrow-text-2d-sizes';
const ANGLE_TOGGLE_ID = 'arrow-text-2d-angles';
const MODEL_SELECTOR_ID = 'arrow-text-2d-model';
const DATA_SELECTOR_ID = 'arrow-text-2d-data';
const ARROW_VECTOR_BUILD_TIME_ID = 'arrow-text-2d-arrow-vector-build-time';
const CPU_GENERATION_TIME_ID = 'arrow-text-2d-cpu-generation-time';
const TOTAL_GPU_BYTES_ID = 'arrow-text-2d-total-gpu-bytes';
const GPU_ATTRIBUTE_BYTES_ID = 'arrow-text-2d-gpu-attribute-bytes';
const GPU_STORAGE_BYTES_ID = 'arrow-text-2d-gpu-storage-bytes';
const GPU_STYLE_VECTOR_BYTES_ID = 'arrow-text-2d-gpu-style-vector-bytes';
const GPU_COMPUTE_ROW_ID = 'arrow-text-2d-gpu-compute-row';
const GPU_COMPUTE_BYTES_ID = 'arrow-text-2d-gpu-compute-bytes';
const DECK_ATTRIBUTE_SIZE_ID = 'arrow-text-2d-deck-attribute-size';
const PICKED_LABEL_ID = 'arrow-text-2d-picked-label';
const STREAMING_BATCH_STATUS_ROW_ID = 'arrow-text-2d-streaming-batch-status-row';
const STREAMING_BATCH_SPINNER_ID = 'arrow-text-2d-streaming-batch-spinner';
const STREAMING_BATCH_STATUS_LABEL_ID = 'arrow-text-2d-streaming-batch-status-label';
const STREAMING_TEXT_BATCH_COUNT = 10;
const STREAMING_TEXT_BATCH_DELAY_MS = 1000;
// IconLayer + MultiIconLayer character attributes, assuming float32 positions in the active path.
const DECK_CHARACTER_ATTRIBUTE_BYTES_PER_GLYPH = 80;
type ActiveTextModel = ArrowTextModel | ArrowStorageTextModel;
type TextModelKind = 'direct' | 'storage';
type EagerTextDatasetKind = '100k' | '500k' | '1m';
type StreamingTextDatasetKind = `${EagerTextDatasetKind}-stream`;
type TextDatasetKind = EagerTextDatasetKind | StreamingTextDatasetKind;
type TextDataset = {
  labelCount: number;
  label: string;
};
type ArrowTextInput = {
  positions: GPUVector<arrow.FixedSizeList<arrow.Float32>>;
  texts: GPUVector<arrow.Utf8>;
  clipRects: GPUVector<arrow.FixedSizeList<arrow.Int16>>;
  colors: GPUVector<arrow.FixedSizeList<arrow.Uint8>>;
  angles: GPUVector<arrow.Float32>;
  sizes: GPUVector<arrow.Float32>;
  arrowVectorBuildTimeMs: number;
};

type StreamingArrowTextSource = {
  recordBatches: arrow.RecordBatch[];
  arrowVectorBuildTimeMs: number;
};

const TEXT_DATASETS: Record<EagerTextDatasetKind, TextDataset> = {
  '100k': {
    labelCount: 100_000,
    label: '100K texts, 3M glyphs'
  },
  '500k': {
    labelCount: 500_000,
    label: '500K texts, 16M glyphs'
  },
  '1m': {
    labelCount: 1_000_000,
    label: '1M texts, 31M glyphs'
  }
};

const STREAMING_TEXT_INPUT_SHADER_LAYOUT = {
  attributes: [
    {name: 'positions', location: 0, type: 'vec2<f32>', stepMode: 'instance'},
    {name: 'clipRects', location: 1, type: 'vec4<i32>', stepMode: 'instance'},
    {name: 'colors', location: 2, type: 'vec4<f32>', stepMode: 'instance'},
    {name: 'angles', location: 3, type: 'f32', stepMode: 'instance'},
    {name: 'sizes', location: 4, type: 'f32', stepMode: 'instance'}
  ],
  bindings: [{name: 'texts', type: 'read-only-storage', group: 0, location: 0}]
} satisfies ShaderLayout;

const TEXT_SHADER_LAYOUT = {
  attributes: [
    {name: 'positions', location: 0, type: 'vec2<f32>', stepMode: 'instance'},
    {name: 'glyphOffsets', location: 1, type: 'vec2<i32>', stepMode: 'instance'},
    {name: 'glyphFrames', location: 2, type: 'vec4<u32>', stepMode: 'instance'},
    {name: 'rowIndices', location: 3, type: 'u32', stepMode: 'instance'},
    {name: 'glyphClipRects', location: 4, type: 'vec4<i32>', stepMode: 'instance'}
  ],
  bindings: []
} satisfies ShaderLayout;

const STORAGE_INDEXED_TEXT_SHADER_LAYOUT = {
  attributes: [
    {name: 'glyphOffsets', location: 0, type: 'vec2<i32>', stepMode: 'instance'},
    {name: 'glyphIndices', location: 1, type: 'vec2<u32>', stepMode: 'instance'},
    {name: 'rowIndices', location: 2, type: 'u32', stepMode: 'instance'}
  ],
  bindings: []
} satisfies ShaderLayout;

const WGSL_SHADER = /* wgsl */ `\
struct TextViewportUniforms {
  cameraOffset : vec2<f32>,
  viewportScale : vec2<f32>,
  glyphWorldScale : f32,
  time : f32,
  clippingEnabled : f32,
};

@group(0) @binding(auto) var<uniform> textViewport : TextViewportUniforms;
@group(0) @binding(auto) var fontAtlasTexture : texture_2d<f32>;
@group(0) @binding(auto) var fontAtlasTextureSampler : sampler;
struct VertexInputs {
  @builtin(vertex_index) vertexIndex : u32,
  @location(0) positions : vec2<f32>,
  @location(1) glyphOffsets : vec2<i32>,
  @location(2) glyphFrames : vec4<u32>,
  @location(3) rowIndices : u32,
  @location(4) glyphClipRects : vec4<i32>,
};

struct FragmentInputs {
  @builtin(position) Position : vec4<f32>,
  @location(0) textureCoordinate : vec2<f32>,
  @location(1) labelTone : f32,
  @interpolate(flat)
  @location(2) objectIndex : i32,
};

struct PickingFragmentOutputs {
  @location(0) fragColor : vec4<f32>,
  @location(1) pickingColor : vec2<i32>,
};

fn getCorner(vertexIndex : u32) -> vec2<f32> {
  if (vertexIndex == 0u) { return vec2<f32>(0.0, 0.0); }
  if (vertexIndex == 1u) { return vec2<f32>(1.0, 0.0); }
  if (vertexIndex == 2u) { return vec2<f32>(1.0, 1.0); }
  if (vertexIndex == 3u) { return vec2<f32>(0.0, 0.0); }
  if (vertexIndex == 4u) { return vec2<f32>(1.0, 1.0); }
  return vec2<f32>(0.0, 1.0);
}

fn isGlyphVertexClipped(glyphVertexOffset : vec2<f32>, clipRect : vec4<i32>) -> bool {
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
fn vertexMain(inputs : VertexInputs) -> FragmentInputs {
  var outputs : FragmentInputs;
  let corner = getCorner(inputs.vertexIndex % 6u);
  let glyphFrame = vec4<f32>(inputs.glyphFrames);
  let glyphOffset = vec2<f32>(inputs.glyphOffsets);
  let glyphSize = glyphFrame.zw;
  let glyphVertexOffset = glyphOffset + corner * glyphSize;
  let glyphWorldOffset = glyphVertexOffset * textViewport.glyphWorldScale;
  let worldPosition = inputs.positions + glyphWorldOffset;
  let clipPosition = (worldPosition - textViewport.cameraOffset) * textViewport.viewportScale;
  let atlasSize = vec2<f32>(textureDimensions(fontAtlasTexture));
  let atlasCorner = vec2<f32>(corner.x, 1.0 - corner.y);
  let atlasPixel = glyphFrame.xy + atlasCorner * glyphSize;

  outputs.Position = select(
    vec4<f32>(clipPosition, 0.0, 1.0),
    vec4<f32>(0.0),
    textViewport.clippingEnabled > 0.5 &&
    isGlyphVertexClipped(glyphVertexOffset, inputs.glyphClipRects)
  );
  outputs.textureCoordinate = atlasPixel / atlasSize;
  outputs.labelTone = 0.5 + 0.5 * sin(inputs.positions.y * 0.016 + textViewport.time * 0.5);
  outputs.objectIndex = i32(inputs.rowIndices);
  return outputs;
}

@fragment
fn fragmentMain(inputs : FragmentInputs) -> @location(0) vec4<f32> {
  let sampledAlpha = textureSample(fontAtlasTexture, fontAtlasTextureSampler, inputs.textureCoordinate).a;
  let glyphAlpha = smoothstep(0.68, 0.82, sampledAlpha);
  let coolText = vec3<f32>(0.62, 0.88, 1.0);
  let warmText = vec3<f32>(1.0, 0.95, 0.72);
  let textColor = mix(coolText, warmText, inputs.labelTone);
  let fragColor = vec4<f32>(textColor, glyphAlpha);
  return picking_filterHighlightColor(fragColor, inputs.objectIndex);
}

@fragment
fn fragmentPicking(inputs : FragmentInputs) -> PickingFragmentOutputs {
  let sampledAlpha = textureSample(fontAtlasTexture, fontAtlasTextureSampler, inputs.textureCoordinate).a;
  if (sampledAlpha <= 0.68) {
    discard;
  }
  var outputs : PickingFragmentOutputs;
  outputs.fragColor = vec4<f32>(0.0, 0.0, 0.0, 0.0);
  outputs.pickingColor = picking_getPickingColor(inputs.objectIndex);
  return outputs;
}
`;

const STORAGE_INDEXED_WGSL_SHADER = /* wgsl */ `\
struct TextViewportUniforms {
  cameraOffset : vec2<f32>,
  viewportScale : vec2<f32>,
  glyphWorldScale : f32,
  time : f32,
  clippingEnabled : f32,
};

@group(0) @binding(auto) var<uniform> textViewport : TextViewportUniforms;
@group(0) @binding(auto) var fontAtlasTexture : texture_2d<f32>;
@group(0) @binding(auto) var fontAtlasTextureSampler : sampler;
@group(0) @binding(auto) var<storage, read> textRowPositions : array<vec2<f32>>;
@group(0) @binding(auto) var<storage, read> textRowColors : array<u32>;
@group(0) @binding(auto) var<storage, read> textRowAngles : array<f32>;
@group(0) @binding(auto) var<storage, read> textRowSizes : array<f32>;
@group(0) @binding(auto) var<storage, read> textRowPixelOffsets : array<vec2<f32>>;
@group(0) @binding(auto) var<storage, read> textRowClipRects : array<vec2<u32>>;
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
  _padding : u32,
};

@group(0) @binding(auto) var<uniform> textStorageStyleConfig : TextStorageStyleConfig;

struct VertexInputs {
  @builtin(vertex_index) vertexIndex : u32,
  @location(0) glyphOffsets : vec2<i32>,
  @location(1) glyphIndices : vec2<u32>,
  @location(2) rowIndices : u32,
};

struct FragmentInputs {
  @builtin(position) Position : vec4<f32>,
  @location(0) textureCoordinate : vec2<f32>,
  @location(1) textColor : vec4<f32>,
  @interpolate(flat)
  @location(2) objectIndex : i32,
};

struct PickingFragmentOutputs {
  @location(0) fragColor : vec4<f32>,
  @location(1) pickingColor : vec2<i32>,
};

fn getCorner(vertexIndex : u32) -> vec2<f32> {
  if (vertexIndex == 0u) { return vec2<f32>(0.0, 0.0); }
  if (vertexIndex == 1u) { return vec2<f32>(1.0, 0.0); }
  if (vertexIndex == 2u) { return vec2<f32>(1.0, 1.0); }
  if (vertexIndex == 3u) { return vec2<f32>(0.0, 0.0); }
  if (vertexIndex == 4u) { return vec2<f32>(1.0, 1.0); }
  return vec2<f32>(0.0, 1.0);
}

fn unpackLowInt16(word : u32) -> i32 {
  return i32(word << 16u) >> 16;
}

fn unpackHighInt16(word : u32) -> i32 {
  return i32(word) >> 16;
}

fn unpackClipRect(words : vec2<u32>) -> vec4<i32> {
  return vec4<i32>(
    unpackLowInt16(words.x),
    unpackHighInt16(words.x),
    unpackLowInt16(words.y),
    unpackHighInt16(words.y)
  );
}

fn isGlyphVertexClipped(glyphVertexOffset : vec2<f32>, clipRect : vec4<i32>) -> bool {
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

fn unpackTextColor(colorWord : u32) -> vec4<f32> {
  return vec4<f32>(
    f32(colorWord & 0xffu),
    f32((colorWord >> 8u) & 0xffu),
    f32((colorWord >> 16u) & 0xffu),
    f32((colorWord >> 24u) & 0xffu)
  ) / 255.0;
}

fn rotateTextOffset(offset : vec2<f32>, angleDegrees : f32) -> vec2<f32> {
  let angleRadians = angleDegrees * 0.017453292519943295;
  let rotation = mat2x2<f32>(
    cos(angleRadians),
    sin(angleRadians),
    -sin(angleRadians),
    cos(angleRadians)
  );
  return rotation * offset;
}

@vertex
fn vertexMain(inputs : VertexInputs) -> FragmentInputs {
  var outputs : FragmentInputs;
  let corner = getCorner(inputs.vertexIndex % 6u);
  let glyphFrame = textGlyphFrames[inputs.glyphIndices.x];
  let glyphOffset = vec2<f32>(inputs.glyphOffsets);
  let glyphSize = glyphFrame.zw;
  let glyphVertexOffset = glyphOffset + corner * glyphSize;
  let rowIndex = inputs.rowIndices - textStorageStyleConfig.batchRowIndexBase;
  var angleDegrees = textStorageStyleConfig.constantAngleDegrees;
  if (textStorageStyleConfig.useRowAngles != 0u) {
    angleDegrees = textRowAngles[rowIndex];
  }
  var textSize = textStorageStyleConfig.constantSize;
  if (textStorageStyleConfig.useRowSizes != 0u) {
    textSize = textRowSizes[rowIndex];
  }
  let styledGlyphVertexOffset = rotateTextOffset(
    glyphVertexOffset * (textSize / 32.0),
    angleDegrees
  );
  var pixelOffset = textStorageStyleConfig.constantPixelOffset;
  if (textStorageStyleConfig.useRowPixelOffsets != 0u) {
    pixelOffset = textRowPixelOffsets[rowIndex];
  }
  let glyphWorldOffset =
    (styledGlyphVertexOffset + pixelOffset) * textViewport.glyphWorldScale;
  let labelPosition = textRowPositions[rowIndex];
  let worldPosition = labelPosition + glyphWorldOffset;
  let clipPosition = (worldPosition - textViewport.cameraOffset) * textViewport.viewportScale;
  let atlasSize = vec2<f32>(textureDimensions(fontAtlasTexture));
  let atlasCorner = vec2<f32>(corner.x, 1.0 - corner.y);
  let atlasPixel = glyphFrame.xy + atlasCorner * glyphSize;
  let clipRect = unpackClipRect(textRowClipRects[rowIndex]);

  outputs.Position = select(
    vec4<f32>(clipPosition, 0.0, 1.0),
    vec4<f32>(0.0),
    textViewport.clippingEnabled > 0.5 &&
    textStorageStyleConfig.hasClipRects != 0u &&
    isGlyphVertexClipped(glyphVertexOffset, clipRect)
  );
  outputs.textureCoordinate = atlasPixel / atlasSize;
  outputs.textColor = textStorageStyleConfig.constantColor;
  if (textStorageStyleConfig.useRowColors != 0u) {
    outputs.textColor = unpackTextColor(textRowColors[rowIndex]);
  }
  outputs.objectIndex = i32(inputs.rowIndices);
  return outputs;
}

@fragment
fn fragmentMain(inputs : FragmentInputs) -> @location(0) vec4<f32> {
  let sampledAlpha = textureSample(fontAtlasTexture, fontAtlasTextureSampler, inputs.textureCoordinate).a;
  let glyphAlpha = smoothstep(0.68, 0.82, sampledAlpha);
  let fragColor = vec4<f32>(inputs.textColor.rgb, inputs.textColor.a * glyphAlpha);
  return picking_filterHighlightColor(fragColor, inputs.objectIndex);
}

@fragment
fn fragmentPicking(inputs : FragmentInputs) -> PickingFragmentOutputs {
  let sampledAlpha = textureSample(fontAtlasTexture, fontAtlasTextureSampler, inputs.textureCoordinate).a;
  if (sampledAlpha <= 0.68) {
    discard;
  }
  var outputs : PickingFragmentOutputs;
  outputs.fragColor = vec4<f32>(0.0, 0.0, 0.0, 0.0);
  outputs.pickingColor = picking_getPickingColor(inputs.objectIndex);
  return outputs;
}
`;

const VS_GLSL = /* glsl */ `\
#version 300 es
precision highp float;
precision highp int;

in vec2 positions;
in ivec2 glyphOffsets;
in uvec4 glyphFrames;
in uint rowIndices;
in ivec4 glyphClipRects;

layout(std140) uniform textViewportUniforms {
  vec2 cameraOffset;
  vec2 viewportScale;
  float glyphWorldScale;
  float time;
  float clippingEnabled;
} textViewport;

uniform sampler2D fontAtlasTexture;
out vec2 vTextureCoordinate;
out float vLabelTone;

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
  picking_setObjectIndex(int(rowIndices));
  vec2 corner = getCorner(gl_VertexID % 6);
  vec4 glyphFrame = vec4(glyphFrames);
  vec2 glyphOffset = vec2(glyphOffsets);
  vec2 glyphSize = glyphFrame.zw;
  vec2 glyphVertexOffset = glyphOffset + corner * glyphSize;
  vec2 glyphWorldOffset = glyphVertexOffset * textViewport.glyphWorldScale;
  vec2 worldPosition = positions + glyphWorldOffset;
  vec2 clipPosition = (worldPosition - textViewport.cameraOffset) * textViewport.viewportScale;
  vec2 atlasSize = vec2(textureSize(fontAtlasTexture, 0));
  vec2 atlasCorner = vec2(corner.x, 1.0 - corner.y);
  vec2 atlasPixel = glyphFrame.xy + atlasCorner * glyphSize;

  gl_Position = textViewport.clippingEnabled > 0.5 &&
    isGlyphVertexClipped(glyphVertexOffset, glyphClipRects)
    ? vec4(0.0)
    : vec4(clipPosition, 0.0, 1.0);
  vTextureCoordinate = atlasPixel / atlasSize;
  vLabelTone = 0.5 + 0.5 * sin(positions.y * 0.016 + textViewport.time * 0.5);
}
`;

const FS_GLSL = /* glsl */ `\
#version 300 es
precision highp float;

uniform sampler2D fontAtlasTexture;

in vec2 vTextureCoordinate;
in float vLabelTone;
out vec4 fragColor;

void main() {
  float sampledAlpha = texture(fontAtlasTexture, vTextureCoordinate).a;
  float glyphAlpha = smoothstep(0.68, 0.82, sampledAlpha);
  vec3 coolText = vec3(0.62, 0.88, 1.0);
  vec3 warmText = vec3(1.0, 0.95, 0.72);
  vec3 textColor = mix(coolText, warmText, vLabelTone);
  fragColor = vec4(textColor, glyphAlpha);
  fragColor = picking_filterColor(fragColor);
}
`;

const PICKING_FS_GLSL = /* glsl */ `\
#version 300 es
precision highp float;
precision highp int;

uniform sampler2D fontAtlasTexture;

in vec2 vTextureCoordinate;
layout(location = 0) out vec4 fragColor;
layout(location = 1) out ivec4 pickingColor;

void main() {
  float sampledAlpha = texture(fontAtlasTexture, vTextureCoordinate).a;
  if (sampledAlpha <= 0.68) {
    discard;
  }
  fragColor = vec4(0.0);
  pickingColor = picking_getPickingColor();
}
`;

type TextViewportUniforms = {
  cameraOffset: [number, number];
  viewportScale: [number, number];
  glyphWorldScale: number;
  time: number;
  clippingEnabled: number;
};

const textViewport: ShaderModule<TextViewportUniforms> = {
  name: 'textViewport',
  uniformTypes: {
    cameraOffset: 'vec2<f32>',
    viewportScale: 'vec2<f32>',
    glyphWorldScale: 'f32',
    time: 'f32',
    clippingEnabled: 'f32'
  }
};

function supportsTextIndexPicking(device: Device): boolean {
  return supportsIndexPicking(device);
}

export default class ArrowText2DAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = `\
  <p>
  Renders <code>arrow.Vector&lt;Utf8&gt;</code>, 30 characters / row.
  </p>
  <style>
    @keyframes arrow-text-2d-streaming-spin {
      to {
        transform: rotate(360deg);
      }
    }
  </style>
  <div style="min-height: 920px; max-height: calc(100vh - 72px); overflow-y: auto; margin-top: 16px; padding: 14px 16px; border: 1px solid rgba(208, 215, 222, 0.9); border-radius: 16px; background: linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(246, 248, 250, 0.96) 100%); box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);">
    <div style="display: grid; grid-template-columns: minmax(56px, auto) minmax(0, 1fr); align-items: center; gap: 10px 12px; margin-bottom: 12px; color: #0f172a; font-size: 15px; font-weight: 600;">
      <label for="${MODEL_SELECTOR_ID}">Model</label>
      <select id="${MODEL_SELECTOR_ID}" style="min-width: 0; min-height: 34px; border: 1px solid rgba(148, 163, 184, 0.8); border-radius: 6px; background: #ffffff; color: #0f172a; font: inherit;">
        <option value="direct">ArrowTextModel</option>
        <option value="storage">ArrowStorageTextModel</option>
      </select>
      <label for="${DATA_SELECTOR_ID}">Data</label>
      <select id="${DATA_SELECTOR_ID}" style="min-width: 0; min-height: 34px; border: 1px solid rgba(148, 163, 184, 0.8); border-radius: 6px; background: #ffffff; color: #0f172a; font: inherit;">
        <option value="100k">${TEXT_DATASETS['100k'].label}</option>
        <option value="500k">${TEXT_DATASETS['500k'].label}</option>
        <option value="1m">${TEXT_DATASETS['1m'].label}</option>
        <option value="100k-stream">${TEXT_DATASETS['100k'].label} streamed</option>
        <option value="500k-stream">${TEXT_DATASETS['500k'].label} streamed</option>
        <option value="1m-stream">${TEXT_DATASETS['1m'].label} streamed</option>
      </select>
    </div>
    <div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px 18px; color: #0f172a; font-size: 15px; font-weight: 600;">
      <label for="${ANIMATE_TOGGLE_ID}" style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
        <input id="${ANIMATE_TOGGLE_ID}" type="checkbox" checked style="width: 18px; height: 18px; margin: 0; accent-color: #2563eb;" />
        <span>Animate</span>
      </label>
      <label for="${CLIPPING_TOGGLE_ID}" style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
        <input id="${CLIPPING_TOGGLE_ID}" type="checkbox" checked style="width: 18px; height: 18px; margin: 0; accent-color: #2563eb;" />
        <span>Clip</span>
      </label>
      <label for="${COLOR_TOGGLE_ID}" style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
        <input id="${COLOR_TOGGLE_ID}" type="checkbox" checked style="width: 18px; height: 18px; margin: 0; accent-color: #2563eb;" />
        <span>Color</span>
      </label>
      <label for="${SIZE_TOGGLE_ID}" style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
        <input id="${SIZE_TOGGLE_ID}" type="checkbox" checked style="width: 18px; height: 18px; margin: 0; accent-color: #2563eb;" />
        <span>Size</span>
      </label>
      <label for="${ANGLE_TOGGLE_ID}" style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
        <input id="${ANGLE_TOGGLE_ID}" type="checkbox" checked style="width: 18px; height: 18px; margin: 0; accent-color: #2563eb;" />
        <span>Angle</span>
      </label>
    </div>
    <div id="${STREAMING_BATCH_STATUS_ROW_ID}" style="display: none; align-items: center; gap: 10px; margin-top: 12px; color: #334155; font-size: 13px; line-height: 1.4;">
      <span id="${STREAMING_BATCH_SPINNER_ID}" aria-hidden="true" style="width: 14px; height: 14px; flex: 0 0 14px; border: 2px solid rgba(148, 163, 184, 0.5); border-top-color: #2563eb; border-radius: 50%; animation: arrow-text-2d-streaming-spin 0.9s linear infinite;"></span>
      <span id="${STREAMING_BATCH_STATUS_LABEL_ID}" aria-live="polite">Loaded 0 of ${STREAMING_TEXT_BATCH_COUNT} batches</span>
    </div>
    <div style="display: flex; justify-content: space-between; gap: 16px; margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(208, 215, 222, 0.9); color: #334155; font-size: 13px; line-height: 1.4;">
      <span>Arrow vector build time</span>
      <strong id="${ARROW_VECTOR_BUILD_TIME_ID}" style="color: #0f172a; font-variant-numeric: tabular-nums;">Measuring...</strong>
    </div>
    <div style="display: flex; justify-content: space-between; gap: 16px; margin-top: 8px; color: #334155; font-size: 13px; line-height: 1.4;">
      <span>CPU attribute/storage generation</span>
      <strong id="${CPU_GENERATION_TIME_ID}" style="color: #0f172a; font-variant-numeric: tabular-nums;">Measuring...</strong>
    </div>
    <div style="display: flex; justify-content: space-between; gap: 16px; margin-top: 8px; color: #334155; font-size: 13px; line-height: 1.4;">
      <span>GPU bytes</span>
      <strong id="${TOTAL_GPU_BYTES_ID}" style="color: #0f172a; font-variant-numeric: tabular-nums;">Measuring...</strong>
    </div>
    <div style="display: flex; justify-content: space-between; gap: 16px; margin-top: 8px; color: #334155; font-size: 13px; line-height: 1.4;">
      <span>GPU Text Attribute Buffers</span>
      <strong id="${GPU_ATTRIBUTE_BYTES_ID}" style="color: #0f172a; font-variant-numeric: tabular-nums;">Measuring...</strong>
    </div>
    <div style="display: flex; justify-content: space-between; gap: 16px; margin-top: 8px; color: #334155; font-size: 13px; line-height: 1.4;">
      <span>GPU Text Storage Buffers</span>
      <strong id="${GPU_STORAGE_BYTES_ID}" style="color: #0f172a; font-variant-numeric: tabular-nums;">Measuring...</strong>
    </div>
    <div style="display: flex; justify-content: space-between; gap: 16px; margin-top: 8px; color: #334155; font-size: 13px; line-height: 1.4;">
      <span>GPU Style Storage Buffers</span>
      <strong id="${GPU_STYLE_VECTOR_BYTES_ID}" style="color: #0f172a; font-variant-numeric: tabular-nums;">Measuring...</strong>
    </div>
    <div id="${GPU_COMPUTE_ROW_ID}" style="display: none; justify-content: space-between; gap: 16px; margin-top: 8px; color: #334155; font-size: 13px; line-height: 1.4;">
      <span>GPU Compute</span>
      <strong id="${GPU_COMPUTE_BYTES_ID}" style="color: #0f172a; font-variant-numeric: tabular-nums;">Measuring...</strong>
    </div>
    <div style="display: flex; justify-content: space-between; gap: 16px; margin-top: 8px; color: #334155; font-size: 13px; line-height: 1.4;">
      <span>GPU attributes (deck.gl)</span>
      <strong id="${DECK_ATTRIBUTE_SIZE_ID}" style="color: #0f172a; font-variant-numeric: tabular-nums;">Measuring...</strong>
    </div>
    <div style="display: flex; justify-content: space-between; gap: 16px; margin-top: 8px; color: #334155; font-size: 13px; line-height: 1.4;">
      <span>Picked Arrow row</span>
      <strong id="${PICKED_LABEL_ID}" style="max-width: 220px; overflow-wrap: anywhere; color: #0f172a; font-variant-numeric: tabular-nums;">Hover text</strong>
    </div>
    <details style="margin-top: 14px; border-top: 1px solid rgba(208, 215, 222, 0.9); padding-top: 10px; color: #334155; font-size: 12px; line-height: 1.4;">
      <summary style="cursor: pointer; color: #0f172a; font-weight: 700;">Scope notes</summary>
      <table style="width: 100%; margin-top: 10px; border-collapse: collapse; color: #334155; font-size: 12px; line-height: 1.4;">
      <thead>
        <tr style="border-top: 1px solid rgba(208, 215, 222, 0.9); border-bottom: 1px solid rgba(208, 215, 222, 0.9); color: #0f172a;">
          <th style="padding: 8px 0; text-align: left; font-weight: 700;">Not implemented yet</th>
          <th style="padding: 8px 0; text-align: left; font-weight: 700;">Current Arrow renderer scope</th>
        </tr>
      </thead>
      <tbody>
        <tr style="border-bottom: 1px solid rgba(226, 232, 240, 0.9);">
          <td style="padding: 7px 0;">Multiline layout and wrapping</td>
          <td style="padding: 7px 0;">One-line labels only</td>
        </tr>
        <tr style="border-bottom: 1px solid rgba(226, 232, 240, 0.9);">
          <td style="padding: 7px 0;">Per-label size, angle, and pixel offset</td>
          <td style="padding: 7px 0;">Shared visual styling in the demo shader</td>
        </tr>
        <tr style="border-bottom: 1px solid rgba(226, 232, 240, 0.9);">
          <td style="padding: 7px 0;">Per-label colors</td>
          <td style="padding: 7px 0;">Indexed picking maps glyphs back to Arrow label rows</td>
        </tr>
        <tr style="border-bottom: 1px solid rgba(226, 232, 240, 0.9);">
          <td style="padding: 7px 0;">Content alignment modes</td>
          <td style="padding: 7px 0;">Packed i16x4 clip rectangles; no scroll alignment yet</td>
        </tr>
        <tr>
          <td style="padding: 7px 0;">Text backgrounds and outlines</td>
          <td style="padding: 7px 0;">Atlas-backed glyph rendering only</td>
        </tr>
      </tbody>
      </table>
    </details>
  </div>
  `;

  static props = {createFramebuffer: true, useDevicePixels: true};

  readonly shaderInputs = new ShaderInputs<{
    textViewport: typeof textViewport.props;
    picking: typeof picking.props;
  }>({textViewport, picking});
  readonly device: Device;
  readonly textInputs: Partial<Record<EagerTextDatasetKind, ArrowTextInput>> = {};
  readonly textInputPromises: Partial<Record<EagerTextDatasetKind, Promise<ArrowTextInput>>> = {};
  positions!: GPUVector<arrow.FixedSizeList<arrow.Float32>>;
  texts!: GPUVector<arrow.Utf8>;
  clipRects!: GPUVector<arrow.FixedSizeList<arrow.Int16>>;
  colors!: GPUVector<arrow.FixedSizeList<arrow.Uint8>>;
  angles!: GPUVector<arrow.Float32>;
  sizes!: GPUVector<arrow.Float32>;
  textModel!: ActiveTextModel;
  pickingModel: Model | null = null;
  picker: PickingManager | null = null;
  textModelKind: TextModelKind = 'direct';
  textDatasetKind: TextDatasetKind = '100k';
  arrowVectorBuildTimeMs = 0;
  activeStreamingTextTable: GPUTable | null = null;
  streamingSessionVersion = 0;
  animate = true;
  clippingEnabled = true;
  colorEnabled = true;
  sizeEnabled = true;
  angleEnabled = true;
  isFinalized = false;
  animationSeconds = 0;
  lastRenderSeconds: number | null = null;
  animateToggle: HTMLInputElement | null = null;
  clippingToggle: HTMLInputElement | null = null;
  colorToggle: HTMLInputElement | null = null;
  sizeToggle: HTMLInputElement | null = null;
  angleToggle: HTMLInputElement | null = null;
  modelSelector: HTMLSelectElement | null = null;
  dataSelector: HTMLSelectElement | null = null;
  arrowVectorBuildTimeLabel: HTMLElement | null = null;
  cpuGenerationTimeLabel: HTMLElement | null = null;
  totalGpuBytesLabel: HTMLElement | null = null;
  gpuAttributeBytesLabel: HTMLElement | null = null;
  gpuStorageBytesLabel: HTMLElement | null = null;
  gpuStyleVectorBytesLabel: HTMLElement | null = null;
  gpuComputeBytesLabel: HTMLElement | null = null;
  deckAttributeSizeLabel: HTMLElement | null = null;
  pickedLabel: HTMLElement | null = null;
  streamingBatchStatusRow: HTMLElement | null = null;
  streamingBatchSpinner: HTMLElement | null = null;
  streamingBatchStatusLabel: HTMLElement | null = null;

  constructor({device}: AnimationProps) {
    super();
    this.device = device as Device;
  }

  override async onInitialize(): Promise<void> {
    const defaultTextInput = await this.getOrCreateTextInput(this.textDatasetKind);
    if (this.isFinalized) {
      return;
    }
    const {positions, texts, clipRects, colors, angles, sizes} = defaultTextInput;
    this.positions = positions;
    this.texts = texts;
    this.clipRects = clipRects;
    this.colors = colors;
    this.angles = angles;
    this.sizes = sizes;
    this.arrowVectorBuildTimeMs = defaultTextInput.arrowVectorBuildTimeMs;
    this.textModel = this.createTextModel('direct');
    this.pickingModel = supportsTextIndexPicking(this.device)
      ? this.createPickingModel(this.textModel)
      : null;
    this.picker = supportsTextIndexPicking(this.device)
      ? new PickingManager(this.device, {
          shaderInputs: this.shaderInputs,
          mode: 'index',
          onObjectPicked: this.handleObjectPicked
        })
      : null;

    this.initializeModelSelector();
    this.initializeDataSelector();
    this.initializeAnimateToggle();
    this.initializeClippingToggle();
    this.initializeStyleToggles();
    this.initializeAttributeMetricLabels();
    this.initializePickedLabel();
    this.initializeStreamingBatchStatus();

    // Warm larger datasets after the first visible model is ready.
    void this.getOrCreateTextInput('500k');
    void this.getOrCreateTextInput('1m');
  }

  async getOrCreateTextInput(textDatasetKind: EagerTextDatasetKind): Promise<ArrowTextInput> {
    const cachedTextInput = this.textInputs[textDatasetKind];
    if (cachedTextInput) {
      return cachedTextInput;
    }

    const cachedPromise = this.textInputPromises[textDatasetKind];
    if (cachedPromise) {
      return cachedPromise;
    }

    const textInputPromise = makeArrowTextInputAsync(
      this.device,
      TEXT_DATASETS[textDatasetKind]
    ).then(textInput => {
      this.textInputs[textDatasetKind] = textInput;
      delete this.textInputPromises[textDatasetKind];
      if (!this.isFinalized) {
        this.updateDataSelectorAvailability();
      }
      return textInput;
    });
    this.textInputPromises[textDatasetKind] = textInputPromise;
    this.updateDataSelectorAvailability();
    return textInputPromise;
  }

  createTextModel(modelKind: TextModelKind): ActiveTextModel {
    const commonProps: ArrowTextModelProps = {
      id: 'arrow-text-2d',
      positions: this.positions,
      texts: this.texts,
      clipRects: this.clipRects,
      ...(this.colorEnabled ? {colors: this.colors} : {}),
      ...(this.angleEnabled ? {angles: this.angles} : {}),
      ...(this.sizeEnabled ? {sizes: this.sizes} : {}),
      characterSet: CHARACTER_SET,
      fontSettings: {
        fontFamily: 'Monaco, Menlo, monospace',
        fontWeight: '600',
        fontSize: 64,
        buffer: 6,
        sdf: true,
        radius: 12
      },
      source: WGSL_SHADER,
      vs: VS_GLSL,
      fs: FS_GLSL,
      shaderLayout: TEXT_SHADER_LAYOUT,
      shaderInputs: this.shaderInputs,
      // @ts-expect-error Remove once npm package updated with new types
      modules: [supportsTextIndexPicking(this.device) ? indexPicking : indexColorPicking],
      parameters: {
        depthWriteEnabled: false,
        blend: true,
        blendColorOperation: 'add',
        blendAlphaOperation: 'add',
        blendColorSrcFactor: 'src-alpha',
        blendColorDstFactor: 'one-minus-src-alpha',
        blendAlphaSrcFactor: 'one',
        blendAlphaDstFactor: 'one-minus-src-alpha'
      }
    };
    if (modelKind === 'storage') {
      if (this.device.type !== 'webgpu') {
        throw new Error('ArrowStorageTextModel showcase mode requires WebGPU');
      }
      const storageProps: ArrowStorageTextInputProps = {
        id: commonProps.id,
        positions: this.positions,
        texts: this.texts,
        clipRects: this.clipRects,
        ...(this.colorEnabled ? {colors: this.colors} : {}),
        ...(this.angleEnabled ? {angles: this.angles} : {}),
        ...(this.sizeEnabled ? {sizes: this.sizes} : {}),
        color: [210, 232, 255, 255],
        characterSet: commonProps.characterSet,
        fontSettings: commonProps.fontSettings,
        source: STORAGE_INDEXED_WGSL_SHADER,
        shaderLayout: STORAGE_INDEXED_TEXT_SHADER_LAYOUT,
        shaderInputs: commonProps.shaderInputs,
        modules: commonProps.modules,
        parameters: commonProps.parameters
      };
      return new ArrowStorageTextModel(this.device, storageProps);
    }
    return new ArrowTextModel(this.device, commonProps);
  }

  getLabelFieldHeight(): number {
    const datasetKind = getEagerTextDatasetKind(this.textDatasetKind);
    return (TEXT_DATASETS[datasetKind].labelCount / LABEL_COLUMN_COUNT) * LABEL_ROW_SPACING;
  }

  override onRender({device, aspect, time, needsRedraw, _mousePosition}: AnimationProps): void {
    const seconds = time / 1000;
    if (!this.animateToggle) {
      this.initializeAnimateToggle();
    }
    if (!this.modelSelector) {
      this.initializeModelSelector();
    }
    if (!this.dataSelector) {
      this.initializeDataSelector();
    }
    if (!this.clippingToggle) {
      this.initializeClippingToggle();
    }
    if (!this.colorToggle || !this.sizeToggle || !this.angleToggle) {
      this.initializeStyleToggles();
    }
    if (
      !this.arrowVectorBuildTimeLabel ||
      !this.cpuGenerationTimeLabel ||
      !this.totalGpuBytesLabel ||
      !this.gpuAttributeBytesLabel ||
      !this.gpuStorageBytesLabel ||
      !this.gpuStyleVectorBytesLabel ||
      !this.gpuComputeBytesLabel ||
      !this.deckAttributeSizeLabel
    ) {
      this.initializeAttributeMetricLabels();
    }
    if (!this.pickedLabel) {
      this.initializePickedLabel();
    }
    if (
      !this.streamingBatchStatusRow ||
      !this.streamingBatchSpinner ||
      !this.streamingBatchStatusLabel
    ) {
      this.initializeStreamingBatchStatus();
    }
    if (this.lastRenderSeconds === null) {
      this.lastRenderSeconds = seconds;
    }
    const elapsedSeconds = Math.max(seconds - this.lastRenderSeconds, 0);
    this.lastRenderSeconds = seconds;
    if (this.animate) {
      this.animationSeconds += elapsedSeconds;
    }

    const textModelNeedsRedraw = this.textModel.needsRedraw();
    const shouldRenderText = this.animate || Boolean(needsRedraw) || Boolean(textModelNeedsRedraw);
    if (shouldRenderText) {
      const cameraOffsetAmplitudeX = LABEL_FIELD_WIDTH * 0.43;
      const cameraOffsetAmplitudeY = this.getLabelFieldHeight() * 0.38;
      const cameraOffset: [number, number] = [
        Math.sin(this.animationSeconds * (CAMERA_PAN_SPEED_X / cameraOffsetAmplitudeX)) *
          cameraOffsetAmplitudeX,
        Math.cos(this.animationSeconds * (CAMERA_PAN_SPEED_Y / cameraOffsetAmplitudeY)) *
          cameraOffsetAmplitudeY
      ];
      const viewportWidth = VIEW_HEIGHT * Math.max(aspect, 0.2);
      const viewportScale: [number, number] = [2 / viewportWidth, 2 / VIEW_HEIGHT];

      this.shaderInputs.setProps({
        textViewport: {
          cameraOffset,
          viewportScale,
          glyphWorldScale: GLYPH_WORLD_SCALE,
          time: this.animationSeconds,
          clippingEnabled: this.clippingEnabled ? 1 : 0
        }
      });
      this.shaderInputs.setProps({picking: {isActive: false}});

      const renderPass = device.beginRenderPass({
        clearColor: [0.015, 0.035, 0.07, 1]
      });
      this.shaderInputs.setProps({picking: {batchIndex: 0}});
      this.textModel.draw(renderPass);
      renderPass.end();
    }
    this.pickLabel(_mousePosition);
  }

  override onFinalize(): void {
    this.isFinalized = true;
    this.streamingSessionVersion++;
    this.animateToggle?.removeEventListener('change', this.handleAnimateToggle);
    this.clippingToggle?.removeEventListener('change', this.handleClippingToggle);
    this.colorToggle?.removeEventListener('change', this.handleColorToggle);
    this.sizeToggle?.removeEventListener('change', this.handleSizeToggle);
    this.angleToggle?.removeEventListener('change', this.handleAngleToggle);
    this.modelSelector?.removeEventListener('change', this.handleModelSelection);
    this.dataSelector?.removeEventListener('change', this.handleDataSelection);
    this.animateToggle = null;
    this.clippingToggle = null;
    this.colorToggle = null;
    this.sizeToggle = null;
    this.angleToggle = null;
    this.modelSelector = null;
    this.dataSelector = null;
    this.arrowVectorBuildTimeLabel = null;
    this.cpuGenerationTimeLabel = null;
    this.totalGpuBytesLabel = null;
    this.gpuAttributeBytesLabel = null;
    this.gpuStorageBytesLabel = null;
    this.gpuStyleVectorBytesLabel = null;
    this.gpuComputeBytesLabel = null;
    this.deckAttributeSizeLabel = null;
    this.pickedLabel = null;
    this.streamingBatchStatusRow = null;
    this.streamingBatchSpinner = null;
    this.streamingBatchStatusLabel = null;
    this.picker?.destroy();
    this.pickingModel?.destroy();
    this.textModel?.destroy();
    this.activeStreamingTextTable?.destroy();
    this.activeStreamingTextTable = null;
    for (const textInput of Object.values(this.textInputs)) {
      textInput?.positions.destroy();
      textInput?.texts.destroy();
      textInput?.clipRects.destroy();
      textInput?.colors.destroy();
      textInput?.angles.destroy();
      textInput?.sizes.destroy();
    }
  }

  pickLabel(mousePosition: number[] | null | undefined): void {
    if (!this.picker || !this.picker.shouldPick(mousePosition as [number, number] | null)) {
      return;
    }

    const pickingPass = this.picker.beginRenderPass();
    this.shaderInputs.setProps({picking: {batchIndex: 0}});
    if (this.pickingModel && this.textModel instanceof ArrowTextModel) {
      this.drawArrowTextPickingBatches(pickingPass, this.pickingModel, this.textModel);
    } else {
      this.pickingModel?.draw(pickingPass);
    }
    pickingPass.end();
    this.shaderInputs.setProps({picking: {isActive: false}});
    void this.picker.updatePickInfo(mousePosition as [number, number]);
  }

  createPickingModel(textModel: ActiveTextModel): Model {
    const usesStorageState = textModel instanceof ArrowStorageTextModel;
    if (usesStorageState) {
      return new ArrowStorageTextModel(this.device, {
        id: `${textModel.id || 'arrow-text-2d'}-picking`,
        storageState: textModel.storageState,
        source: STORAGE_INDEXED_WGSL_SHADER,
        vs: VS_GLSL,
        fs: PICKING_FS_GLSL,
        fragmentEntryPoint: 'fragmentPicking',
        // @ts-expect-error Remove once npm package updated with new types
        modules: [indexPicking],
        shaderLayout: STORAGE_INDEXED_TEXT_SHADER_LAYOUT,
        shaderInputs: this.shaderInputs,
        colorAttachmentFormats: ['rgba8unorm', 'rg32sint'],
        depthStencilAttachmentFormat: 'depth24plus',
        parameters: {
          depthWriteEnabled: false,
          blend: false
        }
      });
    }

    return new Model(this.device, {
      id: `${textModel.id || 'arrow-text-2d'}-picking`,
      source: WGSL_SHADER,
      vs: VS_GLSL,
      fs: PICKING_FS_GLSL,
      fragmentEntryPoint: 'fragmentPicking',
      // @ts-expect-error Remove once npm package updated with new types
      modules: [indexPicking],
      shaderLayout: TEXT_SHADER_LAYOUT,
      bufferLayout: textModel.bufferLayout,
      attributes: {
        ...textModel.arrowGPUTable!.attributes,
        expandedGlyphVertexData: textModel.expandedGlyphVertexData
      },
      instanceCount: textModel.instanceCount,
      vertexCount: 6,
      bindings: {...textModel.bindings},
      shaderInputs: this.shaderInputs,
      colorAttachmentFormats: ['rgba8unorm', 'rg32sint'],
      depthStencilAttachmentFormat: 'depth24plus',
      parameters: {
        depthWriteEnabled: false,
        blend: false
      }
    });
  }

  drawArrowTextPickingBatches(
    pickingPass: RenderPass,
    pickingModel: Model,
    textModel: ArrowTextModel
  ): void {
    const arrowBatches = textModel.arrowGPUTable?.batches || [];
    for (const [batchIndex, renderBatch] of textModel.renderBatches.entries()) {
      const arrowBatch = arrowBatches[batchIndex];
      if (!arrowBatch) {
        throw new Error('Arrow text picking requires aligned Arrow and glyph render batches');
      }
      pickingModel.setAttributes({
        ...arrowBatch.attributes,
        expandedGlyphVertexData: renderBatch.expandedGlyphVertexData
      });
      pickingModel.setInstanceCount(renderBatch.glyphCount);
      pickingModel.draw(pickingPass);
    }
    pickingModel.setAttributes({
      ...(textModel.arrowGPUTable?.attributes || {}),
      expandedGlyphVertexData: textModel.expandedGlyphVertexData
    });
    pickingModel.setInstanceCount(textModel.glyphLayout.glyphCount);
  }

  initializeModelSelector(): void {
    this.modelSelector = document.getElementById(MODEL_SELECTOR_ID) as HTMLSelectElement | null;
    if (!this.modelSelector) {
      return;
    }
    this.modelSelector.value = this.textModelKind;
    this.modelSelector.disabled = this.device.type !== 'webgpu';
    this.modelSelector.addEventListener('change', this.handleModelSelection);
  }

  handleModelSelection = (event: Event): void => {
    const requestedModelKind = (event.target as HTMLSelectElement).value as TextModelKind;
    const nextModelKind =
      requestedModelKind !== 'direct' && this.device.type === 'webgpu'
        ? requestedModelKind
        : 'direct';
    if (nextModelKind === this.textModelKind) {
      return;
    }

    this.replaceTextModel(nextModelKind, 'text model selector changed');
  };

  initializeDataSelector(): void {
    this.dataSelector = document.getElementById(DATA_SELECTOR_ID) as HTMLSelectElement | null;
    if (!this.dataSelector) {
      return;
    }
    this.dataSelector.value = this.textDatasetKind;
    this.updateDataSelectorAvailability();
    this.dataSelector.addEventListener('change', this.handleDataSelection);
  }

  updateDataSelectorAvailability(): void {
    if (!this.dataSelector) {
      return;
    }

    for (const option of Array.from(this.dataSelector.options)) {
      option.disabled = false;
    }
  }

  handleDataSelection = async (event: Event): Promise<void> => {
    const nextDatasetKind = (event.target as HTMLSelectElement).value as TextDatasetKind;
    if (nextDatasetKind === this.textDatasetKind || !isTextDatasetKind(nextDatasetKind)) {
      return;
    }

    const previousStreamingTable = this.activeStreamingTextTable;
    const streamingSessionVersion = ++this.streamingSessionVersion;
    if (isStreamingTextDatasetKind(nextDatasetKind)) {
      await this.startStreamingTextDataset(
        nextDatasetKind,
        streamingSessionVersion,
        previousStreamingTable
      );
      return;
    }

    const nextTextInput = await this.getOrCreateTextInput(nextDatasetKind);
    if (this.isFinalized) {
      return;
    }
    this.textDatasetKind = nextDatasetKind;
    const {positions, texts, clipRects, colors, angles, sizes} = nextTextInput;
    this.positions = positions;
    this.texts = texts;
    this.clipRects = clipRects;
    this.colors = colors;
    this.angles = angles;
    this.sizes = sizes;
    this.arrowVectorBuildTimeMs = nextTextInput.arrowVectorBuildTimeMs;
    this.activeStreamingTextTable = null;
    this.updateStreamingBatchStatus(null);
    this.replaceTextModel(this.textModelKind, 'text dataset selector changed');
    previousStreamingTable?.destroy();
  };

  async startStreamingTextDataset(
    textDatasetKind: StreamingTextDatasetKind,
    streamingSessionVersion: number,
    previousStreamingTable: GPUTable | null
  ): Promise<void> {
    const streamingSource = await makeStreamingArrowTextSourceAsync(
      TEXT_DATASETS[getEagerTextDatasetKind(textDatasetKind)]
    );
    if (this.isFinalized || streamingSessionVersion !== this.streamingSessionVersion) {
      return;
    }

    const recordBatchIterator = createStreamingRecordBatchIterator(streamingSource.recordBatches)[
      Symbol.asyncIterator
    ]();
    const firstRecordBatchResult = await recordBatchIterator.next();
    if (
      this.isFinalized ||
      streamingSessionVersion !== this.streamingSessionVersion ||
      firstRecordBatchResult.done
    ) {
      return;
    }

    const streamingTextTable = new GPUTable(
      this.device,
      new arrow.Table([firstRecordBatchResult.value]),
      {
        shaderLayout: STREAMING_TEXT_INPUT_SHADER_LAYOUT
      }
    );

    const streamingTextInput = makeArrowTextInputFromGpuTable(
      streamingTextTable,
      streamingSource.arrowVectorBuildTimeMs
    );
    this.textDatasetKind = textDatasetKind;
    this.positions = streamingTextInput.positions;
    this.texts = streamingTextInput.texts;
    this.clipRects = streamingTextInput.clipRects;
    this.colors = streamingTextInput.colors;
    this.angles = streamingTextInput.angles;
    this.sizes = streamingTextInput.sizes;
    this.arrowVectorBuildTimeMs = streamingTextInput.arrowVectorBuildTimeMs;
    this.activeStreamingTextTable = streamingTextTable;
    this.updateStreamingBatchStatus(streamingTextTable.batches.length);
    this.replaceTextModel(this.textModelKind, 'streaming text dataset started');
    previousStreamingTable?.destroy();

    void this.consumeStreamingRecordBatches(
      recordBatchIterator,
      streamingTextTable,
      streamingSessionVersion
    );
  }

  async consumeStreamingRecordBatches(
    recordBatchIterator: AsyncIterator<arrow.RecordBatch>,
    streamingTextTable: GPUTable,
    streamingSessionVersion: number
  ): Promise<void> {
    for (
      let recordBatchResult = await recordBatchIterator.next();
      !recordBatchResult.done;
      recordBatchResult = await recordBatchIterator.next()
    ) {
      if (
        this.isFinalized ||
        streamingSessionVersion !== this.streamingSessionVersion ||
        this.activeStreamingTextTable !== streamingTextTable
      ) {
        return;
      }
      streamingTextTable.addBatch(
        new GPURecordBatch(this.device, recordBatchResult.value, {
          shaderLayout: STREAMING_TEXT_INPUT_SHADER_LAYOUT
        })
      );
      const streamingTextInput = makeArrowTextInputFromGpuTable(
        streamingTextTable,
        this.arrowVectorBuildTimeMs
      );
      this.refreshStreamingTextModel(streamingTextInput, 'streaming Arrow record batch appended');
      this.updateStreamingBatchStatus(streamingTextTable.batches.length);
    }
  }

  refreshStreamingTextModel(streamingTextInput: ArrowTextInput, redrawReason: string): void {
    this.positions = streamingTextInput.positions;
    this.texts = streamingTextInput.texts;
    this.clipRects = streamingTextInput.clipRects;
    this.colors = streamingTextInput.colors;
    this.angles = streamingTextInput.angles;
    this.sizes = streamingTextInput.sizes;
    const appendedTextProps = {
      positions: this.positions,
      texts: this.texts,
      clipRects: this.clipRects,
      ...(this.colorEnabled ? {colors: this.colors} : {}),
      ...(this.angleEnabled ? {angles: this.angles} : {}),
      ...(this.sizeEnabled ? {sizes: this.sizes} : {})
    };
    this.textModel.appendTextBatches(appendedTextProps);
    this.pickingModel?.destroy();
    this.pickingModel = supportsTextIndexPicking(this.device)
      ? this.createPickingModel(this.textModel)
      : null;
    this.picker?.clearPickState();
    this.textModel.setNeedsRedraw(redrawReason);
    this.initializeAttributeMetricLabels();
  }

  replaceTextModel(nextModelKind: TextModelKind, redrawReason: string): void {
    const previousTextModel = this.textModel;
    const previousPickingModel = this.pickingModel;
    this.textModel = this.createTextModel(nextModelKind);
    this.pickingModel = supportsTextIndexPicking(this.device)
      ? this.createPickingModel(this.textModel)
      : null;
    this.textModelKind = nextModelKind;
    previousPickingModel?.destroy();
    previousTextModel.destroy();
    this.picker?.clearPickState();
    this.textModel.setNeedsRedraw(redrawReason);
    if (this.pickedLabel) {
      this.pickedLabel.textContent = 'Hover text';
    }
    this.initializeAttributeMetricLabels();
  }

  initializeAnimateToggle(): void {
    this.animateToggle = initializeCheckboxToggle(
      ANIMATE_TOGGLE_ID,
      this.animate,
      this.handleAnimateToggle
    );
  }

  handleAnimateToggle = (event: Event): void => {
    this.animate = (event.target as HTMLInputElement).checked;
  };

  initializeClippingToggle(): void {
    this.clippingToggle = initializeCheckboxToggle(
      CLIPPING_TOGGLE_ID,
      this.clippingEnabled,
      this.handleClippingToggle
    );
  }

  handleClippingToggle = (event: Event): void => {
    this.clippingEnabled = (event.target as HTMLInputElement).checked;
    this.textModel.setNeedsRedraw('text clipping toggled');
  };

  initializeStyleToggles(): void {
    this.colorToggle = initializeCheckboxToggle(
      COLOR_TOGGLE_ID,
      this.colorEnabled,
      this.handleColorToggle
    );
    this.sizeToggle = initializeCheckboxToggle(
      SIZE_TOGGLE_ID,
      this.sizeEnabled,
      this.handleSizeToggle
    );
    this.angleToggle = initializeCheckboxToggle(
      ANGLE_TOGGLE_ID,
      this.angleEnabled,
      this.handleAngleToggle
    );
  }

  handleColorToggle = (event: Event): void => {
    this.colorEnabled = (event.target as HTMLInputElement).checked;
    this.rebuildStorageStyleModel('text row colors toggled');
  };

  handleSizeToggle = (event: Event): void => {
    this.sizeEnabled = (event.target as HTMLInputElement).checked;
    this.rebuildStorageStyleModel('text row sizes toggled');
  };

  handleAngleToggle = (event: Event): void => {
    this.angleEnabled = (event.target as HTMLInputElement).checked;
    this.rebuildStorageStyleModel('text row angles toggled');
  };

  rebuildStorageStyleModel(redrawReason: string): void {
    if (this.textModelKind === 'storage') {
      this.replaceTextModel(this.textModelKind, redrawReason);
      return;
    }
    this.textModel.setNeedsRedraw(redrawReason);
  }

  initializeAttributeMetricLabels(): void {
    const rowStorageByteLength =
      this.textModel instanceof ArrowStorageTextModel ? this.textModel.rowStorageByteLength : 0;
    const glyphDefinitionStorageByteLength =
      this.textModel instanceof ArrowStorageTextModel
        ? this.textModel.glyphDefinitionStorageByteLength
        : 0;
    const transientComputeInputByteLength =
      this.textModel instanceof ArrowStorageTextModel
        ? this.textModel.transientComputeInputByteLength
        : 0;
    const sharedStorageByteLength = rowStorageByteLength + glyphDefinitionStorageByteLength;
    const steadyStateGpuByteLength =
      this.textModel.glyphAttributeByteLength + sharedStorageByteLength;
    const peakTextPathGpuByteLength = steadyStateGpuByteLength + transientComputeInputByteLength;
    this.arrowVectorBuildTimeLabel = initializeMetricTimeLabel(
      ARROW_VECTOR_BUILD_TIME_ID,
      this.arrowVectorBuildTimeMs
    );
    this.cpuGenerationTimeLabel = initializeMetricTimeLabel(
      CPU_GENERATION_TIME_ID,
      this.textModel.glyphAttributeBuildTimeMs
    );
    this.totalGpuBytesLabel = initializeTextLabel(
      TOTAL_GPU_BYTES_ID,
      transientComputeInputByteLength > 0
        ? `${formatByteLength(steadyStateGpuByteLength)} steady / ${formatByteLength(peakTextPathGpuByteLength)} peak`
        : formatByteLength(steadyStateGpuByteLength)
    );
    this.gpuAttributeBytesLabel = initializeAttributeSizeLabel(
      GPU_ATTRIBUTE_BYTES_ID,
      this.textModel.glyphAttributeByteLength
    );
    this.gpuStorageBytesLabel = initializeAttributeSizeLabel(
      GPU_STORAGE_BYTES_ID,
      sharedStorageByteLength
    );
    this.gpuStyleVectorBytesLabel = initializeAttributeSizeLabel(
      GPU_STYLE_VECTOR_BYTES_ID,
      this.getSelectedStorageStyleVectorByteLength()
    );
    setMetricRowVisible(GPU_COMPUTE_ROW_ID, this.textModel instanceof ArrowStorageTextModel);
    this.gpuComputeBytesLabel = initializeTextLabel(
      GPU_COMPUTE_BYTES_ID,
      `${formatByteLength(transientComputeInputByteLength)} transient`
    );
    this.deckAttributeSizeLabel = initializeAttributeSizeLabel(
      DECK_ATTRIBUTE_SIZE_ID,
      getTextModelGlyphCount(this.textModel) * DECK_CHARACTER_ATTRIBUTE_BYTES_PER_GLYPH
    );
  }

  initializePickedLabel(): void {
    this.pickedLabel = document.getElementById(PICKED_LABEL_ID);
  }

  initializeStreamingBatchStatus(): void {
    this.streamingBatchStatusRow = document.getElementById(STREAMING_BATCH_STATUS_ROW_ID);
    this.streamingBatchSpinner = document.getElementById(STREAMING_BATCH_SPINNER_ID);
    this.streamingBatchStatusLabel = document.getElementById(STREAMING_BATCH_STATUS_LABEL_ID);
    this.applyStreamingBatchStatus(this.activeStreamingTextTable?.batches.length ?? null);
  }

  updateStreamingBatchStatus(loadedBatchCount: number | null): void {
    if (
      !this.streamingBatchStatusRow ||
      !this.streamingBatchSpinner ||
      !this.streamingBatchStatusLabel
    ) {
      this.initializeStreamingBatchStatus();
    }
    this.applyStreamingBatchStatus(loadedBatchCount);
  }

  applyStreamingBatchStatus(loadedBatchCount: number | null): void {
    if (
      !this.streamingBatchStatusRow ||
      !this.streamingBatchSpinner ||
      !this.streamingBatchStatusLabel
    ) {
      return;
    }

    if (loadedBatchCount === null || !isStreamingTextDatasetKind(this.textDatasetKind)) {
      this.streamingBatchStatusRow.style.display = 'none';
      this.streamingBatchStatusLabel.textContent = `Loaded 0 of ${STREAMING_TEXT_BATCH_COUNT} batches`;
      this.streamingBatchSpinner.style.visibility = 'visible';
      return;
    }

    const safeLoadedBatchCount = Math.min(
      STREAMING_TEXT_BATCH_COUNT,
      Math.max(0, Math.trunc(loadedBatchCount))
    );
    this.streamingBatchStatusRow.style.display = 'flex';
    this.streamingBatchStatusLabel.textContent = `Loaded ${safeLoadedBatchCount} of ${STREAMING_TEXT_BATCH_COUNT} batches`;
    this.streamingBatchSpinner.style.visibility =
      safeLoadedBatchCount < STREAMING_TEXT_BATCH_COUNT ? 'visible' : 'hidden';
  }

  getSelectedStorageStyleVectorByteLength(): number {
    if (!(this.textModel instanceof ArrowStorageTextModel)) {
      return 0;
    }

    return (
      (this.colorEnabled ? getGpuVectorByteLength(this.colors) : 0) +
      (this.angleEnabled ? getGpuVectorByteLength(this.angles) : 0) +
      (this.sizeEnabled ? getGpuVectorByteLength(this.sizes) : 0)
    );
  }

  handleObjectPicked = ({
    batchIndex,
    objectIndex
  }: {
    batchIndex: number | null;
    objectIndex: number | null;
  }): void => {
    this.textModel.setNeedsRedraw('picked Arrow row changed');
    if (!this.pickedLabel) {
      this.initializePickedLabel();
    }
    if (!this.pickedLabel || batchIndex === null || objectIndex === null) {
      if (this.pickedLabel) {
        this.pickedLabel.textContent = 'Hover text';
      }
      return;
    }
    this.pickedLabel.textContent = `row ${objectIndex.toLocaleString()}`;
  };
}

function makeArrowTextInput(device: Device, dataset: TextDataset): ArrowTextInput {
  const labelRowCount = dataset.labelCount / LABEL_COLUMN_COUNT;
  const centerColumn = (LABEL_COLUMN_COUNT - 1) / 2;
  const centerRow = (labelRowCount - 1) / 2;
  const positions = new Float32Array(dataset.labelCount * 2);
  const clipRects = new Int16Array(dataset.labelCount * 4);
  const colors = new Uint8Array(dataset.labelCount * 4);
  const angles = new Float32Array(dataset.labelCount);
  const sizes = new Float32Array(dataset.labelCount);
  const labels = new Array<string>(dataset.labelCount);
  let positionIndex = 0;
  let clipRectIndex = 0;
  let colorIndex = 0;

  for (let labelIndex = 0; labelIndex < dataset.labelCount; labelIndex++) {
    const columnIndex = labelIndex % LABEL_COLUMN_COUNT;
    const rowIndex = Math.floor(labelIndex / LABEL_COLUMN_COUNT);
    positions[positionIndex++] = (columnIndex - centerColumn) * LABEL_COLUMN_SPACING;
    positions[positionIndex++] = (rowIndex - centerRow) * LABEL_ROW_SPACING;
    clipRects[clipRectIndex++] = 0;
    clipRects[clipRectIndex++] = 0;
    clipRects[clipRectIndex++] = LABEL_CLIP_WIDTH;
    clipRects[clipRectIndex++] = -1;
    colors[colorIndex++] = 96 + ((labelIndex * 17) % 128);
    colors[colorIndex++] = 172 + ((labelIndex * 11) % 72);
    colors[colorIndex++] = 210 + ((labelIndex * 7) % 45);
    colors[colorIndex++] = 255;
    angles[labelIndex] = ((labelIndex % 9) - 4) * 2;
    sizes[labelIndex] = 24 + (labelIndex % 5) * 4;
    labels[labelIndex] = `NODE ${String(labelIndex).padStart(6, '0')} / ARROW TEXT VECTOR`;
  }

  const arrowVectorBuildStartTime = getNow();
  const positionVector = makeArrowFixedSizeListVector(new arrow.Float32(), 2, positions);
  const texts = arrow.vectorFromArray(labels, new arrow.Utf8());
  const clipRectVector = makeArrowFixedSizeListVector(new arrow.Int16(), 4, clipRects);
  const colorVector = makeArrowFixedSizeListVector(new arrow.Uint8(), 4, colors);
  const angleVector = makeFloat32ArrowVector(angles);
  const sizeVector = makeFloat32ArrowVector(sizes);
  const positionsGpuVector = new GPUVector({
    device,
    name: 'positions',
    vector: positionVector
  });

  return {
    positions: positionsGpuVector,
    texts: new GPUVector({
      device,
      name: 'texts',
      vector: texts
    }),
    clipRects: new GPUVector({
      device,
      name: 'clipRects',
      vector: clipRectVector
    }),
    colors: new GPUVector({
      device,
      name: 'colors',
      vector: colorVector
    }),
    angles: new GPUVector({
      device,
      name: 'angles',
      vector: angleVector
    }),
    sizes: new GPUVector({
      device,
      name: 'sizes',
      vector: sizeVector
    }),
    arrowVectorBuildTimeMs: getNow() - arrowVectorBuildStartTime
  };
}

async function makeArrowTextInputAsync(
  device: Device,
  dataset: TextDataset
): Promise<ArrowTextInput> {
  await waitForBrowserPaint();
  return makeArrowTextInput(device, dataset);
}

async function makeStreamingArrowTextSourceAsync(
  dataset: TextDataset
): Promise<StreamingArrowTextSource> {
  await waitForBrowserPaint();
  return makeStreamingArrowTextSource(dataset);
}

function makeStreamingArrowTextSource(dataset: TextDataset): StreamingArrowTextSource {
  const arrowVectorBuildStartTime = getNow();
  const recordBatches = new Array<arrow.RecordBatch>(STREAMING_TEXT_BATCH_COUNT);
  const labelRowCount = dataset.labelCount / LABEL_COLUMN_COUNT;
  const centerColumn = (LABEL_COLUMN_COUNT - 1) / 2;
  const centerRow = (labelRowCount - 1) / 2;

  for (let batchIndex = 0; batchIndex < STREAMING_TEXT_BATCH_COUNT; batchIndex++) {
    const batchRowIndices = getStreamingTextBatchRowIndices(labelRowCount, batchIndex);
    const batchLabelCount = batchRowIndices.length * LABEL_COLUMN_COUNT;
    const positions = new Float32Array(batchLabelCount * 2);
    const clipRects = new Int16Array(batchLabelCount * 4);
    const colors = new Uint8Array(batchLabelCount * 4);
    const angles = new Float32Array(batchLabelCount);
    const sizes = new Float32Array(batchLabelCount);
    const labels = new Array<string>(batchLabelCount);

    for (let localLabelIndex = 0; localLabelIndex < batchLabelCount; localLabelIndex++) {
      const localRowIndex = Math.floor(localLabelIndex / LABEL_COLUMN_COUNT);
      const columnIndex = localLabelIndex % LABEL_COLUMN_COUNT;
      const rowIndex = batchRowIndices[localRowIndex];
      const labelIndex = rowIndex * LABEL_COLUMN_COUNT + columnIndex;
      const positionIndex = localLabelIndex * 2;
      const clipRectIndex = localLabelIndex * 4;
      const colorIndex = localLabelIndex * 4;

      positions[positionIndex] = (columnIndex - centerColumn) * LABEL_COLUMN_SPACING;
      positions[positionIndex + 1] = (rowIndex - centerRow) * LABEL_ROW_SPACING;
      clipRects[clipRectIndex] = 0;
      clipRects[clipRectIndex + 1] = 0;
      clipRects[clipRectIndex + 2] = LABEL_CLIP_WIDTH;
      clipRects[clipRectIndex + 3] = -1;
      colors[colorIndex] = 96 + ((labelIndex * 17) % 128);
      colors[colorIndex + 1] = 172 + ((labelIndex * 11) % 72);
      colors[colorIndex + 2] = 210 + ((labelIndex * 7) % 45);
      colors[colorIndex + 3] = 255;
      angles[localLabelIndex] = ((labelIndex % 9) - 4) * 2;
      sizes[localLabelIndex] = 24 + (labelIndex % 5) * 4;
      labels[localLabelIndex] = `NODE ${String(labelIndex).padStart(6, '0')} / ARROW TEXT VECTOR`;
    }

    const table = new arrow.Table({
      positions: makeArrowFixedSizeListVector(new arrow.Float32(), 2, positions),
      texts: arrow.vectorFromArray(labels, new arrow.Utf8()),
      clipRects: makeArrowFixedSizeListVector(new arrow.Int16(), 4, clipRects),
      colors: makeArrowFixedSizeListVector(new arrow.Uint8(), 4, colors),
      angles: makeFloat32ArrowVector(angles),
      sizes: makeFloat32ArrowVector(sizes)
    });
    const recordBatch = table.batches[0];
    if (!recordBatch) {
      throw new Error('Streaming Arrow text source requires non-empty record batches');
    }
    recordBatches[batchIndex] = recordBatch;
  }

  return {
    recordBatches,
    arrowVectorBuildTimeMs: getNow() - arrowVectorBuildStartTime
  };
}

function makeArrowTextInputFromGpuTable(
  gpuTable: GPUTable,
  arrowVectorBuildTimeMs: number
): ArrowTextInput {
  return {
    positions: getGpuTableTextVector<arrow.FixedSizeList<arrow.Float32>>(gpuTable, 'positions'),
    texts: getGpuTableTextVector<arrow.Utf8>(gpuTable, 'texts'),
    clipRects: getGpuTableTextVector<arrow.FixedSizeList<arrow.Int16>>(gpuTable, 'clipRects'),
    colors: getGpuTableTextVector<arrow.FixedSizeList<arrow.Uint8>>(gpuTable, 'colors'),
    angles: getGpuTableTextVector<arrow.Float32>(gpuTable, 'angles'),
    sizes: getGpuTableTextVector<arrow.Float32>(gpuTable, 'sizes'),
    arrowVectorBuildTimeMs
  };
}

function getGpuTableTextVector<T extends arrow.DataType>(
  gpuTable: GPUTable,
  vectorName: string
): GPUVector<T> {
  const vector = gpuTable.gpuVectors[vectorName];
  if (!vector) {
    throw new Error(`Streaming Arrow text table is missing GPU vector "${vectorName}"`);
  }
  return vector as GPUVector<T>;
}

async function* createStreamingRecordBatchIterator(
  recordBatches: arrow.RecordBatch[]
): AsyncGenerator<arrow.RecordBatch> {
  for (let batchIndex = 0; batchIndex < recordBatches.length; batchIndex++) {
    if (batchIndex > 0) {
      await waitForStreamingBatchDelay();
    }
    const recordBatch = recordBatches[batchIndex];
    if (recordBatch) {
      yield recordBatch;
    }
  }
}

function waitForStreamingBatchDelay(): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, STREAMING_TEXT_BATCH_DELAY_MS);
  });
}

function getStreamingTextBatchRowIndices(rowCount: number, batchIndex: number): number[] {
  const rowIndices: number[] = [];
  for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
    if (rowIndex % STREAMING_TEXT_BATCH_COUNT === batchIndex) {
      rowIndices.push(rowIndex);
    }
  }
  return rowIndices;
}

async function waitForBrowserPaint(): Promise<void> {
  if (typeof requestAnimationFrame !== 'function') {
    await Promise.resolve();
    return;
  }

  await new Promise<void>(resolve => {
    requestAnimationFrame(() => {
      setTimeout(resolve, 0);
    });
  });
}

function initializeCheckboxToggle(
  id: string,
  checked: boolean,
  onChange: (event: Event) => void
): HTMLInputElement | null {
  const checkboxToggle = document.getElementById(id) as HTMLInputElement | null;
  if (!checkboxToggle) {
    return null;
  }

  checkboxToggle.checked = checked;
  checkboxToggle.addEventListener('change', onChange);
  return checkboxToggle;
}

function makeFloat32ArrowVector(values: Float32Array): arrow.Vector<arrow.Float32> {
  return arrow.makeVector(
    arrow.makeData({
      type: new arrow.Float32(),
      length: values.length,
      data: values
    })
  ) as arrow.Vector<arrow.Float32>;
}

function isStreamingTextDatasetKind(value: TextDatasetKind): value is StreamingTextDatasetKind {
  return value.endsWith('-stream');
}

function getEagerTextDatasetKind(value: TextDatasetKind): EagerTextDatasetKind {
  return (
    isStreamingTextDatasetKind(value) ? value.slice(0, -'-stream'.length) : value
  ) as EagerTextDatasetKind;
}

function isTextDatasetKind(value: string): value is TextDatasetKind {
  const eagerDatasetKind = getEagerTextDatasetKind(value as TextDatasetKind);
  return eagerDatasetKind in TEXT_DATASETS;
}

function getTextModelGlyphCount(textModel: ActiveTextModel): number {
  return textModel instanceof ArrowStorageTextModel
    ? textModel.glyphCount
    : textModel.glyphLayout.glyphCount;
}

function getGpuVectorByteLength(vector: GPUVector): number {
  return vector.data.reduce(
    (byteLength, gpuData) => byteLength + gpuData.length * gpuData.byteStride,
    0
  );
}

function initializeMetricTimeLabel(id: string, durationMs: number): HTMLElement | null {
  return initializeTextLabel(id, `${durationMs.toFixed(1)} ms`);
}

function getNow(): number {
  return globalThis.performance?.now() ?? Date.now();
}

function setMetricRowVisible(id: string, visible: boolean): void {
  const metricRow = document.getElementById(id);
  if (metricRow) {
    metricRow.style.display = visible ? 'flex' : 'none';
  }
}

function initializeTextLabel(id: string, value: string): HTMLElement | null {
  const label = document.getElementById(id);
  if (!label) {
    return null;
  }

  label.textContent = value;
  return label;
}

function initializeAttributeSizeLabel(
  id: string,
  glyphAttributeByteLength: number
): HTMLElement | null {
  const attributeSizeLabel = document.getElementById(id);
  if (!attributeSizeLabel) {
    return null;
  }

  attributeSizeLabel.textContent = formatByteLength(glyphAttributeByteLength);
  return attributeSizeLabel;
}

function formatByteLength(byteLength: number): string {
  if (byteLength < 1000) {
    return `${byteLength} B`;
  }
  if (byteLength < 1000 ** 2) {
    return `${(byteLength / 1000).toFixed(1)} kB`;
  }
  if (byteLength < 1000 ** 3) {
    return `${(byteLength / 1000 ** 2).toFixed(1)} MB`;
  }
  return `${(byteLength / 1000 ** 3).toFixed(2)} GB`;
}
