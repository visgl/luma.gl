// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

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
  PickingManager,
  ShaderPassRenderer,
  ShaderInputs,
  SphereGeometry,
  TruncatedConeGeometry
} from '@luma.gl/engine';
import {
  ABufferRenderer,
  OrbitControls,
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
import {
  type Panel,
  type SettingsChangeDescriptor,
  type SettingsSchema
} from '@deck.gl-community/panels';
import {
  ExamplePanelManager,
  ExampleSettingsPanelManager,
  getChangedSetting,
  makeExamplePanelHostHtml,
  makeExampleTabbedPanel,
  makeHtmlCustomPanel
} from '../../example-panels';
import {
  AGGREGATION_POSITIONS,
  AGGREGATION_SWITCH_RADIUS,
  BURST_CYCLE_DURATION,
  CONGESTION_TRIM_INTERVAL,
  CONVERSATIONS,
  FAILURE_DETECTION_DELAY,
  HOST_HALF_EXTENTS,
  HOST_POSITIONS,
  HOST_Y,
  LEAF_POSITIONS,
  LEAF_SWITCH_RADIUS,
  NETWORK_SWITCH_PLANE_COUNT,
  PACKET_TRAVEL_SPEED,
  SPINE_POSITIONS,
  SPINE_SWITCH_RADIUS,
  SWITCH_PROBE_INTERVAL,
  SWITCH_POSITIONS,
  getActivePlaneCount,
  getDistance,
  getDistanceSquared,
  getHealthyConversationRoutes,
  getNetworkPlaneSwitchIndices,
  getPointAlongRoute,
  getRouteSegmentStartDistance,
  isFailedSwitchPosition,
  makeActiveLinkKeys,
  makeConversationRoutes,
  makeEndpointSignals,
  makeHostColor,
  makeLinkColor,
  makeLinkKey,
  makeLinkPulses,
  makeLinkTraffic,
  makeLinks,
  makePackets,
  makeNetworkPlaneTelemetry,
  makeNetworkSwitchPlaneTelemetry,
  makePickableNetworkNodes,
  makeSwitchPacketEvents,
  makeSwitchProbeConfirmationEvent,
  makeSwitchProbeEvent,
  makeSwitchTransitionWave,
  makeSwitchGroups,
  makeSwitchArrivals,
  reroutePackets,
  type Color,
  type ConversationRoute,
  type NetworkLink,
  type NetworkEndpointSignal,
  type NetworkPlaneTelemetry,
  type NetworkPacketEvent,
  type NetworkScenario,
  type NetworkSwitchTransitionWave,
  type NetworkSwitchGroupId,
  type Packet,
  type PickableNetworkNode,
  type SwitchArrival,
  type Vector3
} from './network';
import {
  DEFAULT_NETWORK_OPTICS_LEVEL,
  getNetworkStoryChapter,
  getWrappedStoryChapterIndex,
  GUIDED_STORY_SWITCH_INDEX,
  makeNetworkOpticsProfile,
  MAX_NETWORK_OPTICS_LEVEL,
  NETWORK_STORY_CHAPTERS,
  type NetworkOpticsProfile,
  type NetworkStoryCamera,
  type NetworkStoryChapter
} from './story';

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
  let color = vec4<f32>(glassColor.rgb + inputs.color.rgb * failureTint * 0.46, glassColor.a);
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
  vec4 color = vec4(glassColor.rgb + vColor.rgb * failureTint * 0.46, glassColor.a);
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

class NetworkNodePopup {
  private readonly popupElement: HTMLDivElement;
  private readonly titleElement: HTMLDivElement;
  private readonly roleElement: HTMLDivElement;
  private readonly descriptionElement: HTMLParagraphElement;
  private readonly detailElement: HTMLParagraphElement;

  constructor(canvas: HTMLCanvasElement) {
    this.popupElement = document.createElement('div');
    this.popupElement.setAttribute('data-packet-spraying-node-popup', '');
    this.popupElement.setAttribute('role', 'tooltip');
    this.popupElement.setAttribute('aria-label', 'Network node details');
    Object.assign(this.popupElement.style, {
      position: 'fixed',
      zIndex: '20',
      display: 'none',
      width: 'min(280px, calc(100vw - 32px))',
      padding: '14px 16px',
      border: '1px solid rgba(132, 161, 205, 0.3)',
      borderRadius: '8px',
      background: 'rgba(11, 16, 27, 0.95)',
      boxShadow: '0 14px 36px rgba(0, 0, 0, 0.36)',
      color: '#f4f7fb',
      font: '13px/1.5 system-ui, sans-serif',
      pointerEvents: 'none'
    });

    this.titleElement = document.createElement('div');
    Object.assign(this.titleElement.style, {fontSize: '15px', fontWeight: '650'});

    this.roleElement = document.createElement('div');
    Object.assign(this.roleElement.style, {
      marginTop: '2px',
      color: '#82acf2',
      fontSize: '12px'
    });

    this.descriptionElement = document.createElement('p');
    Object.assign(this.descriptionElement.style, {margin: '10px 0 6px'});

    this.detailElement = document.createElement('p');
    Object.assign(this.detailElement.style, {margin: '0', color: '#c5d0df'});

    this.popupElement.append(
      this.titleElement,
      this.roleElement,
      this.descriptionElement,
      this.detailElement
    );
    (canvas.parentElement || document.body).appendChild(this.popupElement);
  }

  show(node: PickableNetworkNode, clientPosition: [number, number]): void {
    this.titleElement.textContent = node.title;
    this.roleElement.textContent = node.role;
    this.roleElement.style.color =
      node.status === 'offline'
        ? '#ff665a'
        : node.status === 'congested' || node.status === 'detecting'
          ? '#ffad52'
          : node.status === 'probing'
            ? '#73d3ff'
            : '#82acf2';
    this.descriptionElement.textContent = node.description;
    this.detailElement.textContent = node.detail;
    this.popupElement.style.display = 'block';

    const maximumLeft = Math.max(12, window.innerWidth - this.popupElement.offsetWidth - 12);
    const maximumTop = Math.max(12, window.innerHeight - this.popupElement.offsetHeight - 12);
    this.popupElement.style.left = `${Math.min(clientPosition[0] + 14, maximumLeft)}px`;
    this.popupElement.style.top = `${Math.min(clientPosition[1] + 14, maximumTop)}px`;
  }

  readonly hide = (): void => {
    this.popupElement.style.display = 'none';
  };

  destroy(): void {
    this.popupElement.remove();
  }
}

class NetworkOpticsPanel {
  private readonly rootElement: HTMLDivElement;
  private readonly closeButton: HTMLButtonElement;

  constructor(canvas: HTMLCanvasElement, onClose: () => void) {
    this.rootElement = document.createElement('div');
    this.rootElement.id = 'packet-spraying-optics-panel';
    this.rootElement.dataset.networkOpticsPanel = '';
    this.rootElement.hidden = true;
    this.rootElement.setAttribute('role', 'region');
    this.rootElement.setAttribute('aria-label', 'GPU optics rendering techniques');
    Object.assign(this.rootElement.style, {
      position: 'fixed',
      top: '18px',
      right: '18px',
      zIndex: '16',
      width: 'min(380px, calc(100vw - 36px))',
      maxHeight: 'min(56vh, 460px)',
      padding: '15px 17px',
      boxSizing: 'border-box',
      overflowY: 'auto',
      border: '1px solid rgba(126, 157, 205, 0.29)',
      borderRadius: '8px',
      background: 'rgba(8, 12, 20, 0.91)',
      backdropFilter: 'blur(14px)',
      color: '#edf3fc',
      font: '12px/1.5 system-ui, sans-serif'
    });

    const headerElement = document.createElement('div');
    Object.assign(headerElement.style, {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '10px'
    });
    const titleElement = document.createElement('div');
    titleElement.textContent = 'GPU OPTICS';
    Object.assign(titleElement.style, {color: '#a7c4f1', fontSize: '11px', fontWeight: '700'});

    this.closeButton = document.createElement('button');
    this.closeButton.type = 'button';
    this.closeButton.textContent = 'Close';
    this.closeButton.setAttribute('aria-label', 'Close GPU optics information');
    Object.assign(this.closeButton.style, {
      padding: '3px 8px',
      border: '1px solid rgba(140, 169, 211, 0.28)',
      borderRadius: '4px',
      background: 'rgba(30, 41, 58, 0.68)',
      color: '#dce8f8',
      cursor: 'pointer',
      font: '11px system-ui, sans-serif'
    });
    this.closeButton.addEventListener('click', onClose);
    headerElement.append(titleElement, this.closeButton);

    const contentElement = document.createElement('div');
    contentElement.innerHTML = PACKET_SPRAYING_OPTICS_HTML;
    for (const paragraph of contentElement.querySelectorAll('p')) {
      Object.assign(paragraph.style, {margin: '0 0 10px', color: '#c2cede'});
    }
    for (const heading of contentElement.querySelectorAll('h3')) {
      Object.assign(heading.style, {
        margin: '13px 0 5px',
        color: '#ecf3ff',
        fontSize: '12px',
        fontWeight: '650'
      });
    }

    this.rootElement.append(headerElement, contentElement);
    this.rootElement.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        onClose();
      }
    });
    (canvas.parentElement || document.body).appendChild(this.rootElement);
  }

  setVisible(isVisible: boolean): void {
    this.rootElement.hidden = !isVisible;
    if (isVisible) {
      this.closeButton.focus();
    }
  }

  destroy(): void {
    this.rootElement.remove();
  }
}

