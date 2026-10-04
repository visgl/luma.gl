// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {COORDINATE_SYSTEM, Deck, MapView} from '@deck.gl/core';
import {Buffer} from '@luma.gl/core';
import {
  FireflyLayer,
  GlowPointLayer,
  SceneBufferEffect,
  SceneShaderPassEffect,
  type SceneShaderPassContext
} from '@deck.gl-community/gpu-layers';
import {
  createBloomCompositeShaderPass,
  createHDRAutoExposureCompositeShaderPass,
  createSSGICompositeShaderPass,
  createClusteredVolumetricLightingCompositeShaderPass,
  toneMapping
} from '@luma.gl/effects';
import type {ShaderPass, LightingProps, PointLight} from '@luma.gl/shadertools';
import {Matrix4} from '@math.gl/core';
import {RiverDistrictLayer} from './river-district-layer';
import {CITY_ORIGIN, makeCityFeatures} from './river-district-data';
import {RIVERFRONT_VIEW_LIMITS} from './riverfront-view';
import {getDeckExampleProps, type DeckExampleDeviceOptions} from './deck-example-device';

export type RiverfrontLightingKind =
  | 'fireflies'
  | 'hdr-night-lighting'
  | 'global-illumination'
  | 'light-shafts';
export const RIVERFRONT_LIGHTING_TITLES = {
  fireflies: 'Riverfront fireflies',
  'hdr-night-lighting': 'Riverfront HDR night lighting',
  'global-illumination': 'Riverfront global illumination',
  'light-shafts': 'Riverfront light shafts'
};

