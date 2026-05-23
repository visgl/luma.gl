// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import {
  ArrowStorageTextModel,
  type ArrowStorageTextRenderProps,
  type ArrowStorageTextState
} from './arrow-text-model';

export {createArrowStorageTextState} from './arrow-text-model';

export type {
  ArrowStorageTextBatchState as StorageTextBatchState,
  ArrowStorageTextInputProps as StorageTextInputProps,
  ArrowStorageTextRenderBatchState as StorageTextRenderBatchState,
  ArrowStorageTextRenderProps as StorageTextRenderProps,
  ArrowStorageTextSourceVectors as StorageTextSourceVectors,
  ArrowStorageTextState as StorageTextState
} from './arrow-text-model';

export type StorageTextModelProps = ArrowStorageTextRenderProps & {
  /** Prepared storage text state produced by the Arrow adapter layer. */
  storageState: ArrowStorageTextState;
  /** Whether this model owns and should destroy the prepared storage state. */
  ownsStorageState?: boolean;
};

/** Storage text renderer that consumes prepared GPU/model state. */
export class StorageTextModel extends ArrowStorageTextModel {
  private readonly ownsPreparedStorageState: boolean;
  private readonly preparedStorageState: ArrowStorageTextState;

  constructor(device: Device, props: StorageTextModelProps) {
    super(device, props);
    this.preparedStorageState = props.storageState;
    this.ownsPreparedStorageState = props.ownsStorageState === true;
  }

  override destroy(): void {
    super.destroy();
    if (this.ownsPreparedStorageState) {
      this.preparedStorageState.destroy();
    }
  }
}