class NetworkStoryControls {
  private readonly rootElement: HTMLDivElement;
  private readonly titleElement: HTMLDivElement;
  private readonly descriptionElement: HTMLParagraphElement;
  private readonly fabricStatusElement: HTMLSpanElement;
  private readonly planeIndicators: {
    greenBar: HTMLDivElement;
    redBar: HTMLDivElement;
    row: HTMLButtonElement;
    status: HTMLSpanElement;
  }[];
  private readonly chapterPositionElement: HTMLSpanElement;
  private readonly opticsButton: HTMLButtonElement;
  private readonly playbackButton: HTMLButtonElement;
  private readonly visualIntensityInput: HTMLInputElement;
  private readonly visualIntensityLabel: HTMLSpanElement;
  private previousTelemetrySignature = '';

  constructor(
    canvas: HTMLCanvasElement,
    {
      onNext,
      onPrevious,
      onTogglePlayback,
      onHighlightPlane,
      onToggleOptics,
      onVisualIntensityChange,
      visualIntensity
    }: {
      onNext: () => void;
      onPrevious: () => void;
      onTogglePlayback: () => void;
      onHighlightPlane: (planeIndex: number | null) => void;
      onToggleOptics: () => void;
      onVisualIntensityChange: (level: number) => void;
      visualIntensity: number;
    }
  ) {
    this.rootElement = document.createElement('div');
    this.rootElement.dataset.networkStoryControls = '';
    this.rootElement.setAttribute('role', 'region');
    this.rootElement.setAttribute('aria-label', 'Network packet spraying guided tour');
    Object.assign(this.rootElement.style, {
      position: 'fixed',
      left: '18px',
      bottom: '18px',
      zIndex: '15',
      width: 'min(360px, calc(100vw - 36px))',
      padding: '14px 16px',
      boxSizing: 'border-box',
      border: '1px solid rgba(126, 157, 205, 0.26)',
      borderRadius: '8px',
      background: 'rgba(8, 12, 20, 0.86)',
      backdropFilter: 'blur(12px)',
      color: '#eff4fd',
      font: '13px/1.45 system-ui, sans-serif'
    });

    const headingElement = document.createElement('div');
    headingElement.textContent = 'GUIDED NETWORK TOUR';
    Object.assign(headingElement.style, {
      color: '#88a9d6',
      fontSize: '10px',
      fontWeight: '650'
    });

    this.titleElement = document.createElement('div');
    this.titleElement.setAttribute('aria-live', 'polite');
    Object.assign(this.titleElement.style, {
      marginTop: '5px',
      fontSize: '15px',
      fontWeight: '650'
    });

    this.descriptionElement = document.createElement('p');
    Object.assign(this.descriptionElement.style, {
      margin: '6px 0 12px',
      color: '#bcc9dc'
    });

    const telemetryElement = document.createElement('div');
    Object.assign(telemetryElement.style, {
      margin: '0 0 13px',
      paddingTop: '9px',
      borderTop: '1px solid rgba(137, 166, 211, 0.17)'
    });

    const telemetryHeading = document.createElement('div');
    Object.assign(telemetryHeading.style, {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: '5px',
      color: '#91a6c3',
      fontSize: '10px'
    });
    const telemetryLabel = document.createElement('span');
    telemetryLabel.textContent = 'SWITCH PLANES';
    this.fabricStatusElement = document.createElement('span');
    telemetryHeading.append(telemetryLabel, this.fabricStatusElement);
    telemetryElement.appendChild(telemetryHeading);

    this.planeIndicators = Array.from({length: NETWORK_SWITCH_PLANE_COUNT}, (_, planeIndex) => {
      const rowElement = document.createElement('button');
      rowElement.type = 'button';
      rowElement.dataset.networkPlane = String(planeIndex + 1);
      rowElement.setAttribute('aria-label', `Highlight network plane ${planeIndex + 1} switches`);
      rowElement.setAttribute('aria-pressed', 'false');
      Object.assign(rowElement.style, {
        display: 'grid',
        gridTemplateColumns: '42px minmax(0, 1fr) 56px',
        alignItems: 'center',
        gap: '7px',
        width: 'calc(100% + 8px)',
        height: '21px',
        padding: '0 4px',
        margin: '0 -4px',
        border: '1px solid transparent',
        borderRadius: '4px',
        background: 'transparent',
        cursor: 'pointer',
        transition: 'background 220ms ease, border-color 220ms ease'
      });
      rowElement.addEventListener('pointerenter', () => onHighlightPlane(planeIndex));
      rowElement.addEventListener('pointermove', () => onHighlightPlane(planeIndex));
      rowElement.addEventListener('pointerleave', () => onHighlightPlane(null));
      rowElement.addEventListener('mouseenter', () => onHighlightPlane(planeIndex));
      rowElement.addEventListener('mouseleave', () => onHighlightPlane(null));
      rowElement.addEventListener('focus', () => onHighlightPlane(planeIndex));
      rowElement.addEventListener('blur', () => onHighlightPlane(null));

      const labelElement = document.createElement('span');
      labelElement.textContent = `Plane ${planeIndex + 1}`;
      Object.assign(labelElement.style, {color: '#becce0', fontSize: '10px'});

      const trackElement = document.createElement('div');
      Object.assign(trackElement.style, {
        display: 'flex',
        height: '5px',
        overflow: 'hidden',
        borderRadius: '3px',
        background: 'rgba(93, 113, 146, 0.3)'
      });
      const redBar = document.createElement('div');
      const greenBar = document.createElement('div');
      Object.assign(redBar.style, {
        height: '100%',
        background: '#ff504d',
        transition: 'width 260ms ease'
      });
      Object.assign(greenBar.style, {
        height: '100%',
        background: '#34db87',
        transition: 'width 260ms ease'
      });
      trackElement.append(redBar, greenBar);

      const status = document.createElement('span');
      Object.assign(status.style, {textAlign: 'right', fontSize: '9px'});
      rowElement.append(labelElement, trackElement, status);
      telemetryElement.appendChild(rowElement);
      return {greenBar, redBar, row: rowElement, status};
    });

    const visualIntensityElement = document.createElement('div');
    Object.assign(visualIntensityElement.style, {
      margin: '0 0 13px',
      paddingTop: '9px',
      borderTop: '1px solid rgba(137, 166, 211, 0.17)'
    });
    const visualIntensityHeading = document.createElement('div');
    Object.assign(visualIntensityHeading.style, {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: '5px',
      color: '#91a6c3',
      fontSize: '10px'
    });
    const visualIntensityTitle = document.createElement('span');
    visualIntensityTitle.textContent = 'VISUAL STYLE';
    this.visualIntensityLabel = document.createElement('span');
    visualIntensityHeading.append(visualIntensityTitle, this.visualIntensityLabel);
    this.visualIntensityInput = document.createElement('input');
    this.visualIntensityInput.type = 'range';
    this.visualIntensityInput.min = '0';
    this.visualIntensityInput.max = String(MAX_NETWORK_OPTICS_LEVEL);
    this.visualIntensityInput.step = '0.25';
    this.visualIntensityInput.dataset.networkVisualIntensity = '';
    this.visualIntensityInput.setAttribute('aria-label', 'Visual effects intensity');
    Object.assign(this.visualIntensityInput.style, {
      display: 'block',
      width: '100%',
      height: '16px',
      margin: '0',
      accentColor: '#84acff',
      cursor: 'pointer'
    });
    this.visualIntensityInput.addEventListener('input', () => {
      onVisualIntensityChange(Number(this.visualIntensityInput.value));
    });
    visualIntensityElement.append(visualIntensityHeading, this.visualIntensityInput);
    this.setVisualIntensity(visualIntensity);

    const actionsElement = document.createElement('div');
    Object.assign(actionsElement.style, {
      display: 'flex',
      alignItems: 'center',
      gap: '7px'
    });

    const previousButton = this.makeButton('Back', 'Previous story chapter', onPrevious);
    previousButton.dataset.networkStoryPrevious = '';
    this.playbackButton = this.makeButton('Play', 'Play guided network tour', onTogglePlayback);
    this.playbackButton.dataset.networkStoryPlayback = '';
    const nextButton = this.makeButton('Next', 'Next story chapter', onNext);
    nextButton.dataset.networkStoryNext = '';
    this.opticsButton = this.makeButton('Optics', 'Show GPU optics information', onToggleOptics);
    this.opticsButton.dataset.networkStoryOptics = '';
    this.opticsButton.setAttribute('aria-controls', 'packet-spraying-optics-panel');
    this.opticsButton.setAttribute('aria-expanded', 'false');
    this.chapterPositionElement = document.createElement('span');
    Object.assign(this.chapterPositionElement.style, {
      marginLeft: 'auto',
      color: '#90a2bd',
      fontSize: '12px'
    });

    actionsElement.append(
      previousButton,
      this.playbackButton,
      nextButton,
      this.opticsButton,
      this.chapterPositionElement
    );
    this.rootElement.append(
      headingElement,
      this.titleElement,
      this.descriptionElement,
      telemetryElement,
      visualIntensityElement,
      actionsElement
    );
    (canvas.parentElement || document.body).appendChild(this.rootElement);
  }

