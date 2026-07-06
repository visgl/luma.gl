// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ShaderLayout} from '@luma.gl/core';
import {picking, ShaderInputs} from '@luma.gl/engine';
import {ShaderAssembler, type ShaderModule} from '@luma.gl/shadertools';
import {
  makeTextGlyphAlphaGlsl,
  makeTextGlyphAlphaWgsl,
  type TextGlyphAlphaShaderSettings
} from '@luma.gl/text/experimental';

const TEXT_VIEWPORT_FRAGMENT_SHADER_SETTINGS = {
  renderMode: {expression: 'textViewport.textFontRenderMode', kind: 'float'},
  sdfThreshold: 'textViewport.textSdfThreshold',
  sdfSmoothing: 'textViewport.textSdfSmoothing',
  msdfDistanceRange: 'textViewport.textMsdfDistanceRange'
} as const satisfies TextGlyphAlphaShaderSettings;
const TEXT_STORAGE_FRAGMENT_SHADER_SETTINGS = {
  renderMode: {expression: 'textStorageStyleConfig.fontRenderMode', kind: 'uint'},
  sdfThreshold: 'textStorageStyleConfig.sdfThreshold',
  sdfSmoothing: 'textStorageStyleConfig.sdfSmoothing',
  msdfDistanceRange: 'textStorageStyleConfig.msdfDistanceRange'
} as const satisfies TextGlyphAlphaShaderSettings;

const configuredAttributeVertexHooks = new WeakMap<ShaderAssembler, Set<string>>();

/**
 * Registers the attribute-text vertex extension point on an assembler.
 *
 * The generated hook is a no-op until a shader module injects code at
 * `vs:TEXT_ATTRIBUTE_VERTEX_TRANSFORM`. Keeping registration in the renderer package guarantees
 * that ordinary text shaders compile while allowing hosts such as Space Crawl to replace
 * projection and texture orientation without forking the text shader.
 */
export function configureArrowTextShaderAssembler(
  shaderAssembler: ShaderAssembler,
  shaderLanguage: 'glsl' | 'wgsl'
): ShaderAssembler {
  let configuredLanguages = configuredAttributeVertexHooks.get(shaderAssembler);
  if (!configuredLanguages) {
    configuredLanguages = new Set();
    configuredAttributeVertexHooks.set(shaderAssembler, configuredLanguages);
  }
  if (configuredLanguages.has(shaderLanguage)) {
    return shaderAssembler;
  }

  shaderAssembler.addShaderHook(
    shaderLanguage === 'wgsl'
      ? 'vs:TEXT_ATTRIBUTE_VERTEX_TRANSFORM(outputs: ptr<function, FragmentInputs>, worldPosition: vec2<f32>, glyphFrame: vec4<f32>, corner: vec2<f32>, glyphSize: vec2<f32>, atlasSize: vec2<f32>)'
      : 'vs:TEXT_ATTRIBUTE_VERTEX_TRANSFORM(inout vec4 position, inout vec2 textureCoordinate, inout vec4 textColor, vec2 worldPosition, vec4 glyphFrame, vec2 corner, vec2 glyphSize, vec2 atlasSize)'
  );
  configuredLanguages.add(shaderLanguage);
  return shaderAssembler;
}

export const STREAMING_TEXT_INPUT_SHADER_LAYOUT = {
  attributes: [
    {name: 'positions', location: 0, type: 'vec2<f32>', stepMode: 'instance'},
    {name: 'clipRects', location: 1, type: 'vec4<f32>', stepMode: 'instance'},
    {name: 'colors', location: 2, type: 'vec4<f32>', stepMode: 'instance'},
    {name: 'angles', location: 3, type: 'f32', stepMode: 'instance'},
    {name: 'sizes', location: 4, type: 'f32', stepMode: 'instance'},
    {name: 'pixelOffsets', location: 5, type: 'vec2<f32>', stepMode: 'instance'}
  ],
  bindings: [
    {name: 'texts', type: 'read-only-storage', group: 0, location: 0},
    {name: 'textAnchors', type: 'read-only-storage', group: 0, location: 1},
    {name: 'alignmentBaselines', type: 'read-only-storage', group: 0, location: 2}
  ]
} satisfies ShaderLayout;

