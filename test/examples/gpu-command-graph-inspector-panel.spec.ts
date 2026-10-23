// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {describe, expect, test, vi} from 'vitest';
import {
  GPUCommandGraphInspector,
  type GPUCommandGraphCapabilities,
  type GPUCommandGraphStats
} from '@luma.gl/graph/gpu-core';
import {GPUCommandGraphInspectorPanel} from '../../examples/gpu-command-graph-inspector-panel';

const EMPTY_GRAPH_STATS: GPUCommandGraphStats = {
  nodeOrder: [],
  importedBufferCount: 0,
  importedBufferBytes: 0,
  logicalBufferCount: 0,
  logicalBufferBytes: 0,
  logicalTransientBufferCount: 0,
  physicalTransientBufferCount: 0,
  logicalTransientBytes: 0,
  physicalTransientBytes: 0,
  reusedTransientBytes: 0,
  reusePercentage: 0,
  importedTextureCount: 0,
  importedTextureBytes: 0,
  logicalTextureCount: 0,
  logicalTextureBytes: 0,
  logicalTransientTextureCount: 0,
  physicalTransientTextureCount: 0,
  logicalTransientTextureBytes: 0,
  physicalTransientTextureBytes: 0,
  reusedTransientTextureBytes: 0,
  textureReusePercentage: 0,
  logicalResourceBytes: 0,
  physicalTransientResourceBytes: 0
};

const GRAPH_CAPABILITIES: GPUCommandGraphCapabilities = {
  timestampQueries: false,
  softwareAdapter: false,
  maxBufferByteLength: 1_000_000,
  maxStorageBufferBindingByteLength: 500_000,
  maxComputeInvocationsPerWorkgroup: 256,
  maxComputeWorkgroupsPerDimension: 65_535
};

describe('GPUCommandGraphInspectorPanel', () => {
  test('safely renders hostile IDs inside a bounded counter scroller', () => {
    const inspector = new GPUCommandGraphInspector();
    for (const id of ['constructor', 'toString', '__proto__']) {
      inspector.registerGraph({id, stats: EMPTY_GRAPH_STATS, capabilities: GRAPH_CAPABILITIES});
    }
    inspector.recordCounters(
      'constructor',
      Object.fromEntries([
        ['constructor', 1],
        ['toString', 2],
        ['__proto__', 3],
        ...Array.from({length: 24}, (_, index) => [`counter-${index}`, index + 4])
      ])
    );

    const host = document.createElement('div');
    document.body.append(host);
    const panel = new GPUCommandGraphInspectorPanel(host);
    try {
      const snapshot = inspector.getSnapshot();
      panel.update(snapshot, 'constructor');

      const counterRows = host.querySelector<HTMLElement>('[data-graph-inspector-counter-rows]')!;
      expect(host.textContent).toContain('constructor');
      expect(counterRows.textContent).toContain('toString');
      expect(counterRows.textContent).toContain('__proto__');
      expect(counterRows.children).toHaveLength(27);
      expect(getComputedStyle(counterRows).maxHeight).toBe('110px');
      expect(getComputedStyle(counterRows).overflowY).toBe('auto');
      expect(
        counterRows.previousElementSibling?.classList.contains('graph-inspector-counter-header')
      ).toBe(true);

      panel.update(snapshot, 'toString');
      expect(host.textContent).toContain('toString');
      panel.update(snapshot, '__proto__');
      expect(host.textContent).toContain('__proto__');
    } finally {
      panel.destroy();
      host.remove();
    }
  });

  test('retains rows, scroll position and unchanged text across samples', () => {
    const inspector = new GPUCommandGraphInspector();
    inspector.registerGraph({
      id: 'graph',
      stats: EMPTY_GRAPH_STATS,
      capabilities: GRAPH_CAPABILITIES
    });
    inspector.recordCounters('graph', {matches: 1});
    const graph = inspector.getSnapshot().graphs[0];
    const makeSnapshot = (identifiers: string[], duration = 1) => ({
      graphs: [
        {
          ...graph,
          nodes: identifiers.map(id => ({
            id,
            type: 'compute' as const,
            cpu: {sampleCount: 1, p50Milliseconds: duration, p95Milliseconds: duration},
            gpu: {sampleCount: 0}
          }))
        }
      ]
    });
    const identifiers = Array.from({length: 20}, (_, index) => `node-${index}`);
    const host = document.createElement('div');
    document.body.append(host);
    const panel = new GPUCommandGraphInspectorPanel(host);
    try {
      panel.update(makeSnapshot(identifiers));
      const nodes = host.querySelector<HTMLElement>('[data-graph-inspector-nodes]')!;
      const counterRows = host.querySelector<HTMLElement>('[data-graph-inspector-counter-rows]')!;
      const firstRow = nodes.firstElementChild!;
      const firstCounter = counterRows.firstElementChild!;
      const cpuValue = firstRow.querySelector('[data-node-cpu]')!;
      nodes.scrollTop = 100;
      const scrollTop = nodes.scrollTop;
      const observer = new MutationObserver(() => {});
      observer.observe(host, {childList: true, subtree: true});
      panel.update(makeSnapshot(identifiers));
      expect(observer.takeRecords()).toHaveLength(0);
      observer.disconnect();
      panel.update(makeSnapshot(identifiers, 2));
      expect(nodes.firstElementChild).toBe(firstRow);
      expect(firstRow.querySelector('[data-node-cpu]')).toBe(cpuValue);
      expect(cpuValue.textContent).toContain('2');
      expect(counterRows.firstElementChild).toBe(firstCounter);
      expect(nodes.scrollTop).toBe(scrollTop);
      panel.update(makeSnapshot(['inserted', ...identifiers.slice(0, -1)]));
      expect(nodes.children[1]).toBe(firstRow);
      expect(nodes.children).toHaveLength(20);
      panel.update(makeSnapshot(['node-1']));
      expect(nodes.children).toHaveLength(1);
      expect(firstRow.isConnected).toBe(false);
      inspector.recordCounters('graph', {matches: 3, added: 5});
      panel.update({
        graphs: [
          {
            ...makeSnapshot(['node-1']).graphs[0],
            counters: inspector.getSnapshot().graphs[0].counters
          }
        ]
      });
      expect(counterRows.firstElementChild).toBe(firstCounter);
      expect(firstCounter.textContent).toContain('3');
      expect(counterRows.children).toHaveLength(2);
    } finally {
      panel.destroy();
      host.remove();
    }
  });
});

