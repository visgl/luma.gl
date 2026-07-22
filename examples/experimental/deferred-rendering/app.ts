// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer, Device, Texture} from '@luma.gl/core';
import type {AnimationProps} from '@luma.gl/engine';
import {
  AnimationLoopTemplate,
  CubeGeometry,
  Model,
  ShaderInputs,
  ShaderPassRenderer,
  SphereGeometry
} from '@luma.gl/engine';
import {
  createBloomShaderPassPipeline,
  createClusteredVolumetricLightingShaderPassPipeline,
  createGTAOShaderPassPipeline,
  createHDRAutoExposureShaderPassPipeline,
  createSSGIShaderPassPipeline,
  createSSRShaderPassPipeline
} from '@luma.gl/effects';
import {
  ClusteredLightGrid,
  createClusteredDeferredLightingShaderPassPipeline,
  GBuffer,
  makeDeferredPointLightBufferData,
  MAX_CLUSTERED_POINT_LIGHTS,
  OrbitControls,
  type DeferredPointLight
} from '@luma.gl/experimental';
import type {ShaderModule, ShaderPass, ShaderPassPipeline} from '@luma.gl/shadertools';
import {Matrix4, radians, type NumberArray3} from '@math.gl/core';
import {
  type Panel,
  type SettingsChangeDescriptor,
  type SettingsSchema
} from '@deck.gl-community/panels';
import {
  ExamplePanelManager,
  ExampleSettingsPanelManager,
  makeExamplePanelHostHtml,
  makeExampleTabbedPanel,
  makeHtmlCustomPanel
} from '../../example-panels';

const NEAR_PLANE = 0.1;
const FAR_PLANE = 100;
const GRID_SIZE = 7;
const MAX_EXAMPLE_POINT_LIGHTS = MAX_CLUSTERED_POINT_LIGHTS;
const LIGHT_COLORS: readonly NumberArray3[] = [
  [1, 0.18, 0.08],
  [0.18, 0.55, 1],
  [1, 0.36, 0.04],
  [0.2, 1, 0.7],
  [0.82, 0.2, 1],
  [1, 0.78, 0.18]
];

type DebugView =
  | 'Final'
  | 'Base Color'
  | 'Normals'
  | 'Roughness'
  | 'Metallic'
  | 'Emissive'
  | 'Depth'
  | 'Cluster Occupancy'
  | 'Ambient Occlusion'
  | 'Indirect Lighting'
  | 'Bounce Confidence'
  | 'Reflections'
  | 'Reflection Confidence'
  | 'Volumetric Lighting'
  | 'Volume Transmittance'
  | 'God Rays'
  | 'HDR Luminance';

type DeferredRenderingSettings = {
  debugView: DebugView;
  pointLightCount: number;
  animate: boolean;
  autoOrbitCamera: boolean;
  exposure: number;
  autoExposureEnabled: boolean;
  exposureKeyValue: number;
  minimumExposure: number;
  maximumExposure: number;
  exposureBrightenSpeed: number;
  exposureDarkenSpeed: number;
  bloomEnabled: boolean;
  bloomThreshold: number;
  bloomIntensity: number;
  bloomRadius: number;
  bloomResolution: number;
  sunIntensity: number;
  ambientOcclusionEnabled: boolean;
  ambientOcclusionRadius: number;
  ambientOcclusionIntensity: number;
  ambientOcclusionStrength: number;
  ambientOcclusionResolution: number;
  globalIlluminationEnabled: boolean;
  globalIlluminationRadius: number;
  globalIlluminationIntensity: number;
  globalIlluminationStrength: number;
  globalIlluminationRayCount: number;
  globalIlluminationStepCount: number;
  globalIlluminationHistoryWeight: number;
  globalIlluminationResolution: number;
  reflectionEnabled: boolean;
  reflectionStrength: number;
  reflectionIntensity: number;
  reflectionMaxDistance: number;
  reflectionSampleCount: number;
  reflectionHistoryWeight: number;
  reflectionResolution: number;
  atmosphereEnabled: boolean;
  atmosphereDensity: number;
  atmosphereHeightFalloff: number;
  atmosphereAnisotropy: number;
  atmospherePointLightIntensity: number;
  atmosphereSunIntensity: number;
  atmosphereStrength: number;
  atmosphereSampleCount: number;
  atmosphereHistoryWeight: number;
  atmosphereShadowStrength: number;
  atmosphereResolution: number;
  godRaysEnabled: boolean;
  godRayIntensity: number;
  godRayDensity: number;
  godRayDecay: number;
  godRaySampleCount: number;
  godRayPositionX: number;
  godRayPositionY: number;
};

const DEFAULT_SETTINGS: DeferredRenderingSettings = {
  debugView: 'Final',
  pointLightCount: 256,
  animate: true,
  autoOrbitCamera: true,
  exposure: 1.15,
  autoExposureEnabled: true,
  exposureKeyValue: 0.48,
  minimumExposure: 0.45,
  maximumExposure: 2.4,
  exposureBrightenSpeed: 1.6,
  exposureDarkenSpeed: 2.8,
  bloomEnabled: true,
  bloomThreshold: 0.78,
  bloomIntensity: 0.34,
  bloomRadius: 8,
  bloomResolution: 1,
  sunIntensity: 2.8,
  ambientOcclusionEnabled: true,
  ambientOcclusionRadius: 2.2,
  ambientOcclusionIntensity: 3.2,
  ambientOcclusionStrength: 0.68,
  ambientOcclusionResolution: 1,
  globalIlluminationEnabled: true,
  globalIlluminationRadius: 5.2,
  globalIlluminationIntensity: 3.4,
  globalIlluminationStrength: 1.35,
  globalIlluminationRayCount: 8,
  globalIlluminationStepCount: 9,
  globalIlluminationHistoryWeight: 0.88,
  globalIlluminationResolution: 1,
  reflectionEnabled: true,
  reflectionStrength: 1.15,
  reflectionIntensity: 1.8,
  reflectionMaxDistance: 26,
  reflectionSampleCount: 56,
  reflectionHistoryWeight: 0.84,
  reflectionResolution: 1,
  atmosphereEnabled: true,
  atmosphereDensity: 0.055,
  atmosphereHeightFalloff: 0.28,
  atmosphereAnisotropy: 0.46,
  atmospherePointLightIntensity: 1.65,
  atmosphereSunIntensity: 1.1,
  atmosphereStrength: 0.82,
  atmosphereSampleCount: 10,
  atmosphereHistoryWeight: 0.88,
  atmosphereShadowStrength: 0.76,
  atmosphereResolution: 1,
  godRaysEnabled: true,
  godRayIntensity: 1.65,
  godRayDensity: 0.94,
  godRayDecay: 0.96,
  godRaySampleCount: 18,
  godRayPositionX: 0.72,
  godRayPositionY: 0.16
};

