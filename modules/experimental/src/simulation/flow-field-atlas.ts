// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {assert, Texture, type Device} from '@luma.gl/core';
import {validateFlowParticleDomain, type FlowParticleField} from './flow-particle-field';

/** Maximum atlas allocation: 64 MiB of rgba32float samples. */
export const MAX_FLOW_FIELD_SAMPLES = 4194304;

export type FlowFieldAtlasProps = Pick<FlowParticleField, 'bounds' | 'coordinates'> & {
  id?: string;
  /** Non-overlapping sample blocks, with no duplicated border or gutter texels. */
  tileSize: readonly [number, number];
  /** Fixed column/row capacity. Missing tiles begin with zero validity. */
  tileCount: readonly [number, number];
};

/** A bounded, regularly spaced velocity grid with independently uploaded tiles.
 * Owns its texture; simulations borrow `field`. Tile writes preserve the texture and particle state.
 * Rows run south to north. Bounds describe the first and last samples of the complete lattice.
 */
export class FlowFieldAtlas {
  readonly texture: Texture;
  readonly field: FlowParticleField;
  readonly tileSize: readonly [number, number];
  readonly tileCount: readonly [number, number];
  readonly byteLength: number;
  private readonly emptyTile: Float32Array;

  constructor(device: Device, props: FlowFieldAtlasProps) {
    validateFlowParticleDomain(props);
    // Tile dimensions and counts are integral and positive; a tile has at least two samples per axis.
    assert(props.tileSize.every(value => Number.isSafeInteger(value) && value >= 2));
    assert(props.tileCount.every(value => Number.isSafeInteger(value) && value >= 1));
    const width = props.tileSize[0] * props.tileCount[0];
    const height = props.tileSize[1] * props.tileCount[1];
    // Respect both the explicit memory cap and the backend texture dimension limit.
    assert(width * height <= MAX_FLOW_FIELD_SAMPLES);
    assert(
      width <= device.limits.maxTextureDimension2D && height <= device.limits.maxTextureDimension2D
    );
    this.tileSize = [...props.tileSize];
    this.tileCount = [...props.tileCount];
    this.byteLength = width * height * 16;
    this.emptyTile = new Float32Array(this.tileSize[0] * this.tileSize[1] * 4);
    this.texture = device.createTexture({
      id: props.id ?? 'flow-field-atlas',
      width,
      height,
      format: 'rgba32float',
      usage: Texture.SAMPLE | Texture.COPY_DST | Texture.COPY_SRC,
      data: new Float32Array(width * height * 4),
      sampler: {minFilter: 'nearest', magFilter: 'nearest'}
    });
    this.field = {texture: this.texture, bounds: [...props.bounds], coordinates: props.coordinates};
  }

  /** Replaces one complete sample block. The next simulation step observes the update.
   * Data is row-major (east velocity, north velocity, validity, unused), with finite values.
   * Adjacent tiles interpolate through the existing field sampler; no tile-local respawn occurs.
   */
  writeTile(column: number, row: number, data: Float32Array): void {
    // Writes target a live atlas and exactly one in-range, tightly packed sample block.
    assert(!this.texture.destroyed);
    assert(Number.isInteger(column) && column >= 0 && column < this.tileCount[0]);
    assert(Number.isInteger(row) && row >= 0 && row < this.tileCount[1]);
    assert(data.length === this.emptyTile.length);
    this.texture.writeData(data, {
      x: column * this.tileSize[0],
      y: row * this.tileSize[1],
      width: this.tileSize[0],
      height: this.tileSize[1]
    });
  }

  /** Marks one tile missing. Conservative interpolation also masks cells touching that tile. */
  clearTile(column: number, row: number): void {
    this.writeTile(column, row, this.emptyTile);
  }

  destroy(): void {
    if (!this.texture.destroyed) this.texture.destroy();
  }
}
