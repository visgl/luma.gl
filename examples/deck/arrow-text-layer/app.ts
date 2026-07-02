// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Deck, OrthographicView} from '@deck.gl/core';
import {ArrowTextLayer} from '@deck.gl-community/arrow-layers';
import {buildSdfFontAtlas, type FontAtlas} from '@luma.gl/text';
import {getArrowLayerTooltip} from '../arrow-layer-tooltip';
import {ArrowTextLayerSource, type ArrowTextLayerSourceUpdate} from './arrow-text-layer-source';

let fontAtlas: FontAtlas | undefined;

function getFontAtlas(): FontAtlas {
  fontAtlas ??= buildSdfFontAtlas({
    characterSet: ' ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/-',
    fontFamily: 'Monaco, Menlo, monospace',
    fontWeight: '600',
    fontSize: 64,
    buffer: 6,
    radius: 12
  });
  return fontAtlas;
}

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
    deck.setProps({
      layers: [
        new ArrowTextLayer({
          id: 'arrow-text',
          pickable: true,
          fontAtlas: getFontAtlas(),
          ...props
        })
      ]
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