const DEFERRED_RENDERING_BACKGROUND_HTML = `
<p><b>Why deferred rendering scales:</b> forward shading repeats material work for every light that touches every draw. Here the geometry pass writes base color, metalness, roughness, emissive, normal, velocity, and depth once; the fullscreen resolve reuses those screen-space values for lighting.</p>
<p><b>Illumination Lab vs. Visualization City:</b> this example concentrates on advanced deferred light transport: compute-clustered point lights, physically based material response, higher-quality GTAO, colored diffuse bounce, shared screen-space reflections, and clustered participating media. <b>Visualization City</b> instead emphasizes breadth, with directional/spot/point shadow maps, contact shadows, lower-cost SSAO, simple fog, outlines, temporal AA, and motion blur. Both reuse the same SSR implementation.</p>
<p><b>Why clustering wins:</b> a WebGPU compute stage projects each view-space light sphere into a <code>16 × 9 × 24</code> screen/log-depth grid. Each pixel reconstructs its view position from depth, finds one cluster, and normally evaluates only that short local list instead of all 512 lights.</p>
<p><b>Why GTAO belongs after lighting:</b> a configurable-resolution horizon search reuses the same depth and view normals to estimate ambient visibility around contacts. G-buffer velocity reprojects the previous AO result, depth rejects disocclusions, and a depth-aware blur removes remaining noise before the AO is composed into lit color.</p>
<p><b>Where colored bounce comes from:</b> cosine-weighted hemisphere rays gather already-lit radiance from nearby visible surfaces. Cyan, magenta, and amber emitter panels transfer their color onto neighboring walls, floors, and matte materials; velocity, linear-depth rejection, and bilateral filtering stabilize the diffuse bounce.</p>
<p><b>Where the reflections come from:</b> stochastic screen-space rays bounce from the same view normals into already-lit scene color. Rough surfaces widen the reflection cone; velocity and depth history stabilize animated highlights, while depth/normal-aware denoising preserves sharp mirrors and produces soft glossy lobes.</p>
<p><b>Why light becomes visible in the air:</b> configurable-resolution view rays integrate exponential height fog, Beer-Lambert extinction, anisotropic directional scattering, and the same compute-clustered point lights used by the opaque resolve. Radial camera-depth visibility traces toward the sun to reveal crepuscular god rays behind occluders; velocity and depth history stabilize the colored light volumes.</p>
<p><b>Why the highlights feel cinematic:</b> a GPU-resident logarithmic luminance pyramid meters the scene without CPU readback, while persistent exposure history adapts at separate brightening and darkening rates. A half/quarter/eighth-resolution HDR bloom pyramid spreads emissive and specular energy before the final ACES-style tone map.</p>
<p><b>Work changes shape:</b> the expensive path becomes roughly geometry + visible pixels × lights in the local cluster, instead of objects × every light. The same G-buffer also feeds GTAO, diffuse global illumination, SSR, fog, outline, temporal, and motion effects without redrawing material geometry.</p>
<p><b>Correctness at the limit:</b> candidate bits are compacted in stable light-index order. If a cluster exceeds its retained list, that pixel falls back to the active light prefix rather than showing tile-shaped truncation; <b>Cluster Occupancy</b>, <b>Indirect Lighting</b>, <b>Bounce Confidence</b>, <b>Reflections</b>, <b>Volumetric Lighting</b>, <b>Volume Transmittance</b>, and <b>God Rays</b> reveal where transport work, uncertain screen-space hits, atmospheric extinction, or directional light shafts accumulate.</p>
`;

type DeferredSurfaceUniforms = {
  viewProjectionMatrix: Matrix4;
  previousViewProjectionMatrix: Matrix4;
  viewMatrix: Matrix4;
};

const deferredSurfaceUniforms: ShaderModule<DeferredSurfaceUniforms> = {
  name: 'deferredSurface',
  uniformTypes: {
    viewProjectionMatrix: 'mat4x4<f32>',
    previousViewProjectionMatrix: 'mat4x4<f32>',
    viewMatrix: 'mat4x4<f32>'
  }
};

const DEFERRED_SURFACE_SHADER = /* wgsl */ `\
struct DeferredSurfaceUniforms {
  viewProjectionMatrix: mat4x4f,
  previousViewProjectionMatrix: mat4x4f,
  viewMatrix: mat4x4f,
};
@group(0) @binding(auto) var<uniform> deferredSurface: DeferredSurfaceUniforms;

struct VertexInputs {
  @location(0) positions: vec3f,
  @location(1) normals: vec3f,
  @location(2) instancePositions: vec3f,
  @location(3) instanceScales: vec3f,
  @location(4) instanceBaseColors: vec4f,
  @location(5) instanceMaterials: vec2f,
  @location(6) instanceEmissiveColors: vec3f,
};

struct FragmentInputs {
  @builtin(position) position: vec4f,
  @location(0) viewNormal: vec3f,
  @location(1) baseColorMetallic: vec4f,
  @location(2) roughness: f32,
  @location(3) emissive: vec3f,
  @location(4) currentClip: vec4f,
  @location(5) previousClip: vec4f,
};

struct FragmentOutputs {
  @location(0) color: vec4f,
  @location(1) normalRoughness: vec4f,
  @location(2) velocity: vec2f,
  @location(3) baseColorMetallic: vec4f,
  @location(4) emissiveOcclusion: vec4u,
};

@vertex
fn vertexMain(inputs: VertexInputs) -> FragmentInputs {
  let worldPosition = inputs.positions * inputs.instanceScales + inputs.instancePositions;
  let worldNormal = normalize(inputs.normals / max(inputs.instanceScales, vec3f(0.0001)));
  let currentClip = deferredSurface.viewProjectionMatrix * vec4f(worldPosition, 1.0);
  let previousClip = deferredSurface.previousViewProjectionMatrix * vec4f(worldPosition, 1.0);

  var outputs: FragmentInputs;
  outputs.position = currentClip;
  outputs.viewNormal = normalize((deferredSurface.viewMatrix * vec4f(worldNormal, 0.0)).xyz);
  outputs.baseColorMetallic = vec4f(inputs.instanceBaseColors.rgb, inputs.instanceMaterials.y);
  outputs.roughness = inputs.instanceMaterials.x;
  outputs.emissive = inputs.instanceEmissiveColors;
  outputs.currentClip = currentClip;
  outputs.previousClip = previousClip;
  return outputs;
}

@fragment
fn fragmentMain(inputs: FragmentInputs) -> FragmentOutputs {
  let currentUv = inputs.currentClip.xy / max(inputs.currentClip.w, 0.00001) * vec2f(0.5, -0.5) + 0.5;
  let previousUv = inputs.previousClip.xy / max(inputs.previousClip.w, 0.00001) * vec2f(0.5, -0.5) + 0.5;
  let baseColor = inputs.baseColorMetallic.rgb;

  var outputs: FragmentOutputs;
  outputs.color = vec4f(baseColor * 0.015 + inputs.emissive, 1.0);
  outputs.normalRoughness = vec4f(normalize(inputs.viewNormal) * 0.5 + 0.5, clamp(inputs.roughness, 0.045, 1.0));
  outputs.velocity = currentUv - previousUv;
  outputs.baseColorMetallic = inputs.baseColorMetallic;
  outputs.emissiveOcclusion = vec4u(
    round(clamp(vec4f(inputs.emissive, 1.0), vec4f(0.0), vec4f(1.0)) * 255.0)
  );
  return outputs;
}`;

type DeferredDisplayUniforms = {
  inverseProjectionMatrix: Matrix4;
  debugMode: number;
  exposure: number;
  clusterCountX: number;
  clusterCountY: number;
  clusterCountZ: number;
  maxLightsPerCluster: number;
  clusterNearPlane: number;
  clusterFarPlane: number;
};

type DeferredDisplayBindings = {
  depthTexture?: Texture;
  normalTexture?: Texture;
  baseColorMetallicTexture?: Texture;
  emissiveOcclusionTexture?: Texture;
  clusterLightCounts?: Buffer;
};

