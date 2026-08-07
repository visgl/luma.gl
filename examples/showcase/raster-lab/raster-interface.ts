// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {RasterLabSummary} from './raster-engine';
import type {
  RasterLabDisplayMode,
  RasterLabSmoothingMode,
  RasterLabViewport
} from './raster-renderer';
import {RASTER_LAB_STYLES} from './raster-styles';

export type RasterLabInterfaceCallbacks = {
  onMode?: (mode: RasterLabDisplayMode) => void;
  onSmoothingMode?: (mode: RasterLabSmoothingMode) => void;
  onSmoothingRadius?: (radius: number) => void;
  onSmoothingSigma?: (sigma: number) => void;
  onContrast?: (contrast: number) => void;
  onGamma?: (gamma: number) => void;
  onThreshold?: (threshold: number, enabled: boolean) => void;
  onAutomaticThreshold?: (enabled: boolean) => void;
  onEpsilon?: (epsilon: number) => void;
  onResize?: () => void;
};

export type RasterLabSourceSummary = {
  width: number;
  height: number;
  pixelCount: number;
  cloudPixelCount: number;
  noDataPixelCount: number;
};

const NUMBER_FORMATTER = new Intl.NumberFormat('en-US');

/** Owns a responsive HTML dashboard above, but never overpaints, the GPU-rendered map surface. */
export class RasterLabInterface {
  private readonly container: HTMLElement;
  private readonly canvas: HTMLCanvasElement;
  private readonly root: HTMLElement;
  private readonly callbacks: RasterLabInterfaceCallbacks;
  private readonly cleanups: Array<() => void> = [];
  private readonly originalPosition: string;
  private readonly originalMinimumHeight: string;
  private readonly positionWasUpdated: boolean;
  private readonly minimumHeightWasUpdated: boolean;
  private source: RasterLabSourceSummary | null = null;
  private threshold = 0.35;
  private automaticThreshold = false;
  private resizeObserver: ResizeObserver | null = null;
  private resizeAnimationFrame: number | null = null;

  constructor(
    container: HTMLElement,
    canvas: HTMLCanvasElement,
    callbacks: RasterLabInterfaceCallbacks = {}
  ) {
    this.container = container;
    this.canvas = canvas;
    this.callbacks = callbacks;
    this.originalPosition = container.style.position;
    this.originalMinimumHeight = container.style.minHeight;
    this.positionWasUpdated = getComputedStyle(container).position === 'static';
    this.minimumHeightWasUpdated = container === document.body && !container.style.minHeight;
    if (this.positionWasUpdated) container.style.position = 'relative';
    if (this.minimumHeightWasUpdated) container.style.minHeight = '100vh';

    this.root = document.createElement('section');
    this.root.setAttribute('data-raster-lab', '');
    this.root.dataset['rasterReady'] = 'false';
    this.root.setAttribute('aria-label', 'Synthetic satellite-raster analysis dashboard');
    this.root.innerHTML = `<style>${RASTER_LAB_STYLES}</style>${makeRasterLabMarkup()}`;
    container.appendChild(this.root);
    this.bindControls();
    this.observeResize();
  }

  setSource(source: RasterLabSourceSummary): void {
    this.source = source;
    this.getElement('[data-raster-total]').textContent = NUMBER_FORMATTER.format(source.pixelCount);
    this.getElement('[data-raster-size]').textContent = `${source.width} × ${source.height}`;
    const cloudPercentage = (source.cloudPixelCount / Math.max(source.pixelCount, 1)) * 100;
    this.getElement('[data-raster-cloud]').textContent = `${cloudPercentage.toFixed(1)}%`;
    this.getElement('[data-raster-cloud-count]').textContent =
      `${NUMBER_FORMATTER.format(source.cloudPixelCount)} masked`;
  }

