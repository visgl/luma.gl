// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {type Device, type RenderPipelineParameters} from '@luma.gl/core';
import type {AnimationProps} from '@luma.gl/engine';
import {AnimationLoopTemplate, SphereGeometry, Model, ShaderInputs} from '@luma.gl/engine';
import {
  ABufferRenderer,
  WBOITRenderer,
  aBuffer,
  aBufferPlugin,
  getABufferSupport,
  getWBOITSupport,
  type ABufferShaderModuleProps,
  type WBOITShaderModuleProps,
  wboit,
  wboitPlugin
} from '@luma.gl/experimental';
import type {ShaderModule} from '@luma.gl/shadertools';
import {Matrix4, radians} from '@math.gl/core';

const OPAQUE_INSTANCE_COUNT = 2;
const TRANSLUCENT_INSTANCE_COUNT = 7;
const ORBIT_DURATION_SECONDS = 90;
const MODE_SELECT_ID = 'a-buffer-mode';
const OPACITY_INPUT_ID = 'a-buffer-opacity';
const OPACITY_OUTPUT_ID = 'a-buffer-opacity-value';
const SPHERE_SIZE_INPUT_ID = 'a-buffer-sphere-size';
const SPHERE_SIZE_OUTPUT_ID = 'a-buffer-sphere-size-value';
const ROTATION_INPUT_ID = 'a-buffer-rotation';
const CONTROLS_TAB_ID = 'a-buffer-controls-tab';
const DETAILS_TAB_ID = 'a-buffer-details-tab';
const CONTROLS_PANEL_ID = 'a-buffer-controls-panel';
const DETAILS_PANEL_ID = 'a-buffer-details-panel';

type TransparencyMode = 'a-buffer' | 'weighted-blended' | 'alpha-blending';
type InfoTab = 'controls' | 'details';

type SceneUniforms = {
  viewProjectionMatrix: Matrix4;
  opacity: number;
  sphereSize: number;
  gridStart: number;
  gridStride: number;
};

const scene = {
  name: 'scene',
  uniformTypes: {
    viewProjectionMatrix: 'mat4x4<f32>',
    opacity: 'f32',
    sphereSize: 'f32',
    gridStart: 'u32',
    gridStride: 'u32'
  }
} as const satisfies ShaderModule<SceneUniforms>;

const SCENE_WGSL = /* wgsl */ `\
struct SceneUniforms {
  viewProjectionMatrix: mat4x4<f32>,
  opacity: f32,
  sphereSize: f32,
  gridStart: u32,
  gridStride: u32,
};

@group(0) @binding(auto) var<uniform> scene: SceneUniforms;

struct VertexInputs {
  @builtin(instance_index) instanceIndex: u32,
  @location(0) positions: vec3<f32>,
  @location(1) normals: vec3<f32>,
};

struct FragmentInputs {
  @builtin(position) Position: vec4<f32>,
  @location(0) normal: vec3<f32>,
  @location(1) @interpolate(flat) gridIndex: u32,
};

@vertex
fn vertexMain(inputs: VertexInputs) -> FragmentInputs {
  let gridIndex = scene.gridStart + inputs.instanceIndex * scene.gridStride;
  let row = gridIndex / 3u;
  let column = gridIndex % 3u;
  let offset = vec3<f32>(
    (f32(column) - 1.0) * 9.0,
    (1.0 - f32(row)) * 8.0,
    0.0
  );

  var outputs: FragmentInputs;
  outputs.Position = scene.viewProjectionMatrix * vec4<f32>(inputs.positions * scene.sphereSize + offset, 1.0);
  outputs.normal = inputs.normals;
  outputs.gridIndex = gridIndex;
  return outputs;
}

@fragment
fn fragmentMain(inputs: FragmentInputs) -> @location(0) vec4<f32> {
  let colors = array<vec3<f32>, 6>(
    vec3<f32>(0.96, 0.18, 0.24),
    vec3<f32>(0.20, 0.78, 0.36),
    vec3<f32>(0.16, 0.48, 0.98),
    vec3<f32>(0.86, 0.22, 0.92),
    vec3<f32>(1.0, 0.72, 0.12),
    vec3<f32>(0.08, 0.78, 0.88)
  );
  let baseColor = colors[inputs.gridIndex % 6u];
  let lightDirection = normalize(vec3<f32>(0.7, 1.0, -0.4));
  let lighting = 0.36 + 0.64 * (0.5 + 0.5 * dot(normalize(inputs.normal), lightDirection));
  let color = vec4<f32>(baseColor * lighting, scene.opacity);

#if A_BUFFER_ENABLED
  return aBuffer_captureStraightColor(color, inputs.Position);
#else
#if WBOIT_ENABLED
  return wboit_captureStraightColor(color, inputs.Position);
#else
  return color;
#endif
#endif
}
`;

