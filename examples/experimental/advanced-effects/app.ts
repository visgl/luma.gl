// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {TextureFormatColor, TextureFormatDepthStencil} from '@luma.gl/core';
import {Buffer, Device, Framebuffer, Texture} from '@luma.gl/core';
import type {AnimationProps} from '@luma.gl/engine';
import {
  AnimationLoopTemplate,
  CubeGeometry,
  Model,
  ShaderInputs,
  ShaderPassRenderer
} from '@luma.gl/engine';
import {
  createMotionBlurShaderPassPipeline,
  createOutlineShaderPassPipeline,
  createSSAOShaderPassPipeline,
  createSSRShaderPassPipeline,
  createTAAShaderPassPipeline,
  createVolumetricFogShaderPassPipeline,
  depthAwareBlurShaderPassPipeline
} from '@luma.gl/effects';
import type {ShaderModule, ShaderPass, ShaderPassPipeline} from '@luma.gl/shadertools';
import {Matrix4, radians} from '@math.gl/core';
import {
  ColumnPanel,
  type Panel,
  type SettingsChangeDescriptor,
  type SettingsSchema
} from '@deck.gl-community/panels';
import {
  ExamplePanelManager,
  ExampleSettingsPanelManager,
  getChangedSetting,
  makeExamplePanelHostHtml,
  makeHtmlCustomPanel
} from '../../example-panels';
import {ComparisonSplitter} from './comparison-splitter';

const NEAR_PLANE = 0.1;
const FAR_PLANE = 180;
const GRID_RADIUS = 11;
const INSTANCE_COMPONENTS = 3;

type PresetName = 'Clean' | 'Analytical' | 'Reflective Night' | 'Foggy Depth' | 'Motion';
type QualityName = 'Low' | 'Balanced' | 'Cinematic';
type DebugView = 'Final' | 'Depth' | 'Normals' | 'Velocity' | 'AO' | 'Reflections';

type AdvancedEffectsSettings = {
  preset: PresetName;
  quality: QualityName;
  animate: boolean;
  split: number;
  debugView: DebugView;
  ssaoEnabled: boolean;
  depthBlurEnabled: boolean;
  ssrEnabled: boolean;
  fogEnabled: boolean;
  outlinesEnabled: boolean;
  taaEnabled: boolean;
  motionBlurEnabled: boolean;
};

const PRESETS: Record<PresetName, Partial<AdvancedEffectsSettings>> = {
  Clean: {
    ssaoEnabled: false,
    depthBlurEnabled: false,
    ssrEnabled: false,
    fogEnabled: false,
    outlinesEnabled: false,
    taaEnabled: true,
    motionBlurEnabled: false
  },
  Analytical: {
    ssaoEnabled: true,
    depthBlurEnabled: false,
    ssrEnabled: false,
    fogEnabled: false,
    outlinesEnabled: true,
    taaEnabled: true,
    motionBlurEnabled: false
  },
  'Reflective Night': {
    ssaoEnabled: true,
    depthBlurEnabled: false,
    ssrEnabled: true,
    fogEnabled: true,
    outlinesEnabled: true,
    taaEnabled: true,
    motionBlurEnabled: false
  },
  'Foggy Depth': {
    ssaoEnabled: true,
    depthBlurEnabled: true,
    ssrEnabled: false,
    fogEnabled: true,
    outlinesEnabled: true,
    taaEnabled: true,
    motionBlurEnabled: false
  },
  Motion: {
    ssaoEnabled: true,
    depthBlurEnabled: false,
    ssrEnabled: true,
    fogEnabled: true,
    outlinesEnabled: true,
    taaEnabled: true,
    motionBlurEnabled: true
  }
};

const QUALITY_SCALE: Record<QualityName, number> = {
  Low: 0.35,
  Balanced: 0.5,
  Cinematic: 1
};

const DEFAULT_SETTINGS: AdvancedEffectsSettings = {
  preset: 'Reflective Night',
  quality: 'Balanced',
  animate: true,
  split: 0.52,
  debugView: 'Final',
  ssaoEnabled: true,
  depthBlurEnabled: false,
  ssrEnabled: true,
  fogEnabled: true,
  outlinesEnabled: true,
  taaEnabled: true,
  motionBlurEnabled: false
};

