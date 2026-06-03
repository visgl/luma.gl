// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import {ArrowStoragePathModel, type ArrowStoragePathModelProps} from './arrow-storage-path-model';

export {createArrowStoragePathState} from './arrow-storage-path-model';

export type {
  ArrowStoragePathBatchState as StoragePathBatchState,
  ArrowStoragePathInputProps as StoragePathInputProps,
  ArrowStoragePathModelProps as StoragePathModelProps,
  ArrowStoragePathRenderBatchState as StoragePathRenderBatchState,
  ArrowStoragePathState as StoragePathState
} from './arrow-storage-path-model';

/** Storage path renderer that consumes prepared GPU vectors or storage state. */
export class StoragePathModel extends ArrowStoragePathModel {
  constructor(device: Device, props: ArrowStoragePathModelProps) {
    super(device, props);
  }
}
