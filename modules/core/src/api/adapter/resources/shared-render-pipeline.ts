// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Device} from '../device';
import type {Shader} from './shader';
import {DeviceResource, type DeviceResourceProps} from './device-resource';

export type SharedRenderPipelineProps = DeviceResourceProps & {
  handle?: unknown;
  vs: Shader;
  fs: Shader;
  varyings?: string[];
  bufferMode?: number;
};

/**
 * Internal base class for backend-specific shared render-pipeline implementations.
 * Backends may use this to share expensive linked/program state across multiple
 * `RenderPipeline` wrappers.
 */
export abstract class SharedRenderPipeline extends DeviceResource<SharedRenderPipelineProps> {
  override get [Symbol.toStringTag](): string {
    return 'SharedRenderPipeline';
  }

  abstract override readonly device: Device;
  abstract override readonly handle: unknown;

  constructor(device: Device, props: SharedRenderPipelineProps) {
    super(device, props, {
      ...DeviceResource.defaultProps,
      handle: undefined!,
      vs: undefined!,
      fs: undefined!,
      varyings: undefined!,
      bufferMode: undefined!
    });
  }
}
