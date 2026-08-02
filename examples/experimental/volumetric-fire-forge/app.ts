// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Texture, type Device} from '@luma.gl/core';
import type {AnimationProps} from '@luma.gl/engine';
import {AnimationLoopTemplate} from '@luma.gl/engine';
import {OrbitControls, VolumetricFireSimulation} from '@luma.gl/experimental';
import {Matrix4, radians, type NumberArray3} from '@math.gl/core';
import type {Panel, SettingsChangeDescriptor, SettingsSchema} from '@deck.gl-community/panels';
import {
  ExamplePanelManager,
  ExampleSettingsPanelManager,
  makeExamplePanelHostHtml,
  makeExampleTabbedPanel,
  makeHtmlCustomPanel
} from '../../example-panels';
import {
  advanceVolumetricFireForgeFixedStep,
  makeObstacleVolumeData,
  VOLUMETRIC_FIRE_FORGE_FIXED_TIME_STEP_SECONDS,
  VOLUMETRIC_FIRE_FORGE_MAX_STEPS_PER_FRAME,
  VOLUMETRIC_FIRE_FORGE_PRESETS,
  type VolumetricFireForgePreset
} from './volumetric-fire-forge-scene';
import {
  VolumetricFireForgeRenderer,
  type VolumetricFireForgeRenderSettings
} from './volumetric-fire-forge-renderer';
import {VOLUMETRIC_FIRE_DEBUG_VIEWS} from './volumetric-fire-forge-shaders';

export const title = 'Volumetric Fire Forge';
export const description =
  'A reactive obstacle-aware fire solver rendered as depth-correct heat-shaped emission and smoke in HDR.';

const NEAR_PLANE = 0.1;
const FAR_PLANE = 80;
const CAMERA_TARGET: [number, number, number] = [0, 3.05, 0.4];
const INITIAL_WARMUP_STEP_COUNT = 24;

type VolumetricFireQuality = 'Interactive' | 'High' | 'Cinematic';

const VOLUMETRIC_FIRE_QUALITY_DIMENSIONS: Record<
  VolumetricFireQuality,
  readonly [number, number, number]
> = {
  Interactive: [40, 48, 32],
  High: [56, 72, 48],
  Cinematic: [72, 96, 60]
};

export type VolumetricFireForgeSettings = VolumetricFireForgeRenderSettings & {
  preset: string;
  quality: VolumetricFireQuality;
  paused: boolean;
  timeScale: number;
  buoyancyScale: number;
  turbulenceScale: number;
  reactionScale: number;
  autoOrbitCamera: boolean;
};

export const DEFAULT_VOLUMETRIC_FIRE_FORGE_SETTINGS: VolumetricFireForgeSettings = {
  preset: 'foundry',
  quality: 'High',
  paused: false,
  timeScale: 1,
  buoyancyScale: 1,
  turbulenceScale: 1,
  reactionScale: 1,
  autoOrbitCamera: true,
  debugView: 'Final',
  sampleCount: 88,
  densityAbsorption: 2.8,
  emissionStrength: 1.15,
  smokeScattering: 0.9,
  shadowStrength: 0.74,
  exposure: 0.8,
  bloomThreshold: 1.05,
  bloomIntensity: 0.42,
  bloomRadius: 10
};

type VolumetricFireForgeConstructorProps = AnimationProps & {
  simulationDimensions?: readonly [number, number, number];
  pressureIterations?: number;
};

