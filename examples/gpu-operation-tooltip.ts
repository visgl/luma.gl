// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GPUCommandGraphNodeEncodingStats} from '@luma.gl/gpu-graph/gpu-core';

let nextTooltipIdentifier = 0;

/** Body-level overlay escapes panel scrolling and stacking contexts. */
export function createGPUOperationTooltip(document: Document): HTMLElement {
  const tooltip = document.createElement('div');
  tooltip.id = `gpu-operation-tooltip-${nextTooltipIdentifier++}`;
  tooltip.setAttribute('role', 'tooltip');
  tooltip.setAttribute('data-gpu-operation-tooltip', '');
  tooltip.hidden = true;
  Object.assign(tooltip.style, {
    position: 'fixed',
    zIndex: '2147483647',
    pointerEvents: 'none',
    boxSizing: 'border-box',
    width: '560px',
    maxWidth: 'calc(100vw - 24px)',
    maxHeight: 'min(440px, calc(100vh - 24px))',
    overflow: 'hidden',
    padding: '18px',
    border: '1px solid rgb(125 170 212 / 32%)',
    borderRadius: '12px',
    background: 'linear-gradient(145deg, #111e30, #080f1b 70%)',
    color: '#e4effc',
    boxShadow: '0 8px 28px rgb(0 0 0 / 45%)',
    font: '14px/1.5 system-ui, sans-serif',
    whiteSpace: 'normal',
    overflowWrap: 'anywhere'
  });
  const style = document.createElement('style');
  style.textContent = TOOLTIP_CSS;
  tooltip.append(style);
  document.body.append(tooltip);
  return tooltip;
}

export function positionGPUOperationTooltip(tooltip: HTMLElement, anchor: HTMLElement): void {
  const bounds = anchor.getBoundingClientRect();
  const viewport = anchor.ownerDocument.documentElement;
  const tooltipBounds = tooltip.getBoundingClientRect();
  tooltip.style.left = `${Math.max(12, Math.min(bounds.left, viewport.clientWidth - tooltipBounds.width - 12))}px`;
  const top =
    bounds.bottom + tooltipBounds.height + 12 < viewport.clientHeight
      ? bounds.bottom + 6
      : bounds.top - tooltipBounds.height - 6;
  tooltip.style.top = `${Math.max(12, Math.min(top, viewport.clientHeight - tooltipBounds.height - 12))}px`;
}

/** Declared accesses describe potential inputs/outputs, not measured GPU traffic. */
export function formatGPUOperationDetails(
  node: Pick<GPUCommandGraphNodeEncodingStats, 'id' | 'description' | 'resources'>,
  heading = node.id
): string {
  const lines = [heading];
  if (node.description) lines.push(node.description);
  if (node.resources?.length) {
    lines.push('', 'Declared inputs / outputs');
    for (const resource of node.resources) {
      const access =
        resource.usage === 'storage-read-write' || resource.usage === 'render-attachment'
          ? 'Input/output'
          : ['storage-write', 'copy-destination'].includes(resource.usage)
            ? 'Output'
            : 'Input';
      const shape =
        resource.width !== undefined
          ? `${resource.width} × ${resource.height}${resource.depth && resource.depth > 1 ? ` × ${resource.depth}` : ''}`
          : resource.length !== undefined
            ? `${resource.length.toLocaleString()} rows`
            : undefined;
      const size =
        resource.byteLength === undefined
          ? undefined
          : `${resource.byteLength.toLocaleString()} B${resource.byteOffset ? ` @ ${resource.byteOffset.toLocaleString()}` : ''}`;
      lines.push(
        `${access}: ${resource.id}`,
        `  ${[resource.usage, resource.format ?? resource.kind, shape, size].filter(Boolean).join(' · ')}`
      );
    }
  }
  return lines.join('\n');
}

type TooltipNode = Pick<GPUCommandGraphNodeEncodingStats, 'id' | 'description' | 'resources'> & {
  operation?: string;
  type?: string;
};

