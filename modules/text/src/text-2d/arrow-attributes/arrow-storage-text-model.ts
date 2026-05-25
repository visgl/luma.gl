// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {type Device} from '@luma.gl/core';
import type {Vector} from 'apache-arrow';
import {StorageTextModel, type StorageTextRenderProps} from '../models/storage-text-model';
import {
  appendArrowStorageTextStateBatches,
  createArrowStorageTextState,
  refreshArrowStorageTextRowBindings,
  type ArrowStorageTextInputProps,
  type ArrowStorageTextModelProps,
  type ArrowStorageTextRenderProps,
  type ArrowStorageTextState
} from './arrow-text-model';

/** Arrow adapter that prepares storage text state, then delegates rendering to StorageTextModel. */
export class ArrowStorageTextModel extends StorageTextModel {
  private textProps: ArrowStorageTextModelProps;

  constructor(device: Device, props: ArrowStorageTextModelProps) {
    if (device.type !== 'webgpu') {
      throw new Error('ArrowStorageTextModel is WebGPU-only');
    }
    const ownsStorageState = !hasArrowStorageTextState(props);
    const storageState = ownsStorageState
      ? createArrowStorageTextState(device, props)
      : props.storageState;
    super(device, {
      ...getStorageTextRenderProps(props),
      storageState,
      ownsStorageState
    });
    this.textProps = props;
  }

  /** Updates Arrow text props, rebuilding state only when glyph/layout inputs change. */
  setProps(props: Partial<ArrowStorageTextModelProps>): void {
    const nextProps = {...this.textProps, ...props} as ArrowStorageTextModelProps;
    const nextUsesExternalState = hasArrowStorageTextState(nextProps);
    const arrowProps = props as Partial<ArrowStorageTextInputProps>;
    const shouldReplaceExternalState = 'storageState' in props && props.storageState !== undefined;
    const shouldReplaceState =
      shouldReplaceExternalState ||
      arrowProps.texts !== undefined ||
      arrowProps.sourceVectors !== undefined ||
      arrowProps.textAnchors !== undefined ||
      arrowProps.alignmentBaselines !== undefined ||
      arrowProps.textAnchor !== undefined ||
      arrowProps.alignmentBaseline !== undefined ||
      arrowProps.characterSet !== undefined ||
      arrowProps.fontSettings !== undefined ||
      arrowProps.lineHeight !== undefined ||
      arrowProps.characterMapping !== undefined ||
      arrowProps.fontAtlas !== undefined;
    const shouldRefreshRowBindings =
      !nextUsesExternalState &&
      (arrowProps.positions !== undefined ||
        arrowProps.colors !== undefined ||
        arrowProps.angles !== undefined ||
        arrowProps.sizes !== undefined ||
        arrowProps.pixelOffsets !== undefined ||
        arrowProps.color !== undefined ||
        arrowProps.angle !== undefined ||
        arrowProps.size !== undefined ||
        arrowProps.pixelOffset !== undefined ||
        arrowProps.clipRects !== undefined);

    this.textProps = nextProps;
    if (!shouldReplaceState) {
      if (shouldRefreshRowBindings) {
        refreshArrowStorageTextRowBindings(this.device, nextProps, this.storageState);
        this.setStorageTextState(
          this.storageState,
          getStorageTextRenderProps(nextProps),
          this.ownsStorageState,
          'Arrow storage text row bindings updated'
        );
      }
      return;
    }

    const nextStorageState = nextUsesExternalState
      ? nextProps.storageState
      : createArrowStorageTextState(this.device, nextProps);
    this.setStorageTextState(
      nextStorageState,
      getStorageTextRenderProps(nextProps),
      !nextUsesExternalState,
      'Arrow storage text state updated'
    );
  }

  /** Converts only newly appended source GPUVector batches into retained storage render batches. */
  appendTextBatches(props: Partial<ArrowStorageTextInputProps>): void {
    if (!this.ownsStorageState) {
      throw new Error('ArrowStorageTextModel appendTextBatches() requires owned storage state');
    }
    const nextProps = {...this.textProps, ...props} as ArrowStorageTextInputProps;
    assertArrowStorageTextAppendProps(props);
    assertArrowStorageTextSourceAppendPrefixStable(
      this.textProps as ArrowStorageTextInputProps,
      nextProps,
      this.storageState.batches.length
    );
    appendArrowStorageTextStateBatches(this.device, nextProps, this.storageState);
    this.textProps = nextProps;
    this.setStorageTextState(
      this.storageState,
      getStorageTextRenderProps(nextProps),
      true,
      'Arrow storage text glyph batches appended'
    );
    this.setInstanceCount(this.storageState.glyphCount);
  }
}

function getStorageTextRenderProps(props: ArrowStorageTextModelProps): StorageTextRenderProps {
  const {
    positions: _positions,
    texts: _texts,
    colors: _colors,
    angles: _angles,
    sizes: _sizes,
    pixelOffsets: _pixelOffsets,
    textAnchors: _textAnchors,
    alignmentBaselines: _alignmentBaselines,
    clipRects: _clipRects,
    characterSet: _characterSet,
    fontSettings: _fontSettings,
    lineHeight: _lineHeight,
    fontAtlasManager: _fontAtlasManager,
    characterMapping: _characterMapping,
    fontAtlas: _fontAtlas,
    sourceVectors: _sourceVectors,
    storageState: _storageState,
    ...renderProps
  } = props as ArrowStorageTextInputProps &
    ArrowStorageTextRenderProps & {
      storageState?: ArrowStorageTextState;
    };
  return renderProps;
}

function assertArrowStorageTextAppendProps(props: Partial<ArrowStorageTextInputProps>): void {
  const appendablePropNames = new Set([
    'positions',
    'texts',
    'colors',
    'angles',
    'sizes',
    'pixelOffsets',
    'textAnchors',
    'alignmentBaselines',
    'clipRects',
    'sourceVectors'
  ]);
  for (const propName of Object.keys(props)) {
    if (!appendablePropNames.has(propName)) {
      throw new Error(
        `ArrowStorageTextModel appendTextBatches() cannot update non-row prop "${propName}"`
      );
    }
  }
}

function assertArrowStorageTextSourceAppendPrefixStable(
  previousProps: ArrowStorageTextInputProps,
  nextProps: ArrowStorageTextInputProps,
  processedBatchCount: number
): void {
  const sourceInputs: Array<[string, Vector | undefined, Vector | undefined]> = [
    ['texts', previousProps.sourceVectors.texts, nextProps.sourceVectors.texts],
    ['clipRects', previousProps.sourceVectors.clipRects, nextProps.sourceVectors.clipRects]
  ];

  for (const [name, previousVector, nextVector] of sourceInputs) {
    if (!previousVector && nextVector && processedBatchCount > 0) {
      throw new Error(`ArrowStorageTextModel appendTextBatches() cannot add prior ${name} sources`);
    }
    if (!previousVector || !nextVector) {
      continue;
    }
    for (let batchIndex = 0; batchIndex < processedBatchCount; batchIndex++) {
      if (previousVector.data[batchIndex] !== nextVector.data[batchIndex]) {
        throw new Error(
          `ArrowStorageTextModel appendTextBatches() requires existing ${name} source batches to stay unchanged`
        );
      }
    }
  }
}

function hasArrowStorageTextState(
  props: ArrowStorageTextModelProps
): props is ArrowStorageTextRenderProps & {storageState: ArrowStorageTextState} {
  return 'storageState' in props && props.storageState !== undefined;
}
