// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  getArrowVectorByteLength,
  makeArrowFixedSizeListVector,
  makeArrowGPURecordBatch,
  makeArrowGPUTable
} from '@luma.gl/arrow';
import {GPUVector, GPUTable} from '@luma.gl/tables';
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
import {AttributeTextModel, DictionaryTextModel, StorageTextModel} from '@luma.gl/text';
import * as arrow from 'apache-arrow';
import {ArrowText2DControlPanel, makeArrowText2DControlPanelHtml} from './control-panel';
import {
  ArrowTextLayer,
  type ArrowTextCharacterColorType,
  type ArrowTextColorType,
  type ArrowTextLayerActiveModel,
  type ArrowTextLayerData,
  type ArrowTextLayerModel,
  type ArrowTextLayerSourceVectors
} from './arrow-text-layer';

export const title = 'Text: Utf8/Dictionary<Utf8>';
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
const STREAMING_TEXT_BATCH_COUNT = 10;
const STREAMING_TEXT_BATCH_DELAY_MS = 1000;
const DICTIONARY_TEXT_ROWS_PER_CHUNK = 100_000;
const DICTIONARY_LABEL_COUNT_PER_CHUNK = 1_000;
// IconLayer + MultiIconLayer character attributes, assuming float32 positions in the active path.
const DECK_CHARACTER_ATTRIBUTE_BYTES_PER_GLYPH = 80;
type ActiveTextModel = ArrowTextLayerActiveModel;
type TextModelKind = ArrowTextLayerModel;
type ArrowUtf8DictionaryIndexType =
  | arrow.Int8
  | arrow.Int16
  | arrow.Int32
  | arrow.Uint8
  | arrow.Uint16
  | arrow.Uint32;
type ArrowUtf8Dictionary = arrow.Dictionary<arrow.Utf8, ArrowUtf8DictionaryIndexType>;
type ArrowUtf8TextType = arrow.Utf8 | ArrowUtf8Dictionary;
type ArrowUtf8TextVector = arrow.Vector<ArrowUtf8TextType>;
type TextRowCountKind = '100k' | '500k' | '1m';
type TextSourceKind = 'utf8' | 'dictionary';
type TextColorKind = 'string-colors' | 'character-colors';
type Utf8TextDatasetKind = TextRowCountKind;
type DictionaryTextDatasetKind = '100k-dict' | '500k-dict' | '1m-dict';
type EagerTextDatasetKind = Utf8TextDatasetKind | DictionaryTextDatasetKind;
type StreamingTextDatasetKind = `${EagerTextDatasetKind}-stream`;
type StreamingTextTableSizeKind = `${Utf8TextDatasetKind}-stream`;
type TextTableSizeKind = Utf8TextDatasetKind | StreamingTextTableSizeKind;
type TextDatasetKind = EagerTextDatasetKind | StreamingTextDatasetKind;
type TextInputKind = `${EagerTextDatasetKind}-${TextColorKind}`;
type TextDataset = {
  labelCount: number;
  label: string;
  textType: 'utf8' | 'dictionary';
};
type ArrowTextInput = ArrowTextLayerData & {
  clipRects: GPUVector<arrow.FixedSizeList<arrow.Int16>>;
  colors: GPUVector<ArrowTextColorType>;
  angles: GPUVector<arrow.Float32>;
  sizes: GPUVector<arrow.Float32>;
  arrowVectorByteLength: number;
  arrowVectorBuildTimeMs: number;
};

type StreamingArrowTextSource = {
  recordBatches: arrow.RecordBatch[];
  arrowVectorBuildTimeMs: number;
};
type ExampleArrowTextSourceVectors = ArrowTextLayerSourceVectors;

const TEXT_DATASETS: Record<EagerTextDatasetKind, TextDataset> = {
  '100k': {
    labelCount: 100_000,
    label: '100K Utf8 texts, 3M glyphs',
    textType: 'utf8'
  },
  '500k': {
    labelCount: 500_000,
    label: '500K Utf8 texts, 16M glyphs',
    textType: 'utf8'
  },
  '1m': {
    labelCount: 1_000_000,
    label: '1M Utf8 texts, 31M glyphs',
    textType: 'utf8'
  },
  '100k-dict': {
    labelCount: 100_000,
    label: '100K Dictionary<Utf8>, 1K strings / 100K rows',
    textType: 'dictionary'
  },
  '500k-dict': {
    labelCount: 500_000,
    label: '500K Dictionary<Utf8>, 1K strings / 100K rows',
    textType: 'dictionary'
  },
  '1m-dict': {
    labelCount: 1_000_000,
    label: '1M Dictionary<Utf8>, 1K strings / 100K rows',
    textType: 'dictionary'
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
    {name: 'glyphClipRects', location: 4, type: 'vec4<i32>', stepMode: 'instance'},
    {name: 'colors', location: 5, type: 'vec4<f32>', stepMode: 'instance'}
  ],
  bindings: []
} satisfies ShaderLayout;

const STORAGE_INDEXED_TEXT_SHADER_LAYOUT = {
  attributes: [
    {name: 'glyphOffsets', location: 0, type: 'vec2<i32>', stepMode: 'instance'},
    {name: 'glyphIndices', location: 1, type: 'vec2<u32>', stepMode: 'instance'}
  ],
  bindings: []
} satisfies ShaderLayout;

const DICTIONARY_STORAGE_TEXT_SHADER_LAYOUT = {
  attributes: [],
  bindings: []
} satisfies ShaderLayout;

