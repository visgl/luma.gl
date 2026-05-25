// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {type Device, type RenderPass} from '@luma.gl/core';
import {
  indexColorPicking,
  indexPicking,
  Model,
  PickingManager,
  supportsIndexPicking,
  type ShaderInputs
} from '@luma.gl/engine';
import {AttributeTextModel, DictionaryTextModel, StorageTextModel} from '@luma.gl/text';
import type {ArrowTextLayerActiveModel} from './arrow-text-layer';
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
  return supportsIndexPicking(device);
}

export function getArrowTextRenderModules(device: Device): unknown[] {
  return [supportsTextIndexPicking(device) ? indexPicking : indexColorPicking];
}

export function createArrowTextPickingManager(
  device: Device,
  shaderInputs: ShaderInputs<any>,
  onObjectPicked: (info: {batchIndex: number | null; objectIndex: number | null}) => void
): PickingManager | null {
  if (!supportsTextIndexPicking(device)) {
    return null;
  }
  return new PickingManager(device, {shaderInputs, mode: 'index', onObjectPicked});
}

export function createArrowTextPickingModel(
  device: Device,
  textModel: ArrowTextLayerActiveModel,
  shaderInputs: ShaderInputs<any>
): Model {
  if (textModel instanceof DictionaryTextModel) {
    return new DictionaryTextModel(device, {
      id: (textModel.id || 'arrow-text-2d') + '-picking',
      storageState: textModel.storageState,
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
    return new StorageTextModel(device, {
      id: (textModel.id || 'arrow-text-2d') + '-picking',
      storageState: textModel.storageState,
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
  textModel: ArrowTextLayerActiveModel
): void {
  if (textModel instanceof AttributeTextModel) {
    drawArrowTextPickingBatches(pickingPass, pickingModel, textModel);
    return;
  }
  pickingModel.draw(pickingPass);
}

function drawArrowTextPickingBatches(
  pickingPass: RenderPass,
  pickingModel: Model,
  textModel: AttributeTextModel
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
    pickingModel.draw(pickingPass);
  }
  pickingModel.setAttributes({
    ...(textModel.table?.attributes || {}),
    expandedGlyphVertexData: textModel.expandedGlyphVertexData
  });
  pickingModel.setInstanceCount(textModel.glyphLayout.glyphCount);
}
