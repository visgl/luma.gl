// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {describe, expect, test, vi} from 'vitest';
import {initializeGPUDataAnalysisExample} from '../../examples/experimental/gpu-data-analysis/src/app';

describe('GPU data-analysis luDF derived-column example', () => {
  test('executes an opt-in derived-column filter over existing Arrow-backed GPU buffers', async () => {
    const container = document.createElement('main');
    container.id = 'gpu-data-analysis-app';
    document.body.append(container);
    const example = initializeGPUDataAnalysisExample();
    const dataset = container.querySelector<HTMLSelectElement>('[data-dataset]');
    const button = container.querySelector<HTMLButtonElement>('[data-ludf-run]');
    const adjustment = container.querySelector<HTMLInputElement>('[data-ludf-adjustment]');
    const result = container.querySelector<HTMLElement>('[data-ludf-result]');

    try {
      expect(dataset).not.toBeNull();
      expect(button).not.toBeNull();
      expect(adjustment).not.toBeNull();
      expect(result).not.toBeNull();
      if (!dataset || !button || !adjustment || !result) return;

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
      adjustment.value = '1.25';
      button.click();

      await vi.waitFor(
        () => {
          expect(result.textContent).toContain('selected rows');
          expect(result.textContent).toContain('value × 2 + 1.25');
          expect(result.textContent).toContain('first GPU values');
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
