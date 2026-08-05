// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {PanelSelect, type PanelSelectOption} from '@deck.gl-community/panels';
import {makeGPUSplatDataFromArrowStream} from '@luma.gl/arrow';
import type {Device} from '@luma.gl/core';
import {AnimationLoopTemplate, type AnimationProps} from '@luma.gl/engine';
import {
  GPUCommandGraphInspector,
  OrbitControls,
  type GPUCommandGraphInspectorGraph
} from '@luma.gl/experimental';
import {
  GPUSplatGraphRenderer,
  makeGPUSplatData,
  SplatRenderer,
  type GPUSplatData,
  type SplatRendererProps,
  type SplatSortMode
} from '@luma.gl/splats';
import {Matrix4} from '@math.gl/core';
import {h, render} from 'preact';
import {GPUCommandGraphInspectorPanel} from '../../gpu-command-graph-inspector-panel';
import {
  GAUSSIAN_SPLAT_BATCH_COUNT,
  GAUSSIAN_SPLATS_PER_BATCH,
  makeGaussianSplatSource
} from './gaussian-splat-scene';
import {
  GAUSSIAN_SPLAT_SOURCE_CATALOG,
  getLocalGaussianSplatLoadersConfiguration,
  loadLocalGaussianSplatArrowSources,
  type LocalGaussianSplatLoadProgress,
  type LocalGaussianSplatLoadersConfiguration
} from './local-loaders';

export const title = 'Gaussian Splats';
export const description =
  'Progressively streamed Gaussian splats with a WebGPU command graph and a WebGL2 fallback.';

const BATCH_INTERVAL_MILLISECONDS = 750;
const CLEAR_COLOR: [number, number, number, number] = [0.012, 0.016, 0.042, 1];
const INITIAL_CAMERA_DISTANCE = 7.8;
const INITIAL_CAMERA_YAW = (25 * Math.PI) / 180;
const INITIAL_CAMERA_PITCH = 0.3;
const REAL_SCENE_CAMERA_PITCH = (56 * Math.PI) / 180;
const CAMERA_FIELD_OF_VIEW = (50 * Math.PI) / 180;
const MAXIMUM_CAMERA_BOUND_SAMPLES = 8192;
const SPLAT_SORT_OPTIONS: readonly PanelSelectOption[] = [
  {value: 'global', label: 'Global depth sort'},
  {value: 'tile', label: 'Per-tile depth sort'},
  {value: 'none', label: 'Source order'}
];
const SPLAT_EXECUTION_OPTIONS: readonly PanelSelectOption[] = [
  {value: 'graph', label: 'WebGPU command graph'},
  {value: 'cpu', label: 'CPU depth ordering'}
];

/** Execution path resolved from the current backend and optional comparison override. */
export type GaussianSplatExecutionMode = 'graph' | 'cpu';

type GaussianSplatCameraState = {
  yaw: number;
  pitch: number;
  distance: number;
  target: readonly [number, number, number];
  viewportWidth: number;
  viewportHeight: number;
};

type GaussianSplatCameraFrame = {
  up: [number, number, number];
  forward: [number, number, number];
  right: [number, number, number];
};

/** Shared controls rendered inside both the website InfoBox and the standalone showcase. */
export function makeGaussianSplatInfoHtml(): string {
  return `
<section data-gaussian-splats-panel style="display:grid;gap:13px;min-width:248px;max-width:310px">
  <div data-gaussian-splats-description style="font-size:12px;line-height:1.55;opacity:.8">
    Four independent GPU batches reveal a chromatic observatory of rotated, anisotropic Gaussians.
    Drag to orbit; scroll to zoom.
  </div>
  <div style="display:flex;justify-content:space-between;font-size:12px">
    <span>Visible splats</span><strong data-gaussian-splats-count>0 / 0</strong>
  </div>
  <div style="display:flex;justify-content:space-between;font-size:12px">
    <span>Source batches</span><strong data-gaussian-splats-batches>0 / ${GAUSSIAN_SPLAT_BATCH_COUNT}</strong>
  </div>
  <div style="display:flex;justify-content:space-between;font-size:12px">
    <span>Backend</span><strong data-gaussian-splats-backend>Detecting…</strong>
  </div>
  <div style="display:flex;justify-content:space-between;font-size:12px">
    <span>Pipeline</span><strong data-gaussian-splats-pipeline>Preparing…</strong>
  </div>
  <div data-gaussian-splats-pipeline-error hidden role="status" style="font-size:11px;line-height:1.45;color:#ffd08a"></div>
  <div style="display:flex;justify-content:space-between;font-size:12px">
    <span>Source</span><strong data-gaussian-splats-source>Synthetic</strong>
  </div>
  <label data-gaussian-splats-execution-control hidden style="gap:5px;font-size:12px">
    <span>Execution pipeline</span>
    <div data-gaussian-splats-execution></div>
  </label>
  <label data-gaussian-splats-scene-control hidden style="gap:5px;font-size:12px">
    <span>Gaussian splat scene</span>
    <div data-gaussian-splats-scene></div>
  </label>
  <div data-gaussian-splats-progress hidden aria-live="polite" style="gap:5px;font-size:12px">
    <strong data-gaussian-splats-progress-status>Preparing scene…</strong>
    <div style="display:flex;align-items:center;gap:7px">
      <progress data-gaussian-splats-progress-bar max="1" style="flex:1;min-width:0;height:8px"></progress>
      <span data-gaussian-splats-progress-complete hidden aria-hidden="true" style="color:#82e5ad;font-size:12px;line-height:1">✓</span>
    </div>
    <span data-gaussian-splats-progress-detail style="opacity:.75"></span>
  </div>
  <div data-gaussian-splats-load-error hidden role="alert" style="font-size:12px;line-height:1.45;color:#ff9ba5"></div>
  <label style="display:grid;gap:5px;font-size:12px">
    <span>Transparency ordering</span>
    <div data-gaussian-splats-sort></div>
  </label>
  <label style="display:grid;gap:5px;font-size:12px">
    <span>Gaussian radius <strong data-gaussian-splats-radius-value>1.35×</strong></span>
    <input data-gaussian-splats-radius type="range" min="0.4" max="2.8" step="0.05" value="1.35" />
  </label>
  <label style="display:grid;gap:5px;font-size:12px">
    <span>Opacity <strong data-gaussian-splats-opacity-value>90%</strong></span>
    <input data-gaussian-splats-opacity type="range" min="0.15" max="1.5" step="0.05" value="0.9" />
  </label>
  <label style="display:flex;align-items:center;gap:8px;font-size:12px">
    <input data-gaussian-splats-orbit type="checkbox" checked /> Cinematic orbit
  </label>
  <details data-gaussian-splats-graph-details hidden style="font-size:12px">
    <summary style="cursor:pointer">GPU graph inspector</summary>
    <div data-gaussian-splats-graph-inspector style="margin-top:9px"></div>
  </details>
</section>`;
}

