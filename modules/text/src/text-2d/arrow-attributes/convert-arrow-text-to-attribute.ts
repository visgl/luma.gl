// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {makeArrowGPUVector} from '@luma.gl/arrow';
import type {Device} from '@luma.gl/core';
import type {GPUVector} from '@luma.gl/tables';
import * as arrow from 'apache-arrow';
import type {ArrowUtf8TextType, ArrowUtf8TextVector} from './arrow-text';
import {
  createArrowAttributeTextState,
  type ArrowAttributeTextState,
  type ArrowTextColorType,
  type ArrowTextModelProps,
  type ArrowTextSourceVectors
} from './arrow-text-model';

export type ArrowTextConversionColumns = {
  positions?: string;
  text?: string;
  clipRects?: string;
  colors?: string;
  angles?: string;
  sizes?: string;
  pixelOffsets?: string;
};

export type ConvertedArrowTextData = {
  positions: GPUVector<arrow.FixedSizeList<arrow.Float32>>;
  texts: GPUVector<ArrowUtf8TextType>;
  clipRects?: GPUVector<arrow.FixedSizeList<arrow.Int16>>;
  colors?: GPUVector<ArrowTextColorType>;
  angles?: GPUVector<arrow.Float32>;
  sizes?: GPUVector<arrow.Float32>;
  pixelOffsets?: GPUVector<arrow.FixedSizeList<arrow.Float32>>;
  sourceVectors: ArrowTextSourceVectors;
  destroy: () => void;
};

export type ConvertArrowTextProps = {
  sourceVectors: ArrowTextSourceVectors;
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

/** Converts Arrow text columns into GPU inputs consumed by {@link AttributeTextModel}. */
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

/** Builds prepared attribute text state from Arrow-backed GPU inputs. */
export function convertArrowTextToAttributeState(
  device: Device,
  props: ArrowTextModelProps
): ArrowAttributeTextState {
  return createArrowAttributeTextState(device, props);
}
