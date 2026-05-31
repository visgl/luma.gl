// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {makeArrowGPUVector} from '@luma.gl/arrow';
import type {Device} from '@luma.gl/core';
import type {GPUVector} from '@luma.gl/tables';
import type {AttributeTextModelProps} from '../models/attribute-text-model';
import type {ArrowUtf8TextVector} from './arrow-text';
import {
  createArrowAttributeTextState,
  type ArrowAttributeTextState,
  type ArrowTextModelProps,
  type ArrowTextSourceVectors
} from './convert-arrow-text-vectors';

/**
 * Arrow source column names used when uploading text vectors to GPUVectors.
 *
 * These names become GPUVector/buffer labels and are used by conversion helpers only. Renderer
 * models receive the prepared GPUVector objects and do not inspect Arrow table column names.
 */
export type ArrowTextConversionColumns = {
  /** Source column containing `FixedSizeList<Float32>[2]` label origins. */
  positions?: string;
  /** Source column containing plain or dictionary-encoded UTF-8 labels. */
  text?: string;
  /** Optional source column containing `FixedSizeList<Int16>[4]` clip rectangles. */
  clipRects?: string;
  /** Optional source column containing packed row or character RGBA8 colors. */
  colors?: string;
  /** Optional source column containing per-row rotation angles in degrees. */
  angles?: string;
  /** Optional source column containing per-row deck-style text sizes. */
  sizes?: string;
  /** Optional source column containing `FixedSizeList<Float32>[2]` pixel offsets. */
  pixelOffsets?: string;
};

/**
 * GPUVector bundle produced from Arrow text source vectors.
 *
 * Layer/data-preparation code owns this object and should call `destroy()` when the prepared
 * vectors are no longer used by a model or prepared state. The original CPU Arrow vectors are
 * retained in `sourceVectors` so glyph-layout helpers can still expand UTF-8 rows explicitly.
 */
export type ConvertedArrowTextData = {
  /** GPU-resident label origins aligned row-for-row with `texts`. */
  positions: GPUVector;
  /** GPU-resident plain or dictionary-encoded UTF-8 labels. */
  texts: GPUVector;
  /** Optional GPU-resident packed clip rectangles aligned with text rows. */
  clipRects?: GPUVector;
  /** Optional GPU-resident row or character colors. */
  colors?: GPUVector;
  /** Optional GPU-resident per-row angles in degrees. */
  angles?: GPUVector;
  /** Optional GPU-resident per-row deck-style text sizes. */
  sizes?: GPUVector;
  /** Optional GPU-resident per-row pixel offsets. */
  pixelOffsets?: GPUVector;
  /** CPU Arrow vectors retained for glyph expansion and batch alignment. */
  sourceVectors: ArrowTextSourceVectors;
  /** Releases every GPUVector created by this conversion result. */
  destroy: () => void;
};

/**
 * Arrow-to-GPUVector conversion input accepted by all text conversion helpers.
 *
 * Callers pass explicit source vectors instead of an Arrow table so layer code owns column mapping,
 * filtering, streaming, and resource lifetime before constructing pure GPUVector models.
 */
export type ConvertArrowTextProps = {
  /** CPU Arrow vectors to upload and retain for later glyph expansion. */
  sourceVectors: ArrowTextSourceVectors;
  /** Optional column names used when naming uploaded GPU resources. */
  columns?: ArrowTextConversionColumns;
};

const DEFAULT_COLUMNS: Required<ArrowTextConversionColumns> = {
  positions: 'positions',
  text: 'texts',
  clipRects: 'clipRects',
  colors: 'colors',
  angles: 'angles',
  sizes: 'sizes',
  pixelOffsets: 'pixelOffsets'
};

/**
 * Uploads Arrow text source vectors to GPUVectors for attribute text preparation.
 *
 * This does not construct a renderer. It is intended for layer/data-preparation code that will
 * then call {@link convertArrowTextToAttributeState} and pass the prepared state to
 * {@link AttributeTextModel}.
 */
export function convertArrowTextToAttribute(
  device: Device,
  props: ConvertArrowTextProps
): ConvertedArrowTextData {
  const columns = {...DEFAULT_COLUMNS, ...props.columns};
  const {sourceVectors} = props;
  const positions = makeArrowGPUVector(device, sourceVectors.positions, {
    name: columns.positions,
    preserveDataChunks: true
  });
  const texts = makeArrowGPUVector(device, sourceVectors.texts as ArrowUtf8TextVector, {
    name: columns.text
  });
  const clipRects = sourceVectors.clipRects
    ? makeArrowGPUVector(device, sourceVectors.clipRects, {
        name: columns.clipRects,
        preserveDataChunks: true
      })
    : undefined;
  const colors = sourceVectors.colors
    ? makeArrowGPUVector(device, sourceVectors.colors, {
        name: columns.colors,
        preserveDataChunks: true
      })
    : undefined;
  const angles = sourceVectors.angles
    ? makeArrowGPUVector(device, sourceVectors.angles, {
        name: columns.angles,
        preserveDataChunks: true
      })
    : undefined;
  const sizes = sourceVectors.sizes
    ? makeArrowGPUVector(device, sourceVectors.sizes, {
        name: columns.sizes,
        preserveDataChunks: true
      })
    : undefined;
  const pixelOffsets = sourceVectors.pixelOffsets
    ? makeArrowGPUVector(device, sourceVectors.pixelOffsets, {
        name: columns.pixelOffsets,
        preserveDataChunks: true
      })
    : undefined;
  let destroyed = false;

  return {
    positions,
    texts,
    ...(clipRects ? {clipRects} : {}),
    ...(colors ? {colors} : {}),
    ...(angles ? {angles} : {}),
    ...(sizes ? {sizes} : {}),
    ...(pixelOffsets ? {pixelOffsets} : {}),
    sourceVectors,
    destroy: () => {
      if (destroyed) {
        return;
      }
      destroyed = true;
      positions.destroy();
      texts.destroy();
      clipRects?.destroy();
      colors?.destroy();
      angles?.destroy();
      sizes?.destroy();
      pixelOffsets?.destroy();
    }
  };
}

/**
 * Builds prepared attribute text state from Arrow-backed GPU inputs.
 *
 * The returned state contains generated glyph vertex buffers and the GPU table consumed by
 * {@link AttributeTextModel}. The caller decides whether the model owns that state by setting
 * `ownsAttributeState` on the model props.
 */
export function convertArrowTextToAttributeState(
  device: Device,
  props: ArrowTextModelProps
): ArrowAttributeTextState {
  return createArrowAttributeTextState(device, props);
}

/**
 * Builds model-ready attribute text props from Arrow-backed GPU inputs.
 *
 * CPU Arrow source vectors are consumed only by this conversion step and are not exposed on the
 * returned {@link AttributeTextModelProps}.
 */
export function convertArrowTextToAttributeModelProps(
  device: Device,
  props: ArrowTextModelProps
): AttributeTextModelProps {
  const attributeState = convertArrowTextToAttributeState(device, props);
  const {sourceVectors: _sourceVectors, fontAtlasManager: _fontAtlasManager, ...modelProps} = props;
  return {
    ...modelProps,
    attributeState,
    ownsAttributeState: true
  } as AttributeTextModelProps;
}