  update(chapter: NetworkStoryChapter, chapterIndex: number, isPlaying: boolean): void {
    this.titleElement.textContent = chapter.title;
    this.descriptionElement.textContent = chapter.description;
    this.chapterPositionElement.textContent = `${chapterIndex + 1} / ${NETWORK_STORY_CHAPTERS.length}`;
    this.playbackButton.textContent = isPlaying ? 'Pause' : 'Play';
    this.playbackButton.setAttribute(
      'aria-label',
      isPlaying ? 'Pause guided network tour' : 'Play guided network tour'
    );
    this.rootElement.dataset.networkStoryChapter = chapter.id;
    this.rootElement.dataset.networkStoryPlaying = String(isPlaying);
  }

  updateTelemetry(
    planes: readonly NetworkPlaneTelemetry[],
    spinePaths: readonly NetworkPlaneTelemetry[]
  ): void {
    const signature = planes
      .map(plane => `${plane.status}:${plane.redPacketCount}:${plane.greenPacketCount}`)
      .concat(spinePaths.map(path => path.status))
      .join('|');
    if (signature === this.previousTelemetrySignature) {
      return;
    }
    this.previousTelemetrySignature = signature;

    const availablePlaneCount = planes.filter(plane => plane.status !== 'failed').length;
    const availablePathCount = spinePaths.filter(
      path => path.status !== 'failed' && path.status !== 'recovering'
    ).length;
    const maximumPlaneLoad = Math.max(
      ...planes.map(plane => plane.redPacketCount + plane.greenPacketCount),
      1
    );
    this.fabricStatusElement.textContent = `${availablePlaneCount} / ${planes.length} · ${availablePathCount} / ${spinePaths.length} PATHS`;

    for (const plane of planes) {
      const indicator = this.planeIndicators[plane.planeIndex];
      indicator.redBar.style.width = `${(plane.redPacketCount / maximumPlaneLoad) * 100}%`;
      indicator.greenBar.style.width = `${(plane.greenPacketCount / maximumPlaneLoad) * 100}%`;
      indicator.status.textContent =
        plane.status === 'healthy'
          ? 'ONLINE'
          : plane.status === 'congested'
            ? 'PRESSURE'
            : plane.status === 'recovering'
              ? 'PROBING'
              : 'OFFLINE';
      indicator.status.style.color =
        plane.status === 'healthy'
          ? '#8ba6c7'
          : plane.status === 'congested'
            ? '#ffac59'
            : plane.status === 'recovering'
              ? '#72d4ff'
              : '#ff7065';
    }

    this.rootElement.dataset.networkPlaneStates = planes.map(plane => plane.status).join(',');
  }

  setHighlightedPlane(planeIndex: number | null): void {
    this.rootElement.dataset.networkHighlightedPlane =
      planeIndex === null ? '' : String(planeIndex + 1);

    for (const [indicatorIndex, indicator] of this.planeIndicators.entries()) {
      const highlighted = indicatorIndex === planeIndex;
      indicator.row.style.background = highlighted ? 'rgba(97, 145, 216, 0.13)' : 'transparent';
      indicator.row.style.borderColor = highlighted ? 'rgba(137, 184, 255, 0.34)' : 'transparent';
      indicator.row.setAttribute('aria-pressed', String(highlighted));
    }
  }

  setOpticsExpanded(isExpanded: boolean): void {
    this.opticsButton.setAttribute('aria-expanded', String(isExpanded));
    this.opticsButton.setAttribute(
      'aria-label',
      isExpanded ? 'Hide GPU optics information' : 'Show GPU optics information'
    );
  }

  setVisualIntensity(level: number): void {
    const profile = makeNetworkOpticsProfile(level);
    this.visualIntensityInput.value = String(profile.level);
    this.visualIntensityInput.setAttribute('aria-valuetext', profile.label);
    this.visualIntensityLabel.textContent = `${profile.label.toUpperCase()} · ${profile.level.toFixed(
      profile.level % 1 === 0 ? 0 : 2
    )} / ${MAX_NETWORK_OPTICS_LEVEL}`;
    this.rootElement.dataset.networkVisualStyle = profile.label;
  }

  destroy(): void {
    this.rootElement.remove();
  }

