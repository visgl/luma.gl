// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import {AnimationLoopTemplate, OrbitControls, type AnimationProps} from '@luma.gl/engine';
import {
  ExamplePanelManager,
  makeExamplePanelHostHtml,
  makeHtmlCustomPanel
} from '../../example-panels';
import {VectorFieldEngine} from './vector-field-engine';
import {
  getVectorFieldPreset,
  VECTOR_FIELD_PRESETS,
  type VectorFieldPreset
} from './vector-field-presets';
import {VectorFieldRenderer} from './vector-field-renderer';
import {
  bindVectorFieldControls,
  getVectorFieldOverlayElements,
  getVectorFieldOverlayHtml,
  makeVectorFieldControlsHtml,
  type VectorFieldOverlayElements,
  updateVectorFieldOverlay,
  updateVectorFieldPanelLabels
} from './app-ui';

export const title = 'Vector Field Lab';
export const description =
  'Orbit linked 3D volumes for a field and its GPU-computed gradient, divergence, curl, and Laplacian.';

type VectorFieldLabProps = AnimationProps & {resolution?: number};
const DEFAULT_PRESET_INDEX = 3;

/** Interactive differential-operator showcase backed by one graph-native compute pipeline. */
export default class VectorFieldLabAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = `${makeExamplePanelHostHtml()}${getVectorFieldOverlayHtml()}`;
  static props = {debug: true};

  readonly device: Device;
  readonly engine: VectorFieldEngine;
  readonly renderer: VectorFieldRenderer;
  readonly panels: ExamplePanelManager;

  private preset: VectorFieldPreset = VECTOR_FIELD_PRESETS[DEFAULT_PRESET_INDEX];
  private playing = true;
  private orbitControls: OrbitControls | null = null;
  private overlayElements: VectorFieldOverlayElements = {formula: null, probe: null};
  private animationSeconds = 0;
  private previousFrameTime: number | null = null;
  private finalized = false;

  constructor({device, resolution = 40}: VectorFieldLabProps) {
    super();
    if (device.type !== 'webgpu') throw new Error('Vector Field Lab requires WebGPU.');
    this.device = device;
    this.engine = new VectorFieldEngine(device, resolution);
    this.renderer = new VectorFieldRenderer(device, this.engine.buffers, resolution);
    this.panels = new ExamplePanelManager({
      panel: makeHtmlCustomPanel({
        id: 'vector-field-lab-controls',
        title: 'Vector Field Lab',
        html: makeVectorFieldControlsHtml({
          defaultPresetIndex: DEFAULT_PRESET_INDEX,
          graphNodeCount: this.engine.graph.stats.nodeOrder.length,
          presets: VECTOR_FIELD_PRESETS,
          resolution: this.engine.resolution
        }),
        onRender: root => this.attachControls(root)
      })
    });
    this.panels.mount();
  }

  override async onInitialize({canvas}: AnimationProps): Promise<void> {
    if (canvas instanceof HTMLCanvasElement) {
      this.orbitControls = new OrbitControls(canvas, {
        target: [0, 0, 0],
        distance: 4.3,
        yaw: 0.68,
        pitch: 0.38,
        minDistance: 2.35,
        maxDistance: 7,
        minPitch: -1.35,
        maxPitch: 1.35,
        autoRotate: true,
        autoRotateSpeed: 0.1,
        onInteractionStart: () => this.orbitControls?.setAutoRotate(false)
      });
    }
    this.overlayElements = getVectorFieldOverlayElements();
    this.updateOverlay(0);
  }

  override onRender({time}: AnimationProps): void {
    this.orbitControls?.update(time);
    if (this.previousFrameTime !== null && this.playing) {
      this.animationSeconds += Math.max(0, time - this.previousFrameTime) * 0.001;
    }
    this.previousFrameTime = time;
    const seconds = this.animationSeconds;
    this.engine.update(this.preset, seconds);
    this.renderer.render({
      scalarMode: this.preset.kind === 'scalar',
      eye: this.orbitControls?.getEyePosition() ?? [2.5, 1.6, 3.1]
    });
    this.updateOverlay(seconds);
  }

  override onFinalize(): void {
    if (this.finalized) return;
    this.finalized = true;
    this.orbitControls?.destroy();
    this.panels.finalize();
    this.renderer.destroy();
    this.engine.destroy();
  }

  private attachControls(root: HTMLElement): void {
    bindVectorFieldControls(root, {
      onPresetChange: presetId => {
        this.preset = getVectorFieldPreset(presetId);
        this.animationSeconds = 0;
        this.engine.update(this.preset, 0, true);
        this.updatePanelLabels();
      },
      onPlayingChange: playing => {
        this.playing = playing;
      },
      onCenter: () => {
        this.orbitControls?.reset();
        this.orbitControls?.setAutoRotate(true);
      }
    });
    this.updatePanelLabels();
  }

  private updatePanelLabels(): void {
    updateVectorFieldPanelLabels(this.preset);
  }

  private updateOverlay(time: number): void {
    updateVectorFieldOverlay(this.overlayElements, this.preset, time);
  }
}
