// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {type Buffer, type Device, type RenderPass} from '@luma.gl/core';
import {DynamicBuffer, DynamicTexture, Model, type ModelProps} from '@luma.gl/engine';
import FontAtlasManager from '../atlas/font-atlas-manager';
import {
  getFirstTextDictionaryBatch,
  getFirstTextDictionaryRenderBatch,
  type TextDictionaryBatchState,
  type TextDictionaryRenderBatchState,
  type TextDictionaryState,
  type TextStorageBuffer
} from '../model-utils/text-storage-state';
import type {GpuTextDictionaryCompressedStream} from '../model-utils/gpu-text-types';
import {
  applyPreparedTextStorageState,
  assertPreparedTextStorageDevice,
  destroyOwnedPreparedTextStorageState,
  drawPreparedTextStorageBatches,
  getPreparedTextRenderProps,
  replacePreparedTextStorageState
} from '../model-utils/text-storage-model-utils';
import {
  assertTextDictionaryGPUVectorInputs,
  TEXT_DICTIONARY_GPU_INPUT_SCHEMA,
  type TextDictionaryInputProps
} from '../model-utils/text-model-props';
import {
  DEFAULT_TEXT_DICTIONARY_STORAGE_SHADER_LAYOUT,
  DEFAULT_TEXT_DICTIONARY_STORAGE_SOURCE
} from '../model-utils/text-shaders';

export type {TextDictionaryInputProps};

/**
 * Render and shader options for a dictionary text model that reuses prepared state.
 *
 * These are standard luma.gl model options; draw counts, dictionary bindings, and generated glyph
 * buffers come from the prepared {@link TextDictionaryState}.
 */
export interface TextDictionaryRenderProps extends ModelProps {}

export type {TextDictionaryBatchState, TextDictionaryRenderBatchState, TextDictionaryState};

/** Flat prepared props accepted by the dictionary text renderer. */
export type TextDictionaryModelProps = TextDictionaryInputProps &
  TextDictionaryState & {
    /** Whether this model owns and should destroy the prepared dictionary state. */
    ownsStorageState?: boolean;
  };

/** Explicit prepared-state constructor props, used when sharing state with a companion model. */
export type PreparedTextDictionaryModelProps = TextDictionaryRenderProps &
  Partial<TextDictionaryInputProps> &
  TextDictionaryState & {
    /** Whether this model owns and should destroy the prepared dictionary state. */
    ownsStorageState?: boolean;
  };

/**
 * Dictionary text renderer that consumes typed GPUVector model props plus prepared render state.
 *
 * Source adapters do layout work before constructing this model, then pass flat prepared GPU
 * vectors and generated render resources through {@link TextDictionaryModelProps}.
 */
export class TextDictionaryModel extends Model {
  /** Prepared GPU vectors consumed by the dictionary text model. */
  static readonly gpuInputSchema = TEXT_DICTIONARY_GPU_INPUT_SCHEMA;

  /** Optional atlas manager retained when this model built the atlas. */
  fontAtlasManager?: FontAtlasManager;
  /** Optional atlas texture owned by this model dictionary storage state. */
  atlasTexture?: DynamicTexture;
  /** Optional character set accumulated while laying out glyphs. */
  characterSet?: Set<string>;
  /** Optional compressed dictionary glyph stream retained for diagnostics. */
  glyphStream?: GpuTextDictionaryCompressedStream;
  /** Visible glyph instances across all source text rows. */
  glyphCount!: number;
  /** Shared glyph records across unique dictionary values. */
  dictionaryGlyphCount!: number;
  /** Normalized dictionary values retained across source data chunks. */
  dictionaryValueCount!: number;
  /** CPU time spent building generated glyph attributes. */
  glyphAttributeBuildTimeMs!: number;
  /** Bytes occupied by generated glyph attributes. */
  glyphAttributeByteLength!: number;
  /** CPU time spent building compressed dictionary glyph stream inputs. */
  compactStreamBuildTimeMs!: number;
  /** Bytes occupied by compressed dictionary glyph stream inputs. */
  compactStreamByteLength!: number;
  /** Bytes occupied by generated compact glyph vertex buffers. */
  generatedRenderBufferByteLength!: number;
  /** Bytes occupied by retained row style/default binding resources. */
  rowStorageByteLength!: number;
  /** Bytes occupied by retained glyph frame definitions. */
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
  /** First batch per-row dictionary reference buffer. */
  rowDictionaryRecordsBuffer!: Buffer;
  /** First batch per-dictionary-value glyph range buffer. */
  dictionaryGlyphRangesBuffer!: Buffer;
  /** First batch shared dictionary glyph record buffer. */
  dictionaryGlyphRecordsBuffer!: Buffer;
  /** First batch row style config uniform buffer. */
  styleConfigBuffer!: DynamicBuffer;
  /** Read-only storage buffer for glyph atlas frames. */
  glyphFramesBuffer!: Buffer;
  /** First render batch dictionary lookup config uniform buffer. */
  dictionaryRenderConfigBuffer!: DynamicBuffer;
  /** Per-source-batch row and dictionary glyph bindings. */
  batches!: TextDictionaryBatchState[];
  /** Generated render batches preserved for device buffer-size limits. */
  renderBatches!: TextDictionaryRenderBatchState[];
  /** Reusable compressed dictionary text storage state currently bound by the model. */
  storageState: TextDictionaryState;
  protected ownsStorageState: boolean;
  protected renderProps: TextDictionaryRenderProps;

