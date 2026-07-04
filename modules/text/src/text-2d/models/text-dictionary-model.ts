// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {type Device, type RenderPass} from '@luma.gl/core';
import {Model, type ModelProps} from '@luma.gl/engine';
import {
  getFirstTextDictionaryBatch,
  getFirstTextDictionaryRenderBatch,
  type TextDictionaryBatchState,
  type TextDictionaryRenderBatchState,
  type TextDictionaryState
} from '../model-utils/text-storage-state';
import {
  assertPreparedTextStorageDevice,
  drawPreparedTextStorageBatches
} from '../model-utils/text-storage-model-utils';
import {
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

/** Explicit prepared-state constructor props. The model borrows `storageState`. */
export type TextDictionaryModelProps = TextDictionaryRenderProps & {
  storageState: TextDictionaryState;
};

export type PreparedTextDictionaryModelProps = TextDictionaryModelProps;

/**
 * Dictionary text renderer that consumes typed GPUVector model props plus prepared render state.
 *
 * Source adapters do layout work before constructing this model, then pass one borrowed prepared
 * state object through {@link TextDictionaryModelProps}.
 */
export class TextDictionaryModel extends Model {
  /** Prepared GPU vectors consumed by the dictionary text model. */
  static readonly gpuInputSchema = TEXT_DICTIONARY_GPU_INPUT_SCHEMA;

  /** Borrowed compressed dictionary text batches in append order. */
  readonly storageStates: TextDictionaryState[];
  /** First borrowed state retained for low-level integrations. */
  get storageState(): TextDictionaryState {
    return this.storageStates[0]!;
  }
  protected readonly renderProps: TextDictionaryRenderProps;

  constructor(device: Device, props: TextDictionaryModelProps) {
    assertPreparedTextStorageDevice(device, 'TextDictionaryModel');
    const {storageState, ...renderProps} = props;
    super(device, createTextDictionaryModelProps(renderProps, storageState));
    this.renderProps = renderProps;
    this.storageStates = [storageState];
  }

  /** Appends one prepared dictionary batch without replacing existing state or models. */
  addState(storageState: TextDictionaryState): void {
    this.storageStates.push(storageState);
    this.setNeedsRedraw('Text dictionary batch appended');
  }

  /** Draws each compressed dictionary text render batch against the supplied render pass. */
  override draw(renderPass: RenderPass): boolean {
    let drawSuccess = true;
    for (const storageState of this.storageStates) {
      const stateFirstBatch = getFirstTextDictionaryBatch(storageState);
      const stateFirstRenderBatch = getFirstTextDictionaryRenderBatch(storageState);
      this.setBindings(
        createTextDictionaryBindings(
          this.renderProps,
          storageState,
          stateFirstBatch,
          stateFirstRenderBatch
        )
      );
      this.setInstanceCount(stateFirstRenderBatch.glyphCount);
      drawSuccess =
        drawPreparedTextStorageBatches<
          TextDictionaryBatchState,
          TextDictionaryRenderBatchState,
          TextDictionaryState
        >({
          model: this,
          renderPass,
          storageState,
          missingBatchError: 'TextDictionaryModel render batch is missing its row-binding batch',
          drawModelBatch: () => super.draw(renderPass),
          prepareBatch: (batch, renderBatch) => {
            this.setBindings(
              createTextDictionaryBindings(this.renderProps, storageState, batch, renderBatch)
            );
          },
          restoreFirstBatch: () => {
            const firstBatch = getFirstTextDictionaryBatch(storageState);
            const firstRenderBatch = getFirstTextDictionaryRenderBatch(storageState);
            this.setBindings(
              createTextDictionaryBindings(
                this.renderProps,
                storageState,
                firstBatch,
                firstRenderBatch
              )
            );
          }
        }) && drawSuccess;
    }
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
    this.setInstanceCount(
      this.storageStates.reduce(
        (glyphCount, storageState) => glyphCount + storageState.glyphCount,
        0
      )
    );
    return drawSuccess;
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
