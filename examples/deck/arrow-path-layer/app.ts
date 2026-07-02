// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Deck, OrthographicView} from '@deck.gl/core';
import {ArrowPathLayer} from '@deck.gl-community/arrow-layers';
import {getArrowLayerTooltip} from '../arrow-layer-tooltip';
import {ArrowPathLayerSource, type ArrowPathLayerSourceUpdate} from './arrow-path-layer-source';

/** Creates the standalone or website-hosted Deck path-layer example. */
export function createArrowPathLayerDeck(parent?: HTMLDivElement) {
  let source: ArrowPathLayerSource | null = null;
  const deck = new Deck({
    parent,
    views: new OrthographicView({id: 'main'}),
    initialViewState: {target: [0, 0], zoom: 8},
    controller: true,
    getTooltip: getArrowLayerTooltip,
    layers: []
  });
  source = new ArrowPathLayerSource((props: ArrowPathLayerSourceUpdate) => {
    deck.setProps({
      layers: [new ArrowPathLayer({id: 'arrow-paths', pickable: true, ...props})]
    });
  });
  source.initialize();
  return {
    finalize: () => {
      source?.finalize();
      deck.finalize();
    }
  };
}