const SCENE_GLSL = /* glsl */ `\
#version 300 es
precision highp float;
precision highp int;

uniform sceneUniforms {
  mat4 viewProjectionMatrix;
  float opacity;
  float sphereSize;
  uint gridStart;
  uint gridStride;
} scene;

in vec3 positions;
in vec3 normals;

out vec3 vNormal;
flat out uint vGridIndex;

void main(void) {
  uint gridIndex = scene.gridStart + uint(gl_InstanceID) * scene.gridStride;
  uint row = gridIndex / 3u;
  uint column = gridIndex % 3u;
  vec3 offset = vec3((float(column) - 1.0) * 9.0, (1.0 - float(row)) * 8.0, 0.0);

  gl_Position = scene.viewProjectionMatrix * vec4(positions * scene.sphereSize + offset, 1.0);
  vNormal = normals;
  vGridIndex = gridIndex;
}
`;

const SCENE_FS_GLSL = /* glsl */ `\
#version 300 es
precision highp float;
precision highp int;

uniform sceneUniforms {
  mat4 viewProjectionMatrix;
  float opacity;
  float sphereSize;
  uint gridStart;
  uint gridStride;
} scene;

in vec3 vNormal;
flat in uint vGridIndex;

out vec4 fragColor;

void main(void) {
  vec3 colors[6] = vec3[6](
    vec3(0.96, 0.18, 0.24),
    vec3(0.20, 0.78, 0.36),
    vec3(0.16, 0.48, 0.98),
    vec3(0.86, 0.22, 0.92),
    vec3(1.0, 0.72, 0.12),
    vec3(0.08, 0.78, 0.88)
  );
  vec3 baseColor = colors[vGridIndex % 6u];
  vec3 lightDirection = normalize(vec3(0.7, 1.0, -0.4));
  float lighting = 0.36 + 0.64 * (0.5 + 0.5 * dot(normalize(vNormal), lightDirection));
  vec4 color = vec4(baseColor * lighting, scene.opacity);

#if WBOIT_ENABLED
  fragColor = wboit_captureStraightColor(color, gl_FragCoord);
#else
  fragColor = color;
#endif
}
`;

const OPAQUE_PARAMETERS = {
  depthWriteEnabled: true,
  depthCompare: 'less-equal',
  cullMode: 'back'
} as const satisfies RenderPipelineParameters;

const TRANSLUCENT_PARAMETERS = {
  depthWriteEnabled: false,
  depthCompare: 'less-equal',
  cullMode: 'back',
  blend: true,
  blendColorOperation: 'add',
  blendColorSrcFactor: 'src-alpha',
  blendColorDstFactor: 'one-minus-src-alpha',
  blendAlphaOperation: 'add',
  blendAlphaSrcFactor: 'one',
  blendAlphaDstFactor: 'one-minus-src-alpha'
} as const satisfies RenderPipelineParameters;