const WGSL_SHADER = /* wgsl */ `\
struct TextViewportUniforms {
  cameraOffset : vec2<f32>,
  viewportScale : vec2<f32>,
  glyphWorldScale : f32,
  time : f32,
  clippingEnabled : f32,
  colorsEnabled : f32,
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
  @location(5) colors : vec4<f32>,
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
  outputs.textColor = inputs.colors;
  outputs.objectIndex = i32(inputs.rowIndices);
  return outputs;
}

@fragment
fn fragmentMain(inputs : FragmentInputs) -> @location(0) vec4<f32> {
  let sampledAlpha = textureSample(fontAtlasTexture, fontAtlasTextureSampler, inputs.textureCoordinate).a;
  let glyphAlpha = smoothstep(0.68, 0.82, sampledAlpha);
  let neutralTextColor = vec4<f32>(0.78, 0.86, 0.96, 1.0);
  let textColor = mix(neutralTextColor, inputs.textColor, textViewport.colorsEnabled);
  let fragColor = vec4<f32>(textColor.rgb, textColor.a * glyphAlpha);
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
  colorsEnabled : f32,
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
  _padding : u32,
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
fn vertexMain(inputs : VertexInputs) -> FragmentInputs {
  var outputs : FragmentInputs;
  let corner = getCorner(inputs.vertexIndex % 6u);
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
  let styledGlyphVertexOffset = rotateTextOffset(
    glyphVertexOffset * (textSize / 32.0),
    angleDegrees
  );
  var pixelOffset = textStorageStyleConfig.constantPixelOffset;
  if (textStorageStyleConfig.useRowPixelOffsets != 0u) {
    pixelOffset = textRowPixelOffsets[rowStorageIndex];
  }
  let glyphWorldOffset =
    (styledGlyphVertexOffset + pixelOffset) * textViewport.glyphWorldScale;
  let labelPosition = textRowPositions[rowStorageIndex];
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
    outputs.textColor = unpackTextColor(textRowColors[rowStorageIndex]);
  }
  outputs.objectIndex = i32(textStorageStyleConfig.batchRowIndexBase + rowIndex);
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

const DICTIONARY_STORAGE_WGSL_SHADER = /* wgsl */ `\
struct TextViewportUniforms {
  cameraOffset : vec2<f32>,
  viewportScale : vec2<f32>,
  glyphWorldScale : f32,
  time : f32,
  clippingEnabled : f32,
  colorsEnabled : f32,
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
// Dictionary model memory: row buffers hold styling and row starts, dictionary
// buffers hold shared glyph runs, and visible glyph occurrences are implicit
// draw instances. There is no per-visible-glyph occurrence/vertex buffer.
@group(0) @binding(auto) var<storage, read> textRowDictionaryRecords : array<vec2<u32>>;
// textDictionaryGlyphRanges maps one dictionary value to a shared glyph range.
@group(0) @binding(auto) var<storage, read> textDictionaryGlyphRanges : array<vec2<u32>>;
// textDictionaryGlyphRecords stores packed layout offset + glyph id once per
// unique dictionary glyph, then repeated rows reuse those records.
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
  _padding : u32,
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

fn emptyFragmentInputs() -> FragmentInputs {
  var outputs : FragmentInputs;
  outputs.Position = vec4<f32>(0.0);
  outputs.textureCoordinate = vec2<f32>(0.0);
  outputs.textColor = vec4<f32>(0.0);
  outputs.objectIndex = -1;
  return outputs;
}

fn findRowIndex(glyphIndex : u32) -> u32 {
  // Binary-search row glyph starts to recover the row for this instance.
  // This avoids storing a row id for every visible glyph occurrence.
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
fn vertexMain(inputs : VertexInputs) -> FragmentInputs {
  // instanceIndex is the visible glyph occurrence. The row record points to a
  // dictionary value, and the dictionary range points to shared glyph layout.
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
  if (dictionaryIndex == 4294967295u) {
    return emptyFragmentInputs();
  }
  let dictionaryGlyphRange = textDictionaryGlyphRanges[dictionaryIndex];
  let dictionaryGlyphIndex = dictionaryGlyphRange.x + dictionaryGlyphOffset;
  if (dictionaryGlyphIndex >= dictionaryGlyphRange.y) {
    return emptyFragmentInputs();
  }

  var outputs : FragmentInputs;
  let corner = getCorner(inputs.vertexIndex % 6u);
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
  let styledGlyphVertexOffset = rotateTextOffset(
    glyphVertexOffset * (textSize / 32.0),
    angleDegrees
  );
  var pixelOffset = textStorageStyleConfig.constantPixelOffset;
  if (textStorageStyleConfig.useRowPixelOffsets != 0u) {
    pixelOffset = textRowPixelOffsets[rowStorageIndex];
  }
  let glyphWorldOffset =
    (styledGlyphVertexOffset + pixelOffset) * textViewport.glyphWorldScale;
  let labelPosition = textRowPositions[rowStorageIndex];
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
    outputs.textColor = unpackTextColor(textRowColors[rowStorageIndex]);
  }
  outputs.objectIndex = i32(textStorageStyleConfig.batchRowIndexBase + rowIndex);
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
in vec4 colors;

layout(std140) uniform textViewportUniforms {
  vec2 cameraOffset;
  vec2 viewportScale;
  float glyphWorldScale;
  float time;
  float clippingEnabled;
  float colorsEnabled;
} textViewport;

uniform sampler2D fontAtlasTexture;
out vec2 vTextureCoordinate;
out vec4 vTextColor;

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
  vTextColor = colors;
}
`;

const FS_GLSL = /* glsl */ `\
#version 300 es
precision highp float;

uniform sampler2D fontAtlasTexture;

in vec2 vTextureCoordinate;
in vec4 vTextColor;
out vec4 fragColor;

void main() {
  float sampledAlpha = texture(fontAtlasTexture, vTextureCoordinate).a;
  float glyphAlpha = smoothstep(0.68, 0.82, sampledAlpha);
  vec4 neutralTextColor = vec4(0.78, 0.86, 0.96, 1.0);
  vec4 textColor = mix(neutralTextColor, vTextColor, textViewport.colorsEnabled);
  fragColor = vec4(textColor.rgb, textColor.a * glyphAlpha);
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
  colorsEnabled: number;
};

const textViewport: ShaderModule<TextViewportUniforms> = {
  name: 'textViewport',
  uniformTypes: {
    cameraOffset: 'vec2<f32>',
    viewportScale: 'vec2<f32>',
    glyphWorldScale: 'f32',
    time: 'f32',
    clippingEnabled: 'f32',
    colorsEnabled: 'f32'
  }
};

function supportsTextIndexPicking(device: Device): boolean {
  return supportsIndexPicking(device);
}

export default class ArrowText2DAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = makeArrowText2DControlPanelHtml({
    streamingBatchCount: STREAMING_TEXT_BATCH_COUNT,
    deckCharacterAttributeBytesPerGlyph: DECK_CHARACTER_ATTRIBUTE_BYTES_PER_GLYPH
  });

  static props = {createFramebuffer: true, useDevicePixels: true};

  readonly shaderInputs = new ShaderInputs<{
    textViewport: typeof textViewport.props;
    picking: typeof picking.props;
  }>({textViewport, picking});
  readonly device: Device;
  readonly textInputs: Partial<Record<TextInputKind, ArrowTextInput>> = {};
  readonly textInputPromises: Partial<Record<TextInputKind, Promise<ArrowTextInput>>> = {};
  positions!: GPUVector<arrow.FixedSizeList<arrow.Float32>>;
  texts!: GPUVector<ArrowUtf8TextType>;
  clipRects!: GPUVector<arrow.FixedSizeList<arrow.Int16>>;
  colors!: GPUVector<ArrowTextColorType>;
  angles!: GPUVector<arrow.Float32>;
  sizes!: GPUVector<arrow.Float32>;
  sourceVectors!: ExampleArrowTextSourceVectors;
  textLayer!: ArrowTextLayer;
  controlPanel!: ArrowText2DControlPanel;
  pickingModel: Model | null = null;
  picker: PickingManager | null = null;
  textModelKind: TextModelKind = 'auto';
  textDatasetKind: TextDatasetKind = '100k';
  textColorKind: TextColorKind = 'string-colors';
  arrowVectorByteLength = 0;
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