test('GPU Graph tooltips preserve descriptions as plain text', () => {
  const inspector = new GPUCommandGraphInspector();
  inspector.registerGraph({
    id: 'physics',
    stats: EMPTY_GRAPH_STATS,
    capabilities: GRAPH_CAPABILITIES
  });
  inspector.recordEncoding('physics', {
    stats: {
      cpuEncodeTimeMilliseconds: 1,
      nodeCount: 1,
      skippedNodeCount: 0,
      computePassCount: 1,
      coalescedComputeNodeCount: 0,
      timestampedNodeCount: 0,
      nodes: [
        {
          id: 'solve',
          type: 'compute',
          description: 'Resolve <contacts> & "joints".',
          resources: [
            {id: 'body-poses', kind: 'buffer', usage: 'storage-read-write', byteLength: 64}
          ],
          cpuEncodeTimeMilliseconds: 1,
          hasGPUTimestamps: false
        }
      ]
    },
    readTimings: async () => ({cpuEncodeTimeMilliseconds: 1, nodes: []})
  });
  const host = document.createElement('div');
  document.body.append(host);
  const panel = new GPUCommandGraphInspectorPanel(host);
  try {
    panel.update(inspector.getSnapshot(), 'physics');
    const row = host.querySelector<HTMLElement>('[data-full-name]')!;
    row.dispatchEvent(new MouseEvent('mouseover', {bubbles: true}));
    const tooltip = document.getElementById(row.getAttribute('aria-describedby')!)!;
    expect(tooltip.parentElement).toBe(document.body);
    expect(tooltip.textContent).toContain('Resolve <contacts> & "joints".');
    expect(tooltip.querySelector('tbody tr')?.textContent).toContain('In / out');
    expect(tooltip.querySelector('tbody tr code')?.textContent).toBe('body-poses');
    expect(tooltip.querySelector('.gpu-operation-name')?.textContent).toBe('Solve');
    expect(tooltip.querySelector('.gpu-operation-id')?.textContent).toBe('solve');
    expect(getComputedStyle(tooltip.querySelector('.gpu-operation-id')!).fontSize).toBe('11px');
    expect(getComputedStyle(tooltip.querySelector('.gpu-operation-description')!).fontSize).toBe(
      '16px'
    );
    expect(tooltip.querySelectorAll('th')).toHaveLength(4);
    expect(tooltip.textContent).toContain('64 B');
    expect(getComputedStyle(tooltip).fontSize).toBe('14px');
    expect(getComputedStyle(tooltip).position).toBe('fixed');
    expect(getComputedStyle(tooltip).zIndex).toBe('2147483647');
    expect(tooltip.querySelector('contacts')).toBeNull();
    row.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape', bubbles: true}));
    expect(tooltip.hidden).toBe(true);
    row.focus();
    expect(tooltip.hidden).toBe(false);
    row.blur();
    row.dispatchEvent(new MouseEvent('mouseover', {bubbles: true}));
    expect(tooltip.hidden).toBe(false);
    inspector.registerGraph({
      id: 'physics',
      stats: EMPTY_GRAPH_STATS,
      capabilities: GRAPH_CAPABILITIES
    });
    panel.update(inspector.getSnapshot(), 'physics');
    expect(tooltip.hidden).toBe(true);
    expect(row.isConnected).toBe(false);
    panel.destroy();
    expect(tooltip.isConnected).toBe(false);
    expect(host.querySelector('contacts')).toBeNull();
  } finally {
    panel.destroy();
    host.remove();
  }
});

