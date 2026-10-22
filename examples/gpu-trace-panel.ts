// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GPUCommandGraphTimingReport} from '@luma.gl/gpu-graph/gpu-core';
import {makeHtmlCustomPanel} from './example-panels';
import {
  createGPUOperationTooltip,
  renderGPUOperationTooltip,
  positionGPUOperationTooltip,
  formatGPUOperationDetails
} from './gpu-operation-tooltip';

const TIME_FORMATTER = new Intl.NumberFormat('en-US', {
  maximumSignificantDigits: 3,
  useGrouping: false
});

/** Reusable example tab. Retains only the latest report, including while unmounted. */
export class GPUTracePanel {
  readonly panel;
  private renderer: GPUTracePanelRenderer | null = null;
  private report: GPUCommandGraphTimingReport | undefined;
  private label = '';

  constructor(props: {id?: string; title?: string} = {}) {
    this.panel = makeHtmlCustomPanel({
      id: props.id ?? 'gpu-trace',
      title: props.title ?? 'GPU Trace',
      html: '<div data-gpu-trace-host></div>',
      onRender: root => {
        const renderer = new GPUTracePanelRenderer(
          root.querySelector<HTMLElement>('[data-gpu-trace-host]')!
        );
        this.renderer = renderer;
        renderer.update(this.report, this.label);
        return () => {
          renderer.destroy();
          if (this.renderer === renderer) this.renderer = null;
        };
      }
    });
  }

  /** Supply an already collected report; this panel never performs GPU readback. */
  update(report: GPUCommandGraphTimingReport | undefined, label = ''): void {
    this.report = report;
    this.label = label;
    this.renderer?.update(report, label);
  }
}

/** DOM renderer usable independently of the example tab system. */
export class GPUTracePanelRenderer {
  private combinedTimeline = false;
  private readonly tooltip: HTMLElement;
  private activeSpanKey: string | undefined;
  private readonly tooltipNodes = new Map<
    string,
    {node: GPUCommandGraphTimingReport['nodes'][number]; timing: string}
  >();

  constructor(private readonly element: HTMLElement) {
    this.tooltip = createGPUOperationTooltip(element.ownerDocument);
    this.tooltip.setAttribute('data-gpu-trace-tooltip', '');
  }

