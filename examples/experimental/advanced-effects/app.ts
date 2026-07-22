// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Device} from '@luma.gl/core';
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
import {
  createContactShadowShaderPassPipeline,
  GBuffer,
  shadow,
  ShadowMapRenderer,
  type ShadowShaderProps
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
  getChangedSetting,
  makeExamplePanelHostHtml,
  makeHtmlCustomPanel
} from '../../example-panels';
import {ComparisonSplitter} from './comparison-splitter';
import {
  CityShadowCasterModels,
  getCityShadowLights,
  SUN_DIRECTION,
  type CityInstanceBuffers
} from './city-shadows';

const NEAR_PLANE = 0.1;
const FAR_PLANE = 180;
const GRID_RADIUS = 11;
const INSTANCE_COMPONENTS = 3;

type PresetName =
  | 'Shadow Study'
  | 'Clean'
  | 'Analytical'
  | 'Reflective Night'
  | 'Foggy Depth'
  | 'Motion';
type DebugView =
  | 'Final'
  | 'Depth'
  | 'Normals'
  | 'Velocity'
  | 'AO'
  | 'Reflections'
  | 'Directional'
  | 'Cascades'
  | 'Spot'
  | 'Point'
  | 'Contact'
  | 'Combined';

type AdvancedEffectsSettings = {
  preset: PresetName;
  shadowQuality: 'low' | 'balanced' | 'cinematic';
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
  directionalShadowsEnabled: boolean;
  spotShadowsEnabled: boolean;
  pointShadowsEnabled: boolean;
  contactShadowsEnabled: boolean;
};

const PRESETS: Record<PresetName, Partial<AdvancedEffectsSettings>> = {
  'Shadow Study': {
    ssaoEnabled: true,
    depthBlurEnabled: false,
    ssrEnabled: true,
    fogEnabled: true,
    outlinesEnabled: true,
    taaEnabled: true,
    motionBlurEnabled: false,
    directionalShadowsEnabled: true,
    spotShadowsEnabled: true,
    pointShadowsEnabled: true,
    contactShadowsEnabled: true
  },
  Clean: {
    ssaoEnabled: false,
    depthBlurEnabled: false,
    ssrEnabled: false,
    fogEnabled: false,
    outlinesEnabled: false,
    taaEnabled: true,
    motionBlurEnabled: false,
    directionalShadowsEnabled: false,
    spotShadowsEnabled: false,
    pointShadowsEnabled: false,
    contactShadowsEnabled: false
  },
  Analytical: {
    ssaoEnabled: true,
    depthBlurEnabled: false,
    ssrEnabled: false,
    fogEnabled: false,
    outlinesEnabled: true,
    taaEnabled: true,
    motionBlurEnabled: false,
    directionalShadowsEnabled: true,
    spotShadowsEnabled: false,
    pointShadowsEnabled: false,
    contactShadowsEnabled: true
  },
  'Reflective Night': {
    ssaoEnabled: true,
    depthBlurEnabled: false,
    ssrEnabled: true,
    fogEnabled: true,
    outlinesEnabled: true,
    taaEnabled: true,
    motionBlurEnabled: false,
    directionalShadowsEnabled: true,
    spotShadowsEnabled: true,
    pointShadowsEnabled: true,
    contactShadowsEnabled: true
  },
  'Foggy Depth': {
    ssaoEnabled: true,
    depthBlurEnabled: true,
    ssrEnabled: false,
    fogEnabled: true,
    outlinesEnabled: true,
    taaEnabled: true,
    motionBlurEnabled: false,
    directionalShadowsEnabled: true,
    spotShadowsEnabled: false,
    pointShadowsEnabled: false,
    contactShadowsEnabled: true
  },
  Motion: {
    ssaoEnabled: true,
    depthBlurEnabled: false,
    ssrEnabled: true,
    fogEnabled: true,
    outlinesEnabled: true,
    taaEnabled: true,
    motionBlurEnabled: true,
    directionalShadowsEnabled: true,
    spotShadowsEnabled: true,
    pointShadowsEnabled: true,
    contactShadowsEnabled: true
  }
};

