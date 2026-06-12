// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {NumberArray, VariableShaderType} from '@luma.gl/core';
import {luma, UniformStore} from '@luma.gl/core';
import type {AnimationProps} from '@luma.gl/engine';
import {AnimationLoopTemplate, HTMLTexture, Model, PlaneGeometry} from '@luma.gl/engine';
import {Matrix4} from '@math.gl/core';
import {
  type Panel,
  type SettingsChangeDescriptor,
  type SettingsSchema
} from '@deck.gl-community/panels';
import {
  ExampleSettingsPanelManager,
  configurePanelHostElement,
  getChangedSetting,
  makeHtmlCustomPanel,
  renderExamplePanel
} from '../../example-panels';

export const title = 'HTML UI Prism';
export const description = 'Renders live panel-backed DOM surfaces on a rotating GPU prism.';

const FACE_TEXTURE_SIZE = 640;
const FACE_WORLD_SIZE = 2.9;
const PRISM_RADIUS = FACE_WORLD_SIZE * 0.5;
const PRISM_TILT = -0.18;
const QUARTER_TURN = Math.PI / 2;
const FACE_IDS = ['info', 'settings', 'stats', 'debug'] as const;

type PrismFaceId = (typeof FACE_IDS)[number];

type AppUniforms = {
  modelViewProjectionMatrix: NumberArray;
};

type PrismSettingsState = {
  activeFace: PrismFaceId;
  paused: boolean;
  rotationSpeed: number;
};

type PrismFace = {
  id: PrismFaceId;
  index: number;
  label: string;
  model: Model;
  panelHostElement: HTMLElement;
  panel: Panel;
  sourceElement: HTMLElement;
  texture: HTMLTexture;
  uniformStore: UniformStore<{app: AppUniforms}>;
  wrapperElement: HTMLElement;
};

const app = {
  uniformTypes: {
    modelViewProjectionMatrix: 'mat4x4<f32>'
  }
} satisfies {uniformTypes: Record<keyof AppUniforms, VariableShaderType>};

const WGSL_SHADER = /* wgsl */ `\
struct Uniforms {
  modelViewProjectionMatrix : mat4x4<f32>,
};

@group(0) @binding(auto) var<uniform> app : Uniforms;
@group(0) @binding(auto) var uHtmlTexture : texture_2d<f32>;
@group(0) @binding(auto) var uHtmlTextureSampler : sampler;

struct VertexInputs {
  @location(0) positions : vec4<f32>,
  @location(1) texCoords : vec2<f32>,
};

struct FragmentInputs {
  @builtin(position) Position : vec4<f32>,
  @location(0) fragUV : vec2<f32>,
};

@vertex
fn vertexMain(inputs: VertexInputs) -> FragmentInputs {
  var outputs : FragmentInputs;
  outputs.Position = app.modelViewProjectionMatrix * inputs.positions;
  outputs.fragUV = vec2<f32>(inputs.texCoords.x, 1.0 - inputs.texCoords.y);
  return outputs;
}

@fragment
fn fragmentMain(inputs: FragmentInputs) -> @location(0) vec4<f32> {
  let color = textureSample(uHtmlTexture, uHtmlTextureSampler, inputs.fragUV);
  let edge = min(min(inputs.fragUV.x, 1.0 - inputs.fragUV.x), min(inputs.fragUV.y, 1.0 - inputs.fragUV.y));
  let rim = smoothstep(0.0, 0.03, edge);
  return vec4<f32>(mix(vec3<f32>(0.05, 0.07, 0.10), color.rgb, rim), color.a);
}
`;

const VS_GLSL = /* glsl */ `\
#version 300 es

uniform appUniforms {
  mat4 modelViewProjectionMatrix;
} app;

layout(location=0) in vec3 positions;
layout(location=1) in vec2 texCoords;

out vec2 fragUV;

void main(void) {
  gl_Position = app.modelViewProjectionMatrix * vec4(positions, 1.0);
  fragUV = vec2(texCoords.x, 1.0 - texCoords.y);
}
`;

const FS_GLSL = /* glsl */ `\
#version 300 es
precision highp float;

uniform sampler2D uHtmlTexture;

in vec2 fragUV;
out vec4 fragColor;

void main(void) {
  vec4 color = texture(uHtmlTexture, fragUV);
  float edge = min(min(fragUV.x, 1.0 - fragUV.x), min(fragUV.y, 1.0 - fragUV.y));
  float rim = smoothstep(0.0, 0.03, edge);
  fragColor = vec4(mix(vec3(0.05, 0.07, 0.10), color.rgb, rim), color.a);
}
`;

