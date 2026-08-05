// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {luma} from '@luma.gl/core';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {describe, expect, test, vi} from 'vitest';
import {
  initializeGPUDataAnalysisExample,
  type GPUDataAnalysisExampleHandle
} from '../../examples/experimental/gpu-data-analysis/src/app';
import {runLuDataFrameBenchmark} from '../../examples/experimental/gpu-data-analysis/src/ludf-benchmark';

const BENCHMARK_PHASES = ['upload', 'compile', 'index', 'execution', 'readback', 'cpu'] as const;

describe('Arrow-driven luDF dataframe example', () => {
  test('validates real filtering, grouping, stable sorting, and joins against equivalent CPU work', async () => {
    const device = await getWebGPUTestDevice();
    if (!device) {
      return;
    }

    const result = await runLuDataFrameBenchmark(device, {rowCount: 128});

    expect(result.rowCount).toBe(128);
    expect(result.batchRowCounts).toHaveLength(3);
    expect(result.batchRowCounts[1]).toBe(0);
    expect(result.batchRowCounts.reduce((count, batchRows) => count + batchRows, 0)).toBe(128);
    expect(result.validation).toEqual({
      filter: true,
      groups: true,
      sorting: true,
      join: true
    });
    expect(result.summaries.filterCount).toBeGreaterThan(0);
    expect(result.summaries.groupCounts).toHaveLength(4);
    expect(result.summaries.topKRowIds).toHaveLength(3);
    expect(result.summaries.joinCounts).toHaveLength(3);
    expect(result.summaries.joinLeftRowIds).toHaveLength(3);
    expect(result.summaries.joinRightRowIds).toHaveLength(3);
    expect(result.summaries.joinLeftRowIds[1]).toEqual([]);
    expect(result.summaries.joinRightRowIds[1]).toEqual([]);
    expect(result.readbackBytes).toBeGreaterThan(0);
    expect(result.readbackBytes).toBeLessThanOrEqual(1024);

    for (const phase of [
      result.timings.uploadMilliseconds,
      result.timings.compileMilliseconds,
      result.timings.indexMilliseconds,
      result.timings.executionMilliseconds,
      result.timings.readbackMilliseconds,
      result.timings.cpuMilliseconds
    ]) {
      expect(Number.isFinite(phase)).toBe(true);
      expect(phase).toBeGreaterThanOrEqual(0);
    }
  }, 30_000);

  test('runs the real WebGPU benchmark only after an explicit interactive request', async () => {
    const availableDevice = await getWebGPUTestDevice();
    if (!availableDevice) {
      return;
    }

    const root = document.createElement('main');
    root.id = 'gpu-data-analysis-app';
    document.body.append(root);
    let example: GPUDataAnalysisExampleHandle | undefined;

    try {
      example = initializeGPUDataAnalysisExample();

      const dataset = getRequiredElement<HTMLSelectElement>(root, '[data-dataset]');
      dataset.value = 'small';

      const button = getRequiredElement<HTMLButtonElement>(root, '#analysis-ludf-benchmark-run');
      const status = getRequiredElement<HTMLElement>(root, '#analysis-ludf-benchmark-status');
      const results = getRequiredElement<HTMLElement>(root, '#analysis-ludf-benchmark-results');

      expect(button.matches('[data-ludf-benchmark]')).toBe(true);
      expect(status.matches('[data-ludf-benchmark-status]')).toBe(true);
      expect(results.matches('[data-ludf-benchmark-phases]')).toBe(true);
      expect(results.dataset.state).toBe('idle');
      expect(results.dataset.validated).toBe('false');
      expect(results.querySelectorAll('[data-ludf-phase]')).toHaveLength(0);

      await vi.waitFor(
        () => {
          expect(getRequiredElement<HTMLElement>(root, '[data-validation]').dataset.state).toBe(
            'ok'
          );
          expect(button.disabled).toBe(false);
        },
        {timeout: 20_000, interval: 25}
      );

      expect(results.dataset.state).toBe('idle');
      expect(results.querySelectorAll('[data-ludf-phase]')).toHaveLength(0);

      button.click();
      expect(results.dataset.state).toBe('running');
      expect(button.disabled).toBe(true);

      await vi.waitFor(
        () => {
          expect(results.dataset.state).toBe('ok');
          expect(results.dataset.validated).toBe('true');
          expect(button.disabled).toBe(false);
        },
        {timeout: 25_000, interval: 25}
      );

      for (const phase of BENCHMARK_PHASES) {
        const row = getRequiredElement<HTMLElement>(results, `[data-ludf-phase="${phase}"]`);
        const milliseconds = Number(row.querySelector('td')?.textContent);
        expect(Number.isFinite(milliseconds)).toBe(true);
        expect(milliseconds).toBeGreaterThanOrEqual(0);
      }
      expect(status.textContent).toContain('384');
      expect(status.textContent).toMatch(/filter, grouping, sorting, and joins match/i);
      expect(status.textContent).toMatch(/summary bytes read/i);
    } finally {
      example?.destroy();
      root.remove();
    }
  }, 45_000);

  test('keeps the opt-in benchmark disabled when WebGPU initialization fails', async () => {
    const root = document.createElement('main');
    root.id = 'gpu-data-analysis-app';
    document.body.append(root);
    const createDevice = vi
      .spyOn(luma, 'createDevice')
      .mockRejectedValue(new Error('WebGPU test adapter unavailable'));
    let example: GPUDataAnalysisExampleHandle | undefined;

    try {
      example = initializeGPUDataAnalysisExample();

      await vi.waitFor(
        () => {
          const status = getRequiredElement<HTMLElement>(root, '[data-status]');
          expect(status.dataset.state).toBe('error');
          expect(status.textContent).toContain('WebGPU test adapter unavailable');
        },
        {timeout: 2_000, interval: 10}
      );

      expect(
        getRequiredElement<HTMLButtonElement>(root, '#analysis-ludf-benchmark-run').disabled
      ).toBe(true);
      expect(
        getRequiredElement<HTMLElement>(root, '#analysis-ludf-benchmark-status').textContent
      ).toMatch(/WebGPU is unavailable/i);
      expect(
        getRequiredElement<HTMLElement>(root, '#analysis-ludf-benchmark-results').dataset.state
      ).toBe('idle');
    } finally {
      example?.destroy();
      createDevice.mockRestore();
      root.remove();
    }
  });
});

function getRequiredElement<T extends Element>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Missing luDF benchmark element ${selector}`);
  }
  return element;
}
