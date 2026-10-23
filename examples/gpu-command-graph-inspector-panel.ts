// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GPUCommandGraphInspectorSnapshot} from '@luma.gl/graph/gpu-core';
import {CompactDropdown} from './compact-dropdown';
import {
  createGPUOperationTooltip,
  renderGPUOperationTooltip,
  positionGPUOperationTooltip,
  formatGPUOperationDetails
} from './gpu-operation-tooltip';

const STANDARD_COUNTER_FORMATTER = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 1
});
const COMPACT_COUNTER_FORMATTER = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1
});

export type GPUCommandGraphInspectorPanelProps = {
  /** Optional human-readable graph names keyed by compiled graph ID. */
  graphLabels?: Readonly<Record<string, string>>;
  /** Optional operation labels keyed by compiled node ID. */
  nodeLabels?: Readonly<Record<string, string>>;
  /** Optional human-readable counter names keyed by application-defined counter ID. */
  counterLabels?: Readonly<Record<string, string>>;
};

/**
 * Small DOM renderer for the data-only `GPUCommandGraphInspector`.
 *
 * The panel deliberately lives with the examples rather than the graph runtime so applications can
 * render the same immutable snapshots in their own UI framework.
 */
export class GPUCommandGraphInspectorPanel {
  private readonly element: HTMLElement;
  private readonly graphLabels: Readonly<Record<string, string>>;
  private readonly nodeLabels: Readonly<Record<string, string>>;
  private readonly counterLabels: Readonly<Record<string, string>>;
  private snapshot: GPUCommandGraphInspectorSnapshot = {graphs: []};
  private selectedGraphId: string | null = null;
  private selectionIsManual = false;
  private graphOptionsSignature = '';
  private memoryMarkup = '';
  private readonly nodeRows = new Map<string, HTMLElement>();
  private readonly counterRows = new Map<string, HTMLElement>();
  private readonly graphDropdown: CompactDropdown;
  private readonly tooltip: HTMLElement;
  private readonly tooltipEvents = new AbortController();
  private activeNodeId: string | undefined;

  constructor(element: HTMLElement, props: GPUCommandGraphInspectorPanelProps = {}) {
    this.element = element;
    this.tooltip = createGPUOperationTooltip(element.ownerDocument);
    this.tooltip.setAttribute('data-gpu-graph-tooltip', '');
    const showTooltip = (event: Event): void => {
      const row = (event.target as HTMLElement).closest<HTMLElement>('[data-full-name]');
      if (row && this.element.contains(row)) this.showTooltip(row);
    };
    const hideTooltip = (event: Event): void => {
      const row = (event.target as HTMLElement).closest<HTMLElement>('[data-full-name]');
      const next = (event as MouseEvent | FocusEvent).relatedTarget;
      if (!(next instanceof Node) || !row?.contains(next)) this.hideTooltip();
    };
    const options = {signal: this.tooltipEvents.signal};
    element.addEventListener('mouseover', showTooltip, options);
    element.addEventListener('focusin', showTooltip, options);
    element.addEventListener('mouseout', hideTooltip, options);
    element.addEventListener('focusout', hideTooltip, options);
    element.addEventListener('scroll', () => this.hideTooltip(), {...options, capture: true});
    element.addEventListener(
      'keydown',
      event => {
        if (event.key === 'Escape') this.hideTooltip();
      },
      options
    );
    element.ownerDocument.defaultView?.addEventListener(
      'resize',
      () => this.hideTooltip(),
      options
    );
    this.graphLabels = props.graphLabels ?? {};
    this.nodeLabels = props.nodeLabels ?? {};
    this.counterLabels = props.counterLabels ?? {};
    this.element.innerHTML = `<div data-gpu-command-graph-inspector>
      <style>${GPU_COMMAND_GRAPH_INSPECTOR_CSS}</style>
      <span class="graph-inspector-empty" data-graph-inspector-empty>No graph activity recorded.</span>
      <div class="graph-inspector-content" data-graph-inspector-content hidden>
        <div class="graph-inspector-picker"><span>Graph</span><div data-graph-inspector-picker-host></div></div>
        <div class="graph-inspector-summary">
          ${makeMetric('encodings', '', 'encoding-count')}
          ${makeMetric('CPU p50 / p95 (ms)', '', 'cpu-totals')}
          ${makeMetric('GPU p50 / p95 (ms)', '', 'gpu-totals')}
          ${makeMetric('GPU samples', '', 'gpu-samples')}
        </div>
        <div class="graph-inspector-memory" data-graph-inspector-memory></div>
        <div class="graph-inspector-counters" data-graph-inspector-counters hidden>
          <div class="graph-inspector-counter graph-inspector-counter-header"><span>Sampled counter</span><strong>Latest</strong><strong>50/95</strong></div>
          <div class="graph-inspector-counter-rows" data-graph-inspector-counter-rows></div>
        </div>
        <div class="graph-inspector-node graph-inspector-node-header"><span>Node</span><strong>CPU 50/95 (ms)</strong><strong>GPU 50/95 (ms)</strong></div>
        <div class="graph-inspector-legend"><span style="color:#508bc9">● Compute</span> · <span style="color:#b16cba">● Draw</span> · <span style="color:#ba873e">● Copy</span></div>
        <div class="graph-inspector-nodes" data-graph-inspector-nodes></div>
      </div>
    </div>`;
    const dropdownHost = this.element.querySelector<HTMLElement>(
      '[data-graph-inspector-picker-host]'
    )!;
    this.graphDropdown = new CompactDropdown(dropdownHost, {
      ariaLabel: 'Graph',
      options: [],
      onChange: value => {
        this.selectedGraphId = value;
        this.selectionIsManual = true;
        this.render();
      }
    });
  }