  update(report: GPUCommandGraphTimingReport | undefined, label = ''): void {
    this.tooltipNodes.clear();
    const root = document.createElement('section');
    root.setAttribute('data-gpu-trace', '');
    root.setAttribute('aria-label', 'GPU Trace');
    const style = document.createElement('style');
    style.textContent = TRACE_STYLE;
    root.append(style);
    appendText(root, 'strong', label || 'Latest graph execution');
    if (!report) {
      appendText(root, 'p', 'No trace collected yet.');
    } else {
      const correlation = report.clockCorrelation;
      const canCombine = Boolean(
        correlation &&
          Number.isFinite(correlation.offsetMilliseconds) &&
          Number.isFinite(correlation.uncertaintyMilliseconds) &&
          correlation.uncertaintyMilliseconds >= 0
      );
      const control = document.createElement('label');
      const toggle = document.createElement('input');
      toggle.type = 'checkbox';
      toggle.checked = this.combinedTimeline;
      toggle.disabled = !canCombine;
      toggle.addEventListener('change', () => {
        this.combinedTimeline = toggle.checked;
        this.update(report, label);
      });
      control.append(toggle, ' Combined timeline (estimated)');
      root.append(control);
      const combined = this.combinedTimeline && canCombine;
      appendText(
        root,
        'p',
        combined
          ? `Alignment ±${formatTime(correlation!.uncertaintyMilliseconds)}ms, plus timestamp precision. Submission-time estimate.`
          : 'CPU and GPU use separate clocks. Each timeline starts at its own origin.'
      );
      if (!canCombine)
        appendText(root, 'p', 'Combined timeline requires submission clock correlation.');
      const offset = combined ? correlation!.offsetMilliseconds : 0;
      const commonStarts = combined
        ? report.nodes
            .flatMap(node => [
              node.cpuEncodeStartTimeMilliseconds,
              node.gpuStartTimeMilliseconds === undefined
                ? undefined
                : node.gpuStartTimeMilliseconds + offset
            ])
            .filter((value): value is number => value !== undefined && Number.isFinite(value))
        : [];
      const commonEnds = combined
        ? report.nodes
            .flatMap(node => [
              node.cpuEncodeEndTimeMilliseconds,
              node.gpuEndTimeMilliseconds === undefined
                ? undefined
                : node.gpuEndTimeMilliseconds + offset
            ])
            .filter((value): value is number => value !== undefined && Number.isFinite(value))
        : [];
      if (combined && report.cpuEncodeStartTimeMilliseconds !== undefined)
        commonStarts.push(report.cpuEncodeStartTimeMilliseconds);
      if (combined && report.cpuEncodeEndTimeMilliseconds !== undefined)
        commonEnds.push(report.cpuEncodeEndTimeMilliseconds);
      for (const clock of ['gpu', 'cpu'] as const) {
        const spans = report.nodes.flatMap(node => {
          const start =
            clock === 'cpu' ? node.cpuEncodeStartTimeMilliseconds : node.gpuStartTimeMilliseconds;
          const end =
            clock === 'cpu' ? node.cpuEncodeEndTimeMilliseconds : node.gpuEndTimeMilliseconds;
          return start !== undefined &&
            end !== undefined &&
            Number.isFinite(start) &&
            Number.isFinite(end) &&
            end >= start
            ? [
                {
                  node,
                  start: start + (clock === 'gpu' ? offset : 0),
                  end: end + (clock === 'gpu' ? offset : 0)
                }
              ]
            : [];
        });
        const section = document.createElement('section');
        section.dataset['traceClock'] = clock;
        root.append(section);
        appendText(section, 'h4', clock === 'cpu' ? 'CPU encoding' : 'GPU execution');
        if (!spans.length) {
          appendText(
            section,
            'p',
            clock === 'cpu'
              ? 'CPU span endpoints unavailable.'
              : 'GPU span endpoints unavailable. Timestamp queries are required.'
          );
          continue;
        }
        const reportStart =
          clock === 'cpu' ? report.cpuEncodeStartTimeMilliseconds : report.gpuStartTimeMilliseconds;
        const reportEnd =
          clock === 'cpu' ? report.cpuEncodeEndTimeMilliseconds : report.gpuEndTimeMilliseconds;
        const origin = combined
          ? Math.min(...commonStarts)
          : Math.min(...spans.map(span => span.start), reportStart ?? Infinity);
        const end = combined
          ? Math.max(...commonEnds)
          : Math.max(...spans.map(span => span.end), reportEnd ?? -Infinity);
        const extent = end - origin;
        appendText(
          section,
          'p',
          `0 – ${formatTime(extent)}ms · ${spans.length}/${report.nodes.length} nodes`
        );
        const rows = document.createElement('div');
        rows.className = 'gpu-trace-rows';
        section.append(rows);
        for (const span of spans) {
          const row = document.createElement('div');
          row.className = 'gpu-trace-row';
          const labelElement = appendText(row, 'span', span.node.operation ?? span.node.type);
          labelElement.setAttribute('aria-label', formatGPUOperationDetails(span.node));
          const track = document.createElement('div');
          track.className = 'gpu-trace-track';
          const bar = document.createElement('span');
          bar.className = 'gpu-trace-bar';
          bar.tabIndex = 0;
          bar.style.left = `${extent ? ((span.start - origin) / extent) * 100 : 0}%`;
          bar.style.width = `${extent ? ((span.end - span.start) / extent) * 100 : 0}%`;
          const duration =
            clock === 'cpu' ? span.node.cpuEncodeTimeMilliseconds : span.node.gpuTimeMilliseconds;
          const details = `${span.node.id} (${span.node.type}${span.node.condition?.outcome === 'skipped' ? ', skipped' : ''}): ${formatTime(span.start - origin)}–${formatTime(span.end - origin)}ms; duration ${formatTime(duration ?? span.end - span.start)}ms`;
          row.dataset['spanKey'] = JSON.stringify([clock, span.node.id]);
          this.tooltipNodes.set(row.dataset['spanKey'], {
            node: span.node,
            timing: `${clock.toUpperCase()} · ${formatTime(duration ?? span.end - span.start)}ms duration · ${formatTime(span.start - origin)}–${formatTime(span.end - origin)}ms${span.node.condition?.outcome === 'skipped' ? ' · skipped' : ''}`
          });
          const tooltipDetails = formatGPUOperationDetails(span.node, details);
          row.dataset['spanDetails'] = tooltipDetails;
          bar.setAttribute('aria-describedby', this.tooltip.id);
          bar.setAttribute('aria-label', tooltipDetails);
          track.append(bar);
          row.append(track);
          appendText(row, 'span', `${formatTime(duration ?? span.end - span.start)}ms`);
          rows.append(row);
        }
      }
    }
    const detailsElement = appendText(root, 'p', 'Hover or focus a span for details.');
    detailsElement.setAttribute('aria-live', 'polite');
    const showDetails = (event: Event): void => {
      const row = (event.target as HTMLElement).closest<HTMLElement>('.gpu-trace-row');
      if (row) {
        detailsElement.textContent = row.dataset['spanDetails']!;
        this.showTooltip(row);
      }
    };
    const hideDetails = (event: Event): void => {
      const nextTarget = (event as MouseEvent | FocusEvent).relatedTarget;
      const row = (event.target as HTMLElement).closest<HTMLElement>('.gpu-trace-row');
      if (!(nextTarget instanceof Node) || !row?.contains(nextTarget)) this.hideTooltip();
    };
    root.addEventListener('mouseover', showDetails);
    root.addEventListener('focusin', showDetails);
    root.addEventListener('mouseout', hideDetails);
    root.addEventListener('focusout', hideDetails);
    root.addEventListener('scroll', () => this.hideTooltip(), true);
    root.addEventListener('keydown', event => {
      if (event.key === 'Escape') this.hideTooltip();
    });
    const activeElement = this.element.ownerDocument.activeElement;
    const focusedSpanKey =
      activeElement && this.element.contains(activeElement)
        ? activeElement.closest<HTMLElement>('.gpu-trace-row')?.dataset['spanKey']
        : undefined;
    const activeSpanKey = this.activeSpanKey;
    this.element.replaceChildren(root);
    const rows = Array.from(root.querySelectorAll<HTMLElement>('.gpu-trace-row'));
    const focusedRow = rows.find(row => row.dataset['spanKey'] === focusedSpanKey);
    if (focusedRow) {
      focusedRow.querySelector<HTMLElement>('.gpu-trace-bar')!.focus({preventScroll: true});
    }
    const activeRow = rows.find(row => row.dataset['spanKey'] === activeSpanKey);
    if (activeRow) {
      detailsElement.textContent = activeRow.dataset['spanDetails']!;
      this.showTooltip(activeRow);
    } else {
      this.hideTooltip();
    }
  }

