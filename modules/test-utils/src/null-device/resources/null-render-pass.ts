// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {RenderBundle} from '@luma.gl/core';
import {RenderPass, RenderPassProps, RenderPassParameters} from '@luma.gl/core';
import {NullDevice} from '../null-device';

export class NullRenderPass extends RenderPass {
  readonly device: NullDevice;
  readonly handle = null;

  constructor(device: NullDevice, props: RenderPassProps) {
    super(device, props);
    this.device = device;
  }

  end(): void {
    if (this.destroyed) {
      return;
    }
    this.destroy();
  }

  pushDebugGroup(groupLabel: string): void {}
  popDebugGroup(): void {}
  insertDebugMarker(markerLabel: string): void {}

  setParameters(parameters: RenderPassParameters = {}): void {}

  /** @throws Always throws because `NullRenderPass` does not support render bundles. */
  executeBundles(_bundles: Iterable<RenderBundle>): void {
    throw new Error('Render bundles are only supported in WebGPU');
  }

  beginOcclusionQuery(queryIndex: number): void {}
  endOcclusionQuery(): void {}
}
