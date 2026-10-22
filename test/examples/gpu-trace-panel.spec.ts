// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {GPUTracePanelRenderer} from '../../examples/gpu-trace-panel';

test('GPU Trace preserves gaps, separates clocks, and safely renders node labels', () => {
  const host = document.createElement('div');
  document.body.append(host);
  const renderer = new GPUTracePanelRenderer(host);
  try {
    renderer.update(undefined);
    expect(host.textContent).toContain('No trace collected yet');
    renderer.update({
      cpuEncodeTimeMilliseconds: 2,
      cpuEncodeStartTimeMilliseconds: 100,
      cpuEncodeEndTimeMilliseconds: 102,
      gpuTimeMilliseconds: 4,
      gpuStartTimeMilliseconds: 1000,
      gpuEndTimeMilliseconds: 1010,
      nodes: [
        {
          id: '<img src=x onerror=alert(1)>',
          type: 'compute',
          hasGPUTimestamps: true,
          cpuEncodeTimeMilliseconds: 1,
          cpuEncodeStartTimeMilliseconds: 100,
          cpuEncodeEndTimeMilliseconds: 101,
          gpuTimeMilliseconds: 2,
          gpuStartTimeMilliseconds: 1000,
          gpuEndTimeMilliseconds: 1002
        },
        {
          id: 'second',
          operation: 'Query refine',
          type: 'compute',
          hasGPUTimestamps: true,
          cpuEncodeTimeMilliseconds: 1,
          cpuEncodeStartTimeMilliseconds: 101,
          cpuEncodeEndTimeMilliseconds: 102,
          gpuTimeMilliseconds: 2,
          gpuStartTimeMilliseconds: 1008,
          gpuEndTimeMilliseconds: 1010
        }
      ]
    });
    expect(host.querySelector('img')).toBeNull();
    const gpuBars = host.querySelectorAll<HTMLElement>('[data-trace-clock="gpu"] .gpu-trace-bar');
    expect(gpuBars).toHaveLength(2);
    expect(gpuBars[1].style.left).toBe('80%');
    expect(gpuBars[1].getAttribute('aria-label')).toContain('second');
    expect(gpuBars[1].closest('.gpu-trace-row')?.firstElementChild?.textContent).toBe(
      'Query refine'
    );
    expect(host.textContent).not.toContain(' ms');
    expect(gpuBars[1].style.width).toBe('20%');
    expect(gpuBars[1].getAttribute('aria-label')).toContain('8–10ms');
    const cpuBars = host.querySelectorAll<HTMLElement>('[data-trace-clock="cpu"] .gpu-trace-bar');
    expect(cpuBars[1].style.left).toBe('50%');
    renderer.update({cpuEncodeTimeMilliseconds: 0, nodes: []});
    expect(host.querySelectorAll('.gpu-trace-bar')).toHaveLength(0);
    expect(host.textContent).toContain('GPU span endpoints unavailable');
    renderer.destroy();
    expect(host.children).toHaveLength(0);
  } finally {
    renderer.destroy();
    host.remove();
  }
});

test('GPU Trace optionally aligns clocks and falls back when correlation is unavailable', () => {
  const host = document.createElement('div');
  document.body.append(host);
  const renderer = new GPUTracePanelRenderer(host);
  const report = {
    cpuEncodeTimeMilliseconds: 2,
    clockCorrelation: {
      offsetMilliseconds: -896,
      uncertaintyMilliseconds: 0.25,
      sampledAtCpuTimeMilliseconds: 110,
      method: 'submission' as const
    },
    nodes: [
      {
        id: 'work',
        type: 'compute' as const,
        hasGPUTimestamps: true,
        cpuEncodeTimeMilliseconds: 2,
        cpuEncodeStartTimeMilliseconds: 100,
        cpuEncodeEndTimeMilliseconds: 102,
        gpuStartTimeMilliseconds: 1000,
        gpuEndTimeMilliseconds: 1004,
        gpuTimeMilliseconds: 4
      }
    ]
  };
  try {
    renderer.update(report);
    const toggle = host.querySelector<HTMLInputElement>('input')!;
    expect(toggle.disabled).toBe(false);
    toggle.click();
    expect(host.textContent).toContain('Alignment ±0.25ms');
    expect(
      host.querySelector<HTMLElement>('[data-trace-clock="gpu"] .gpu-trace-bar')!.style.left
    ).toBe('50%');
    expect(
      host.querySelector<HTMLElement>('[data-trace-clock="cpu"] .gpu-trace-bar')!.style.width
    ).toBe('25%');
    renderer.update({...report, clockCorrelation: undefined});
    expect(host.querySelector<HTMLInputElement>('input')!.disabled).toBe(true);
    expect(host.textContent).toContain('CPU and GPU use separate clocks');
    expect(
      host.querySelector<HTMLElement>('[data-trace-clock="gpu"] .gpu-trace-bar')!.style.left
    ).toBe('0%');
    expect(report.nodes[0].gpuStartTimeMilliseconds).toBe(1000);
  } finally {
    renderer.destroy();
    host.remove();
  }
});

