// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Deck, OrthographicView} from '@deck.gl/core';
import {ArrowPathLayer} from '@deck.gl-community/arrow-layers';
import {getDeckExampleDeviceProps, type DeckExampleDeviceOptions} from '../deck-example-device';
import {getArrowLayerTooltip} from '../arrow-layer-tooltip';
import {ArrowPathDataSource, type ArrowPathDataSourceUpdate} from './arrow-path-data-source';

/** Creates the standalone or website-hosted Deck path-layer example. */
export function createArrowPathLayerDeck(
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
    initialViewState: {target: [0, 0], zoom: 8},
    controller: true,
    getTooltip: getArrowLayerTooltip,
    layers: []
  });

  const dataSource = new ArrowPathDataSource((props: ArrowPathDataSourceUpdate) => {
    deck.setProps({
      layers: [new ArrowPathLayer({id: 'arrow-paths', pickable: true, ...props})]
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
