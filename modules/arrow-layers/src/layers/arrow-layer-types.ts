// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Layer, PickingInfo} from '@deck.gl/core';

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

/** Matches the project module props that Deck's layer pass supplies to managed models. */
export function getDeckProjectProps(layer: Layer, context: Layer['context']) {
  return {
    viewport: context.viewport,
    devicePixelRatio: context.device.canvasContext?.cssToDeviceRatio() ?? 1,
    modelMatrix: layer.props.modelMatrix,
    coordinateSystem: layer.props.coordinateSystem,
    coordinateOrigin: layer.props.coordinateOrigin,
    autoWrapLongitude: layer.props.wrapLongitude
  };
}
