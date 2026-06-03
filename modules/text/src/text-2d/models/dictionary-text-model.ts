// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {type Buffer, type Device, type RenderPass} from '@luma.gl/core';
import {DynamicBuffer, DynamicTexture, Model, type ModelProps} from '@luma.gl/engine';
import type {GPUVector} from '@luma.gl/tables';
import FontAtlasManager, {type FontAtlas, type FontSettings} from '../atlas/font-atlas-manager';
import type {CharacterMapping} from '../atlas/text-utils';
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
import type {DictionaryTextInputProps} from '../model-utils/text-model-props';
import {
  DEFAULT_DICTIONARY_STORAGE_TEXT_SHADER_LAYOUT,
  DEFAULT_DICTIONARY_STORAGE_TEXT_SOURCE
} from '../model-utils/text-shaders';

export type {DictionaryTextInputProps};

/**
 * Render and shader options for a dictionary text model that reuses prepared state.
 *
 * These are standard luma.gl model options; draw counts, dictionary bindings, and generated glyph
 * buffers come from the prepared {@link DictionaryTextState}.
 */
export interface DictionaryTextRenderProps extends ModelProps {}

export type {DictionaryTextBatchState, DictionaryTextRenderBatchState, DictionaryTextState};

/** Constructor props for the dictionary text renderer. */
export interface DictionaryTextModelProps extends ModelProps {
  /** GPU-resident label origins aligned one-for-one with `texts`; each row is `[x, y]`. */
  positions: GPUVector;
  /** GPU dictionary-encoded UTF-8 labels aligned row-for-row with `positions`. */
  texts: GPUVector;
  /**
   * Optional GPU packed RGBA8 text colors aligned with label rows.
   *
   * Arrow's TypeScript type does not encode fixed-list length; conversion validates
   * `FixedSizeList<Uint8>` rows have `listSize === 4`.
   */
  colors?: GPUVector;
  /** Optional GPU per-row angles in degrees. */
  color?: [number, number, number, number];

  /** Constant fallback angle in degrees used when `angles` is absent. */
  angles?: GPUVector;
  /** Constant fallback color used when `colors` is absent. */
  angle?: number;

  /** Optional GPU per-row deck-style text sizes. */
  sizes?: GPUVector;
  /** Constant fallback deck-style text size used when `sizes` is absent. */
  size?: number;

  /** Optional GPU per-row pixel offsets; each row is `[x, y]`. */
  pixelOffsets?: GPUVector;
  /** Optional GPU per-row text anchor enum: 0=start, 1=middle, 2=end. */
  textAnchors?: GPUVector;
  /** Optional GPU per-row alignment baseline enum: 0=center, 1=top, 2=bottom. */
  alignmentBaselines?: GPUVector;
  /**
   * Optional GPU packed per-label clip rectangles `[x, y, width, height]`.
   * Negative width or height disables clipping on that axis.
   */
  clipRects?: GPUVector;
  /** Constant fallback pixel offset used when `pixelOffsets` is absent. */
  pixelOffset?: [number, number];
  /** Constant fallback text anchor used when `textAnchors` is absent. */
  textAnchor?: 'start' | 'middle' | 'end';
  /** Constant fallback alignment baseline used when `alignmentBaselines` is absent. */
  alignmentBaseline?: 'center' | 'top' | 'bottom';
  /** Character set for atlas generation. Pass `'auto'` when the adapter should derive it. */
  characterSet?: FontSettings['characterSet'] | 'auto';
  /** Font atlas generation settings. */
  fontSettings?: FontSettings;
  /** Multiplier applied to the atlas font size for one-line baseline layout. */
  lineHeight?: number;
  /** Optional deterministic mapping, mainly useful when atlas generation is managed externally. */
  characterMapping?: CharacterMapping;
  /** Optional prebuilt atlas for texture binding when `characterMapping` is injected. */
  fontAtlas?: FontAtlas;
  /** Prepared dictionary text state produced by a conversion helper. */
  storageState: DictionaryTextState;
  /** Whether this model owns and should destroy the prepared dictionary state. */
  ownsStorageState?: boolean;
}

/** Explicit prepared-state constructor props, used when sharing state with a companion model. */
export interface PreparedDictionaryTextModelProps extends DictionaryTextRenderProps {
  /** Prepared dictionary text state consumed by the renderer. */
  storageState: DictionaryTextState;
  /** Whether this model owns and should destroy the prepared dictionary state. */
  ownsStorageState?: boolean;
}

/**
 * Dictionary text renderer that consumes typed GPUVector model props plus prepared render state.
 *
 * This WebGPU model does not accept Arrow source vectors. Arrow/data adapters should do CPU layout
 * work before constructing the model, then pass the prepared state through
 * {@link DictionaryTextModelProps}.
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

  constructor(device: Device, props: DictionaryTextModelProps) {
    if (device.type !== 'webgpu') {
      throw new Error('DictionaryTextModel is WebGPU-only');
    }
    const renderProps = getDictionaryTextRenderProps(props);
    super(device, createDictionaryTextModelProps(renderProps, props.storageState));
    this.renderProps = renderProps;
    this.storageState = props.storageState;
    this.ownsStorageState = props.ownsStorageState === true;
    this.applyStorageState(props.storageState);
  }

  /** Constructs a render-only model from an existing prepared dictionary state. */
  static fromState(device: Device, props: PreparedDictionaryTextModelProps): DictionaryTextModel {
    return new DictionaryTextModel(device, props as DictionaryTextModelProps);
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

function getDictionaryTextRenderProps(props: DictionaryTextModelProps): DictionaryTextRenderProps {
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
    storageState: _storageState,
    ownsStorageState: _ownsStorageState,
    ...renderProps
  } = props;
  return renderProps;
}