type CityUniforms = {
  viewProjectionMatrix: Matrix4;
  previousViewProjectionMatrix: Matrix4;
  viewMatrix: Matrix4;
  time: number;
  previousTime: number;
  jitter: [number, number];
};

const cityUniforms: ShaderModule<CityUniforms> = {
  name: 'city',
  uniformTypes: {
    viewProjectionMatrix: 'mat4x4<f32>',
    previousViewProjectionMatrix: 'mat4x4<f32>',
    viewMatrix: 'mat4x4<f32>',
    time: 'f32',
    previousTime: 'f32',
    jitter: 'vec2<f32>'
  }
};

const CITY_SHADER = /* wgsl */ `\
struct CityUniforms {
  viewProjectionMatrix: mat4x4<f32>,
  previousViewProjectionMatrix: mat4x4<f32>,
  viewMatrix: mat4x4<f32>,
  time: f32,
  previousTime: f32,
  jitter: vec2f,
};
@group(0) @binding(auto) var<uniform> city: CityUniforms;

struct VertexInputs {
  @location(0) positions: vec3f,
  @location(1) normals: vec3f,
  @location(2) instancePositions: vec3f,
  @location(3) instanceScales: vec3f,
  @location(4) instanceColors: vec4f,
  @location(5) instanceMotion: f32,
};

struct FragmentInputs {
  @builtin(position) position: vec4f,
  @location(0) viewNormal: vec3f,
  @location(1) colorRoughness: vec4f,
  @location(2) currentClip: vec4f,
  @location(3) previousClip: vec4f,
};

struct FragmentOutputs {
  @location(0) color: vec4f,
  @location(1) normalRoughness: vec4f,
  @location(2) velocity: vec2f,
};

fn motionOffset(position: vec3f, motion: f32, time: f32) -> vec3f {
  let phase = position.x * 0.37 + position.z * 0.19;
  return motion * vec3f(sin(time * 0.7 + phase) * 13.0, 2.2 + sin(time * 1.8 + phase), cos(time * 0.7 + phase) * 13.0);
}

@vertex
fn vertexMain(inputs: VertexInputs) -> FragmentInputs {
  let localPosition = inputs.positions * inputs.instanceScales;
  let currentWorld = vec4f(localPosition + inputs.instancePositions + motionOffset(inputs.instancePositions, inputs.instanceMotion, city.time), 1.0);
  let previousWorld = vec4f(localPosition + inputs.instancePositions + motionOffset(inputs.instancePositions, inputs.instanceMotion, city.previousTime), 1.0);
  let currentClip = city.viewProjectionMatrix * currentWorld;
  let previousClip = city.previousViewProjectionMatrix * previousWorld;
  var output: FragmentInputs;
  output.position = vec4f(currentClip.xy + city.jitter * currentClip.w * 2.0, currentClip.zw);
  output.viewNormal = normalize((city.viewMatrix * vec4f(inputs.normals, 0.0)).xyz);
  output.colorRoughness = inputs.instanceColors;
  output.currentClip = currentClip;
  output.previousClip = previousClip;
  return output;
}

@fragment
fn fragmentMain(inputs: FragmentInputs) -> FragmentOutputs {
  let normal = normalize(inputs.viewNormal);
  let lightDirection = normalize(vec3f(0.45, 0.82, 0.35));
  let diffuse = max(dot(normal, lightDirection), 0.0);
  let rim = pow(1.0 - abs(normal.z), 3.0);
  let emissive = select(0.0, 1.4, inputs.colorRoughness.a < 0.12);
  let currentUv = inputs.currentClip.xy / inputs.currentClip.w * 0.5 + 0.5;
  let previousUv = inputs.previousClip.xy / inputs.previousClip.w * 0.5 + 0.5;
  var output: FragmentOutputs;
  output.color = vec4f(inputs.colorRoughness.rgb * (0.18 + diffuse * 0.78 + rim * 0.18 + emissive), 1.0);
  output.normalRoughness = vec4f(normal * 0.5 + 0.5, inputs.colorRoughness.a);
  output.velocity = currentUv - previousUv;
  return output;
}
`;

