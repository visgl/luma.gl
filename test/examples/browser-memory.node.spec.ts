// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {describe, expect, test, vi} from 'vitest';
import {
  measureBrowserMemory,
  readBrowserHeapMemory,
  supportsPageMemoryMeasurement
} from '../../website/src/react-luma/utils/browser-memory';

describe('portable browser memory measurements', () => {
  test('reads Chromium JavaScript heap usage, allocation, and limits', () => {
    expect(
      readBrowserHeapMemory({
        memory: {
          jsHeapSizeLimit: 1_000,
          totalJSHeapSize: 600,
          usedJSHeapSize: 400
        }
      })
    ).toEqual({
      allocatedHeapBytes: 600,
      breakdown: [],
      heapLimitBytes: 1_000,
      source: 'javascript-heap',
      usedBytes: 400
    });
  });

  test('preserves unsupported browsers and rejects invalid memory counters', () => {
    expect(readBrowserHeapMemory({})).toBeNull();
    expect(readBrowserHeapMemory({memory: {usedJSHeapSize: -1}})).toBeNull();
    expect(readBrowserHeapMemory({memory: {usedJSHeapSize: Number.NaN}})).toBeNull();
    expect(readBrowserHeapMemory({memory: {usedJSHeapSize: 0}})).toEqual({
      allocatedHeapBytes: null,
      breakdown: [],
      heapLimitBytes: null,
      source: 'javascript-heap',
      usedBytes: 0
    });
  });

  test('uses complete page measurements only in cross-origin-isolated browsers', async () => {
    const measureUserAgentSpecificMemory = vi.fn(async () => ({
      bytes: 1_024,
      breakdown: [
        {bytes: 768, types: ['JavaScript']},
        {bytes: 256, types: ['DOM', 4]},
        {bytes: -1, types: ['Invalid']}
      ]
    }));
    const browserPerformance = {
      measureUserAgentSpecificMemory,
      memory: {usedJSHeapSize: 512}
    };

    expect(supportsPageMemoryMeasurement(browserPerformance, false)).toBe(false);
    await expect(measureBrowserMemory(browserPerformance, false)).resolves.toMatchObject({
      source: 'javascript-heap',
      usedBytes: 512
    });
    expect(measureUserAgentSpecificMemory).not.toHaveBeenCalled();

    expect(supportsPageMemoryMeasurement(browserPerformance, true)).toBe(true);
    await expect(measureBrowserMemory(browserPerformance, true)).resolves.toEqual({
      allocatedHeapBytes: null,
      breakdown: [
        {bytes: 768, types: ['JavaScript']},
        {bytes: 256, types: ['DOM']}
      ],
      heapLimitBytes: null,
      source: 'page-memory',
      usedBytes: 1_024
    });
  });

  test('falls back to heap counters when page-memory measurement fails', async () => {
    await expect(
      measureBrowserMemory(
        {
          measureUserAgentSpecificMemory: async () => {
            throw new Error('Browser denied the memory measurement');
          },
          memory: {usedJSHeapSize: 128}
        },
        true
      )
    ).resolves.toMatchObject({source: 'javascript-heap', usedBytes: 128});
  });
});
