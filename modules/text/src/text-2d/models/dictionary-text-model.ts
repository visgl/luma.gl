// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {type Buffer, type Device, type RenderPass} from '@luma.gl/core';
import {DynamicBuffer, DynamicTexture, Model, type ModelProps} from '@luma.gl/engine';
import FontAtlasManager from '../atlas/font-atlas-manager';
import {
  getFirstDictionaryTextBatch,
  getFirstDictionaryTextRenderBatch,
  type DictionaryTextBatchState,
  type DictionaryTextRenderBatchState,
  type DictionaryTextState,
  type StorageTextBuffer
} from '../model-utils/storage-text-state';
import type {GpuDictionaryCompressedTextStream} from '../model-utils/gpu-text-types';
import {drawPreparedStorageTextModelBatch} from '../model-utils/storage-model-draw';
import type {DictionaryTextModelProps} from '../model-utils/text-model-props';
import {
  DEFAULT_DICTIONARY_STORAGE_TEXT_SHADER_LAYOUT,
  DEFAULT_DICTIONARY_STORAGE_TEXT_SOURCE
} from '../model-utils/text-shaders';

export type {DictionaryTextModelProps};

/** Render-only props left after dictionary text state has been prepared. */
export type DictionaryTextRenderProps = Omit<
  DictionaryTextModelProps,
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
  | 'characterMapping'
  | 'fontAtlas'
>;

export type {DictionaryTextBatchState, DictionaryTextRenderBatchState, DictionaryTextState};

/** Constructor props for the pure dictionary text renderer. */
export type PreparedDictionaryTextModelProps = DictionaryTextRenderProps & {
  /** Prepared dictionary text state consumed by the renderer. */
  storageState: DictionaryTextState;
  /** Whether this model owns and should destroy the prepared dictionary state. */
  ownsStorageState?: boolean;
};

/**
 * Dictionary text renderer that consumes prepared GPUVector-backed state.
 *
 * This WebGPU model does not accept Arrow source vectors. Layer/data-preparation code should build
 * a {@link DictionaryTextState} first, then pass it here for rendering.
 */
export class DictionaryTextModel extends Model {
  /** Optional atlas manager retained when this model built the atlas. */
  fontAtlasManager?: FontAtlasManager;
  /** Optional atlas texture owned by this model dictionary storage state. */
  atlasTexture?: DynamicTexture;
  /** Optional character set accumulated while laying out glyphs. */
  characterSet?: Set<string>;
  /** Optional compressed dictionary glyph stream retained for diagnostics. */
  glyphStream?: GpuDictionaryCompressedTextStream;
  /** Visible glyph instances across all source text rows. */
  glyphCount!: number;
  /** Shared glyph records across unique dictionary values. */
  dictionaryGlyphCount!: number;
  /** Normalized dictionary values retained across Arrow data chunks. */
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
  batches!: DictionaryTextBatchState[];
  /** Generated render batches preserved for device buffer-size limits. */
  renderBatches!: DictionaryTextRenderBatchState[];
  /** Reusable compressed dictionary text storage state currently bound by the model. */
  storageState: DictionaryTextState;
  protected ownsStorageState: boolean;
  protected renderProps: DictionaryTextRenderProps;

  constructor(device: Device, props: PreparedDictionaryTextModelProps) {
    if (device.type !== 'webgpu') {
      throw new Error('DictionaryTextModel is WebGPU-only');
    }
    super(device, createDictionaryTextModelProps(props, props.storageState));
    this.renderProps = props;
    this.storageState = props.storageState;
    this.ownsStorageState = props.ownsStorageState === true;
    this.applyStorageState(props.storageState);
  }

