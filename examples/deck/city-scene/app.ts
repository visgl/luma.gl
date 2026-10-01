// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {COORDINATE_SYSTEM, Deck, MapView, type MapViewState} from '@deck.gl/core';
import {getDeckExampleProps, type DeckExampleDeviceOptions} from '../deck-example-device';
import {CITY_ORIGIN, makeCityFeatures, type CityFeature} from './city-data';
import {CityMeshLayer} from './city-mesh-layer';

export const CAMERA_PRESETS = {
  district: {
    longitude: CITY_ORIGIN[0],
    latitude: CITY_ORIGIN[1],
    zoom: 15.6,
    pitch: 52,
    bearing: -28
  },
  overhead: {longitude: CITY_ORIGIN[0], latitude: CITY_ORIGIN[1], zoom: 15.5, pitch: 0, bearing: 0},
  waterfront: {
    longitude: CITY_ORIGIN[0],
    latitude: CITY_ORIGIN[1],
    zoom: 16.3,
    pitch: 68,
    bearing: 15
  }
} satisfies Record<string, MapViewState>;

export type CityScene = ReturnType<typeof createCityScene>;

/** Owns the example's Deck instance; Deck owns the device, frame loop, and mesh-layer lifecycle. */
export function createCityScene(parent: HTMLDivElement, options: DeckExampleDeviceOptions = {}) {
  const features = makeCityFeatures();
  const diagnostics = {frames: 0, backend: '', selected: '', finalized: false, error: ''};
  const ready = Promise.withResolvers<void>();
  let activeFeatures = features;
  const deck = new Deck({
    parent,
    ...getDeckExampleProps(options),
    views: new MapView({id: 'city', controller: true}),
    initialViewState: CAMERA_PRESETS.district,
    layers: [makeLayer()],
    onLoad: () => {
      ready.resolve();
    },
    onDeviceInitialized: device => {
      diagnostics.backend = device.type;
    },
    onAfterRender: () => {
      diagnostics.frames++;
    },
    onError: error => {
      diagnostics.error = error.message;
      ready.reject(error);
      parent.dispatchEvent(new CustomEvent('city-error', {detail: error.message}));
    },
    getTooltip: ({object}: {object?: CityFeature}) =>
      object ? `${object.name} · ${object.kind}` : null,
    onClick: ({object}: {object?: CityFeature}) => {
      diagnostics.selected = object?.name ?? '';
      parent.dispatchEvent(new CustomEvent('city-selection', {detail: diagnostics.selected}));
    }
  });

  function makeLayer() {
    return new CityMeshLayer({
      id: 'city-mesh',
      features: activeFeatures,
      pickable: true,
      autoHighlight: true,
      highlightColor: [255, 196, 92, 160],
      coordinateSystem: COORDINATE_SYSTEM.METER_OFFSETS,
      coordinateOrigin: CITY_ORIGIN
    });
  }

  return {
    deck,
    ready: ready.promise,
    diagnostics,
    features,
    setCamera(preset: keyof typeof CAMERA_PRESETS) {
      deck.setProps({initialViewState: {...CAMERA_PRESETS[preset]}});
    },
    setBuildingsVisible(visible: boolean) {
      activeFeatures = visible ? features : features.filter(feature => feature.kind !== 'building');
      deck.setProps({layers: [makeLayer()]});
    },
    getFeatureScreenPosition(name: string): number[] | null {
      const layer = deck.props.layers?.find(candidate => candidate instanceof CityMeshLayer);
      const feature = activeFeatures.find(candidate => candidate.name === name);
      if (!(layer instanceof CityMeshLayer) || !feature) return null;
      return layer.project([
        feature.center[0],
        feature.center[1],
        feature.center[2] + feature.size[2]
      ]);
    },
    finalize() {
      if (diagnostics.finalized) return;
      diagnostics.finalized = true;
      deck.finalize();
    }
  };
}
