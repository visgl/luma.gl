// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {COORDINATE_SYSTEM, Deck, MapView, type MapViewState} from '@deck.gl/core';
import {WaterSurfaceLayer} from '@deck.gl-community/gpu-layers';
import type {Buffer} from '@luma.gl/core';
import {getDeckExampleProps, type DeckExampleDeviceOptions} from '../deck-example-device';
import {CITY_ORIGIN, makeCityFeatures, makeCityMesh, type CityFeature} from './city-data';
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
  const diagnostics = {
    frames: 0,
    backend: '',
    selected: '',
    finalized: false,
    error: '',
    timeSeconds: 0,
    waterEnabled: true,
    playing: true
  };
  const ready = Promise.withResolvers<void>();
  let activeFeatures = features;
  let waterPositions: Buffer | null = null;
  let waveStrength = 0.55;
  let lastFrameTime: number | null = null;
  const waterFeatures = features.filter(feature => feature.kind === 'water');
  const waterMesh = makeCityMesh(waterFeatures);
  const waterVertices = new Float32Array((waterMesh.length / 10) * 3);
  for (
    let sourceIndex = 0, targetIndex = 0;
    sourceIndex < waterMesh.length;
    sourceIndex += 10, targetIndex += 3
  ) {
    waterVertices.set(waterMesh.subarray(sourceIndex, sourceIndex + 3), targetIndex);
  }
  const deck = new Deck({
    parent,
    ...getDeckExampleProps(options),
    views: new MapView({id: 'city', controller: true}),
    initialViewState: CAMERA_PRESETS.district,
    layers: [],
    _animate: true,
    onLoad: () => {
      updateLayers();
      ready.resolve();
    },
    onDeviceInitialized: device => {
      diagnostics.backend = device.type;
      waterPositions = device.createBuffer({id: 'river-positions', data: waterVertices});
    },
    onBeforeRender: () => {
      const now = performance.now();
      if (diagnostics.playing && diagnostics.waterEnabled) {
        if (lastFrameTime !== null)
          diagnostics.timeSeconds += Math.min(now - lastFrameTime, 100) / 1000;
        lastFrameTime = now;
      }
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

  function updateLayers() {
    const mesh = new CityMeshLayer({
      id: 'city-mesh',
      features: diagnostics.waterEnabled
        ? activeFeatures.filter(feature => feature.kind !== 'water')
        : activeFeatures,
      pickable: true,
      autoHighlight: true,
      highlightColor: [255, 196, 92, 160],
      coordinateSystem: COORDINATE_SYSTEM.METER_OFFSETS,
      coordinateOrigin: CITY_ORIGIN
    });
    const water =
      diagnostics.waterEnabled && waterPositions
        ? new WaterSurfaceLayer({
            id: 'river-water',
            data: waterFeatures,
            positions: waterPositions,
            vertexCount: waterVertices.length / 3,
            coordinateOrigin: CITY_ORIGIN,
            pickable: true,
            autoHighlight: true,
            highlightColor: [255, 196, 92, 160],
            time: () => diagnostics.timeSeconds,
            material: {
              baseColor: [0.045, 0.26, 0.32],
              fresnelColor: [0.7, 0.87, 0.92],
              normalStrength: waveStrength,
              coordinateScale: [0.22, 0.22],
              waveASpeed: 1.1,
              waveBSpeed: -0.7,
              specularIntensity: 0.8
            }
          })
        : null;
    deck.setProps({
      layers: [mesh, water],
      _animate: diagnostics.waterEnabled && diagnostics.playing
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
      updateLayers();
    },
    setWaterEnabled(enabled: boolean) {
      diagnostics.waterEnabled = enabled;
      lastFrameTime = null;
      updateLayers();
    },
    setPlaying(playing: boolean) {
      diagnostics.playing = playing;
      lastFrameTime = null;
      deck.setProps({_animate: playing && diagnostics.waterEnabled});
    },
    setTime(timeSeconds: number) {
      diagnostics.playing = false;
      diagnostics.timeSeconds = timeSeconds;
      lastFrameTime = null;
      deck.setProps({_animate: false});
      deck.redraw('water time changed');
    },
    setWaveStrength(strength: number) {
      waveStrength = strength;
      updateLayers();
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
      waterPositions?.destroy();
      waterPositions = null;
    }
  };
}