/** Uses GPU graph execution only on WebGPU unless the explicit CPU comparison is requested. */
export function getGaussianSplatExecutionMode(
  deviceType: Device['type'],
  locationSearch = ''
): GaussianSplatExecutionMode {
  return deviceType === 'webgpu' && new URLSearchParams(locationSearch).get('renderer') !== 'cpu'
    ? 'graph'
    : 'cpu';
}

export default class GaussianSplatsAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = makeGaussianSplatInfoHtml();
  static props = {useDevicePixels: true};

  readonly device: Device;
  renderer: SplatRenderer | GPUSplatGraphRenderer;
  readonly batches: GPUSplatData[];

  private readonly executionMode: GaussianSplatExecutionMode;
  private readonly graphInspector: GPUCommandGraphInspector | undefined;
  private inspectedGraph: GPUCommandGraphInspectorGraph | undefined;
  private readonly graphInspectorPanels: GPUCommandGraphInspectorPanel[] = [];
  private graphFallbackReason: string | undefined;
  private readonly localLoadersConfiguration: LocalGaussianSplatLoadersConfiguration | undefined;
  private canvas: HTMLCanvasElement | null = null;
  private controlDisposers: Array<() => void> = [];
  private sourceBatchIndex = 1;
  private frameIndex = 0;
  private startTimeMilliseconds: number | null = null;
  private cameraTarget: [number, number, number] = [0, 0, 0];
  private readonly cameraFrame: GaussianSplatCameraFrame;
  private cameraSceneRadius = INITIAL_CAMERA_DISTANCE / 2;
  private cameraHomeDistance = INITIAL_CAMERA_DISTANCE;
  private cameraHomeYaw = INITIAL_CAMERA_YAW;
  private cameraHomePitch = INITIAL_CAMERA_PITCH;
  private hasManualCameraInteraction = false;
  private needsRedraw = true;
  private previousCameraState: GaussianSplatCameraState | undefined;
  private expectedSplatCount = GAUSSIAN_SPLAT_BATCH_COUNT * GAUSSIAN_SPLATS_PER_BATCH;
  private expectedBatchCount = GAUSSIAN_SPLAT_BATCH_COUNT;
  private loadedSplatCount = 0;
  private autoOrbit = true;
  private orbitControls: OrbitControls | null = null;
  private loadAbortController: AbortController | null = null;
  private loadingProgress: LocalGaussianSplatLoadProgress | undefined;
  private loadingError: string | undefined;
  private isLoading = false;
  private isFinalized = false;

  constructor({device, width, height}: AnimationProps) {
    super();
    this.device = device;
    this.executionMode = getGaussianSplatExecutionMode(
      device.type,
      typeof window === 'undefined' ? '' : window.location.search
    );
    this.graphInspector =
      this.executionMode === 'graph'
        ? new GPUCommandGraphInspector({
            maxSamples: 60,
            getNodeGroup: node => {
              if (node.id.includes('project')) return 'project';
              if (node.id.includes('sort') || node.id.includes('radix')) return 'sort';
              return node.type;
            }
          })
        : undefined;
    this.localLoadersConfiguration = getLocalGaussianSplatLoadersConfiguration();
    this.cameraFrame = makeGaussianSplatCameraFrame(
      this.localLoadersConfiguration?.up ?? [0, 1, 0]
    );
    if (this.localLoadersConfiguration?.upAxis === 'y') {
      this.cameraHomePitch = REAL_SCENE_CAMERA_PITCH;
    }
    if (this.localLoadersConfiguration?.camera) {
      const {position, target} = this.localLoadersConfiguration.camera;
      this.cameraTarget = [...target];
      const cameraOffset: [number, number, number] = [
        position[0] - target[0],
        position[1] - target[1],
        position[2] - target[2]
      ];
      this.cameraHomeDistance = Math.hypot(...cameraOffset);
      this.cameraHomeYaw = Math.atan2(
        dotGaussianSplatVectors(cameraOffset, this.cameraFrame.right),
        dotGaussianSplatVectors(cameraOffset, this.cameraFrame.forward)
      );
      this.cameraHomePitch = Math.asin(
        clamp(
          dotGaussianSplatVectors(cameraOffset, this.cameraFrame.up) / this.cameraHomeDistance,
          -1,
          1
        )
      );
    }
    const firstBatch = this.localLoadersConfiguration
      ? undefined
      : makeGPUSplatData(device, makeGaussianSplatSource(0));
    this.batches = firstBatch ? [firstBatch] : [];
    this.loadedSplatCount = firstBatch?.length ?? 0;
    if (this.localLoadersConfiguration) {
      this.expectedSplatCount = this.localLoadersConfiguration.expectedSplatCount ?? 0;
      this.expectedBatchCount = this.localLoadersConfiguration.expectedBatchCount ?? 0;
      this.autoOrbit = false;
      this.isLoading = true;
    }
    const rendererProps: SplatRendererProps = {
      data: firstBatch,
      viewportSize: [Math.max(width, 1), Math.max(height, 1)],
      sortMode: 'global',
      radiusScale: 1.35,
      alphaScale: 0.9,
      alphaCutoff: 1 / 255,
      gaussianSupportRadius: 3,
      kernel2DSize: 0.35
    };
    // Captured scenes keep the existing progressive preview until all source batches arrive.
    // Compiling the immutable full-scene graph once avoids rebuilding it for every Arrow batch.
    this.renderer =
      this.executionMode === 'graph' && !this.localLoadersConfiguration
        ? new GPUSplatGraphRenderer(device, {...rendererProps, clearColor: CLEAR_COLOR})
        : new SplatRenderer(device, rendererProps);
  }

  override async onInitialize({canvas}: AnimationProps): Promise<void> {
    if (typeof HTMLCanvasElement === 'undefined' || !(canvas instanceof HTMLCanvasElement)) {
      return;
    }

    this.canvas = canvas;
    this.orbitControls = new OrbitControls(canvas, {
      target: this.cameraTarget,
      yaw: this.cameraHomeYaw,
      pitch: this.cameraHomePitch,
      distance: this.cameraHomeDistance,
      minDistance: 2.1,
      maxDistance: 15,
      minPitch: -1.32,
      maxPitch: 1.32,
      rotateSpeed: -0.006,
      pitchSpeed: -0.005,
      autoRotate: this.autoOrbit,
      autoRotateSpeed: 0.12,
      onInteractionStart: this.handleCameraInteraction
    });
    canvas.setAttribute('aria-label', 'Interactive 3D Gaussian splat observatory');
    canvas.addEventListener('dblclick', this.handleDoubleClick);

    for (const panel of document.querySelectorAll<HTMLElement>('[data-gaussian-splats-panel]')) {
      this.installPanelControls(panel);
    }
    this.updatePanel();

    if (this.localLoadersConfiguration) {
      void this.loadLocalSplatData(this.localLoadersConfiguration).catch(error => {
        if (this.isFinalized || isAbortError(error)) {
          return;
        }
        this.isLoading = false;
        this.loadingError =
          error instanceof Error ? error.message : 'Unable to load the Gaussian splat scene.';
        this.updatePanel();
      });
    }
  }

  override onRender({device, width, height, time}: AnimationProps): void {
    this.startTimeMilliseconds ??= time;
    const elapsedTimeMilliseconds = Math.max(time - this.startTimeMilliseconds, 0);
    const requestedBatchCount = Math.min(
      GAUSSIAN_SPLAT_BATCH_COUNT,
      Math.floor(elapsedTimeMilliseconds / BATCH_INTERVAL_MILLISECONDS) + 1
    );

    if (!this.localLoadersConfiguration) {
      while (this.sourceBatchIndex < requestedBatchCount) {
        const nextBatch = makeGPUSplatData(device, makeGaussianSplatSource(this.sourceBatchIndex));
        this.batches.push(nextBatch);
        this.renderer.appendData(nextBatch);
        this.requestRedraw();
        this.loadedSplatCount += nextBatch.length;
        this.sourceBatchIndex++;
        this.updatePanel();
      }
    }

    this.orbitControls?.update(time);
    const cameraYaw = this.orbitControls?.yaw ?? this.cameraHomeYaw;
    const cameraPitch =
      (this.orbitControls?.pitch ?? this.cameraHomePitch) +
      (this.autoOrbit ? Math.sin(elapsedTimeMilliseconds * 0.00022) * 0.11 : 0);
    const cameraDistance = this.orbitControls?.distance ?? this.cameraHomeDistance;
    const cameraState: GaussianSplatCameraState = {
      yaw: cameraYaw,
      pitch: cameraPitch,
      distance: cameraDistance,
      target: this.cameraTarget,
      viewportWidth: Math.max(width, 1),
      viewportHeight: Math.max(height, 1)
    };
    if (!hasSameCameraState(cameraState, this.previousCameraState)) {
      this.updateRendererCamera(cameraState);
      this.previousCameraState = {...cameraState, target: [...cameraState.target]};
      this.requestRedraw();
    }

    if (!this.needsRedraw && !this.autoOrbit) {
      return;
    }

    let graphChanged = false;
    const activeRenderer = this.renderer;
    if (activeRenderer instanceof GPUSplatGraphRenderer) {
      try {
        const encoding = activeRenderer.encode(device.commandEncoder);
        if (!encoding) {
          this.needsRedraw = false;
          return;
        }
        const compiledGraph = activeRenderer.compiledGraph;
        if (compiledGraph && this.graphInspector) {
          if (this.inspectedGraph !== compiledGraph) {
            this.graphInspector.registerGraph(compiledGraph);
            this.inspectedGraph = compiledGraph;
            graphChanged = true;
          }
          this.graphInspector.recordEncoding(compiledGraph.id, encoding);
        }
      } catch (error) {
        this.activateCpuRendererFallback(error);
      }
    }
    if (this.renderer instanceof SplatRenderer) {
      this.renderer.predraw(device.commandEncoder);
      const renderPass = device.beginRenderPass({clearColor: CLEAR_COLOR, clearDepth: 1});
      this.renderer.draw(renderPass);
      renderPass.end();
    }
    this.needsRedraw = false;

    this.frameIndex++;
    if (graphChanged || this.frameIndex % 20 === 0) {
      this.updatePanel();
    }
  }

  override onFinalize(): void {
    this.isFinalized = true;
    this.loadAbortController?.abort();
    this.loadAbortController = null;
    if (this.canvas) {
      this.canvas.removeEventListener('dblclick', this.handleDoubleClick);
      this.orbitControls?.destroy();
      this.orbitControls = null;
      this.canvas = null;
    }

    for (const dispose of this.controlDisposers) {
      dispose();
    }
    this.controlDisposers = [];

    // Rendering resources borrow the caller-owned source batches.
    this.renderer.destroy();
    for (const batch of this.batches) {
      batch.destroy();
    }
  }

  private async loadLocalSplatData(
    configuration: LocalGaussianSplatLoadersConfiguration
  ): Promise<void> {
    this.loadAbortController = new AbortController();
    const source = loadLocalGaussianSplatArrowSources(configuration, {
      signal: this.loadAbortController.signal,
      onProgress: progress => {
        if (this.isFinalized) {
          return;
        }
        this.loadingProgress = progress;
        this.expectedSplatCount = progress.expectedSplatCount ?? this.expectedSplatCount;
        this.updatePanel();
      }
    });

    for await (const batch of makeGPUSplatDataFromArrowStream(this.device, source)) {
      if (this.isFinalized || this.loadAbortController.signal.aborted) {
        batch.destroy();
        break;
      }

      this.batches.push(batch);
      this.loadedSplatCount += batch.length;
      this.expectedSplatCount = Math.max(this.expectedSplatCount, this.loadedSplatCount);
      this.renderer.appendData(batch);
      this.requestRedraw();
      if (this.batches.length === 1 && !this.hasManualCameraInteraction) {
        this.fitCameraToBatches();
      }
      this.updatePanel();
      if (
        this.executionMode !== 'graph' ||
        !this.expectedSplatCount ||
        this.loadedSplatCount < this.expectedSplatCount
      ) {
        await waitForNextAnimationFrame();
      }
    }

    if (this.isFinalized || this.loadAbortController.signal.aborted) {
      return;
    }
    if (this.batches.length === 0) {
      throw new Error('The local Gaussian splat source does not contain any records.');
    }

    if (this.batches.length > 1 && !this.hasManualCameraInteraction) {
      this.fitCameraToBatches();
    }
    this.isLoading = false;
    this.expectedBatchCount = this.batches.length;
    this.expectedSplatCount = this.loadedSplatCount;
    if (this.executionMode === 'graph') {
      this.activateGraphRenderer();
    }
    this.updatePanel();
  }

  /** Replaces the progressive CPU preview without changing caller-owned Arrow source batches. */
  private activateGraphRenderer(): void {
    if (this.renderer instanceof GPUSplatGraphRenderer) {
      return;
    }
    const previousRenderer = this.renderer;
    const graphRenderer = new GPUSplatGraphRenderer(this.device, {
      ...previousRenderer.props,
      data: this.batches,
      clearColor: CLEAR_COLOR
    });
    this.renderer = graphRenderer;
    previousRenderer.destroy();
    this.requestRedraw();
  }

  /** Keeps a captured scene usable when the selected WebGPU adapter cannot compile its graph. */
  private activateCpuRendererFallback(error: unknown): void {
    if (!(this.renderer instanceof GPUSplatGraphRenderer)) {
      return;
    }
    const previousRenderer = this.renderer;
    this.renderer = new SplatRenderer(this.device, {
      ...previousRenderer.props,
      data: this.batches
    });
    previousRenderer.destroy();
    this.inspectedGraph = undefined;
    this.graphInspector?.clear();
    this.graphFallbackReason =
      error instanceof Error ? error.message : 'The selected adapter cannot run the GPU graph.';
    this.updatePanel();
  }

  private updateRendererCamera(cameraState: GaussianSplatCameraState): void {
    const cosinePitch = Math.cos(cameraState.pitch);
    const horizontalDistance = cosinePitch * cameraState.distance;
    const forwardDistance = Math.cos(cameraState.yaw) * horizontalDistance;
    const rightDistance = Math.sin(cameraState.yaw) * horizontalDistance;
    const upwardDistance = Math.sin(cameraState.pitch) * cameraState.distance;
    const cameraPosition: [number, number, number] = [
      cameraState.target[0] +
        this.cameraFrame.forward[0] * forwardDistance +
        this.cameraFrame.right[0] * rightDistance +
        this.cameraFrame.up[0] * upwardDistance,
      cameraState.target[1] +
        this.cameraFrame.forward[1] * forwardDistance +
        this.cameraFrame.right[1] * rightDistance +
        this.cameraFrame.up[1] * upwardDistance,
      cameraState.target[2] +
        this.cameraFrame.forward[2] * forwardDistance +
        this.cameraFrame.right[2] * rightDistance +
        this.cameraFrame.up[2] * upwardDistance
    ];
    const near = this.localLoadersConfiguration
      ? Math.max(Math.min(cameraState.distance * 0.02, this.cameraSceneRadius * 0.05), 0.001)
      : 0.1;
    const far = this.localLoadersConfiguration
      ? Math.max(cameraState.distance + this.cameraSceneRadius * 12, near * 100)
      : 80;
    const projectionMatrix = new Matrix4().perspective({
      fovy: CAMERA_FIELD_OF_VIEW,
      aspect: cameraState.viewportWidth / cameraState.viewportHeight,
      near,
      far
    });
    const viewMatrix = new Matrix4().lookAt({
      eye: cameraPosition,
      center: cameraState.target,
      up: this.cameraFrame.up
    });
    const modelViewProjectionMatrix = new Matrix4(projectionMatrix).multiplyRight(viewMatrix);
    this.renderer.setProps({
      modelViewProjectionMatrix,
      viewportSize: [cameraState.viewportWidth, cameraState.viewportHeight]
    });
  }

  private fitCameraToBatches(): void {
    if (this.loadedSplatCount === 0) {
      return;
    }

    const sampleStride = Math.max(
      1,
      Math.ceil(this.loadedSplatCount / MAXIMUM_CAMERA_BOUND_SAMPLES)
    );
    const sampledCoordinates: [number[], number[], number[]] = [[], [], []];
    for (const batch of this.batches) {
      const positions = batch.source.positions;
      for (
        let positionIndex = 0;
        positionIndex < positions.length;
        positionIndex += sampleStride * 3
      ) {
        const positionX = positions[positionIndex];
        const positionY = positions[positionIndex + 1];
        const positionZ = positions[positionIndex + 2];
        if (
          Number.isFinite(positionX) &&
          Number.isFinite(positionY) &&
          Number.isFinite(positionZ)
        ) {
          sampledCoordinates[0].push(positionX);
          sampledCoordinates[1].push(positionY);
          sampledCoordinates[2].push(positionZ);
        }
      }
    }

    if (sampledCoordinates[0].length === 0) {
      return;
    }

    const center: [number, number, number] = [0, 0, 0];
    const extents: [number, number, number] = [0, 0, 0];
    const cameraBoundPercentile =
      this.localLoadersConfiguration &&
      this.localLoadersConfiguration.sceneId !== 'custom' &&
      !this.localLoadersConfiguration.camera
        ? 0.1
        : 0.02;
    for (let axisIndex = 0; axisIndex < 3; axisIndex++) {
      const coordinates = sampledCoordinates[axisIndex];
      coordinates.sort((left, right) => left - right);
      const lowerIndex = Math.floor((coordinates.length - 1) * cameraBoundPercentile);
      const upperIndex = Math.ceil((coordinates.length - 1) * (1 - cameraBoundPercentile));
      const minimum = coordinates[lowerIndex];
      const maximum = coordinates[upperIndex];
      center[axisIndex] = coordinates[Math.floor((coordinates.length - 1) / 2)];
      extents[axisIndex] = Math.max(maximum - minimum, 0);
    }

    this.cameraTarget = this.localLoadersConfiguration?.camera
      ? [...this.localLoadersConfiguration.camera.target]
      : center;
    this.cameraSceneRadius = Math.max(Math.hypot(...extents) / 2, 0.05);
    const fittedDistance = this.localLoadersConfiguration?.camera
      ? Math.hypot(
          ...this.localLoadersConfiguration.camera.position.map(
            (coordinate, axisIndex) => coordinate - this.cameraTarget[axisIndex]
          )
        )
      : Math.max(
          (this.cameraSceneRadius * 1.25) / Math.tan(CAMERA_FIELD_OF_VIEW / 2),
          this.cameraSceneRadius * 1.5
        );
    this.cameraHomeDistance = fittedDistance;
    this.orbitControls?.setProps({
      target: this.cameraTarget,
      distance: fittedDistance,
      minDistance: Math.max(this.cameraSceneRadius * 0.02, 0.025),
      maxDistance: Math.max(this.cameraSceneRadius * 12, fittedDistance * 3)
    });
    this.requestRedraw();
  }

  private installPanelControls(panel: HTMLElement): void {
    const descriptionElement = panel.querySelector<HTMLElement>(
      '[data-gaussian-splats-description]'
    );
    const sceneControl = panel.querySelector<HTMLElement>('[data-gaussian-splats-scene-control]');
    const sceneElement = panel.querySelector<HTMLElement>('[data-gaussian-splats-scene]');
    const executionControl = panel.querySelector<HTMLElement>(
      '[data-gaussian-splats-execution-control]'
    );
    const executionElement = panel.querySelector<HTMLElement>('[data-gaussian-splats-execution]');
    const sortElement = panel.querySelector<HTMLElement>('[data-gaussian-splats-sort]');
    const radiusElement = panel.querySelector<HTMLInputElement>('[data-gaussian-splats-radius]');
    const opacityElement = panel.querySelector<HTMLInputElement>('[data-gaussian-splats-opacity]');
    const orbitElement = panel.querySelector<HTMLInputElement>('[data-gaussian-splats-orbit]');
    const graphDetails = panel.querySelector<HTMLDetailsElement>(
      '[data-gaussian-splats-graph-details]'
    );
    const graphInspectorElement = panel.querySelector<HTMLElement>(
      '[data-gaussian-splats-graph-inspector]'
    );

    if (this.localLoadersConfiguration && descriptionElement) {
      descriptionElement.textContent =
        this.localLoadersConfiguration.loaderMode === 'local'
          ? 'Complete Gaussian splat scenes streamed through the local loaders.gl 5 alpha checkout. Drag to orbit; scroll to zoom.'
          : 'Complete Gaussian splat scenes streamed through loaders.gl 5 alpha. Drag to orbit; scroll to zoom.';
    }

    if (this.device.type === 'webgpu' && executionControl && executionElement) {
      executionControl.hidden = false;
      executionControl.style.display = 'grid';
      render(
        h(PanelSelect, {
          ariaLabel: 'Execution pipeline',
          value: this.executionMode,
          options: SPLAT_EXECUTION_OPTIONS,
          onChange: value => {
            const nextUrl = new URL(window.location.href);
            if (value === 'cpu') {
              nextUrl.searchParams.set('renderer', 'cpu');
            } else {
              nextUrl.searchParams.delete('renderer');
            }
            window.location.assign(nextUrl.toString());
          }
        }),
        executionElement
      );
      this.controlDisposers.push(() => render(null, executionElement));
    }

    if (this.graphInspector && graphDetails && graphInspectorElement) {
      graphDetails.hidden = false;
      const inspectorPanel = new GPUCommandGraphInspectorPanel(graphInspectorElement);
      this.graphInspectorPanels.push(inspectorPanel);
      this.controlDisposers.push(() => {
        inspectorPanel.destroy();
        const panelIndex = this.graphInspectorPanels.indexOf(inspectorPanel);
        if (panelIndex >= 0) {
          this.graphInspectorPanels.splice(panelIndex, 1);
        }
      });
    }

    const hasBundledLoaders = Boolean(window.__lumaGaussianSplatsLoaderBundleUrl);
    const hasLocalLoaders = Boolean(window.__lumaGaussianSplatsLocalLoadersRoot);
    if (
      (this.localLoadersConfiguration || hasBundledLoaders || hasLocalLoaders) &&
      sceneControl &&
      sceneElement
    ) {
      sceneControl.hidden = false;
      sceneControl.style.display = 'grid';
      const shouldUseLocalLoaders =
        this.localLoadersConfiguration?.loaderMode === 'local' ||
        (!hasBundledLoaders && hasLocalLoaders);
      const sceneOptions: PanelSelectOption[] = [
        {value: 'synthetic', label: 'Synthetic chromatic showcase'},
        ...GAUSSIAN_SPLAT_SOURCE_CATALOG.filter(
          source => shouldUseLocalLoaders || source.id !== 'fixture'
        ).map(source => ({
          value: source.id,
          label: source.label
        }))
      ];
      if (
        this.localLoadersConfiguration &&
        !GAUSSIAN_SPLAT_SOURCE_CATALOG.some(
          source => source.id === this.localLoadersConfiguration?.sceneId
        )
      ) {
        sceneOptions.unshift({
          value: this.localLoadersConfiguration.sceneId,
          label: this.localLoadersConfiguration.sourceLabel
        });
      }
      render(
        h(PanelSelect, {
          ariaLabel: 'Gaussian splat scene',
          value: this.localLoadersConfiguration?.sceneId || 'synthetic',
          options: sceneOptions,
          onChange: value => {
            const nextUrl = new URL(window.location.href);
            nextUrl.searchParams.delete('mode');
            if (value === 'synthetic') {
              nextUrl.searchParams.set('loaders', 'synthetic');
              nextUrl.searchParams.delete('scene');
            } else {
              if (shouldUseLocalLoaders) {
                nextUrl.searchParams.set('loaders', 'local');
              } else {
                nextUrl.searchParams.delete('loaders');
              }
              nextUrl.searchParams.set('scene', String(value));
            }
            nextUrl.searchParams.delete('source');
            window.location.assign(nextUrl.toString());
          }
        }),
        sceneElement
      );
      this.controlDisposers.push(() => render(null, sceneElement));
    }

    if (sortElement) {
      const renderSortControl = (sortMode: SplatSortMode): void => {
        render(
          h(PanelSelect, {
            ariaLabel: 'Transparency ordering',
            value: sortMode,
            options:
              this.executionMode === 'graph'
                ? SPLAT_SORT_OPTIONS.filter(option => option.value === 'global')
                : SPLAT_SORT_OPTIONS,
            onChange: value => {
              const nextSortMode = getSplatSortMode(String(value));
              this.renderer.setProps({sortMode: nextSortMode});
              this.requestRedraw();
              renderSortControl(nextSortMode);
            }
          }),
          sortElement
        );
      };
      renderSortControl(this.renderer.props.sortMode);
      this.controlDisposers.push(() => render(null, sortElement));
    }

    if (radiusElement) {
      this.listen(radiusElement, 'input', () => {
        const radiusScale = Number(radiusElement.value);
        this.renderer.setProps({radiusScale});
        this.requestRedraw();
        const radiusValue = panel.querySelector<HTMLElement>('[data-gaussian-splats-radius-value]');
        if (radiusValue) {
          radiusValue.textContent = `${radiusScale.toFixed(2)}×`;
        }
      });
    }

    if (opacityElement) {
      this.listen(opacityElement, 'input', () => {
        const alphaScale = Number(opacityElement.value);
        this.renderer.setProps({alphaScale});
        this.requestRedraw();
        const opacityValue = panel.querySelector<HTMLElement>(
          '[data-gaussian-splats-opacity-value]'
        );
        if (opacityValue) {
          opacityValue.textContent = `${Math.round(alphaScale * 100)}%`;
        }
      });
    }

    if (orbitElement) {
      orbitElement.checked = this.autoOrbit;
      this.listen(orbitElement, 'change', () => {
        this.autoOrbit = orbitElement.checked;
        this.orbitControls?.setAutoRotate(this.autoOrbit);
        this.requestRedraw();
      });
    }
  }

  private listen(target: EventTarget, eventName: string, listener: EventListener): void {
    target.addEventListener(eventName, listener);
    this.controlDisposers.push(() => target.removeEventListener(eventName, listener));
  }

  private updatePanel(): void {
    if (typeof document === 'undefined' || this.isFinalized) {
      return;
    }

    for (const countElement of document.querySelectorAll<HTMLElement>(
      '[data-gaussian-splats-count]'
    )) {
      const expectedSplatCount = this.expectedSplatCount
        ? this.expectedSplatCount.toLocaleString()
        : this.isLoading
          ? '…'
          : this.loadedSplatCount.toLocaleString();
      countElement.textContent = `${this.loadedSplatCount.toLocaleString()} / ${expectedSplatCount}`;
    }
    for (const batchesElement of document.querySelectorAll<HTMLElement>(
      '[data-gaussian-splats-batches]'
    )) {
      const expectedBatchCount = this.expectedBatchCount
        ? Math.max(this.expectedBatchCount, this.batches.length).toLocaleString()
        : this.isLoading
          ? '…'
          : this.batches.length.toLocaleString();
      batchesElement.textContent = `${this.batches.length.toLocaleString()} / ${expectedBatchCount}`;
    }
    for (const backendElement of document.querySelectorAll<HTMLElement>(
      '[data-gaussian-splats-backend]'
    )) {
      backendElement.textContent = this.device.type === 'webgpu' ? 'WebGPU' : 'WebGL2';
    }
    for (const pipelineElement of document.querySelectorAll<HTMLElement>(
      '[data-gaussian-splats-pipeline]'
    )) {
      pipelineElement.textContent = this.graphFallbackReason
        ? 'CPU fallback · graph unavailable'
        : this.renderer instanceof GPUSplatGraphRenderer
          ? this.renderer.compiledGraph
            ? 'GPU command graph'
            : 'Compiling GPU graph…'
          : this.executionMode === 'graph'
            ? 'CPU preview → GPU graph'
            : this.device.type === 'webgpu'
              ? 'CPU depth ordering'
              : 'WebGL2 fallback';
    }
    for (const pipelineErrorElement of document.querySelectorAll<HTMLElement>(
      '[data-gaussian-splats-pipeline-error]'
    )) {
      pipelineErrorElement.hidden = !this.graphFallbackReason;
      pipelineErrorElement.textContent = this.graphFallbackReason
        ? `GPU graph unavailable: ${this.graphFallbackReason}`
        : '';
    }
    for (const graphDetails of document.querySelectorAll<HTMLDetailsElement>(
      '[data-gaussian-splats-graph-details]'
    )) {
      graphDetails.hidden = !this.graphInspector || Boolean(this.graphFallbackReason);
    }
    for (const sourceElement of document.querySelectorAll<HTMLElement>(
      '[data-gaussian-splats-source]'
    )) {
      sourceElement.textContent = this.localLoadersConfiguration
        ? `${
            this.loadingProgress?.fallbackActive
              ? this.loadingProgress.sourceLabel
              : this.localLoadersConfiguration.sourceLabel
          } · ${this.localLoadersConfiguration.sourceFormat}`
        : 'Synthetic';
    }

    for (const progressElement of document.querySelectorAll<HTMLElement>(
      '[data-gaussian-splats-progress]'
    )) {
      progressElement.hidden = !this.localLoadersConfiguration;
      progressElement.style.display = this.localLoadersConfiguration ? 'grid' : 'none';
      const statusElement = progressElement.querySelector<HTMLElement>(
        '[data-gaussian-splats-progress-status]'
      );
      const detailElement = progressElement.querySelector<HTMLElement>(
        '[data-gaussian-splats-progress-detail]'
      );
      const progressBar = progressElement.querySelector<HTMLProgressElement>(
        '[data-gaussian-splats-progress-bar]'
      );
      const completionElement = progressElement.querySelector<HTMLElement>(
        '[data-gaussian-splats-progress-complete]'
      );
      const progress = this.loadingProgress;
      if (statusElement) {
        statusElement.textContent = this.loadingError
          ? 'Unable to load scene'
          : !this.isLoading
            ? 'Scene loaded'
            : progress?.fallbackActive
              ? 'Loading GitHub scene fallback…'
              : progress?.phase === 'loaded'
                ? 'Preparing Gaussian splat batches…'
                : 'Downloading Gaussian splat scene…';
      }
      if (detailElement) {
        const detailParts: string[] = [];
        if (progress?.loadedBytes) {
          detailParts.push(
            progress.totalBytes
              ? `${formatByteCount(progress.loadedBytes)} / ${formatByteCount(progress.totalBytes)}`
              : formatByteCount(progress.loadedBytes)
          );
        }
        if (progress && progress.sourceCount > 1) {
          detailParts.push(
            `file ${Math.min(progress.sourceIndex + 1, progress.sourceCount)} / ${progress.sourceCount}`
          );
        }
        if (this.loadedSplatCount > 0) {
          detailParts.push(`${this.loadedSplatCount.toLocaleString()} splats ready`);
        }
        detailElement.textContent = detailParts.join(' · ');
      }
      if (progressBar) {
        if (!this.isLoading && !this.loadingError) {
          progressBar.value = 1;
        } else if (progress?.totalBytes) {
          progressBar.value = clamp(progress.loadedBytes / progress.totalBytes, 0, 1);
        } else if (this.expectedSplatCount && this.loadedSplatCount) {
          progressBar.value = clamp(this.loadedSplatCount / this.expectedSplatCount, 0, 1);
        } else {
          progressBar.removeAttribute('value');
        }
      }
      if (completionElement) {
        completionElement.hidden = this.isLoading || Boolean(this.loadingError);
      }
    }

    for (const errorElement of document.querySelectorAll<HTMLElement>(
      '[data-gaussian-splats-load-error]'
    )) {
      errorElement.hidden = !this.loadingError;
      errorElement.textContent = this.loadingError ?? '';
    }

    if (this.graphInspector) {
      const snapshot = this.graphInspector.getSnapshot();
      for (const inspectorPanel of this.graphInspectorPanels) {
        inspectorPanel.update(snapshot, this.inspectedGraph?.id);
      }
    }
  }

  private requestRedraw(): void {
    this.needsRedraw = true;
  }

  private readonly handleCameraInteraction = (): void => {
    this.hasManualCameraInteraction = true;
    this.requestRedraw();
  };

  private readonly handleDoubleClick = (): void => {
    this.orbitControls?.setProps({
      yaw: this.cameraHomeYaw,
      pitch: this.cameraHomePitch,
      distance: this.cameraHomeDistance
    });
  };
}

