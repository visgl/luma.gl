// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {assert, Texture, type Device} from '@luma.gl/core';
import {validateFlowParticleDomain, type FlowParticleField} from './flow-particle-field';

/**
 * Structural contract matching loaders.gl's ScientificVectorField.
 * No runtime dependency on @loaders.gl/scientific is required.
 */
export type ScientificVectorFieldInput = {
  dimensions: readonly [string, string];
  shape: readonly [number, number]; // [rows, columns]
  eastward: Float32Array;
  northward: Float32Array;
  valid: Uint8Array;
  geographic?: {
    longitudeStart: number;
    latitudeStart: number;
    longitudeStep: number;
    latitudeStep: number;
  };
};
export type ScientificFlowFieldProps = {
  id?: string;
  /** Required for grids lacking geographic coordinates. */
  bounds?: readonly [number, number, number, number];
  coordinates?: 'lnglat' | 'cartesian';
  /** Input row zero must represent the southern/lower edge. */
  input: ScientificVectorFieldInput;
};
/** Uploads normalized scientific vector components into a GPU-resident velocity texture. */
export class ScientificFlowField {
  readonly texture: Texture;
  readonly field: FlowParticleField;
  constructor(device: Device, props: ScientificFlowFieldProps) {
    const {input} = props;
    const [height, width] = input.shape;
    assert(Number.isSafeInteger(width) && width >= 2 &&
      Number.isSafeInteger(height) && height >= 2 &&
      width * height <= 4194304);
    assert(width <= device.limits.maxTextureDimension2D &&
      height <= device.limits.maxTextureDimension2D);
    assert(input.eastward.length === width * height &&
      input.northward.length === width * height &&
      input.valid.length === width * height);
    const geographic = input.geographic;
    if (geographic && (geographic.longitudeStep <= 0 || geographic.latitudeStep <= 0 ||
      !Object.values(geographic).every(Number.isFinite))) {
      throw new Error('ScientificFlowField: expected eastward/south-to-north regular grid');
    }
    const bounds: readonly [number, number, number, number] = props.bounds ??
      (geographic ? [
        geographic.longitudeStart,
        geographic.latitudeStart,
        geographic.longitudeStart + geographic.longitudeStep * (width - 1),
        geographic.latitudeStart + geographic.latitudeStep * (height - 1)
      ] : (() => {throw new Error('ScientificFlowField: bounds required');})());
    const coordinates = props.coordinates ?? (geographic ? 'lnglat' : 'cartesian');
    validateFlowParticleDomain({bounds, coordinates});
    // Preserve missing samples as finite values; shader validity is authoritative.
    const texels = new Float32Array(width * height * 4);
    for (let i = 0; i < width * height; i++) {
      if (input.valid[i]) {
        const u = input.eastward[i], v = input.northward[i];
        assert(Number.isFinite(u) && Number.isFinite(v));
        texels[4 * i] = u;
        texels[4 * i + 1] = v;
        texels[4 * i + 2] = 1;
      }
    }
    this.texture = device.createTexture({
      id: props.id ?? 'scientific-flow-field',
      width, height, format: 'rgba32float',
      usage: Texture.SAMPLE | Texture.COPY_DST | Texture.COPY_SRC,
      data: texels,
      sampler: {minFilter: 'nearest', magFilter: 'nearest'}
    });
    this.field = {texture: this.texture, bounds, coordinates};
  }
  destroy(): void {
    if (!this.texture.destroyed) this.texture.destroy();
  }
}
