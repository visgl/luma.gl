// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Texture, type Device} from '@luma.gl/core';
import type {AnimationProps} from '@luma.gl/engine';
import {AnimationLoopTemplate, OrbitControls} from '@luma.gl/engine';
import {VolumetricFireSimulation} from '@luma.gl/experimental';
import {Matrix4, radians, type NumberArray3} from '@math.gl/core';
import {
  DEFAULT_VOLUMETRIC_FIRE_FORGE_SETTINGS,
  VOLUMETRIC_FIRE_FORGE_INFO_HTML,
  VOLUMETRIC_FIRE_QUALITY_DIMENSIONS,
  VolumetricFireForgeUserInterface,
  type VolumetricFireForgeSettings
} from './app-ui';
import {VolumetricFireForgeAudio} from './volumetric-fire-forge-audio';
import {
  advanceVolumetricFireForgeFlareSchedule,
  getVolumetricFireForgeFlareEnvelope,
  makeVolumetricFireForgeFlaredEmitters,
  makeVolumetricFireForgeFlareSchedule,
  selectNearestVolumetricFireForgeBurner,
  type VolumetricFireForgeFlareSchedule
} from './volumetric-fire-forge-flares';
import {
  advanceVolumetricFireForgeFixedStep,
  makeObstacleVolumeData,
  VOLUMETRIC_FIRE_FORGE_BURNER_WORLD_POSITIONS,
  VOLUMETRIC_FIRE_FORGE_FIXED_TIME_STEP_SECONDS,
  VOLUMETRIC_FIRE_FORGE_MAX_STEPS_PER_FRAME,
  VOLUMETRIC_FIRE_FORGE_PRESETS,
  type VolumetricFireForgePreset
} from './volumetric-fire-forge-scene';
import {VolumetricFireForgeRenderer} from './volumetric-fire-forge-renderer';

export {
  DEFAULT_VOLUMETRIC_FIRE_FORGE_SETTINGS,
  makeVolumetricFireForgeSettingsSchema
} from './app-ui';
export type {VolumetricFireForgeSettings} from './app-ui';

export const title = 'Volumetric Fire Forge';
export const description =
  'A reactive obstacle-aware fire solver rendered as depth-correct heat-shaped emission and smoke in HDR.';

const NEAR_PLANE = 0.1;
const FAR_PLANE = 80;
const CAMERA_TARGET: [number, number, number] = [0, 3.05, 0.4];
const CAMERA_MINIMUM_YAW = Math.PI - 0.62;
const CAMERA_MAXIMUM_YAW = Math.PI + 0.62;
const CAMERA_AUTO_ORBIT_SPEED = 0.075;
const INITIAL_WARMUP_STEP_COUNT = 24;
const CLICK_MOVEMENT_THRESHOLD_PIXELS = 7;
const CLICK_BURNER_RADIUS_PIXELS = 72;
const CLICKED_FLARE_INTENSITY = 1.28;

type VolumetricFireForgeConstructorProps = AnimationProps & {
  simulationDimensions?: readonly [number, number, number];
  pressureIterations?: number;
};

type ActiveBurnerFlare = {
  startTimeSeconds: number;
  intensity: number;
};

type PointerStart = {
  pointerId: number;
  clientX: number;
  clientY: number;
};

