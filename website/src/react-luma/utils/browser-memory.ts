// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export type BrowserMemoryBreakdown = {
  bytes: number;
  types: string[];
};

export type BrowserMemoryMeasurement = {
  allocatedHeapBytes: number | null;
  breakdown: BrowserMemoryBreakdown[];
  heapLimitBytes: number | null;
  source: 'javascript-heap' | 'page-memory';
  usedBytes: number;
};

export type BrowserMemoryPerformance = {
  memory?: {
    jsHeapSizeLimit?: unknown;
    totalJSHeapSize?: unknown;
    usedJSHeapSize?: unknown;
  };
  measureUserAgentSpecificMemory?: () => Promise<{
    breakdown?: readonly unknown[];
    bytes: unknown;
  }>;
};

export function supportsPageMemoryMeasurement(
  browserPerformance: BrowserMemoryPerformance,
  crossOriginIsolated: boolean
): boolean {
  return (
    crossOriginIsolated &&
    typeof browserPerformance.measureUserAgentSpecificMemory === 'function'
  );
}

export function readBrowserHeapMemory(
  browserPerformance: BrowserMemoryPerformance
): BrowserMemoryMeasurement | null {
  const heapMemory = browserPerformance.memory;
  if (!heapMemory || !isValidMemoryByteCount(heapMemory.usedJSHeapSize)) {
    return null;
  }

  return {
    allocatedHeapBytes: isValidMemoryByteCount(heapMemory.totalJSHeapSize)
      ? heapMemory.totalJSHeapSize
      : null,
    breakdown: [],
    heapLimitBytes: isValidMemoryByteCount(heapMemory.jsHeapSizeLimit)
      ? heapMemory.jsHeapSizeLimit
      : null,
    source: 'javascript-heap',
    usedBytes: heapMemory.usedJSHeapSize
  };
}

export async function measureBrowserMemory(
  browserPerformance: BrowserMemoryPerformance,
  crossOriginIsolated: boolean
): Promise<BrowserMemoryMeasurement | null> {
  if (!supportsPageMemoryMeasurement(browserPerformance, crossOriginIsolated)) {
    return readBrowserHeapMemory(browserPerformance);
  }

  try {
    const measurement = await browserPerformance.measureUserAgentSpecificMemory?.();
    if (!measurement || !isValidMemoryByteCount(measurement.bytes)) {
      return readBrowserHeapMemory(browserPerformance);
    }

    return {
      allocatedHeapBytes: null,
      breakdown: normalizeMemoryBreakdown(measurement.breakdown),
      heapLimitBytes: null,
      source: 'page-memory',
      usedBytes: measurement.bytes
    };
  } catch {
    return readBrowserHeapMemory(browserPerformance);
  }
}

function normalizeMemoryBreakdown(
  breakdown: readonly unknown[] | undefined
): BrowserMemoryBreakdown[] {
  if (!Array.isArray(breakdown)) {
    return [];
  }

  return breakdown.flatMap(entry => {
    if (!entry || typeof entry !== 'object') {
      return [];
    }

    const memoryEntry = entry as {bytes?: unknown; types?: unknown};
    if (!isValidMemoryByteCount(memoryEntry.bytes)) {
      return [];
    }

    return [
      {
        bytes: memoryEntry.bytes,
        types: Array.isArray(memoryEntry.types)
          ? memoryEntry.types.filter((type): type is string => typeof type === 'string')
          : []
      }
    ];
  });
}

function isValidMemoryByteCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}