  private makeButton(
    label: string,
    accessibleLabel: string,
    onClick: () => void
  ): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.setAttribute('aria-label', accessibleLabel);
    Object.assign(button.style, {
      padding: '5px 10px',
      border: '1px solid rgba(140, 169, 211, 0.3)',
      borderRadius: '5px',
      background: 'rgba(30, 41, 58, 0.75)',
      color: '#edf3fc',
      cursor: 'pointer',
      font: '12px system-ui, sans-serif'
    });
    button.addEventListener('click', onClick);
    return button;
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
  readonly planeHighlightShaderInputs = new ShaderInputs<{
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
  readonly networkLinks: NetworkLink[];
  readonly linkColors: Float32Array;
  readonly redLinkTrafficStrengths: Float32Array;
  readonly greenLinkTrafficStrengths: Float32Array;
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
  readonly planeHighlightShells: InstancedMesh<{
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
  readonly planeHighlightMatrices = new Float32Array(SWITCH_POSITIONS.length * 16);
  readonly planeHighlightColors = new Float32Array(SWITCH_POSITIONS.length * 4);
  readonly causticLensLightColors = new Float32Array(SWITCH_POSITIONS.length * 3);
  readonly storyPacketMatrices = new Float32Array(MAX_STORY_PACKET_INSTANCES * 16);
  readonly storyPacketColors = new Float32Array(MAX_STORY_PACKET_INSTANCES * 4);
  readonly networkPacketEvents: NetworkPacketEvent[] = [];
  readonly planeHighlightStrengths = new Float32Array(NETWORK_SWITCH_PLANE_COUNT);
  private readonly switchPlaneIndices = new Map<number, number>(
    Array.from({length: NETWORK_SWITCH_PLANE_COUNT}, (_, planeIndex) => planeIndex).flatMap(
      planeIndex =>
        getNetworkPlaneSwitchIndices(planeIndex).map(
          switchIndex => [switchIndex, planeIndex] as const
        )
    )
  );
  private endpointSignalDefinitions: NetworkEndpointSignal[] = [];
  orbitControls: OrbitControls | null = null;
  nodePopup: NetworkNodePopup | null = null;
  opticsPanel: NetworkOpticsPanel | null = null;
  storyControls: NetworkStoryControls | null = null;

  private canvas: HTMLCanvasElement | null = null;
  private pendingPickRequest: NetworkNodePickRequest | null = null;
  private readonly detectingSwitchTimes = new Map<number, number>();
  private readonly nextCongestionTrimTimes = new Map<number, number>();
  private readonly nextSwitchProbeTimes = new Map<number, number>();
  private readonly recoveryProbeCompletionTimes = new Map<number, number>();
  private animationTime = 0;
  private droppedPacketCount = 0;
  private trimmedPacketCount = 0;
  private pickingInProgress = false;
  private pointerDownPosition: [number, number] | null = null;
  private pointerSequence = 0;
  private previousLinkTrafficTime: number | null = null;
  private previousCausticTime: number | null = null;
  private guidedStoryChapterIndex = 0;
  private guidedStoryChapterStartedAt = 0;
  private guidedStoryElapsedAtPause = 0;
  private guidedStoryPlaying = false;
  private guidedStoryStarted = false;
  private guidedStoryCamera: NetworkStoryCamera | null = null;
  private guidedStoryCameraTransitionEndsAt = 0;
  private guidedStoryPreviousCameraTime: number | null = null;
  private highlightedPlaneIndex: number | null = null;
  private previousPlaneHighlightTime: number | null = null;
  private previousVisualIntensityTime: number | null = null;
  private currentVisualIntensity = DEFAULT_NETWORK_OPTICS_LEVEL;
  private opticsProfile: NetworkOpticsProfile = makeNetworkOpticsProfile(
    DEFAULT_NETWORK_OPTICS_LEVEL
  );

  transparencyMode: TransparencyMode;
  visualIntensity = DEFAULT_NETWORK_OPTICS_LEVEL;
  adaptiveRouting = true;
  speed = 0.85;
  orbit = 0.08;
  glassIndexOfRefraction = 1.48;
  glassRoughness = 0.11;
  glassDispersion = 0.026;
  glassThickness = 1.16;
  glassRefractionStrength = 1.32;
  glassFresnelStrength = 1.28;
  glassClearcoatStrength = 1.15;
  glassIridescenceStrength = 0.16;
  glassInternalReflectionStrength = 0.72;
  glassTransmissionStrength = 1.12;
  glassEnvironmentIntensity = 1.25;
  glassVolumeThickness = 1;
  glassRoughTransmissionStrength = 0.85;
  glassSpectralAbsorptionStrength = 0.42;
  glassThinFilmThickness = 420;
  glassThinFilmStrength = 0.22;
  glassVolumeScatteringStrength = 0.38;
  glassDynamicReflectionStrength = 0.38;
  glassSecondaryBounceStrength = 0.55;
  glassFaultDistortionStrength = 0.42;
  packetEmission = 5.2;
  packetTrailLength = 0.19;
  packetTrailIntensity = 0.55;
  switchFlashIntensity = 0.8;
  switchRippleIntensity = 0.44;
  switchTransitionIntensity = 0.62;
  packetLightIntensity = 0.66;
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

  constructor({device, width, height}: AnimationProps) {
    super();

    const requestedOrbit = new URLSearchParams(window.location.search).get('orbit');
    if (requestedOrbit !== null && Number.isFinite(Number(requestedOrbit))) {
      this.orbit = Math.max(0, Math.min(Number(requestedOrbit), 0.5));
    }

    this.sceneColorFormat = getSceneColorFormat(device);
    const supportsABuffer = getABufferSupport(device).supported;
    const supportsWeightedBlending = getWBOITSupport(device).supported;
    this.transparencyMode = supportsABuffer
      ? 'a-buffer'
      : supportsWeightedBlending
        ? 'weighted-blended'
        : 'sorted-alpha';
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
    this.networkLinks = makeLinks(this.conversationRoutes);
    this.linkColors = flattenColors(this.networkLinks.map(({color}) => color));
    this.redLinkTrafficStrengths = new Float32Array(this.networkLinks.length);
    this.greenLinkTrafficStrengths = new Float32Array(this.networkLinks.length);
    this.links = new InstancedMesh(device, this.reflectiveShaderInputs, {
      id: 'packet-spraying-links',
      geometry: new CylinderGeometry({radius: 1, height: 1, nradial: 16, nvertical: 1}),
      matrices: flattenMatrices(this.networkLinks.map(link => makeLinkMatrix(link, 0.09))),
      colors: this.linkColors,
      transparent: true,
      reflective: true
    });

    this.hosts = new InstancedMesh(device, this.metallicShaderInputs, {
      id: 'packet-spraying-hosts',
      geometry: new CubeGeometry({indices: true}),
      matrices: flattenMatrices(
        HOST_POSITIONS.map(position => makeObjectMatrix(position, HOST_HALF_EXTENTS))
      ),
      colors: flattenColors(HOST_POSITIONS.map((_, hostIndex) => makeHostColor(hostIndex))),
      reflective: true
    });

    this.glassInstances = makeGlassInstances();
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
      colors: flattenColors(
        this.packetDefinitions.map(packet => makeBalancedEmissionColor(packet.color, packet.alpha))
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
    this.planeHighlightShells = new InstancedMesh(device, this.planeHighlightShaderInputs, {
      id: 'packet-spraying-plane-highlight-shells',
      geometry: new SphereGeometry({radius: 1, nlat: 16, nlong: 24}),
      matrices: this.planeHighlightMatrices,
      colors: this.planeHighlightColors,
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
        exposure: this.exposure
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
      canvas.dataset.packetSprayingGlassGroups = this.glassGroups.map(group => group.id).join(',');
      this.nodePopup = new NetworkNodePopup(canvas);
      this.orbitControls = new OrbitControls(canvas, {
        target: [0, -0.9, 0],
        distance: 12.7,
        yaw: 0.52,
        pitch: 0.59,
        minDistance: 6,
        maxDistance: 25,
        minPitch: 0.12,
        maxPitch: 1.3,
        autoRotate: this.orbit > 0,
        autoRotateSpeed: this.orbit
      });
      canvas.addEventListener('pointermove', this.handlePointerMove);
      canvas.addEventListener('pointerdown', this.handlePointerDown);
      canvas.addEventListener('pointerleave', this.handlePointerLeave);
      canvas.addEventListener('click', this.handleSwitchClick);
      this.opticsPanel = new NetworkOpticsPanel(canvas, () => this.setOpticsPanelVisible(false));
      this.storyControls = new NetworkStoryControls(canvas, {
        onNext: () => this.moveGuidedStoryChapter(1),
        onPrevious: () => this.moveGuidedStoryChapter(-1),
        onTogglePlayback: () => this.setGuidedStoryPlaying(!this.guidedStoryPlaying),
        onHighlightPlane: planeIndex => this.setHighlightedPlane(planeIndex),
        onToggleOptics: () =>
          this.setOpticsPanelVisible(this.canvas?.dataset.packetSprayingOpticsExpanded !== 'true'),
        onVisualIntensityChange: level => this.setVisualIntensity(level),
        visualIntensity: this.visualIntensity
      });
      canvas.dataset.packetSprayingHighlightedPlane = '';
      canvas.dataset.packetSprayingPlaneHighlightStrength = '0.000';
      canvas.dataset.packetSprayingHighlightedSwitches = '0';
      canvas.dataset.packetSprayingOpticsExpanded = 'false';
      canvas.dataset.packetSprayingVisualIntensity = this.visualIntensity.toFixed(2);
      canvas.dataset.packetSprayingVisualTarget = this.visualIntensity.toFixed(2);
      canvas.dataset.packetSprayingVisualStyle = this.opticsProfile.label;
      canvas.dataset.packetSprayingVisualBloom = this.opticsProfile.bloom.toFixed(2);
      canvas.dataset.packetSprayingVisualCaustics = this.opticsProfile.caustics.toFixed(2);
      canvas.dataset.packetSprayingVisualRefraction = this.opticsProfile.refraction.toFixed(2);
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
    this.animationTime = (time / 1000) * this.speed;
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
    this.planeHighlightShells.updateInstances(
      this.planeHighlightMatrices,
      this.planeHighlightColors
    );
    this.storyPackets.updateInstances(this.storyPacketMatrices, this.storyPacketColors);

    this.orbitControls?.update(time);
    const eye: Vector3 = this.orbitControls?.getEyePosition() || [5.2, 6.2, 9.1];
    const uniforms: AppUniforms = {
      cameraPosition: eye,
      projectionMatrix: new Matrix4().perspective({
        fovy: radians(aspect < 1 ? 60 : 50),
        aspect,
        near: 0.1,
        far: 60
      }),
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
      fresnelStrength: this.glassFresnelStrength * (0.2 + this.opticsProfile.surface * 0.8),
      clearcoatStrength: this.glassClearcoatStrength * this.opticsProfile.surface,
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
        this.glassEnvironmentIntensity * (0.16 + this.opticsProfile.surface * 0.84),
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
      intensity: this.packetLightIntensity * this.opticsProfile.illumination
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
    this.emissiveShaderInputs.setProps({
      app: uniforms,
      emissiveMaterial: {
        intensity: this.packetEmission * (0.24 + this.opticsProfile.illumination * 0.76),
        rimStrength: 0.12 + this.opticsProfile.surface * 0.2
      }
    });
    this.planeHighlightShaderInputs.setProps({
      app: uniforms,
      emissiveMaterial: {intensity: 2.1, rimStrength: 3.6}
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
    this.planeHighlightShells.model.predraw(device.commandEncoder);
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
    this.planeHighlightShells.model.draw(sceneRenderPass);
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
              ? this.bloomThreshold
              : Math.min(this.bloomThreshold, 0.38)
        },
        bloomBlur: {radius: 4},
        bloomComposite: {intensity: this.bloomIntensity * this.opticsProfile.bloom},
        toneMapping: {exposure: this.exposure}
      }
    });

    this.pickHoveredNode(device, uniforms);
  }

  override onFinalize(): void {
    this.canvas?.removeEventListener('pointermove', this.handlePointerMove);
    this.canvas?.removeEventListener('pointerdown', this.handlePointerDown);
    this.canvas?.removeEventListener('pointerleave', this.handlePointerLeave);
    this.canvas?.removeEventListener('click', this.handleSwitchClick);
    this.nodePopup?.destroy();
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
    this.planeHighlightShells.destroy();
    this.storyPackets.destroy();
    this.postprocessingRenderer.destroy();
    this.aBufferRenderer?.destroy();
    this.weightedBlendedRenderer?.destroy();
    this.backfaceShaderInputs.destroy();
    this.emissiveShaderInputs.destroy();
    this.planeHighlightShaderInputs.destroy();
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
  };

  private setGuidedStoryPlaying(isPlaying: boolean): void {
    if (isPlaying === this.guidedStoryPlaying) {
      return;
    }

    this.guidedStoryPlaying = isPlaying;
    if (isPlaying) {
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
      this.orbitControls?.setAutoRotate(this.orbit > 0);
    }

    this.updateGuidedStoryControls();
  }

  private moveGuidedStoryChapter(direction: number): void {
    this.guidedStoryStarted = true;
    this.enterGuidedStoryChapter(this.guidedStoryChapterIndex + direction);
  }

  private enterGuidedStoryChapter(chapterIndex: number): void {
    this.guidedStoryChapterIndex = getWrappedStoryChapterIndex(chapterIndex);
    this.guidedStoryChapterStartedAt = this.animationTime;
    this.guidedStoryElapsedAtPause = 0;
    this.guidedStoryCamera = getNetworkStoryChapter(this.guidedStoryChapterIndex).camera;
    this.guidedStoryCameraTransitionEndsAt = this.animationTime + 1.4;
    this.guidedStoryPreviousCameraTime = null;

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
    this.networkPacketEvents.splice(0, this.networkPacketEvents.length);
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
    const yawDelta = Math.atan2(
      Math.sin(camera.yaw - controls.yaw),
      Math.cos(camera.yaw - controls.yaw)
    );

    controls.yaw += yawDelta * smoothing;
    controls.pitch += (camera.pitch - controls.pitch) * smoothing;
    controls.distance += (camera.distance - controls.distance) * smoothing;
    controls.props.target = [
      controls.props.target[0] + (camera.target[0] - controls.props.target[0]) * smoothing,
      controls.props.target[1] + (camera.target[1] - controls.props.target[1]) * smoothing,
      controls.props.target[2] + (camera.target[2] - controls.props.target[2]) * smoothing
    ];
    this.guidedStoryPreviousCameraTime = animationTime;
  }

  private updateGuidedStoryControls(): void {
    const chapter = getNetworkStoryChapter(this.guidedStoryChapterIndex);
    this.storyControls?.update(chapter, this.guidedStoryChapterIndex, this.guidedStoryPlaying);
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
    if (this.canvas) {
      this.canvas.dataset.packetSprayingVisualIntensity = this.currentVisualIntensity.toFixed(2);
      this.canvas.dataset.packetSprayingVisualBloom = this.opticsProfile.bloom.toFixed(2);
      this.canvas.dataset.packetSprayingVisualCaustics = this.opticsProfile.caustics.toFixed(2);
      this.canvas.dataset.packetSprayingVisualRefraction = this.opticsProfile.refraction.toFixed(2);
    }
  }

  private setHighlightedPlane(planeIndex: number | null): void {
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

  private setOpticsPanelVisible(isVisible: boolean): void {
    this.opticsPanel?.setVisible(isVisible);
    this.storyControls?.setOpticsExpanded(isVisible);
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

      if (makeSwitchProbeEvent(this.conversationRoutes, switchIndex, this.animationTime)) {
        this.recoveringSwitchIndices.add(switchIndex);
        this.nextSwitchProbeTimes.set(switchIndex, this.animationTime);
      }
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
          ...this.recoveringSwitchIndices
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
            this.nextSwitchProbeTimes.delete(switchIndex);
            continue;
          }
        }
        this.nextSwitchProbeTimes.set(switchIndex, nextProbeTime + SWITCH_PROBE_INTERVAL);
      }
    }

    for (const [switchIndex, completionTime] of this.recoveryProbeCompletionTimes) {
      if (animationTime >= completionTime) {
        this.completeSwitchRecovery(switchIndex);
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
        group.instances.map((instance, instanceIndex) =>
          this.getHighlightedSwitchColor(instance.color, group.switchIndices[instanceIndex])
        )
      );
      group.sorted.updateInstances(matrices, colors);
      group.aBuffer?.updateInstances(matrices, colors);
      group.weightedBlended?.updateInstances(matrices, colors);
    }
  }

  private getHighlightedSwitchColor(color: Color, switchIndex: number): Color {
    const planeIndex = this.switchPlaneIndices.get(switchIndex);
    const highlightStrength =
      planeIndex === undefined ? 0 : this.planeHighlightStrengths[planeIndex];

    if (highlightStrength < 0.001) {
      return color;
    }

    return [
      color[0] + (0.8 - color[0]) * highlightStrength * 0.56,
      color[1] + (0.92 - color[1]) * highlightStrength * 0.56,
      color[2] + (1.15 - color[2]) * highlightStrength * 0.56,
      Math.min(color[3] + highlightStrength * 0.055, 0.68)
    ];
  }

  private updatePlaneHighlight(animationTime: number): void {
    const elapsedTime = Math.min(
      Math.max(animationTime - (this.previousPlaneHighlightTime ?? animationTime - 1 / 60), 0),
      0.12
    );
    this.previousPlaneHighlightTime = animationTime;

    let requiresColorUpdate = false;
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
        requiresColorUpdate = true;
      }
    }

