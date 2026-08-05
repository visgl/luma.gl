// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device, Framebuffer, TextureFormatColor} from '@luma.gl/core';
import {bloom, createBloomShaderPassPipeline, toneMapping} from '@luma.gl/effects';
import {
  AnimationLoopTemplate,
  type AnimationProps,
  ClipSpace,
  ShaderInputs,
  ShaderPassRenderer
} from '@luma.gl/engine';
import type {ShaderModule, ShaderPass, ShaderPassPipeline} from '@luma.gl/shadertools';
import {type Panel, type SettingsSchema, type SettingsState} from '@deck.gl-community/panels';
import {
  ExamplePanelManager,
  ExampleSettingsPanelManager,
  makeExamplePanelHostHtml,
  makeExampleTabbedPanel,
  makeHtmlCustomPanel
} from '../../example-panels';

export const title = 'Bloom';
export const description = 'Compare compact and HDR multiscale bloom on an animated HDR scene.';

const BLOOM_TECHNIQUES = ['Multiscale HDR', 'Compact', 'Off'] as const;

type BloomTechnique = (typeof BLOOM_TECHNIQUES)[number];
type BloomSettings = {
  technique: BloomTechnique;
  threshold: number;
  intensity: number;
  radius: number;
  animate: boolean;
};
type SceneUniforms = {
  time: number;
  aspect: number;
};
type ShaderPassLike = ShaderPass | ShaderPassPipeline;

const DEFAULT_SETTINGS: BloomSettings = {
  technique: 'Multiscale HDR',
  threshold: 0.8,
  intensity: 1.35,
  radius: 12,
  animate: true
};

const BLOOM_BACKGROUND_HTML = `
<p><b>Multiscale HDR bloom:</b> bright scene radiance is extracted once, blurred across half, quarter, and eighth-resolution targets, then composited before presentation. This is the reusable pipeline intended for richer effects integrations.</p>
<p><b>Compact bloom:</b> the legacy single-pass glow samples one small neighborhood directly from the source image. It is cheaper, but it cannot spread highlights as naturally as the multiscale pyramid.</p>
<p><b>Scene setup:</b> this page renders animated HDR emitters into an offscreen texture before bloom. The previous static image hid the useful part of the effect by baking most of the lighting into SDR pixels.</p>
`;

const sceneShaderModule = {
  name: 'scene',
  uniformTypes: {
    time: 'f32',
    aspect: 'f32'
  }
} as const satisfies ShaderModule<SceneUniforms>;