export default class AppAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = `\
<p>
Experimental HTML-in-Canvas demo. In supporting browsers, each prism face is a live DOM panel copied into a GPU texture while remaining clickable.
</p>
`;

  private readonly faceGeometry = new PlaneGeometry({
    id: 'html-ui-prism-face',
    type: 'x,y',
    xlen: FACE_WORLD_SIZE,
    ylen: FACE_WORLD_SIZE
  });
  private readonly faceRotationById = new Map<PrismFaceId, number>(
    FACE_IDS.map((faceId, index) => [faceId, index * QUARTER_TURN])
  );
  private readonly faceIndexById = new Map<PrismFaceId, number>(
    FACE_IDS.map((faceId, index) => [faceId, index])
  );
  private readonly projectionMatrix = new Matrix4();
  private readonly viewMatrix = new Matrix4().lookAt({
    center: [0, 0, 0],
    eye: [0, 0, 6.2],
    up: [0, 1, 0]
  });
  private readonly settingsPanel: ExampleSettingsPanelManager;
  private readonly canvas: HTMLCanvasElement;
  private readonly supported: boolean;
  private activeFaceId: PrismFaceId = 'info';
  private dragPointerId: number | null = null;
  private dragStartRotationY = 0;
  private dragStartX = 0;
  private lastRenderTime = 0;
  private panelSceneElement: HTMLElement | null = null;
  private prismFaces: PrismFace[] = [];
  private rotationY = 0;
  private settingsState: PrismSettingsState = {
    activeFace: 'info',
    paused: false,
    rotationSpeed: 0.55
  };
  private styleElement: HTMLStyleElement | null = null;
  private supportNoticeElement: HTMLElement | null = null;
  private targetRotationY: number | null = 0;

  constructor({device}: AnimationProps) {
    super();
    this.canvas = device.getDefaultCanvasContext().canvas as HTMLCanvasElement;
    this.supported = HTMLTexture.isSupported(device, this.canvas);
    this.settingsPanel = new ExampleSettingsPanelManager({
      id: 'html-ui-prism-settings',
      schema: makePrismSettingsSchema(),
      settings: this.settingsState,
      onSettingsChange: this.handleSettingsChange
    });

    this.configureCanvas();

    if (!this.supported) {
      this.supportNoticeElement = makeSupportNotice(device.type);
      this.canvas.parentElement?.appendChild(this.supportNoticeElement);
      return;
    }

    this.panelSceneElement = this.createPanelScene();
    this.canvas.appendChild(this.panelSceneElement);
    this.prismFaces = FACE_IDS.map((faceId, index) => this.createPrismFace(device, faceId, index));
    this.syncActiveFace();
  }

  override onFinalize(): void {
    this.settingsPanel.finalize();
    this.prismFaces.forEach(face => {
      renderExamplePanel(face.panelHostElement, null);
      face.model.destroy();
      face.texture.destroy();
      face.uniformStore.destroy();
    });
    this.prismFaces = [];
    this.panelSceneElement?.remove();
    this.panelSceneElement = null;
    this.styleElement?.remove();
    this.styleElement = null;
    this.supportNoticeElement?.remove();
    this.supportNoticeElement = null;
    this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
    this.canvas.removeEventListener('pointermove', this.handlePointerMove);
    this.canvas.removeEventListener('pointerup', this.handlePointerUp);
    this.canvas.removeEventListener('pointercancel', this.handlePointerUp);
  }

  override onRender({aspect, device, time}: AnimationProps): void {
    if (!this.supported) {
      const renderPass = device.beginRenderPass({clearColor: [0.05, 0.06, 0.08, 1]});
      renderPass.end();
      return;
    }

    this.updateRotation(time);
    this.syncActiveFace();
    this.syncPanelSceneTransform();

    this.projectionMatrix.perspective({fovy: Math.PI / 3, aspect, near: 0.1, far: 100});

    const renderPass = device.beginRenderPass({
      clearColor: [0.05, 0.06, 0.08, 1],
      clearDepth: 1
    });

    for (const face of this.prismFaces) {
      const modelMatrix = new Matrix4()
        .rotateX(PRISM_TILT)
        .rotateY(this.rotationY)
        .rotateY(this.faceRotationById.get(face.id) ?? 0)
        .translate([0, 0, PRISM_RADIUS]);
      const modelViewProjectionMatrix = new Matrix4(this.projectionMatrix)
        .multiplyRight(this.viewMatrix)
        .multiplyRight(modelMatrix);

      face.uniformStore.setUniforms({
        app: {modelViewProjectionMatrix}
      });
      face.model.draw(renderPass);
    }

    renderPass.end();
  }

  private configureCanvas(): void {
    HTMLTexture.configureCanvas(this.canvas);
    this.canvas.style.background = '#0d1117';
    this.canvas.style.cursor = 'grab';
    this.canvas.style.position = 'relative';
    this.styleElement = document.createElement('style');
    this.styleElement.textContent = HTML_UI_PRISM_CSS;
    document.head.appendChild(this.styleElement);
    this.canvas.addEventListener('pointerdown', this.handlePointerDown);
    this.canvas.addEventListener('pointermove', this.handlePointerMove);
    this.canvas.addEventListener('pointerup', this.handlePointerUp);
    this.canvas.addEventListener('pointercancel', this.handlePointerUp);
  }

  private createPanelScene(): HTMLElement {
    const panelSceneElement = document.createElement('div');
    panelSceneElement.className = 'html-ui-prism-scene';
    return panelSceneElement;
  }

  private createPrismFace(
    device: AnimationProps['device'],
    faceId: PrismFaceId,
    index: number
  ): PrismFace {
    const {panelHostElement, sourceElement, wrapperElement} = makePrismFaceElements(faceId);
    const panel = this.makePanel(faceId);
    this.panelSceneElement?.appendChild(wrapperElement);
    renderExamplePanel(panelHostElement, panel);

    const texture = new HTMLTexture(device, {
      autoUpdate: true,
      canvas: this.canvas,
      element: sourceElement,
      height: FACE_TEXTURE_SIZE,
      observeResize: true,
      sampler: device.createSampler({
        magFilter: 'linear',
        minFilter: 'linear'
      }),
      width: FACE_TEXTURE_SIZE
    });
    const uniformStore = new UniformStore(device, {app});
    const model = new Model(device, {
      id: `html-ui-prism-${faceId}`,
      source: WGSL_SHADER,
      vs: VS_GLSL,
      fs: FS_GLSL,
      geometry: this.faceGeometry,
      bindings: {
        app: uniformStore.getManagedUniformBuffer('app'),
        uHtmlTexture: texture
      },
      parameters: {
        depthCompare: 'less-equal',
        depthWriteEnabled: true
      }
    });

    wrapperElement.style.transform = `rotateY(${this.faceRotationById.get(faceId) ?? 0}rad) translateZ(${PRISM_RADIUS * 180}px)`;
    wrapperElement
      .querySelector<HTMLButtonElement>('[data-prism-face-focus]')
      ?.addEventListener('click', () => {
        this.snapToFace(faceId);
      });

    return {
      id: faceId,
      index,
      label: getFaceLabel(faceId),
      model,
      panel,
      panelHostElement,
      sourceElement,
      texture,
      uniformStore,
      wrapperElement
    };
  }

  private makePanel(faceId: PrismFaceId): Panel {
    switch (faceId) {
      case 'info':
        return makeHtmlCustomPanel({
          id: 'html-ui-prism-info',
          title: 'Info',
          html: `\
<p>Each side is a real DOM panel copied into a GPU texture.</p>
<p>Drag the background to rotate. Use the focus buttons or the settings face to snap a side forward.</p>
<div class="html-ui-prism-chip-row">
  <span>DOM</span>
  <span>GPU texture</span>
  <span>clickable</span>
</div>
`
        });
      case 'settings':
        return this.settingsPanel.makePanel();
      case 'stats':
        return makeHtmlCustomPanel({
          id: 'html-ui-prism-stats',
          title: 'Stats',
          html: `<div data-prism-live-stats></div>`,
          onRender: rootElement => mountLivePanel(rootElement, () => makeStatsHtml())
        });
      case 'debug':
        return makeHtmlCustomPanel({
          id: 'html-ui-prism-debug',
          title: 'Debug',
          html: `<div data-prism-live-debug></div>`,
          onRender: rootElement => mountLivePanel(rootElement, () => this.makeDebugHtml())
        });
      default:
        throw new Error(`Unknown prism face: ${faceId}`);
    }
  }

  private makeDebugHtml(): string {
    return `\
<dl class="html-ui-prism-debug-grid">
  <div><dt>Backend</dt><dd>${escapeHtml(this.prismFaces[0]?.texture.device.type ?? 'unknown')}</dd></div>
  <div><dt>Front face</dt><dd>${escapeHtml(getFaceLabel(this.activeFaceId))}</dd></div>
  <div><dt>Rotation</dt><dd>${this.rotationY.toFixed(2)} rad</dd></div>
  <div><dt>Texture stamp</dt><dd>${Math.max(...this.prismFaces.map(face => face.texture.updateTimestamp), 0)}</dd></div>
</dl>
`;
  }

  private syncActiveFace(): void {
    const nextActiveFaceId =
      FACE_IDS[normalizeFaceIndex(Math.round(-this.rotationY / QUARTER_TURN))];
    if (nextActiveFaceId !== this.activeFaceId) {
      this.activeFaceId = nextActiveFaceId;
      this.settingsState = {...this.settingsState, activeFace: nextActiveFaceId};
      this.settingsPanel.setSettings(this.settingsState);
    }

    for (const face of this.prismFaces) {
      face.wrapperElement.dataset.active = String(face.id === this.activeFaceId);
    }
  }

  private syncPanelSceneTransform(): void {
    if (!this.panelSceneElement) {
      return;
    }
    this.panelSceneElement.style.setProperty('--html-ui-prism-rotation-y', `${this.rotationY}rad`);
    this.panelSceneElement.style.setProperty('--html-ui-prism-tilt', `${PRISM_TILT}rad`);
  }

  private updateRotation(time: number): void {
    if (this.lastRenderTime === 0) {
      this.lastRenderTime = time;
      return;
    }

    const deltaSeconds = Math.min((time - this.lastRenderTime) / 1000, 0.1);
    this.lastRenderTime = time;

    if (this.targetRotationY !== null) {
      const angleDelta = getShortestAngleDelta(this.rotationY, this.targetRotationY);
      this.rotationY += angleDelta * Math.min(deltaSeconds * 8, 1);
      if (Math.abs(angleDelta) < 0.002) {
        this.rotationY = this.targetRotationY;
        this.targetRotationY = null;
      }
      return;
    }

    if (!this.settingsState.paused && this.dragPointerId === null) {
      this.rotationY += this.settingsState.rotationSpeed * deltaSeconds;
    }
  }

  private snapToFace(faceId: PrismFaceId): void {
    this.targetRotationY = -(this.faceIndexById.get(faceId) ?? 0) * QUARTER_TURN;
  }

  private readonly handlePointerDown = (event: PointerEvent): void => {
    if (
      event.target instanceof Element &&
      event.target.closest('[data-html-ui-prism-face][data-active="true"]')
    ) {
      return;
    }

    this.dragPointerId = event.pointerId;
    this.dragStartX = event.clientX;
    this.dragStartRotationY = this.rotationY;
    this.targetRotationY = null;
    this.canvas.setPointerCapture?.(event.pointerId);
    this.canvas.style.cursor = 'grabbing';
  };

  private readonly handlePointerMove = (event: PointerEvent): void => {
    if (this.dragPointerId !== event.pointerId) {
      return;
    }
    this.rotationY = this.dragStartRotationY + (event.clientX - this.dragStartX) * 0.01;
  };

  private readonly handlePointerUp = (event: PointerEvent): void => {
    if (this.dragPointerId !== event.pointerId) {
      return;
    }
    this.dragPointerId = null;
    this.canvas.releasePointerCapture?.(event.pointerId);
    this.canvas.style.cursor = 'grab';
  };

  private readonly handleSettingsChange = (
    settings: Record<string, unknown>,
    changedSettings?: SettingsChangeDescriptor[]
  ): void => {
    const activeFace = getChangedSetting(changedSettings, 'activeFace')?.nextValue;
    const paused = getChangedSetting(changedSettings, 'paused')?.nextValue;
    const rotationSpeed = getChangedSetting(changedSettings, 'rotationSpeed')?.nextValue;

    if (typeof activeFace === 'string' && isPrismFaceId(activeFace)) {
      this.snapToFace(activeFace);
    }
    if (typeof paused === 'boolean') {
      this.settingsState = {...this.settingsState, paused};
    }
    if (typeof rotationSpeed === 'number') {
      this.settingsState = {...this.settingsState, rotationSpeed};
    }

    this.settingsState = {
      ...this.settingsState,
      ...settings,
      activeFace: isPrismFaceId(settings.activeFace)
        ? settings.activeFace
        : this.settingsState.activeFace
    } as PrismSettingsState;
  };
}

