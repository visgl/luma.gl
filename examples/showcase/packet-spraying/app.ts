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
  Model,
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
  getABufferSupport,
  getWBOITSupport,
  opticalPointLights,
  opticalPointLightsPlugin,
  reflectiveMaterial,
  reflectiveMaterialPlugin,
  type ABufferShaderModuleProps,
  type EmissiveMaterialProps,
  type GlassMaterialProps,
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
  CONVERSATIONS,
  HOST_HALF_EXTENTS,
  HOST_POSITIONS,
  HOST_Y,
  LEAF_POSITIONS,
  LEAF_SWITCH_RADIUS,
  PACKET_TRAVEL_SPEED,
  SPINE_POSITIONS,
  SPINE_SWITCH_RADIUS,
  SWITCH_POSITIONS,
  getActivePlaneCount,
  getDistance,
  getDistanceSquared,
  getHealthyConversationRoutes,
  getPointAlongRoute,
  getRouteSegmentStartDistance,
  isFailedSwitchPosition,
  makeActiveLinkKeys,
  makeConversationRoutes,
  makeHostColor,
  makeLinkColor,
  makeLinkKey,
  makeLinks,
  makePackets,
  makePickableNetworkNodes,
  makeSwitchArrivals,
  reroutePackets,
  type Color,
  type ConversationRoute,
  type NetworkLink,
  type Packet,
  type PickableNetworkNode,
  type SwitchArrival,
  type Vector3
} from './network';

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
  let color = reflectiveMaterial_getIlluminatedColor(
    inputs.normal,
    inputs.worldPosition,
    inputs.color,
    app.cameraPosition
  );
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
  let glassColor = glassMaterial_getIlluminatedColor(
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
  vec4 glassColor = glassMaterial_getIlluminatedColor(
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
  vec4 color = reflectiveMaterial_getIlluminatedColor(
    vNormal,
    vWorldPosition,
    vColor,
    app.cameraPosition
  );
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
const SWITCH_FLASH_DURATION = 0.16;
const MAX_SWITCH_FLASH_LIGHTS = 6;
const FAILED_SWITCH_COLOR: Color = [1, 0.34, 0.07, 0.56];

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
      sceneTexture,
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
      sceneTexture?: Texture;
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
        ...(glass ? [glassMaterialPlugin] : []),
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
      ...(sceneTexture ? {bindings: {glassSceneColorTexture: sceneTexture}} : {}),
      ...(pickable
        ? {
            colorAttachmentFormats: ['rgba8unorm' as const],
            depthStencilAttachmentFormat: 'depth24plus' as const
          }
        : {}),
      parameters: additive
        ? ADDITIVE_PARAMETERS
        : transparent || glass
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
    this.roleElement.style.color = node.status === 'offline' ? '#ffad52' : '#82acf2';
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

export default class PacketSprayingAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = makeExamplePanelHostHtml();

  readonly reflectiveShaderInputs = new ShaderInputs<{
    app: AppUniforms;
    opticalPointLights: OpticalPointLightsProps;
    reflectiveMaterial: ReflectiveMaterialProps;
  }>({app: appShaderModule, opticalPointLights, reflectiveMaterial});
  readonly metallicShaderInputs = new ShaderInputs<{
    app: AppUniforms;
    opticalPointLights: OpticalPointLightsProps;
    reflectiveMaterial: ReflectiveMaterialProps;
  }>({app: appShaderModule, opticalPointLights, reflectiveMaterial});
  readonly emissiveShaderInputs = new ShaderInputs<{
    app: AppUniforms;
    emissiveMaterial: EmissiveMaterialProps;
  }>({app: appShaderModule, emissiveMaterial});
  readonly glassShaderInputs = new ShaderInputs<{
    app: AppUniforms;
    glassMaterial: GlassMaterialProps;
    opticalPointLights: OpticalPointLightsProps;
  }>({app: appShaderModule, glassMaterial, opticalPointLights});
  readonly aBufferShaderInputs = new ShaderInputs<{
    app: AppUniforms;
    glassMaterial: GlassMaterialProps;
    opticalPointLights: OpticalPointLightsProps;
    aBuffer: ABufferShaderModuleProps;
  }>({app: appShaderModule, glassMaterial, opticalPointLights, aBuffer});
  readonly weightedBlendedShaderInputs = new ShaderInputs<{
    app: AppUniforms;
    glassMaterial: GlassMaterialProps;
    opticalPointLights: OpticalPointLightsProps;
    wboit: WBOITShaderModuleProps;
  }>({app: appShaderModule, glassMaterial, opticalPointLights, wboit});
  readonly pickingShaderInputs = new ShaderInputs<{
    app: AppUniforms;
    picking: typeof colorPicking.props;
  }>({app: appShaderModule, picking: colorPicking});
  readonly settingsPanel: ExampleSettingsPanelManager;
  readonly panels: ExamplePanelManager;
  readonly sceneColorFormat: TextureFormatColor;
  readonly sceneFramebuffer: Framebuffer;
  readonly postprocessingRenderer: ShaderPassRenderer;
  readonly aBufferRenderer: ABufferRenderer | null;
  readonly weightedBlendedRenderer: WBOITRenderer | null;
  sceneTexture: Texture;
  refractionTexture: Texture;
  readonly links: InstancedMesh<{
    app: AppUniforms;
    opticalPointLights: OpticalPointLightsProps;
    reflectiveMaterial: ReflectiveMaterialProps;
  }>;
  readonly hosts: InstancedMesh<{
    app: AppUniforms;
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
  readonly originalGlassColors: Color[];
  readonly failedSwitchIndices = new Set<number>();
  readonly conversationRoutes: ConversationRoute[];
  readonly networkLinks: NetworkLink[];
  readonly sortedGlass: InstancedMesh<{
    app: AppUniforms;
    glassMaterial: GlassMaterialProps;
    opticalPointLights: OpticalPointLightsProps;
  }>;
  readonly aBufferGlass: InstancedMesh<{
    app: AppUniforms;
    glassMaterial: GlassMaterialProps;
    opticalPointLights: OpticalPointLightsProps;
    aBuffer: ABufferShaderModuleProps;
  }> | null;
  readonly weightedBlendedGlass: InstancedMesh<{
    app: AppUniforms;
    glassMaterial: GlassMaterialProps;
    opticalPointLights: OpticalPointLightsProps;
    wboit: WBOITShaderModuleProps;
  }> | null;
  readonly packets: InstancedMesh<{
    app: AppUniforms;
    emissiveMaterial: EmissiveMaterialProps;
  }>;
  readonly packetTrails: InstancedMesh<{
    app: AppUniforms;
    emissiveMaterial: EmissiveMaterialProps;
  }>;
  readonly switchFlashes: InstancedMesh<{
    app: AppUniforms;
    emissiveMaterial: EmissiveMaterialProps;
  }>;
  readonly packetDefinitions: Packet[];
  readonly packetMatrices: Float32Array;
  readonly packetTrailMatrices: Float32Array;
  readonly packetTrailColors: Float32Array;
  switchArrivalEvents: SwitchArrival[];
  readonly switchFlashMatrices: Float32Array;
  readonly switchFlashColors: Float32Array;
  readonly switchFlashStrengths: Float32Array;
  orbitControls: OrbitControls | null = null;
  nodePopup: NetworkNodePopup | null = null;

  private canvas: HTMLCanvasElement | null = null;
  private pendingPickRequest: NetworkNodePickRequest | null = null;
  private pickingInProgress = false;
  private pointerDownPosition: [number, number] | null = null;
  private pointerSequence = 0;

  transparencyMode: TransparencyMode;
  speed = 0.85;
  orbit = 0.08;
  glassIndexOfRefraction = 1.48;
  glassRoughness = 0.14;
  glassDispersion = 0.022;
  glassThickness = 1.05;
  packetEmission = 5.2;
  packetTrailLength = 0.19;
  packetTrailIntensity = 0.55;
  switchFlashIntensity = 0.8;
  packetLightIntensity = 0.66;
  packetLightRadius = 1.05;
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
    this.postprocessingRenderer = new ShaderPassRenderer(device, {
      shaderPasses: [makeBloomPipeline(this.sceneColorFormat), toneMapping],
      colorFormat: this.sceneColorFormat
    });

    this.conversationRoutes = makeConversationRoutes();
    this.networkLinks = makeLinks(this.conversationRoutes);
    this.links = new InstancedMesh(device, this.reflectiveShaderInputs, {
      id: 'packet-spraying-links',
      geometry: new CylinderGeometry({radius: 1, height: 1, nradial: 16, nvertical: 1}),
      matrices: flattenMatrices(this.networkLinks.map(link => makeLinkMatrix(link, 0.09))),
      colors: flattenColors(this.networkLinks.map(({color}) => color)),
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
    const glassMatrices = flattenMatrices(this.glassInstances.map(instance => instance.matrix));
    const glassColors = flattenColors(this.glassInstances.map(instance => instance.color));
    const makeGlassMeshOptions = (id: string, transparencyMode: TransparencyMode) => ({
      id,
      geometry: new SphereGeometry({radius: 1, nlat: 16, nlong: 24}),
      matrices: glassMatrices,
      colors: glassColors,
      glass: true,
      sceneTexture: this.refractionTexture,
      transparencyMode
    });
    this.sortedGlass = new InstancedMesh(
      device,
      this.glassShaderInputs,
      makeGlassMeshOptions('packet-spraying-sorted-glass', 'sorted-alpha')
    );
    this.aBufferGlass = supportsABuffer
      ? new InstancedMesh(
          device,
          this.aBufferShaderInputs,
          makeGlassMeshOptions('packet-spraying-a-buffer-glass', 'a-buffer')
        )
      : null;
    this.weightedBlendedGlass = supportsWeightedBlending
      ? new InstancedMesh(
          device,
          this.weightedBlendedShaderInputs,
          makeGlassMeshOptions('packet-spraying-weighted-glass', 'weighted-blended')
        )
      : null;

    this.packetDefinitions = makePackets(this.conversationRoutes);
    this.packetMatrices = new Float32Array(this.packetDefinitions.length * 16);
    this.packetTrailMatrices = new Float32Array(this.packetDefinitions.length * 16);
    this.packetTrailColors = flattenColors(
      this.packetDefinitions.map(packet => makeBalancedEmissionColor(packet.color, 0.42))
    );
    this.switchArrivalEvents = makeSwitchArrivals(this.packetDefinitions);
    const switchFlashCount = this.glassInstances.length * CONVERSATIONS.length;
    this.switchFlashMatrices = new Float32Array(switchFlashCount * 16);
    this.switchFlashColors = new Float32Array(switchFlashCount * 4);
    this.switchFlashStrengths = new Float32Array(switchFlashCount);
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
    this.switchFlashes = new InstancedMesh(device, this.emissiveShaderInputs, {
      id: 'packet-spraying-switch-arrival-flashes',
      geometry: new SphereGeometry({radius: 1, nlat: 8, nlong: 12}),
      matrices: this.switchFlashMatrices,
      colors: this.switchFlashColors,
      additive: true,
      emissive: true
    });

    this.settingsPanel = new ExampleSettingsPanelManager({
      id: 'packet-spraying-settings',
      schema: makeSettingsSchema(supportsABuffer, supportsWeightedBlending),
      settings: {
        transparencyMode: this.transparencyMode,
        speed: this.speed,
        orbit: this.orbit,
        glassIndexOfRefraction: this.glassIndexOfRefraction,
        glassRoughness: this.glassRoughness,
        glassDispersion: this.glassDispersion,
        glassThickness: this.glassThickness,
        packetEmission: this.packetEmission,
        packetTrailLength: this.packetTrailLength,
        packetTrailIntensity: this.packetTrailIntensity,
        switchFlashIntensity: this.switchFlashIntensity,
        packetLightIntensity: this.packetLightIntensity,
        packetLightRadius: this.packetLightRadius,
        bloomIntensity: this.bloomIntensity,
        bloomThreshold: this.bloomThreshold,
        exposure: this.exposure
      },
      onSettingsChange: this.handleSettingsChange
    });
    this.panels = new ExamplePanelManager({panel: this.makePanel()});
    this.panels.mount();
  }

  override async onInitialize({canvas}: AnimationProps): Promise<void> {
    if (canvas instanceof HTMLCanvasElement) {
      this.canvas = canvas;
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
      this.updateFailureAccessibility();
    }
  }

  override onRender({device, width, height, aspect, time}: AnimationProps): void {
    this.resizeSceneFramebuffer(width, height);
    const animationTime = time / 1000;
    this.updatePacketVisuals(animationTime * this.speed);
    this.packets.updateMatrices(this.packetMatrices);
    this.packetTrails.updateInstances(this.packetTrailMatrices, this.packetTrailColors);
    this.switchFlashes.updateInstances(this.switchFlashMatrices, this.switchFlashColors);

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
      viewMatrix: new Matrix4().lookAt({eye, center: [0, -0.9, 0], up: [0, 1, 0]})
    };
    const glassMaterialProps: GlassMaterialProps = {
      viewportSize: [width, height],
      sceneColorTexture: this.refractionTexture,
      indexOfRefraction: this.glassIndexOfRefraction,
      roughness: this.glassRoughness,
      dispersion: this.glassDispersion,
      thickness: this.glassThickness
    };
    const pointLightProps: OpticalPointLightsProps = {
      lights: this.makePacketLights(),
      intensity: this.packetLightIntensity
    };
    this.emissiveShaderInputs.setProps({
      app: uniforms,
      emissiveMaterial: {intensity: this.packetEmission, rimStrength: 0.32}
    });
    this.reflectiveShaderInputs.setProps({
      app: uniforms,
      reflectiveMaterial: {},
      opticalPointLights: pointLightProps
    });
    this.metallicShaderInputs.setProps({
      app: uniforms,
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
      opticalPointLights: pointLightProps
    });

    this.hosts.model.predraw(device.commandEncoder);
    this.packets.model.predraw(device.commandEncoder);
    this.packetTrails.model.predraw(device.commandEncoder);
    this.switchFlashes.model.predraw(device.commandEncoder);
    this.links.model.predraw(device.commandEncoder);
    const sceneRenderPass = device.beginRenderPass({
      framebuffer: this.sceneFramebuffer,
      clearColor: [0.003, 0.006, 0.012, 1],
      clearDepth: 1
    });
    this.hosts.model.draw(sceneRenderPass);
    this.packets.model.draw(sceneRenderPass);
    this.packetTrails.model.draw(sceneRenderPass);
    this.switchFlashes.model.draw(sceneRenderPass);
    this.links.model.draw(sceneRenderPass);
    sceneRenderPass.end();

    device.commandEncoder.copyTextureToTexture({
      sourceTexture: this.sceneTexture,
      destinationTexture: this.refractionTexture
    });

    let outputTexture = this.sceneTexture;
    if (this.transparencyMode === 'a-buffer' && this.aBufferRenderer && this.aBufferGlass) {
      outputTexture = this.aBufferRenderer.render({
        sourceTexture: this.sceneTexture,
        opaqueDepthTexture: this.sceneFramebuffer.depthStencilAttachment!,
        prepareTranslucent: ({commandEncoder, shaderModuleProps, captureParameters}) => {
          this.aBufferShaderInputs.setProps({
            app: uniforms,
            glassMaterial: glassMaterialProps,
            opticalPointLights: pointLightProps,
            aBuffer: shaderModuleProps
          });
          this.aBufferGlass?.model.setParameters({...TRANSPARENT_PARAMETERS, ...captureParameters});
          this.aBufferGlass?.model.predraw(commandEncoder);
        },
        drawTranslucent: renderPass => {
          this.aBufferGlass?.model.draw(renderPass);
        }
      });
    } else if (
      this.transparencyMode === 'weighted-blended' &&
      this.weightedBlendedRenderer &&
      this.weightedBlendedGlass
    ) {
      outputTexture = this.weightedBlendedRenderer.render({
        sourceTexture: this.sceneTexture,
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
            opticalPointLights: pointLightProps,
            wboit: shaderModuleProps
          });
          this.weightedBlendedGlass?.model.setParameters({
            ...TRANSPARENT_PARAMETERS,
            ...captureParameters
          });
          this.weightedBlendedGlass?.model.predraw(commandEncoder);
        },
        drawTranslucent: renderPass => {
          this.weightedBlendedGlass?.model.draw(renderPass);
        }
      });
    } else {
      this.sortGlassInstances(eye);
      this.sortedGlass.model.predraw(device.commandEncoder);
      const glassRenderPass = device.beginRenderPass({
        framebuffer: this.sceneFramebuffer,
        clearColor: false,
        clearDepth: false
      });
      this.sortedGlass.model.draw(glassRenderPass);
      glassRenderPass.end();
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
        bloomComposite: {intensity: this.bloomIntensity},
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
    this.settingsPanel.finalize();
    this.panels.finalize();
    this.orbitControls?.destroy();
    this.links.destroy();
    this.hosts.destroy();
    this.pickingHosts.destroy();
    this.pickingSwitches.destroy();
    this.pickingManager.destroy();
    this.sortedGlass.destroy();
    this.aBufferGlass?.destroy();
    this.weightedBlendedGlass?.destroy();
    this.packets.destroy();
    this.packetTrails.destroy();
    this.switchFlashes.destroy();
    this.postprocessingRenderer.destroy();
    this.aBufferRenderer?.destroy();
    this.weightedBlendedRenderer?.destroy();
    this.emissiveShaderInputs.destroy();
    this.reflectiveShaderInputs.destroy();
    this.metallicShaderInputs.destroy();
    this.pickingShaderInputs.destroy();
    this.glassShaderInputs.destroy();
    this.aBufferShaderInputs.destroy();
    this.weightedBlendedShaderInputs.destroy();
    this.sceneFramebuffer.destroy();
    this.sceneTexture.destroy();
    this.refractionTexture.destroy();
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
            this.toggleSwitchFailure(switchIndex);
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

  private getPickableNode(objectIndex: number): PickableNetworkNode | undefined {
    const node = this.pickableNodes[objectIndex];
    if (!node || objectIndex < HOST_POSITIONS.length) {
      return node;
    }

    const switchIndex = objectIndex - HOST_POSITIONS.length;
    if (this.failedSwitchIndices.has(switchIndex)) {
      return {
        ...node,
        role: `OFFLINE / ${node.role}`,
        description:
          'This switch is unavailable. MRC immediately removes every affected route and sprays packets across the remaining healthy paths.',
        detail: 'Click again to restore this switch and return its paths to service.',
        status: 'offline'
      };
    }

    return {
      ...node,
      detail: `${node.detail} Click to simulate a switch failure.`,
      status: 'online'
    };
  }

  private toggleSwitchFailure(switchIndex: number): void {
    if (this.failedSwitchIndices.has(switchIndex)) {
      this.failedSwitchIndices.delete(switchIndex);
      this.glassInstances[switchIndex].color = [...this.originalGlassColors[switchIndex]] as Color;
    } else {
      this.failedSwitchIndices.add(switchIndex);
      this.glassInstances[switchIndex].color = [...FAILED_SWITCH_COLOR];
    }

    this.updateSwitchColors();
    this.updateHealthyRoutes();
    this.updateFailureAccessibility();
  }

  private updateSwitchColors(): void {
    const matrices = flattenMatrices(this.glassInstances.map(instance => instance.matrix));
    const colors = flattenColors(this.glassInstances.map(instance => instance.color));
    this.sortedGlass.updateInstances(matrices, colors);
    this.aBufferGlass?.updateInstances(matrices, colors);
    this.weightedBlendedGlass?.updateInstances(matrices, colors);
  }

  private updateHealthyRoutes(): void {
    const healthyRoutes = getHealthyConversationRoutes(
      this.conversationRoutes,
      this.failedSwitchIndices
    );
    reroutePackets(this.packetDefinitions, healthyRoutes);
    this.switchArrivalEvents = makeSwitchArrivals(this.packetDefinitions);
    const activeLinkKeys = makeActiveLinkKeys(healthyRoutes);

    for (const link of this.networkLinks) {
      const failed =
        isFailedSwitchPosition(link.start, this.failedSwitchIndices) ||
        isFailedSwitchPosition(link.end, this.failedSwitchIndices);
      link.color = makeLinkColor(
        link.start,
        activeLinkKeys.has(makeLinkKey(link.start, link.end)),
        failed
      );
    }
    this.links.updateInstances(
      flattenMatrices(this.networkLinks.map(link => makeLinkMatrix(link, 0.09))),
      flattenColors(this.networkLinks.map(link => link.color))
    );
  }

  private updateFailureAccessibility(): void {
    if (!this.canvas) {
      return;
    }

    const failedCount = this.failedSwitchIndices.size;
    const activePlaneCount = getActivePlaneCount(
      getHealthyConversationRoutes(this.conversationRoutes, this.failedSwitchIndices)
    );
    this.canvas.dataset.packetSprayingFailedSwitches = String(failedCount);
    this.canvas.dataset.packetSprayingActivePlanes = String(activePlaneCount);
    this.canvas.setAttribute(
      'aria-label',
      failedCount === 0
        ? 'Network packet spraying: all switches online'
        : `Network packet spraying: ${failedCount} switch${failedCount === 1 ? '' : 'es'} offline, ${activePlaneCount} healthy network plane${activePlaneCount === 1 ? '' : 's'}`
    );
  }

  private resizeSceneFramebuffer(width: number, height: number): void {
    if (this.sceneFramebuffer.width === width && this.sceneFramebuffer.height === height) {
      return;
    }

    const previousSceneTexture = this.sceneTexture;
    const previousRefractionTexture = this.refractionTexture;
    this.sceneFramebuffer.resize({width, height});
    this.sceneTexture = this.sceneFramebuffer.colorAttachments[0].texture;
    this.refractionTexture = makeRefractionTexture(
      this.sceneTexture.device,
      width,
      height,
      this.sceneColorFormat
    );
    this.postprocessingRenderer.resize([width, height]);
    this.sortedGlass.model.setBindings({glassSceneColorTexture: this.refractionTexture});
    this.aBufferGlass?.model.setBindings({glassSceneColorTexture: this.refractionTexture});
    this.weightedBlendedGlass?.model.setBindings({glassSceneColorTexture: this.refractionTexture});
    previousSceneTexture.destroy();
    previousRefractionTexture.destroy();
  }

  private sortGlassInstances(cameraPosition: Vector3): void {
    const sortedInstances = [...this.glassInstances].sort(
      (first, second) =>
        getDistanceSquared(second.position, cameraPosition) -
        getDistanceSquared(first.position, cameraPosition)
    );
    this.sortedGlass.updateInstances(
      flattenMatrices(sortedInstances.map(instance => instance.matrix)),
      flattenColors(sortedInstances.map(instance => instance.color))
    );
  }

  private updatePacketVisuals(animationTime: number): void {
    this.switchFlashStrengths.fill(0);

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
        packetIsVisible && this.packetTrailIntensity > 0 && trailLength > 0.012
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
          trailColor[0] * this.packetTrailIntensity,
          trailColor[1] * this.packetTrailIntensity,
          trailColor[2] * this.packetTrailIntensity,
          trailColor[3]
        ],
        colorOffset
      );
    }

    for (const arrival of this.switchArrivalEvents) {
      const arrivalAge = wrap(animationTime - arrival.arrivalTime, BURST_CYCLE_DURATION);
      if (arrivalAge >= SWITCH_FLASH_DURATION) {
        continue;
      }

      const attack = smoothstep(0, 0.018, arrivalAge);
      const decay = Math.exp(-arrivalAge * 15);
      const flashIndex = arrival.switchIndex * CONVERSATIONS.length + arrival.conversationIndex;
      this.switchFlashStrengths[flashIndex] = Math.min(
        1,
        this.switchFlashStrengths[flashIndex] + attack * decay
      );
    }

    for (let switchIndex = 0; switchIndex < this.glassInstances.length; switchIndex++) {
      const glassInstance = this.glassInstances[switchIndex];
      for (
        let conversationIndex = 0;
        conversationIndex < CONVERSATIONS.length;
        conversationIndex++
      ) {
        const flashIndex = switchIndex * CONVERSATIONS.length + conversationIndex;
        const flashStrength = this.switchFlashStrengths[flashIndex] * this.switchFlashIntensity;
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
      }
    }
  }

  private makePacketLights(): OpticalPointLight[] {
    if (this.packetLightIntensity <= 0 || this.packetLightRadius <= 0) {
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
        const flashStrength = this.switchFlashStrengths[flashIndex] * this.switchFlashIntensity;
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
    return [
      ...lights,
      ...switchFlashLights.slice(0, MAX_SWITCH_FLASH_LIGHTS),
      ...secondaryLights
    ].slice(0, 16);
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
<p>Packets enter their local Tier 0 switch as separate streams. Once the streams meet, the switch forwards alternating red and green packets across four representative independent network planes. The destination-side switches separate the traffic again and deliver each color to its intended server.</p>
<p>Click a glass switch to simulate a failure. Its sphere turns orange, affected links dim, and packets immediately respray across the remaining healthy routes. Click the switch again to restore it.</p>
<p>Muted red and green cubes identify each conversation's source and destination; blue cubes are inactive servers. Glass spheres are switches, and faint tubes show the available fabric links. Emissive packets leave short directional trails, briefly illuminate arriving switches, and cast localized colored light onto nearby surfaces.</p>
<p><a href="${PACKET_SPRAYING_ARTICLE_URL}" target="_blank" rel="noopener noreferrer">Read OpenAI's supercomputer networking and MRC article</a></p>`;

const PACKET_SPRAYING_BACKGROUND_HTML = `\
<p><strong>Multipath Reliable Connection (MRC)</strong> extends RDMA over Converged Ethernet so a single transfer is no longer pinned to one network path.</p>
<p><strong>How the two conversations mix:</strong> the red source talks to one destination, and the green source talks to another. Their packets can share the same switch-to-switch link, interleaving one red packet with one green packet before being separated near their destinations.</p>
<p><strong>Planes and packet spraying:</strong> a high-bandwidth network interface can be split across multiple independent physical planes. In the article's example, an 800 Gb/s interface becomes eight 100 Gb/s connections. This visualization shows four representative paths; each conversation sprays successive packets across all four instead of waiting behind one busy link.</p>
<p><strong>Throughput:</strong> using many paths at once balances traffic, avoids persistent hot spots, and reduces worst-case transfer latency. That matters for synchronous AI training because an entire GPU group can wait for its slowest communication.</p>
<p><strong>Resilience:</strong> if a link, plane, or switch fails, the sender quickly retires the affected path and keeps using the remaining ones. Losing one of eight interface links reduces peak physical bandwidth by one eighth instead of crashing the training job.</p>
<p><strong>Source routing:</strong> MRC uses IPv6 Segment Routing (SRv6) to encode a packet's chosen switch sequence. This allows static switch configuration, rapid rerouting, and a simpler control plane without waiting for dynamic routing convergence.</p>
<p><strong>Rendering:</strong> reusable emissive materials shade compact packet cores, velocity-aligned trails, and switch-arrival flashes; bounded point lights illuminate refractive glass and reflective links. Floating-point scene color preserves the directional highlights through exact A-buffer OIT, weighted-blended OIT, or depth-sorted alpha blending before multiscale bloom and filmic tone mapping.</p>
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
          }
        ]
      },
      {
        id: 'packet-lighting',
        name: 'Emissive Packets',
        initiallyCollapsed: false,
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
        initiallyCollapsed: false,
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
          }
        ]
      }
    ]
  };
}