/** WebGPU fire laboratory with a fixed-step compute solver and HDR volume rendering. */
export default class VolumetricFireForgeAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = makeExamplePanelHostHtml();

  readonly device: Device;
  readonly renderer: VolumetricFireForgeRenderer;
  readonly settingsPanel: ExampleSettingsPanelManager;
  readonly panels: ExamplePanelManager;

  simulation!: VolumetricFireSimulation;
  obstacleTexture!: Texture;
  orbitControls: OrbitControls | null = null;
  settings: VolumetricFireForgeSettings = {...DEFAULT_VOLUMETRIC_FIRE_FORGE_SETTINGS};
  stepsThisFrame = 0;
  droppedSimulationSeconds = 0;
  frameIndex = 0;
  lastVolumeTexture: Texture | null = null;

  private readonly simulationDimensionsOverride?: readonly [number, number, number];
  private readonly pressureIterations: number;
  private accumulatorSeconds = 0;
  private simulationTimeSeconds = 0;
  private previousTimeMilliseconds: number | null = null;
  private resetRequested = true;
  private singleStepRequested = false;
  private warmupStepsRemaining = INITIAL_WARMUP_STEP_COUNT;

  constructor({
    device,
    width,
    height,
    simulationDimensions,
    pressureIterations = 8
  }: VolumetricFireForgeConstructorProps) {
    super();
    if (device.type !== 'webgpu') {
      throw new Error('Volumetric Fire Forge requires WebGPU.');
    }
    this.device = device;
    this.simulationDimensionsOverride = simulationDimensions;
    this.pressureIterations = pressureIterations;
    let renderer: VolumetricFireForgeRenderer | undefined;
    let settingsPanel: ExampleSettingsPanelManager | undefined;
    let panels: ExamplePanelManager | undefined;
    try {
      this.rebuildSimulation();
      renderer = new VolumetricFireForgeRenderer(device, width, height);
      this.renderer = renderer;
      settingsPanel = new ExampleSettingsPanelManager({
        id: 'volumetric-fire-forge-settings',
        schema: makeVolumetricFireForgeSettingsSchema(),
        settings: this.settings,
        sectionPresentation: 'accordion',
        onSettingsChange: this.handleSettingsChange
      });
      this.settingsPanel = settingsPanel;
      panels = new ExamplePanelManager({panel: this.makePanel()});
      this.panels = panels;
      panels.mount();
    } catch (error) {
      panels?.finalize();
      settingsPanel?.finalize();
      renderer?.destroy();
      this.simulation?.destroy();
      this.obstacleTexture?.destroy();
      throw error;
    }
  }

  override async onInitialize({canvas}: AnimationProps): Promise<void> {
    if (canvas instanceof HTMLCanvasElement) {
      this.orbitControls = new OrbitControls(canvas, {
        target: CAMERA_TARGET,
        distance: 15.5,
        yaw: Math.PI + 0.32,
        pitch: 0.16,
        minDistance: 8,
        maxDistance: 34,
        minPitch: -0.04,
        maxPitch: 1.25,
        autoRotate: this.settings.autoOrbitCamera,
        autoRotateSpeed: 0.075
      });
    }
    document.getElementById('volumetric-fire-reset')?.addEventListener('click', this.handleReset);
    document
      .getElementById('volumetric-fire-single-step')
      ?.addEventListener('click', this.handleSingleStep);
    document
      .getElementById('volumetric-fire-reset-camera')
      ?.addEventListener('click', this.handleResetCamera);
  }

  onRender({device, width, height, aspect, time}: AnimationProps): void {
    this.renderer.resize(width, height);
    this.orbitControls?.setAutoRotate(this.settings.autoOrbitCamera);
    this.orbitControls?.update(time);
    const cameraPosition: NumberArray3 = this.orbitControls?.getEyePosition() || [6.2, 5.5, -13.5];
    const viewMatrix = new Matrix4().lookAt({
      eye: cameraPosition,
      center: CAMERA_TARGET,
      up: [0, 1, 0]
    });
    const projectionMatrix = new Matrix4().perspective({
      fovy: radians(47),
      aspect,
      near: NEAR_PLANE,
      far: FAR_PLANE
    });
    const viewProjectionMatrix = new Matrix4(projectionMatrix).multiplyRight(viewMatrix);
    const inverseViewProjectionMatrix = new Matrix4(viewProjectionMatrix).invert();

    this.encodeSimulationSteps(device, time);
    this.lastVolumeTexture = this.renderer.render({
      commandEncoder: device.commandEncoder,
      simulation: this.simulation,
      viewProjectionMatrix,
      inverseViewProjectionMatrix,
      cameraPosition,
      time: this.simulationTimeSeconds,
      frameIndex: this.frameIndex,
      settings: this.settings
    });
    this.updateTelemetry();
    this.frameIndex += this.stepsThisFrame;
  }

  onFinalize(): void {
    document
      .getElementById('volumetric-fire-reset')
      ?.removeEventListener('click', this.handleReset);
    document
      .getElementById('volumetric-fire-single-step')
      ?.removeEventListener('click', this.handleSingleStep);
    document
      .getElementById('volumetric-fire-reset-camera')
      ?.removeEventListener('click', this.handleResetCamera);
    this.settingsPanel.finalize();
    this.panels.finalize();
    this.orbitControls?.destroy();
    this.renderer.destroy();
    this.simulation.destroy();
    this.obstacleTexture.destroy();
  }

  requestReset(): void {
    this.resetRequested = true;
    this.accumulatorSeconds = 0;
    this.simulationTimeSeconds = 0;
    this.warmupStepsRemaining = INITIAL_WARMUP_STEP_COUNT;
  }

  requestSingleStep(): void {
    this.singleStepRequested = true;
  }

  private encodeSimulationSteps(device: Device, timeMilliseconds: number): void {
    const frameDeltaSeconds =
      this.previousTimeMilliseconds === null
        ? VOLUMETRIC_FIRE_FORGE_FIXED_TIME_STEP_SECONDS
        : Math.min(Math.max((timeMilliseconds - this.previousTimeMilliseconds) / 1000, 0), 0.15);
    this.previousTimeMilliseconds = timeMilliseconds;

    const scaledFrameDeltaSeconds = this.settings.paused
      ? 0
      : frameDeltaSeconds * this.settings.timeScale;
    const fixedStepResult = advanceVolumetricFireForgeFixedStep(
      this.accumulatorSeconds,
      scaledFrameDeltaSeconds
    );
    this.accumulatorSeconds = fixedStepResult.accumulatorSeconds;
    this.droppedSimulationSeconds += fixedStepResult.droppedSeconds;
    let stepCount = fixedStepResult.stepCount;
    if (this.singleStepRequested) {
      stepCount = Math.max(stepCount, 1);
      this.singleStepRequested = false;
    }
    if (this.resetRequested) {
      stepCount = Math.max(stepCount, 1);
    }
    if (this.warmupStepsRemaining > 0 && !this.settings.paused) {
      stepCount = Math.max(
        stepCount,
        Math.min(VOLUMETRIC_FIRE_FORGE_MAX_STEPS_PER_FRAME, this.warmupStepsRemaining)
      );
    }
    this.stepsThisFrame = stepCount;

    const preset = this.getPreset();
    for (let stepIndex = 0; stepIndex < stepCount; stepIndex++) {
      this.simulationTimeSeconds += VOLUMETRIC_FIRE_FORGE_FIXED_TIME_STEP_SECONDS;
      this.simulation.encode(device.commandEncoder, {
        ...preset.simulation,
        deltaTime: VOLUMETRIC_FIRE_FORGE_FIXED_TIME_STEP_SECONDS,
        time: this.simulationTimeSeconds,
        emitters: preset.emitters,
        buoyancy: (preset.simulation.buoyancy || 0) * this.settings.buoyancyScale,
        turbulence: (preset.simulation.turbulence || 0) * this.settings.turbulenceScale,
        reactionRate: (preset.simulation.reactionRate || 0) * this.settings.reactionScale,
        reset: this.resetRequested && stepIndex === 0
      });
    }
    this.warmupStepsRemaining = Math.max(this.warmupStepsRemaining - stepCount, 0);
    this.resetRequested = false;
  }

  private rebuildSimulation(): void {
    const dimensions =
      this.simulationDimensionsOverride ??
      VOLUMETRIC_FIRE_QUALITY_DIMENSIONS[this.settings.quality];
    const obstacleTexture = this.device.createTexture({
      id: 'volumetric-fire-forge-obstacles',
      dimension: '3d',
      width: dimensions[0],
      height: dimensions[1],
      depth: dimensions[2],
      format: 'r8unorm',
      data: makeObstacleVolumeData(dimensions),
      usage: Texture.SAMPLE | Texture.COPY_DST
    });
    let simulation: VolumetricFireSimulation | null = null;
    try {
      simulation = new VolumetricFireSimulation(this.device, {
        id: 'volumetric-fire-forge-simulation',
        dimensions,
        pressureIterations: this.pressureIterations,
        obstacleTexture
      });
    } catch (error) {
      obstacleTexture.destroy();
      throw error;
    }

    this.simulation?.destroy();
    this.obstacleTexture?.destroy();
    this.simulation = simulation;
    this.obstacleTexture = obstacleTexture;
    this.requestReset();
  }

  private getPreset(): VolumetricFireForgePreset {
    return (
      VOLUMETRIC_FIRE_FORGE_PRESETS.find(preset => preset.id === this.settings.preset) ||
      VOLUMETRIC_FIRE_FORGE_PRESETS[0]
    );
  }

  private makePanel(): Panel {
    return makeExampleTabbedPanel({
      id: 'volumetric-fire-forge-tabs',
      title: `Volumetric Fire Forge${this.device.preferredColorFormat === 'rgba16float' ? ' · HDR' : ''}`,
      panels: [
        makeHtmlCustomPanel({
          id: 'volumetric-fire-forge-overview',
          title: 'Overview',
          html: `
            <p><b>Reactive fire, not a flipbook.</b> WebGPU evolves velocity, pressure, fuel, heat, and smoke in a solid-aware 3D volume. A depth-clipped ray marcher turns the live fields into heat-shaped HDR emission, Beer-Lambert extinction, self-shadowed smoke, and bloom.</p>
            <p>Drag to orbit. Inspect density, temperature, fuel, age, velocity, obstacles, and transmittance without a GPU readback.</p>
            <p><button id="volumetric-fire-reset">Reset fire</button> <button id="volumetric-fire-single-step">Single step</button> <button id="volumetric-fire-reset-camera">Reset camera</button></p>
            <p id="volumetric-fire-telemetry"></p>
          `
        }),
        this.settingsPanel.makePanel(),
        makeHtmlCustomPanel({
          id: 'volumetric-fire-forge-background',
          title: 'Pipeline',
          html: '<p><b>One encoder, no CPU staging:</b> fixed 60 Hz solver steps and the volume compositor are recorded in order before the frame is submitted. Opaque depth stops the ray at forge surfaces; a world-to-volume transform keeps the collision mask, visible geometry, and 3D sampling aligned.</p><p><b>Stable exposure:</b> the forge uses fixed exposure so rapidly changing flames never pump the whole screen. HDR energy remains linear through multiscale bloom and reaches extended-range displays through the final tone map.</p>'
        })
      ]
    });
  }

  private readonly handleSettingsChange = (
    nextSettings: Record<string, unknown>,
    _changedSettings?: SettingsChangeDescriptor[]
  ): void => {
    const previousSettings = this.settings;
    this.settings = {...this.settings, ...(nextSettings as VolumetricFireForgeSettings)};
    if (previousSettings.quality !== this.settings.quality && !this.simulationDimensionsOverride) {
      this.rebuildSimulation();
    }
    if (previousSettings.preset !== this.settings.preset) {
      this.requestReset();
    }
    this.orbitControls?.setAutoRotate(this.settings.autoOrbitCamera);
  };

  private readonly handleReset = (): void => this.requestReset();
  private readonly handleSingleStep = (): void => this.requestSingleStep();
  private readonly handleResetCamera = (): void => this.orbitControls?.reset();

  private updateTelemetry(): void {
    const telemetryElement = document.getElementById('volumetric-fire-telemetry');
    if (!telemetryElement) {
      return;
    }
    const voxelCount = this.simulation.dimensions.reduce(
      (product, dimension) => product * dimension,
      1
    );
    telemetryElement.textContent =
      `${this.simulation.dimensions.join(' × ')} · ${voxelCount.toLocaleString()} voxels · ` +
      `${this.stepsThisFrame} solver step${this.stepsThisFrame === 1 ? '' : 's'} · ` +
      `${this.simulation.stats.nodeOrder.length} GPU nodes · ${this.renderer.sceneColorFormat}`;
  }
}