export const TEXT_SHADER_LAYOUT = {
  attributes: [
    {name: 'positions', location: 0, type: 'vec2<f32>', stepMode: 'instance'},
    {name: 'glyphOffsets', location: 1, type: 'vec2<i32>', stepMode: 'instance'},
    {name: 'glyphFrames', location: 2, type: 'vec4<u32>', stepMode: 'instance'},
    {name: 'glyphPages', location: 3, type: 'u32', stepMode: 'instance'},
    {name: 'rowIndices', location: 4, type: 'u32', stepMode: 'instance'},
    {name: 'glyphClipRects', location: 5, type: 'vec4<f32>', stepMode: 'instance'},
    {name: 'colors', location: 6, type: 'vec4<f32>', stepMode: 'instance'}
  ],
  bindings: []
} satisfies ShaderLayout;

export const TEXT_STORAGE_INDEXED_SHADER_LAYOUT = {
  attributes: [
    {name: 'glyphOffsets', location: 0, type: 'vec2<i32>', stepMode: 'instance'},
    {name: 'glyphIndices', location: 1, type: 'vec2<u32>', stepMode: 'instance'}
  ],
  bindings: []
} satisfies ShaderLayout;

export const TEXT_ROW_INDEXED_STORAGE_SHADER_LAYOUT = {
  attributes: [
    ...TEXT_STORAGE_INDEXED_SHADER_LAYOUT.attributes,
    {name: 'glyphRowIndices', location: 2, type: 'u32', stepMode: 'instance'}
  ],
  bindings: []
} satisfies ShaderLayout;

export const TEXT_DICTIONARY_STORAGE_SHADER_LAYOUT = {
  attributes: [],
  bindings: []
} satisfies ShaderLayout;

export const WGSL_SHADER = /* wgsl */ `\
struct TextViewportUniforms {
  cameraOffset : vec2<f32>,
  viewportScale : vec2<f32>,
  glyphWorldScale : f32,
  time : f32,
  clippingEnabled : f32,
  colorsEnabled : f32,
  textFontRenderMode : f32,
  textSdfThreshold : f32,
  textSdfSmoothing : f32,
  textMsdfDistanceRange : f32,
};

@group(0) @binding(auto) var<uniform> textViewport : TextViewportUniforms;
@group(0) @binding(auto) var fontAtlasTexture : texture_2d_array<f32>;
@group(0) @binding(auto) var fontAtlasTextureSampler : sampler;
struct VertexInputs {
  @builtin(vertex_index) vertexIndex : u32,
  @location(0) positions : vec2<f32>,
  @location(1) glyphOffsets : vec2<i32>,
  @location(2) glyphFrames : vec4<u32>,
  @location(3) glyphPages : u32,
  @location(4) rowIndices : u32,
  @location(5) glyphClipRects : vec4<f32>,
  @location(6) colors : vec4<f32>,
};

struct FragmentInputs {
  @builtin(position) Position : vec4<f32>,
  @location(0) textureCoordinate : vec2<f32>,
  @location(1) textColor : vec4<f32>,
  @interpolate(flat, either)
  @location(2) objectIndex : i32,
  @interpolate(flat)
  @location(3) atlasPage : u32,
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

fn isGlyphVertexClipped(glyphVertexOffset : vec2<f32>, clipRect : vec4<f32>) -> bool {
  if (clipRect.z >= 0) {
    let clipMinX = clipRect.x;
    let clipMaxX = clipMinX + clipRect.z;
    if (glyphVertexOffset.x < clipMinX || glyphVertexOffset.x > clipMaxX) {
      return true;
    }
  }
  if (clipRect.w >= 0) {
    let clipMinY = clipRect.y;
    let clipMaxY = clipMinY + clipRect.w;
    if (glyphVertexOffset.y < clipMinY || glyphVertexOffset.y > clipMaxY) {
      return true;
    }
  }
  return false;
}

${makeTextGlyphAlphaWgsl({
  functionName: 'getGlyphAlpha',
  textureCoordinate: 'inputs.textureCoordinate',
  atlasPage: 'inputs.atlasPage',
  settings: TEXT_VIEWPORT_FRAGMENT_SHADER_SETTINGS
})}

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
  outputs.atlasPage = inputs.glyphPages;
  let neutralTextColor = vec4<f32>(0.78, 0.86, 0.96, 1.0);
  outputs.textColor = mix(neutralTextColor, inputs.colors, textViewport.colorsEnabled);
  outputs.objectIndex = i32(inputs.rowIndices);
  TEXT_ATTRIBUTE_VERTEX_TRANSFORM(
    &outputs,
    worldPosition,
    glyphFrame,
    corner,
    glyphSize,
    atlasSize
  );
  return outputs;
}

@fragment
fn fragmentMain(inputs : FragmentInputs) -> @location(0) vec4<f32> {
  let glyphAlpha = getGlyphAlpha(inputs);
  let fragColor = vec4<f32>(inputs.textColor.rgb, inputs.textColor.a * glyphAlpha);
  return picking_filterHighlightColor(fragColor, inputs.objectIndex);
}

@fragment
fn fragmentPicking(inputs : FragmentInputs) -> PickingFragmentOutputs {
  if (getGlyphAlpha(inputs) <= 0.0) {
    discard;
  }
  var outputs : PickingFragmentOutputs;
  outputs.fragColor = vec4<f32>(0.0, 0.0, 0.0, 0.0);
  outputs.pickingColor = picking_getPickingColor(inputs.objectIndex);
  return outputs;
}
`;

