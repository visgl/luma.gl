// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {type Device, type ShaderLayout} from '@luma.gl/core';
import {
  ArrowModel,
  getArrowVectorBufferSource,
  isNumericArrowType,
  makeArrowFixedSizeListVector,
  type ArrowModelProps,
  type NumericArrowType
} from '@luma.gl/arrow';
import {DynamicTexture} from '@luma.gl/engine';
import * as arrow from 'apache-arrow';
import FontAtlasManager, {
  DEFAULT_FONT_SETTINGS,
  type FontAtlas,
  type FontSettings
} from './font-atlas-manager';
import {
  buildArrowGlyphLayout,
  buildIndirectArrowGlyphLayout,
  buildArrowUtf8Chunks,
  decodeArrowUtf8CodePoints,
  populateUtf8TextIndices,
  type ArrowGlyphLayout,
  type IndirectArrowGlyphLayout,
  type Utf8TextIndexTarget
} from './arrow-text';
import type {CharacterMapping} from './text-utils';

const GLYPH_OFFSETS_COLUMN = 'glyphOffsets';
const GLYPH_FRAMES_COLUMN = 'glyphFrames';
const GLYPH_INDICES_COLUMN = 'glyphIndices';
const GLYPH_CLIP_RECTS_COLUMN = 'glyphClipRects';
const ROW_INDICES_COLUMN = 'rowIndices';

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