  /** Renders the latest immutable snapshot without resetting a user's graph selection. */
  update(snapshot: GPUCommandGraphInspectorSnapshot, preferredGraphId?: string): void {
    this.snapshot = snapshot;
    const hasSelectedGraph = snapshot.graphs.some(graph => graph.id === this.selectedGraphId);
    if (!hasSelectedGraph) {
      this.selectedGraphId = null;
      this.selectionIsManual = false;
    }
    if (!this.selectionIsManual && preferredGraphId) {
      const preferredGraph = snapshot.graphs.find(graph => graph.id === preferredGraphId);
      if (preferredGraph) this.selectedGraphId = preferredGraph.id;
    }
    this.selectedGraphId ??= snapshot.graphs[0]?.id ?? null;
    this.render();
  }

  /** Removes the panel DOM, portalled popup, and event listeners. */
  destroy(): void {
    this.tooltipEvents.abort();
    this.tooltip.remove();
    this.graphDropdown.destroy();
    this.element.replaceChildren();
    this.nodeRows.clear();
    this.counterRows.clear();
  }

  private showTooltip(row: HTMLElement): void {
    this.activeNodeId = row.getAttribute('data-full-name') ?? undefined;
    const graph = this.snapshot.graphs.find(graph => graph.id === this.selectedGraphId);
    const node = graph?.nodes.find(node => node.id === this.activeNodeId);
    if (!node) return;
    const label = getOwnLabel(this.nodeLabels, node.id);
    renderGPUOperationTooltip(this.tooltip, node, {name: label === node.id ? undefined : label});
    this.tooltip.hidden = false;
    positionGPUOperationTooltip(this.tooltip, row);
  }

  private hideTooltip(): void {
    this.activeNodeId = undefined;
    this.tooltip.hidden = true;
  }