  setSummary(summary: RasterLabSummary): void {
    const totalPixelCount = this.source?.pixelCount ?? summary.validPixelCount;
    const percentage = (summary.validPixelCount / Math.max(totalPixelCount, 1)) * 100;
    const modeLabel = getModeLabel(summary.mode);
    this.getElement('[data-raster-valid-label]').textContent = summary.thresholdEnabled
      ? 'Selected observations'
      : 'Valid observations';
    this.getElement('[data-raster-valid]').textContent = NUMBER_FORMATTER.format(
      summary.validPixelCount
    );
    this.getElement('[data-raster-valid-percentage]').textContent =
      `${percentage.toFixed(1)}% ${summary.thresholdEnabled ? 'selected' : 'valid'}`;
    this.getElement('[data-raster-domain-label]').textContent = `Observed ${modeLabel} extent`;
    this.getElement('[data-raster-domain]').textContent =
      `${summary.domain[0].toFixed(2)} … ${summary.domain[1].toFixed(2)}`;
    this.getElement('[data-raster-statistics]').textContent =
      `Mean ${summary.mean.toFixed(3)} · GPU-computed`;
    this.getElement('[data-raster-node-count]').textContent = `${summary.nodeCount} nodes`;
    this.getElement('[data-raster-footprint]').textContent =
      `${(summary.residentByteLength / 1_048_576).toFixed(1)} MB resident`;
    this.getElement('[data-raster-histogram-minimum]').textContent = summary.domain[0].toFixed(2);
    this.getElement('[data-raster-histogram-maximum]').textContent = summary.domain[1].toFixed(2);
    this.getElement('[data-raster-histogram-axis]').textContent = modeLabel;
    this.getElement('[data-raster-histogram]').setAttribute('aria-label', `${modeLabel} histogram`);
    this.getElement('[data-raster-smoothing-state]').textContent =
      summary.smoothingMode === 'none'
        ? 'off'
        : `${summary.smoothingMode === 'gaussian' ? 'GAUSS' : 'BOX'} r${summary.smoothingRadius}`;
    this.getElement('[data-raster-threshold-state]').textContent = summary.thresholdEnabled
      ? `${summary.automaticThreshold ? 'AUTO ' : ''}≥ ${summary.threshold.toFixed(2)}`
      : 'off';
    if (summary.automaticThreshold) {
      this.getElement('[data-raster-threshold-value]').textContent = summary.threshold.toFixed(2);
      this.getInput('threshold').value = String(summary.threshold);
    }
    this.renderHistogram(summary);
  }

  setMode(mode: RasterLabDisplayMode): void {
    for (const button of this.root.querySelectorAll<HTMLButtonElement>('[data-raster-mode]')) {
      button.setAttribute('aria-pressed', String(button.dataset['rasterMode'] === mode));
    }
    const title =
      mode === 'ndvi'
        ? 'Vegetation index · false color'
        : mode === 'red'
          ? 'Red reflectance · false color'
          : 'Near-infrared reflectance · false color';
    this.getElement('[data-raster-map-title]').textContent = title;
    const legend = this.getElement('[data-raster-legend]');
    legend.dataset['mode'] = mode;
    this.getElement('[data-raster-legend-minimum]').textContent =
      mode === 'ndvi' ? 'Water / bare' : 'Low response';
    this.getElement('[data-raster-legend-maximum]').textContent =
      mode === 'ndvi' ? 'Dense canopy' : 'High response';
  }

  setSmoothingMode(mode: RasterLabSmoothingMode): void {
    for (const button of this.root.querySelectorAll<HTMLButtonElement>('[data-raster-smoothing]')) {
      button.setAttribute('aria-pressed', String(button.dataset['rasterSmoothing'] === mode));
    }
    this.getInput('smoothing-radius').disabled = mode === 'none';
    this.getInput('smoothing-sigma').disabled = mode !== 'gaussian';
  }

  setSmoothingRadius(radius: number): void {
    this.getElement('[data-raster-smoothing-radius-value]').textContent = `${radius} px`;
    this.getInput('smoothing-radius').value = String(radius);
  }

  setSmoothingSigma(sigma: number): void {
    this.getElement('[data-raster-smoothing-sigma-value]').textContent = sigma.toFixed(2);
    this.getInput('smoothing-sigma').value = String(sigma);
  }

  setContrast(contrast: number): void {
    this.getElement('[data-raster-contrast-value]').textContent = `${contrast.toFixed(2)}×`;
    this.getInput('contrast').value = String(contrast);
  }

  setGamma(gamma: number): void {
    this.getElement('[data-raster-gamma-value]').textContent = `${gamma.toFixed(2)}×`;
    this.getInput('gamma').value = String(gamma);
  }