const deferredDisplay = {
  name: 'deferredDisplay',
  source: /* wgsl */ `\
struct DeferredDisplayUniforms {
  inverseProjectionMatrix: mat4x4f,
  debugMode: f32,
  exposure: f32,
  clusterCountX: u32,
  clusterCountY: u32,
  clusterCountZ: u32,
  maxLightsPerCluster: u32,
  clusterNearPlane: f32,
  clusterFarPlane: f32,
};
@group(0) @binding(auto) var<uniform> deferredDisplay: DeferredDisplayUniforms;
@group(0) @binding(auto) var depthTexture: texture_depth_2d;
@group(0) @binding(auto) var depthTextureSampler: sampler;
@group(0) @binding(auto) var normalTexture: texture_2d<f32>;
@group(0) @binding(auto) var normalTextureSampler: sampler;
@group(0) @binding(auto) var baseColorMetallicTexture: texture_2d<f32>;
@group(0) @binding(auto) var baseColorMetallicTextureSampler: sampler;
@group(0) @binding(auto) var emissiveOcclusionTexture: texture_2d<u32>;
@group(0) @binding(auto) var<storage, read> clusterLightCounts: array<u32>;

fn deferredDisplay_toneMap(color: vec3f) -> vec3f {
  let exposed = max(color * deferredDisplay.exposure, vec3f(0.0));
  let mapped = (exposed * (2.51 * exposed + 0.03)) /
    (exposed * (2.43 * exposed + 0.59) + 0.14);
  return pow(clamp(mapped, vec3f(0.0), vec3f(1.0)), vec3f(1.0 / 2.2));
}

fn deferredDisplay_reconstructViewPosition(uv: vec2f, depth: f32) -> vec3f {
  let clip = vec4f(uv.x * 2.0 - 1.0, 1.0 - uv.y * 2.0, depth, 1.0);
  let viewPosition = deferredDisplay.inverseProjectionMatrix * clip;
  return viewPosition.xyz / max(viewPosition.w, 0.00001);
}

fn deferredDisplay_getClusterIndex(texCoord: vec2f, viewPosition: vec3f) -> u32 {
  let tileX = min(
    u32(clamp(texCoord.x, 0.0, 0.999999) * f32(deferredDisplay.clusterCountX)),
    deferredDisplay.clusterCountX - 1u
  );
  let tileY = min(
    u32(clamp(texCoord.y, 0.0, 0.999999) * f32(deferredDisplay.clusterCountY)),
    deferredDisplay.clusterCountY - 1u
  );
  let viewDepth = clamp(
    -viewPosition.z,
    deferredDisplay.clusterNearPlane,
    deferredDisplay.clusterFarPlane
  );
  let normalizedDepth = clamp(
    log(viewDepth / deferredDisplay.clusterNearPlane) /
      log(deferredDisplay.clusterFarPlane / deferredDisplay.clusterNearPlane),
    0.0,
    0.999999
  );
  let depthSlice = min(
    u32(normalizedDepth * f32(deferredDisplay.clusterCountZ)),
    deferredDisplay.clusterCountZ - 1u
  );
  return (depthSlice * deferredDisplay.clusterCountY + tileY) *
    deferredDisplay.clusterCountX + tileX;
}

fn deferredDisplay_heatMap(value: f32) -> vec3f {
  let cold = vec3f(0.04, 0.08, 0.35);
  let warm = vec3f(0.95, 0.18, 0.08);
  let hot = vec3f(1.0, 0.92, 0.22);
  return mix(mix(cold, warm, clamp(value * 2.0, 0.0, 1.0)), hot, clamp(value * 2.0 - 1.0, 0.0, 1.0));
}

fn deferredDisplay_sampleColor(
  sourceTexture: texture_2d<f32>,
  sourceTextureSampler: sampler,
  texSize: vec2f,
  texCoord: vec2f
) -> vec4f {
  if (deferredDisplay.debugMode > 0.5 && deferredDisplay.debugMode < 1.5) {
    return vec4f(textureSampleLevel(baseColorMetallicTexture, baseColorMetallicTextureSampler, texCoord, 0).rgb, 1.0);
  }
  if (deferredDisplay.debugMode > 1.5 && deferredDisplay.debugMode < 2.5) {
    return vec4f(textureSampleLevel(normalTexture, normalTextureSampler, texCoord, 0).rgb, 1.0);
  }
  if (deferredDisplay.debugMode > 2.5 && deferredDisplay.debugMode < 3.5) {
    let roughness = textureSampleLevel(normalTexture, normalTextureSampler, texCoord, 0).a;
    return vec4f(vec3f(roughness), 1.0);
  }
  if (deferredDisplay.debugMode > 3.5 && deferredDisplay.debugMode < 4.5) {
    let metallic = textureSampleLevel(baseColorMetallicTexture, baseColorMetallicTextureSampler, texCoord, 0).a;
    return vec4f(vec3f(metallic), 1.0);
  }
  if (deferredDisplay.debugMode > 4.5 && deferredDisplay.debugMode < 5.5) {
    let emissiveCoordinates = vec2i(
      clamp(texCoord * texSize, vec2f(0.0), texSize - vec2f(1.0))
    );
    let emissive = vec3f(textureLoad(emissiveOcclusionTexture, emissiveCoordinates, 0).rgb) /
      255.0;
    return vec4f(deferredDisplay_toneMap(emissive), 1.0);
  }
  if (deferredDisplay.debugMode > 8.5) {
    let color = textureSampleLevel(sourceTexture, sourceTextureSampler, texCoord, 0).rgb;
    return vec4f(deferredDisplay_toneMap(color), 1.0);
  }
  if (deferredDisplay.debugMode > 7.5) {
    let color = textureSampleLevel(sourceTexture, sourceTextureSampler, texCoord, 0).rgb;
    return vec4f(color, 1.0);
  }
  if (deferredDisplay.debugMode > 5.5) {
    let depth = textureSampleLevel(depthTexture, depthTextureSampler, texCoord, 0);
    if (deferredDisplay.debugMode > 6.5) {
      if (depth >= 0.99999) {
        return vec4f(0.0, 0.0, 0.0, 1.0);
      }
      let viewPosition = deferredDisplay_reconstructViewPosition(texCoord, depth);
      let clusterIndex = deferredDisplay_getClusterIndex(texCoord, viewPosition);
      let occupancy = clamp(
        f32(clusterLightCounts[clusterIndex]) / f32(max(deferredDisplay.maxLightsPerCluster, 1u)),
        0.0,
        1.0
      );
      return vec4f(deferredDisplay_heatMap(occupancy), 1.0);
    }
    return vec4f(vec3f(pow(depth, 24.0)), 1.0);
  }
  let color = textureSampleLevel(sourceTexture, sourceTextureSampler, texCoord, 0).rgb;
  return vec4f(deferredDisplay_toneMap(color), 1.0);
}`,
  bindingLayout: [
    {name: 'depthTexture', group: 0},
    {name: 'normalTexture', group: 0},
    {name: 'baseColorMetallicTexture', group: 0},
    {name: 'emissiveOcclusionTexture', group: 0},
    {name: 'clusterLightCounts', group: 0}
  ],
  uniforms: {} as DeferredDisplayUniforms,
  bindings: {} as DeferredDisplayBindings,
  uniformTypes: {
    inverseProjectionMatrix: 'mat4x4<f32>',
    debugMode: 'f32',
    exposure: 'f32',
    clusterCountX: 'u32',
    clusterCountY: 'u32',
    clusterCountZ: 'u32',
    maxLightsPerCluster: 'u32',
    clusterNearPlane: 'f32',
    clusterFarPlane: 'f32'
  },
  propTypes: {
    inverseProjectionMatrix: {value: new Matrix4(), private: true},
    debugMode: {value: 0, private: true},
    exposure: {value: DEFAULT_SETTINGS.exposure, min: 0.1, softMax: 3},
    clusterCountX: {value: 16, private: true},
    clusterCountY: {value: 9, private: true},
    clusterCountZ: {value: 24, private: true},
    maxLightsPerCluster: {value: 64, private: true},
    clusterNearPlane: {value: NEAR_PLANE, private: true},
    clusterFarPlane: {value: FAR_PLANE, private: true}
  },
  passes: [{sampler: true}]
} as const satisfies ShaderPass<
  Partial<DeferredDisplayUniforms> & DeferredDisplayBindings,
  DeferredDisplayUniforms,
  DeferredDisplayBindings
>;

const deferredDisplayPipeline: ShaderPassPipeline = {
  name: 'deferredDisplayPipeline',
  steps: [
    {
      shaderPass: deferredDisplay,
      inputs: {sourceTexture: 'previous'},
      output: 'previous'
    }
  ]
};

type SurfaceInstanceData = {
  positions: Float32Array;
  scales: Float32Array;
  baseColors: Float32Array;
  materials: Float32Array;
  emissiveColors: Float32Array;
  instanceCount: number;
};

class InstancedSurfaceModel {
  readonly model: Model;
  readonly positionBuffer: Buffer;
  private readonly buffers: Buffer[];

