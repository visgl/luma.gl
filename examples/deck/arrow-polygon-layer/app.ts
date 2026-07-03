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
import {
  getDeckExampleDeviceProps,
  initializeDeckExampleWhenReady,
  type DeckExampleDeviceOptions
} from '../deck-example-device';
import {getArrowLayerTooltip} from '../arrow-layer-tooltip';

/** Creates the standalone or website-hosted Deck polygon-layer example. */
export function createArrowPolygonLayerDeck(
  parent?: HTMLDivElement,
  options: DeckExampleDeviceOptions = {}
) {
  let dataSource: ArrowPolygonDataSource | null = null;
  let activeUpdate: ArrowPolygonDataSourceUpdate | null = null;
  let deck: Deck<OrthographicView> | null = null;
  let device: Device | null = options.device ?? null;
  let animationFrameId: number | null = null;
  let animationSeconds = 0;
  let lastAnimationMilliseconds: number | null = null;
  const initializeDataSource = (): void => {
    if (!deck || !device) {
      return;
    }
    if (dataSource) {
      return;
    }
    dataSource = new ArrowPolygonDataSource(
      device,
      update => {
        activeUpdate = update;
        animationSeconds = 0;
        lastAnimationMilliseconds = null;
        deck?.setProps({
          viewState: {target: update.viewState.startCenter, zoom: 9},
          layers: [makeArrowPolygonLayer(update, dataSource)]
        });
      },
      props => {
        if (activeUpdate) {
          activeUpdate = {...activeUpdate, ...props};
          deck?.setProps({layers: [makeArrowPolygonLayer(activeUpdate, dataSource)]});
        }
      },
      {
        supportedModelKinds: device.type === 'webgpu' ? ['storage', 'attribute'] : ['attribute']
      }
    );
    dataSource.initialize();
  };

  deck = new Deck<OrthographicView>({
    parent,
    device: options.device,
    deviceProps: options.device
      ? undefined
      : getDeckExampleDeviceProps(options.deviceType ?? 'webgpu'),
    views: new OrthographicView({id: 'main', controller: true}),
    initialViewState: {target: [0, 0], zoom: 9},
    getTooltip: getArrowLayerTooltip,
    layers: [],
    onDeviceInitialized: initializedDevice => {
      device = initializedDevice as Device;
    }
  });
  const cancelInitialization = initializeDeckExampleWhenReady(deck, initializeDataSource);
  const animate = (timeMilliseconds: number): void => {
    if (lastAnimationMilliseconds !== null) {
      animationSeconds += Math.max(timeMilliseconds - lastAnimationMilliseconds, 0) / 1000;
    }
    lastAnimationMilliseconds = timeMilliseconds;
    if (activeUpdate) {
      deck?.setProps({
        viewState: {target: getPolygonScrollCenter(activeUpdate, animationSeconds), zoom: 9}
      });
    }
    animationFrameId = requestAnimationFrame(animate);
  };
  animationFrameId = requestAnimationFrame(animate);

  return {
    finalize: () => {
      cancelInitialization();
      if (animationFrameId !== null) cancelAnimationFrame(animationFrameId);
      dataSource?.finalize();
      deck?.finalize();
    }
  };
}

function getPolygonScrollCenter(
  update: ArrowPolygonDataSourceUpdate,
  animationSeconds: number
): [number, number] {
  const {startCenter, endCenter, scrollDurationSeconds} = update.viewState;
  const cycleDurationSeconds = scrollDurationSeconds * 2;
  const cyclePosition =
    cycleDurationSeconds > 0 ? (animationSeconds % cycleDurationSeconds) / cycleDurationSeconds : 0;
  const scrollProgress = cyclePosition <= 0.5 ? cyclePosition * 2 : (1 - cyclePosition) * 2;
  const progress = scrollProgress * scrollProgress * (3 - 2 * scrollProgress);
  return [
    startCenter[0] + (endCenter[0] - startCenter[0]) * progress,
    startCenter[1] + (endCenter[1] - startCenter[1]) * progress
  ];
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