const SHADOW_QUALITY_SCALE: Record<'low' | 'balanced' | 'cinematic', number> = {
  low: 0.35,
  balanced: 0.5,
  cinematic: 1
};

const DEFAULT_SETTINGS: AdvancedEffectsSettings = {
  preset: 'Shadow Study',
  shadowQuality: 'balanced',
  animate: true,
  split: 0.52,
  debugView: 'Final',
  ssaoEnabled: true,
  depthBlurEnabled: false,
  ssrEnabled: true,
  fogEnabled: true,
  outlinesEnabled: true,
  taaEnabled: true,
  motionBlurEnabled: false,
  directionalShadowsEnabled: true,
  spotShadowsEnabled: true,
  pointShadowsEnabled: true,
  contactShadowsEnabled: true
};

type CityUniforms = {
  viewProjectionMatrix: Matrix4;
  previousViewProjectionMatrix: Matrix4;
  viewMatrix: Matrix4;
  sunDirection: NumberArray3;
  spotPosition: NumberArray3;
  spotDirection: NumberArray3;
  pointPosition: NumberArray3;
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
    sunDirection: 'vec3<f32>',
    spotPosition: 'vec3<f32>',
    spotDirection: 'vec3<f32>',
    pointPosition: 'vec3<f32>',
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
  sunDirection: vec3f,
  spotPosition: vec3f,
  spotDirection: vec3f,
  pointPosition: vec3f,
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
  @location(0) worldNormal: vec3f,
  @location(1) colorRoughness: vec4f,
  @location(2) currentClip: vec4f,
  @location(3) previousClip: vec4f,
  @location(4) worldPosition: vec3f,
  @location(5) viewPosition: vec3f,
};

struct FragmentOutputs {
  @location(0) color: vec4f,
  @location(1) normalRoughness: vec4f,
  @location(2) velocity: vec2f,
  @location(3) unshadowedColor: vec4f,
  @location(4) directionalDirect: vec4f,
  @location(5) shadowDebug: vec4f,
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
  output.worldNormal = normalize(inputs.normals);
  output.colorRoughness = inputs.instanceColors;
  output.currentClip = currentClip;
  output.previousClip = previousClip;
  output.worldPosition = currentWorld.xyz;
  output.viewPosition = (city.viewMatrix * currentWorld).xyz;
  return output;
}