  constructor(
    device: Device,
    props: {
      id: string;
      geometry: SphereGeometry | CubeGeometry;
      data: SurfaceInstanceData;
    }
  ) {
    const positionBuffer = device.createBuffer({
      id: `${props.id}-positions`,
      data: props.data.positions,
      usage: Buffer.VERTEX | Buffer.COPY_DST
    });
    const scaleBuffer = device.createBuffer(props.data.scales);
    const baseColorBuffer = device.createBuffer(props.data.baseColors);
    const materialBuffer = device.createBuffer(props.data.materials);
    const emissiveColorBuffer = device.createBuffer(props.data.emissiveColors);
    this.positionBuffer = positionBuffer;
    this.buffers = [
      positionBuffer,
      scaleBuffer,
      baseColorBuffer,
      materialBuffer,
      emissiveColorBuffer
    ];
    this.model = new Model(device, {
      id: props.id,
      source: DEFERRED_SURFACE_SHADER,
      geometry: props.geometry,
      instanceCount: props.data.instanceCount,
      shaderInputs: new ShaderInputs({deferredSurface: deferredSurfaceUniforms}),
      bufferLayout: [
        {name: 'instancePositions', format: 'float32x3'},
        {name: 'instanceScales', format: 'float32x3'},
        {name: 'instanceBaseColors', format: 'float32x4'},
        {name: 'instanceMaterials', format: 'float32x2'},
        {name: 'instanceEmissiveColors', format: 'float32x3'}
      ],
      attributes: {
        instancePositions: positionBuffer,
        instanceScales: scaleBuffer,
        instanceBaseColors: baseColorBuffer,
        instanceMaterials: materialBuffer,
        instanceEmissiveColors: emissiveColorBuffer
      },
      colorAttachmentFormats: ['rgba16float', 'rgba8unorm', 'rg16float', 'rgba8unorm', 'rgba8uint'],
      depthStencilAttachmentFormat: 'depth24plus',
      parameters: {depthWriteEnabled: true, depthCompare: 'less-equal', cullMode: 'back'}
    });
  }

  setUniforms(uniforms: DeferredSurfaceUniforms): void {
    this.model.shaderInputs.setProps({deferredSurface: uniforms});
  }

  destroy(): void {
    this.model.destroy();
    for (const buffer of this.buffers) {
      buffer.destroy();
    }
  }
}

