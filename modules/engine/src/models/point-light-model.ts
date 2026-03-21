// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Device} from '@luma.gl/core';
import {SphereGeometry} from '../geometries/sphere-geometry';
import {
  BaseLightModel,
  buildPointLightInstanceData,
  type PointLightModelProps
} from './light-model-utils';

const POINT_LIGHT_GEOMETRY = new SphereGeometry({
  nlat: 8,
  nlong: 12,
  radius: 1
});

export type {PointLightModelProps} from './light-model-utils';

export class PointLightModel extends BaseLightModel<PointLightModelProps> {
  constructor(device: Device, props: PointLightModelProps) {
    super(device, props, {
      anchorMode: 'centered',
      buildInstanceData: buildPointLightInstanceData,
      geometry: POINT_LIGHT_GEOMETRY,
      idPrefix: 'point-light-model',
      sizePropNames: ['pointLightRadius']
    });
  }
}
