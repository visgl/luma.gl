// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {type Device} from '@luma.gl/core';
import {DictionaryTextModel, type DictionaryTextRenderProps} from '../models/dictionary-text-model';
import {
  createArrowDictionaryStorageTextState,
  refreshArrowDictionaryStorageTextRowBindings,
  type ArrowDictionaryStorageTextInputProps,
  type ArrowDictionaryStorageTextModelProps,
  type ArrowDictionaryStorageTextRenderProps,
  type ArrowDictionaryStorageTextState
} from '../arrow-conversion/convert-arrow-text-vectors';

/**
 * Deprecated Arrow-aware wrapper around {@link DictionaryTextModel}.
 *
 * @deprecated Kept only for internal transition coverage. New layer code should call Arrow
 * conversion helpers, then construct {@link DictionaryTextModel} with prepared dictionary state.
 */
export class ArrowDictionaryTextModel extends DictionaryTextModel {
  private textProps: ArrowDictionaryStorageTextModelProps;

  constructor(device: Device, props: ArrowDictionaryStorageTextModelProps) {
    if (device.type !== 'webgpu') {
      throw new Error('ArrowDictionaryStorageTextModel is WebGPU-only');
    }
    const ownsStorageState = !hasArrowDictionaryStorageTextState(props);
    const storageState = ownsStorageState
      ? createArrowDictionaryStorageTextState(device, props)
      : props.storageState;
    super(device, {
      ...getDictionaryTextRenderProps(props),
      storageState,
      ownsStorageState
    });
    this.textProps = props;
  }

  /** Updates Arrow dictionary text props, rebuilding state only when glyph/layout inputs change. */
  setProps(props: Partial<ArrowDictionaryStorageTextModelProps>): void {
    const nextProps = {...this.textProps, ...props} as ArrowDictionaryStorageTextModelProps;
    const nextUsesExternalState = hasArrowDictionaryStorageTextState(nextProps);
    const arrowProps = props as Partial<ArrowDictionaryStorageTextInputProps>;
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
        refreshArrowDictionaryStorageTextRowBindings(this.device, nextProps, this.storageState);
        this.setDictionaryTextState(
          this.storageState,
          getDictionaryTextRenderProps(nextProps),
          this.ownsStorageState,
          'Arrow dictionary storage text row bindings updated'
        );
      }
      return;
    }

    const nextStorageState = nextUsesExternalState
      ? nextProps.storageState
      : createArrowDictionaryStorageTextState(this.device, nextProps);
    this.setDictionaryTextState(
      nextStorageState,
      getDictionaryTextRenderProps(nextProps),
      !nextUsesExternalState,
      'Arrow dictionary storage text state updated'
    );
  }
}

function getDictionaryTextRenderProps(
  props: ArrowDictionaryStorageTextModelProps
): DictionaryTextRenderProps {
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
  } = props as ArrowDictionaryStorageTextInputProps &
    ArrowDictionaryStorageTextRenderProps & {
      storageState?: ArrowDictionaryStorageTextState;
    };
  return renderProps;
}

function hasArrowDictionaryStorageTextState(
  props: ArrowDictionaryStorageTextModelProps
): props is ArrowDictionaryStorageTextRenderProps & {
  storageState: ArrowDictionaryStorageTextState;
} {
  return 'storageState' in props && props.storageState !== undefined;
}
