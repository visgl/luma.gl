// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {COORDINATE_SYSTEM, Deck, MapView} from '@deck.gl/core';
import {getDeckExampleProps, type DeckExampleDeviceOptions} from '../deck-example-device';
import {CITY_ORIGIN, makeCityFeatures} from '../river-district-data';
import {RiverfrontShadowEffect, type ShadowSettings} from './shadow-effect';
import {ShadowDistrictLayer} from './shadow-layer';
import {DEFAULT_HOUR, FIRST_HOUR, LAST_HOUR, getRiverfrontSun} from './sun';

export function createRiverfrontSoftShadowScene(
  parent: HTMLDivElement,
  options: DeckExampleDeviceOptions = {}
) {
  const features = makeCityFeatures();
  for (const feature of features) {
    if (feature.kind === 'ground') feature.color = [0.72, 0.73, 0.69];
    if (feature.kind === 'building') feature.color = [0.85, 0.82, 0.75];
    if (feature.kind === 'water') feature.color = [0.14, 0.4, 0.47];
  }
  const settings: ShadowSettings = {
    hour: DEFAULT_HOUR,
    animated: true,
    hoursPerSecond: 0.08,
    enabled: true,
    softness: 0.018,
    quality: 'balanced'
  };
  const diagnostics = {frames: 0, backend: '', error: '', finalized: false};
  let resolveReady: () => void;
  let rejectReady: (error: Error) => void;
  const ready = new Promise<void>((resolve, reject) => {
    resolveReady = resolve;
    rejectReady = reject;
  });
  const shadowEffect = new RiverfrontShadowEffect(features, settings);
  let lastFrameTime = 0;
  const deck = new Deck({
    parent,
    ...getDeckExampleProps(options),
    views: new MapView({id: 'riverfront-shadows', controller: true}),
    initialViewState: {
      longitude: CITY_ORIGIN[0],
      latitude: CITY_ORIGIN[1],
      zoom: 15.7,
      pitch: 52,
      bearing: -20
    },
    effects: [shadowEffect],
    layers: [
      new ShadowDistrictLayer({
        id: 'riverfront-shadow-district',
        data: features,
        features,
        shadowEffect,
        pickable: true,
        coordinateSystem: COORDINATE_SYSTEM.METER_OFFSETS,
        coordinateOrigin: CITY_ORIGIN
      })
    ],
    _animate: true,
    onDeviceInitialized: device => {
      diagnostics.backend = device.type;
    },
    onLoad: () => resolveReady(),
    onBeforeRender: () => {
      const now = performance.now();
      if (settings.animated && lastFrameTime) {
        settings.hour =
          FIRST_HOUR +
          ((settings.hour -
            FIRST_HOUR +
            (Math.min(now - lastFrameTime, 100) / 1000) * settings.hoursPerSecond) %
            (LAST_HOUR - FIRST_HOUR));
      }
      lastFrameTime = now;
    },
    onAfterRender: () => {
      diagnostics.frames++;
      parent.dispatchEvent(new Event('sun-frame'));
    },
    onError: error => {
      diagnostics.error ||= error.message;
      rejectReady(error);
    },
    getTooltip: info => info.object?.name ?? null
  });
  return {
    deck,
    settings,
    shadowEffect,
    diagnostics,
    ready,
    get sun() {
      return getRiverfrontSun(settings.hour);
    },
    setHour(hour: number): void {
      settings.hour = Math.max(FIRST_HOUR, Math.min(LAST_HOUR, hour));
      deck.redraw('sun time');
    },
    setAnimated(enabled: boolean): void {
      settings.animated = enabled;
      lastFrameTime = 0;
      deck.setProps({_animate: enabled});
      deck.redraw('sun animation');
    },
    setShadows(enabled: boolean): void {
      settings.enabled = enabled;
      deck.redraw('shadow toggle');
    },
    setSoftness(value: number): void {
      settings.softness = value;
      deck.redraw('shadow softness');
    },
    setSpeed(value: number): void {
      settings.hoursPerSecond = value;
    },
    setQuality(value: ShadowSettings['quality']): void {
      settings.quality = value;
      deck.redraw('shadow quality');
    },
    finalize(): void {
      if (diagnostics.finalized) return;
      diagnostics.finalized = true;
      deck.finalize();
    }
  };
}