function makePrismFaceElements(faceId: PrismFaceId): {
  panelHostElement: HTMLElement;
  sourceElement: HTMLElement;
  wrapperElement: HTMLElement;
} {
  const wrapperElement = document.createElement('article');
  wrapperElement.className = 'html-ui-prism-face';
  wrapperElement.dataset.htmlUiPrismFace = '';
  wrapperElement.dataset.faceId = faceId;

  const sourceElement = document.createElement('div');
  sourceElement.className = 'html-ui-prism-surface';
  sourceElement.innerHTML = `\
<header class="html-ui-prism-face-header">
  <span>${escapeHtml(getFaceLabel(faceId))}</span>
  <button type="button" data-prism-face-focus>Focus</button>
</header>
<div data-prism-face-panel-host></div>
`;
  wrapperElement.appendChild(sourceElement);

  const panelHostElement = sourceElement.querySelector<HTMLElement>('[data-prism-face-panel-host]');
  if (!panelHostElement) {
    throw new Error(`Missing panel host for ${faceId}`);
  }
  configurePanelHostElement(panelHostElement);

  return {panelHostElement, sourceElement, wrapperElement};
}

function makePrismSettingsSchema(): SettingsSchema {
  return {
    title: 'Settings',
    sections: [
      {
        id: 'motion',
        name: 'Motion',
        initiallyCollapsed: false,
        settings: [
          {
            name: 'rotationSpeed',
            label: 'Rotation Speed',
            type: 'number',
            persist: 'none',
            min: -2,
            max: 2,
            step: 0.01
          },
          {name: 'paused', label: 'Pause', type: 'boolean', persist: 'none'},
          {
            name: 'activeFace',
            label: 'Focus Face',
            type: 'select',
            persist: 'none',
            options: FACE_IDS.map(faceId => ({label: getFaceLabel(faceId), value: faceId}))
          }
        ]
      }
    ]
  };
}

