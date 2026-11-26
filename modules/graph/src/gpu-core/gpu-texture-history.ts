// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Device, Texture, TextureFormat} from '@luma.gl/core';
import type {GraphTextureDescriptor} from './gpu-command-graph-types';

/** Descriptor for two retained, descriptor-identical history textures. */
export type GPUTextureHistoryProps<Format extends TextureFormat = TextureFormat> = Omit<
  GraphTextureDescriptor<Format>,
  'id'
> & {
  /** Prefix for the two caller-owned physical textures. */
  id?: string;
};

/**
 * Retains a pair of caller-configured textures and exchanges their read/write roles without copies.
 *
 * Import the physical textures into a command graph under distinct previous/current identifiers,
 * supply {@link getBindings} through each encoding's `textures` option, and call {@link advance}
 * only after encoding succeeds. The caller owns this object and its two textures; command graphs
 * borrow them and never submit work or rotate the pair implicitly.
 */
export class GPUTextureHistory<Format extends TextureFormat = TextureFormat> {
  /** Device that owns both physical textures. */
  readonly device: Device;
  /** Prefix used for both physical texture identifiers. */
  readonly id: string;

  private readonly textures: readonly [Texture, Texture];
  private previousIndex = 0;
  private destroyed = false;

  constructor(device: Device, props: GPUTextureHistoryProps<Format>) {
    this.device = device;
    this.id = props.id ?? 'gpu-texture-history';

    const previousTexture = device.createTexture({...props, id: `${this.id}-previous`});
    try {
      const currentTexture = device.createTexture({...props, id: `${this.id}-current`});
      this.textures = [previousTexture, currentTexture];
    } catch (error) {
      previousTexture.destroy();
      throw error;
    }
  }

  /** Physical texture containing the previous successfully encoded frame. */
  get previousTexture(): Texture {
    this.assertAvailable();
    return this.textures[this.previousIndex];
  }

  /** Physical texture available for the next successfully encoded frame. */
  get currentTexture(): Texture {
    this.assertAvailable();
    return this.textures[1 - this.previousIndex];
  }

  /** Returns graph texture overrides without copying, recording, submitting, or changing roles. */
  getBindings(previousIdentifier: string, currentIdentifier: string): Record<string, Texture> {
    this.assertAvailable();
    if (previousIdentifier === currentIdentifier) {
      throw new Error('GPUTextureHistory previous and current identifiers must differ');
    }
    return {
      [previousIdentifier]: this.previousTexture,
      [currentIdentifier]: this.currentTexture
    };
  }

  /** Publishes a successfully encoded current frame as the next previous frame. */
  advance(): void {
    this.assertAvailable();
    this.previousIndex = 1 - this.previousIndex;
  }

  /** Restores the initial role order without clearing or copying either physical texture. */
  reset(): void {
    this.assertAvailable();
    this.previousIndex = 0;
  }

  /** Releases both caller-owned physical textures. Repeated calls are safe. */
  destroy(): void {
    if (this.destroyed) {
      return;
    }
    this.destroyed = true;
    this.textures[0].destroy();
    this.textures[1].destroy();
  }

  private assertAvailable(): void {
    if (this.destroyed) {
      throw new Error('GPUTextureHistory has been destroyed');
    }
  }
}
