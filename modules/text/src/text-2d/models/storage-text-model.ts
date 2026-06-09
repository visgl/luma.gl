// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {type Buffer, type Device, type RenderPass} from '@luma.gl/core';
import {DynamicBuffer, DynamicTexture, Model, type ModelProps} from '@luma.gl/engine';
import FontAtlasManager from '../atlas/font-atlas-manager';
import {
  getFirstStorageTextBatch,
  getFirstStorageTextRenderBatch,
  getStorageRowGlyphStartsBuffer,
  type StorageTextBatchState,
  type StorageTextBuffer,
  type StorageTextRenderBatchState,
  type StorageTextState
} from '../model-utils/storage-text-state';
import type {GpuExpandedTextStream} from '../model-utils/gpu-text-types';
import {drawPreparedStorageTextModelBatch} from '../model-utils/storage-model-draw';
import {
  assertStorageTextGPUVectorInputs,
  STORAGE_TEXT_GPU_INPUT_SCHEMA,
  type StorageTextInputProps
} from '../model-utils/text-model-props';
import {
  COMPACT_GLYPH_VERTEX_BYTE_STRIDE,
  COMPACT_GLYPH_VERTEX_DATA,
  DEFAULT_ROW_INDEXED_STORAGE_TEXT_SHADER_LAYOUT,
  DEFAULT_ROW_INDEXED_STORAGE_TEXT_SOURCE,
  DEFAULT_STORAGE_INDEXED_TEXT_SHADER_LAYOUT,
  DEFAULT_STORAGE_INDEXED_TEXT_SOURCE,
  GLYPH_INDICES_COLUMN,
  GLYPH_OFFSETS_COLUMN,
  GLYPH_ROW_INDICES_COLUMN,
  ROW_INDEXED_COMPACT_GLYPH_VERTEX_BYTE_STRIDE
} from '../model-utils/text-shaders';

export type {StorageTextInputProps};

/**
 * Render and shader options for a storage text model that reuses prepared state.
 *
 * These are standard luma.gl model options; draw counts, storage bindings, and generated glyph
 * buffers come from the prepared {@link StorageTextState}.
 */
export interface StorageTextRenderProps extends ModelProps {}

export type {StorageTextBatchState, StorageTextRenderBatchState, StorageTextState};

/** Flat prepared props accepted by the storage text renderer. */
export type StorageTextModelProps = StorageTextInputProps &
  StorageTextState & {
    /** Whether this model owns and should destroy the prepared storage state. */
    ownsStorageState?: boolean;
  };

/** Explicit prepared-state constructor props, used when sharing state with a companion model. */
export type PreparedStorageTextModelProps = StorageTextRenderProps &
  Partial<StorageTextInputProps> &
  StorageTextState & {
    /** Whether this model owns and should destroy the prepared storage state. */
    ownsStorageState?: boolean;
  };

/**
 * Storage text renderer that consumes typed GPUVector model props plus prepared render state.
 *
 * Source adapters do layout work before constructing this model, then pass flat prepared GPU
 * vectors and generated render resources through {@link StorageTextModelProps}.
 */
export class StorageTextModel extends Model {
  /** Prepared GPU vectors consumed by the storage-backed text model. */
  static readonly gpuInputSchema = STORAGE_TEXT_GPU_INPUT_SCHEMA;

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
  batches!: StorageTextBatchState[];
  /** Generated render batches preserved for device buffer-size limits. */
  renderBatches!: StorageTextRenderBatchState[];
  /** Reusable storage text expansion and row-binding state currently bound by the model. */
  storageState: StorageTextState;
  protected ownsStorageState: boolean;
  protected renderProps: StorageTextRenderProps;

  constructor(device: Device, props: StorageTextModelProps | PreparedStorageTextModelProps) {
    if (device.type !== 'webgpu') {
      throw new Error('StorageTextModel is WebGPU-only');
    }
    if (isStorageTextInputProps(props)) {
      assertStorageTextGPUVectorInputs(props);
    }
    const storageState = props;
    const renderProps = getStorageTextRenderProps(props);
    super(device, createStorageTextModelProps(renderProps, storageState));
    this.renderProps = renderProps;
    this.storageState = storageState;
    this.ownsStorageState = props.ownsStorageState === true;
    this.applyStorageState(storageState);
  }