export function makeVolumetricFireForgeSettingsSchema(): SettingsSchema {
  return {
    title: 'Fire Forge Controls',
    sections: [
      {
        id: 'fire-state',
        name: 'Fire State',
        initiallyCollapsed: false,
        settings: [
          {
            name: 'preset',
            label: 'Preset',
            type: 'select',
            persist: 'none',
            options: VOLUMETRIC_FIRE_FORGE_PRESETS.map(preset => ({
              value: preset.id,
              label: preset.label
            }))
          },
          {
            name: 'quality',
            label: 'Volume Quality',
            type: 'select',
            persist: 'none',
            options: Object.keys(VOLUMETRIC_FIRE_QUALITY_DIMENSIONS)
          },
          {name: 'paused', label: 'Pause Solver', type: 'boolean', persist: 'none'},
          {
            name: 'timeScale',
            label: 'Time Scale',
            type: 'number',
            persist: 'none',
            min: 0.25,
            max: 2,
            step: 0.05
          }
        ]
      },
      {
        id: 'simulation',
        name: 'Simulation',
        initiallyCollapsed: true,
        settings: [
          {
            name: 'buoyancyScale',
            label: 'Buoyancy',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 2,
            step: 0.05
          },
          {
            name: 'turbulenceScale',
            label: 'Turbulence',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 2.5,
            step: 0.05
          },
          {
            name: 'reactionScale',
            label: 'Reaction Rate',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 2,
            step: 0.05
          }
        ]
      },
      {
        id: 'volume-rendering',
        name: 'Volume Rendering',
        initiallyCollapsed: false,
        settings: [
          {
            name: 'debugView',
            label: 'View',
            type: 'select',
            persist: 'none',
            options: [...VOLUMETRIC_FIRE_DEBUG_VIEWS]
          },
          {
            name: 'sampleCount',
            label: 'Ray Samples',
            type: 'number',
            persist: 'none',
            min: 24,
            max: 160,
            step: 4
          },
          {
            name: 'densityAbsorption',
            label: 'Smoke Absorption',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 6,
            step: 0.05
          },
          {
            name: 'emissionStrength',
            label: 'HDR Emission',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 8,
            step: 0.1
          },
          {
            name: 'smokeScattering',
            label: 'Smoke Light',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 3,
            step: 0.05
          },
          {
            name: 'shadowStrength',
            label: 'Self Shadow',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 1,
            step: 0.05
          }
        ]
      },
      {
        id: 'camera-output',
        name: 'Camera & HDR',
        initiallyCollapsed: true,
        settings: [
          {
            name: 'autoOrbitCamera',
            label: 'Auto Orbit',
            type: 'boolean',
            persist: 'none'
          },
          {
            name: 'exposure',
            label: 'Fixed Exposure',
            type: 'number',
            persist: 'none',
            min: 0.2,
            max: 2,
            step: 0.05
          },
          {
            name: 'bloomThreshold',
            label: 'Bloom Threshold',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 3,
            step: 0.05
          },
          {
            name: 'bloomIntensity',
            label: 'Bloom Intensity',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 3,
            step: 0.05
          },
          {
            name: 'bloomRadius',
            label: 'Bloom Radius',
            type: 'number',
            persist: 'none',
            min: 1,
            max: 24,
            step: 1
          }
        ]
      }
    ]
  };
}
