// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import {DynamicTexture} from '@luma.gl/engine';
import type {FontAtlas} from './atlas/font-atlas';
import type {GPUTextData} from './gpu-text-data';

/** Construction properties for shared GPU text resources. */
export type GPUTextResourcesProps = {
  /** Normalized font atlas shared by every prepared text batch. */
  fontAtlas: FontAtlas;
  /** Debug label used for shared GPU resources. */
  id?: string;
};

/**
 * Caller-owned GPU resources that may be shared by multiple text batches and renderers.
 *
 * @remarks
 * Destroy every borrowing {@link GPUTextData} and `TextRenderer` before destroying these
 * resources. A single instance uploads the atlas pages only once.
 */
export class GPUTextResources {
  /** Device that owns the uploaded resources. */
  readonly device: Device;
  /** Renderer-independent atlas metrics and image pages. */
  readonly fontAtlas: FontAtlas;
  /** Shared GPU texture array containing every atlas page. */
  readonly atlasTexture: DynamicTexture;
  private destroyed = false;

  constructor(device: Device, props: GPUTextResourcesProps) {
    this.device = device;
    this.fontAtlas = props.fontAtlas;
    this.atlasTexture = new DynamicTexture(device, {
      id: `${props.id || 'text'}-atlas`,
      dimension: '2d-array',
      data: [...props.fontAtlas.pages]
    });
  }

  /** Releases shared GPU resources. Idempotent. */
  destroy(): void {
    if (this.destroyed) {
      return;
    }
    this.destroyed = true;
    this.atlasTexture.destroy();
  }
}