  private showTooltip(row: HTMLElement): void {
    this.activeSpanKey = row.dataset['spanKey'];
    const details = this.tooltipNodes.get(this.activeSpanKey!);
    if (!details) return;
    renderGPUOperationTooltip(this.tooltip, details.node, {timing: details.timing});
    this.tooltip.hidden = false;
    positionGPUOperationTooltip(this.tooltip, row);
  }

  private hideTooltip(): void {
    this.activeSpanKey = undefined;
    this.tooltip.hidden = true;
  }

  destroy(): void {
    this.hideTooltip();
    this.tooltip.remove();
    this.tooltipNodes.clear();
    this.element.replaceChildren();
  }
}

function appendText(parent: HTMLElement, tag: string, text: string): HTMLElement {
  const element = document.createElement(tag);
  element.textContent = text;
  parent.append(element);
  return element;
}

function formatTime(value: number): string {
  return TIME_FORMATTER.format(value);
}

const TRACE_STYLE = `
[data-gpu-trace-tooltip] {position: fixed; z-index: 10000; max-width: min(360px, calc(100vw - 16px)); padding: 8px 10px; border: 1px solid #64748b; border-radius: 5px; background: #0f172a; color: #f1f5f9; box-shadow: 0 4px 16px #0006; font: 11px/1.5 system-ui, sans-serif; overflow-wrap: anywhere; pointer-events: none;}
[data-gpu-trace-tooltip][hidden] {display: none;}

[data-gpu-trace] {font: 11px/1.5 system-ui, sans-serif; min-width: 0; color: var(--luma-example-text, #cbd5e1);}
[data-gpu-trace] p {color: var(--luma-example-text-muted, #94a3b8); margin: 6px 0;}
[data-gpu-trace] h4 {margin: 12px 0 0; font-size: 12px;}
[data-gpu-trace] .gpu-trace-rows {max-height: 260px; overflow: auto;}
[data-gpu-trace] .gpu-trace-row {display: grid; grid-template-columns: minmax(82px, 1fr) minmax(70px, 2fr) 65px; gap: 8px; align-items: center; min-height: 26px;}
[data-gpu-trace] .gpu-trace-row > span {overflow: hidden; text-overflow: ellipsis; white-space: nowrap;}
[data-gpu-trace] .gpu-trace-row > span:last-child {text-align: right; font: 10px ui-monospace, monospace;}
[data-gpu-trace] .gpu-trace-track {height: 18px; position: relative; background: rgb(128 128 128 / 12%); border-radius: 3px;}
[data-gpu-trace] .gpu-trace-bar {position: absolute; top: 2px; height: 14px; min-width: 2px; max-width: 100%; border-radius: 3px; background: #38bdf8;}
[data-gpu-trace] [data-trace-clock='gpu'] .gpu-trace-bar {background: #a78bfa;}
[data-gpu-trace] .gpu-trace-bar:focus {outline: 2px solid currentColor; outline-offset: 2px;}
`;
