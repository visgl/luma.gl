// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {CROSSFILTER_STYLES} from './crossfilter-styles';

/** Canvas-backed viewports use physical pixels and a top-left origin. */
export type CrossfilterViewport = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/** Both brush axes increase from the top-left corner of their visible surface. */
export type CrossfilterBrushEvent = {
  id: 'map' | 'scatter';
  bounds: [number, number, number, number] | null;
  phase: 'start' | 'update' | 'end';
};

/** Histogram selections include normalized coordinates and their configured data domain. */
export type CrossfilterHistogramBrushEvent = {
  id: string;
  range: [number, number] | null;
  normalizedRange: [number, number] | null;
  phase: 'start' | 'update' | 'end';
};

/** Optional event handlers for the standalone and Docusaurus-hosted dashboard. */
export type CrossfilterInterfaceCallbacks = {
  onBrush?: (event: CrossfilterBrushEvent) => void;
  onHistogramBrush?: (event: CrossfilterHistogramBrushEvent) => void;
  onPreset?: (identifier: string) => void;
  onReset?: () => void;
  onCategoryToggle?: (identifier: string) => void;
  onResize?: () => void;
};

/** Optional instrumentation is omitted until the application can report a real value. */
export type CrossfilterSummaryDisplay = {
  totalCount: number;
  selectedCount: number;
  frameRate?: number;
  readbackTimeMilliseconds?: number;
  encodeTimeMilliseconds?: number;
  graphNodeCount?: number;
  residentBytes?: number;
};

/** Category identifiers are strings so numeric source keys remain lossless. */
export type CrossfilterGroup = {
  id: string;
  label: string;
  count: number;
  color?: string;
};

/** Application-owned descriptions shown in the active-selection ribbon. */
export type CrossfilterActiveFilter = {
  id: string;
  label: string;
  value: string;
  color?: string;
};

export type CrossfilterHistogramOptions = {
  domain?: [number, number];
  baselineBins?: readonly number[] | Uint32Array;
  label?: string;
  unit?: string;
};

type HistogramDefinition = {
  id: string;
  label: string;
  unit: string;
  domain: [number, number];
  color: string;
};

type HistogramElements = {
  card: HTMLElement;
  surface: HTMLElement;
  bars: HTMLElement;
  brush: HTMLElement;
  minimum: HTMLElement;
  maximum: HTMLElement;
  title: HTMLElement;
  unit: HTMLElement;
};

type ViewIdentifier = CrossfilterBrushEvent['id'];
type BrushPhase = CrossfilterBrushEvent['phase'];

const HISTOGRAM_DEFINITIONS: readonly HistogramDefinition[] = [
  {id: 'value', label: 'Flow intensity', unit: 'SIGNAL', domain: [0, 100], color: '#54edff'},
  {id: 'risk', label: 'Anomaly probability', unit: 'RISK', domain: [0, 1], color: '#ff839a'},
  {id: 'hour', label: 'UTC activity window', unit: 'UTC', domain: [0, 24], color: '#aa91ff'}
];

const DEFAULT_GROUPS: readonly CrossfilterGroup[] = [
  {id: '0', label: 'Pacific arc', count: 0, color: '#54edff'},
  {id: '1', label: 'North America', count: 0, color: '#81b1ff'},
  {id: '2', label: 'South America', count: 0, color: '#83e2b5'},
  {id: '3', label: 'Europe / Africa', count: 0, color: '#aa91ff'},
  {id: '4', label: 'Middle East', count: 0, color: '#ffc778'},
  {id: '5', label: 'Asia corridor', count: 0, color: '#ff839a'}
];

const NUMBER_FORMATTER = new Intl.NumberFormat('en-US');
const COMPACT_NUMBER_FORMATTER = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1
});

/**
 * Owns a transparent cinematic interface over a single application-owned GPU canvas.
 *
 * The canvas is never replaced or modified. Brushing, controls, and chart annotations live in a
 * scoped overlay while the application renders GPU-resident records into the returned viewports.
 */
export class CrossfilterInterface {
  private readonly container: HTMLElement;
  private readonly canvas: HTMLCanvasElement;
  private readonly callbacks: CrossfilterInterfaceCallbacks;
  private readonly root: HTMLElement;
  private readonly histogramElements = new Map<string, HistogramElements>();
  private readonly histogramDefinitions = new Map<string, HistogramDefinition>();
  private readonly selectedGroupIdentifiers = new Set<string>();
  private readonly cleanups: Array<() => void> = [];
  private readonly originalPosition: string;
  private readonly originalMinimumHeight: string;
  private readonly positionWasUpdated: boolean;
  private readonly minimumHeightWasUpdated: boolean;
  private resizeObserver: ResizeObserver | null = null;
  private resizeAnimationFrame: number | null = null;
  private destroyed = false;