/** WebGPU-only illumination laboratory for deferred material and light transport. */
export default class AppAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = makeExamplePanelHostHtml();

  readonly device: Device;
  readonly materialSpheres: InstancedSurfaceModel;
  readonly floor: InstancedSurfaceModel;
  readonly bounceEmitters: InstancedSurfaceModel;
  readonly reflectionFeatures: InstancedSurfaceModel;
  readonly lightMarkers: InstancedSurfaceModel;
  readonly pointLightBuffer: Buffer;
  readonly clusteredLightGrid: ClusteredLightGrid;
  readonly panels: ExamplePanelManager;
  readonly settingsPanel: ExampleSettingsPanelManager;
  orbitControls: OrbitControls | null = null;
  sceneGBuffer: GBuffer;
  renderer: ShaderPassRenderer;
  settings: DeferredRenderingSettings = {...DEFAULT_SETTINGS};
  framebufferSize: [number, number];
  previousViewProjectionMatrix = new Matrix4();
  frameIndex = 0;
  previousFrameTick = 0;

  constructor({device, width, height}: AnimationProps) {
    super();
    this.device = device;
    this.materialSpheres = new InstancedSurfaceModel(device, {
      id: 'deferred-material-spheres',
      geometry: new SphereGeometry({radius: 0.92, nlat: 28, nlong: 40}),
      data: makeMaterialSphereData()
    });
    this.floor = new InstancedSurfaceModel(device, {
      id: 'deferred-material-floor',
      geometry: new CubeGeometry({indices: true}),
      data: makeFloorData()
    });
    this.bounceEmitters = new InstancedSurfaceModel(device, {
      id: 'deferred-bounce-emitters',
      geometry: new CubeGeometry({indices: true}),
      data: makeBounceEmitterData()
    });
    this.reflectionFeatures = new InstancedSurfaceModel(device, {
      id: 'deferred-reflection-features',
      geometry: new CubeGeometry({indices: true}),
      data: makeReflectionFeatureData()
    });
    this.lightMarkers = new InstancedSurfaceModel(device, {
      id: 'deferred-light-markers',
      geometry: new SphereGeometry({radius: 1, nlat: 12, nlong: 18}),
      data: makeLightMarkerData()
    });
    this.pointLightBuffer = device.createBuffer({
      id: 'deferred-point-lights',
      data: makeDeferredPointLightBufferData([], MAX_CLUSTERED_POINT_LIGHTS),
      usage: Buffer.STORAGE | Buffer.COPY_DST
    });
    this.clusteredLightGrid = new ClusteredLightGrid(device, {
      id: 'deferred-clustered-lights',
      maxLightCount: MAX_CLUSTERED_POINT_LIGHTS
    });
    this.sceneGBuffer = createSceneGBuffer(device, width, height);
    this.renderer = createRenderer(device, this.settings);
    this.renderer.resize([width, height]);
    this.framebufferSize = [width, height];
    this.settingsPanel = new ExampleSettingsPanelManager({
      id: 'deferred-rendering-settings',
      schema: makeSettingsSchema(),
      settings: this.settings,
      sectionPresentation: 'accordion',
      onSettingsChange: this.handleSettingsChange
    });
    this.panels = new ExamplePanelManager({panel: this.makePanel()});
    this.panels.mount();
  }

  override async onInitialize({canvas}: AnimationProps): Promise<void> {
    if (canvas instanceof HTMLCanvasElement) {
      this.orbitControls = new OrbitControls(canvas, {
        target: [0, 0.9, 0],
        distance: 20,
        yaw: 0,
        pitch: 0.44,
        minDistance: 6,
        maxDistance: 42,
        minPitch: 0.06,
        maxPitch: 1.38,
        autoRotate: this.settings.autoOrbitCamera,
        autoRotateSpeed: 0.08
      });
    }
  }

  onRender({device, width, height, aspect, tick}: AnimationProps): void {
    if (this.framebufferSize[0] !== width || this.framebufferSize[1] !== height) {
      this.framebufferSize = [width, height];
      this.sceneGBuffer.resize({width, height});
      this.renderer.resize([width, height]);
      this.frameIndex = 0;
    }

    const time = this.settings.animate ? tick / 1000 : 1.8;
    const frameDeltaTime =
      this.frameIndex === 0
        ? 1 / 60
        : Math.min(Math.max((tick - this.previousFrameTick) / 1000, 1 / 240), 0.12);
    this.orbitControls?.update(tick);
    const eye: NumberArray3 = this.orbitControls?.getEyePosition() || [0, 9.5, 18];
    const projectionMatrix = new Matrix4().perspective({
      fovy: radians(47),
      aspect,
      near: NEAR_PLANE,
      far: FAR_PLANE
    });
    const inverseProjectionMatrix = new Matrix4(projectionMatrix).invert();
    const viewMatrix = new Matrix4().lookAt({eye, center: [0, 0.9, 0], up: [0, 1, 0]});
    const inverseViewMatrix = new Matrix4(viewMatrix).invert();
    const viewProjectionMatrix = new Matrix4(projectionMatrix).multiplyRight(viewMatrix);
    if (this.frameIndex === 0) {
      this.previousViewProjectionMatrix = new Matrix4(viewProjectionMatrix);
    }

    const surfaceUniforms = {
      viewProjectionMatrix,
      previousViewProjectionMatrix: this.previousViewProjectionMatrix,
      viewMatrix
    };
    this.materialSpheres.setUniforms(surfaceUniforms);
    this.floor.setUniforms(surfaceUniforms);
    this.bounceEmitters.setUniforms(surfaceUniforms);
    this.reflectionFeatures.setUniforms(surfaceUniforms);
    this.lightMarkers.setUniforms(surfaceUniforms);

    const activeLightCount = Math.min(
      Math.round(this.settings.pointLightCount),
      MAX_EXAMPLE_POINT_LIGHTS
    );
    const lightState = makeAnimatedPointLights(time, activeLightCount, viewMatrix);
    this.pointLightBuffer.write(
      makeDeferredPointLightBufferData(lightState.viewLights, MAX_CLUSTERED_POINT_LIGHTS)
    );
    this.lightMarkers.positionBuffer.write(lightState.markerPositions);
    this.clusteredLightGrid.encode(device.commandEncoder, {
      pointLights: this.pointLightBuffer,
      pointLightCount: activeLightCount,
      projectionMatrix,
      nearPlane: NEAR_PLANE,
      farPlane: FAR_PLANE
    });

    const renderPass = device.beginRenderPass({
      framebuffer: this.sceneGBuffer.framebuffer,
      clearColors: [
        new Float32Array([0.003, 0.005, 0.018, 1]),
        new Float32Array([0.5, 0.5, 1, 1]),
        new Float32Array([0, 0, 0, 0]),
        new Float32Array([0, 0, 0, 0]),
        new Float32Array([0, 0, 0, 0])
      ],
      clearDepth: 1
    });
    this.floor.model.draw(renderPass);
    this.bounceEmitters.model.draw(renderPass);
    this.reflectionFeatures.model.draw(renderPass);
    this.materialSpheres.model.draw(renderPass);
    this.lightMarkers.model.draw(renderPass);
    renderPass.end();

    const normalTexture = this.sceneGBuffer.normalRoughnessTexture;
    const baseColorMetallicTexture = this.sceneGBuffer.getExtraColorTexture('baseColorMetallic');
    const emissiveOcclusionTexture = this.sceneGBuffer.getExtraColorTexture('emissiveOcclusion');
    const directionalLightDirectionView = normalize3(
      viewMatrix.transformAsVector([0.42, 0.82, 0.38]) as NumberArray3
    );
    const clusterUniforms = this.clusteredLightGrid.getShaderPassUniforms(NEAR_PLANE, FAR_PLANE);
    this.renderer.renderToScreen({
      sourceTexture: this.sceneGBuffer.colorTexture,
      bindings: {
        depthTexture: this.sceneGBuffer.depthTexture,
        normalTexture,
        velocityTexture: this.sceneGBuffer.velocityTexture,
        baseColorMetallicTexture,
        emissiveOcclusionTexture,
        pointLights: this.pointLightBuffer,
        ...this.clusteredLightGrid.getShaderPassBindings()
      },
      uniforms: {
        clusteredDeferredLighting: {
          inverseProjectionMatrix,
          ambientColor: [0.028, 0.034, 0.055],
          directionalLightDirectionView,
          directionalLightColor: [1, 0.86, 0.68],
          directionalLightIntensity: this.settings.sunIntensity,
          ...clusterUniforms
        },
        gtaoEvaluate: {
          projectionMatrix,
          inverseProjectionMatrix,
          radius: this.settings.ambientOcclusionRadius,
          intensity: this.settings.ambientOcclusionIntensity,
          frameIndex: this.frameIndex
        },
        gtaoTemporal: {inverseProjectionMatrix},
        gtaoComposite: {
          strength: this.settings.ambientOcclusionEnabled
            ? this.settings.ambientOcclusionStrength
            : 0,
          debugMode: this.settings.debugView === 'Ambient Occlusion' ? 1 : 0
        },
        ssgiTrace: {
          projectionMatrix,
          inverseProjectionMatrix,
          radius: this.settings.globalIlluminationRadius,
          thickness: 0.38,
          intensity:
            this.settings.globalIlluminationEnabled &&
            this.settings.debugView !== 'Ambient Occlusion'
              ? this.settings.globalIlluminationIntensity
              : 0,
          rayCount: this.settings.globalIlluminationRayCount,
          stepCount: this.settings.globalIlluminationStepCount,
          frameIndex: this.frameIndex
        },
        ssgiTemporal: {
          inverseProjectionMatrix,
          historyWeight: this.settings.globalIlluminationHistoryWeight
        },
        ssgiComposite: {
          strength: this.settings.globalIlluminationStrength,
          debugMode:
            this.settings.debugView === 'Indirect Lighting'
              ? 1
              : this.settings.debugView === 'Bounce Confidence'
                ? 2
                : 0
        },
        ssrTrace: {
          projectionMatrix,
          inverseProjectionMatrix,
          intensity:
            this.settings.reflectionEnabled &&
            this.settings.debugView !== 'Ambient Occlusion' &&
            this.settings.debugView !== 'Indirect Lighting' &&
            this.settings.debugView !== 'Bounce Confidence'
              ? this.settings.reflectionIntensity
              : 0,
          maxDistance: this.settings.reflectionMaxDistance,
          thickness: 0.32,
          sampleCount: this.settings.reflectionSampleCount,
          maxRoughness: 0.9,
          frameIndex: this.frameIndex
        },
        ssrTemporal: {
          inverseProjectionMatrix,
          historyWeight: this.settings.reflectionHistoryWeight
        },
        ssrComposite: {
          strength: this.settings.reflectionStrength,
          debugMode:
            this.settings.debugView === 'Reflections'
              ? 1
              : this.settings.debugView === 'Reflection Confidence'
                ? 2
                : 0
        },
        clusteredVolumetricTrace: {
          projectionMatrix,
          inverseProjectionMatrix,
          inverseViewMatrix,
          directionalLightDirectionView,
          directionalLightColor: [1, 0.82, 0.57],
          fogColor: [0.17, 0.29, 0.43],
          density:
            this.settings.atmosphereEnabled &&
            (this.settings.debugView === 'Final' ||
              this.settings.debugView === 'Volumetric Lighting' ||
              this.settings.debugView === 'Volume Transmittance' ||
              this.settings.debugView === 'God Rays')
              ? this.settings.atmosphereDensity
              : 0,
          heightFalloff: this.settings.atmosphereHeightFalloff,
          fogHeight: 0.2,
          anisotropy: this.settings.atmosphereAnisotropy,
          directionalIntensity: this.settings.atmosphereSunIntensity,
          pointLightIntensity:
            this.settings.debugView === 'God Rays'
              ? 0
              : this.settings.atmospherePointLightIntensity,
          godRayPosition: [this.settings.godRayPositionX, this.settings.godRayPositionY],
          godRayIntensity: this.settings.godRaysEnabled ? this.settings.godRayIntensity : 0,
          godRayDensity: this.settings.godRayDensity,
          godRayDecay: this.settings.godRayDecay,
          godRaySampleCount: this.settings.godRaySampleCount,
          maxDistance: 27,
          sampleCount: this.settings.atmosphereSampleCount,
          shadowStrength: this.settings.atmosphereShadowStrength,
          ...clusterUniforms
        },
        clusteredVolumetricTemporal: {
          inverseProjectionMatrix,
          historyWeight: this.settings.atmosphereHistoryWeight
        },
        clusteredVolumetricComposite: {
          strength: this.settings.atmosphereStrength,
          debugMode:
            this.settings.debugView === 'Volumetric Lighting' ||
            this.settings.debugView === 'God Rays'
              ? 1
              : this.settings.debugView === 'Volume Transmittance'
                ? 2
                : 0
        },
        hdrAutoExposureAdapt: {
          keyValue: this.settings.exposureKeyValue,
          minimumExposure: this.settings.minimumExposure,
          maximumExposure: this.settings.maximumExposure,
          brightenSpeed: this.settings.exposureBrightenSpeed,
          darkenSpeed: this.settings.exposureDarkenSpeed,
          deltaTime: frameDeltaTime,
          enabled:
            this.settings.autoExposureEnabled &&
            (this.settings.debugView === 'Final' || this.settings.debugView === 'HDR Luminance')
              ? 1
              : 0
        },
        hdrAutoExposureApply: {
          debugMode: this.settings.debugView === 'HDR Luminance' ? 1 : 0
        },
        bloomExtract: {threshold: this.settings.bloomThreshold},
        bloomBlur: {radius: this.settings.bloomRadius},
        bloomComposite: {
          intensity:
            this.settings.bloomEnabled && this.settings.debugView === 'Final'
              ? this.settings.bloomIntensity
              : 0
        },
        deferredDisplay: {
          inverseProjectionMatrix,
          debugMode: getDebugMode(this.settings.debugView),
          exposure: this.settings.exposure,
          ...clusterUniforms
        }
      }
    });

    this.previousViewProjectionMatrix = new Matrix4(viewProjectionMatrix);
    this.previousFrameTick = tick;
    this.frameIndex++;
  }

  onFinalize(): void {
    this.settingsPanel.finalize();
    this.panels.finalize();
    this.orbitControls?.destroy();
    this.materialSpheres.destroy();
    this.floor.destroy();
    this.bounceEmitters.destroy();
    this.reflectionFeatures.destroy();
    this.lightMarkers.destroy();
    this.pointLightBuffer.destroy();
    this.clusteredLightGrid.destroy();
    this.renderer.destroy();
    this.sceneGBuffer.destroy();
  }

  private makePanel(): Panel {
    return makeExampleTabbedPanel({
      id: 'deferred-rendering-tabs',
      title: 'Deferred Illumination Lab',
      panels: [
        makeHtmlCustomPanel({
          id: 'deferred-rendering-description',
          title: 'Overview',
          html: '<p><b>One geometry pass. Hundreds of lights. A cinematic HDR camera.</b></p><p>Compute-clustered deferred lighting, GTAO, colored screen-space global illumination, shared glossy SSR, anisotropic god rays, GPU-driven eye adaptation, and floating-point bloom all consume one coherent G-buffer.</p><p><b>Why this is different:</b> Illumination Lab goes deeper into physically based materials and advanced light transport. <b>Visualization City</b> is the broader shadow/effect showcase, with cascaded, spot, point, and contact shadows plus SSAO, height fog, outlines, TAA, and motion blur.</p><p>Drag to orbit and switch Debug View to isolate diffuse bounce, reflections, volumetric in-scattering, crepuscular god rays, or HDR luminance.</p>'
        }),
        this.settingsPanel.makePanel(),
        makeHtmlCustomPanel({
          id: 'deferred-rendering-background',
          title: 'Background',
          html: DEFERRED_RENDERING_BACKGROUND_HTML
        })
      ]
    });
  }

  private readonly handleSettingsChange = (
    nextSettings: Record<string, unknown>,
    _changedSettings?: SettingsChangeDescriptor[]
  ): void => {
    const previousSettings = this.settings;
    this.settings = {...this.settings, ...(nextSettings as DeferredRenderingSettings)};
    this.orbitControls?.setAutoRotate(this.settings.autoOrbitCamera);
    if (
      previousSettings.ambientOcclusionResolution !== this.settings.ambientOcclusionResolution ||
      previousSettings.globalIlluminationResolution !==
        this.settings.globalIlluminationResolution ||
      previousSettings.reflectionResolution !== this.settings.reflectionResolution ||
      previousSettings.atmosphereResolution !== this.settings.atmosphereResolution ||
      previousSettings.bloomResolution !== this.settings.bloomResolution ||
      previousSettings.bloomEnabled !== this.settings.bloomEnabled
    ) {
      this.renderer.destroy();
      this.renderer = createRenderer(this.device, this.settings);
      this.renderer.resize(this.framebufferSize);
      this.frameIndex = 0;
    }
  };
}