const displayPass = {
  name: 'advancedEffectsDisplay',
  source: /* wgsl */ `\
struct advancedEffectsDisplayUniforms {
  split: f32,
  debugMode: f32,
};
@group(0) @binding(auto) var<uniform> advancedEffectsDisplay: advancedEffectsDisplayUniforms;
@group(0) @binding(auto) var originalTexture: texture_2d<f32>;
@group(0) @binding(auto) var originalTextureSampler: sampler;
@group(0) @binding(auto) var depthTexture: texture_depth_2d;
@group(0) @binding(auto) var depthTextureSampler: sampler;
@group(0) @binding(auto) var normalTexture: texture_2d<f32>;
@group(0) @binding(auto) var normalTextureSampler: sampler;
@group(0) @binding(auto) var velocityTexture: texture_2d<f32>;
@group(0) @binding(auto) var velocityTextureSampler: sampler;
fn advancedEffectsDisplay_sampleColor(
  sourceTexture: texture_2d<f32>, sourceTextureSampler: sampler, texSize: vec2f, texCoord: vec2f
) -> vec4f {
  let sceneCoord = texCoord;
  if (advancedEffectsDisplay.debugMode > 0.5 && advancedEffectsDisplay.debugMode < 1.5) {
    let depth = textureSample(depthTexture, depthTextureSampler, sceneCoord);
    return vec4f(vec3f(pow(depth, 32.0)), 1.0);
  }
  if (advancedEffectsDisplay.debugMode > 1.5 && advancedEffectsDisplay.debugMode < 2.5) {
    return vec4f(textureSample(normalTexture, normalTextureSampler, sceneCoord).rgb, 1.0);
  }
  if (advancedEffectsDisplay.debugMode > 2.5 && advancedEffectsDisplay.debugMode < 3.5) {
    let velocity = textureSample(velocityTexture, velocityTextureSampler, sceneCoord).xy;
    return vec4f(0.5 + velocity.x * 12.0, 0.5 + velocity.y * 12.0, length(velocity) * 18.0, 1.0);
  }
  let original = textureSample(originalTexture, originalTextureSampler, sceneCoord);
  let processed = textureSample(sourceTexture, sourceTextureSampler, texCoord);
  return select(processed, original, texCoord.x < advancedEffectsDisplay.split);
}`,
  bindingLayout: [
    {name: 'originalTexture', group: 0},
    {name: 'depthTexture', group: 0},
    {name: 'normalTexture', group: 0},
    {name: 'velocityTexture', group: 0}
  ],
  uniformTypes: {split: 'f32', debugMode: 'f32'},
  propTypes: {split: {value: 0.52, min: 0, max: 1}, debugMode: {value: 0, private: true}},
  passes: [{sampler: true}]
} as const satisfies ShaderPass;

const displayPipeline: ShaderPassPipeline = {
  name: 'advancedEffectsDisplayPipeline',
  steps: [
    {
      shaderPass: displayPass,
      inputs: {sourceTexture: 'previous', originalTexture: 'original'},
      output: 'previous'
    }
  ]
};

class VisualizationCityModel {
  readonly model: Model;
  readonly buffers: Buffer[];

