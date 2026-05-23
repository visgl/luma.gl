// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import {ArrowPathModel, type ArrowPathModelProps} from './arrow-path-model';

export {
  buildArrowPathSegmentTable,
  createArrowPathPreparedState
} from './arrow-path-model';

export type {
  ArrowPathModelProps as AttributePathModelProps,
  ArrowPathPreparedState as AttributePathPreparedState,
  ArrowPathRenderBatchState as AttributePathRenderBatchState,
  ArrowPathSegmentLayout as AttributePathSegmentLayout,
  ArrowPathSegmentTable as AttributePathSegmentTable,
  ArrowPathViewOriginUpdateProps as AttributePathViewOriginUpdateProps
} from './arrow-path-model';

/** Attribute path renderer that consumes prepared GPU vectors and path state. */
export class AttributePathModel extends ArrowPathModel {
  constructor(device: Device, props: ArrowPathModelProps) {
    super(device, props);
  }
}
