// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Deck, OrthographicView} from '@deck.gl/core';
import {ArrowTextLayer} from '@deck.gl-community/arrow-layers';
import {getArrowLayerTooltip} from '../arrow-layer-tooltip';
import {makeArrowTextSource, type TextDataset} from '../../arrow/arrow-text-2d/arrow-text-data';

const DECK_TEXT_DATASET: TextDataset = {
  labelCount: 800,
  label: '800 Utf8 texts, 24K glyphs',
  textType: 'utf8'
};

/** Creates the standalone or website-hosted Deck text-layer example. */
export function createArrowTextLayerDeck(parent?: HTMLDivElement) {
  const sourceData = makeArrowTextSource(DECK_TEXT_DATASET, 'constant');

  return new Deck({
    parent,
    views: new OrthographicView({id: 'main'}),
    initialViewState: {target: [0, 0], zoom: 0},
    controller: true,
    getTooltip: getArrowLayerTooltip,
    layers: [
      new ArrowTextLayer({
        id: 'arrow-text',
        pickable: true,
        positions: sourceData.positions,
        texts: sourceData.texts,
        clipRects: sourceData.clipRects,
        colors: null,
        angles: null,
        sizes: null,
        pixelOffsets: null,
        model: 'attribute',
        characterSet: ' ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/-'
      })
    ]
  });
}
