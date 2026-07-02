// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  Framebuffer,
  RenderPass,
  RenderPipelineParameters,
  Sampler,
  Texture,
  TextureView
} from '@luma.gl/core';
import {Device, Texture as TextureResource} from '@luma.gl/core';
import {Matrix4, radians} from '@math.gl/core';
import type {NumberArray3, NumberArray16} from '@math.gl/core';
import {SHADOW_QUALITY_SETTINGS} from './shadow-quality';

const MAX_DIRECTIONAL_LIGHTS = 1;
const MAX_SPOT_LIGHTS = 4;
const MAX_POINT_LIGHTS = 4;
const MAX_CASCADES = 4;
const POINT_FACE_COUNT = 6;
const DEFAULT_NEAR_PLANE = 0.1;
const IDENTITY_MATRIX: NumberArray16 = [1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1];

export type PointShadowFace = '+X' | '-X' | '+Y' | '-Y' | '+Z' | '-Z';

/** Camera matrices and clip distances used to fit directional cascades. */
export type ShadowCamera = {
  viewMatrix: Readonly<Matrix4 | NumberArray16>;
  projectionMatrix: Readonly<Matrix4 | NumberArray16>;
  near: number;
  far: number;
};

type ShadowBiasProps = {
  /** Receiver displacement along the world-space normal. */
  normalBias?: number;
  /** Constant raster depth bias applied by the caster pipeline. */
  depthBias?: number;
  /** Slope-scaled raster depth bias applied by the caster pipeline. */
  depthBiasSlopeScale?: number;
  /** Fraction of the direct-light contribution affected by the shadow. */
  strength?: number;
};

/** Directional light shadow configuration. `direction` points from a surface toward the light. */
export type DirectionalShadowLight = ShadowBiasProps & {
  direction: Readonly<NumberArray3>;
  shadowDistance?: number;
  casterDistance?: number;
  sourceAngularRadius?: number;
  cascadeSplitLambda?: number;
  cascadeBlendFraction?: number;
  farFadeFraction?: number;
};

/** Perspective shadow configuration for a spot light. */
export type SpotShadowLight = ShadowBiasProps & {
  position: Readonly<NumberArray3>;
  direction: Readonly<NumberArray3>;
  range: number;
  outerConeAngle: number;
  nearPlane?: number;
  sourceRadius?: number;
};

/** Cube-array shadow configuration for an omnidirectional point light. */
export type PointShadowLight = ShadowBiasProps & {
  position: Readonly<NumberArray3>;
  range: number;
  nearPlane?: number;
  sourceRadius?: number;
};

/** Resource capacities and quality defaults owned by {@link ShadowMapRenderer}. */
export type ShadowMapRendererProps = {
  quality?: 'low' | 'balanced' | 'cinematic';
  directionalLightCapacity?: number;
  spotLightCapacity?: number;
  pointLightCapacity?: number;
  directionalMapSize?: number;
  spotMapSize?: number;
  pointMapSize?: number;
};

/** One depth-only light view passed to the application caster callback. */
export type ShadowRenderView = {
  renderPass: RenderPass;
  type: 'directional' | 'spot' | 'point';
  lightIndex: number;
  cascadeIndex?: number;
  pointFace?: PointShadowFace;
  camera: ShadowCamera;
  viewProjectionMatrix: Readonly<Matrix4>;
  mapSize: number;
  rasterParameters: Readonly<RenderPipelineParameters>;
};

/** Per-frame lights and caster callback accepted by {@link ShadowMapRenderer.render}. */
export type ShadowRenderOptions = {
  camera: ShadowCamera;
  directionalLights?: readonly DirectionalShadowLight[];
  spotLights?: readonly SpotShadowLight[];
  pointLights?: readonly PointShadowLight[];
  drawShadowCasters: (view: ShadowRenderView) => void;
};