export default class OrderIndependentTransparencyExample extends AnimationLoopTemplate {
  static info = `\
<div style="display: grid; gap: 12px; min-width: 260px; color: #0f172a; font: 13px/1.4 system-ui, sans-serif;">
  <div role="tablist" aria-label="Order-independent transparency example information" style="display: flex; gap: 6px; padding-bottom: 10px; border-bottom: 1px solid #e2e8f0;">
    <button id="${CONTROLS_TAB_ID}" type="button" role="tab" aria-controls="${CONTROLS_PANEL_ID}" aria-selected="true" data-a-buffer-info-tab="controls" style="padding: 5px 9px; border: 1px solid #7dd3fc; border-radius: 999px; background: #e0f2fe; color: #0369a1; cursor: pointer; font: 600 12px/1 system-ui, sans-serif;">Controls</button>
    <button id="${DETAILS_TAB_ID}" type="button" role="tab" aria-controls="${DETAILS_PANEL_ID}" aria-selected="false" tabindex="-1" data-a-buffer-info-tab="details" style="padding: 5px 9px; border: 1px solid #cbd5e1; border-radius: 999px; background: #fff; color: #334155; cursor: pointer; font: 600 12px/1 system-ui, sans-serif;">Details</button>
  </div>
  <section id="${CONTROLS_PANEL_ID}" role="tabpanel" aria-labelledby="${CONTROLS_TAB_ID}" data-a-buffer-info-panel="controls" style="display: grid; gap: 12px;">
    <p style="margin: 0;">Compare exact per-pixel linked-list OIT, approximate weighted blended OIT, and unsorted alpha blending on the same interleaved scene.</p>
    <label style="display: grid; gap: 5px; font-weight: 600;">
      <span>Transparency</span>
      <select id="${MODE_SELECT_ID}" style="padding: 7px 9px; border: 1px solid #cbd5e1; border-radius: 6px; background: #fff; color: #0f172a; font: inherit;">
        <option value="a-buffer">A-buffer OIT</option>
        <option value="weighted-blended">Weighted blended OIT</option>
        <option value="alpha-blending">Standard alpha blending</option>
      </select>
    </label>
    <label style="display: grid; gap: 5px; font-weight: 600;">
      <span style="display: flex; justify-content: space-between; gap: 12px;">Opacity <output id="${OPACITY_OUTPUT_ID}">0.34</output></span>
      <input id="${OPACITY_INPUT_ID}" type="range" min="0.1" max="0.7" step="0.01" value="0.34" style="width: 100%; margin: 0;">
    </label>
    <label style="display: grid; gap: 5px; font-weight: 600;">
      <span style="display: flex; justify-content: space-between; gap: 12px;">Sphere size <output id="${SPHERE_SIZE_OUTPUT_ID}">6.5</output></span>
      <input id="${SPHERE_SIZE_INPUT_ID}" type="range" min="3" max="10" step="0.1" value="6.5" style="width: 100%; margin: 0;">
    </label>
    <label style="display: flex; align-items: center; gap: 8px; font-weight: 600;">
      <input id="${ROTATION_INPUT_ID}" type="checkbox" checked>
      Rotate camera
    </label>
  </section>
  <section id="${DETAILS_PANEL_ID}" role="tabpanel" aria-labelledby="${DETAILS_TAB_ID}" aria-hidden="true" data-a-buffer-info-panel="details" hidden style="display: none; gap: 10px; color: #334155;">
    <p style="margin: 0;">The dropdown renders the same unsorted translucent spheres with three different blending strategies.</p>
    <div style="display: grid; gap: 8px;">
      <div><strong style="color: #0f172a;">A-buffer OIT</strong><br>Captures every translucent fragment into GPU storage, sorts fragments per pixel, then composites them back-to-front. It is the most accurate option here and is available on WebGPU.</div>
      <div><strong style="color: #0f172a;">Weighted blended OIT</strong><br>Accumulates weighted color and revealage into floating-point offscreen targets, then composites once. It avoids sorting and works on WebGPU or WebGL2 when float render-target blending is available, but it is approximate.</div>
      <div><strong style="color: #0f172a;">Standard alpha blending</strong><br>Blends translucent draws directly into the framebuffer in submission order. It is the cheapest fallback, but unsorted overlaps produce visibly incorrect results.</div>
    </div>
  </section>
</div>`;

  static props = {useDevicePixels: true, createFramebuffer: true};

  readonly device: Device;
  readonly supportsABuffer: boolean;
  readonly supportsWeightedBlendedOit: boolean;
  readonly aBufferRenderer: ABufferRenderer | null;
  readonly wboitRenderer: WBOITRenderer | null;
  readonly opaqueShaderInputs = new ShaderInputs<{scene: SceneUniforms}>({scene});
  readonly alphaShaderInputs = new ShaderInputs<{scene: SceneUniforms}>({scene});
  readonly wboitShaderInputs = new ShaderInputs<{
    scene: SceneUniforms;
    wboit: WBOITShaderModuleProps;
  }>({scene, wboit});
  readonly aBufferShaderInputs = new ShaderInputs<{
    scene: SceneUniforms;
    aBuffer: ABufferShaderModuleProps;
  }>({scene, aBuffer});
  readonly opaqueModel: Model;
  readonly alphaModel: Model;
  readonly wboitModel: Model | null;
  readonly aBufferModel: Model | null;