test('resource tab shows textures, reads selected data and ignores stale hover results', async () => {
  const inspector = new GPUCommandGraphInspector();
  inspector.registerGraph({
    id: 'resources',
    stats: EMPTY_GRAPH_STATS,
    capabilities: GRAPH_CAPABILITIES
  });
  let complete: ((value: {data: Uint8Array}) => void) | undefined;
  const read = vi
    .spyOn(inspector, 'readResource')
    .mockImplementationOnce(
      () =>
        new Promise(resolve => {
          complete = resolve;
        })
    )
    .mockResolvedValue({
      data: new Uint8Array([10, 20, 30, 255]),
      width: 1,
      height: 1,
      format: 'rgba8unorm'
    });
  const host = document.createElement('div');
  document.body.append(host);
  const panel = new GPUCommandGraphInspectorPanel(host, {inspector});
  try {
    panel.update({
      graphs: [
        {
          ...inspector.getSnapshot().graphs[0],
          nodes: [
            {
              id: 'draw',
              type: 'render',
              cpu: {sampleCount: 0},
              gpu: {sampleCount: 0},
              resources: [
                {id: '<buffer>', kind: 'buffer', usage: 'storage-read', byteLength: 4},
                {
                  id: 'image',
                  kind: 'texture',
                  usage: 'sampled',
                  width: 1,
                  height: 1,
                  format: 'rgba8unorm'
                }
              ]
            }
          ]
        }
      ]
    });
    expect(read).not.toHaveBeenCalled();
    host.querySelector<HTMLButtonElement>('[data-inspector-tab="resources"]')!.click();
    const rows = host.querySelectorAll<HTMLElement>('[data-resource-key]');
    expect(rows).toHaveLength(2);
    expect(rows[0].textContent).toContain('<buffer>');
    expect(rows[0].querySelector('buffer')).toBeNull();
    rows[0].dispatchEvent(new MouseEvent('mouseover', {bubbles: true}));
    const tooltip = document.querySelector<HTMLElement>('[data-gpu-graph-tooltip]')!;
    expect(tooltip.textContent).toContain('Reading');
    rows[0].dispatchEvent(new MouseEvent('mouseout', {bubbles: true}));
    rows[1].click();
    await vi.waitFor(() =>
      expect(host.querySelector('[data-resource-viewer]')!.textContent).toContain('10, 20, 30, 255')
    );
    expect(host.querySelector('[data-resource-viewer] canvas')).not.toBeNull();
    complete!({data: new Uint8Array([99])});
    await Promise.resolve();
    expect(tooltip.hidden).toBe(true);
    expect(host.querySelector('[data-resource-viewer]')!.textContent).not.toContain('99');
    expect(read).toHaveBeenCalledTimes(2);
    host.querySelector<HTMLButtonElement>('[data-resource-refresh]')!.click();
    await vi.waitFor(() => expect(read).toHaveBeenCalledTimes(3));
  } finally {
    panel.destroy();
    host.remove();
  }
});