  /** Constructs a render-only model from an existing prepared storage state. */
  static fromState(device: Device, props: PreparedStorageTextModelProps): StorageTextModel {
    return new StorageTextModel(device, props);
  }

  /** Draws each generated storage text render batch against the supplied render pass. */
  override draw(renderPass: RenderPass): boolean {
    if (this.storageState.renderBatches.length === 1) {
      return super.draw(renderPass);
    }

    let drawSuccess = true;
    const usePreparedDraw =
      this.device.type === 'webgpu' && this.storageState.renderBatches.length > 1;
    for (const renderBatch of this.storageState.renderBatches) {
      const batch = this.storageState.batches[renderBatch.rowBindingBatchIndex];
      if (!batch) {
        throw new Error('StorageTextModel render batch is missing its row-binding batch');
      }
      this.setAttributes({
        [COMPACT_GLYPH_VERTEX_DATA]: renderBatch.compactGlyphVertexData
      });
      this.setBindings(
        createStorageTextBindings(this.renderProps, this.storageState, batch, renderBatch)
      );
      this.setInstanceCount(renderBatch.glyphCount);
      drawSuccess =
        (usePreparedDraw
          ? drawPreparedStorageTextModelBatch(this, renderPass)
          : super.draw(renderPass)) && drawSuccess;
    }
    const firstBatch = getFirstStorageTextBatch(this.storageState);
    const firstRenderBatch = getFirstStorageTextRenderBatch(this.storageState);
    this.setAttributes({
      [COMPACT_GLYPH_VERTEX_DATA]: firstRenderBatch.compactGlyphVertexData
    });
    this.setBindings(
      createStorageTextBindings(this.renderProps, this.storageState, firstBatch, firstRenderBatch)
    );
    this.setInstanceCount(this.storageState.glyphCount);
    return drawSuccess;
  }

  /** Releases owned storage text state plus inherited model resources. */
  override destroy(): void {
    if (this.ownsStorageState) {
      this.storageState.destroy();
      this.ownsStorageState = false;
    }
    super.destroy();
  }

  protected setStorageTextState(
    storageState: StorageTextState,
    renderProps: StorageTextRenderProps,
    ownsStorageState: boolean,
    redrawReason: string
  ): void {
    if (this.ownsStorageState && this.storageState !== storageState) {
      this.storageState.destroy();
    }
    this.storageState = storageState;
    this.renderProps = renderProps;
    this.ownsStorageState = ownsStorageState;
    this.applyStorageState(storageState);
    const firstBatch = getFirstStorageTextBatch(storageState);
    const firstRenderBatch = getFirstStorageTextRenderBatch(storageState);
    this.setAttributes({
      [COMPACT_GLYPH_VERTEX_DATA]: firstRenderBatch.compactGlyphVertexData
    });
    this.setBindings(
      createStorageTextBindings(renderProps, storageState, firstBatch, firstRenderBatch)
    );
    this.setInstanceCount(firstRenderBatch.glyphCount);
    this.setNeedsRedraw(redrawReason);
  }