/** Fully resolved props returned by the renderer and consumed by the `shadow` shader module. */
export type ShadowShaderProps = {
  quality: 'low' | 'balanced' | 'cinematic';
  cascadeCount: number;
  cascadeSplits: readonly number[];
  blockerSampleCount: number;
  filterSampleCount: number;
  directionalLights: readonly DirectionalShadowLight[];
  spotLights: readonly SpotShadowLight[];
  pointLights: readonly PointShadowLight[];
  directionalViewProjectionMatrices: readonly Readonly<Matrix4 | NumberArray16>[];
  spotViewProjectionMatrices: readonly Readonly<Matrix4 | NumberArray16>[];
  pointViewProjectionMatrices: readonly Readonly<Matrix4 | NumberArray16>[];
  directionalShadowTexture: Texture;
  spotShadowTexture: Texture;
  pointShadowTexture: Texture;
  comparisonSampler: Sampler;
  nonFilteringSampler: Sampler;
};

type ResolvedShadowMapRendererProps = Required<ShadowMapRendererProps> & {
  cascadeCount: number;
  blockerSampleCount: number;
  filterSampleCount: number;
};

type ShadowMapResources = {
  directionalTexture: Texture;
  spotTexture: Texture;
  pointTexture: Texture;
  comparisonSampler: Sampler;
  nonFilteringSampler: Sampler;
  directionalFramebuffers: Framebuffer[];
  spotFramebuffers: Framebuffer[];
  pointFramebuffers: Framebuffer[];
  attachmentViews: TextureView[];
};

type ComputedShadowView = {
  camera: ShadowCamera;
  viewProjectionMatrix: Matrix4;
};

const POINT_FACE_ORIENTATIONS: ReadonlyArray<{
  face: PointShadowFace;
  direction: NumberArray3;
  up: NumberArray3;
}> = [
  {face: '+X', direction: [1, 0, 0], up: [0, -1, 0]},
  {face: '-X', direction: [-1, 0, 0], up: [0, -1, 0]},
  {face: '+Y', direction: [0, 1, 0], up: [0, 0, 1]},
  {face: '-Y', direction: [0, -1, 0], up: [0, 0, -1]},
  {face: '+Z', direction: [0, 0, 1], up: [0, -1, 0]},
  {face: '-Z', direction: [0, 0, -1], up: [0, -1, 0]}
];

let nextShadowResourceId = 0;

/**
 * Owns WebGPU depth-array resources and records application-supplied shadow caster draws.
 *
 * The renderer never submits the device command encoder. Applications should pre-create any
 * per-view uniform storage needed by `drawShadowCasters`; one shared mutable uniform buffer cannot
 * retain different matrices for several passes recorded into the same command buffer.
 */
export class ShadowMapRenderer {
  readonly device: Device;
  props: ResolvedShadowMapRendererProps;

  private inputProps: ShadowMapRendererProps;
  private resources: ShadowMapResources;
  private destroyed = false;

  constructor(device: Device, props: ShadowMapRendererProps = {}) {
    if (device.type !== 'webgpu') {
      throw new Error('ShadowMapRenderer requires a WebGPU device.');
    }
    this.device = device;
    this.inputProps = {...props};
    this.props = resolveShadowMapRendererProps(device, this.inputProps);
    this.resources = createShadowMapResources(device, this.props);
  }

  /** Reconfigures capacities or quality, rebuilding GPU resources only when their shape changes. */
  setProps(props: ShadowMapRendererProps): void {
    this.assertNotDestroyed();
    const nextInputProps = {...this.inputProps, ...props};
    const nextProps = resolveShadowMapRendererProps(this.device, nextInputProps);
    const needsResourceRebuild = !resourcePropsEqual(this.props, nextProps);
    this.inputProps = nextInputProps;
    this.props = nextProps;
    if (!needsResourceRebuild) {
      return;
    }
    const previousResources = this.resources;
    this.resources = createShadowMapResources(this.device, nextProps);
    destroyShadowMapResources(previousResources);
  }

