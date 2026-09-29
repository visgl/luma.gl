// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {COORDINATE_SYSTEM, Deck, MapView} from '@deck.gl/core';
import type {Buffer} from '@luma.gl/core';
import {GlowPointLayer} from '@deck.gl-community/gpu-layers';
import type {PointGlowProps} from '@luma.gl/shadertools';
import {makeCityFeatures, CITY_ORIGIN} from '../river-district-data';
import {getDeckExampleProps, type DeckExampleDeviceOptions} from '../deck-example-device';
import {BuildingMeshLayer} from './building-layer';

type GlowFeature = {
  name: string;
  position: [number, number, number];
  tint: [number, number, number];
};

export function createGlowScene(parent: HTMLDivElement, options: DeckExampleDeviceOptions = {}) {
  const buildings = makeCityFeatures();
  for (const feature of buildings)
    feature.color = [feature.color[0] * 0.18, feature.color[1] * 0.22, feature.color[2] * 0.3];
  const features: GlowFeature[] = [];
  for (const side of [-1, 1]) {
    for (let index = 0; index < 40; index++) {
      features.push({
        name: `${side < 0 ? 'West' : 'East'} bank light ${index + 1}`,
        position: [side * 86, index * 28 - 550, 4],
        tint: side < 0 ? [1, 0.35, 0.06] : [0.05, 0.6, 1]
      });
    }
  }
  for (const building of buildings.filter(feature => feature.kind === 'building')) {
    features.push({
      name: `${building.name} rooftop beacon`,
      position: [building.center[0], building.center[1], building.size[2] + 2],
      tint: [0.1, 0.9, 0.55]
    });
  }
  const points = new Float32Array(
    features.flatMap((feature, index) => [...feature.position, ...feature.tint, 1, index])
  );
  let pointBuffer: Buffer | null = null;
  let style: PointGlowProps = {
    coreRadius: 0.12,
    coreIntensity: 0.7,
    haloIntensity: 0.5,
    falloff: 5
  };
  let radiusPixels = 18;
  let enabled = true;
  let resolveReady: () => void;
  let rejectReady: (error: Error) => void;
  const ready = new Promise<void>((resolve, reject) => {
    resolveReady = resolve;
    rejectReady = reject;
  });
  const diagnostics = {frames: 0, backend: '', error: '', selected: '', finalized: false};
  const deckDeviceProps = getDeckExampleProps(options);
  const deck = new Deck({
    parent,
    ...deckDeviceProps,
    deviceProps: {
      ...deckDeviceProps.deviceProps,
      createCanvasContext: {alphaMode: 'opaque'},
      webgl: {alpha: false}
    },
    views: new MapView({controller: true}),
    initialViewState: {
      longitude: CITY_ORIGIN[0],
      latitude: CITY_ORIGIN[1],
      zoom: 15.6,
      pitch: 52,
      bearing: -28
    },
    layers: [],
    onDeviceInitialized: device => {
      diagnostics.backend = device.type;
      pointBuffer = device.createBuffer({data: points});
    },
    onLoad: () => {
      updateLayers();
      resolveReady();
    },
    onAfterRender: () => {
      diagnostics.frames++;
    },
    onError: error => {
      diagnostics.error ||= error.message;
      rejectReady(error);
    },
    onClick: info => {
      diagnostics.selected = info.object?.name || '';
      parent.dispatchEvent(new Event('glow-selection'));
    },
    getTooltip: info => info.object?.name || null
  });
  function updateLayers() {
    if (!pointBuffer) return;
    deck.setProps({
      layers: [
        new BuildingMeshLayer({
          id: 'buildings',
          pickable: true,
          features: buildings,
          data: buildings,
          coordinateSystem: COORDINATE_SYSTEM.METER_OFFSETS,
          coordinateOrigin: CITY_ORIGIN
        }),
        new GlowPointLayer({
          id: 'lights',
          data: features,
          points: pointBuffer,
          pointCount: features.length,
          radiusPixels,
          style,
          visible: enabled,
          pickable: true,
          coordinateSystem: COORDINATE_SYSTEM.METER_OFFSETS,
          coordinateOrigin: CITY_ORIGIN
        })
      ]
    });
  }
  return {
    deck,
    features,
    diagnostics,
    ready,
    get points() {
      return pointBuffer;
    },
    setStyle(next: PointGlowProps) {
      style = {...style, ...next};
      updateLayers();
    },
    setRadius(value: number) {
      radiusPixels = value;
      updateLayers();
    },
    setEnabled(value: boolean) {
      enabled = value;
      updateLayers();
    },
    rebuildLayers: updateLayers,
    finalize() {
      if (diagnostics.finalized) return;
      diagnostics.finalized = true;
      deck.finalize();
      pointBuffer?.destroy();
      pointBuffer = null;
    }
  };
}
