// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Deck, OrthographicView} from '@deck.gl/core';
import {ArrowTextLayer} from '@deck.gl-community/arrow-layers';
import {getArrowLayerTooltip} from '../arrow-layer-tooltip';
import {initializeArrowTextLayerSource} from './arrow-text-layer-source';

/** Creates the standalone or website-hosted Deck text-layer example. */
export function createArrowTextLayerDeck(parent?: HTMLDivElement) {
  let initialSource!: Parameters<Parameters<typeof initializeArrowTextLayerSource>[0]>[0];
  initializeArrowTextLayerSource(sourceData => {
    initialSource = sourceData;
  });
  const deck = new Deck({
    parent,
    views: new OrthographicView({id: 'main'}),
    initialViewState: {target: [0, 0], zoom: 0},
    controller: true,
    getTooltip: getArrowLayerTooltip,
    layers: [
      new ArrowTextLayer({
        id: 'arrow-text',
        pickable: true,
        positions: initialSource.positions,
        texts: initialSource.texts,
        clipRects: initialSource.clipRects,
        colors: null,
        angles: null,
        sizes: null,
        pixelOffsets: null,
        model: 'attribute',
        characterSet: ' ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/-'
      })
    ]
  });
  return deck;
}