  constructor(device: Device, props: TextDictionaryModelProps | PreparedTextDictionaryModelProps) {
    assertPreparedTextStorageDevice(device, 'TextDictionaryModel');
    if (isTextDictionaryInputProps(props)) {
      assertTextDictionaryGPUVectorInputs(props);
    }
    const storageState = props;
    const renderProps = getPreparedTextRenderProps<TextDictionaryRenderProps>(props);
    super(device, createTextDictionaryModelProps(renderProps, storageState));
    this.renderProps = renderProps;
    this.storageState = storageState;
    this.ownsStorageState = props.ownsStorageState === true;
    this.applyStorageState(storageState);
  }

  /** Constructs a render-only model from an existing prepared dictionary state. */
  static fromState(device: Device, props: PreparedTextDictionaryModelProps): TextDictionaryModel {
    return new TextDictionaryModel(device, props);
  }

  /** Draws each compressed dictionary text render batch against the supplied render pass. */
  override draw(renderPass: RenderPass): boolean {
    return drawPreparedTextStorageBatches({
      model: this,
      renderPass,
      storageState: this.storageState,
      missingBatchError: 'TextDictionaryModel render batch is missing its row-binding batch',
      drawModelBatch: () => super.draw(renderPass),
      prepareBatch: (batch, renderBatch) => {
        this.setBindings(
          createTextDictionaryBindings(this.renderProps, this.storageState, batch, renderBatch)
        );
      },
      restoreFirstBatch: () => {
        const firstBatch = getFirstTextDictionaryBatch(this.storageState);
        const firstRenderBatch = getFirstTextDictionaryRenderBatch(this.storageState);
        this.setBindings(
          createTextDictionaryBindings(
            this.renderProps,
            this.storageState,
            firstBatch,
            firstRenderBatch
          )
        );
      }
    });
  }

  /** Releases owned dictionary text state plus inherited model resources. */
  override destroy(): void {
    this.ownsStorageState = destroyOwnedPreparedTextStorageState(
      this.storageState,
      this.ownsStorageState
    );
    super.destroy();
  }

  protected setTextDictionaryState(
    storageState: TextDictionaryState,
    renderProps: TextDictionaryRenderProps,
    ownsStorageState: boolean,
    redrawReason: string
  ): void {
    replacePreparedTextStorageState(this.storageState, storageState, this.ownsStorageState);
    this.storageState = storageState;
    this.renderProps = renderProps;
    this.ownsStorageState = ownsStorageState;
    this.applyStorageState(storageState);
    const firstBatch = getFirstTextDictionaryBatch(storageState);
    const firstRenderBatch = getFirstTextDictionaryRenderBatch(storageState);
    this.setBindings(
      createTextDictionaryBindings(renderProps, storageState, firstBatch, firstRenderBatch)
    );
    this.setInstanceCount(firstRenderBatch.glyphCount);
    this.setNeedsRedraw(redrawReason);
  }

  private applyStorageState(storageState: TextDictionaryState): void {
    applyPreparedTextStorageState(this, storageState);
  }
}

function createTextDictionaryModelProps(
  props: TextDictionaryRenderProps,
  storageState: TextDictionaryState
): ModelProps {
  const firstRenderBatch = getFirstTextDictionaryRenderBatch(storageState);
  return {
    ...props,
    source: props.source ?? DEFAULT_TEXT_DICTIONARY_STORAGE_SOURCE,
    shaderLayout: props.shaderLayout ?? DEFAULT_TEXT_DICTIONARY_STORAGE_SHADER_LAYOUT,
    bindings: createTextDictionaryBindings(
      props,
      storageState,
      getFirstTextDictionaryBatch(storageState),
      firstRenderBatch
    ),
    attributes: props.attributes ?? {},
    bufferLayout: props.bufferLayout ?? [],
    vertexCount: props.vertexCount ?? 6,
    instanceCount: firstRenderBatch.glyphCount
  };
}

function createTextDictionaryBindings(
  props: TextDictionaryRenderProps,
  storageState: TextDictionaryState,
  batch: TextDictionaryBatchState,
  renderBatch: TextDictionaryRenderBatchState
): NonNullable<ModelProps['bindings']> {
  return {
    ...(props.bindings || {}),
    textRowPositions: batch.rowPositionsBuffer,
    textRowColors: batch.rowColorsBuffer,
    textRowAngles: batch.rowAnglesBuffer,
    textRowSizes: batch.rowSizesBuffer,
    textRowPixelOffsets: batch.rowPixelOffsetsBuffer,
    textRowClipRects: batch.rowClipRectsBuffer,
    textRowDictionaryRecords: batch.rowDictionaryRecordsBuffer,
    textDictionaryGlyphRanges: batch.dictionaryGlyphRangesBuffer,
    textDictionaryGlyphRecords: batch.dictionaryGlyphRecordsBuffer,
    textGlyphFrames: batch.glyphFramesBuffer,
    textStorageStyleConfig: batch.styleConfigBuffer,
    textDictionaryRenderConfig: renderBatch.dictionaryRenderConfigBuffer,
    ...(storageState.atlasTexture ? {fontAtlasTexture: storageState.atlasTexture} : {})
  };
}

function isTextDictionaryInputProps(
  props: TextDictionaryModelProps | PreparedTextDictionaryModelProps
): props is TextDictionaryModelProps {
  return 'positions' in props && 'texts' in props;
}
