// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {type Device, type RenderPass} from '@luma.gl/core';
import {
  createArrowPickingManager,
  getArrowPickingModules,
  supportsArrowIndexPicking
} from '../../../engine/arrow-picking';
import {indexPicking, Model, type PickingManager, type ShaderInputs} from '@luma.gl/engine';
import {getGPUDataBuffersForLayout, type GPUTable} from '@luma.gl/tables';
import {
  TextAttributeModel,
  TextDictionaryModel,
  TextStorageModel
} from '@luma.gl/text/experimental';
import type {ArrowTextRendererActiveModel} from './arrow-text-renderer';
import {
  TEXT_DICTIONARY_STORAGE_SHADER_LAYOUT,
  TEXT_DICTIONARY_STORAGE_WGSL_SHADER,
  PICKING_FS_GLSL,
  TEXT_STORAGE_INDEXED_SHADER_LAYOUT,
  TEXT_STORAGE_INDEXED_WGSL_SHADER,
  TEXT_SHADER_LAYOUT,
  VS_GLSL,
  WGSL_SHADER
} from './arrow-text-shaders';

export function supportsTextIndexPicking(device: Device): boolean {
  return supportsArrowIndexPicking(device);
}

export function getArrowTextRenderModules(device: Device): unknown[] {
  return getArrowPickingModules(device);
}

export function createArrowTextPickingManager(
  device: Device,
  shaderInputs: ShaderInputs<any>,
  onObjectPicked: (info: {batchIndex: number | null; objectIndex: number | null}) => void
): PickingManager | null {
  if (!supportsTextIndexPicking(device)) {
    return null;
  }
  return createArrowPickingManager(device, {shaderInputs, mode: 'index', onObjectPicked});
}

export function createArrowTextPickingModel(
  device: Device,
  textModel: ArrowTextRendererActiveModel,
  shaderInputs: ShaderInputs<any>
): Model {
  if (textModel instanceof TextDictionaryModel) {
    const pickingModel = new TextDictionaryModel(device, {
      id: (textModel.id || 'arrow-text-2d') + '-picking',
      storageState: textModel.storageState,
      source: TEXT_DICTIONARY_STORAGE_WGSL_SHADER,
      vs: VS_GLSL,
      fs: PICKING_FS_GLSL,
      fragmentEntryPoint: 'fragmentPicking',
      modules: [indexPicking] as never,
      shaderLayout: TEXT_DICTIONARY_STORAGE_SHADER_LAYOUT,
      shaderInputs,
      colorAttachmentFormats: ['rgba8unorm', 'rg32sint'],
      depthStencilAttachmentFormat: 'depth24plus',
      parameters: {depthWriteEnabled: false, blend: false}
    });
    for (const storageState of textModel.storageStates.slice(1)) {
      pickingModel.addState(storageState);
    }
    return pickingModel;
  }

  if (textModel instanceof TextStorageModel) {
    const pickingModel = new TextStorageModel(device, {
      id: (textModel.id || 'arrow-text-2d') + '-picking',
      storageState: textModel.storageState,
      source: TEXT_STORAGE_INDEXED_WGSL_SHADER,
      vs: VS_GLSL,
      fs: PICKING_FS_GLSL,
      fragmentEntryPoint: 'fragmentPicking',
      modules: [indexPicking] as never,
      shaderLayout: TEXT_STORAGE_INDEXED_SHADER_LAYOUT,
      shaderInputs,
      colorAttachmentFormats: ['rgba8unorm', 'rg32sint'],
      depthStencilAttachmentFormat: 'depth24plus',
      parameters: {depthWriteEnabled: false, blend: false}
    });
    for (const storageState of textModel.storageStates.slice(1)) {
      pickingModel.addState(storageState);
    }
    return pickingModel;
  }

  return new Model(device, {
    id: (textModel.id || 'arrow-text-2d') + '-picking',
    source: WGSL_SHADER,
    vs: VS_GLSL,
    fs: PICKING_FS_GLSL,
    fragmentEntryPoint: 'fragmentPicking',
    modules: [indexPicking] as never,
    shaderLayout: TEXT_SHADER_LAYOUT,
    bufferLayout: textModel.bufferLayout,
    attributes: {
      ...getArrowTextPickingTableAttributes(textModel.table),
      expandedGlyphVertexData: textModel.attributeState.expandedGlyphVertexData
    },
    instanceCount: textModel.instanceCount,
    vertexCount: 6,
    bindings: {...textModel.bindings},
    shaderInputs,
    colorAttachmentFormats: ['rgba8unorm', 'rg32sint'],
    depthStencilAttachmentFormat: 'depth24plus',
    parameters: {depthWriteEnabled: false, blend: false}
  });
}

export function drawArrowTextPickingPass(
  pickingPass: RenderPass,
  pickingModel: Model,
  textModel: ArrowTextRendererActiveModel,
  options: {onBatch?: (batchIndex: number) => void} = {}
): void {
  if (textModel instanceof TextAttributeModel) {
    drawArrowTextPickingBatches(pickingPass, pickingModel, textModel, options);
    return;
  }
  options.onBatch?.(0);
  pickingModel.draw(pickingPass);
}

function drawArrowTextPickingBatches(
  pickingPass: RenderPass,
  pickingModel: Model,
  textModel: TextAttributeModel,
  {onBatch}: {onBatch?: (batchIndex: number) => void}
): void {
  let batchIndex = 0;
  for (const attributeState of textModel.attributeStates) {
    const gpuBatches = attributeState.modelProps.table?.batches || [];
    for (const [stateBatchIndex, renderBatch] of attributeState.renderBatches.entries()) {
      const gpuBatch = gpuBatches[stateBatchIndex]!;
      pickingModel.setAttributes({
        ...getGPUDataBuffersForLayout(gpuBatch.bufferLayout, gpuBatch.gpuData),
        expandedGlyphVertexData: renderBatch.expandedGlyphVertexData
      });
      pickingModel.setInstanceCount(renderBatch.glyphCount);
      onBatch?.(batchIndex++);
      pickingModel.draw(pickingPass);
    }
  }
  pickingModel.setAttributes({
    ...getArrowTextPickingTableAttributes(textModel.table),
    expandedGlyphVertexData: textModel.attributeState.expandedGlyphVertexData
  });
  pickingModel.setInstanceCount(textModel.attributeState.glyphLayout.glyphCount);
}

function getArrowTextPickingTableAttributes(
  table: GPUTable | undefined
): ReturnType<typeof getGPUDataBuffersForLayout> {
  const firstBatch = table?.batches[0];
  return firstBatch ? getGPUDataBuffersForLayout(firstBatch.bufferLayout, firstBatch.gpuData) : {};
}