  constructor(device: Device) {
    const data = makeCityInstances();
    const positionBuffer = device.createBuffer(data.positions);
    const scaleBuffer = device.createBuffer(data.scales);
    const colorBuffer = device.createBuffer(data.colors);
    const motionBuffer = device.createBuffer(data.motion);
    this.buffers = [positionBuffer, scaleBuffer, colorBuffer, motionBuffer];
    this.model = new Model(device, {
      id: 'visualization-city',
      source: CITY_SHADER,
      geometry: new CubeGeometry({indices: true}),
      instanceCount: data.instanceCount,
      shaderInputs: new ShaderInputs({city: cityUniforms}),
      bufferLayout: [
        {name: 'instancePositions', format: 'float32x3'},
        {name: 'instanceScales', format: 'float32x3'},
        {name: 'instanceColors', format: 'unorm8x4'},
        {name: 'instanceMotion', format: 'float32'}
      ],
      attributes: {
        instancePositions: positionBuffer,
        instanceScales: scaleBuffer,
        instanceColors: colorBuffer,
        instanceMotion: motionBuffer
      },
      colorAttachmentFormats: ['rgba8unorm', 'rgba8unorm', 'rg16float'],
      depthStencilAttachmentFormat: 'depth24plus',
      parameters: {depthWriteEnabled: true, depthCompare: 'less-equal', cullMode: 'back'}
    });
  }

  setUniforms(uniforms: CityUniforms): void {
    this.model.shaderInputs.setProps({city: uniforms});
  }

  destroy(): void {
    this.model.destroy();
    for (const buffer of this.buffers) {
      buffer.destroy();
    }
  }
}

