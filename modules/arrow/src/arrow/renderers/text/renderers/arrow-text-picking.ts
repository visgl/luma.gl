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
import {AttributeTextModel, DictionaryTextModel, StorageTextModel} from '@luma.gl/text';
import type {ArrowTextRendererActiveModel} from './arrow-text-renderer';
import {
  DICTIONARY_STORAGE_TEXT_SHADER_LAYOUT,
  DICTIONARY_STORAGE_WGSL_SHADER,
  PICKING_FS_GLSL,
  STORAGE_INDEXED_TEXT_SHADER_LAYOUT,
  STORAGE_INDEXED_WGSL_SHADER,
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
  if (textModel instanceof DictionaryTextModel) {
    return DictionaryTextModel.fromState(device, {
      id: (textModel.id || 'arrow-text-2d') + '-picking',
      ...textModel.storageState,
      source: DICTIONARY_STORAGE_WGSL_SHADER,
      vs: VS_GLSL,
      fs: PICKING_FS_GLSL,
      fragmentEntryPoint: 'fragmentPicking',
      modules: [indexPicking] as never,
      shaderLayout: DICTIONARY_STORAGE_TEXT_SHADER_LAYOUT,
      shaderInputs,
      colorAttachmentFormats: ['rgba8unorm', 'rg32sint'],
      depthStencilAttachmentFormat: 'depth24plus',
      parameters: {depthWriteEnabled: false, blend: false}
    });
  }

  if (textModel instanceof StorageTextModel) {
    return StorageTextModel.fromState(device, {
      id: (textModel.id || 'arrow-text-2d') + '-picking',
      ...textModel.storageState,
      source: STORAGE_INDEXED_WGSL_SHADER,
      vs: VS_GLSL,
      fs: PICKING_FS_GLSL,
      fragmentEntryPoint: 'fragmentPicking',
      modules: [indexPicking] as never,
      shaderLayout: STORAGE_INDEXED_TEXT_SHADER_LAYOUT,
      shaderInputs,
      colorAttachmentFormats: ['rgba8unorm', 'rg32sint'],
      depthStencilAttachmentFormat: 'depth24plus',
      parameters: {depthWriteEnabled: false, blend: false}
    });
  }

  return new Model(device, {
    id: (textModel.id || 'arrow-text-2d') + '-picking',
    source: WGSL_SHADER,
    vs: VS_GLSL,
    fs: PICKING_FS_GLSL,
    fragmentEntryPoint: 'fragmentPicking',
    // @ts-expect-error Remove once npm package updated with new types
    modules: [indexPicking],
    shaderLayout: TEXT_SHADER_LAYOUT,
    bufferLayout: textModel.bufferLayout,
    attributes: {
      ...textModel.table!.attributes,
      expandedGlyphVertexData: textModel.expandedGlyphVertexData
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
  if (textModel instanceof AttributeTextModel) {
    drawArrowTextPickingBatches(pickingPass, pickingModel, textModel, options);
    return;
  }
  options.onBatch?.(0);
  pickingModel.draw(pickingPass);
}

function drawArrowTextPickingBatches(
  pickingPass: RenderPass,
  pickingModel: Model,
  textModel: AttributeTextModel,
  {onBatch}: {onBatch?: (batchIndex: number) => void}
): void {
  const gpuBatches = textModel.table?.batches || [];
  for (const [batchIndex, renderBatch] of textModel.renderBatches.entries()) {
    const gpuBatch = gpuBatches[batchIndex];
    if (!gpuBatch) {
      throw new Error('Arrow text picking requires aligned GPU and glyph render batches');
    }
    pickingModel.setAttributes({
      ...gpuBatch.attributes,
      expandedGlyphVertexData: renderBatch.expandedGlyphVertexData
    });
    pickingModel.setInstanceCount(renderBatch.glyphCount);
    onBatch?.(batchIndex);
    pickingModel.draw(pickingPass);
  }
  pickingModel.setAttributes({
    ...(textModel.table?.attributes || {}),
    expandedGlyphVertexData: textModel.expandedGlyphVertexData
  });
  pickingModel.setInstanceCount(textModel.glyphLayout.glyphCount);
}
