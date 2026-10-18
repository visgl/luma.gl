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
    expect(gpuBars[1].title).toContain('second');
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