/** Render text through DOM APIs so application metadata never becomes markup. */
export function renderGPUOperationTooltip(
  tooltip: HTMLElement,
  node: TooltipNode,
  options: {name?: string; timing?: string} = {}
): void {
  const document = tooltip.ownerDocument;
  const content = document.createElement('div');
  content.className = 'gpu-operation-content';
  const append = (parent: HTMLElement, tag: string, className: string, text: string) => {
    const element = document.createElement(tag);
    element.className = className;
    element.textContent = text;
    parent.append(element);
    return element;
  };
  const header = append(content, 'div', 'gpu-operation-header', '');
  const suffix = node.id.split('-').filter(Boolean).at(-1) ?? node.id;
  const name = options.name ?? node.operation ?? suffix.replace(/([a-z])([A-Z])/g, '$1 $2');
  append(header, 'strong', 'gpu-operation-name', name.charAt(0).toUpperCase() + name.slice(1));
  if (node.type)
    append(header, 'span', 'gpu-operation-kind', node.type === 'render' ? 'draw' : node.type);
  append(content, 'code', 'gpu-operation-id', node.id);
  if (node.description) append(content, 'p', 'gpu-operation-description', node.description);
  if (node.resources?.length) {
    const section = append(content, 'section', 'gpu-operation-resources', '');
    append(section, 'div', 'gpu-operation-section-label', 'Declared inputs / outputs');
    const table = document.createElement('table');
    table.className = 'gpu-operation-table';
    const caption = document.createElement('caption');
    caption.textContent = 'Declared resource inputs and outputs';
    caption.hidden = true;
    table.append(caption);
    const headerRow = table.createTHead().insertRow();
    for (const label of ['Access', 'Resource', 'Format / shape', 'Size']) {
      const cell = document.createElement('th');
      cell.scope = 'col';
      cell.textContent = label;
      headerRow.append(cell);
    }
    const body = table.createTBody();
    const prefix = node.id.slice(0, node.id.lastIndexOf('-') + 1);
    const visibleResources = node.resources.slice(0, 6);
    for (const resource of visibleResources) {
      const row = body.insertRow();
      const access =
        resource.usage === 'storage-read-write' || resource.usage === 'render-attachment'
          ? 'In / out'
          : ['storage-write', 'copy-destination'].includes(resource.usage)
            ? 'Output'
            : 'Input';
      const badge = append(row.insertCell(), 'span', 'gpu-operation-access', access);
      badge.dataset['access'] = access;
      const resourceCell = row.insertCell();
      const identifier = append(
        resourceCell,
        'code',
        'gpu-operation-resource-id',
        prefix && resource.id.startsWith(prefix) ? resource.id.slice(prefix.length) : resource.id
      );
      identifier.title = `${resource.id} · ${resource.usage}`;
      const formatCell = row.insertCell();

      const shape =
        resource.width !== undefined
          ? `${resource.width} × ${resource.height}${resource.depth && resource.depth > 1 ? ` × ${resource.depth}` : ''}`
          : resource.length !== undefined
            ? `${resource.length.toLocaleString()} rows`
            : '';
      const format = append(
        formatCell,
        'code',
        'gpu-operation-format',
        [resource.format ?? resource.kind, shape].filter(Boolean).join(' · ')
      );
      format.title = format.textContent ?? '';
      const sizeCell = row.insertCell();
      sizeCell.className = 'gpu-operation-size';
      sizeCell.textContent =
        resource.byteLength === undefined
          ? '—'
          : resource.byteLength >= 1024
            ? `${(resource.byteLength / 1024).toFixed(1)} KiB`
            : `${resource.byteLength} B`;
      if (resource.byteLength !== undefined)
        sizeCell.title = `${resource.byteLength.toLocaleString()} bytes`;
      if (resource.byteOffset)
        sizeCell.title += ` · offset ${resource.byteOffset.toLocaleString()} bytes`;
    }
    section.append(table);
    const overflow = append(section, 'div', 'gpu-operation-resource-overflow', '');
    updateResourceOverflow(overflow, node.resources.length, visibleResources.length);
  }
  if (options.timing) append(content, 'div', 'gpu-operation-timing', options.timing);
  tooltip.querySelector('.gpu-operation-content')?.remove();
  tooltip.append(content);
  // Measure the complete card, including description, overflow count and timing footer.
  // A viewport-only row estimate can overflow the card's independent 440px height cap.
  const wasHidden = tooltip.hidden;
  tooltip.hidden = false;
  const body = content.querySelector('tbody');
  const overflow = content.querySelector<HTMLElement>('.gpu-operation-resource-overflow');
  while (body?.rows.length && tooltip.scrollHeight > tooltip.clientHeight) {
    body.deleteRow(-1);
    updateResourceOverflow(overflow!, node.resources!.length, body.rows.length);
    if (body.rows.length === 0) body.closest('table')!.hidden = true;
  }
  tooltip.hidden = wasHidden;
}

function updateResourceOverflow(
  element: HTMLElement,
  totalCount: number,
  visibleCount: number
): void {
  const remainingCount = totalCount - visibleCount;
  element.hidden = remainingCount === 0;
  element.textContent = remainingCount
    ? `+ ${remainingCount} more ${remainingCount === 1 ? 'resource' : 'resources'}`
    : '';
}

