// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GPUVectorModel} from './gpu-vector-model';
import type {GPUVectorBindings, GPUVectorModelAttributes} from './gpu-vector-bindings';

/** Draws aligned mesh/attribute batches, or the product of independent instanced batches. */
export function drawGPUVectorGroups(
  model: Pick<
    GPUVectorModel,
    | 'vertexCount'
    | 'instanceCount'
    | 'isInstanced'
    | 'indexBuffer'
    | 'setVertexCount'
    | 'setInstanceCount'
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
  const geometryOffsets = getBatchOffsets(geometryBatches);
  const attributeOffsets = getBatchOffsets(attributeBatches);
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
      const vertexOffset =
        geometry.rowCount !== undefined
          ? geometryOffsets[geometryBatchIndex]
          : attributes.vertexCount !== undefined
            ? attributeOffsets[attributeBatchIndex]
            : 0;
      model.setVertexCount(
        Math.max(
          0,
          Math.min(
            geometry.rowCount ?? attributes.vertexCount ?? vertexCount,
            vertexCount - vertexOffset
          )
        )
      );
      if (attributes.instanceCount !== undefined)
        model.setInstanceCount(
          Math.max(
            0,
            Math.min(
              attributes.instanceCount,
              instanceCount - attributeOffsets[attributeBatchIndex]
            )
          )
        );
      if (
        (!model.indexBuffer && model.vertexCount === 0) ||
        (model.isInstanced && model.instanceCount === 0)
      )
        continue;
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

function getBatchOffsets(batches: GPUVectorModelAttributes[]): number[] {
  let rowOffset = 0;
  return batches.map(batch => {
    const offset = rowOffset;
    for (const vector of Object.values(batch)) {
      if (vector && 'data' in vector) {
        rowOffset += vector.length;
        break;
      }
    }
    return offset;
  });
}
