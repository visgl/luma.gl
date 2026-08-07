// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import {AnimationLoopTemplate, type AnimationProps} from '@luma.gl/engine';
import {makeRasterLabDataset} from './raster-data';
import {RasterLabEngine, type RasterLabSummary} from './raster-engine';
import {RasterLabInterface} from './raster-interface';
import type {
  RasterLabDisplayMode,
  RasterLabDisplaySettings,
  RasterLabEdgeDirection,
  RasterLabEdgeMode,
  RasterLabMorphologyBorderMode,
  RasterLabMorphologyMode,
  RasterLabMorphologyNoDataPolicy,
  RasterLabMorphologyOperation,
  RasterLabMorphologyShape,
  RasterLabSmoothingMode
} from './raster-renderer';

export const title = 'LuRaster: Satellite Raster Lab';
export const description =
  'GPU-resident NDVI, smoothing, edge detection, morphology, contours, and live histograms.';

type RasterLabDebugController = {
  readonly ready: boolean;
  readonly width: number;
  readonly height: number;
  readonly pixelCount: number;
  readonly validPixelCount: number;
  readonly nodeCount: number;
  readonly frameCount: number;
  readonly executionCount: number;
  readonly mode: RasterLabDisplayMode;
  readonly smoothingMode: RasterLabSmoothingMode;
  readonly smoothingRadius: number;
  readonly smoothingSigma: number;
  readonly edgeMode: RasterLabEdgeMode;
  readonly edgeDirection: RasterLabEdgeDirection;
  readonly morphologyOperation: RasterLabMorphologyOperation;
  readonly morphologyMode: RasterLabMorphologyMode;
  readonly morphologyShape: RasterLabMorphologyShape;
  readonly morphologyRadius: number;
  readonly morphologyNoDataPolicy: RasterLabMorphologyNoDataPolicy;
  readonly morphologyBorderMode: RasterLabMorphologyBorderMode;
  readonly morphologyBorderValue: number;
  readonly contrast: number;
  readonly gamma: number;
  readonly threshold: number;
  readonly thresholdEnabled: boolean;
  readonly automaticThreshold: boolean;
  readonly contoursEnabled: boolean;
  readonly contourLevel: number;
  readonly contourSegmentCount: number;
  readonly contourOverflow: boolean;
  readonly domain: readonly [number, number];
  readonly bins: readonly number[];
  readonly sum: number;
  readonly mean: number;
  readonly epsilon: number;
  setMode: (mode: RasterLabDisplayMode) => void;
  setSmoothingMode: (mode: RasterLabSmoothingMode) => void;
  setSmoothingRadius: (radius: number) => void;
  setSmoothingSigma: (sigma: number) => void;
  setEdgeMode: (mode: RasterLabEdgeMode) => void;
  setEdgeDirection: (direction: RasterLabEdgeDirection) => void;
  setMorphologyOperation: (operation: RasterLabMorphologyOperation) => void;
  setMorphologyMode: (mode: RasterLabMorphologyMode) => void;
  setMorphologyShape: (shape: RasterLabMorphologyShape) => void;
  setMorphologyRadius: (radius: number) => void;
  setMorphologyNoDataPolicy: (policy: RasterLabMorphologyNoDataPolicy) => void;
  setMorphologyBorderMode: (mode: RasterLabMorphologyBorderMode) => void;
  setMorphologyBorderValue: (value: number) => void;
  setContrast: (contrast: number) => void;
  setGamma: (gamma: number) => void;
  setThreshold: (threshold: number, enabled?: boolean) => void;
  setAutomaticThreshold: (enabled?: boolean) => void;
  setContours: (enabled?: boolean) => void;
  setContourLevel: (level: number) => void;
  setEpsilon: (epsilon: number) => void;
};

type RasterLabDebugWindow = Window & {__luRasterLab?: RasterLabDebugController};