/** Shared fixture, clock, capture and presentation; each example installs only its focused pass graph. */
export function createRiverfrontLightingScene(
  parent: HTMLDivElement,
  kind: RiverfrontLightingKind,
  options: DeckExampleDeviceOptions = {}
) {
  const settings = {
    animate: true,
    enabled: true,
    bloom: kind === 'fireflies' || kind === 'hdr-night-lighting',
    autoExposure: true,
    exposure: kind === 'fireflies' ? 1.6 : 1,
    intensity: 1,
    radius: 110,
    speed: 0.6,
    radiance: kind === 'hdr-night-lighting' ? 4 : 8,
    density: 0.0008,
    debugMode: 0
  };
  const diagnostics = {frames: 0, time: 0, deltaTime: 0, backend: '', error: '', finalized: false};
  const ready = Promise.withResolvers<void>();
  let lastTimestamp = 0;
  let settlingFrames = 24;
  let points: Buffer | undefined;
  const storageBindings: Record<string, Buffer> = {};
  const features = makeCityFeatures();
  if (kind === 'global-illumination') {
    let buildingIndex = 0;
    for (const feature of features) {
      if (feature.kind === 'building') {
        feature.color =
          buildingIndex % 3 === 0
            ? [0.96, 0.12, 0.04]
            : buildingIndex % 3 === 1
              ? [0.04, 0.28, 0.96]
              : [0.82, 0.87, 0.79];
        buildingIndex++;
      }
      if (feature.kind === 'ground') feature.color = [0.58, 0.6, 0.58];
    }
  }
  const lamps: [number, number, number, number, number, number][] = [
    [-105, -200, 18, 1, 0.45, 0.08],
    [105, -120, 18, 0.15, 0.5, 1],
    [-105, 140, 18, 1, 0.65, 0.18],
    [105, 260, 18, 0.1, 0.75, 0.55]
  ];
  const shaftSource: [number, number, number] = [-200, 120, 260];
  const initialViewState = {
    ...RIVERFRONT_VIEW_LIMITS,
    longitude: CITY_ORIGIN[0],
    latitude: CITY_ORIGIN[1],
    zoom: 16,
    pitch: kind === 'light-shafts' ? 72 : 58,
    bearing: -18
  };
  const capture = new SceneBufferEffect({
    id: `${kind}-capture`,
    motionVectors: true,
    clearColor: [0.004, 0.009, 0.022, 1],
    getTime: () => diagnostics.time,
    getLayerOptions: layer =>
      layer instanceof RiverDistrictLayer
        ? {mode: 'opaque', surfaceBuffer: true}
        : layer instanceof GlowPointLayer
          ? {mode: 'transparent', motionBuffer: true}
          : null
  });
  const effect = new SceneShaderPassEffect({
    id: `${kind}-passes`,
    capture,
    coordinateOrigin: CITY_ORIGIN,
    shaderPasses: [
      ...(kind === 'global-illumination'
        ? [createSSGICompositeShaderPass({resolutionScale: 0.5})]
        : []),
      ...(kind === 'light-shafts'
        ? [createClusteredVolumetricLightingCompositeShaderPass({resolutionScale: 0.5})]
        : []),
      ...(kind === 'fireflies' || kind === 'hdr-night-lighting'
        ? [
            createBloomCompositeShaderPass({
              quality: 'medium',
              radius: 4,
              threshold: 1,
              intensity: 0.4,
              downsample: 'render',
              temporalStability: 0.65,
              temporalReprojection: true
            })
          ]
        : []),
      ...(kind === 'hdr-night-lighting'
        ? [createHDRAutoExposureCompositeShaderPass({initialExposure: 1})]
        : []),
      toneMapping,
      bufferInspection
    ],
    getSceneOptions: makeSceneOptions
  });
  const deck = new Deck({
    parent,
    ...getDeckExampleProps(options),
    views: new MapView({id: 'riverfront', controller: true}),
    initialViewState,
    layers: [],
    effects: [capture, effect],
    _animate: true,
    onDeviceInitialized: device => {
      diagnostics.backend = device.type;
      const rows: number[] = [];
      if (kind === 'fireflies') {
        for (let index = 0; index < 320; index++) {
          const side = index % 2 ? 1 : -1;
          const longitudeOffset = side * (85 + ((index * 37) % 170));
          const latitudeOffset = ((index * 127) % 1000) - 500;
          rows.push(
            longitudeOffset,
            latitudeOffset,
            5 + ((index * 17) % 35),
            0.7,
            1,
            0.12,
            1,
            index
          );
        }
      } else if (kind === 'hdr-night-lighting') {
        lamps.forEach((lamp, index) => rows.push(...lamp, 1, index));
      } else if (kind === 'light-shafts') rows.push(...shaftSource, 1, 0.78, 0.36, 1, 0);
      points = device.createBuffer({
        id: `${kind}-lights`,
        data: new Float32Array(rows.length ? rows : [0, 0, 0, 0, 0, 0, 0, 0])
      });
      if (kind === 'light-shafts') {
        storageBindings['pointLights'] = device.createBuffer({
          id: 'shafts-empty-point-lights',
          byteLength: 32,
          usage: Buffer.STORAGE
        });
        storageBindings['clusterLightCounts'] = device.createBuffer({
          id: 'shafts-empty-cluster-counts',
          data: new Uint32Array([0]),
          usage: Buffer.STORAGE
        });
        storageBindings['clusterLightIndices'] = device.createBuffer({
          id: 'shafts-empty-cluster-indices',
          data: new Uint32Array([0]),
          usage: Buffer.STORAGE
        });
      }
      updateLayers();
    },
    onLoad: () => ready.resolve(),
    onBeforeRender: () => {
      const timestamp = performance.now();
      diagnostics.deltaTime = lastTimestamp ? Math.min((timestamp - lastTimestamp) / 1000, 0.1) : 0;
      if (settings.animate) diagnostics.time += diagnostics.deltaTime;
      lastTimestamp = timestamp;
    },
    onAfterRender: () => {
      diagnostics.frames++;
      settlingFrames = Math.max(0, settlingFrames - 1);
      deck.setProps({_animate: settings.animate || settlingFrames > 0});
    },
    onViewStateChange: () => {
      requestFrames();
    },
    onError: error => {
      diagnostics.error ||= error.message;
      ready.reject(error);
    },
    getTooltip: info => info.object?.name ?? null
  });
  function updateLayers(): void {
    deck.setProps({
      layers: [
        new RiverDistrictLayer({
          id: 'riverfront-city',
          features,
          data: features,
          pickable: true,
          coordinateSystem: COORDINATE_SYSTEM.METER_OFFSETS,
          coordinateOrigin: CITY_ORIGIN,
          roughness: 0.9,
          material: {ambient: 1, diffuse: 1},
          lighting: (): LightingProps => ({
            enabled: true,
            useByteColors: false,
            lights:
              kind === 'hdr-night-lighting'
                ? [
                    {type: 'ambient', color: [0.15, 0.25, 0.42], intensity: 0.12},
                    ...lamps.map(
                      (lamp): PointLight => ({
                        type: 'point',
                        position: [lamp[0], lamp[1], lamp[2]],
                        color: [lamp[3], lamp[4], lamp[5]],
                        intensity: settings.radiance * 4,
                        attenuation: [1, 0, 0.001]
                      })
                    )
                  ]
                : [
                    {
                      type: 'ambient',
                      color: [0.38, 0.48, 0.65],
                      intensity: kind === 'fireflies' ? 0.16 : 0.22
                    },
                    {
                      type: 'directional',
                      color: [1, 0.86, 0.68],
                      intensity: kind === 'fireflies' ? 0.08 : 1.8,
                      direction: [0.6, -0.3, -0.8]
                    }
                  ]
          })
        }),
        points && kind === 'fireflies'
          ? new FireflyLayer({
              id: 'riverfront-fireflies',
              points,
              pointCount: 320,
              coordinateSystem: COORDINATE_SYSTEM.METER_OFFSETS,
              coordinateOrigin: CITY_ORIGIN,
              time: () => diagnostics.time,
              animation: {enabled: settings.enabled ? 1 : 0, speed: settings.speed},
              visible: settings.enabled,
              radiusPixels: 6,
              style: {
                coreRadius: 0.05,
                coreIntensity: 0.8,
                haloIntensity: 4 * settings.intensity,
                falloff: 8
              }
            })
          : null,
        points && (kind === 'hdr-night-lighting' || kind === 'light-shafts')
          ? new GlowPointLayer({
              id: 'riverfront-light-emitters',
              points,
              pointCount: kind === 'hdr-night-lighting' ? 4 : 1,
              coordinateSystem: COORDINATE_SYSTEM.METER_OFFSETS,
              coordinateOrigin: CITY_ORIGIN,
              radiusPixels: kind === 'hdr-night-lighting' ? 12 : 35,
              style: {
                coreRadius: kind === 'hdr-night-lighting' ? 0 : 0.35,
                coreIntensity: settings.radiance,
                haloIntensity: settings.radiance,
                falloff: 7
              }
            })
          : null
      ]
    });
  }
  function makeSceneOptions({frame, camera}: SceneShaderPassContext) {
    const clip = new Matrix4(camera.projectionMatrix)
      .multiplyRight(camera.viewMatrix)
      .transform([...shaftSource, 1]);
    const lightCoordinate =
      clip[3] > 0 ? [(clip[0] / clip[3]) * 0.5 + 0.5, 0.5 - (clip[1] / clip[3]) * 0.5] : [-1, -1];
    const lightVisible = lightCoordinate.every(value => value >= 0 && value <= 1);
    const previousProjection = frame.previousViewProjectionMatrix
      ? new Matrix4([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0.5, 0, 0, 0, 0.5, 1]).multiplyRight(
          frame.previousViewProjectionMatrix
        )
      : camera.viewProjectionMatrix;
    return {
      bindings: storageBindings,
      uniforms: {
        bloomComposite: {intensity: settings.bloom ? 0.4 * settings.intensity : 0},
        hdrAutoExposureAdapt: {
          enabled: settings.autoExposure ? 1 : 0,
          deltaTime: diagnostics.deltaTime,
          minimumExposure: 0.35,
          maximumExposure: 4
        },
        hdrAutoExposureApply: {enabled: settings.autoExposure ? 1 : 0},
        toneMapping: {exposure: settings.exposure},
        ssgiTrace: {
          projectionMatrix: camera.projectionMatrix,
          inverseProjectionMatrix: camera.inverseProjectionMatrix,
          radius: settings.radius,
          thickness: 3,
          intensity: settings.enabled ? 1.8 * settings.intensity : 0,
          rayCount: 12,
          stepCount: 12,
          frameIndex: frame.frameIndex
        },
        ssgiTemporal: {
          inverseProjectionMatrix: camera.inverseProjectionMatrix,
          historyWeight: 0.9,
          depthThreshold: 0.02
        },
        ssgiComposite: {strength: 1, debugMode: 0},
        clusteredVolumetricTrace: {
          projectionMatrix: camera.projectionMatrix,
          inverseProjectionMatrix: camera.inverseProjectionMatrix,
          inverseViewMatrix: camera.inverseViewMatrix,
          density: settings.enabled ? settings.density : 0,
          heightFalloff: 0,
          directionalLightDirectionView: [0.2, 0.4, 0.8],
          directionalLightColor: [1, 0.8, 0.45],
          directionalIntensity: 2,
          pointLightIntensity: 0,
          godRayIntensity: lightVisible ? settings.intensity * 2 : 0,
          godRayPosition: lightCoordinate,
          godRaysOnly: 1,
          maxDistance: 850,
          sampleCount: 10,
          godRaySampleCount: 24,
          clusterNearPlane: camera.nearPlane,
          clusterFarPlane: camera.farPlane
        },
        clusteredVolumetricTemporal: {
          inverseProjectionMatrix: camera.inverseProjectionMatrix,
          inverseViewProjectionMatrix: camera.inverseViewProjectionMatrix,
          previousViewProjectionMatrix: previousProjection,
          historyWeight: 0.8
        },
        clusteredVolumetricDepthHistoryCopy: {
          inverseProjectionMatrix: camera.inverseProjectionMatrix
        },
        clusteredVolumetricComposite: {strength: 1},
        bufferInspection: {
          mode: settings.debugMode,
          inverseProjectionMatrix: camera.inverseProjectionMatrix
        }
      }
    };
  }
  function requestFrames(): void {
    settlingFrames = 24;
    deck.setProps({_animate: true});
    deck.redraw('Riverfront lighting controls');
  }
  return {
    deck,
    capture,
    effect,
    settings,
    diagnostics,
    ready: ready.promise,
    kind,
    setSetting<Name extends keyof typeof settings>(
      name: Name,
      value: (typeof settings)[Name]
    ): void {
      Object.assign(settings, {[name]: value});
      if (name !== 'debugMode' && name !== 'animate') {
        capture.resetHistory();
        effect.resetHistory();
      }
      if (name === 'radiance' || name === 'intensity' || name === 'speed' || name === 'enabled')
        updateLayers();
      requestFrames();
    },
    center(): void {
      capture.resetHistory();
      effect.resetHistory();
      deck.setProps({initialViewState: {...initialViewState}});
      requestFrames();
    },
    setTime(time: number): void {
      diagnostics.time = time;
      capture.resetHistory();
      effect.resetHistory();
      requestFrames();
    },
    finalize(): void {
      if (diagnostics.finalized) return;
      diagnostics.finalized = true;
      deck.finalize();
      points?.destroy();
      for (const buffer of Object.values(storageBindings)) buffer.destroy();
    }
  };
}

