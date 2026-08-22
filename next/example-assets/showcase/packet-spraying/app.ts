// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Texture} from '@luma.gl/core';
import type {
  Buffer,
  Device,
  Framebuffer,
  RenderPipelineParameters,
  TextureFormatColor
} from '@luma.gl/core';
import {bloomShaderPassPipeline, toneMapping} from '@luma.gl/effects';
import type {AnimationProps, Geometry} from '@luma.gl/engine';
import {
  AnimationLoopTemplate,
  colorPicking,
  CubeGeometry,
  CylinderGeometry,
  GroupNode,
  Model,
  ModelNode,
  OrbitControls,
  PickingManager,
  ShaderPassRenderer,
  ShaderInputs,
  SphereGeometry,
  TruncatedConeGeometry
} from '@luma.gl/engine';
import {
  ABufferRenderer,
  WBOITRenderer,
  aBuffer,
  aBufferPlugin,
  emissiveMaterial,
  emissiveMaterialPlugin,
  glassMaterial,
  glassMaterialPlugin,
  glassTransmission,
  glassTransmissionPlugin,
  getABufferSupport,
  getWBOITSupport,
  MAX_OPTICAL_CAUSTIC_LENSES,
  opticalCaustics,
  opticalCausticsPlugin,
  opticalPointLights,
  opticalPointLightsPlugin,
  reflectiveMaterial,
  reflectiveMaterialPlugin,
  type ABufferShaderModuleProps,
  type EmissiveMaterialProps,
  type GlassMaterialProps,
  type GlassTransmissionProps,
  type OpticalCausticLens,
  type OpticalCausticsProps,
  type OpticalPointLight,
  type OpticalPointLightsProps,
  type ReflectiveMaterialProps,
  type WBOITShaderModuleProps,
  wboit,
  wboitPlugin
} from '@luma.gl/experimental';
import type {ShaderModule, ShaderPassPipeline, ShaderPlugin} from '@luma.gl/shadertools';
import {Matrix4, radians} from '@math.gl/core';
import {type Panel, type SettingsChangeDescriptor} from '@deck.gl-community/panels';
import {
  ExamplePanelManager,
  ExampleSettingsPanelManager,
  getChangedSetting,
  makeExamplePanelHostHtml,
  makeExampleTabbedPanel,
  makeHtmlCustomPanel
} from '../../example-panels';
import {
  BURST_CYCLE_DURATION,
  CONGESTION_TRIM_INTERVAL,
  FAILURE_DETECTION_DELAY,
  PACKET_TRAVEL_SPEED,
  SWITCH_PROBE_INTERVAL,
  getHealthyConversationRoutes,
  isSwitchProbeRouteAvailable,
  makeEndpointSignals,
  makeLinkPulses,
  makeLinkTraffic,
  makeNetworkFabricTelemetry,
  makeNetworkPlaneTelemetry,
  makeNetworkSwitchPlaneTelemetry,
  makePackets,
  makeSwitchArrivals,
  makeSwitchPacketEvents,
  makeSwitchProbeConfirmationEvent,
  makeSwitchProbeEvent,
  makeSwitchQueuePackets,
  makeSwitchTransitionWave,
  reroutePackets
} from './animation';
import {
  AGGREGATION_POSITIONS,
  AGGREGATION_SWITCH_RADIUS,
  CONVERSATIONS,
  HOST_HALF_EXTENTS,
  HOST_POSITIONS,
  HOST_Y,
  LEAF_POSITIONS,
  LEAF_SWITCH_RADIUS,
  NETWORK_SWITCH_PLANE_COUNT,
  SPINE_POSITIONS,
  SPINE_SWITCH_RADIUS,
  SWITCH_POSITIONS,
  getActivePlaneCount,
  getDistance,
  getDistanceSquared,
  getNetworkPlaneSwitchIndices,
  getPointAlongRoute,
  getRouteSegmentStartDistance,
  isFailedSwitchPosition,
  makeActiveLinkKeys,
  makeConversationRoutes,
  makeHostColor,
  makeLinkColor,
  makeLinkKey,
  makeLinks,
  makeNetworkPathFocus,
  makePickableNetworkNodes,
  makeSwitchGroups,
  type Color,
  type ConversationRoute,
  type NetworkLink,
  type NetworkEndpointSignal,
  type NetworkPacketEvent,
  type NetworkPathFocus,
  type NetworkQueuedPacket,
  type NetworkScenario,
  type NetworkSwitchTransitionWave,
  type NetworkSwitchGroupId,
  type Packet,
  type PickableNetworkNode,
  type SwitchArrival,
  type Vector3
} from './network';
import {makeStudioEnvironmentMipLevels} from './optics';
import {
  DEFAULT_NETWORK_HDR_HIGHLIGHT_BOOST,
  DEFAULT_NETWORK_OPTICS_LEVEL,
  getNetworkStoryBeat,
  getNetworkStoryChapter,
  getNetworkStoryProgress,
  getNetworkVerticalFieldOfView,
  getNetworkVerticalViewportOffset,
  getWrappedStoryChapterIndex,
  GUIDED_STORY_SWITCH_INDEX,
  makeNetworkDynamicRangeProfile,
  makeNetworkOpticsProfile,
  makeNetworkStoryCamera,
  makeNetworkSwitchHighlightColor,
  MAX_NETWORK_HDR_HIGHLIGHT_BOOST,
  NETWORK_AUTOROTATION_SCENARIO_DURATION,
  shouldAdvanceNetworkAutorotationScenario,
  type NetworkDynamicRangeOptions,
  type NetworkDynamicRangeProfile,
  type NetworkOpticsProfile,
  type NetworkStoryBeat,
  type NetworkStoryCamera
} from './story';
import {
  makeSettingsSchema,
  NetworkInfoPanel,
  NetworkNodePopup,
  NetworkStoryControls,
  PACKET_SPRAYING_BACKGROUND_HTML,
  PACKET_SPRAYING_OPTICS_HTML,
  PACKET_SPRAYING_OVERVIEW_HTML
} from './ui';

type TransparencyMode = 'a-buffer' | 'weighted-blended' | 'sorted-alpha';

type AppUniforms = {
  cameraPosition: Vector3;
  projectionMatrix: Matrix4;
  viewMatrix: Matrix4;
};

type GlassInstance = {
  color: Color;
  matrix: Matrix4;
  position: Vector3;
};

type GlassRenderGroup = {
  id: NetworkSwitchGroupId;
  instances: GlassInstance[];
  switchIndices: number[];
  node: ModelNode;
  backfaces: InstancedMesh<{app: AppUniforms}>;
  sorted: InstancedMesh<{
    app: AppUniforms;
    glassMaterial: GlassMaterialProps;
    glassTransmission: GlassTransmissionProps;
    opticalPointLights: OpticalPointLightsProps;
  }>;
  aBuffer: InstancedMesh<{
    app: AppUniforms;
    glassMaterial: GlassMaterialProps;
    glassTransmission: GlassTransmissionProps;
    opticalPointLights: OpticalPointLightsProps;
    aBuffer: ABufferShaderModuleProps;
  }> | null;
  weightedBlended: InstancedMesh<{
    app: AppUniforms;
    glassMaterial: GlassMaterialProps;
    glassTransmission: GlassTransmissionProps;
    opticalPointLights: OpticalPointLightsProps;
    wboit: WBOITShaderModuleProps;
  }> | null;
};

type NetworkNodePickRequest = {
  action: 'hover' | 'toggle-switch';
  canvasPosition: [number, number];
  clientPosition: [number, number];
  pointerSequence: number;
};

const appShaderModule: ShaderModule<AppUniforms> = {
  name: 'app',
  uniformTypes: {
    cameraPosition: 'vec3<f32>',
    projectionMatrix: 'mat4x4<f32>',
    viewMatrix: 'mat4x4<f32>'
  }
};

const WGSL_SHADER = /* wgsl */ `\
struct AppUniforms {
  cameraPosition: vec3<f32>,
  projectionMatrix: mat4x4<f32>,
  viewMatrix: mat4x4<f32>,
};

@group(0) @binding(auto) var<uniform> app: AppUniforms;

struct VertexInputs {
  @location(0) positions: vec3<f32>,
  @location(1) normals: vec3<f32>,
  @location(2) instanceModelMatrixCol0: vec4<f32>,
  @location(3) instanceModelMatrixCol1: vec4<f32>,
  @location(4) instanceModelMatrixCol2: vec4<f32>,
  @location(5) instanceModelMatrixCol3: vec4<f32>,
  @location(6) instanceColor: vec4<f32>,
};

struct VertexOutputs {
  @builtin(position) position: vec4<f32>,
  @location(0) normal: vec3<f32>,
  @location(1) color: vec4<f32>,
  @location(2) worldPosition: vec3<f32>,
  @location(3) localPosition: vec3<f32>,
};

@vertex
fn vertexMain(inputs: VertexInputs) -> VertexOutputs {
  let modelMatrix = mat4x4<f32>(
    inputs.instanceModelMatrixCol0,
    inputs.instanceModelMatrixCol1,
    inputs.instanceModelMatrixCol2,
    inputs.instanceModelMatrixCol3
  );
  let worldPosition = modelMatrix * vec4<f32>(inputs.positions, 1.0);

  var outputs: VertexOutputs;
  outputs.position = app.projectionMatrix * app.viewMatrix * worldPosition;
  let normalMatrix = mat3x3<f32>(
    cross(modelMatrix[1].xyz, modelMatrix[2].xyz),
    cross(modelMatrix[2].xyz, modelMatrix[0].xyz),
    cross(modelMatrix[0].xyz, modelMatrix[1].xyz)
  );
  outputs.normal = normalize(normalMatrix * inputs.normals);
  outputs.color = inputs.instanceColor;
  outputs.worldPosition = worldPosition.xyz;
  outputs.localPosition = inputs.positions;
  return outputs;
}

@fragment
fn fragmentMain(inputs: VertexOutputs) -> @location(0) vec4<f32> {
  let lightDirection = normalize(vec3<f32>(0.4, 0.8, 0.65));
  let light = 0.28 + 0.72 * max(dot(normalize(inputs.normal), lightDirection), 0.0);
  return vec4<f32>(inputs.color.rgb * light, inputs.color.a);
}
`;

const REFLECTIVE_WGSL_SHADER = /* wgsl */ `${WGSL_SHADER}
@fragment
fn fragmentReflective(inputs: VertexOutputs) -> @location(0) vec4<f32> {
  let reflectiveColor = reflectiveMaterial_getIlluminatedColor(
    inputs.normal,
    inputs.worldPosition,
    inputs.color,
    app.cameraPosition
  );
  let causticColor = opticalCaustics_getColor(
    inputs.normal,
    inputs.worldPosition,
    app.cameraPosition
  );
  let color = vec4<f32>(reflectiveColor.rgb + causticColor, reflectiveColor.a);
#if OPAQUE_REFLECTIVE
  return vec4<f32>(color.rgb, inputs.color.a);
#else
  return color;
#endif
}
`;

const EMISSIVE_WGSL_SHADER = /* wgsl */ `${WGSL_SHADER}
@fragment
fn fragmentEmissive(inputs: VertexOutputs) -> @location(0) vec4<f32> {
  return emissiveMaterial_getColor(
    inputs.normal,
    inputs.worldPosition,
    inputs.color,
    app.cameraPosition
  );
}
`;

const TRAIL_WGSL_SHADER = /* wgsl */ `${WGSL_SHADER}
@fragment
fn fragmentTrail(inputs: VertexOutputs) -> @location(0) vec4<f32> {
  return emissiveMaterial_getTrailColor(
    inputs.normal,
    inputs.worldPosition,
    inputs.color,
    app.cameraPosition,
    inputs.localPosition.y + 0.5,
    1.0
  );
}
`;

const GLASS_WGSL_SHADER = /* wgsl */ `${WGSL_SHADER}
@fragment
fn fragmentGlass(inputs: VertexOutputs) -> @location(0) vec4<f32> {
  let glassColor = glassTransmission_getIlluminatedColor(
    inputs.normal,
    inputs.worldPosition,
    inputs.color,
    app.cameraPosition,
    inputs.position
  );
  let failureTint = smoothstep(0.44, 0.54, inputs.color.a);
  let viewDirection = normalize(app.cameraPosition - inputs.worldPosition);
  let viewAlignment = abs(dot(normalize(inputs.normal), viewDirection));
  let focusRim = pow(1.0 - clamp(viewAlignment, 0.0, 1.0), 1.8);
  let focusSignal = max(inputs.color.g - inputs.color.b * 0.6, 0.0);
  let focusStrength = smoothstep(0.008, 0.05, focusSignal) * (1.0 - failureTint);
  let focusColor = vec3<f32>(0.12, 0.34, 0.72) *
    focusStrength * (0.05 + focusRim * 0.55);
  let color = vec4<f32>(
    glassColor.rgb + inputs.color.rgb * failureTint * 0.46 + focusColor,
    glassColor.a
  );
#if A_BUFFER_ENABLED
  return aBuffer_captureStraightColor(color, inputs.position);
#else
#if WBOIT_ENABLED
  return wboit_captureStraightColor(color, inputs.position);
#else
  return color;
#endif
#endif
}
`;

const GLASS_BACKFACE_WGSL_SHADER = /* wgsl */ `${WGSL_SHADER}
@fragment
fn fragmentGlassBackface(inputs: VertexOutputs) -> @location(0) vec4<f32> {
  let encodedNormal = normalize(inputs.normal) * 0.5 + vec3<f32>(0.5);
  return vec4<f32>(encodedNormal, inputs.position.z);
}
`;

const PICKING_WGSL_SHADER = /* wgsl */ `${WGSL_SHADER}
@fragment
fn fragmentPicking(inputs: VertexOutputs) -> @location(0) vec4<f32> {
  return picking_getPickingColor(i32(inputs.color.r));
}
`;

const VERTEX_SHADER = /* glsl */ `\
#version 300 es

in vec3 positions;
in vec3 normals;
in vec4 instanceModelMatrixCol0;
in vec4 instanceModelMatrixCol1;
in vec4 instanceModelMatrixCol2;
in vec4 instanceModelMatrixCol3;
in vec4 instanceColor;

uniform appUniforms {
  vec3 cameraPosition;
  mat4 projectionMatrix;
  mat4 viewMatrix;
} app;

out vec3 vNormal;
out vec4 vColor;
out vec3 vWorldPosition;
out vec3 vLocalPosition;

void main(void) {
  mat4 modelMatrix = mat4(
    instanceModelMatrixCol0,
    instanceModelMatrixCol1,
    instanceModelMatrixCol2,
    instanceModelMatrixCol3
  );
  vec4 worldPosition = modelMatrix * vec4(positions, 1.0);
  gl_Position = app.projectionMatrix * app.viewMatrix * worldPosition;
  mat3 normalMatrix = mat3(
    cross(modelMatrix[1].xyz, modelMatrix[2].xyz),
    cross(modelMatrix[2].xyz, modelMatrix[0].xyz),
    cross(modelMatrix[0].xyz, modelMatrix[1].xyz)
  );
  vNormal = normalize(normalMatrix * normals);
  vColor = instanceColor;
  vWorldPosition = worldPosition.xyz;
  vLocalPosition = positions;
}
`;

const PICKING_VERTEX_SHADER = /* glsl */ `\
#version 300 es
precision highp float;
precision highp int;

in vec3 positions;
in vec4 instanceModelMatrixCol0;
in vec4 instanceModelMatrixCol1;
in vec4 instanceModelMatrixCol2;
in vec4 instanceModelMatrixCol3;
in vec4 instanceColor;

uniform appUniforms {
  vec3 cameraPosition;
  mat4 projectionMatrix;
  mat4 viewMatrix;
} app;

void main(void) {
  mat4 modelMatrix = mat4(
    instanceModelMatrixCol0,
    instanceModelMatrixCol1,
    instanceModelMatrixCol2,
    instanceModelMatrixCol3
  );
  gl_Position = app.projectionMatrix * app.viewMatrix * modelMatrix * vec4(positions, 1.0);
  picking_setObjectIndex(int(instanceColor.r));
}
`;

const PICKING_FRAGMENT_SHADER = /* glsl */ `\
#version 300 es
precision highp float;
precision highp int;

out vec4 fragColor;

void main(void) {
  fragColor = picking_getPickingColor();
}
`;

const GLASS_FRAGMENT_SHADER = /* glsl */ `\
#version 300 es
precision highp float;

uniform appUniforms {
  vec3 cameraPosition;
  mat4 projectionMatrix;
  mat4 viewMatrix;
} app;

in vec3 vNormal;
in vec4 vColor;
in vec3 vWorldPosition;
out vec4 fragColor;

void main(void) {
  vec4 glassColor = glassTransmission_getIlluminatedColor(
    vNormal,
    vWorldPosition,
    vColor,
    app.cameraPosition,
    gl_FragCoord
  );
  float failureTint = smoothstep(0.44, 0.54, vColor.a);
  vec3 viewDirection = normalize(app.cameraPosition - vWorldPosition);
  float viewAlignment = abs(dot(normalize(vNormal), viewDirection));
  float focusRim = pow(1.0 - clamp(viewAlignment, 0.0, 1.0), 1.8);
  float focusSignal = max(vColor.g - vColor.b * 0.6, 0.0);
  float focusStrength = smoothstep(0.008, 0.05, focusSignal) * (1.0 - failureTint);
  vec3 focusColor = vec3(0.12, 0.34, 0.72) * focusStrength * (0.05 + focusRim * 0.55);
  vec4 color = vec4(
    glassColor.rgb + vColor.rgb * failureTint * 0.46 + focusColor,
    glassColor.a
  );
#if WBOIT_ENABLED
  fragColor = wboit_captureStraightColor(color, gl_FragCoord);
#else
  fragColor = color;
#endif
}
`;

const GLASS_BACKFACE_FRAGMENT_SHADER = /* glsl */ `\
#version 300 es
precision highp float;

in vec3 vNormal;
out vec4 fragColor;

void main(void) {
  fragColor = vec4(normalize(vNormal) * 0.5 + vec3(0.5), gl_FragCoord.z);
}
`;

const FRAGMENT_SHADER = /* glsl */ `\
#version 300 es
precision highp float;

in vec3 vNormal;
in vec4 vColor;
out vec4 fragColor;

void main(void) {
  vec3 lightDirection = normalize(vec3(0.4, 0.8, 0.65));
  float light = 0.28 + 0.72 * max(dot(normalize(vNormal), lightDirection), 0.0);
  fragColor = vec4(vColor.rgb * light, vColor.a);
}
`;

const REFLECTIVE_FRAGMENT_SHADER = /* glsl */ `\
#version 300 es
precision highp float;

uniform appUniforms {
  vec3 cameraPosition;
  mat4 projectionMatrix;
  mat4 viewMatrix;
} app;

in vec3 vNormal;
in vec4 vColor;
in vec3 vWorldPosition;
out vec4 fragColor;

void main(void) {
  vec4 reflectiveColor = reflectiveMaterial_getIlluminatedColor(
    vNormal,
    vWorldPosition,
    vColor,
    app.cameraPosition
  );
  vec3 causticColor = opticalCaustics_getColor(
    vNormal,
    vWorldPosition,
    app.cameraPosition
  );
  vec4 color = vec4(reflectiveColor.rgb + causticColor, reflectiveColor.a);
#if OPAQUE_REFLECTIVE
  fragColor = vec4(color.rgb, vColor.a);
#else
  fragColor = color;
#endif
}
`;

const EMISSIVE_FRAGMENT_SHADER = /* glsl */ `\
#version 300 es
precision highp float;

uniform appUniforms {
  vec3 cameraPosition;
  mat4 projectionMatrix;
  mat4 viewMatrix;
} app;

in vec3 vNormal;
in vec4 vColor;
in vec3 vWorldPosition;
out vec4 fragColor;

void main(void) {
  fragColor = emissiveMaterial_getColor(vNormal, vWorldPosition, vColor, app.cameraPosition);
}
`;

const TRAIL_FRAGMENT_SHADER = /* glsl */ `\
#version 300 es
precision highp float;

uniform appUniforms {
  vec3 cameraPosition;
  mat4 projectionMatrix;
  mat4 viewMatrix;
} app;

in vec3 vNormal;
in vec4 vColor;
in vec3 vWorldPosition;
in vec3 vLocalPosition;
out vec4 fragColor;

void main(void) {
  fragColor = emissiveMaterial_getTrailColor(
    vNormal,
    vWorldPosition,
    vColor,
    app.cameraPosition,
    vLocalPosition.y + 0.5,
    1.0
  );
}
`;

const INSTANCE_BUFFER_LAYOUT = [
  {
    name: 'instanceModelMatrices',
    stepMode: 'instance' as const,
    byteStride: 64,
    attributes: [
      {attribute: 'instanceModelMatrixCol0', format: 'float32x4' as const, byteOffset: 0},
      {attribute: 'instanceModelMatrixCol1', format: 'float32x4' as const, byteOffset: 16},
      {attribute: 'instanceModelMatrixCol2', format: 'float32x4' as const, byteOffset: 32},
      {attribute: 'instanceModelMatrixCol3', format: 'float32x4' as const, byteOffset: 48}
    ]
  },
  {name: 'instanceColor', format: 'float32x4' as const, stepMode: 'instance' as const}
];

const PACKET_TRAIL_RADIUS = 0.033;
const LINK_PULSE_RADIUS = 0.046;
const SWITCH_FLASH_DURATION = 0.16;
const SWITCH_RIPPLE_DURATION = 0.38;
const MAX_SWITCH_FLASH_LIGHTS = 6;
const MAX_SWITCH_TRANSITION_WAVES = 12;
const MAX_ENDPOINT_SIGNALS = CONVERSATIONS.length * 2;
const MAX_STORY_PACKET_INSTANCES = 160;
const REFLECTION_LAB_SWITCH_INDEX = 0;
const REFLECTION_LAB_SPHERE_POSITION: Vector3 = [0, 0, 0];
const REFLECTION_LAB_SPHERE_RADIUS = 1;
const REFLECTION_LAB_PACKET_RADIUS = 0.085;
const REFLECTION_LAB_PACKET_COLOR: Color = [1, 0.04, 0.025, 0.9];
const NETWORK_PLANE_HIGHLIGHT_ATTACK = 2.9;
const NETWORK_PLANE_HIGHLIGHT_DECAY = 2.25;
const CONGESTED_SWITCH_COLOR: Color = [1, 0.42, 0.065, 0.56];
const DETECTING_SWITCH_COLOR: Color = [1, 0.21, 0.035, 0.59];
const FAILED_SWITCH_COLOR: Color = [1, 0.065, 0.035, 0.59];