function createRenderer(device: Device, settings: DeferredRenderingSettings): ShaderPassRenderer {
  return new ShaderPassRenderer(device, {
    shaderPasses: [
      createClusteredDeferredLightingShaderPassPipeline(),
      createGTAOShaderPassPipeline({resolutionScale: settings.ambientOcclusionResolution}),
      createSSGIShaderPassPipeline({resolutionScale: settings.globalIlluminationResolution}),
      createSSRShaderPassPipeline({resolutionScale: settings.reflectionResolution}),
      createClusteredVolumetricLightingShaderPassPipeline({
        resolutionScale: settings.atmosphereResolution
      }),
      createHDRAutoExposureShaderPassPipeline(),
      ...(settings.bloomEnabled
        ? [createBloomShaderPassPipeline({resolutionScale: settings.bloomResolution})]
        : []),
      deferredDisplayPipeline
    ],
    colorFormat: 'rgba16float',
    flipY: true
  });
}

function createSceneGBuffer(device: Device, width: number, height: number): GBuffer {
  return new GBuffer(device, {
    id: 'deferred-rendering-scene',
    width,
    height,
    colorFormat: 'rgba16float',
    normalRoughnessFormat: 'rgba8unorm',
    velocityFormat: 'rg16float',
    depthStencilFormat: 'depth24plus',
    extraColorAttachments: [
      {name: 'baseColorMetallic', format: 'rgba8unorm'},
      {name: 'emissiveOcclusion', format: 'rgba8uint'}
    ]
  });
}

function makeMaterialSphereData(): SurfaceInstanceData {
  const positions: number[] = [];
  const scales: number[] = [];
  const baseColors: number[] = [];
  const materials: number[] = [];
  const emissiveColors: number[] = [];
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let column = 0; column < GRID_SIZE; column++) {
      const roughness = 0.08 + (column / (GRID_SIZE - 1)) * 0.84;
      const metallic = row / (GRID_SIZE - 1);
      const rowColor = getMaterialRowColor(row);
      positions.push((column - (GRID_SIZE - 1) * 0.5) * 2.15, 1.25, (row - 3) * 2.15);
      scales.push(1, 1, 1);
      baseColors.push(rowColor[0], rowColor[1], rowColor[2], 1);
      materials.push(roughness, metallic);
      emissiveColors.push(0, 0, 0);
    }
  }
  return {
    positions: new Float32Array(positions),
    scales: new Float32Array(scales),
    baseColors: new Float32Array(baseColors),
    materials: new Float32Array(materials),
    emissiveColors: new Float32Array(emissiveColors),
    instanceCount: GRID_SIZE * GRID_SIZE
  };
}

function makeFloorData(): SurfaceInstanceData {
  return {
    positions: new Float32Array([0, -0.32, 0]),
    scales: new Float32Array([18, 0.35, 18]),
    baseColors: new Float32Array([0.11, 0.14, 0.2, 1]),
    materials: new Float32Array([0.12, 0.82]),
    emissiveColors: new Float32Array([0.002, 0.004, 0.012]),
    instanceCount: 1
  };
}

function makeBounceEmitterData(): SurfaceInstanceData {
  const emitterPositions: NumberArray3[] = [
    [-8.4, 1.25, -5.2],
    [-8.4, 1.25, 3.5],
    [8.4, 1.25, -5.2],
    [8.4, 1.25, 3.5],
    [-3.5, 1.35, -9.0],
    [3.5, 1.35, -9.0]
  ];
  const emitterColors: NumberArray3[] = [
    [0.08, 0.9, 0.78],
    [0.2, 0.38, 1],
    [1, 0.2, 0.63],
    [1, 0.64, 0.12],
    [0.88, 0.2, 1],
    [1, 0.8, 0.15]
  ];
  const positions: number[] = [];
  const scales: number[] = [];
  const baseColors: number[] = [];
  const materials: number[] = [];
  const emissiveColors: number[] = [];

  for (const [emitterIndex, emitterPosition] of emitterPositions.entries()) {
    const emitterColor = emitterColors[emitterIndex]!;
    const isRearPanel = emitterIndex >= 4;
    positions.push(...emitterPosition);
    scales.push(...(isRearPanel ? [2.35, 1.1, 0.11] : [0.11, 1.1, 1.4]));
    baseColors.push(emitterColor[0], emitterColor[1], emitterColor[2], 1);
    materials.push(0.78, 0.06);
    emissiveColors.push(emitterColor[0], emitterColor[1], emitterColor[2]);
  }

  return {
    positions: new Float32Array(positions),
    scales: new Float32Array(scales),
    baseColors: new Float32Array(baseColors),
    materials: new Float32Array(materials),
    emissiveColors: new Float32Array(emissiveColors),
    instanceCount: emitterPositions.length
  };
}

