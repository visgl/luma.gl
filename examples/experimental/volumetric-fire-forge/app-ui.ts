// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {SettingsChangeDescriptor, SettingsSchema} from '@deck.gl-community/panels';
import {
  ExamplePanelManager,
  ExampleSettingsPanelManager,
  makeExamplePanelHostHtml,
  makeExampleTabbedPanel,
  makeHtmlCustomPanel
} from '../../example-panels';
import type {VolumetricFireForgeRenderSettings} from './volumetric-fire-forge-renderer';
import {VOLUMETRIC_FIRE_FORGE_PRESETS} from './volumetric-fire-forge-scene';
import {VOLUMETRIC_FIRE_DEBUG_VIEWS} from './volumetric-fire-forge-shaders';

export const VOLUMETRIC_FIRE_FORGE_INFO_HTML = makeExamplePanelHostHtml();

export type VolumetricFireQuality = 'Interactive' | 'High' | 'Cinematic';

export const VOLUMETRIC_FIRE_QUALITY_DIMENSIONS: Record<
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
  emissionStrength: 3.2,
  smokeScattering: 0.9,
  shadowStrength: 0.74,
  exposure: 0.88,
  bloomThreshold: 0.7,
  bloomIntensity: 0.76,
  bloomRadius: 12
};

type VolumetricFireForgeUserInterfaceProps = {
  preferredColorFormat: string;
  settings: VolumetricFireForgeSettings;
  onSettingsChange: (
    settings: Record<string, unknown>,
    changedSettings?: SettingsChangeDescriptor[]
  ) => void;
  onReset: () => void;
  onSingleStep: () => void;
  onResetCamera: () => void;
  onToggleSound: () => void;
  onArmAudio: () => void;
};

type VolumetricFireForgeTelemetry = {
  dimensions: readonly number[];
  stepsThisFrame: number;
  graphNodeCount: number;
  sceneColorFormat: string;
  secondsUntilNextFlare: number;
};

/** Owns the panels and document-level controls for the fire forge. */
export class VolumetricFireForgeUserInterface {
  readonly settingsPanel: ExampleSettingsPanelManager;
  readonly panels: ExamplePanelManager;

  private readonly props: VolumetricFireForgeUserInterfaceProps;
  private resetButton: HTMLElement | null = null;
  private singleStepButton: HTMLElement | null = null;
  private resetCameraButton: HTMLElement | null = null;
  private soundButton: HTMLElement | null = null;

  constructor(props: VolumetricFireForgeUserInterfaceProps) {
    this.props = props;
    this.settingsPanel = new ExampleSettingsPanelManager({
      id: 'volumetric-fire-forge-settings',
      schema: makeVolumetricFireForgeSettingsSchema(),
      settings: props.settings,
      sectionPresentation: 'accordion',
      onSettingsChange: props.onSettingsChange
    });
    this.panels = new ExamplePanelManager({panel: this.makePanel()});
  }

  mount(): void {
    this.panels.mount();
  }

  initialize(): void {
    this.resetButton = document.getElementById('volumetric-fire-reset');
    this.singleStepButton = document.getElementById('volumetric-fire-single-step');
    this.resetCameraButton = document.getElementById('volumetric-fire-reset-camera');
    this.soundButton = document.getElementById('volumetric-fire-toggle-sound');
    document.addEventListener('keydown', this.handleKeyDown);
    this.resetButton?.addEventListener('click', this.props.onReset);
    this.singleStepButton?.addEventListener('click', this.props.onSingleStep);
    this.resetCameraButton?.addEventListener('click', this.props.onResetCamera);
    this.soundButton?.addEventListener('click', this.props.onToggleSound);
  }

  finalize(): void {
    document.removeEventListener('keydown', this.handleKeyDown);
    this.resetButton?.removeEventListener('click', this.props.onReset);
    this.singleStepButton?.removeEventListener('click', this.props.onSingleStep);
    this.resetCameraButton?.removeEventListener('click', this.props.onResetCamera);
    this.soundButton?.removeEventListener('click', this.props.onToggleSound);
    this.resetButton = null;
    this.singleStepButton = null;
    this.resetCameraButton = null;
    this.soundButton = null;
    this.settingsPanel.finalize();
    this.panels.finalize();
  }

  updateSoundButton(muted: boolean): void {
    if (!this.soundButton) return;
    this.soundButton.textContent = muted ? 'Unmute sound' : 'Mute sound';
    this.soundButton.setAttribute('aria-pressed', String(muted));
  }

  updateTelemetry(telemetry: VolumetricFireForgeTelemetry): void {
    const telemetryElement = document.getElementById('volumetric-fire-telemetry');
    if (!telemetryElement) return;
    const voxelCount = telemetry.dimensions.reduce((product, dimension) => product * dimension, 1);
    telemetryElement.textContent =
      `${telemetry.dimensions.join(' × ')} · ${voxelCount.toLocaleString()} voxels · ` +
      `${telemetry.stepsThisFrame} solver step${telemetry.stepsThisFrame === 1 ? '' : 's'} · ` +
      `${telemetry.graphNodeCount} GPU nodes · ${telemetry.sceneColorFormat} · ` +
      `next flare ${Math.max(telemetry.secondsUntilNextFlare, 0).toFixed(1)} s`;
  }

  private makePanel() {
    return makeExampleTabbedPanel({
      id: 'volumetric-fire-forge-tabs',
      title: `Volumetric Fire Forge${this.props.preferredColorFormat === 'rgba16float' ? ' · HDR' : ''}`,
      panels: [
        makeHtmlCustomPanel({
          id: 'volumetric-fire-forge-overview',
          title: 'Overview',
          html: `
            <p><b>Reactive fire, not a flipbook.</b> WebGPU evolves velocity, pressure, fuel, heat, and smoke in a solid-aware 3D volume. A depth-clipped ray marcher turns the live fields into heat-shaped HDR emission, Beer-Lambert extinction, self-shadowed smoke, and bloom.</p>
            <p>Click a flame for an individual HDR flare and low combustion whoomph; drag to orbit. Automatic flares follow a repeatable irregular schedule. Inspect density, temperature, fuel, age, velocity, obstacles, and transmittance without a GPU readback.</p>
            <p><button id="volumetric-fire-reset">Reset fire</button> <button id="volumetric-fire-single-step">Single step</button> <button id="volumetric-fire-reset-camera">Reset camera</button> <button id="volumetric-fire-toggle-sound" aria-pressed="false">Mute sound</button></p>
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

  private readonly handleKeyDown = (): void => {
    this.props.onArmAudio();
  };
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