function makeStatsHtml(): string {
  const animationStats = luma.stats.get('Animation Loop');
  const gpuStats = luma.stats.get('GPU Time and Memory');
  return `\
<dl class="html-ui-prism-debug-grid">
  <div><dt>Frame rate</dt><dd>${formatStat(animationStats.get('Frame Rate').count)}</dd></div>
  <div><dt>CPU time</dt><dd>${formatStat(animationStats.get('CPU Time').count)} ms</dd></div>
  <div><dt>GPU time</dt><dd>${formatStat(animationStats.get('GPU Time').count)} ms</dd></div>
  <div><dt>GPU memory</dt><dd>${formatBytes(gpuStats.get('GPU Memory').count)}</dd></div>
</dl>
`;
}

function makeSupportNotice(deviceType: string): HTMLElement {
  const supportNoticeElement = document.createElement('div');
  supportNoticeElement.className = 'html-ui-prism-support';
  supportNoticeElement.innerHTML = `\
<strong>HTML-in-Canvas is not available.</strong>
<span>This ${escapeHtml(deviceType)} browser path does not expose the experimental DOM-to-texture upload APIs required by this demo. In Canary, enable <a href="chrome://flags/#canvas-draw-element">chrome://flags/#canvas-draw-element</a> or serve this origin with an <code>HTMLInCanvas</code> origin-trial token.</span>
`;
  return supportNoticeElement;
}