const SCENE_WGSL = /* wgsl */ `\
struct SceneUniforms {
  time: f32,
  aspect: f32,
};

@group(0) @binding(auto) var<uniform> sceneUniforms: SceneUniforms;

fn saturate(value: f32) -> f32 {
  return clamp(value, 0.0, 1.0);
}

fn rotate(position: vec2f, angle: f32) -> vec2f {
  let cosine = cos(angle);
  let sine = sin(angle);
  return vec2f(
    position.x * cosine - position.y * sine,
    position.x * sine + position.y * cosine
  );
}

fn hash(position: vec2f) -> f32 {
  return fract(sin(dot(position, vec2f(127.1, 311.7))) * 43758.5453123);
}

fn makeStar(position: vec2f) -> f32 {
  let starPosition = position * vec2f(32.0, 24.0);
  let starCell = floor(starPosition);
  let starOffset = fract(starPosition) - vec2f(0.5);
  let starValue = hash(starCell);
  let starRadius = mix(0.018, 0.055, hash(starCell + vec2f(19.0, 7.0)));
  let star = 1.0 - smoothstep(starRadius * 0.2, starRadius, length(starOffset));
  return select(0.0, star * mix(0.32, 1.5, starValue), starValue > 0.94);
}

fn makeEmitter(
  position: vec2f,
  center: vec2f,
  radius: f32,
  color: vec3f,
  radiance: f32
) -> vec3f {
  let distance = length(position - center);
  let core = exp(-distance * distance / max(radius * radius, 0.00001));
  let halo = exp(-distance * distance / max(radius * radius * 18.0, 0.00001));
  return color * (core * radiance + halo * radiance * 0.11);
}

fn makeRing(position: vec2f, center: vec2f, radius: f32, width: f32) -> f32 {
  let distance = abs(length(position - center) - radius);
  return exp(-distance / max(width, 0.00001));
}

fn makeRibbon(position: vec2f, phase: f32, slope: f32) -> f32 {
  let wave = sin(position.x * 4.8 + phase) * 0.12 + sin(position.x * 11.5 - phase * 0.7) * 0.028;
  let distance = abs(position.y - wave - slope * position.x);
  return exp(-distance * 95.0);
}

fn makeSceneColor(position: vec2f) -> vec3f {
  let time = sceneUniforms.time;
  let warpedPosition = rotate(position, sin(time * 0.19) * 0.08);
  let vignette = saturate(1.0 - dot(warpedPosition, warpedPosition) * 0.34);
  let star = makeStar(warpedPosition + vec2f(time * 0.012, 0.0));
  let background = mix(
    vec3f(0.006, 0.008, 0.018),
    vec3f(0.026, 0.038, 0.092),
    saturate(position.y * 0.5 + 0.5)
  );
  var color = background * (0.58 + vignette * 0.42) + vec3f(star);

  let emitterA = vec2f(sin(time * 0.72) * 0.62, cos(time * 0.53) * 0.24);
  let emitterB = vec2f(cos(time * 0.47 + 1.2) * 0.78, sin(time * 0.64) * 0.34);
  let emitterC = vec2f(sin(time * 0.31 + 2.4) * 0.32, cos(time * 0.88 + 0.7) * 0.48);

  color += makeEmitter(warpedPosition, emitterA, 0.045, vec3f(0.22, 0.84, 1.0), 13.0);
  color += makeEmitter(warpedPosition, emitterB, 0.055, vec3f(1.0, 0.36, 0.12), 10.5);
  color += makeEmitter(warpedPosition, emitterC, 0.038, vec3f(0.95, 0.92, 0.72), 16.0);

  let orbitalCenter = vec2f(0.0, 0.04);
  let coolRing = makeRing(warpedPosition, orbitalCenter, 0.42 + sin(time * 0.44) * 0.025, 0.016);
  let warmRing = makeRing(warpedPosition, orbitalCenter, 0.72 + cos(time * 0.36) * 0.035, 0.022);
  color += vec3f(0.12, 0.76, 1.0) * coolRing * 4.0;
  color += vec3f(1.0, 0.44, 0.12) * warmRing * 3.4;

  let ribbonPosition = rotate(warpedPosition, -0.26);
  let coolRibbon = makeRibbon(ribbonPosition, time * 1.4, -0.06);
  let warmRibbon = makeRibbon(rotate(warpedPosition, 0.34), -time * 1.1, 0.08);
  color += vec3f(0.18, 0.72, 1.0) * coolRibbon * 2.8;
  color += vec3f(1.0, 0.32, 0.08) * warmRibbon * 2.2;

  let floorCoordinate = position.y + 0.78;
  let gridFade = exp(-abs(floorCoordinate) * 7.0);
  let gridLine = exp(-abs(fract((position.x + time * 0.05) * 8.0) - 0.5) * 42.0);
  color += vec3f(0.08, 0.22, 0.42) * gridFade * (0.12 + gridLine * 0.52);

  return color;
}

@fragment
fn fragmentMain(inputs: FragmentInputs) -> @location(0) vec4f {
  let position = vec2f(inputs.position.x * sceneUniforms.aspect, inputs.position.y);
  return vec4f(makeSceneColor(position), 1.0);
}
`;