const TRANSPARENT_PARAMETERS = {
  blend: true,
  blendColorOperation: 'add',
  blendColorSrcFactor: 'src-alpha',
  blendColorDstFactor: 'one-minus-src-alpha',
  blendAlphaOperation: 'add',
  blendAlphaSrcFactor: 'one',
  blendAlphaDstFactor: 'one-minus-src-alpha',
  depthWriteEnabled: false,
  depthCompare: 'less-equal',
  cullMode: 'none'
} as const satisfies RenderPipelineParameters;

const GLASS_PARAMETERS = {
  ...TRANSPARENT_PARAMETERS,
  cullMode: 'back'
} as const satisfies RenderPipelineParameters;

const ADDITIVE_PARAMETERS = {
  blend: true,
  blendColorOperation: 'add',
  blendColorSrcFactor: 'src-alpha',
  blendColorDstFactor: 'one',
  blendAlphaOperation: 'add',
  blendAlphaSrcFactor: 'zero',
  blendAlphaDstFactor: 'one',
  depthWriteEnabled: false,
  depthCompare: 'less-equal',
  cullMode: 'none'
} as const satisfies RenderPipelineParameters;

const networkNodePickingPlugin = {
  name: 'networkNodePicking',
  modules: [colorPicking as ShaderModule]
} as const satisfies ShaderPlugin;

class InstancedMesh<
  ShaderProps extends Partial<Record<string, Record<string, unknown>>> = {app: AppUniforms}
> {
  readonly colorBuffer: Buffer;
  readonly matrixBuffer: Buffer;
  readonly model: Model;

  constructor(
    device: Device,
    shaderInputs: ShaderInputs<ShaderProps>,
    {
      id,
      geometry,
      matrices,
      colors,
      transparent = false,
      additive = false,
      glass = false,
      emissive = false,
      trail = false,
      pickable = false,
      reflective = false,
      backface = false,
      sceneTexture,
      sceneDepthTexture,
      backfaceTexture,
      environmentTexture,
      colorAttachmentFormat,
      transparencyMode
    }: {
      id: string;
      geometry: Geometry;
      matrices: Float32Array;
      colors: Float32Array;
      transparent?: boolean;
      additive?: boolean;
      glass?: boolean;
      emissive?: boolean;
      trail?: boolean;
      pickable?: boolean;
      reflective?: boolean;
      backface?: boolean;
      sceneTexture?: Texture;
      sceneDepthTexture?: Texture;
      backfaceTexture?: Texture;
      environmentTexture?: Texture;
      colorAttachmentFormat?: TextureFormatColor;
      transparencyMode?: TransparencyMode;
    }
  ) {
    const usesABuffer = transparencyMode === 'a-buffer';
    const usesWeightedBlending = transparencyMode === 'weighted-blended';
    this.matrixBuffer = device.createBuffer(matrices);
    this.colorBuffer = device.createBuffer(colors);
    this.model = new Model(device, {
      id,
      source: pickable
        ? PICKING_WGSL_SHADER
        : backface
          ? GLASS_BACKFACE_WGSL_SHADER
          : glass
            ? GLASS_WGSL_SHADER
            : reflective
              ? REFLECTIVE_WGSL_SHADER
              : trail
                ? TRAIL_WGSL_SHADER
                : emissive
                  ? EMISSIVE_WGSL_SHADER
                  : WGSL_SHADER,
      vs: pickable ? PICKING_VERTEX_SHADER : VERTEX_SHADER,
      fs: pickable
        ? PICKING_FRAGMENT_SHADER
        : backface
          ? GLASS_BACKFACE_FRAGMENT_SHADER
          : glass
            ? GLASS_FRAGMENT_SHADER
            : reflective
              ? REFLECTIVE_FRAGMENT_SHADER
              : trail
                ? TRAIL_FRAGMENT_SHADER
                : emissive
                  ? EMISSIVE_FRAGMENT_SHADER
                  : FRAGMENT_SHADER,
      fragmentEntryPoint: pickable
        ? 'fragmentPicking'
        : backface
          ? 'fragmentGlassBackface'
          : glass
            ? 'fragmentGlass'
            : reflective
              ? 'fragmentReflective'
              : trail
                ? 'fragmentTrail'
                : emissive
                  ? 'fragmentEmissive'
                  : 'fragmentMain',
      shaderInputs,
      defines: {
        A_BUFFER_ENABLED: usesABuffer ? 1 : 0,
        WBOIT_ENABLED: usesWeightedBlending ? 1 : 0,
        OPAQUE_REFLECTIVE: reflective && !transparent ? 1 : 0
      },
      plugins: [
        ...(pickable ? [networkNodePickingPlugin] : []),
        ...(glass || reflective ? [opticalPointLightsPlugin] : []),
        ...(reflective ? [opticalCausticsPlugin] : []),
        ...(glass ? [glassMaterialPlugin] : []),
        ...(glass ? [glassTransmissionPlugin] : []),
        ...(reflective ? [reflectiveMaterialPlugin] : []),
        ...(emissive || trail ? [emissiveMaterialPlugin] : []),
        ...(usesABuffer ? [aBufferPlugin] : []),
        ...(usesWeightedBlending ? [wboitPlugin] : [])
      ],
      geometry,
      instanceCount: colors.length / 4,
      bufferLayout: INSTANCE_BUFFER_LAYOUT,
      attributes: {
        instanceModelMatrices: this.matrixBuffer,
        instanceColor: this.colorBuffer
      },
      ...(sceneTexture
        ? {
            bindings: {
              glassSceneColorTexture: sceneTexture,
              ...(sceneDepthTexture ? {glassSceneDepthTexture: sceneDepthTexture} : {}),
              ...(backfaceTexture ? {glassBackfaceTexture: backfaceTexture} : {}),
              ...(environmentTexture ? {glassEnvironmentTexture: environmentTexture} : {})
            }
          }
        : {}),
      ...(pickable
        ? {
            colorAttachmentFormats: ['rgba8unorm' as const],
            depthStencilAttachmentFormat: 'depth24plus' as const
          }
        : {}),
      ...(backface && colorAttachmentFormat
        ? {
            colorAttachmentFormats: [colorAttachmentFormat],
            depthStencilAttachmentFormat: 'depth24plus' as const
          }
        : {}),
      parameters: additive
        ? ADDITIVE_PARAMETERS
        : backface
          ? {
              depthWriteEnabled: true,
              depthCompare: 'greater-equal',
              cullMode: 'front'
            }
          : glass
            ? GLASS_PARAMETERS
            : transparent
              ? TRANSPARENT_PARAMETERS
              : {
                  depthWriteEnabled: true,
                  depthCompare: 'less-equal',
                  cullMode: 'back'
                }
    });
  }

  updateMatrices(matrices: Float32Array): void {
    this.matrixBuffer.write(matrices);
  }

  updateInstances(matrices: Float32Array, colors: Float32Array): void {
    this.matrixBuffer.write(matrices);
    this.colorBuffer.write(colors);
  }

  updateColors(colors: Float32Array): void {
    this.colorBuffer.write(colors);
  }

  destroy(): void {
    this.model.destroy();
    this.matrixBuffer.destroy();
    this.colorBuffer.destroy();
  }
}

