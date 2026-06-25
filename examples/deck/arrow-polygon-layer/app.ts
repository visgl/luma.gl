// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Deck, OrthographicView} from '@deck.gl/core';
import {ArrowPolygonLayer} from '@deck.gl-community/arrow-layers';
import {getArrowLayerTooltip} from '../arrow-layer-tooltip';
import {initializeArrowPolygonLayerSource} from './arrow-polygon-layer-source';

/** Creates the standalone or website-hosted Deck polygon-layer example. */
export function createArrowPolygonLayerDeck(parent?: HTMLDivElement) {
  const deck = new Deck({
    parent,
    views: new OrthographicView({id: 'main', controller: true}),
    initialViewState: {target: [0, 0], zoom: 9},
    getTooltip: getArrowLayerTooltip,
    layers: [
      new ArrowPolygonLayer({
        id: 'arrow-polygons',
        pickable: true,
        data: []
      })
    ]
  });
  initializeArrowPolygonLayerSource(sourceData => {
    deck.setProps({
      initialViewState: {target: sourceData.viewState.startCenter, zoom: 9},
      layers: [
        new ArrowPolygonLayer({
          id: 'arrow-polygons',
          pickable: true,
          data: sourceData.recordBatches,
          tessellated: sourceData.tessellated
        })
      ]
    });
  });
  return deck;
}
