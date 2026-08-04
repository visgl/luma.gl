// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import {AnimationLoopTemplate, type AnimationProps} from '@luma.gl/engine';
import {
  CROSS_FILTER_CATEGORY_NAMES,
  CROSS_FILTER_DOMAINS,
  CROSS_FILTER_MAP_DOMAIN,
  makeCrossfilterDatasetAsync
} from './crossfilter-data';
import {CrossfilterEngine, type CrossfilterSummary} from './crossfilter-engine';
import {
  CrossfilterInterface,
  type CrossfilterActiveFilter,
  type CrossfilterBrushEvent,
  type CrossfilterHistogramBrushEvent
} from './crossfilter-interface';

export const title = 'Crossfilter Supremacy';
export const description =
  'One million GPU-resident records, six linked selection dimensions, and zero source-row readbacks.';

/** Full-sized showcase population; visual smoke tests can request a smaller deterministic tier. */
export const CROSSFILTER_SHOWCASE_ROW_COUNT = 1_048_576;

/** Small enough for SwiftShader while retaining every linked-view and rendering code path. */
export const CROSSFILTER_VISUAL_SMOKE_ROW_COUNT = 8_192;

export type CrossfilterBounds = readonly [number, number, number, number];
export type CrossfilterRange = readonly [number, number];
export type CrossfilterHistogramDimension = keyof typeof CROSS_FILTER_DOMAINS;
export type CrossfilterPresetIdentifier = 'all' | 'pacific' | 'anomaly' | 'europe';

type CrossfilterPresetSelection = {
  label: string;
  mapBounds?: CrossfilterBounds;
  scatterBounds?: CrossfilterBounds;
  ranges?: Partial<Record<CrossfilterHistogramDimension, CrossfilterRange>>;
};

type CrossfilterAnimationProps = AnimationProps & {
  crossfilterRowCount?: number;
  crossfilterSeed?: number;
};

type CrossfilterDebugController = {
  readonly ready: boolean;
  readonly rowCount: number;
  readonly selectedCount: number;
  readonly nodeCount: number;
  readonly frameCount: number;
  applyPreset: (identifier: CrossfilterPresetIdentifier) => void;
  clear: () => void;
};

type CrossfilterDebugWindow = Window & {
  __luxFilterShowcase?: CrossfilterDebugController;
};

const CATEGORY_COLORS = ['#72e6d1', '#74aaff', '#ffbe72', '#a98dff', '#fb7db2', '#a6ed8d'] as const;

const HISTOGRAM_PRESENTATION: Record<CrossfilterHistogramDimension, {label: string; unit: string}> =
  {
    value: {label: 'Transaction value', unit: '$'},
    risk: {label: 'Risk probability', unit: '%'},
    hour: {label: 'Local time', unit: 'h'}
  };

const CROSSFILTER_PRESETS: Record<CrossfilterPresetIdentifier, CrossfilterPresetSelection> = {
  all: {label: 'All signals'},
  pacific: {
    label: 'Pacific corridor',
    mapBounds: [0.34, -0.91, 0.96, 0.78],
    ranges: {value: [70, 250]}
  },
  anomaly: {
    label: 'Anomaly hunter',
    scatterBounds: [105, 0.66, 250, 1],
    ranges: {risk: [0.68, 1], value: [105, 250]}
  },
  europe: {
    label: 'Europe after hours',
    mapBounds: [-0.4, -0.18, 0.32, 0.77],
    ranges: {hour: [17, 24]}
  }
};

/**
 * Maps top-left-origin pointer bounds into increasing source-coordinate bounds.
 *
 * The data domain uses the conventional upward-positive Y axis while HTML pointer coordinates
 * increase downward, so the vertical interval is deliberately reflected.
 */
export function makeCrossfilterSelectionBounds(
  normalizedBounds: CrossfilterBounds,
  horizontalDomain: CrossfilterRange,
  verticalDomain: CrossfilterRange
): [number, number, number, number] {
  const [left, top, right, bottom] = normalizedBounds.map(value => clamp(value, 0, 1)) as [
    number,
    number,
    number,
    number
  ];
  return [
    interpolate(horizontalDomain, Math.min(left, right)),
    interpolate(verticalDomain, 1 - Math.max(top, bottom)),
    interpolate(horizontalDomain, Math.max(left, right)),
    interpolate(verticalDomain, 1 - Math.min(top, bottom))
  ];
}