  /** Records all active shadow-map views and returns props ready for `ShaderInputs.setProps`. */
  render(options: ShadowRenderOptions): ShadowShaderProps {
    this.assertNotDestroyed();
    validateShadowCamera(options.camera);
    const directionalLights = options.directionalLights || [];
    const spotLights = options.spotLights || [];
    const pointLights = options.pointLights || [];
    validateLightCount(
      'directional',
      directionalLights.length,
      this.props.directionalLightCapacity
    );
    validateLightCount('spot', spotLights.length, this.props.spotLightCapacity);
    validateLightCount('point', pointLights.length, this.props.pointLightCapacity);

    const directionalViews: ComputedShadowView[] = [];
    let cascadeSplits = padCascadeSplits([], options.camera.far);
    if (directionalLights[0]) {
      const light = resolveDirectionalLight(directionalLights[0], options.camera);
      cascadeSplits = padCascadeSplits(
        getPracticalCascadeSplits(
          options.camera.near,
          light.shadowDistance,
          this.props.cascadeCount,
          light.cascadeSplitLambda
        ),
        light.shadowDistance
      );
      directionalViews.push(
        ...getDirectionalCascadeViews(
          options.camera,
          light,
          cascadeSplits,
          this.props.cascadeCount,
          this.props.directionalMapSize
        )
      );
      directionalViews.forEach((view, cascadeIndex) => {
        this.renderView({
          framebuffer: this.resources.directionalFramebuffers[cascadeIndex],
          view,
          type: 'directional',
          lightIndex: 0,
          cascadeIndex,
          mapSize: this.props.directionalMapSize,
          light,
          drawShadowCasters: options.drawShadowCasters
        });
      });
    }

    const spotViews = spotLights.map(light => getSpotShadowView(resolveSpotLight(light)));
    spotViews.forEach((view, lightIndex) => {
      this.renderView({
        framebuffer: this.resources.spotFramebuffers[lightIndex],
        view,
        type: 'spot',
        lightIndex,
        mapSize: this.props.spotMapSize,
        light: resolveSpotLight(spotLights[lightIndex]),
        drawShadowCasters: options.drawShadowCasters
      });
    });

    const pointViews = pointLights.flatMap(light => getPointShadowViews(resolvePointLight(light)));
    pointLights.forEach((inputLight, lightIndex) => {
      const light = resolvePointLight(inputLight);
      for (let faceIndex = 0; faceIndex < POINT_FACE_COUNT; faceIndex++) {
        const viewIndex = lightIndex * POINT_FACE_COUNT + faceIndex;
        this.renderView({
          framebuffer: this.resources.pointFramebuffers[viewIndex],
          view: pointViews[viewIndex],
          type: 'point',
          lightIndex,
          pointFace: POINT_FACE_ORIENTATIONS[faceIndex].face,
          mapSize: this.props.pointMapSize,
          light,
          drawShadowCasters: options.drawShadowCasters
        });
      }
    });

    return {
      quality: this.props.quality,
      cascadeCount: this.props.cascadeCount,
      cascadeSplits,
      blockerSampleCount: this.props.blockerSampleCount,
      filterSampleCount: this.props.filterSampleCount,
      directionalLights: directionalLights.map(light =>
        resolveDirectionalLight(light, options.camera)
      ),
      spotLights: spotLights.map(resolveSpotLight),
      pointLights: pointLights.map(resolvePointLight),
      directionalViewProjectionMatrices: padMatrices(
        directionalViews.map(view => view.viewProjectionMatrix),
        MAX_CASCADES
      ),
      spotViewProjectionMatrices: padMatrices(
        spotViews.map(view => view.viewProjectionMatrix),
        MAX_SPOT_LIGHTS
      ),
      pointViewProjectionMatrices: padMatrices(
        pointViews.map(view => view.viewProjectionMatrix),
        MAX_POINT_LIGHTS * POINT_FACE_COUNT
      ),
      directionalShadowTexture: this.resources.directionalTexture,
      spotShadowTexture: this.resources.spotTexture,
      pointShadowTexture: this.resources.pointTexture,
      comparisonSampler: this.resources.comparisonSampler,
      nonFilteringSampler: this.resources.nonFilteringSampler
    };
  }

  /** Destroys all owned depth textures, views, framebuffers and samplers. */
  destroy(): void {
    if (this.destroyed) {
      return;
    }
    this.destroyed = true;
    destroyShadowMapResources(this.resources);
  }

