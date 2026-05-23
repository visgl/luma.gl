// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import {
  ArrowStorageTripsPathModel,
  type ArrowStorageTripsPathModelProps
} from './arrow-storage-trips-path-model';

export type {ArrowStorageTripsPathModelProps as StorageTripsPathModelProps} from './arrow-storage-trips-path-model';

/** Trips path renderer that consumes prepared storage GPU vectors and temporal state. */
export class StorageTripsPathModel extends ArrowStorageTripsPathModel {
  constructor(device: Device, props: ArrowStorageTripsPathModelProps) {
    super(device, props);
  }
}