const SCENE_FRAGMENT_SHADER = /* glsl */ `\
#version 300 es
precision highp float;

uniform sceneUniforms {
  float time;
  float aspect;
} scene;

in vec2 position;
out vec4 fragColor;

float saturate(float value) {
  return clamp(value, 0.0, 1.0);
}

vec2 rotatePosition(vec2 positionValue, float angle) {
  float cosine = cos(angle);
  float sine = sin(angle);
  return vec2(
    positionValue.x * cosine - positionValue.y * sine,
    positionValue.x * sine + positionValue.y * cosine
  );
}

float hash(vec2 positionValue) {
  return fract(sin(dot(positionValue, vec2(127.1, 311.7))) * 43758.5453123);
}

float makeStar(vec2 positionValue) {
  vec2 starPosition = positionValue * vec2(32.0, 24.0);
  vec2 starCell = floor(starPosition);
  vec2 starOffset = fract(starPosition) - vec2(0.5);
  float starValue = hash(starCell);
  float starRadius = mix(0.018, 0.055, hash(starCell + vec2(19.0, 7.0)));
  float star = 1.0 - smoothstep(starRadius * 0.2, starRadius, length(starOffset));
  return starValue > 0.94 ? star * mix(0.32, 1.5, starValue) : 0.0;
}

vec3 makeEmitter(
  vec2 positionValue,
  vec2 center,
  float radius,
  vec3 color,
  float radiance
) {
  float distance = length(positionValue - center);
  float core = exp(-distance * distance / max(radius * radius, 0.00001));
  float halo = exp(-distance * distance / max(radius * radius * 18.0, 0.00001));
  return color * (core * radiance + halo * radiance * 0.11);
}

float makeRing(vec2 positionValue, vec2 center, float radius, float width) {
  float distance = abs(length(positionValue - center) - radius);
  return exp(-distance / max(width, 0.00001));
}

float makeRibbon(vec2 positionValue, float phase, float slope) {
  float wave = sin(positionValue.x * 4.8 + phase) * 0.12 +
    sin(positionValue.x * 11.5 - phase * 0.7) * 0.028;
  float distance = abs(positionValue.y - wave - slope * positionValue.x);
  return exp(-distance * 95.0);
}

vec3 makeSceneColor(vec2 positionValue) {
  float time = scene.time;
  vec2 warpedPosition = rotatePosition(positionValue, sin(time * 0.19) * 0.08);
  float vignette = saturate(1.0 - dot(warpedPosition, warpedPosition) * 0.34);
  float star = makeStar(warpedPosition + vec2(time * 0.012, 0.0));
  vec3 background = mix(
    vec3(0.006, 0.008, 0.018),
    vec3(0.026, 0.038, 0.092),
    saturate(positionValue.y * 0.5 + 0.5)
  );
  vec3 color = background * (0.58 + vignette * 0.42) + vec3(star);

  vec2 emitterA = vec2(sin(time * 0.72) * 0.62, cos(time * 0.53) * 0.24);
  vec2 emitterB = vec2(cos(time * 0.47 + 1.2) * 0.78, sin(time * 0.64) * 0.34);
  vec2 emitterC = vec2(sin(time * 0.31 + 2.4) * 0.32, cos(time * 0.88 + 0.7) * 0.48);

  color += makeEmitter(warpedPosition, emitterA, 0.045, vec3(0.22, 0.84, 1.0), 13.0);
  color += makeEmitter(warpedPosition, emitterB, 0.055, vec3(1.0, 0.36, 0.12), 10.5);
  color += makeEmitter(warpedPosition, emitterC, 0.038, vec3(0.95, 0.92, 0.72), 16.0);

  vec2 orbitalCenter = vec2(0.0, 0.04);
  float coolRing = makeRing(warpedPosition, orbitalCenter, 0.42 + sin(time * 0.44) * 0.025, 0.016);
  float warmRing = makeRing(warpedPosition, orbitalCenter, 0.72 + cos(time * 0.36) * 0.035, 0.022);
  color += vec3(0.12, 0.76, 1.0) * coolRing * 4.0;
  color += vec3(1.0, 0.44, 0.12) * warmRing * 3.4;

  vec2 ribbonPosition = rotatePosition(warpedPosition, -0.26);
  float coolRibbon = makeRibbon(ribbonPosition, time * 1.4, -0.06);
  float warmRibbon = makeRibbon(rotatePosition(warpedPosition, 0.34), -time * 1.1, 0.08);
  color += vec3(0.18, 0.72, 1.0) * coolRibbon * 2.8;
  color += vec3(1.0, 0.32, 0.08) * warmRibbon * 2.2;

  float floorCoordinate = positionValue.y + 0.78;
  float gridFade = exp(-abs(floorCoordinate) * 7.0);
  float gridLine = exp(-abs(fract((positionValue.x + time * 0.05) * 8.0) - 0.5) * 42.0);
  color += vec3(0.08, 0.22, 0.42) * gridFade * (0.12 + gridLine * 0.52);

  return color;
}

void main(void) {
  vec2 scenePosition = vec2(position.x * scene.aspect, position.y);
  fragColor = vec4(makeSceneColor(scenePosition), 1.0);
}
`;

