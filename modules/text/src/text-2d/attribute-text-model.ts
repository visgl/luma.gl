// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import {
  createArrowAttributeTextState,
  type ArrowAttributeTextModelStateProps
} from './arrow-text-model';
import {ArrowAttributeTextModel} from './arrow-text-render-models';

export type {
  ArrowAttributeTextModelStateProps as AttributeTextModelProps,
  ArrowAttributeTextRenderProps as AttributeTextRenderProps,
  ArrowAttributeTextRenderBatchState as AttributeTextRenderBatchState,
  ArrowAttributeTextState as AttributeTextState,
  ArrowAttributeTextSourceVectors as AttributeTextSourceVectors
} from './arrow-text-model';

/**
 * Attribute text renderer that consumes prepared GPU/model state.
 *
 * Arrow parsing and glyph-state creation belongs in the adapter layer.
 */
export class AttributeTextModel extends ArrowAttributeTextModel {
  constructor(device: Device, props: ArrowAttributeTextModelStateProps) {
    super(device, props);
  }
}

export {createArrowAttributeTextState};
