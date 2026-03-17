// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device} from '../device';
import {Resource, type ResourceProps} from './resource';

/**
 * Internal base class for backend-specific shared render-pipeline implementations.
 * Backends may use this to share expensive linked/program state across multiple
 * `RenderPipeline` wrappers.
 */
export abstract class SharedRenderPipeline extends Resource<ResourceProps> {
  override get [Symbol.toStringTag](): string {
    return 'SharedRenderPipeline';
  }

  abstract override readonly device: Device;
  abstract override readonly handle: unknown;

  constructor(device: Device, props: ResourceProps = {}) {
    super(device, props, Resource.defaultProps);
  }
}