  setThreshold(threshold: number, enabled: boolean): void {
    this.threshold = threshold;
    this.getElement('[data-raster-threshold-value]').textContent = threshold.toFixed(2);
    this.getInput('threshold').value = String(threshold);
    this.getInput('threshold-enabled').checked = enabled;
  }

  setAutomaticThreshold(enabled: boolean): void {
    this.automaticThreshold = enabled;
    this.getElement('[data-raster-control="otsu"]').setAttribute('aria-pressed', String(enabled));
    if (enabled) this.getInput('threshold-enabled').checked = true;
  }

  setEpsilon(epsilon: number): void {
    this.getElement('[data-raster-epsilon-value]').textContent = epsilon.toFixed(4);
    this.getInput('epsilon').value = String(epsilon);
  }

  setStatus(message: string, state: 'loading' | 'ready' | 'error' = 'loading'): void {
    this.getElement('[data-raster-status]').textContent = message;
    this.root.dataset['rasterReady'] = String(state === 'ready');
    this.root.dataset['rasterState'] = state;
  }

  /** Returns the transparent map rectangle in physical canvas pixels, not CSS pixels. */
  getMapViewport(drawingBufferSize: readonly [number, number]): RasterLabViewport {
    const canvasRectangle = this.canvas.getBoundingClientRect();
    const surfaceRectangle = this.getElement('[data-raster-surface]').getBoundingClientRect();
    if (canvasRectangle.width <= 0 || canvasRectangle.height <= 0) {
      return {x: 0, y: 0, width: 0, height: 0};
    }
    const [drawingBufferWidth, drawingBufferHeight] = drawingBufferSize;
    const scaleX = drawingBufferWidth / canvasRectangle.width;
    const scaleY = drawingBufferHeight / canvasRectangle.height;
    const minimumX = clamp(
      Math.round((surfaceRectangle.left - canvasRectangle.left) * scaleX),
      0,
      drawingBufferWidth
    );
    const minimumY = clamp(
      Math.round((surfaceRectangle.top - canvasRectangle.top) * scaleY),
      0,
      drawingBufferHeight
    );
    const maximumX = clamp(
      Math.round((surfaceRectangle.right - canvasRectangle.left) * scaleX),
      0,
      drawingBufferWidth
    );
    const maximumY = clamp(
      Math.round((surfaceRectangle.bottom - canvasRectangle.top) * scaleY),
      0,
      drawingBufferHeight
    );
    return {
      x: minimumX,
      y: minimumY,
      width: Math.max(0, maximumX - minimumX),
      height: Math.max(0, maximumY - minimumY)
    };
  }

  destroy(): void {
    this.resizeObserver?.disconnect();
    if (this.resizeAnimationFrame !== null) cancelAnimationFrame(this.resizeAnimationFrame);
    for (const cleanup of this.cleanups.splice(0)) cleanup();
    this.root.remove();
    if (this.positionWasUpdated) this.container.style.position = this.originalPosition;
    if (this.minimumHeightWasUpdated) this.container.style.minHeight = this.originalMinimumHeight;
  }

