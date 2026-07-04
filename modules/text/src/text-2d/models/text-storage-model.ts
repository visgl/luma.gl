// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {type Device, type RenderPass} from '@luma.gl/core';
import {Model, type ModelProps} from '@luma.gl/engine';
import {
  getFirstTextStorageBatch,
  getFirstTextStorageRenderBatch,
  getTextStorageRowGlyphStartsBuffer,
  type TextStorageBatchState,
  type TextStorageRenderBatchState,
  type TextStorageState
} from '../model-utils/text-storage-state';
import {
  assertPreparedTextStorageDevice,
  drawPreparedTextStorageBatches
} from '../model-utils/text-storage-model-utils';
import {
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

/** Explicit prepared-state constructor props. The model borrows `storageState`. */
export type TextStorageModelProps = TextStorageRenderProps & {storageState: TextStorageState};

export type PreparedTextStorageModelProps = TextStorageModelProps;

/**
 * Storage text renderer that consumes typed GPUVector model props plus prepared render state.
 *
 * Source adapters do layout work before constructing this model, then pass one borrowed prepared
 * state object through {@link TextStorageModelProps}.
 */
export class TextStorageModel extends Model {
  /** Prepared GPU vectors consumed by the storage-backed text model. */
  static readonly gpuInputSchema = TEXT_STORAGE_GPU_INPUT_SCHEMA;

  /** Borrowed storage text batches in append order. */
  readonly storageStates: TextStorageState[];
  /** First borrowed state retained for low-level integrations. */
  get storageState(): TextStorageState {
    return this.storageStates[0]!;
  }
  protected readonly renderProps: TextStorageRenderProps;

  constructor(device: Device, props: TextStorageModelProps) {
    assertPreparedTextStorageDevice(device, 'TextStorageModel');
    const {storageState, ...renderProps} = props;
    super(device, createTextStorageModelProps(renderProps, storageState));
    this.renderProps = renderProps;
    this.storageStates = [storageState];
  }

  /** Appends one prepared batch without replacing existing state or models. */
  addState(storageState: TextStorageState): void {
    if (storageState.hasGlyphRowIndices !== this.storageState.hasGlyphRowIndices) {
      throw new Error('TextStorageModel appended batches must use the same row-index mode');
    }
    this.storageStates.push(storageState);
    this.setNeedsRedraw('Text storage batch appended');
  }

  /** Draws each generated storage text render batch against the supplied render pass. */
  override draw(renderPass: RenderPass): boolean {
    let drawSuccess = true;
    for (const storageState of this.storageStates) {
      const stateFirstBatch = getFirstTextStorageBatch(storageState);
      const stateFirstRenderBatch = getFirstTextStorageRenderBatch(storageState);
      this.setAttributes({
        [COMPACT_GLYPH_VERTEX_DATA]: stateFirstRenderBatch.compactGlyphVertexData
      });
      this.setBindings(
        createTextStorageBindings(
          this.renderProps,
          storageState,
          stateFirstBatch,
          stateFirstRenderBatch
        )
      );
      this.setInstanceCount(stateFirstRenderBatch.glyphCount);
      drawSuccess =
        drawPreparedTextStorageBatches<
          TextStorageBatchState,
          TextStorageRenderBatchState,
          TextStorageState
        >({
          model: this,
          renderPass,
          storageState,
          missingBatchError: 'TextStorageModel render batch is missing its row-binding batch',
          drawModelBatch: () => super.draw(renderPass),
          prepareBatch: (batch, renderBatch) => {
            this.setAttributes({
              [COMPACT_GLYPH_VERTEX_DATA]: renderBatch.compactGlyphVertexData
            });
            this.setBindings(
              createTextStorageBindings(this.renderProps, storageState, batch, renderBatch)
            );
          },
          restoreFirstBatch: () => {
            const firstBatch = getFirstTextStorageBatch(storageState);
            const firstRenderBatch = getFirstTextStorageRenderBatch(storageState);
            this.setAttributes({
              [COMPACT_GLYPH_VERTEX_DATA]: firstRenderBatch.compactGlyphVertexData
            });
            this.setBindings(
              createTextStorageBindings(
                this.renderProps,
                storageState,
                firstBatch,
                firstRenderBatch
              )
            );
          }
        }) && drawSuccess;
    }
    const firstBatch = getFirstTextStorageBatch(this.storageState);
    const firstRenderBatch = getFirstTextStorageRenderBatch(this.storageState);
    this.setAttributes({[COMPACT_GLYPH_VERTEX_DATA]: firstRenderBatch.compactGlyphVertexData});
    this.setBindings(
      createTextStorageBindings(this.renderProps, this.storageState, firstBatch, firstRenderBatch)
    );
    this.setInstanceCount(
      this.storageStates.reduce(
        (glyphCount, storageState) => glyphCount + storageState.glyphCount,
        0
      )
    );
    return drawSuccess;
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
  constructor(device: Device, props: TextStorageModelProps) {
    if (props.storageState.hasGlyphRowIndices !== true) {
      throw new Error('TextRowIndexedStorageModel requires hasGlyphRowIndices');
    }
    super(device, props);
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