function mountLivePanel(rootElement: HTMLElement, getHtml: () => string): () => void {
  const render = () => {
    rootElement.innerHTML = getHtml();
  };
  render();
  const intervalId = window.setInterval(render, 250);
  return () => window.clearInterval(intervalId);
}

function getFaceLabel(faceId: PrismFaceId): string {
  return faceId[0].toUpperCase() + faceId.slice(1);
}

function isPrismFaceId(value: unknown): value is PrismFaceId {
  return typeof value === 'string' && FACE_IDS.includes(value as PrismFaceId);
}

function normalizeFaceIndex(index: number): number {
  return ((index % FACE_IDS.length) + FACE_IDS.length) % FACE_IDS.length;
}

function getShortestAngleDelta(from: number, to: number): number {
  return ((((to - from) % (2 * Math.PI)) + 3 * Math.PI) % (2 * Math.PI)) - Math.PI;
}

function formatBytes(byteLength: number): string {
  if (byteLength < 1024) {
    return `${Math.round(byteLength)} B`;
  }
  if (byteLength < 1024 * 1024) {
    return `${(byteLength / 1024).toFixed(1)} KB`;
  }
  return `${(byteLength / (1024 * 1024)).toFixed(1)} MB`;
}

function formatStat(value: number): string {
  return Number.isFinite(value) ? value.toFixed(1) : '-';
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

const HTML_UI_PRISM_CSS = `\
.html-ui-prism-scene {
  --html-ui-prism-face-size: 324px;
  --html-ui-prism-rotation-y: 0rad;
  --html-ui-prism-tilt: 0rad;
  inset: 0;
  display: grid;
  place-items: center;
  overflow: visible;
  pointer-events: none;
  position: absolute;
  perspective: 980px;
  transform: rotateX(var(--html-ui-prism-tilt)) rotateY(var(--html-ui-prism-rotation-y));
  transform-style: preserve-3d;
}

.html-ui-prism-scene::before {
  background: radial-gradient(circle at 50% 50%, rgba(90, 133, 255, 0.18), rgba(13, 17, 23, 0) 56%);
  content: '';
  inset: 8%;
  pointer-events: none;
  position: absolute;
}

.html-ui-prism-face {
  display: grid;
  height: var(--html-ui-prism-face-size);
  place-items: center;
  pointer-events: none;
  position: absolute;
  transform-style: preserve-3d;
  width: var(--html-ui-prism-face-size);
}

.html-ui-prism-face[data-active='true'] {
  pointer-events: auto;
}

.html-ui-prism-surface {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(236, 242, 255, 0.98)),
    radial-gradient(circle at top right, rgba(116, 149, 255, 0.24), rgba(255, 255, 255, 0));
  border: 1px solid rgba(108, 123, 157, 0.28);
  border-radius: 18px;
  box-shadow: 0 28px 80px rgba(0, 0, 0, 0.32);
  box-sizing: border-box;
  color: #0f172a;
  display: flex;
  flex-direction: column;
  gap: 14px;
  height: 100%;
  overflow: hidden;
  padding: 16px;
  width: 100%;
}

.html-ui-prism-face-header {
  align-items: center;
  border-bottom: 1px solid rgba(148, 163, 184, 0.28);
  display: flex;
  font: 700 15px/1.2 Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  justify-content: space-between;
  padding-bottom: 10px;
}

.html-ui-prism-face-header button {
  background: #0f172a;
  border: 0;
  border-radius: 999px;
  color: #f8fafc;
  cursor: pointer;
  font: 600 12px/1 Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  padding: 8px 10px;
}

.html-ui-prism-face-header button:hover {
  background: #1e293b;
}

.html-ui-prism-surface [data-prism-face-panel-host] {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
}

.html-ui-prism-surface p,
.html-ui-prism-surface dt,
.html-ui-prism-surface dd,
.html-ui-prism-surface span,
.html-ui-prism-surface button,
.html-ui-prism-surface label,
.html-ui-prism-surface input,
.html-ui-prism-surface select {
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.html-ui-prism-surface p {
  color: #334155;
  font-size: 14px;
  line-height: 1.5;
  margin: 0 0 12px;
}

.html-ui-prism-chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.html-ui-prism-chip-row span {
  background: #dbeafe;
  border-radius: 999px;
  color: #1d4ed8;
  font-size: 12px;
  font-weight: 700;
  padding: 6px 8px;
}

.html-ui-prism-debug-grid {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin: 0;
}

.html-ui-prism-debug-grid div {
  background: rgba(241, 245, 249, 0.88);
  border: 1px solid rgba(148, 163, 184, 0.26);
  border-radius: 12px;
  padding: 10px;
}

.html-ui-prism-debug-grid dt {
  color: #64748b;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  margin-bottom: 4px;
  text-transform: uppercase;
}

.html-ui-prism-debug-grid dd {
  color: #0f172a;
  font-size: 15px;
  font-weight: 700;
  margin: 0;
}

.html-ui-prism-support {
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(148, 163, 184, 0.32);
  border-radius: 14px;
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.22);
  color: #0f172a;
  display: grid;
  gap: 8px;
  inset: 50% auto auto 50%;
  max-width: 420px;
  padding: 18px;
  position: absolute;
  transform: translate(-50%, -50%);
  z-index: 2;
}

.html-ui-prism-support strong,
.html-ui-prism-support span {
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.html-ui-prism-support span {
  color: #475569;
  font-size: 14px;
  line-height: 1.45;
}

.html-ui-prism-support a {
  color: #2563eb;
}
`;