  private renderView(options: {
    framebuffer: Framebuffer;
    view: ComputedShadowView;
    type: ShadowRenderView['type'];
    lightIndex: number;
    cascadeIndex?: number;
    pointFace?: PointShadowFace;
    mapSize: number;
    light: ShadowBiasProps;
    drawShadowCasters: ShadowRenderOptions['drawShadowCasters'];
  }): void {
    const rasterParameters = Object.freeze({
      depthWriteEnabled: true,
      depthCompare: 'less-equal',
      depthBias: options.light.depthBias,
      depthBiasSlopeScale: options.light.depthBiasSlopeScale,
      cullMode: 'back'
    } satisfies RenderPipelineParameters);
    const renderPass = this.device.beginRenderPass({
      id: makeShadowResourceId(`${options.type}-shadow-pass`),
      framebuffer: options.framebuffer,
      clearDepth: 1
    });
    try {
      options.drawShadowCasters({
        renderPass,
        type: options.type,
        lightIndex: options.lightIndex,
        cascadeIndex: options.cascadeIndex,
        pointFace: options.pointFace,
        camera: options.view.camera,
        viewProjectionMatrix: options.view.viewProjectionMatrix,
        mapSize: options.mapSize,
        rasterParameters
      });
    } finally {
      renderPass.end();
    }
  }

  private assertNotDestroyed(): void {
    if (this.destroyed) {
      throw new Error('ShadowMapRenderer has been destroyed.');
    }
  }
}

/** Returns logarithmic/uniform blended cascade far distances. */
export function getPracticalCascadeSplits(
  near: number,
  far: number,
  cascadeCount: number,
  lambda = 0.5
): number[] {
  if (!(near > 0 && far > near)) {
    throw new Error('Cascade split range requires 0 < near < far.');
  }
  if (!Number.isInteger(cascadeCount) || cascadeCount < 1 || cascadeCount > MAX_CASCADES) {
    throw new Error(`Cascade count must be an integer from 1 to ${MAX_CASCADES}.`);
  }
  const clampedLambda = clamp(lambda, 0, 1);
  const splits: number[] = [];
  for (let splitIndex = 1; splitIndex <= cascadeCount; splitIndex++) {
    const fraction = splitIndex / cascadeCount;
    const logarithmic = near * Math.pow(far / near, fraction);
    const uniform = near + (far - near) * fraction;
    splits.push(uniform * (1 - clampedLambda) + logarithmic * clampedLambda);
  }
  return splits;
}

/** Computes texel-snapped orthographic cascade cameras for a directional light. */
export function getDirectionalCascadeViews(
  camera: ShadowCamera,
  light: Required<DirectionalShadowLight>,
  cascadeSplits: readonly number[],
  cascadeCount: number,
  mapSize: number
): ComputedShadowView[] {
  const inverseViewProjection = new Matrix4(camera.projectionMatrix)
    .multiplyRight(camera.viewMatrix)
    .invert();
  const nearCorners = getNdcPlaneCorners(inverseViewProjection, 0);
  const farCorners = getNdcPlaneCorners(inverseViewProjection, 1);
  const lightDirection = normalize3(light.direction);
  const views: ComputedShadowView[] = [];
  let cascadeNear = camera.near;

  for (let cascadeIndex = 0; cascadeIndex < cascadeCount; cascadeIndex++) {
    const cascadeFar = cascadeSplits[cascadeIndex];
    const nearFraction = (cascadeNear - camera.near) / (camera.far - camera.near);
    const farFraction = (cascadeFar - camera.near) / (camera.far - camera.near);
    const corners: NumberArray3[] = [];
    for (let cornerIndex = 0; cornerIndex < 4; cornerIndex++) {
      corners.push(lerp3(nearCorners[cornerIndex], farCorners[cornerIndex], nearFraction));
      corners.push(lerp3(nearCorners[cornerIndex], farCorners[cornerIndex], farFraction));
    }
    const center = average3(corners);
    let radius = 0;
    for (const corner of corners) {
      radius = Math.max(radius, distance3(center, corner));
    }
    radius = Math.ceil(radius * 16) / 16;
    const texelWorldSize = (radius * 2) / mapSize;
    const lightForward = scale3(lightDirection, -1);
    const referenceUp: NumberArray3 = Math.abs(lightForward[1]) > 0.99 ? [0, 0, 1] : [0, 1, 0];
    const lightRight = normalize3(cross3(lightForward, referenceUp));
    const lightUp = normalize3(cross3(lightRight, lightForward));
    const centerRight = dot3(center, lightRight);
    const centerUp = dot3(center, lightUp);
    const snappedCenter = add3(
      center,
      add3(
        scale3(lightRight, Math.round(centerRight / texelWorldSize) * texelWorldSize - centerRight),
        scale3(lightUp, Math.round(centerUp / texelWorldSize) * texelWorldSize - centerUp)
      )
    );
    const eye = add3(snappedCenter, scale3(lightDirection, radius + light.casterDistance));
    const viewMatrix = new Matrix4().lookAt({eye, center: snappedCenter, up: lightUp});
    const projectionMatrix = new Matrix4().ortho({
      left: -radius,
      right: radius,
      bottom: -radius,
      top: radius,
      near: 0.01,
      far: radius * 2 + light.casterDistance
    });
    views.push({
      camera: {viewMatrix, projectionMatrix, near: 0.01, far: radius * 2 + light.casterDistance},
      viewProjectionMatrix: new Matrix4(projectionMatrix).multiplyRight(viewMatrix)
    });
    cascadeNear = cascadeFar;
  }
  return views;
}

