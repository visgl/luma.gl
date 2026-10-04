// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Deck, _GlobeView} from '@deck.gl/core';
import {GlobeCloudLayer} from '@deck.gl-community/gpu-layers';
import {DynamicTexture, loadImageBitmap} from '@luma.gl/engine';
import type {NumberArray3} from '@math.gl/core';
import {getDeckExampleProps, type DeckExampleDeviceOptions} from '../deck-example-device';
import {EarthLayer} from './earth-layer';
import earthImage from '../../showcase/globe/earth.jpg';

export function createGlobeCloudScene(
  parent: HTMLDivElement,
  options: DeckExampleDeviceOptions = {}
) {
  const settings = {clouds: true, animate: true, cover: 0.45, scale: 900, drift: 1, sunlight: 20};
  const diagnostics = {frames: 0, time: 0, backend: '', error: '', finalized: false};
  const ready = Promise.withResolvers<void>();
  const initialViewState = {
    longitude: 20,
    latitude: 20,
    zoom: 1.4,
    minZoom: -1.5,
    maxZoom: 5,
    pitch: 0,
    bearing: 0
  };
  let earthTexture: DynamicTexture | undefined;
  let lastTimestamp = 0;
  let initialized = false;
  const deck = new Deck({
    parent,
    ...getDeckExampleProps(options),
    views: new _GlobeView({id: 'globe', controller: true}),
    initialViewState,
    layers: [],
    _animate: true,
    onDeviceInitialized: device => {
      diagnostics.backend = device.type;
      earthTexture = new DynamicTexture(device, {
        id: 'globe-earth-texture',
        data: loadImageBitmap(earthImage),
        sampler: {
          minFilter: 'linear',
          magFilter: 'linear',
          addressModeU: 'repeat',
          addressModeV: 'clamp-to-edge'
        }
      });
      earthTexture.ready
        .then(() => {
          if (diagnostics.finalized) return;
          initialized = true;
          updateLayers();
        })
        .catch(reportError);
    },
    onBeforeRender: () => {
      const timestamp = performance.now();
      const elapsed = lastTimestamp ? Math.min((timestamp - lastTimestamp) / 1000, 0.1) : 0;
      lastTimestamp = timestamp;
      if (settings.animate) diagnostics.time += elapsed;
      if (initialized && settings.animate) updateLayers();
    },
    onAfterRender: () => {
      diagnostics.frames++;
      if (initialized) ready.resolve();
    },
    onError: reportError
  });
  function reportError(error: Error): void {
    diagnostics.error = error.message;
    ready.reject(error);
  }
  function updateLayers(): void {
    if (!earthTexture?.isReady || diagnostics.finalized) return;
    const longitude = (settings.sunlight * Math.PI) / 180;
    const latitude = (20 * Math.PI) / 180;
    const sunDirection: NumberArray3 = [
      Math.sin(longitude) * Math.cos(latitude),
      -Math.cos(longitude) * Math.cos(latitude),
      Math.sin(latitude)
    ];
    deck.setProps({
      layers: [
        new EarthLayer({id: 'earth', texture: earthTexture.texture, sunDirection}),
        new GlobeCloudLayer({
          id: 'clouds',
          visible: settings.clouds,
          cover: settings.cover,
          time: diagnostics.time,
          scale: settings.scale * 1000,
          // Accelerated drift makes global-scale movement visible during an interactive preview.
          velocity: [22000 * settings.drift, 5000 * settings.drift],
          sunDirection
        })
      ]
    });
  }
  return {
    deck,
    settings,
    diagnostics,
    ready: ready.promise,
    setClouds(value: boolean) {
      settings.clouds = value;
      updateLayers();
    },
    setAnimate(value: boolean) {
      settings.animate = value;
    },
    setCover(value: number) {
      settings.cover = value;
      updateLayers();
    },
    setScale(value: number) {
      settings.scale = value;
      updateLayers();
    },
    setDrift(value: number) {
      settings.drift = value;
      updateLayers();
    },
    setSunlight(value: number) {
      settings.sunlight = value;
      updateLayers();
    },
    centerView() {
      deck.setProps({initialViewState: {...initialViewState}});
    },
    finalize() {
      if (diagnostics.finalized) return;
      diagnostics.finalized = true;
      deck.finalize();
      earthTexture?.destroy();
    }
  };
}
