// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device} from '../device';
import type {Resource} from './resource';

/** Optional observer for GPU resource lifecycle and allocation events. */
export interface ResourceInstrumentation {
  recordResourceCreated(device: Device, resource: Resource<any>, resourceType: string): void;
  recordResourceDestroyed(device: Device, resource: Resource<any>, resourceType: string): void;
  recordResourceAllocation(
    device: Device,
    resource: Resource<any>,
    byteLength: number,
    resourceType: string,
    previousByteLength: number,
    previousResourceType: string | null
  ): void;
  recordResourceDeallocation(
    device: Device,
    resource: Resource<any>,
    byteLength: number,
    resourceType: string
  ): void;
}