test('GPU Trace shows immediate tooltips on rows and keyboard focus across samples', () => {
  const host = document.createElement('div');
  document.body.append(host);
  const renderer = new GPUTracePanelRenderer(host);
  const report = {
    cpuEncodeTimeMilliseconds: 1,
    nodes: [
      {
        id: '<unsafe-node>',
        description: 'Compute <contacts> safely.',
        resources: [
          {
            id: 'poses',
            kind: 'buffer' as const,
            usage: 'storage-read' as const,
            byteLength: 128,
            format: 'float32x4',
            length: 8
          }
        ],
        type: 'compute' as const,
        hasGPUTimestamps: false,
        cpuEncodeTimeMilliseconds: 1,
        cpuEncodeStartTimeMilliseconds: 0,
        cpuEncodeEndTimeMilliseconds: 1
      }
    ]
  };
  try {
    renderer.update(report);
    const bar = host.querySelector<HTMLElement>('.gpu-trace-bar')!;
    const tooltip = document.getElementById(bar.getAttribute('aria-describedby')!)!;
    expect(tooltip.hidden).toBe(true);
    host
      .querySelector('.gpu-trace-row > span')!
      .dispatchEvent(new MouseEvent('mouseover', {bubbles: true}));
    expect(tooltip.hidden).toBe(false);
    expect(tooltip.textContent).toContain('<unsafe-node>');
    expect(tooltip.querySelector('unsafe-node')).toBeNull();
    expect(tooltip.textContent).toContain('Compute <contacts> safely.');
    expect(tooltip.querySelector('tbody tr')?.textContent).toContain('Input');
    expect(tooltip.querySelector('tbody tr code')?.textContent).toBe('poses');
    expect(getComputedStyle(tooltip.querySelector('.gpu-operation-description')!).fontSize).toBe(
      '16px'
    );
    expect(tooltip.querySelector('.gpu-operation-timing')?.textContent).toContain('CPU');
    expect(tooltip.textContent).toContain('float32x4');
    expect(tooltip.textContent).toContain('8 rows');
    expect(tooltip.textContent).toContain('128 B');
    expect(tooltip.parentElement).toBe(document.body);
    expect(getComputedStyle(tooltip).fontSize).toBe('14px');
    expect(getComputedStyle(tooltip).zIndex).toBe('2147483647');
    renderer.update(report);
    expect(tooltip.hidden).toBe(false);
    host
      .querySelector('.gpu-trace-bar')!
      .dispatchEvent(new MouseEvent('mouseout', {bubbles: true}));
    expect(tooltip.hidden).toBe(true);
    host.querySelector<HTMLElement>('.gpu-trace-bar')!.focus();
    expect(tooltip.hidden).toBe(false);
    renderer.update(report);
    expect(document.activeElement).toBe(host.querySelector('.gpu-trace-bar'));
    expect(tooltip.hidden).toBe(false);
    host
      .querySelector('.gpu-trace-bar')!
      .dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape', bubbles: true}));
    expect(tooltip.hidden).toBe(true);
    renderer.update(report);
    expect(document.activeElement).toBe(host.querySelector('.gpu-trace-bar'));
    expect(tooltip.hidden).toBe(true);
    renderer.destroy();
    expect(tooltip.isConnected).toBe(false);
  } finally {
    renderer.destroy();
    host.remove();
  }
});

test('GPU Trace updates never take focus from another panel showing the same spans', () => {
  const firstHost = document.createElement('div');
  const secondHost = document.createElement('div');
  document.body.append(firstHost, secondHost);
  const firstRenderer = new GPUTracePanelRenderer(firstHost);
  const secondRenderer = new GPUTracePanelRenderer(secondHost);
  const report = {
    cpuEncodeTimeMilliseconds: 1,
    nodes: [
      {
        id: 'shared-span',
        type: 'compute' as const,
        hasGPUTimestamps: false,
        cpuEncodeStartTimeMilliseconds: 0,
        cpuEncodeEndTimeMilliseconds: 1
      }
    ]
  };
  try {
    firstRenderer.update(report);
    secondRenderer.update(report);
    const firstBar = firstHost.querySelector<HTMLElement>('.gpu-trace-bar')!;
    firstBar.focus();
    secondRenderer.update(report);
    expect(document.activeElement).toBe(firstBar);
    const secondBar = secondHost.querySelector<HTMLElement>('.gpu-trace-bar')!;
    const secondTooltip = document.getElementById(secondBar.getAttribute('aria-describedby')!)!;
    expect(secondTooltip.hidden).toBe(true);
    firstRenderer.update(report);
    expect(document.activeElement).toBe(firstHost.querySelector('.gpu-trace-bar'));
  } finally {
    firstRenderer.destroy();
    secondRenderer.destroy();
    firstHost.remove();
    secondHost.remove();
  }
});
