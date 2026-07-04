// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device, RenderPass} from '@luma.gl/core';
import {Model, type ModelProps} from '@luma.gl/engine';
import {getGPUTextDataProps, type GPUTextData, type GPUTextStats} from './gpu-text-data';
import {TextAttributeModel} from './models/text-attribute-model';
import {TextDictionaryModel} from './models/text-dictionary-model';
import {TextRowIndexedStorageModel, TextStorageModel} from './models/text-storage-model';

/** Construction and update properties for {@link TextRenderer}. */
export type TextRendererProps = {
  /** Caller-owned prepared batches borrowed in source order. */
  data: GPUTextData | readonly GPUTextData[];
  /** Advanced render-model overrides applied after values retained during data preparation. */
  modelProps?: ModelProps;
  /** Optional picking model whose lifecycle is transferred to the renderer. */
  pickingModel?: Model;
};

/**
 * Stable facade over the internal attribute, storage, and dictionary text models.
 *
 * @remarks
 * The renderer borrows `props.data`. Calling {@link TextRenderer.destroy} releases its render and
 * picking models but never destroys the data. When replacing data, call
 * {@link TextRenderer.setProps} before destroying the previous {@link GPUTextData}.
 */
export class TextRenderer {
  /** Device used to create the internal render models. */
  readonly device: Device;
  private data: GPUTextData[];
  private model: TextAttributeModel | TextStorageModel | TextDictionaryModel;
  private pickingModel?: Model;
  private modelProps?: ModelProps;
  private destroyed = false;

  /** Creates a renderer that borrows caller-owned prepared text data. */
  constructor(device: Device, props: TextRendererProps) {
    this.device = device;
    this.data = normalizeGPUTextData(device, props.data);
    this.modelProps = props.modelProps;
    this.model = createTextModel(device, this.data, props.modelProps);
    this.pickingModel = props.pickingModel;
  }

  /** Current representation-independent preparation and memory statistics. */
  get stats(): GPUTextStats {
    return aggregateGPUTextStats(this.data);
  }

  /** Prepared batches currently borrowed by the renderer. */
  get batches(): readonly GPUTextData[] {
    return this.data;
  }

  /** Draws every prepared render batch into `renderPass`. */
  draw(renderPass: RenderPass): boolean {
    return this.model.draw(renderPass);
  }

  /** Draws the owned picking model, or the render model when no separate picking model was set. */
  drawPicking(renderPass: RenderPass): boolean {
    return (this.pickingModel ?? this.model).draw(renderPass);
  }

  /** Appends one independently owned prepared batch without rebuilding existing models or data. */
  appendData(data: GPUTextData): void {
    assertCompatibleGPUTextData(this.device, this.data[0]!, data);
    appendTextModelState(this.model, data);
    this.data.push(data);
  }

  /**
   * Replaces borrowed data or model configuration.
   *
   * A replacement model is created before the previous model is destroyed. The caller remains
   * responsible for destroying replaced {@link GPUTextData} after this method returns.
   */
  setProps(props: Partial<TextRendererProps>): void {
    const nextData = props.data ? normalizeGPUTextData(this.device, props.data) : this.data;
    const nextModelProps = props.modelProps ?? this.modelProps;
    if (props.data !== undefined || props.modelProps !== undefined) {
      const nextModel = createTextModel(this.device, nextData, nextModelProps);
      const previousModel = this.model;
      this.data = nextData;
      this.modelProps = nextModelProps;
      this.model = nextModel;
      previousModel.destroy();
    }
    if (props.pickingModel !== undefined && props.pickingModel !== this.pickingModel) {
      this.pickingModel?.destroy();
      this.pickingModel = props.pickingModel;
    }
  }

  /** Destroys borrowing models without destroying caller-owned GPUTextData. */
  destroy(): void {
    if (this.destroyed) {
      return;
    }
    this.destroyed = true;
    this.pickingModel?.destroy();
    this.pickingModel = undefined;
    this.model.destroy();
  }
}