/** Computes a perspective camera for one spot shadow map. */
export function getSpotShadowView(light: Required<SpotShadowLight>): ComputedShadowView {
  const direction = normalize3(light.direction);
  const up: NumberArray3 = Math.abs(direction[1]) > 0.99 ? [0, 0, 1] : [0, 1, 0];
  const viewMatrix = new Matrix4().lookAt({
    eye: light.position,
    center: add3(light.position, direction),
    up
  });
  const projectionMatrix = new Matrix4().perspective({
    fovy: light.outerConeAngle * 2,
    aspect: 1,
    near: light.nearPlane,
    far: light.range
  });
  return {
    camera: {viewMatrix, projectionMatrix, near: light.nearPlane, far: light.range},
    viewProjectionMatrix: new Matrix4(projectionMatrix).multiplyRight(viewMatrix)
  };
}

/** Computes the six canonical cameras used by one cube-array point shadow. */
export function getPointShadowViews(light: Required<PointShadowLight>): ComputedShadowView[] {
  const projectionMatrix = new Matrix4().perspective({
    fovy: radians(90),
    aspect: 1,
    near: light.nearPlane,
    far: light.range
  });
  return POINT_FACE_ORIENTATIONS.map(orientation => {
    const viewMatrix = new Matrix4().lookAt({
      eye: light.position,
      center: add3(light.position, orientation.direction),
      up: orientation.up
    });
    return {
      camera: {viewMatrix, projectionMatrix, near: light.nearPlane, far: light.range},
      viewProjectionMatrix: new Matrix4(projectionMatrix).multiplyRight(viewMatrix)
    };
  });
}

function resolveShadowMapRendererProps(
  device: Device,
  props: ShadowMapRendererProps
): ResolvedShadowMapRendererProps {
  const quality = props.quality || 'balanced';
  const qualitySettings = SHADOW_QUALITY_SETTINGS[quality];
  if (!qualitySettings) {
    throw new Error(`Unknown shadow quality: ${String(quality)}.`);
  }
  const resolved = {
    quality,
    directionalLightCapacity: props.directionalLightCapacity ?? 1,
    spotLightCapacity: props.spotLightCapacity ?? 1,
    pointLightCapacity: props.pointLightCapacity ?? 1,
    directionalMapSize: props.directionalMapSize ?? qualitySettings.directionalMapSize,
    spotMapSize: props.spotMapSize ?? qualitySettings.spotMapSize,
    pointMapSize: props.pointMapSize ?? qualitySettings.pointMapSize,
    cascadeCount: qualitySettings.cascadeCount,
    blockerSampleCount: qualitySettings.blockerSampleCount,
    filterSampleCount: qualitySettings.filterSampleCount
  };
  validateCapacity(
    'directionalLightCapacity',
    resolved.directionalLightCapacity,
    MAX_DIRECTIONAL_LIGHTS
  );
  validateCapacity('spotLightCapacity', resolved.spotLightCapacity, MAX_SPOT_LIGHTS);
  validateCapacity('pointLightCapacity', resolved.pointLightCapacity, MAX_POINT_LIGHTS);
  validateMapSize(device, 'directionalMapSize', resolved.directionalMapSize);
  validateMapSize(device, 'spotMapSize', resolved.spotMapSize);
  validateMapSize(device, 'pointMapSize', resolved.pointMapSize);
  const pointLayers = Math.max(POINT_FACE_COUNT, resolved.pointLightCapacity * POINT_FACE_COUNT);
  if (pointLayers > device.limits.maxTextureArrayLayers) {
    throw new Error(
      `pointLightCapacity requires ${pointLayers} array layers, exceeding the device limit ${device.limits.maxTextureArrayLayers}.`
    );
  }
  return resolved;
}

