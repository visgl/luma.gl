// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {RasterLabSummary} from './raster-engine';
import type {
  RasterLabDisplayMode,
  RasterLabEdgeDirection,
  RasterLabEdgeMode,
  RasterLabMorphologyBorderMode,
  RasterLabMorphologyMode,
  RasterLabMorphologyNoDataPolicy,
  RasterLabMorphologyOperation,
  RasterLabMorphologyShape,
  RasterLabSmoothingMode,
  RasterLabViewport
} from './raster-renderer';
import {RASTER_LAB_STYLES} from './raster-styles';

export type RasterLabInterfaceCallbacks = {
  onSourceTile?: (tile: RasterLabSourceTile) => void;
  onSourceOverview?: (level: RasterLabOverviewLevel) => void;
  onHaloMode?: (mode: RasterLabHaloMode) => void;
  onCacheCapacity?: (capacity: number) => void;
  onMode?: (mode: RasterLabDisplayMode) => void;
  onSmoothingMode?: (mode: RasterLabSmoothingMode) => void;
  onSmoothingRadius?: (radius: number) => void;
  onSmoothingSigma?: (sigma: number) => void;
  onEdgeMode?: (mode: RasterLabEdgeMode) => void;
  onEdgeDirection?: (direction: RasterLabEdgeDirection) => void;
  onMorphologyOperation?: (operation: RasterLabMorphologyOperation) => void;
  onMorphologyMode?: (mode: RasterLabMorphologyMode) => void;
  onMorphologyShape?: (shape: RasterLabMorphologyShape) => void;
  onMorphologyRadius?: (radius: number) => void;
  onMorphologyNoDataPolicy?: (policy: RasterLabMorphologyNoDataPolicy) => void;
  onMorphologyBorderMode?: (mode: RasterLabMorphologyBorderMode) => void;
  onMorphologyBorderValue?: (value: number) => void;
  onContrast?: (contrast: number) => void;
  onGamma?: (gamma: number) => void;
  onThreshold?: (threshold: number, enabled: boolean) => void;
  onAutomaticThreshold?: (enabled: boolean) => void;
  onContoursEnabled?: (enabled: boolean) => void;
  onContourLevel?: (level: number) => void;
  onEpsilon?: (epsilon: number) => void;
  onResize?: () => void;
};

export type RasterLabSourceTile = 'full' | 'west' | 'east';
export type RasterLabOverviewLevel = 0 | 1;
export type RasterLabHaloMode = 'off' | 'seamless';

export type RasterLabHaloSummary = {
  mode: RasterLabHaloMode;
  radius: number;
  levelZeroRadius: readonly [number, number];
  coreBounds: readonly [number, number, number, number];
  availableBounds: readonly [number, number, number, number];
  sourceTileCount: number;
};

export type RasterLabSourceSummary = {
  width: number;
  height: number;
  pixelCount: number;
  cloudPixelCount: number;
  noDataPixelCount: number;
  tile?: RasterLabSourceTile;
  overviewLevel?: RasterLabOverviewLevel;
  levelZeroOrigin?: readonly [number, number];
  coordinateReferenceSystem?: string;
};