/** WebGPU-only experimental showcase for composable screen-space effects. */
export default class AppAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = makeExamplePanelHostHtml();

  readonly device: Device;
  readonly city: VisualizationCityModel;
  readonly panels: ExamplePanelManager;
  readonly settingsPanel: ExampleSettingsPanelManager;
  readonly comparisonSplitter: ComparisonSplitter | null;
  sceneFramebuffer: Framebuffer;
  renderer: ShaderPassRenderer;
  settings: AdvancedEffectsSettings = {...DEFAULT_SETTINGS};
  previousTime = 0;
  previousViewProjectionMatrix = new Matrix4();
  frameIndex = 0;

  constructor({device, width, height}: AnimationProps) {
    super();
    this.device = device;
    this.city = new VisualizationCityModel(device);
    this.sceneFramebuffer = createSceneFramebuffer(device, width, height);
    this.renderer = this.createRenderer();
    this.settingsPanel = new ExampleSettingsPanelManager({
      id: 'advanced-effects-settings',
      schema: makeSettingsSchema(),
      settings: this.settings,
      onSettingsChange: this.handleSettingsChange
    });
    this.panels = new ExamplePanelManager({panel: this.makePanel()});
    this.panels.mount();
    const canvas = device.getDefaultCanvasContext().canvas;
    this.comparisonSplitter =
      canvas instanceof HTMLCanvasElement
        ? new ComparisonSplitter({
            canvas,
            value: this.settings.split,
            onChange: split => {
              this.settings = {...this.settings, split};
            },
            onCommit: split => this.settingsPanel.setSettingValue('split', split)
          })
        : null;
  }

  onRender({device, width, height, aspect, tick}: AnimationProps): void {
    this.sceneFramebuffer.resize({width, height});
    this.renderer.resize([width, height]);
    this.comparisonSplitter?.setVisible(this.settings.debugView === 'Final');
    this.comparisonSplitter?.updateLayout();

    const time = this.settings.animate ? tick / 1000 : this.previousTime;
    const cameraAngle = this.settings.animate ? time * 0.055 : 0.55;
    const eye: [number, number, number] = [
      Math.sin(cameraAngle) * 43,
      25 + Math.sin(cameraAngle * 1.7) * 3,
      Math.cos(cameraAngle) * 43
    ];
    const projectionMatrix = new Matrix4().perspective({
      fovy: radians(52),
      aspect,
      near: NEAR_PLANE,
      far: FAR_PLANE
    });
    const inverseProjectionMatrix = new Matrix4(projectionMatrix).invert();
    const viewMatrix = new Matrix4().lookAt({eye, center: [0, 5, 0], up: [0, 1, 0]});
    const viewProjectionMatrix = new Matrix4(projectionMatrix).multiplyRight(viewMatrix);
    if (this.frameIndex === 0) {
      this.previousViewProjectionMatrix = new Matrix4(viewProjectionMatrix);
      this.previousTime = time;
    }
    const jitter = getJitter(this.frameIndex, width, height);
    const previousJitter = getJitter(Math.max(0, this.frameIndex - 1), width, height);
    this.city.setUniforms({
      viewProjectionMatrix,
      previousViewProjectionMatrix: this.previousViewProjectionMatrix,
      viewMatrix,
      time,
      previousTime: this.previousTime,
      jitter
    });

    const renderPass = device.beginRenderPass({
      framebuffer: this.sceneFramebuffer,
      clearColors: [
        new Float32Array([0.015, 0.025, 0.06, 1]),
        new Float32Array([0.5, 0.5, 1, 1]),
        new Float32Array([0, 0, 0, 0])
      ],
      clearDepth: 1
    });
    this.city.model.draw(renderPass);
    renderPass.end();

    const [colorTexture, normalTexture, velocityTexture] =
      this.sceneFramebuffer.colorAttachments.map(attachment => attachment.texture);
    const depthTexture = this.sceneFramebuffer.depthStencilAttachment?.texture;
    if (!colorTexture || !normalTexture || !velocityTexture || !depthTexture) {
      return;
    }
    const debugMode = getDebugMode(this.settings.debugView);
    this.renderer.renderToScreen({
      sourceTexture: colorTexture,
      bindings: {depthTexture, normalTexture, velocityTexture},
      uniforms: {
        ssaoEvaluate: {nearPlane: NEAR_PLANE, farPlane: FAR_PLANE},
        ssaoComposite: {debugMode: this.settings.debugView === 'AO' ? 1 : 0},
        screenSpaceOutline: {thickness: this.settings.quality === 'Cinematic' ? 1.8 : 1.25},
        taaResolve: {
          historyWeight: this.settings.quality === 'Low' ? 0.52 : 0.68,
          currentJitter: jitter,
          previousJitter
        },
        motionBlur: {strength: 1.55, sampleCount: this.settings.quality === 'Cinematic' ? 16 : 9},
        ssrTrace: {
          projectionMatrix,
          inverseProjectionMatrix,
          intensity: this.settings.preset === 'Reflective Night' ? 1.8 : 1.35,
          maxDistance: this.settings.quality === 'Low' ? 55 : 95,
          thickness: this.settings.quality === 'Cinematic' ? 0.48 : 0.72,
          sampleCount:
            this.settings.quality === 'Low' ? 20 : this.settings.quality === 'Cinematic' ? 56 : 36
        },
        ssrComposite: {debugMode: this.settings.debugView === 'Reflections' ? 1 : 0},
        volumetricFog: {
          density: this.settings.preset === 'Foggy Depth' ? 0.2 : 0.08,
          historyWeight: this.settings.quality === 'Low' ? 0.08 : 0.18,
          time
        },
        advancedEffectsDisplay: {split: this.settings.split, debugMode}
      }
    });

    this.previousViewProjectionMatrix = new Matrix4(viewProjectionMatrix);
    this.previousTime = time;
    this.frameIndex++;
  }

  onFinalize(): void {
    this.comparisonSplitter?.destroy();
    this.settingsPanel.finalize();
    this.panels.finalize();
    this.city.destroy();
    this.renderer.destroy();
    this.sceneFramebuffer.destroy();
  }

  private createRenderer(): ShaderPassRenderer {
    const scale = QUALITY_SCALE[this.settings.quality];
    const pipelines: ShaderPassPipeline[] = [];
    if (this.settings.ssaoEnabled) {
      pipelines.push(
        createSSAOShaderPassPipeline({normalSource: 'normal-texture', resolutionScale: scale})
      );
    }
    if (this.settings.depthBlurEnabled) {
      pipelines.push(depthAwareBlurShaderPassPipeline);
    }
    if (this.settings.ssrEnabled) {
      pipelines.push(createSSRShaderPassPipeline({resolutionScale: scale}));
    }
    if (this.settings.fogEnabled) {
      pipelines.push(createVolumetricFogShaderPassPipeline());
    }
    if (this.settings.outlinesEnabled) {
      pipelines.push(createOutlineShaderPassPipeline({normalSource: 'normal-texture'}));
    }
    if (this.settings.taaEnabled) {
      pipelines.push(createTAAShaderPassPipeline());
    }
    if (this.settings.motionBlurEnabled) {
      pipelines.push(createMotionBlurShaderPassPipeline());
    }
    pipelines.push(displayPipeline);
    return new ShaderPassRenderer(this.device, {shaderPasses: pipelines, flipY: true});
  }

  private rebuildRenderer(): void {
    this.renderer.destroy();
    this.renderer = this.createRenderer();
    this.frameIndex = 0;
  }

  private makePanel(): Panel {
    return new ColumnPanel({
      id: 'advanced-effects-controls',
      title: 'Visualization City',
      panels: [
        makeHtmlCustomPanel({
          id: 'advanced-effects-description',
          title: '',
          html: '<p><b>Composable screen-space rendering</b></p><p>Drag the divider to compare the raw MRT scene on the left with SSAO, SSR, fog, outlines, TAA, and motion blur on the right.</p>'
        }),
        this.settingsPanel.makePanel()
      ]
    });
  }

  private readonly handleSettingsChange = (
    nextSettings: Record<string, unknown>,
    changedSettings?: SettingsChangeDescriptor[]
  ): void => {
    const preset = getChangedSetting(changedSettings, 'preset')?.nextValue;
    this.settings = {...this.settings, ...(nextSettings as AdvancedEffectsSettings)};
    if (typeof preset === 'string' && preset in PRESETS) {
      this.settings = {
        ...this.settings,
        ...PRESETS[preset as PresetName],
        preset: preset as PresetName
      };
      this.settingsPanel.setSchemaAndSettings(makeSettingsSchema(), this.settings);
    }
    this.comparisonSplitter?.setValue(this.settings.split);
    this.comparisonSplitter?.setVisible(this.settings.debugView === 'Final');
    this.rebuildRenderer();
  };
}