export default class AppAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = makeExamplePanelHostHtml();

  readonly device: Device;
  readonly colorFormat: TextureFormatColor;
  readonly sceneShaderInputs = new ShaderInputs<{scene: SceneUniforms}>({
    scene: sceneShaderModule
  });
  readonly sceneModel: ClipSpace;
  readonly sceneFramebuffer: Framebuffer;
  readonly settingsPanel: ExampleSettingsPanelManager;
  readonly panels: ExamplePanelManager;
  settings: BloomSettings = {...DEFAULT_SETTINGS};
  shaderPassRenderer!: ShaderPassRenderer;

  constructor({device, width, height}: AnimationProps) {
    super();

    this.device = device;
    this.colorFormat = getHighDynamicRangeColorFormat(device);
    this.sceneModel = new ClipSpace(device, {
      id: 'bloom-hdr-scene',
      source: SCENE_WGSL,
      fs: SCENE_FRAGMENT_SHADER,
      colorAttachmentFormats: [this.colorFormat],
      shaderInputs: this.sceneShaderInputs
    });
    this.sceneFramebuffer = device.createFramebuffer({
      id: 'bloom-hdr-scene-framebuffer',
      width,
      height,
      colorAttachments: [this.colorFormat]
    });
    this.settingsPanel = new ExampleSettingsPanelManager({
      id: 'bloom-settings',
      schema: makeBloomSettingsSchema(),
      settings: makeBloomSettingsState(this.settings),
      onSettingsChange: this.handleSettingsChange
    });
    this.panels = new ExamplePanelManager({panel: this.makePanel()});
    this.panels.mount();
    this.setShaderPasses(this.getShaderPasses());
  }

  onFinalize(): void {
    this.settingsPanel.finalize();
    this.panels.finalize();
    this.sceneFramebuffer.destroy();
    this.sceneModel.destroy();
    this.sceneShaderInputs.destroy();
    this.shaderPassRenderer?.destroy();
  }

  onRender({device, width, height, time}: AnimationProps): void {
    this.sceneFramebuffer.resize({width, height});
    this.shaderPassRenderer.resize([width, height]);
    this.sceneShaderInputs.setProps({
      scene: {
        time: this.settings.animate ? time / 1000 : 0,
        aspect: width / Math.max(height, 1)
      }
    });
    this.sceneModel.predraw(device.commandEncoder);

    const sceneRenderPass = device.beginRenderPass({
      framebuffer: this.sceneFramebuffer,
      clearColor: [0, 0, 0, 1],
      clearDepth: false
    });
    this.sceneModel.draw(sceneRenderPass);
    sceneRenderPass.end();

    this.shaderPassRenderer.renderToScreen({
      sourceTexture: this.sceneFramebuffer.colorAttachments[0].texture,
      uniforms: this.getRenderUniforms()
    });
  }

  setShaderPasses(shaderPasses: ShaderPassLike[]): void {
    this.shaderPassRenderer?.destroy();
    this.shaderPassRenderer = new ShaderPassRenderer(this.device, {
      shaderPasses,
      colorFormat: this.colorFormat
    });
  }

  getShaderPasses(): ShaderPassLike[] {
    const shaderPasses: ShaderPassLike[] = [];
    if (this.settings.technique === 'Multiscale HDR') {
      shaderPasses.push(
        createBloomShaderPassPipeline({
          colorFormat: this.colorFormat,
          threshold: this.settings.threshold,
          intensity: this.settings.intensity,
          radius: this.settings.radius
        })
      );
    } else if (this.settings.technique === 'Compact') {
      shaderPasses.push(bloom);
    }
    if (this.colorFormat === 'rgba16float' && this.device.preferredColorFormat !== 'rgba16float') {
      shaderPasses.push(toneMapping);
    }
    return shaderPasses;
  }

  getRenderUniforms(): Record<string, Record<string, unknown>> | undefined {
    if (this.settings.technique !== 'Compact') {
      return undefined;
    }
    return {
      bloom: {
        threshold: this.settings.threshold,
        intensity: this.settings.intensity,
        radius: this.settings.radius
      }
    };
  }

  private makePanel(): Panel {
    return makeExampleTabbedPanel({
      id: 'bloom-tabs',
      title: 'Effects: Bloom',
      theme: 'dark',
      panels: [
        makeHtmlCustomPanel({
          id: 'bloom-description',
          title: 'Overview',
          html: this.makeOverviewHtml()
        }),
        this.settingsPanel.makePanel(),
        makeHtmlCustomPanel({
          id: 'bloom-background',
          title: 'Background',
          html: BLOOM_BACKGROUND_HTML
        })
      ]
    });
  }

  private readonly handleSettingsChange = (settings: SettingsState): void => {
    this.settings = {
      technique: isBloomTechnique(settings['technique'])
        ? settings['technique']
        : this.settings.technique,
      threshold:
        typeof settings['threshold'] === 'number'
          ? clampNumber(settings['threshold'], 0, 4)
          : this.settings.threshold,
      intensity:
        typeof settings['intensity'] === 'number'
          ? clampNumber(settings['intensity'], 0, 4)
          : this.settings.intensity,
      radius:
        typeof settings['radius'] === 'number'
          ? clampNumber(settings['radius'], 0, 24)
          : this.settings.radius,
      animate:
        typeof settings['animate'] === 'boolean' ? settings['animate'] : this.settings.animate
    };
    this.setShaderPasses(this.getShaderPasses());
    this.panels.setPanel(this.makePanel());
  };

  private makeOverviewHtml(): string {
    const processingDescription =
      this.colorFormat === 'rgba16float'
        ? 'The scene and multiscale intermediates use floating-point render targets, preserving radiance above SDR white.'
        : 'This device cannot filter floating-point render targets, so the scene falls back to its preferred color format.';
    const presentationDescription =
      this.device.preferredColorFormat === 'rgba16float'
        ? 'The HDR canvas presents extended highlights directly.'
        : this.colorFormat === 'rgba16float'
          ? 'ACES tone mapping compresses the HDR result for SDR presentation.'
          : 'The final result uses standard dynamic-range presentation.';
    const techniqueDescription =
      this.settings.technique === 'Multiscale HDR'
        ? 'Multiscale HDR is the default because it is the reusable public pipeline with smoother wide-radius glow.'
        : this.settings.technique === 'Compact'
          ? 'Compact mode shows the older single-pass effect for direct comparison.'
          : 'Bloom is off so the underlying HDR emitters stay visible without postprocessing.';
    return `<p>${techniqueDescription}</p><p>${processingDescription}</p><p>${presentationDescription}</p>`;
  }
}