  transparencyMode: TransparencyMode = 'a-buffer';
  opacity = 0.34;
  sphereSize = 6.5;
  rotationEnabled = true;
  orbitRadians = Math.PI / 6;
  lastRenderTimeSeconds: number | null = null;
  controlCleanup: Array<() => void> = [];

  constructor({device}: AnimationProps) {
    super();

    this.device = device;
    this.supportsABuffer = getABufferSupport(device).supported;
    this.supportsWeightedBlendedOit = getWBOITSupport(device).supported;
    this.transparencyMode = this.getDefaultTransparencyMode();
    this.aBufferRenderer = this.supportsABuffer
      ? new ABufferRenderer(device, {
          averageFragmentsPerPixel: 4,
          maxFragmentsPerPixel: 16,
          maxBufferByteLength: 64 * 1024 * 1024
        })
      : null;
    this.wboitRenderer = this.supportsWeightedBlendedOit ? new WBOITRenderer(device) : null;
    this.opaqueModel = this.createModel({
      id: 'a-buffer-opaque',
      instanceCount: OPAQUE_INSTANCE_COUNT,
      shaderInputs: this.opaqueShaderInputs,
      parameters: OPAQUE_PARAMETERS
    });
    this.alphaModel = this.createModel({
      id: 'a-buffer-alpha',
      instanceCount: TRANSLUCENT_INSTANCE_COUNT,
      shaderInputs: this.alphaShaderInputs,
      parameters: TRANSLUCENT_PARAMETERS
    });
    this.wboitModel = this.supportsWeightedBlendedOit
      ? this.createModel({
          id: 'wboit-capture',
          instanceCount: TRANSLUCENT_INSTANCE_COUNT,
          shaderInputs: this.wboitShaderInputs,
          parameters: TRANSLUCENT_PARAMETERS,
          wboitEnabled: true
        })
      : null;
    this.aBufferModel = this.supportsABuffer
      ? this.createModel({
          id: 'a-buffer-capture',
          instanceCount: TRANSLUCENT_INSTANCE_COUNT,
          shaderInputs: this.aBufferShaderInputs,
          parameters: TRANSLUCENT_PARAMETERS,
          aBufferEnabled: true
        })
      : null;
  }

  override async onInitialize(): Promise<void> {
    this.initializeControls();
  }

  override onRender({aspect, time}: AnimationProps): void {
    const viewProjectionMatrix = this.getViewProjectionMatrix(aspect, time);
    const opaqueProps = this.getSceneProps(viewProjectionMatrix, false);
    const translucentProps = this.getSceneProps(viewProjectionMatrix, true);
    const aBufferRenderer = this.aBufferRenderer;
    const aBufferModel = this.aBufferModel;

    if (this.transparencyMode === 'a-buffer' && aBufferRenderer && aBufferModel) {
      aBufferRenderer.render({
        clearColor: [0.004, 0.008, 0.018, 1],
        clearDepth: 1,
        prepareBase: commandEncoder => {
          this.opaqueShaderInputs.setProps({scene: opaqueProps});
          this.opaqueModel.predraw(commandEncoder);
        },
        drawBase: renderPass => {
          this.opaqueModel.draw(renderPass);
        },
        prepareTranslucent: ({commandEncoder, shaderModuleProps, captureParameters}) => {
          this.aBufferShaderInputs.setProps({scene: translucentProps, aBuffer: shaderModuleProps});
          aBufferModel.setParameters({...TRANSLUCENT_PARAMETERS, ...captureParameters});
          aBufferModel.predraw(commandEncoder);
        },
        drawTranslucent: renderPass => {
          aBufferModel.draw(renderPass);
        }
      });
      return;
    }

    if (this.transparencyMode === 'weighted-blended' && this.wboitRenderer && this.wboitModel) {
      this.wboitRenderer.render({
        clearColor: [0.004, 0.008, 0.018, 1],
        clearDepth: 1,
        prepareBase: commandEncoder => {
          this.opaqueShaderInputs.setProps({scene: opaqueProps});
          this.opaqueModel.predraw(commandEncoder);
        },
        drawBase: renderPass => {
          this.opaqueModel.draw(renderPass);
        },
        prepareTranslucent: ({commandEncoder, shaderModuleProps, captureParameters}) => {
          this.wboitShaderInputs.setProps({scene: translucentProps, wboit: shaderModuleProps});
          this.wboitModel?.setParameters({...TRANSLUCENT_PARAMETERS, ...captureParameters});
          this.wboitModel?.predraw(commandEncoder);
        },
        drawTranslucent: renderPass => {
          this.wboitModel?.draw(renderPass);
        }
      });
      return;
    }

    this.opaqueShaderInputs.setProps({scene: opaqueProps});
    this.alphaShaderInputs.setProps({scene: translucentProps});
    this.opaqueModel.predraw(this.device.commandEncoder);
    this.alphaModel.predraw(this.device.commandEncoder);
    const renderPass = this.device.beginRenderPass({
      clearColor: [0.004, 0.008, 0.018, 1],
      clearDepth: 1
    });
    this.opaqueModel.draw(renderPass);
    this.alphaModel.draw(renderPass);
    renderPass.end();
  }

