// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer, type Device, type RenderPass, type ShaderLayout} from '@luma.gl/core';
import {
  ArrowModel,
  GPUVector,
  getArrowVectorBufferSource,
  isNumericArrowType,
  makeArrowFixedSizeListVector,
  type ArrowModelProps,
  type NumericArrowType
} from '@luma.gl/arrow';
import {DynamicBuffer, DynamicTexture, Model} from '@luma.gl/engine';
import * as arrow from 'apache-arrow';
import FontAtlasManager, {
  DEFAULT_FONT_SETTINGS,
  type FontAtlas,
  type FontSettings
} from './font-atlas-manager';
import {
  buildArrowGlyphLayout,
  buildGpuExpandedTextStream,
  buildGpuUtf8TextInput,
  buildArrowUtf8Chunks,
  decodeArrowUtf8CodePoints,
  populateUtf8TextIndices,
  type ArrowGlyphLayout,
  type GpuExpandedTextStream,
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
const MISSING_CHAR_WIDTH = 32;
const MAX_UINT16 = 65535;
const DEFAULT_STORAGE_TEXT_COLOR: [number, number, number, number] = [0, 0, 0, 255];
const DEFAULT_STORAGE_TEXT_ANGLE = 0;
const DEFAULT_STORAGE_TEXT_SIZE = 32;
const DEFAULT_STORAGE_TEXT_PIXEL_OFFSET: [number, number] = [0, 0];
const DEFAULT_STORAGE_TEXT_ANCHOR = 0;
const DEFAULT_STORAGE_ALIGNMENT_BASELINE = 0;
type StorageTextBuffer = Buffer | DynamicBuffer;

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

const DEFAULT_STORAGE_INDEXED_TEXT_SOURCE = /* wgsl */ `
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

@vertex
fn vertexMain(inputs: VertexInputs) -> FragmentInputs {
  let corner = getGlyphCorner(inputs.vertexIndex);
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
  let textScale = textSize / 32.0;
  let styledGlyphVertexOffset = rotateTextOffset(glyphVertexOffset * textScale, angleDegrees);
  var pixelOffset = textStorageStyleConfig.constantPixelOffset;
  if (textStorageStyleConfig.useRowPixelOffsets != 0u) {
    pixelOffset = textRowPixelOffsets[rowIndex];
  }
  let glyphPosition =
    textRowPositions[rowIndex] + (styledGlyphVertexOffset + pixelOffset) * 0.001;
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
    outputs.color = unpackTextColor(textRowColors[rowIndex]);
  }
  return outputs;
}

@fragment
fn fragmentMain(inputs: FragmentInputs) -> @location(0) vec4<f32> {
  let alpha = textureSample(fontAtlasTexture, fontAtlasTextureSampler, inputs.atlasUV).a;
  return vec4<f32>(inputs.color.rgb, inputs.color.a * alpha);
}
`;

export type ArrowTextGlyphTable = {
  table: arrow.Table;
  glyphLayout: ArrowGlyphLayout;
  characterSet?: Set<string>;
  attributeByteLength: number;
  glyphAttributeBuildTimeMs: number;
};

export type ArrowTextModelProps = Omit<
  ArrowModelProps,
  'arrowTable' | 'arrowGPUTable' | 'streamingArrowGPUTable' | 'arrowCount'
> & {
  /** One named GPU vector per label attribute. `positions` is required. */
  labelVectors: Record<string, GPUVector>;
  /** GPU UTF-8 labels aligned row-for-row with `labelVectors.positions`. */
  texts: GPUVector<arrow.Utf8>;
  /**
   * Optional packed per-label clip rectangles `[x, y, width, height]`.
   * Values are signed 16-bit glyph-layout units relative to the label origin.
   * Negative width or height disables clipping on that axis.
   */
  clipRects?: GPUVector<arrow.FixedSizeList<arrow.Int16>>;
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

export type ArrowStorageTextInputProps = Omit<ArrowTextModelProps, 'labelVectors'> & {
  /** GPU-resident row origins aligned one-for-one with `texts`. */
  positions: GPUVector<arrow.FixedSizeList<arrow.Float32>>;
  /** Optional packed RGBA8 text colors, read directly from storage. */
  colors?: GPUVector<arrow.FixedSizeList<arrow.Uint8>>;
  /** Optional per-row angles in degrees, read directly from storage. */
  angles?: GPUVector<arrow.Float32>;
  /** Optional per-row deck-style text sizes, read directly from storage. */
  sizes?: GPUVector<arrow.Float32>;
  /** Optional per-row pixel offsets. */
  pixelOffsets?: GPUVector<arrow.FixedSizeList<arrow.Float32>>;
  /** Optional per-row text anchor enum: 0=start, 1=middle, 2=end. */
  textAnchors?: GPUVector<arrow.Uint8>;
  /** Optional per-row alignment baseline enum: 0=center, 1=top, 2=bottom. */
  alignmentBaselines?: GPUVector<arrow.Uint8>;
  /** Constant fallback color used when `colors` is absent. */
  color?: [number, number, number, number];
  /** Constant fallback angle in degrees used when `angles` is absent. */
  angle?: number;
  /** Constant fallback deck-style text size used when `sizes` is absent. */
  size?: number;
  pixelOffset?: [number, number];
  textAnchor?: 'start' | 'middle' | 'end';
  alignmentBaseline?: 'center' | 'top' | 'bottom';
};

type ArrowStorageTextRenderProps = Omit<
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
>;

export type ArrowStorageTextBatchState = {
  batchRowIndexBase: number;
  rowCount: number;
  glyphCount: number;
  rowPositionsBuffer: StorageTextBuffer;
  rowColorsBuffer: StorageTextBuffer;
  rowAnglesBuffer: StorageTextBuffer;
  rowSizesBuffer: StorageTextBuffer;
  rowPixelOffsetsBuffer: StorageTextBuffer;
  rowTextAnchorsBuffer: StorageTextBuffer;
  rowAlignmentBaselinesBuffer: StorageTextBuffer;
  rowClipRectsBuffer: Buffer;
  styleConfigBuffer: DynamicBuffer;
  generatedGlyphOffsetsBuffer: Buffer;
  generatedGlyphIndicesBuffer: Buffer;
  generatedRowIndicesBuffer: Buffer;
};

export type ArrowStorageTextState = {
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
  glyphFramesBuffer: Buffer;
  batches: ArrowStorageTextBatchState[];
  ownedRowBindingResources: StorageTextOwnedResource[];
  rowPositionsBuffer: StorageTextBuffer;
  rowColorsBuffer: StorageTextBuffer;
  rowAnglesBuffer: StorageTextBuffer;
  rowSizesBuffer: StorageTextBuffer;
  rowPixelOffsetsBuffer: StorageTextBuffer;
  rowTextAnchorsBuffer: StorageTextBuffer;
  rowAlignmentBaselinesBuffer: StorageTextBuffer;
  rowClipRectsBuffer: Buffer;
  styleConfigBuffer: DynamicBuffer;
  generatedGlyphOffsetsBuffer: Buffer;
  generatedGlyphIndicesBuffer: Buffer;
  generatedRowIndicesBuffer: Buffer;
  destroy: () => void;
};

export type ArrowStorageTextModelProps =
  | (ArrowStorageTextInputProps & {storageState?: never})
  | (ArrowStorageTextRenderProps & {storageState: ArrowStorageTextState});

type StorageTextOwnedResource = Pick<GPUVector, 'destroy'> | Pick<DynamicBuffer, 'destroy'>;

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
      props.labelVectors !== undefined ||
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
 * WebGPU-only Arrow text model backed by reusable storage state.
 */
export class ArrowStorageTextModel extends Model {
  fontAtlasManager?: FontAtlasManager;
  atlasTexture?: DynamicTexture;
  characterSet?: Set<string>;
  glyphStream?: GpuExpandedTextStream;
  glyphCount!: number;
  glyphAttributeBuildTimeMs!: number;
  glyphAttributeByteLength!: number;
  compactStreamBuildTimeMs!: number;
  compactStreamByteLength!: number;
  generatedRenderBufferByteLength!: number;
  rowStorageByteLength!: number;
  glyphDefinitionStorageByteLength!: number;
  transientComputeInputByteLength!: number;
  rowPositionsBuffer!: StorageTextBuffer;
  rowColorsBuffer!: StorageTextBuffer;
  rowAnglesBuffer!: StorageTextBuffer;
  rowSizesBuffer!: StorageTextBuffer;
  rowPixelOffsetsBuffer!: StorageTextBuffer;
  rowTextAnchorsBuffer!: StorageTextBuffer;
  rowAlignmentBaselinesBuffer!: StorageTextBuffer;
  rowClipRectsBuffer!: Buffer;
  styleConfigBuffer!: DynamicBuffer;
  glyphFramesBuffer!: Buffer;
  generatedGlyphOffsetsBuffer!: Buffer;
  generatedGlyphIndicesBuffer!: Buffer;
  generatedRowIndicesBuffer!: Buffer;
  batches!: ArrowStorageTextBatchState[];
  storageState: ArrowStorageTextState;
  private textProps: ArrowStorageTextModelProps;
  private ownsStorageState: boolean;

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

  setProps(props: Partial<ArrowStorageTextModelProps>): void {
    const nextProps = {...this.textProps, ...props} as ArrowStorageTextModelProps;
    const nextUsesExternalState = hasArrowStorageTextState(nextProps);
    const arrowProps = props as Partial<ArrowStorageTextInputProps>;
    const shouldReplaceExternalState = 'storageState' in props && props.storageState !== undefined;
    const shouldReplaceState =
      shouldReplaceExternalState ||
      arrowProps.texts !== undefined ||
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
        this.setBindings(createArrowStorageTextBindings(nextProps, this.storageState, firstBatch));
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
    this.setAttributes({
      [GLYPH_OFFSETS_COLUMN]: firstBatch.generatedGlyphOffsetsBuffer,
      [GLYPH_INDICES_COLUMN]: firstBatch.generatedGlyphIndicesBuffer,
      [ROW_INDICES_COLUMN]: firstBatch.generatedRowIndicesBuffer
    });
    this.setBindings(createArrowStorageTextBindings(nextProps, nextStorageState, firstBatch));
    this.setInstanceCount(firstBatch.glyphCount);
    this.setNeedsRedraw('Arrow storage text state updated');
  }

  override draw(renderPass: RenderPass): boolean {
    let drawSuccess = true;
    for (const batch of this.storageState.batches) {
      this.setAttributes({
        [GLYPH_OFFSETS_COLUMN]: batch.generatedGlyphOffsetsBuffer,
        [GLYPH_INDICES_COLUMN]: batch.generatedGlyphIndicesBuffer,
        [ROW_INDICES_COLUMN]: batch.generatedRowIndicesBuffer
      });
      this.setBindings(createArrowStorageTextBindings(this.textProps, this.storageState, batch));
      this.setInstanceCount(batch.glyphCount);
      drawSuccess = super.draw(renderPass) && drawSuccess;
    }
    const firstBatch = getFirstArrowStorageTextBatch(this.storageState);
    this.setAttributes({
      [GLYPH_OFFSETS_COLUMN]: firstBatch.generatedGlyphOffsetsBuffer,
      [GLYPH_INDICES_COLUMN]: firstBatch.generatedGlyphIndicesBuffer,
      [ROW_INDICES_COLUMN]: firstBatch.generatedRowIndicesBuffer
    });
    this.setBindings(createArrowStorageTextBindings(this.textProps, this.storageState, firstBatch));
    this.setInstanceCount(this.storageState.glyphCount);
    return drawSuccess;
  }

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
    this.rowStorageByteLength = storageState.rowStorageByteLength;
    this.glyphDefinitionStorageByteLength = storageState.glyphDefinitionStorageByteLength;
    this.transientComputeInputByteLength = storageState.transientComputeInputByteLength;
    this.batches = storageState.batches;
    this.rowPositionsBuffer = storageState.rowPositionsBuffer;
    this.rowColorsBuffer = storageState.rowColorsBuffer;
    this.rowAnglesBuffer = storageState.rowAnglesBuffer;
    this.rowSizesBuffer = storageState.rowSizesBuffer;
    this.rowPixelOffsetsBuffer = storageState.rowPixelOffsetsBuffer;
    this.rowTextAnchorsBuffer = storageState.rowTextAnchorsBuffer;
    this.rowAlignmentBaselinesBuffer = storageState.rowAlignmentBaselinesBuffer;
    this.rowClipRectsBuffer = storageState.rowClipRectsBuffer;
    this.styleConfigBuffer = storageState.styleConfigBuffer;
    this.glyphFramesBuffer = storageState.glyphFramesBuffer;
    this.generatedGlyphOffsetsBuffer = storageState.generatedGlyphOffsetsBuffer;
    this.generatedGlyphIndicesBuffer = storageState.generatedGlyphIndicesBuffer;
    this.generatedRowIndicesBuffer = storageState.generatedRowIndicesBuffer;
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

type ResolvedArrowTextInputs = {
  labelTable: arrow.Table;
  texts: arrow.Vector<arrow.Utf8>;
  clipRects?: arrow.Vector<arrow.FixedSizeList<arrow.Int16>>;
};

function resolveArrowTextInputs(props: ArrowTextModelProps): ResolvedArrowTextInputs {
  const texts = getRetainedGPUVectorSource(props.texts, 'texts');
  if (!(texts.type instanceof arrow.Utf8)) {
    throw new Error('Text models require texts to be GPUVector<Utf8>');
  }

  const columns: Record<string, arrow.Vector> = {};
  for (const [name, vector] of Object.entries(props.labelVectors)) {
    columns[name] = getRetainedGPUVectorSource(vector, `labelVectors.${name}`);
  }
  const labelTable = new arrow.Table(columns);
  const clipRects = props.clipRects
    ? (getRetainedGPUVectorSource(props.clipRects, 'clipRects') as arrow.Vector<
        arrow.FixedSizeList<arrow.Int16>
      >)
    : undefined;

  return {
    labelTable,
    texts: texts as arrow.Vector<arrow.Utf8>,
    clipRects
  };
}

type ResolvedArrowStorageTextBatchInputs = {
  batchRowIndexBase: number;
  texts: arrow.Vector<arrow.Utf8>;
  clipRects?: arrow.Vector<arrow.FixedSizeList<arrow.Int16>>;
  positionsBuffer: StorageTextBuffer;
  colorsBuffer?: StorageTextBuffer;
  anglesBuffer?: StorageTextBuffer;
  sizesBuffer?: StorageTextBuffer;
  pixelOffsetsBuffer?: StorageTextBuffer;
  textAnchorsBuffer?: StorageTextBuffer;
  alignmentBaselinesBuffer?: StorageTextBuffer;
};

type ResolvedArrowStorageTextInputs = {
  texts: arrow.Vector<arrow.Utf8>;
  batches: ResolvedArrowStorageTextBatchInputs[];
};

function resolveArrowStorageTextInputs(
  props: ArrowStorageTextInputProps
): ResolvedArrowStorageTextInputs {
  assertStorageVectorTypes(props);
  assertStorageVectorBatchAlignment(props);
  const texts = getRetainedGPUVectorSource(props.texts, 'texts');
  const batches: ResolvedArrowStorageTextBatchInputs[] = [];
  let batchRowIndexBase = 0;

  for (let batchIndex = 0; batchIndex < props.texts.data.length; batchIndex++) {
    const textData = props.texts.data[batchIndex];
    if (!textData.sourceData) {
      throw new Error('Text models require texts GPUData chunks to retain Arrow source data');
    }
    const clipRectSourceData = props.clipRects?.data[batchIndex]?.sourceData;
    batches.push({
      batchRowIndexBase,
      texts: new arrow.Vector([textData.sourceData]) as arrow.Vector<arrow.Utf8>,
      clipRects: clipRectSourceData
        ? (new arrow.Vector([clipRectSourceData]) as arrow.Vector<arrow.FixedSizeList<arrow.Int16>>)
        : undefined,
      positionsBuffer: props.positions.data[batchIndex].buffer,
      colorsBuffer: props.colors?.data[batchIndex].buffer,
      anglesBuffer: props.angles?.data[batchIndex].buffer,
      sizesBuffer: props.sizes?.data[batchIndex].buffer,
      pixelOffsetsBuffer: props.pixelOffsets?.data[batchIndex].buffer,
      textAnchorsBuffer: props.textAnchors?.data[batchIndex].buffer,
      alignmentBaselinesBuffer: props.alignmentBaselines?.data[batchIndex].buffer
    });
    batchRowIndexBase += textData.length;
  }

  return {texts: texts as arrow.Vector<arrow.Utf8>, batches};
}

function assertStorageVectorTypes(props: ArrowStorageTextInputProps): void {
  if (!(props.texts.type instanceof arrow.Utf8)) {
    throw new Error('ArrowStorageTextModel texts must be GPUVector<Utf8>');
  }
  if (
    !arrow.DataType.isFixedSizeList(props.positions.type) ||
    props.positions.type.listSize !== 2 ||
    !(props.positions.type.children[0]?.type instanceof arrow.Float32)
  ) {
    throw new Error('ArrowStorageTextModel positions must be GPUVector<FixedSizeList<Float32>[2]>');
  }
  if (
    props.colors &&
    (!arrow.DataType.isFixedSizeList(props.colors.type) ||
      props.colors.type.listSize !== 4 ||
      !(props.colors.type.children[0]?.type instanceof arrow.Uint8))
  ) {
    throw new Error('ArrowStorageTextModel colors must be GPUVector<FixedSizeList<Uint8>[4]>');
  }
  if (props.angles && !(props.angles.type instanceof arrow.Float32)) {
    throw new Error('ArrowStorageTextModel angles must be GPUVector<Float32>');
  }
  if (props.sizes && !(props.sizes.type instanceof arrow.Float32)) {
    throw new Error('ArrowStorageTextModel sizes must be GPUVector<Float32>');
  }
  if (
    props.pixelOffsets &&
    (!arrow.DataType.isFixedSizeList(props.pixelOffsets.type) ||
      props.pixelOffsets.type.listSize !== 2 ||
      !(props.pixelOffsets.type.children[0]?.type instanceof arrow.Float32))
  ) {
    throw new Error(
      'ArrowStorageTextModel pixelOffsets must be GPUVector<FixedSizeList<Float32>[2]>'
    );
  }
  if (props.textAnchors && !(props.textAnchors.type instanceof arrow.Uint8)) {
    throw new Error('ArrowStorageTextModel textAnchors must be GPUVector<Uint8>');
  }
  if (props.alignmentBaselines && !(props.alignmentBaselines.type instanceof arrow.Uint8)) {
    throw new Error('ArrowStorageTextModel alignmentBaselines must be GPUVector<Uint8>');
  }
  const clipRects = props.clipRects
    ? getRetainedGPUVectorSource(props.clipRects, 'clipRects')
    : undefined;
  assertClipRects(
    clipRects as arrow.Vector<arrow.FixedSizeList<arrow.Int16>> | undefined,
    props.texts.length
  );
}

function assertStorageVectorBatchAlignment(props: ArrowStorageTextInputProps): void {
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
        `ArrowStorageTextModel ${name} rows must match ${referenceName} rows (${vector.length} !== ${referenceVector.length})`
      );
    }
    if (vector.data.length !== referenceVector.data.length) {
      throw new Error(
        `ArrowStorageTextModel ${name} batch count must match ${referenceName} batch count`
      );
    }
    for (let batchIndex = 0; batchIndex < vector.data.length; batchIndex++) {
      if (vector.data[batchIndex].length !== referenceVector.data[batchIndex].length) {
        throw new Error(
          `ArrowStorageTextModel ${name} batch ${batchIndex} rows must match ${referenceName}`
        );
      }
    }
  }
}