function createShadowMapResources(
  device: Device,
  props: ResolvedShadowMapRendererProps
): ShadowMapResources {
  const directionalLayers = Math.max(1, props.directionalLightCapacity * props.cascadeCount);
  const spotLayers = Math.max(1, props.spotLightCapacity);
  const pointLayers = Math.max(POINT_FACE_COUNT, props.pointLightCapacity * POINT_FACE_COUNT);
  const comparisonSampler = device.createSampler({
    id: makeShadowResourceId('shadow-comparison-sampler'),
    type: 'comparison-sampler',
    compare: 'less-equal',
    minFilter: 'linear',
    magFilter: 'linear',
    addressModeU: 'clamp-to-edge',
    addressModeV: 'clamp-to-edge',
    addressModeW: 'clamp-to-edge'
  });
  const nonFilteringSampler = device.createSampler({
    id: makeShadowResourceId('shadow-depth-sampler'),
    minFilter: 'nearest',
    magFilter: 'nearest',
    addressModeU: 'clamp-to-edge',
    addressModeV: 'clamp-to-edge',
    addressModeW: 'clamp-to-edge'
  });
  const directionalTexture = createDepthArrayTexture(
    device,
    'directional-shadow-map',
    '2d-array',
    props.directionalMapSize,
    directionalLayers,
    nonFilteringSampler
  );
  const spotTexture = createDepthArrayTexture(
    device,
    'spot-shadow-map',
    '2d-array',
    props.spotMapSize,
    spotLayers,
    nonFilteringSampler
  );
  const pointTexture = createDepthArrayTexture(
    device,
    'point-shadow-map',
    'cube-array',
    props.pointMapSize,
    pointLayers,
    nonFilteringSampler
  );
  const attachmentViews: TextureView[] = [];
  const directionalFramebuffers = createLayerFramebuffers(
    device,
    directionalTexture,
    props.directionalMapSize,
    directionalLayers,
    attachmentViews
  );
  const spotFramebuffers = createLayerFramebuffers(
    device,
    spotTexture,
    props.spotMapSize,
    spotLayers,
    attachmentViews
  );
  const pointFramebuffers = createLayerFramebuffers(
    device,
    pointTexture,
    props.pointMapSize,
    pointLayers,
    attachmentViews
  );
  return {
    directionalTexture,
    spotTexture,
    pointTexture,
    comparisonSampler,
    nonFilteringSampler,
    directionalFramebuffers,
    spotFramebuffers,
    pointFramebuffers,
    attachmentViews
  };
}

function createDepthArrayTexture(
  device: Device,
  id: string,
  dimension: '2d-array' | 'cube-array',
  size: number,
  depth: number,
  sampler: Sampler
): Texture {
  return device.createTexture({
    id: makeShadowResourceId(id),
    dimension,
    format: 'depth32float',
    width: size,
    height: size,
    depth,
    sampler,
    usage: TextureResource.SAMPLE | TextureResource.RENDER
  });
}

function createLayerFramebuffers(
  device: Device,
  texture: Texture,
  size: number,
  layerCount: number,
  views: TextureView[]
): Framebuffer[] {
  return Array.from({length: layerCount}, (_, layerIndex) => {
    const view = texture.createView({
      id: makeShadowResourceId('shadow-layer-view'),
      dimension: '2d',
      baseMipLevel: 0,
      mipLevelCount: 1,
      baseArrayLayer: layerIndex,
      arrayLayerCount: 1
    });
    views.push(view);
    return device.createFramebuffer({
      id: makeShadowResourceId('shadow-layer-framebuffer'),
      width: size,
      height: size,
      colorAttachments: [],
      depthStencilAttachment: view
    });
  });
}