function makeGaussianSplatCameraFrame(
  sourceUp: readonly [number, number, number]
): GaussianSplatCameraFrame {
  const upLength = Math.hypot(...sourceUp);
  const up: [number, number, number] =
    upLength > Number.EPSILON
      ? [sourceUp[0] / upLength, sourceUp[1] / upLength, sourceUp[2] / upLength]
      : [0, 1, 0];
  const reference: [number, number, number] = Math.abs(up[2]) < 0.95 ? [0, 0, 1] : [0, -1, 0];
  const alignment = dotGaussianSplatVectors(reference, up);
  const horizontal: [number, number, number] = [
    reference[0] - up[0] * alignment,
    reference[1] - up[1] * alignment,
    reference[2] - up[2] * alignment
  ];
  const horizontalLength = Math.hypot(...horizontal);
  const forward: [number, number, number] = [
    horizontal[0] / horizontalLength,
    horizontal[1] / horizontalLength,
    horizontal[2] / horizontalLength
  ];
  const right: [number, number, number] = [
    up[1] * forward[2] - up[2] * forward[1],
    up[2] * forward[0] - up[0] * forward[2],
    up[0] * forward[1] - up[1] * forward[0]
  ];
  return {up, forward, right};
}

function dotGaussianSplatVectors(
  firstVector: readonly [number, number, number],
  secondVector: readonly [number, number, number]
): number {
  return (
    firstVector[0] * secondVector[0] +
    firstVector[1] * secondVector[1] +
    firstVector[2] * secondVector[2]
  );
}