function createSceneFramebuffer(device: Device, width: number, height: number): Framebuffer {
  const colorTexture = createColorTexture(
    device,
    'advanced-effects-color',
    'rgba8unorm',
    width,
    height
  );
  const normalTexture = createColorTexture(
    device,
    'advanced-effects-normal-roughness',
    'rgba8unorm',
    width,
    height
  );
  const velocityTexture = createColorTexture(
    device,
    'advanced-effects-velocity',
    'rg16float',
    width,
    height
  );
  const depthTexture = createDepthTexture(
    device,
    'advanced-effects-depth',
    'depth24plus',
    width,
    height
  );
  return device.createFramebuffer({
    id: 'advanced-effects-scene-framebuffer',
    width,
    height,
    colorAttachments: [colorTexture, normalTexture, velocityTexture],
    depthStencilAttachment: depthTexture
  });
}

function createColorTexture(
  device: Device,
  id: string,
  format: TextureFormatColor,
  width: number,
  height: number
): Texture {
  return device.createTexture({
    id,
    format,
    width,
    height,
    usage: Texture.SAMPLE | Texture.RENDER | Texture.COPY_DST,
    sampler: {
      minFilter: 'linear',
      magFilter: 'linear',
      addressModeU: 'clamp-to-edge',
      addressModeV: 'clamp-to-edge'
    }
  });
}

function createDepthTexture(
  device: Device,
  id: string,
  format: TextureFormatDepthStencil,
  width: number,
  height: number
): Texture {
  return device.createTexture({
    id,
    format,
    width,
    height,
    usage: Texture.SAMPLE | Texture.RENDER | Texture.COPY_DST,
    sampler: {
      minFilter: 'nearest',
      magFilter: 'nearest',
      addressModeU: 'clamp-to-edge',
      addressModeV: 'clamp-to-edge'
    }
  });
}