export const TEXT_STORAGE_INDEXED_WGSL_SHADER = /* wgsl */ `\
struct TextViewportUniforms {
  cameraOffset : vec2<f32>,
  viewportScale : vec2<f32>,
  glyphWorldScale : f32,
  time : f32,
  clippingEnabled : f32,
  colorsEnabled : f32,
};

@group(0) @binding(auto) var<uniform> textViewport : TextViewportUniforms;
@group(0) @binding(auto) var fontAtlasTexture : texture_2d_array<f32>;
@group(0) @binding(auto) var fontAtlasTextureSampler : sampler;
@group(0) @binding(auto) var<storage, read> textRowPositions : array<vec2<f32>>;
@group(0) @binding(auto) var<storage, read> textRowColors : array<u32>;
@group(0) @binding(auto) var<storage, read> textRowAngles : array<f32>;
@group(0) @binding(auto) var<storage, read> textRowSizes : array<f32>;
@group(0) @binding(auto) var<storage, read> textRowPixelOffsets : array<vec2<f32>>;
@group(0) @binding(auto) var<storage, read> textRowClipRects : array<vec4<f32>>;
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
  sdfThreshold : f32,
  sdfSmoothing : f32,
  fontRenderMode : u32,
  msdfDistanceRange : f32,
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
  @interpolate(flat, either)
  @location(2) objectIndex : i32,
  @interpolate(flat)
  @location(3) atlasPage : u32,
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

fn unpackClipRect(words : vec4<f32>) -> vec4<f32> {
  return words;
}

fn isGlyphVertexClipped(glyphVertexOffset : vec2<f32>, clipRect : vec4<f32>) -> bool {
  if (clipRect.z >= 0) {
    let clipMinX = clipRect.x;
    let clipMaxX = clipMinX + clipRect.z;
    if (glyphVertexOffset.x < clipMinX || glyphVertexOffset.x > clipMaxX) {
      return true;
    }
  }
  if (clipRect.w >= 0) {
    let clipMinY = clipRect.y;
    let clipMaxY = clipMinY + clipRect.w;
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
  if (angleDegrees == 0.0) {
    return offset;
  }
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
  var isClipped = false;
  if (textViewport.clippingEnabled > 0.5 && textStorageStyleConfig.hasClipRects != 0u) {
    let clipRect = unpackClipRect(textRowClipRects[rowIndex]);
    isClipped = isGlyphVertexClipped(glyphVertexOffset, clipRect);
  }

  outputs.Position = select(
    vec4<f32>(clipPosition, 0.0, 1.0),
    vec4<f32>(0.0),
    isClipped
  );
  outputs.textureCoordinate = atlasPixel / atlasSize;
  outputs.atlasPage = inputs.glyphIndices.y;
  outputs.textColor = textStorageStyleConfig.constantColor;
  if (textStorageStyleConfig.useRowColors != 0u) {
    outputs.textColor = unpackTextColor(textRowColors[rowStorageIndex]);
  }
  outputs.objectIndex = i32(textStorageStyleConfig.batchRowIndexBase + rowIndex);
  return outputs;
}

${makeTextGlyphAlphaWgsl({
  functionName: 'getStorageGlyphAlpha',
  textureCoordinate: 'inputs.textureCoordinate',
  atlasPage: 'inputs.atlasPage',
  settings: TEXT_STORAGE_FRAGMENT_SHADER_SETTINGS
})}

@fragment
fn fragmentMain(inputs : FragmentInputs) -> @location(0) vec4<f32> {
  let glyphAlpha = getStorageGlyphAlpha(inputs);
  let fragColor = vec4<f32>(inputs.textColor.rgb, inputs.textColor.a * glyphAlpha);
  return picking_filterHighlightColor(fragColor, inputs.objectIndex);
}

@fragment
fn fragmentPicking(inputs : FragmentInputs) -> PickingFragmentOutputs {
  if (getStorageGlyphAlpha(inputs) <= 0.0) {
    discard;
  }
  var outputs : PickingFragmentOutputs;
  outputs.fragColor = vec4<f32>(0.0, 0.0, 0.0, 0.0);
  outputs.pickingColor = picking_getPickingColor(inputs.objectIndex);
  return outputs;
}
`;

