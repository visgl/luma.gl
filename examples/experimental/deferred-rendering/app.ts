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
  createDeferredLightingShaderPassPipeline,
  GBuffer,
  makeDeferredPointLightBufferData,
  MAX_DEFERRED_POINT_LIGHTS,
  type DeferredPointLight
} from '@luma.gl/experimental';
import type {ShaderModule, ShaderPass, ShaderPassPipeline} from '@luma.gl/shadertools';
import {Matrix4, radians, type NumberArray3} from '@math.gl/core';
import {
  ColumnPanel,
  type Panel,
  type SettingsChangeDescriptor,
  type SettingsSchema
} from '@deck.gl-community/panels';
import {
  ExamplePanelManager,
  ExampleSettingsPanelManager,
  makeExamplePanelHostHtml,
  makeHtmlCustomPanel
} from '../../example-panels';

const NEAR_PLANE = 0.1;
const FAR_PLANE = 100;
const GRID_SIZE = 7;
const MAX_EXAMPLE_POINT_LIGHTS = 32;
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
  | 'Depth';

type DeferredRenderingSettings = {
  debugView: DebugView;
  pointLightCount: number;
  animate: boolean;
  exposure: number;
  sunIntensity: number;
};

const DEFAULT_SETTINGS: DeferredRenderingSettings = {
  debugView: 'Final',
  pointLightCount: 18,
  animate: true,
  exposure: 1.15,
  sunIntensity: 2.8
};

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
  debugMode: number;
  exposure: number;
};

type DeferredDisplayBindings = {
  depthTexture?: Texture;
  normalTexture?: Texture;
  baseColorMetallicTexture?: Texture;
  emissiveOcclusionTexture?: Texture;
};

