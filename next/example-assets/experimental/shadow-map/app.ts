// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Buffer, Device} from '@luma.gl/core';
import type {AnimationProps} from '@luma.gl/engine';
import {AnimationLoopTemplate, CubeGeometry, Model, ShaderInputs} from '@luma.gl/engine';
import {
  shadow,
  ShadowMapRenderer,
  type DirectionalShadowLight,
  type ShadowRenderView,
  type ShadowShaderProps
} from '@luma.gl/experimental';
import type {ShaderModule} from '@luma.gl/shadertools';
import {Matrix4, radians, type NumberArray3} from '@math.gl/core';
import {type Panel, type SettingsSchema} from '@deck.gl-community/panels';
import {
  ExamplePanelManager,
  ExampleSettingsPanelManager,
  makeExamplePanelHostHtml,
  makeHtmlCustomPanel,
  makeExampleTabbedPanel
} from '../../example-panels';
import {OrbitController} from '../../orbit-controller';

const NEAR_PLANE = 0.1;
const FAR_PLANE = 150;
const DIRECTIONAL_VIEW_COUNT = 4;
const INSTANCE_COMPONENTS = 3;
const SHADOW_QUALITIES = ['low', 'balanced', 'cinematic'] as const;
const DEBUG_VIEWS = ['Beauty', 'Visibility', 'Cascades'] as const;

type ShadowQuality = (typeof SHADOW_QUALITIES)[number];
type DebugView = (typeof DEBUG_VIEWS)[number];

type ShadowMapSettings = {
  quality: ShadowQuality;
  debugView: DebugView;
  sourceAngularRadius: number;
  animateSun: boolean;
  autoOrbitCamera: boolean;
};

type SceneUniforms = {
  viewProjectionMatrix: Matrix4;
  viewMatrix: Matrix4;
  sunDirection: NumberArray3;
  debugMode: number;
};

type ShadowCasterUniforms = {
  viewProjectionMatrix: Matrix4;
};

type SceneBuffers = {
  positions: Buffer;
  scales: Buffer;
  colors: Buffer;
};

const DEFAULT_SETTINGS: ShadowMapSettings = {
  quality: 'balanced',
  debugView: 'Beauty',
  sourceAngularRadius: 0.012,
  animateSun: true,
  autoOrbitCamera: true
};

const PCSS_BACKGROUND_HTML = `
<p><b>PCSS (Percentage-Closer Soft Shadows)</b> is a real-time shadow-map filtering technique that models a light source with area instead of treating it as a perfect point.</p>
<p><b>Why it looks natural:</b> a caster close to its receiver makes a crisp shadow. As the separation grows, the penumbra widens and softens. PCSS estimates that relationship per shaded point instead of applying one uniform blur everywhere.</p>
<p><b>How it works:</b></p>
<ol>
  <li><b>Blocker search:</b> sample the shadow map around the receiver to find occluders between the light and the surface, then estimate their average depth.</li>
  <li><b>Variable filtering:</b> use the blocker-to-receiver separation and apparent light size to choose a filtering radius. Nearby blockers get a tight kernel; distant blockers get a wider one.</li>
</ol>
<p><b>Compared with PCF (Percentage-Closer Filtering):</b> ordinary PCF usually filters with a fixed-size kernel. PCSS adds the blocker search so softness changes across the shadow, producing widening penumbrae while still smoothing aliasing.</p>
`;

const sceneUniforms: ShaderModule<SceneUniforms> = {
  name: 'shadowMapScene',
  uniformTypes: {
    viewProjectionMatrix: 'mat4x4<f32>',
    viewMatrix: 'mat4x4<f32>',
    sunDirection: 'vec3<f32>',
    debugMode: 'f32'
  }
};

const shadowCasterUniforms: ShaderModule<ShadowCasterUniforms> = {
  name: 'shadowMapCaster',
  uniformTypes: {viewProjectionMatrix: 'mat4x4<f32>'}
};