function getHighDynamicRangeColorFormat(device: Device): TextureFormatColor {
  const capabilities = device.getTextureFormatCapabilities('rgba16float');
  return capabilities.render && capabilities.filter ? 'rgba16float' : device.preferredColorFormat;
}

export function makeBloomSettingsSchema(): SettingsSchema {
  return {
    title: 'Settings',
    sections: [
      {
        id: 'bloom',
        name: 'Bloom',
        initiallyCollapsed: false,
        settings: [
          {
            name: 'technique',
            label: 'Technique',
            type: 'select',
            persist: 'none',
            options: [
              {
                label: 'Multiscale HDR',
                value: 'Multiscale HDR',
                description: 'Recommended reusable pipeline for broad, smooth glow.'
              },
              {
                label: 'Compact',
                value: 'Compact',
                description: 'Legacy single-pass highlight glow for comparison.'
              },
              {
                label: 'Off',
                value: 'Off',
                description: 'Render the animated HDR scene without bloom.'
              }
            ]
          },
          {
            name: 'threshold',
            label: 'Highlight Threshold',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 4,
            step: 0.05
          },
          {
            name: 'intensity',
            label: 'Glow Intensity',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 4,
            step: 0.05
          },
          {
            name: 'radius',
            label: 'Blur Radius',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 24,
            step: 1
          },
          {
            name: 'animate',
            label: 'Animate Scene',
            type: 'boolean',
            persist: 'none'
          }
        ]
      }
    ]
  };
}

function makeBloomSettingsState(settings: BloomSettings): SettingsState {
  return {...settings};
}

function isBloomTechnique(value: unknown): value is BloomTechnique {
  return BLOOM_TECHNIQUES.includes(value as BloomTechnique);
}

function clampNumber(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}
