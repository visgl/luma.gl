// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GPUCommandGraphTimingReport} from '@luma.gl/gpgpu/gpu-core';
import {makeHtmlCustomPanel} from './example-panels';

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
  constructor(private readonly element: HTMLElement) {}

  update(report: GPUCommandGraphTimingReport | undefined, label = ''): void {
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
          labelElement.title = span.node.id;
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
          bar.title = details;
          bar.setAttribute('aria-label', details);
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
      const bar = (event.target as HTMLElement).closest<HTMLElement>('.gpu-trace-bar');
      if (bar) detailsElement.textContent = bar.getAttribute('aria-label');
    };
    root.addEventListener('mouseover', showDetails);
    root.addEventListener('focusin', showDetails);
    this.element.replaceChildren(root);
  }

  destroy(): void {
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