  constructor({device}: AnimationProps) {
    super();
    this.device = device as Device;
  }

  get textModel(): ActiveTextModel {
    return this.textLayer.model;
  }

  getControlPanelState() {
    return {
      rowCountKind: getTextTableSizeKind(this.textDatasetKind),
      sourceKind: getTextDatasetSourceKind(this.textDatasetKind),
      colorKind: this.textColorKind,
      modelKind: this.textModelKind,
      animate: this.animate,
      clippingEnabled: this.clippingEnabled,
      colorEnabled: this.colorEnabled,
      sizeEnabled: this.sizeEnabled,
      angleEnabled: this.angleEnabled
    };
  }

  initializeControlPanel(): void {
    this.controlPanel = new ArrowText2DControlPanel({
      device: this.device,
      initialState: this.getControlPanelState(),
      handlers: {
        onRowCountChange: this.handleRowCountSelection,
        onSourceChange: this.handleSourceSelection,
        onColorColumnChange: this.handleTextColorSelection,
        onModelChange: this.handleModelSelection,
        onAnimateChange: this.handleAnimateToggle,
        onClippingChange: this.handleClippingToggle,
        onColorChange: this.handleColorToggle,
        onSizeChange: this.handleSizeToggle,
        onAngleChange: this.handleAngleToggle
      }
    });
    this.controlPanel.initialize();
  }

  syncControlPanel(): void {
    this.controlPanel?.syncControls(this.getControlPanelState());
  }

  override async onInitialize(): Promise<void> {
    const defaultTextInput = await this.getOrCreateTextInput(
      getEagerTextDatasetKind(this.textDatasetKind),
      this.textColorKind
    );
    if (this.isFinalized) {
      return;
    }
    const {positions, texts, clipRects, colors, angles, sizes, sourceVectors} = defaultTextInput;
    this.positions = positions;
    this.texts = texts;
    this.clipRects = clipRects;
    this.colors = colors;
    this.angles = angles;
    this.sizes = sizes;
    this.sourceVectors = sourceVectors;
    this.arrowVectorByteLength = defaultTextInput.arrowVectorByteLength;
    this.arrowVectorBuildTimeMs = defaultTextInput.arrowVectorBuildTimeMs;
    this.textLayer = this.createTextLayer(this.textModelKind);
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

    this.initializeControlPanel();
    this.updateMetricLabels();
    this.updateStreamingBatchStatus(null);

    // Warm larger datasets after the first visible model is ready.
    void this.getOrCreateTextInput('500k', this.textColorKind);
    void this.getOrCreateTextInput('1m', this.textColorKind);
  }

  async getOrCreateTextInput(
    textDatasetKind: EagerTextDatasetKind,
    textColorKind: TextColorKind
  ): Promise<ArrowTextInput> {
    const textInputKind = getTextInputKind(textDatasetKind, textColorKind);
    const cachedTextInput = this.textInputs[textInputKind];
    if (cachedTextInput) {
      return cachedTextInput;
    }

    const cachedPromise = this.textInputPromises[textInputKind];
    if (cachedPromise) {
      return cachedPromise;
    }

    const textInputPromise = makeArrowTextInputAsync(
      this.device,
      TEXT_DATASETS[textDatasetKind],
      textColorKind
    ).then(textInput => {
      this.textInputs[textInputKind] = textInput;
      delete this.textInputPromises[textInputKind];
      if (!this.isFinalized) {
        this.syncControlPanel();
      }
      return textInput;
    });
    this.textInputPromises[textInputKind] = textInputPromise;
    this.syncControlPanel();
    return textInputPromise;
  }

  createTextLayer(modelKind: TextModelKind): ArrowTextLayer {
    return new ArrowTextLayer(this.device, {
      id: 'arrow-text-2d',
      data: {
        positions: this.positions,
        texts: this.texts,
        clipRects: this.clipRects,
        colors: this.colors,
        angles: this.angles,
        sizes: this.sizes,
        sourceVectors: this.sourceVectors,
        destroy: () => {}
      },
      model: modelKind,
      colorsEnabled: this.colorEnabled,
      anglesEnabled: this.angleEnabled,
      sizesEnabled: this.sizeEnabled,
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
      modules: [supportsTextIndexPicking(this.device) ? indexPicking : indexColorPicking] as never,
      parameters: {
        depthWriteEnabled: false,
        blend: true,
        blendColorOperation: 'add',
        blendAlphaOperation: 'add',
        blendColorSrcFactor: 'src-alpha',
        blendColorDstFactor: 'one-minus-src-alpha',
        blendAlphaSrcFactor: 'one',
        blendAlphaDstFactor: 'one-minus-src-alpha'
      },
      color: [210, 232, 255, 255],
      storageSource: STORAGE_INDEXED_WGSL_SHADER,
      storageShaderLayout: STORAGE_INDEXED_TEXT_SHADER_LAYOUT,
      dictionarySource: DICTIONARY_STORAGE_WGSL_SHADER,
      dictionaryShaderLayout: DICTIONARY_STORAGE_TEXT_SHADER_LAYOUT
    });
  }

  getLabelFieldHeight(): number {
    const datasetKind = getEagerTextDatasetKind(this.textDatasetKind);
    return (TEXT_DATASETS[datasetKind].labelCount / LABEL_COLUMN_COUNT) * LABEL_ROW_SPACING;
  }

