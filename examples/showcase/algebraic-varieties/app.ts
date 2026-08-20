// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import {
  AnimationLoopTemplate,
  ClipSpace,
  OrbitControls,
  ShaderInputs,
  type AnimationProps
} from '@luma.gl/engine';
import {GPUCommandGraph, type CompiledGPUCommandGraph} from '@luma.gl/gpgpu/gpu-core';
import type {ShaderModule} from '@luma.gl/shadertools';
import {Matrix4, radians} from '@math.gl/core';
import {
  ALGEBRAIC_VARIETIES_WGSL,
  ALGEBRAIC_VARIETY_PRESETS,
  getAlgebraicVarietyPreset,
  type AlgebraicVarietyPreset
} from './algebraic-varieties';
import {buildImplicitSurfaceShader} from './implicit-surface-shader';

type ImplicitSurfaceUniforms = {
  inverseViewProjectionMatrix: Matrix4;
  cameraPosition: [number, number, number, number];
  variety: [number, number, number, number];
  lighting: [number, number, number, number];
};

const implicitSurface: ShaderModule<ImplicitSurfaceUniforms> = {
  name: 'implicitSurface',
  uniformTypes: {
    inverseViewProjectionMatrix: 'mat4x4<f32>',
    cameraPosition: 'vec4<f32>',
    variety: 'vec4<f32>',
    lighting: 'vec4<f32>'
  }
};

const INFO_HTML = `\
<section class="variety-info">
  <p>Real algebraic surfaces are evaluated and intersected directly in WGSL—there is no mesh and the polynomial is not treated as an SDF.</p>
  <p>Drag to orbit · wheel to zoom · <strong>1–9, 0</strong> presets · <strong>S</strong> singularities · <strong>R</strong> reset</p>
  <div class="variety-badges"><span>WebGPU</span><span>analytic gradients</span><span>HDR lighting</span><span>hybrid root refinement</span></div>
</section>`;
const IDLE_PRESET_INTERVAL_MILLISECONDS = 15_000;