const deferredDisplay = {
  name: 'deferredDisplay',
  source: /* wgsl */ `\
struct DeferredDisplayUniforms {
  debugMode: f32,
  exposure: f32,
};
@group(0) @binding(auto) var<uniform> deferredDisplay: DeferredDisplayUniforms;
@group(0) @binding(auto) var depthTexture: texture_depth_2d;
@group(0) @binding(auto) var depthTextureSampler: sampler;
@group(0) @binding(auto) var normalTexture: texture_2d<f32>;
@group(0) @binding(auto) var normalTextureSampler: sampler;
@group(0) @binding(auto) var baseColorMetallicTexture: texture_2d<f32>;
@group(0) @binding(auto) var baseColorMetallicTextureSampler: sampler;
@group(0) @binding(auto) var emissiveOcclusionTexture: texture_2d<u32>;

fn deferredDisplay_toneMap(color: vec3f) -> vec3f {
  let exposed = max(color * deferredDisplay.exposure, vec3f(0.0));
  let mapped = (exposed * (2.51 * exposed + 0.03)) /
    (exposed * (2.43 * exposed + 0.59) + 0.14);
  return pow(clamp(mapped, vec3f(0.0), vec3f(1.0)), vec3f(1.0 / 2.2));
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
  if (deferredDisplay.debugMode > 5.5) {
    let depth = textureSampleLevel(depthTexture, depthTextureSampler, texCoord, 0);
    return vec4f(vec3f(pow(depth, 24.0)), 1.0);
  }
  let color = textureSampleLevel(sourceTexture, sourceTextureSampler, texCoord, 0).rgb;
  return vec4f(deferredDisplay_toneMap(color), 1.0);
}`,
  bindingLayout: [
    {name: 'depthTexture', group: 0},
    {name: 'normalTexture', group: 0},
    {name: 'baseColorMetallicTexture', group: 0},
    {name: 'emissiveOcclusionTexture', group: 0}
  ],
  uniforms: {} as DeferredDisplayUniforms,
  bindings: {} as DeferredDisplayBindings,
  uniformTypes: {debugMode: 'f32', exposure: 'f32'},
  propTypes: {
    debugMode: {value: 0, private: true},
    exposure: {value: DEFAULT_SETTINGS.exposure, min: 0.1, softMax: 3}
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

/** WebGPU-only material laboratory for G-buffer deferred lighting. */
export default class AppAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = makeExamplePanelHostHtml();

  readonly device: Device;
  readonly materialSpheres: InstancedSurfaceModel;
  readonly floor: InstancedSurfaceModel;
  readonly lightMarkers: InstancedSurfaceModel;
  readonly pointLightBuffer: Buffer;
  readonly panels: ExamplePanelManager;
  readonly settingsPanel: ExampleSettingsPanelManager;
  sceneGBuffer: GBuffer;
  renderer: ShaderPassRenderer;
  settings: DeferredRenderingSettings = {...DEFAULT_SETTINGS};
  framebufferSize: [number, number];
  previousViewProjectionMatrix = new Matrix4();
  frameIndex = 0;

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
    this.lightMarkers = new InstancedSurfaceModel(device, {
      id: 'deferred-light-markers',
      geometry: new SphereGeometry({radius: 1, nlat: 12, nlong: 18}),
      data: makeLightMarkerData()
    });
    this.pointLightBuffer = device.createBuffer({
      id: 'deferred-point-lights',
      data: makeDeferredPointLightBufferData([], MAX_DEFERRED_POINT_LIGHTS),
      usage: Buffer.STORAGE | Buffer.COPY_DST
    });
    this.sceneGBuffer = createSceneGBuffer(device, width, height);
    this.renderer = createRenderer(device);
    this.renderer.resize([width, height]);
    this.framebufferSize = [width, height];
    this.settingsPanel = new ExampleSettingsPanelManager({
      id: 'deferred-rendering-settings',
      schema: makeSettingsSchema(),
      settings: this.settings,
      onSettingsChange: this.handleSettingsChange
    });
    this.panels = new ExamplePanelManager({panel: this.makePanel()});
    this.panels.mount();
  }

  onRender({device, width, height, aspect, tick}: AnimationProps): void {
    if (this.framebufferSize[0] !== width || this.framebufferSize[1] !== height) {
      this.framebufferSize = [width, height];
      this.sceneGBuffer.resize({width, height});
      this.renderer.resize([width, height]);
      this.frameIndex = 0;
    }

    const time = this.settings.animate ? tick / 1000 : 1.8;
    const cameraAngle = this.settings.animate ? time * 0.08 : 0.72;
    const eye: NumberArray3 = [
      Math.sin(cameraAngle) * 18,
      9.5 + Math.sin(cameraAngle * 0.7) * 1.2,
      Math.cos(cameraAngle) * 18
    ];
    const projectionMatrix = new Matrix4().perspective({
      fovy: radians(47),
      aspect,
      near: NEAR_PLANE,
      far: FAR_PLANE
    });
    const inverseProjectionMatrix = new Matrix4(projectionMatrix).invert();
    const viewMatrix = new Matrix4().lookAt({eye, center: [0, 0.9, 0], up: [0, 1, 0]});
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
    this.lightMarkers.setUniforms(surfaceUniforms);

    const activeLightCount = Math.min(
      Math.round(this.settings.pointLightCount),
      MAX_EXAMPLE_POINT_LIGHTS
    );
    const lightState = makeAnimatedPointLights(time, activeLightCount, viewMatrix);
    this.pointLightBuffer.write(
      makeDeferredPointLightBufferData(lightState.viewLights, MAX_DEFERRED_POINT_LIGHTS)
    );
    this.lightMarkers.positionBuffer.write(lightState.markerPositions);

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
    this.materialSpheres.model.draw(renderPass);
    this.lightMarkers.model.draw(renderPass);
    renderPass.end();

    const normalTexture = this.sceneGBuffer.normalRoughnessTexture;
    const baseColorMetallicTexture = this.sceneGBuffer.getExtraColorTexture('baseColorMetallic');
    const emissiveOcclusionTexture = this.sceneGBuffer.getExtraColorTexture('emissiveOcclusion');
    const directionalLightDirectionView = normalize3(
      viewMatrix.transformAsVector([0.42, 0.82, 0.38]) as NumberArray3
    );
    this.renderer.renderToScreen({
      sourceTexture: this.sceneGBuffer.colorTexture,
      bindings: {
        depthTexture: this.sceneGBuffer.depthTexture,
        normalTexture,
        baseColorMetallicTexture,
        emissiveOcclusionTexture,
        pointLights: this.pointLightBuffer
      },
      uniforms: {
        deferredLighting: {
          inverseProjectionMatrix,
          ambientColor: [0.028, 0.034, 0.055],
          directionalLightDirectionView,
          directionalLightColor: [1, 0.86, 0.68],
          directionalLightIntensity: this.settings.sunIntensity,
          pointLightCount: activeLightCount
        },
        deferredDisplay: {
          debugMode: getDebugMode(this.settings.debugView),
          exposure: this.settings.exposure
        }
      }
    });

    this.previousViewProjectionMatrix = new Matrix4(viewProjectionMatrix);
    this.frameIndex++;
  }

  onFinalize(): void {
    this.settingsPanel.finalize();
    this.panels.finalize();
    this.materialSpheres.destroy();
    this.floor.destroy();
    this.lightMarkers.destroy();
    this.pointLightBuffer.destroy();
    this.renderer.destroy();
    this.sceneGBuffer.destroy();
  }

  private makePanel(): Panel {
    return new ColumnPanel({
      id: 'deferred-rendering-controls',
      title: 'Deferred Material Lab',
      panels: [
        makeHtmlCustomPanel({
          id: 'deferred-rendering-description',
          title: '',
          html: '<p><b>One geometry pass. Dozens of lights.</b></p><p>Each sphere writes base color, metalness, roughness, emissive, normal, velocity, and depth once. A fullscreen Cook-Torrance resolve reconstructs view position from depth and evaluates the animated storage-buffer lights.</p><p>Switch Debug View to inspect the actual G-buffer contract.</p>'
        }),
        this.settingsPanel.makePanel()
      ]
    });
  }

  private readonly handleSettingsChange = (
    nextSettings: Record<string, unknown>,
    _changedSettings?: SettingsChangeDescriptor[]
  ): void => {
    this.settings = {...this.settings, ...(nextSettings as DeferredRenderingSettings)};
  };
}