@fragment
fn fragmentMain(inputs: FragmentInputs) -> FragmentOutputs {
  let worldNormal = normalize(inputs.worldNormal);
  let viewNormal = normalize((city.viewMatrix * vec4f(worldNormal, 0.0)).xyz);
  let baseColor = inputs.colorRoughness.rgb;
  let rim = pow(1.0 - abs(viewNormal.z), 3.0);
  let emissiveStrength = select(0.0, 1.45, inputs.colorRoughness.a < 0.12);

  let directionalDiffuse = max(dot(worldNormal, normalize(city.sunDirection)), 0.0);
  let directionalUnshadowed = baseColor * directionalDiffuse * vec3f(1.0, 0.92, 0.78) * 0.82;
  let directionalFactor = shadow_getDirectionalFactor(
    inputs.worldPosition,
    worldNormal,
    -inputs.viewPosition.z
  );

  let toSpot = city.spotPosition - inputs.worldPosition;
  let spotDistance = length(toSpot);
  let spotDirectionToLight = normalize(toSpot);
  let spotCone = smoothstep(cos(0.42), cos(0.30), dot(normalize(-toSpot), normalize(city.spotDirection)));
  let spotAttenuation = spotCone * pow(clamp(1.0 - spotDistance / 52.0, 0.0, 1.0), 2.0);
  let spotDiffuse = max(dot(worldNormal, spotDirectionToLight), 0.0);
  let spotUnshadowed = vec3f(1.0, 0.55, 0.24) * spotDiffuse * spotAttenuation * 3.2;
  let spotFactor = shadow_getSpotFactor(0, inputs.worldPosition, worldNormal);

  let toPoint = city.pointPosition - inputs.worldPosition;
  let pointDistance = length(toPoint);
  let pointAttenuation = pow(clamp(1.0 - pointDistance / 24.0, 0.0, 1.0), 2.0);
  let pointDiffuse = max(dot(worldNormal, normalize(toPoint)), 0.0);
  let pointUnshadowed = vec3f(0.18, 0.78, 1.0) * pointDiffuse * pointAttenuation * 4.0;
  let pointFactor = shadow_getPointFactor(0, inputs.worldPosition, worldNormal);

  let ambientEmissive = baseColor * (0.13 + rim * 0.16 + emissiveStrength);
  let unshadowed = ambientEmissive + directionalUnshadowed + spotUnshadowed + pointUnshadowed;
  let shadowedDirectional = directionalUnshadowed * directionalFactor;
  let shadowed = ambientEmissive + shadowedDirectional + spotUnshadowed * spotFactor + pointUnshadowed * pointFactor;
  let currentUv = inputs.currentClip.xy / inputs.currentClip.w * 0.5 + 0.5;
  let previousUv = inputs.previousClip.xy / inputs.previousClip.w * 0.5 + 0.5;
  let cascadeIndex = max(shadow_getDirectionalCascadeIndex(-inputs.viewPosition.z), 0);
  var output: FragmentOutputs;
  output.color = vec4f(shadowed, 1.0);
  output.normalRoughness = vec4f(viewNormal * 0.5 + 0.5, inputs.colorRoughness.a);
  output.velocity = currentUv - previousUv;
  output.unshadowedColor = vec4f(unshadowed, 1.0);
  output.directionalDirect = vec4f(shadowedDirectional, 1.0);
  output.shadowDebug = vec4f(
    directionalFactor,
    spotFactor,
    pointFactor,
    f32(cascadeIndex) / 3.0
  );
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
@group(0) @binding(auto) var unshadowedColorTexture: texture_2d<f32>;
@group(0) @binding(auto) var unshadowedColorTextureSampler: sampler;
@group(0) @binding(auto) var depthTexture: texture_depth_2d;
@group(0) @binding(auto) var depthTextureSampler: sampler;
@group(0) @binding(auto) var normalTexture: texture_2d<f32>;
@group(0) @binding(auto) var normalTextureSampler: sampler;
@group(0) @binding(auto) var velocityTexture: texture_2d<f32>;
@group(0) @binding(auto) var velocityTextureSampler: sampler;
@group(0) @binding(auto) var shadowDebugTexture: texture_2d<f32>;
@group(0) @binding(auto) var shadowDebugTextureSampler: sampler;
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
  let shadowDebug = textureSample(shadowDebugTexture, shadowDebugTextureSampler, sceneCoord);
  if (advancedEffectsDisplay.debugMode > 3.5 && advancedEffectsDisplay.debugMode < 4.5) {
    return vec4f(vec3f(shadowDebug.r), 1.0);
  }
  if (advancedEffectsDisplay.debugMode > 4.5 && advancedEffectsDisplay.debugMode < 5.5) {
    let colors = array<vec3f, 4>(
      vec3f(0.2, 0.6, 1.0), vec3f(0.2, 1.0, 0.45), vec3f(1.0, 0.75, 0.2), vec3f(1.0, 0.25, 0.35)
    );
    return vec4f(colors[min(i32(round(shadowDebug.a * 3.0)), 3)], 1.0);
  }
  if (advancedEffectsDisplay.debugMode > 5.5 && advancedEffectsDisplay.debugMode < 6.5) {
    return vec4f(vec3f(shadowDebug.g), 1.0);
  }
  if (advancedEffectsDisplay.debugMode > 6.5 && advancedEffectsDisplay.debugMode < 7.5) {
    return vec4f(vec3f(shadowDebug.b), 1.0);
  }
  let processed = textureSample(sourceTexture, sourceTextureSampler, texCoord);
  if (advancedEffectsDisplay.debugMode > 7.5) { return processed; }
  let original = textureSample(unshadowedColorTexture, unshadowedColorTextureSampler, sceneCoord);
  return select(processed, original, texCoord.x < advancedEffectsDisplay.split);
}`,
  bindingLayout: [
    {name: 'unshadowedColorTexture', group: 0},
    {name: 'depthTexture', group: 0},
    {name: 'normalTexture', group: 0},
    {name: 'velocityTexture', group: 0},
    {name: 'shadowDebugTexture', group: 0}
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
      inputs: {sourceTexture: 'previous'},
      output: 'previous'
    }
  ]
};

class VisualizationCityModel {
  readonly model: Model;
  readonly buffers: CityInstanceBuffers;
  readonly instanceCount: number;

  constructor(device: Device) {
    const data = makeCityInstances();
    const positionBuffer = device.createBuffer(data.positions);
    const scaleBuffer = device.createBuffer(data.scales);
    const colorBuffer = device.createBuffer(data.colors);
    const motionBuffer = device.createBuffer(data.motion);
    this.buffers = {
      positions: positionBuffer,
      scales: scaleBuffer,
      colors: colorBuffer,
      motion: motionBuffer
    };
    this.instanceCount = data.instanceCount;
    this.model = new Model(device, {
      id: 'visualization-city',
      source: CITY_SHADER,
      geometry: new CubeGeometry({indices: true}),
      instanceCount: data.instanceCount,
      modules: [shadow],
      shaderInputs: new ShaderInputs({city: cityUniforms, shadow}),
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
      colorAttachmentFormats: [
        'rgba8unorm',
        'rgba8unorm',
        'rg16float',
        'rgba8unorm',
        'rgba16float',
        'rgba16float'
      ],
      depthStencilAttachmentFormat: 'depth24plus',
      parameters: {depthWriteEnabled: true, depthCompare: 'less-equal', cullMode: 'back'}
    });
  }

  setUniforms(uniforms: CityUniforms): void {
    this.model.shaderInputs.setProps({city: uniforms});
  }

  setShadowProps(props: ShadowShaderProps): void {
    this.model.shaderInputs.setProps({shadow: props});
  }

  destroy(): void {
    this.model.destroy();
    for (const buffer of Object.values(this.buffers)) {
      buffer.destroy();
    }
  }
}

/** WebGPU-only experimental showcase for composable screen-space effects. */
export default class AppAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = makeExamplePanelHostHtml();

  readonly device: Device;
  readonly city: VisualizationCityModel;
  readonly shadowRenderer: ShadowMapRenderer;
  readonly shadowCasters: CityShadowCasterModels;
  readonly panels: ExamplePanelManager;
  readonly settingsPanel: ExampleSettingsPanelManager;
  readonly comparisonSplitter: ComparisonSplitter | null;
  sceneGBuffer: GBuffer;
  renderer: ShaderPassRenderer;
  settings: AdvancedEffectsSettings = {...DEFAULT_SETTINGS};
  previousTime = 0;
  previousViewProjectionMatrix = new Matrix4();
  frameIndex = 0;
  framebufferSize: [number, number];

  constructor({device, width, height}: AnimationProps) {
    super();
    this.device = device;
    this.city = new VisualizationCityModel(device);
    this.shadowRenderer = new ShadowMapRenderer(device, {quality: this.settings.shadowQuality});
    this.shadowCasters = new CityShadowCasterModels(
      device,
      this.city.buffers,
      this.city.instanceCount
    );
    this.sceneGBuffer = createSceneGBuffer(device, width, height);
    this.renderer = this.createRenderer();
    this.framebufferSize = [width, height];
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
    const framebufferSizeChanged =
      this.framebufferSize[0] !== width || this.framebufferSize[1] !== height;
    if (framebufferSizeChanged) {
      this.framebufferSize = [width, height];
      this.renderer.resetHistory();
      this.frameIndex = 0;
    }
    this.sceneGBuffer.resize({width, height});
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
    const lights = getCityShadowLights(time);
    const shadowProps = this.shadowRenderer.render({
      camera: {
        viewMatrix,
        projectionMatrix,
        near: NEAR_PLANE,
        far: FAR_PLANE
      },
      directionalLights: this.settings.directionalShadowsEnabled ? [lights.directional] : [],
      spotLights: this.settings.spotShadowsEnabled ? [lights.spot] : [],
      pointLights: this.settings.pointShadowsEnabled ? [lights.point] : [],
      drawShadowCasters: view => this.shadowCasters.draw(view, time)
    });
    this.city.setShadowProps(shadowProps);
    this.city.setUniforms({
      viewProjectionMatrix,
      previousViewProjectionMatrix: this.previousViewProjectionMatrix,
      viewMatrix,
      sunDirection: SUN_DIRECTION,
      spotPosition: lights.spot.position as NumberArray3,
      spotDirection: lights.spot.direction as NumberArray3,
      pointPosition: lights.point.position as NumberArray3,
      time,
      previousTime: this.previousTime,
      jitter
    });

    const renderPass = device.beginRenderPass({
      framebuffer: this.sceneGBuffer.framebuffer,
      clearColors: [
        new Float32Array([0.015, 0.025, 0.06, 1]),
        new Float32Array([0.5, 0.5, 1, 1]),
        new Float32Array([0, 0, 0, 0]),
        new Float32Array([0.015, 0.025, 0.06, 1]),
        new Float32Array([0, 0, 0, 0]),
        new Float32Array([1, 1, 1, 0])
      ],
      clearDepth: 1
    });
    this.city.model.draw(renderPass);
    renderPass.end();

    const colorTexture = this.sceneGBuffer.colorTexture;
    const unshadowedColorTexture = this.sceneGBuffer.getExtraColorTexture('unshadowedColor');
    const directionalDirectTexture = this.sceneGBuffer.getExtraColorTexture('directionalDirect');
    const shadowDebugTexture = this.sceneGBuffer.getExtraColorTexture('shadowDebug');
    const debugMode = getDebugMode(this.settings.debugView);
    const lightDirectionView = normalize3(
      viewMatrix.transformAsVector(SUN_DIRECTION) as NumberArray3
    );
    this.renderer.renderToScreen({
      sourceTexture: colorTexture,
      bindings: {
        ...this.sceneGBuffer.getShaderPassBindings(),
        unshadowedColorTexture,
        directionalDirectTexture,
        shadowDebugTexture
      },
      uniforms: {
        contactShadowTrace: {
          projectionMatrix,
          inverseProjectionMatrix,
          lightDirectionView,
          frameIndex: this.frameIndex,
          maxDistance: this.settings.shadowQuality === 'cinematic' ? 5 : 3.5,
          thickness: this.settings.shadowQuality === 'low' ? 0.18 : 0.12
        },
        contactShadowComposite: {
          strength: 0.9,
          debugMode:
            this.settings.debugView === 'Contact'
              ? 1
              : this.settings.debugView === 'Combined'
                ? 2
                : 0
        },
        ssaoEvaluate: {nearPlane: NEAR_PLANE, farPlane: FAR_PLANE},
        ssaoComposite: {debugMode: this.settings.debugView === 'AO' ? 1 : 0},
        screenSpaceOutline: {thickness: this.settings.shadowQuality === 'cinematic' ? 1.8 : 1.25},
        taaResolve: {
          historyWeight: this.settings.shadowQuality === 'low' ? 0.52 : 0.68,
          currentJitter: jitter,
          previousJitter
        },
        motionBlur: {
          strength: 1.55,
          sampleCount: this.settings.shadowQuality === 'cinematic' ? 16 : 9
        },
        ssrTrace: {
          projectionMatrix,
          inverseProjectionMatrix,
          intensity: this.settings.preset === 'Reflective Night' ? 1.8 : 1.35,
          maxDistance: this.settings.shadowQuality === 'low' ? 55 : 95,
          thickness: this.settings.shadowQuality === 'cinematic' ? 0.48 : 0.72,
          sampleCount:
            this.settings.shadowQuality === 'low'
              ? 20
              : this.settings.shadowQuality === 'cinematic'
                ? 56
                : 36
        },
        ssrComposite: {debugMode: this.settings.debugView === 'Reflections' ? 1 : 0},
        volumetricFog: {
          density: this.settings.preset === 'Foggy Depth' ? 0.2 : 0.08,
          historyWeight: this.settings.shadowQuality === 'low' ? 0.08 : 0.18,
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
    this.shadowCasters.destroy();
    this.shadowRenderer.destroy();
    this.city.destroy();
    this.renderer.destroy();
    this.sceneGBuffer.destroy();
  }

  private createRenderer(): ShaderPassRenderer {
    const scale = SHADOW_QUALITY_SCALE[this.settings.shadowQuality];
    const pipelines: ShaderPassPipeline[] = [];
    const shadowDebugView = isShadowDebugView(this.settings.debugView);
    if (this.settings.contactShadowsEnabled) {
      pipelines.push(createContactShadowShaderPassPipeline({quality: this.settings.shadowQuality}));
    }
    if (!shadowDebugView && this.settings.ssaoEnabled) {
      pipelines.push(
        createSSAOShaderPassPipeline({normalSource: 'normal-texture', resolutionScale: scale})
      );
    }
    if (!shadowDebugView && this.settings.depthBlurEnabled) {
      pipelines.push(depthAwareBlurShaderPassPipeline);
    }
    if (!shadowDebugView && this.settings.ssrEnabled) {
      pipelines.push(createSSRShaderPassPipeline({resolutionScale: scale}));
    }
    if (!shadowDebugView && this.settings.fogEnabled) {
      pipelines.push(createVolumetricFogShaderPassPipeline());
    }
    if (!shadowDebugView && this.settings.outlinesEnabled) {
      pipelines.push(createOutlineShaderPassPipeline({normalSource: 'normal-texture'}));
    }
    if (!shadowDebugView && this.settings.taaEnabled) {
      pipelines.push(createTAAShaderPassPipeline());
    }
    if (!shadowDebugView && this.settings.motionBlurEnabled) {
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
          html: '<p><b>Hybrid shadows + screen-space rendering</b></p><p>Drag the divider to compare the unshadowed city with cascaded sun, spot, point, and contact shadows followed by SSAO, SSR, fog, outlines, TAA, and motion blur.</p>'
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
    this.shadowRenderer.setProps({quality: this.settings.shadowQuality});
    this.rebuildRenderer();
  };
}

function createSceneGBuffer(device: Device, width: number, height: number): GBuffer {
  return new GBuffer(device, {
    id: 'advanced-effects-scene',
    width,
    height,
    colorFormat: 'rgba8unorm',
    normalRoughnessFormat: 'rgba8unorm',
    velocityFormat: 'rg16float',
    depthStencilFormat: 'depth24plus',
    extraColorAttachments: [
      {name: 'unshadowedColor', format: 'rgba8unorm'},
      {name: 'directionalDirect', format: 'rgba16float'},
      {name: 'shadowDebug', format: 'rgba16float'}
    ]
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
    case 'Directional':
      return 4;
    case 'Cascades':
      return 5;
    case 'Spot':
      return 6;
    case 'Point':
      return 7;
    case 'Contact':
    case 'Combined':
      return 8;
    default:
      return 0;
  }
}

function isShadowDebugView(debugView: DebugView): boolean {
  return ['Directional', 'Cascades', 'Spot', 'Point', 'Contact', 'Combined'].includes(debugView);
}

function normalize3(vector: NumberArray3): NumberArray3 {
  const length = Math.hypot(vector[0], vector[1], vector[2]);
  return [vector[0] / length, vector[1] / length, vector[2] / length];
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
            name: 'shadowQuality',
            label: 'Shadow Quality',
            type: 'select',
            persist: 'none',
            options: Object.keys(SHADOW_QUALITY_SCALE)
          },
          {
            name: 'debugView',
            label: 'Debug View',
            type: 'select',
            persist: 'none',
            options: [
              'Final',
              'Depth',
              'Normals',
              'Velocity',
              'AO',
              'Reflections',
              'Directional',
              'Cascades',
              'Spot',
              'Point',
              'Contact',
              'Combined'
            ]
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
        id: 'shadows',
        name: 'Hybrid Shadows',
        initiallyCollapsed: false,
        settings: [
          toggle('directionalShadowsEnabled', 'Directional Cascades'),
          toggle('spotShadowsEnabled', 'Moving Spotlight'),
          toggle('pointShadowsEnabled', 'Neon Point Light'),
          toggle('contactShadowsEnabled', 'Contact Refinement')
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