const TOOLTIP_CSS = `
[data-gpu-operation-tooltip] .gpu-operation-content {min-width:0;}
[data-gpu-operation-tooltip] .gpu-operation-header {display:flex; align-items:center; justify-content:space-between; gap:16px; margin-bottom:8px;}
[data-gpu-operation-tooltip] .gpu-operation-name {font:650 18px/1.25 system-ui,sans-serif; letter-spacing:-.025em; color:#f1f6ff;}
[data-gpu-operation-tooltip] .gpu-operation-kind {font:600 9px/1.4 system-ui,sans-serif; text-transform:uppercase; letter-spacing:.12em; padding:4px 7px; border:1px solid #79aee536; border-radius:5px; background:#69a8f014; color:#9ec7f4;}
[data-gpu-operation-tooltip] .gpu-operation-id {display:inline-block; max-width:100%; box-sizing:border-box; padding:4px 7px; border:1px solid #8da8c41a; border-radius:4px; background:#02081366; font:11px/1.4 ui-monospace,monospace; color:#90a6be; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; vertical-align:top;}
[data-gpu-operation-tooltip] .gpu-operation-description {margin:10px 0 12px; display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden; font:400 16px/1.5 system-ui,sans-serif; color:#dce8f6; white-space:pre-wrap;}
[data-gpu-operation-tooltip] .gpu-operation-resources {margin-top:12px; border-top:1px solid #a0bcdd20; padding-top:10px;}
[data-gpu-operation-tooltip] .gpu-operation-section-label {margin-bottom:9px; font:600 9px/1.4 system-ui,sans-serif; letter-spacing:.12em; text-transform:uppercase; color:#849bb5;}
[data-gpu-operation-tooltip] .gpu-operation-table {width:100%; border-collapse:collapse; table-layout:fixed; margin:0; display:table; font:11px/1.4 system-ui,sans-serif; color:#bfd0e3;}
[data-gpu-operation-tooltip] .gpu-operation-table th {padding:0 6px 7px; text-align:left; font:500 10px/1.4 system-ui,sans-serif; color:#7891ac; border-bottom:1px solid #a0bcdd20;}
[data-gpu-operation-tooltip] .gpu-operation-table td {padding:5px 6px; vertical-align:middle; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; border-bottom:1px solid #a0bcdd10; background:transparent;}
[data-gpu-operation-tooltip] .gpu-operation-table tr:last-child td {border-bottom:0;}
[data-gpu-operation-tooltip] .gpu-operation-table th:first-child {width:58px; padding-left:0;}
[data-gpu-operation-tooltip] .gpu-operation-table td:first-child {padding-left:0;}
[data-gpu-operation-tooltip] .gpu-operation-table th:nth-child(3) {width:100px;}
[data-gpu-operation-tooltip] .gpu-operation-table th:last-child {width:62px; text-align:right; padding-right:0;}
[data-gpu-operation-tooltip] .gpu-operation-table td:last-child {padding-right:0; text-align:right;}
[data-gpu-operation-tooltip] .gpu-operation-table code {display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; font:10.5px/1.4 ui-monospace,monospace; padding:0; border:0; background:transparent; color:inherit;}
[data-gpu-operation-tooltip] .gpu-operation-resource-id {color:#d6e6f8 !important;}
[data-gpu-operation-tooltip] .gpu-operation-resource-overflow {padding-top:7px; color:#7891ac; font:10px/1.4 system-ui,sans-serif;}
[data-gpu-operation-tooltip] .gpu-operation-access {display:inline-block; white-space:nowrap; font:600 9px/1.4 system-ui,sans-serif; padding:2px 5px; border-radius:4px; color:#8fc6fa; background:#3c92ec1a;}
[data-gpu-operation-tooltip] .gpu-operation-access[data-access="Output"] {color:#bba8ff; background:#9874ef1a;}
[data-gpu-operation-tooltip] .gpu-operation-access[data-access="In / out"] {color:#88d7c4; background:#54bda31a;}
[data-gpu-operation-tooltip] .gpu-operation-size {font:10px/1.4 ui-monospace,monospace; color:#a5bbd3; white-space:nowrap;}
[data-gpu-operation-tooltip] .gpu-operation-timing {margin-top:12px; padding-top:10px; border-top:1px solid #a0bcdd20; font:10px/1.5 ui-monospace,monospace; color:#7f9ab6; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;}
`;
