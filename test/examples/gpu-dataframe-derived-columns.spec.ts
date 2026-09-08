// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {describe, expect, test, vi} from 'vitest';
import {initializeGPUDataAnalysisExample} from '../../examples/experimental/gpu-data-analysis/src/app';

describe('GPU data-analysis loaders.gl SQL example', () => {
  test('executes an opt-in loaders.gl predicate over existing Arrow-backed GPU buffers', async () => {
    const container = document.createElement('main');
    container.id = 'gpu-data-analysis-app';
    document.body.append(container);
    const example = initializeGPUDataAnalysisExample();
    const dataset = container.querySelector<HTMLSelectElement>('[data-dataset]');
    const button = container.querySelector<HTMLButtonElement>('[data-gpu-dataframe-run]');
    const expression = container.querySelector<HTMLElement>('[data-gpu-dataframe-expression]');
    const selected = container.querySelector<HTMLElement>('[data-gpu-dataframe-selected]');
    const rate = container.querySelector<HTMLElement>('[data-gpu-dataframe-rate]');
    const execution = container.querySelector<HTMLElement>('[data-gpu-dataframe-execution]');
    const preview = container.querySelector<HTMLElement>('[data-gpu-dataframe-preview]');
    const threshold = container.querySelector<HTMLInputElement>('[data-gpu-dataframe-threshold]');
    const result = container.querySelector<HTMLElement>('[data-gpu-dataframe-result]');

    try {
      expect(dataset).not.toBeNull();
      expect(button).not.toBeNull();
      expect(expression).not.toBeNull();
      expect(selected).not.toBeNull();
      expect(rate).not.toBeNull();
      expect(execution).not.toBeNull();
      expect(preview).not.toBeNull();
      expect(threshold).not.toBeNull();
      expect(result).not.toBeNull();
      if (
        !dataset ||
        !button ||
        !expression ||
        !selected ||
        !rate ||
        !execution ||
        !preview ||
        !threshold ||
        !result
      ) {
        return;
      }

      dataset.value = 'small';
      await vi.waitFor(
        () => {
          expect(container.querySelector('[data-validation]')?.getAttribute('data-state')).toBe(
            'ok'
          );
        },
        {timeout: 30_000, interval: 100}
      );

      expect(result.textContent).toContain('without copying rows');
      expect(expression.textContent).toContain('value > :threshold');
      button.click();

      await vi.waitFor(
        () => {
          expect(result.textContent).toContain('selected rows');
          expect(result.textContent).toContain('loaders.gl WHERE value > :threshold');
          expect(result.textContent).toContain('first GPU values');
          expect(result.textContent).toContain('CPU verified');
          expect(selected.textContent).toMatch(/[\d,]+/);
          expect(rate.textContent).toMatch(/\d+\.\d%/);
          expect(execution.textContent).toMatch(/\d+\.\d ms/);
          expect(preview.textContent).toMatch(/-?\d+\.\d{2}/);
        },
        {timeout: 30_000, interval: 100}
      );

      const previousSelection = selected.textContent;
      threshold.value = '0.75';
      threshold.dispatchEvent(new Event('input', {bubbles: true}));
      threshold.dispatchEvent(new Event('change', {bubbles: true}));

      await vi.waitFor(
        () => {
          expect(expression.textContent).toContain('threshold = 0.75');
          expect(selected.textContent).not.toBe(previousSelection);
          expect(result.textContent).toContain('CPU verified');
        },
        {timeout: 30_000, interval: 100}
      );
    } finally {
      example.destroy();
      container.remove();
    }
  });
});