/** WebGPU fire laboratory with a fixed-step compute solver and HDR volume rendering. */
export default class VolumetricFireForgeAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = VOLUMETRIC_FIRE_FORGE_INFO_HTML;

  readonly device: Device;
  readonly renderer: VolumetricFireForgeRenderer;
  readonly userInterface: VolumetricFireForgeUserInterface;
  readonly flareAudio = new VolumetricFireForgeAudio();

  simulation!: VolumetricFireSimulation;
  obstacleTexture!: Texture;
  orbitControls: OrbitControls | null = null;
  settings: VolumetricFireForgeSettings = {...DEFAULT_VOLUMETRIC_FIRE_FORGE_SETTINGS};
  stepsThisFrame = 0;
  droppedSimulationSeconds = 0;
  frameIndex = 0;
  lastVolumeTexture: Texture | null = null;
  burnerFlareIntensities: [number, number, number, number] = [0, 0, 0, 0];

  private readonly simulationDimensionsOverride?: readonly [number, number, number];
  private readonly pressureIterations: number;
  private accumulatorSeconds = 0;
  private simulationTimeSeconds = 0;
  private previousTimeMilliseconds: number | null = null;
  private previousCameraTimeMilliseconds: number | null = null;
  private cameraOrbitDirection = 1;
  private resetRequested = true;
  private singleStepRequested = false;
  private warmupStepsRemaining = INITIAL_WARMUP_STEP_COUNT;
  private flareSchedule = makeVolumetricFireForgeFlareSchedule(
    VOLUMETRIC_FIRE_FORGE_BURNER_WORLD_POSITIONS.length
  );
  private readonly activeBurnerFlares: (ActiveBurnerFlare | null)[] =
    VOLUMETRIC_FIRE_FORGE_BURNER_WORLD_POSITIONS.map(() => null);
  private canvas: HTMLCanvasElement | null = null;
  private pointerStart: PointerStart | null = null;
  private lastViewProjectionMatrix: Matrix4 | null = null;
  private lastCameraPosition: NumberArray3 = [6.2, 5.5, -13.5];

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
    let userInterface: VolumetricFireForgeUserInterface | undefined;
    try {
      this.rebuildSimulation();
      renderer = new VolumetricFireForgeRenderer(device, width, height);
      this.renderer = renderer;
      userInterface = new VolumetricFireForgeUserInterface({
        preferredColorFormat: device.preferredColorFormat,
        settings: this.settings,
        onSettingsChange: this.handleSettingsChange,
        onReset: this.handleReset,
        onSingleStep: this.handleSingleStep,
        onResetCamera: this.handleResetCamera,
        onToggleSound: this.handleToggleSound,
        onArmAudio: () => void this.flareAudio.arm()
      });
      this.userInterface = userInterface;
      userInterface.mount();
    } catch (error) {
      userInterface?.finalize();
      renderer?.destroy();
      this.simulation?.destroy();
      this.obstacleTexture?.destroy();
      throw error;
    }
  }

  override async onInitialize({canvas}: AnimationProps): Promise<void> {
    if (canvas instanceof HTMLCanvasElement) {
      this.canvas = canvas;
      this.orbitControls = new OrbitControls(canvas, {
        target: CAMERA_TARGET,
        distance: 15.5,
        yaw: Math.PI + 0.32,
        pitch: 0.16,
        minDistance: 8,
        maxDistance: 34,
        minPitch: -0.04,
        maxPitch: 1.25,
        autoRotate: false
      });
      canvas.addEventListener('pointerdown', this.handleCanvasPointerDown);
      canvas.addEventListener('pointerup', this.handleCanvasPointerUp);
      canvas.addEventListener('pointercancel', this.handleCanvasPointerCancel);
    }
    this.userInterface.initialize();
    this.userInterface.updateSoundButton(this.flareAudio.muted);
  }

  onRender({device, width, height, aspect, time}: AnimationProps): void {
    this.renderer.resize(width, height);
    this.updateCamera(time);
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
    this.lastViewProjectionMatrix = viewProjectionMatrix;
    this.lastCameraPosition = [cameraPosition[0], cameraPosition[1], cameraPosition[2]];

    this.encodeSimulationSteps(device, time);
    this.updateBurnerFlareIntensities();
    this.lastVolumeTexture = this.renderer.render({
      commandEncoder: device.commandEncoder,
      simulation: this.simulation,
      viewProjectionMatrix,
      inverseViewProjectionMatrix,
      cameraPosition,
      time: this.simulationTimeSeconds,
      frameIndex: this.frameIndex,
      burnerFlareIntensities: this.burnerFlareIntensities,
      settings: this.settings
    });
    this.userInterface.updateTelemetry({
      dimensions: this.simulation.dimensions,
      stepsThisFrame: this.stepsThisFrame,
      graphNodeCount: this.simulation.stats.nodeOrder.length,
      sceneColorFormat: this.renderer.sceneColorFormat,
      secondsUntilNextFlare: this.flareSchedule.nextFlareTimeSeconds - this.simulationTimeSeconds
    });
    this.frameIndex += this.stepsThisFrame;
  }

  onFinalize(): void {
    this.canvas?.removeEventListener('pointerdown', this.handleCanvasPointerDown);
    this.canvas?.removeEventListener('pointerup', this.handleCanvasPointerUp);
    this.canvas?.removeEventListener('pointercancel', this.handleCanvasPointerCancel);
    this.canvas = null;
    this.flareAudio.destroy();
    this.userInterface.finalize();
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
    this.resetFlareState();
  }

  requestSingleStep(): void {
    this.singleStepRequested = true;
  }

  /** Testable/programmatic equivalent of clicking one visible burner. */
  triggerBurnerFlare(burnerIndex: number, intensity = CLICKED_FLARE_INTENSITY): boolean {
    return this.startBurnerFlare(burnerIndex, intensity, 'programmatic');
  }

  get nextAutomaticFlare(): VolumetricFireForgeFlareSchedule {
    return {...this.flareSchedule};
  }

  private updateCamera(timeMilliseconds: number): void {
    if (!this.orbitControls) {
      return;
    }

    const deltaSeconds =
      this.previousCameraTimeMilliseconds === null
        ? 0
        : Math.min(
            Math.max((timeMilliseconds - this.previousCameraTimeMilliseconds) / 1000, 0),
            0.1
          );
    this.previousCameraTimeMilliseconds = timeMilliseconds;
    this.orbitControls.update(timeMilliseconds);

    if (this.orbitControls.yaw <= CAMERA_MINIMUM_YAW) {
      this.orbitControls.yaw = CAMERA_MINIMUM_YAW;
      this.cameraOrbitDirection = 1;
    } else if (this.orbitControls.yaw >= CAMERA_MAXIMUM_YAW) {
      this.orbitControls.yaw = CAMERA_MAXIMUM_YAW;
      this.cameraOrbitDirection = -1;
    } else if (this.settings.autoOrbitCamera) {
      this.orbitControls.yaw += this.cameraOrbitDirection * CAMERA_AUTO_ORBIT_SPEED * deltaSeconds;
      if (this.orbitControls.yaw >= CAMERA_MAXIMUM_YAW) {
        this.orbitControls.yaw = CAMERA_MAXIMUM_YAW;
        this.cameraOrbitDirection = -1;
      } else if (this.orbitControls.yaw <= CAMERA_MINIMUM_YAW) {
        this.orbitControls.yaw = CAMERA_MINIMUM_YAW;
        this.cameraOrbitDirection = 1;
      }
    }
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
      this.triggerDueAutomaticFlares();
      this.updateBurnerFlareIntensities();
      this.simulation.encode(device.commandEncoder, {
        ...preset.simulation,
        deltaTime: VOLUMETRIC_FIRE_FORGE_FIXED_TIME_STEP_SECONDS,
        time: this.simulationTimeSeconds,
        emitters: makeVolumetricFireForgeFlaredEmitters(
          preset.emitters,
          this.burnerFlareIntensities
        ),
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

  private resetFlareState(): void {
    this.flareSchedule = makeVolumetricFireForgeFlareSchedule(
      VOLUMETRIC_FIRE_FORGE_BURNER_WORLD_POSITIONS.length
    );
    this.activeBurnerFlares.fill(null);
    this.burnerFlareIntensities = [0, 0, 0, 0];
  }

  private triggerDueAutomaticFlares(): void {
    let remainingEvents = VOLUMETRIC_FIRE_FORGE_BURNER_WORLD_POSITIONS.length;
    while (
      this.simulationTimeSeconds >= this.flareSchedule.nextFlareTimeSeconds &&
      remainingEvents > 0
    ) {
      this.startBurnerFlare(
        this.flareSchedule.nextBurnerIndex,
        this.flareSchedule.nextIntensity,
        'automatic',
        this.flareSchedule.nextFlareTimeSeconds
      );
      this.flareSchedule = advanceVolumetricFireForgeFlareSchedule(
        this.flareSchedule,
        VOLUMETRIC_FIRE_FORGE_BURNER_WORLD_POSITIONS.length
      );
      remainingEvents--;
    }
  }

  private startBurnerFlare(
    burnerIndex: number,
    intensity: number,
    source: 'automatic' | 'clicked' | 'programmatic',
    startTimeSeconds = this.simulationTimeSeconds,
    panOverride?: number
  ): boolean {
    if (
      !Number.isInteger(burnerIndex) ||
      burnerIndex < 0 ||
      burnerIndex >= this.activeBurnerFlares.length ||
      !Number.isFinite(intensity) ||
      intensity <= 0
    ) {
      return false;
    }
    this.activeBurnerFlares[burnerIndex] = {startTimeSeconds, intensity};
    this.updateBurnerFlareIntensities();

    if (source !== 'programmatic') {
      const burnerPosition = VOLUMETRIC_FIRE_FORGE_BURNER_WORLD_POSITIONS[burnerIndex];
      const distance = Math.hypot(
        burnerPosition[0] - this.lastCameraPosition[0],
        burnerPosition[1] - this.lastCameraPosition[1],
        burnerPosition[2] - this.lastCameraPosition[2]
      );
      const soundOptions = {
        intensity,
        distance,
        pan: panOverride ?? this.getBurnerPan(burnerPosition)
      };
      if (source === 'clicked') {
        this.flareAudio.playClickedFlare(soundOptions);
      } else {
        this.flareAudio.playAutomaticFlare(soundOptions);
      }
    }
    return true;
  }

  private updateBurnerFlareIntensities(): void {
    const intensities = this.activeBurnerFlares.map(activeFlare => {
      if (!activeFlare) {
        return 0;
      }
      return (
        activeFlare.intensity *
        getVolumetricFireForgeFlareEnvelope(
          this.simulationTimeSeconds - activeFlare.startTimeSeconds
        )
      );
    });
    this.burnerFlareIntensities = [
      intensities[0] || 0,
      intensities[1] || 0,
      intensities[2] || 0,
      intensities[3] || 0
    ];
  }

  private getBurnerPan(position: readonly [number, number, number]): number {
    if (!this.lastViewProjectionMatrix) {
      return 0;
    }
    return (
      selectNearestVolumetricFireForgeBurner({
        pointerX: 0.5,
        pointerY: 0.5,
        viewportWidth: 1,
        viewportHeight: 1,
        viewProjectionMatrix: this.lastViewProjectionMatrix,
        burnerWorldPositions: [position],
        maximumDistancePixels: 2
      })?.normalizedDeviceX ?? 0
    );
  }

  private readonly handleSettingsChange = (nextSettings: Record<string, unknown>): void => {
    const previousSettings = this.settings;
    this.settings = {...this.settings, ...(nextSettings as VolumetricFireForgeSettings)};
    if (previousSettings.quality !== this.settings.quality && !this.simulationDimensionsOverride) {
      this.rebuildSimulation();
    }
    if (previousSettings.preset !== this.settings.preset) {
      this.requestReset();
    }
  };

  private readonly handleReset = (): void => this.requestReset();
  private readonly handleSingleStep = (): void => this.requestSingleStep();
  private readonly handleResetCamera = (): void => {
    this.orbitControls?.reset();
    this.previousCameraTimeMilliseconds = null;
    this.cameraOrbitDirection = 1;
  };

  private readonly handleCanvasPointerDown = (event: PointerEvent): void => {
    if (event.button !== 0 || !event.isPrimary) {
      return;
    }
    void this.flareAudio.arm();
    this.pointerStart = {
      pointerId: event.pointerId,
      clientX: event.clientX,
      clientY: event.clientY
    };
  };

  private readonly handleCanvasPointerUp = (event: PointerEvent): void => {
    const pointerStart = this.pointerStart;
    this.pointerStart = null;
    if (
      !pointerStart ||
      pointerStart.pointerId !== event.pointerId ||
      !this.canvas ||
      !this.lastViewProjectionMatrix
    ) {
      return;
    }
    const movement = Math.hypot(
      event.clientX - pointerStart.clientX,
      event.clientY - pointerStart.clientY
    );
    if (movement > CLICK_MOVEMENT_THRESHOLD_PIXELS) {
      return;
    }
    const canvasBounds = this.canvas.getBoundingClientRect();
    const projection = selectNearestVolumetricFireForgeBurner({
      pointerX: event.clientX - canvasBounds.left,
      pointerY: event.clientY - canvasBounds.top,
      viewportWidth: canvasBounds.width,
      viewportHeight: canvasBounds.height,
      viewProjectionMatrix: this.lastViewProjectionMatrix,
      burnerWorldPositions: VOLUMETRIC_FIRE_FORGE_BURNER_WORLD_POSITIONS,
      maximumDistancePixels: CLICK_BURNER_RADIUS_PIXELS
    });
    if (projection) {
      this.startBurnerFlare(
        projection.burnerIndex,
        CLICKED_FLARE_INTENSITY,
        'clicked',
        this.simulationTimeSeconds,
        projection.normalizedDeviceX
      );
    }
  };

  private readonly handleCanvasPointerCancel = (): void => {
    this.pointerStart = null;
  };

  private readonly handleToggleSound = (): void => {
    this.flareAudio.setMuted(!this.flareAudio.muted);
    if (!this.flareAudio.muted) {
      void this.flareAudio.arm();
    }
    this.userInterface.updateSoundButton(this.flareAudio.muted);
  };
}