function makeReflectionFeatureData(): SurfaceInstanceData {
  const featurePositions: NumberArray3[] = [
    [-8.3, 1.8, -8.1],
    [8.3, 1.8, -8.1],
    [-8.3, 1.8, 8.1],
    [8.3, 1.8, 8.1],
    [0, 0.075, -8.35],
    [0, 0.075, 8.35]
  ];
  const positions: number[] = [];
  const scales: number[] = [];
  const baseColors: number[] = [];
  const materials: number[] = [];
  const emissiveColors: number[] = [];

  for (const [featureIndex, featurePosition] of featurePositions.entries()) {
    const isFloorAccent = featureIndex >= 4;
    const accentColor = LIGHT_COLORS[(featureIndex + 1) % LIGHT_COLORS.length]!;
    positions.push(...featurePosition);
    scales.push(...(isFloorAccent ? [7.6, 0.028, 0.16] : [0.28, 1.9, 0.28]));
    baseColors.push(
      0.55 + accentColor[0] * 0.3,
      0.55 + accentColor[1] * 0.3,
      0.6 + accentColor[2] * 0.25,
      1
    );
    materials.push(isFloorAccent ? 0.06 : 0.09, 0.96);
    emissiveColors.push(
      accentColor[0] * (isFloorAccent ? 0.18 : 0.045),
      accentColor[1] * (isFloorAccent ? 0.18 : 0.045),
      accentColor[2] * (isFloorAccent ? 0.18 : 0.045)
    );
  }

  return {
    positions: new Float32Array(positions),
    scales: new Float32Array(scales),
    baseColors: new Float32Array(baseColors),
    materials: new Float32Array(materials),
    emissiveColors: new Float32Array(emissiveColors),
    instanceCount: featurePositions.length
  };
}

function makeLightMarkerData(): SurfaceInstanceData {
  const positions = new Float32Array(MAX_EXAMPLE_POINT_LIGHTS * 3);
  const scales: number[] = [];
  const baseColors: number[] = [];
  const materials: number[] = [];
  const emissiveColors: number[] = [];
  for (let lightIndex = 0; lightIndex < MAX_EXAMPLE_POINT_LIGHTS; lightIndex++) {
    positions[lightIndex * 3 + 1] = -1000;
    const color = LIGHT_COLORS[lightIndex % LIGHT_COLORS.length]!;
    scales.push(0.095, 0.095, 0.095);
    baseColors.push(color[0], color[1], color[2], 1);
    materials.push(0.98, 0);
    emissiveColors.push(color[0], color[1], color[2]);
  }
  return {
    positions,
    scales: new Float32Array(scales),
    baseColors: new Float32Array(baseColors),
    materials: new Float32Array(materials),
    emissiveColors: new Float32Array(emissiveColors),
    instanceCount: MAX_EXAMPLE_POINT_LIGHTS
  };
}

function makeAnimatedPointLights(
  time: number,
  lightCount: number,
  viewMatrix: Matrix4
): {viewLights: DeferredPointLight[]; markerPositions: Float32Array} {
  const viewLights: DeferredPointLight[] = [];
  const markerPositions = new Float32Array(MAX_EXAMPLE_POINT_LIGHTS * 3);
  for (let lightIndex = 0; lightIndex < MAX_EXAMPLE_POINT_LIGHTS; lightIndex++) {
    const offset = lightIndex * 3;
    if (lightIndex >= lightCount) {
      markerPositions[offset + 1] = -1000;
      continue;
    }

    const ring = lightIndex % 8;
    const ringCount = Math.max(1, Math.ceil(lightCount / 8));
    const angle =
      (Math.floor(lightIndex / 8) / ringCount) * Math.PI * 2 +
      ring * 0.41 +
      time * (ring % 2 === 0 ? 0.42 : -0.31);
    const radius = 3.4 + ring * 1.45;
    const worldPosition: NumberArray3 = [
      Math.cos(angle) * radius,
      0.9 + (ring % 4) * 1.1 + Math.sin(time * 1.7 + lightIndex) * 0.48,
      Math.sin(angle) * radius
    ];
    const color = LIGHT_COLORS[lightIndex % LIGHT_COLORS.length]!;
    markerPositions.set(worldPosition, offset);
    viewLights.push({
      position: viewMatrix.transformAsPoint(worldPosition) as [number, number, number],
      range: 3.6 + (ring % 3) * 0.55,
      color: [color[0], color[1], color[2]],
      intensity: 7.5 + (ring % 3) * 1.2
    });
  }
  return {viewLights, markerPositions};
}

function getMaterialRowColor(row: number): NumberArray3 {
  const colors: readonly NumberArray3[] = [
    [0.72, 0.08, 0.045],
    [0.95, 0.32, 0.06],
    [0.88, 0.62, 0.12],
    [0.12, 0.48, 0.9],
    [0.08, 0.72, 0.58],
    [0.42, 0.18, 0.9],
    [0.82, 0.82, 0.86]
  ];
  return colors[row]!;
}

function normalize3(vector: NumberArray3): NumberArray3 {
  const length = Math.hypot(vector[0], vector[1], vector[2]);
  return [vector[0] / length, vector[1] / length, vector[2] / length];
}

function getDebugMode(debugView: DebugView): number {
  switch (debugView) {
    case 'Base Color':
      return 1;
    case 'Normals':
      return 2;
    case 'Roughness':
      return 3;
    case 'Metallic':
      return 4;
    case 'Emissive':
      return 5;
    case 'Depth':
      return 6;
    case 'Cluster Occupancy':
      return 7;
    case 'Ambient Occlusion':
      return 8;
    case 'Indirect Lighting':
      return 11;
    case 'Bounce Confidence':
      return 12;
    case 'Reflections':
      return 9;
    case 'Reflection Confidence':
      return 10;
    case 'HDR Luminance':
      return 8;
    default:
      return 0;
  }
}