export default class PacketSprayingAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = makeExamplePanelHostHtml();

  readonly backfaceShaderInputs = new ShaderInputs<{app: AppUniforms}>({app: appShaderModule});
  readonly reflectiveShaderInputs = new ShaderInputs<{
    app: AppUniforms;
    opticalCaustics: OpticalCausticsProps;
    opticalPointLights: OpticalPointLightsProps;
    reflectiveMaterial: ReflectiveMaterialProps;
  }>({app: appShaderModule, opticalCaustics, opticalPointLights, reflectiveMaterial});
  readonly metallicShaderInputs = new ShaderInputs<{
    app: AppUniforms;
    opticalCaustics: OpticalCausticsProps;
    opticalPointLights: OpticalPointLightsProps;
    reflectiveMaterial: ReflectiveMaterialProps;
  }>({app: appShaderModule, opticalCaustics, opticalPointLights, reflectiveMaterial});
  readonly emissiveShaderInputs = new ShaderInputs<{
    app: AppUniforms;
    emissiveMaterial: EmissiveMaterialProps;
  }>({app: appShaderModule, emissiveMaterial});
  readonly glassShaderInputs = new ShaderInputs<{
    app: AppUniforms;
    glassMaterial: GlassMaterialProps;
    glassTransmission: GlassTransmissionProps;
    opticalPointLights: OpticalPointLightsProps;
  }>({app: appShaderModule, glassMaterial, glassTransmission, opticalPointLights});
  readonly aBufferShaderInputs = new ShaderInputs<{
    app: AppUniforms;
    glassMaterial: GlassMaterialProps;
    glassTransmission: GlassTransmissionProps;
    opticalPointLights: OpticalPointLightsProps;
    aBuffer: ABufferShaderModuleProps;
  }>({app: appShaderModule, glassMaterial, glassTransmission, opticalPointLights, aBuffer});
  readonly weightedBlendedShaderInputs = new ShaderInputs<{
    app: AppUniforms;
    glassMaterial: GlassMaterialProps;
    glassTransmission: GlassTransmissionProps;
    opticalPointLights: OpticalPointLightsProps;
    wboit: WBOITShaderModuleProps;
  }>({app: appShaderModule, glassMaterial, glassTransmission, opticalPointLights, wboit});
  readonly pickingShaderInputs = new ShaderInputs<{
    app: AppUniforms;
    picking: typeof colorPicking.props;
  }>({app: appShaderModule, picking: colorPicking});
  readonly settingsPanel: ExampleSettingsPanelManager;
  readonly panels: ExamplePanelManager;
  readonly sceneColorFormat: TextureFormatColor;
  readonly sceneFramebuffer: Framebuffer;
  readonly glassBackfaceFramebuffer: Framebuffer;
  readonly postprocessingRenderer: ShaderPassRenderer;
  readonly aBufferRenderer: ABufferRenderer | null;
  readonly weightedBlendedRenderer: WBOITRenderer | null;
  sceneTexture: Texture;
  refractionTexture: Texture;
  glassBackfaceTexture: Texture;
  readonly environmentTexture: Texture;
  readonly links: InstancedMesh<{
    app: AppUniforms;
    opticalCaustics: OpticalCausticsProps;
    opticalPointLights: OpticalPointLightsProps;
    reflectiveMaterial: ReflectiveMaterialProps;
  }>;
  readonly hosts: InstancedMesh<{
    app: AppUniforms;
    opticalCaustics: OpticalCausticsProps;
    opticalPointLights: OpticalPointLightsProps;
    reflectiveMaterial: ReflectiveMaterialProps;
  }>;
  readonly pickingHosts: InstancedMesh<{
    app: AppUniforms;
    picking: typeof colorPicking.props;
  }>;
  readonly pickingSwitches: InstancedMesh<{
    app: AppUniforms;
    picking: typeof colorPicking.props;
  }>;
  readonly pickingManager: PickingManager;
  readonly pickableNodes: PickableNetworkNode[];
  readonly glassInstances: GlassInstance[];
  readonly glassGroups: GlassRenderGroup[];
  readonly glassScenegraph: GroupNode;
  readonly originalGlassColors: Color[];
  readonly congestedSwitchIndices = new Set<number>();
  readonly failedSwitchIndices = new Set<number>();
  readonly recoveringSwitchIndices = new Set<number>();
  readonly conversationRoutes: ConversationRoute[];
  readonly pathFocuses: NetworkPathFocus[];
  readonly networkLinks: NetworkLink[];
  readonly linkColors: Float32Array;
  readonly redLinkTrafficStrengths: Float32Array;
  readonly greenLinkTrafficStrengths: Float32Array;
  readonly blueLinkTrafficStrengths: Float32Array;
  readonly packets: InstancedMesh<{
    app: AppUniforms;
    emissiveMaterial: EmissiveMaterialProps;
  }>;
  readonly packetTrails: InstancedMesh<{
    app: AppUniforms;
    emissiveMaterial: EmissiveMaterialProps;
  }>;
  readonly linkPulses: InstancedMesh<{
    app: AppUniforms;
    emissiveMaterial: EmissiveMaterialProps;
  }>;
  readonly endpointSignals: InstancedMesh<{
    app: AppUniforms;
    emissiveMaterial: EmissiveMaterialProps;
  }>;
  readonly switchFlashes: InstancedMesh<{
    app: AppUniforms;
    emissiveMaterial: EmissiveMaterialProps;
  }>;
  readonly switchRipples: InstancedMesh<{
    app: AppUniforms;
    emissiveMaterial: EmissiveMaterialProps;
  }>;
  readonly switchTransitionVisuals: InstancedMesh<{
    app: AppUniforms;
    emissiveMaterial: EmissiveMaterialProps;
  }>;
  readonly storyPackets: InstancedMesh<{
    app: AppUniforms;
    emissiveMaterial: EmissiveMaterialProps;
  }>;
  readonly packetDefinitions: Packet[];
  readonly packetMatrices: Float32Array;
  readonly packetTrailMatrices: Float32Array;
  readonly packetTrailColors: Float32Array;
  readonly linkPulseMatrices: Float32Array;
  readonly linkPulseColors: Float32Array;
  readonly endpointSignalMatrices = new Float32Array(MAX_ENDPOINT_SIGNALS * 16);
  readonly endpointSignalColors = new Float32Array(MAX_ENDPOINT_SIGNALS * 4);
  switchArrivalEvents: SwitchArrival[];
  readonly switchFlashMatrices: Float32Array;
  readonly switchFlashColors: Float32Array;
  readonly switchFlashStrengths: Float32Array;
  readonly switchRippleMatrices: Float32Array;
  readonly switchRippleColors: Float32Array;
  readonly switchRippleAges: Float32Array;
  readonly switchTransitionMatrices = new Float32Array(MAX_SWITCH_TRANSITION_WAVES * 16);
  readonly switchTransitionColors = new Float32Array(MAX_SWITCH_TRANSITION_WAVES * 4);
  readonly switchTransitionWaves: NetworkSwitchTransitionWave[] = [];
  readonly causticLensLightColors = new Float32Array(SWITCH_POSITIONS.length * 3);
  readonly storyPacketMatrices = new Float32Array(MAX_STORY_PACKET_INSTANCES * 16);
  readonly storyPacketColors = new Float32Array(MAX_STORY_PACKET_INSTANCES * 4);
  readonly networkPacketEvents: NetworkPacketEvent[] = [];
  readonly planeHighlightStrengths = new Float32Array(NETWORK_SWITCH_PLANE_COUNT);
  readonly pathHighlightStrengths = new Float32Array(SPINE_POSITIONS.length);
  private readonly switchPlaneIndices = new Map<number, number>(
    Array.from({length: NETWORK_SWITCH_PLANE_COUNT}, (_, planeIndex) => planeIndex).flatMap(
      planeIndex =>
        getNetworkPlaneSwitchIndices(planeIndex).map(
          switchIndex => [switchIndex, planeIndex] as const
        )
    )
  );
  private endpointSignalDefinitions: NetworkEndpointSignal[] = [];
  private queuedPacketDefinitions: NetworkQueuedPacket[] = [];
  orbitControls: OrbitControls | null = null;
  nodePopup: NetworkNodePopup | null = null;
  mrcPanel: NetworkInfoPanel | null = null;
  opticsPanel: NetworkInfoPanel | null = null;
  storyControls: NetworkStoryControls | null = null;

  private canvas: HTMLCanvasElement | null = null;
  private pendingPickRequest: NetworkNodePickRequest | null = null;
  private readonly detectingSwitchTimes = new Map<number, number>();
  private readonly nextCongestionTrimTimes = new Map<number, number>();
  private readonly nextSwitchProbeTimes = new Map<number, number>();
  private readonly recoveryProbeCompletionTimes = new Map<number, number>();
  private readonly recoveryProbeConfirmations = new Map<number, NetworkPacketEvent>();
  private animationTime = 0;
  private rawAnimationTime = 0;
  private animationTimeOffset = 0;
  private animationPausedAt: number | null = null;
  private rawAnimationPausedAt: number | null = null;
  private droppedPacketCount = 0;
  private trimmedPacketCount = 0;
  private pickingInProgress = false;
  private pointerDownPosition: [number, number] | null = null;
  private pointerSequence = 0;
  private previousLinkTrafficTime: number | null = null;
  private previousCausticTime: number | null = null;
  private autorotationScenarioStartedAt: number | null = null;
  private guidedStoryChapterIndex = 0;
  private guidedStoryChapterStartedAt = 0;
  private guidedStoryElapsedAtPause = 0;
  private guidedStoryPlaying = false;
  private guidedStoryStarted = false;
  private guidedStoryCamera: NetworkStoryCamera | null = null;
  private guidedStoryCameraTransitionEndsAt = 0;
  private guidedStoryPreviousCameraTime: number | null = null;
  private currentStoryBeat: NetworkStoryBeat | null = null;
  private highlightedPlaneIndex: number | null = null;
  private highlightedPathIndex: number | null = null;
  private manualHighlightedPlaneIndex: number | null = null;
  private manualHighlightedPathIndex: number | null = null;
  private storyHighlightedPlaneIndex: number | null = null;
  private storyHighlightedPathIndex: number | null = null;
  private previousPlaneHighlightTime: number | null = null;
  private previousVisualIntensityTime: number | null = null;
  private currentVisualIntensity = DEFAULT_NETWORK_OPTICS_LEVEL;
  private opticsProfile: NetworkOpticsProfile = makeNetworkOpticsProfile(
    DEFAULT_NETWORK_OPTICS_LEVEL
  );
  private readonly dynamicRangeOptions: Omit<
    NetworkDynamicRangeOptions,
    'highlightBoost' | 'visualIntensity'
  >;
  private dynamicRangeProfile: NetworkDynamicRangeProfile;
  private readonly reflectionLab: boolean;

  transparencyMode: TransparencyMode;
  visualIntensity = DEFAULT_NETWORK_OPTICS_LEVEL;
  adaptiveRouting = true;
  speed = 0.85;
  orbit = 0.08;
  glassIndexOfRefraction = 1.48;
  glassRoughness = 0.045;
  glassDispersion = 0.33;
  glassThickness = 1.16;
  glassRefractionStrength = 1.32;
  glassFresnelStrength = 1.08;
  glassClearcoatStrength = 0.84;
  glassIridescenceStrength = 0.16;
  glassInternalReflectionStrength = 0.46;
  glassTransmissionStrength = 1.32;
  glassEnvironmentIntensity = 0.86;
  glassEnvironmentPrefilterStrength = 1;
  glassContactShadowStrength = 0.36;
  glassVolumeThickness = 1;
  glassRoughTransmissionStrength = 0.2;
  glassSpectralAbsorptionStrength = 0.28;
  glassThinFilmThickness = 420;
  glassThinFilmStrength = 0.22;
  glassVolumeScatteringStrength = 0.22;
  glassDynamicReflectionStrength = 0.29;
  glassSecondaryBounceStrength = 0.34;
  glassFaultDistortionStrength = 0.42;
  packetEmission = 5.2;
  packetTrailLength = 0.19;
  packetTrailIntensity = 0.55;
  switchFlashIntensity = 0.8;
  switchRippleIntensity = 0.44;
  switchTransitionIntensity = 0.62;
  packetLightIntensity = 0.86;
  packetLightRadius = 1.05;
  linkTrafficGlow = 0.58;
  linkPulseLength = 0.31;
  linkPulseIntensity = 0.48;
  endpointSignalIntensity = 0.54;
  congestionPressureIntensity = 0.32;
  causticIntensity = 0.48;
  causticFocus = 1.15;
  bloomIntensity = 1.7;
  bloomThreshold = 0.42;
  exposure = 0.96;
  hdrHighlightBoost = DEFAULT_NETWORK_HDR_HIGHLIGHT_BOOST;

  constructor({device, width, height}: AnimationProps) {
    super();

    const searchParams = new URLSearchParams(window.location.search);
    this.reflectionLab = searchParams.get('lab') === 'reflection';
    const requestedOrbit = searchParams.get('orbit');
    if (requestedOrbit !== null && Number.isFinite(Number(requestedOrbit))) {
      this.orbit = Math.max(0, Math.min(Number(requestedOrbit), 0.5));
    }

    this.sceneColorFormat = getSceneColorFormat(device);
    this.dynamicRangeOptions = {
      deviceType: device.type,
      displaySupportsHighDynamicRange:
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(dynamic-range: high)').matches,
      presentationColorFormat: String(device.preferredColorFormat),
      sceneColorFormat: this.sceneColorFormat
    };
    this.dynamicRangeProfile = makeNetworkDynamicRangeProfile({
      ...this.dynamicRangeOptions,
      highlightBoost: this.hdrHighlightBoost,
      visualIntensity: this.currentVisualIntensity
    });
    const supportsABuffer = getABufferSupport(device).supported;
    const supportsWeightedBlending = getWBOITSupport(device).supported;
    const preferredTransparencyMode = supportsABuffer
      ? 'a-buffer'
      : supportsWeightedBlending
        ? 'weighted-blended'
        : 'sorted-alpha';
    const requestedTransparencyMode = searchParams.get('transparency');
    this.transparencyMode =
      isTransparencyMode(requestedTransparencyMode) &&
      (requestedTransparencyMode === 'sorted-alpha' ||
        (requestedTransparencyMode === 'a-buffer' && supportsABuffer) ||
        (requestedTransparencyMode === 'weighted-blended' && supportsWeightedBlending))
        ? requestedTransparencyMode
        : preferredTransparencyMode;
    this.aBufferRenderer = supportsABuffer
      ? new ABufferRenderer(device, {
          averageFragmentsPerPixel: 4,
          maxFragmentsPerPixel: 20,
          maxBufferByteLength: 64 * 1024 * 1024,
          colorFormat: this.sceneColorFormat
        })
      : null;
    this.weightedBlendedRenderer = supportsWeightedBlending
      ? new WBOITRenderer(device, {colorFormat: this.sceneColorFormat})
      : null;
    this.sceneTexture = makeSceneTexture(device, width, height, this.sceneColorFormat);
    this.refractionTexture = makeRefractionTexture(device, width, height, this.sceneColorFormat);
    this.sceneFramebuffer = device.createFramebuffer({
      id: 'packet-spraying-scene-framebuffer',
      width,
      height,
      colorAttachments: [this.sceneTexture],
      depthStencilAttachment: 'depth24plus'
    });
    this.glassBackfaceTexture = makeBackfaceTexture(device, width, height, this.sceneColorFormat);
    this.glassBackfaceFramebuffer = device.createFramebuffer({
      id: 'packet-spraying-glass-backface-framebuffer',
      width,
      height,
      colorAttachments: [this.glassBackfaceTexture],
      depthStencilAttachment: 'depth24plus'
    });
    this.environmentTexture = makeStudioEnvironmentTexture(device);
    this.postprocessingRenderer = new ShaderPassRenderer(device, {
      shaderPasses: [makeBloomPipeline(this.sceneColorFormat), toneMapping],
      colorFormat: this.sceneColorFormat
    });

    this.conversationRoutes = makeConversationRoutes();
    this.pathFocuses = SPINE_POSITIONS.map((_, pathIndex) =>
      makeNetworkPathFocus(this.conversationRoutes, pathIndex)
    ).filter((focus): focus is NetworkPathFocus => focus !== null);
    this.networkLinks = makeLinks(this.conversationRoutes);
    this.linkColors = flattenColors(this.networkLinks.map(({color}) => color));
    this.redLinkTrafficStrengths = new Float32Array(this.networkLinks.length);
    this.greenLinkTrafficStrengths = new Float32Array(this.networkLinks.length);
    this.blueLinkTrafficStrengths = new Float32Array(this.networkLinks.length);
    this.links = new InstancedMesh(device, this.reflectiveShaderInputs, {
      id: 'packet-spraying-links',
      geometry: new CylinderGeometry({radius: 1, height: 1, nradial: 16, nvertical: 1}),
      matrices: this.reflectionLab
        ? makeHiddenMatrices(this.networkLinks.length)
        : flattenMatrices(this.networkLinks.map(link => makeLinkMatrix(link, 0.09))),
      colors: this.reflectionLab
        ? makeTransparentColors(this.networkLinks.length)
        : this.linkColors,
      transparent: true,
      reflective: true
    });

    this.hosts = new InstancedMesh(device, this.metallicShaderInputs, {
      id: 'packet-spraying-hosts',
      geometry: new CubeGeometry({indices: true}),
      matrices: this.reflectionLab
        ? makeReflectionLabHostMatrices()
        : flattenMatrices(
            HOST_POSITIONS.map(position => makeObjectMatrix(position, HOST_HALF_EXTENTS))
          ),
      colors: this.reflectionLab
        ? makeReflectionLabHostColors()
        : flattenColors(HOST_POSITIONS.map((_, hostIndex) => makeHostColor(hostIndex))),
      reflective: true
    });

    this.glassInstances = this.reflectionLab
      ? makeReflectionLabGlassInstances()
      : makeGlassInstances();
    this.originalGlassColors = this.glassInstances.map(instance => [...instance.color] as Color);
    this.pickableNodes = makePickableNetworkNodes();
    this.pickingManager = new PickingManager(device, {
      shaderInputs: this.pickingShaderInputs,
      mode: 'color'
    });
    this.pickingHosts = new InstancedMesh(device, this.pickingShaderInputs, {
      id: 'packet-spraying-picking-hosts',
      geometry: new CubeGeometry({indices: true}),
      matrices: flattenMatrices(
        HOST_POSITIONS.map(position => makeObjectMatrix(position, HOST_HALF_EXTENTS))
      ),
      colors: flattenColors(HOST_POSITIONS.map((_, index) => [index, 0, 0, 1])),
      pickable: true
    });
    this.pickingSwitches = new InstancedMesh(device, this.pickingShaderInputs, {
      id: 'packet-spraying-picking-switches',
      geometry: new SphereGeometry({radius: 1, nlat: 16, nlong: 24}),
      matrices: flattenMatrices(this.glassInstances.map(instance => instance.matrix)),
      colors: flattenColors(
        this.glassInstances.map((_, index) => [HOST_POSITIONS.length + index, 0, 0, 1])
      ),
      pickable: true
    });
    this.glassGroups = makeSwitchGroups().map(({id, switchIndices}): GlassRenderGroup => {
      const instances = switchIndices.map(switchIndex => this.glassInstances[switchIndex]);
      const matrices = flattenMatrices(instances.map(instance => instance.matrix));
      const colors = flattenColors(instances.map(instance => instance.color));
      const makeGlassMeshOptions = (mode: string, transparencyMode: TransparencyMode) => ({
        id: `packet-spraying-${id}-${mode}-glass`,
        geometry: new SphereGeometry({radius: 1, nlat: 16, nlong: 24}),
        matrices,
        colors,
        glass: true,
        sceneTexture: this.refractionTexture,
        sceneDepthTexture: this.sceneFramebuffer.depthStencilAttachment!.texture,
        backfaceTexture: this.glassBackfaceTexture,
        environmentTexture: this.environmentTexture,
        transparencyMode
      });

      const sorted = new InstancedMesh(
        device,
        this.glassShaderInputs,
        makeGlassMeshOptions('sorted', 'sorted-alpha')
      );

      return {
        id,
        instances,
        switchIndices,
        node: new ModelNode({
          id,
          model: sorted.model,
          bounds: [
            [-1, -1, -1],
            [1, 1, 1]
          ],
          instanceMatrices: instances.map(instance => instance.matrix)
        }),
        backfaces: new InstancedMesh(device, this.backfaceShaderInputs, {
          id: `packet-spraying-${id}-glass-backfaces`,
          geometry: new SphereGeometry({radius: 1, nlat: 16, nlong: 24}),
          matrices,
          colors,
          backface: true,
          colorAttachmentFormat: this.sceneColorFormat
        }),
        sorted,
        aBuffer: supportsABuffer
          ? new InstancedMesh(
              device,
              this.aBufferShaderInputs,
              makeGlassMeshOptions('a-buffer', 'a-buffer')
            )
          : null,
        weightedBlended: supportsWeightedBlending
          ? new InstancedMesh(
              device,
              this.weightedBlendedShaderInputs,
              makeGlassMeshOptions('weighted', 'weighted-blended')
            )
          : null
      };
    });
    this.glassScenegraph = new GroupNode({
      id: 'packet-spraying-glass-scenegraph',
      children: this.glassGroups.map(group => group.node)
    });

    this.packetDefinitions = makePackets(this.conversationRoutes);
    this.packetMatrices = new Float32Array(this.packetDefinitions.length * 16);
    this.packetTrailMatrices = new Float32Array(this.packetDefinitions.length * 16);
    this.linkPulseMatrices = new Float32Array(this.packetDefinitions.length * 16);
    this.linkPulseColors = new Float32Array(this.packetDefinitions.length * 4);
    this.packetTrailColors = flattenColors(
      this.packetDefinitions.map(packet => makeBalancedEmissionColor(packet.color, 0.42))
    );
    this.switchArrivalEvents = makeSwitchArrivals(this.packetDefinitions);
    const switchFlashCount = this.glassInstances.length * CONVERSATIONS.length;
    this.switchFlashMatrices = new Float32Array(switchFlashCount * 16);
    this.switchFlashColors = new Float32Array(switchFlashCount * 4);
    this.switchFlashStrengths = new Float32Array(switchFlashCount);
    this.switchRippleMatrices = new Float32Array(switchFlashCount * 16);
    this.switchRippleColors = new Float32Array(switchFlashCount * 4);
    this.switchRippleAges = new Float32Array(switchFlashCount);
    this.updatePacketVisuals(0);
    this.packets = new InstancedMesh(device, this.emissiveShaderInputs, {
      id: 'packet-spraying-packets',
      geometry: new SphereGeometry({radius: 1, nlat: 8, nlong: 12}),
      matrices: this.packetMatrices,
      colors: this.reflectionLab
        ? makeReflectionLabPacketColors(
            this.packetDefinitions.length,
            REFLECTION_LAB_PACKET_COLOR[3]
          )
        : flattenColors(
            this.packetDefinitions.map(packet =>
              makeBalancedEmissionColor(packet.color, packet.alpha)
            )
          ),
      emissive: true
    });
    this.packetTrails = new InstancedMesh(device, this.emissiveShaderInputs, {
      id: 'packet-spraying-packet-trails',
      geometry: new TruncatedConeGeometry({
        bottomRadius: 0.14,
        topRadius: 1,
        height: 1,
        nradial: 10,
        nvertical: 3
      }),
      matrices: this.packetTrailMatrices,
      colors: this.packetTrailColors,
      additive: true,
      trail: true
    });
    this.linkPulses = new InstancedMesh(device, this.emissiveShaderInputs, {
      id: 'packet-spraying-directional-link-pulses',
      geometry: new TruncatedConeGeometry({
        bottomRadius: 0.2,
        topRadius: 1,
        height: 1,
        nradial: 10,
        nvertical: 3
      }),
      matrices: this.linkPulseMatrices,
      colors: this.linkPulseColors,
      additive: true,
      trail: true
    });
    this.endpointSignals = new InstancedMesh(device, this.emissiveShaderInputs, {
      id: 'packet-spraying-endpoint-activity',
      geometry: new SphereGeometry({radius: 1, nlat: 10, nlong: 18}),
      matrices: this.endpointSignalMatrices,
      colors: this.endpointSignalColors,
      additive: true,
      emissive: true
    });
    this.switchFlashes = new InstancedMesh(device, this.emissiveShaderInputs, {
      id: 'packet-spraying-switch-arrival-flashes',
      geometry: new SphereGeometry({radius: 1, nlat: 8, nlong: 12}),
      matrices: this.switchFlashMatrices,
      colors: this.switchFlashColors,
      additive: true,
      emissive: true
    });
    this.switchRipples = new InstancedMesh(device, this.emissiveShaderInputs, {
      id: 'packet-spraying-switch-arrival-ripples',
      geometry: new SphereGeometry({radius: 1, nlat: 12, nlong: 18}),
      matrices: this.switchRippleMatrices,
      colors: this.switchRippleColors,
      additive: true,
      emissive: true
    });
    this.switchTransitionVisuals = new InstancedMesh(device, this.emissiveShaderInputs, {
      id: 'packet-spraying-switch-transition-waves',
      geometry: new SphereGeometry({radius: 1, nlat: 12, nlong: 18}),
      matrices: this.switchTransitionMatrices,
      colors: this.switchTransitionColors,
      additive: true,
      emissive: true
    });
    this.storyPackets = new InstancedMesh(device, this.emissiveShaderInputs, {
      id: 'packet-spraying-network-story-packets',
      geometry: new SphereGeometry({radius: 1, nlat: 8, nlong: 12}),
      matrices: this.storyPacketMatrices,
      colors: this.storyPacketColors,
      additive: true,
      emissive: true
    });

    this.settingsPanel = new ExampleSettingsPanelManager({
      id: 'packet-spraying-settings',
      schema: makeSettingsSchema(supportsABuffer, supportsWeightedBlending),
      settings: {
        transparencyMode: this.transparencyMode,
        visualIntensity: this.visualIntensity,
        adaptiveRouting: this.adaptiveRouting,
        speed: this.speed,
        orbit: this.orbit,
        glassIndexOfRefraction: this.glassIndexOfRefraction,
        glassRoughness: this.glassRoughness,
        glassDispersion: this.glassDispersion,
        glassThickness: this.glassThickness,
        glassRefractionStrength: this.glassRefractionStrength,
        glassFresnelStrength: this.glassFresnelStrength,
        glassClearcoatStrength: this.glassClearcoatStrength,
        glassIridescenceStrength: this.glassIridescenceStrength,
        glassInternalReflectionStrength: this.glassInternalReflectionStrength,
        glassTransmissionStrength: this.glassTransmissionStrength,
        glassEnvironmentIntensity: this.glassEnvironmentIntensity,
        glassEnvironmentPrefilterStrength: this.glassEnvironmentPrefilterStrength,
        glassContactShadowStrength: this.glassContactShadowStrength,
        glassVolumeThickness: this.glassVolumeThickness,
        glassRoughTransmissionStrength: this.glassRoughTransmissionStrength,
        glassSpectralAbsorptionStrength: this.glassSpectralAbsorptionStrength,
        glassThinFilmThickness: this.glassThinFilmThickness,
        glassThinFilmStrength: this.glassThinFilmStrength,
        glassVolumeScatteringStrength: this.glassVolumeScatteringStrength,
        glassDynamicReflectionStrength: this.glassDynamicReflectionStrength,
        glassSecondaryBounceStrength: this.glassSecondaryBounceStrength,
        glassFaultDistortionStrength: this.glassFaultDistortionStrength,
        packetEmission: this.packetEmission,
        packetTrailLength: this.packetTrailLength,
        packetTrailIntensity: this.packetTrailIntensity,
        switchFlashIntensity: this.switchFlashIntensity,
        switchRippleIntensity: this.switchRippleIntensity,
        switchTransitionIntensity: this.switchTransitionIntensity,
        packetLightIntensity: this.packetLightIntensity,
        packetLightRadius: this.packetLightRadius,
        linkTrafficGlow: this.linkTrafficGlow,
        linkPulseLength: this.linkPulseLength,
        linkPulseIntensity: this.linkPulseIntensity,
        endpointSignalIntensity: this.endpointSignalIntensity,
        congestionPressureIntensity: this.congestionPressureIntensity,
        causticIntensity: this.causticIntensity,
        causticFocus: this.causticFocus,
        bloomIntensity: this.bloomIntensity,
        bloomThreshold: this.bloomThreshold,
        exposure: this.exposure,
        hdrHighlightBoost: this.hdrHighlightBoost
      },
      onSettingsChange: this.handleSettingsChange
    });
    this.panels = new ExamplePanelManager({panel: this.makePanel()});
    this.panels.mount();
  }

  override async onInitialize({canvas, device}: AnimationProps): Promise<void> {
    if (canvas instanceof HTMLCanvasElement) {
      this.canvas = canvas;
      canvas.dataset.packetSprayingDevice = device.info.type;
      canvas.dataset.packetSprayingGpu = device.info.gpu;
      canvas.dataset.packetSprayingGpuArchitecture = device.info.gpuArchitecture || '';
      canvas.dataset.packetSprayingAdapterVendor = device.info.vendor;
      canvas.dataset.packetSprayingFallback = String(Boolean(device.info.fallback));
      canvas.dataset.packetSprayingDynamicRange = this.dynamicRangeProfile.displayMode;
      canvas.dataset.packetSprayingTransparencyMode = this.transparencyMode;
      canvas.dataset.packetSprayingLab = this.reflectionLab ? 'reflection' : '';
      canvas.dataset.packetSprayingSceneColorFormat = this.sceneColorFormat;
      canvas.dataset.packetSprayingEnvironmentMipLevels = String(this.environmentTexture.mipLevels);
      canvas.dataset.packetSprayingHighlightBoost =
        this.dynamicRangeProfile.highlightBoost.toFixed(3);
      canvas.dataset.packetSprayingMaximumLuminance =
        this.dynamicRangeProfile.maximumLuminance.toFixed(2);
      canvas.dataset.packetSprayingGlassGroups = this.glassGroups.map(group => group.id).join(',');
      this.nodePopup = new NetworkNodePopup(canvas);
      this.orbitControls = new OrbitControls(canvas, {
        target: this.reflectionLab ? [0, -0.1, 0] : [0, -0.9, 0],
        distance: this.reflectionLab ? 4.2 : 12.7,
        yaw: this.reflectionLab ? 0.58 : 0.52,
        pitch: this.reflectionLab ? 0.5 : 0.59,
        minDistance: this.reflectionLab ? 2.4 : 6,
        maxDistance: 25,
        minPitch: 0.12,
        maxPitch: 1.3,
        enablePan: true,
        autoRotate: this.orbit > 0,
        autoRotateSpeed: this.orbit
      });
      canvas.addEventListener('pointermove', this.handlePointerMove);
      canvas.addEventListener('pointerdown', this.handlePointerDown);
      canvas.addEventListener('pointerleave', this.handlePointerLeave);
      canvas.addEventListener('click', this.handleSwitchClick);
      this.mrcPanel = new NetworkInfoPanel(canvas, {
        accessibleLabel: 'MRC network protocol information',
        content: PACKET_SPRAYING_BACKGROUND_HTML,
        id: 'mrc',
        onClose: () => this.setMrcPanelVisible(false),
        title: 'MULTIPATH RELIABLE CONNECTION'
      });
      this.opticsPanel = new NetworkInfoPanel(canvas, {
        accessibleLabel: 'GPU optics rendering techniques',
        content: PACKET_SPRAYING_OPTICS_HTML,
        id: 'optics',
        onClose: () => this.setOpticsPanelVisible(false),
        title: 'GPU OPTICS'
      });
      this.storyControls = new NetworkStoryControls(canvas, {
        onNext: () => this.moveGuidedStoryChapter(1),
        onPrevious: () => this.moveGuidedStoryChapter(-1),
        onSelectChapter: chapterIndex => this.selectGuidedStoryChapter(chapterIndex),
        onTogglePlayback: () => this.setGuidedStoryPlaying(!this.guidedStoryPlaying),
        onHighlightPlane: planeIndex => this.setHighlightedPlane(planeIndex),
        onHighlightPath: pathIndex => this.setHighlightedPath(pathIndex),
        onToggleMrc: () =>
          this.setMrcPanelVisible(this.canvas?.dataset.packetSprayingMrcExpanded !== 'true'),
        onToggleOptics: () =>
          this.setOpticsPanelVisible(this.canvas?.dataset.packetSprayingOpticsExpanded !== 'true'),
        onHdrHighlightBoostChange: highlightBoost => this.setHdrHighlightBoost(highlightBoost),
        onVisualIntensityChange: level => this.setVisualIntensity(level),
        hdrHighlightBoost: this.hdrHighlightBoost,
        visualIntensity: this.visualIntensity
      });
      this.storyControls.setDynamicRange(this.dynamicRangeProfile);
      canvas.dataset.packetSprayingHighlightedPlane = '';
      canvas.dataset.packetSprayingHighlightedPath = '';
      canvas.dataset.packetSprayingPlaneHighlightStrength = '0.000';
      canvas.dataset.packetSprayingPathHighlightStrength = '0.000';
      canvas.dataset.packetSprayingHighlightedSwitches = '0';
      canvas.dataset.packetSprayingHighlightedPathSwitches = '0';
      canvas.dataset.packetSprayingHighlightedPathLinks = '0';
      canvas.dataset.packetSprayingQueuedPackets = '0';
      canvas.dataset.packetSprayingStoryBeat = '';
      canvas.dataset.packetSprayingMrcExpanded = 'false';
      canvas.dataset.packetSprayingOpticsExpanded = 'false';
      canvas.dataset.packetSprayingAutomaticScenarios = 'false';
      canvas.dataset.packetSprayingScenarioProgress = '0.000';
      canvas.dataset.packetSprayingVisualIntensity = this.visualIntensity.toFixed(2);
      canvas.dataset.packetSprayingVisualTarget = this.visualIntensity.toFixed(2);
      canvas.dataset.packetSprayingVisualStyle = this.opticsProfile.label;
      canvas.dataset.packetSprayingVisualBloom = this.opticsProfile.bloom.toFixed(2);
      canvas.dataset.packetSprayingVisualCaustics = this.opticsProfile.caustics.toFixed(2);
      canvas.dataset.packetSprayingVisualRefraction = this.opticsProfile.refraction.toFixed(2);
      canvas.dataset.packetSprayingAnimationPaused = 'false';
      canvas.dataset.packetSprayingAnimationTime = this.animationTime.toFixed(3);
      this.updateGuidedStoryControls();
      this.updateNetworkTelemetry();
      this.updateFailureAccessibility();

      if (new URLSearchParams(window.location.search).get('story') === '1') {
        this.setGuidedStoryPlaying(true);
      }
    }
  }

  override onRender({device, width, height, aspect, time}: AnimationProps): void {
    this.resizeSceneFramebuffer(width, height);
    this.updateVisualIntensity(time / 1000);
    this.updateAnimationClock((time / 1000) * this.speed);
    this.updateAutorotationScenario(time / 1000);
    this.updateGuidedStory(this.animationTime);
    this.updateSwitchStoryState(this.animationTime);
    this.updateSwitchPressure(this.animationTime);
    this.updatePlaneHighlight(time / 1000);
    this.updatePacketVisuals(this.animationTime);
    this.updateEndpointSignals(this.animationTime);
    this.updateLinkPulseVisuals(this.animationTime);
    this.updateLinkTraffic(this.animationTime);
    this.updateSwitchTransitionVisuals(this.animationTime);
    this.updateStoryPacketVisuals(this.animationTime);
    this.packets.updateMatrices(this.packetMatrices);
    this.packetTrails.updateInstances(this.packetTrailMatrices, this.packetTrailColors);
    this.linkPulses.updateInstances(this.linkPulseMatrices, this.linkPulseColors);
    this.endpointSignals.updateInstances(this.endpointSignalMatrices, this.endpointSignalColors);
    this.switchFlashes.updateInstances(this.switchFlashMatrices, this.switchFlashColors);
    this.switchRipples.updateInstances(this.switchRippleMatrices, this.switchRippleColors);
    this.switchTransitionVisuals.updateInstances(
      this.switchTransitionMatrices,
      this.switchTransitionColors
    );
    this.storyPackets.updateInstances(this.storyPacketMatrices, this.storyPacketColors);

    this.orbitControls?.update(time);
    const eye: Vector3 = this.orbitControls?.getEyePosition() || [5.2, 6.2, 9.1];
    const projectionMatrix = new Matrix4().perspective({
      fovy: radians(getNetworkVerticalFieldOfView(aspect)),
      aspect,
      near: 0.1,
      far: 60
    });
    projectionMatrix[9] = -getNetworkVerticalViewportOffset(aspect);
    const uniforms: AppUniforms = {
      cameraPosition: eye,
      projectionMatrix,
      viewMatrix: new Matrix4().lookAt({
        eye,
        center: this.orbitControls?.props.target || [0, -0.9, 0],
        up: [0, 1, 0]
      })
    };
    const glassMaterialProps: GlassMaterialProps = {
      viewportSize: [width, height],
      sceneColorTexture: this.refractionTexture,
      indexOfRefraction: this.glassIndexOfRefraction,
      roughness: this.glassRoughness,
      dispersion: this.glassDispersion * this.opticsProfile.spectral,
      thickness: this.glassThickness,
      refractionStrength: this.glassRefractionStrength * this.opticsProfile.refraction,
      reflectionStrength: 0.66,
      fresnelStrength:
        this.glassFresnelStrength *
        (0.2 + this.opticsProfile.surface * 0.8) *
        this.dynamicRangeProfile.specularScale,
      clearcoatStrength:
        this.glassClearcoatStrength *
        this.opticsProfile.surface *
        this.dynamicRangeProfile.specularScale,
      iridescenceStrength: this.glassIridescenceStrength * this.opticsProfile.spectral,
      internalReflectionStrength:
        this.glassInternalReflectionStrength *
        this.opticsProfile.surface *
        (0.35 + this.opticsProfile.refraction * 0.65),
      transmissionStrength:
        this.glassTransmissionStrength * (0.5 + this.opticsProfile.refraction * 0.5)
    };
    const glassTransmissionProps: GlassTransmissionProps = {
      viewportSize: [width, height],
      depthRange: [0.1, 60],
      sceneDepthTexture: this.sceneFramebuffer.depthStencilAttachment!.texture,
      backfaceTexture: this.glassBackfaceTexture,
      environmentTexture: this.environmentTexture,
      environmentIntensity:
        this.glassEnvironmentIntensity *
        (0.16 + this.opticsProfile.surface * 0.84) *
        this.dynamicRangeProfile.specularScale,
      environmentMipLevels: this.environmentTexture.mipLevels,
      environmentPrefilterStrength:
        this.glassEnvironmentPrefilterStrength * this.opticsProfile.surface,
      contactShadowStrength: this.glassContactShadowStrength * this.opticsProfile.refraction,
      thicknessStrength: this.glassVolumeThickness * (0.45 + this.opticsProfile.refraction * 0.55),
      roughTransmissionStrength: this.glassRoughTransmissionStrength * this.opticsProfile.spectral,
      spectralAbsorptionStrength:
        this.glassSpectralAbsorptionStrength * this.opticsProfile.spectral,
      thinFilmThickness: this.glassThinFilmThickness,
      thinFilmStrength: this.glassThinFilmStrength * this.opticsProfile.spectral,
      volumeScatteringStrength:
        this.glassVolumeScatteringStrength *
        this.opticsProfile.illumination *
        this.opticsProfile.spectral,
      dynamicReflectionStrength:
        this.glassDynamicReflectionStrength * this.opticsProfile.illumination,
      secondaryBounceStrength: this.glassSecondaryBounceStrength * this.opticsProfile.spectral,
      faultDistortionStrength:
        this.glassFaultDistortionStrength * (0.3 + this.opticsProfile.refraction * 0.7),
      time: this.animationTime
    };
    const packetLights = this.makePacketLights();
    const pointLightProps: OpticalPointLightsProps = {
      lights: packetLights,
      intensity:
        this.packetLightIntensity *
        this.opticsProfile.illumination *
        this.dynamicRangeProfile.illuminationScale
    };
    const causticLenses =
      this.opticsProfile.caustics > 0.002
        ? this.makeCausticLenses(packetLights, this.animationTime)
        : [];
    const causticProps: OpticalCausticsProps = {
      lenses: causticLenses,
      intensity: this.causticIntensity * this.opticsProfile.caustics,
      focus: this.causticFocus
    };
    if (this.canvas) {
      this.canvas.dataset.packetSprayingCausticLenses = String(causticLenses.length);
    }
    const packetEmission =
      this.packetEmission *
      (0.72 + this.opticsProfile.illumination * 0.28) *
      this.dynamicRangeProfile.emissionScale;
    if (this.canvas) {
      this.canvas.dataset.packetSprayingPacketEmission = packetEmission.toFixed(2);
    }
    this.emissiveShaderInputs.setProps({
      app: uniforms,
      emissiveMaterial: {
        intensity: packetEmission,
        rimStrength: 0.12 + this.opticsProfile.surface * 0.2
      }
    });
    this.reflectiveShaderInputs.setProps({
      app: uniforms,
      opticalCaustics: causticProps,
      reflectiveMaterial: {},
      opticalPointLights: pointLightProps
    });
    this.metallicShaderInputs.setProps({
      app: uniforms,
      opticalCaustics: causticProps,
      reflectiveMaterial: {
        roughness: 0.32,
        reflectionStrength: 0.26,
        specularStrength: 0.58,
        opacityScale: 1
      },
      opticalPointLights: pointLightProps
    });
    this.glassShaderInputs.setProps({
      app: uniforms,
      glassMaterial: glassMaterialProps,
      glassTransmission: glassTransmissionProps,
      opticalPointLights: pointLightProps
    });
    this.backfaceShaderInputs.setProps({app: uniforms});

    this.hosts.model.predraw(device.commandEncoder);
    this.packets.model.predraw(device.commandEncoder);
    this.packetTrails.model.predraw(device.commandEncoder);
    this.linkPulses.model.predraw(device.commandEncoder);
    this.endpointSignals.model.predraw(device.commandEncoder);
    this.switchFlashes.model.predraw(device.commandEncoder);
    this.switchRipples.model.predraw(device.commandEncoder);
    this.switchTransitionVisuals.model.predraw(device.commandEncoder);
    this.storyPackets.model.predraw(device.commandEncoder);
    this.links.model.predraw(device.commandEncoder);
    const sceneRenderPass = device.beginRenderPass({
      framebuffer: this.sceneFramebuffer,
      clearColor: [0.003, 0.006, 0.012, 1],
      clearDepth: 1
    });
    this.hosts.model.draw(sceneRenderPass);
    this.packets.model.draw(sceneRenderPass);
    this.packetTrails.model.draw(sceneRenderPass);
    this.linkPulses.model.draw(sceneRenderPass);
    this.endpointSignals.model.draw(sceneRenderPass);
    this.switchFlashes.model.draw(sceneRenderPass);
    this.switchRipples.model.draw(sceneRenderPass);
    this.switchTransitionVisuals.model.draw(sceneRenderPass);
    this.storyPackets.model.draw(sceneRenderPass);
    this.links.model.draw(sceneRenderPass);
    sceneRenderPass.end();

    let outputTexture = this.sceneTexture;
    const sortedGroups = this.sortGlassGroups(uniforms.viewMatrix);
    if (this.canvas) {
      this.canvas.dataset.packetSprayingGlassGroupOrder = sortedGroups
        .map(group => group.id)
        .join(',');
    }

    for (const group of sortedGroups) {
      group.backfaces.model.predraw(device.commandEncoder);
      const backfaceRenderPass = device.beginRenderPass({
        framebuffer: this.glassBackfaceFramebuffer,
        clearColor: [0, 0, 0, 0],
        clearDepth: 0
      });
      group.backfaces.model.draw(backfaceRenderPass);
      backfaceRenderPass.end();

      device.commandEncoder.copyTextureToTexture({
        sourceTexture: outputTexture,
        destinationTexture: this.refractionTexture
      });

      if (this.transparencyMode === 'a-buffer' && this.aBufferRenderer && group.aBuffer) {
        outputTexture = this.aBufferRenderer.render({
          sourceTexture: outputTexture,
          opaqueDepthTexture: this.sceneFramebuffer.depthStencilAttachment!,
          prepareTranslucent: ({commandEncoder, shaderModuleProps, captureParameters}) => {
            this.aBufferShaderInputs.setProps({
              app: uniforms,
              glassMaterial: glassMaterialProps,
              glassTransmission: glassTransmissionProps,
              opticalPointLights: pointLightProps,
              aBuffer: shaderModuleProps
            });
            group.aBuffer?.model.setParameters({...GLASS_PARAMETERS, ...captureParameters});
            group.aBuffer?.model.predraw(commandEncoder);
          },
          drawTranslucent: renderPass => {
            group.aBuffer?.model.draw(renderPass);
          }
        });
      } else if (
        this.transparencyMode === 'weighted-blended' &&
        this.weightedBlendedRenderer &&
        group.weightedBlended
      ) {
        outputTexture = this.weightedBlendedRenderer.render({
          sourceTexture: outputTexture,
          prepareOpaqueDepth: commandEncoder => {
            this.hosts.model.predraw(commandEncoder);
            this.packets.model.predraw(commandEncoder);
          },
          drawOpaqueDepth: renderPass => {
            this.hosts.model.draw(renderPass);
            this.packets.model.draw(renderPass);
          },
          prepareTranslucent: ({commandEncoder, shaderModuleProps, captureParameters}) => {
            this.weightedBlendedShaderInputs.setProps({
              app: uniforms,
              glassMaterial: glassMaterialProps,
              glassTransmission: glassTransmissionProps,
              opticalPointLights: pointLightProps,
              wboit: shaderModuleProps
            });
            group.weightedBlended?.model.setParameters({
              ...GLASS_PARAMETERS,
              ...captureParameters
            });
            group.weightedBlended?.model.predraw(commandEncoder);
          },
          drawTranslucent: renderPass => {
            group.weightedBlended?.model.draw(renderPass);
          }
        });
      } else {
        this.sortGlassInstances(group, eye);
        group.sorted.model.predraw(device.commandEncoder);
        const glassRenderPass = device.beginRenderPass({
          framebuffer: this.sceneFramebuffer,
          clearColor: false,
          clearDepth: false
        });
        group.sorted.model.draw(glassRenderPass);
        glassRenderPass.end();
      }
    }

    this.postprocessingRenderer.renderToScreen({
      sourceTexture: outputTexture,
      uniforms: {
        bloomExtract: {
          threshold:
            this.sceneColorFormat === 'rgba16float'
              ? this.bloomThreshold * this.dynamicRangeProfile.bloomThresholdScale
              : Math.max(this.bloomThreshold, 0.58)
        },
        bloomBlur: {radius: 4},
        bloomComposite: {
          intensity:
            this.bloomIntensity *
            this.opticsProfile.bloom *
            this.dynamicRangeProfile.bloomIntensityScale
        },
        toneMapping: {
          exposure: this.exposure * this.dynamicRangeProfile.exposureScale,
          maximumLuminance: this.dynamicRangeProfile.maximumLuminance
        }
      }
    });

    this.pickHoveredNode(device, uniforms);
  }

  override onFinalize(): void {
    this.pointerSequence++;
    this.pendingPickRequest = null;
    this.canvas?.removeEventListener('pointermove', this.handlePointerMove);
    this.canvas?.removeEventListener('pointerdown', this.handlePointerDown);
    this.canvas?.removeEventListener('pointerleave', this.handlePointerLeave);
    this.canvas?.removeEventListener('click', this.handleSwitchClick);
    this.nodePopup?.destroy();
    this.mrcPanel?.destroy();
    this.opticsPanel?.destroy();
    this.storyControls?.destroy();
    this.settingsPanel.finalize();
    this.panels.finalize();
    this.orbitControls?.destroy();
    this.links.destroy();
    this.hosts.destroy();
    this.pickingHosts.destroy();
    this.pickingSwitches.destroy();
    this.pickingManager.destroy();
    this.glassScenegraph.removeAll();
    for (const group of this.glassGroups) {
      group.backfaces.destroy();
      group.sorted.destroy();
      group.aBuffer?.destroy();
      group.weightedBlended?.destroy();
    }
    this.packets.destroy();
    this.packetTrails.destroy();
    this.linkPulses.destroy();
    this.endpointSignals.destroy();
    this.switchFlashes.destroy();
    this.switchRipples.destroy();
    this.switchTransitionVisuals.destroy();
    this.storyPackets.destroy();
    this.postprocessingRenderer.destroy();
    this.aBufferRenderer?.destroy();
    this.weightedBlendedRenderer?.destroy();
    this.backfaceShaderInputs.destroy();
    this.emissiveShaderInputs.destroy();
    this.reflectiveShaderInputs.destroy();
    this.metallicShaderInputs.destroy();
    this.pickingShaderInputs.destroy();
    this.glassShaderInputs.destroy();
    this.aBufferShaderInputs.destroy();
    this.weightedBlendedShaderInputs.destroy();
    this.glassBackfaceFramebuffer.destroy();
    this.sceneFramebuffer.destroy();
    this.sceneTexture.destroy();
    this.refractionTexture.destroy();
    this.glassBackfaceTexture.destroy();
    this.environmentTexture.destroy();

    if (this.canvas) {
      for (const dataKey of Object.keys(this.canvas.dataset)) {
        if (dataKey.startsWith('packetSpraying')) {
          delete this.canvas.dataset[dataKey];
        }
      }
      this.canvas.removeAttribute('aria-label');
      this.canvas = null;
    }
  }

  private pickHoveredNode(device: Device, uniforms: AppUniforms): void {
    if (!this.pendingPickRequest || this.pickingInProgress) {
      return;
    }

    const pickRequest = this.pendingPickRequest;
    this.pendingPickRequest = null;
    if (
      pickRequest.action === 'hover' &&
      !this.pickingManager.shouldPick(pickRequest.canvasPosition)
    ) {
      return;
    }

    this.pickingInProgress = true;
    this.pickingShaderInputs.setProps({
      app: uniforms,
      picking: {indexMode: 'attribute', batchIndex: 0}
    });
    this.pickingHosts.model.predraw(device.commandEncoder);
    this.pickingSwitches.model.predraw(device.commandEncoder);
    const pickingPass = this.pickingManager.beginRenderPass();
    this.pickingHosts.model.draw(pickingPass);
    this.pickingSwitches.model.draw(pickingPass);
    pickingPass.end();

    // WebGPU texture readback submits its own encoder, so let the animation loop submit first.
    void Promise.resolve()
      .then(() => this.pickingManager.updatePickInfo(pickRequest.canvasPosition))
      .then(pickInfo => {
        if (pickRequest.pointerSequence !== this.pointerSequence) {
          return;
        }

        const objectIndex = pickInfo?.objectIndex;
        if (
          pickRequest.action === 'toggle-switch' &&
          objectIndex !== null &&
          objectIndex !== undefined
        ) {
          const switchIndex = objectIndex - HOST_POSITIONS.length;
          if (switchIndex >= 0 && switchIndex < this.glassInstances.length) {
            if (this.guidedStoryPlaying) {
              this.setGuidedStoryPlaying(false);
            }
            this.advanceSwitchState(switchIndex);
          }
        }

        const node =
          objectIndex === null || objectIndex === undefined
            ? undefined
            : this.getPickableNode(objectIndex);
        if (pickRequest.action === 'hover') {
          const spineIndex =
            objectIndex === null || objectIndex === undefined
              ? -1
              : objectIndex -
                HOST_POSITIONS.length -
                LEAF_POSITIONS.length -
                AGGREGATION_POSITIONS.length;
          this.setHighlightedPath(
            spineIndex >= 0 && spineIndex < SPINE_POSITIONS.length ? spineIndex : null
          );
        }
        if (node) {
          this.nodePopup?.show(node, pickRequest.clientPosition);
          if (this.canvas) {
            this.canvas.style.cursor = 'pointer';
          }
        } else {
          this.nodePopup?.hide();
          if (this.canvas) {
            this.canvas.style.cursor = 'grab';
          }
        }
      })
      .finally(() => {
        this.pickingInProgress = false;
      });
  }

  private readonly handlePointerMove = (event: PointerEvent): void => {
    if (!this.canvas || event.buttons !== 0) {
      this.handlePointerLeave();
      return;
    }

    const bounds = this.canvas.getBoundingClientRect();
    this.pendingPickRequest = {
      action: 'hover',
      canvasPosition: [event.clientX - bounds.left, event.clientY - bounds.top],
      clientPosition: [event.clientX, event.clientY],
      pointerSequence: ++this.pointerSequence
    };
  };

  private readonly handlePointerDown = (event: PointerEvent): void => {
    this.pointerDownPosition = [event.clientX, event.clientY];
    this.handlePointerLeave();
  };

  private readonly handleSwitchClick = (event: MouseEvent): void => {
    const pointerDownPosition = this.pointerDownPosition;
    this.pointerDownPosition = null;
    if (
      !this.canvas ||
      event.button !== 0 ||
      !pointerDownPosition ||
      Math.hypot(event.clientX - pointerDownPosition[0], event.clientY - pointerDownPosition[1]) > 5
    ) {
      return;
    }

    const bounds = this.canvas.getBoundingClientRect();
    this.pendingPickRequest = {
      action: 'toggle-switch',
      canvasPosition: [event.clientX - bounds.left, event.clientY - bounds.top],
      clientPosition: [event.clientX, event.clientY],
      pointerSequence: ++this.pointerSequence
    };
  };

  private readonly handlePointerLeave = (): void => {
    this.pointerSequence++;
    this.pendingPickRequest = null;
    this.pickingManager.clearPickState();
    this.nodePopup?.hide();
    this.setHighlightedPath(null);
  };

  private updateAnimationClock(rawAnimationTime: number): void {
    this.rawAnimationTime = rawAnimationTime;
    this.animationTime = this.animationPausedAt ?? rawAnimationTime - this.animationTimeOffset;

    if (this.canvas) {
      this.canvas.dataset.packetSprayingAnimationPaused = String(this.animationPausedAt !== null);
      this.canvas.dataset.packetSprayingAnimationTime = this.animationTime.toFixed(3);
    }
  }

  private setAnimationClockPaused(isPaused: boolean): void {
    if (isPaused) {
      if (this.animationPausedAt === null) {
        this.animationPausedAt = this.animationTime;
        this.rawAnimationPausedAt = this.rawAnimationTime;
      }
      return;
    }

    if (this.animationPausedAt !== null && this.rawAnimationPausedAt !== null) {
      this.animationTimeOffset += this.rawAnimationTime - this.rawAnimationPausedAt;
      this.animationTime = this.rawAnimationTime - this.animationTimeOffset;
    }
    this.animationPausedAt = null;
    this.rawAnimationPausedAt = null;
  }

  private updateAutorotationScenario(renderTime: number): void {
    const autoRotate = Boolean(this.orbitControls?.props.autoRotate) && !this.reflectionLab;
    const animationPaused = this.animationPausedAt !== null;
    const automaticScenarios = autoRotate && !animationPaused && !this.guidedStoryPlaying;

    if (!automaticScenarios) {
      this.autorotationScenarioStartedAt = null;
      if (this.canvas) {
        this.canvas.dataset.packetSprayingAutomaticScenarios = 'false';
        this.canvas.dataset.packetSprayingScenarioProgress = '0.000';
      }
      return;
    }

    this.autorotationScenarioStartedAt ??= renderTime;
    const elapsedTime = renderTime - this.autorotationScenarioStartedAt;
    if (
      shouldAdvanceNetworkAutorotationScenario(elapsedTime, {
        animationPaused,
        autoRotate,
        guidedStoryPlaying: this.guidedStoryPlaying
      })
    ) {
      this.guidedStoryStarted = true;
      this.enterGuidedStoryChapter(this.guidedStoryChapterIndex + 1);
      this.autorotationScenarioStartedAt = renderTime;
    }

    if (this.canvas) {
      this.canvas.dataset.packetSprayingAutomaticScenarios = 'true';
      this.canvas.dataset.packetSprayingScenarioProgress = Math.min(
        (renderTime - this.autorotationScenarioStartedAt) / NETWORK_AUTOROTATION_SCENARIO_DURATION,
        1
      ).toFixed(3);
    }
  }

  private setGuidedStoryPlaying(isPlaying: boolean): void {
    if (isPlaying === this.guidedStoryPlaying) {
      return;
    }

    this.guidedStoryPlaying = isPlaying;
    if (isPlaying) {
      this.setAnimationClockPaused(false);
      this.orbitControls?.setAutoRotate(false);
      if (this.guidedStoryStarted) {
        this.guidedStoryChapterStartedAt = this.animationTime - this.guidedStoryElapsedAtPause;
      } else {
        this.guidedStoryStarted = true;
        this.enterGuidedStoryChapter(this.guidedStoryChapterIndex);
      }
    } else {
      this.guidedStoryElapsedAtPause = this.animationTime - this.guidedStoryChapterStartedAt;
      this.guidedStoryCameraTransitionEndsAt = this.animationTime;
      this.setAnimationClockPaused(true);
      this.orbitControls?.setAutoRotate(this.orbit > 0);
    }

    this.updateGuidedStoryControls();
  }

  private moveGuidedStoryChapter(direction: number): void {
    this.guidedStoryStarted = true;
    this.enterGuidedStoryChapter(this.guidedStoryChapterIndex + direction);
  }

  private selectGuidedStoryChapter(chapterIndex: number): void {
    this.guidedStoryStarted = true;
    this.enterGuidedStoryChapter(chapterIndex);
  }

  private enterGuidedStoryChapter(chapterIndex: number): void {
    this.guidedStoryChapterIndex = getWrappedStoryChapterIndex(chapterIndex);
    this.autorotationScenarioStartedAt = null;
    this.guidedStoryChapterStartedAt = this.animationTime;
    this.guidedStoryElapsedAtPause = 0;
    this.guidedStoryCamera = getNetworkStoryChapter(this.guidedStoryChapterIndex).camera;
    this.guidedStoryCameraTransitionEndsAt = this.animationTime + 1.4;
    this.guidedStoryPreviousCameraTime = null;
    this.currentStoryBeat = null;

    const switchIndex = GUIDED_STORY_SWITCH_INDEX;
    const chapter = getNetworkStoryChapter(this.guidedStoryChapterIndex);

    switch (chapter.networkState) {
      case 'healthy':
        this.resetGuidedStoryNetwork();
        break;

      case 'congested':
        this.resetGuidedStoryNetwork();
        this.advanceSwitchState(switchIndex);
        break;

      case 'failed':
        if (this.recoveringSwitchIndices.has(switchIndex)) {
          this.resetGuidedStoryNetwork();
        }
        if (!this.failedSwitchIndices.has(switchIndex)) {
          if (!this.congestedSwitchIndices.has(switchIndex)) {
            this.advanceSwitchState(switchIndex);
          }
          if (this.congestedSwitchIndices.has(switchIndex)) {
            this.advanceSwitchState(switchIndex);
          }
        }
        break;

      case 'recovering':
        if (this.recoveringSwitchIndices.has(switchIndex)) {
          break;
        }
        if (this.detectingSwitchTimes.has(switchIndex)) {
          this.completeSwitchFailure(switchIndex);
        }
        if (this.congestedSwitchIndices.has(switchIndex)) {
          this.advanceSwitchState(switchIndex);
          this.completeSwitchFailure(switchIndex);
        }
        if (!this.failedSwitchIndices.has(switchIndex)) {
          this.completeSwitchFailure(switchIndex);
        }
        this.advanceSwitchState(switchIndex);
        break;
    }

    this.updateGuidedStoryControls();
  }

  private resetGuidedStoryNetwork(): void {
    const affectedSwitchIndices = new Set([
      ...this.congestedSwitchIndices,
      ...this.failedSwitchIndices,
      ...this.recoveringSwitchIndices,
      ...this.detectingSwitchTimes.keys()
    ]);

    for (const switchIndex of affectedSwitchIndices) {
      this.glassInstances[switchIndex].color = [...this.originalGlassColors[switchIndex]] as Color;
    }

    this.congestedSwitchIndices.clear();
    this.failedSwitchIndices.clear();
    this.recoveringSwitchIndices.clear();
    this.detectingSwitchTimes.clear();
    this.nextCongestionTrimTimes.clear();
    this.nextSwitchProbeTimes.clear();
    this.recoveryProbeCompletionTimes.clear();
    this.recoveryProbeConfirmations.clear();
    this.networkPacketEvents.splice(0, this.networkPacketEvents.length);
    this.queuedPacketDefinitions = [];
    this.switchTransitionWaves.splice(0, this.switchTransitionWaves.length);
    this.updateSwitchColors();
    this.updateHealthyRoutes();
    this.updateFailureAccessibility();
  }

  private updateGuidedStory(animationTime: number): void {
    if (!this.guidedStoryStarted) {
      return;
    }

    if (this.guidedStoryPlaying) {
      const chapter = getNetworkStoryChapter(this.guidedStoryChapterIndex);
      if (animationTime - this.guidedStoryChapterStartedAt >= chapter.duration) {
        this.enterGuidedStoryChapter(this.guidedStoryChapterIndex + 1);
      }
    }

    const chapterElapsedTime = this.guidedStoryPlaying
      ? animationTime - this.guidedStoryChapterStartedAt
      : this.guidedStoryElapsedAtPause;
    const chapter = getNetworkStoryChapter(this.guidedStoryChapterIndex);
    const beat = getNetworkStoryBeat(this.guidedStoryChapterIndex, chapterElapsedTime);
    if (beat !== this.currentStoryBeat) {
      this.currentStoryBeat = beat;
      this.guidedStoryCamera = makeNetworkStoryCamera(chapter, beat);
      this.guidedStoryCameraTransitionEndsAt = animationTime + 1.25;
      this.storyControls?.updateBeat(chapter, beat);
      this.setStoryHighlight(beat?.planeIndex ?? null, beat?.pathIndex ?? null);
    }
    this.storyControls?.updateProgress(this.guidedStoryChapterIndex, chapterElapsedTime);
    if (this.canvas) {
      this.canvas.dataset.packetSprayingStoryProgress = getNetworkStoryProgress(
        this.guidedStoryChapterIndex,
        chapterElapsedTime
      ).overallProgress.toFixed(3);
      this.canvas.dataset.packetSprayingStoryBeat = beat?.id ?? '';
    }

    if (
      !this.guidedStoryCamera ||
      !this.orbitControls ||
      (!this.guidedStoryPlaying && animationTime >= this.guidedStoryCameraTransitionEndsAt)
    ) {
      return;
    }

    const elapsedTime = Math.min(
      Math.max(animationTime - (this.guidedStoryPreviousCameraTime ?? animationTime - 1 / 60), 0),
      0.12
    );
    const smoothing = 1 - Math.exp(-elapsedTime * 3.8);
    const controls = this.orbitControls;
    const camera = this.guidedStoryCamera;
    const cameraTarget: Vector3 = [...camera.target];
    if (!beat?.camera?.target && beat?.pathIndex !== undefined) {
      cameraTarget[2] += SPINE_POSITIONS[beat.pathIndex][2] * 0.2;
    } else if (!beat?.camera?.target && beat?.planeIndex !== undefined) {
      cameraTarget[2] += beat.planeIndex === 0 ? 0.32 : -0.32;
    }
    const yawDelta = Math.atan2(
      Math.sin(camera.yaw - controls.yaw),
      Math.cos(camera.yaw - controls.yaw)
    );

    controls.yaw += yawDelta * smoothing;
    controls.pitch += (camera.pitch - controls.pitch) * smoothing;
    controls.distance += (camera.distance - controls.distance) * smoothing;
    controls.props.target = [
      controls.props.target[0] + (cameraTarget[0] - controls.props.target[0]) * smoothing,
      controls.props.target[1] + (cameraTarget[1] - controls.props.target[1]) * smoothing,
      controls.props.target[2] + (cameraTarget[2] - controls.props.target[2]) * smoothing
    ];
    this.guidedStoryPreviousCameraTime = animationTime;
  }

  private updateGuidedStoryControls(): void {
    const chapter = getNetworkStoryChapter(this.guidedStoryChapterIndex);
    this.storyControls?.update(chapter, this.guidedStoryChapterIndex, this.guidedStoryPlaying);
    this.storyControls?.updateBeat(chapter, this.currentStoryBeat);
    this.storyControls?.updateProgress(
      this.guidedStoryChapterIndex,
      this.guidedStoryElapsedAtPause
    );
    if (this.canvas) {
      this.canvas.dataset.packetSprayingStoryChapter = chapter.id;
      this.canvas.dataset.packetSprayingStoryPlaying = String(this.guidedStoryPlaying);
    }
  }

  private setVisualIntensity(level: number, synchronizeSettings = true): void {
    const nextProfile = makeNetworkOpticsProfile(level);
    if (this.visualIntensity === nextProfile.level) {
      return;
    }

    this.visualIntensity = nextProfile.level;
    this.storyControls?.setVisualIntensity(nextProfile.level);
    if (synchronizeSettings) {
      this.settingsPanel.setSettingValue('visualIntensity', nextProfile.level);
    }
    if (this.canvas) {
      this.canvas.dataset.packetSprayingVisualTarget = nextProfile.level.toFixed(2);
      this.canvas.dataset.packetSprayingVisualStyle = nextProfile.label;
    }
  }

  private setHdrHighlightBoost(highlightBoost: number, synchronizeSettings = true): void {
    const nextHighlightBoost = Math.max(
      0,
      Math.min(highlightBoost, MAX_NETWORK_HDR_HIGHLIGHT_BOOST)
    );
    if (this.hdrHighlightBoost === nextHighlightBoost) {
      return;
    }

    this.hdrHighlightBoost = nextHighlightBoost;
    this.storyControls?.setHdrHighlightBoost(nextHighlightBoost);
    if (synchronizeSettings) {
      this.settingsPanel.setSettingValue('hdrHighlightBoost', nextHighlightBoost);
    }
    this.updateDynamicRangeProfile();
  }

  private updateVisualIntensity(animationTime: number): void {
    const previousTime = this.previousVisualIntensityTime;
    const elapsedTime = Math.min(
      Math.max(animationTime - (previousTime ?? animationTime - 1 / 60), 0),
      0.12
    );
    this.previousVisualIntensityTime = animationTime;
    const difference = this.visualIntensity - this.currentVisualIntensity;
    if (Math.abs(difference) < 0.001) {
      if (this.currentVisualIntensity === this.visualIntensity) {
        return;
      }
      this.currentVisualIntensity = this.visualIntensity;
    } else {
      this.currentVisualIntensity += difference * (1 - Math.exp(-elapsedTime * 7));
    }

    this.opticsProfile = makeNetworkOpticsProfile(this.currentVisualIntensity);
    this.updateDynamicRangeProfile();
    if (this.canvas) {
      this.canvas.dataset.packetSprayingVisualIntensity = this.currentVisualIntensity.toFixed(2);
      this.canvas.dataset.packetSprayingVisualBloom = this.opticsProfile.bloom.toFixed(2);
      this.canvas.dataset.packetSprayingVisualCaustics = this.opticsProfile.caustics.toFixed(2);
      this.canvas.dataset.packetSprayingVisualRefraction = this.opticsProfile.refraction.toFixed(2);
    }
  }

  private updateDynamicRangeProfile(): void {
    this.dynamicRangeProfile = makeNetworkDynamicRangeProfile({
      ...this.dynamicRangeOptions,
      highlightBoost: this.hdrHighlightBoost,
      visualIntensity: this.currentVisualIntensity
    });
    this.storyControls?.setDynamicRange(this.dynamicRangeProfile);
    if (this.canvas) {
      this.canvas.dataset.packetSprayingDynamicRange = this.dynamicRangeProfile.displayMode;
      this.canvas.dataset.packetSprayingHighlightBoost =
        this.dynamicRangeProfile.highlightBoost.toFixed(3);
      this.canvas.dataset.packetSprayingMaximumLuminance =
        this.dynamicRangeProfile.maximumLuminance.toFixed(2);
    }
  }

  private setHighlightedPlane(planeIndex: number | null): void {
    this.manualHighlightedPlaneIndex = planeIndex;
    this.synchronizeStoryHighlights();
  }

  private setHighlightedPath(pathIndex: number | null): void {
    this.manualHighlightedPathIndex = pathIndex;
    this.synchronizeStoryHighlights();
  }

  private setStoryHighlight(planeIndex: number | null, pathIndex: number | null): void {
    this.storyHighlightedPlaneIndex = planeIndex;
    this.storyHighlightedPathIndex = pathIndex;
    this.synchronizeStoryHighlights();
  }

  private synchronizeStoryHighlights(): void {
    const hasManualHighlight =
      this.manualHighlightedPlaneIndex !== null || this.manualHighlightedPathIndex !== null;
    const planeIndex = hasManualHighlight
      ? this.manualHighlightedPlaneIndex
      : this.storyHighlightedPlaneIndex;
    const pathIndex = hasManualHighlight
      ? this.manualHighlightedPathIndex
      : this.storyHighlightedPathIndex;

    this.updateHighlightedPlane(planeIndex);
    this.updateHighlightedPath(pathIndex);
  }

  private updateHighlightedPlane(planeIndex: number | null): void {
    if (this.highlightedPlaneIndex === planeIndex) {
      return;
    }

    this.highlightedPlaneIndex = planeIndex;
    this.storyControls?.setHighlightedPlane(planeIndex);
    if (this.canvas) {
      this.canvas.dataset.packetSprayingHighlightedPlane =
        planeIndex === null ? '' : String(planeIndex + 1);
    }
  }

  private updateHighlightedPath(pathIndex: number | null): void {
    if (this.highlightedPathIndex === pathIndex) {
      return;
    }

    this.highlightedPathIndex = pathIndex;
    this.storyControls?.setHighlightedPath(pathIndex);
    if (this.canvas) {
      this.canvas.dataset.packetSprayingHighlightedPath =
        pathIndex === null ? '' : String(pathIndex + 1);
    }
  }

  private setMrcPanelVisible(isVisible: boolean): void {
    if (isVisible) {
      this.setOpticsPanelVisible(false);
    }

    const wasVisible = this.canvas?.dataset.packetSprayingMrcExpanded === 'true';
    this.mrcPanel?.setVisible(isVisible);
    this.storyControls?.setMrcExpanded(isVisible);
    if (!isVisible && wasVisible) {
      this.storyControls?.focusMrcButton();
    }
    if (this.canvas) {
      this.canvas.dataset.packetSprayingMrcExpanded = String(isVisible);
    }
  }

  private setOpticsPanelVisible(isVisible: boolean): void {
    if (isVisible) {
      this.setMrcPanelVisible(false);
    }

    const wasVisible = this.canvas?.dataset.packetSprayingOpticsExpanded === 'true';
    this.opticsPanel?.setVisible(isVisible);
    this.storyControls?.setOpticsExpanded(isVisible);
    if (!isVisible && wasVisible) {
      this.storyControls?.focusOpticsButton();
    }
    if (this.canvas) {
      this.canvas.dataset.packetSprayingOpticsExpanded = String(isVisible);
    }
  }

  private getPickableNode(objectIndex: number): PickableNetworkNode | undefined {
    const node = this.pickableNodes[objectIndex];
    if (!node || objectIndex < HOST_POSITIONS.length) {
      return node;
    }

    const switchIndex = objectIndex - HOST_POSITIONS.length;
    if (this.failedSwitchIndices.has(switchIndex)) {
      return {
        ...node,
        role: `FAILED / ${node.role}`,
        description:
          'This switch dropped in-flight packets. MRC retired its paths, retransmitted the missing data, and now sends occasional recovery probes.',
        detail: 'Click again to repair this switch and verify its path with a control probe.',
        status: 'offline'
      };
    }

    if (this.recoveringSwitchIndices.has(switchIndex)) {
      return {
        ...node,
        role: `RECOVERY PROBE / ${node.role}`,
        description:
          'This repaired switch remains out of service while a blue control probe reaches it and a cyan confirmation returns.',
        detail:
          'Ordinary red and green traffic resumes only after the complete recovery handshake.',
        status: 'probing'
      };
    }

    if (this.detectingSwitchTimes.has(switchIndex)) {
      return {
        ...node,
        role: `FAILURE DETECTED / ${node.role}`,
        description:
          'Packets reaching this switch are briefly lost while MRC detects the fault and prepares healthy replacement routes.',
        detail: 'The affected plane will be retired after the packet-loss detection interval.',
        status: 'detecting'
      };
    }

    if (this.congestedSwitchIndices.has(switchIndex)) {
      return {
        ...node,
        role: `CONGESTED / ${node.role}`,
        description:
          'This switch trims overloaded packet payloads while forwarding their small headers, allowing senders to retransmit through other paths.',
        detail: 'Click again to fail this switch and demonstrate path retirement.',
        status: 'congested'
      };
    }

    return {
      ...node,
      detail: `${node.detail} Click to introduce congestion.`,
      status: 'online'
    };
  }

  private advanceSwitchState(switchIndex: number): void {
    if (this.recoveringSwitchIndices.has(switchIndex)) {
      return;
    }

    if (this.failedSwitchIndices.has(switchIndex)) {
      this.failedSwitchIndices.delete(switchIndex);
      this.nextSwitchProbeTimes.delete(switchIndex);
      this.glassInstances[switchIndex].color = [...this.originalGlassColors[switchIndex]] as Color;
      this.recoveringSwitchIndices.add(switchIndex);
      this.nextSwitchProbeTimes.set(switchIndex, this.animationTime);
    } else if (this.detectingSwitchTimes.has(switchIndex)) {
      this.completeSwitchFailure(switchIndex);
      return;
    } else if (this.congestedSwitchIndices.has(switchIndex)) {
      this.congestedSwitchIndices.delete(switchIndex);
      this.nextCongestionTrimTimes.delete(switchIndex);
      this.detectingSwitchTimes.set(switchIndex, this.animationTime + FAILURE_DETECTION_DELAY);
      this.glassInstances[switchIndex].color = [...DETECTING_SWITCH_COLOR];
      this.enqueueSwitchPacketEvents(switchIndex, 'failure', this.animationTime);
    } else {
      this.congestedSwitchIndices.add(switchIndex);
      this.nextCongestionTrimTimes.set(switchIndex, this.animationTime);
      this.glassInstances[switchIndex].color = [...CONGESTED_SWITCH_COLOR];
    }

    this.updateSwitchColors();
    this.updateHealthyRoutes();
    this.updateFailureAccessibility();
  }

  private completeSwitchFailure(switchIndex: number): void {
    this.detectingSwitchTimes.delete(switchIndex);
    this.failedSwitchIndices.add(switchIndex);
    this.nextSwitchProbeTimes.set(switchIndex, this.animationTime + SWITCH_PROBE_INTERVAL);
    this.glassInstances[switchIndex].color = [...FAILED_SWITCH_COLOR];
    this.switchTransitionWaves.push(
      makeSwitchTransitionWave(switchIndex, 'failure', this.animationTime)
    );
    this.updateSwitchColors();
    this.updateHealthyRoutes();
    this.updateFailureAccessibility();
  }

  private completeSwitchRecovery(switchIndex: number): void {
    this.recoveringSwitchIndices.delete(switchIndex);
    this.recoveryProbeCompletionTimes.delete(switchIndex);
    this.recoveryProbeConfirmations.delete(switchIndex);
    this.glassInstances[switchIndex].color = [...this.originalGlassColors[switchIndex]] as Color;
    this.switchTransitionWaves.push(
      makeSwitchTransitionWave(switchIndex, 'recovery', this.animationTime)
    );
    this.updateSwitchColors();
    this.updateHealthyRoutes();
    this.updateFailureAccessibility();
  }

  private enqueueSwitchPacketEvents(
    switchIndex: number,
    scenario: NetworkScenario,
    startedAt: number
  ): void {
    const events = makeSwitchPacketEvents({
      packets: this.packetDefinitions,
      conversationRoutes: this.conversationRoutes,
      scenario,
      startedAt,
      switchIndex
    });
    this.networkPacketEvents.push(...events);
    this.droppedPacketCount += events.filter(event => event.kind === 'dropped-payload').length;
    this.trimmedPacketCount += events.filter(event => event.kind === 'trimmed-payload').length;
  }

  private updateSwitchStoryState(animationTime: number): void {
    for (const [switchIndex, detectionTime] of this.detectingSwitchTimes) {
      if (animationTime >= detectionTime) {
        this.completeSwitchFailure(switchIndex);
      }
    }

    for (const [switchIndex, nextTrimTime] of this.nextCongestionTrimTimes) {
      if (animationTime >= nextTrimTime) {
        this.enqueueSwitchPacketEvents(switchIndex, 'congestion', nextTrimTime);
        this.nextCongestionTrimTimes.set(switchIndex, nextTrimTime + CONGESTION_TRIM_INTERVAL);
        this.updateFailureAccessibility();
      }
    }

    for (const [switchIndex, nextProbeTime] of this.nextSwitchProbeTimes) {
      if (animationTime >= nextProbeTime) {
        const unavailableSwitchIndices = new Set([
          ...this.failedSwitchIndices,
          ...this.recoveringSwitchIndices,
          ...this.detectingSwitchTimes.keys()
        ]);
        const probe = makeSwitchProbeEvent(
          this.conversationRoutes,
          switchIndex,
          nextProbeTime,
          unavailableSwitchIndices
        );
        if (probe) {
          this.networkPacketEvents.push(probe);
          if (this.recoveringSwitchIndices.has(switchIndex)) {
            const confirmation = makeSwitchProbeConfirmationEvent(probe);
            this.networkPacketEvents.push(confirmation);
            this.recoveryProbeCompletionTimes.set(
              switchIndex,
              confirmation.startedAt + confirmation.duration
            );
            this.recoveryProbeConfirmations.set(switchIndex, confirmation);
            this.nextSwitchProbeTimes.delete(switchIndex);
            continue;
          }
        }
        this.nextSwitchProbeTimes.set(switchIndex, nextProbeTime + SWITCH_PROBE_INTERVAL);
      }
    }

    for (const [switchIndex, completionTime] of this.recoveryProbeCompletionTimes) {
      if (animationTime >= completionTime) {
        const confirmation = this.recoveryProbeConfirmations.get(switchIndex);
        const unavailableSwitchIndices = new Set([
          ...this.failedSwitchIndices,
          ...this.recoveringSwitchIndices,
          ...this.detectingSwitchTimes.keys()
        ]);
        if (confirmation && isSwitchProbeRouteAvailable(confirmation, unavailableSwitchIndices)) {
          this.completeSwitchRecovery(switchIndex);
        } else {
          this.recoveryProbeCompletionTimes.delete(switchIndex);
          this.recoveryProbeConfirmations.delete(switchIndex);
          this.nextSwitchProbeTimes.set(switchIndex, animationTime + SWITCH_PROBE_INTERVAL);
        }
      }
    }

    for (let eventIndex = this.networkPacketEvents.length - 1; eventIndex >= 0; eventIndex--) {
      const event = this.networkPacketEvents[eventIndex];
      if (animationTime > event.startedAt + event.duration) {
        this.networkPacketEvents.splice(eventIndex, 1);
      }
    }

    for (let waveIndex = this.switchTransitionWaves.length - 1; waveIndex >= 0; waveIndex--) {
      const wave = this.switchTransitionWaves[waveIndex];
      if (animationTime > wave.startedAt + wave.duration) {
        this.switchTransitionWaves.splice(waveIndex, 1);
      }
    }

    if (this.canvas) {
      const activeHandshake = this.networkPacketEvents.find(
        event =>
          this.recoveringSwitchIndices.has(event.switchIndex) &&
          (event.kind === 'probe' || event.kind === 'probe-confirmation') &&
          animationTime >= event.startedAt &&
          animationTime <= event.startedAt + event.duration
      );
      this.canvas.dataset.packetSprayingProbePhase =
        activeHandshake?.kind === 'probe-confirmation'
          ? 'confirming'
          : activeHandshake?.kind === 'probe'
            ? 'probing'
            : 'idle';
    }
  }

  private updateSwitchColors(): void {
    for (const group of this.glassGroups) {
      const matrices = flattenMatrices(group.instances.map(instance => instance.matrix));
      const colors = flattenColors(
        group.instances.map((instance, instanceIndex) => {
          const switchIndex = group.switchIndices[instanceIndex];
          return this.getHighlightedSwitchColor(instance.color, switchIndex);
        })
      );
      group.sorted.updateInstances(matrices, colors);
      group.aBuffer?.updateInstances(matrices, colors);
      group.weightedBlended?.updateInstances(matrices, colors);
    }
  }

  private getHighlightedSwitchColor(color: Color, switchIndex: number): Color {
    const planeIndex = this.switchPlaneIndices.get(switchIndex);
    const planeStrength = planeIndex === undefined ? 0 : this.planeHighlightStrengths[planeIndex];
    const pathStrength = this.getPathSwitchHighlightStrength(switchIndex);
    return makeNetworkSwitchHighlightColor(color, planeStrength, pathStrength);
  }

  private getPathSwitchHighlightStrength(switchIndex: number): number {
    let maximumStrength = 0;
    for (const [pathIndex, focus] of this.pathFocuses.entries()) {
      if (focus.switchIndices.has(switchIndex)) {
        maximumStrength = Math.max(maximumStrength, this.pathHighlightStrengths[pathIndex]);
      }
    }
    return maximumStrength;
  }

  private getPathLinkHighlightStrength(linkKey: string): number {
    let maximumStrength = 0;
    for (const [pathIndex, focus] of this.pathFocuses.entries()) {
      if (focus.linkKeys.has(linkKey)) {
        maximumStrength = Math.max(maximumStrength, this.pathHighlightStrengths[pathIndex]);
      }
    }
    return maximumStrength;
  }

  private updatePlaneHighlight(animationTime: number): void {
    const elapsedTime = Math.min(
      Math.max(animationTime - (this.previousPlaneHighlightTime ?? animationTime - 1 / 60), 0),
      0.12
    );
    this.previousPlaneHighlightTime = animationTime;

    let requiresHighlightUpdate = false;
    for (let planeIndex = 0; planeIndex < this.planeHighlightStrengths.length; planeIndex++) {
      const targetStrength = this.highlightedPlaneIndex === planeIndex ? 1 : 0;
      const currentStrength = this.planeHighlightStrengths[planeIndex];
      const responseRate =
        targetStrength > currentStrength
          ? NETWORK_PLANE_HIGHLIGHT_ATTACK
          : NETWORK_PLANE_HIGHLIGHT_DECAY;
      const nextStrength =
        currentStrength +
        (targetStrength - currentStrength) * (1 - Math.exp(-elapsedTime * responseRate));
      const settledStrength =
        Math.abs(nextStrength - targetStrength) < 0.001 ? targetStrength : nextStrength;

      if (Math.abs(settledStrength - currentStrength) > 0.0001) {
        this.planeHighlightStrengths[planeIndex] = settledStrength;
        requiresHighlightUpdate = true;
      }
    }

    for (let pathIndex = 0; pathIndex < this.pathHighlightStrengths.length; pathIndex++) {
      const targetStrength = this.highlightedPathIndex === pathIndex ? 1 : 0;
      const currentStrength = this.pathHighlightStrengths[pathIndex];
      const responseRate =
        targetStrength > currentStrength
          ? NETWORK_PLANE_HIGHLIGHT_ATTACK
          : NETWORK_PLANE_HIGHLIGHT_DECAY;
      const nextStrength =
        currentStrength +
        (targetStrength - currentStrength) * (1 - Math.exp(-elapsedTime * responseRate));
      const settledStrength =
        Math.abs(nextStrength - targetStrength) < 0.001 ? targetStrength : nextStrength;

      if (Math.abs(settledStrength - currentStrength) > 0.0001) {
        this.pathHighlightStrengths[pathIndex] = settledStrength;
        requiresHighlightUpdate = true;
      }
    }

    if (requiresHighlightUpdate) {
      let highlightedSwitchCount = 0;
      let highlightedPathSwitchCount = 0;

      for (let switchIndex = 0; switchIndex < this.glassInstances.length; switchIndex++) {
        const planeIndex = this.switchPlaneIndices.get(switchIndex);
        const planeStrength =
          planeIndex === undefined ? 0 : this.planeHighlightStrengths[planeIndex];
        const pathStrength = this.getPathSwitchHighlightStrength(switchIndex);
        const highlightStrength = Math.max(planeStrength, pathStrength);
        if (highlightStrength < 0.003) {
          continue;
        }

        highlightedSwitchCount++;
        if (pathStrength > 0.003) {
          highlightedPathSwitchCount++;
        }
      }

      this.updateSwitchColors();
      this.updateFocusedHostColors();
      if (this.canvas) {
        this.canvas.dataset.packetSprayingPlaneHighlightStrength = Math.max(
          ...this.planeHighlightStrengths
        ).toFixed(3);
        this.canvas.dataset.packetSprayingHighlightedSwitches = String(highlightedSwitchCount);
        this.canvas.dataset.packetSprayingPathHighlightStrength = Math.max(
          ...this.pathHighlightStrengths
        ).toFixed(3);
        this.canvas.dataset.packetSprayingHighlightedPathSwitches = String(
          highlightedPathSwitchCount
        );
      }
    }
  }

  private updateFocusedHostColors(): void {
    const maximumPathStrength = Math.max(...this.pathHighlightStrengths);
    const hostColors = HOST_POSITIONS.map((_, hostIndex) => {
      const color = makeHostColor(hostIndex);
      let focusStrength = 0;
      for (const [pathIndex, focus] of this.pathFocuses.entries()) {
        if (focus.hostIndices.has(hostIndex)) {
          focusStrength = Math.max(focusStrength, this.pathHighlightStrengths[pathIndex]);
        }
      }
      const backgroundStrength = 1 - (maximumPathStrength - focusStrength) * 0.36;
      return [
        color[0] * backgroundStrength + focusStrength * 0.045,
        color[1] * backgroundStrength + focusStrength * 0.07,
        color[2] * backgroundStrength + focusStrength * 0.075,
        color[3]
      ] as Color;
    });
    this.hosts.updateColors(flattenColors(hostColors));
  }

  private updateHealthyRoutes(): void {
    const healthyRoutes = getHealthyConversationRoutes(
      this.conversationRoutes,
      this.failedSwitchIndices,
      this.recoveringSwitchIndices
    );
    reroutePackets(
      this.packetDefinitions,
      healthyRoutes,
      this.adaptiveRouting ? this.congestedSwitchIndices : undefined
    );
    this.switchArrivalEvents = makeSwitchArrivals(this.packetDefinitions);
    const activeLinkKeys = makeActiveLinkKeys(healthyRoutes);

    for (const link of this.networkLinks) {
      const failed =
        isFailedSwitchPosition(link.start, this.failedSwitchIndices) ||
        isFailedSwitchPosition(link.end, this.failedSwitchIndices);
      const congested =
        isFailedSwitchPosition(link.start, this.congestedSwitchIndices) ||
        isFailedSwitchPosition(link.end, this.congestedSwitchIndices);
      link.color = makeLinkColor(
        link.start,
        activeLinkKeys.has(makeLinkKey(link.start, link.end)),
        failed,
        congested
      );
    }
    this.links.updateInstances(
      flattenMatrices(this.networkLinks.map(link => makeLinkMatrix(link, 0.09))),
      flattenColors(this.networkLinks.map(link => link.color))
    );
    this.updateNetworkTelemetry();
  }

  private updateNetworkTelemetry(): void {
    const spinePathTelemetry = makeNetworkPlaneTelemetry(
      this.conversationRoutes,
      this.packetDefinitions,
      this.failedSwitchIndices,
      this.recoveringSwitchIndices,
      this.congestedSwitchIndices
    );
    const switchPlaneTelemetry = makeNetworkSwitchPlaneTelemetry(
      this.conversationRoutes,
      this.packetDefinitions,
      this.failedSwitchIndices,
      this.recoveringSwitchIndices,
      this.congestedSwitchIndices
    );
    this.storyControls?.updateTelemetry(switchPlaneTelemetry, spinePathTelemetry);

    if (this.canvas) {
      this.canvas.dataset.packetSprayingPlaneStates = spinePathTelemetry
        .map(plane => plane.status)
        .join(',');
      this.canvas.dataset.packetSprayingSwitchPlaneStates = switchPlaneTelemetry
        .map(plane => plane.status)
        .join(',');
      this.canvas.dataset.packetSprayingPlaneAllocation = spinePathTelemetry
        .map(plane => `${plane.redPacketCount}:${plane.greenPacketCount}`)
        .join(',');
      this.canvas.dataset.packetSprayingAdaptiveRouting = String(this.adaptiveRouting);
    }
  }

  private updateEndpointSignals(animationTime: number): void {
    this.endpointSignalMatrices.fill(0);
    this.endpointSignalColors.fill(0);
    if (this.reflectionLab) {
      this.endpointSignalDefinitions = [];
      if (this.canvas) {
        this.canvas.dataset.packetSprayingEndpointSignals = '0';
      }
      return;
    }

    const endpointSignalIntensity = this.endpointSignalIntensity * this.opticsProfile.motion;
    this.endpointSignalDefinitions =
      endpointSignalIntensity > 0.005
        ? makeEndpointSignals(this.packetDefinitions, animationTime)
        : [];

    for (const [signalIndex, signal] of this.endpointSignalDefinitions.entries()) {
      if (signalIndex >= MAX_ENDPOINT_SIGNALS) {
        break;
      }

      const hostPosition = HOST_POSITIONS[signal.hostIndex];
      const destinationSignal = signal.kind === 'destination';
      const radius =
        (destinationSignal ? 0.22 : 0.17) + signal.strength * (destinationSignal ? 0.14 : 0.09);
      const position: Vector3 = [
        hostPosition[0],
        hostPosition[1] + HOST_HALF_EXTENTS[1] + 0.035,
        hostPosition[2]
      ];
      this.endpointSignalMatrices.set(
        makeObjectMatrix(position, [radius, 0.038 + signal.strength * 0.014, radius]),
        signalIndex * 16
      );
      const signalColor = makeBalancedEmissionColor(signal.color, 1);
      const intensity = signal.strength * endpointSignalIntensity;
      this.endpointSignalColors.set(
        [
          signalColor[0] * intensity * 0.37,
          signalColor[1] * intensity * 0.37,
          signalColor[2] * intensity * 0.37,
          Math.min(intensity * 0.42, 0.32)
        ],
        signalIndex * 4
      );
    }

    if (this.canvas) {
      this.canvas.dataset.packetSprayingEndpointSignals = String(
        this.endpointSignalDefinitions.length
      );
    }
  }

  private updateSwitchPressure(animationTime: number): void {
    if (this.congestedSwitchIndices.size === 0) {
      return;
    }

    for (const switchIndex of this.congestedSwitchIndices) {
      const pressure =
        (0.5 + 0.5 * Math.sin(animationTime * 7.2 + switchIndex * 0.63)) *
        this.congestionPressureIntensity *
        (0.35 + this.opticsProfile.motion * 0.65);
      this.glassInstances[switchIndex].color = [
        1,
        CONGESTED_SWITCH_COLOR[1] + pressure * 0.16,
        CONGESTED_SWITCH_COLOR[2] + pressure * 0.065,
        Math.min(CONGESTED_SWITCH_COLOR[3] + pressure * 0.11, 0.64)
      ];
    }

    this.updateSwitchColors();
  }

  private updateLinkPulseVisuals(animationTime: number): void {
    this.linkPulseMatrices.fill(0);
    this.linkPulseColors.fill(0);
    if (this.reflectionLab) {
      if (this.canvas) {
        this.canvas.dataset.packetSprayingLinkPulses = '0';
      }
      return;
    }

    const linkPulseIntensity = this.linkPulseIntensity * this.opticsProfile.motion;
    if (linkPulseIntensity <= 0.005 || this.linkPulseLength <= 0) {
      if (this.canvas) {
        this.canvas.dataset.packetSprayingLinkPulses = '0';
      }
      return;
    }

    const pulses = makeLinkPulses(this.packetDefinitions, animationTime, this.linkPulseLength);
    const maximumPathStrength = Math.max(...this.pathHighlightStrengths);
    for (let pulseIndex = 0; pulseIndex < pulses.length; pulseIndex++) {
      const pulse = pulses[pulseIndex];
      const pulseColor = makeBalancedEmissionColor(pulse.color, 1);
      const pathStrength = this.getPathLinkHighlightStrength(pulse.linkKey);
      const focusIntensity = 1 - (maximumPathStrength - pathStrength) * 0.6 + pathStrength * 0.3;
      this.linkPulseMatrices.set(
        makeSegmentMatrix(pulse.start, pulse.end, LINK_PULSE_RADIUS),
        pulseIndex * 16
      );
      this.linkPulseColors.set(
        [
          pulseColor[0] * linkPulseIntensity * focusIntensity * 0.34,
          pulseColor[1] * linkPulseIntensity * focusIntensity * 0.34,
          pulseColor[2] * linkPulseIntensity * focusIntensity * 0.34,
          Math.min(linkPulseIntensity * focusIntensity * 0.42, 0.46)
        ],
        pulseIndex * 4
      );
    }

    if (this.canvas) {
      this.canvas.dataset.packetSprayingLinkPulses = String(pulses.length);
    }
  }

  private updateSwitchTransitionVisuals(animationTime: number): void {
    this.switchTransitionMatrices.fill(0);
    this.switchTransitionColors.fill(0);
    if (this.reflectionLab) {
      if (this.canvas) {
        this.canvas.dataset.packetSprayingTransitionWaves = '0';
      }
      return;
    }

    let activeWaveCount = 0;

    for (const wave of this.switchTransitionWaves.slice(0, MAX_SWITCH_TRANSITION_WAVES)) {
      const progress = (animationTime - wave.startedAt) / wave.duration;
      if (progress < 0 || progress >= 1) {
        continue;
      }

      const switchRadius =
        wave.switchIndex < LEAF_POSITIONS.length
          ? LEAF_SWITCH_RADIUS
          : wave.switchIndex < LEAF_POSITIONS.length + AGGREGATION_POSITIONS.length
            ? AGGREGATION_SWITCH_RADIUS
            : SPINE_SWITCH_RADIUS;
      const radius = switchRadius * (0.72 + progress * 1.24);
      const intensity =
        Math.sin(progress * Math.PI) *
        (1 - progress * 0.38) *
        this.switchTransitionIntensity *
        this.opticsProfile.motion;
      const waveColor = makeBalancedEmissionColor(wave.color, wave.color[3]);
      this.switchTransitionMatrices.set(
        makeObjectMatrix(SWITCH_POSITIONS[wave.switchIndex], [radius, radius, radius]),
        activeWaveCount * 16
      );
      this.switchTransitionColors.set(
        [
          waveColor[0] * intensity * 0.16,
          waveColor[1] * intensity * 0.16,
          waveColor[2] * intensity * 0.16,
          Math.min(intensity * 0.28, 0.24)
        ],
        activeWaveCount * 4
      );
      activeWaveCount++;
    }

    if (this.canvas) {
      this.canvas.dataset.packetSprayingTransitionWaves = String(activeWaveCount);
    }
  }

  private updateLinkTraffic(animationTime: number): void {
    if (this.reflectionLab) {
      this.redLinkTrafficStrengths.fill(0);
      this.greenLinkTrafficStrengths.fill(0);
      this.blueLinkTrafficStrengths.fill(0);
      this.links.updateColors(makeTransparentColors(this.networkLinks.length));
      this.previousLinkTrafficTime = animationTime;
      if (this.canvas) {
        this.canvas.dataset.packetSprayingIlluminatedLinks = '0';
        this.canvas.dataset.packetSprayingOccupiedLinks = '0';
        this.canvas.dataset.packetSprayingHighlightedPathLinks = '0';
      }
      return;
    }

    const trafficByLink = makeLinkTraffic(
      this.packetDefinitions,
      animationTime,
      this.networkPacketEvents
    );
    const elapsedTime = Math.min(
      Math.max(animationTime - (this.previousLinkTrafficTime ?? animationTime - 1 / 60), 0),
      0.12
    );
    const attack = 1 - Math.exp(-elapsedTime * 18);
    const decay = 1 - Math.exp(-elapsedTime * 4.5);
    const maximumPathStrength = Math.max(...this.pathHighlightStrengths);
    let illuminatedLinkCount = 0;
    let highlightedPathLinkCount = 0;

    for (let linkIndex = 0; linkIndex < this.networkLinks.length; linkIndex++) {
      const link = this.networkLinks[linkIndex];
      const linkKey = makeLinkKey(link.start, link.end);
      const traffic = trafficByLink.get(linkKey);
      const pathStrength = this.getPathLinkHighlightStrength(linkKey);
      const backgroundStrength = 1 - (maximumPathStrength - pathStrength) * 0.55;
      const routeGlow = pathStrength * (0.075 + this.opticsProfile.surface * 0.085);
      const targetRedStrength = Math.min((traffic?.red ?? 0) * 0.48, 1);
      const targetGreenStrength = Math.min((traffic?.green ?? 0) * 0.48, 1);
      const targetBlueStrength = Math.min((traffic?.blue ?? 0) * 0.48, 1);
      const previousRedStrength = this.redLinkTrafficStrengths[linkIndex];
      const previousGreenStrength = this.greenLinkTrafficStrengths[linkIndex];
      const previousBlueStrength = this.blueLinkTrafficStrengths[linkIndex];
      const redStrength = Math.max(
        previousRedStrength +
          (targetRedStrength - previousRedStrength) *
            (targetRedStrength > previousRedStrength ? attack : decay),
        Math.min(targetRedStrength, 0.11)
      );
      const greenStrength = Math.max(
        previousGreenStrength +
          (targetGreenStrength - previousGreenStrength) *
            (targetGreenStrength > previousGreenStrength ? attack : decay),
        Math.min(targetGreenStrength, 0.11)
      );
      const blueStrength = Math.max(
        previousBlueStrength +
          (targetBlueStrength - previousBlueStrength) *
            (targetBlueStrength > previousBlueStrength ? attack : decay),
        Math.min(targetBlueStrength, 0.11)
      );
      this.redLinkTrafficStrengths[linkIndex] = redStrength;
      this.greenLinkTrafficStrengths[linkIndex] = greenStrength;
      this.blueLinkTrafficStrengths[linkIndex] = blueStrength;

      const redGlow = redStrength * this.linkTrafficGlow * this.opticsProfile.illumination;
      const greenGlow = greenStrength * this.linkTrafficGlow * this.opticsProfile.illumination;
      const blueGlow = blueStrength * this.linkTrafficGlow * this.opticsProfile.illumination;
      let failureGlow = 0;
      let recoveryGlow = 0;
      for (const wave of this.switchTransitionWaves) {
        const switchPosition = SWITCH_POSITIONS[wave.switchIndex];
        if (link.start !== switchPosition && link.end !== switchPosition) {
          continue;
        }

        const progress = (animationTime - wave.startedAt) / wave.duration;
        if (progress < 0 || progress >= 1) {
          continue;
        }

        const strength =
          Math.sin(progress * Math.PI) *
          (1 - progress * 0.5) *
          this.switchTransitionIntensity *
          this.opticsProfile.motion;
        if (wave.kind === 'failure') {
          failureGlow = Math.max(failureGlow, strength);
        } else {
          recoveryGlow = Math.max(recoveryGlow, strength);
        }
      }

      const congested =
        isFailedSwitchPosition(link.start, this.congestedSwitchIndices) ||
        isFailedSwitchPosition(link.end, this.congestedSwitchIndices);
      const pressureGlow = congested
        ? (0.5 + 0.5 * Math.sin(animationTime * 7.2 + linkIndex * 0.41)) *
          this.congestionPressureIntensity *
          this.opticsProfile.motion
        : 0;
      const signalGlow = failureGlow + recoveryGlow + pressureGlow;
      const totalGlow = Math.min(redGlow + greenGlow + blueGlow + signalGlow * 0.48, 1);
      const colorOffset = linkIndex * 4;
      this.linkColors[colorOffset] = Math.min(
        (link.color[0] +
          redGlow * 0.3 +
          greenGlow * 0.055 +
          blueGlow * 0.045 +
          failureGlow * 0.2 +
          pressureGlow * 0.16) *
          backgroundStrength +
          routeGlow * 0.24,
        1
      );
      this.linkColors[colorOffset + 1] = Math.min(
        (link.color[1] +
          redGlow * 0.04 +
          greenGlow * 0.27 +
          blueGlow * 0.13 +
          recoveryGlow * 0.14 +
          pressureGlow * 0.085) *
          backgroundStrength +
          routeGlow * 0.7,
        1
      );
      this.linkColors[colorOffset + 2] = Math.min(
        (link.color[2] + totalGlow * 0.065 + blueGlow * 0.25 + recoveryGlow * 0.17) *
          backgroundStrength +
          routeGlow * 0.9,
        1
      );
      this.linkColors[colorOffset + 3] = Math.min(
        (link.color[3] + totalGlow * 0.14 + signalGlow * 0.055) * backgroundStrength +
          routeGlow * 0.16,
        0.42
      );

      if (totalGlow > 0.025) {
        illuminatedLinkCount++;
      }
      if (pathStrength > 0.003) {
        highlightedPathLinkCount++;
      }
    }

    this.links.updateColors(this.linkColors);
    this.previousLinkTrafficTime = animationTime;

    if (
      this.canvas &&
      this.canvas.dataset.packetSprayingIlluminatedLinks !== String(illuminatedLinkCount)
    ) {
      this.canvas.dataset.packetSprayingIlluminatedLinks = String(illuminatedLinkCount);
    }
    if (this.canvas) {
      this.canvas.dataset.packetSprayingOccupiedLinks = String(trafficByLink.size);
      this.canvas.dataset.packetSprayingHighlightedPathLinks = String(highlightedPathLinkCount);
    }
  }

  private updateFailureAccessibility(): void {
    if (!this.canvas) {
      return;
    }

    const congestedCount = this.congestedSwitchIndices.size;
    const failedCount = this.failedSwitchIndices.size;
    const recoveringCount = this.recoveringSwitchIndices.size;
    const activePlaneCount = getActivePlaneCount(
      getHealthyConversationRoutes(
        this.conversationRoutes,
        this.failedSwitchIndices,
        this.recoveringSwitchIndices
      )
    );
    this.canvas.dataset.packetSprayingCongestedSwitches = String(congestedCount);
    this.canvas.dataset.packetSprayingFailedSwitches = String(failedCount);
    this.canvas.dataset.packetSprayingRecoveringSwitches = String(recoveringCount);
    this.canvas.dataset.packetSprayingActivePlanes = String(activePlaneCount);
    this.canvas.dataset.packetSprayingDroppedPackets = String(this.droppedPacketCount);
    this.canvas.dataset.packetSprayingTrimmedPackets = String(this.trimmedPacketCount);
    this.canvas.setAttribute(
      'aria-label',
      failedCount === 0 && congestedCount === 0 && recoveringCount === 0
        ? 'Network packet spraying: all switches online'
        : `Network packet spraying: ${congestedCount} congested, ${failedCount} failed, ${recoveringCount} recovering, ${activePlaneCount} healthy backbone path${activePlaneCount === 1 ? '' : 's'}`
    );
  }

  private resizeSceneFramebuffer(width: number, height: number): void {
    if (this.sceneFramebuffer.width === width && this.sceneFramebuffer.height === height) {
      return;
    }

    const previousSceneTexture = this.sceneTexture;
    const previousRefractionTexture = this.refractionTexture;
    const previousBackfaceTexture = this.glassBackfaceTexture;
    this.sceneFramebuffer.resize({width, height});
    this.glassBackfaceFramebuffer.resize({width, height});
    this.sceneTexture = this.sceneFramebuffer.colorAttachments[0].texture;
    this.glassBackfaceTexture = this.glassBackfaceFramebuffer.colorAttachments[0].texture;
    this.refractionTexture = makeRefractionTexture(
      this.sceneTexture.device,
      width,
      height,
      this.sceneColorFormat
    );
    this.postprocessingRenderer.resize([width, height]);
    const glassBindings = {
      glassSceneColorTexture: this.refractionTexture,
      glassSceneDepthTexture: this.sceneFramebuffer.depthStencilAttachment!.texture,
      glassBackfaceTexture: this.glassBackfaceTexture,
      glassEnvironmentTexture: this.environmentTexture
    };
    for (const group of this.glassGroups) {
      group.sorted.model.setBindings(glassBindings);
      group.aBuffer?.model.setBindings(glassBindings);
      group.weightedBlended?.model.setBindings(glassBindings);
    }
    previousSceneTexture.destroy();
    previousRefractionTexture.destroy();
    previousBackfaceTexture.destroy();
  }

  private sortGlassGroups(viewMatrix: Matrix4): GlassRenderGroup[] {
    const sortedGroups: GlassRenderGroup[] = [];

    this.glassScenegraph.traverseDepthSorted(
      node => {
        const group = this.glassGroups.find(candidate => candidate.node === node);
        if (group) {
          sortedGroups.push(group);
        }
      },
      {viewMatrix}
    );

    return sortedGroups;
  }

  private sortGlassInstances(group: GlassRenderGroup, cameraPosition: Vector3): void {
    const sortedInstances = group.instances
      .map((instance, instanceIndex) => ({
        instance,
        switchIndex: group.switchIndices[instanceIndex]
      }))
      .sort(
        (first, second) =>
          getDistanceSquared(second.instance.position, cameraPosition) -
          getDistanceSquared(first.instance.position, cameraPosition)
      );
    group.sorted.updateInstances(
      flattenMatrices(sortedInstances.map(({instance}) => instance.matrix)),
      flattenColors(
        sortedInstances.map(({instance, switchIndex}) =>
          this.getHighlightedSwitchColor(instance.color, switchIndex)
        )
      )
    );
  }

  private updateStoryPacketVisuals(animationTime: number): void {
    this.storyPacketMatrices.fill(0);
    this.storyPacketColors.fill(0);
    let instanceIndex = 0;

    const addParticle = (position: Vector3, radius: number, color: Color): void => {
      if (instanceIndex >= MAX_STORY_PACKET_INSTANCES) {
        return;
      }
      this.storyPacketMatrices.set(
        makeObjectMatrix(position, [radius, radius, radius]),
        instanceIndex * 16
      );
      this.storyPacketColors.set(color, instanceIndex * 4);
      instanceIndex++;
    };

    this.queuedPacketDefinitions = [...this.congestedSwitchIndices].flatMap(switchIndex =>
      makeSwitchQueuePackets(this.packetDefinitions, switchIndex, animationTime)
    );
    for (const queuedPacket of this.queuedPacketDefinitions) {
      addParticle(
        queuedPacket.position,
        0.034 + queuedPacket.strength * 0.009,
        makeBalancedEmissionColor(queuedPacket.color, queuedPacket.strength * 0.84)
      );
    }
    if (this.canvas) {
      this.canvas.dataset.packetSprayingQueuedPackets = String(this.queuedPacketDefinitions.length);
    }

    for (const event of this.networkPacketEvents) {
      const age = animationTime - event.startedAt;
      if (age < 0 || age > event.duration) {
        continue;
      }

      if (event.kind === 'retransmission') {
        const distance = Math.min(event.route.totalLength, age * PACKET_TRAVEL_SPEED * 1.16);
        addParticle(
          getPointAlongRoute(event.route, distance / event.route.totalLength),
          0.041,
          makeBalancedEmissionColor(event.color, 0.98)
        );
        continue;
      }

      const switchPosition = SWITCH_POSITIONS[event.switchIndex];
      const routePointIndex = event.route.points.indexOf(switchPosition);
      if (!switchPosition || routePointIndex < 0) {
        continue;
      }

      if (event.kind === 'dropped-payload' || event.kind === 'trimmed-payload') {
        const progress = age / event.duration;
        const fragmentCount = event.kind === 'dropped-payload' ? 10 : 6;
        const spread = (event.kind === 'dropped-payload' ? 1.42 : 0.78) * age;
        const fragmentRadius =
          (event.kind === 'dropped-payload' ? 0.043 : 0.028) * (1 - progress * 0.78);
        const fragmentColor = makeBalancedEmissionColor(
          event.color,
          Math.max(0, (1 - progress) * 0.82)
        );

        for (let fragmentIndex = 0; fragmentIndex < fragmentCount; fragmentIndex++) {
          const angle =
            fragmentIndex * 2.399963 + event.conversationIndex * 0.74 + event.switchIndex * 0.33;
          const elevation = (fragmentIndex % 3) * 0.34 - 0.3;
          addParticle(
            [
              switchPosition[0] + Math.cos(angle) * spread,
              switchPosition[1] + elevation * spread - age * age * 0.46,
              switchPosition[2] + Math.sin(angle) * spread
            ],
            fragmentRadius,
            fragmentColor
          );
        }
        continue;
      }

      if (event.kind === 'trimmed-header') {
        const startDistance = event.route.cumulativeLengths[routePointIndex];
        const distance = Math.min(
          event.route.totalLength,
          startDistance + age * PACKET_TRAVEL_SPEED
        );
        addParticle(
          getPointAlongRoute(event.route, distance / event.route.totalLength),
          0.024,
          makeBalancedEmissionColor(event.color, 0.76)
        );
        continue;
      }

      const startDistance = 0;
      const endDistance = event.route.cumulativeLengths[routePointIndex];
      const progress = age / event.duration;
      const distance =
        event.kind === 'probe-confirmation'
          ? endDistance - (endDistance - startDistance) * progress
          : startDistance + (endDistance - startDistance) * progress;
      addParticle(
        getPointAlongRoute(event.route, distance / event.route.totalLength),
        event.kind === 'probe-confirmation' ? 0.035 : 0.029,
        event.kind === 'probe-confirmation'
          ? makeBalancedEmissionColor(event.color, event.color[3])
          : event.color
      );
    }

    const spinePathTelemetry = makeNetworkPlaneTelemetry(
      this.conversationRoutes,
      this.packetDefinitions,
      this.failedSwitchIndices,
      this.recoveringSwitchIndices,
      this.congestedSwitchIndices
    );
    const fabricTelemetry = makeNetworkFabricTelemetry(
      spinePathTelemetry,
      this.queuedPacketDefinitions,
      this.networkPacketEvents,
      animationTime
    );
    this.storyControls?.updateFabricTelemetry(fabricTelemetry);
    if (this.canvas) {
      this.canvas.dataset.packetSprayingFabricState = fabricTelemetry.state;
      this.canvas.dataset.packetSprayingCapacity = String(fabricTelemetry.capacityPercent);
      this.canvas.dataset.packetSprayingRetransmissions = String(
        fabricTelemetry.retransmissionCount
      );
    }
  }

  private updateReflectionLabPacketVisuals(animationTime: number): void {
    fillHiddenMatrices(this.packetMatrices);
    fillHiddenMatrices(this.packetTrailMatrices);
    this.packetTrailColors.fill(0);
    fillHiddenMatrices(this.switchFlashMatrices);
    this.switchFlashColors.fill(0);
    fillHiddenMatrices(this.switchRippleMatrices);
    this.switchRippleColors.fill(0);
    this.switchRippleAges.fill(Number.POSITIVE_INFINITY);
    this.switchFlashStrengths.fill(0);

    const packetPosition = getReflectionLabPacketPosition(animationTime);
    this.packetMatrices.set(
      makeObjectMatrix(packetPosition, [
        REFLECTION_LAB_PACKET_RADIUS,
        REFLECTION_LAB_PACKET_RADIUS,
        REFLECTION_LAB_PACKET_RADIUS
      ]),
      0
    );

    const previousPacketPosition = getReflectionLabPacketPosition(animationTime - 0.18);
    const trailColor = makeBalancedEmissionColor(REFLECTION_LAB_PACKET_COLOR, 0.36);
    this.packetTrailMatrices.set(
      makeSegmentMatrix(previousPacketPosition, packetPosition, PACKET_TRAIL_RADIUS * 0.72),
      0
    );
    this.packetTrailColors.set(
      [
        trailColor[0] * this.packetTrailIntensity * 0.75,
        trailColor[1] * this.packetTrailIntensity * 0.75,
        trailColor[2] * this.packetTrailIntensity * 0.75,
        trailColor[3]
      ],
      0
    );

    if (this.canvas) {
      this.canvas.dataset.packetSprayingSwitchRipples = '0';
    }
  }

  private updatePacketVisuals(animationTime: number): void {
    this.switchFlashStrengths.fill(0);
    this.switchRippleAges.fill(Number.POSITIVE_INFINITY);
    if (this.reflectionLab) {
      this.updateReflectionLabPacketVisuals(animationTime);
      return;
    }

    const packetTrailIntensity = this.packetTrailIntensity * this.opticsProfile.motion;
    const switchFlashIntensity = this.switchFlashIntensity * this.opticsProfile.motion;
    const switchRippleIntensity = this.switchRippleIntensity * this.opticsProfile.motion;

    for (let packetIndex = 0; packetIndex < this.packetDefinitions.length; packetIndex++) {
      const packet = this.packetDefinitions[packetIndex];
      const packetAge = wrap(animationTime - packet.launchTime, BURST_CYCLE_DURATION);
      const packetDistance = packetAge * PACKET_TRAVEL_SPEED;
      const packetIsVisible = packet.enabled && packetDistance <= packet.route.totalLength;
      const position: Vector3 = packetIsVisible
        ? getPointAlongRoute(packet.route, packetDistance / packet.route.totalLength)
        : [0, -100, 0];
      const matrix = makeObjectMatrix(position, [packet.scale, packet.scale, packet.scale]);
      this.packetMatrices.set(matrix, packetIndex * 16);

      const trailStartDistance = Math.max(
        getRouteSegmentStartDistance(packet.route, packetDistance),
        packetDistance - this.packetTrailLength
      );
      const trailLength = packetDistance - trailStartDistance;
      const trailMatrix =
        packetIsVisible && packetTrailIntensity > 0.005 && trailLength > 0.012
          ? makeSegmentMatrix(
              getPointAlongRoute(packet.route, trailStartDistance / packet.route.totalLength),
              position,
              PACKET_TRAIL_RADIUS
            )
          : makeObjectMatrix([0, -100, 0], [0.001, 0.001, 0.001]);
      this.packetTrailMatrices.set(trailMatrix, packetIndex * 16);
      const trailColor = makeBalancedEmissionColor(packet.color, 0.48);
      const colorOffset = packetIndex * 4;
      this.packetTrailColors.set(
        [
          trailColor[0] * packetTrailIntensity,
          trailColor[1] * packetTrailIntensity,
          trailColor[2] * packetTrailIntensity,
          trailColor[3]
        ],
        colorOffset
      );
    }

    for (const arrival of this.switchArrivalEvents) {
      const arrivalAge = wrap(animationTime - arrival.arrivalTime, BURST_CYCLE_DURATION);
      const flashIndex = arrival.switchIndex * CONVERSATIONS.length + arrival.conversationIndex;
      if (arrivalAge < SWITCH_RIPPLE_DURATION) {
        this.switchRippleAges[flashIndex] = Math.min(this.switchRippleAges[flashIndex], arrivalAge);
      }
      if (arrivalAge >= SWITCH_FLASH_DURATION) {
        continue;
      }

      const attack = smoothstep(0, 0.018, arrivalAge);
      const decay = Math.exp(-arrivalAge * 15);
      this.switchFlashStrengths[flashIndex] = Math.min(
        1,
        this.switchFlashStrengths[flashIndex] + attack * decay
      );
    }

    let activeRippleCount = 0;
    for (let switchIndex = 0; switchIndex < this.glassInstances.length; switchIndex++) {
      const glassInstance = this.glassInstances[switchIndex];
      const switchRadius =
        switchIndex < LEAF_POSITIONS.length
          ? LEAF_SWITCH_RADIUS
          : switchIndex < LEAF_POSITIONS.length + AGGREGATION_POSITIONS.length
            ? AGGREGATION_SWITCH_RADIUS
            : SPINE_SWITCH_RADIUS;
      for (
        let conversationIndex = 0;
        conversationIndex < CONVERSATIONS.length;
        conversationIndex++
      ) {
        const flashIndex = switchIndex * CONVERSATIONS.length + conversationIndex;
        const flashStrength = this.switchFlashStrengths[flashIndex] * switchFlashIntensity;
        const flashRadius = 0.055 + Math.min(flashStrength, 1) * 0.085;
        const flashMatrix =
          flashStrength > 0.01
            ? makeObjectMatrix(glassInstance.position, [flashRadius, flashRadius, flashRadius])
            : makeObjectMatrix([0, -100, 0], [0.001, 0.001, 0.001]);
        this.switchFlashMatrices.set(flashMatrix, flashIndex * 16);

        const flashColor = makeBalancedEmissionColor(CONVERSATIONS[conversationIndex].color, 1);
        this.switchFlashColors.set(
          [
            flashColor[0] * flashStrength * 0.32,
            flashColor[1] * flashStrength * 0.32,
            flashColor[2] * flashStrength * 0.32,
            Math.min(flashStrength * 0.58, 0.55)
          ],
          flashIndex * 4
        );

        const rippleAge = this.switchRippleAges[flashIndex];
        const rippleProgress = rippleAge / SWITCH_RIPPLE_DURATION;
        const rippleStrength =
          rippleProgress < 1
            ? Math.sin(rippleProgress * Math.PI) *
              (1 - rippleProgress * 0.35) *
              switchRippleIntensity
            : 0;
        const rippleRadius = switchRadius * (0.2 + rippleProgress * 0.72);
        const rippleMatrix =
          rippleStrength > 0.004
            ? makeObjectMatrix(glassInstance.position, [rippleRadius, rippleRadius, rippleRadius])
            : makeObjectMatrix([0, -100, 0], [0.001, 0.001, 0.001]);
        this.switchRippleMatrices.set(rippleMatrix, flashIndex * 16);
        this.switchRippleColors.set(
          [
            flashColor[0] * rippleStrength * 0.14,
            flashColor[1] * rippleStrength * 0.14,
            flashColor[2] * rippleStrength * 0.14,
            Math.min(rippleStrength * 0.28, 0.22)
          ],
          flashIndex * 4
        );
        if (rippleStrength > 0.004) {
          activeRippleCount++;
        }
      }
    }

    if (
      this.canvas &&
      this.canvas.dataset.packetSprayingSwitchRipples !== String(activeRippleCount)
    ) {
      this.canvas.dataset.packetSprayingSwitchRipples = String(activeRippleCount);
    }
  }

  private makePacketLights(): OpticalPointLight[] {
    if (this.reflectionLab) {
      const packetPosition = getReflectionLabPacketPosition(this.animationTime);
      return [
        {
          position: packetPosition,
          color: [
            REFLECTION_LAB_PACKET_COLOR[0],
            REFLECTION_LAB_PACKET_COLOR[1],
            REFLECTION_LAB_PACKET_COLOR[2]
          ],
          intensity: 1,
          radius: this.packetLightRadius * 0.92
        }
      ];
    }

    if (
      this.packetLightIntensity <= 0 ||
      this.packetLightRadius <= 0 ||
      this.opticsProfile.illumination <= 0.002
    ) {
      return [];
    }

    const candidatesByRoute = new Map<
      Packet['route'],
      {color: Vector3; position: Vector3; switchDistance: number; switchSurfaceDistance: number}[]
    >();

    for (let packetIndex = 0; packetIndex < this.packetDefinitions.length; packetIndex++) {
      const matrixOffset = packetIndex * 16;
      const position: Vector3 = [
        this.packetMatrices[matrixOffset + 12],
        this.packetMatrices[matrixOffset + 13],
        this.packetMatrices[matrixOffset + 14]
      ];
      if (position[1] < HOST_Y - 1) {
        continue;
      }

      const packet = this.packetDefinitions[packetIndex];
      let nearestSwitchIndex = 0;
      let nearestSwitchDistance = Number.POSITIVE_INFINITY;
      for (let switchIndex = 0; switchIndex < SWITCH_POSITIONS.length; switchIndex++) {
        const switchDistance = getDistanceSquared(position, SWITCH_POSITIONS[switchIndex]);
        if (switchDistance < nearestSwitchDistance) {
          nearestSwitchDistance = switchDistance;
          nearestSwitchIndex = switchIndex;
        }
      }
      const nearestSwitchRadius =
        nearestSwitchIndex < LEAF_POSITIONS.length
          ? LEAF_SWITCH_RADIUS
          : nearestSwitchIndex < LEAF_POSITIONS.length + AGGREGATION_POSITIONS.length
            ? AGGREGATION_SWITCH_RADIUS
            : SPINE_SWITCH_RADIUS;
      const candidates = candidatesByRoute.get(packet.route) || [];
      candidates.push({
        color: [packet.color[0], packet.color[1], packet.color[2]],
        position,
        switchDistance: nearestSwitchDistance,
        switchSurfaceDistance: Math.max(Math.sqrt(nearestSwitchDistance) - nearestSwitchRadius, 0)
      });
      candidatesByRoute.set(packet.route, candidates);
    }

    const lights: OpticalPointLight[] = [];
    const secondaryLights: OpticalPointLight[] = [];
    for (const candidates of candidatesByRoute.values()) {
      candidates.sort((first, second) => first.switchDistance - second.switchDistance);
      for (const [candidateIndex, candidate] of candidates.slice(0, 2).entries()) {
        const arrivalResponse = 1 - smoothstep(0.04, 0.3, candidate.switchSurfaceDistance);
        const light = {
          position: candidate.position,
          color: candidate.color,
          intensity: 0.28 + arrivalResponse * 0.72,
          radius: this.packetLightRadius * (0.32 + arrivalResponse * 0.38)
        };
        if (candidateIndex === 0) {
          lights.push(light);
        } else {
          secondaryLights.push(light);
        }
      }
    }

    const switchFlashLights: OpticalPointLight[] = [];
    for (let switchIndex = 0; switchIndex < this.glassInstances.length; switchIndex++) {
      for (
        let conversationIndex = 0;
        conversationIndex < CONVERSATIONS.length;
        conversationIndex++
      ) {
        const flashIndex = switchIndex * CONVERSATIONS.length + conversationIndex;
        const flashStrength =
          this.switchFlashStrengths[flashIndex] *
          this.switchFlashIntensity *
          this.opticsProfile.motion;
        if (flashStrength <= 0.08) {
          continue;
        }

        const color = CONVERSATIONS[conversationIndex].color;
        switchFlashLights.push({
          position: this.glassInstances[switchIndex].position,
          color: [color[0], color[1], color[2]],
          intensity: flashStrength * 1.7,
          radius: this.packetLightRadius * 0.8
        });
      }
    }

    switchFlashLights.sort((first, second) => (second.intensity || 0) - (first.intensity || 0));
    const transitionLights: OpticalPointLight[] = [];
    for (const wave of this.switchTransitionWaves) {
      const progress = (this.animationTime - wave.startedAt) / wave.duration;
      if (progress <= 0 || progress >= 1) {
        continue;
      }

      transitionLights.push({
        position: SWITCH_POSITIONS[wave.switchIndex],
        color: [wave.color[0], wave.color[1], wave.color[2]],
        intensity:
          Math.sin(progress * Math.PI) *
          this.switchTransitionIntensity *
          this.opticsProfile.motion *
          1.25,
        radius: this.packetLightRadius * 1.3
      });
    }

    const endpointLights: OpticalPointLight[] = this.endpointSignalDefinitions.map(signal => ({
      position: [
        HOST_POSITIONS[signal.hostIndex][0],
        HOST_POSITIONS[signal.hostIndex][1] + HOST_HALF_EXTENTS[1] + 0.045,
        HOST_POSITIONS[signal.hostIndex][2]
      ],
      color: [signal.color[0], signal.color[1], signal.color[2]],
      intensity: signal.strength * this.endpointSignalIntensity * this.opticsProfile.motion * 0.65,
      radius: this.packetLightRadius * 0.65
    }));
    const queueLights: OpticalPointLight[] = this.queuedPacketDefinitions
      .slice(0, 4)
      .map(packet => ({
        position: packet.position,
        color: [packet.color[0], packet.color[1], packet.color[2]],
        intensity: packet.strength * this.opticsProfile.motion * 0.74,
        radius: this.packetLightRadius * 0.58
      }));
    return [
      ...queueLights,
      ...lights,
      ...endpointLights,
      ...transitionLights,
      ...switchFlashLights.slice(0, MAX_SWITCH_FLASH_LIGHTS),
      ...secondaryLights
    ].slice(0, 16);
  }

  private makeCausticLenses(
    packetLights: readonly OpticalPointLight[],
    animationTime: number
  ): OpticalCausticLens[] {
    const previousTime = this.previousCausticTime;
    const timeDelta = previousTime === null ? 1 : Math.min(animationTime - previousTime, 0.15);
    const attack = previousTime === null ? 1 : 1 - Math.exp(-Math.max(timeDelta, 0) * 9);
    const decay = previousTime === null ? 1 : 1 - Math.exp(-Math.max(timeDelta, 0) * 4);
    const lenses: OpticalCausticLens[] = [];
    this.previousCausticTime = animationTime;

    for (let switchIndex = 0; switchIndex < this.glassInstances.length; switchIndex++) {
      const glassInstance = this.glassInstances[switchIndex];
      const radius =
        switchIndex < LEAF_POSITIONS.length
          ? LEAF_SWITCH_RADIUS
          : switchIndex < LEAF_POSITIONS.length + AGGREGATION_POSITIONS.length
            ? AGGREGATION_SWITCH_RADIUS
            : SPINE_SWITCH_RADIUS;
      const incomingColor: Vector3 = [0, 0, 0];

      for (const packetLight of packetLights) {
        const distance = getDistance(packetLight.position, glassInstance.position);
        const influenceRadius = radius * 1.9;
        if (distance >= influenceRadius) {
          continue;
        }

        const contribution = (1 - distance / influenceRadius) ** 2 * (packetLight.intensity ?? 1);
        incomingColor[0] += packetLight.color[0] * contribution;
        incomingColor[1] += packetLight.color[1] * contribution;
        incomingColor[2] += packetLight.color[2] * contribution;
      }

      const colorOffset = switchIndex * 3;
      for (let colorIndex = 0; colorIndex < 3; colorIndex++) {
        const previousColor = this.causticLensLightColors[colorOffset + colorIndex];
        const targetColor = incomingColor[colorIndex];
        const smoothing = targetColor > previousColor ? attack : decay;
        this.causticLensLightColors[colorOffset + colorIndex] =
          previousColor + (targetColor - previousColor) * smoothing;
      }

      const red = this.causticLensLightColors[colorOffset];
      const green = this.causticLensLightColors[colorOffset + 1];
      const blue = this.causticLensLightColors[colorOffset + 2];
      const intensity = Math.max(red, green, blue);
      if (intensity < 0.035) {
        continue;
      }

      lenses.push({
        position: glassInstance.position,
        radius,
        color: [red / intensity, green / intensity, blue / intensity],
        intensity: Math.min(intensity * 0.68, 1.2)
      });
    }

    return lenses
      .sort((first, second) => (second.intensity ?? 0) - (first.intensity ?? 0))
      .slice(0, MAX_OPTICAL_CAUSTIC_LENSES);
  }

  private makePanel(): Panel {
    return makeExampleTabbedPanel({
      id: 'packet-spraying-info',
      title: 'Effects: Glass',
      panels: [
        makeHtmlCustomPanel({
          id: 'packet-spraying-overview',
          title: 'Overview',
          html: PACKET_SPRAYING_OVERVIEW_HTML
        }),
        this.settingsPanel.makePanel(),
        makeHtmlCustomPanel({
          id: 'packet-spraying-mrc',
          title: 'MRC Explained',
          html: PACKET_SPRAYING_BACKGROUND_HTML
        }),
        makeHtmlCustomPanel({
          id: 'packet-spraying-optics',
          title: 'GPU Optics',
          html: PACKET_SPRAYING_OPTICS_HTML
        })
      ]
    });
  }

  private readonly handleSettingsChange = (
    _settings: Record<string, unknown>,
    changedSettings?: SettingsChangeDescriptor[]
  ): void => {
    const transparencyMode = getChangedSetting(changedSettings, 'transparencyMode')?.nextValue;
    if (isTransparencyMode(transparencyMode)) {
      this.transparencyMode = transparencyMode;
      if (this.canvas) {
        this.canvas.dataset.packetSprayingTransparencyMode = transparencyMode;
      }
    }

    const visualIntensity = getChangedSetting(changedSettings, 'visualIntensity')?.nextValue;
    if (typeof visualIntensity === 'number') {
      this.setVisualIntensity(visualIntensity, false);
    }

    const adaptiveRouting = getChangedSetting(changedSettings, 'adaptiveRouting')?.nextValue;
    if (typeof adaptiveRouting === 'boolean') {
      this.adaptiveRouting = adaptiveRouting;
      this.updateHealthyRoutes();
      this.updateFailureAccessibility();
    }

    const speed = getChangedSetting(changedSettings, 'speed')?.nextValue;
    if (typeof speed === 'number') {
      this.speed = speed;
    }

    const orbit = getChangedSetting(changedSettings, 'orbit')?.nextValue;
    if (typeof orbit === 'number') {
      this.orbit = orbit;
      if (this.orbitControls) {
        this.orbitControls.props.autoRotateSpeed = orbit;
        this.orbitControls.setAutoRotate(orbit > 0);
      }
    }

    const glassIndexOfRefraction = getChangedSetting(
      changedSettings,
      'glassIndexOfRefraction'
    )?.nextValue;
    if (typeof glassIndexOfRefraction === 'number') {
      this.glassIndexOfRefraction = glassIndexOfRefraction;
    }

    const glassRoughness = getChangedSetting(changedSettings, 'glassRoughness')?.nextValue;
    if (typeof glassRoughness === 'number') {
      this.glassRoughness = glassRoughness;
    }

    const glassDispersion = getChangedSetting(changedSettings, 'glassDispersion')?.nextValue;
    if (typeof glassDispersion === 'number') {
      this.glassDispersion = glassDispersion;
    }

    const glassThickness = getChangedSetting(changedSettings, 'glassThickness')?.nextValue;
    if (typeof glassThickness === 'number') {
      this.glassThickness = glassThickness;
    }

    const glassRefractionStrength = getChangedSetting(
      changedSettings,
      'glassRefractionStrength'
    )?.nextValue;
    if (typeof glassRefractionStrength === 'number') {
      this.glassRefractionStrength = glassRefractionStrength;
    }

    const glassFresnelStrength = getChangedSetting(
      changedSettings,
      'glassFresnelStrength'
    )?.nextValue;
    if (typeof glassFresnelStrength === 'number') {
      this.glassFresnelStrength = glassFresnelStrength;
    }

    const glassClearcoatStrength = getChangedSetting(
      changedSettings,
      'glassClearcoatStrength'
    )?.nextValue;
    if (typeof glassClearcoatStrength === 'number') {
      this.glassClearcoatStrength = glassClearcoatStrength;
    }

    const glassIridescenceStrength = getChangedSetting(
      changedSettings,
      'glassIridescenceStrength'
    )?.nextValue;
    if (typeof glassIridescenceStrength === 'number') {
      this.glassIridescenceStrength = glassIridescenceStrength;
    }

    const glassInternalReflectionStrength = getChangedSetting(
      changedSettings,
      'glassInternalReflectionStrength'
    )?.nextValue;
    if (typeof glassInternalReflectionStrength === 'number') {
      this.glassInternalReflectionStrength = glassInternalReflectionStrength;
    }

    const glassTransmissionStrength = getChangedSetting(
      changedSettings,
      'glassTransmissionStrength'
    )?.nextValue;
    if (typeof glassTransmissionStrength === 'number') {
      this.glassTransmissionStrength = glassTransmissionStrength;
    }

    const glassEnvironmentIntensity = getChangedSetting(
      changedSettings,
      'glassEnvironmentIntensity'
    )?.nextValue;
    if (typeof glassEnvironmentIntensity === 'number') {
      this.glassEnvironmentIntensity = glassEnvironmentIntensity;
    }

    const glassEnvironmentPrefilterStrength = getChangedSetting(
      changedSettings,
      'glassEnvironmentPrefilterStrength'
    )?.nextValue;
    if (typeof glassEnvironmentPrefilterStrength === 'number') {
      this.glassEnvironmentPrefilterStrength = glassEnvironmentPrefilterStrength;
    }

    const glassContactShadowStrength = getChangedSetting(
      changedSettings,
      'glassContactShadowStrength'
    )?.nextValue;
    if (typeof glassContactShadowStrength === 'number') {
      this.glassContactShadowStrength = glassContactShadowStrength;
    }

    const glassVolumeThickness = getChangedSetting(
      changedSettings,
      'glassVolumeThickness'
    )?.nextValue;
    if (typeof glassVolumeThickness === 'number') {
      this.glassVolumeThickness = glassVolumeThickness;
    }

    const glassRoughTransmissionStrength = getChangedSetting(
      changedSettings,
      'glassRoughTransmissionStrength'
    )?.nextValue;
    if (typeof glassRoughTransmissionStrength === 'number') {
      this.glassRoughTransmissionStrength = glassRoughTransmissionStrength;
    }

    const glassSpectralAbsorptionStrength = getChangedSetting(
      changedSettings,
      'glassSpectralAbsorptionStrength'
    )?.nextValue;
    if (typeof glassSpectralAbsorptionStrength === 'number') {
      this.glassSpectralAbsorptionStrength = glassSpectralAbsorptionStrength;
    }

    const glassThinFilmThickness = getChangedSetting(
      changedSettings,
      'glassThinFilmThickness'
    )?.nextValue;
    if (typeof glassThinFilmThickness === 'number') {
      this.glassThinFilmThickness = glassThinFilmThickness;
    }

    const glassThinFilmStrength = getChangedSetting(
      changedSettings,
      'glassThinFilmStrength'
    )?.nextValue;
    if (typeof glassThinFilmStrength === 'number') {
      this.glassThinFilmStrength = glassThinFilmStrength;
    }

    const glassVolumeScatteringStrength = getChangedSetting(
      changedSettings,
      'glassVolumeScatteringStrength'
    )?.nextValue;
    if (typeof glassVolumeScatteringStrength === 'number') {
      this.glassVolumeScatteringStrength = glassVolumeScatteringStrength;
    }

    const glassDynamicReflectionStrength = getChangedSetting(
      changedSettings,
      'glassDynamicReflectionStrength'
    )?.nextValue;
    if (typeof glassDynamicReflectionStrength === 'number') {
      this.glassDynamicReflectionStrength = glassDynamicReflectionStrength;
    }

    const glassSecondaryBounceStrength = getChangedSetting(
      changedSettings,
      'glassSecondaryBounceStrength'
    )?.nextValue;
    if (typeof glassSecondaryBounceStrength === 'number') {
      this.glassSecondaryBounceStrength = glassSecondaryBounceStrength;
    }

    const glassFaultDistortionStrength = getChangedSetting(
      changedSettings,
      'glassFaultDistortionStrength'
    )?.nextValue;
    if (typeof glassFaultDistortionStrength === 'number') {
      this.glassFaultDistortionStrength = glassFaultDistortionStrength;
    }

    const packetEmission = getChangedSetting(changedSettings, 'packetEmission')?.nextValue;
    if (typeof packetEmission === 'number') {
      this.packetEmission = packetEmission;
    }

    const packetTrailLength = getChangedSetting(changedSettings, 'packetTrailLength')?.nextValue;
    if (typeof packetTrailLength === 'number') {
      this.packetTrailLength = packetTrailLength;
    }

    const packetTrailIntensity = getChangedSetting(
      changedSettings,
      'packetTrailIntensity'
    )?.nextValue;
    if (typeof packetTrailIntensity === 'number') {
      this.packetTrailIntensity = packetTrailIntensity;
    }

    const switchFlashIntensity = getChangedSetting(
      changedSettings,
      'switchFlashIntensity'
    )?.nextValue;
    if (typeof switchFlashIntensity === 'number') {
      this.switchFlashIntensity = switchFlashIntensity;
    }

    const switchRippleIntensity = getChangedSetting(
      changedSettings,
      'switchRippleIntensity'
    )?.nextValue;
    if (typeof switchRippleIntensity === 'number') {
      this.switchRippleIntensity = switchRippleIntensity;
    }

    const switchTransitionIntensity = getChangedSetting(
      changedSettings,
      'switchTransitionIntensity'
    )?.nextValue;
    if (typeof switchTransitionIntensity === 'number') {
      this.switchTransitionIntensity = switchTransitionIntensity;
    }

    const packetLightIntensity = getChangedSetting(
      changedSettings,
      'packetLightIntensity'
    )?.nextValue;
    if (typeof packetLightIntensity === 'number') {
      this.packetLightIntensity = packetLightIntensity;
    }

    const packetLightRadius = getChangedSetting(changedSettings, 'packetLightRadius')?.nextValue;
    if (typeof packetLightRadius === 'number') {
      this.packetLightRadius = packetLightRadius;
    }

    const linkTrafficGlow = getChangedSetting(changedSettings, 'linkTrafficGlow')?.nextValue;
    if (typeof linkTrafficGlow === 'number') {
      this.linkTrafficGlow = linkTrafficGlow;
    }

    const linkPulseLength = getChangedSetting(changedSettings, 'linkPulseLength')?.nextValue;
    if (typeof linkPulseLength === 'number') {
      this.linkPulseLength = linkPulseLength;
    }

    const linkPulseIntensity = getChangedSetting(changedSettings, 'linkPulseIntensity')?.nextValue;
    if (typeof linkPulseIntensity === 'number') {
      this.linkPulseIntensity = linkPulseIntensity;
    }

    const endpointSignalIntensity = getChangedSetting(
      changedSettings,
      'endpointSignalIntensity'
    )?.nextValue;
    if (typeof endpointSignalIntensity === 'number') {
      this.endpointSignalIntensity = endpointSignalIntensity;
    }

    const congestionPressureIntensity = getChangedSetting(
      changedSettings,
      'congestionPressureIntensity'
    )?.nextValue;
    if (typeof congestionPressureIntensity === 'number') {
      this.congestionPressureIntensity = congestionPressureIntensity;
    }

    const causticIntensity = getChangedSetting(changedSettings, 'causticIntensity')?.nextValue;
    if (typeof causticIntensity === 'number') {
      this.causticIntensity = causticIntensity;
    }

    const causticFocus = getChangedSetting(changedSettings, 'causticFocus')?.nextValue;
    if (typeof causticFocus === 'number') {
      this.causticFocus = causticFocus;
    }

    const bloomIntensity = getChangedSetting(changedSettings, 'bloomIntensity')?.nextValue;
    if (typeof bloomIntensity === 'number') {
      this.bloomIntensity = bloomIntensity;
    }

    const bloomThreshold = getChangedSetting(changedSettings, 'bloomThreshold')?.nextValue;
    if (typeof bloomThreshold === 'number') {
      this.bloomThreshold = bloomThreshold;
    }

    const exposure = getChangedSetting(changedSettings, 'exposure')?.nextValue;
    if (typeof exposure === 'number') {
      this.exposure = exposure;
    }

    const hdrHighlightBoost = getChangedSetting(changedSettings, 'hdrHighlightBoost')?.nextValue;
    if (typeof hdrHighlightBoost === 'number') {
      this.setHdrHighlightBoost(hdrHighlightBoost, false);
    }
  };
}