/** @internal Returns the active implementation model for host pipeline integration. */
export function getTextRendererModel(
  renderer: TextRenderer
): TextAttributeModel | TextStorageModel | TextDictionaryModel {
  return renderer['model'];
}

function createTextModel(
  device: Device,
  data: readonly GPUTextData[],
  modelProps?: ModelProps
): TextAttributeModel | TextStorageModel | TextDictionaryModel {
  const firstData = data[0]!;
  const internal = getGPUTextDataProps(firstData);
  let model: TextAttributeModel | TextStorageModel | TextDictionaryModel;
  switch (internal.strategy) {
    case 'attribute': {
      model = new TextAttributeModel(device, {
        ...internal.modelProps,
        ...modelProps,
        attributeState: internal.state
      });
      break;
    }
    case 'dictionary': {
      model = new TextDictionaryModel(device, {
        ...internal.modelProps,
        ...modelProps,
        storageState: internal.state
      });
      break;
    }
    case 'storage-row-indexed': {
      model = new TextRowIndexedStorageModel(device, {
        ...internal.modelProps,
        ...modelProps,
        storageState: internal.state
      });
      break;
    }
    case 'storage': {
      model = new TextStorageModel(device, {
        ...internal.modelProps,
        ...modelProps,
        storageState: internal.state
      });
      break;
    }
  }
  for (const appendedData of data.slice(1)) {
    assertCompatibleGPUTextData(device, firstData, appendedData);
    appendTextModelState(model, appendedData);
  }
  return model;
}

function appendTextModelState(
  model: TextAttributeModel | TextStorageModel | TextDictionaryModel,
  data: GPUTextData
): void {
  const internal = getGPUTextDataProps(data);
  if (model instanceof TextAttributeModel && internal.strategy === 'attribute') {
    model.addState(internal.state);
    return;
  }
  if (model instanceof TextDictionaryModel && internal.strategy === 'dictionary') {
    model.addState(internal.state);
    return;
  }
  if (
    model instanceof TextStorageModel &&
    (internal.strategy === 'storage' || internal.strategy === 'storage-row-indexed')
  ) {
    model.addState(internal.state);
    return;
  }
  throw new Error('TextRenderer cannot append data prepared with a different strategy');
}

function normalizeGPUTextData(
  device: Device,
  data: GPUTextData | readonly GPUTextData[]
): GPUTextData[] {
  const batches = Array.isArray(data) ? [...data] : [data];
  const firstBatch = batches[0];
  if (!firstBatch) {
    throw new Error('TextRenderer requires at least one GPUTextData batch');
  }
  for (const batch of batches) {
    assertCompatibleGPUTextData(device, firstBatch, batch);
  }
  return batches;
}

function assertCompatibleGPUTextData(
  device: Device,
  firstBatch: GPUTextData,
  batch: GPUTextData
): void {
  if (batch.resources.device !== device) {
    throw new Error('TextRenderer GPUTextData must use the renderer device');
  }
  if (batch.resources !== firstBatch.resources) {
    throw new Error('TextRenderer batches must share GPUTextResources');
  }
  if (batch.strategy !== firstBatch.strategy) {
    throw new Error('TextRenderer batches must use the same strategy');
  }
}

function aggregateGPUTextStats(data: readonly GPUTextData[]): GPUTextStats {
  const first = data[0]!;
  return {
    strategy: first.strategy,
    rowCount: data.reduce((sum, batch) => sum + batch.rowCount, 0),
    glyphCount: data.reduce((sum, batch) => sum + batch.glyphCount, 0),
    sourceBatchCount: data.length,
    renderBatchCount: data.reduce((sum, batch) => sum + batch.stats.renderBatchCount, 0),
    preparationTimeMs: data.reduce((sum, batch) => sum + batch.stats.preparationTimeMs, 0),
    retainedByteLength: data.reduce((sum, batch) => sum + batch.stats.retainedByteLength, 0),
    transientByteLength: data.reduce((sum, batch) => sum + batch.stats.transientByteLength, 0)
  };
}