  private render(): void {
    const graph = this.snapshot.graphs.find(candidate => candidate.id === this.selectedGraphId);
    const emptyElement = this.element.querySelector<HTMLElement>('[data-graph-inspector-empty]')!;
    const contentElement = this.element.querySelector<HTMLElement>(
      '[data-graph-inspector-content]'
    )!;
    if (!graph) {
      this.hideTooltip();
      emptyElement.hidden = false;
      contentElement.hidden = true;
      return;
    }

    emptyElement.hidden = true;
    contentElement.hidden = false;
    const graphOptionsSignature = this.snapshot.graphs
      .map(candidate => `${candidate.id}\u0000${this.getGraphLabel(candidate.id)}`)
      .join('\u0001');
    if (graphOptionsSignature !== this.graphOptionsSignature) {
      this.graphDropdown.setOptions(
        this.snapshot.graphs.map(candidate => ({
          value: candidate.id,
          label: this.getGraphLabel(candidate.id)
        }))
      );
      this.graphOptionsSignature = graphOptionsSignature;
    }
    if (this.graphDropdown.value !== graph.id) this.graphDropdown.value = graph.id;

    const logicalTransientResourceBytes =
      graph.stats.logicalTransientBytes + graph.stats.logicalTransientTextureBytes;
    const reusedTransientResourceBytes =
      graph.stats.reusedTransientBytes + graph.stats.reusedTransientTextureBytes;
    const reusePercentage = logicalTransientResourceBytes
      ? (reusedTransientResourceBytes / logicalTransientResourceBytes) * 100
      : 0;
    const gpuSampleCount = graph.totals.gpu.sampleCount;
    const nodesElement = this.element.querySelector<HTMLElement>('[data-graph-inspector-nodes]')!;
    reconcileRows(nodesElement, this.nodeRows, graph.nodes, (element, node) => {
      if (!element.hasChildNodes()) {
        element.className = 'graph-inspector-node';
        element.innerHTML =
          '<span><i></i><span data-node-label></span></span><strong data-node-cpu></strong><strong data-node-gpu></strong>';
      }
      setAttribute(element, 'data-node-type', node.type);
      setAttribute(element, 'data-full-name', node.id);
      setAttribute(element, 'data-operation-details', formatGPUOperationDetails(node));
      setAttribute(element, 'aria-describedby', this.tooltip.id);
      element.tabIndex = 0;
      if (this.activeNodeId === node.id) this.showTooltip(element);
      const icon = element.querySelector<HTMLElement>('i')!;
      const typeLabel = node.type === 'render' ? 'draw' : node.type;
      setAttribute(icon, 'title', typeLabel);
      setAttribute(icon, 'aria-label', typeLabel);
      const nodeLabel = getOwnLabel(this.nodeLabels, node.id);
      setElementText(
        element.querySelector<HTMLElement>('[data-node-label]')!,
        nodeLabel === node.id ? getShortNodeId(node.id, graph.id) : nodeLabel
      );
      setElementText(
        element.querySelector<HTMLElement>('[data-node-cpu]')!,
        formatDurationPair(node.cpu)
      );
      setElementText(
        element.querySelector<HTMLElement>('[data-node-gpu]')!,
        formatDurationPair(node.gpu)
      );
    });
    if (this.activeNodeId && !graph.nodes.some(node => node.id === this.activeNodeId)) {
      this.hideTooltip();
    }
    const counterRowsElement = this.element.querySelector<HTMLElement>(
      '[data-graph-inspector-counter-rows]'
    )!;
    reconcileRows(counterRowsElement, this.counterRows, graph.counters, (element, counter) => {
      if (!element.hasChildNodes()) {
        element.className = 'graph-inspector-counter';
        element.innerHTML =
          '<span></span><strong data-counter-latest></strong><strong data-counter-percentiles></strong>';
      }
      setAttribute(element, 'title', `${counter.id} · ${counter.sampleCount} samples`);
      setElementText(element.querySelector<HTMLElement>('span')!, this.getCounterLabel(counter.id));
      setElementText(
        element.querySelector<HTMLElement>('[data-counter-latest]')!,
        formatCounterValue(counter.latestValue)
      );
      setElementText(
        element.querySelector<HTMLElement>('[data-counter-percentiles]')!,
        `${formatCounterValue(counter.p50Value)} / ${formatCounterValue(counter.p95Value)}`
      );
    });
    this.setText('encoding-count', String(graph.encodingCount));
    this.setText('cpu-totals', formatDurationPair(graph.totals.cpu));
    this.setText('gpu-totals', formatDurationPair(graph.totals.gpu));
    this.setText(
      'gpu-samples',
      `${gpuSampleCount}${graph.timingReadFailureCount ? ` · ${graph.timingReadFailureCount} failed` : ''}`
    );
    const memoryMarkup = `
      <span>${graph.stats.nodeOrder.length} nodes</span>
      <span>${formatBytes(graph.stats.logicalResourceBytes)} logical</span>
      <span>${formatBytes(graph.stats.physicalTransientResourceBytes)} scratch</span>
      ${graph.preflight?.annotatedNodeCount ? `<span>${graph.preflight.annotatedNodeCount}/${graph.stats.nodeOrder.length} costed nodes</span>` : ''}
      ${graph.preflight?.maximumInvocationCount ? `<span>${formatCount(graph.preflight.maximumInvocationCount)} max invocations</span>` : ''}
      ${graph.preflight?.readByteLength ? `<span>${formatBytes(graph.preflight.readByteLength)} max reads</span>` : ''}
      ${graph.preflight?.writeByteLength ? `<span>${formatBytes(graph.preflight.writeByteLength)} max writes</span>` : ''}
      <span>${reusePercentage ? `${reusePercentage.toFixed(0)}% reuse` : 'no reuse'}</span>
      <span>${gpuSampleCount ? 'GPU timings sampled' : 'CPU timings only'}</span>`;
    if (memoryMarkup !== this.memoryMarkup) {
      this.element.querySelector<HTMLElement>('[data-graph-inspector-memory]')!.innerHTML =
        memoryMarkup;
      this.memoryMarkup = memoryMarkup;
    }
    const countersElement = this.element.querySelector<HTMLElement>(
      '[data-graph-inspector-counters]'
    )!;
    countersElement.hidden = graph.counters.length === 0;
  }