/** WebGPU showcase for ray-intersected real algebraic surfaces. */
export default class AlgebraicVarietiesAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = INFO_HTML;

  readonly device: Device;
  readonly model: ClipSpace;
  readonly commandGraph: CompiledGPUCommandGraph<void>;
  readonly shaderInputs = new ShaderInputs({implicitSurface});
  orbitControls: OrbitControls | null = null;

  private preset: AlgebraicVarietyPreset = ALGEBRAIC_VARIETY_PRESETS[3]!;
  private readonly deformationByPreset = new Map(
    ALGEBRAIC_VARIETY_PRESETS.map(preset => [preset.id, preset.defaultDeformation])
  );
  private deformation = this.preset.defaultDeformation;
  private exposure = 1.15;
  private showSingularities = true;
  private currentTimeMilliseconds = 0;
  private nextAutomaticPresetTimeMilliseconds = IDLE_PRESET_INTERVAL_MILLISECONDS;
  private isUserInteracting = false;
  private presetSelect: HTMLSelectElement | null = null;
  private deformationInput: HTMLInputElement | null = null;
  private exposureInput: HTMLInputElement | null = null;
  private singularitiesInput: HTMLInputElement | null = null;
  private resetButton: HTMLButtonElement | null = null;
  private equationElement: HTMLElement | null = null;
  private descriptionElement: HTMLElement | null = null;
  private tabButtons: HTMLButtonElement[] = [];
  private tabPanels: HTMLElement[] = [];

  constructor({device}: AnimationProps) {
    super();
    if (device.type !== 'webgpu') {
      throw new Error('Algebraic varieties require WebGPU.');
    }
    this.device = device;
    this.model = new ClipSpace(device, {
      id: 'algebraic-varieties-raycaster',
      source: buildImplicitSurfaceShader(ALGEBRAIC_VARIETIES_WGSL),
      shaderInputs: this.shaderInputs,
      parameters: {cullMode: 'none'}
    });
    const commandGraph = new GPUCommandGraph<void>(device, {
      id: 'algebraic-varieties-frame-graph'
    });
    commandGraph.addRenderPass({
      id: 'ray-intersect-and-shade-variety',
      workload: {operation: 'implicit-surface-raycasting', commandCount: 1},
      compile: () => ({
        getRenderPassProps: () => ({clearColor: [0.004, 0.006, 0.014, 1]}),
        encode: ({renderPass}) => this.model.draw(renderPass)
      })
    });
    this.commandGraph = commandGraph.compile();
  }

  override async onInitialize({canvas}: AnimationProps): Promise<void> {
    if (!(canvas instanceof HTMLCanvasElement)) {
      return;
    }
    this.orbitControls = new OrbitControls(canvas, {
      target: [0, 0, 0],
      distance: this.preset.cameraDistance,
      minDistance: 2.2,
      maxDistance: 9,
      yaw: 0.55,
      pitch: 0.18,
      autoRotate: true,
      autoRotateSpeed: 0.12,
      onInteractionStart: this.noteInteraction
    });
    globalThis.addEventListener('keydown', this.handleKeyDown);
    globalThis.addEventListener('pointerdown', this.handleInteractionStart);
    globalThis.addEventListener('pointerup', this.handleInteractionEnd);
    globalThis.addEventListener('pointercancel', this.handleInteractionEnd);
    globalThis.addEventListener('wheel', this.noteInteraction);
    this.connectControls();
  }

  onRender({device, aspect, time}: AnimationProps): void {
    this.currentTimeMilliseconds = time;
    if (!this.isUserInteracting && time >= this.nextAutomaticPresetTimeMilliseconds) {
      const presetIndex = ALGEBRAIC_VARIETY_PRESETS.indexOf(this.preset);
      const nextPreset =
        ALGEBRAIC_VARIETY_PRESETS[(presetIndex + 1) % ALGEBRAIC_VARIETY_PRESETS.length]!;
      this.setPreset(nextPreset.id, true);
      this.nextAutomaticPresetTimeMilliseconds = time + IDLE_PRESET_INTERVAL_MILLISECONDS;
    }
    this.orbitControls?.update(time);
    const cameraPosition = this.orbitControls?.getEyePosition() ?? [0, 0, 4.2];
    const projectionMatrix = new Matrix4().perspective({
      fovy: radians(44),
      aspect,
      near: 0.05,
      far: 30
    });
    const viewMatrix = new Matrix4().lookAt({
      eye: cameraPosition,
      center: [0, 0, 0],
      up: [0, 1, 0]
    });
    const inverseViewProjectionMatrix = new Matrix4(projectionMatrix)
      .multiplyRight(viewMatrix)
      .invert();
    this.shaderInputs.setProps({
      implicitSurface: {
        inverseViewProjectionMatrix,
        cameraPosition: [...cameraPosition, 0],
        variety: [
          this.preset.shaderIndex,
          this.deformation,
          this.preset.boundingRadius,
          this.showSingularities ? 1 : 0
        ],
        lighting: [this.exposure, 0, 0, 0]
      }
    });
    this.commandGraph.encode(device.commandEncoder, {parameters: undefined});
  }

  onFinalize(): void {
    globalThis.removeEventListener('keydown', this.handleKeyDown);
    globalThis.removeEventListener('pointerdown', this.handleInteractionStart);
    globalThis.removeEventListener('pointerup', this.handleInteractionEnd);
    globalThis.removeEventListener('pointercancel', this.handleInteractionEnd);
    globalThis.removeEventListener('wheel', this.noteInteraction);
    this.presetSelect?.removeEventListener('change', this.handlePresetChange);
    this.deformationInput?.removeEventListener('input', this.handleDeformationChange);
    this.exposureInput?.removeEventListener('input', this.handleExposureChange);
    this.singularitiesInput?.removeEventListener('change', this.handleSingularitiesChange);
    this.resetButton?.removeEventListener('click', this.handleReset);
    for (const tabButton of this.tabButtons) {
      tabButton.removeEventListener('click', this.handleTabChange);
    }
    this.orbitControls?.destroy();
    this.orbitControls = null;
    this.commandGraph.destroy();
    this.model.destroy();
    this.shaderInputs.destroy();
  }

  private connectControls(): void {
    this.presetSelect = globalThis.document?.querySelector('[data-variety-preset]') ?? null;
    this.deformationInput =
      globalThis.document?.querySelector('[data-variety-deformation]') ?? null;
    this.exposureInput = globalThis.document?.querySelector('[data-variety-exposure]') ?? null;
    this.singularitiesInput =
      globalThis.document?.querySelector('[data-variety-singularities]') ?? null;
    this.resetButton = globalThis.document?.querySelector('[data-variety-reset]') ?? null;
    this.equationElement = globalThis.document?.querySelector('[data-variety-equation]') ?? null;
    this.descriptionElement =
      globalThis.document?.querySelector('[data-variety-description]') ?? null;
    this.tabButtons = Array.from(
      globalThis.document?.querySelectorAll<HTMLButtonElement>('[data-variety-tab]') ?? []
    );
    this.tabPanels = Array.from(
      globalThis.document?.querySelectorAll<HTMLElement>('[data-variety-panel]') ?? []
    );
    if (this.presetSelect) {
      this.presetSelect.innerHTML = ALGEBRAIC_VARIETY_PRESETS.map(
        preset => `<option value="${preset.id}">${preset.name} · degree ${preset.degree}</option>`
      ).join('');
      this.presetSelect.value = this.preset.id;
      this.presetSelect.addEventListener('change', this.handlePresetChange);
    }
    if (this.deformationInput) {
      this.deformationInput.value = String(this.deformation);
    }
    this.deformationInput?.addEventListener('input', this.handleDeformationChange);
    this.exposureInput?.addEventListener('input', this.handleExposureChange);
    this.singularitiesInput?.addEventListener('change', this.handleSingularitiesChange);
    this.resetButton?.addEventListener('click', this.handleReset);
    for (const tabButton of this.tabButtons) {
      tabButton.addEventListener('click', this.handleTabChange);
    }
    this.updateControlPresentation();
  }

  private readonly handlePresetChange = (): void => {
    if (this.presetSelect) {
      this.setPreset(this.presetSelect.value);
    }
  };

  private readonly handleDeformationChange = (): void => {
    this.noteInteraction();
    this.deformation = Number(this.deformationInput?.value ?? 0);
    this.deformationByPreset.set(this.preset.id, this.deformation);
    this.updateControlPresentation();
  };

  private readonly handleExposureChange = (): void => {
    this.noteInteraction();
    this.exposure = Number(this.exposureInput?.value ?? 1.15);
    this.updateControlPresentation();
  };

  private readonly handleSingularitiesChange = (): void => {
    this.noteInteraction();
    this.showSingularities = this.singularitiesInput?.checked ?? true;
    this.updateControlPresentation();
  };

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    this.noteInteraction();
    if (event.key >= '1' && event.key <= '9') {
      this.setPreset(ALGEBRAIC_VARIETY_PRESETS[Number(event.key) - 1]!.id);
    } else if (event.key === '0') {
      this.setPreset(ALGEBRAIC_VARIETY_PRESETS[9]!.id);
    } else if (event.key.toLowerCase() === 's') {
      this.showSingularities = !this.showSingularities;
      if (this.singularitiesInput) {
        this.singularitiesInput.checked = this.showSingularities;
      }
      this.updateControlPresentation();
    } else if (event.key.toLowerCase() === 'r') {
      this.resetCurrentPreset();
    }
  };

  private setPreset(id: string, automatic = false): void {
    if (!automatic) {
      this.noteInteraction();
    }
    this.preset = getAlgebraicVarietyPreset(id);
    this.deformation =
      this.deformationByPreset.get(this.preset.id) ?? this.preset.defaultDeformation;
    this.orbitControls?.setProps({distance: this.preset.cameraDistance});
    if (this.presetSelect) {
      this.presetSelect.value = this.preset.id;
    }
    if (this.deformationInput) {
      this.deformationInput.value = String(this.deformation);
    }
    this.updateControlPresentation();
  }

  private readonly handleReset = (): void => {
    this.noteInteraction();
    this.resetCurrentPreset();
  };

  private readonly handleTabChange = (event: Event): void => {
    this.noteInteraction();
    const selectedTab = (event.currentTarget as HTMLButtonElement).dataset['varietyTab'];
    for (const tabButton of this.tabButtons) {
      tabButton.setAttribute(
        'aria-selected',
        String(tabButton.dataset['varietyTab'] === selectedTab)
      );
    }
    for (const tabPanel of this.tabPanels) {
      tabPanel.hidden = tabPanel.dataset['varietyPanel'] !== selectedTab;
    }
  };

  private resetCurrentPreset(): void {
    this.deformation = this.preset.defaultDeformation;
    this.deformationByPreset.set(this.preset.id, this.deformation);
    this.exposure = 1.15;
    this.showSingularities = true;
    if (this.deformationInput) {
      this.deformationInput.value = String(this.deformation);
    }
    if (this.exposureInput) {
      this.exposureInput.value = '1.15';
    }
    if (this.singularitiesInput) {
      this.singularitiesInput.checked = true;
    }
    this.orbitControls?.reset();
    this.updateControlPresentation();
  }

  private readonly noteInteraction = (): void => {
    this.nextAutomaticPresetTimeMilliseconds =
      this.currentTimeMilliseconds + IDLE_PRESET_INTERVAL_MILLISECONDS;
  };

  private readonly handleInteractionStart = (): void => {
    this.isUserInteracting = true;
    this.noteInteraction();
  };

  private readonly handleInteractionEnd = (): void => {
    this.isUserInteracting = false;
    this.noteInteraction();
  };

  private updateControlPresentation(): void {
    if (this.equationElement) {
      const definitions = this.preset.equationDefinitions
        ? `\n${this.preset.equationDefinitions}`
        : '';
      this.equationElement.textContent = `f₀:  ${this.preset.equation}${definitions}\n\nrendered:  f₀ + (${this.deformation.toFixed(3)})(x² + y² + z² − 0.72) = 0`;
    }
    if (this.descriptionElement) {
      this.descriptionElement.textContent = `${this.preset.description} Deformation ${this.deformation.toFixed(2)} · exposure ${this.exposure.toFixed(2)} · singular overlay ${this.showSingularities ? 'on' : 'off'}.`;
    }
  }
}