function makeGlassInstances(): GlassInstance[] {
  const makeInstance = (position: Vector3, radius: number, color: Color): GlassInstance => ({
    position,
    matrix: makeObjectMatrix(position, [radius, radius, radius]),
    color
  });

  return [
    ...LEAF_POSITIONS.map(position =>
      makeInstance(position, LEAF_SWITCH_RADIUS, [0.28, 0.48, 0.82, 0.3])
    ),
    ...AGGREGATION_POSITIONS.map(position =>
      makeInstance(position, AGGREGATION_SWITCH_RADIUS, [0.3, 0.5, 0.86, 0.3])
    ),
    ...SPINE_POSITIONS.map(position =>
      makeInstance(position, SPINE_SWITCH_RADIUS, [0.3, 0.5, 0.9, 0.34])
    )
  ];
}

function makeReflectionLabGlassInstances(): GlassInstance[] {
  return makeGlassInstances().map((instance, switchIndex) =>
    switchIndex === REFLECTION_LAB_SWITCH_INDEX
      ? {
          position: REFLECTION_LAB_SPHERE_POSITION,
          matrix: makeObjectMatrix(REFLECTION_LAB_SPHERE_POSITION, [
            REFLECTION_LAB_SPHERE_RADIUS,
            REFLECTION_LAB_SPHERE_RADIUS,
            REFLECTION_LAB_SPHERE_RADIUS
          ]),
          color: [0.28, 0.5, 0.92, 0.34]
        }
      : {
          position: instance.position,
          matrix: makeHiddenMatrix(),
          color: [0, 0, 0, 0]
        }
  );
}

