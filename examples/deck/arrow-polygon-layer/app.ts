// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Deck, OrthographicView} from '@deck.gl/core';
import {ArrowPolygonLayer, type ArrowLayerPickingInfo} from '@deck.gl-community/arrow-layers';
import type {Device} from '@luma.gl/core';
import {getArrowLayerTooltip} from '../arrow-layer-tooltip';
import {
  createArrowPolygonLayerSource,
  type DeckArrowPolygonSourceUpdate
} from './arrow-polygon-layer-source';

/** Creates the standalone or website-hosted Deck polygon-layer example. */
export function createArrowPolygonLayerDeck(parent?: HTMLDivElement) {
  let source: ReturnType<typeof createArrowPolygonLayerSource> | null = null;
  let activeUpdate: DeckArrowPolygonSourceUpdate | null = null;
  const deck = new Deck({
    parent,
    views: new OrthographicView({id: 'main', controller: true}),
    initialViewState: {target: [0, 0], zoom: 9},
    getTooltip: getArrowLayerTooltip,
    layers: [],
    onDeviceInitialized: device => {
      source = createArrowPolygonLayerSource(
        device as Device,
        update => {
          activeUpdate = update;
          deck.setProps({
            initialViewState: {target: update.viewState.startCenter, zoom: 9},
            layers: [makeArrowPolygonLayer(update, source)]
          });
        },
        props => {
          if (activeUpdate) {
            activeUpdate = {...activeUpdate, ...props};
            deck.setProps({layers: [makeArrowPolygonLayer(activeUpdate, source)]});
          }
        }
      );
      source.initialize();
    }
  });

  return {
    finalize: () => {
      source?.finalize();
      deck.finalize();
    }
  };
}

function makeArrowPolygonLayer(
  update: DeckArrowPolygonSourceUpdate,
  source: ReturnType<typeof createArrowPolygonLayerSource> | null
): ArrowPolygonLayer {
  const {viewState: _viewState, ...layerProps} = update;
  return new ArrowPolygonLayer({
    id: 'arrow-polygons',
    pickable: true,
    ...layerProps,
    onHover: (info: ArrowLayerPickingInfo) => {
      source?.setPickedRow(info.arrow?.batchIndex ?? null, info.index ?? null);
    }
  });
}