export const TEXT_ROW_INDEXED_STORAGE_WGSL_SHADER = TEXT_STORAGE_INDEXED_WGSL_SHADER.replace(
  '@location(1) glyphIndices : vec2<u32>,',
  `@location(1) glyphIndices : vec2<u32>,
  @location(2) glyphRowIndices : u32,`
).replace('let rowIndex = findRowIndex(glyphIndex);', 'let rowIndex = inputs.glyphRowIndices;');

export const TEXT_DICTIONARY_STORAGE_WGSL_SHADER = /* wgsl */ `\
struct TextViewportUniforms {
  cameraOffset : vec2<f32>,
  viewportScale : vec2<f32>,
  glyphWorldScale : f32,
  time : f32,
  clippingEnabled : f32,
  colorsEnabled : f32,
};

@group(0) @binding(auto) var<uniform> textViewport : TextViewportUniforms;
@group(0) @binding(auto) var fontAtlasTexture : texture_2d_array<f32>;
@group(0) @binding(auto) var fontAtlasTextureSampler : sampler;
@group(0) @binding(auto) var<storage, read> textRowPositions : array<vec2<f32>>;
@group(0) @binding(auto) var<storage, read> textRowColors : array<u32>;
@group(0) @binding(auto) var<storage, read> textRowAngles : array<f32>;
@group(0) @binding(auto) var<storage, read> textRowSizes : array<f32>;
@group(0) @binding(auto) var<storage, read> textRowPixelOffsets : array<vec2<f32>>;
@group(0) @binding(auto) var<storage, read> textRowClipRects : array<vec4<f32>>;
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
  sdfThreshold : f32,
  sdfSmoothing : f32,
  fontRenderMode : u32,
  msdfDistanceRange : f32,
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
  @interpolate(flat, either)
  @location(2) objectIndex : i32,
  @interpolate(flat)
  @location(3) atlasPage : u32,
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

fn unpackClipRect(words : vec4<f32>) -> vec4<f32> {
  return words;
}

fn isGlyphVertexClipped(glyphVertexOffset : vec2<f32>, clipRect : vec4<f32>) -> bool {
  if (clipRect.z >= 0) {
    let clipMinX = clipRect.x;
    let clipMaxX = clipMinX + clipRect.z;
    if (glyphVertexOffset.x < clipMinX || glyphVertexOffset.x > clipMaxX) {
      return true;
    }
  }
  if (clipRect.w >= 0) {
    let clipMinY = clipRect.y;
    let clipMaxY = clipMinY + clipRect.w;
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
  if (angleDegrees == 0.0) {
    return offset;
  }
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
  outputs.atlasPage = 0u;
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
  let glyphId = glyphRecord.y & 0xffffu;
  let glyphPage = glyphRecord.y >> 16u;
  let glyphFrame = textGlyphFrames[glyphId];
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
  var isClipped = false;
  if (textViewport.clippingEnabled > 0.5 && textStorageStyleConfig.hasClipRects != 0u) {
    let clipRect = unpackClipRect(textRowClipRects[rowIndex]);
    isClipped = isGlyphVertexClipped(glyphVertexOffset, clipRect);
  }

  outputs.Position = select(
    vec4<f32>(clipPosition, 0.0, 1.0),
    vec4<f32>(0.0),
    isClipped
  );
  outputs.textureCoordinate = atlasPixel / atlasSize;
  outputs.atlasPage = glyphPage;
  outputs.textColor = textStorageStyleConfig.constantColor;
  if (textStorageStyleConfig.useRowColors != 0u) {
    outputs.textColor = unpackTextColor(textRowColors[rowStorageIndex]);
  }
  outputs.objectIndex = i32(textStorageStyleConfig.batchRowIndexBase + rowIndex);
  return outputs;
}

${makeTextGlyphAlphaWgsl({
  functionName: 'getStorageGlyphAlpha',
  textureCoordinate: 'inputs.textureCoordinate',
  atlasPage: 'inputs.atlasPage',
  settings: TEXT_STORAGE_FRAGMENT_SHADER_SETTINGS
})}

@fragment
fn fragmentMain(inputs : FragmentInputs) -> @location(0) vec4<f32> {
  let glyphAlpha = getStorageGlyphAlpha(inputs);
  let fragColor = vec4<f32>(inputs.textColor.rgb, inputs.textColor.a * glyphAlpha);
  return picking_filterHighlightColor(fragColor, inputs.objectIndex);
}

@fragment
fn fragmentPicking(inputs : FragmentInputs) -> PickingFragmentOutputs {
  if (getStorageGlyphAlpha(inputs) <= 0.0) {
    discard;
  }
  var outputs : PickingFragmentOutputs;
  outputs.fragColor = vec4<f32>(0.0, 0.0, 0.0, 0.0);
  outputs.pickingColor = picking_getPickingColor(inputs.objectIndex);
  return outputs;
}
`;