function makeReflectionLabHostMatrices(): Float32Array {
  return flattenMatrices(
    HOST_POSITIONS.map((_, hostIndex) =>
      hostIndex === 0 ? makeObjectMatrix([0, -1.55, 0.2], [0.45, 0.18, 0.34]) : makeHiddenMatrix()
    )
  );
}

function makeReflectionLabHostColors(): Float32Array {
  return flattenColors(
    HOST_POSITIONS.map((_, hostIndex) =>
      hostIndex === 0 ? ([0.08, 0.18, 0.34, 1] as Color) : ([0, 0, 0, 0] as Color)
    )
  );
}

function makeReflectionLabPacketColors(packetCount: number, alpha: number): Float32Array {
  return flattenColors(
    Array.from({length: packetCount}, (_, packetIndex) =>
      packetIndex === 0
        ? makeBalancedEmissionColor(REFLECTION_LAB_PACKET_COLOR, alpha)
        : ([0, 0, 0, 0] as Color)
    )
  );
}

function getReflectionLabPacketPosition(animationTime: number): Vector3 {
  const progress = wrap(animationTime * 0.18, 1);
  const easedProgress = progress * progress * (3 - 2 * progress);
  return [
    -1.08 + easedProgress * 2.16,
    -1.04 + easedProgress * 1.92,
    1.04 + Math.sin(progress * Math.PI * 2) * 0.045
  ];
}

