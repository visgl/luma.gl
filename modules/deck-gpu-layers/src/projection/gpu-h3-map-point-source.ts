// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import {WEB_MERCATOR_MAX_LATITUDE, type ProjectionBounds} from '@luma.gl/graph/gpu-project';
import {
  prepareMaterializedMapFrame,
  type MaterializedMapProjectionSource
} from './materialized-map-frame';
import {
  GPUH3ProjectedPointSource,
  type GPUH3ProjectedPointSourceProps
} from './gpu-h3-projected-point-source';

/** Resident H3 inputs with a bounded, single-world Web Mercator frame. */
export type GPUH3MapPointSourceProps = Omit<GPUH3ProjectedPointSourceProps, 'transform'> & {
  /** West, south, east, north in degrees. The interval must not wrap across the antimeridian. */
  bounds: ProjectionBounds;
  /** Maximum fit error in EPSG:3857 metres, before float32 H3 input rounding. Defaults to 0.05. */
  tolerance?: number;
};

/** Materializes resident H3 centers relative to a stable 2D Web Mercator common-space origin. */
export class GPUH3MapPointSource
  extends GPUH3ProjectedPointSource
  implements MaterializedMapProjectionSource
{
  /** Absolute Deck common-space position of the local frame's origin at ground level. */
  readonly commonOrigin: readonly [number, number, number];

  /** Prepares the map frame once. Changing a camera does not change this frame. */
  constructor(device: Device, {bounds, tolerance = 0.05, ...props}: GPUH3MapPointSourceProps) {
    const [west, south, east, north] = bounds;
    if (
      !bounds.every(Number.isFinite) ||
      west < -180 ||
      east > 180 ||
      west >= east ||
      south < -WEB_MERCATOR_MAX_LATITUDE ||
      north > WEB_MERCATOR_MAX_LATITUDE ||
      south >= north
    ) {
      throw new Error('H3 map bounds must be inside one ordered Web Mercator world');
    }
    const longitude = (west + east) / 2;
    const latitude = (south + north) / 2;
    const {transform, commonOrigin} = prepareMaterializedMapFrame({
      from: 'EPSG:4326',
      bounds,
      tolerance,
      sourceOrigin: [longitude, latitude]
    });
    super(device, {...props, transform});
    this.commonOrigin = commonOrigin;
  }
}
