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
  SphereGeometry
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

type Vector3 = [number, number, number];
type Color = [number, number, number, number];
type TransparencyMode = 'a-buffer' | 'weighted-blended' | 'sorted-alpha';

type AppUniforms = {
  cameraPosition: Vector3;
  projectionMatrix: Matrix4;
  viewMatrix: Matrix4;
};

type Packet = {
  alpha: number;
  color: Color;
  launchTime: number;
  route: Route;
  scale: number;
};

type NetworkLink = {
  color: Color;
  end: Vector3;
  endInset: number;
  start: Vector3;
  startInset: number;
};

type Conversation = {
  color: Color;
  destinationHostIndex: number;
  sourceHostIndex: number;
};

type ConversationRoute = {
  conversationIndex: number;
  route: Route;
};

type Route = {
  cumulativeLengths: number[];
  points: Vector3[];
  totalLength: number;
};

type GlassInstance = {
  color: Color;
  matrix: Matrix4;
  position: Vector3;
};

type PickableNetworkNode = {
  description: string;
  detail: string;
  role: string;
  title: string;
};

type NetworkNodePickRequest = {
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

const GLASS_WGSL_SHADER = /* wgsl */ `${WGSL_SHADER}
@fragment
fn fragmentGlass(inputs: VertexOutputs) -> @location(0) vec4<f32> {
  let color = glassMaterial_getIlluminatedColor(
    inputs.normal,
    inputs.worldPosition,
    inputs.color,
    app.cameraPosition,
    inputs.position
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
  vec4 color = glassMaterial_getIlluminatedColor(
    vNormal,
    vWorldPosition,
    vColor,
    app.cameraPosition,
    gl_FragCoord
  );
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

const HOST_X_POSITIONS = [-3.6, -1.2, 1.2, 3.6];
const HOST_Z_POSITIONS = [2.4, 0.8, -0.8, -2.4];
const HOST_Y = -2.75;
const HOST_HALF_EXTENTS: Vector3 = [0.42, 0.27, 0.32];
const LEAF_Y = -1.05;
const LEAF_SWITCH_RADIUS = 0.42;
const AGGREGATION_Y = 0.35;
const AGGREGATION_SWITCH_RADIUS = 0.4;
const SPINE_Y = 2.05;
const SPINE_SWITCH_RADIUS = 0.55;
const TRAFFIC_COLORS: Color[] = [
  [1, 0, 0, 1],
  [0, 1, 0, 1]
];
const PACKETS_PER_BURST = 24;
const BURST_PACKET_INTERVAL = 0.14;
const BURST_CYCLE_DURATION = 11;
const PACKET_TRAVEL_SPEED = 3.4;

const HOST_POSITIONS: Vector3[] = HOST_Z_POSITIONS.flatMap(zPosition =>
  HOST_X_POSITIONS.map(xPosition => [xPosition, HOST_Y, zPosition] as Vector3)
);
const LEAF_POSITIONS: Vector3[] = [0.85, -0.85].flatMap(zPosition =>
  HOST_X_POSITIONS.map(xPosition => [xPosition, LEAF_Y, zPosition] as Vector3)
);
const AGGREGATION_POSITIONS: Vector3[] = [0.85, -0.85].flatMap(zPosition =>
  HOST_X_POSITIONS.map(xPosition => [xPosition, AGGREGATION_Y, zPosition] as Vector3)
);
const SPINE_POSITIONS: Vector3[] = HOST_Z_POSITIONS.map(zPosition => [0, SPINE_Y, zPosition]);
const CONVERSATIONS: Conversation[] = [
  {sourceHostIndex: 3, destinationHostIndex: 8, color: TRAFFIC_COLORS[0]},
  {sourceHostIndex: 7, destinationHostIndex: 12, color: TRAFFIC_COLORS[1]}
];

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
      glass = false,
      emissive = false,
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
      glass?: boolean;
      emissive?: boolean;
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
            : emissive
              ? EMISSIVE_FRAGMENT_SHADER
              : FRAGMENT_SHADER,
      fragmentEntryPoint: pickable
        ? 'fragmentPicking'
        : glass
          ? 'fragmentGlass'
          : reflective
            ? 'fragmentReflective'
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
        ...(emissive ? [emissiveMaterialPlugin] : []),
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
      parameters:
        transparent || glass
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
  readonly packetDefinitions: Packet[];
  readonly packetMatrices: Float32Array;
  orbitControls: OrbitControls | null = null;
  nodePopup: NetworkNodePopup | null = null;

  private canvas: HTMLCanvasElement | null = null;
  private pendingPickRequest: NetworkNodePickRequest | null = null;
  private pickingInProgress = false;
  private pointerSequence = 0;

  transparencyMode: TransparencyMode;
  speed = 0.85;
  orbit = 0.08;
  glassIndexOfRefraction = 1.48;
  glassRoughness = 0.14;
  glassDispersion = 0.022;
  glassThickness = 1.05;
  packetEmission = 5.2;
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

    const conversationRoutes = makeConversationRoutes();
    const links = makeLinks(conversationRoutes);
    this.links = new InstancedMesh(device, this.reflectiveShaderInputs, {
      id: 'packet-spraying-links',
      geometry: new CylinderGeometry({radius: 1, height: 1, nradial: 16, nvertical: 1}),
      matrices: flattenMatrices(links.map(link => makeLinkMatrix(link, 0.09))),
      colors: flattenColors(links.map(({color}) => color)),
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

    this.packetDefinitions = makePackets(conversationRoutes);
    this.packetMatrices = new Float32Array(this.packetDefinitions.length * 16);
    this.updatePacketMatrices(0);
    this.packets = new InstancedMesh(device, this.emissiveShaderInputs, {
      id: 'packet-spraying-packets',
      geometry: new SphereGeometry({radius: 1, nlat: 8, nlong: 12}),
      matrices: this.packetMatrices,
      colors: flattenColors(
        this.packetDefinitions.map(packet => makeBalancedEmissionColor(packet.color, packet.alpha))
      ),
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
    }
  }

  override onRender({device, width, height, aspect, time}: AnimationProps): void {
    this.resizeSceneFramebuffer(width, height);
    const animationTime = time / 1000;
    this.updatePacketMatrices(animationTime * this.speed);
    this.packets.updateMatrices(this.packetMatrices);

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
    this.links.model.predraw(device.commandEncoder);
    const sceneRenderPass = device.beginRenderPass({
      framebuffer: this.sceneFramebuffer,
      clearColor: [0.003, 0.006, 0.012, 1],
      clearDepth: 1
    });
    this.hosts.model.draw(sceneRenderPass);
    this.packets.model.draw(sceneRenderPass);
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
    if (!this.pickingManager.shouldPick(pickRequest.canvasPosition)) {
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
        const node =
          objectIndex === null || objectIndex === undefined
            ? undefined
            : this.pickableNodes[objectIndex];
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
      canvasPosition: [event.clientX - bounds.left, event.clientY - bounds.top],
      clientPosition: [event.clientX, event.clientY],
      pointerSequence: ++this.pointerSequence
    };
  };

  private readonly handlePointerDown = (): void => {
    this.handlePointerLeave();
  };

  private readonly handlePointerLeave = (): void => {
    this.pointerSequence++;
    this.pendingPickRequest = null;
    this.pickingManager.clearPickState();
    this.nodePopup?.hide();
  };

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

  private updatePacketMatrices(animationTime: number): void {
    for (let packetIndex = 0; packetIndex < this.packetDefinitions.length; packetIndex++) {
      const packet = this.packetDefinitions[packetIndex];
      const packetAge = wrap(animationTime - packet.launchTime, BURST_CYCLE_DURATION);
      const packetDistance = packetAge * PACKET_TRAVEL_SPEED;
      const position: Vector3 =
        packetDistance <= packet.route.totalLength
          ? getPointAlongRoute(packet.route, packetDistance / packet.route.totalLength)
          : [0, -100, 0];
      const matrix = makeObjectMatrix(position, [packet.scale, packet.scale, packet.scale]);
      this.packetMatrices.set(matrix, packetIndex * 16);
    }
  }

  private makePacketLights(): OpticalPointLight[] {
    if (this.packetLightIntensity <= 0 || this.packetLightRadius <= 0) {
      return [];
    }

    const switchPositions = [...LEAF_POSITIONS, ...AGGREGATION_POSITIONS, ...SPINE_POSITIONS];
    const candidatesByRoute = new Map<
      Route,
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
          ...switchPositions.map(switchPosition => getDistanceSquared(position, switchPosition))
        )
      });
      candidatesByRoute.set(packet.route, candidates);
    }

    const lights: OpticalPointLight[] = [];
    for (const candidates of candidatesByRoute.values()) {
      candidates.sort((first, second) => first.switchDistance - second.switchDistance);
      for (const candidate of candidates.slice(0, 2)) {
        lights.push({
          position: candidate.position,
          color: candidate.color,
          intensity: 1,
          radius: this.packetLightRadius
        });
      }
    }
    return lights.slice(0, 16);
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
<p>Muted red and green cubes identify each conversation's source and destination; blue cubes are inactive servers. Glass spheres are switches, and faint tubes show the available fabric links. Emissive packets cast localized colored light onto nearby switches and active links, with restrained multiscale bloom.</p>
<p><a href="${PACKET_SPRAYING_ARTICLE_URL}" target="_blank" rel="noopener noreferrer">Read OpenAI's supercomputer networking and MRC article</a></p>`;

const PACKET_SPRAYING_BACKGROUND_HTML = `\
<p><strong>Multipath Reliable Connection (MRC)</strong> extends RDMA over Converged Ethernet so a single transfer is no longer pinned to one network path.</p>
<p><strong>How the two conversations mix:</strong> the red source talks to one destination, and the green source talks to another. Their packets can share the same switch-to-switch link, interleaving one red packet with one green packet before being separated near their destinations.</p>
<p><strong>Planes and packet spraying:</strong> a high-bandwidth network interface can be split across multiple independent physical planes. In the article's example, an 800 Gb/s interface becomes eight 100 Gb/s connections. This visualization shows four representative paths; each conversation sprays successive packets across all four instead of waiting behind one busy link.</p>
<p><strong>Throughput:</strong> using many paths at once balances traffic, avoids persistent hot spots, and reduces worst-case transfer latency. That matters for synchronous AI training because an entire GPU group can wait for its slowest communication.</p>
<p><strong>Resilience:</strong> if a link, plane, or switch fails, the sender quickly retires the affected path and keeps using the remaining ones. Losing one of eight interface links reduces peak physical bandwidth by one eighth instead of crashing the training job.</p>
<p><strong>Source routing:</strong> MRC uses IPv6 Segment Routing (SRv6) to encode a packet's chosen switch sequence. This allows static switch configuration, rapid rerouting, and a simpler control plane without waiting for dynamic routing convergence.</p>
<p><strong>Rendering:</strong> reusable emissive materials and bounded point lights illuminate refractive glass and reflective links. Floating-point scene color preserves bright packet cores through exact A-buffer OIT, weighted-blended OIT, or depth-sorted alpha blending before multiscale bloom and filmic tone mapping.</p>
<p><a href="${PACKET_SPRAYING_ARTICLE_URL}" target="_blank" rel="noopener noreferrer">Supercomputer networking to accelerate large scale AI training</a></p>`;

function makeLinks(conversationRoutes: ConversationRoute[]): NetworkLink[] {
  const links: NetworkLink[] = [];
  const activeLinkKeys = new Set<string>();

  for (const {route} of conversationRoutes) {
    for (let pointIndex = 0; pointIndex < route.points.length - 1; pointIndex++) {
      activeLinkKeys.add(makeLinkKey(route.points[pointIndex], route.points[pointIndex + 1]));
    }
  }

  for (let hostIndex = 0; hostIndex < HOST_POSITIONS.length; hostIndex++) {
    const rowIndex = Math.floor(hostIndex / HOST_X_POSITIONS.length);
    const columnIndex = hostIndex % HOST_X_POSITIONS.length;
    const leafRowOffset = rowIndex < 2 ? 0 : HOST_X_POSITIONS.length;
    const start = HOST_POSITIONS[hostIndex];
    const end = LEAF_POSITIONS[leafRowOffset + columnIndex];
    links.push({
      start,
      end,
      startInset: getBoxSurfaceDistance(start, end, HOST_HALF_EXTENTS),
      endInset: LEAF_SWITCH_RADIUS,
      color: activeLinkKeys.has(makeLinkKey(start, end))
        ? [0.43, 0.61, 0.91, 0.2]
        : [0.3, 0.42, 0.66, 0.045]
    });
  }

  for (let rowIndex = 0; rowIndex < 2; rowIndex++) {
    const rowOffset = rowIndex * HOST_X_POSITIONS.length;
    for (let leafColumnIndex = 0; leafColumnIndex < HOST_X_POSITIONS.length; leafColumnIndex++) {
      for (
        let aggregationColumnIndex = 0;
        aggregationColumnIndex < HOST_X_POSITIONS.length;
        aggregationColumnIndex++
      ) {
        const start = LEAF_POSITIONS[rowOffset + leafColumnIndex];
        const end = AGGREGATION_POSITIONS[rowOffset + aggregationColumnIndex];
        links.push({
          start,
          end,
          startInset: LEAF_SWITCH_RADIUS,
          endInset: AGGREGATION_SWITCH_RADIUS,
          color: activeLinkKeys.has(makeLinkKey(start, end))
            ? [0.45, 0.61, 0.91, 0.18]
            : [0.3, 0.42, 0.66, 0.038]
        });
      }
    }
  }

  for (const aggregationPosition of AGGREGATION_POSITIONS) {
    for (let spineIndex = 0; spineIndex < SPINE_POSITIONS.length; spineIndex++) {
      const end = SPINE_POSITIONS[spineIndex];
      links.push({
        start: aggregationPosition,
        end,
        startInset: AGGREGATION_SWITCH_RADIUS,
        endInset: SPINE_SWITCH_RADIUS,
        color: activeLinkKeys.has(makeLinkKey(aggregationPosition, end))
          ? [0.47, 0.64, 0.93, 0.16]
          : [0.3, 0.42, 0.66, 0.034]
      });
    }
  }

  return links;
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

function makePickableNetworkNodes(): PickableNetworkNode[] {
  const servers = HOST_POSITIONS.map((_, hostIndex) => {
    const sourceConversationIndex = CONVERSATIONS.findIndex(
      conversation => conversation.sourceHostIndex === hostIndex
    );
    const destinationConversationIndex = CONVERSATIONS.findIndex(
      conversation => conversation.destinationHostIndex === hostIndex
    );
    const rowIndex = Math.floor(hostIndex / HOST_X_POSITIONS.length) + 1;
    const columnIndex = (hostIndex % HOST_X_POSITIONS.length) + 1;

    if (sourceConversationIndex >= 0) {
      const trafficColor = sourceConversationIndex === 0 ? 'red' : 'green';
      return {
        title: `Server ${hostIndex + 1}`,
        role: `${trafficColor.toUpperCase()} source / grid row ${rowIndex}, column ${columnIndex}`,
        description: `This server originates the ${trafficColor} transfer and sends its packets to a local Tier 0 switch.`,
        detail:
          'The outgoing stream is sprayed across independent network planes after meeting the other conversation.'
      };
    }

    if (destinationConversationIndex >= 0) {
      const trafficColor = destinationConversationIndex === 0 ? 'red' : 'green';
      return {
        title: `Server ${hostIndex + 1}`,
        role: `${trafficColor.toUpperCase()} destination / grid row ${rowIndex}, column ${columnIndex}`,
        description: `This server receives the ${trafficColor} transfer after the destination-side switches separate the interleaved streams.`,
        detail:
          'MRC writes each packet to its final memory address, so packets can arrive through different paths and out of order.'
      };
    }

    return {
      title: `Server ${hostIndex + 1}`,
      role: `Available compute server / grid row ${rowIndex}, column ${columnIndex}`,
      description:
        'This server represents another GPU host connected to the same resilient network fabric.',
      detail:
        'It is not part of the two active conversations, so its links do not carry moving packets.'
    };
  });

  const leafSwitches = LEAF_POSITIONS.map((_, switchIndex) => {
    const side = switchIndex < HOST_X_POSITIONS.length ? 'source' : 'destination';
    const columnIndex = (switchIndex % HOST_X_POSITIONS.length) + 1;
    return {
      title: `Tier 0 access switch ${switchIndex + 1}`,
      role: `${side.toUpperCase()} side / server column ${columnIndex}`,
      description:
        side === 'source'
          ? 'This switch gathers outgoing server traffic and forwards packets toward the independent planes.'
          : 'This switch separates returning red and green packets and delivers each stream to the correct destination server.',
      detail:
        'Multiple local servers share the access tier; only the active source and destination paths carry packets.'
    };
  });

  const aggregationSwitches = AGGREGATION_POSITIONS.map((_, switchIndex) => {
    const planeIndex = (switchIndex % HOST_X_POSITIONS.length) + 1;
    const side = switchIndex < HOST_X_POSITIONS.length ? 'ingress' : 'egress';
    return {
      title: `Plane ${planeIndex} ${side} switch`,
      role: `Tier 1 switch / independent network plane ${planeIndex}`,
      description:
        side === 'ingress'
          ? 'This ingress switch accepts alternating red and green packets from the source-side access tier.'
          : 'This egress switch receives the mixed packet stream and forwards each packet toward its destination.',
      detail: `Plane ${planeIndex} can continue carrying traffic independently of the other planes.`
    };
  });

  const spineSwitches = SPINE_POSITIONS.map((_, switchIndex) => ({
    title: `Spine switch ${switchIndex + 1}`,
    role: `Fabric backbone / independent network plane ${switchIndex + 1}`,
    description:
      'This spine connects the ingress and egress sides of one independent routing plane.',
    detail:
      'Both conversations can share this path, interleaving one red packet with one green packet while other planes carry additional packets.'
  }));

  return [...servers, ...leafSwitches, ...aggregationSwitches, ...spineSwitches];
}

function makeConversationRoutes(): ConversationRoute[] {
  const conversationRoutes: ConversationRoute[] = [];
  for (let conversationIndex = 0; conversationIndex < CONVERSATIONS.length; conversationIndex++) {
    const conversation = CONVERSATIONS[conversationIndex];
    const sourceColumnIndex = conversation.sourceHostIndex % HOST_X_POSITIONS.length;
    const destinationColumnIndex = conversation.destinationHostIndex % HOST_X_POSITIONS.length;
    for (let spineIndex = 0; spineIndex < SPINE_POSITIONS.length; spineIndex++) {
      conversationRoutes.push({
        conversationIndex,
        route: makeRoute([
          HOST_POSITIONS[conversation.sourceHostIndex],
          LEAF_POSITIONS[sourceColumnIndex],
          AGGREGATION_POSITIONS[spineIndex],
          SPINE_POSITIONS[spineIndex],
          AGGREGATION_POSITIONS[HOST_X_POSITIONS.length + spineIndex],
          LEAF_POSITIONS[HOST_X_POSITIONS.length + destinationColumnIndex],
          HOST_POSITIONS[conversation.destinationHostIndex]
        ])
      });
    }
  }

  return conversationRoutes;
}

function makePackets(conversationRoutes: ConversationRoute[]): Packet[] {
  const packets: Packet[] = [];

  for (let conversationIndex = 0; conversationIndex < CONVERSATIONS.length; conversationIndex++) {
    const conversation = CONVERSATIONS[conversationIndex];
    const routes = conversationRoutes.filter(
      route => route.conversationIndex === conversationIndex
    );
    for (let packetIndex = 0; packetIndex < PACKETS_PER_BURST; packetIndex++) {
      const {route} = routes[packetIndex % routes.length];
      const sourceTravelTime = getDistance(route.points[0], route.points[1]) / PACKET_TRAVEL_SPEED;
      const launchTime =
        1 +
        packetIndex * BURST_PACKET_INTERVAL +
        (conversationIndex * BURST_PACKET_INTERVAL) / CONVERSATIONS.length -
        sourceTravelTime;
      packets.push({
        route,
        color: conversation.color,
        launchTime,
        scale: 0.05,
        alpha: 1
      });
    }
  }

  return packets;
}

function makeHostColor(hostIndex: number): Color {
  const conversationIndex = CONVERSATIONS.findIndex(
    conversation =>
      conversation.sourceHostIndex === hostIndex || conversation.destinationHostIndex === hostIndex
  );
  if (conversationIndex === 0) {
    return [0.48, 0.09, 0.08, 1];
  }
  if (conversationIndex === 1) {
    return [0.07, 0.38, 0.1, 1];
  }
  return [0.18, 0.4, 0.92, 1];
}

function makeLinkKey(start: Vector3, end: Vector3): string {
  const startKey = start.join(',');
  const endKey = end.join(',');
  return startKey < endKey ? `${startKey}:${endKey}` : `${endKey}:${startKey}`;
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

function makeRoute(points: Vector3[]): Route {
  const cumulativeLengths = [0];
  let totalLength = 0;
  for (let pointIndex = 1; pointIndex < points.length; pointIndex++) {
    totalLength += getDistance(points[pointIndex - 1], points[pointIndex]);
    cumulativeLengths.push(totalLength);
  }
  return {points, cumulativeLengths, totalLength};
}

function getPointAlongRoute(route: Route, progress: number): Vector3 {
  const distance = progress * route.totalLength;
  let segmentIndex = 0;
  while (
    segmentIndex < route.cumulativeLengths.length - 2 &&
    route.cumulativeLengths[segmentIndex + 1] < distance
  ) {
    segmentIndex++;
  }

  const startDistance = route.cumulativeLengths[segmentIndex];
  const endDistance = route.cumulativeLengths[segmentIndex + 1];
  const segmentProgress = (distance - startDistance) / (endDistance - startDistance);
  const start = route.points[segmentIndex];
  const end = route.points[segmentIndex + 1];
  return [
    start[0] + (end[0] - start[0]) * segmentProgress,
    start[1] + (end[1] - start[1]) * segmentProgress,
    start[2] + (end[2] - start[2]) * segmentProgress
  ];
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

function getDistance(start: Vector3, end: Vector3): number {
  return Math.hypot(end[0] - start[0], end[1] - start[1], end[2] - start[2]);
}

function getDistanceSquared(start: Vector3, end: Vector3): number {
  const differenceX = end[0] - start[0];
  const differenceY = end[1] - start[1];
  const differenceZ = end[2] - start[2];
  return differenceX * differenceX + differenceY * differenceY + differenceZ * differenceZ;
}

function getBoxSurfaceDistance(start: Vector3, end: Vector3, halfExtents: Vector3): number {
  const distance = getDistance(start, end);
  const direction: Vector3 = [
    (end[0] - start[0]) / distance,
    (end[1] - start[1]) / distance,
    (end[2] - start[2]) / distance
  ];
  return Math.min(
    direction[0] === 0 ? Infinity : halfExtents[0] / Math.abs(direction[0]),
    direction[1] === 0 ? Infinity : halfExtents[1] / Math.abs(direction[1]),
    direction[2] === 0 ? Infinity : halfExtents[2] / Math.abs(direction[2])
  );
}

function wrap(value: number, limit: number): number {
  return ((value % limit) + limit) % limit;
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
