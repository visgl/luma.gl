// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer, type Device, type ShaderLayout} from '@luma.gl/core';
import {
  ArrowModel,
  GPUVector,
  getArrowVectorBufferSource,
  isNumericArrowType,
  makeArrowFixedSizeListVector,
  type ArrowModelProps,
  type NumericArrowType
} from '@luma.gl/arrow';
import {DynamicTexture, Model} from '@luma.gl/engine';
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
  dispatchGpuUtf8ExpandedTextCompute,
  type GpuExpandedGeneratedState
} from './gpu-text-expansion';
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

type ArrowStorageTextRenderProps = Omit<
  ArrowTextModelProps,
  | 'labelVectors'
  | 'texts'
  | 'clipRects'
  | 'characterSet'
  | 'fontSettings'
  | 'lineHeight'
  | 'fontAtlasManager'
  | 'characterMapping'
  | 'fontAtlas'
>;

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
  rowPositionsBuffer: Buffer;
  rowClipRectsBuffer?: Buffer;
  glyphFramesBuffer: Buffer;
  generatedGlyphOffsetsBuffer: Buffer;
  generatedGlyphIndicesBuffer: Buffer;
  generatedRowIndicesBuffer: Buffer;
  destroy: () => void;
};

export type ArrowStorageTextModelProps =
  | (ArrowTextModelProps & {storageState?: never})
  | (ArrowStorageTextRenderProps & {storageState: ArrowStorageTextState});

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
 * WebGPU-only Arrow text model backed by reusable storage/render state.
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
  rowPositionsBuffer!: Buffer;
  rowClipRectsBuffer?: Buffer;
  glyphFramesBuffer!: Buffer;
  generatedGlyphOffsetsBuffer!: Buffer;
  generatedGlyphIndicesBuffer!: Buffer;
  generatedRowIndicesBuffer!: Buffer;
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
    const arrowProps = props as Partial<ArrowTextModelProps>;
    const shouldReplaceState =
      nextUsesExternalState ||
      arrowProps.labelVectors !== undefined ||
      arrowProps.texts !== undefined ||
      arrowProps.clipRects !== undefined ||
      arrowProps.characterSet !== undefined ||
      arrowProps.fontSettings !== undefined ||
      arrowProps.lineHeight !== undefined ||
      arrowProps.characterMapping !== undefined ||
      arrowProps.fontAtlas !== undefined;

    this.textProps = nextProps;
    if (!shouldReplaceState) {
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
    this.setAttributes({
      [GLYPH_OFFSETS_COLUMN]: nextStorageState.generatedGlyphOffsetsBuffer,
      [GLYPH_INDICES_COLUMN]: nextStorageState.generatedGlyphIndicesBuffer,
      [ROW_INDICES_COLUMN]: nextStorageState.generatedRowIndicesBuffer
    });
    this.setBindings(createArrowStorageTextBindings(nextProps, nextStorageState));
    this.setInstanceCount(nextStorageState.glyphCount);
    this.setNeedsRedraw('Arrow storage text state updated');
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
    this.rowPositionsBuffer = storageState.rowPositionsBuffer;
    this.rowClipRectsBuffer = storageState.rowClipRectsBuffer;
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
  props: ArrowTextModelProps
): ArrowStorageTextState {
  if (device.type !== 'webgpu') {
    throw new Error('createArrowStorageTextState requires a WebGPU device');
  }
  const textInputs = resolveArrowTextInputs(props);
  const mappingState = resolveCharacterMapping(props, textInputs.texts);
  const atlasTexture = mappingState.fontAtlas
    ? new DynamicTexture(device, {
        id: `${props.id || 'arrow-storage-text-model'}-atlas`,
        data: mappingState.fontAtlas.data
      })
    : undefined;
  const rowState = createStorageTextRowState(device, props, textInputs);
  const useGpuUtf8Decode = Boolean(mappingState.characterSet && props.characterSet !== 'auto');

  let glyphStream: GpuExpandedTextStream | undefined;
  let glyphFrames: StorageGlyphFrameState;
  let generated: GpuExpandedGeneratedState;
  let renderInstanceCount: number;
  let computeInputBuildTimeMs: number;
  let computeTextInputByteLength: number;
  let transientComputeInputByteLength: number;

  if (useGpuUtf8Decode) {
    const utf8TextInput = buildGpuUtf8TextInput(textInputs.texts);
    const glyphDefinitions = buildGpuUtf8GlyphDefinitions({
      mapping: mappingState.mapping,
      baselineOffset: mappingState.baselineOffset,
      lineHeight: mappingState.lineHeight,
      characterSet: mappingState.characterSet!
    });
    glyphFrames = createStorageGlyphFrames(device, props, glyphDefinitions.glyphFrames);
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
        labelCount: textInputs.texts.length
      }
    );
    generated = createGpuExpandedGeneratedState(device, {id: props.id}, utf8TextInput.byteLength);
    dispatchGpuUtf8ExpandedTextCompute(
      device,
      {id: props.id},
      {
        utf8Input,
        glyphLookup,
        glyphMetrics,
        generated,
        outputSlotCount: utf8TextInput.byteLength,
        labelCount: textInputs.texts.length
      }
    );
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
      texts: textInputs.texts,
      mapping: mappingState.mapping,
      baselineOffset: mappingState.baselineOffset,
      lineHeight: mappingState.lineHeight,
      characterSet: mappingState.characterSet
    });
    glyphFrames = createStorageGlyphFrames(device, props, glyphStream.glyphFrames);
    const glyphMetrics = createStorageGlyphMetrics(
      device,
      {id: props.id},
      glyphStream.glyphMetrics
    );
    const compactInput = createGpuExpandedCompactInput(device, {id: props.id}, glyphStream);
    generated = createGpuExpandedGeneratedState(device, {id: props.id}, glyphStream.glyphCount);
    dispatchGpuExpandedTextCompute(
      device,
      {id: props.id},
      {
        compactInput,
        glyphMetrics,
        generated,
        glyphCount: glyphStream.glyphCount,
        labelCount: textInputs.texts.length
      }
    );
    renderInstanceCount = glyphStream.glyphCount;
    computeInputBuildTimeMs = glyphStream.glyphStreamBuildTimeMs;
    computeTextInputByteLength = glyphStream.compactStreamByteLength;
    transientComputeInputByteLength = compactInput.byteLength + glyphMetrics.byteLength;
    glyphMetrics.buffer.destroy();
    compactInput.glyphRangesBuffer.destroy();
    compactInput.glyphIdsBuffer.destroy();
    compactInput.expansionConfigBuffer.destroy();
  }

  let destroyed = false;
  return {
    glyphStream,
    fontAtlasManager: mappingState.fontAtlasManager,
    atlasTexture,
    characterSet: mappingState.characterSet,
    glyphCount: renderInstanceCount,
    glyphAttributeBuildTimeMs: computeInputBuildTimeMs,
    glyphAttributeByteLength: generated.byteLength,
    compactStreamBuildTimeMs: computeInputBuildTimeMs,
    compactStreamByteLength: computeTextInputByteLength,
    generatedRenderBufferByteLength: generated.byteLength,
    rowStorageByteLength: rowState.byteLength,
    glyphDefinitionStorageByteLength: glyphFrames.byteLength,
    transientComputeInputByteLength,
    rowPositionsBuffer: rowState.positionsBuffer,
    rowClipRectsBuffer: rowState.clipRectsBuffer,
    glyphFramesBuffer: glyphFrames.buffer,
    generatedGlyphOffsetsBuffer: generated.glyphOffsetsBuffer,
    generatedGlyphIndicesBuffer: generated.glyphIndicesBuffer,
    generatedRowIndicesBuffer: generated.rowIndicesBuffer,
    destroy: () => {
      if (destroyed) {
        return;
      }
      destroyed = true;
      atlasTexture?.destroy();
      rowState.positionsBuffer.destroy();
      rowState.clipRectsBuffer?.destroy();
      glyphFrames.buffer.destroy();
      generated.glyphOffsetsBuffer.destroy();
      generated.glyphIndicesBuffer.destroy();
      generated.rowIndicesBuffer.destroy();
    }
  };
}