export type RasterLabResidencySummary = {
  capacity: number;
  maximumCpuBytes: number;
  maximumGpuBytes: number;
  residentTiles: number;
  residentGraphs: number;
  cpuBytes: number;
  gpuBytes: number;
  tileHits: number;
  tileMisses: number;
  tileEvictions: number;
  graphHits: number;
  graphCompilations: number;
  pinnedTiles: number;
  pinnedGraphs: number;
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
  private mode: RasterLabDisplayMode = 'ndvi';
  private edgeMode: RasterLabEdgeMode = 'none';
  private edgeDirection: RasterLabEdgeDirection = 'magnitude';
  private morphologyOperation: RasterLabMorphologyOperation = 'none';
  private morphologyMode: RasterLabMorphologyMode = 'grayscale';
  private morphologyBorderMode: RasterLabMorphologyBorderMode = 'clamp';
  private threshold = 0.35;
  private automaticThreshold = false;
  private contoursEnabled = true;
  private contourLevel = 0.35;
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
    const level = source.overviewLevel ?? 0;
    const tile = source.tile ?? 'full';
    const [originColumn, originRow] = source.levelZeroOrigin ?? [0, 0];
    const coordinateReferenceSystem = source.coordinateReferenceSystem ?? 'EPSG:32610';
    this.getElement('[data-raster-source-description]').textContent =
      `L${level} · ${tile.toUpperCase()} · ${source.width} × ${source.height}`;
    this.getElement('[data-raster-source-origin]').textContent =
      `Origin ${NUMBER_FORMATTER.format(originColumn)}, ${NUMBER_FORMATTER.format(originRow)} · ${coordinateReferenceSystem}`;
    this.getElement('[data-raster-coordinate]').textContent =
      `L${level} / ${tile.toUpperCase()} · ORIGIN ${originColumn},${originRow} · ${coordinateReferenceSystem}`;
  }

  setSourceTile(tile: RasterLabSourceTile): void {
    for (const button of this.root.querySelectorAll<HTMLButtonElement>(
      '[data-raster-source-tile]'
    )) {
      button.setAttribute('aria-pressed', String(button.dataset['rasterSourceTile'] === tile));
    }
  }

  setSourceOverview(level: RasterLabOverviewLevel): void {
    for (const button of this.root.querySelectorAll<HTMLButtonElement>(
      '[data-raster-source-overview]'
    )) {
      button.setAttribute(
        'aria-pressed',
        String(Number(button.dataset['rasterSourceOverview']) === level)
      );
    }
  }

  setHalo(summary: RasterLabHaloSummary): void {
    for (const button of this.root.querySelectorAll<HTMLButtonElement>('[data-raster-halo-mode]')) {
      button.setAttribute(
        'aria-pressed',
        String(button.dataset['rasterHaloMode'] === summary.mode)
      );
    }
    const [minimumColumn, minimumRow, maximumColumn, maximumRow] = summary.coreBounds;
    const [availableMinimumColumn, , availableMaximumColumn] = summary.availableBounds;
    const enabled = summary.mode === 'seamless';
    this.getElement('[data-raster-halo-radius]').textContent = enabled
      ? `${summary.radius} px · L0 ${summary.levelZeroRadius[0]} × ${summary.levelZeroRadius[1]}`
      : 'off';
    this.getElement('[data-raster-halo-core]').textContent = enabled
      ? `[${minimumColumn}, ${maximumColumn}) × [${minimumRow}, ${maximumRow})`
      : 'selected tile only';
    this.getElement('[data-raster-halo-sources]').textContent = enabled
      ? `${summary.sourceTileCount} resident · [${availableMinimumColumn}, ${availableMaximumColumn})`
      : 'no neighbor assembly';
    this.getElement('[data-raster-map-scale]').textContent = enabled
      ? `${summary.sourceTileCount} tiles · ${summary.radius} px halo · core only`
      : 'single tile · no halo';
  }

  setResidency(summary: RasterLabResidencySummary): void {
    const capacityControl = this.getInput('cache-capacity');
    capacityControl.value = String(summary.capacity);
    this.getElement('[data-raster-cache-capacity]').textContent =
      `${summary.residentTiles} / ${summary.capacity} tiles`;
    this.getElement('[data-raster-cache-cpu]').textContent =
      `${formatResidencyBytes(summary.cpuBytes)} / ${formatResidencyBytes(summary.maximumCpuBytes)}`;
    this.getElement('[data-raster-cache-gpu]').textContent =
      `${formatResidencyBytes(summary.gpuBytes)} / ${formatResidencyBytes(summary.maximumGpuBytes)}`;
    this.getElement('[data-raster-cache-activity]').textContent =
      `${summary.tileHits} hit · ${summary.tileMisses} miss · ${summary.tileEvictions} evict`;
    this.getElement('[data-raster-cache-graphs]').textContent =
      `${summary.graphCompilations} compile · ${summary.graphHits} reuse`;
    this.getElement('[data-raster-cache-pins]').textContent =
      `${summary.pinnedTiles} tile · ${summary.pinnedGraphs} graph pinned`;
  }

  setSummary(summary: RasterLabSummary): void {
    const totalPixelCount = this.source?.pixelCount ?? summary.validPixelCount;
    const percentage = (summary.validPixelCount / Math.max(totalPixelCount, 1)) * 100;
    const modeLabel =
      summary.edgeMode === 'none'
        ? getModeLabel(summary.mode)
        : `${summary.edgeMode.toUpperCase()} ${summary.edgeMode === 'laplacian' ? 'Δ' : summary.edgeDirection === 'magnitude' ? '|∇|' : summary.edgeDirection.toUpperCase()}`;
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
    this.getElement('[data-raster-edge-state]').textContent =
      summary.edgeMode === 'none'
        ? 'off'
        : `${summary.edgeMode.toUpperCase()} ${summary.edgeMode === 'laplacian' ? 'Δ' : summary.edgeDirection.toUpperCase()}`;
    this.getElement('[data-raster-morphology-state]').textContent =
      summary.morphologyOperation === 'none'
        ? 'off'
        : `${summary.morphologyMode === 'binary' ? 'B' : 'G'} ${summary.morphologyOperation.toUpperCase()} r${summary.morphologyRadius}`;
    this.getElement('[data-raster-grayscale-morphology-state]').textContent =
      summary.morphologyOperation !== 'none' && summary.morphologyMode === 'grayscale'
        ? `${summary.morphologyOperation.toUpperCase()} r${summary.morphologyRadius}`
        : 'off';
    this.getElement('[data-raster-binary-morphology-state]').textContent =
      summary.morphologyOperation !== 'none' && summary.morphologyMode === 'binary'
        ? `${summary.morphologyOperation.toUpperCase()} r${summary.morphologyRadius}`
        : 'off';
    this.getElement('[data-raster-threshold-state]').textContent = summary.thresholdEnabled
      ? `${summary.automaticThreshold ? 'AUTO ' : ''}≥ ${summary.threshold.toFixed(2)}`
      : 'off';
    this.getElement('[data-raster-contour-state]').textContent = summary.contoursEnabled
      ? `${NUMBER_FORMATTER.format(summary.contourSegmentCount)}${summary.contourOverflow ? '+' : ''}`
      : 'off';
    this.getElement('[data-raster-contour-count]').textContent = summary.contoursEnabled
      ? `${NUMBER_FORMATTER.format(summary.contourSegmentCount)} CONTOUR SEGMENTS`
      : 'SYNTHETIC SCENE';
    if (summary.automaticThreshold) {
      this.getElement('[data-raster-threshold-value]').textContent = summary.threshold.toFixed(2);
      this.getInput('threshold').value = String(summary.threshold);
    }
    this.renderHistogram(summary);
  }

  setMode(mode: RasterLabDisplayMode): void {
    this.mode = mode;
    for (const button of this.root.querySelectorAll<HTMLButtonElement>('[data-raster-mode]')) {
      button.setAttribute('aria-pressed', String(button.dataset['rasterMode'] === mode));
    }
    this.updateMapPresentation();
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

  setEdgeMode(mode: RasterLabEdgeMode): void {
    this.edgeMode = mode;
    for (const button of this.root.querySelectorAll<HTMLButtonElement>('[data-raster-edge]')) {
      button.setAttribute('aria-pressed', String(button.dataset['rasterEdge'] === mode));
    }
    for (const button of this.root.querySelectorAll<HTMLButtonElement>(
      '[data-raster-edge-direction]'
    )) {
      button.disabled = mode === 'none' || mode === 'laplacian';
    }
    this.updateMapPresentation();
  }

  setEdgeDirection(direction: RasterLabEdgeDirection): void {
    this.edgeDirection = direction;
    for (const button of this.root.querySelectorAll<HTMLButtonElement>(
      '[data-raster-edge-direction]'
    )) {
      button.setAttribute(
        'aria-pressed',
        String(button.dataset['rasterEdgeDirection'] === direction)
      );
    }
    this.updateMapPresentation();
  }

  setMorphologyOperation(operation: RasterLabMorphologyOperation): void {
    this.morphologyOperation = operation;
    for (const button of this.root.querySelectorAll<HTMLButtonElement>(
      '[data-raster-morphology]'
    )) {
      button.setAttribute('aria-pressed', String(button.dataset['rasterMorphology'] === operation));
    }
    this.updateMorphologyControls();
    this.updateMapPresentation();
  }

  setMorphologyMode(mode: RasterLabMorphologyMode): void {
    this.morphologyMode = mode;
    for (const button of this.root.querySelectorAll<HTMLButtonElement>(
      '[data-raster-morphology-mode]'
    )) {
      button.setAttribute('aria-pressed', String(button.dataset['rasterMorphologyMode'] === mode));
    }
    this.updateMorphologyControls();
    this.updateMapPresentation();
  }

  setMorphologyShape(shape: RasterLabMorphologyShape): void {
    for (const button of this.root.querySelectorAll<HTMLButtonElement>(
      '[data-raster-morphology-shape]'
    )) {
      button.setAttribute(
        'aria-pressed',
        String(button.dataset['rasterMorphologyShape'] === shape)
      );
    }
  }

  setMorphologyRadius(radius: number): void {
    this.getElement('[data-raster-morphology-radius-value]').textContent = `${radius} px`;
    this.getInput('morphology-radius').value = String(radius);
  }

  setMorphologyNoDataPolicy(policy: RasterLabMorphologyNoDataPolicy): void {
    for (const button of this.root.querySelectorAll<HTMLButtonElement>(
      '[data-raster-morphology-nodata]'
    )) {
      button.setAttribute(
        'aria-pressed',
        String(button.dataset['rasterMorphologyNodata'] === policy)
      );
    }
  }

  setMorphologyBorderMode(mode: RasterLabMorphologyBorderMode): void {
    this.morphologyBorderMode = mode;
    for (const button of this.root.querySelectorAll<HTMLButtonElement>(
      '[data-raster-morphology-border]'
    )) {
      button.setAttribute(
        'aria-pressed',
        String(button.dataset['rasterMorphologyBorder'] === mode)
      );
    }
    this.updateMorphologyControls();
  }

  setMorphologyBorderValue(value: number): void {
    this.getElement('[data-raster-morphology-border-value]').textContent = value.toFixed(2);
    this.getInput('morphology-border-value').value = String(value);
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
    this.updateMorphologyControls();
  }

  setAutomaticThreshold(enabled: boolean): void {
    this.automaticThreshold = enabled;
    this.getElement('[data-raster-control="otsu"]').setAttribute('aria-pressed', String(enabled));
    if (enabled) this.getInput('threshold-enabled').checked = true;
  }

  setContours(enabled: boolean, level: number): void {
    this.contoursEnabled = enabled;
    this.contourLevel = level;
    this.getInput('contours-enabled').checked = enabled;
    this.getInput('contour-level').value = String(level);
    this.getElement('[data-raster-contour-level]').textContent = level.toFixed(2);
    this.updateMorphologyControls();
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
      const sourceTileButton = target.closest<HTMLButtonElement>('[data-raster-source-tile]');
      const sourceTile = sourceTileButton?.dataset['rasterSourceTile'];
      if (sourceTile === 'full' || sourceTile === 'west' || sourceTile === 'east') {
        this.setSourceTile(sourceTile);
        this.callbacks.onSourceTile?.(sourceTile);
        return;
      }
      const overviewButton = target.closest<HTMLButtonElement>('[data-raster-source-overview]');
      const overview = overviewButton?.dataset['rasterSourceOverview'];
      if (overview === '0' || overview === '1') {
        const level = overview === '0' ? 0 : 1;
        this.setSourceOverview(level);
        this.callbacks.onSourceOverview?.(level);
        return;
      }
      const haloButton = target.closest<HTMLButtonElement>('[data-raster-halo-mode]');
      const haloMode = haloButton?.dataset['rasterHaloMode'];
      if (haloMode === 'off' || haloMode === 'seamless') {
        this.callbacks.onHaloMode?.(haloMode);
        return;
      }
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
      const edgeButton = target.closest<HTMLButtonElement>('[data-raster-edge]');
      const edgeMode = edgeButton?.dataset['rasterEdge'];
      if (
        edgeMode === 'none' ||
        edgeMode === 'sobel' ||
        edgeMode === 'scharr' ||
        edgeMode === 'laplacian'
      ) {
        this.setEdgeMode(edgeMode);
        this.callbacks.onEdgeMode?.(edgeMode);
        return;
      }
      const directionButton = target.closest<HTMLButtonElement>('[data-raster-edge-direction]');
      const direction = directionButton?.dataset['rasterEdgeDirection'];
      if (direction === 'magnitude' || direction === 'x' || direction === 'y') {
        this.setEdgeDirection(direction);
        this.callbacks.onEdgeDirection?.(direction);
        return;
      }
      const morphologyButton = target.closest<HTMLButtonElement>('[data-raster-morphology]');
      const morphologyOperation = morphologyButton?.dataset['rasterMorphology'];
      if (
        morphologyOperation === 'none' ||
        morphologyOperation === 'dilate' ||
        morphologyOperation === 'erode' ||
        morphologyOperation === 'open' ||
        morphologyOperation === 'close'
      ) {
        this.setMorphologyOperation(morphologyOperation);
        this.callbacks.onMorphologyOperation?.(morphologyOperation);
        return;
      }
      const morphologyModeButton = target.closest<HTMLButtonElement>(
        '[data-raster-morphology-mode]'
      );
      const morphologyMode = morphologyModeButton?.dataset['rasterMorphologyMode'];
      if (morphologyMode === 'grayscale' || morphologyMode === 'binary') {
        this.setMorphologyMode(morphologyMode);
        this.callbacks.onMorphologyMode?.(morphologyMode);
        return;
      }
      const morphologyShapeButton = target.closest<HTMLButtonElement>(
        '[data-raster-morphology-shape]'
      );
      const morphologyShape = morphologyShapeButton?.dataset['rasterMorphologyShape'];
      if (morphologyShape === 'square' || morphologyShape === 'cross') {
        this.setMorphologyShape(morphologyShape);
        this.callbacks.onMorphologyShape?.(morphologyShape);
        return;
      }
      const morphologyNoDataButton = target.closest<HTMLButtonElement>(
        '[data-raster-morphology-nodata]'
      );
      const morphologyNoDataPolicy = morphologyNoDataButton?.dataset['rasterMorphologyNodata'];
      if (morphologyNoDataPolicy === 'ignore' || morphologyNoDataPolicy === 'propagate') {
        this.setMorphologyNoDataPolicy(morphologyNoDataPolicy);
        this.callbacks.onMorphologyNoDataPolicy?.(morphologyNoDataPolicy);
        return;
      }
      const morphologyBorderButton = target.closest<HTMLButtonElement>(
        '[data-raster-morphology-border]'
      );
      const morphologyBorderMode = morphologyBorderButton?.dataset['rasterMorphologyBorder'];
      if (
        morphologyBorderMode === 'clamp' ||
        morphologyBorderMode === 'reflect' ||
        morphologyBorderMode === 'constant' ||
        morphologyBorderMode === 'nodata'
      ) {
        this.setMorphologyBorderMode(morphologyBorderMode);
        this.callbacks.onMorphologyBorderMode?.(morphologyBorderMode);
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
        case 'cache-capacity':
          this.callbacks.onCacheCapacity?.(value);
          break;
        case 'smoothing-radius':
          this.setSmoothingRadius(value);
          this.callbacks.onSmoothingRadius?.(value);
          break;
        case 'smoothing-sigma':
          this.setSmoothingSigma(value);
          this.callbacks.onSmoothingSigma?.(value);
          break;
        case 'morphology-radius':
          this.setMorphologyRadius(value);
          this.callbacks.onMorphologyRadius?.(value);
          break;
        case 'morphology-border-value':
          this.setMorphologyBorderValue(value);
          this.callbacks.onMorphologyBorderValue?.(value);
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
        case 'contour-level':
          this.setContours(this.contoursEnabled, value);
          this.callbacks.onContourLevel?.(value);
          break;
        case 'contours-enabled':
          this.setContours(target.checked, this.contourLevel);
          this.callbacks.onContoursEnabled?.(target.checked);
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
      const edgeResponse = summary.edgeMode !== 'none';
      const signedEdge = summary.edgeMode === 'laplacian' || summary.edgeDirection !== 'magnitude';
      const normalizedValue = edgeResponse
        ? clamp((value - minimum) / Math.max(maximum - minimum, 0.000001), 0, 1)
        : summary.mode === 'ndvi'
          ? clamp((value + 0.2) / 1.1, 0, 1)
          : clamp(value, 0, 1);
      const hue = edgeResponse
        ? signedEdge
          ? value < 0
            ? 194
            : 36
          : Math.round(193 - normalizedValue * 150)
        : summary.mode === 'red'
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

  private updateMorphologyControls(): void {
    const morphologyEnabled = this.morphologyOperation !== 'none';
    const binaryMorphologyEnabled = morphologyEnabled && this.morphologyMode === 'binary';
    this.getInput('morphology-radius').disabled = !morphologyEnabled;
    this.getInput('morphology-border-value').disabled =
      !morphologyEnabled || this.morphologyBorderMode !== 'constant';
    this.getInput('threshold-enabled').disabled = binaryMorphologyEnabled;
    this.getInput('contour-level').disabled = binaryMorphologyEnabled;
    for (const button of this.root.querySelectorAll<HTMLButtonElement>(
      '[data-raster-morphology-shape], [data-raster-morphology-nodata], [data-raster-morphology-border]'
    )) {
      button.disabled = !morphologyEnabled;
    }
  }

  private updateMapPresentation(): void {
    const edgeIsSigned = this.edgeDirection !== 'magnitude' || this.edgeMode === 'laplacian';
    const title =
      this.edgeMode === 'none'
        ? this.mode === 'ndvi'
          ? 'Vegetation index · false color'
          : this.mode === 'red'
            ? 'Red reflectance · false color'
            : 'Near-infrared reflectance · false color'
        : this.edgeMode === 'laplacian'
          ? 'Laplacian curvature · signed response'
          : `${this.edgeMode === 'sobel' ? 'Sobel' : 'Scharr'} ${
              this.edgeDirection === 'magnitude'
                ? 'gradient magnitude'
                : `${this.edgeDirection.toUpperCase()} directional gradient`
            } · boundary response`;
    const morphologyLabel =
      this.morphologyOperation === 'none'
        ? ''
        : ` · ${this.morphologyMode === 'binary' ? 'binary' : 'gray'} ${this.morphologyOperation}`;
    this.getElement('[data-raster-map-title]').textContent = `${title}${morphologyLabel}`;
    const legend = this.getElement('[data-raster-legend]');
    legend.dataset['mode'] =
      this.edgeMode === 'none' ? this.mode : edgeIsSigned ? 'edge-signed' : 'edge-magnitude';
    this.getElement('[data-raster-legend-minimum]').textContent =
      this.edgeMode === 'none'
        ? this.mode === 'ndvi'
          ? 'Water / bare'
          : 'Low response'
        : edgeIsSigned
          ? 'Negative slope'
          : 'Low gradient';
    this.getElement('[data-raster-legend-maximum]').textContent =
      this.edgeMode === 'none'
        ? this.mode === 'ndvi'
          ? 'Dense canopy'
          : 'High response'
        : edgeIsSigned
          ? 'Positive slope'
          : 'Strong boundary';
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
            <span class="raster-chip" data-raster-contour-count>SYNTHETIC SCENE</span>
          </div>
          <div class="raster-map-surface" data-raster-surface>
            <span class="raster-coordinate" data-raster-coordinate>L0 / FULL · ORIGIN 0,0 · EPSG:32610</span>
            <span class="raster-scale" data-raster-map-scale>single tile · no halo</span>
          </div>
          <div class="raster-map-footer">
            <div class="raster-legend" data-raster-legend data-mode="ndvi">
              <span class="raster-legend-ramp"></span>
              <div class="raster-legend-labels">
                <span data-raster-legend-minimum>Water / bare</span>
                <span data-raster-legend-maximum>Dense canopy</span>
              </div>
            </div>
            <span class="raster-map-note">Hatching = cloud / invalid halo</span>
          </div>
        </section>

        <aside class="raster-sidebar" aria-label="Raster analysis controls">
          <section class="raster-panel">
            <div class="raster-panel-heading">
              <span class="raster-panel-title">Spectral layers</span>
              <span class="raster-kicker">GPU resident</span>
            </div>
            <div class="raster-source-control" aria-label="External raster tile source">
              <span class="raster-control-label">External tile source <span class="raster-kicker">decoded input</span></span>
              <div class="raster-source-buttons" aria-label="Selected source tile">
                <button class="raster-mode-button" data-raster-source-tile="full" aria-pressed="true">FULL</button>
                <button class="raster-mode-button" data-raster-source-tile="west" aria-pressed="false">WEST</button>
                <button class="raster-mode-button" data-raster-source-tile="east" aria-pressed="false">EAST</button>
              </div>
              <div class="raster-source-overview-buttons" aria-label="Source-provided overview level">
                <button class="raster-mode-button" data-raster-source-overview="0" aria-pressed="true">1× NATIVE</button>
                <button class="raster-mode-button" data-raster-source-overview="1" aria-pressed="false">2× OVERVIEW</button>
              </div>
              <div class="raster-halo-buttons" aria-label="Cross-tile neighborhood ownership">
                <button class="raster-mode-button" data-raster-halo-mode="off" aria-pressed="true">TILE ONLY</button>
                <button class="raster-mode-button" data-raster-halo-mode="seamless" aria-pressed="false">SEAMLESS HALO</button>
              </div>
              <div class="raster-halo-statistics" aria-label="Composed halo and half-open core ownership">
                <span>Cumulative halo</span><span data-raster-halo-radius>off</span>
                <span>Owned core</span><span data-raster-halo-core>selected tile only</span>
                <span>Resident sources</span><span data-raster-halo-sources>no neighbor assembly</span>
              </div>
              <div class="raster-source-description" data-raster-source-description>L0 · FULL</div>
              <div class="raster-source-origin" data-raster-source-origin>Origin 0, 0 · EPSG:32610</div>
              <label class="raster-cache-control">
                <span class="raster-control-label">Bounded tile residency <span class="raster-control-value" data-raster-cache-capacity>0 / 3 tiles</span></span>
                <input class="raster-slider" data-raster-control="cache-capacity" type="range" min="1" max="4" step="1" value="3" aria-label="Resident tile capacity" />
              </label>
              <div class="raster-cache-statistics" aria-label="Live bounded CPU and GPU tile residency">
                <span>CPU decoded</span><span data-raster-cache-cpu>0 B / 0 B</span>
                <span>GPU resident</span><span data-raster-cache-gpu>0 B / 0 B</span>
                <span>Tile cache</span><span data-raster-cache-activity>0 hit · 0 miss · 0 evict</span>
                <span>Graph cache</span><span data-raster-cache-graphs>0 compile · 0 reuse</span>
                <span>Active leases</span><span data-raster-cache-pins>0 tile · 0 graph pinned</span>
              </div>
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
            <div class="raster-control raster-edge-control">
              <span class="raster-control-label">Boundary detection <span class="raster-kicker">GPU stencil</span></span>
              <div class="raster-edge-buttons" aria-label="Edge detection operator">
                <button class="raster-mode-button" data-raster-edge="none" aria-pressed="true">OFF</button>
                <button class="raster-mode-button" data-raster-edge="sobel" aria-pressed="false">SOBEL</button>
                <button class="raster-mode-button" data-raster-edge="scharr" aria-pressed="false">SCHARR</button>
                <button class="raster-mode-button" data-raster-edge="laplacian" aria-pressed="false">LAPLACIAN</button>
              </div>
              <div class="raster-edge-direction-buttons" aria-label="Gradient direction">
                <button class="raster-mode-button" data-raster-edge-direction="magnitude" aria-pressed="true" disabled>MAGNITUDE</button>
                <button class="raster-mode-button" data-raster-edge-direction="x" aria-pressed="false" disabled>∂X</button>
                <button class="raster-mode-button" data-raster-edge-direction="y" aria-pressed="false" disabled>∂Y</button>
              </div>
            </div>
            <div class="raster-control raster-morphology-control">
              <span class="raster-control-label">Analytical morphology <span class="raster-kicker" data-raster-morphology-state>off</span></span>
              <div class="raster-morphology-buttons" aria-label="Morphology operation">
                <button class="raster-mode-button" data-raster-morphology="none" aria-pressed="true">OFF</button>
                <button class="raster-mode-button" data-raster-morphology="dilate" aria-pressed="false">DILATE</button>
                <button class="raster-mode-button" data-raster-morphology="erode" aria-pressed="false">ERODE</button>
                <button class="raster-mode-button" data-raster-morphology="open" aria-pressed="false">OPEN</button>
                <button class="raster-mode-button" data-raster-morphology="close" aria-pressed="false">CLOSE</button>
              </div>
              <div class="raster-morphology-paired-settings">
                <div class="raster-morphology-toggle" aria-label="Morphology sample mode">
                  <button class="raster-mode-button" data-raster-morphology-mode="grayscale" aria-pressed="true">GRAY</button>
                  <button class="raster-mode-button" data-raster-morphology-mode="binary" aria-pressed="false">BINARY</button>
                </div>
                <div class="raster-morphology-toggle" aria-label="Structuring-element connectivity">
                  <button class="raster-mode-button" data-raster-morphology-shape="cross" aria-pressed="false" disabled>4-CROSS</button>
                  <button class="raster-mode-button" data-raster-morphology-shape="square" aria-pressed="true" disabled>8-SQUARE</button>
                </div>
              </div>
              <label class="raster-morphology-setting">
                <span class="raster-control-label">Structure radius <span class="raster-control-value" data-raster-morphology-radius-value>2 px</span></span>
                <input class="raster-slider" data-raster-control="morphology-radius" aria-label="Morphology radius" type="range" min="0" max="8" step="1" value="2" disabled />
              </label>
              <div class="raster-morphology-toggle" aria-label="Neighborhood nodata policy">
                <button class="raster-mode-button" data-raster-morphology-nodata="ignore" aria-pressed="true" disabled>IGNORE NODATA</button>
                <button class="raster-mode-button" data-raster-morphology-nodata="propagate" aria-pressed="false" disabled>STRICT NODATA</button>
              </div>
              <div class="raster-morphology-border-buttons" aria-label="Morphology border mode">
                <button class="raster-mode-button" data-raster-morphology-border="clamp" aria-pressed="true" disabled>CLAMP</button>
                <button class="raster-mode-button" data-raster-morphology-border="reflect" aria-pressed="false" disabled>REFLECT</button>
                <button class="raster-mode-button" data-raster-morphology-border="constant" aria-pressed="false" disabled>CONST</button>
                <button class="raster-mode-button" data-raster-morphology-border="nodata" aria-pressed="false" disabled>NODATA</button>
              </div>
              <label class="raster-morphology-setting">
                <span class="raster-control-label">Constant border <span class="raster-control-value" data-raster-morphology-border-value>0.00</span></span>
                <input class="raster-slider" data-raster-control="morphology-border-value" aria-label="Morphology constant border value" type="range" min="-1" max="1" step="0.05" value="0" disabled />
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
            <div class="raster-control">
              <span class="raster-control-label">
                <label class="raster-threshold-toggle">
                  <input data-raster-control="contours-enabled" type="checkbox" checked />
                  Contour isolines
                </label>
                <span class="raster-control-value" data-raster-contour-level>0.35</span>
              </span>
              <input class="raster-slider" data-raster-control="contour-level" aria-label="Contour level" type="range" min="-0.5" max="1" step="0.01" value="0.35" />
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
              Filters, morphology, and contours share one GPU graph; only 228 summary bytes are read.
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
            <div class="raster-pipeline-step"><span class="raster-step-number">05</span><span class="raster-step-name">Analytical gradient</span><span class="raster-step-state" data-raster-edge-state>off</span></div>
            <div class="raster-pipeline-step"><span class="raster-step-number">06</span><span class="raster-step-name">Grayscale morphology</span><span class="raster-step-state" data-raster-grayscale-morphology-state>off</span></div>
            <div class="raster-pipeline-step"><span class="raster-step-number">07</span><span class="raster-step-name">Contrast + gamma</span><span class="raster-step-state">adjust</span></div>
            <div class="raster-pipeline-step"><span class="raster-step-number">08</span><span class="raster-step-name">Selection threshold</span><span class="raster-step-state" data-raster-threshold-state>off</span></div>
            <div class="raster-pipeline-step"><span class="raster-step-number">09</span><span class="raster-step-name">Binary morphology</span><span class="raster-step-state" data-raster-binary-morphology-state>off</span></div>
            <div class="raster-pipeline-step"><span class="raster-step-number">10</span><span class="raster-step-name">Count, mean + histogram</span><span class="raster-step-state">stats</span></div>
            <div class="raster-pipeline-step"><span class="raster-step-number">11</span><span class="raster-step-name">Indirect contour lines</span><span class="raster-step-state" data-raster-contour-state>off</span></div>
            <div class="raster-histogram-caption" data-raster-footprint>Allocating GPU buffers</div>
          </section>
        </aside>
      </main>

      <footer class="raster-footer">
        <div class="raster-roadmap" aria-label="Planned raster capabilities">
          <span class="raster-kicker">Coming next</span>
          <span class="raster-roadmap-chip">Connected components</span>
          <span class="raster-roadmap-chip">Segmentation</span>
          <span class="raster-roadmap-chip">Tiled contour seams</span>
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

function formatResidencyBytes(byteLength: number): string {
  if (byteLength < 1024) return `${byteLength} B`;
  if (byteLength < 1_048_576) return `${(byteLength / 1024).toFixed(0)} KB`;
  return `${(byteLength / 1_048_576).toFixed(1)} MB`;
}
