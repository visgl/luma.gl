// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {type Device, type RenderPass} from '@luma.gl/core';
import {Model} from '@luma.gl/engine';
import {drawPreparedTextStorageModelBatch} from './text-storage-model-draw';

type PreparedTextRenderBatch = {
  glyphCount: number;
  rowBindingBatchIndex: number;
};

type PreparedTextStorageState<Batch, RenderBatch extends PreparedTextRenderBatch> = {
  batches: Batch[];
  glyphCount: number;
  renderBatches: RenderBatch[];
};

/** Throws when a prepared storage text model is constructed without WebGPU. */
export function assertPreparedTextStorageDevice(device: Device, modelName: string): void {
  if (device.type !== 'webgpu') {
    throw new Error(`${modelName} is WebGPU-only`);
  }
}

/** Draws every prepared storage batch, then restores the first bound batch. */
export function drawPreparedTextStorageBatches<
  Batch,
  RenderBatch extends PreparedTextRenderBatch,
  StorageState extends PreparedTextStorageState<Batch, RenderBatch>
>(props: {
  model: Model;
  renderPass: RenderPass;
  storageState: StorageState;
  missingBatchError: string;
  drawModelBatch: () => boolean;
  prepareBatch: (batch: Batch, renderBatch: RenderBatch) => void;
  restoreFirstBatch: () => void;
}): boolean {
  if (props.storageState.renderBatches.length === 1) {
    return props.drawModelBatch();
  }

  let drawSuccess = true;
  const usePreparedDraw =
    props.model.device.type === 'webgpu' && props.storageState.renderBatches.length > 1;
  if (usePreparedDraw) {
    // The direct batch draw path bypasses Model.draw(), so flush host-provided shader inputs
    // (for example Deck viewport uniforms) before reading the model's bind groups below.
    props.model.updateShaderInputs();
  }
  for (const renderBatch of props.storageState.renderBatches) {
    const batch = props.storageState.batches[renderBatch.rowBindingBatchIndex];
    if (!batch) {
      throw new Error(props.missingBatchError);
    }
    props.prepareBatch(batch, renderBatch);
    props.model.setInstanceCount(renderBatch.glyphCount);
    drawSuccess =
      (usePreparedDraw
        ? drawPreparedTextStorageModelBatch(props.model, props.renderPass)
        : props.drawModelBatch()) && drawSuccess;
  }
  props.restoreFirstBatch();
  props.model.setInstanceCount(props.storageState.glyphCount);
  return drawSuccess;
}