  constructor(
    container: HTMLElement,
    canvas: HTMLCanvasElement,
    callbacks: CrossfilterInterfaceCallbacks = {}
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
    this.root.setAttribute('data-crossfilter-dashboard', '');
    this.root.setAttribute('aria-label', 'Synthetic global GPU crossfilter intelligence dashboard');
    this.root.innerHTML = `<style>${CROSSFILTER_STYLES}</style>${makeDashboardHtml()}`;
    container.appendChild(this.root);

    for (const definition of HISTOGRAM_DEFINITIONS) {
      this.histogramDefinitions.set(definition.id, {...definition});
      this.histogramElements.set(definition.id, this.getHistogramElements(definition.id));
    }

    this.bindViewBrush('map');
    this.bindViewBrush('scatter');
    for (const definition of HISTOGRAM_DEFINITIONS) this.bindHistogramBrush(definition.id);
    this.bindControls();
    this.observeResize();
    this.setGroups(DEFAULT_GROUPS);
    this.setFilters([]);
    this.setSummary({totalCount: 1_048_576, selectedCount: 1_048_576});
    this.setStatus(
      'Synthetic signal field ready · drag any view to compose a GPU-native selection.'
    );
  }

  /** Updates only existing text nodes, avoiding reflow while the render loop is active. */
  setSummary(summary: CrossfilterSummaryDisplay): void {
    const safeTotalCount = Math.max(0, Math.floor(summary.totalCount));
    const safeSelectedCount = Math.max(0, Math.floor(summary.selectedCount));
    const selectedPercentage =
      safeTotalCount === 0 ? 0 : Math.min(100, (safeSelectedCount / safeTotalCount) * 100);
    this.getElement('[data-total-count]').textContent = NUMBER_FORMATTER.format(safeTotalCount);
    this.getElement('[data-selected-count]').textContent =
      NUMBER_FORMATTER.format(safeSelectedCount);
    this.getElement('[data-selected-percentage]').textContent =
      `${selectedPercentage.toFixed(selectedPercentage < 10 ? 1 : 0)}%`;
    this.getElement('[data-frame-rate]').textContent = Number.isFinite(summary.frameRate)
      ? `${Math.round(summary.frameRate ?? 0)} fps`
      : '— fps';
    this.getElement('[data-readback-time]').textContent = Number.isFinite(
      summary.readbackTimeMilliseconds
    )
      ? `${(summary.readbackTimeMilliseconds ?? 0).toFixed(2)} ms`
      : '— ms';
    this.getElement('[data-encode-time]').textContent = Number.isFinite(
      summary.encodeTimeMilliseconds
    )
      ? `${(summary.encodeTimeMilliseconds ?? 0).toFixed(2)} ms`
      : '— ms';
    this.getElement('[data-graph-nodes]').textContent = Number.isFinite(summary.graphNodeCount)
      ? `${summary.graphNodeCount} passes`
      : 'resident graph';
    this.getElement('[data-resident-bytes]').textContent = Number.isFinite(summary.residentBytes)
      ? `${formatBytes(summary.residentBytes ?? 0)} resident`
      : 'zero-copy resident';
    this.getElement('[data-map-density]').textContent =
      `${COMPACT_NUMBER_FORMATTER.format(safeSelectedCount)} selected signals`;
  }

  /** Replaces one compact histogram while preserving its active pointer selection. */
  setHistogram(
    identifier: string,
    bins: readonly number[] | Uint32Array,
    options: CrossfilterHistogramOptions = {}
  ): void {
    const elements = this.histogramElements.get(identifier);
    const definition = this.histogramDefinitions.get(identifier);
    if (!elements || !definition) return;

    if (options.domain) definition.domain = [...options.domain];
    if (options.label) definition.label = options.label;
    if (options.unit) definition.unit = options.unit;
    elements.title.textContent = definition.label;
    elements.unit.textContent = definition.unit;
    elements.minimum.textContent = formatDomainValue(definition.domain[0], definition.unit);
    elements.maximum.textContent = formatDomainValue(definition.domain[1], definition.unit);

    let maximumCount = 1;
    for (const count of bins) maximumCount = Math.max(maximumCount, count);
    if (options.baselineBins) {
      for (const count of options.baselineBins) maximumCount = Math.max(maximumCount, count);
    }

    elements.bars.innerHTML = Array.from(bins, (count, index) => {
      const height = Math.max(0, (count / maximumCount) * 100);
      const baselineHeight = options.baselineBins
        ? Math.max(0, ((options.baselineBins[index] ?? 0) / maximumCount) * 100)
        : 0;
      const baseline = baselineHeight
        ? `<span class="crossfilter-histogram-baseline" style="height:${baselineHeight.toFixed(2)}%"></span>`
        : '';
      return `<span class="crossfilter-histogram-bin" title="${NUMBER_FORMATTER.format(count)} synthetic signals">${baseline}<span class="crossfilter-histogram-bar" style="height:${height.toFixed(2)}%"></span></span>`;
    }).join('');
  }

