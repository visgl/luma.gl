// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {assert, type Device, type Texture} from '@luma.gl/core';

/** A row-major vector grid. Row zero is the southern/lower edge, columns run west to east. */
export type FlowParticleField = {
  /** Borrowed rgba32float texture: (east velocity, north velocity, validity, unused).
   * Velocities are metres/second; validity >= 0.5 means data is present. All values must be finite.
   * Grid samples include the bounds' endpoints. At least two samples per axis are required.
   */
  texture: Texture;
  /** [west, south, east, north]. Metres for cartesian fields, degrees for lnglat fields.
   * For a dateline crossing, unwrap east above 180 (for example [170, -10, 190, 10]).
   */
  bounds: readonly [number, number, number, number];
  /** lnglat uses spherical east/north conversion at each particle's latitude, restricted to ±85°. */
  coordinates: 'cartesian' | 'lnglat';
};

export function validateFlowParticleField(
  device: Device,
  field: FlowParticleField
): FlowParticleField {
  // Field samples must be finite; a finite validity channel marks missing data.
  assert(
    field.texture.device === device &&
      !field.texture.destroyed &&
      field.texture.format === 'rgba32float'
  );
  assert(field.texture.width >= 2 && field.texture.height >= 2);
  validateFlowParticleDomain(field);
  return {...field, bounds: [...field.bounds]};
}

export function validateFlowParticleDomain(
  field: Pick<FlowParticleField, 'bounds' | 'coordinates'>
): void {
  const [west, south, east, north] = field.bounds;
  // Bounds are finite, increasing, and restricted to the supported geographic domain.
  assert(field.bounds.every(Number.isFinite) && east > west && north > south);
  assert(field.coordinates === 'cartesian' || field.coordinates === 'lnglat');
  assert(field.coordinates !== 'lnglat' || (south >= -85 && north <= 85 && east - west <= 360));
}
