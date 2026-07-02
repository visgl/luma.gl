// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import type {ArrowPolygonLayerProps} from '@deck.gl-community/arrow-layers';
import {
  ArrowPolygonSource,
  type ArrowPolygonSourceUpdate
} from '../../arrow/arrow-polygons/arrow-polygon-source';

export type DeckArrowPolygonSourceUpdate = ArrowPolygonSourceUpdate;

/** Creates the shared polygon source/control controller for the deck.gl adapter. */
export function createArrowPolygonLayerSource(
  device: Device,
  onSourceChange: (data: DeckArrowPolygonSourceUpdate) => void,
  onLayerPropsChange: (props: Pick<ArrowPolygonLayerProps, 'model'>) => void
): ArrowPolygonSource {
  return new ArrowPolygonSource(device, onSourceChange, onLayerPropsChange, {
    supportedModelKinds: ['attribute']
  });
}