/** A shared inspector makes the capture contract visible without a second capture. */
const bufferInspection = {
  name: 'bufferInspection',
  source: `struct BufferInspectionUniforms {mode: i32, inverseProjectionMatrix: mat4x4f};
  @group(0) @binding(auto) var<uniform> bufferInspection: BufferInspectionUniforms;
  @group(0) @binding(auto) var depthTexture: texture_depth_2d;
  @group(0) @binding(auto) var normalTexture: texture_2d<f32>;
  @group(0) @binding(auto) var velocityTexture: texture_2d<f32>;
  fn bufferInspection_sampleColor(sourceTexture: texture_2d<f32>, sourceTextureSampler: sampler, textureSize: vec2f, coordinate: vec2f) -> vec4f {
    if (bufferInspection.mode == 0) { return textureSampleLevel(sourceTexture, sourceTextureSampler, coordinate, 0); }
    let pixel = clamp(vec2i(coordinate * vec2f(textureDimensions(depthTexture))), vec2i(0), vec2i(textureDimensions(depthTexture)) - vec2i(1));
    let depth = textureLoad(depthTexture, pixel, 0);
    if (bufferInspection.mode == 1) { return vec4f(textureLoad(normalTexture, pixel, 0).rgb, 1.0); }
    if (bufferInspection.mode == 2) {
      let clip = vec4f(coordinate * vec2f(2.0, -2.0) + vec2f(-1.0, 1.0), depth, 1.0);
      let view = bufferInspection.inverseProjectionMatrix * clip;
      return vec4f(vec3f(select(exp(-abs(view.z / view.w) / 700.0), 0.0, depth >= 0.99999)), 1.0);
    }
    let velocity = textureLoad(velocityTexture, pixel, 0).xy;
    return vec4f(0.5 + velocity * 12.0, length(velocity) * 30.0, 1.0);
  }`,
  uniformTypes: {mode: 'i32', inverseProjectionMatrix: 'mat4x4<f32>'},
  propTypes: {
    mode: {value: 0},
    inverseProjectionMatrix: {
      value: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
      private: true
    }
  },
  bindingLayout: [
    {name: 'depthTexture', group: 0},
    {name: 'normalTexture', group: 0},
    {name: 'velocityTexture', group: 0}
  ],
  passes: [{sampler: true}]
} as const satisfies ShaderPass;