  private applyStorageState(storageState: StorageTextState): void {
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

function createStorageTextModelProps(
  props: StorageTextRenderProps,
  storageState: StorageTextState
): ModelProps {
  const firstRenderBatch = getFirstStorageTextRenderBatch(storageState);
  const hasGlyphRowIndices = storageState.hasGlyphRowIndices === true;
  return {
    ...props,
    source: props.source ?? getDefaultStorageTextSource(storageState),
    shaderLayout: props.shaderLayout ?? getDefaultStorageTextShaderLayout(storageState),
    bindings: createStorageTextBindings(
      props,
      storageState,
      getFirstStorageTextBatch(storageState),
      firstRenderBatch
    ),
    attributes: {
      ...(props.attributes || {}),
      [COMPACT_GLYPH_VERTEX_DATA]: firstRenderBatch.compactGlyphVertexData
    },
    bufferLayout: [
      ...(props.bufferLayout || []),
      {
        name: COMPACT_GLYPH_VERTEX_DATA,
        stepMode: 'instance',
        byteStride: hasGlyphRowIndices
          ? ROW_INDEXED_COMPACT_GLYPH_VERTEX_BYTE_STRIDE
          : COMPACT_GLYPH_VERTEX_BYTE_STRIDE,
        attributes: [
          {attribute: GLYPH_OFFSETS_COLUMN, format: 'sint16x2', byteOffset: 0},
          {
            attribute: GLYPH_INDICES_COLUMN,
            format: 'uint16x2',
            byteOffset: Uint32Array.BYTES_PER_ELEMENT
          },
          ...(hasGlyphRowIndices
            ? [
                {
                  attribute: GLYPH_ROW_INDICES_COLUMN,
                  format: 'uint32' as const,
                  byteOffset: Uint32Array.BYTES_PER_ELEMENT * 2
                }
              ]
            : [])
        ]
      }
    ],
    vertexCount: props.vertexCount ?? 6,
    instanceCount: firstRenderBatch.glyphCount
  };
}

/**
 * Storage text renderer variant that reads a generated source-row index per glyph.
 *
 * The extra row-index column increases generated glyph vertex storage, but lets shaders fetch row
 * style data directly instead of binary-searching cumulative row glyph starts.
 */
export class RowIndexedStorageTextModel extends StorageTextModel {
  constructor(device: Device, props: StorageTextModelProps | PreparedStorageTextModelProps) {
    if (props.hasGlyphRowIndices !== true) {
      throw new Error('RowIndexedStorageTextModel requires hasGlyphRowIndices');
    }
    super(device, props);
  }

  /** Constructs a row-indexed render-only model from an existing prepared storage state. */
  static override fromState(
    device: Device,
    props: PreparedStorageTextModelProps
  ): RowIndexedStorageTextModel {
    return new RowIndexedStorageTextModel(device, props);
  }
}

function getDefaultStorageTextSource(storageState: StorageTextState): string {
  return storageState.hasGlyphRowIndices === true
    ? DEFAULT_ROW_INDEXED_STORAGE_TEXT_SOURCE
    : DEFAULT_STORAGE_INDEXED_TEXT_SOURCE;
}

function getDefaultStorageTextShaderLayout(storageState: StorageTextState) {
  return storageState.hasGlyphRowIndices === true
    ? DEFAULT_ROW_INDEXED_STORAGE_TEXT_SHADER_LAYOUT
    : DEFAULT_STORAGE_INDEXED_TEXT_SHADER_LAYOUT;
}

function createStorageTextBindings(
  props: StorageTextRenderProps,
  storageState: StorageTextState,
  batch: StorageTextBatchState,
  renderBatch: StorageTextRenderBatchState
): NonNullable<ModelProps['bindings']> {
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

function getStorageTextRenderProps(
  props: StorageTextModelProps | PreparedStorageTextModelProps
): StorageTextRenderProps {
  const {
    positions: _positions,
    texts: _texts,
    colors: _colors,
    angles: _angles,
    sizes: _sizes,
    pixelOffsets: _pixelOffsets,
    textAnchors: _textAnchors,
    alignmentBaselines: _alignmentBaselines,
    clipRects: _clipRects,
    color: _color,
    angle: _angle,
    size: _size,
    pixelOffset: _pixelOffset,
    textAnchor: _textAnchor,
    alignmentBaseline: _alignmentBaseline,
    characterSet: _characterSet,
    fontSettings: _fontSettings,
    lineHeight: _lineHeight,
    characterMapping: _characterMapping,
    fontAtlas: _fontAtlas,
    ownsStorageState: _ownsStorageState,
    ...renderProps
  } = props;
  return renderProps;
}

function isStorageTextInputProps(
  props: StorageTextModelProps | PreparedStorageTextModelProps
): props is StorageTextModelProps {
  return 'positions' in props && 'texts' in props;
}