const SCENE_SHADER = /* wgsl */ `
struct ShadowMapSceneUniforms {
  viewProjectionMatrix: mat4x4f,
  viewMatrix: mat4x4f,
  sunDirection: vec3f,
  debugMode: f32,
};
@group(0) @binding(auto) var<uniform> shadowMapScene: ShadowMapSceneUniforms;

struct VertexInputs {
  @location(0) positions: vec3f,
  @location(1) normals: vec3f,
  @location(2) instancePositions: vec3f,
  @location(3) instanceScales: vec3f,
  @location(4) instanceColors: vec4f,
};

struct FragmentInputs {
  @builtin(position) position: vec4f,
  @location(0) worldPosition: vec3f,
  @location(1) worldNormal: vec3f,
  @location(2) viewPosition: vec3f,
  @location(3) color: vec3f,
};

@vertex
fn vertexMain(inputs: VertexInputs) -> FragmentInputs {
  let worldPosition = inputs.positions * inputs.instanceScales + inputs.instancePositions;
  var output: FragmentInputs;
  output.position = shadowMapScene.viewProjectionMatrix * vec4f(worldPosition, 1.0);
  output.worldPosition = worldPosition;
  output.worldNormal = normalize(inputs.normals);
  output.viewPosition = (shadowMapScene.viewMatrix * vec4f(worldPosition, 1.0)).xyz;
  output.color = inputs.instanceColors.rgb;
  return output;
}

@fragment
fn fragmentMain(inputs: FragmentInputs) -> @location(0) vec4f {
  let worldNormal = normalize(inputs.worldNormal);
  let viewDepth = -inputs.viewPosition.z;
  let visibility = shadow_getDirectionalFactor(inputs.worldPosition, worldNormal, viewDepth);
  if (shadowMapScene.debugMode > 0.5 && shadowMapScene.debugMode < 1.5) {
    return vec4f(vec3f(visibility), 1.0);
  }
  if (shadowMapScene.debugMode > 1.5) {
    let colors = array<vec3f, 4>(
      vec3f(0.16, 0.54, 1.0),
      vec3f(0.18, 0.86, 0.42),
      vec3f(1.0, 0.67, 0.12),
      vec3f(1.0, 0.22, 0.33)
    );
    let cascadeIndex = clamp(shadow_getDirectionalCascadeIndex(viewDepth), 0, 3);
    return vec4f(colors[cascadeIndex] * (0.32 + visibility * 0.68), 1.0);
  }

  let diffuse = max(dot(worldNormal, normalize(shadowMapScene.sunDirection)), 0.0);
  let hemi = 0.07 + 0.09 * max(worldNormal.y, 0.0);
  let direct = diffuse * visibility * 1.4;
  let color = inputs.color * (hemi + direct);
  let skyFill = vec3f(0.08, 0.11, 0.16) * max(worldNormal.y, 0.0);
  let gammaCorrected = pow(color + skyFill, vec3f(1.0 / 2.2));
  return vec4f(gammaCorrected, 1.0);
}
`;

const SHADOW_CASTER_SHADER = /* wgsl */ `
struct ShadowMapCasterUniforms {
  viewProjectionMatrix: mat4x4f,
};
@group(0) @binding(auto) var<uniform> shadowMapCaster: ShadowMapCasterUniforms;

struct VertexInputs {
  @location(0) positions: vec3f,
  @location(1) instancePositions: vec3f,
  @location(2) instanceScales: vec3f,
};

@vertex
fn vertexMain(inputs: VertexInputs) -> @builtin(position) vec4f {
  let worldPosition = inputs.positions * inputs.instanceScales + inputs.instancePositions;
  return shadowMapCaster.viewProjectionMatrix * vec4f(worldPosition, 1.0);
}

@fragment
fn fragmentMain() {}
`;

/** One instanced scene keeps the quality comparison focused on shadow-map behavior. */
class ShadowMapScene {
  readonly model: Model;
  readonly buffers: SceneBuffers;
  readonly instanceCount: number;

