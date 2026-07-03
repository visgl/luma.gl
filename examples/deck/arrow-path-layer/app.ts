// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Deck, OrthographicView} from '@deck.gl/core';
import {ArrowPathLayer} from '@deck.gl-community/arrow-layers';
import type {Device} from '@luma.gl/core';
import {
  getDeckExampleDeviceProps,
  initializeDeckExampleWhenReady,
  type DeckExampleDeviceOptions
} from '../deck-example-device';
import {getArrowLayerTooltip} from '../arrow-layer-tooltip';
import {ArrowPathDataSource, type ArrowPathDataSourceUpdate} from './arrow-path-data-source';
import {MEASURE_SWEEP_DURATION} from '../../arrow/arrow-lines/arrow-line-data';

/** Creates the standalone or website-hosted Deck path-layer example. */
export function createArrowPathLayerDeck(
  parent?: HTMLDivElement,
  options: DeckExampleDeviceOptions = {}
) {
  let deck: Deck<OrthographicView> | null = null;
  let device: Device | null = options.device ?? null;
  let dataSource: ArrowPathDataSource | null = null;
  let activeUpdate: ArrowPathDataSourceUpdate | null = null;
  let animationFrameId: number | null = null;
  let animationStartMilliseconds: number | null = null;
  const initializeDataSource = (): void => {
    if (!deck || !device || dataSource) {
      return;
    }
    dataSource = new ArrowPathDataSource(
      (props: ArrowPathDataSourceUpdate) => {
        activeUpdate = props;
        animationStartMilliseconds = null;
        setPathLayer(deck, props, props.currentTime);
      },
      {supportsStorage: device.type === 'webgpu'}
    );
    dataSource.initialize();
  };

  deck = new Deck<OrthographicView>({
    parent,
    device: options.device,
    deviceProps: options.device
      ? undefined
      : getDeckExampleDeviceProps(options.deviceType ?? 'webgpu'),
    views: new OrthographicView({id: 'main'}),
    initialViewState: {target: [0, 0], zoom: 8},
    controller: true,
    getTooltip: getArrowLayerTooltip,
    layers: [],
    onDeviceInitialized: initializedDevice => {
      device = initializedDevice as Device;
    }
  });
  const cancelInitialization = initializeDeckExampleWhenReady(deck, initializeDataSource);
  const animate = (timeMilliseconds: number): void => {
    const update = activeUpdate;
    if (update?.animate && update.temporalEnabled) {
      animationStartMilliseconds ??= timeMilliseconds;
      const elapsedSeconds = (timeMilliseconds - animationStartMilliseconds) / 1000;
      const currentTime =
        (MEASURE_SWEEP_DURATION * 0.25 + elapsedSeconds * 0.24) % MEASURE_SWEEP_DURATION;
      setPathLayer(deck, update, currentTime);
    }
    animationFrameId = requestAnimationFrame(animate);
  };
  animationFrameId = requestAnimationFrame(animate);

  return {
    finalize: () => {
      cancelInitialization();
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }
      dataSource?.finalize();
      deck?.finalize();
    }
  };
}

function setPathLayer(
  deck: Deck<OrthographicView> | null,
  update: ArrowPathDataSourceUpdate,
  currentTime: number | undefined
): void {
  const {animate: _animate, ...layerProps} = update;
  deck?.setProps({
    layers: [
      new ArrowPathLayer({
        id: 'arrow-paths',
        pickable: true,
        ...layerProps,
        currentTime
      })
    ]
  });
}
