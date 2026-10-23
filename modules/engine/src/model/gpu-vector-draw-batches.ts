// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GPUVectorModel} from './gpu-vector-model';
import type {GPUVectorBindings} from './gpu-vector-bindings';

/** Draws aligned mesh/attribute batches, or the product of independent instanced batches. */
export function drawGPUVectorGroups(
  model: Pick<
    GPUVectorModel,
    'vertexCount' | 'instanceCount' | 'isInstanced' | 'setVertexCount' | 'setInstanceCount'
  >,
  geometry: GPUVectorBindings,
  attributes: GPUVectorBindings,
  syncBindings: () => void,
  draw: () => boolean
): boolean {
  const geometryInputs = geometry.inputs;
  const attributeInputs = attributes.inputs;
  const geometryLayouts = geometry.sourceLayouts;
  const attributeLayouts = attributes.sourceLayouts;
  const attributeStepMode = attributes.stepMode;
  const geometryBatchCount = geometry.batchCount;
  const attributeBatchCount = attributes.batchCount;
  const geometryBatches = Array.from({length: geometryBatchCount}, (_, batchIndex) =>
    geometry.getBatch(batchIndex)
  );
  const attributeBatches = Array.from({length: attributeBatchCount}, (_, batchIndex) =>
    attributes.getBatch(batchIndex)
  );
  const vertexCount = model.vertexCount;
  const instanceCount = model.instanceCount;
  let success = true;
  try {
    const independentInstances = model.isInstanced && attributes.vertexCount === undefined;
    const drawCount = independentInstances
      ? geometryBatchCount * attributeBatchCount
      : Math.max(geometryBatchCount, attributeBatchCount);
    if (geometryBatchCount === 0 || attributeBatchCount === 0) return true;
    for (let batchIndex = 0; batchIndex < drawCount; batchIndex++) {
      const geometryBatchIndex = independentInstances
        ? Math.floor(batchIndex / attributeBatchCount)
        : Math.min(batchIndex, geometryBatchCount - 1);
      const attributeBatchIndex = independentInstances
        ? batchIndex % attributeBatchCount
        : Math.min(batchIndex, attributeBatchCount - 1);
      geometry.setInputs(geometryBatches[geometryBatchIndex], geometryLayouts, 'vertex');
      attributes.setInputs(
        attributeBatches[attributeBatchIndex],
        attributeLayouts,
        attributeStepMode
      );
      syncBindings();
      model.setVertexCount(geometry.rowCount ?? attributes.vertexCount ?? vertexCount);
      if (attributes.instanceCount !== undefined) model.setInstanceCount(attributes.instanceCount);
      success = draw() && success;
    }
  } finally {
    geometry.setInputs(geometryInputs, geometryLayouts, 'vertex');
    attributes.setInputs(attributeInputs, attributeLayouts, attributeStepMode);
    syncBindings();
    model.setVertexCount(vertexCount);
    model.setInstanceCount(instanceCount);
  }
  return success;
}