  private setText(identifier: string, value: string): void {
    setElementText(
      this.element.querySelector<HTMLElement>(`[data-graph-inspector-${identifier}]`)!,
      value
    );
  }

  private getGraphLabel(graphId: string): string {
    return getOwnLabel(this.graphLabels, graphId);
  }

  private getCounterLabel(counterId: string): string {
    return getOwnLabel(this.counterLabels, counterId);
  }
}

/** Retain row identity and order so sampling does not reset hover, focus, or scrolling. */
function reconcileRows<Row extends {id: string}>(
  container: HTMLElement,
  elements: Map<string, HTMLElement>,
  rows: readonly Row[],
  updateRow: (element: HTMLElement, row: Row) => void
): void {
  const identifiers = new Set(rows.map(row => row.id));
  for (const [identifier, element] of elements) {
    if (!identifiers.has(identifier)) {
      element.remove();
      elements.delete(identifier);
    }
  }
  for (const [index, row] of rows.entries()) {
    let element = elements.get(row.id);
    if (!element) {
      element = container.ownerDocument.createElement('div');
      elements.set(row.id, element);
    }
    updateRow(element, row);
    const currentElement = container.children[index] ?? null;
    if (currentElement !== element) container.insertBefore(element, currentElement);
  }
}

function setElementText(element: HTMLElement, value: string): void {
  if (element.textContent !== value) element.textContent = value;
}

function setAttribute(element: HTMLElement, name: string, value: string): void {
  if (element.getAttribute(name) !== value) element.setAttribute(name, value);
}

function formatCount(value: number): string {
  return COMPACT_COUNTER_FORMATTER.format(value);
}

