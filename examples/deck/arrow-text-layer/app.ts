// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Deck, OrthographicView} from '@deck.gl/core';
import {ArrowTextLayer} from '@deck.gl-community/arrow-layers';
import {buildSdfFontAtlas, type FontAtlas} from '@luma.gl/text';
import {getArrowLayerTooltip} from '../arrow-layer-tooltip';
import {initializeArrowTextLayerSource} from './arrow-text-layer-source';

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
        fontAtlas: getFontAtlas()
      })
    ]
  });
  return deck;
}
