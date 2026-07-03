// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Deck, OrthographicView} from '@deck.gl/core';
import {ArrowTextLayer} from '@deck.gl-community/arrow-layers';
import {buildSdfFontAtlas, type FontAtlas} from '@luma.gl/text';
import type {Device} from '@luma.gl/core';
import {
  getDeckExampleDeviceProps,
  initializeDeckExampleWhenReady,
  type DeckExampleDeviceOptions
} from '../deck-example-device';
import {getArrowLayerTooltip} from '../arrow-layer-tooltip';
import {LABEL_FIELD_WIDTH} from '../../arrow/arrow-text-2d/arrow-text-data';
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
const CAMERA_PAN_SPEED_X = 72;
const CAMERA_PAN_SPEED_Y = 56;

/** Creates the standalone or website-hosted Deck text-layer example. */
export function createArrowTextLayerDeck(
  parent?: HTMLDivElement,
  options: DeckExampleDeviceOptions = {}
) {
  let deck: Deck<OrthographicView> | null = null;
  let device: Device | null = options.device ?? null;
  let dataSource: ArrowTextDataSource | null = null;
  let activeUpdate: ArrowTextDataSourceUpdate | null = null;
  let animationFrameId: number | null = null;
  let animationSeconds = 0;
  let lastAnimationMilliseconds: number | null = null;
  const initializeDataSource = (): void => {
    if (!deck || !device || dataSource) {
      return;
    }
    dataSource = new ArrowTextDataSource(
      (props: ArrowTextDataSourceUpdate) => {
        activeUpdate = props;
        animationSeconds = 0;
        lastAnimationMilliseconds = null;
        setTextLayer(deck, props);
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
    initialViewState: {target: [0, 0], zoom: 0},
    controller: true,
    getTooltip: getArrowLayerTooltip,
    layers: [],
    onDeviceInitialized: initializedDevice => {
      device = initializedDevice as Device;
    }
  });
  const cancelInitialization = initializeDeckExampleWhenReady(deck, initializeDataSource);
  const animate = (timeMilliseconds: number): void => {
    if (lastAnimationMilliseconds !== null && activeUpdate?.animate) {
      animationSeconds += Math.max(timeMilliseconds - lastAnimationMilliseconds, 0) / 1000;
    }
    lastAnimationMilliseconds = timeMilliseconds;
    if (activeUpdate) {
      deck?.setProps({
        viewState: {
          target: getTextCameraTarget(activeUpdate.labelFieldHeight, animationSeconds),
          zoom: 0
        }
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

function setTextLayer(
  deck: Deck<OrthographicView> | null,
  update: ArrowTextDataSourceUpdate
): void {
  const {animate: _animate, labelFieldHeight: _labelFieldHeight, ...layerProps} = update;
  deck?.setProps({
    layers: [
      new ArrowTextLayer({
        id: 'arrow-text',
        pickable: true,
        fontAtlas: getFontAtlas(),
        ...layerProps
      })
    ]
  });
}

function getTextCameraTarget(labelFieldHeight: number, animationSeconds: number): [number, number] {
  const cameraOffsetAmplitudeX = LABEL_FIELD_WIDTH * 0.43;
  const cameraOffsetAmplitudeY = labelFieldHeight * 0.38;
  return [
    Math.sin(animationSeconds * (CAMERA_PAN_SPEED_X / cameraOffsetAmplitudeX)) *
      cameraOffsetAmplitudeX,
    Math.cos(animationSeconds * (CAMERA_PAN_SPEED_Y / cameraOffsetAmplitudeY)) *
      cameraOffsetAmplitudeY
  ];
}