/** Interactive, validity-aware earth-observation analysis on one GPU-resident command graph. */
export default class RasterLabAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = '';

  readonly device: Device;

  private readonly rasterSize: readonly [number, number];
  private readonly display: RasterLabDisplaySettings = {
    mode: 'ndvi',
    smoothingMode: 'none',
    smoothingRadius: 2,
    smoothingSigma: 1.25,
    edgeMode: 'none',
    edgeDirection: 'magnitude',
    morphologyOperation: 'none',
    morphologyMode: 'grayscale',
    morphologyShape: 'square',
    morphologyRadius: 2,
    morphologyNoDataPolicy: 'ignore',
    morphologyBorderMode: 'clamp',
    morphologyBorderValue: 0,
    contrast: 1.15,
    gamma: 1,
    threshold: 0.35,
    thresholdEnabled: false,
    automaticThreshold: false,
    contoursEnabled: true,
    contourLevel: 0.35
  };
  private interface: RasterLabInterface | null = null;
  private engine: RasterLabEngine | null = null;
  private latestSummary: RasterLabSummary | null = null;
  private debugController: RasterLabDebugController | null = null;
  private requestedEpsilon: number | null = null;
  private epsilon = 0.0001;
  private updateRequested = false;
  private updateInFlight = false;
  private redrawRequested = true;
  private frameCount = 0;
  private finalized = false;

  constructor(animationProps: AnimationProps) {
    super(animationProps);
    if (animationProps.device.type !== 'webgpu') {
      throw new Error('LuRaster Satellite Raster Lab requires WebGPU');
    }
    this.device = animationProps.device;
    this.rasterSize = getInitialRasterSize();
  }

  override async onInitialize({canvas}: AnimationProps): Promise<void> {
    if (!(canvas instanceof HTMLCanvasElement)) return;
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', 'GPU-rendered false-color synthetic vegetation raster');

    this.interface = new RasterLabInterface(canvas.parentElement ?? document.body, canvas, {
      onMode: mode => this.setMode(mode),
      onSmoothingMode: mode => this.setSmoothingMode(mode),
      onSmoothingRadius: radius => this.setSmoothingRadius(radius),
      onSmoothingSigma: sigma => this.setSmoothingSigma(sigma),
      onEdgeMode: mode => this.setEdgeMode(mode),
      onEdgeDirection: direction => this.setEdgeDirection(direction),
      onMorphologyOperation: operation => this.setMorphologyOperation(operation),
      onMorphologyMode: mode => this.setMorphologyMode(mode),
      onMorphologyShape: shape => this.setMorphologyShape(shape),
      onMorphologyRadius: radius => this.setMorphologyRadius(radius),
      onMorphologyNoDataPolicy: policy => this.setMorphologyNoDataPolicy(policy),
      onMorphologyBorderMode: mode => this.setMorphologyBorderMode(mode),
      onMorphologyBorderValue: value => this.setMorphologyBorderValue(value),
      onContrast: contrast => this.setContrast(contrast),
      onGamma: gamma => this.setGamma(gamma),
      onThreshold: (threshold, enabled) => this.setThreshold(threshold, enabled),
      onAutomaticThreshold: enabled => this.setAutomaticThreshold(enabled),
      onContoursEnabled: enabled => this.setContours(enabled),
      onContourLevel: level => this.setContourLevel(level),
      onEpsilon: epsilon => this.setEpsilon(epsilon),
      onResize: () => {
        this.redrawRequested = true;
      }
    });
    this.interface.setStatus('Generating synthetic red and near-infrared reflectance');

    await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
    if (this.finalized) return;

    try {
      const dataset = makeRasterLabDataset(this.rasterSize[0], this.rasterSize[1]);
      this.interface.setSource(dataset);
      this.interface.setStatus('Compiling masked NDVI, spatial filters, and histogram GPU passes');
      await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
      if (this.finalized) return;

      this.engine = new RasterLabEngine(this.device, dataset);
      this.installDebugController();
      this.updateRequested = true;
      await this.flushUpdates();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.interface?.setStatus(`WebGPU raster analysis unavailable: ${message}`, 'error');
      throw error;
    }
  }

  override onRender({canvasContext}: AnimationProps): void {
    if (!this.interface || !this.engine || this.finalized || !this.redrawRequested) return;
    const viewport = this.interface.getMapViewport(canvasContext.getDrawingBufferSize());
    if (viewport.width <= 0 || viewport.height <= 0 || !this.latestSummary) return;
    this.engine.render(canvasContext, viewport, this.display);
    this.redrawRequested = false;
    this.frameCount++;
  }

  override onFinalize(): void {
    this.finalized = true;
    this.interface?.destroy();
    this.interface = null;
    this.engine?.destroy();
    this.engine = null;

    if (typeof window !== 'undefined') {
      const debugWindow = window as RasterLabDebugWindow;
      if (debugWindow.__luRasterLab === this.debugController) delete debugWindow.__luRasterLab;
    }
  }

  private setMode(mode: RasterLabDisplayMode): void {
    if (mode === this.display.mode) return;
    this.display.mode = mode;
    this.interface?.setMode(mode);
    this.requestUpdate();
  }

  private setSmoothingMode(mode: RasterLabSmoothingMode): void {
    if (mode === this.display.smoothingMode) return;
    this.display.smoothingMode = mode;
    this.interface?.setSmoothingMode(mode);
    this.requestUpdate();
  }

  private setSmoothingRadius(radius: number): void {
    if (radius === this.display.smoothingRadius) return;
    this.display.smoothingRadius = radius;
    this.interface?.setSmoothingRadius(radius);
    if (this.display.smoothingMode !== 'none') this.requestUpdate();
  }

  private setSmoothingSigma(sigma: number): void {
    if (Math.abs(sigma - this.display.smoothingSigma) < 0.0000001) return;
    this.display.smoothingSigma = sigma;
    this.interface?.setSmoothingSigma(sigma);
    if (this.display.smoothingMode === 'gaussian') this.requestUpdate();
  }

  private setEdgeMode(mode: RasterLabEdgeMode): void {
    if (mode === this.display.edgeMode) return;
    this.display.edgeMode = mode;
    this.interface?.setEdgeMode(mode);
    this.requestUpdate();
  }

  private setEdgeDirection(direction: RasterLabEdgeDirection): void {
    if (direction === this.display.edgeDirection) return;
    this.display.edgeDirection = direction;
    this.interface?.setEdgeDirection(direction);
    if (this.display.edgeMode !== 'none' && this.display.edgeMode !== 'laplacian') {
      this.requestUpdate();
    }
  }

  private setMorphologyOperation(operation: RasterLabMorphologyOperation): void {
    if (operation === this.display.morphologyOperation) return;
    this.display.morphologyOperation = operation;
    this.interface?.setMorphologyOperation(operation);
    this.syncBinaryMorphology();
    this.requestUpdate();
  }

  private setMorphologyMode(mode: RasterLabMorphologyMode): void {
    if (mode === this.display.morphologyMode) return;
    this.display.morphologyMode = mode;
    this.interface?.setMorphologyMode(mode);
    this.syncBinaryMorphology();
    if (this.display.morphologyOperation !== 'none') this.requestUpdate();
  }

  private setMorphologyShape(shape: RasterLabMorphologyShape): void {
    if (shape === this.display.morphologyShape) return;
    this.display.morphologyShape = shape;
    this.interface?.setMorphologyShape(shape);
    if (this.display.morphologyOperation !== 'none') this.requestUpdate();
  }

  private setMorphologyRadius(radius: number): void {
    if (radius === this.display.morphologyRadius) return;
    this.display.morphologyRadius = radius;
    this.interface?.setMorphologyRadius(radius);
    if (this.display.morphologyOperation !== 'none') this.requestUpdate();
  }

  private setMorphologyNoDataPolicy(policy: RasterLabMorphologyNoDataPolicy): void {
    if (policy === this.display.morphologyNoDataPolicy) return;
    this.display.morphologyNoDataPolicy = policy;
    this.interface?.setMorphologyNoDataPolicy(policy);
    if (this.display.morphologyOperation !== 'none') this.requestUpdate();
  }

  private setMorphologyBorderMode(mode: RasterLabMorphologyBorderMode): void {
    if (mode === this.display.morphologyBorderMode) return;
    this.display.morphologyBorderMode = mode;
    this.interface?.setMorphologyBorderMode(mode);
    if (this.display.morphologyOperation !== 'none') this.requestUpdate();
  }

  private setMorphologyBorderValue(value: number): void {
    if (Math.abs(value - this.display.morphologyBorderValue) < 0.0000001) return;
    this.display.morphologyBorderValue = value;
    this.interface?.setMorphologyBorderValue(value);
    if (
      this.display.morphologyOperation !== 'none' &&
      this.display.morphologyBorderMode === 'constant'
    ) {
      this.requestUpdate();
    }
  }

  private syncBinaryMorphology(): void {
    const binaryMorphologyEnabled =
      this.display.morphologyOperation !== 'none' && this.display.morphologyMode === 'binary';
    if (binaryMorphologyEnabled && !this.display.thresholdEnabled) {
      this.display.thresholdEnabled = true;
    }
    this.interface?.setThreshold(this.display.threshold, this.display.thresholdEnabled);
    this.interface?.setContours(
      this.display.contoursEnabled,
      binaryMorphologyEnabled ? 0.5 : this.display.contourLevel
    );
  }

  private setContrast(contrast: number): void {
    if (Math.abs(contrast - this.display.contrast) < 0.0000001) return;
    this.display.contrast = contrast;
    this.interface?.setContrast(contrast);
    this.requestUpdate();
  }

  private setGamma(gamma: number): void {
    if (Math.abs(gamma - this.display.gamma) < 0.0000001) return;
    this.display.gamma = gamma;
    this.interface?.setGamma(gamma);
    this.requestUpdate();
  }

  private setThreshold(threshold: number, enabled = true): void {
    if (
      !enabled &&
      this.display.morphologyOperation !== 'none' &&
      this.display.morphologyMode === 'binary'
    ) {
      enabled = true;
    }
    if (
      Math.abs(threshold - this.display.threshold) < 0.0000001 &&
      enabled === this.display.thresholdEnabled &&
      !this.display.automaticThreshold
    ) {
      return;
    }
    this.display.threshold = threshold;
    this.display.thresholdEnabled = enabled;
    this.display.automaticThreshold = false;
    this.interface?.setAutomaticThreshold(false);
    this.interface?.setThreshold(threshold, enabled);
    this.requestUpdate();
  }

  private setAutomaticThreshold(enabled = true): void {
    if (enabled === this.display.automaticThreshold) return;
    this.display.automaticThreshold = enabled;
    this.display.thresholdEnabled = true;
    this.interface?.setAutomaticThreshold(enabled);
    this.interface?.setThreshold(this.display.threshold, true);
    this.requestUpdate();
  }

  private setContours(enabled = true): void {
    if (enabled === this.display.contoursEnabled) return;
    this.display.contoursEnabled = enabled;
    this.interface?.setContours(enabled, this.display.contourLevel);
    this.requestUpdate();
  }

  private setContourLevel(level: number): void {
    if (Math.abs(level - this.display.contourLevel) < 0.0000001) return;
    this.display.contourLevel = level;
    this.interface?.setContours(this.display.contoursEnabled, level);
    this.requestUpdate();
  }

  private setEpsilon(epsilon: number): void {
    if (Math.abs(epsilon - (this.requestedEpsilon ?? this.epsilon)) < 0.0000001) return;
    this.requestedEpsilon = epsilon;
    this.interface?.setEpsilon(epsilon);
    this.requestUpdate();
  }

  private requestUpdate(): void {
    if (this.finalized) return;
    this.updateRequested = true;
    if (!this.updateInFlight) {
      void this.flushUpdates().catch(error => {
        if (this.finalized) return;
        const message = error instanceof Error ? error.message : String(error);
        this.interface?.setStatus(`WebGPU raster analysis unavailable: ${message}`, 'error');
      });
    }
  }

  private async flushUpdates(): Promise<void> {
    const engine = this.engine;
    if (!engine || this.updateInFlight || this.finalized) return;
    this.updateInFlight = true;

    try {
      while (this.updateRequested && !this.finalized) {
        this.updateRequested = false;
        const requestedEpsilon = this.requestedEpsilon ?? this.epsilon;
        this.requestedEpsilon = null;
        engine.configure(this.display, requestedEpsilon);
        this.epsilon = requestedEpsilon;
        const summary = await engine.update();
        if (this.finalized) return;

        this.latestSummary = summary;
        this.interface?.setSummary(summary);
        this.interface?.setStatus(
          `${summary.nodeCount} GPU graph passes · raster pixels stay on device`,
          'ready'
        );
        this.redrawRequested = true;
      }
    } finally {
      this.updateInFlight = false;
    }
  }

  private installDebugController(): void {
    if (typeof window === 'undefined') return;
    const viewer = this;
    this.debugController = {
      get ready() {
        return viewer.latestSummary !== null;
      },
      get width() {
        return viewer.rasterSize[0];
      },
      get height() {
        return viewer.rasterSize[1];
      },
      get pixelCount() {
        return viewer.rasterSize[0] * viewer.rasterSize[1];
      },
      get validPixelCount() {
        return viewer.latestSummary?.validPixelCount ?? 0;
      },
      get nodeCount() {
        return viewer.latestSummary?.nodeCount ?? 0;
      },
      get frameCount() {
        return viewer.frameCount;
      },
      get executionCount() {
        return viewer.latestSummary?.executionCount ?? 0;
      },
      get mode() {
        return viewer.display.mode;
      },
      get smoothingMode() {
        return viewer.display.smoothingMode;
      },
      get smoothingRadius() {
        return viewer.display.smoothingRadius;
      },
      get smoothingSigma() {
        return viewer.display.smoothingSigma;
      },
      get edgeMode() {
        return viewer.display.edgeMode;
      },
      get edgeDirection() {
        return viewer.display.edgeDirection;
      },
      get morphologyOperation() {
        return viewer.display.morphologyOperation;
      },
      get morphologyMode() {
        return viewer.display.morphologyMode;
      },
      get morphologyShape() {
        return viewer.display.morphologyShape;
      },
      get morphologyRadius() {
        return viewer.display.morphologyRadius;
      },
      get morphologyNoDataPolicy() {
        return viewer.display.morphologyNoDataPolicy;
      },
      get morphologyBorderMode() {
        return viewer.display.morphologyBorderMode;
      },
      get morphologyBorderValue() {
        return viewer.display.morphologyBorderValue;
      },
      get contrast() {
        return viewer.display.contrast;
      },
      get gamma() {
        return viewer.display.gamma;
      },
      get threshold() {
        return viewer.latestSummary?.threshold ?? viewer.display.threshold;
      },
      get thresholdEnabled() {
        return viewer.display.thresholdEnabled;
      },
      get automaticThreshold() {
        return viewer.display.automaticThreshold;
      },
      get contoursEnabled() {
        return viewer.display.contoursEnabled;
      },
      get contourLevel() {
        return viewer.latestSummary?.contourLevel ?? viewer.display.contourLevel;
      },
      get contourSegmentCount() {
        return viewer.latestSummary?.contourSegmentCount ?? 0;
      },
      get contourOverflow() {
        return viewer.latestSummary?.contourOverflow ?? false;
      },
      get domain() {
        return viewer.latestSummary?.domain ?? [0, 0];
      },
      get bins() {
        return Array.from(viewer.latestSummary?.bins ?? []);
      },
      get sum() {
        return viewer.latestSummary?.sum ?? 0;
      },
      get mean() {
        return viewer.latestSummary?.mean ?? 0;
      },
      get epsilon() {
        return viewer.epsilon;
      },
      setMode: mode => viewer.setMode(mode),
      setSmoothingMode: mode => viewer.setSmoothingMode(mode),
      setSmoothingRadius: radius => viewer.setSmoothingRadius(radius),
      setSmoothingSigma: sigma => viewer.setSmoothingSigma(sigma),
      setEdgeMode: mode => viewer.setEdgeMode(mode),
      setEdgeDirection: direction => viewer.setEdgeDirection(direction),
      setMorphologyOperation: operation => viewer.setMorphologyOperation(operation),
      setMorphologyMode: mode => viewer.setMorphologyMode(mode),
      setMorphologyShape: shape => viewer.setMorphologyShape(shape),
      setMorphologyRadius: radius => viewer.setMorphologyRadius(radius),
      setMorphologyNoDataPolicy: policy => viewer.setMorphologyNoDataPolicy(policy),
      setMorphologyBorderMode: mode => viewer.setMorphologyBorderMode(mode),
      setMorphologyBorderValue: value => viewer.setMorphologyBorderValue(value),
      setContrast: contrast => viewer.setContrast(contrast),
      setGamma: gamma => viewer.setGamma(gamma),
      setThreshold: (threshold, enabled) => viewer.setThreshold(threshold, enabled),
      setAutomaticThreshold: enabled => viewer.setAutomaticThreshold(enabled),
      setContours: enabled => viewer.setContours(enabled),
      setContourLevel: level => viewer.setContourLevel(level),
      setEpsilon: epsilon => viewer.setEpsilon(epsilon)
    };
    (window as RasterLabDebugWindow).__luRasterLab = this.debugController;
  }
}

function getInitialRasterSize(): readonly [number, number] {
  if (typeof window === 'undefined') return [768, 512];
  return new URLSearchParams(window.location.search).has('visual-smoke') ? [320, 224] : [768, 512];
}
