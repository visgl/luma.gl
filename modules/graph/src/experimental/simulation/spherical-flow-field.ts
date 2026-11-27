// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {assert, Texture, type Device} from '@luma.gl/core';

/** Global regular grid: south-to-north rows, -180 to +180 degree columns including the duplicate seam. */
export type SphericalVectorFieldInput = {
  /** Latitude rows and longitude columns, including both poles and the duplicate meridian. */
  shape: readonly [number, number];
  /** Interleaved world Cartesian x/y/z velocities in distance units per second; z points north. */
  velocity: Float32Array;
};

/** Global Cartesian-vector sampling avoids rotating a singular east/north basis at the poles. */
export class SphericalFlowField {
  /** Owned world-vector texture. */
  readonly texture: Texture;
  /** Conservative bound before tangent projection, in input distance units per second. */
  readonly maximumSpeed: number;

  /** Require matching seam values and a single world vector at each pole. Missing cells are unsupported. */
  constructor(device: Device, input: SphericalVectorFieldInput) {
    const [height, width] = input.shape;
    assert(device.type === 'webgpu');
    assert(Number.isInteger(width) && Number.isInteger(height) && width >= 3 && height >= 3);
    assert(
      width <= device.limits.maxTextureDimension2D && height <= device.limits.maxTextureDimension2D
    );
    assert(width * height <= 4194304 && input.velocity.length === width * height * 3);
    const packed = new Float32Array(width * height * 4);
    let maximumSpeed = 0;
    for (let index = 0; index < width * height; index++) {
      const horizontal = input.velocity[index * 3];
      const vertical = input.velocity[index * 3 + 1];
      const polar = input.velocity[index * 3 + 2];
      assert(Number.isFinite(horizontal) && Number.isFinite(vertical) && Number.isFinite(polar));
      packed.set([horizontal, vertical, polar, 1], index * 4);
      maximumSpeed = Math.max(maximumSpeed, Math.hypot(horizontal, vertical, polar));
    }
    const tolerance = Math.max(1, maximumSpeed) * 1e-6;
    for (let row = 0; row < height; row++) {
      for (let column = 0; column < width; column++) {
        if (column !== width - 1 && row !== 0 && row !== height - 1) continue;
        for (let component = 0; component < 3; component++) {
          // Seam endpoints and every longitude at a pole describe the same location.
          assert(
            Math.abs(
              input.velocity[(row * width + column) * 3 + component] -
                input.velocity[row * width * 3 + component]
            ) <= tolerance
          );
        }
      }
    }
    this.maximumSpeed = maximumSpeed;
    this.texture = device.createTexture({
      id: 'spherical-flow-field',
      width,
      height,
      format: 'rgba32float',
      data: packed,
      usage: Texture.SAMPLE | Texture.COPY_DST
    });
  }

  /** Release the owned field texture. */
  destroy(): void {
    this.texture.destroy();
  }
}
