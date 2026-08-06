// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {describe, expect, test} from 'vitest';
import {
  getCrossfilterPreset,
  makeCrossfilterNormalizedBounds,
  makeCrossfilterSelectionBounds
} from '../../examples/showcase/million-row-crossfilter/app';
import {
  CROSS_FILTER_CATEGORY_NAMES,
  CROSS_FILTER_DOMAINS,
  CROSS_FILTER_MAP_DOMAIN,
  makeCrossfilterDataset
} from '../../examples/showcase/million-row-crossfilter/crossfilter-data';

describe('Million-Row Crossfilter Explorer synthetic population', () => {
  test('creates deterministic, source-aligned GPU upload columns', () => {
    const firstPopulation = makeCrossfilterDataset({rowCount: 512, seed: 2026});
    const secondPopulation = makeCrossfilterDataset({rowCount: 512, seed: 2026});
    const alternatePopulation = makeCrossfilterDataset({rowCount: 512, seed: 2027});

    expect(firstPopulation).toEqual(secondPopulation);
    expect(firstPopulation.longitude).not.toEqual(alternatePopulation.longitude);
    expect(firstPopulation.rowCount).toBe(512);
    expect(firstPopulation.longitude).toHaveLength(512);
    expect(firstPopulation.latitude).toHaveLength(512);
    expect(firstPopulation.value).toHaveLength(512);
    expect(firstPopulation.risk).toHaveLength(512);
    expect(firstPopulation.hour).toHaveLength(512);
    expect(firstPopulation.category).toHaveLength(512);
  });

  test('keeps the shared prefix stable when the resident population grows', () => {
    const smallerPopulation = makeCrossfilterDataset({rowCount: 32, seed: 8128});
    const largerPopulation = makeCrossfilterDataset({rowCount: 128, seed: 8128});

    for (const column of ['longitude', 'latitude', 'value', 'risk', 'hour', 'category'] as const) {
      expect(largerPopulation[column].slice(0, 32)).toEqual(smallerPopulation[column]);
    }
  });

  test('keeps every source row inside declared histogram, map, and group domains', () => {
    const population = makeCrossfilterDataset({rowCount: 2048});
    const observedCategories = new Set<number>();

    for (let rowIndex = 0; rowIndex < population.rowCount; rowIndex++) {
      expect(population.longitude[rowIndex]).toBeGreaterThanOrEqual(CROSS_FILTER_MAP_DOMAIN.x[0]);
      expect(population.longitude[rowIndex]).toBeLessThanOrEqual(CROSS_FILTER_MAP_DOMAIN.x[1]);
      expect(population.latitude[rowIndex]).toBeGreaterThanOrEqual(CROSS_FILTER_MAP_DOMAIN.y[0]);
      expect(population.latitude[rowIndex]).toBeLessThanOrEqual(CROSS_FILTER_MAP_DOMAIN.y[1]);

      for (const dimension of ['value', 'risk', 'hour'] as const) {
        expect(population[dimension][rowIndex]).toBeGreaterThanOrEqual(
          CROSS_FILTER_DOMAINS[dimension][0]
        );
        expect(population[dimension][rowIndex]).toBeLessThanOrEqual(
          CROSS_FILTER_DOMAINS[dimension][1]
        );
      }

      const category = population.category[rowIndex]!;
      expect(category).toBeGreaterThanOrEqual(0);
      expect(category).toBeLessThan(CROSS_FILTER_CATEGORY_NAMES.length);
      observedCategories.add(category);
    }

    expect(observedCategories.size).toBe(CROSS_FILTER_CATEGORY_NAMES.length);
  });
});

describe('Million-Row Crossfilter Explorer linked-view coordinates', () => {
  test('reflects top-left-origin pointer bounds into upward-positive GPU domains', () => {
    expect(
      makeCrossfilterSelectionBounds(
        [0.1, 0.2, 0.7, 0.8],
        CROSS_FILTER_MAP_DOMAIN.x,
        CROSS_FILTER_MAP_DOMAIN.y
      )
    ).toEqual([-0.8, -0.6000000000000001, 0.3999999999999999, 0.6000000000000001]);

    expect(
      makeCrossfilterSelectionBounds(
        [0.8, 0.9, 0.2, 0.1],
        CROSS_FILTER_DOMAINS.value,
        CROSS_FILTER_DOMAINS.risk
      )
    ).toEqual([50, 0.09999999999999998, 200, 0.9]);
  });

  test('round-trips map and scatterplot selections through normalized brush overlays', () => {
    const sourceBounds = [40, 0.22, 190, 0.86] as const;
    const normalizedBounds = makeCrossfilterNormalizedBounds(
      sourceBounds,
      CROSS_FILTER_DOMAINS.value,
      CROSS_FILTER_DOMAINS.risk
    );
    const restoredBounds = makeCrossfilterSelectionBounds(
      normalizedBounds,
      CROSS_FILTER_DOMAINS.value,
      CROSS_FILTER_DOMAINS.risk
    );

    for (let coordinateIndex = 0; coordinateIndex < sourceBounds.length; coordinateIndex++) {
      expect(restoredBounds[coordinateIndex]).toBeCloseTo(sourceBounds[coordinateIndex], 12);
    }
  });

  test('ships meaningful multi-dimensional anomaly and regional presets', () => {
    const anomalyPreset = getCrossfilterPreset('anomaly');
    const pacificPreset = getCrossfilterPreset('pacific');
    const europePreset = getCrossfilterPreset('europe');

    expect(anomalyPreset.scatterBounds).toBeDefined();
    expect(anomalyPreset.ranges?.risk?.[0]).toBeGreaterThan(0.5);
    expect(anomalyPreset.ranges?.value?.[0]).toBeGreaterThan(100);
    expect(pacificPreset.mapBounds).toBeDefined();
    expect(pacificPreset.ranges?.value).toBeDefined();
    expect(europePreset.mapBounds).toBeDefined();
    expect(europePreset.ranges?.hour?.[0]).toBeGreaterThanOrEqual(17);
    expect(getCrossfilterPreset('all').ranges).toBeUndefined();
  });
});

describe('Million-Row Crossfilter Explorer visual smoke controls', () => {
  test.each([
    1, 127, 1_048_577
  ])('rejects unsupported resident row count %i before starting the browser', rowCount => {
    const smokeScriptPath = fileURLToPath(
      new URL(
        '../../examples/showcase/million-row-crossfilter/scripts/visual-smoke.mjs',
        import.meta.url
      )
    );
    const result = spawnSync(process.execPath, [smokeScriptPath], {
      encoding: 'utf8',
      env: {...process.env, CROSSFILTER_SMOKE_ROWS: String(rowCount)},
      timeout: 10_000
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('CROSSFILTER_SMOKE_ROWS must be between 128 and 1048576');
  });
});