function createArrowStorageTextModelProps(
  props: ArrowStorageTextModelProps,
  storageState: ArrowStorageTextState
): ArrowModelProps {
  return {
    ...props,
    source:
      props.source ??
      (storageState.rowClipRectsBuffer
        ? DEFAULT_CLIPPED_STORAGE_INDEXED_TEXT_SOURCE
        : DEFAULT_STORAGE_INDEXED_TEXT_SOURCE),
    shaderLayout: props.shaderLayout ?? DEFAULT_STORAGE_INDEXED_TEXT_SHADER_LAYOUT,
    bindings: createArrowStorageTextBindings(props, storageState),
    attributes: {
      ...(props.attributes || {}),
      [GLYPH_OFFSETS_COLUMN]: storageState.generatedGlyphOffsetsBuffer,
      [GLYPH_INDICES_COLUMN]: storageState.generatedGlyphIndicesBuffer,
      [ROW_INDICES_COLUMN]: storageState.generatedRowIndicesBuffer
    },
    bufferLayout: [
      ...(props.bufferLayout || []),
      {name: GLYPH_OFFSETS_COLUMN, format: 'sint16x2', stepMode: 'instance'},
      {name: GLYPH_INDICES_COLUMN, format: 'uint16x2', stepMode: 'instance'},
      {name: ROW_INDICES_COLUMN, format: 'uint32', stepMode: 'instance'}
    ],
    vertexCount: props.vertexCount ?? 6,
    instanceCount: storageState.glyphCount
  };
}