function makeBalancedEmissionColor(color: Color, alpha: number): Color {
  const luminance = color[0] * 0.2126 + color[1] * 0.7152 + color[2] * 0.0722;
  const brightnessScale = 0.45 / Math.max(luminance, 0.2);
  return [
    color[0] * brightnessScale,
    color[1] * brightnessScale,
    color[2] * brightnessScale,
    alpha
  ];
}

function makeBloomPipeline(colorFormat: TextureFormatColor): ShaderPassPipeline {
  return {
    ...bloomShaderPassPipeline,
    renderTargets: Object.fromEntries(
      Object.entries(bloomShaderPassPipeline.renderTargets).map(([targetName, renderTarget]) => [
        targetName,
        {...renderTarget, format: colorFormat}
      ])
    )
  };
}

function getSceneColorFormat(device: Device): TextureFormatColor {
  const floatingPointCapabilities = device.getTextureFormatCapabilities('rgba16float');
  if (floatingPointCapabilities.render && floatingPointCapabilities.filter) {
    return 'rgba16float';
  }
  return device.type === 'webgpu' ? device.preferredColorFormat : 'rgba8unorm';
}

function makeSceneTexture(
  device: Device,
  width: number,
  height: number,
  format: TextureFormatColor
): Texture {
  return device.createTexture({
    id: 'packet-spraying-scene-color',
    format,
    width,
    height,
    usage: Texture.SAMPLE | Texture.RENDER | Texture.COPY_SRC,
    sampler: {
      minFilter: 'linear',
      magFilter: 'linear',
      addressModeU: 'clamp-to-edge',
      addressModeV: 'clamp-to-edge'
    }
  });
}