  private bindControls(): void {
    const onClick = (event: Event): void => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const otsuButton = target.closest<HTMLButtonElement>('[data-raster-control="otsu"]');
      if (otsuButton) {
        const enabled = !this.automaticThreshold;
        this.setAutomaticThreshold(enabled);
        this.callbacks.onAutomaticThreshold?.(enabled);
        return;
      }
      const smoothingButton = target.closest<HTMLButtonElement>('[data-raster-smoothing]');
      const smoothingMode = smoothingButton?.dataset['rasterSmoothing'];
      if (smoothingMode === 'none' || smoothingMode === 'gaussian' || smoothingMode === 'box') {
        this.setSmoothingMode(smoothingMode);
        this.callbacks.onSmoothingMode?.(smoothingMode);
        return;
      }
      const button = target.closest<HTMLButtonElement>('[data-raster-mode]');
      const mode = button?.dataset['rasterMode'];
      if (mode === 'ndvi' || mode === 'red' || mode === 'near-infrared') {
        this.setMode(mode);
        this.callbacks.onMode?.(mode);
      }
    };
    const onInput = (event: Event): void => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement)) return;
      const value = Number(target.value);
      switch (target.dataset['rasterControl']) {
        case 'smoothing-radius':
          this.setSmoothingRadius(value);
          this.callbacks.onSmoothingRadius?.(value);
          break;
        case 'smoothing-sigma':
          this.setSmoothingSigma(value);
          this.callbacks.onSmoothingSigma?.(value);
          break;
        case 'contrast':
          this.setContrast(value);
          this.callbacks.onContrast?.(value);
          break;
        case 'gamma':
          this.setGamma(value);
          this.callbacks.onGamma?.(value);
          break;
        case 'threshold':
          this.setAutomaticThreshold(false);
          this.setThreshold(value, true);
          this.callbacks.onThreshold?.(value, true);
          break;
        case 'epsilon':
          this.setEpsilon(value);
          this.callbacks.onEpsilon?.(value);
          break;
        case 'threshold-enabled':
          if (!target.checked) this.setAutomaticThreshold(false);
          this.setThreshold(this.threshold, target.checked);
          this.callbacks.onThreshold?.(this.threshold, target.checked);
          break;
        default:
          break;
      }
    };

    this.listen(this.root, 'click', onClick);
    this.listen(this.root, 'input', onInput);
    this.listen(this.root, 'change', onInput);
  }

  private observeResize(): void {
    const notify = (): void => {
      if (this.resizeAnimationFrame !== null) cancelAnimationFrame(this.resizeAnimationFrame);
      this.resizeAnimationFrame = requestAnimationFrame(() => {
        this.resizeAnimationFrame = null;
        this.callbacks.onResize?.();
      });
    };
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(notify);
      this.resizeObserver.observe(this.container);
      this.resizeObserver.observe(this.canvas);
      this.resizeObserver.observe(this.getElement('[data-raster-surface]'));
    } else {
      this.listen(window, 'resize', notify);
    }
  }

  private renderHistogram(summary: RasterLabSummary): void {
    const maximumBinCount = Math.max(...summary.bins, 1);
    const [minimum, maximum] = summary.domain;
    const bars = Array.from(summary.bins, (count, index) => {
      const value = minimum + ((index + 0.5) / summary.bins.length) * (maximum - minimum);
      const normalizedValue =
        summary.mode === 'ndvi' ? clamp((value + 0.2) / 1.1, 0, 1) : clamp(value, 0, 1);
      const hue =
        summary.mode === 'red'
          ? Math.round(10 + normalizedValue * 30)
          : summary.mode === 'near-infrared'
            ? Math.round(205 - normalizedValue * 55)
            : Math.round(28 + normalizedValue * 128);
      const color = `hsl(${hue} 56% 62%)`;
      const height =
        count === 0 ? 0 : Math.max(2, Math.round(Math.sqrt(count / maximumBinCount) * 100));
      return `<span class="raster-histogram-bar" data-raster-count="${count}" data-raster-value="${value}" style="--raster-height:${height}%;--raster-color:${color}" title="${value.toFixed(2)} · ${NUMBER_FORMATTER.format(count)} pixels"></span>`;
    });
    this.getElement('[data-raster-histogram]').innerHTML = bars.join('');
  }

  private getInput(control: string): HTMLInputElement {
    return this.getElement(`[data-raster-control="${control}"]`) as HTMLInputElement;
  }

  private getElement(selector: string): HTMLElement {
    const element = this.root.querySelector<HTMLElement>(selector);
    if (!element) throw new Error(`Missing raster dashboard element: ${selector}`);
    return element;
  }

  private listen(target: EventTarget, event: string, callback: EventListener): void {
    target.addEventListener(event, callback);
    this.cleanups.push(() => target.removeEventListener(event, callback));
  }
}

