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
  RasterLabSmoothingMode
} from './raster-renderer';

export const title = 'LuRaster: Satellite Raster Lab';
export const description =
  'GPU-resident NDVI, separable smoothing, indirect contour overlays, and live histograms.';

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
      this.interface.setStatus('Compiling masked NDVI, smoothing, and histogram GPU passes');
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
        return viewer.display.contourLevel;
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
