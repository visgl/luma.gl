// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Deck, OrthographicView} from '@deck.gl/core';
import {ArrowTextLayer} from '@deck.gl-community/arrow-layers';
import {getArrowLayerTooltip} from '../arrow-layer-tooltip';
import {ArrowTextLayerSource, type ArrowTextLayerSourceUpdate} from './arrow-text-layer-source';

/** Creates the standalone or website-hosted Deck text-layer example. */
export function createArrowTextLayerDeck(parent?: HTMLDivElement) {
  let source: ArrowTextLayerSource | null = null;
  const deck = new Deck({
    parent,
    views: new OrthographicView({id: 'main'}),
    initialViewState: {target: [0, 0], zoom: 0},
    controller: true,
    getTooltip: getArrowLayerTooltip,
    layers: []
  });
  source = new ArrowTextLayerSource((props: ArrowTextLayerSourceUpdate) => {
    deck.setProps({layers: [new ArrowTextLayer({id: 'arrow-text', pickable: true, ...props})]});
  });
  source.initialize();
  return {
    finalize: () => {
      source?.finalize();
      deck.finalize();
    }
  };
}