const GPU_COMMAND_GRAPH_INSPECTOR_CSS = /* css */ `
  [data-gpu-command-graph-inspector] { min-width: 0; }
  [data-gpu-command-graph-inspector] * { box-sizing: border-box; }
  [data-gpu-command-graph-inspector] .graph-inspector-content { display: grid; gap: 7px; min-width: 0; }
  [data-gpu-command-graph-inspector] .graph-inspector-content[hidden] { display: none; }
  [data-gpu-command-graph-inspector] .graph-inspector-picker {
    display: grid;
    grid-template-columns: 52px minmax(0, 1fr);
    align-items: center;
    gap: 8px;
    color: #91a6c3;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: .07em;
    text-transform: uppercase;
  }
  [data-gpu-command-graph-inspector] .graph-inspector-summary {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 4px;
  }
  [data-gpu-command-graph-inspector] .graph-inspector-metric {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 6px;
    min-width: 0;
    padding: 5px 6px;
    border: 1px solid rgb(137 166 211 / 14%);
    border-radius: 4px;
    background: rgb(15 24 38 / 54%);
    color: #8295af;
    font: 8px/1.2 system-ui, sans-serif;
  }
  [data-gpu-command-graph-inspector] .graph-inspector-metric strong {
    overflow: hidden;
    color: #e8f1ff;
    font: 650 9px/1.2 ui-monospace, monospace;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  [data-gpu-command-graph-inspector] .graph-inspector-memory {
    display: flex;
    flex-wrap: wrap;
    gap: 3px 8px;
    color: #7286a2;
    font: 8px/1.35 ui-monospace, monospace;
  }
  [data-gpu-command-graph-inspector] .graph-inspector-counters[hidden] { display: none; }
  [data-gpu-command-graph-inspector] .graph-inspector-counter-rows {
    max-height: 110px;
    overflow-y: auto;
    overscroll-behavior: contain;
    scrollbar-gutter: stable;
  }
  [data-gpu-command-graph-inspector] .graph-inspector-counter {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 52px 66px;
    align-items: center;
    gap: 7px;
    min-height: 22px;
    border-bottom: 1px solid rgb(137 166 211 / 9%);
    color: #b9c8dc;
    font: 8px/1.25 ui-monospace, monospace;
  }
  [data-gpu-command-graph-inspector] .graph-inspector-counter > span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  [data-gpu-command-graph-inspector] .graph-inspector-counter strong {
    color: #dce8f7;
    font-weight: 600;
    text-align: right;
  }
  [data-gpu-command-graph-inspector] .graph-inspector-counter-header {
    min-height: 17px;
    border-bottom-color: rgb(137 166 211 / 18%);
    color: #7186a3;
    font: 7px/1.2 system-ui, sans-serif;
    letter-spacing: .06em;
    text-transform: uppercase;
  }
  [data-gpu-command-graph-inspector] .graph-inspector-counter-header strong {
    color: #7186a3;
    font-weight: 600;
  }
  [data-gpu-command-graph-inspector] .graph-inspector-node {
    position: relative;
    display: grid;
    grid-template-columns: minmax(0, 1fr) 66px 66px;
    align-items: center;
    gap: 7px;
    min-height: 22px;
    border-bottom: 1px solid rgb(137 166 211 / 9%);
    color: #b9c8dc;
    font: 8px/1.25 ui-monospace, monospace;
  }
  [data-gpu-command-graph-inspector] .graph-inspector-node > span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  [data-gpu-command-graph-inspector] .graph-inspector-node i {
    display: inline-block;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    margin-right: 6px;
    background: #508bc9;
    color: #729ed4;
    font-style: normal;
    text-transform: uppercase;
  }
  [data-gpu-command-graph-inspector] [data-node-type="render"] i { background: #b16cba; }
  [data-gpu-command-graph-inspector] [data-node-type="copy"] i { background: #ba873e; }
  [data-gpu-command-graph-inspector] .graph-inspector-node strong {
    color: #dce8f7;
    font-weight: 600;
    text-align: right;
  }
  [data-gpu-command-graph-inspector] .graph-inspector-node-header {
    min-height: 17px;
    border-bottom-color: rgb(137 166 211 / 18%);
    color: #7186a3;
    font: 7px/1.2 system-ui, sans-serif;
    letter-spacing: .06em;
    text-transform: uppercase;
  }
  [data-gpu-command-graph-inspector] .graph-inspector-node-header strong {
    color: #7186a3;
    font-weight: 600;
  }
  [data-gpu-command-graph-inspector] .graph-inspector-nodes { max-height: 154px; overflow: auto; }
  [data-gpu-command-graph-inspector] .graph-inspector-legend { font: 10px/1.4 system-ui, sans-serif; }
  [data-gpu-command-graph-inspector] .graph-inspector-empty { color: #8192aa; font-size: 9px; }
`;

function makeMetric(label: string, value: string, identifier: string): string {
  return `<span class="graph-inspector-metric"><span>${escapeHtml(label)}</span><strong data-graph-inspector-${identifier}>${escapeHtml(value)}</strong></span>`;
}

function getShortNodeId(nodeId: string, graphId: string): string {
  const commonPrefix = graphId.endsWith('-graph') ? graphId.slice(0, -'-graph'.length) : graphId;
  const shortIdentifier = nodeId.startsWith(`${commonPrefix}-`)
    ? nodeId.slice(commonPrefix.length + 1)
    : nodeId;
  return shortIdentifier.length > 32 ? `${shortIdentifier.slice(0, 30)}…` : shortIdentifier;
}

function formatDurationPair(summary: {p50Milliseconds?: number; p95Milliseconds?: number}): string {
  if (summary.p50Milliseconds === undefined) return '—';
  const p50 = formatCompactMilliseconds(summary.p50Milliseconds);
  const p95 = formatCompactMilliseconds(summary.p95Milliseconds ?? summary.p50Milliseconds);
  return `${p50} / ${p95}`;
}

function formatCompactMilliseconds(value: number): string {
  return value.toFixed(value < 1 ? 3 : 2);
}

function formatCounterValue(value: number): string {
  return (value >= 10_000 ? COMPACT_COUNTER_FORMATTER : STANDARD_COUNTER_FORMATTER).format(value);
}

function formatBytes(value: number): string {
  if (value < 1024) return `${value} B`;
  if (value < 1024 ** 2) return `${(value / 1024).toFixed(1)} KiB`;
  if (value < 1024 ** 3) return `${(value / 1024 ** 2).toFixed(1)} MiB`;
  return `${(value / 1024 ** 3).toFixed(1)} GiB`;
}

function getOwnLabel(labels: Readonly<Record<string, string>>, id: string): string {
  return Object.prototype.hasOwnProperty.call(labels, id) ? labels[id] : id;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
