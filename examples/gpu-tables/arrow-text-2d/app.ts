// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  getArrowVectorByteLength,
  makeArrowFixedSizeListVector,
  makeArrowGPURecordBatch,
  makeArrowGPUTable,
  makeArrowGPUVector
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
import {
  ArrowAttributeTextModel,
  ArrowDictionaryTextModel,
  ArrowStorageTextModel,
  type ArrowAttributeTextModelProps,
  type ArrowDictionaryTextInputProps,
  type ArrowStorageTextInputProps
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
const ROW_COUNT_SELECTOR_ID = 'arrow-text-2d-row-count';
const SOURCE_SELECTOR_ID = 'arrow-text-2d-source';
const ARROW_VECTOR_BYTES_ID = 'arrow-text-2d-arrow-vector-bytes';
const STYLE_ARROW_BYTES_ID = 'arrow-text-2d-style-arrow-bytes';
const ARROW_VECTOR_BUILD_TIME_ID = 'arrow-text-2d-arrow-vector-build-time';
const CPU_GENERATION_TIME_ID = 'arrow-text-2d-cpu-generation-time';
const TOTAL_GPU_BYTES_ID = 'arrow-text-2d-total-gpu-bytes';
const TEXT_GPU_EXPANSION_ID = 'arrow-text-2d-text-gpu-expansion';
const GPU_STYLE_VECTOR_BYTES_ID = 'arrow-text-2d-gpu-style-vector-bytes';
const STYLE_GPU_EXPANSION_ID = 'arrow-text-2d-style-gpu-expansion';
const DECK_ATTRIBUTE_SIZE_ID = 'arrow-text-2d-deck-attribute-size';
const DECK_GPU_EXPANSION_ID = 'arrow-text-2d-deck-gpu-expansion';
const PICKED_LABEL_ID = 'arrow-text-2d-picked-label';
const STREAMING_BATCH_STATUS_ROW_ID = 'arrow-text-2d-streaming-batch-status-row';
const STREAMING_BATCH_SPINNER_ID = 'arrow-text-2d-streaming-batch-spinner';
const STREAMING_BATCH_STATUS_LABEL_ID = 'arrow-text-2d-streaming-batch-status-label';
const STREAMING_TEXT_BATCH_COUNT = 10;
const STREAMING_TEXT_BATCH_DELAY_MS = 1000;
const DICTIONARY_TEXT_ROWS_PER_CHUNK = 100_000;
const DICTIONARY_LABEL_COUNT_PER_CHUNK = 1_000;
// IconLayer + MultiIconLayer character attributes, assuming float32 positions in the active path.
const DECK_CHARACTER_ATTRIBUTE_BYTES_PER_GLYPH = 80;
type ActiveTextModel = ArrowAttributeTextModel | ArrowStorageTextModel | ArrowDictionaryTextModel;
type TextModelKind = 'direct' | 'storage' | 'dictionary-storage';
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
type TextSourceKind = 'utf8' | 'dictionary' | 'stream';
type Utf8TextDatasetKind = TextRowCountKind;
type DictionaryTextDatasetKind = '100k-dict' | '500k-dict' | '1m-dict';
type EagerTextDatasetKind = Utf8TextDatasetKind | DictionaryTextDatasetKind;
type StreamingTextDatasetKind = `${Utf8TextDatasetKind}-stream`;
type TextDatasetKind = EagerTextDatasetKind | StreamingTextDatasetKind;
type TextDataset = {
  labelCount: number;
  label: string;
  textType: 'utf8' | 'dictionary';
};
type ArrowTextInput = {
  positions: GPUVector<arrow.FixedSizeList<arrow.Float32>>;
  texts: GPUVector<ArrowUtf8TextType>;
  clipRects: GPUVector<arrow.FixedSizeList<arrow.Int16>>;
  colors: GPUVector<arrow.FixedSizeList<arrow.Uint8>>;
  angles: GPUVector<arrow.Float32>;
  sizes: GPUVector<arrow.Float32>;
  sourceVectors: ExampleArrowTextSourceVectors;
  arrowVectorByteLength: number;
  arrowVectorBuildTimeMs: number;
};

type StreamingArrowTextSource = {
  recordBatches: arrow.RecordBatch[];
  arrowVectorBuildTimeMs: number;
};
type ExampleArrowTextSourceVectors = {
  positions: arrow.Vector<arrow.FixedSizeList<arrow.Float32>>;
  texts: ArrowUtf8TextVector;
  colors?: arrow.Vector<arrow.FixedSizeList<arrow.Uint8>>;
  angles?: arrow.Vector<arrow.Float32>;
  sizes?: arrow.Vector<arrow.Float32>;
  pixelOffsets?: arrow.Vector<arrow.FixedSizeList<arrow.Float32>>;
  clipRects?: arrow.Vector<arrow.FixedSizeList<arrow.Int16>>;
};

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
    {name: 'glyphClipRects', location: 4, type: 'vec4<i32>', stepMode: 'instance'}
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
  Renders <code>arrow.Vector&lt;Utf8&gt;</code> and <code>arrow.Vector&lt;Dictionary&lt;Utf8&gt;&gt;</code>, 30 characters / row.
  </p>
  <style>
    @keyframes arrow-text-2d-streaming-spin {
      to {
        transform: rotate(360deg);
      }
    }
  </style>
  <div style="min-height: 920px; max-height: calc(100vh - 72px); overflow-y: auto; margin-top: 16px; padding: 14px 16px; border: 1px solid rgba(208, 215, 222, 0.9); border-radius: 16px; background: linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(246, 248, 250, 0.96) 100%); box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);">
    <div style="display: grid; grid-template-columns: minmax(56px, auto) minmax(0, 0.8fr) minmax(64px, auto) minmax(0, 1fr); align-items: center; gap: 10px 12px; margin-bottom: 12px; color: #0f172a; font-size: 15px; font-weight: 600;">
      <label for="${MODEL_SELECTOR_ID}">Model</label>
      <select id="${MODEL_SELECTOR_ID}" style="grid-column: 2 / 5; min-width: 0; min-height: 34px; border: 1px solid rgba(148, 163, 184, 0.8); border-radius: 6px; background: #ffffff; color: #0f172a; font: inherit;">
        <option value="direct">ArrowAttributeTextModel</option>
        <option value="storage">ArrowStorageTextModel</option>
        <option value="dictionary-storage">ArrowDictionaryTextModel</option>
      </select>
      <label for="${ROW_COUNT_SELECTOR_ID}">Rows</label>
      <select id="${ROW_COUNT_SELECTOR_ID}" style="min-width: 0; min-height: 34px; border: 1px solid rgba(148, 163, 184, 0.8); border-radius: 6px; background: #ffffff; color: #0f172a; font: inherit;">
        <option value="100k">100K rows</option>
        <option value="500k">500K rows</option>
        <option value="1m">1M rows</option>
      </select>
      <label for="${SOURCE_SELECTOR_ID}">Source</label>
      <select id="${SOURCE_SELECTOR_ID}" style="min-width: 0; min-height: 34px; border: 1px solid rgba(148, 163, 184, 0.8); border-radius: 6px; background: #ffffff; color: #0f172a; font: inherit;">
        <option value="utf8">Utf8</option>
        <option value="dictionary">Dictionary&lt;Utf8&gt;</option>
        <option value="stream">Utf8 streamed</option>
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
    <table style="display: table; width: 100%; min-width: 100%; table-layout: fixed; box-sizing: border-box; margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(208, 215, 222, 0.9); border-collapse: collapse; color: #334155; font-size: 13px; line-height: 1.4;">
      <thead>
        <tr style="color: #64748b; text-transform: uppercase; letter-spacing: 0.02em; font-size: 11px;">
          <th style="width: 20%; padding: 8px 8px 6px 0; text-align: left; font-weight: 700; white-space: nowrap;">columns</th>
          <th style="width: 22%; padding: 8px 8px 6px; text-align: right; font-weight: 700; white-space: nowrap;">Arrow</th>
          <th style="width: 22%; padding: 8px 8px 6px; text-align: right; font-weight: 700; white-space: nowrap;">GPU</th>
          <th style="width: 16%; padding: 8px 8px 6px; text-align: right; font-weight: 700; white-space: nowrap;">expansion</th>
          <th style="width: 20%; padding: 8px 0 6px 8px; text-align: right; font-weight: 700; white-space: nowrap;">prep time</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th style="padding: 6px 8px 6px 0; text-align: left; font-weight: 600;">text</th>
          <td style="padding: 6px 8px; text-align: right;"><strong id="${ARROW_VECTOR_BYTES_ID}" style="color: #0f172a; font-variant-numeric: tabular-nums;">Measuring...</strong></td>
          <td style="padding: 6px 8px; text-align: right;"><strong id="${TOTAL_GPU_BYTES_ID}" style="color: #0f172a; font-variant-numeric: tabular-nums; white-space: pre-line;">Measuring...</strong></td>
          <td style="padding: 6px 8px; text-align: right;"><strong id="${TEXT_GPU_EXPANSION_ID}" style="color: #0f172a; font-variant-numeric: tabular-nums; white-space: pre-line;">-</strong></td>
          <td style="padding: 6px 0 6px 8px; text-align: right;"><strong id="${CPU_GENERATION_TIME_ID}" style="color: #0f172a; font-variant-numeric: tabular-nums;">Measuring...</strong></td>
        </tr>
        <tr>
          <th style="padding: 6px 8px 6px 0; text-align: left; font-weight: 600;">styles</th>
          <td style="padding: 6px 8px; text-align: right;"><strong id="${STYLE_ARROW_BYTES_ID}" style="color: #0f172a; font-variant-numeric: tabular-nums;">Measuring...</strong></td>
          <td style="padding: 6px 8px; text-align: right;"><strong id="${GPU_STYLE_VECTOR_BYTES_ID}" style="color: #0f172a; font-variant-numeric: tabular-nums;">Measuring...</strong></td>
          <td style="padding: 6px 8px; text-align: right;"><strong id="${STYLE_GPU_EXPANSION_ID}" style="color: #0f172a; font-variant-numeric: tabular-nums;">-</strong></td>
          <td style="padding: 6px 0 6px 8px; text-align: right;"><strong id="${ARROW_VECTOR_BUILD_TIME_ID}" style="color: #0f172a; font-variant-numeric: tabular-nums;">Measuring...</strong></td>
        </tr>
        <tr>
          <th style="padding: 6px 8px 6px 0; text-align: left; font-weight: 600;">deck.gl</th>
          <td style="padding: 6px 8px; text-align: right;">-</td>
          <td style="padding: 6px 8px; text-align: right;"><strong id="${DECK_ATTRIBUTE_SIZE_ID}" style="color: #0f172a; font-variant-numeric: tabular-nums;">Measuring...</strong></td>
          <td style="padding: 6px 8px; text-align: right;"><strong id="${DECK_GPU_EXPANSION_ID}" style="color: #0f172a; font-variant-numeric: tabular-nums;">-</strong></td>
          <td style="padding: 6px 0 6px 8px; text-align: right;">-</td>
        </tr>
      </tbody>
    </table>
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
  texts!: GPUVector<ArrowUtf8TextType>;
  clipRects!: GPUVector<arrow.FixedSizeList<arrow.Int16>>;
  colors!: GPUVector<arrow.FixedSizeList<arrow.Uint8>>;
  angles!: GPUVector<arrow.Float32>;
  sizes!: GPUVector<arrow.Float32>;
  sourceVectors!: ExampleArrowTextSourceVectors;
  textModel!: ActiveTextModel;
  pickingModel: Model | null = null;
  picker: PickingManager | null = null;
  textModelKind: TextModelKind = 'direct';
  textDatasetKind: TextDatasetKind = '100k';
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
  animateToggle: HTMLInputElement | null = null;
  clippingToggle: HTMLInputElement | null = null;
  colorToggle: HTMLInputElement | null = null;
  sizeToggle: HTMLInputElement | null = null;
  angleToggle: HTMLInputElement | null = null;
  modelSelector: HTMLSelectElement | null = null;
  rowCountSelector: HTMLSelectElement | null = null;
  sourceSelector: HTMLSelectElement | null = null;
  arrowVectorBytesLabel: HTMLElement | null = null;
  styleArrowBytesLabel: HTMLElement | null = null;
  arrowVectorBuildTimeLabel: HTMLElement | null = null;
  cpuGenerationTimeLabel: HTMLElement | null = null;
  totalGpuBytesLabel: HTMLElement | null = null;
  textGpuExpansionLabel: HTMLElement | null = null;
  gpuStyleVectorBytesLabel: HTMLElement | null = null;
  styleGpuExpansionLabel: HTMLElement | null = null;
  deckAttributeSizeLabel: HTMLElement | null = null;
  deckGpuExpansionLabel: HTMLElement | null = null;
  pickedLabel: HTMLElement | null = null;
  streamingBatchStatusRow: HTMLElement | null = null;
  streamingBatchSpinner: HTMLElement | null = null;
  streamingBatchStatusLabel: HTMLElement | null = null;

  constructor({device}: AnimationProps) {
    super();
    this.device = device as Device;
  }

  override async onInitialize(): Promise<void> {
    const defaultTextInput = await this.getOrCreateTextInput(
      getEagerTextDatasetKind(this.textDatasetKind)
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
    const commonProps = {
      id: 'arrow-text-2d',
      positions: this.positions,
      texts: this.texts,
      clipRects: this.clipRects,
      sourceVectors: this.sourceVectors,
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
      }
    };
    if (modelKind === 'dictionary-storage') {
      if (this.device.type !== 'webgpu') {
        throw new Error('ArrowDictionaryTextModel showcase mode requires WebGPU');
      }
      const storageProps = {
        id: commonProps.id,
        positions: this.positions,
        texts: this.texts,
        clipRects: this.clipRects,
        sourceVectors: {
          texts: this.sourceVectors.texts,
          clipRects: this.sourceVectors.clipRects
        },
        ...(this.colorEnabled ? {colors: this.colors} : {}),
        ...(this.angleEnabled ? {angles: this.angles} : {}),
        ...(this.sizeEnabled ? {sizes: this.sizes} : {}),
        color: [210, 232, 255, 255],
        characterSet: commonProps.characterSet,
        fontSettings: commonProps.fontSettings,
        source: DICTIONARY_STORAGE_WGSL_SHADER,
        shaderLayout: DICTIONARY_STORAGE_TEXT_SHADER_LAYOUT,
        shaderInputs: commonProps.shaderInputs,
        modules: commonProps.modules,
        parameters: commonProps.parameters
      };
      return new ArrowDictionaryTextModel(
        this.device,
        storageProps as unknown as ArrowDictionaryTextInputProps
      );
    }
    if (modelKind === 'storage') {
      if (this.device.type !== 'webgpu') {
        throw new Error('ArrowStorageTextModel showcase mode requires WebGPU');
      }
      const storageProps = {
        id: commonProps.id,
        positions: this.positions,
        texts: this.texts,
        clipRects: this.clipRects,
        sourceVectors: {
          texts: this.sourceVectors.texts,
          clipRects: this.sourceVectors.clipRects
        },
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
      return new ArrowStorageTextModel(
        this.device,
        storageProps as unknown as ArrowStorageTextInputProps
      );
    }
    return new ArrowAttributeTextModel(this.device, commonProps as ArrowAttributeTextModelProps);
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
    if (!this.rowCountSelector || !this.sourceSelector) {
      this.initializeDataSelector();
    }
    if (!this.clippingToggle) {
      this.initializeClippingToggle();
    }
    if (!this.colorToggle || !this.sizeToggle || !this.angleToggle) {
      this.initializeStyleToggles();
    }
    if (
      !this.arrowVectorBytesLabel ||
      !this.styleArrowBytesLabel ||
      !this.arrowVectorBuildTimeLabel ||
      !this.cpuGenerationTimeLabel ||
      !this.totalGpuBytesLabel ||
      !this.textGpuExpansionLabel ||
      !this.gpuStyleVectorBytesLabel ||
      !this.styleGpuExpansionLabel ||
      !this.deckAttributeSizeLabel ||
      !this.deckGpuExpansionLabel
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
    this.animateToggle?.removeEventListener('change', this.handleAnimateToggle);
    this.clippingToggle?.removeEventListener('change', this.handleClippingToggle);
    this.colorToggle?.removeEventListener('change', this.handleColorToggle);
    this.sizeToggle?.removeEventListener('change', this.handleSizeToggle);
    this.angleToggle?.removeEventListener('change', this.handleAngleToggle);
    this.modelSelector?.removeEventListener('change', this.handleModelSelection);
    this.rowCountSelector?.removeEventListener('change', this.handleDataSelection);
    this.sourceSelector?.removeEventListener('change', this.handleDataSelection);
    this.animateToggle = null;
    this.clippingToggle = null;
    this.colorToggle = null;
    this.sizeToggle = null;
    this.angleToggle = null;
    this.modelSelector = null;
    this.rowCountSelector = null;
    this.sourceSelector = null;
    this.arrowVectorBytesLabel = null;
    this.styleArrowBytesLabel = null;
    this.arrowVectorBuildTimeLabel = null;
    this.cpuGenerationTimeLabel = null;
    this.totalGpuBytesLabel = null;
    this.textGpuExpansionLabel = null;
    this.gpuStyleVectorBytesLabel = null;
    this.styleGpuExpansionLabel = null;
    this.deckAttributeSizeLabel = null;
    this.deckGpuExpansionLabel = null;
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

    this.shaderInputs.setProps({picking: {batchIndex: 0}});
    this.pickingModel?.predraw(this.device.commandEncoder);
    const pickingPass = this.picker.beginRenderPass();
    if (this.pickingModel && this.textModel instanceof ArrowAttributeTextModel) {
      this.drawArrowTextPickingBatches(pickingPass, this.pickingModel, this.textModel);
    } else {
      this.pickingModel?.draw(pickingPass);
    }
    pickingPass.end();
    this.shaderInputs.setProps({picking: {isActive: false}});
    void this.picker.updatePickInfo(mousePosition as [number, number]);
  }

  createPickingModel(textModel: ActiveTextModel): Model {
    if (textModel instanceof ArrowDictionaryTextModel) {
      return new ArrowDictionaryTextModel(this.device, {
        id: `${textModel.id || 'arrow-text-2d'}-picking`,
        storageState: textModel.storageState,
        source: DICTIONARY_STORAGE_WGSL_SHADER,
        vs: VS_GLSL,
        fs: PICKING_FS_GLSL,
        fragmentEntryPoint: 'fragmentPicking',
        // @ts-expect-error Remove once npm package updated with new types
        modules: [indexPicking],
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
    textModel: ArrowAttributeTextModel
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
    this.updateModelSelectorAvailability();
    this.modelSelector.addEventListener('change', this.handleModelSelection);
  }

  handleModelSelection = (event: Event): void => {
    const requestedModelKind = (event.target as HTMLSelectElement).value as TextModelKind;
    const nextModelKind = this.resolveAvailableModelKind(requestedModelKind);
    if (nextModelKind === this.textModelKind) {
      if (this.modelSelector) {
        this.modelSelector.value = nextModelKind;
      }
      return;
    }

    this.replaceTextModel(nextModelKind, 'text model selector changed');
  };

  updateModelSelectorAvailability(): void {
    if (!this.modelSelector) {
      return;
    }
    const isDictionaryDataset = arrow.DataType.isDictionary(this.sourceVectors.texts.type);
    for (const option of Array.from(this.modelSelector.options)) {
      const modelKind = option.value as TextModelKind;
      option.disabled =
        (modelKind !== 'direct' && this.device.type !== 'webgpu') ||
        (modelKind === 'dictionary-storage' && !isDictionaryDataset);
    }
    this.modelSelector.disabled = false;
    this.modelSelector.value = this.textModelKind;
  }

  resolveAvailableModelKind(modelKind: TextModelKind): TextModelKind {
    if (modelKind !== 'direct' && this.device.type !== 'webgpu') {
      return 'direct';
    }
    const isDictionaryDataset = arrow.DataType.isDictionary(this.sourceVectors.texts.type);
    if (modelKind === 'dictionary-storage' && !isDictionaryDataset) {
      return 'direct';
    }
    return modelKind;
  }

  initializeDataSelector(): void {
    this.rowCountSelector = document.getElementById(
      ROW_COUNT_SELECTOR_ID
    ) as HTMLSelectElement | null;
    this.sourceSelector = document.getElementById(SOURCE_SELECTOR_ID) as HTMLSelectElement | null;
    if (!this.rowCountSelector || !this.sourceSelector) {
      return;
    }
    this.rowCountSelector.value = getTextDatasetRowCountKind(this.textDatasetKind);
    this.sourceSelector.value = getTextDatasetSourceKind(this.textDatasetKind);
    this.updateDataSelectorAvailability();
    this.rowCountSelector.addEventListener('change', this.handleDataSelection);
    this.sourceSelector.addEventListener('change', this.handleDataSelection);
  }

  updateDataSelectorAvailability(): void {
    if (!this.rowCountSelector || !this.sourceSelector) {
      return;
    }

    for (const option of Array.from(this.rowCountSelector.options)) {
      option.disabled = false;
    }
    for (const option of Array.from(this.sourceSelector.options)) {
      option.disabled = false;
    }
    this.rowCountSelector.value = getTextDatasetRowCountKind(this.textDatasetKind);
    this.sourceSelector.value = getTextDatasetSourceKind(this.textDatasetKind);
  }

  handleDataSelection = async (): Promise<void> => {
    const nextDatasetKind = this.getSelectedTextDatasetKind();
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
    this.activeStreamingTextTable = null;
    this.updateStreamingBatchStatus(null);
    this.updateDataSelectorAvailability();
    this.updateModelSelectorAvailability();
    this.replaceTextModel(
      this.resolveAvailableModelKind(this.textModelKind),
      'text dataset selector changed'
    );
    previousStreamingTable?.destroy();
  };

  getSelectedTextDatasetKind(): TextDatasetKind {
    const rowCountKind =
      (this.rowCountSelector?.value as TextRowCountKind | undefined) ??
      getTextDatasetRowCountKind(this.textDatasetKind);
    const sourceKind =
      (this.sourceSelector?.value as TextSourceKind | undefined) ??
      getTextDatasetSourceKind(this.textDatasetKind);
    return getTextDatasetKind(rowCountKind, sourceKind);
  }

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
    this.activeStreamingTextTable = streamingTextTable;
    this.updateStreamingBatchStatus(streamingTextTable.batches.length);
    this.updateDataSelectorAvailability();
    this.updateModelSelectorAvailability();
    this.replaceTextModel(
      this.resolveAvailableModelKind(this.textModelKind),
      'streaming text dataset started'
    );
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
    const appendedTextProps = {
      positions: this.positions,
      texts: this.texts,
      clipRects: this.clipRects,
      sourceVectors: this.sourceVectors,
      ...(this.colorEnabled ? {colors: this.colors} : {}),
      ...(this.angleEnabled ? {angles: this.angles} : {}),
      ...(this.sizeEnabled ? {sizes: this.sizes} : {})
    };
    if (
      this.textModel instanceof ArrowAttributeTextModel ||
      this.textModel instanceof ArrowStorageTextModel
    ) {
      this.textModel.appendTextBatches(
        appendedTextProps as unknown as Partial<ArrowAttributeTextModelProps> &
          Partial<ArrowStorageTextInputProps>
      );
    } else {
      this.replaceTextModel('direct', redrawReason);
      return;
    }
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
    this.updateModelSelectorAvailability();
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
    this.replaceTextModel(this.textModelKind, redrawReason);
  }

  initializeAttributeMetricLabels(): void {
    const rowStorageByteLength =
      this.textModel instanceof ArrowStorageTextModel ||
      this.textModel instanceof ArrowDictionaryTextModel
        ? this.textModel.rowStorageByteLength
        : 0;
    const glyphDefinitionStorageByteLength =
      this.textModel instanceof ArrowStorageTextModel ||
      this.textModel instanceof ArrowDictionaryTextModel
        ? this.textModel.glyphDefinitionStorageByteLength
        : 0;
    const transientComputeInputByteLength =
      this.textModel instanceof ArrowStorageTextModel ||
      this.textModel instanceof ArrowDictionaryTextModel
        ? this.textModel.transientComputeInputByteLength
        : 0;
    const compressedDictionaryStorageByteLength =
      this.textModel instanceof ArrowDictionaryTextModel
        ? this.textModel.compactStreamByteLength
        : 0;
    const styleArrowByteLength = this.getSelectedArrowStyleVectorByteLength();
    const styleGpuByteLength = this.getSelectedStyleColumnGpuByteLength();
    const textGpuByteLength =
      this.textModel instanceof ArrowAttributeTextModel
        ? Math.max(0, this.textModel.glyphAttributeByteLength - styleGpuByteLength)
        : this.textModel.glyphAttributeByteLength +
          rowStorageByteLength +
          glyphDefinitionStorageByteLength +
          compressedDictionaryStorageByteLength;
    const peakTextPathGpuByteLength = textGpuByteLength + transientComputeInputByteLength;
    const deckAttributeByteLength =
      getTextModelGlyphCount(this.textModel) * DECK_CHARACTER_ATTRIBUTE_BYTES_PER_GLYPH;
    this.arrowVectorBytesLabel = initializeAttributeSizeLabel(
      ARROW_VECTOR_BYTES_ID,
      this.arrowVectorByteLength
    );
    this.styleArrowBytesLabel = initializeAttributeSizeLabel(
      STYLE_ARROW_BYTES_ID,
      styleArrowByteLength
    );
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
        ? `${formatByteLength(textGpuByteLength)}\n${formatByteLength(peakTextPathGpuByteLength)} peak`
        : formatByteLength(textGpuByteLength)
    );
    this.textGpuExpansionLabel = initializeTextLabel(
      TEXT_GPU_EXPANSION_ID,
      transientComputeInputByteLength > 0
        ? `${formatExpansionRatio(textGpuByteLength, this.arrowVectorByteLength)}\n${formatExpansionRatio(
            peakTextPathGpuByteLength,
            this.arrowVectorByteLength
          )} peak`
        : formatExpansionRatio(textGpuByteLength, this.arrowVectorByteLength)
    );
    this.gpuStyleVectorBytesLabel = initializeTextLabel(
      GPU_STYLE_VECTOR_BYTES_ID,
      formatByteLength(styleGpuByteLength)
    );
    this.styleGpuExpansionLabel = initializeTextLabel(
      STYLE_GPU_EXPANSION_ID,
      formatExpansionRatio(styleGpuByteLength, styleArrowByteLength)
    );
    this.deckAttributeSizeLabel = initializeTextLabel(
      DECK_ATTRIBUTE_SIZE_ID,
      formatByteLength(deckAttributeByteLength)
    );
    this.deckGpuExpansionLabel = initializeTextLabel(
      DECK_GPU_EXPANSION_ID,
      formatExpansionRatio(
        deckAttributeByteLength,
        this.arrowVectorByteLength + styleArrowByteLength
      )
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

  getSelectedStyleColumnGpuByteLength(): number {
    if (this.textModel instanceof ArrowAttributeTextModel) {
      return this.getSelectedExpandedAttributeStyleVectorByteLength();
    }
    if (
      !(
        this.textModel instanceof ArrowStorageTextModel ||
        this.textModel instanceof ArrowDictionaryTextModel
      )
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
  const colorVector = splitArrowVectorByRows(
    makeArrowFixedSizeListVector(new arrow.Uint8(), 4, colors),
    rowChunkSize
  );
  const angleVector = splitArrowVectorByRows(makeFloat32ArrowVector(angles), rowChunkSize);
  const sizeVector = splitArrowVectorByRows(makeFloat32ArrowVector(sizes), rowChunkSize);
  const positionsGpuVector = makeArrowGPUVector(device, positionVector, {name: 'positions'});

  return {
    positions: positionsGpuVector,
    texts: makeArrowGPUVector(device, texts, {name: 'texts'}),
    clipRects: makeArrowGPUVector(device, clipRectVector, {name: 'clipRects'}),
    colors: makeArrowGPUVector(device, colorVector, {name: 'colors'}),
    angles: makeArrowGPUVector(device, angleVector, {name: 'angles'}),
    sizes: makeArrowGPUVector(device, sizeVector, {name: 'sizes'}),
    sourceVectors: {
      positions: positionVector,
      texts,
      clipRects: clipRectVector,
      colors: colorVector,
      angles: angleVector,
      sizes: sizeVector
    },
    arrowVectorByteLength: getArrowVectorByteLength(texts),
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
  const positions = sourceTable.getChild('positions');
  const texts = sourceTable.getChild('texts');
  const clipRects = sourceTable.getChild('clipRects');
  const colors = sourceTable.getChild('colors');
  const angles = sourceTable.getChild('angles');
  const sizes = sourceTable.getChild('sizes');
  if (!positions || !texts || !clipRects || !colors || !angles || !sizes) {
    throw new Error('Streaming Arrow text input requires complete CPU source vectors');
  }
  return {
    positions: getGpuTableTextVector<arrow.FixedSizeList<arrow.Float32>>(gpuTable, 'positions'),
    texts: getGpuTableTextVector<ArrowUtf8TextType>(gpuTable, 'texts'),
    clipRects: getGpuTableTextVector<arrow.FixedSizeList<arrow.Int16>>(gpuTable, 'clipRects'),
    colors: getGpuTableTextVector<arrow.FixedSizeList<arrow.Uint8>>(gpuTable, 'colors'),
    angles: getGpuTableTextVector<arrow.Float32>(gpuTable, 'angles'),
    sizes: getGpuTableTextVector<arrow.Float32>(gpuTable, 'sizes'),
    sourceVectors: {
      positions: positions as arrow.Vector<arrow.FixedSizeList<arrow.Float32>>,
      texts: texts as ArrowUtf8TextVector,
      clipRects: clipRects as arrow.Vector<arrow.FixedSizeList<arrow.Int16>>,
      colors: colors as arrow.Vector<arrow.FixedSizeList<arrow.Uint8>>,
      angles: angles as arrow.Vector<arrow.Float32>,
      sizes: sizes as arrow.Vector<arrow.Float32>
    },
    arrowVectorByteLength: getArrowVectorByteLength(texts as ArrowUtf8TextVector),
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
  rowCountKind: TextRowCountKind,
  sourceKind: TextSourceKind
): TextDatasetKind {
  if (sourceKind === 'dictionary') {
    return `${rowCountKind}-dict` as DictionaryTextDatasetKind;
  }
  if (sourceKind === 'stream') {
    return `${rowCountKind}-stream` as StreamingTextDatasetKind;
  }
  return rowCountKind;
}

function getTextDatasetRowCountKind(value: TextDatasetKind): TextRowCountKind {
  if (isStreamingTextDatasetKind(value)) {
    return value.slice(0, -'-stream'.length) as TextRowCountKind;
  }
  if (isDictionaryTextDatasetKind(value)) {
    return value.slice(0, -'-dict'.length) as TextRowCountKind;
  }
  return value;
}

function getTextDatasetSourceKind(value: TextDatasetKind): TextSourceKind {
  if (isStreamingTextDatasetKind(value)) {
    return 'stream';
  }
  if (isDictionaryTextDatasetKind(value)) {
    return 'dictionary';
  }
  return 'utf8';
}

function isTextDatasetKind(value: string): value is TextDatasetKind {
  const eagerDatasetKind = getEagerTextDatasetKind(value as TextDatasetKind);
  return eagerDatasetKind in TEXT_DATASETS;
}

function getTextModelGlyphCount(textModel: ActiveTextModel): number {
  return textModel instanceof ArrowStorageTextModel || textModel instanceof ArrowDictionaryTextModel
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

function initializeMetricTimeLabel(id: string, durationMs: number): HTMLElement | null {
  return initializeTextLabel(id, `${durationMs.toFixed(1)} ms`);
}

function getNow(): number {
  return globalThis.performance?.now() ?? Date.now();
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