function makeRefractionTexture(
  device: Device,
  width: number,
  height: number,
  format: TextureFormatColor
): Texture {
  return device.createTexture({
    id: 'packet-spraying-refraction-color',
    format,
    width,
    height,
    usage: Texture.SAMPLE | Texture.COPY_DST,
    sampler: {
      minFilter: 'linear',
      magFilter: 'linear',
      addressModeU: 'clamp-to-edge',
      addressModeV: 'clamp-to-edge'
    }
  });
}

function makeBackfaceTexture(
  device: Device,
  width: number,
  height: number,
  format: TextureFormatColor
): Texture {
  return device.createTexture({
    id: 'packet-spraying-glass-backfaces',
    format,
    width,
    height,
    usage: Texture.SAMPLE | Texture.RENDER,
    sampler: {
      minFilter: 'linear',
      magFilter: 'linear',
      addressModeU: 'clamp-to-edge',
      addressModeV: 'clamp-to-edge'
    }
  });
}

function makeStudioEnvironmentTexture(device: Device): Texture {
  const mipLevels = makeStudioEnvironmentMipLevels();
  const baseLevel = mipLevels[0];
  const environmentTexture = device.createTexture({
    id: 'packet-spraying-studio-environment',
    width: baseLevel.width,
    height: baseLevel.height,
    mipLevels: mipLevels.length,
    format: 'rgba8unorm',
    usage: Texture.SAMPLE | Texture.COPY_DST,
    sampler: {
      minFilter: 'linear',
      magFilter: 'linear',
      mipmapFilter: 'linear',
      lodMaxClamp: mipLevels.length - 1,
      addressModeU: 'repeat',
      addressModeV: 'clamp-to-edge'
    }
  });

  for (const [mipLevel, {height, pixels, width}] of mipLevels.entries()) {
    environmentTexture.writeData(pixels, {height, mipLevel, width});
  }
  return environmentTexture;
}

