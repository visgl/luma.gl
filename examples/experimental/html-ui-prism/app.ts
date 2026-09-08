// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {NumberArray, VariableShaderType} from '@luma.gl/core';
import {UniformStore} from '@luma.gl/core';
import type {AnimationProps} from '@luma.gl/engine';
import {AnimationLoopTemplate, Model, PlaneGeometry} from '@luma.gl/engine';
import {HTMLTexture} from '@luma.gl/experimental';
import {Matrix4} from '@math.gl/core';
import {
  type Panel,
  type SettingsChangeDescriptor,
  type SettingsSchema
} from '@deck.gl-community/panels';
import {
  ExampleSettingsPanelManager,
  getChangedSetting,
  makeHtmlCustomPanel,
  renderExamplePanel
} from '../../example-panels';
import {HtmlUiPrismInfoHtml} from './app-ui';
import {
  HTML_UI_PRISM_CSS,
  escapeHtml,
  getFaceLabel,
  makePrismFaceElements,
  makeStatsHtml,
  makeSupportNotice,
  mountLivePanel
} from './app-ui';

export const title = 'HTML-in-Canvas Prism';
export const description = 'Renders live panel-backed DOM surfaces on a rotating GPU prism.';

const FACE_TEXTURE_SIZE = 640;
const FACE_WORLD_SIZE = 2.9;
const PRISM_RADIUS = FACE_WORLD_SIZE * 0.5;
const PRISM_TILT = -0.18;
const QUARTER_TURN = Math.PI / 2;
const AUTO_ROTATION_RESUME_DELAY_MS = 3500;
const FACE_IDS = ['info', 'settings', 'stats', 'debug'] as const;
const FACE_POINTER_EVENT_TYPES = [
  'pointerdown',
  'pointermove',
  'pointerup',
  'pointercancel',
  'click',
  'dblclick',
  'wheel'
] as const;

export type PrismFaceId = (typeof FACE_IDS)[number];

type AppUniforms = {
  modelViewProjectionMatrix: NumberArray;
};

type PrismSettingsState = {
  rotate: boolean;
  rotationSpeed: number;
};

type PrismFace = {
  id: PrismFaceId;
  model: Model;
  panelHostElement: HTMLElement;
  panel: Panel;
  texture: HTMLTexture;
  uniformStore: UniformStore<{app: AppUniforms}>;
  wrapperElement: HTMLElement;
};

type HTMLInCanvasElement = HTMLCanvasElement & {
  getElementTransform?: (element: Element, drawTransform: DOMMatrix) => DOMMatrix | null;
};

const activePrismByCanvas = new WeakMap<HTMLCanvasElement, AppAnimationLoopTemplate>();

const app = {
  uniformTypes: {
    modelViewProjectionMatrix: 'mat4x4<f32>'
  }
} satisfies {uniformTypes: Record<keyof AppUniforms, VariableShaderType>};

const {WGSL_SHADER, VS_GLSL, FS_GLSL} = getShaderSources();

