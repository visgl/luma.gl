// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Device} from '@luma.gl/core';
import {ConeGeometry} from '../geometries/cone-geometry';
import {
  BaseLightModel,
  buildDirectionalLightInstanceData,
  type DirectionalLightModelProps
} from './light-model-utils';

const DIRECTIONAL_LIGHT_GEOMETRY = new ConeGeometry({
  cap: true,
  nradial: 12,
  nvertical: 1,
  radius: 1
});

export type {DirectionalLightModelProps} from './light-model-utils';

export class DirectionalLightModel extends BaseLightModel<DirectionalLightModelProps> {
  constructor(device: Device, props: DirectionalLightModelProps) {
    super(device, props, {
      anchorMode: 'apex',
      buildInstanceData: buildDirectionalLightInstanceData,
      geometry: DIRECTIONAL_LIGHT_GEOMETRY,
      idPrefix: 'directional-light-model',
      sizePropNames: ['directionalLightLength']
    });
  }
}
