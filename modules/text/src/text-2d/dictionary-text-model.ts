// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import {
  type ArrowDictionaryStorageTextRenderProps,
  type ArrowDictionaryStorageTextState
} from './arrow-text-model';
import {ArrowDictionaryTextModel} from './arrow-text-render-models';

export {createArrowDictionaryStorageTextState} from './arrow-text-model';

export type {
  ArrowDictionaryTextBatchState as DictionaryTextBatchState,
  ArrowDictionaryTextInputProps as DictionaryTextInputProps,
  ArrowDictionaryTextRenderBatchState as DictionaryTextRenderBatchState,
  ArrowDictionaryStorageTextRenderProps as DictionaryTextRenderProps,
  ArrowDictionaryTextSourceVectors as DictionaryTextSourceVectors,
  ArrowDictionaryTextState as DictionaryTextState
} from './arrow-text-model';

export type DictionaryTextModelProps = ArrowDictionaryStorageTextRenderProps & {
  /** Prepared dictionary text state produced by the Arrow adapter layer. */
  storageState: ArrowDictionaryStorageTextState;
  /** Whether this model owns and should destroy the prepared dictionary state. */
  ownsStorageState?: boolean;
};

/** Dictionary text renderer that consumes prepared GPU/model state. */
export class DictionaryTextModel extends ArrowDictionaryTextModel {
  private readonly ownsPreparedStorageState: boolean;
  private readonly preparedStorageState: ArrowDictionaryStorageTextState;

  constructor(device: Device, props: DictionaryTextModelProps) {
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