function getRetainedGPUVectorSource<T extends arrow.DataType>(
  vector: GPUVector<T>,
  vectorName: string
): arrow.Vector<T> {
  if (vector.data.length === 0) {
    return new arrow.Vector([]) as arrow.Vector<T>;
  }
  const data = vector.data.map(chunk => {
    if (!chunk.sourceData) {
      throw new Error(
        `Text models require ${vectorName} GPUData chunks to retain Arrow source data`
      );
    }
    return chunk.sourceData;
  });
  return new arrow.Vector(data) as arrow.Vector<T>;
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
  const textInputs = resolveArrowTextInputs(props);
  const mappingState = resolveCharacterMapping(props, textInputs.texts);
  const glyphTable = buildArrowTextGlyphTable({
    labelTable: textInputs.labelTable,
    texts: textInputs.texts,
    clipRects: textInputs.clipRects,
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
      vs:
        props.vs ?? (textInputs.clipRects ? DEFAULT_CLIPPED_ARROW_TEXT_VS : DEFAULT_ARROW_TEXT_VS),
      fs: props.fs ?? DEFAULT_ARROW_TEXT_FS,
      shaderLayout:
        props.shaderLayout ??
        (textInputs.clipRects
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
  const useGpuUtf8Decode = Boolean(mappingState.characterSet && props.characterSet !== 'auto');

  let glyphStream: GpuExpandedTextStream | undefined;
  let glyphFrames: StorageGlyphFrameState | undefined;
  let glyphCount = 0;
  let glyphAttributeBuildTimeMs = 0;
  let compactStreamByteLength = 0;
  let generatedRenderBufferByteLength = 0;
  let rowStorageByteLength = 0;
  let glyphDefinitionStorageByteLength = 0;
  let transientComputeInputByteLength = 0;
  const ownedRowStorageResources: StorageTextOwnedResource[] = [];
  const batches: ArrowStorageTextBatchState[] = [];
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
    glyphFrames = createStorageGlyphFrames(device, props, glyphDefinitions.glyphFrames);
    glyphDefinitionStorageByteLength = glyphFrames.byteLength;
    for (const batchInput of textInputs.batches) {
      const rowState = createStorageTextBatchRowState(device, props, batchInput, defaultBuffers);
      const utf8TextInput = buildGpuUtf8TextInput(batchInput.texts);
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
      const utf8Input = createGpuUtf8ExpandedInput(
        device,
        {id: props.id},
        {
          utf8TextInput,
          baselineOffsetY: glyphDefinitions.baselineOffsetY,
          glyphLookupCount: glyphDefinitions.glyphLookup.length / 2,
          labelCount: batchInput.texts.length,
          batchRowIndexBase: batchInput.batchRowIndexBase,
          alignment: createGpuTextAlignmentOptions(props, rowState, mappingState.lineHeight)
        }
      );
      const generated = createGpuExpandedGeneratedState(
        device,
        {id: props.id},
        utf8TextInput.byteLength
      );
      dispatchGpuUtf8ExpandedTextCompute(
        device,
        {id: props.id},
        {
          utf8Input,
          glyphLookup,
          glyphMetrics,
          generated,
          outputSlotCount: utf8TextInput.byteLength,
          labelCount: batchInput.texts.length,
          alignment: {
            rowTextAnchorsBuffer: getComputeStorageBuffer(rowState.rowTextAnchorsBuffer),
            rowAlignmentBaselinesBuffer: getComputeStorageBuffer(
              rowState.rowAlignmentBaselinesBuffer
            )
          }
        }
      );
      batches.push({
        ...rowState,
        batchRowIndexBase: batchInput.batchRowIndexBase,
        rowCount: batchInput.texts.length,
        glyphCount: utf8TextInput.byteLength,
        generatedGlyphOffsetsBuffer: generated.glyphOffsetsBuffer,
        generatedGlyphIndicesBuffer: generated.glyphIndicesBuffer,
        generatedRowIndicesBuffer: generated.rowIndicesBuffer
      });
      glyphCount += utf8TextInput.byteLength;
      glyphAttributeBuildTimeMs += utf8TextInput.textInputBuildTimeMs;
      compactStreamByteLength += utf8TextInput.inputByteLength;
      generatedRenderBufferByteLength += generated.byteLength;
      rowStorageByteLength += rowState.ownedByteLength;
      transientComputeInputByteLength +=
        utf8Input.byteLength + glyphLookup.byteLength + glyphMetrics.byteLength;
      ownedRowStorageResources.push(...rowState.ownedResources);
      glyphMetrics.buffer.destroy();
      glyphLookup.buffer.destroy();
      utf8Input.rowByteRangesBuffer.destroy();
      utf8Input.utf8BytesBuffer.destroy();
      utf8Input.expansionConfigBuffer.destroy();
    }
  } else {
    for (const [batchIndex, batchInput] of textInputs.batches.entries()) {
      const rowState = createStorageTextBatchRowState(device, props, batchInput, defaultBuffers);
      const batchGlyphStream = buildGpuExpandedTextStream({
        texts: batchInput.texts,
        mapping: mappingState.mapping,
        baselineOffset: mappingState.baselineOffset,
        lineHeight: mappingState.lineHeight,
        characterSet: mappingState.characterSet
      });
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
      const compactInput = createGpuExpandedCompactInput(
        device,
        {id: props.id},
        batchGlyphStream,
        batchInput.batchRowIndexBase,
        createGpuTextAlignmentOptions(props, rowState, mappingState.lineHeight)
      );
      const generated = createGpuExpandedGeneratedState(
        device,
        {id: props.id},
        batchGlyphStream.glyphCount
      );
      dispatchGpuExpandedTextCompute(
        device,
        {id: props.id},
        {
          compactInput,
          glyphMetrics,
          generated,
          glyphCount: batchGlyphStream.glyphCount,
          labelCount: batchInput.texts.length,
          alignment: {
            rowTextAnchorsBuffer: getComputeStorageBuffer(rowState.rowTextAnchorsBuffer),
            rowAlignmentBaselinesBuffer: getComputeStorageBuffer(
              rowState.rowAlignmentBaselinesBuffer
            )
          }
        }
      );
      batches.push({
        ...rowState,
        batchRowIndexBase: batchInput.batchRowIndexBase,
        rowCount: batchInput.texts.length,
        glyphCount: batchGlyphStream.glyphCount,
        generatedGlyphOffsetsBuffer: generated.glyphOffsetsBuffer,
        generatedGlyphIndicesBuffer: generated.glyphIndicesBuffer,
        generatedRowIndicesBuffer: generated.rowIndicesBuffer
      });
      glyphCount += batchGlyphStream.glyphCount;
      glyphAttributeBuildTimeMs += batchGlyphStream.glyphStreamBuildTimeMs;
      compactStreamByteLength += batchGlyphStream.compactStreamByteLength;
      generatedRenderBufferByteLength += generated.byteLength;
      rowStorageByteLength += rowState.ownedByteLength;
      transientComputeInputByteLength += compactInput.byteLength + glyphMetrics.byteLength;
      ownedRowStorageResources.push(...rowState.ownedResources);
      glyphMetrics.buffer.destroy();
      compactInput.glyphRangesBuffer.destroy();
      compactInput.glyphIdsBuffer.destroy();
      compactInput.expansionConfigBuffer.destroy();
    }
  }

  glyphFrames ??= createStorageGlyphFrames(device, props, new Float32Array(4));
  const firstBatch = getFirstArrowStorageTextBatch({batches});
  let destroyed = false;
  const storageState: ArrowStorageTextState = {
    glyphStream,
    fontAtlasManager: mappingState.fontAtlasManager,
    atlasTexture,
    characterSet: mappingState.characterSet,
    glyphCount,
    glyphAttributeBuildTimeMs,
    glyphAttributeByteLength: generatedRenderBufferByteLength,
    compactStreamBuildTimeMs: glyphAttributeBuildTimeMs,
    compactStreamByteLength,
    generatedRenderBufferByteLength,
    rowStorageByteLength,
    glyphDefinitionStorageByteLength,
    transientComputeInputByteLength,
    batches,
    ownedRowBindingResources: ownedRowStorageResources,
    rowPositionsBuffer: firstBatch.rowPositionsBuffer,
    rowColorsBuffer: firstBatch.rowColorsBuffer,
    rowAnglesBuffer: firstBatch.rowAnglesBuffer,
    rowSizesBuffer: firstBatch.rowSizesBuffer,
    rowPixelOffsetsBuffer: firstBatch.rowPixelOffsetsBuffer,
    rowTextAnchorsBuffer: firstBatch.rowTextAnchorsBuffer,
    rowAlignmentBaselinesBuffer: firstBatch.rowAlignmentBaselinesBuffer,
    rowClipRectsBuffer: firstBatch.rowClipRectsBuffer,
    styleConfigBuffer: firstBatch.styleConfigBuffer,
    glyphFramesBuffer: glyphFrames.buffer,
    generatedGlyphOffsetsBuffer: firstBatch.generatedGlyphOffsetsBuffer,
    generatedGlyphIndicesBuffer: firstBatch.generatedGlyphIndicesBuffer,
    generatedRowIndicesBuffer: firstBatch.generatedRowIndicesBuffer,
    destroy: () => {
      if (destroyed) {
        return;
      }
      destroyed = true;
      atlasTexture?.destroy();
      destroyStorageTextResources(ownedRowStorageResources);
      glyphFrames.buffer.destroy();
      for (const batch of batches) {
        batch.generatedGlyphOffsetsBuffer.destroy();
        batch.generatedGlyphIndicesBuffer.destroy();
        batch.generatedRowIndicesBuffer.destroy();
      }
    }
  };
  return storageState;
}

function createArrowStorageTextModelProps(
  props: ArrowStorageTextModelProps,
  storageState: ArrowStorageTextState
): ArrowModelProps {
  const firstBatch = getFirstArrowStorageTextBatch(storageState);
  return {
    ...props,
    source: props.source ?? DEFAULT_STORAGE_INDEXED_TEXT_SOURCE,
    shaderLayout: props.shaderLayout ?? DEFAULT_STORAGE_INDEXED_TEXT_SHADER_LAYOUT,
    bindings: createArrowStorageTextBindings(props, storageState, firstBatch),
    attributes: {
      ...(props.attributes || {}),
      [GLYPH_OFFSETS_COLUMN]: firstBatch.generatedGlyphOffsetsBuffer,
      [GLYPH_INDICES_COLUMN]: firstBatch.generatedGlyphIndicesBuffer,
      [ROW_INDICES_COLUMN]: firstBatch.generatedRowIndicesBuffer
    },
    bufferLayout: [
      ...(props.bufferLayout || []),
      {name: GLYPH_OFFSETS_COLUMN, format: 'sint16x2', stepMode: 'instance'},
      {name: GLYPH_INDICES_COLUMN, format: 'uint16x2', stepMode: 'instance'},
      {name: ROW_INDICES_COLUMN, format: 'uint32', stepMode: 'instance'}
    ],
    vertexCount: props.vertexCount ?? 6,
    instanceCount: firstBatch.glyphCount
  };
}

function createArrowStorageTextBindings(
  props: ArrowStorageTextModelProps,
  storageState: ArrowStorageTextState,
  batch: ArrowStorageTextBatchState
): NonNullable<ArrowModelProps['bindings']> {
  return {
    ...(props.bindings || {}),
    textRowPositions: batch.rowPositionsBuffer,
    textRowColors: batch.rowColorsBuffer,
    textRowAngles: batch.rowAnglesBuffer,
    textRowSizes: batch.rowSizesBuffer,
    textRowPixelOffsets: batch.rowPixelOffsetsBuffer,
    textRowClipRects: batch.rowClipRectsBuffer,
    textGlyphFrames: storageState.glyphFramesBuffer,
    textStorageStyleConfig: batch.styleConfigBuffer,
    ...(storageState.atlasTexture ? {fontAtlasTexture: storageState.atlasTexture} : {})
  };
}

function hasArrowStorageTextState(
  props: ArrowStorageTextModelProps
): props is ArrowStorageTextRenderProps & {storageState: ArrowStorageTextState} {
  return 'storageState' in props && props.storageState !== undefined;
}

function getNow(): number {
  return globalThis.performance?.now() ?? Date.now();
}

function resolveCharacterMapping(
  props: ArrowTextModelProps | ArrowStorageTextInputProps,
  texts: arrow.Vector<arrow.Utf8>
): {
  mapping: CharacterMapping;
  baselineOffset: number;
  lineHeight: number;
  characterSet?: Set<string>;
  fontAtlasManager?: FontAtlasManager;
  fontAtlas?: FontAtlas;
} {
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

function createStorageTextDefaultBuffers(
  device: Device,
  props: ArrowStorageTextInputProps
): StorageTextDefaultBuffers {
  const id = props.id || 'storage-text-model';
  const colorsVector = createStorageTextOwnedGpuVector(
    device,
    `${id}-default-row-colors`,
    makeArrowFixedSizeListVector(
      new arrow.Uint8(),
      4,
      new Uint8Array(props.color ?? DEFAULT_STORAGE_TEXT_COLOR)
    )
  );
  const anglesVector = createStorageTextOwnedGpuVector(
    device,
    `${id}-default-row-angles`,
    makeNumericArrowVector(
      new arrow.Float32(),
      new Float32Array([props.angle ?? DEFAULT_STORAGE_TEXT_ANGLE])
    )
  );
  const sizesVector = createStorageTextOwnedGpuVector(
    device,
    `${id}-default-row-sizes`,
    makeNumericArrowVector(
      new arrow.Float32(),
      new Float32Array([props.size ?? DEFAULT_STORAGE_TEXT_SIZE])
    )
  );
  const pixelOffsetsVector = createStorageTextOwnedGpuVector(
    device,
    `${id}-default-row-pixel-offsets`,
    makeArrowFixedSizeListVector(
      new arrow.Float32(),
      2,
      new Float32Array(props.pixelOffset ?? DEFAULT_STORAGE_TEXT_PIXEL_OFFSET)
    )
  );
  const textAnchorsVector = createStorageTextOwnedGpuVector(
    device,
    `${id}-default-row-text-anchors`,
    makeNumericArrowVector(
      new arrow.Uint32(),
      new Uint32Array([getTextAnchorEnum(props.textAnchor)])
    )
  );
  const alignmentBaselinesVector = createStorageTextOwnedGpuVector(
    device,
    `${id}-default-row-alignment-baselines`,
    makeNumericArrowVector(
      new arrow.Uint32(),
      new Uint32Array([getAlignmentBaselineEnum(props.alignmentBaseline)])
    )
  );
  const clipRectsVector = createStorageTextOwnedGpuVector(
    device,
    `${id}-default-row-clip-rects`,
    makeArrowFixedSizeListVector(new arrow.Uint32(), 2, new Uint32Array(2))
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
  props: ArrowStorageTextInputProps,
  batchInput: ResolvedArrowStorageTextBatchInputs,
  defaultBuffers: StorageTextDefaultBuffers
): StorageTextBatchRowState {
  const packedClipRects = batchInput.clipRects
    ? packStorageTextClipRects(batchInput.clipRects)
    : undefined;
  const rowClipRectsVector = packedClipRects
    ? createStorageTextOwnedGpuVector(
        device,
        `${props.id || 'storage-text-model'}-row-clip-rects-${batchInput.batchRowIndexBase}`,
        makeArrowFixedSizeListVector(
          new arrow.Uint32(),
          2,
          packedClipRects.byteLength > 0 ? packedClipRects : new Uint32Array(2)
        )
      )
    : undefined;
  const rowClipRectsBuffer = rowClipRectsVector
    ? getStorageTextGpuVectorBuffer(rowClipRectsVector)
    : defaultBuffers.clipRectsBuffer;
  const styleConfigData = createStorageTextStyleConfigData(props, batchInput.batchRowIndexBase);
  const styleConfigBuffer = new DynamicBuffer(device, {
    id: `${props.id || 'storage-text-model'}-style-config-${batchInput.batchRowIndexBase}`,
    usage: Buffer.UNIFORM | Buffer.COPY_DST | Buffer.COPY_SRC,
    data: styleConfigData
  });
  const ownedResources = [styleConfigBuffer, ...(rowClipRectsVector ? [rowClipRectsVector] : [])];

  return {
    rowPositionsBuffer: batchInput.positionsBuffer,
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

function createStorageTextOwnedGpuVector<T extends arrow.DataType>(
  device: Device,
  name: string,
  vector: arrow.Vector<T>
): GPUVector<T> {
  return new GPUVector({
    type: 'arrow',
    name,
    device,
    vector,
    bufferProps: {
      id: name,
      usage: Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC
    }
  });
}

function getStorageTextGpuVectorBuffer(vector: GPUVector): Buffer {
  const buffer = vector.buffer;
  return buffer instanceof DynamicBuffer ? buffer.buffer : buffer;
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
      const rowState = createStorageTextBatchRowState(device, props, batchInput, defaultBuffers);
      nextOwnedRowBindingResources.push(...rowState.ownedResources);
      rowStorageByteLength += rowState.ownedByteLength;
      return {
        ...rowState,
        batchRowIndexBase: previousBatch.batchRowIndexBase,
        rowCount: previousBatch.rowCount,
        glyphCount: previousBatch.glyphCount,
        generatedGlyphOffsetsBuffer: previousBatch.generatedGlyphOffsetsBuffer,
        generatedGlyphIndicesBuffer: previousBatch.generatedGlyphIndicesBuffer,
        generatedRowIndicesBuffer: previousBatch.generatedRowIndicesBuffer
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
  storageState.rowPositionsBuffer = firstBatch.rowPositionsBuffer;
  storageState.rowColorsBuffer = firstBatch.rowColorsBuffer;
  storageState.rowAnglesBuffer = firstBatch.rowAnglesBuffer;
  storageState.rowSizesBuffer = firstBatch.rowSizesBuffer;
  storageState.rowPixelOffsetsBuffer = firstBatch.rowPixelOffsetsBuffer;
  storageState.rowTextAnchorsBuffer = firstBatch.rowTextAnchorsBuffer;
  storageState.rowAlignmentBaselinesBuffer = firstBatch.rowAlignmentBaselinesBuffer;
  storageState.rowClipRectsBuffer = firstBatch.rowClipRectsBuffer;
  storageState.styleConfigBuffer = firstBatch.styleConfigBuffer;
  storageState.generatedGlyphOffsetsBuffer = firstBatch.generatedGlyphOffsetsBuffer;
  storageState.generatedGlyphIndicesBuffer = firstBatch.generatedGlyphIndicesBuffer;
  storageState.generatedRowIndicesBuffer = firstBatch.generatedRowIndicesBuffer;
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
  props: ArrowStorageTextInputProps,
  batchRowIndexBase: number
): Uint32Array {
  const arrayBuffer = new ArrayBuffer(64);
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
  uintValues[14] = 0;
  uintValues[15] = 0;
  return uintValues;
}

function createGpuTextAlignmentOptions(
  props: ArrowStorageTextInputProps,
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
  props: ArrowTextModelProps | ArrowStorageTextInputProps,
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

function getTextAnchorEnum(textAnchor: ArrowStorageTextInputProps['textAnchor']): number {
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
  alignmentBaseline: ArrowStorageTextInputProps['alignmentBaseline']
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
    throw new Error('ArrowStorageTextState requires at least one render batch');
  }
  return firstBatch;
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
