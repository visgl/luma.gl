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
  /** Caller-owned prepared data borrowed by the renderer and its implementation models. */
  data: GPUTextData;
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
  private data: GPUTextData;
  private model: TextAttributeModel | TextStorageModel | TextDictionaryModel;
  private pickingModel?: Model;
  private modelProps?: ModelProps;
  private destroyed = false;

  /** Creates a renderer that borrows caller-owned prepared text data. */
  constructor(device: Device, props: TextRendererProps) {
    this.device = device;
    this.data = props.data;
    this.modelProps = props.modelProps;
    this.model = createTextModel(device, props.data, props.modelProps);
    this.pickingModel = props.pickingModel;
  }

  /** Current representation-independent preparation and memory statistics. */
  get stats(): GPUTextStats {
    return this.data.stats;
  }

  /** Draws every prepared render batch into `renderPass`. */
  draw(renderPass: RenderPass): boolean {
    return this.model.draw(renderPass);
  }

  /** Draws the owned picking model, or the render model when no separate picking model was set. */
  drawPicking(renderPass: RenderPass): boolean {
    return (this.pickingModel ?? this.model).draw(renderPass);
  }

  /**
   * Replaces borrowed data or model configuration.
   *
   * A replacement model is created before the previous model is destroyed. The caller remains
   * responsible for destroying replaced {@link GPUTextData} after this method returns.
   */
  setProps(props: Partial<TextRendererProps>): void {
    const nextData = props.data ?? this.data;
    const nextModelProps = props.modelProps ?? this.modelProps;
    if (nextData !== this.data || props.modelProps !== undefined) {
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
  data: GPUTextData,
  modelProps?: ModelProps
): TextAttributeModel | TextStorageModel | TextDictionaryModel {
  const internal = getGPUTextDataProps(data);
  switch (internal.strategy) {
    case 'attribute': {
      return new TextAttributeModel(device, {
        ...internal.modelProps,
        ...modelProps,
        attributeState: internal.state
      });
    }
    case 'dictionary': {
      return new TextDictionaryModel(device, {
        ...internal.modelProps,
        ...modelProps,
        storageState: internal.state
      });
    }
    case 'storage-row-indexed': {
      return new TextRowIndexedStorageModel(device, {
        ...internal.modelProps,
        ...modelProps,
        storageState: internal.state
      });
    }
    case 'storage': {
      return new TextStorageModel(device, {
        ...internal.modelProps,
        ...modelProps,
        storageState: internal.state
      });
    }
  }
}