  /** Category labels remain escaped because applications may derive them from outside data. */
  setGroups(groups: readonly CrossfilterGroup[]): void {
    const maximumCount = Math.max(1, ...groups.map(group => Math.max(0, group.count)));
    const list = this.getElement('[data-category-groups]');
    list.innerHTML = groups
      .map(group => {
        const color = sanitizeColor(group.color);
        const width = (Math.max(0, group.count) / maximumCount) * 100;
        const selected = this.selectedGroupIdentifiers.has(group.id);
        return `<button class="crossfilter-group" type="button" data-category="${escapeHtml(group.id)}" data-crossfilter-cohort="${escapeHtml(group.id)}" aria-pressed="${selected}" aria-label="Filter synthetic ${escapeHtml(group.label)} signals">
          <span class="crossfilter-group-name">${escapeHtml(group.label)}</span>
          <span class="crossfilter-group-track"><span class="crossfilter-group-fill" style="--group-color:${color};width:${width.toFixed(2)}%"></span></span>
          <span class="crossfilter-group-count">${COMPACT_NUMBER_FORMATTER.format(group.count)}</span>
        </button>`;
      })
      .join('');
  }

  /** Displays application-authored active filters without rebuilding the GPU-backed views. */
  setFilters(filters: readonly CrossfilterActiveFilter[]): void {
    const track = this.getElement('[data-active-filters]');
    track.innerHTML = filters.length
      ? filters
          .map(filter => {
            const color = sanitizeColor(filter.color);
            return `<span class="crossfilter-filter-chip" data-filter-id="${escapeHtml(filter.id)}" style="--chip-color:${color}"><span>${escapeHtml(filter.label)}</span><span>·</span><span>${escapeHtml(filter.value)}</span></span>`;
          })
          .join('')
      : '<span class="crossfilter-filter-empty">All dimensions open · brush the map, scatter, or histograms</span>';
    this.getElement('[data-active-filter-count]').textContent = String(filters.length);
    if (!filters.some(filter => filter.id === 'category')) {
      this.selectedGroupIdentifiers.clear();
      for (const button of this.root.querySelectorAll('[data-category]')) {
        button.setAttribute('aria-pressed', 'false');
      }
    }
    for (const identifier of this.histogramElements.keys()) {
      if (!filters.some(filter => filter.id === identifier)) {
        this.setHistogramBrush(identifier, null);
      }
    }
    if (filters.length === 0) this.setActivePreset('all');
  }

  /** Allows application presets to mirror their normalized two-dimensional selections. */
  setBrush(identifier: ViewIdentifier, bounds: [number, number, number, number] | null): void {
    const brush = this.getElement(`[data-view-brush="${identifier}"]`);
    if (!bounds) {
      brush.dataset.active = 'false';
      return;
    }
    const minimumX = clamp(Math.min(bounds[0], bounds[2]), 0, 1);
    const minimumY = clamp(Math.min(bounds[1], bounds[3]), 0, 1);
    const maximumX = clamp(Math.max(bounds[0], bounds[2]), 0, 1);
    const maximumY = clamp(Math.max(bounds[1], bounds[3]), 0, 1);
    Object.assign(brush.style, {
      left: `${minimumX * 100}%`,
      top: `${minimumY * 100}%`,
      width: `${(maximumX - minimumX) * 100}%`,
      height: `${(maximumY - minimumY) * 100}%`
    });
    brush.dataset.active = 'true';
  }

  /** Mirrors an application-defined normalized histogram selection. */
  setHistogramBrush(identifier: string, normalizedRange: [number, number] | null): void {
    const elements = this.histogramElements.get(identifier);
    if (!elements) return;
    if (!normalizedRange) {
      elements.brush.dataset.active = 'false';
      return;
    }
    const minimum = clamp(Math.min(...normalizedRange), 0, 1);
    const maximum = clamp(Math.max(...normalizedRange), 0, 1);
    elements.brush.style.left = `${minimum * 100}%`;
    elements.brush.style.width = `${(maximum - minimum) * 100}%`;
    elements.brush.dataset.active = 'true';
  }

