// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Device} from '@luma.gl/core';
import {ConeGeometry} from '../geometries/cone-geometry';
import {
  BaseLightModel,
  buildSpotLightInstanceData,
  type SpotLightModelProps
} from './light-model-utils';

const SPOT_LIGHT_GEOMETRY = new ConeGeometry({
  cap: true,
  nradial: 16,
  nvertical: 1,
  radius: 1
});

export type {SpotLightModelProps} from './light-model-utils';

export class SpotLightModel extends BaseLightModel<SpotLightModelProps> {
  constructor(device: Device, props: SpotLightModelProps) {
    super(device, props, {
      anchorMode: 'apex',
      buildInstanceData: buildSpotLightInstanceData,
      geometry: SPOT_LIGHT_GEOMETRY,
      idPrefix: 'spot-light-model',
      sizePropNames: ['spotLightLength']
    });
  }
}