function makeRasterLabMarkup(): string {
  return `
    <div class="raster-shell">
      <header class="raster-header">
        <div class="raster-wordmark">
          <span class="raster-orbit-mark" aria-hidden="true">◉</span>
          <div>
            <div class="raster-eyebrow">Luma Earth Observation / GPU raster</div>
            <h1 class="raster-title">Vegetation Intelligence Lab</h1>
          </div>
        </div>
        <div class="raster-status" aria-live="polite">
          <span class="raster-status-dot" aria-hidden="true"></span>
          <span data-raster-status>Preparing synthetic reflectance scene</span>
        </div>
      </header>

      <section class="raster-metrics" aria-label="Raster scene metrics">
        <div class="raster-metric">
          <span class="raster-kicker">Source pixels</span>
          <strong class="raster-metric-value" data-raster-total>—</strong>
          <span class="raster-metric-detail" data-raster-size>Awaiting upload</span>
        </div>
        <div class="raster-metric">
          <span class="raster-kicker" data-raster-valid-label>Valid observations</span>
          <strong class="raster-metric-value" data-raster-valid>—</strong>
          <span class="raster-metric-detail" data-raster-valid-percentage>GPU histogram</span>
        </div>
        <div class="raster-metric">
          <span class="raster-kicker">Cloud mask</span>
          <strong class="raster-metric-value" data-raster-cloud>—</strong>
          <span class="raster-metric-detail" data-raster-cloud-count>Source validity</span>
        </div>
        <div class="raster-metric">
          <span class="raster-kicker" data-raster-domain-label>Observed NDVI extent</span>
          <strong class="raster-metric-value" data-raster-domain>—</strong>
          <span class="raster-metric-detail" data-raster-statistics>Finite valid pixels only</span>
        </div>
      </section>

      <main class="raster-workspace">
        <section class="raster-map-card" aria-label="GPU-rendered false-color raster">
          <div class="raster-map-header">
            <span class="raster-map-title" data-raster-map-title>Vegetation index · false color</span>
            <span class="raster-chip">SYNTHETIC SCENE</span>
          </div>
          <div class="raster-map-surface" data-raster-surface>
            <span class="raster-coordinate">SCENE / 041 · ANALYTIC TERRAIN</span>
            <span class="raster-scale">relative scale</span>
          </div>
          <div class="raster-map-footer">
            <div class="raster-legend" data-raster-legend data-mode="ndvi">
              <span class="raster-legend-ramp"></span>
              <div class="raster-legend-labels">
                <span data-raster-legend-minimum>Water / bare</span>
                <span data-raster-legend-maximum>Dense canopy</span>
              </div>
            </div>
            <span class="raster-map-note">Hatching = cloud / nodata</span>
          </div>
        </section>

        <aside class="raster-sidebar" aria-label="Raster analysis controls">
          <section class="raster-panel">
            <div class="raster-panel-heading">
              <span class="raster-panel-title">Spectral layers</span>
              <span class="raster-kicker">GPU resident</span>
            </div>
            <div class="raster-mode-buttons" aria-label="Display layer">
              <button class="raster-mode-button" data-raster-mode="ndvi" aria-pressed="true">NDVI</button>
              <button class="raster-mode-button" data-raster-mode="red" aria-pressed="false">RED</button>
              <button class="raster-mode-button" data-raster-mode="near-infrared" aria-pressed="false">NEAR IR</button>
            </div>
            <div class="raster-control raster-smoothing-control">
              <span class="raster-control-label">Neighborhood smoothing <span class="raster-kicker">2 GPU passes</span></span>
              <div class="raster-smoothing-buttons" aria-label="Smoothing filter">
                <button class="raster-mode-button" data-raster-smoothing="none" aria-pressed="true">OFF</button>
                <button class="raster-mode-button" data-raster-smoothing="gaussian" aria-pressed="false">GAUSSIAN</button>
                <button class="raster-mode-button" data-raster-smoothing="box" aria-pressed="false">BOX</button>
              </div>
              <label class="raster-smoothing-setting">
                <span class="raster-control-label">Kernel radius <span class="raster-control-value" data-raster-smoothing-radius-value>2 px</span></span>
                <input class="raster-slider" data-raster-control="smoothing-radius" type="range" min="1" max="8" step="1" value="2" disabled />
              </label>
              <label class="raster-smoothing-setting">
                <span class="raster-control-label">Gaussian sigma <span class="raster-control-value" data-raster-smoothing-sigma-value>1.25</span></span>
                <input class="raster-slider" data-raster-control="smoothing-sigma" type="range" min="0.35" max="4" step="0.05" value="1.25" disabled />
              </label>
            </div>
            <label class="raster-control">
              <span class="raster-control-label">Analysis contrast <span class="raster-control-value" data-raster-contrast-value>1.15×</span></span>
              <input class="raster-slider" data-raster-control="contrast" type="range" min="0.6" max="2" step="0.05" value="1.15" />
            </label>
            <label class="raster-control">
              <span class="raster-control-label">Gamma response <span class="raster-control-value" data-raster-gamma-value>1.00×</span></span>
              <input class="raster-slider" data-raster-control="gamma" type="range" min="0.45" max="2.4" step="0.05" value="1" />
            </label>
            <div class="raster-control">
              <span class="raster-control-label">
                <label class="raster-threshold-toggle">
                  <input data-raster-control="threshold-enabled" type="checkbox" />
                  Selection threshold
                </label>
                <span class="raster-control-value" data-raster-threshold-value>0.35</span>
              </span>
              <input class="raster-slider" data-raster-control="threshold" aria-label="Selection threshold" type="range" min="-0.2" max="0.9" step="0.01" value="0.35" />
              <button class="raster-otsu-button" data-raster-control="otsu" type="button" aria-pressed="false">AUTO OTSU · GPU HISTOGRAM</button>
            </div>
            <label class="raster-control">
              <span class="raster-control-label">Denominator epsilon <span class="raster-control-value" data-raster-epsilon-value>0.0001</span></span>
              <input class="raster-slider" data-raster-control="epsilon" type="range" min="0" max="0.3" step="0.0001" value="0.0001" />
            </label>
          </section>

          <section class="raster-panel raster-histogram-panel">
            <div class="raster-panel-heading">
              <span class="raster-panel-title">Live pixel distribution</span>
              <span class="raster-kicker">48 bins</span>
            </div>
            <div class="raster-histogram" data-raster-histogram aria-label="NDVI histogram"></div>
            <div class="raster-histogram-axis">
              <span data-raster-histogram-minimum>—</span>
              <span data-raster-histogram-axis>NDVI</span>
              <span data-raster-histogram-maximum>—</span>
            </div>
            <div class="raster-histogram-caption">
              Smoothing, threshold, and histogram share one GPU graph; only 216 summary bytes are read.
            </div>
          </section>

          <section class="raster-panel raster-pipeline">
            <div class="raster-panel-heading">
              <span class="raster-panel-title">Compute lineage</span>
              <span class="raster-kicker" data-raster-node-count>Compiling</span>
            </div>
            <div class="raster-pipeline-step"><span class="raster-step-number">01</span><span class="raster-step-name">RED + near-infrared</span><span class="raster-step-state">source</span></div>
            <div class="raster-pipeline-step"><span class="raster-step-number">02</span><span class="raster-step-name">Validity + nodata</span><span class="raster-step-state">mask</span></div>
            <div class="raster-pipeline-step"><span class="raster-step-number">03</span><span class="raster-step-name">Normalized difference</span><span class="raster-step-state">NDVI</span></div>
            <div class="raster-pipeline-step"><span class="raster-step-number">04</span><span class="raster-step-name">Separable smoothing</span><span class="raster-step-state" data-raster-smoothing-state>off</span></div>
            <div class="raster-pipeline-step"><span class="raster-step-number">05</span><span class="raster-step-name">Contrast + gamma</span><span class="raster-step-state">adjust</span></div>
            <div class="raster-pipeline-step"><span class="raster-step-number">06</span><span class="raster-step-name">Selection threshold</span><span class="raster-step-state" data-raster-threshold-state>off</span></div>
            <div class="raster-pipeline-step"><span class="raster-step-number">07</span><span class="raster-step-name">Count, mean + histogram</span><span class="raster-step-state">stats</span></div>
            <div class="raster-histogram-caption" data-raster-footprint>Allocating GPU buffers</div>
          </section>
        </aside>
      </main>

      <footer class="raster-footer">
        <div class="raster-roadmap" aria-label="Planned raster capabilities">
          <span class="raster-kicker">Coming next</span>
          <span class="raster-roadmap-chip">Gradients</span>
          <span class="raster-roadmap-chip">Morphology</span>
          <span class="raster-roadmap-chip">Segmentation</span>
          <span class="raster-roadmap-chip">Contours + tiles</span>
        </div>
        <span class="raster-provenance">Synthetic reflectance · false-color visualization</span>
      </footer>
    </div>
  `;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}

function getModeLabel(mode: RasterLabDisplayMode): string {
  return mode === 'ndvi' ? 'NDVI' : mode === 'red' ? 'RED' : 'NEAR IR';
}