function makeSettingsSchema(): SettingsSchema {
  return {
    title: 'Illumination Effects',
    sections: [
      {
        id: 'inspect',
        name: 'G-buffer & Diagnostics',
        description: 'Inspect the actual material, lighting, and transport buffers.',
        initiallyCollapsed: false,
        settings: [
          {
            name: 'debugView',
            label: 'Debug View',
            type: 'select',
            persist: 'none',
            options: [
              'Final',
              'Base Color',
              'Normals',
              'Roughness',
              'Metallic',
              'Emissive',
              'Depth',
              'Cluster Occupancy',
              'Ambient Occlusion',
              'Indirect Lighting',
              'Bounce Confidence',
              'Reflections',
              'Reflection Confidence',
              'Volumetric Lighting',
              'Volume Transmittance',
              'God Rays',
              'HDR Luminance'
            ]
          },
          {
            name: 'exposure',
            label: 'Exposure',
            type: 'number',
            persist: 'none',
            min: 0.2,
            max: 2.5,
            step: 0.05
          }
        ]
      },
      {
        id: 'camera',
        name: 'Camera',
        description: 'Orbit and inspect the lighting laboratory.',
        initiallyCollapsed: true,
        settings: [
          {
            name: 'autoOrbitCamera',
            label: 'Auto Orbit',
            type: 'boolean',
            persist: 'none'
          }
        ]
      },
      {
        id: 'lighting',
        name: 'Clustered Deferred Lighting',
        description: 'One geometry pass, one sun, and hundreds of nearby point lights.',
        initiallyCollapsed: false,
        settings: [
          {
            name: 'pointLightCount',
            label: 'Point Lights',
            type: 'number',
            persist: 'none',
            min: 0,
            max: MAX_EXAMPLE_POINT_LIGHTS,
            step: 1
          },
          {
            name: 'sunIntensity',
            label: 'Sun Intensity',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 6,
            step: 0.1
          },
          {
            name: 'animate',
            label: 'Animate Lights',
            type: 'boolean',
            persist: 'none'
          }
        ]
      },
      {
        id: 'auto-exposure',
        name: 'Adaptive HDR Exposure',
        description: 'GPU luminance metering and temporally adapted camera exposure.',
        initiallyCollapsed: true,
        settings: [
          {
            name: 'autoExposureEnabled',
            label: 'Enable Auto Exposure',
            type: 'boolean',
            persist: 'none'
          },
          {
            name: 'exposureKeyValue',
            label: 'Middle Gray',
            type: 'number',
            persist: 'none',
            min: 0.08,
            max: 1.5,
            step: 0.02
          },
          {
            name: 'minimumExposure',
            label: 'Minimum Exposure',
            type: 'number',
            persist: 'none',
            min: 0.05,
            max: 2,
            step: 0.05
          },
          {
            name: 'maximumExposure',
            label: 'Maximum Exposure',
            type: 'number',
            persist: 'none',
            min: 0.5,
            max: 6,
            step: 0.1
          },
          {
            name: 'exposureBrightenSpeed',
            label: 'Adapt to Darkness',
            type: 'number',
            persist: 'none',
            min: 0.1,
            max: 8,
            step: 0.1
          },
          {
            name: 'exposureDarkenSpeed',
            label: 'Adapt to Light',
            type: 'number',
            persist: 'none',
            min: 0.1,
            max: 8,
            step: 0.1
          }
        ]
      },
      {
        id: 'cinematic-bloom',
        name: 'Cinematic HDR Bloom',
        description: 'Multiscale, unclipped glow from emissive and specular highlights.',
        initiallyCollapsed: true,
        settings: [
          {
            name: 'bloomEnabled',
            label: 'Enable Bloom',
            type: 'boolean',
            persist: 'none'
          },
          {
            name: 'bloomThreshold',
            label: 'Highlight Threshold',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 1,
            step: 0.02
          },
          {
            name: 'bloomIntensity',
            label: 'Glow Intensity',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 2,
            step: 0.05
          },
          {
            name: 'bloomRadius',
            label: 'Glow Radius',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 24,
            step: 1
          },
          {
            name: 'bloomResolution',
            label: 'Pyramid Resolution',
            type: 'number',
            persist: 'none',
            min: 0.25,
            max: 1,
            step: 0.25
          }
        ]
      },
      {
        id: 'ambient-occlusion',
        name: 'Ground-truth Ambient Occlusion · GTAO',
        description: 'Horizon-based contact visibility with temporal stabilization.',
        initiallyCollapsed: true,
        settings: [
          {
            name: 'ambientOcclusionEnabled',
            label: 'Enable GTAO',
            type: 'boolean',
            persist: 'none'
          },
          {
            name: 'ambientOcclusionResolution',
            label: 'Buffer Resolution',
            type: 'number',
            persist: 'none',
            min: 0.25,
            max: 1,
            step: 0.25
          },
          {
            name: 'ambientOcclusionRadius',
            label: 'GTAO Radius',
            type: 'number',
            persist: 'none',
            min: 0.2,
            max: 8,
            step: 0.1
          },
          {
            name: 'ambientOcclusionIntensity',
            label: 'GTAO Intensity',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 8,
            step: 0.1
          },
          {
            name: 'ambientOcclusionStrength',
            label: 'GTAO Strength',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 1,
            step: 0.02
          }
        ]
      },
      {
        id: 'global-illumination',
        name: 'Diffuse Global Illumination · SSGI',
        description: 'Colored light bouncing between visible surfaces.',
        initiallyCollapsed: true,
        settings: [
          {
            name: 'globalIlluminationEnabled',
            label: 'Enable Diffuse Bounce',
            type: 'boolean',
            persist: 'none'
          },
          {
            name: 'globalIlluminationResolution',
            label: 'Buffer Resolution',
            type: 'number',
            persist: 'none',
            min: 0.25,
            max: 1,
            step: 0.25
          },
          {
            name: 'globalIlluminationRadius',
            label: 'Bounce Radius',
            type: 'number',
            persist: 'none',
            min: 0.5,
            max: 12,
            step: 0.1
          },
          {
            name: 'globalIlluminationIntensity',
            label: 'Bounce Intensity',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 6,
            step: 0.1
          },
          {
            name: 'globalIlluminationStrength',
            label: 'Bounce Strength',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 3,
            step: 0.05
          },
          {
            name: 'globalIlluminationRayCount',
            label: 'Bounce Rays',
            type: 'number',
            persist: 'none',
            min: 1,
            max: 12,
            step: 1
          },
          {
            name: 'globalIlluminationStepCount',
            label: 'Ray Steps',
            type: 'number',
            persist: 'none',
            min: 2,
            max: 12,
            step: 1
          },
          {
            name: 'globalIlluminationHistoryWeight',
            label: 'Bounce History',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 0.97,
            step: 0.01
          }
        ]
      },
      {
        id: 'atmosphere',
        name: 'Clustered Volumetric Lighting',
        description: 'Colored light halos, directional shafts, and atmospheric extinction.',
        initiallyCollapsed: true,
        settings: [
          {
            name: 'atmosphereEnabled',
            label: 'Enable Volumetric Lighting',
            type: 'boolean',
            persist: 'none'
          },
          {
            name: 'atmosphereResolution',
            label: 'Buffer Resolution',
            type: 'number',
            persist: 'none',
            min: 0.25,
            max: 1,
            step: 0.25
          },
          {
            name: 'atmosphereDensity',
            label: 'Fog Density',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 0.2,
            step: 0.005
          },
          {
            name: 'atmosphereHeightFalloff',
            label: 'Height Falloff',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 1.5,
            step: 0.05
          },
          {
            name: 'atmosphereAnisotropy',
            label: 'Scattering Direction',
            type: 'number',
            persist: 'none',
            min: -0.7,
            max: 0.8,
            step: 0.05
          },
          {
            name: 'atmospherePointLightIntensity',
            label: 'Light Halos',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 5,
            step: 0.1
          },
          {
            name: 'atmosphereSunIntensity',
            label: 'Sun Shafts',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 5,
            step: 0.1
          },
          {
            name: 'atmosphereShadowStrength',
            label: 'Shaft Shadows',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 1,
            step: 0.05
          },
          {
            name: 'atmosphereStrength',
            label: 'Atmosphere Strength',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 2,
            step: 0.05
          },
          {
            name: 'atmosphereSampleCount',
            label: 'Volume Steps',
            type: 'number',
            persist: 'none',
            min: 3,
            max: 20,
            step: 1
          },
          {
            name: 'atmosphereHistoryWeight',
            label: 'Volume History',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 0.97,
            step: 0.01
          }
        ]
      },
      {
        id: 'god-rays',
        name: 'Crepuscular God Rays',
        description: 'Depth-occluded sunlight shafts through the participating medium.',
        initiallyCollapsed: true,
        settings: [
          {
            name: 'godRaysEnabled',
            label: 'Enable God Rays',
            type: 'boolean',
            persist: 'none'
          },
          {
            name: 'godRayIntensity',
            label: 'Ray Intensity',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 6,
            step: 0.1
          },
          {
            name: 'godRayDensity',
            label: 'Ray Reach',
            type: 'number',
            persist: 'none',
            min: 0.2,
            max: 1.2,
            step: 0.05
          },
          {
            name: 'godRayDecay',
            label: 'Ray Persistence',
            type: 'number',
            persist: 'none',
            min: 0.7,
            max: 1,
            step: 0.01
          },
          {
            name: 'godRaySampleCount',
            label: 'Ray Samples',
            type: 'number',
            persist: 'none',
            min: 3,
            max: 32,
            step: 1
          },
          {
            name: 'godRayPositionX',
            label: 'Sun Position X',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 1,
            step: 0.02
          },
          {
            name: 'godRayPositionY',
            label: 'Sun Position Y',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 1,
            step: 0.02
          }
        ]
      },
      {
        id: 'reflections',
        name: 'Screen-space Reflections · SSR',
        description: 'Temporally stabilized mirror and glossy reflections.',
        initiallyCollapsed: true,
        settings: [
          {
            name: 'reflectionEnabled',
            label: 'Enable Reflections',
            type: 'boolean',
            persist: 'none'
          },
          {
            name: 'reflectionResolution',
            label: 'Buffer Resolution',
            type: 'number',
            persist: 'none',
            min: 0.25,
            max: 1,
            step: 0.25
          },
          {
            name: 'reflectionStrength',
            label: 'SSR Strength',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 2,
            step: 0.05
          },
          {
            name: 'reflectionIntensity',
            label: 'SSR Intensity',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 3,
            step: 0.05
          },
          {
            name: 'reflectionMaxDistance',
            label: 'SSR Distance',
            type: 'number',
            persist: 'none',
            min: 4,
            max: 80,
            step: 1
          },
          {
            name: 'reflectionSampleCount',
            label: 'SSR Samples',
            type: 'number',
            persist: 'none',
            min: 8,
            max: 96,
            step: 1
          },
          {
            name: 'reflectionHistoryWeight',
            label: 'SSR History',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 0.97,
            step: 0.01
          }
        ]
      }
    ]
  };
}