function destroyShadowMapResources(resources: ShadowMapResources): void {
  for (const framebuffer of [
    ...resources.directionalFramebuffers,
    ...resources.spotFramebuffers,
    ...resources.pointFramebuffers
  ]) {
    framebuffer.destroy();
  }
  for (const view of resources.attachmentViews) {
    view.destroy();
  }
  resources.directionalTexture.destroy();
  resources.spotTexture.destroy();
  resources.pointTexture.destroy();
  resources.comparisonSampler.destroy();
  resources.nonFilteringSampler.destroy();
}

function resourcePropsEqual(
  first: ResolvedShadowMapRendererProps,
  second: ResolvedShadowMapRendererProps
): boolean {
  return (
    first.cascadeCount === second.cascadeCount &&
    first.directionalLightCapacity === second.directionalLightCapacity &&
    first.spotLightCapacity === second.spotLightCapacity &&
    first.pointLightCapacity === second.pointLightCapacity &&
    first.directionalMapSize === second.directionalMapSize &&
    first.spotMapSize === second.spotMapSize &&
    first.pointMapSize === second.pointMapSize
  );
}

function resolveDirectionalLight(
  light: DirectionalShadowLight,
  camera: ShadowCamera
): Required<DirectionalShadowLight> {
  const shadowDistance = clamp(light.shadowDistance ?? camera.far, camera.near, camera.far);
  return {
    direction: normalize3(light.direction),
    shadowDistance,
    casterDistance: light.casterDistance ?? shadowDistance,
    sourceAngularRadius: light.sourceAngularRadius ?? 0.00465,
    cascadeSplitLambda: light.cascadeSplitLambda ?? 0.5,
    cascadeBlendFraction: light.cascadeBlendFraction ?? 0.1,
    farFadeFraction: light.farFadeFraction ?? 0.1,
    normalBias: light.normalBias ?? 0.04,
    depthBias: light.depthBias ?? 2,
    depthBiasSlopeScale: light.depthBiasSlopeScale ?? 2,
    strength: clamp(light.strength ?? 1, 0, 1)
  };
}

function resolveSpotLight(light: SpotShadowLight): Required<SpotShadowLight> {
  validateRange('Spot shadow', light.range);
  if (!(light.outerConeAngle > 0 && light.outerConeAngle < Math.PI / 2)) {
    throw new Error('Spot shadow outerConeAngle must be between 0 and PI / 2 radians.');
  }
  return {
    position: [...light.position] as NumberArray3,
    direction: normalize3(light.direction),
    range: light.range,
    outerConeAngle: light.outerConeAngle,
    nearPlane: resolveNearPlane(light.nearPlane, light.range),
    sourceRadius: light.sourceRadius ?? 0.2,
    normalBias: light.normalBias ?? 0.025,
    depthBias: light.depthBias ?? 2,
    depthBiasSlopeScale: light.depthBiasSlopeScale ?? 2,
    strength: clamp(light.strength ?? 1, 0, 1)
  };
}

function resolvePointLight(light: PointShadowLight): Required<PointShadowLight> {
  validateRange('Point shadow', light.range);
  return {
    position: [...light.position] as NumberArray3,
    range: light.range,
    nearPlane: resolveNearPlane(light.nearPlane, light.range),
    sourceRadius: light.sourceRadius ?? 0.2,
    normalBias: light.normalBias ?? 0.025,
    depthBias: light.depthBias ?? 2,
    depthBiasSlopeScale: light.depthBiasSlopeScale ?? 2,
    strength: clamp(light.strength ?? 1, 0, 1)
  };
}

function resolveNearPlane(nearPlane: number | undefined, range: number): number {
  const resolvedNearPlane = nearPlane ?? Math.max(DEFAULT_NEAR_PLANE, range / 1000);
  if (!(resolvedNearPlane > 0 && resolvedNearPlane < range)) {
    throw new Error('Shadow nearPlane must be greater than zero and less than range.');
  }
  return resolvedNearPlane;
}

function validateShadowCamera(camera: ShadowCamera): void {
  if (!(camera.near > 0 && camera.far > camera.near)) {
    throw new Error('ShadowCamera requires 0 < near < far.');
  }
}

function validateCapacity(name: string, value: number, maximum: number): void {
  if (!Number.isInteger(value) || value < 0 || value > maximum) {
    throw new Error(`${name} must be an integer from 0 to ${maximum}.`);
  }
}