  /** Clears visual histogram intervals before an application-owned preset replaces selections. */
  clearHistogramBrushes(): void {
    for (const identifier of this.histogramElements.keys()) {
      this.setHistogramBrush(identifier, null);
    }
  }

  /** Returns the map's clipped physical canvas viewport with a top-left origin. */
  getMapBounds(): CrossfilterViewport {
    return this.getCanvasViewport(this.getElement('[data-map-surface]'));
  }

  /** Returns the scatterplot's clipped physical canvas viewport with a top-left origin. */
  getScatterBounds(): CrossfilterViewport {
    return this.getCanvasViewport(this.getElement('[data-scatter-surface]'));
  }

  /** Announces actual application lifecycle state without fabricating telemetry. */
  setStatus(message: string): void {
    this.getElement('[data-crossfilter-status]').textContent = message;
  }

  /** Synchronizes accessible preset presentation when an application changes presets externally. */
  setActivePreset(identifier: string): void {
    const buttons = this.root.querySelectorAll<HTMLButtonElement>('[data-preset]');
    for (const button of buttons) {
      button.setAttribute('aria-pressed', String(button.dataset.preset === identifier));
    }
  }

  /** Removes only resources owned by the interface and restores modified inline styles. */
  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    if (this.resizeAnimationFrame !== null) {
      cancelAnimationFrame(this.resizeAnimationFrame);
      this.resizeAnimationFrame = null;
    }
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    for (const cleanup of this.cleanups.splice(0)) cleanup();
    this.root.remove();
    if (this.positionWasUpdated) this.container.style.position = this.originalPosition;
    if (this.minimumHeightWasUpdated) this.container.style.minHeight = this.originalMinimumHeight;
  }

  private bindControls(): void {
    const click = (event: Event): void => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const preset = target.closest<HTMLButtonElement>('[data-preset]');
      if (preset?.dataset.preset) {
        this.setActivePreset(preset.dataset.preset);
        this.callbacks.onPreset?.(preset.dataset.preset);
        return;
      }
      if (target.closest('[data-reset-filters]')) {
        this.clearBrushes();
        this.selectedGroupIdentifiers.clear();
        for (const button of this.root.querySelectorAll('[data-category]')) {
          button.setAttribute('aria-pressed', 'false');
        }
        this.setActivePreset('all');
        this.callbacks.onReset?.();
        return;
      }
      const category = target.closest<HTMLButtonElement>('[data-category]');
      if (!category?.dataset.category) return;
      const identifier = category.dataset.category;
      const wasSelected = this.selectedGroupIdentifiers.has(identifier);
      this.selectedGroupIdentifiers.clear();
      if (!wasSelected) this.selectedGroupIdentifiers.add(identifier);
      for (const button of this.root.querySelectorAll<HTMLButtonElement>('[data-category]')) {
        button.setAttribute('aria-pressed', String(button === category && !wasSelected));
      }
      this.callbacks.onCategoryToggle?.(identifier);
    };
    this.listen(this.root, 'click', click);
  }

  private bindViewBrush(identifier: ViewIdentifier): void {
    const surface = this.getElement(`[data-${identifier}-surface]`);
    let pointerIdentifier: number | null = null;
    let origin: readonly [number, number] = [0, 0];

    const notify = (event: PointerEvent, phase: BrushPhase): void => {
      const position = getNormalizedPointer(surface, event);
      const bounds: [number, number, number, number] = [
        Math.min(origin[0], position[0]),
        Math.min(origin[1], position[1]),
        Math.max(origin[0], position[0]),
        Math.max(origin[1], position[1])
      ];
      this.setBrush(identifier, bounds);
      this.callbacks.onBrush?.({id: identifier, bounds, phase});
    };

    const pointerDown = (event: Event): void => {
      if (!(event instanceof PointerEvent) || event.button !== 0) return;
      event.preventDefault();
      pointerIdentifier = event.pointerId;
      origin = getNormalizedPointer(surface, event);
      surface.setPointerCapture?.(event.pointerId);
      notify(event, 'start');
    };

    const pointerMove = (event: Event): void => {
      if (!(event instanceof PointerEvent) || event.pointerId !== pointerIdentifier) return;
      notify(event, 'update');
    };

    const pointerUp = (event: Event): void => {
      if (!(event instanceof PointerEvent) || event.pointerId !== pointerIdentifier) return;
      notify(event, 'end');
      if (surface.hasPointerCapture?.(event.pointerId)) {
        surface.releasePointerCapture(event.pointerId);
      }
      pointerIdentifier = null;
    };

    const pointerCancel = (event: Event): void => {
      if (!(event instanceof PointerEvent) || event.pointerId !== pointerIdentifier) return;
      if (surface.hasPointerCapture?.(event.pointerId)) {
        surface.releasePointerCapture(event.pointerId);
      }
      pointerIdentifier = null;
      this.setBrush(identifier, null);
      this.callbacks.onBrush?.({id: identifier, bounds: null, phase: 'end'});
    };

    const doubleClick = (event: Event): void => {
      event.preventDefault();
      this.setBrush(identifier, null);
      this.callbacks.onBrush?.({id: identifier, bounds: null, phase: 'end'});
    };

    const keyboard = (event: Event): void => {
      if (!(event instanceof KeyboardEvent) || event.key !== 'Escape') return;
      this.setBrush(identifier, null);
      this.callbacks.onBrush?.({id: identifier, bounds: null, phase: 'end'});
    };

    this.listen(surface, 'pointerdown', pointerDown);
    this.listen(surface, 'pointermove', pointerMove);
    this.listen(surface, 'pointerup', pointerUp);
    this.listen(surface, 'pointercancel', pointerCancel);
    this.listen(surface, 'dblclick', doubleClick);
    this.listen(surface, 'keydown', keyboard);
  }

  private bindHistogramBrush(identifier: string): void {
    const elements = this.histogramElements.get(identifier);
    if (!elements) return;
    let pointerIdentifier: number | null = null;
    let start = 0;

    const notify = (event: PointerEvent, phase: BrushPhase): void => {
      const position = getNormalizedPointer(elements.surface, event)[0];
      const normalizedRange: [number, number] = [
        Math.min(start, position),
        Math.max(start, position)
      ];
      const definition = this.histogramDefinitions.get(identifier);
      if (!definition) return;
      const extent = definition.domain[1] - definition.domain[0];
      const range: [number, number] = [
        definition.domain[0] + normalizedRange[0] * extent,
        definition.domain[0] + normalizedRange[1] * extent
      ];
      this.setHistogramBrush(identifier, normalizedRange);
      this.callbacks.onHistogramBrush?.({id: identifier, range, normalizedRange, phase});
    };

    const pointerDown = (event: Event): void => {
      if (!(event instanceof PointerEvent) || event.button !== 0) return;
      event.preventDefault();
      pointerIdentifier = event.pointerId;
      start = getNormalizedPointer(elements.surface, event)[0];
      elements.surface.setPointerCapture?.(event.pointerId);
      notify(event, 'start');
    };

    const pointerMove = (event: Event): void => {
      if (!(event instanceof PointerEvent) || event.pointerId !== pointerIdentifier) return;
      notify(event, 'update');
    };

    const pointerUp = (event: Event): void => {
      if (!(event instanceof PointerEvent) || event.pointerId !== pointerIdentifier) return;
      notify(event, 'end');
      if (elements.surface.hasPointerCapture?.(event.pointerId)) {
        elements.surface.releasePointerCapture(event.pointerId);
      }
      pointerIdentifier = null;
    };

    const clear = (event: Event): void => {
      event.preventDefault();
      if (event instanceof PointerEvent && event.pointerId === pointerIdentifier) {
        if (elements.surface.hasPointerCapture?.(event.pointerId)) {
          elements.surface.releasePointerCapture(event.pointerId);
        }
        pointerIdentifier = null;
      }
      this.setHistogramBrush(identifier, null);
      this.callbacks.onHistogramBrush?.({
        id: identifier,
        range: null,
        normalizedRange: null,
        phase: 'end'
      });
    };

    const keyboard = (event: Event): void => {
      if (event instanceof KeyboardEvent && event.key === 'Escape') clear(event);
    };

    this.listen(elements.surface, 'pointerdown', pointerDown);
    this.listen(elements.surface, 'pointermove', pointerMove);
    this.listen(elements.surface, 'pointerup', pointerUp);
    this.listen(elements.surface, 'pointercancel', clear);
    this.listen(elements.surface, 'dblclick', clear);
    this.listen(elements.surface, 'keydown', keyboard);
  }

  private clearBrushes(): void {
    this.setBrush('map', null);
    this.setBrush('scatter', null);
    this.clearHistogramBrushes();
  }

  private observeResize(): void {
    const onResize = (): void => {
      if (this.destroyed || this.resizeAnimationFrame !== null) return;
      this.resizeAnimationFrame = requestAnimationFrame(() => {
        this.resizeAnimationFrame = null;
        if (!this.destroyed) this.callbacks.onResize?.();
      });
    };
    // Narrow layouts scroll the overlay independently of its stationary GPU canvas.
    this.listen(this.root, 'scroll', onResize);
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(onResize);
      this.resizeObserver.observe(this.container);
      this.resizeObserver.observe(this.canvas);
      this.resizeObserver.observe(this.getElement('[data-map-surface]'));
      this.resizeObserver.observe(this.getElement('[data-scatter-surface]'));
    } else {
      this.listen(window, 'resize', onResize);
    }
  }

  private getCanvasViewport(element: HTMLElement): CrossfilterViewport {
    const canvasRectangle = this.canvas.getBoundingClientRect();
    const surfaceRectangle = element.getBoundingClientRect();
    if (canvasRectangle.width <= 0 || canvasRectangle.height <= 0) {
      return {x: 0, y: 0, width: 0, height: 0};
    }
    const scaleX = this.canvas.width / canvasRectangle.width;
    const scaleY = this.canvas.height / canvasRectangle.height;
    const minimumX = clamp(
      Math.round((surfaceRectangle.left - canvasRectangle.left) * scaleX),
      0,
      this.canvas.width
    );
    const minimumY = clamp(
      Math.round((surfaceRectangle.top - canvasRectangle.top) * scaleY),
      0,
      this.canvas.height
    );
    const maximumX = clamp(
      Math.round((surfaceRectangle.right - canvasRectangle.left) * scaleX),
      0,
      this.canvas.width
    );
    const maximumY = clamp(
      Math.round((surfaceRectangle.bottom - canvasRectangle.top) * scaleY),
      0,
      this.canvas.height
    );
    return {
      x: minimumX,
      y: minimumY,
      width: Math.max(0, maximumX - minimumX),
      height: Math.max(0, maximumY - minimumY)
    };
  }

  private getHistogramElements(identifier: string): HistogramElements {
    const card = this.getElement(`[data-crossfilter-histogram="${identifier}"]`);
    const get = (selector: string): HTMLElement => {
      const element = card.querySelector<HTMLElement>(selector);
      if (!element) throw new Error('Crossfilter histogram template is incomplete');
      return element;
    };
    return {
      card,
      surface: get('[data-histogram-surface]'),
      bars: get('[data-histogram-bars]'),
      brush: get('[data-histogram-brush]'),
      minimum: get('[data-histogram-minimum]'),
      maximum: get('[data-histogram-maximum]'),
      title: get('[data-histogram-title]'),
      unit: get('[data-histogram-unit]')
    };
  }

  private getElement(selector: string): HTMLElement {
    const element = this.root.querySelector<HTMLElement>(selector);
    if (!element) throw new Error('Crossfilter interface template is incomplete');
    return element;
  }

  private listen(target: EventTarget, eventName: string, handler: EventListener): void {
    target.addEventListener(eventName, handler);
    this.cleanups.push(() => target.removeEventListener(eventName, handler));
  }
}