export const VS_GLSL = /* glsl */ `\
#version 300 es
precision highp float;
precision highp int;

in vec2 positions;
in ivec2 glyphOffsets;
in uvec4 glyphFrames;
in uint glyphPages;
in uint rowIndices;
in vec4 glyphClipRects;
in vec4 colors;

layout(std140) uniform textViewportUniforms {
  vec2 cameraOffset;
  vec2 viewportScale;
  float glyphWorldScale;
  float time;
  float clippingEnabled;
  float colorsEnabled;
  float textFontRenderMode;
  float textSdfThreshold;
  float textSdfSmoothing;
  float textMsdfDistanceRange;
} textViewport;

uniform highp sampler2DArray fontAtlasTexture;
out vec2 vTextureCoordinate;
out vec4 vTextColor;
flat out uint vAtlasPage;

vec2 getCorner(int vertexIndex) {
  if (vertexIndex == 0) return vec2(0.0, 0.0);
  if (vertexIndex == 1) return vec2(1.0, 0.0);
  if (vertexIndex == 2) return vec2(1.0, 1.0);
  if (vertexIndex == 3) return vec2(0.0, 0.0);
  if (vertexIndex == 4) return vec2(1.0, 1.0);
  return vec2(0.0, 1.0);
}

bool isGlyphVertexClipped(vec2 glyphVertexOffset, vec4 clipRect) {
  if (clipRect.z >= 0) {
    float clipMinX = clipRect.x;
    float clipMaxX = clipMinX + clipRect.z;
    if (glyphVertexOffset.x < clipMinX || glyphVertexOffset.x > clipMaxX) {
      return true;
    }
  }
  if (clipRect.w >= 0) {
    float clipMinY = clipRect.y;
    float clipMaxY = clipMinY + clipRect.w;
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
  vec2 atlasSize = vec2(textureSize(fontAtlasTexture, 0).xy);
  vec2 atlasCorner = vec2(corner.x, 1.0 - corner.y);
  vec2 atlasPixel = glyphFrame.xy + atlasCorner * glyphSize;

  gl_Position = textViewport.clippingEnabled > 0.5 &&
    isGlyphVertexClipped(glyphVertexOffset, glyphClipRects)
    ? vec4(0.0)
    : vec4(clipPosition, 0.0, 1.0);
  vTextureCoordinate = atlasPixel / atlasSize;
  vAtlasPage = glyphPages;
  vec4 neutralTextColor = vec4(0.78, 0.86, 0.96, 1.0);
  vTextColor = mix(neutralTextColor, colors, textViewport.colorsEnabled);
  TEXT_ATTRIBUTE_VERTEX_TRANSFORM(
    gl_Position,
    vTextureCoordinate,
    vTextColor,
    worldPosition,
    glyphFrame,
    corner,
    glyphSize,
    atlasSize
  );
}
`;