  override onFinalize(): void {
    for (const cleanup of this.controlCleanup) {
      cleanup();
    }
    this.controlCleanup = [];
    this.opaqueModel.destroy();
    this.alphaModel.destroy();
    this.wboitModel?.destroy();
    this.aBufferModel?.destroy();
    this.opaqueShaderInputs.destroy();
    this.alphaShaderInputs.destroy();
    this.wboitShaderInputs.destroy();
    this.aBufferShaderInputs.destroy();
    this.aBufferRenderer?.destroy();
    this.wboitRenderer?.destroy();
  }

  private createModel(options: {
    id: string;
    instanceCount: number;
    shaderInputs: ShaderInputs<any>;
    parameters: Readonly<RenderPipelineParameters>;
    aBufferEnabled?: boolean;
    wboitEnabled?: boolean;
  }): Model {
    const aBufferEnabled = options.aBufferEnabled ?? false;
    const wboitEnabled = options.wboitEnabled ?? false;
    return new Model(this.device, {
      id: options.id,
      source: SCENE_WGSL,
      vs: SCENE_GLSL,
      fs: SCENE_FS_GLSL,
      shaderInputs: options.shaderInputs,
      defines: {
        A_BUFFER_ENABLED: aBufferEnabled ? 1 : 0,
        WBOIT_ENABLED: wboitEnabled ? 1 : 0
      },
      plugins: aBufferEnabled ? [aBufferPlugin] : wboitEnabled ? [wboitPlugin] : [],
      geometry: new SphereGeometry({nlat: 32, nlong: 48}),
      instanceCount: options.instanceCount,
      parameters: options.parameters
    });
  }

  private getDefaultTransparencyMode(): TransparencyMode {
    if (this.supportsABuffer) {
      return 'a-buffer';
    }
    if (this.supportsWeightedBlendedOit) {
      return 'weighted-blended';
    }
    return 'alpha-blending';
  }

  private getSceneProps(viewProjectionMatrix: Matrix4, translucent: boolean): SceneUniforms {
    return {
      viewProjectionMatrix,
      opacity: translucent ? this.opacity : 1,
      sphereSize: this.sphereSize,
      gridStart: translucent ? 1 : 0,
      gridStride: translucent ? 1 : 8
    };
  }

  private getViewProjectionMatrix(aspect: number, time: number): Matrix4 {
    const timeSeconds = time / 1000;
    if (this.lastRenderTimeSeconds === null) {
      this.lastRenderTimeSeconds = timeSeconds;
    }
    const elapsedSeconds = Math.max(timeSeconds - this.lastRenderTimeSeconds, 0);
    this.lastRenderTimeSeconds = timeSeconds;
    if (this.rotationEnabled) {
      this.orbitRadians += (elapsedSeconds * Math.PI * 2) / ORBIT_DURATION_SECONDS;
    }

    const cameraPosition: [number, number, number] = [
      Math.sin(this.orbitRadians) * 45,
      15,
      -Math.cos(this.orbitRadians) * 45
    ];
    const projectionMatrix = new Matrix4().perspective({
      fovy: radians(58),
      aspect,
      near: 1,
      far: 240
    });
    const viewMatrix = new Matrix4().lookAt({
      eye: cameraPosition,
      center: [0, 0, 0],
      up: [0, 1, 0]
    });
    return projectionMatrix.multiplyRight(viewMatrix);
  }

