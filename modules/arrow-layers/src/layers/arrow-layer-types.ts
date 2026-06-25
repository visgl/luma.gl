// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {PickingInfo} from '@deck.gl/core';

/** Deck draw parameters that preserve the Arrow renderers' alpha blending defaults. */
export const DECK_ARROW_ALPHA_BLEND_PARAMETERS = {
  depthWriteEnabled: false,
  blend: true,
  blendColorOperation: 'add',
  blendAlphaOperation: 'add',
  blendColorSrcFactor: 'src-alpha',
  blendColorDstFactor: 'one-minus-src-alpha',
  blendAlphaSrcFactor: 'one',
  blendAlphaDstFactor: 'one-minus-src-alpha'
} as const;

/** Arrow row identity attached to deck.gl picking results. */
export type ArrowLayerPickingInfo = PickingInfo & {
  arrow?: {
    /** Source row across all loaded record batches. */
    rowIndex: number;
    /** Source record-batch index. */
    batchIndex: number;
    /** Row index inside the source record batch. */
    batchRowIndex: number;
  };
};

/** Returns a stable aspect ratio for luma renderers that need one. */
export function getViewportAspect(viewport: {width: number; height: number}): number {
  return viewport.width / Math.max(viewport.height, 1);
}