export default class AppAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = HtmlUiPrismInfoHtml;

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
  private readonly canvas: HTMLInCanvasElement;
  private readonly supported: boolean;
  private activeFaceId: PrismFaceId = 'info';
  private dragPointerId: number | null = null;
  private dragStartRotationY = 0;
  private dragStartX = 0;
  private lastRenderTime = 0;
  private autoRotationPauseRemainingMs = 0;
  private finalized = false;
  private active = true;
  private prismFaces: PrismFace[] = [];
  private rotationY = 0;
  private settingsState: PrismSettingsState = {
    rotate: true,
    rotationSpeed: 0.28
  };
  private styleElement: HTMLStyleElement | null = null;
  private supportNoticeElement: HTMLElement | null = null;
  private targetRotationY: number | null = 0;

  constructor({device}: AnimationProps) {
    super();
    this.canvas = device.getDefaultCanvasContext().canvas as HTMLCanvasElement;
    activePrismByCanvas.get(this.canvas)?.deactivateForReplacement();
    activePrismByCanvas.set(this.canvas, this);

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

    this.prismFaces = FACE_IDS.map(faceId => this.createPrismFace(device, faceId));
    this.syncActiveFace();
  }

  override onFinalize(): void {
    this.finalizeResources();
    if (activePrismByCanvas.get(this.canvas) === this) {
      activePrismByCanvas.delete(this.canvas);
    }
  }

  private deactivateForReplacement(): void {
    this.active = false;
    this.finalizeResources();
  }

  private finalizeResources(): void {
    if (this.finalized) {
      return;
    }
    this.finalized = true;
    this.settingsPanel.finalize();
    this.prismFaces.forEach(face => {
      renderExamplePanel(face.panelHostElement, null);
      this.updateFaceEventListeners(face.wrapperElement, 'remove');
      face.wrapperElement.remove();
      face.model.destroy();
      face.texture.destroy();
      face.uniformStore.destroy();
    });
    this.prismFaces = [];
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
    if (!this.active) {
      return;
    }

    if (!this.supported) {
      const renderPass = device.beginRenderPass({clearColor: [0.05, 0.06, 0.08, 1]});
      renderPass.end();
      return;
    }

    this.updateRotation(time);
    this.syncActiveFace();

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
      this.syncPrismFaceTransform(face, modelViewProjectionMatrix);

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
    this.canvas.style.overflow = 'visible';
    this.canvas.style.position = 'relative';
    this.styleElement = document.createElement('style');
    this.styleElement.textContent = HTML_UI_PRISM_CSS;
    document.head.appendChild(this.styleElement);
    this.canvas.addEventListener('pointerdown', this.handlePointerDown);
    this.canvas.addEventListener('pointermove', this.handlePointerMove);
    this.canvas.addEventListener('pointerup', this.handlePointerUp);
    this.canvas.addEventListener('pointercancel', this.handlePointerUp);
  }

  private createPrismFace(device: AnimationProps['device'], faceId: PrismFaceId): PrismFace {
    const {panelHostElement, wrapperElement} = makePrismFaceElements(faceId);
    const panel = this.makePanel(faceId);
    this.canvas.appendChild(wrapperElement);
    renderExamplePanel(panelHostElement, panel);

    const texture = new HTMLTexture(device, {
      autoUpdate: true,
      canvas: this.canvas,
      element: wrapperElement,
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

    this.updateFaceEventListeners(wrapperElement, 'add');

    wrapperElement
      .querySelector<HTMLButtonElement>('[data-prism-face-focus]')
      ?.addEventListener('click', () => {
        this.snapToFace(faceId);
      });

    return {
      id: faceId,
      model,
      panel,
      panelHostElement,
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
    }

    for (const face of this.prismFaces) {
      face.wrapperElement.dataset.active = String(face.id === this.activeFaceId);
    }
  }

  private syncPrismFaceTransform(face: PrismFace, modelViewProjectionMatrix: Matrix4): void {
    const drawTransform = makeCssDrawTransform({
      canvas: this.canvas,
      element: face.wrapperElement,
      modelViewProjectionMatrix
    });

    let elementTransform: DOMMatrix | null | undefined = null;
    try {
      elementTransform = this.canvas.getElementTransform?.(face.wrapperElement, drawTransform);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'InvalidStateError') {
        return;
      }
      throw error;
    }
    if (elementTransform?.is2D) {
      elementTransform = DOMMatrix.fromFloat64Array(elementTransform.toFloat64Array());
    }

    if (elementTransform) {
      face.wrapperElement.style.transform = elementTransform.toString();
      face.wrapperElement.style.zIndex = face.id === this.activeFaceId ? '10' : '1';
    } else {
      const faceRotationY = this.faceRotationById.get(face.id) ?? 0;
      face.wrapperElement.style.transform = `translate(-50%, -50%) rotateX(${PRISM_TILT}rad) rotateY(${this.rotationY}rad) rotateY(${faceRotationY}rad) translateZ(${PRISM_RADIUS * 180}px)`;
    }
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

    if (this.autoRotationPauseRemainingMs > 0) {
      this.autoRotationPauseRemainingMs = Math.max(
        0,
        this.autoRotationPauseRemainingMs - deltaSeconds * 1000
      );
      return;
    }

    if (this.settingsState.rotate && this.dragPointerId === null) {
      this.rotationY += this.settingsState.rotationSpeed * deltaSeconds;
    }
  }

  private snapToFace(faceId: PrismFaceId): void {
    this.targetRotationY = -(this.faceIndexById.get(faceId) ?? 0) * QUARTER_TURN;
  }

  private readonly handlePointerDown = (event: PointerEvent): void => {
    this.dragPointerId = event.pointerId;
    this.dragStartX = event.clientX;
    this.dragStartRotationY = this.rotationY;
    this.targetRotationY = null;
    this.autoRotationPauseRemainingMs = Number.POSITIVE_INFINITY;
    this.setRotate(false);
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
    this.pauseAutoRotationBriefly();
    this.canvas.releasePointerCapture?.(event.pointerId);
    this.canvas.style.cursor = 'grab';
  };

  private pauseAutoRotationBriefly(): void {
    this.autoRotationPauseRemainingMs = AUTO_ROTATION_RESUME_DELAY_MS;
  }

  private readonly handleFacePointerEvent = (event: Event): void => {
    this.pauseAutoRotationBriefly();
    event.stopPropagation();
  };

  private readonly handleFaceDragStart = (event: DragEvent): void => {
    event.preventDefault();
    event.stopPropagation();
  };

  private readonly handleSettingsChange = (
    settings: Record<string, unknown>,
    changedSettings?: SettingsChangeDescriptor[]
  ): void => {
    const rotate = getChangedSetting(changedSettings, 'rotate')?.nextValue ?? settings.rotate;
    const rotationSpeed =
      getChangedSetting(changedSettings, 'rotationSpeed')?.nextValue ?? settings.rotationSpeed;
    const nextSettings = {...this.settingsState};

    if (typeof rotate === 'boolean') {
      nextSettings.rotate = rotate;
      if (rotate) {
        this.autoRotationPauseRemainingMs = 0;
      }
    }
    if (typeof rotationSpeed === 'number') {
      nextSettings.rotationSpeed = rotationSpeed;
      if (nextSettings.rotate) {
        this.autoRotationPauseRemainingMs = 0;
      }
    }

    this.settingsState = nextSettings;
  };

  private setRotate(rotate: boolean): void {
    if (this.settingsState.rotate === rotate) {
      return;
    }
    this.settingsState = {...this.settingsState, rotate};
    if (rotate) {
      this.autoRotationPauseRemainingMs = 0;
    }
    this.settingsPanel.setSettings(this.settingsState);
  }

  private updateFaceEventListeners(element: HTMLElement, action: 'add' | 'remove'): void {
    const methodName = action === 'add' ? 'addEventListener' : 'removeEventListener';
    for (const eventType of FACE_POINTER_EVENT_TYPES) {
      element[methodName](eventType, this.handleFacePointerEvent);
    }
    element[methodName]('dragstart', this.handleFaceDragStart);
  }
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
            min: 0,
            max: 2,
            step: 0.01
          },
          {name: 'rotate', label: 'Rotate', type: 'boolean', persist: 'none'}
        ]
      }
    ]
  };
}

