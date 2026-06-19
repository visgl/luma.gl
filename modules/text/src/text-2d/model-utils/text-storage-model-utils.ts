// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {type Device, type RenderPass} from '@luma.gl/core';
import {Model, type ModelProps} from '@luma.gl/engine';
import {drawPreparedTextStorageModelBatch} from './text-storage-model-draw';
import type {TextStorageInputProps} from './text-model-props';

type DestroyableStorageState = {
  destroy: () => void;
};

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

/** Removes conversion-only props before forwarding standard Model props. */
export function getPreparedTextRenderProps<RenderProps extends ModelProps>(
  props: ModelProps & Partial<TextStorageInputProps> & {ownsStorageState?: boolean}
): RenderProps {
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
    ownsStorageState: _ownsStorageState,
    ...renderProps
  } = props;
  return renderProps as RenderProps;
}

/** Applies prepared state fields without replacing the model destroy method. */
export function applyPreparedTextStorageState<State extends DestroyableStorageState>(
  target: object,
  storageState: State
): void {
  const {
    angle: _angle,
    alignmentBaseline: _alignmentBaseline,
    alignmentBaselines: _alignmentBaselines,
    attributes: _attributes,
    bindings: _bindings,
    bufferLayout: _bufferLayout,
    characterMapping: _characterMapping,
    characterSet: _characterSet,
    clipRects: _clipRects,
    color: _color,
    colorAttachmentFormats: _colorAttachmentFormats,
    colors: _colors,
    constantAttributes: _constantAttributes,
    debugShaders: _debugShaders,
    defines: _defines,
    depthStencilAttachmentFormat: _depthStencilAttachmentFormat,
    destroy: _destroy,
    disableWarnings: _disableWarnings,
    firstIndex: _firstIndex,
    firstVertex: _firstVertex,
    fontAtlas: _fontAtlas,
    fontSettings: _fontSettings,
    fragmentEntryPoint: _fragmentEntryPoint,
    fs: _fs,
    geometry: _geometry,
    id: _id,
    indexBuffer: _indexBuffer,
    indexCount: _indexCount,
    inject: _inject,
    instanceCount: _instanceCount,
    isInstanced: _isInstanced,
    lineHeight: _lineHeight,
    material: _material,
    modules: _modules,
    ownsStorageState: _ownsStorageState,
    parameters: _parameters,
    pipelineFactory: _pipelineFactory,
    pixelOffset: _pixelOffset,
    pixelOffsets: _pixelOffsets,
    shaderAssembler: _shaderAssembler,
    shaderInputs: _shaderInputs,
    shaderLayout: _shaderLayout,
    size: _size,
    sizes: _sizes,
    source: _source,
    textAnchor: _textAnchor,
    textAnchors: _textAnchors,
    texts: _texts,
    topology: _topology,
    transformFeedback: _transformFeedback,
    uniforms: _uniforms,
    userData: _userData,
    vertexCount: _vertexCount,
    vertexEntryPoint: _vertexEntryPoint,
    vs: _vs,
    ...preparedState
  } = storageState as State & Record<string, unknown>;
  Object.assign(target, preparedState);
}

/** Destroys the previous owned state before a model adopts another state. */
export function replacePreparedTextStorageState<State extends DestroyableStorageState>(
  currentState: State,
  nextState: State,
  ownsCurrentState: boolean
): void {
  if (ownsCurrentState && currentState !== nextState) {
    currentState.destroy();
  }
}

/** Releases prepared state when the model owns it. */
export function destroyOwnedPreparedTextStorageState<State extends DestroyableStorageState>(
  storageState: State,
  ownsStorageState: boolean
): boolean {
  if (ownsStorageState) {
    storageState.destroy();
  }
  return false;
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