function createRenderer(device: Device): ShaderPassRenderer {
  return new ShaderPassRenderer(device, {
    shaderPasses: [createDeferredLightingShaderPassPipeline(), deferredDisplayPipeline],
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
    baseColors: new Float32Array([0.028, 0.04, 0.065, 1]),
    materials: new Float32Array([0.72, 0.08]),
    emissiveColors: new Float32Array([0.001, 0.002, 0.008]),
    instanceCount: 1
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
    scales.push(0.14, 0.14, 0.14);
    baseColors.push(color[0], color[1], color[2], 1);
    materials.push(0.18, 0);
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

    const ring = lightIndex % 2;
    const ringCount = Math.max(1, Math.ceil(lightCount / 2));
    const angle = (lightIndex / ringCount) * Math.PI * 2 + time * (ring === 0 ? 0.42 : -0.31);
    const radius = ring === 0 ? 8.4 : 5.2;
    const worldPosition: NumberArray3 = [
      Math.cos(angle) * radius,
      2.2 + ring * 2.2 + Math.sin(time * 1.7 + lightIndex) * 0.75,
      Math.sin(angle) * radius
    ];
    const color = LIGHT_COLORS[lightIndex % LIGHT_COLORS.length]!;
    markerPositions.set(worldPosition, offset);
    viewLights.push({
      position: viewMatrix.transformAsPoint(worldPosition) as [number, number, number],
      range: ring === 0 ? 7.8 : 6.2,
      color: [color[0], color[1], color[2]],
      intensity: ring === 0 ? 15 : 11
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
    default:
      return 0;
  }
}

function makeSettingsSchema(): SettingsSchema {
  return {
    title: 'Deferred Rendering',
    sections: [
      {
        id: 'inspect',
        name: 'Inspect',
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
              'Depth'
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
        id: 'lighting',
        name: 'Lighting',
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
      }
    ]
  };
}