function createArrowStorageTextBindings(
  props: ArrowStorageTextModelProps,
  storageState: ArrowStorageTextState
): NonNullable<ArrowModelProps['bindings']> {
  return {
    ...(props.bindings || {}),
    textRowPositions: storageState.rowPositionsBuffer,
    textGlyphFrames: storageState.glyphFramesBuffer,
    ...(storageState.rowClipRectsBuffer ? {textRowClipRects: storageState.rowClipRectsBuffer} : {}),
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
  props: ArrowTextModelProps,
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

type StorageTextRowState = {
  positionsBuffer: Buffer;
  clipRectsBuffer?: Buffer;
  byteLength: number;
};

type StorageGlyphFrameState = {
  buffer: Buffer;
  byteLength: number;
};

function createStorageTextRowState(
  device: Device,
  props: ArrowTextModelProps,
  textInputs: ResolvedArrowTextInputs
): StorageTextRowState {
  const positions = getStorageTextPositions(textInputs.labelTable, textInputs.texts.length);
  const packedClipRects = textInputs.clipRects
    ? packStorageTextClipRects(textInputs.clipRects)
    : undefined;
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
  props: ArrowTextModelProps,
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

function getStorageTextPositions(labelTable: arrow.Table, labelCount: number): Float32Array {
  const positions = labelTable.getChild('positions');
  if (!positions) {
    throw new Error('ArrowStorageTextModel requires labelTable.positions');
  }
  if (positions.length !== labelCount) {
    throw new Error('ArrowStorageTextModel positions rows must match UTF-8 text rows');
  }
  if (
    !arrow.DataType.isFixedSizeList(positions.type) ||
    positions.type.listSize !== 2 ||
    !(positions.type.children[0]?.type instanceof arrow.Float32)
  ) {
    throw new Error('ArrowStorageTextModel positions must be FixedSizeList<Float32>[2]');
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