function hasSameCameraState(
  cameraState: GaussianSplatCameraState,
  previousCameraState: GaussianSplatCameraState | undefined
): boolean {
  return Boolean(
    previousCameraState &&
      cameraState.yaw === previousCameraState.yaw &&
      cameraState.pitch === previousCameraState.pitch &&
      cameraState.distance === previousCameraState.distance &&
      cameraState.viewportWidth === previousCameraState.viewportWidth &&
      cameraState.viewportHeight === previousCameraState.viewportHeight &&
      cameraState.target.every(
        (coordinate, axisIndex) => coordinate === previousCameraState.target[axisIndex]
      )
  );
}

function formatByteCount(byteCount: number): string {
  if (byteCount < 1000) {
    return `${byteCount.toLocaleString()} B`;
  }
  if (byteCount < 1_000_000) {
    return `${(byteCount / 1000).toFixed(1)} KB`;
  }
  if (byteCount < 1_000_000_000) {
    return `${(byteCount / 1_000_000).toFixed(1)} MB`;
  }
  return `${(byteCount / 1_000_000_000).toFixed(1)} GB`;
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}

function waitForNextAnimationFrame(): Promise<void> {
  return new Promise(resolve => {
    requestAnimationFrame(() => resolve());
  });
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}

function getSplatSortMode(value: string): SplatSortMode {
  switch (value) {
    case 'none':
    case 'tile':
      return value;
    default:
      return 'global';
  }
}