function makeCssDrawTransform(props: {
  canvas: HTMLCanvasElement;
  element: HTMLElement;
  modelViewProjectionMatrix: Matrix4;
}): DOMMatrix {
  const devicePixelRatio = window.devicePixelRatio || 1;
  const elementWidth = props.element.offsetWidth || 1;
  const elementHeight = props.element.offsetHeight || 1;
  const viewportWidth = props.canvas.width;
  const viewportHeight = props.canvas.height;

  const viewportMatrix = new Matrix4([
    viewportWidth / 2,
    0,
    0,
    0,
    0,
    -viewportHeight / 2,
    0,
    0,
    0,
    0,
    1,
    0,
    viewportWidth / 2,
    viewportHeight / 2,
    0,
    1
  ]);
  const elementToFaceMatrix = new Matrix4()
    .translate([-FACE_WORLD_SIZE / 2, FACE_WORLD_SIZE / 2, 0])
    .scale([FACE_WORLD_SIZE / elementWidth, -FACE_WORLD_SIZE / elementHeight, 1]);
  const cssPixelScaleMatrix = new Matrix4().scale([1 / devicePixelRatio, 1 / devicePixelRatio, 1]);
  const drawTransform = new Matrix4(viewportMatrix)
    .multiplyRight(props.modelViewProjectionMatrix)
    .multiplyRight(elementToFaceMatrix)
    .multiplyRight(cssPixelScaleMatrix);

  return new DOMMatrix(Array.from(drawTransform));
}

function normalizeFaceIndex(index: number): number {
  return ((index % FACE_IDS.length) + FACE_IDS.length) % FACE_IDS.length;
}

function getShortestAngleDelta(from: number, to: number): number {
  return ((((to - from) % (2 * Math.PI)) + 3 * Math.PI) % (2 * Math.PI)) - Math.PI;
}

function getShaderSources() {
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

  return {WGSL_SHADER, VS_GLSL, FS_GLSL} as const;
}