/** Converts increasing source-coordinate bounds into top-left-origin HTML brush coordinates. */
export function makeCrossfilterNormalizedBounds(
  selectionBounds: CrossfilterBounds,
  horizontalDomain: CrossfilterRange,
  verticalDomain: CrossfilterRange
): [number, number, number, number] {
  return [
    normalize(selectionBounds[0], horizontalDomain),
    1 - normalize(selectionBounds[3], verticalDomain),
    normalize(selectionBounds[2], horizontalDomain),
    1 - normalize(selectionBounds[1], verticalDomain)
  ];
}

/** Returns immutable preset coordinates for deterministic interaction and smoke coverage. */
export function getCrossfilterPreset(
  identifier: CrossfilterPresetIdentifier
): CrossfilterPresetSelection {
  return CROSSFILTER_PRESETS[identifier];
}

/**
 * Cinematic linked-map showcase backed by one reusable LuxFilter command graph.
 *
 * The initial synthetic arrays are uploaded once. Brushes only update GPU control buffers; map and
 * scatter draws consume the shared GPU selection mask, while the interface reads back compact
 * histogram, category, and selected-count summaries.
 */
export default class CrossfilterSupremacyAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = '';

  readonly device: Device;

  private engine: CrossfilterEngine | null = null;
  private interface: CrossfilterInterface | null = null;
  private latestSummary: CrossfilterSummary | null = null;
  private readonly activeFilters = new Map<string, CrossfilterActiveFilter>();
  private readonly initializationAbortController = new AbortController();
  private readonly rowCount: number;
  private readonly seed: number | undefined;
  private activeCategory: number | null = null;
  private refreshRequested = false;
  private refreshInFlight = false;
  private redrawRequested = true;
  private finalized = false;
  private frameCount = 0;
  private frameRate = 60;
  private debugController: CrossfilterDebugController | null = null;

  constructor(animationProps: CrossfilterAnimationProps) {
    super(animationProps);
    if (animationProps.device.type !== 'webgpu') {
      throw new Error('Crossfilter Supremacy requires WebGPU');
    }

    this.device = animationProps.device;
    this.rowCount = animationProps.crossfilterRowCount ?? getInitialRowCount();
    this.seed = animationProps.crossfilterSeed;
  }

  override async onInitialize({canvas}: AnimationProps): Promise<void> {
    if (!(canvas instanceof HTMLCanvasElement)) {
      return;
    }

    canvas.setAttribute('role', 'img');
    canvas.setAttribute(
      'aria-label',
      'GPU-resident transaction map and linked transaction-value versus risk scatterplot'
    );

    this.interface = new CrossfilterInterface(canvas.parentElement ?? document.body, canvas, {
      onBrush: event => this.handleViewBrush(event),
      onHistogramBrush: event => this.handleHistogramBrush(event),
      onPreset: identifier => {
        if (isCrossfilterPresetIdentifier(identifier)) {
          this.applyPreset(identifier);
        }
      },
      onReset: () => this.clearAllSelections(),
      onCategoryToggle: identifier => this.toggleCategory(identifier),
      onResize: () => {
        this.redrawRequested = true;
      }
    });
    this.interface.setSummary({totalCount: this.rowCount, selectedCount: 0});
    this.interface.setStatus('Preparing GPU-resident transaction columns · 0%');

    // Paint the dashboard before generating a million rows, then yield between bounded batches so
    // route transitions and cancellation stay responsive even on slower devices.
    await waitForCrossfilterDashboardPaint(this.initializationAbortController.signal);
    if (this.finalized) {
      return;
    }

    try {
      const dataset = await makeCrossfilterDatasetAsync({
        rowCount: this.rowCount,
        seed: this.seed,
        signal: this.initializationAbortController.signal,
        onProgress: (completedRowCount, totalRowCount) => {
          if (!this.finalized) {
            const percentage = Math.round((completedRowCount / totalRowCount) * 100);
            this.interface?.setStatus(
              `Preparing GPU-resident transaction columns · ${percentage}%`
            );
          }
        }
      });
      if (this.finalized) {
        return;
      }

      this.interface.setStatus('Uploading transaction columns and compiling the GPU graph');
      await waitForCrossfilterDashboardPaint(this.initializationAbortController.signal);
      if (this.finalized) {
        return;
      }

      this.engine = new CrossfilterEngine(this.device, {dataset});
      this.interface.setStatus('Computing linked GPU selections and histograms');
      this.installDebugController();
      this.refreshRequested = true;
      await this.flushUpdates();
    } catch (error) {
      if (this.finalized && this.initializationAbortController.signal.aborted) {
        return;
      }
      throw error;
    }
  }

  override onRender({animationLoop, canvasContext}: AnimationProps): void {
    if (!this.interface || !this.engine || this.finalized) {
      return;
    }

    if (this.redrawRequested && !this.refreshInFlight) {
      const mapViewport = this.interface.getMapBounds();
      const scatterViewport = this.interface.getScatterBounds();
      if (
        (mapViewport.width > 0 && mapViewport.height > 0) ||
        (scatterViewport.width > 0 && scatterViewport.height > 0)
      ) {
        this.engine.render({canvasContext, mapViewport, scatterViewport});
        this.redrawRequested = false;
      }
    }

    this.frameCount++;
    if (this.frameCount % 18 === 0 && this.latestSummary) {
      this.frameRate = animationLoop.frameRate.getSampleHz() || this.frameRate;
      this.updateSummary(this.latestSummary);
    }
  }

  override onFinalize(): void {
    this.finalized = true;
    this.initializationAbortController.abort();
    this.interface?.destroy();
    this.interface = null;
    this.engine?.destroy();
    this.engine = null;

    if (typeof window !== 'undefined') {
      const debugWindow = window as CrossfilterDebugWindow;
      if (debugWindow.__luxFilterShowcase === this.debugController) {
        delete debugWindow.__luxFilterShowcase;
      }
    }
  }

  /** Applies a reproducible multi-dimensional brush without rebuilding the GPU graph. */
  applyPreset(identifier: CrossfilterPresetIdentifier): void {
    const engine = this.engine;
    if (!engine || this.finalized) {
      return;
    }

    engine.clearAll();
    this.activeCategory = null;
    this.activeFilters.clear();
    this.interface?.setBrush('map', null);
    this.interface?.setBrush('scatter', null);
    this.interface?.clearHistogramBrushes();
    this.interface?.setActivePreset(identifier);

    const preset = getCrossfilterPreset(identifier);
    if (preset.mapBounds) {
      engine.setMapBounds(preset.mapBounds);
      this.interface?.setBrush(
        'map',
        makeCrossfilterNormalizedBounds(
          preset.mapBounds,
          CROSS_FILTER_MAP_DOMAIN.x,
          CROSS_FILTER_MAP_DOMAIN.y
        )
      );
      this.activeFilters.set('map', {id: 'map', label: 'Map', value: preset.label});
    }

    if (preset.scatterBounds) {
      engine.setScatterBounds(preset.scatterBounds);
      this.interface?.setBrush(
        'scatter',
        makeCrossfilterNormalizedBounds(
          preset.scatterBounds,
          CROSS_FILTER_DOMAINS.value,
          CROSS_FILTER_DOMAINS.risk
        )
      );
      this.activeFilters.set('scatter', {
        id: 'scatter',
        label: 'Scatter',
        value: 'High-value anomalies'
      });
    }

    for (const dimension of Object.keys(preset.ranges ?? {}) as CrossfilterHistogramDimension[]) {
      const range = preset.ranges?.[dimension];
      if (range) {
        engine.setRange(dimension, range);
        this.updateRangeFilter(dimension, range);
        this.interface?.setHistogramBrush(dimension, [
          normalize(range[0], CROSS_FILTER_DOMAINS[dimension]),
          normalize(range[1], CROSS_FILTER_DOMAINS[dimension])
        ]);
      }
    }

    this.interface?.setFilters([...this.activeFilters.values()]);
    this.interface?.setStatus(
      identifier === 'all' ? 'All dimensions cleared' : `${preset.label} · GPU graph reused`
    );
    this.requestRefresh();
  }

  private handleViewBrush(event: CrossfilterBrushEvent): void {
    const engine = this.engine;
    if (!engine || this.finalized) {
      return;
    }

    const isMap = event.id === 'map';
    const horizontalDomain = isMap ? CROSS_FILTER_MAP_DOMAIN.x : CROSS_FILTER_DOMAINS.value;
    const verticalDomain = isMap ? CROSS_FILTER_MAP_DOMAIN.y : CROSS_FILTER_DOMAINS.risk;
    const bounds = event.bounds
      ? makeCrossfilterSelectionBounds(event.bounds, horizontalDomain, verticalDomain)
      : null;

    if (isMap) {
      engine.setMapBounds(bounds);
    } else {
      engine.setScatterBounds(bounds);
    }

    if (bounds) {
      this.activeFilters.set(event.id, {
        id: event.id,
        label: isMap ? 'Map' : 'Scatter',
        value: isMap ? 'Geographic brush' : 'Value × risk brush'
      });
    } else {
      this.activeFilters.delete(event.id);
    }

    this.interface?.setFilters([...this.activeFilters.values()]);
    this.requestRefresh();
  }

  private handleHistogramBrush(event: CrossfilterHistogramBrushEvent): void {
    const engine = this.engine;
    if (!engine || this.finalized || !isHistogramDimension(event.id)) {
      return;
    }

    engine.setRange(event.id, event.range);
    if (event.range) {
      this.updateRangeFilter(event.id, event.range);
    } else {
      this.activeFilters.delete(event.id);
    }

    this.interface?.setFilters([...this.activeFilters.values()]);
    this.requestRefresh();
  }

  private updateRangeFilter(
    dimension: CrossfilterHistogramDimension,
    range: CrossfilterRange
  ): void {
    const value =
      dimension === 'risk'
        ? `${Math.round(range[0] * 100)}–${Math.round(range[1] * 100)}%`
        : dimension === 'hour'
          ? `${Math.round(range[0]).toString().padStart(2, '0')}:00–${Math.round(range[1]).toString().padStart(2, '0')}:00`
          : `$${Math.round(range[0])}–$${Math.round(range[1])}`;
    this.activeFilters.set(dimension, {
      id: dimension,
      label: HISTOGRAM_PRESENTATION[dimension].label,
      value
    });
  }

  private toggleCategory(identifier: string): void {
    const engine = this.engine;
    if (!engine || this.finalized) {
      return;
    }

    const category = Number(identifier);
    if (
      !Number.isInteger(category) ||
      category < 0 ||
      category >= CROSS_FILTER_CATEGORY_NAMES.length
    ) {
      return;
    }

    this.activeCategory = this.activeCategory === category ? null : category;
    engine.setCategory(this.activeCategory);
    if (this.activeCategory === null) {
      this.activeFilters.delete('category');
    } else {
      this.activeFilters.set('category', {
        id: 'category',
        label: 'Cohort',
        value: CROSS_FILTER_CATEGORY_NAMES[this.activeCategory]!,
        color: CATEGORY_COLORS[this.activeCategory]
      });
    }

    this.interface?.setFilters([...this.activeFilters.values()]);
    this.requestRefresh();
  }

  private clearAllSelections(): void {
    this.applyPreset('all');
  }

  private requestRefresh(): void {
    if (this.finalized) {
      return;
    }
    this.refreshRequested = true;
    if (!this.refreshInFlight) {
      void this.flushUpdates().catch(error => {
        if (!this.finalized) {
          const message = error instanceof Error ? error.message : String(error);
          this.interface?.setStatus(`GPU selection unavailable: ${message}`);
        }
      });
    }
  }

  private async flushUpdates(): Promise<void> {
    const engine = this.engine;
    if (!engine || this.refreshInFlight || this.finalized) {
      return;
    }

    this.refreshInFlight = true;
    try {
      while (this.refreshRequested && !this.finalized) {
        this.refreshRequested = false;
        const summary = await engine.update();
        if (this.finalized) {
          return;
        }

        this.latestSummary = summary;
        this.redrawRequested = true;
        this.updateSummary(summary);
        for (const dimension of Object.keys(
          CROSS_FILTER_DOMAINS
        ) as CrossfilterHistogramDimension[]) {
          const histogram = summary.histograms[dimension];
          const presentation = HISTOGRAM_PRESENTATION[dimension];
          this.interface?.setHistogram(dimension, histogram.bins, {
            baselineBins: histogram.baselineBins,
            domain: [...CROSS_FILTER_DOMAINS[dimension]],
            label: presentation.label,
            unit: presentation.unit
          });
        }

        this.interface?.setGroups(
          CROSS_FILTER_CATEGORY_NAMES.map((label, index) => ({
            id: String(index),
            label,
            count: summary.categoryCounts[index] ?? 0,
            color: CATEGORY_COLORS[index]
          }))
        );
        this.interface?.setStatus(
          `${summary.nodeCount} reusable GPU passes · source rows never leave device memory`
        );
      }
    } finally {
      this.refreshInFlight = false;
    }
  }

  private updateSummary(summary: CrossfilterSummary): void {
    this.interface?.setSummary({
      totalCount: summary.rowCount,
      selectedCount: summary.selectedCount,
      frameRate: this.frameRate,
      encodeTimeMilliseconds: summary.encodeTimeMilliseconds,
      readbackTimeMilliseconds: summary.readbackTimeMilliseconds,
      graphNodeCount: summary.nodeCount,
      residentBytes: this.engine?.residentByteLength
    });
  }

  private installDebugController(): void {
    if (typeof window === 'undefined') {
      return;
    }

    const viewer = this;
    this.debugController = {
      get ready() {
        return viewer.latestSummary !== null;
      },
      get rowCount() {
        return viewer.rowCount;
      },
      get selectedCount() {
        return viewer.latestSummary?.selectedCount ?? 0;
      },
      get nodeCount() {
        return viewer.latestSummary?.nodeCount ?? 0;
      },
      get frameCount() {
        return viewer.frameCount;
      },
      applyPreset: identifier => viewer.applyPreset(identifier),
      clear: () => viewer.clearAllSelections()
    };
    (window as CrossfilterDebugWindow).__luxFilterShowcase = this.debugController;
  }
}