  constructor(device: Device) {
    const instances = makeSceneInstances();
    this.buffers = {
      positions: device.createBuffer(instances.positions),
      scales: device.createBuffer(instances.scales),
      colors: device.createBuffer(instances.colors)
    };
    this.instanceCount = instances.instanceCount;
    this.model = new Model(device, {
      id: 'shadow-map-quality-scene',
      source: SCENE_SHADER,
      geometry: new CubeGeometry({indices: true}),
      instanceCount: instances.instanceCount,
      modules: [shadow],
      shaderInputs: new ShaderInputs({shadowMapScene: sceneUniforms, shadow}),
      bufferLayout: [
        {name: 'instancePositions', format: 'float32x3'},
        {name: 'instanceScales', format: 'float32x3'},
        {name: 'instanceColors', format: 'unorm8x4'}
      ],
      attributes: {
        instancePositions: this.buffers.positions,
        instanceScales: this.buffers.scales,
        instanceColors: this.buffers.colors
      },
      parameters: {depthWriteEnabled: true, depthCompare: 'less-equal', cullMode: 'back'}
    });
  }

  setSceneUniforms(uniforms: SceneUniforms): void {
    this.model.shaderInputs.setProps({shadowMapScene: uniforms});
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

/**
 * Each recorded cascade needs independent uniform storage until command submission.
 * The scene buffers are borrowed from the visible model.
 */
class ShadowMapCasterModels {
  readonly models: Model[];

  constructor(device: Device, buffers: SceneBuffers, instanceCount: number) {
    this.models = Array.from({length: DIRECTIONAL_VIEW_COUNT}, (_, viewIndex) => {
      return new Model(device, {
        id: 'shadow-map-quality-caster-' + viewIndex,
        source: SHADOW_CASTER_SHADER,
        geometry: new CubeGeometry({indices: true}),
        instanceCount,
        shaderInputs: new ShaderInputs({shadowMapCaster: shadowCasterUniforms}),
        bufferLayout: [
          {name: 'instancePositions', format: 'float32x3'},
          {name: 'instanceScales', format: 'float32x3'}
        ],
        attributes: {
          instancePositions: buffers.positions,
          instanceScales: buffers.scales
        },
        colorAttachmentFormats: [],
        depthStencilAttachmentFormat: 'depth32float',
        parameters: {depthWriteEnabled: true, depthCompare: 'less-equal', cullMode: 'back'}
      });
    });
  }

  draw(view: ShadowRenderView): void {
    const model = this.models[view.cascadeIndex || 0];
    model.shaderInputs.setProps({
      shadowMapCaster: {viewProjectionMatrix: view.viewProjectionMatrix as Matrix4}
    });
    model.setParameters(view.rasterParameters);
    model.draw(view.renderPass);
  }

  destroy(): void {
    for (const model of this.models) {
      model.destroy();
    }
  }
}

/** WebGPU-only study scene for directional shadow-map resolution, filtering, and cascades. */
export default class AppAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = makeExamplePanelHostHtml();

  readonly scene: ShadowMapScene;
  readonly shadowRenderer: ShadowMapRenderer;
  readonly shadowCasters: ShadowMapCasterModels;
  readonly panels: ExamplePanelManager;
  readonly settingsPanel: ExampleSettingsPanelManager;
  orbitController: OrbitController | null = null;
  settings: ShadowMapSettings = {...DEFAULT_SETTINGS};

  constructor({device}: AnimationProps) {
    super();
    this.scene = new ShadowMapScene(device);
    this.shadowRenderer = new ShadowMapRenderer(device, {quality: this.settings.quality});
    this.shadowCasters = new ShadowMapCasterModels(
      device,
      this.scene.buffers,
      this.scene.instanceCount
    );
    this.settingsPanel = new ExampleSettingsPanelManager({
      id: 'shadow-map-quality-settings',
      schema: makeSettingsSchema(),
      settings: this.settings,
      onSettingsChange: this.handleSettingsChange
    });
    this.panels = new ExamplePanelManager({panel: this.makePanel()});
    this.panels.mount();
  }

  override async onInitialize({canvas}: AnimationProps): Promise<void> {
    if (canvas instanceof HTMLCanvasElement) {
      this.orbitController = new OrbitController(canvas, {
        target: [0, 1.8, 0],
        distance: 40.2,
        yaw: 0.75,
        pitch: 0.41,
        minDistance: 20,
        maxDistance: 80,
        minPitch: 0.08,
        maxPitch: 1.2,
        autoRotate: this.settings.autoOrbitCamera,
        autoRotateSpeed: 0.08
      });
    }
  }

  onRender({device, aspect, tick}: AnimationProps): void {
    const time = this.settings.animateSun ? tick / 1000 : 0.7;
    const sunDirection = normalize3([
      -0.48 + Math.sin(time * 0.7) * 0.35,
      0.78,
      -0.34 + Math.cos(time * 0.7) * 0.35
    ]);
    this.orbitController?.update(tick);
    const eye: NumberArray3 = this.orbitController?.getEyePosition() || [25, 18, 27];
    const projectionMatrix = new Matrix4().perspective({
      fovy: radians(45),
      aspect,
      near: NEAR_PLANE,
      far: FAR_PLANE
    });
    const viewMatrix = new Matrix4().lookAt({eye, center: [0, 1.8, 0], up: [0, 1, 0]});
    const viewProjectionMatrix = new Matrix4(projectionMatrix).multiplyRight(viewMatrix);
    const light: DirectionalShadowLight = {
      direction: sunDirection,
      shadowDistance: 100,
      casterDistance: 100,
      sourceAngularRadius: this.settings.sourceAngularRadius,
      cascadeSplitLambda: 0.62,
      cascadeBlendFraction: 0.12,
      farFadeFraction: 0.08,
      normalBias: 0.04,
      depthBias: 2,
      depthBiasSlopeScale: 2,
      strength: 1
    };
    const shadowProps = this.shadowRenderer.render({
      camera: {
        viewMatrix,
        projectionMatrix,
        near: NEAR_PLANE,
        far: FAR_PLANE
      },
      directionalLights: [light],
      drawShadowCasters: view => this.shadowCasters.draw(view)
    });
    this.scene.setShadowProps(shadowProps);
    this.scene.setSceneUniforms({
      viewProjectionMatrix,
      viewMatrix,
      sunDirection,
      debugMode: getDebugMode(this.settings.debugView)
    });

    const renderPass = device.beginRenderPass({
      clearColor: [0.02, 0.03, 0.05, 1],
      clearDepth: 1
    });
    this.scene.model.draw(renderPass);
    renderPass.end();
  }

  onFinalize(): void {
    this.settingsPanel.finalize();
    this.panels.finalize();
    this.orbitController?.destroy();
    this.shadowCasters.destroy();
    this.shadowRenderer.destroy();
    this.scene.destroy();
  }

  private makePanel(): Panel {
    return makeExampleTabbedPanel({
      id: 'shadow-map-quality-tabs',
      title: 'Effects: Shadow Map Quality',
      panels: [
        makeHtmlCustomPanel({
          id: 'shadow-map-quality-description',
          title: 'Overview',
          html: '<p><b>Directional PCSS (Percentage-Closer Soft Shadows) study</b></p><p>Compare map resolution and filtering on the thin fence, the long hero shadows, and the distant cascade bands. Drag to orbit and use the wheel or trackpad to zoom. Visibility removes material shading; Cascades colors the fitted light views.</p>'
        }),
        this.settingsPanel.makePanel(),
        makeHtmlCustomPanel({
          id: 'shadow-map-quality-background',
          title: 'Background',
          html: PCSS_BACKGROUND_HTML
        })
      ]
    });
  }

  private readonly handleSettingsChange = (nextSettings: Record<string, unknown>): void => {
    this.settings = {...this.settings, ...(nextSettings as ShadowMapSettings)};
    this.shadowRenderer.setProps({quality: this.settings.quality});
    this.orbitController?.setAutoRotate(this.settings.autoOrbitCamera);
  };
}

function makeSceneInstances(): {
  positions: Float32Array;
  scales: Float32Array;
  colors: Uint8Array;
  instanceCount: number;
} {
  const positions: number[] = [];
  const scales: number[] = [];
  const colors: number[] = [];
  const addInstance = (
    position: [number, number, number],
    scale: [number, number, number],
    color: [number, number, number, number]
  ) => {
    positions.push(...position);
    scales.push(...scale);
    colors.push(...color);
  };

  // A broad, neutral receiver makes filter noise and cascade transitions easy to see.
  addInstance([0, -1, 0], [42, 1, 42], [110, 114, 120, 255]);

  // Thin slats expose map resolution, blocker search, and PCSS filtering quality.
  for (let index = 0; index < 15; index++) {
    addInstance(
      [-9 + index * 1.25, 2.2, -7],
      [0.16, 4.4, 0.42],
      [244, 184 + (index % 3) * 15, 72, 255]
    );
  }
  addInstance([0, 4.7, -7], [19, 0.22, 0.5], [82, 102, 122, 255]);

  // Tall, differently sized casters create readable penumbra growth across the receiver.
  addInstance([-11, 4, 4], [3.8, 8, 3.8], [220, 96, 74, 255]);
  addInstance([-4, 2.5, 4.5], [2.6, 5, 2.6], [77, 154, 214, 255]);
  addInstance([3, 1.5, 5], [2.4, 3, 2.4], [88, 184, 134, 255]);
  addInstance([10, 3, 5.5], [3, 6, 3], [182, 116, 226, 255]);

  // A receding stair lane crosses cascade boundaries and shows their blend region.
  for (let index = 0; index < 9; index++) {
    const height = 0.5 + index * 0.32;
    addInstance(
      [12, height, -13 + index * 2.7],
      [4.2, height * 2, 1.7],
      [70 + index * 12, 118 + index * 8, 178 + index * 5, 255]
    );
  }

  // Small near-contact blocks make receiver bias and shadow attachment visible.
  for (let index = 0; index < 6; index++) {
    addInstance([-12 + index * 2.1, 0.35, 12], [1.2, 0.7, 1.2], [188, 200, 214, 255]);
  }

  return {
    positions: new Float32Array(positions),
    scales: new Float32Array(scales),
    colors: new Uint8Array(colors),
    instanceCount: positions.length / INSTANCE_COMPONENTS
  };
}

function makeSettingsSchema(): SettingsSchema {
  return {
    title: 'Controls',
    sections: [
      {
        id: 'quality',
        name: 'Quality',
        initiallyCollapsed: false,
        settings: [
          {
            name: 'quality',
            label: 'Preset',
            type: 'select',
            persist: 'none',
            options: [...SHADOW_QUALITIES]
          },
          {
            name: 'sourceAngularRadius',
            label: 'Sun Angular Radius',
            type: 'number',
            persist: 'none',
            min: 0.001,
            max: 0.03,
            step: 0.001
          },
          {
            name: 'debugView',
            label: 'View',
            type: 'select',
            persist: 'none',
            options: [...DEBUG_VIEWS]
          },
          {
            name: 'animateSun',
            label: 'Animate Sun',
            type: 'boolean',
            persist: 'none'
          },
          {
            name: 'autoOrbitCamera',
            label: 'Auto Orbit',
            type: 'boolean',
            persist: 'none'
          }
        ]
      }
    ]
  };
}

function getDebugMode(debugView: DebugView): number {
  switch (debugView) {
    case 'Visibility':
      return 1;
    case 'Cascades':
      return 2;
    default:
      return 0;
  }
}

function normalize3(vector: NumberArray3): NumberArray3 {
  const length = Math.hypot(vector[0], vector[1], vector[2]);
  return [vector[0] / length, vector[1] / length, vector[2] / length];
}
