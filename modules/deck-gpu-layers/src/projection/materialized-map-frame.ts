// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {WEB_MERCATOR_EARTH_RADIUS} from '@luma.gl/graph/gpu-project';
import {prepareCRSProjection, ProjectionRenderTransform} from '@luma.gl/graph/gpu-project-crs';
import type {
  MaterializedProjectionOutput,
  MaterializedProjectionSource
} from './materialized-projection-source';

/** Inputs for a fixed 2D Web Mercator frame, in the input CRS's XY convention. */
export type MaterializedMapFrameOptions = Pick<
  Parameters<typeof prepareCRSProjection>[0],
  'from' | 'bounds' | 'tolerance'
> & {
  /** Source coordinate inside the domain used as the stable local origin. */
  sourceOrigin: readonly [number, number];
};

/** Fixed map frame shared by all materialized sources. */
export type MaterializedMapFrame = {
  /** Converts source coordinates to local Deck common units. */
  readonly transform: ProjectionRenderTransform;
  /** Absolute Deck common-space anchor, with zero altitude. */
  readonly commonOrigin: readonly [number, number, number];
};

/** Retained render inputs. Layers borrow these vectors and never schedule or own projection. */
export type MaterializedMapPointSource = MaterializedMapFrame & MaterializedProjectionOutput;

/** Owns a retained projection source with a fixed Web Mercator common-space anchor. */
export type MaterializedMapProjectionSource = MaterializedMapPointSource &
  MaterializedProjectionSource;

/** Prepares a fixed, origin-relative Web Mercator frame in Deck common units. */
export function prepareMaterializedMapFrame({
  from,
  bounds,
  tolerance,
  sourceOrigin
}: MaterializedMapFrameOptions): MaterializedMapFrame {
  const [west, south, east, north] = bounds;
  const [sourceX, sourceY] = sourceOrigin;
  if (
    !sourceOrigin.every(Number.isFinite) ||
    sourceX < west ||
    sourceX > east ||
    sourceY < south ||
    sourceY > north
  ) {
    throw new Error('Map projection origin must be inside the source bounds');
  }
  const prepared = prepareCRSProjection({from, to: 'EPSG:3857', bounds, tolerance});
  if (prepared.status !== 'ready') {
    throw new Error(
      `Could not prepare the map frame: ${prepared.reasons.map(reason => reason.message).join('; ')}`
    );
  }
  const [eastMeters, northMeters] = prepared.projection.projectSync([...sourceOrigin]);
  const commonUnitsPerMeter = 512 / (2 * Math.PI * WEB_MERCATOR_EARTH_RADIUS);
  const commonX = 256 + eastMeters * commonUnitsPerMeter;
  const commonY = 256 + northMeters * commonUnitsPerMeter;
  if (![commonX, commonY].every(coordinate => coordinate >= 0 && coordinate <= 512)) {
    throw new Error('Map projection origin must be inside one Web Mercator world');
  }
  return {
    transform: new ProjectionRenderTransform(prepared, {
      origin: [eastMeters, northMeters],
      scale: [commonUnitsPerMeter, commonUnitsPerMeter]
    }),
    commonOrigin: Object.freeze([commonX, commonY, 0])
  };
}