  override onRender({device, aspect, time, needsRedraw, _mousePosition}: AnimationProps): void {
    const seconds = time / 1000;
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
          clippingEnabled: this.clippingEnabled ? 1 : 0,
          colorsEnabled: this.colorEnabled ? 1 : 0
        }
      });
      this.shaderInputs.setProps({picking: {isActive: false}});
      this.textModel.predraw(device.commandEncoder);

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
    this.controlPanel?.destroy();
    this.picker?.destroy();
    this.pickingModel?.destroy();
    this.textLayer?.destroy();
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

    this.shaderInputs.setProps({picking: {batchIndex: 0}});
    this.pickingModel?.predraw(this.device.commandEncoder);
    const pickingPass = this.picker.beginRenderPass();
    if (this.pickingModel && this.textModel instanceof AttributeTextModel) {
      this.drawArrowTextPickingBatches(pickingPass, this.pickingModel, this.textModel);
    } else {
      this.pickingModel?.draw(pickingPass);
    }
    pickingPass.end();
    this.shaderInputs.setProps({picking: {isActive: false}});
    void this.picker.updatePickInfo(mousePosition as [number, number]);
  }

  createPickingModel(textModel: ActiveTextModel): Model {
    if (textModel instanceof DictionaryTextModel) {
      return new DictionaryTextModel(this.device, {
        id: `${textModel.id || 'arrow-text-2d'}-picking`,
        storageState: textModel.storageState,
        source: DICTIONARY_STORAGE_WGSL_SHADER,
        vs: VS_GLSL,
        fs: PICKING_FS_GLSL,
        fragmentEntryPoint: 'fragmentPicking',
        modules: [indexPicking] as never,
        shaderLayout: DICTIONARY_STORAGE_TEXT_SHADER_LAYOUT,
        shaderInputs: this.shaderInputs,
        colorAttachmentFormats: ['rgba8unorm', 'rg32sint'],
        depthStencilAttachmentFormat: 'depth24plus',
        parameters: {
          depthWriteEnabled: false,
          blend: false
        }
      });
    }
    const usesStorageState = textModel instanceof StorageTextModel;
    if (usesStorageState) {
      return new StorageTextModel(this.device, {
        id: `${textModel.id || 'arrow-text-2d'}-picking`,
        storageState: textModel.storageState,
        source: STORAGE_INDEXED_WGSL_SHADER,
        vs: VS_GLSL,
        fs: PICKING_FS_GLSL,
        fragmentEntryPoint: 'fragmentPicking',
        modules: [indexPicking] as never,
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
    textModel: AttributeTextModel
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

  resolveAvailableModelKind(modelKind: TextModelKind): TextModelKind {
    if (modelKind === 'auto') {
      return modelKind;
    }
    if (modelKind !== 'attribute' && this.device.type !== 'webgpu') {
      return 'auto';
    }
    const isDictionaryDataset = arrow.DataType.isDictionary(this.sourceVectors.texts.type);
    if (modelKind === 'dictionary' && !isDictionaryDataset) {
      return 'auto';
    }
    if (
      modelKind !== 'attribute' &&
      isArrowTextCharacterColorType(this.sourceVectors.colors?.type)
    ) {
      return 'auto';
    }
    return modelKind;
  }

  handleModelSelection = (requestedModelKind: TextModelKind): void => {
    const nextModelKind = this.resolveAvailableModelKind(requestedModelKind);
    if (nextModelKind === this.textModelKind) {
      this.syncControlPanel();
      return;
    }

    this.replaceTextModel(nextModelKind, 'text model selector changed');
  };

  handleRowCountSelection = async (tableSizeKind: TextTableSizeKind): Promise<void> => {
    const sourceKind = getTextDatasetSourceKind(this.textDatasetKind);
    await this.selectTextInput(getTextDatasetKind(tableSizeKind, sourceKind), this.textColorKind);
  };

  handleSourceSelection = async (sourceKind: TextSourceKind): Promise<void> => {
    const tableSizeKind = getTextTableSizeKind(this.textDatasetKind);
    await this.selectTextInput(getTextDatasetKind(tableSizeKind, sourceKind), this.textColorKind);
  };

  handleTextColorSelection = async (textColorKind: TextColorKind): Promise<void> => {
    const sourceKind = getTextDatasetSourceKind(this.textDatasetKind);
    const tableSizeKind = getTextTableSizeKind(this.textDatasetKind);
    const nextTableSizeKind =
      textColorKind === 'character-colors' && isStreamingTextDatasetKind(tableSizeKind)
        ? getTextDatasetRowCountKind(this.textDatasetKind)
        : tableSizeKind;
    await this.selectTextInput(getTextDatasetKind(nextTableSizeKind, sourceKind), textColorKind);
  };

  async selectTextInput(
    nextDatasetKind: TextDatasetKind,
    nextColorKind: TextColorKind
  ): Promise<void> {
    if (
      (nextDatasetKind === this.textDatasetKind && nextColorKind === this.textColorKind) ||
      !isTextDatasetKind(nextDatasetKind)
    ) {
      this.syncControlPanel();
      return;
    }

    const previousStreamingTable = this.activeStreamingTextTable;
    const streamingSessionVersion = ++this.streamingSessionVersion;
    if (isStreamingTextDatasetKind(nextDatasetKind)) {
      await this.startStreamingTextDataset(
        nextDatasetKind,
        'string-colors',
        streamingSessionVersion,
        previousStreamingTable
      );
      return;
    }

    const nextTextInput = await this.getOrCreateTextInput(nextDatasetKind, nextColorKind);
    if (this.isFinalized) {
      return;
    }
    this.textDatasetKind = nextDatasetKind;
    const {positions, texts, clipRects, colors, angles, sizes, sourceVectors} = nextTextInput;
    this.positions = positions;
    this.texts = texts;
    this.clipRects = clipRects;
    this.colors = colors;
    this.angles = angles;
    this.sizes = sizes;
    this.sourceVectors = sourceVectors;
    this.arrowVectorByteLength = nextTextInput.arrowVectorByteLength;
    this.arrowVectorBuildTimeMs = nextTextInput.arrowVectorBuildTimeMs;
    this.textColorKind = nextColorKind;
    this.activeStreamingTextTable = null;
    this.updateStreamingBatchStatus(null);
    this.replaceTextModel(
      this.resolveAvailableModelKind(this.textModelKind),
      'text dataset selector changed'
    );
    this.syncControlPanel();
    previousStreamingTable?.destroy();
  }

  async startStreamingTextDataset(
    textDatasetKind: StreamingTextDatasetKind,
    textColorKind: TextColorKind,
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

    const streamingTextTable = makeArrowGPUTable(
      this.device,
      new arrow.Table([firstRecordBatchResult.value]),
      {
        shaderLayout: STREAMING_TEXT_INPUT_SHADER_LAYOUT
      }
    );

    const streamingTextInput = makeArrowTextInputFromGpuTable(
      streamingTextTable,
      [firstRecordBatchResult.value],
      streamingSource.arrowVectorBuildTimeMs
    );
    this.textDatasetKind = textDatasetKind;
    this.positions = streamingTextInput.positions;
    this.texts = streamingTextInput.texts;
    this.clipRects = streamingTextInput.clipRects;
    this.colors = streamingTextInput.colors;
    this.angles = streamingTextInput.angles;
    this.sizes = streamingTextInput.sizes;
    this.sourceVectors = streamingTextInput.sourceVectors;
    this.arrowVectorByteLength = streamingTextInput.arrowVectorByteLength;
    this.arrowVectorBuildTimeMs = streamingTextInput.arrowVectorBuildTimeMs;
    this.textColorKind = textColorKind;
    this.activeStreamingTextTable = streamingTextTable;
    this.updateStreamingBatchStatus(streamingTextTable.batches.length);
    this.replaceTextModel(
      this.resolveAvailableModelKind(this.textModelKind),
      'streaming text dataset started'
    );
    this.syncControlPanel();
    previousStreamingTable?.destroy();

    void this.consumeStreamingRecordBatches(
      recordBatchIterator,
      streamingTextTable,
      [firstRecordBatchResult.value],
      streamingSessionVersion
    );
  }

  async consumeStreamingRecordBatches(
    recordBatchIterator: AsyncIterator<arrow.RecordBatch>,
    streamingTextTable: GPUTable,
    sourceRecordBatches: arrow.RecordBatch[],
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
        makeArrowGPURecordBatch(this.device, recordBatchResult.value, {
          shaderLayout: STREAMING_TEXT_INPUT_SHADER_LAYOUT
        })
      );
      sourceRecordBatches.push(recordBatchResult.value);
      const streamingTextInput = makeArrowTextInputFromGpuTable(
        streamingTextTable,
        sourceRecordBatches,
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
    this.sourceVectors = streamingTextInput.sourceVectors;
    this.arrowVectorByteLength = streamingTextInput.arrowVectorByteLength;
    const appendedTextProps: ArrowTextLayerData = {
      positions: this.positions,
      texts: this.texts,
      clipRects: this.clipRects,
      sourceVectors: this.sourceVectors,
      colors: this.colors,
      angles: this.angles,
      sizes: this.sizes,
      destroy: () => {}
    };
    if (!this.textLayer.appendTextBatches(appendedTextProps, redrawReason)) {
      this.replaceTextModel('attribute', redrawReason);
      return;
    }
    this.pickingModel?.destroy();
    this.pickingModel = supportsTextIndexPicking(this.device)
      ? this.createPickingModel(this.textModel)
      : null;
    this.picker?.clearPickState();
    this.textModel.setNeedsRedraw(redrawReason);
    this.updateMetricLabels();
  }

  replaceTextModel(nextModelKind: TextModelKind, redrawReason: string): void {
    const previousTextLayer = this.textLayer;
    const previousPickingModel = this.pickingModel;
    this.textLayer = this.createTextLayer(nextModelKind);
    this.pickingModel = supportsTextIndexPicking(this.device)
      ? this.createPickingModel(this.textModel)
      : null;
    this.textModelKind = nextModelKind;
    previousPickingModel?.destroy();
    previousTextLayer.destroy();
    this.picker?.clearPickState();
    this.textModel.setNeedsRedraw(redrawReason);
    this.controlPanel?.setPickedLabel('Hover text');
    this.syncControlPanel();
    this.updateMetricLabels();
  }

  handleAnimateToggle = (enabled: boolean): void => {
    this.animate = enabled;
  };

  handleClippingToggle = (enabled: boolean): void => {
    this.clippingEnabled = enabled;
    this.textModel.setNeedsRedraw('text clipping toggled');
  };

  handleColorToggle = (enabled: boolean): void => {
    this.colorEnabled = enabled;
    this.rebuildStorageStyleModel('text row colors toggled');
  };

  handleSizeToggle = (enabled: boolean): void => {
    this.sizeEnabled = enabled;
    this.rebuildStorageStyleModel('text row sizes toggled');
  };

  handleAngleToggle = (enabled: boolean): void => {
    this.angleEnabled = enabled;
    this.rebuildStorageStyleModel('text row angles toggled');
  };

  rebuildStorageStyleModel(redrawReason: string): void {
    this.replaceTextModel(this.textModelKind, redrawReason);
  }

  updateMetricLabels(): void {
    const rowStorageByteLength =
      this.textModel instanceof StorageTextModel || this.textModel instanceof DictionaryTextModel
        ? this.textModel.rowStorageByteLength
        : 0;
    const glyphDefinitionStorageByteLength =
      this.textModel instanceof StorageTextModel || this.textModel instanceof DictionaryTextModel
        ? this.textModel.glyphDefinitionStorageByteLength
        : 0;
    const transientComputeInputByteLength =
      this.textModel instanceof StorageTextModel || this.textModel instanceof DictionaryTextModel
        ? this.textModel.transientComputeInputByteLength
        : 0;
    const compressedDictionaryStorageByteLength =
      this.textModel instanceof DictionaryTextModel ? this.textModel.compactStreamByteLength : 0;
    const styleArrowByteLength = this.getSelectedArrowStyleVectorByteLength();
    const styleGpuByteLength = this.getSelectedStyleColumnGpuByteLength();
    const textGpuByteLength =
      this.textModel instanceof AttributeTextModel
        ? Math.max(0, this.textModel.glyphAttributeByteLength - styleGpuByteLength)
        : this.textModel.glyphAttributeByteLength +
          rowStorageByteLength +
          glyphDefinitionStorageByteLength +
          compressedDictionaryStorageByteLength;
    const peakTextPathGpuByteLength = textGpuByteLength + transientComputeInputByteLength;
    const deckAttributeByteLength =
      getTextModelGlyphCount(this.textModel) * DECK_CHARACTER_ATTRIBUTE_BYTES_PER_GLYPH;
    this.controlPanel?.setMetricValues({
      arrowVectorBytes: formatByteLength(this.arrowVectorByteLength),
      styleArrowBytes: formatByteLength(styleArrowByteLength),
      arrowVectorBuildTime: `${this.arrowVectorBuildTimeMs.toFixed(1)} ms`,
      cpuGenerationTime: `${this.textModel.glyphAttributeBuildTimeMs.toFixed(1)} ms`,
      totalGpuBytes:
        transientComputeInputByteLength > 0
          ? `${formatByteLength(textGpuByteLength)}\n${formatByteLength(peakTextPathGpuByteLength)} peak`
          : formatByteLength(textGpuByteLength),
      textGpuExpansion:
        transientComputeInputByteLength > 0
          ? `${formatExpansionRatio(textGpuByteLength, this.arrowVectorByteLength)}\n${formatExpansionRatio(
              peakTextPathGpuByteLength,
              this.arrowVectorByteLength
            )} peak`
          : formatExpansionRatio(textGpuByteLength, this.arrowVectorByteLength),
      gpuStyleVectorBytes: formatByteLength(styleGpuByteLength),
      styleGpuExpansion: formatExpansionRatio(styleGpuByteLength, styleArrowByteLength),
      deckAttributeSize: formatByteLength(deckAttributeByteLength),
      deckGpuExpansion: formatExpansionRatio(
        deckAttributeByteLength,
        this.arrowVectorByteLength + styleArrowByteLength
      )
    });
  }

  updateStreamingBatchStatus(loadedBatchCount: number | null): void {
    this.controlPanel?.setStreamingBatchStatus(
      loadedBatchCount === null || !isStreamingTextDatasetKind(this.textDatasetKind)
        ? null
        : loadedBatchCount,
      STREAMING_TEXT_BATCH_COUNT
    );
  }

  getSelectedStyleColumnGpuByteLength(): number {
    if (this.textModel instanceof AttributeTextModel) {
      return this.getSelectedExpandedAttributeStyleVectorByteLength();
    }
    if (
      !(this.textModel instanceof StorageTextModel || this.textModel instanceof DictionaryTextModel)
    ) {
      return 0;
    }

    return (
      (this.colorEnabled ? getGpuVectorByteLength(this.colors) : 0) +
      (this.angleEnabled ? getGpuVectorByteLength(this.angles) : 0) +
      (this.sizeEnabled ? getGpuVectorByteLength(this.sizes) : 0)
    );
  }

  getSelectedExpandedAttributeStyleVectorByteLength(): number {
    const glyphCount = getTextModelGlyphCount(this.textModel);
    return (
      (this.colorEnabled ? getExpandedAttributeVectorByteLength(this.colors, glyphCount) : 0) +
      (this.angleEnabled ? getExpandedAttributeVectorByteLength(this.angles, glyphCount) : 0) +
      (this.sizeEnabled ? getExpandedAttributeVectorByteLength(this.sizes, glyphCount) : 0)
    );
  }

  getSelectedArrowStyleVectorByteLength(): number {
    return (
      (this.colorEnabled && this.sourceVectors.colors
        ? getArrowVectorByteLength(this.sourceVectors.colors)
        : 0) +
      (this.angleEnabled && this.sourceVectors.angles
        ? getArrowVectorByteLength(this.sourceVectors.angles)
        : 0) +
      (this.sizeEnabled && this.sourceVectors.sizes
        ? getArrowVectorByteLength(this.sourceVectors.sizes)
        : 0)
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
    if (batchIndex === null || objectIndex === null) {
      this.controlPanel?.setPickedLabel('Hover text');
      return;
    }
    this.controlPanel?.setPickedLabel(`row ${objectIndex.toLocaleString()}`);
  };
}

function makeArrowTextInput(
  device: Device,
  dataset: TextDataset,
  textColorKind: TextColorKind
): ArrowTextInput {
  const labelRowCount = dataset.labelCount / LABEL_COLUMN_COUNT;
  const centerColumn = (LABEL_COLUMN_COUNT - 1) / 2;
  const centerRow = (labelRowCount - 1) / 2;
  const positions = new Float32Array(dataset.labelCount * 2);
  const clipRects = new Int16Array(dataset.labelCount * 4);
  const angles = new Float32Array(dataset.labelCount);
  const sizes = new Float32Array(dataset.labelCount);
  let positionIndex = 0;
  let clipRectIndex = 0;

  for (let labelIndex = 0; labelIndex < dataset.labelCount; labelIndex++) {
    const columnIndex = labelIndex % LABEL_COLUMN_COUNT;
    const rowIndex = Math.floor(labelIndex / LABEL_COLUMN_COUNT);
    positions[positionIndex++] = (columnIndex - centerColumn) * LABEL_COLUMN_SPACING;
    positions[positionIndex++] = (rowIndex - centerRow) * LABEL_ROW_SPACING;
    clipRects[clipRectIndex++] = 0;
    clipRects[clipRectIndex++] = 0;
    clipRects[clipRectIndex++] = LABEL_CLIP_WIDTH;
    clipRects[clipRectIndex++] = -1;
    angles[labelIndex] = ((labelIndex % 9) - 4) * 2;
    sizes[labelIndex] = 24 + (labelIndex % 5) * 4;
  }

  const arrowVectorBuildStartTime = getNow();
  const rowChunkSize = getArrowTextInputRowChunkSize(dataset);
  const positionVector = splitArrowVectorByRows(
    makeArrowFixedSizeListVector(new arrow.Float32(), 2, positions),
    rowChunkSize
  );
  const texts = makeArrowTextVector(dataset, dataset.labelCount, labelIndex => labelIndex);
  const clipRectVector = splitArrowVectorByRows(
    makeArrowFixedSizeListVector(new arrow.Int16(), 4, clipRects),
    rowChunkSize
  );
  const colorVector = makeArrowTextColorVector(dataset, textColorKind, rowChunkSize);
  const angleVector = splitArrowVectorByRows(makeFloat32ArrowVector(angles), rowChunkSize);
  const sizeVector = splitArrowVectorByRows(makeFloat32ArrowVector(sizes), rowChunkSize);
  const sourceVectors: ExampleArrowTextSourceVectors = {
    positions: positionVector,
    texts,
    clipRects: clipRectVector,
    colors: colorVector,
    angles: angleVector,
    sizes: sizeVector
  };
  const prepared = ArrowTextLayer.prepareData(device, {sourceVectors});

  return {
    ...prepared,
    clipRects: prepared.clipRects!,
    colors: prepared.colors!,
    angles: prepared.angles!,
    sizes: prepared.sizes!,
    arrowVectorByteLength: getArrowVectorByteLength(texts),
    arrowVectorBuildTimeMs: getNow() - arrowVectorBuildStartTime
  };
}

async function makeArrowTextInputAsync(
  device: Device,
  dataset: TextDataset,
  textColorKind: TextColorKind
): Promise<ArrowTextInput> {
  await waitForBrowserPaint();
  return makeArrowTextInput(device, dataset, textColorKind);
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
    }

    const table = new arrow.Table({
      positions: makeArrowFixedSizeListVector(new arrow.Float32(), 2, positions),
      texts: makeArrowTextVector(dataset, batchLabelCount, localLabelIndex => {
        const localRowIndex = Math.floor(localLabelIndex / LABEL_COLUMN_COUNT);
        const columnIndex = localLabelIndex % LABEL_COLUMN_COUNT;
        return batchRowIndices[localRowIndex] * LABEL_COLUMN_COUNT + columnIndex;
      }),
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
  recordBatches: arrow.RecordBatch[],
  arrowVectorBuildTimeMs: number
): ArrowTextInput {
  const sourceTable = new arrow.Table(recordBatches);
  const texts = sourceTable.getChild('texts');
  if (!texts) {
    throw new Error('Streaming Arrow text input requires complete CPU source vectors');
  }
  const prepared = ArrowTextLayer.prepareDataFromGPUTable({
    gpuTable,
    recordBatches
  });
  return {
    ...prepared,
    clipRects: prepared.clipRects!,
    colors: prepared.colors!,
    angles: prepared.angles!,
    sizes: prepared.sizes!,
    arrowVectorByteLength: getArrowVectorByteLength(texts as ArrowUtf8TextVector),
    arrowVectorBuildTimeMs
  };
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

function makeArrowTextVector(
  dataset: TextDataset,
  labelCount: number,
  getGlobalLabelIndex: (localLabelIndex: number) => number
): ArrowUtf8TextVector {
  if (dataset.textType === 'dictionary') {
    return makeArrowDictionaryTextVector(labelCount, getGlobalLabelIndex);
  }

  const labels = new Array<string>(labelCount);
  for (let localLabelIndex = 0; localLabelIndex < labelCount; localLabelIndex++) {
    labels[localLabelIndex] = makeUtf8Label(getGlobalLabelIndex(localLabelIndex));
  }
  return arrow.vectorFromArray(labels, new arrow.Utf8()) as arrow.Vector<arrow.Utf8>;
}

function makeArrowDictionaryTextVector(
  labelCount: number,
  getGlobalLabelIndex: (localLabelIndex: number) => number
): arrow.Vector<ArrowUtf8Dictionary> {
  const dictionaryType = new arrow.Dictionary(new arrow.Utf8(), new arrow.Int32());
  const dataChunks: arrow.Data<ArrowUtf8Dictionary>[] = [];
  let localStartIndex = 0;

  while (localStartIndex < labelCount) {
    const dictionaryChunkIndex = getDictionaryChunkIndex(getGlobalLabelIndex(localStartIndex));
    let localEndIndex = localStartIndex + 1;
    while (
      localEndIndex < labelCount &&
      getDictionaryChunkIndex(getGlobalLabelIndex(localEndIndex)) === dictionaryChunkIndex
    ) {
      localEndIndex++;
    }

    const chunkLabelCount = localEndIndex - localStartIndex;
    const dictionary = arrow.vectorFromArray(
      makeDictionaryLabels(dictionaryChunkIndex),
      new arrow.Utf8()
    ) as arrow.Vector<arrow.Utf8>;
    const indices = new Int32Array(chunkLabelCount);
    for (
      let localLabelIndex = localStartIndex;
      localLabelIndex < localEndIndex;
      localLabelIndex++
    ) {
      indices[localLabelIndex - localStartIndex] = getDictionaryLabelIndex(
        getGlobalLabelIndex(localLabelIndex)
      );
    }
    dataChunks.push(
      arrow.makeData({
        type: dictionaryType,
        length: chunkLabelCount,
        data: indices,
        dictionary
      }) as arrow.Data<ArrowUtf8Dictionary>
    );
    localStartIndex = localEndIndex;
  }

  return new arrow.Vector<ArrowUtf8Dictionary>(dataChunks);
}

function makeArrowTextColorVector(
  dataset: TextDataset,
  textColorKind: TextColorKind,
  rowChunkSize: number
): arrow.Vector<ArrowTextColorType> {
  if (textColorKind === 'character-colors') {
    return splitArrowVectorByRows(
      makeArrowTextCharacterColorVector(dataset),
      rowChunkSize
    ) as arrow.Vector<ArrowTextColorType>;
  }
  return splitArrowVectorByRows(
    makeArrowFixedSizeListVector(new arrow.Uint8(), 4, makeTextRowColors(dataset.labelCount)),
    rowChunkSize
  ) as arrow.Vector<ArrowTextColorType>;
}

function makeArrowTextCharacterColorVector(
  dataset: TextDataset
): arrow.Vector<ArrowTextCharacterColorType> {
  const valueOffsets = new Int32Array(dataset.labelCount + 1);
  const colorValues: number[] = [];

  for (let labelIndex = 0; labelIndex < dataset.labelCount; labelIndex++) {
    valueOffsets[labelIndex] = colorValues.length / 4;
    const textLength = getTextLabelLength(dataset, labelIndex);
    for (let characterIndex = 0; characterIndex < textLength; characterIndex++) {
      appendTextCharacterColor(colorValues, labelIndex, characterIndex);
    }
  }
  valueOffsets[dataset.labelCount] = colorValues.length / 4;

  const values = Uint8Array.from(colorValues);
  const colorType = new arrow.FixedSizeList(4, new arrow.Field('values', new arrow.Uint8(), false));
  const textColorType = new arrow.List(new arrow.Field('colors', colorType, false));
  const colorValueData = new arrow.Data(new arrow.Uint8(), 0, values.length, 0, {
    [arrow.BufferType.DATA]: values
  });
  const colorData = new arrow.Data(colorType, 0, values.length / 4, 0, {}, [colorValueData]);
  const textColorData = new arrow.Data(
    textColorType,
    0,
    dataset.labelCount,
    0,
    {[arrow.BufferType.OFFSET]: valueOffsets},
    [colorData]
  );
  return new arrow.Vector([textColorData]) as arrow.Vector<ArrowTextCharacterColorType>;
}

function makeTextRowColors(labelCount: number): Uint8Array {
  const colors = new Uint8Array(labelCount * 4);
  for (let labelIndex = 0; labelIndex < labelCount; labelIndex++) {
    const colorIndex = labelIndex * 4;
    colors[colorIndex] = 96 + ((labelIndex * 17) % 128);
    colors[colorIndex + 1] = 172 + ((labelIndex * 11) % 72);
    colors[colorIndex + 2] = 210 + ((labelIndex * 7) % 45);
    colors[colorIndex + 3] = 255;
  }
  return colors;
}

function appendTextCharacterColor(
  colors: number[],
  labelIndex: number,
  characterIndex: number
): void {
  colors.push(
    clampColor(82 + ((labelIndex * 17 + characterIndex * 37) % 154)),
    clampColor(146 + ((labelIndex * 11 + characterIndex * 29) % 96)),
    clampColor(198 + ((labelIndex * 7 + characterIndex * 19) % 58)),
    255
  );
}

function makeDictionaryLabels(dictionaryChunkIndex: number): string[] {
  const labels = new Array<string>(DICTIONARY_LABEL_COUNT_PER_CHUNK);
  for (let dictionaryLabelIndex = 0; dictionaryLabelIndex < labels.length; dictionaryLabelIndex++) {
    labels[dictionaryLabelIndex] = makeDictionaryLabel(dictionaryChunkIndex, dictionaryLabelIndex);
  }
  return labels;
}

function makeUtf8Label(labelIndex: number): string {
  return `NODE ${String(labelIndex).padStart(6, '0')} / ARROW TEXT VECTOR`;
}

function makeDictionaryLabel(dictionaryChunkIndex: number, dictionaryLabelIndex: number): string {
  return `DICT ${String(dictionaryChunkIndex).padStart(2, '0')} KEY ${String(
    dictionaryLabelIndex
  ).padStart(4, '0')} / ARROW TEXT`;
}

function getTextLabelLength(dataset: TextDataset, labelIndex: number): number {
  const label =
    dataset.textType === 'dictionary'
      ? makeDictionaryLabel(
          getDictionaryChunkIndex(labelIndex),
          getDictionaryLabelIndex(labelIndex)
        )
      : makeUtf8Label(labelIndex);
  return Array.from(label).length;
}

function getDictionaryChunkIndex(labelIndex: number): number {
  return Math.floor(labelIndex / DICTIONARY_TEXT_ROWS_PER_CHUNK);
}

function getDictionaryLabelIndex(labelIndex: number): number {
  return (labelIndex * 37) % DICTIONARY_LABEL_COUNT_PER_CHUNK;
}

function getArrowTextInputRowChunkSize(dataset: TextDataset): number {
  return dataset.textType === 'dictionary' ? DICTIONARY_TEXT_ROWS_PER_CHUNK : dataset.labelCount;
}

function splitArrowVectorByRows<T extends arrow.DataType>(
  vector: arrow.Vector<T>,
  rowChunkSize: number
): arrow.Vector<T> {
  if (rowChunkSize <= 0 || rowChunkSize >= vector.length) {
    return vector;
  }

  const dataChunks: arrow.Data<T>[] = [];
  for (let rowStart = 0; rowStart < vector.length; rowStart += rowChunkSize) {
    const rowEnd = Math.min(rowStart + rowChunkSize, vector.length);
    const chunk = vector.slice(rowStart, rowEnd) as arrow.Vector<T>;
    const data = chunk.data[0];
    if (data) {
      dataChunks.push(data);
    }
  }
  return new arrow.Vector<T>(dataChunks);
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

function clampColor(value: number): number {
  return Math.min(255, Math.max(0, Math.round(value)));
}

function isStreamingTextDatasetKind(value: TextDatasetKind): value is StreamingTextDatasetKind {
  return value.endsWith('-stream');
}

function isDictionaryTextDatasetKind(value: TextDatasetKind): value is DictionaryTextDatasetKind {
  return value.endsWith('-dict');
}

function getEagerTextDatasetKind(value: TextDatasetKind): EagerTextDatasetKind {
  return (
    isStreamingTextDatasetKind(value) ? value.slice(0, -'-stream'.length) : value
  ) as EagerTextDatasetKind;
}

function getTextDatasetKind(
  tableSizeKind: TextTableSizeKind,
  sourceKind: TextSourceKind
): TextDatasetKind {
  const isStreamingDataset = isStreamingTextDatasetKind(tableSizeKind);
  const streamingSuffix = isStreamingDataset ? '-stream' : '';
  if (sourceKind === 'dictionary') {
    const rowCountKind = getTextDatasetRowCountKind(tableSizeKind);
    return `${rowCountKind}-dict${streamingSuffix}` as TextDatasetKind;
  }
  return tableSizeKind;
}

function getTextInputKind(
  textDatasetKind: EagerTextDatasetKind,
  textColorKind: TextColorKind
): TextInputKind {
  return `${textDatasetKind}-${textColorKind}`;
}

function getTextDatasetRowCountKind(value: TextDatasetKind): TextRowCountKind {
  const eagerDatasetKind = getEagerTextDatasetKind(value);
  if (isDictionaryTextDatasetKind(eagerDatasetKind)) {
    return eagerDatasetKind.slice(0, -'-dict'.length) as TextRowCountKind;
  }
  return eagerDatasetKind;
}

function getTextDatasetSourceKind(value: TextDatasetKind): TextSourceKind {
  if (isDictionaryTextDatasetKind(getEagerTextDatasetKind(value))) {
    return 'dictionary';
  }
  return 'utf8';
}

function getTextTableSizeKind(value: TextDatasetKind): TextTableSizeKind {
  const rowCountKind = getTextDatasetRowCountKind(value);
  return (
    isStreamingTextDatasetKind(value) ? `${rowCountKind}-stream` : rowCountKind
  ) as TextTableSizeKind;
}

function isTextDatasetKind(value: string): value is TextDatasetKind {
  const eagerDatasetKind = getEagerTextDatasetKind(value as TextDatasetKind);
  return eagerDatasetKind in TEXT_DATASETS;
}

function isArrowTextCharacterColorType(
  type: arrow.DataType | undefined
): type is ArrowTextCharacterColorType {
  return Boolean(type) && arrow.DataType.isList(type);
}

function getTextModelGlyphCount(textModel: ActiveTextModel): number {
  return textModel instanceof StorageTextModel || textModel instanceof DictionaryTextModel
    ? textModel.glyphCount
    : textModel.glyphLayout.glyphCount;
}

function getGpuVectorByteLength(vector: GPUVector): number {
  return vector.data.reduce((byteLength, gpuData) => {
    const variableLengthByteLength = gpuData.readbackMetadata?.valueByteLength;
    return (
      byteLength +
      (variableLengthByteLength !== undefined
        ? variableLengthByteLength
        : gpuData.length * gpuData.byteStride)
    );
  }, 0);
}

function getExpandedAttributeVectorByteLength(vector: GPUVector, glyphCount: number): number {
  return glyphCount * (vector.data[0]?.byteStride ?? 0);
}

function formatExpansionRatio(byteLength: number, arrowByteLength: number): string {
  const expansionFactor =
    Number.isFinite(arrowByteLength) && arrowByteLength > 0 ? byteLength / arrowByteLength : null;
  return formatExpansionFactor(expansionFactor);
}

function formatExpansionFactor(expansionFactor: number | null): string {
  if (expansionFactor === null || !Number.isFinite(expansionFactor)) {
    return '-';
  }
  const precision = expansionFactor < 10 ? 1 : 0;
  return `${expansionFactor.toFixed(precision).replace(/\.0$/, '')}x`;
}

function getNow(): number {
  return globalThis.performance?.now() ?? Date.now();
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