  /** Draws each compressed dictionary text render batch against the supplied render pass. */
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
        throw new Error('DictionaryTextModel render batch is missing its row-binding batch');
      }
      this.setBindings(
        createDictionaryTextBindings(this.renderProps, this.storageState, batch, renderBatch)
      );
      this.setInstanceCount(renderBatch.glyphCount);
      drawSuccess =
        (usePreparedDraw
          ? drawPreparedStorageTextModelBatch(this, renderPass)
          : super.draw(renderPass)) && drawSuccess;
    }
    const firstBatch = getFirstDictionaryTextBatch(this.storageState);
    const firstRenderBatch = getFirstDictionaryTextRenderBatch(this.storageState);
    this.setBindings(
      createDictionaryTextBindings(
        this.renderProps,
        this.storageState,
        firstBatch,
        firstRenderBatch
      )
    );
    this.setInstanceCount(this.storageState.glyphCount);
    return drawSuccess;
  }

  /** Releases owned dictionary text state plus inherited model resources. */
  override destroy(): void {
    if (this.ownsStorageState) {
      this.storageState.destroy();
      this.ownsStorageState = false;
    }
    super.destroy();
  }

  protected setDictionaryTextState(
    storageState: DictionaryTextState,
    renderProps: DictionaryTextRenderProps,
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
    const firstBatch = getFirstDictionaryTextBatch(storageState);
    const firstRenderBatch = getFirstDictionaryTextRenderBatch(storageState);
    this.setBindings(
      createDictionaryTextBindings(renderProps, storageState, firstBatch, firstRenderBatch)
    );
    this.setInstanceCount(firstRenderBatch.glyphCount);
    this.setNeedsRedraw(redrawReason);
  }

  private applyStorageState(storageState: DictionaryTextState): void {
    this.fontAtlasManager = storageState.fontAtlasManager;
    this.atlasTexture = storageState.atlasTexture;
    this.characterSet = storageState.characterSet;
    this.glyphStream = storageState.glyphStream;
    this.glyphCount = storageState.glyphCount;
    this.dictionaryGlyphCount = storageState.dictionaryGlyphCount;
    this.dictionaryValueCount = storageState.dictionaryValueCount;
    this.glyphAttributeBuildTimeMs = storageState.glyphAttributeBuildTimeMs;
    this.glyphAttributeByteLength = storageState.glyphAttributeByteLength;
    this.compactStreamBuildTimeMs = storageState.compactStreamBuildTimeMs;
    this.compactStreamByteLength = storageState.compactStreamByteLength;
    this.generatedRenderBufferByteLength = storageState.generatedRenderBufferByteLength;
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
    this.rowDictionaryRecordsBuffer = storageState.rowDictionaryRecordsBuffer;
    this.dictionaryGlyphRangesBuffer = storageState.dictionaryGlyphRangesBuffer;
    this.dictionaryGlyphRecordsBuffer = storageState.dictionaryGlyphRecordsBuffer;
    this.dictionaryRenderConfigBuffer = storageState.dictionaryRenderConfigBuffer;
    this.styleConfigBuffer = storageState.styleConfigBuffer;
    this.glyphFramesBuffer = storageState.glyphFramesBuffer;
  }
}

function createDictionaryTextModelProps(
  props: DictionaryTextRenderProps,
  storageState: DictionaryTextState
): ModelProps {
  const firstRenderBatch = getFirstDictionaryTextRenderBatch(storageState);
  return {
    ...props,
    source: props.source ?? DEFAULT_DICTIONARY_STORAGE_TEXT_SOURCE,
    shaderLayout: props.shaderLayout ?? DEFAULT_DICTIONARY_STORAGE_TEXT_SHADER_LAYOUT,
    bindings: createDictionaryTextBindings(
      props,
      storageState,
      getFirstDictionaryTextBatch(storageState),
      firstRenderBatch
    ),
    attributes: props.attributes ?? {},
    bufferLayout: props.bufferLayout ?? [],
    vertexCount: props.vertexCount ?? 6,
    instanceCount: firstRenderBatch.glyphCount
  };
}

function createDictionaryTextBindings(
  props: DictionaryTextRenderProps,
  storageState: DictionaryTextState,
  batch: DictionaryTextBatchState,
  renderBatch: DictionaryTextRenderBatchState
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