function validateMapSize(device: Device, name: string, value: number): void {
  if (!Number.isInteger(value) || value < 1 || value > device.limits.maxTextureDimension2D) {
    throw new Error(
      `${name} must be a positive integer no greater than ${device.limits.maxTextureDimension2D}.`
    );
  }
}

function validateLightCount(type: string, count: number, capacity: number): void {
  if (count > capacity) {
    throw new Error(`${type} shadow light count ${count} exceeds configured capacity ${capacity}.`);
  }
}

function validateRange(label: string, range: number): void {
  if (!(range > 0 && Number.isFinite(range))) {
    throw new Error(`${label} range must be a finite positive number.`);
  }
}

function padCascadeSplits(splits: readonly number[], fallback: number): number[] {
  const result = splits.slice(0, MAX_CASCADES);
  while (result.length < MAX_CASCADES) {
    result.push(result[result.length - 1] ?? fallback);
  }
  return result;
}

function padMatrices(
  matrices: readonly Readonly<Matrix4 | NumberArray16>[],
  count: number
): Readonly<Matrix4 | NumberArray16>[] {
  const result = matrices.slice(0, count);
  while (result.length < count) {
    result.push(IDENTITY_MATRIX);
  }
  return result;
}

function getNdcPlaneCorners(matrix: Matrix4, z: number): NumberArray3[] {
  return [
    transformHomogeneous(matrix, [-1, -1, z]),
    transformHomogeneous(matrix, [1, -1, z]),
    transformHomogeneous(matrix, [1, 1, z]),
    transformHomogeneous(matrix, [-1, 1, z])
  ];
}

function transformHomogeneous(matrix: Matrix4, point: NumberArray3): NumberArray3 {
  const x = point[0];
  const y = point[1];
  const z = point[2];
  const w = matrix[3] * x + matrix[7] * y + matrix[11] * z + matrix[15];
  return [
    (matrix[0] * x + matrix[4] * y + matrix[8] * z + matrix[12]) / w,
    (matrix[1] * x + matrix[5] * y + matrix[9] * z + matrix[13]) / w,
    (matrix[2] * x + matrix[6] * y + matrix[10] * z + matrix[14]) / w
  ];
}

function normalize3(vector: Readonly<NumberArray3>): NumberArray3 {
  const length = Math.hypot(vector[0], vector[1], vector[2]);
  if (!(length > 0)) {
    throw new Error('Shadow light direction must be non-zero.');
  }
  return [vector[0] / length, vector[1] / length, vector[2] / length];
}

function add3(first: Readonly<NumberArray3>, second: Readonly<NumberArray3>): NumberArray3 {
  return [first[0] + second[0], first[1] + second[1], first[2] + second[2]];
}

function scale3(vector: Readonly<NumberArray3>, scale: number): NumberArray3 {
  return [vector[0] * scale, vector[1] * scale, vector[2] * scale];
}

function dot3(first: Readonly<NumberArray3>, second: Readonly<NumberArray3>): number {
  return first[0] * second[0] + first[1] * second[1] + first[2] * second[2];
}

function cross3(first: Readonly<NumberArray3>, second: Readonly<NumberArray3>): NumberArray3 {
  return [
    first[1] * second[2] - first[2] * second[1],
    first[2] * second[0] - first[0] * second[2],
    first[0] * second[1] - first[1] * second[0]
  ];
}

function lerp3(
  first: Readonly<NumberArray3>,
  second: Readonly<NumberArray3>,
  t: number
): NumberArray3 {
  return [
    first[0] + (second[0] - first[0]) * t,
    first[1] + (second[1] - first[1]) * t,
    first[2] + (second[2] - first[2]) * t
  ];
}

function average3(vectors: readonly Readonly<NumberArray3>[]): NumberArray3 {
  const sum: NumberArray3 = [0, 0, 0];
  for (const vector of vectors) {
    sum[0] += vector[0];
    sum[1] += vector[1];
    sum[2] += vector[2];
  }
  return scale3(sum, 1 / vectors.length);
}

function distance3(first: Readonly<NumberArray3>, second: Readonly<NumberArray3>): number {
  return Math.hypot(first[0] - second[0], first[1] - second[1], first[2] - second[2]);
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}

function makeShadowResourceId(prefix: string): string {
  nextShadowResourceId += 1;
  return `${prefix}-${nextShadowResourceId}`;
}