    if (requiresColorUpdate) {
      this.planeHighlightMatrices.fill(0);
      this.planeHighlightColors.fill(0);
      let highlightedSwitchCount = 0;

      for (let switchIndex = 0; switchIndex < this.glassInstances.length; switchIndex++) {
        const planeIndex = this.switchPlaneIndices.get(switchIndex);
        const highlightStrength =
          planeIndex === undefined ? 0 : this.planeHighlightStrengths[planeIndex];
        if (highlightStrength < 0.003) {
          continue;
        }

        const switchRadius =
          switchIndex < LEAF_POSITIONS.length
            ? LEAF_SWITCH_RADIUS
            : switchIndex < LEAF_POSITIONS.length + AGGREGATION_POSITIONS.length
              ? AGGREGATION_SWITCH_RADIUS
              : SPINE_SWITCH_RADIUS;
        const shellRadius = switchRadius * (1.025 + highlightStrength * 0.055);
        this.planeHighlightMatrices.set(
          makeObjectMatrix(this.glassInstances[switchIndex].position, [
            shellRadius,
            shellRadius,
            shellRadius
          ]),
          switchIndex * 16
        );
        this.planeHighlightColors.set(
          [
            0.17 * highlightStrength,
            0.42 * highlightStrength,
            0.94 * highlightStrength,
            0.19 * highlightStrength
          ],
          switchIndex * 4
        );
        highlightedSwitchCount++;
      }

      this.updateSwitchColors();
      if (this.canvas) {
        this.canvas.dataset.packetSprayingPlaneHighlightStrength = Math.max(
          ...this.planeHighlightStrengths
        ).toFixed(3);
        this.canvas.dataset.packetSprayingHighlightedSwitches = String(highlightedSwitchCount);
      }
    }
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
    const linkPulseIntensity = this.linkPulseIntensity * this.opticsProfile.motion;
    if (linkPulseIntensity <= 0.005 || this.linkPulseLength <= 0) {
      if (this.canvas) {
        this.canvas.dataset.packetSprayingLinkPulses = '0';
      }
      return;
    }