function waitForCrossfilterDashboardPaint(signal: AbortSignal): Promise<void> {
  if (signal.aborted) {
    return Promise.resolve();
  }

  return new Promise(resolve => {
    let animationFrame: number | null = null;
    let timeout: ReturnType<typeof setTimeout> | null = null;
    const finish = () => {
      if (animationFrame !== null) {
        cancelAnimationFrame(animationFrame);
        animationFrame = null;
      }
      if (timeout !== null) {
        clearTimeout(timeout);
        timeout = null;
      }
      signal.removeEventListener('abort', finish);
      resolve();
    };
    signal.addEventListener('abort', finish, {once: true});

    if (typeof requestAnimationFrame === 'function') {
      animationFrame = requestAnimationFrame(() => {
        animationFrame = null;
        timeout = setTimeout(finish, 0);
      });
      return;
    }
    timeout = setTimeout(finish, 0);
  });
}

function getInitialRowCount(): number {
  if (typeof window === 'undefined') {
    return CROSSFILTER_SHOWCASE_ROW_COUNT;
  }

  const parameters = new URLSearchParams(window.location.search);
  if (parameters.has('visual-smoke')) {
    return CROSSFILTER_VISUAL_SMOKE_ROW_COUNT;
  }

  const requestedCount = Number(parameters.get('rows'));
  if (Number.isInteger(requestedCount) && requestedCount >= 128) {
    return Math.min(requestedCount, CROSSFILTER_SHOWCASE_ROW_COUNT);
  }

  return CROSSFILTER_SHOWCASE_ROW_COUNT;
}

function isCrossfilterPresetIdentifier(
  identifier: string
): identifier is CrossfilterPresetIdentifier {
  return (
    identifier === 'all' ||
    identifier === 'pacific' ||
    identifier === 'anomaly' ||
    identifier === 'europe'
  );
}

function isHistogramDimension(identifier: string): identifier is CrossfilterHistogramDimension {
  return identifier === 'value' || identifier === 'risk' || identifier === 'hour';
}

function interpolate(domain: CrossfilterRange, normalizedValue: number): number {
  return domain[0] + (domain[1] - domain[0]) * normalizedValue;
}

function normalize(value: number, domain: CrossfilterRange): number {
  return clamp((value - domain[0]) / (domain[1] - domain[0]), 0, 1);
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}