function makeDashboardHtml(): string {
  return `<div class="crossfilter-shell">
    <header class="crossfilter-header">
      <div class="crossfilter-brand">
        <span class="crossfilter-brand-mark" aria-hidden="true">
          <svg viewBox="0 0 32 32" fill="none"><path d="M16 3 27 9.4v13.2L16 29 5 22.6V9.4L16 3Z" stroke="currentColor" stroke-width="1.4"/><path d="m5 9.4 11 6.5 11-6.5M16 16v13M10.4 12.6l11 6.4" stroke="currentColor" stroke-opacity=".74" stroke-width="1.1"/><circle cx="16" cy="16" r="2.4" fill="currentColor"/></svg>
        </span>
        <div><span class="crossfilter-eyebrow">LUXFILTER / SYNTHETIC PLANETARY COMPUTE</span><h1>Million-Row Crossfilter Explorer</h1></div>
      </div>
      <div class="crossfilter-header-meta">
        <span class="crossfilter-badge"><span class="crossfilter-live-dot"></span>LIVE GPU FIELD</span>
        <span class="crossfilter-badge">WEBGPU · ZERO COPY</span>
      </div>
    </header>

    <nav class="crossfilter-command-row" aria-label="Synthetic signal presets">
      <div class="crossfilter-presets">
        <span class="crossfilter-label">SCENARIO</span>
        <button class="crossfilter-preset" type="button" data-preset="all" aria-pressed="true">Global field</button>
        <button class="crossfilter-preset" type="button" data-preset="pacific" aria-pressed="false">Pacific surge</button>
        <button class="crossfilter-preset" type="button" data-preset="anomaly" aria-pressed="false">Anomaly hunt</button>
        <button class="crossfilter-preset" type="button" data-preset="europe" aria-pressed="false">Europe after dark</button>
      </div>
      <button class="crossfilter-reset" type="button" data-reset-filters>Reset dimensions</button>
    </nav>

    <section class="crossfilter-metrics" aria-label="GPU filter telemetry">
      <article class="crossfilter-metric"><span class="crossfilter-label">GPU-resident signals</span><strong class="crossfilter-metric-value" data-total-count>—</strong></article>
      <article class="crossfilter-metric"><span class="crossfilter-label">Live crossfilter match</span><strong class="crossfilter-metric-value"><span data-selected-count>—</span> <span data-selected-percentage>—</span></strong></article>
      <article class="crossfilter-metric"><span class="crossfilter-label">Summary readback</span><strong class="crossfilter-metric-value" data-readback-time>— ms</strong></article>
      <article class="crossfilter-metric"><span class="crossfilter-label">CPU graph encode</span><strong class="crossfilter-metric-value" data-encode-time>— ms</strong></article>
      <article class="crossfilter-metric"><span class="crossfilter-label">Visual heartbeat</span><strong class="crossfilter-metric-value" data-frame-rate>— fps</strong></article>
    </section>

    <section class="crossfilter-workspace" aria-label="Linked geographic and risk views">
      <article class="crossfilter-map-card" data-map-card>
        <div class="crossfilter-view-title"><strong>Global signal density</strong><span data-map-density>GPU resident</span></div>
        <div class="crossfilter-map-surface" data-map-surface role="application" tabindex="0" aria-label="Brush a geographic rectangle; double-click or press Escape to clear">
          ${makeWorldMapSvg()}
          <span class="crossfilter-brush" data-view-brush="map" data-active="false" aria-hidden="true"></span>
        </div>
        <div class="crossfilter-view-footer"><span data-synthetic-source>SYNTHETIC TELEMETRY · DRAG TO BRUSH</span><span class="crossfilter-coordinate">180°W · EQUATOR · 180°E</span></div>
      </article>
      <div class="crossfilter-side-rail">
        <article class="crossfilter-scatter-card" data-scatter-card>
          <div class="crossfilter-view-title"><strong>Risk × intensity</strong><span>LINKED</span></div>
          <div class="crossfilter-scatter-surface" data-scatter-surface role="application" tabindex="0" aria-label="Brush risk versus signal intensity; double-click or press Escape to clear">
            <svg class="crossfilter-scatter-grid" viewBox="0 0 100 100" preserveAspectRatio="none" fill="none" aria-hidden="true"><path d="M0 25h100M0 50h100M0 75h100M25 0v100M50 0v100M75 0v100" stroke="rgba(130,170,193,.16)" stroke-width=".55" vector-effect="non-scaling-stroke"/><path d="M0 100h100V0" stroke="rgba(132,180,204,.36)" stroke-width="1" vector-effect="non-scaling-stroke"/><path d="M78 0v100" stroke="rgba(255,128,151,.52)" stroke-dasharray="2 3" stroke-width=".7" vector-effect="non-scaling-stroke"/></svg>
            <span class="crossfilter-brush" data-view-brush="scatter" data-active="false" aria-hidden="true"></span>
          </div>
          <span class="crossfilter-scatter-axis crossfilter-scatter-axis-x">SIGNAL INTENSITY →</span>
          <span class="crossfilter-scatter-axis crossfilter-scatter-axis-y">RISK ↑</span>
        </article>
        <article class="crossfilter-group-card">
          <div class="crossfilter-group-heading"><strong>Transaction cohorts</strong><span class="crossfilter-label">LIVE MASK</span></div>
          <div class="crossfilter-group-list" data-category-groups aria-label="Synthetic transaction cohorts"></div>
        </article>
      </div>
    </section>

    <section class="crossfilter-histograms" aria-label="Linked GPU histograms">
      ${HISTOGRAM_DEFINITIONS.map(definition => makeHistogramHtml(definition)).join('')}
    </section>

    <footer class="crossfilter-footer">
      <div class="crossfilter-filter-track"><span class="crossfilter-label">ACTIVE <span data-active-filter-count>0</span></span><span data-active-filters></span></div>
      <span class="crossfilter-pipeline"><strong>FILTER → REDUCE → DRAW</strong> · <span data-graph-nodes>resident graph</span> · <span data-resident-bytes>zero-copy resident</span></span>
      <span class="crossfilter-label" data-crossfilter-status role="status" aria-live="polite">SYNTHETIC TELEMETRY · NO CUSTOMER DATA</span>
    </footer>
  </div>`;
}

