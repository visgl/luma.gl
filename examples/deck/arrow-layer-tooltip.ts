// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {PickingInfo} from '@deck.gl/core';

/** Returns a compact tooltip for picked Arrow layer rows. */
export function getArrowLayerTooltip(info: PickingInfo): string | null {
  if (!info.picked || !info.layer) {
    return null;
  }
  const rowIndex = Math.max(info.index, 0);
  return `${info.layer.id}\nrow ${rowIndex.toLocaleString()}`;
}