  private initializeControls(): void {
    this.initializeInfoTabs();

    const modeSelect = document.getElementById(MODE_SELECT_ID) as HTMLSelectElement | null;
    const opacityInput = document.getElementById(OPACITY_INPUT_ID) as HTMLInputElement | null;
    const opacityOutput = document.getElementById(OPACITY_OUTPUT_ID);
    const sphereSizeInput = document.getElementById(
      SPHERE_SIZE_INPUT_ID
    ) as HTMLInputElement | null;
    const sphereSizeOutput = document.getElementById(SPHERE_SIZE_OUTPUT_ID);
    const rotationInput = document.getElementById(ROTATION_INPUT_ID) as HTMLInputElement | null;

    if (modeSelect) {
      setTransparencyOptionSupported(modeSelect, 'a-buffer', this.supportsABuffer);
      setTransparencyOptionSupported(
        modeSelect,
        'weighted-blended',
        this.supportsWeightedBlendedOit
      );
      modeSelect.value = this.transparencyMode;

      const handleModeChange = () => {
        if (modeSelect.value === 'weighted-blended') {
          this.transparencyMode = 'weighted-blended';
          return;
        }
        this.transparencyMode =
          modeSelect.value === 'alpha-blending' ? 'alpha-blending' : 'a-buffer';
      };
      modeSelect.addEventListener('change', handleModeChange);
      this.controlCleanup.push(() => modeSelect.removeEventListener('change', handleModeChange));
    }
    if (opacityInput) {
      const handleOpacityInput = () => {
        this.opacity = Number(opacityInput.value);
        if (opacityOutput) {
          opacityOutput.textContent = this.opacity.toFixed(2);
        }
      };
      opacityInput.addEventListener('input', handleOpacityInput);
      this.controlCleanup.push(() => opacityInput.removeEventListener('input', handleOpacityInput));
    }
    if (sphereSizeInput) {
      const handleSphereSizeInput = () => {
        this.sphereSize = Number(sphereSizeInput.value);
        if (sphereSizeOutput) {
          sphereSizeOutput.textContent = this.sphereSize.toFixed(1);
        }
      };
      sphereSizeInput.addEventListener('input', handleSphereSizeInput);
      this.controlCleanup.push(() =>
        sphereSizeInput.removeEventListener('input', handleSphereSizeInput)
      );
    }
    if (rotationInput) {
      const handleRotationChange = () => {
        this.rotationEnabled = rotationInput.checked;
      };
      rotationInput.addEventListener('change', handleRotationChange);
      this.controlCleanup.push(() =>
        rotationInput.removeEventListener('change', handleRotationChange)
      );
    }
  }

  private initializeInfoTabs(): void {
    const tabs = Array.from(
      document.querySelectorAll<HTMLButtonElement>('[data-a-buffer-info-tab]')
    );
    const panels = Array.from(document.querySelectorAll<HTMLElement>('[data-a-buffer-info-panel]'));

    const setActiveInfoTab = (activeTab: InfoTab) => {
      for (const tab of tabs) {
        const isActive = getInfoTab(tab) === activeTab;
        tab.setAttribute('aria-selected', String(isActive));
        tab.tabIndex = isActive ? 0 : -1;
        tab.style.background = isActive ? '#e0f2fe' : '#fff';
        tab.style.borderColor = isActive ? '#7dd3fc' : '#cbd5e1';
        tab.style.color = isActive ? '#0369a1' : '#334155';
      }
      for (const panel of panels) {
        const isActive = getInfoTab(panel) === activeTab;
        panel.hidden = !isActive;
        panel.setAttribute('aria-hidden', String(!isActive));
        panel.style.display = isActive ? 'grid' : 'none';
      }
    };

    for (const tab of tabs) {
      const infoTab = getInfoTab(tab);
      if (!infoTab) {
        continue;
      }
      const handleTabClick = () => setActiveInfoTab(infoTab);
      tab.addEventListener('click', handleTabClick);
      this.controlCleanup.push(() => tab.removeEventListener('click', handleTabClick));
    }

    setActiveInfoTab('controls');
  }
}

function getInfoTab(element: HTMLElement): InfoTab | null {
  const infoTab = element.dataset.aBufferInfoTab ?? element.dataset.aBufferInfoPanel;
  return infoTab === 'controls' || infoTab === 'details' ? infoTab : null;
}

function setTransparencyOptionSupported(
  modeSelect: HTMLSelectElement,
  mode: TransparencyMode,
  supported: boolean
): void {
  const option = modeSelect.querySelector<HTMLOptionElement>(`option[value="${mode}"]`);
  if (option) {
    option.disabled = !supported;
    option.hidden = !supported;
  }
}
