// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Deck, OrthographicView} from '@deck.gl/core';
import {ArrowTextLayer} from '@deck.gl-community/arrow-layers';
import {buildSdfFontAtlas, type FontAtlas} from '@luma.gl/text';
import {getDeckExampleDeviceProps, type DeckExampleDeviceOptions} from '../deck-example-device';
import {getArrowLayerTooltip} from '../arrow-layer-tooltip';
import {ArrowTextDataSource, type ArrowTextDataSourceUpdate} from './arrow-text-data-source';

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
export function createArrowTextLayerDeck(
  parent?: HTMLDivElement,
  options: DeckExampleDeviceOptions = {}
) {
  const deck = new Deck({
    parent,
    device: options.device,
    deviceProps: options.device
      ? undefined
      : getDeckExampleDeviceProps(options.deviceType ?? 'webgpu'),
    views: new OrthographicView({id: 'main'}),
    initialViewState: {target: [0, 0], zoom: 0},
    controller: true,
    getTooltip: getArrowLayerTooltip,
    layers: []
  });
  const dataSource = new ArrowTextDataSource((props: ArrowTextDataSourceUpdate) => {
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
  dataSource.initialize();

  return {
    finalize: () => {
      dataSource.finalize();
      deck.finalize();
    }
  };
}
