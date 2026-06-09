// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {RenderPass} from '@luma.gl/core';
import type {Model} from '@luma.gl/engine';

/**
 * Draws the model's current storage-text batch state by calling the pipeline directly.
 *
 * Storage and dictionary text models can split one prepared text state into multiple render
 * batches. Those models mutate one `Model` instance's attributes, bindings, and instance count for
 * each batch before drawing. This helper bypasses `Model.draw()` so the batch-local bindings that
 * were just installed are used immediately with the current render pass attachment formats.
 *
 * This intentionally reaches into private `Model` methods, so it should stay scoped to the
 * storage-text implementation and should be removed if `Model.draw()` gains a public batch draw path
 * that supports this rebinding pattern.
 */
export function drawPreparedTextStorageModelBatch(model: Model, renderPass: RenderPass): boolean {
  const drawableModel = model as unknown as {
    _areBindingsLoading(): string | false;
    _syncAttachmentFormats(renderPass: RenderPass): void;
    _updatePipeline(): typeof model.pipeline;
    _getBindings(): Record<string, any>;
    _getBindGroups(): Record<number, Record<string, any>>;
    _getBindGroupCacheKeys(): Partial<Record<number, object>>;
    pipeline: typeof model.pipeline;
    vertexArray: typeof model.vertexArray;
    isInstanced: typeof model.isInstanced;
    vertexCount: typeof model.vertexCount;
    instanceCount: typeof model.instanceCount;
    transformFeedback: typeof model.transformFeedback;
    props: {uniforms?: Record<string, unknown>};
    parameters: typeof model.parameters;
  };
  if (drawableModel._areBindingsLoading()) {
    return false;
  }
  drawableModel._syncAttachmentFormats(renderPass);
  drawableModel.pipeline = drawableModel._updatePipeline();
  if (drawableModel.pipeline.isErrored) {
    return false;
  }
  const indexBuffer = drawableModel.vertexArray.indexBuffer;
  const indexCount = indexBuffer
    ? indexBuffer.byteLength / (indexBuffer.indexType === 'uint32' ? 4 : 2)
    : undefined;

  return drawableModel.pipeline.draw({
    renderPass,
    vertexArray: drawableModel.vertexArray,
    isInstanced: drawableModel.isInstanced,
    vertexCount: drawableModel.vertexCount,
    instanceCount: drawableModel.instanceCount,
    indexCount,
    transformFeedback: drawableModel.transformFeedback || undefined,
    bindings: drawableModel._getBindings(),
    bindGroups: drawableModel._getBindGroups(),
    _bindGroupCacheKeys: drawableModel._getBindGroupCacheKeys(),
    uniforms: drawableModel.props.uniforms,
    parameters: drawableModel.parameters
  });
}
