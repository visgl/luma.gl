// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {type Buffer, type Device, type RenderPass} from '@luma.gl/core';
import {DynamicBuffer, DynamicTexture, Model, type ModelProps} from '@luma.gl/engine';
import {
  getFirstTextStorageBatch,
  getFirstTextStorageRenderBatch,
  getTextStorageRowGlyphStartsBuffer,
  type TextStorageBatchState,
  type TextStorageBuffer,
  type TextStorageRenderBatchState,
  type TextStorageState
} from '../model-utils/text-storage-state';
import type {GpuExpandedTextStream} from '../model-utils/gpu-text-types';
import {
  applyPreparedTextStorageState,
  assertPreparedTextStorageDevice,
  destroyOwnedPreparedTextStorageState,
  drawPreparedTextStorageBatches,
  getPreparedTextRenderProps,
  replacePreparedTextStorageState
} from '../model-utils/text-storage-model-utils';
import {
  assertTextStorageGPUVectorInputs,
  TEXT_STORAGE_GPU_INPUT_SCHEMA,
  type TextStorageInputProps
} from '../model-utils/text-model-props';
import {
  COMPACT_GLYPH_VERTEX_BYTE_STRIDE,
  COMPACT_GLYPH_VERTEX_DATA,
  DEFAULT_TEXT_ROW_INDEXED_STORAGE_SHADER_LAYOUT,
  DEFAULT_TEXT_ROW_INDEXED_STORAGE_SOURCE,
  DEFAULT_TEXT_STORAGE_INDEXED_SHADER_LAYOUT,
  DEFAULT_TEXT_STORAGE_INDEXED_SOURCE,
  GLYPH_INDICES_COLUMN,
  GLYPH_OFFSETS_COLUMN,
  GLYPH_ROW_INDICES_COLUMN,
  ROW_INDEXED_COMPACT_GLYPH_VERTEX_BYTE_STRIDE
} from '../model-utils/text-shaders';

export type {TextStorageInputProps};

/**
 * Render and shader options for a storage text model that reuses prepared state.
 *
 * These are standard luma.gl model options; draw counts, storage bindings, and generated glyph
 * buffers come from the prepared {@link TextStorageState}.
 */
export interface TextStorageRenderProps extends ModelProps {}

export type {TextStorageBatchState, TextStorageRenderBatchState, TextStorageState};

/** Flat prepared props accepted by the storage text renderer. */
export type TextStorageModelProps = TextStorageInputProps &
  TextStorageState & {
    /** Whether this model owns and should destroy the prepared storage state. */
    ownsStorageState?: boolean;
  };

/** Explicit prepared-state constructor props, used when sharing state with a companion model. */
export type PreparedTextStorageModelProps = TextStorageRenderProps &
  Partial<TextStorageInputProps> &
  TextStorageState & {
    /** Whether this model owns and should destroy the prepared storage state. */
    ownsStorageState?: boolean;
  };

/**
 * Storage text renderer that consumes typed GPUVector model props plus prepared render state.
 *
 * Source adapters do layout work before constructing this model, then pass flat prepared GPU
 * vectors and generated render resources through {@link TextStorageModelProps}.
 */
export class TextStorageModel extends Model {
  /** Prepared GPU vectors consumed by the storage-backed text model. */
  static readonly gpuInputSchema = TEXT_STORAGE_GPU_INPUT_SCHEMA;

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
  rowPositionsBuffer!: TextStorageBuffer;
  /** First batch packed RGBA8 row color buffer. */
  rowColorsBuffer!: TextStorageBuffer;
  /** First batch row angle buffer. */
  rowAnglesBuffer!: TextStorageBuffer;
  /** First batch row text size buffer. */
  rowSizesBuffer!: TextStorageBuffer;
  /** First batch row pixel offset buffer. */
  rowPixelOffsetsBuffer!: TextStorageBuffer;
  /** First batch packed row text anchor buffer. */
  rowTextAnchorsBuffer!: TextStorageBuffer;
  /** First batch packed row alignment baseline buffer. */
  rowAlignmentBaselinesBuffer!: TextStorageBuffer;
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
  batches!: TextStorageBatchState[];
  /** Generated render batches preserved for device buffer-size limits. */
  renderBatches!: TextStorageRenderBatchState[];
  /** Reusable storage text expansion and row-binding state currently bound by the model. */
  storageState: TextStorageState;
  protected ownsStorageState: boolean;
  protected renderProps: TextStorageRenderProps;

  constructor(device: Device, props: TextStorageModelProps | PreparedTextStorageModelProps) {
    assertPreparedTextStorageDevice(device, 'TextStorageModel');
    if (isTextStorageInputProps(props)) {
      assertTextStorageGPUVectorInputs(props);
    }
    const storageState = props;
    const renderProps = getPreparedTextRenderProps<TextStorageRenderProps>(props);
    super(device, createTextStorageModelProps(renderProps, storageState));
    this.renderProps = renderProps;
    this.storageState = storageState;
    this.ownsStorageState = props.ownsStorageState === true;
    this.applyStorageState(storageState);
  }

  /** Constructs a render-only model from an existing prepared storage state. */
  static fromState(device: Device, props: PreparedTextStorageModelProps): TextStorageModel {
    return new TextStorageModel(device, props);
  }

