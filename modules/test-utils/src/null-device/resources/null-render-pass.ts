// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {RenderPass, RenderPassProps, RenderPassParameters} from '@luma.gl/core';
import {NullDevice} from '../null-device';

export class NullRenderPass extends RenderPass {
  readonly device: NullDevice;

  constructor(device: NullDevice, props: RenderPassProps) {
    super(device, props);
    this.device = device;
  }

  end(): void {}

  override pushDebugGroup(groupLabel: string): void {}
  override popDebugGroup(): void {}
  override insertDebugMarker(markerLabel: string): void {}

  setParameters(parameters: RenderPassParameters = {}): void {}

  beginOcclusionQuery(queryIndex: number): void {}
  endOcclusionQuery(): void {}
}
