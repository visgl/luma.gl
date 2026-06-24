// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Deck, OrthographicView} from '@deck.gl/core';
import {ArrowPolygonLayer} from '@deck.gl-community/arrow-layers';
import {getArrowLayerTooltip} from '../arrow-layer-tooltip';
import {makeArrowPolygonExampleData} from '../../arrow/arrow-polygons/arrow-polygon-data';

/** Creates the standalone or website-hosted Deck polygon-layer example. */
export function createArrowPolygonLayerDeck(parent?: HTMLDivElement) {
  const sourceData = makeArrowPolygonExampleData('10k-stream', 'polygon', 'row-colors');

  return new Deck({
    parent,
    views: new OrthographicView({id: 'main', controller: true}),
    initialViewState: {target: sourceData.viewState.startCenter, zoom: 9},
    getTooltip: getArrowLayerTooltip,
    layers: [
      new ArrowPolygonLayer({
        id: 'arrow-polygons',
        pickable: true,
        data: sourceData.recordBatches,
        tessellated: sourceData.tessellated
      })
    ]
  });
}
