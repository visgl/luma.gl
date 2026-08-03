// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test, vi} from 'vitest';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {
  CROSS_FILTER_CATEGORY_NAMES,
  makeCrossfilterDataset,
  type CrossfilterDataset
} from '../../examples/showcase/crossfilter-supremacy/crossfilter-data';
import {CrossfilterEngine} from '../../examples/showcase/crossfilter-supremacy/crossfilter-engine';

describe('Crossfilter Supremacy GPU-resident dashboard', () => {
  test('updates linked histogram context, map and scatter brushes without rebuilding its graph', async () => {
    const device = await getWebGPUTestDevice();
    if (!device) {
      return;
    }

    const rowCount = 384;
    const seed = 947;
    const population = makeCrossfilterDataset({rowCount, seed});
    const engine = new CrossfilterEngine(device, {
      rowCount,
      seed,
      valueBinCount: 12,
      riskBinCount: 10,
      hourBinCount: 12
    });

    try {
      const initialSummary = await engine.update();
      expect(initialSummary.selectedCount).toBe(rowCount);
      expect(sum(initialSummary.categoryCounts)).toBe(rowCount);
      expect(initialSummary.histograms.value.bins).toHaveLength(12);
      expect(initialSummary.histograms.risk.bins).toHaveLength(10);
      expect(initialSummary.histograms.hour.bins).toHaveLength(12);
      expect(initialSummary.nodeCount).toBeGreaterThan(6);

      const canvasWidth = 64;
      const canvasHeight = 32;
      const canvasContext = device.getDefaultCanvasContext();
      const framebuffer = device.createFramebuffer({
        id: 'crossfilter-supremacy-test-framebuffer',
        width: canvasWidth,
        height: canvasHeight,
        colorAttachments: [device.preferredColorFormat],
        depthStencilAttachment: 'depth24plus'
      });
      // The complete SwiftShader suite can outlive Dawn's external presentation instance. Keep the
      // real point pipelines, render pass, validation scope, and queue submission while routing
      // this focused test through a test-owned offscreen framebuffer.
      const drawingBufferSize = vi
        .spyOn(canvasContext, 'getDrawingBufferSize')
        .mockReturnValue([canvasWidth, canvasHeight]);
      const currentFramebuffer = vi
        .spyOn(canvasContext, 'getCurrentFramebuffer')
        .mockReturnValue(framebuffer);
      try {
        const splitWidth = Math.floor(canvasWidth / 2);
        device.handle.pushErrorScope('validation');
        engine.render({
          canvasContext,
          mapViewport: {x: 0, y: 0, width: splitWidth, height: canvasHeight},
          scatterViewport: {
            x: splitWidth,
            y: 0,
            width: canvasWidth - splitWidth,
            height: canvasHeight
          }
        });
        await device.handle.queue.onSubmittedWorkDone();
        expect(await device.handle.popErrorScope()).toBeNull();
      } finally {
        currentFramebuffer.mockRestore();
        drawingBufferSize.mockRestore();
        framebuffer.destroy();
      }

      for (const dimension of ['value', 'risk', 'hour'] as const) {
        expect(sum(initialSummary.histograms[dimension].bins)).toBe(rowCount);
        expect(sum(initialSummary.histograms[dimension].baselineBins)).toBe(rowCount);
      }

      engine.setRange('risk', [0.61, 1]);
      const riskSummary = await engine.update();
      const riskCount = countMatchingRows(
        population,
        rowIndex => population.risk[rowIndex]! >= 0.61
      );

      expect(riskSummary.selectedCount).toBe(riskCount);
      expect(riskCount).toBeGreaterThan(0);
      expect(riskCount).toBeLessThan(rowCount);
      expect(sum(riskSummary.histograms.risk.bins)).toBe(riskCount);
      expect(sum(riskSummary.histograms.risk.baselineBins)).toBe(rowCount);
      expect(sum(riskSummary.histograms.value.baselineBins)).toBe(riskCount);
      expect(riskSummary.nodeCount).toBe(initialSummary.nodeCount);

      const mapBounds = [-0.8, -0.8, 0.8, 0.8] as const;
      const scatterBounds = [75, 0.4, 235, 0.98] as const;
      const valueRange = [85, 220] as const;
      const hourRange = [6, 23] as const;
      engine.setMapBounds(mapBounds);
      engine.setScatterBounds(scatterBounds);
      engine.setRange('value', valueRange);
      engine.setRange('hour', hourRange);

      const linkedSummary = await engine.update();
      const selectedRows = collectMatchingRows(population, rowIndex => {
        const longitude = population.longitude[rowIndex]!;
        const latitude = population.latitude[rowIndex]!;
        const value = population.value[rowIndex]!;
        const risk = population.risk[rowIndex]!;
        const hour = population.hour[rowIndex]!;
        return (
          longitude >= mapBounds[0] &&
          latitude >= mapBounds[1] &&
          longitude <= mapBounds[2] &&
          latitude <= mapBounds[3] &&
          value >= scatterBounds[0] &&
          risk >= scatterBounds[1] &&
          value <= scatterBounds[2] &&
          risk <= scatterBounds[3] &&
          value >= valueRange[0] &&
          value <= valueRange[1] &&
          risk >= 0.61 &&
          hour >= hourRange[0] &&
          hour <= hourRange[1]
        );
      });

      expect(linkedSummary.selectedCount).toBe(selectedRows.length);
      expect(selectedRows.length).toBeGreaterThan(0);
      expect(selectedRows.length).toBeLessThan(riskCount);
      expect(sum(linkedSummary.categoryCounts)).toBe(selectedRows.length);
      expect(sum(linkedSummary.histograms.value.bins)).toBe(selectedRows.length);
      expect(sum(linkedSummary.histograms.value.baselineBins)).toBeGreaterThanOrEqual(
        selectedRows.length
      );
      expect(linkedSummary.nodeCount).toBe(initialSummary.nodeCount);

      const selectedCategory = population.category[selectedRows[0]!]!;
      expect(selectedCategory).toBeLessThan(CROSS_FILTER_CATEGORY_NAMES.length);
      engine.setCategory(selectedCategory);
      const categorySummary = await engine.update();
      const expectedCategoryCount = selectedRows.filter(
        rowIndex => population.category[rowIndex] === selectedCategory
      ).length;

      expect(categorySummary.selectedCount).toBe(expectedCategoryCount);
      expect(sum(categorySummary.histograms.hour.bins)).toBe(expectedCategoryCount);
      expect(sum(categorySummary.categoryCounts)).toBe(selectedRows.length);
      expect(categorySummary.categoryCounts[selectedCategory]).toBe(expectedCategoryCount);
      expect(categorySummary.nodeCount).toBe(initialSummary.nodeCount);

      engine.clearAll();
      const clearedSummary = await engine.update();
      expect(clearedSummary.selectedCount).toBe(rowCount);
      expect(sum(clearedSummary.histograms.risk.baselineBins)).toBe(rowCount);
      expect(clearedSummary.nodeCount).toBe(initialSummary.nodeCount);
    } finally {
      engine.destroy();
    }
  }, 30_000);
});

function countMatchingRows(
  population: CrossfilterDataset,
  matches: (rowIndex: number) => boolean
): number {
  return collectMatchingRows(population, matches).length;
}

function collectMatchingRows(
  population: CrossfilterDataset,
  matches: (rowIndex: number) => boolean
): number[] {
  const matchingRows: number[] = [];
  for (let rowIndex = 0; rowIndex < population.rowCount; rowIndex++) {
    if (matches(rowIndex)) {
      matchingRows.push(rowIndex);
    }
  }
  return matchingRows;
}

function sum(values: Uint32Array): number {
  return values.reduce((total, value) => total + value, 0);
}