function makeHistogramHtml(definition: HistogramDefinition): string {
  return `<article class="crossfilter-histogram-card" data-crossfilter-histogram="${definition.id}" style="--histogram-color:${definition.color}">
    <div class="crossfilter-histogram-heading"><strong data-histogram-title>${definition.label}</strong><span data-histogram-unit>${definition.unit}</span></div>
    <div class="crossfilter-histogram-surface" data-histogram-surface role="application" tabindex="0" aria-label="Brush ${definition.label}; double-click or press Escape to clear">
      <div class="crossfilter-histogram-bars" data-histogram-bars></div>
      <span class="crossfilter-histogram-brush" data-histogram-brush data-active="false"></span>
    </div>
    <div class="crossfilter-histogram-axis"><span data-histogram-minimum>${definition.domain[0]}</span><span data-histogram-maximum>${definition.domain[1]}</span></div>
  </article>`;
}

function makeWorldMapSvg(): string {
  return `<svg class="crossfilter-map-geography" viewBox="0 0 1000 500" preserveAspectRatio="none" fill="none" aria-hidden="true">
    <defs><pattern id="crossfilter-world-grid" width="100" height="83.33" patternUnits="userSpaceOnUse"><path d="M100 0H0V83.33" stroke="currentColor" stroke-opacity=".36" stroke-width=".7"/></pattern></defs>
    <rect width="1000" height="500" fill="url(#crossfilter-world-grid)"/>
    <path d="M75 120 96 94l30-8 34 9 18-20 29 7 19 28 30 8 15 30-18 16-13 28-33 6-18 26-29-2-9-21-27-5-22-34-24-3-17-33Zm130 101 21 13 20 23 4 30 18 18-6 41-22 41-16 32-17-11-8-37-19-21-2-38-18-27 7-37 16-17 22-10Zm156-132 32-19 21 3 20-17 37 12 12 20 37-2 18-20 31 8 17 15 23-4 28 10 26-7 32 13 31-3 24 23 45 2 34 22 9 28-19 18-30 1-18 24-24-13-18 11-8 26-25 7-25-26-37 3-11 27-23 5-14-18-19 13-15-13-4-30-28-8-15-22-28-7-15 13-18-9-11-22-23 4-21-16Zm87 121 28-1 25 15 31 5 12 29-12 36-26 24-9 36-22 25-24-11-9-39-23-23-3-39-17-21 10-22 22-14 17-1Zm312 100 38-8 23 12 34-2 30 22 9 30-20 20-38 2-15 13-28-10-30 4-24-22 1-27 20-19Z" fill="rgba(75,129,151,.075)" stroke="currentColor" stroke-width="1.25" vector-effect="non-scaling-stroke"/>
    <path d="M165 181 210 143l37 3M352 109l61 20 59-6 28 39m88-62 34 46 54 20m-287 112 56-1 50 48m226 31 53 19 46-11" stroke="rgba(102,208,224,.23)" stroke-dasharray="3 6" stroke-width="1" vector-effect="non-scaling-stroke"/>
    <circle cx="220" cy="155" r="2" fill="rgba(101,237,247,.58)"/><circle cx="470" cy="145" r="2" fill="rgba(101,237,247,.58)"/><circle cx="635" cy="168" r="2" fill="rgba(101,237,247,.58)"/><circle cx="796" cy="353" r="2" fill="rgba(101,237,247,.58)"/>
  </svg>`;
}

function getNormalizedPointer(element: HTMLElement, event: PointerEvent): [number, number] {
  const rectangle = element.getBoundingClientRect();
  return [
    clamp((event.clientX - rectangle.left) / Math.max(1, rectangle.width), 0, 1),
    clamp((event.clientY - rectangle.top) / Math.max(1, rectangle.height), 0, 1)
  ];
}

function formatDomainValue(value: number, unit: string): string {
  if (unit === '%' || unit === 'RISK') return `${Math.round(value * 100)}%`;
  if (unit === 'h' || unit === 'UTC') return `${String(Math.round(value)).padStart(2, '0')}:00`;
  if (unit === '$') {
    return `$${Math.abs(value) >= 1000 ? COMPACT_NUMBER_FORMATTER.format(value) : NUMBER_FORMATTER.format(value)}`;
  }
  if (Math.abs(value) >= 1000) return COMPACT_NUMBER_FORMATTER.format(value);
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${Math.round(bytes)} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function sanitizeColor(color: string | undefined): string {
  return color && /^#[0-9a-f]{3,8}$/i.test(color) ? color : '#54edff';
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, character => {
    switch (character) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      case "'":
        return '&#39;';
      default:
        return character;
    }
  });
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}