export const FS_GLSL = /* glsl */ `\
#version 300 es
precision highp float;

layout(std140) uniform textViewportUniforms {
  vec2 cameraOffset;
  vec2 viewportScale;
  float glyphWorldScale;
  float time;
  float clippingEnabled;
  float colorsEnabled;
  float textFontRenderMode;
  float textSdfThreshold;
  float textSdfSmoothing;
  float textMsdfDistanceRange;
} textViewport;

uniform highp sampler2DArray fontAtlasTexture;

in vec2 vTextureCoordinate;
in vec4 vTextColor;
flat in uint vAtlasPage;
out vec4 fragColor;

${makeTextGlyphAlphaGlsl({
  functionName: 'getGlyphAlpha',
  textureCoordinate: 'vTextureCoordinate',
  atlasPage: 'vAtlasPage',
  settings: TEXT_VIEWPORT_FRAGMENT_SHADER_SETTINGS
})}

void main() {
  float glyphAlpha = getGlyphAlpha();
  fragColor = vec4(vTextColor.rgb, vTextColor.a * glyphAlpha);
  fragColor = picking_filterColor(fragColor);
}
`;

export const PICKING_FS_GLSL = /* glsl */ `\
#version 300 es
precision highp float;
precision highp int;

layout(std140) uniform textViewportUniforms {
  vec2 cameraOffset;
  vec2 viewportScale;
  float glyphWorldScale;
  float time;
  float clippingEnabled;
  float colorsEnabled;
  float textFontRenderMode;
  float textSdfThreshold;
  float textSdfSmoothing;
  float textMsdfDistanceRange;
} textViewport;

uniform highp sampler2DArray fontAtlasTexture;

in vec2 vTextureCoordinate;
flat in uint vAtlasPage;
layout(location = 0) out vec4 fragColor;
layout(location = 1) out ivec4 pickingColor;

${makeTextGlyphAlphaGlsl({
  functionName: 'getGlyphAlpha',
  textureCoordinate: 'vTextureCoordinate',
  atlasPage: 'vAtlasPage',
  settings: TEXT_VIEWPORT_FRAGMENT_SHADER_SETTINGS
})}

void main() {
  float glyphAlpha = getGlyphAlpha();
  if (glyphAlpha <= 0.0) {
    discard;
  }
  fragColor = vec4(0.0);
  pickingColor = picking_getPickingColor();
}
`;

export type TextViewportUniforms = {
  cameraOffset: [number, number];
  viewportScale: [number, number];
  glyphWorldScale: number;
  time: number;
  clippingEnabled: number;
  colorsEnabled: number;
  textFontRenderMode: number;
  textSdfThreshold: number;
  textSdfSmoothing: number;
  textMsdfDistanceRange: number;
  contentCutoffPixels?: [number, number];
  contentAlign?: [number, number];
};

export const textViewport: ShaderModule<TextViewportUniforms> = {
  name: 'textViewport',
  uniformTypes: {
    cameraOffset: 'vec2<f32>',
    viewportScale: 'vec2<f32>',
    glyphWorldScale: 'f32',
    time: 'f32',
    clippingEnabled: 'f32',
    colorsEnabled: 'f32',
    textFontRenderMode: 'f32',
    textSdfThreshold: 'f32',
    textSdfSmoothing: 'f32',
    textMsdfDistanceRange: 'f32',
    contentCutoffPixels: 'vec2<f32>',
    contentAlign: 'vec2<f32>'
  },
  defaultUniforms: {
    cameraOffset: [0, 0],
    viewportScale: [1, 1],
    glyphWorldScale: 1,
    time: 0,
    clippingEnabled: 0,
    colorsEnabled: 0,
    textFontRenderMode: 0,
    textSdfThreshold: 0.5,
    textSdfSmoothing: 0.1,
    textMsdfDistanceRange: 0,
    contentCutoffPixels: [0, 0],
    contentAlign: [0, 0]
  }
};

export type ArrowTextShaderInputs = ShaderInputs<{
  textViewport: typeof textViewport.props;
  picking: typeof picking.props;
}>;

export function createArrowTextShaderInputs(
  pickingModule: typeof picking = picking
): ArrowTextShaderInputs {
  return new ShaderInputs<{
    textViewport: typeof textViewport.props;
    picking: typeof picking.props;
  }>({
    textViewport,
    picking: pickingModule
  });
}