function makeObjectMatrix(position: Vector3, scale: Vector3): Matrix4 {
  return new Matrix4().translate(position).scale(scale);
}

function makeHiddenMatrix(): Matrix4 {
  return makeObjectMatrix([0, -100, 0], [0.001, 0.001, 0.001]);
}

function makeHiddenMatrices(instanceCount: number): Float32Array {
  return flattenMatrices(Array.from({length: instanceCount}, () => makeHiddenMatrix()));
}

function fillHiddenMatrices(matrices: Float32Array): void {
  const hiddenMatrix = makeHiddenMatrix();
  for (let matrixOffset = 0; matrixOffset < matrices.length; matrixOffset += 16) {
    matrices.set(hiddenMatrix, matrixOffset);
  }
}

function makeTransparentColors(instanceCount: number): Float32Array {
  return new Float32Array(instanceCount * 4);
}

function makeLinkMatrix(link: NetworkLink, radius: number): Matrix4 {
  const distance = getDistance(link.start, link.end);
  const direction: Vector3 = [
    (link.end[0] - link.start[0]) / distance,
    (link.end[1] - link.start[1]) / distance,
    (link.end[2] - link.start[2]) / distance
  ];
  const start: Vector3 = [
    link.start[0] + direction[0] * link.startInset,
    link.start[1] + direction[1] * link.startInset,
    link.start[2] + direction[2] * link.startInset
  ];
  const end: Vector3 = [
    link.end[0] - direction[0] * link.endInset,
    link.end[1] - direction[1] * link.endInset,
    link.end[2] - direction[2] * link.endInset
  ];
  return makeSegmentMatrix(start, end, radius);
}

function makeSegmentMatrix(start: Vector3, end: Vector3, radius: number): Matrix4 {
  const direction: Vector3 = [end[0] - start[0], end[1] - start[1], end[2] - start[2]];
  const length = Math.hypot(direction[0], direction[1], direction[2]);
  const normalizedDirection: Vector3 = [
    direction[0] / length,
    direction[1] / length,
    direction[2] / length
  ];
  const midpoint: Vector3 = [
    (start[0] + end[0]) / 2,
    (start[1] + end[1]) / 2,
    (start[2] + end[2]) / 2
  ];
  const rotationAxis: Vector3 = [normalizedDirection[2], 0, -normalizedDirection[0]];
  const axisLength = Math.hypot(rotationAxis[0], rotationAxis[2]);
  const matrix = new Matrix4().translate(midpoint);

  if (axisLength > 0.00001) {
    matrix.rotateAxis(Math.acos(normalizedDirection[1]), [
      rotationAxis[0] / axisLength,
      0,
      rotationAxis[2] / axisLength
    ]);
  } else if (normalizedDirection[1] < 0) {
    matrix.rotateX(Math.PI);
  }

  return matrix.scale([radius, length, radius]);
}

function flattenMatrices(matrices: Matrix4[]): Float32Array {
  const values = new Float32Array(matrices.length * 16);
  matrices.forEach((matrix, matrixIndex) => values.set(matrix, matrixIndex * 16));
  return values;
}

function flattenColors(colors: Color[]): Float32Array {
  return new Float32Array(colors.flat());
}

function wrap(value: number, limit: number): number {
  return ((value % limit) + limit) % limit;
}

function smoothstep(edgeStart: number, edgeEnd: number, value: number): number {
  const progress = Math.max(0, Math.min(1, (value - edgeStart) / (edgeEnd - edgeStart)));
  return progress * progress * (3 - 2 * progress);
}

function isTransparencyMode(value: unknown): value is TransparencyMode {
  return value === 'a-buffer' || value === 'weighted-blended' || value === 'sorted-alpha';
}