    const pulses = makeLinkPulses(this.packetDefinitions, animationTime, this.linkPulseLength);
    for (let pulseIndex = 0; pulseIndex < pulses.length; pulseIndex++) {
      const pulse = pulses[pulseIndex];
      const pulseColor = makeBalancedEmissionColor(pulse.color, 1);
      this.linkPulseMatrices.set(
        makeSegmentMatrix(pulse.start, pulse.end, LINK_PULSE_RADIUS),
        pulseIndex * 16
      );
      this.linkPulseColors.set(
        [
          pulseColor[0] * linkPulseIntensity * 0.34,
          pulseColor[1] * linkPulseIntensity * 0.34,
          pulseColor[2] * linkPulseIntensity * 0.34,
          Math.min(linkPulseIntensity * 0.42, 0.42)
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
    const trafficByLink = makeLinkTraffic(this.packetDefinitions, animationTime);
    const elapsedTime = Math.min(
      Math.max(animationTime - (this.previousLinkTrafficTime ?? animationTime - 1 / 60), 0),
      0.12
    );
    const attack = 1 - Math.exp(-elapsedTime * 12);
    const decay = 1 - Math.exp(-elapsedTime * 4.5);
    let illuminatedLinkCount = 0;

    for (let linkIndex = 0; linkIndex < this.networkLinks.length; linkIndex++) {
      const link = this.networkLinks[linkIndex];
      const traffic = trafficByLink.get(makeLinkKey(link.start, link.end));
      const targetRedStrength = Math.min((traffic?.red ?? 0) * 0.42, 1);
      const targetGreenStrength = Math.min((traffic?.green ?? 0) * 0.42, 1);
      const previousRedStrength = this.redLinkTrafficStrengths[linkIndex];
      const previousGreenStrength = this.greenLinkTrafficStrengths[linkIndex];
      const redStrength =
        previousRedStrength +
        (targetRedStrength - previousRedStrength) *
          (targetRedStrength > previousRedStrength ? attack : decay);
      const greenStrength =
        previousGreenStrength +
        (targetGreenStrength - previousGreenStrength) *
          (targetGreenStrength > previousGreenStrength ? attack : decay);
      this.redLinkTrafficStrengths[linkIndex] = redStrength;
      this.greenLinkTrafficStrengths[linkIndex] = greenStrength;

      const redGlow = redStrength * this.linkTrafficGlow * this.opticsProfile.illumination;
      const greenGlow = greenStrength * this.linkTrafficGlow * this.opticsProfile.illumination;
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
      const totalGlow = Math.min(redGlow + greenGlow + signalGlow * 0.48, 1);
      const colorOffset = linkIndex * 4;
      this.linkColors[colorOffset] = Math.min(
        link.color[0] + redGlow * 0.3 + greenGlow * 0.055 + failureGlow * 0.2 + pressureGlow * 0.16,
        1
      );
      this.linkColors[colorOffset + 1] = Math.min(
        link.color[1] +
          redGlow * 0.04 +
          greenGlow * 0.27 +
          recoveryGlow * 0.14 +
          pressureGlow * 0.085,
        1
      );
      this.linkColors[colorOffset + 2] = Math.min(
        link.color[2] + totalGlow * 0.065 + recoveryGlow * 0.17,
        1
      );
      this.linkColors[colorOffset + 3] = Math.min(
        link.color[3] + totalGlow * 0.11 + signalGlow * 0.055,
        0.38
      );

      if (totalGlow > 0.025) {
        illuminatedLinkCount++;
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

    for (const event of this.networkPacketEvents) {
      const age = animationTime - event.startedAt;
      if (age < 0 || age > event.duration) {
        continue;
      }

      const switchPosition = SWITCH_POSITIONS[event.switchIndex];
      const routePointIndex = event.route.points.indexOf(switchPosition);
      if (!switchPosition || routePointIndex < 0) {
        continue;
      }

      if (event.kind === 'dropped-payload' || event.kind === 'trimmed-payload') {
        const progress = age / event.duration;
        const fragmentCount = event.kind === 'dropped-payload' ? 8 : 6;
        const spread = (event.kind === 'dropped-payload' ? 1.15 : 0.78) * age;
        const fragmentRadius =
          (event.kind === 'dropped-payload' ? 0.036 : 0.028) * (1 - progress * 0.8);
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

      if (event.kind === 'retransmission') {
        const distance = Math.min(event.route.totalLength, age * PACKET_TRAVEL_SPEED * 1.16);
        addParticle(
          getPointAlongRoute(event.route, distance / event.route.totalLength),
          0.046,
          makeBalancedEmissionColor(event.color, 0.92)
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
        event.kind === 'probe-confirmation' ? 0.026 : 0.021,
        event.kind === 'probe-confirmation'
          ? makeBalancedEmissionColor(event.color, event.color[3])
          : event.color
      );
    }
  }

  private updatePacketVisuals(animationTime: number): void {
    this.switchFlashStrengths.fill(0);
    this.switchRippleAges.fill(Number.POSITIVE_INFINITY);
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
    if (
      this.packetLightIntensity <= 0 ||
      this.packetLightRadius <= 0 ||
      this.opticsProfile.illumination <= 0.002
    ) {
      return [];
    }

    const candidatesByRoute = new Map<
      Packet['route'],
      {color: Vector3; position: Vector3; switchDistance: number}[]
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
      const candidates = candidatesByRoute.get(packet.route) || [];
      candidates.push({
        color: [packet.color[0], packet.color[1], packet.color[2]],
        position,
        switchDistance: Math.min(
          ...SWITCH_POSITIONS.map(switchPosition => getDistanceSquared(position, switchPosition))
        )
      });
      candidatesByRoute.set(packet.route, candidates);
    }

    const lights: OpticalPointLight[] = [];
    const secondaryLights: OpticalPointLight[] = [];
    for (const candidates of candidatesByRoute.values()) {
      candidates.sort((first, second) => first.switchDistance - second.switchDistance);
      for (const [candidateIndex, candidate] of candidates.slice(0, 2).entries()) {
        const light = {
          position: candidate.position,
          color: candidate.color,
          intensity: 1,
          radius: this.packetLightRadius
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
    const planeHighlightLights: OpticalPointLight[] = [];
    for (let switchIndex = 0; switchIndex < this.glassInstances.length; switchIndex++) {
      const planeIndex = this.switchPlaneIndices.get(switchIndex);
      const highlightStrength =
        planeIndex === undefined ? 0 : this.planeHighlightStrengths[planeIndex];
      if (highlightStrength < 0.035) {
        continue;
      }

      planeHighlightLights.push({
        position: this.glassInstances[switchIndex].position,
        color: [0.24, 0.48, 1],
        intensity: highlightStrength * 1.05,
        radius: this.packetLightRadius * 0.82
      });
    }

    return [
      ...planeHighlightLights,
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
          id: 'packet-spraying-optics',
          title: 'GPU Optics',
          html: PACKET_SPRAYING_OPTICS_HTML
        }),
        makeHtmlCustomPanel({
          id: 'packet-spraying-mrc',
          title: 'MRC Explained',
          html: PACKET_SPRAYING_BACKGROUND_HTML
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
  };
}

const PACKET_SPRAYING_ARTICLE_URL = 'https://openai.com/index/mrc-supercomputer-networking/';

const PACKET_SPRAYING_OVERVIEW_HTML = `\
<p><strong>Network Packet Spraying</strong></p>
<p><strong>Two conversations, many routes.</strong> The two servers on the right send independent red and green transfers to two destination servers on the left.</p>
<p>The guided network tour steps through packet spraying, congestion, switch failure, retransmission, and probe-confirmed recovery. Use Play, Back, and Next to follow or inspect each chapter.</p>
<p>The visual-style slider moves smoothly from a packet-first diagram through clear and cinematic glass to spectral lighting, focused caustics, and full optical fireworks. Individual material controls remain available in Settings.</p>
<p>The visualization has two physical switch planes, each containing four Tier 0 access switches and four Tier 1 aggregation switches. Four larger spine switches connect those planes and provide four independent backbone paths for alternating red and green packets.</p>
<p>The live switch-plane monitor shows red and green allocation across both physical planes and separately reports available backbone paths. Hover or focus a plane to illuminate all eight switches across its two tiers. Under pressure, adaptive routing moves most packets away from a congested path without retiring it; an offline or recovering path carries none until its control handshake succeeds.</p>
<p>Click any glass switch to move it from healthy to orange and congested, then red and failed. Clicking a failed switch repairs it, but its path stays offline while a blue recovery probe travels to the switch and a cyan acknowledgment returns to its source.</p>
<p>An orange switch trims overloaded packet payloads while their smaller headers continue. A red switch briefly loses in-flight packets before MRC retires the failed path, retransmits over healthy routes, and sends occasional recovery probes.</p>
<p>Muted red and green cubes identify each conversation's source and destination; blue cubes are inactive servers. Each active server emits a restrained colored pulse when it launches or receives a packet. Glass spheres are switches, and fabric links softly brighten with red or green light only while packets are traveling through them. Directional light wakes remain inside each link, congested switches breathe amber, and failures or confirmed recoveries send restrained red or cyan waves through nearby glass. Emissive packets leave short trails, reflect inside nearby glass, and project focused colored caustics onto adjacent reflective surfaces.</p>
<p><a href="${PACKET_SPRAYING_ARTICLE_URL}" target="_blank" rel="noopener noreferrer">Read OpenAI's supercomputer networking and MRC article</a></p>`;

const PACKET_SPRAYING_OPTICS_HTML = `\
<p>Every switch is a transparent GPU-rendered glass volume; the image is generated live on hardware WebGPU or WebGL without per-pixel ray tracing.</p>
<p>The guided tour's 0–11 visual-style control introduces these techniques in stages, preserving clear packet movement at the low end and progressively revealing the complete optical pipeline.</p>
<h3>Glass surfaces</h3>
<p>Grazing-angle Fresnel reflection, GGX microfacets, a polished clearcoat, angular thin-film interference, and camera-responsive studio lighting define each curved outer surface.</p>
<h3>Inside the glass</h3>
<p>A dedicated backface pass measures optical thickness. Entry and exit refraction bend captured scene color, chromatic dispersion separates wavelengths, spectral Beer-Lambert absorption tints longer paths, and controlled multisampling creates frosted transmission.</p>
<h3>Light from moving packets</h3>
<p>Red and green packets emit local light into nearby glass. Colored volume scattering, moving scene reflections, secondary internal bounces, and focused raster caustics transfer that energy onto switches, reflective tubes, and metallic servers.</p>
<h3>Compositing and display</h3>
<p>Hardware capability selects exact A-buffer transparency, weighted-blended order-independent transparency, or depth-sorted glass. An HDR framebuffer preserves bright details before selective multiscale bloom and filmic tone mapping.</p>
<p><strong>Everything is composable:</strong> reusable WGSL and GLSL shader modules expose bounded controls for optics, point lights, caustics, transparency, bloom, and exposure.</p>`;

const PACKET_SPRAYING_BACKGROUND_HTML = `\
<p><strong>Multipath Reliable Connection (MRC)</strong> extends RDMA over Converged Ethernet so a single transfer is no longer pinned to one network path.</p>
<p><strong>How the two conversations mix:</strong> the red source talks to one destination, and the green source talks to another. Their packets can share the same switch-to-switch link, interleaving one red packet with one green packet before being separated near their destinations.</p>
<p><strong>Planes and packet spraying:</strong> a high-bandwidth network interface can be split across multiple independent physical planes. In the article's example, an 800 Gb/s interface becomes eight 100 Gb/s connections. This visualization contains two physical two-tier switch planes connected by four representative backbone paths; each conversation sprays successive packets across all four paths instead of waiting behind one busy link.</p>
<p><strong>Throughput:</strong> using many paths at once balances traffic, avoids persistent hot spots, and reduces worst-case transfer latency. When a path becomes congested, MRC reduces its share and spreads subsequent packets across healthier planes while still testing the pressured route. That matters for synchronous AI training because an entire GPU group can wait for its slowest communication.</p>
<p><strong>Congestion and packet trimming:</strong> if a switch cannot forward an entire packet, it can discard the payload while delivering a small header. The destination uses that header to request a retransmission without confusing congestion for a permanent network failure.</p>
<p><strong>Resilience:</strong> if a link, plane, or switch fails, only packets already committed to that path are lost. The sender retires the affected route, retransmits through surviving planes, and occasionally probes the failed path for recovery. A repaired path does not carry ordinary traffic again until an outbound control probe reaches the switch and its acknowledgment successfully returns. Losing one of eight interface links reduces peak physical bandwidth by one eighth instead of crashing the training job.</p>
<p><strong>Source routing:</strong> MRC uses IPv6 Segment Routing (SRv6) to encode a packet's chosen switch sequence. This allows static switch configuration, rapid rerouting, and a simpler control plane without waiting for dynamic routing convergence.</p>
<p><strong>Rendering:</strong> reusable glass materials combine grazing-angle Fresnel reflection, GGX microfacet highlights, clearcoat, two internal shell bounces, moving scene reflections, wavelength-dependent volume absorption, thickness-aware frosted transmission, and angular thin-film interference. Emissive packet cores, directional trails, and switch flashes illuminate nearby glass through bounded point lights, colored in-volume scattering, and focused raster caustics. Fault-tinted switches add subtle animated lens distortion. Floating-point scene color preserves those highlights through exact A-buffer OIT, weighted-blended OIT, or depth-sorted alpha blending before multiscale bloom and filmic tone mapping.</p>
<p><a href="${PACKET_SPRAYING_ARTICLE_URL}" target="_blank" rel="noopener noreferrer">Supercomputer networking to accelerate large scale AI training</a></p>`;

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
  const width = 256;
  const height = 128;
  const pixels = new Uint8Array(width * height * 4);
  const studioLights = [
    {direction: [-0.58, 0.64, 0.5], color: [1, 0.92, 0.78], width: 0.11},
    {direction: [0.72, 0.24, -0.58], color: [0.35, 0.62, 1], width: 0.16},
    {direction: [0.05, 0.94, 0.33], color: [0.78, 0.88, 1], width: 0.085},
    {direction: [-0.8, -0.12, -0.58], color: [0.42, 0.35, 0.8], width: 0.2}
  ];

  for (let row = 0; row < height; row++) {
    const elevation = (row / (height - 1)) * Math.PI;
    for (let column = 0; column < width; column++) {
      const azimuth = (column / (width - 1) - 0.5) * Math.PI * 2;
      const direction: Vector3 = [
        Math.cos(azimuth) * Math.sin(elevation),
        Math.cos(elevation),
        Math.sin(azimuth) * Math.sin(elevation)
      ];
      const horizon = Math.pow(1 - Math.abs(direction[1]), 8);
      const sky = Math.max(direction[1], 0);
      const color: Vector3 = [
        0.035 + sky * 0.065 + horizon * 0.09,
        0.045 + sky * 0.085 + horizon * 0.12,
        0.075 + sky * 0.16 + horizon * 0.19
      ];

      for (const light of studioLights) {
        const alignment = Math.max(
          direction[0] * light.direction[0] +
            direction[1] * light.direction[1] +
            direction[2] * light.direction[2],
          0
        );
        const intensity = Math.pow(alignment, 1 / light.width ** 2);
        color[0] += light.color[0] * intensity * 0.78;
        color[1] += light.color[1] * intensity * 0.78;
        color[2] += light.color[2] * intensity * 0.78;
      }

      const pixelOffset = (row * width + column) * 4;
      pixels[pixelOffset] = Math.round(Math.min(color[0], 1) * 255);
      pixels[pixelOffset + 1] = Math.round(Math.min(color[1], 1) * 255);
      pixels[pixelOffset + 2] = Math.round(Math.min(color[2], 1) * 255);
      pixels[pixelOffset + 3] = 255;
    }
  }

  const environmentTexture = device.createTexture({
    id: 'packet-spraying-studio-environment',
    width,
    height,
    format: 'rgba8unorm',
    usage: Texture.SAMPLE | Texture.COPY_DST,
    sampler: {
      minFilter: 'linear',
      magFilter: 'linear',
      addressModeU: 'repeat',
      addressModeV: 'clamp-to-edge'
    }
  });
  environmentTexture.writeData(pixels);
  return environmentTexture;
}

function makeObjectMatrix(position: Vector3, scale: Vector3): Matrix4 {
  return new Matrix4().translate(position).scale(scale);
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

function makeSettingsSchema(
  supportsABuffer: boolean,
  supportsWeightedBlending: boolean
): SettingsSchema {
  return {
    title: 'Settings',
    sections: [
      {
        id: 'rendering',
        name: 'Rendering',
        initiallyCollapsed: false,
        settings: [
          {
            name: 'visualIntensity',
            label: 'Visual Style (0–11)',
            type: 'number',
            persist: 'none',
            min: 0,
            max: MAX_NETWORK_OPTICS_LEVEL,
            step: 0.25
          },
          {
            name: 'transparencyMode',
            label: 'Transparency',
            type: 'select',
            persist: 'none',
            options: [
              ...(supportsABuffer ? [{label: 'Exact A-buffer OIT', value: 'a-buffer'}] : []),
              ...(supportsWeightedBlending
                ? [{label: 'Weighted blended OIT', value: 'weighted-blended'}]
                : []),
              {label: 'Depth-sorted alpha', value: 'sorted-alpha'}
            ]
          }
        ]
      },
      {
        id: 'animation',
        name: 'Animation',
        initiallyCollapsed: false,
        settings: [
          {
            name: 'speed',
            label: 'Packet Speed',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 2,
            step: 0.05
          },
          {
            name: 'orbit',
            label: 'Camera Orbit',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 0.5,
            step: 0.01
          },
          {
            name: 'adaptiveRouting',
            label: 'Adaptive Routing',
            type: 'boolean',
            persist: 'none'
          }
        ]
      },
      {
        id: 'packet-lighting',
        name: 'Emissive Packets',
        initiallyCollapsed: true,
        settings: [
          {
            name: 'packetEmission',
            label: 'Packet Emission',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 8,
            step: 0.1
          },
          {
            name: 'packetTrailLength',
            label: 'Packet Trail Length',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 0.35,
            step: 0.01
          },
          {
            name: 'packetTrailIntensity',
            label: 'Packet Trail Intensity',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 1.5,
            step: 0.05
          },
          {
            name: 'switchFlashIntensity',
            label: 'Switch Arrival Flash',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 1.5,
            step: 0.05
          },
          {
            name: 'switchRippleIntensity',
            label: 'Switch Arrival Ripple',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 1.2,
            step: 0.05
          },
          {
            name: 'switchTransitionIntensity',
            label: 'Switch Transition Wave',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 1.4,
            step: 0.05
          },
          {
            name: 'packetLightIntensity',
            label: 'Local Light Intensity',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 2,
            step: 0.05
          },
          {
            name: 'packetLightRadius',
            label: 'Local Light Radius',
            type: 'number',
            persist: 'none',
            min: 0.2,
            max: 2.5,
            step: 0.05
          },
          {
            name: 'linkTrafficGlow',
            label: 'Link Traffic Glow',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 1.4,
            step: 0.05
          },
          {
            name: 'linkPulseLength',
            label: 'Link Pulse Length',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 0.65,
            step: 0.01
          },
          {
            name: 'linkPulseIntensity',
            label: 'Link Pulse Intensity',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 1.4,
            step: 0.05
          },
          {
            name: 'endpointSignalIntensity',
            label: 'Server Activity Glow',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 1.4,
            step: 0.05
          },
          {
            name: 'congestionPressureIntensity',
            label: 'Congestion Pressure',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 1.2,
            step: 0.05
          },
          {
            name: 'causticIntensity',
            label: 'Glass Caustic Intensity',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 1.5,
            step: 0.05
          },
          {
            name: 'causticFocus',
            label: 'Glass Caustic Focus',
            type: 'number',
            persist: 'none',
            min: 0.2,
            max: 2.5,
            step: 0.05
          },
          {
            name: 'bloomIntensity',
            label: 'Bloom Intensity',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 2.5,
            step: 0.02
          },
          {
            name: 'bloomThreshold',
            label: 'Bloom Threshold',
            type: 'number',
            persist: 'none',
            min: 0.2,
            max: 2.5,
            step: 0.02
          },
          {
            name: 'exposure',
            label: 'Exposure',
            type: 'number',
            persist: 'none',
            min: 0.25,
            max: 2.5,
            step: 0.05
          }
        ]
      },
      {
        id: 'glass',
        name: 'Glass Material',
        initiallyCollapsed: true,
        settings: [
          {
            name: 'glassIndexOfRefraction',
            label: 'Index of Refraction',
            type: 'number',
            persist: 'none',
            min: 1.01,
            max: 2.2,
            step: 0.01
          },
          {
            name: 'glassRoughness',
            label: 'Roughness',
            type: 'number',
            persist: 'none',
            min: 0.02,
            max: 0.8,
            step: 0.01
          },
          {
            name: 'glassDispersion',
            label: 'Chromatic Dispersion',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 0.08,
            step: 0.002
          },
          {
            name: 'glassThickness',
            label: 'Thickness',
            type: 'number',
            persist: 'none',
            min: 0.2,
            max: 2.5,
            step: 0.05
          },
          {
            name: 'glassRefractionStrength',
            label: 'Lens Distortion',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 2.5,
            step: 0.05
          },
          {
            name: 'glassFresnelStrength',
            label: 'Fresnel Edge',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 2.5,
            step: 0.05
          },
          {
            name: 'glassClearcoatStrength',
            label: 'Clearcoat Highlight',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 2.5,
            step: 0.05
          },
          {
            name: 'glassIridescenceStrength',
            label: 'Spectral Edge',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 0.6,
            step: 0.01
          },
          {
            name: 'glassInternalReflectionStrength',
            label: 'Internal Reflection',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 2,
            step: 0.05
          },
          {
            name: 'glassTransmissionStrength',
            label: 'Transmission',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 1.6,
            step: 0.05
          },
          {
            name: 'glassEnvironmentIntensity',
            label: 'Studio Reflections',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 3,
            step: 0.05
          },
          {
            name: 'glassVolumeThickness',
            label: 'Volume Thickness',
            type: 'number',
            persist: 'none',
            min: 0.2,
            max: 2,
            step: 0.05
          },
          {
            name: 'glassRoughTransmissionStrength',
            label: 'Frosted Transmission',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 2,
            step: 0.05
          },
          {
            name: 'glassSpectralAbsorptionStrength',
            label: 'Spectral Absorption',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 2,
            step: 0.05
          },
          {
            name: 'glassThinFilmThickness',
            label: 'Film Thickness (nm)',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 900,
            step: 10
          },
          {
            name: 'glassThinFilmStrength',
            label: 'Thin-Film Interference',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 1,
            step: 0.02
          },
          {
            name: 'glassVolumeScatteringStrength',
            label: 'Volume Light Scattering',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 1.5,
            step: 0.05
          },
          {
            name: 'glassDynamicReflectionStrength',
            label: 'Moving Scene Reflections',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 1.5,
            step: 0.05
          },
          {
            name: 'glassSecondaryBounceStrength',
            label: 'Secondary Internal Bounce',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 1.5,
            step: 0.05
          },
          {
            name: 'glassFaultDistortionStrength',
            label: 'Fault Surface Distortion',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 1.5,
            step: 0.05
          }
        ]
      }
    ]
  };
}