  /** Draws each generated storage text render batch against the supplied render pass. */
  override draw(renderPass: RenderPass): boolean {
    return drawPreparedTextStorageBatches<
      TextStorageBatchState,
      TextStorageRenderBatchState,
      TextStorageState
    >({
      model: this,
      renderPass,
      storageState: this.storageState,
      missingBatchError: 'TextStorageModel render batch is missing its row-binding batch',
      drawModelBatch: () => super.draw(renderPass),
      prepareBatch: (batch, renderBatch) => {
        this.setAttributes({
          [COMPACT_GLYPH_VERTEX_DATA]: renderBatch.compactGlyphVertexData
        });
        this.setBindings(
          createTextStorageBindings(this.renderProps, this.storageState, batch, renderBatch)
        );
      },
      restoreFirstBatch: () => {
        const firstBatch = getFirstTextStorageBatch(this.storageState);
        const firstRenderBatch = getFirstTextStorageRenderBatch(this.storageState);
        this.setAttributes({
          [COMPACT_GLYPH_VERTEX_DATA]: firstRenderBatch.compactGlyphVertexData
        });
        this.setBindings(
          createTextStorageBindings(
            this.renderProps,
            this.storageState,
            firstBatch,
            firstRenderBatch
          )
        );
      }
    });
  }

  /** Releases owned storage text state plus inherited model resources. */
  override destroy(): void {
    this.ownsStorageState = destroyOwnedPreparedTextStorageState(
      this.storageState,
      this.ownsStorageState
    );
    super.destroy();
  }

  protected setTextStorageState(
    storageState: TextStorageState,
    renderProps: TextStorageRenderProps,
    ownsStorageState: boolean,
    redrawReason: string
  ): void {
    replacePreparedTextStorageState(this.storageState, storageState, this.ownsStorageState);
    this.storageState = storageState;
    this.renderProps = renderProps;
    this.ownsStorageState = ownsStorageState;
    this.applyStorageState(storageState);
    const firstBatch = getFirstTextStorageBatch(storageState);
    const firstRenderBatch = getFirstTextStorageRenderBatch(storageState);
    this.setAttributes({
      [COMPACT_GLYPH_VERTEX_DATA]: firstRenderBatch.compactGlyphVertexData
    });
    this.setBindings(
      createTextStorageBindings(renderProps, storageState, firstBatch, firstRenderBatch)
    );
    this.setInstanceCount(firstRenderBatch.glyphCount);
    this.setNeedsRedraw(redrawReason);
  }

  private applyStorageState(storageState: TextStorageState): void {
    applyPreparedTextStorageState(this, storageState);
  }
}

function createTextStorageModelProps(
  props: TextStorageRenderProps,
  storageState: TextStorageState
): ModelProps {
  const firstRenderBatch = getFirstTextStorageRenderBatch(storageState);
  const hasGlyphRowIndices = storageState.hasGlyphRowIndices === true;
  return {
    ...props,
    source: props.source ?? getDefaultTextStorageSource(storageState),
    shaderLayout: props.shaderLayout ?? getDefaultTextStorageShaderLayout(storageState),
    bindings: createTextStorageBindings(
      props,
      storageState,
      getFirstTextStorageBatch(storageState),
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
export class TextRowIndexedStorageModel extends TextStorageModel {
  constructor(device: Device, props: TextStorageModelProps | PreparedTextStorageModelProps) {
    if (props.hasGlyphRowIndices !== true) {
      throw new Error('TextRowIndexedStorageModel requires hasGlyphRowIndices');
    }
    super(device, props);
  }

  /** Constructs a row-indexed render-only model from an existing prepared storage state. */
  static override fromState(
    device: Device,
    props: PreparedTextStorageModelProps
  ): TextRowIndexedStorageModel {
    return new TextRowIndexedStorageModel(device, props);
  }
}

function getDefaultTextStorageSource(storageState: TextStorageState): string {
  return storageState.hasGlyphRowIndices === true
    ? DEFAULT_TEXT_ROW_INDEXED_STORAGE_SOURCE
    : DEFAULT_TEXT_STORAGE_INDEXED_SOURCE;
}

function getDefaultTextStorageShaderLayout(storageState: TextStorageState) {
  return storageState.hasGlyphRowIndices === true
    ? DEFAULT_TEXT_ROW_INDEXED_STORAGE_SHADER_LAYOUT
    : DEFAULT_TEXT_STORAGE_INDEXED_SHADER_LAYOUT;
}

function createTextStorageBindings(
  props: TextStorageRenderProps,
  storageState: TextStorageState,
  batch: TextStorageBatchState,
  renderBatch: TextStorageRenderBatchState
): NonNullable<ModelProps['bindings']> {
  return {
    ...(props.bindings || {}),
    textRowPositions: batch.rowPositionsBuffer,
    textRowColors: batch.rowColorsBuffer,
    textRowAngles: batch.rowAnglesBuffer,
    textRowSizes: batch.rowSizesBuffer,
    textRowPixelOffsets: batch.rowPixelOffsetsBuffer,
    textRowClipRects: batch.rowClipRectsBuffer,
    textRowGlyphStarts: getTextStorageRowGlyphStartsBuffer(batch),
    textGlyphFrames: storageState.glyphFramesBuffer,
    textStorageStyleConfig: batch.styleConfigBuffer,
    textStorageRenderConfig: renderBatch.storageRenderConfigBuffer,
    ...(storageState.atlasTexture ? {fontAtlasTexture: storageState.atlasTexture} : {})
  };
}

function isTextStorageInputProps(
  props: TextStorageModelProps | PreparedTextStorageModelProps
): props is TextStorageModelProps {
  return 'positions' in props && 'texts' in props;
}
