// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Deck, OrthographicView} from '@deck.gl/core';
import {ArrowPolygonLayer, type ArrowLayerPickingInfo} from '@deck.gl-community/arrow-layers';
import type {Device} from '@luma.gl/core';
import {
  ArrowPolygonDataSource,
  type ArrowPolygonDataSourceUpdate
} from '../../arrow/arrow-polygons/arrow-polygon-data-source';
import {getDeckExampleDeviceProps, type DeckExampleDeviceOptions} from '../deck-example-device';
import {getArrowLayerTooltip} from '../arrow-layer-tooltip';

/** Creates the standalone or website-hosted Deck polygon-layer example. */
export function createArrowPolygonLayerDeck(
  parent?: HTMLDivElement,
  options: DeckExampleDeviceOptions = {}
) {
  let dataSource: ArrowPolygonDataSource | null = null;
  let activeUpdate: ArrowPolygonDataSourceUpdate | null = null;
  const deck = new Deck({
    parent,
    device: options.device,
    deviceProps: options.device
      ? undefined
      : getDeckExampleDeviceProps(options.deviceType ?? 'webgpu'),
    views: new OrthographicView({id: 'main', controller: true}),
    initialViewState: {target: [0, 0], zoom: 9},
    getTooltip: getArrowLayerTooltip,
    layers: [],
    onDeviceInitialized: device => {
      dataSource = new ArrowPolygonDataSource(
        device as Device,
        update => {
          activeUpdate = update;
          deck.setProps({
            initialViewState: {target: update.viewState.startCenter, zoom: 9},
            layers: [makeArrowPolygonLayer(update, dataSource)]
          });
        },
        props => {
          if (activeUpdate) {
            activeUpdate = {...activeUpdate, ...props};
            deck.setProps({layers: [makeArrowPolygonLayer(activeUpdate, dataSource)]});
          }
        },
        {supportedModelKinds: ['attribute']}
      );
      dataSource.initialize();
    }
  });

  return {
    finalize: () => {
      dataSource?.finalize();
      deck.finalize();
    }
  };
}

function makeArrowPolygonLayer(
  update: ArrowPolygonDataSourceUpdate,
  dataSource: ArrowPolygonDataSource | null
): ArrowPolygonLayer {
  const {viewState: _viewState, ...layerProps} = update;
  return new ArrowPolygonLayer({
    id: 'arrow-polygons',
    pickable: true,
    ...layerProps,
    onHover: (info: ArrowLayerPickingInfo) => {
      dataSource?.setPickedRow(info.arrow?.batchIndex ?? null, info.index ?? null);
    }
  });
}
