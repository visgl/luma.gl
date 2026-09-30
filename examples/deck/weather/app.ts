// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {COORDINATE_SYSTEM, Deck, MapView, _GlobeView, type Viewport} from '@deck.gl/core';
import type {Device, Texture} from '@luma.gl/core';
import type {HeightFogProps, PrecipitationProps} from '@luma.gl/shadertools';
import {getMeterOffsetPosition, WeatherParticleLayer} from '@deck.gl-community/gpu-layers';
import {CITY_ORIGIN, makeCityFeatures, type CityFeature} from '../river-district-data';
import {getDeckExampleProps, type DeckExampleDeviceOptions} from '../deck-example-device';
import {RiverDistrictLayer} from '../river-district-layer';

export type WeatherPreset = 'clear' | 'rain' | 'snow' | 'fog';
const SURFACE_BOUNDS: [number, number, number, number] = [-700, -900, 700, 900];
export function createWeatherScene(parent: HTMLDivElement, options: DeckExampleDeviceOptions = {}) {
  const features = makeCityFeatures();
  let surfaceTexture: Texture | null = null;
  let preset: WeatherPreset = 'fog';
  let intensity = 0.6;
  let windSpeed = 6;
  let windDirection = 45;
  let visibility = 700;
  let fogVariation = 0.85;
  let fogSpeed = 3;
  let playing = true;
  let time = 0;
  let fogTime = 0;
  let previousTime = 0;
  let resolveReady: () => void;
  let rejectReady: (error: Error) => void;
  const ready = new Promise<void>((resolve, reject) => {
    resolveReady = resolve;
    rejectReady = reject;
  });
  const diagnostics = {frames: 0, time: 0, error: '', backend: '', finalized: false};
  const deviceProps = getDeckExampleProps(options);
  const deck = new Deck<MapView | _GlobeView>({
    parent,
    ...deviceProps,
    deviceProps: {
      ...deviceProps.deviceProps,
      createCanvasContext: {alphaMode: 'premultiplied'},
      webgl: {alpha: true}
    },
    views: new MapView({controller: true}),
    initialViewState: {
      longitude: CITY_ORIGIN[0],
      latitude: CITY_ORIGIN[1],
      zoom: 15.6,
      pitch: 58,
      bearing: -25
    },
    layers: [],
    _animate: isWeatherAnimating(),
    onDeviceInitialized: device => {
      surfaceTexture = makeSurfaceTexture(device, features);
      diagnostics.backend = device.type;
    },
    onLoad: () => {
      updateLayers();
      resolveReady();
    },
    onBeforeRender: () => {
      const now = performance.now();
      if (isWeatherAnimating() && previousTime) {
        const elapsed = Math.min((now - previousTime) / 1000, 0.1);
        time += elapsed;
        if (preset !== 'clear' && fogVariation > 0) fogTime += elapsed * fogSpeed;
      }
      previousTime = isWeatherAnimating() ? now : 0;
      diagnostics.time = time;
    },
    onAfterRender: () => {
      diagnostics.frames++;
    },
    onError: error => {
      diagnostics.error ||= error.message;
      rejectReady(error);
    }
  });
  function getParticleCount(): number {
    return Math.round(intensity * 20000);
  }
  function isWeatherAnimating(): boolean {
    return (
      playing &&
      ((getParticleCount() > 0 && (preset === 'rain' || preset === 'snow')) ||
        (preset !== 'clear' && fogVariation > 0 && fogSpeed > 0))
    );
  }
  function getPrecipitation(viewport: Viewport): PrecipitationProps {
    const target = viewport.projectPosition(
      viewport.unproject([viewport.width / 2, viewport.height / 2])
    );
    const center = getMeterOffsetPosition(viewport, CITY_ORIGIN, target);
    const angle = (windDirection * Math.PI) / 180;
    return {
      seed: 29,
      fallSpeed: preset === 'snow' ? 4 : 35,
      turbulence: preset === 'snow' ? 2 : 0,
      wind: [Math.sin(angle) * windSpeed, Math.cos(angle) * windSpeed],
      volumeSize: [1500, 1800, 450],
      volumeCenter: [center[0], center[1], 225]
    };
  }
  function getFog(): HeightFogProps {
    const angle = (windDirection * Math.PI) / 180;
    return {
      color: [0.53, 0.61, 0.67],
      density: preset === 'clear' ? 0 : 3.912 / visibility,
      baseHeight: 30,
      heightFalloff: preset === 'fog' ? 0.012 : 0.003,
      variation: fogVariation,
      wispScale: 180,
      // Integrate drift into this clock so changing speed does not jump the density field.
      velocity: [Math.sin(angle), Math.cos(angle), 0],
      evolutionSpeed: 0.012,
      time: fogTime
    };
  }
  function updateLayers() {
    if (!surfaceTexture) return;
    deck.setProps({
      _animate: isWeatherAnimating(),
      layers: [
        new RiverDistrictLayer({
          id: 'district',
          features,
          fog: getFog,
          coordinateSystem: COORDINATE_SYSTEM.METER_OFFSETS,
          coordinateOrigin: CITY_ORIGIN
        }),
        new WeatherParticleLayer({
          id: 'weather',
          visible: preset === 'rain' || preset === 'snow',
          coordinateOrigin: CITY_ORIGIN,
          weather: preset === 'snow' ? 'snow' : 'rain',
          time: () => time,
          particleCount: getParticleCount(),
          precipitation: getPrecipitation,
          fog: getFog,
          widthPixels: preset === 'snow' ? 4 : 1.4,
          streakLength: preset === 'snow' ? 0 : 16,
          color: preset === 'snow' ? [0.96, 0.98, 1, 0.9] : [0.75, 0.85, 0.95, 0.65],
          surfaceTexture,
          surfaceBounds: SURFACE_BOUNDS
        })
      ]
    });
    deck.redraw('weather settings changed');
  }
  return {
    deck,
    ready,
    diagnostics,
    get surfaceTexture() {
      return surfaceTexture;
    },
    setProjection(value: 'map' | 'globe') {
      deck.setProps({
        views:
          value === 'globe' ? new _GlobeView({controller: true}) : new MapView({controller: true})
      });
    },
    setPreset(value: WeatherPreset) {
      preset = value;
      updateLayers();
    },
    setIntensity(value: number) {
      intensity = value;
      updateLayers();
    },
    setWindSpeed(value: number) {
      windSpeed = value;
      deck.redraw('wind changed');
    },
    setWindDirection(value: number) {
      windDirection = value;
      deck.redraw('wind changed');
    },
    setVisibility(value: number) {
      visibility = value;
      updateLayers();
    },
    setFogVariation(value: number) {
      fogVariation = value;
      updateLayers();
    },
    setFogSpeed(value: number) {
      fogSpeed = value;
      updateLayers();
    },
    setTime(value: number) {
      time = value;
      fogTime = value * fogSpeed;
      previousTime = 0;
      deck.redraw('weather time changed');
    },
    setPlaying(value: boolean) {
      playing = value;
      previousTime = 0;
      deck.setProps({_animate: isWeatherAnimating()});
    },
    reset() {
      time = 0;
      fogTime = 0;
      previousTime = 0;
      deck.redraw('reset weather');
    },
    finalize() {
      if (diagnostics.finalized) return;
      diagnostics.finalized = true;
      deck.finalize();
      surfaceTexture?.destroy();
    }
  };
}

function makeSurfaceTexture(device: Device, features: CityFeature[]): Texture {
  const width = 256;
  const height = 384;
  const data = new Float32Array(width * height);
  const [west, south, east, north] = SURFACE_BOUNDS;
  // Conservative footprint rasterization keeps precipitation out of roofs and covered bridges.
  for (const feature of features) {
    const left = Math.max(
      0,
      Math.floor(((feature.center[0] - feature.size[0] / 2 - west) / (east - west)) * width)
    );
    const right = Math.min(
      width,
      Math.ceil(((feature.center[0] + feature.size[0] / 2 - west) / (east - west)) * width)
    );
    const bottom = Math.max(
      0,
      Math.floor(((feature.center[1] - feature.size[1] / 2 - south) / (north - south)) * height)
    );
    const top = Math.min(
      height,
      Math.ceil(((feature.center[1] + feature.size[1] / 2 - south) / (north - south)) * height)
    );
    for (let row = bottom; row < top; row++)
      for (let column = left; column < right; column++) {
        data[row * width + column] = Math.max(
          data[row * width + column],
          feature.center[2] + feature.size[2]
        );
      }
  }
  return device.createTexture({
    id: 'weather-surface-heights',
    width,
    height,
    format: 'r32float',
    data
  });
}