function makeCityInstances(): {
  positions: Float32Array;
  scales: Float32Array;
  colors: Uint8Array;
  motion: Float32Array;
  instanceCount: number;
} {
  const positions: number[] = [];
  const scales: number[] = [];
  const colors: number[] = [];
  const motion: number[] = [];
  const addInstance = (
    position: [number, number, number],
    scale: [number, number, number],
    color: [number, number, number, number],
    moves = false
  ) => {
    positions.push(...position);
    scales.push(...scale);
    colors.push(...color);
    motion.push(moves ? 1 : 0);
  };

  addInstance([0, -1.2, 0], [36, 1, 36], [20, 48, 66, 18]);
  for (let x = -GRID_RADIUS; x <= GRID_RADIUS; x++) {
    for (let z = -GRID_RADIUS; z <= GRID_RADIUS; z++) {
      if (x % 4 === 0 || z % 4 === 0) {
        continue;
      }
      const hash = Math.abs(Math.sin(x * 91.17 + z * 37.63));
      const height = 1.5 + hash * hash * 11;
      const colorMix = Math.abs(Math.sin(x * 4.13 - z * 7.77));
      addInstance(
        [x * 2.6, height * 0.5, z * 2.6],
        [0.9 + hash * 0.25, height, 0.9 + colorMix * 0.25],
        [
          28 + Math.round(colorMix * 25),
          76 + Math.round(hash * 75),
          112 + Math.round(colorMix * 90),
          170 + Math.round(hash * 65)
        ]
      );
    }
  }
  for (let index = 0; index < 28; index++) {
    const angle = (index / 28) * Math.PI * 2;
    addInstance(
      [Math.sin(angle) * 5, 2.5 + (index % 4), Math.cos(angle) * 5],
      [0.34, 0.34, 1.1 + (index % 3) * 0.25],
      [40 + (index % 2) * 160, 205, 255 - (index % 3) * 55, 12],
      true
    );
  }
  return {
    positions: new Float32Array(positions),
    scales: new Float32Array(scales),
    colors: new Uint8Array(colors),
    motion: new Float32Array(motion),
    instanceCount: positions.length / INSTANCE_COMPONENTS
  };
}

function getJitter(frameIndex: number, width: number, height: number): [number, number] {
  const sequence = [
    [0.5, 1 / 3],
    [0.25, 2 / 3],
    [0.75, 1 / 9],
    [0.125, 4 / 9],
    [0.625, 7 / 9]
  ];
  const sample = sequence[frameIndex % sequence.length];
  return [(sample[0] - 0.5) / Math.max(width, 1), (sample[1] - 0.5) / Math.max(height, 1)];
}

function getDebugMode(debugView: DebugView): number {
  switch (debugView) {
    case 'Depth':
      return 1;
    case 'Normals':
      return 2;
    case 'Velocity':
      return 3;
    default:
      return 0;
  }
}

function makeSettingsSchema(): SettingsSchema {
  const toggle = (name: keyof AdvancedEffectsSettings, label: string) => ({
    name,
    label,
    type: 'boolean' as const,
    persist: 'none' as const
  });
  return {
    title: 'Advanced Effects',
    sections: [
      {
        id: 'presentation',
        name: 'Presentation',
        initiallyCollapsed: false,
        settings: [
          {
            name: 'preset',
            label: 'Preset',
            type: 'select',
            persist: 'none',
            options: Object.keys(PRESETS)
          },
          {
            name: 'quality',
            label: 'Quality',
            type: 'select',
            persist: 'none',
            options: Object.keys(QUALITY_SCALE)
          },
          {
            name: 'debugView',
            label: 'Debug View',
            type: 'select',
            persist: 'none',
            options: ['Final', 'Depth', 'Normals', 'Velocity', 'AO', 'Reflections']
          },
          {
            name: 'split',
            label: 'Before / After',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 1,
            step: 0.01
          },
          toggle('animate', 'Animate City')
        ]
      },
      {
        id: 'effects',
        name: 'Effect Stack',
        initiallyCollapsed: false,
        settings: [
          toggle('ssaoEnabled', 'SSAO'),
          toggle('depthBlurEnabled', 'Depth-aware Blur'),
          toggle('ssrEnabled', 'Screen-space Reflections'),
          toggle('fogEnabled', 'Volumetric Fog'),
          toggle('outlinesEnabled', 'Outlines'),
          toggle('taaEnabled', 'Temporal AA'),
          toggle('motionBlurEnabled', 'Motion Blur')
        ]
      }
    ]
  };
}
